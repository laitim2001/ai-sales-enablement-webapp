/**
 * ================================================================
 * 檔案名稱: 知識庫文檔上傳API路由
 * 檔案用途: AI銷售賦能平台的文檔上傳和處理核心API
 * 開發階段: 生產環境就緒
 * ================================================================
 *
 * 功能索引:
 * 1. POST /api/knowledge-base/upload - 上傳文檔到知識庫（支援多種文件格式）
 * 2. GET /api/knowledge-base/upload - 獲取上傳配置和支援的文件類型
 *
 * API規格:
 * - 方法: POST, GET
 * - 路徑: /api/knowledge-base/upload
 * - 認證: JWT Token (Bearer Token或Cookie)
 * - 權限: 已認證用戶
 * - 請求格式: FormData (POST) / Query Params (GET)
 * - 回應格式: 標準化JSON格式
 *
 * 支援文件類型:
 * - 文本文件: .txt, .md, .html, .csv, .json
 * - 文檔文件: .pdf, .doc, .docx
 * - 大小限制: 10MB
 *
 * 業務特色:
 * - 多格式支援: 支援常見的文檔和文本格式
 * - 重複檢測: 使用SHA-256哈希防止重複文件
 * - 自動處理: 支援自動文檔解析和向量化
 * - 事務安全: 使用資料庫事務確保數據一致性
 * - 文件管理: 安全的文件存儲和清理機制
 * - 標籤系統: 支援文件上傳時自動標籤關聯
 * - 元數據保存: 完整記錄文件來源和處理信息
 *
 * 技術特色:
 * - FormData處理: 支援multipart/form-data格式
 * - 文件驗證: 嚴格的文件類型和大小驗證
 * - 安全存儲: 防止路徑遍歷和惡意文件
 * - 自動清理: 錯誤時自動清理已上傳文件
 * - 處理任務: 自動創建文檔處理和向量化任務
 * - 並行處理: 支援多種文檔處理任務並行執行
 *
 * 安全考量:
 * - 文件類型白名單驗證
 * - 文件大小限制防止DoS攻擊
 * - 安全的文件名處理，防止路徑注入
 * - 重複文件檢測，防止存儲浪費
 * - 用戶權限驗證確保操作安全
 *
 * 注意事項:
 * - 上傳需要用戶認證
 * - 文件會自動觸發解析和向量化處理
 * - 重複文件會被自動檢測並拒絕
 * - 支援的文件類型可通過GET請求查詢
 * - 文件上傳失敗時會自動清理臨時文件
 *
 * 更新記錄:
 * - Week 1: 基礎文件上傳功能
 * - Week 2: 文件類型驗證和安全處理
 * - Week 3: 自動處理任務創建
 * - Week 4: 錯誤處理和文件清理優化
 * - Week 5: 性能優化和用戶體驗改善
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { DocumentCategory, ProcessingStatus } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * ================================================================
 * 配置常量和驗證架構 - Configuration Constants & Validation Schemas
 * ================================================================
 */

// 文件上傳元數據驗證架構
const FileUploadSchema = z.object({
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.GENERAL),  // 文檔分類，預設通用
  tags: z.array(z.string()).optional(),                                       // 可選的標籤陣列
  author: z.string().optional(),                                              // 可選的作者信息
  language: z.string().default('zh-TW'),                                      // 文檔語言，預設繁體中文
  auto_process: z.boolean().default(true)                                     // 是否自動處理，預設啟用
})

// 支援的文件類型映射表（MIME類型 → 文件擴展名）
const SUPPORTED_MIME_TYPES = {
  'text/plain': 'txt',                                                        // 純文本文件
  'text/markdown': 'md',                                                      // Markdown文件
  'application/pdf': 'pdf',                                                   // PDF文檔
  'application/msword': 'doc',                                                // Word文檔（舊格式）
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',  // Word文檔（新格式）
  'text/html': 'html',                                                        // HTML文件
  'text/csv': 'csv',                                                          // CSV數據文件
  'application/json': 'json'                                                  // JSON數據文件
}

// 安全限制配置
const MAX_FILE_SIZE = 10 * 1024 * 1024                                       // 最大文件大小：10MB
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'knowledge-base')           // 文件上傳目錄

/**
 * ================================================================
 * POST /api/knowledge-base/upload - 上傳文件到知識庫
 * ================================================================
 *
 * 功能說明:
 * - 接收multipart/form-data格式的文件上傳
 * - 支援多種文檔格式（txt, md, pdf, doc, docx, html, csv, json）
 * - 自動文件驗證、重複檢測、安全存儲
 * - 創建知識庫項目並觸發處理任務
 * - 支援文件標籤和元數據管理
 *
 * 請求格式 (FormData):
 * - file: File                    // 上傳的文件（必填）
 * - metadata: JSON string         // 文件元數據（可選）
 *   {
 *     category?: DocumentCategory,  // 文檔分類
 *     tags?: string[],              // 標籤陣列
 *     author?: string,              // 作者信息
 *     language?: string,            // 文檔語言
 *     auto_process?: boolean        // 自動處理開關
 *   }
 *
 * 回應格式:
 * {
 *   success: true,
 *   data: {...},                  // 創建的知識庫項目
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    /**
     * ===== 第一步：用戶身份驗證 =====
     * 標準JWT Token驗證流程
     */

    // 從Authorization Header或Cookie提取JWT Token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // 驗證token並提取用戶信息
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    /**
     * ===== 第二步：解析FormData和文件驗證 =====
     */

    // 解析multipart/form-data請求
    const formData = await request.formData()
    const file = formData.get('file') as File                              // 上傳的文件
    const metadataJson = formData.get('metadata') as string                // 文件元數據JSON

    // 驗證文件是否存在
    if (!file) {
      throw AppError.validation('No file provided')
    }

    // 驗證文件大小（防止DoS攻擊）
    if (file.size > MAX_FILE_SIZE) {
      throw AppError.validation(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // 驗證文件類型（白名單驗證）
    const mimeType = file.type
    if (!Object.keys(SUPPORTED_MIME_TYPES).includes(mimeType)) {
      throw AppError.validation(
        `Unsupported file type: ${mimeType}. Supported types: ${Object.keys(SUPPORTED_MIME_TYPES).join(', ')}`
      )
    }

    // 解析和驗證元數據
    let metadata = {}
    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson)
      } catch (e) {
        throw AppError.validation('Invalid metadata JSON')
      }
    }

    const validatedMetadata = FileUploadSchema.parse(metadata)

    // 確保上傳目錄存在
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // 生成文件名
    const timestamp = Date.now()
    const fileExtension = SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES]
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(UPLOAD_DIR, fileName)

    try {
      // 保存文件
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      await writeFile(filePath, buffer)

      // 讀取文件內容（僅對文本文件）
      let content: string | null = null
      if (mimeType.startsWith('text/')) {
        content = buffer.toString('utf-8')
      }

      // 生成文件哈希
      const crypto = require('crypto')
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')

      // 檢查重複文件
      const existingFile = await prisma.knowledgeBase.findUnique({
        where: { hash }
      })

      if (existingFile) {
        // 刪除剛上傳的重複文件
        const fs = require('fs')
        fs.unlinkSync(filePath)

        throw AppError.validation('Duplicate file detected. A file with the same content already exists.')
      }

      // 開始事務創建知識庫項目
      const result = await prisma.$transaction(async (tx) => {
        // 創建知識庫項目
        const knowledgeBase = await tx.knowledgeBase.create({
          data: {
            title: file.name,
            content: content,
            file_path: filePath,
            file_size: file.size,
            mime_type: mimeType,
            hash: hash,
            category: validatedMetadata.category,
            author: validatedMetadata.author,
            language: validatedMetadata.language,
            source: 'upload',
            metadata: {
              original_filename: file.name,
              upload_timestamp: timestamp,
              user_agent: request.headers.get('user-agent')
            },
            created_by: payload.userId,
            updated_by: payload.userId,
            processing_status: validatedMetadata.auto_process ?
              ProcessingStatus.PENDING : ProcessingStatus.COMPLETED
          }
        })

        // 處理標籤
        if (validatedMetadata.tags && validatedMetadata.tags.length > 0) {
          const existingTags = await tx.knowledgeTag.findMany({
            where: { name: { in: validatedMetadata.tags } }
          })

          const existingTagNames = existingTags.map(tag => tag.name)
          const newTagNames = validatedMetadata.tags.filter(name => !existingTagNames.includes(name))

          // 創建新標籤
          const newTags = await Promise.all(
            newTagNames.map(name =>
              tx.knowledgeTag.create({
                data: { name, usage_count: 1 }
              })
            )
          )

          // 更新現有標籤的使用次數
          await Promise.all(
            existingTags.map(tag =>
              tx.knowledgeTag.update({
                where: { id: tag.id },
                data: { usage_count: { increment: 1 } }
              })
            )
          )

          // 關聯標籤
          const allTags = [...existingTags, ...newTags]
          await tx.knowledgeBase.update({
            where: { id: knowledgeBase.id },
            data: {
              tags: {
                connect: allTags.map(tag => ({ id: tag.id }))
              }
            }
          })
        }

        return knowledgeBase
      })

      // 如果需要自動處理，創建處理任務
      if (validatedMetadata.auto_process) {
        const taskTypes = ['DOCUMENT_PARSE']

        // 對於文本文件，直接進行向量化
        if (content) {
          taskTypes.push('VECTORIZATION')
        }

        // 創建處理任務
        await Promise.all(
          taskTypes.map(taskType =>
            prisma.processingTask.create({
              data: {
                knowledge_base_id: result.id,
                task_type: taskType as any,
                status: ProcessingStatus.PENDING,
                metadata: {
                  file_path: filePath,
                  mime_type: mimeType,
                  file_size: file.size,
                  user_id: payload.userId
                }
              }
            })
          )
        )
      }

      // 重新獲取完整數據
      const finalResult = await prisma.knowledgeBase.findUnique({
        where: { id: result.id },
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          },
          processing_tasks: {
            select: {
              id: true,
              task_type: true,
              status: true,
              created_at: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: finalResult,
        message: 'File uploaded successfully'
      }, { status: 201 })

    } catch (fileError) {
      // 如果數據庫操作失敗，清理已上傳的文件
      try {
        const fs = require('fs')
        if (existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup file after error:', cleanupError)
      }
      throw fileError
    }

  } catch (error) {
    console.error('POST /api/knowledge-base/upload error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid upload metadata', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'File upload failed' },
      { status: 500 }
    )
  }
}

// GET /api/knowledge-base/upload - 獲取上傳配置和支持的文件類型
export async function GET(request: NextRequest) {
  try {
    // 驗證用戶身份（可選，用於返回用戶特定的配置）
    // Extract token from request (optional for this endpoint)
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    let payload = null
    if (token) {
      try {
        payload = verifyToken(token)
      } catch {
        // Optional auth, continue without user context
      }
    }

    const config = {
      supported_mime_types: SUPPORTED_MIME_TYPES,
      max_file_size: MAX_FILE_SIZE,
      max_file_size_mb: MAX_FILE_SIZE / 1024 / 1024,
      supported_categories: Object.values(DocumentCategory),
      default_language: 'zh-TW',
      auto_processing: true
    }

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        supported_mime_types: SUPPORTED_MIME_TYPES,
        max_file_size: MAX_FILE_SIZE,
        max_file_size_mb: MAX_FILE_SIZE / 1024 / 1024,
        supported_categories: Object.values(DocumentCategory),
        default_language: 'zh-TW',
        auto_processing: true
      }
    })
  }
}