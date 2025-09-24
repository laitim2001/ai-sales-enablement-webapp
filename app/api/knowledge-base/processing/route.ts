import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { ProcessingStatus, ProcessingType } from '@prisma/client'

// 處理任務查詢驗證 schema
const ProcessingTaskQuerySchema = z.object({
  status: z.nativeEnum(ProcessingStatus).optional(),
  task_type: z.nativeEnum(ProcessingType).optional(),
  knowledge_base_id: z.string().transform(val => parseInt(val, 10)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),
  offset: z.string().transform(val => parseInt(val, 10)).default('0')
})

// 手動觸發處理任務驗證 schema
const TriggerProcessingSchema = z.object({
  knowledge_base_id: z.number().int().positive(),
  task_type: z.nativeEnum(ProcessingType),
  priority: z.number().int().min(1).max(10).default(5),
  metadata: z.record(z.any()).optional()
})

// GET /api/knowledge-base/processing - 獲取處理任務列表
export async function GET(request: NextRequest) {
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

    // 解析查詢參數
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const validatedParams = ProcessingTaskQuerySchema.parse(params)

    const { status, task_type, knowledge_base_id, limit, offset } = validatedParams

    // 構建查詢條件
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (task_type) {
      where.task_type = task_type
    }

    if (knowledge_base_id) {
      where.knowledge_base_id = knowledge_base_id
    }

    // 執行查詢
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

      if ([ProcessingStatus.COMPLETED, ProcessingStatus.FAILED, ProcessingStatus.CANCELLED]
          .includes(validatedData.status) && !existingTask.completed_at) {
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