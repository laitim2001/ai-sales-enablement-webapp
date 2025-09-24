import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { DocumentCategory, DocumentStatus, ProcessingStatus } from '@prisma/client'

// 請求驗證 schemas
const CreateKnowledgeBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.GENERAL),
  source: z.string().optional(),
  author: z.string().optional(),
  language: z.string().default('zh-TW'),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
})

const UpdateKnowledgeBaseSchema = CreateKnowledgeBaseSchema.partial()

const QueryKnowledgeBaseSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),
  category: z.nativeEnum(DocumentCategory).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // 逗號分隔的標籤
  sort: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
})

// GET /api/knowledge-base - 獲取知識庫列表
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
    const validatedParams = QueryKnowledgeBaseSchema.parse(params)

    const { page, limit, category, status, search, tags, sort, order } = validatedParams

    // 構建查詢條件
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    } else {
      // 默認只顯示活躍的文檔
      where.status = { in: [DocumentStatus.ACTIVE, DocumentStatus.DRAFT] }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim())
      where.tags = {
        some: {
          name: { in: tagList }
        }
      }
    }

    // 分頁計算
    const skip = (page - 1) * limit

    // 執行查詢
    const [knowledgeBase, totalCount] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          updater: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          },
          _count: {
            select: { chunks: true }
          }
        },
        orderBy: { [sort]: order },
        skip,
        take: limit
      }),
      prisma.knowledgeBase.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: knowledgeBase,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('GET /api/knowledge-base error:', error)

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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge-base - 創建新的知識庫項目
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
    const validatedData = CreateKnowledgeBaseSchema.parse(body)

    const { tags, ...knowledgeBaseData } = validatedData

    // 生成內容哈希（用於重複檢測）
    const contentHash = knowledgeBaseData.content ?
      require('crypto').createHash('sha256').update(knowledgeBaseData.content).digest('hex') :
      null

    // 檢查重複內容
    if (contentHash) {
      const existing = await prisma.knowledgeBase.findUnique({
        where: { hash: contentHash }
      })

      if (existing) {
        throw AppError.validation('Duplicate content detected. A document with the same content already exists.')
      }
    }

    // 開始事務創建知識庫項目
    const result = await prisma.$transaction(async (tx) => {
      // 創建知識庫項目
      const knowledgeBase = await tx.knowledgeBase.create({
        data: {
          ...knowledgeBaseData,
          hash: contentHash,
          created_by: payload.userId,
          updated_by: payload.userId,
          processing_status: knowledgeBaseData.content ?
            ProcessingStatus.PENDING : ProcessingStatus.COMPLETED
        },
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          }
        }
      })

      // 處理標籤
      if (tags && tags.length > 0) {
        // 查找現有標籤或創建新標籤
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

        // 關聯標籤到知識庫項目
        const allTags = [...existingTags, ...newTags]
        await tx.knowledgeBase.update({
          where: { id: knowledgeBase.id },
          data: {
            tags: {
              connect: allTags.map(tag => ({ id: tag.id }))
            }
          }
        })

        // 重新獲取包含標籤的數據
        return await tx.knowledgeBase.findUnique({
          where: { id: knowledgeBase.id },
          include: {
            creator: {
              select: { id: true, first_name: true, last_name: true, email: true }
            },
            tags: {
              select: { id: true, name: true, color: true }
            }
          }
        })
      }

      return knowledgeBase
    })

    // 如果有內容，創建處理任務
    if (result && validatedData.content) {
      await prisma.processingTask.create({
        data: {
          knowledge_base_id: result.id,
          task_type: 'VECTORIZATION',
          status: ProcessingStatus.PENDING,
          metadata: {
            content_length: validatedData.content.length,
            user_id: payload.userId
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Knowledge base item created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/knowledge-base error:', error)

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