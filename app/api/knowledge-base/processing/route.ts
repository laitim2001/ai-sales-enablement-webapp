/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫處理任務API (app/api/knowledge-base/processing/route.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供知識庫處理任務管理的RESTful API端點，負責處理文檔向量化、
 * 內容分析、索引建立等後台處理任務的創建、查詢和狀態更新
 *
 * 【主要職責】
 * • 處理任務查詢 - 獲取處理任務列表，支援分頁、篩選和統計
 * • 任務創建管理 - 手動觸發處理任務，支援優先級設定
 * • 狀態更新追蹤 - 更新任務處理進度和狀態變更
 * • 任務調度支援 - 為後台處理系統提供任務隊列管理
 * • 統計資訊提供 - 24小時內任務執行統計和狀態分佈
 *
 * 【API規格】
 * • GET /api/knowledge-base/processing - 獲取處理任務列表
 *   參數: status, task_type, knowledge_base_id, limit, offset
 *   回應: { success, data[], pagination, stats }
 * • POST /api/knowledge-base/processing - 手動觸發處理任務
 *   參數: { knowledge_base_id, task_type, priority, metadata }
 *   回應: { success, data, message }
 * • PUT /api/knowledge-base/processing/[id] - 更新任務狀態
 *   參數: { status, progress, processed_items, error_message }
 *   回應: { success, data, message }
 *
 * 【使用場景】
 * • 後台文檔處理 - 向量化、分析、索引建立
 * • 任務狀態監控 - 管理介面查看處理進度
 * • 錯誤處理追蹤 - 失敗任務的錯誤信息記錄
 * • 手動重試機制 - 支援管理員手動觸發處理
 * • 系統性能監控 - 處理任務統計和性能分析
 *
 * 【相關檔案】
 * • lib/auth-server.ts - 用戶身份驗證
 * • lib/errors.ts - 錯誤處理和分類
 * • lib/db.ts - 數據庫連接和查詢
 * • @prisma/client - ProcessingStatus, ProcessingType 枚舉
 *
 * 【開發注意】
 * • 支援多種處理類型：VECTORIZATION, ANALYSIS, INDEXING
 * • 任務狀態包含：PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
 * • 實現事務性狀態更新，確保知識庫項目狀態同步
 * • 提供24小時統計避免性能問題
 * • 支援任務優先級和自定義元數據
 * • 防止重複任務創建的驗證機制
 */

import { NextRequest, NextResponse } from 'next/server'    // Next.js請求和回應處理
import { z } from 'zod'                                   // 資料驗證架構
import { prisma } from '@/lib/db'                         // 數據庫連接實例
import { AppError } from '@/lib/errors'                   // 應用錯誤處理
import { verifyToken } from '@/lib/auth-server'           // JWT令牌驗證
import { ProcessingStatus, ProcessingType } from '@prisma/client'  // 處理狀態和類型枚舉

/**
 * 處理任務查詢參數驗證架構
 * 用於GET請求的查詢參數驗證和格式化
 */
const ProcessingTaskQuerySchema = z.object({
  status: z.nativeEnum(ProcessingStatus).optional(),               // 任務狀態篩選
  task_type: z.nativeEnum(ProcessingType).optional(),             // 處理類型篩選
  knowledge_base_id: z.string().transform(val => parseInt(val, 10)).optional(),  // 知識庫ID篩選
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),           // 分頁限制（預設20）
  offset: z.string().transform(val => parseInt(val, 10)).default('0')            // 分頁偏移（預設0）
})

/**
 * 手動觸發處理任務驗證架構
 * 用於POST請求創建新處理任務的參數驗證
 */
const TriggerProcessingSchema = z.object({
  knowledge_base_id: z.number().int().positive(),                 // 目標知識庫項目ID
  task_type: z.nativeEnum(ProcessingType),                       // 處理任務類型
  priority: z.number().int().min(1).max(10).default(5),          // 任務優先級（1-10，預設5）
  metadata: z.record(z.any()).optional()                         // 自定義元數據
})

/**
 * GET /api/knowledge-base/processing - 獲取處理任務列表
 *
 * 提供分頁式的處理任務查詢功能，支援多種篩選條件和統計資訊
 * 返回任務詳細信息、分頁資訊和24小時統計數據
 */
export async function GET(request: NextRequest) {
  try {
    // 從請求中提取並驗證用戶身份令牌
    // 支援Authorization header和cookie兩種方式
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // 驗證JWT令牌並獲取用戶資訊
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 解析並驗證URL查詢參數
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const validatedParams = ProcessingTaskQuerySchema.parse(params)

    const { status, task_type, knowledge_base_id, limit, offset } = validatedParams

    // 根據篩選條件構建資料庫查詢條件
    const where: any = {}

    if (status) {
      where.status = status                          // 按任務狀態篩選
    }

    if (task_type) {
      where.task_type = task_type                    // 按處理類型篩選
    }

    if (knowledge_base_id) {
      where.knowledge_base_id = knowledge_base_id    // 按知識庫項目篩選
    }

    // 並行執行任務列表查詢和總數統計，提升性能
    const [tasks, totalCount] = await Promise.all([
      prisma.processingTask.findMany({
        where,
        include: {
          knowledge_base: {
            select: {
              id: true,
              title: true,
              category: true,
              file_path: true,
              mime_type: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // 進行中的任務在前
          { created_at: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.processingTask.count({ where })
    ])

    // 計算統計信息
    const stats = await prisma.processingTask.groupBy({
      by: ['status'],
      _count: true,
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 過去24小時
        }
      }
    })

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      },
      stats: {
        last_24h: statusStats,
        total_pending: statusStats[ProcessingStatus.PENDING] || 0,
        total_processing: statusStats[ProcessingStatus.PROCESSING] || 0,
        total_completed: statusStats[ProcessingStatus.COMPLETED] || 0,
        total_failed: statusStats[ProcessingStatus.FAILED] || 0
      }
    })

  } catch (error) {
    console.error('GET /api/knowledge-base/processing error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
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
      { success: false, error: 'Failed to fetch processing tasks' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge-base/processing - 手動觸發處理任務
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

    // 解析請求數據
    const body = await request.json()
    const validatedData = TriggerProcessingSchema.parse(body)

    // 檢查知識庫項目是否存在
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: validatedData.knowledge_base_id },
      select: {
        id: true,
        title: true,
        content: true,
        file_path: true,
        mime_type: true,
        processing_status: true
      }
    })

    if (!knowledgeBase) {
      throw AppError.notFound('Knowledge base item not found')
    }

    // 檢查是否已有相同類型的處理任務在進行
    const existingTask = await prisma.processingTask.findFirst({
      where: {
        knowledge_base_id: validatedData.knowledge_base_id,
        task_type: validatedData.task_type,
        status: {
          in: [ProcessingStatus.PENDING, ProcessingStatus.PROCESSING]
        }
      }
    })

    if (existingTask) {
      throw AppError.validation(
        `A ${validatedData.task_type} task is already in progress for this knowledge base item`
      )
    }

    // 創建處理任務
    const task = await prisma.processingTask.create({
      data: {
        knowledge_base_id: validatedData.knowledge_base_id,
        task_type: validatedData.task_type,
        status: ProcessingStatus.PENDING,
        metadata: {
          ...validatedData.metadata,
          triggered_by: payload.userId,
          priority: validatedData.priority,
          manual_trigger: true
        }
      },
      include: {
        knowledge_base: {
          select: {
            id: true,
            title: true,
            category: true,
            file_path: true,
            mime_type: true
          }
        }
      }
    })

    // 更新知識庫項目的處理狀態
    await prisma.knowledgeBase.update({
      where: { id: validatedData.knowledge_base_id },
      data: { processing_status: ProcessingStatus.PENDING }
    })

    return NextResponse.json({
      success: true,
      data: task,
      message: `${validatedData.task_type} task queued successfully`
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/knowledge-base/processing error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid processing request', details: error.errors },
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
      { success: false, error: 'Failed to create processing task' },
      { status: 500 }
    )
  }
}

// PUT /api/knowledge-base/processing/[id] - 更新處理任務狀態
export async function PUT(request: NextRequest) {
  try {
    // 從 URL 中提取任務 ID
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const idIndex = pathSegments.findIndex(segment => segment === 'processing') + 1

    if (idIndex >= pathSegments.length) {
      throw AppError.validation('Processing task ID is required')
    }

    const id = parseInt(pathSegments[idIndex], 10)
    if (isNaN(id)) {
      throw AppError.validation('Invalid processing task ID')
    }

    // 驗證用戶身份（這裡可能需要特殊權限檢查）
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

    // 解析請求數據
    const body = await request.json()
    const updateSchema = z.object({
      status: z.nativeEnum(ProcessingStatus).optional(),
      progress: z.number().min(0).max(1).optional(),
      processed_items: z.number().int().min(0).optional(),
      total_items: z.number().int().min(0).optional(),
      error_message: z.string().optional(),
      error_details: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional()
    })

    const validatedData = updateSchema.parse(body)

    // 檢查任務是否存在
    const existingTask = await prisma.processingTask.findUnique({
      where: { id },
      include: {
        knowledge_base: {
          select: { id: true, processing_status: true }
        }
      }
    })

    if (!existingTask) {
      throw AppError.notFound('Processing task not found')
    }

    // 準備更新數據
    const updateData: any = { ...validatedData }

    // 根據狀態變化設置時間戳
    if (validatedData.status) {
      if (validatedData.status === ProcessingStatus.PROCESSING && !existingTask.started_at) {
        updateData.started_at = new Date()
      }

      const finalStatuses = [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED, ProcessingStatus.CANCELLED] as const
      if (validatedData.status && finalStatuses.includes(validatedData.status as any) && !existingTask.completed_at) {
        updateData.completed_at = new Date()
      }
    }

    // 更新任務
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.processingTask.update({
        where: { id },
        data: updateData,
        include: {
          knowledge_base: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        }
      })

      // 如果任務完成，更新知識庫項目的處理狀態
      if (validatedData.status === ProcessingStatus.COMPLETED) {
        // 檢查是否還有其他進行中的任務
        const otherTasks = await tx.processingTask.findMany({
          where: {
            knowledge_base_id: existingTask.knowledge_base?.id,
            id: { not: id },
            status: {
              in: [ProcessingStatus.PENDING, ProcessingStatus.PROCESSING]
            }
          }
        })

        // 如果沒有其他進行中的任務，標記為完成
        if (otherTasks.length === 0) {
          await tx.knowledgeBase.update({
            where: { id: existingTask.knowledge_base?.id },
            data: { processing_status: ProcessingStatus.COMPLETED }
          })
        }
      } else if (validatedData.status === ProcessingStatus.FAILED) {
        // 如果任務失敗，標記知識庫項目為失敗
        await tx.knowledgeBase.update({
          where: { id: existingTask.knowledge_base?.id },
          data: {
            processing_status: ProcessingStatus.FAILED,
            processing_error: validatedData.error_message
          }
        })
      }

      return task
    })

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Processing task updated successfully'
    })

  } catch (error) {
    console.error('PUT /api/knowledge-base/processing/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid update data', details: error.errors },
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
      { success: false, error: 'Failed to update processing task' },
      { status: 500 }
    )
  }
}