/**
 * ================================================================
 * 檔案名稱: 知識庫單個項目操作API路由
 * 檔案用途: AI銷售賦能平台的知識庫項目CRUD操作API
 * 開發階段: 生產環境就緒
 * ================================================================
 *
 * 功能索引:
 * 1. GET /api/knowledge-base/[id] - 獲取單個知識庫項目詳情
 * 2. PUT /api/knowledge-base/[id] - 更新知識庫項目
 * 3. DELETE /api/knowledge-base/[id] - 刪除知識庫項目（軟刪除/硬刪除）
 *
 * API規格:
 * - 方法: GET, PUT, DELETE
 * - 路徑: /api/knowledge-base/[id]
 * - 認證: JWT Token (Bearer Token或Cookie)
 * - 權限: 已認證用戶
 * - 參數: id (路徑參數，知識庫項目ID)
 * - 回應: 標準化JSON格式
 *
 * 業務特色:
 * - 詳細信息查詢: 包含分塊、處理任務、標籤等完整信息
 * - 智能更新: 內容變更時自動觸發重新處理
 * - 版本控制: 每次更新自動增加版本號
 * - 標籤管理: 動態標籤關聯和使用次數統計
 * - 軟刪除支援: 預設軟刪除，可選硬刪除
 * - 事務安全: 使用資料庫事務確保操作原子性
 * - 重複檢測: 更新時檢測內容重複
 *
 * 技術特色:
 * - 動態include: 根據需要載入關聯數據
 * - 差異檢測: 智能檢測內容變更
 * - 並行操作: 標籤更新並行處理
 * - 自動清理: 刪除時清理相關數據
 * - 錯誤恢復: 操作失敗時自動回滾
 *
 * 安全考量:
 * - ID驗證: 嚴格的數字ID格式驗證
 * - 權限檢查: 確保用戶有操作權限
 * - 數據完整性: 事務保證數據一致性
 * - 軟刪除優先: 預設使用軟刪除保護數據
 *
 * 注意事項:
 * - 所有操作都需要用戶認證
 * - 內容更新會觸發重新向量化
 * - 刪除操作支援軟刪除和硬刪除
 * - 標籤更新會維護使用次數統計
 *
 * 更新記錄:
 * - Week 1: 基礎CRUD操作
 * - Week 2: 標籤系統整合
 * - Week 3: 版本控制和處理任務
 * - Week 4: 軟刪除和安全增強
 * - Week 5: 性能優化和錯誤處理完善
 * ================================================================
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