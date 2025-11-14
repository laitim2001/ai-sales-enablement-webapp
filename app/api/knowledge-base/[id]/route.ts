/**
 * @fileoverview AI銷售賦能平台知識庫單項API路由 - 實現單個知識庫項目的詳情、更新和刪除功能
 * @module app/api/knowledge-base/[id]/route
 *
 * ## 功能說明
 * 提供單個知識庫項目的完整管理功能,包含詳情查詢、內容更新、標籤管理、
 * 版本控制和軟/硬刪除等操作。
 *
 * ## API規格
 * - **端點**: `GET /api/knowledge-base/[id]` - 獲取項目詳情
 *   - 響應: { success, data: {...} } (包含creator, updater, tags, chunks, processing_tasks)
 * - **端點**: `PUT /api/knowledge-base/[id]` - 更新項目
 *   - 請求: { title?, content?, category?, source?, author?, language?, metadata?, tags?, status? }
 *   - 響應: { success, data: {...}, message }
 * - **端點**: `DELETE /api/knowledge-base/[id]` - 刪除項目
 *   - 查詢參數: hard=true (可選,硬刪除)
 *   - 響應: { success, message }
 * - **狀態碼**: 200 (成功) | 400 (驗證錯誤) | 401 (未認證) | 404 (未找到) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 詳情查詢 - 包含完整的關聯數據(creator, tags, chunks, tasks)
 * - 智能更新 - 內容變更時自動觸發重新向量化
 * - 版本控制 - 每次更新自動增加版本號
 * - 標籤管理 - 動態更新標籤關聯和使用次數
 * - 軟/硬刪除 - 支援軟刪除(標記)和硬刪除(移除)兩種模式
 * - 事務安全 - 所有更新操作使用數據庫事務
 *
 * ## 相關文件
 * - `/lib/db.ts` - Prisma數據庫連接
 * - `/lib/auth-server.ts` - JWT令牌驗證
 * - `/lib/errors.ts` - 應用錯誤處理
 * - `@prisma/client` - DocumentCategory, DocumentStatus, ProcessingStatus枚舉
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { DocumentCategory, DocumentStatus, ProcessingStatus } from '@prisma/client'

/**
 * ================================================================
 * 資料驗證架構 - Data Validation Schemas
 * ================================================================
 */

// 更新知識庫項目的請求驗證架構（所有欄位都是可選的）
const UpdateKnowledgeBaseSchema = z.object({
  title: z.string().min(1).max(255).optional(),                          // 可選的標題更新
  content: z.string().optional(),                                        // 可選的內容更新
  category: z.nativeEnum(DocumentCategory).optional(),                   // 可選的分類更新
  source: z.string().optional(),                                         // 可選的來源更新
  author: z.string().optional(),                                         // 可選的作者更新
  language: z.string().optional(),                                       // 可選的語言更新
  metadata: z.record(z.any()).optional(),                                // 可選的元數據更新
  tags: z.array(z.string()).optional(),                                  // 可選的標籤更新
  status: z.nativeEnum(DocumentStatus).optional(),                       // 可選的狀態更新
  processing_status: z.nativeEnum(ProcessingStatus).optional()           // 可選的處理狀態更新
})

/**
 * ================================================================
 * GET /api/knowledge-base/[id] - 獲取單個知識庫項目詳情
 * ================================================================
 *
 * 功能說明:
 * - 查詢指定ID的知識庫項目完整信息
 * - 包含創建者、更新者、標籤、分塊、處理任務等關聯數據
 * - 提供分塊統計和處理狀態信息
 * - 支援詳細的項目元數據查詢
 *
 * 路徑參數:
 * - id: number - 知識庫項目ID
 *
 * 回應格式:
 * {
 *   success: true,
 *   data: {
 *     id, title, content, category, status, ...
 *     creator: { id, first_name, last_name, email },
 *     updater: { id, first_name, last_name, email },
 *     tags: [{ id, name, color, description }],
 *     chunks: [{ id, chunk_index, content, ... }],
 *     processing_tasks: [{ id, task_type, status, ... }],
 *     _count: { chunks: number }
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      throw AppError.validation('Invalid knowledge base ID')
    }

    // 獲取知識庫項目詳情
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        updater: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        tags: {
          select: { id: true, name: true, color: true, description: true }
        },
        chunks: {
          select: {
            id: true,
            chunk_index: true,
            content: true,
            token_count: true,
            start_pos: true,
            end_pos: true,
            metadata: true
          },
          orderBy: { chunk_index: 'asc' }
        },
        processing_tasks: {
          select: {
            id: true,
            task_type: true,
            status: true,
            progress: true,
            error_message: true,
            started_at: true,
            completed_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 10
        },
        _count: {
          select: { chunks: true }
        }
      }
    })

    if (!knowledgeBase) {
      throw AppError.notFound('Knowledge base item not found')
    }

    return NextResponse.json({
      success: true,
      data: knowledgeBase
    })

  } catch (error) {
    console.error(`GET /api/knowledge-base/${params.id} error:`, error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/knowledge-base/[id] - 更新知識庫項目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      throw AppError.validation('Invalid knowledge base ID')
    }

    // 解析請求數據
    const body = await request.json()
    const validatedData = UpdateKnowledgeBaseSchema.parse(body)

    // 檢查項目是否存在
    const existingItem = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: { tags: { select: { id: true, name: true } } }
    })

    if (!existingItem) {
      throw AppError.notFound('Knowledge base item not found')
    }

    const { tags, ...updateData } = validatedData

    // 如果內容發生變化，生成新的哈希
    let contentHash = existingItem.hash
    if (updateData.content && updateData.content !== existingItem.content) {
      contentHash = require('crypto').createHash('sha256').update(updateData.content).digest('hex')

      // 檢查重複內容
      const existing = await prisma.knowledgeBase.findFirst({
        where: {
          hash: contentHash,
          id: { not: id }
        }
      })

      if (existing) {
        throw AppError.validation('Duplicate content detected')
      }

      // 如果內容變化，需要重新處理
      updateData.processing_status = ProcessingStatus.PENDING
    }

    // 開始事務更新
    const result = await prisma.$transaction(async (tx) => {
      // 更新知識庫項目
      const updatedKnowledgeBase = await tx.knowledgeBase.update({
        where: { id },
        data: {
          ...updateData,
          hash: contentHash,
          updated_by: payload.userId,
          version: { increment: 1 }
        }
      })

      // 處理標籤更新
      if (tags !== undefined) {
        // 移除現有標籤關聯
        await tx.knowledgeBase.update({
          where: { id },
          data: {
            tags: {
              disconnect: existingItem.tags.map(tag => ({ id: tag.id }))
            }
          }
        })

        // 減少舊標籤的使用次數
        await Promise.all(
          existingItem.tags.map(tag =>
            tx.knowledgeTag.update({
              where: { id: tag.id },
              data: { usage_count: { decrement: 1 } }
            })
          )
        )

        // 處理新標籤
        if (tags.length > 0) {
          const existingTags = await tx.knowledgeTag.findMany({
            where: { name: { in: tags } }
          })

          const existingTagNames = existingTags.map(tag => tag.name)
          const newTagNames = tags.filter(name => !existingTagNames.includes(name))

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

          // 關聯新標籤
          const allTags = [...existingTags, ...newTags]
          await tx.knowledgeBase.update({
            where: { id },
            data: {
              tags: {
                connect: allTags.map(tag => ({ id: tag.id }))
              }
            }
          })
        }
      }

      // 如果內容發生變化，創建新的處理任務
      if (updateData.content && updateData.processing_status === ProcessingStatus.PENDING) {
        // 刪除舊的分塊數據
        await tx.knowledgeChunk.deleteMany({
          where: { knowledge_base_id: id }
        })

        // 創建新的處理任務
        await tx.processingTask.create({
          data: {
            knowledge_base_id: id,
            task_type: 'VECTORIZATION',
            status: ProcessingStatus.PENDING,
            metadata: {
              content_length: updateData.content.length,
              user_id: payload.userId,
              is_update: true
            }
          }
        })
      }

      return updatedKnowledgeBase
    })

    // 重新獲取完整數據
    const finalResult = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        updater: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        tags: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: finalResult,
      message: 'Knowledge base item updated successfully'
    })

  } catch (error) {
    console.error(`PUT /api/knowledge-base/${params.id} error:`, error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge-base/[id] - 刪除知識庫項目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      throw AppError.validation('Invalid knowledge base ID')
    }

    // 檢查項目是否存在
    const existingItem = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        tags: { select: { id: true } },
        _count: { select: { chunks: true } }
      }
    })

    if (!existingItem) {
      throw AppError.notFound('Knowledge base item not found')
    }

    // 軟刪除或硬刪除取決於查詢參數
    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'

    await prisma.$transaction(async (tx) => {
      if (hardDelete) {
        // 硬刪除 - 完全移除數據

        // 刪除相關的處理任務
        await tx.processingTask.deleteMany({
          where: { knowledge_base_id: id }
        })

        // 刪除分塊數據
        await tx.knowledgeChunk.deleteMany({
          where: { knowledge_base_id: id }
        })

        // 減少標籤使用次數
        await Promise.all(
          existingItem.tags.map(tag =>
            tx.knowledgeTag.update({
              where: { id: tag.id },
              data: { usage_count: { decrement: 1 } }
            })
          )
        )

        // 刪除知識庫項目
        await tx.knowledgeBase.delete({
          where: { id }
        })
      } else {
        // 軟刪除 - 標記為已刪除
        await tx.knowledgeBase.update({
          where: { id },
          data: {
            status: DocumentStatus.DELETED,
            updated_by: payload.userId
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: hardDelete ?
        'Knowledge base item permanently deleted' :
        'Knowledge base item moved to trash'
    })

  } catch (error) {
    console.error(`DELETE /api/knowledge-base/${params.id} error:`, error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}