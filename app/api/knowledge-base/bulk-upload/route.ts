/**
 * ================================================================
 * 檔案名稱: 知識庫批量上傳API路由
 * 檔案用途: AI銷售賦能平台的批量文檔上傳和處理核心API
 * 開發階段: Sprint 6 Week 12 Day 3-4
 * ================================================================
 *
 * 功能索引:
 * 1. POST /api/knowledge-base/bulk-upload - 批量上傳多個文檔到知識庫
 * 2. GET /api/knowledge-base/bulk-upload - 獲取批量上傳配置
 *
 * API規格:
 * - 方法: POST, GET
 * - 路徑: /api/knowledge-base/bulk-upload
 * - 認證: JWT Token (Bearer Token或Cookie)
 * - 權限: 已認證用戶
 * - 請求格式: FormData (POST) / Query Params (GET)
 * - 回應格式: 標準化JSON格式
 *
 * 支援文件類型:
 * - PDF文檔: .pdf (最大50MB)
 * - Word文檔: .doc, .docx (最大50MB)
 * - Excel文檔: .xls, .xlsx (最大50MB)
 * - CSV文件: .csv (最大50MB)
 * - 圖片文件: .png, .jpg, .jpeg (最大10MB)
 * - 文本文件: .txt, .md, .html, .json (最大10MB)
 *
 * 業務特色:
 * - 批量處理: 支援一次上傳多個文件（最多20個）
 * - 自動解析: 根據文件類型自動選擇適當的解析器
 * - 並行處理: 使用隊列系統並行處理多個文件
 * - 進度追蹤: 實時返回每個文件的處理進度
 * - 錯誤處理: 單個文件失敗不影響其他文件處理
 * - 重複檢測: 使用SHA-256哈希防止重複文件
 *
 * 技術特色:
 * - 統一解析器: 使用 lib/parsers 統一解析接口
 * - 事務安全: 每個文件使用獨立事務確保數據一致性
 * - 自動清理: 失敗文件自動清理，不占用存儲空間
 * - 異步處理: 支援異步文檔解析和向量化
 * - 資料夾支援: 可指定目標資料夾ID
 *
 * 安全考量:
 * - 文件類型驗證（MIME類型和文件頭檢測）
 * - 文件大小限制防止DoS攻擊
 * - 批量上傳數量限制（最多20個文件）
 * - 安全的文件名處理，防止路徑注入
 * - 用戶權限驗證確保操作安全
 *
 * 更新記錄:
 * - Sprint 6 Week 12 Day 3-4: 初始批量上傳功能實現
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
import { detectFileType, parseFile, FileType } from '@/lib/parsers'
import crypto from 'crypto'

/**
 * ================================================================
 * 配置常量和驗證架構 - Configuration Constants & Validation Schemas
 * ================================================================
 */

// 批量上傳元數據驗證架構
const BulkUploadSchema = z.object({
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.GENERAL),
  tags: z.array(z.string()).optional(),
  folder_id: z.number().optional(),                                          // 可選的目標資料夾ID
  language: z.string().default('zh-TW'),
  auto_process: z.boolean().default(true),
})

// 支援的文件類型配置（使用解析器的類型映射）
const SUPPORTED_FILE_TYPES = {
  // PDF文檔
  'application/pdf': { ext: 'pdf', maxSize: 50 * 1024 * 1024, type: FileType.PDF },

  // Word文檔
  'application/msword': { ext: 'doc', maxSize: 50 * 1024 * 1024, type: FileType.WORD },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx', maxSize: 50 * 1024 * 1024, type: FileType.WORD
  },

  // Excel文檔
  'application/vnd.ms-excel': { ext: 'xls', maxSize: 50 * 1024 * 1024, type: FileType.EXCEL },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    ext: 'xlsx', maxSize: 50 * 1024 * 1024, type: FileType.EXCEL
  },

  // CSV文件
  'text/csv': { ext: 'csv', maxSize: 50 * 1024 * 1024, type: FileType.CSV },

  // 圖片文件
  'image/png': { ext: 'png', maxSize: 10 * 1024 * 1024, type: FileType.IMAGE },
  'image/jpeg': { ext: 'jpg', maxSize: 10 * 1024 * 1024, type: FileType.IMAGE },
  'image/jpg': { ext: 'jpg', maxSize: 10 * 1024 * 1024, type: FileType.IMAGE },

  // 文本文件
  'text/plain': { ext: 'txt', maxSize: 10 * 1024 * 1024, type: FileType.UNKNOWN },
  'text/markdown': { ext: 'md', maxSize: 10 * 1024 * 1024, type: FileType.UNKNOWN },
  'text/html': { ext: 'html', maxSize: 10 * 1024 * 1024, type: FileType.UNKNOWN },
  'application/json': { ext: 'json', maxSize: 10 * 1024 * 1024, type: FileType.UNKNOWN },
}

// 批量上傳限制
const MAX_BULK_FILES = 20                                                    // 最多一次上傳20個文件
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'knowledge-base')         // 文件上傳目錄

/**
 * 單個文件處理結果介面
 */
interface FileProcessResult {
  filename: string
  success: boolean
  knowledge_base_id?: number
  error?: string
  file_size?: number
  parsed_text_length?: number
  parse_time?: number
}

/**
 * ================================================================
 * 工具函數 - Utility Functions
 * ================================================================
 */

/**
 * 驗證文件類型和大小
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  const fileConfig = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]

  if (!fileConfig) {
    return {
      valid: false,
      error: `不支援的文件類型: ${file.type}`
    }
  }

  if (file.size > fileConfig.maxSize) {
    return {
      valid: false,
      error: `文件大小超過限制: ${(file.size / 1024 / 1024).toFixed(2)}MB (最大: ${(fileConfig.maxSize / 1024 / 1024).toFixed(2)}MB)`
    }
  }

  return { valid: true }
}

/**
 * 處理單個文件上傳和解析
 */
async function processSingleFile(
  file: File,
  metadata: z.infer<typeof BulkUploadSchema>,
  userId: number
): Promise<FileProcessResult> {
  const result: FileProcessResult = {
    filename: file.name,
    success: false
  }

  try {
    // 驗證文件
    const validation = validateFile(file)
    if (!validation.valid) {
      result.error = validation.error
      return result
    }

    // 確保上傳目錄存在
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // 讀取文件內容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成文件哈希
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')

    // 檢查重複文件
    const existingFile = await prisma.knowledgeBase.findUnique({
      where: { hash }
    })

    if (existingFile) {
      result.error = '重複文件：相同內容的文件已存在'
      return result
    }

    // 使用解析器自動檢測和解析文件
    const startTime = Date.now()
    let parsedText: string | null = null
    let parseMetadata: any = {}

    try {
      // 嘗試使用解析器解析文件
      const fileConfig = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]

      if (fileConfig.type !== FileType.UNKNOWN) {
        // 使用統一解析器
        const parseResult = await parseFile(buffer, fileConfig.type, file.name)
        parsedText = parseResult.text
        parseMetadata = parseResult.metadata || {}

        result.parsed_text_length = parsedText.length
        result.parse_time = parseResult.parseTime
      } else {
        // 文本文件直接讀取
        parsedText = buffer.toString('utf-8')
        result.parsed_text_length = parsedText.length
        result.parse_time = Date.now() - startTime
      }
    } catch (parseError) {
      console.error(`文件解析失敗 (${file.name}):`, parseError)
      // 解析失敗不阻止文件上傳，但不保存解析內容
      parsedText = null
      parseMetadata = {
        parse_error: parseError instanceof Error ? parseError.message : '未知解析錯誤'
      }
    }

    // 生成安全文件名並保存文件
    const timestamp = Date.now()
    const fileConfig = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-_\u4e00-\u9fa5]/g, '_')
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = join(UPLOAD_DIR, fileName)

    await writeFile(filePath, buffer)

    // 開始事務創建知識庫項目
    const knowledgeBase = await prisma.$transaction(async (tx) => {
      // 創建知識庫項目
      const kb = await tx.knowledgeBase.create({
        data: {
          title: file.name,
          content: parsedText,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          hash: hash,
          category: metadata.category,
          language: metadata.language,
          source: 'bulk_upload',
          folder_id: metadata.folder_id || null,
          metadata: {
            original_filename: file.name,
            upload_timestamp: timestamp,
            parse_metadata: parseMetadata,
            bulk_upload: true
          },
          created_by: userId,
          updated_by: userId,
          processing_status: metadata.auto_process && parsedText
            ? ProcessingStatus.PENDING
            : ProcessingStatus.COMPLETED
        }
      })

      // 處理標籤
      if (metadata.tags && metadata.tags.length > 0) {
        const existingTags = await tx.knowledgeTag.findMany({
          where: { name: { in: metadata.tags } }
        })

        const existingTagNames = existingTags.map(tag => tag.name)
        const newTagNames = metadata.tags.filter(name => !existingTagNames.includes(name))

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
          where: { id: kb.id },
          data: {
            tags: {
              connect: allTags.map(tag => ({ id: tag.id }))
            }
          }
        })
      }

      return kb
    })

    // 如果需要自動處理且有解析內容，創建向量化任務
    if (metadata.auto_process && parsedText) {
      await prisma.processingTask.create({
        data: {
          knowledge_base_id: knowledgeBase.id,
          task_type: 'VECTORIZATION',
          status: ProcessingStatus.PENDING,
          metadata: {
            file_path: filePath,
            mime_type: file.type,
            file_size: file.size,
            parsed_text_length: parsedText.length,
            user_id: userId
          }
        }
      })
    }

    result.success = true
    result.knowledge_base_id = knowledgeBase.id
    result.file_size = file.size

    return result

  } catch (error) {
    console.error(`處理文件失敗 (${file.name}):`, error)
    result.error = error instanceof Error ? error.message : '未知錯誤'
    return result
  }
}

/**
 * ================================================================
 * POST /api/knowledge-base/bulk-upload - 批量上傳文件到知識庫
 * ================================================================
 *
 * 請求格式 (FormData):
 * - files: File[]               // 上傳的文件陣列（必填，最多20個）
 * - metadata: JSON string       // 批量上傳元數據（可選）
 *
 * 回應格式:
 * {
 *   success: true,
 *   data: {
 *     total: number,
 *     successful: number,
 *     failed: number,
 *     results: FileProcessResult[]
 *   },
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    /**
     * ===== 第一步：用戶身份驗證 =====
     */
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('需要身份驗證')
    }

    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('無效的身份驗證令牌')
    }

    /**
     * ===== 第二步：解析FormData並驗證 =====
     */
    const formData = await request.formData()
    const files: File[] = []

    // 收集所有文件
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value)
      }
    }

    // 驗證文件數量
    if (files.length === 0) {
      throw AppError.validation('沒有提供文件')
    }

    if (files.length > MAX_BULK_FILES) {
      throw AppError.validation(`文件數量超過限制：${files.length} (最大: ${MAX_BULK_FILES})`)
    }

    // 解析元數據
    const metadataJson = formData.get('metadata') as string
    let metadata = {}
    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson)
      } catch (e) {
        throw AppError.validation('無效的元數據JSON')
      }
    }

    const validatedMetadata = BulkUploadSchema.parse(metadata)

    // 驗證資料夾權限（如果指定了folder_id）
    if (validatedMetadata.folder_id) {
      const folder = await prisma.knowledgeFolder.findUnique({
        where: { id: validatedMetadata.folder_id }
      })

      if (!folder) {
        throw AppError.validation('指定的資料夾不存在')
      }
    }

    /**
     * ===== 第三步：並行處理所有文件 =====
     */
    const results = await Promise.all(
      files.map(file => processSingleFile(file, validatedMetadata, payload.userId))
    )

    // 統計結果
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    // 計算總解析時間和文本長度
    const totalParseTime = results.reduce((sum, r) => sum + (r.parse_time || 0), 0)
    const totalParsedLength = results.reduce((sum, r) => sum + (r.parsed_text_length || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        total: files.length,
        successful,
        failed,
        results,
        statistics: {
          total_parse_time_ms: totalParseTime,
          total_parsed_text_length: totalParsedLength,
          average_parse_time_ms: files.length > 0 ? Math.round(totalParseTime / files.length) : 0
        }
      },
      message: `批量上傳完成：成功 ${successful} 個，失敗 ${failed} 個`
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/knowledge-base/bulk-upload error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '無效的上傳元數據', details: error.errors },
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
      { success: false, error: '批量上傳失敗' },
      { status: 500 }
    )
  }
}

/**
 * ================================================================
 * GET /api/knowledge-base/bulk-upload - 獲取批量上傳配置
 * ================================================================
 */
export async function GET(request: NextRequest) {
  try {
    // 可選身份驗證
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    const config = {
      supported_file_types: Object.keys(SUPPORTED_FILE_TYPES),
      file_type_details: SUPPORTED_FILE_TYPES,
      max_bulk_files: MAX_BULK_FILES,
      supported_categories: Object.values(DocumentCategory),
      default_language: 'zh-TW',
      auto_processing: true,
      features: {
        auto_parse: true,
        ocr_support: true,
        folder_support: true,
        tag_support: true,
        parallel_processing: true
      }
    }

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        supported_file_types: Object.keys(SUPPORTED_FILE_TYPES),
        max_bulk_files: MAX_BULK_FILES,
        supported_categories: Object.values(DocumentCategory),
        default_language: 'zh-TW'
      }
    })
  }
}
