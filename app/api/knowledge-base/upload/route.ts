import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { DocumentCategory, ProcessingStatus } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 文件上傳驗證 schema
const FileUploadSchema = z.object({
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.GENERAL),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  language: z.string().default('zh-TW'),
  auto_process: z.boolean().default(true)
})

// 支持的文件類型
const SUPPORTED_MIME_TYPES = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/html': 'html',
  'text/csv': 'csv',
  'application/json': 'json'
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'knowledge-base')

// POST /api/knowledge-base/upload - 上傳文件到知識庫
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶身份
    // Extract token from request
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // Verify the token
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 解析 FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataJson = formData.get('metadata') as string

    if (!file) {
      throw AppError.validation('No file provided')
    }

    // 驗證文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw AppError.validation(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // 驗證文件類型
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