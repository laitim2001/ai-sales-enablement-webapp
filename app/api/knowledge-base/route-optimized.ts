/**
 * ================================================================
 * AI銷售賦能平台 - 優化版知識庫API (app/api/knowledge-base/route-optimized.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供高性能、具備緩存機制的知識庫管理RESTful API端點
 * 專注於查詢優化、緩存策略和性能監控的進階版本
 *
 * 【主要職責】
 * • 優化查詢性能 - 使用Redis緩存和查詢優化技術
 * • 知識庫列表管理 - 支援複雜篩選、排序和分頁功能
 * • 文檔創建優化 - 批量標籤處理和重複內容檢測
 * • 緩存策略管理 - 多層緩存和自動失效機制
 * • 性能監控追蹤 - 請求處理時間和效能指標收集
 *
 * 【API規格】
 * • GET /api/knowledge-base - 獲取知識庫列表（優化版）
 *   參數: page, limit, category, status, search, tags, sort, order
 *   回應: { success, data[], pagination, meta }
 *   緩存: 5分鐘列表緩存，支援條件緩存
 * • POST /api/knowledge-base - 創建知識庫項目（優化版）
 *   參數: { title, content, category, tags, metadata }
 *   回應: { success, data, message }
 *   功能: 重複檢測、批量標籤處理、自動處理任務
 *
 * 【使用場景】
 * • 高流量文檔瀏覽 - 緩存機制提升響應速度
 * • 複雜查詢需求 - 多條件篩選和全文搜索
 * • 批量文檔操作 - 優化的創建和更新流程
 * • 性能敏感應用 - 需要快速響應的前端介面
 * • 大規模部署 - 支援高併發和負載均衡
 *
 * 【相關檔案】
 * • lib/cache/redis-client.ts - Redis緩存服務
 * • lib/performance/monitor.ts - 性能監控包裝器
 * • lib/auth-server.ts - 身份驗證服務
 * • lib/errors.ts - 統一錯誤處理
 *
 * 【開發注意】
 * • 使用多層緩存策略：列表(5分鐘)、項目(10分鐘)、搜索(15分鐘)
 * • 實現內容哈希重複檢測，避免重複文檔
 * • 支援批量標籤操作，減少數據庫查詢次數
 * • 包含性能追蹤和監控功能
 * • 提供Cache-Control標頭優化客戶端緩存
 * • 使用事務確保數據一致性
 */

import { NextRequest, NextResponse } from 'next/server'              // Next.js請求和回應處理
import { z } from 'zod'                                             // 資料驗證架構
import { prisma } from '@/lib/db'                                   // 數據庫連接實例
import { AppError } from '@/lib/errors'                             // 應用錯誤處理
import { verifyToken } from '@/lib/auth-server'                     // JWT令牌驗證
import { DocumentCategory, DocumentStatus, ProcessingStatus } from '@prisma/client'  // 文檔相關枚舉
import { cacheService, CacheKeyGenerator } from '@/lib/cache/redis-client'  // Redis緩存服務
import { withPerformanceTracking } from '@/lib/performance/monitor'          // 性能監控包裝器

/**
 * 知識庫項目創建驗證架構
 * 定義創建新知識庫項目時的必要和可選欄位
 */
const CreateKnowledgeBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),    // 文檔標題（必填）
  content: z.string().optional(),                                              // 文檔內容（可選）
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.GENERAL),  // 文檔分類（預設GENERAL）
  source: z.string().optional(),                                               // 來源路徑（可選）
  author: z.string().optional(),                                               // 作者資訊（可選）
  language: z.string().default('zh-TW'),                                       // 語言設定（預設繁中）
  metadata: z.record(z.any()).optional(),                                      // 自定義元數據（可選）
  tags: z.array(z.string()).optional()                                         // 標籤列表（可選）
})

/**
 * 知識庫項目更新驗證架構
 * 所有欄位皆為可選，用於部分更新操作
 */
const UpdateKnowledgeBaseSchema = CreateKnowledgeBaseSchema.partial()

/**
 * 知識庫查詢參數驗證架構
 * 支援分頁、篩選、搜索和排序功能
 */
const QueryKnowledgeBaseSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),                      // 頁碼（預設1）
  limit: z.string().transform(val => Math.min(parseInt(val, 10), 100)).default('20'),     // 每頁數量（最大100，預設20）
  category: z.nativeEnum(DocumentCategory).optional(),                                    // 分類篩選
  status: z.nativeEnum(DocumentStatus).optional(),                                       // 狀態篩選
  search: z.string().optional(),                                                         // 搜索關鍵字
  tags: z.string().optional(),                                                           // 標籤篩選（逗號分隔）
  sort: z.enum(['created_at', 'updated_at', 'title']).default('updated_at'),            // 排序欄位
  order: z.enum(['asc', 'desc']).default('desc')                                        // 排序方向
})

/**
 * 緩存存活時間配置
 * 針對不同類型的數據設定不同的緩存時間
 */
const CACHE_TTL = {
  LIST: 5 * 60,      // 列表緩存：5分鐘
  ITEM: 10 * 60,     // 單項緩存：10分鐘
  SEARCH: 15 * 60,   // 搜索結果緩存：15分鐘
}

// GET /api/knowledge-base - 獲取知識庫列表（優化版）
async function getKnowledgeBaseList(request: NextRequest) {
  try {
    // 驗證用戶身份
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 解析查詢參數
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const validatedParams = QueryKnowledgeBaseSchema.parse(params)

    const { page, limit, category, status, search, tags, sort, order } = validatedParams

    // 生成緩存鍵
    const cacheKey = CacheKeyGenerator.knowledgeBaseList(validatedParams)

    // 嘗試從緩存獲取
    const cachedData = await cacheService.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
        }
      })
    }

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
      // 優化搜索：使用全文搜索（如果可用）
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean)
      if (tagList.length > 0) {
        where.tags = {
          some: {
            name: { in: tagList }
          }
        }
      }
    }

    // 分頁計算
    const skip = (page - 1) * limit

    // 優化的並行查詢
    const [knowledgeBase, totalCount] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        select: {
          // 只選擇必要的字段以減少數據傳輸
          id: true,
          title: true,
          category: true,
          status: true,
          author: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          updater: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true
            },
            take: 10 // 限制標籤數量
          },
          _count: {
            select: { chunks: true }
          }
        },
        orderBy: { [sort]: order },
        skip,
        take: limit
      }),
      // 使用優化的計數查詢
      prisma.knowledgeBase.count({ where })
    ])

    const response = {
      success: true,
      data: knowledgeBase,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      meta: {
        cached: false,
        timestamp: new Date().toISOString()
      }
    }

    // 設置緩存（異步）
    cacheService.set(cacheKey, response, CACHE_TTL.LIST).catch(err => {
      console.warn('Failed to cache knowledge base list:', err)
    })

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Vary': 'Authorization'
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

// POST /api/knowledge-base - 創建新的知識庫項目（優化版）
async function createKnowledgeBase(request: NextRequest) {
  try {
    // 驗證用戶身份
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

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

    // 檢查重複內容（使用緩存優化）
    if (contentHash) {
      const duplicateCheckKey = `duplicate:${contentHash}`
      let existing = await cacheService.get(duplicateCheckKey)

      if (!existing) {
        existing = await prisma.knowledgeBase.findUnique({
          where: { hash: contentHash },
          select: { id: true, title: true }
        })

        if (existing) {
          await cacheService.set(duplicateCheckKey, existing, 24 * 60 * 60) // 24小時緩存
        }
      }

      if (existing) {
        throw AppError.validation(`Duplicate content detected. A document "${existing.title}" with the same content already exists.`)
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

      // 處理標籤（優化批量操作）
      if (tags && tags.length > 0) {
        const uniqueTags = [...new Set(tags)] // 去重

        // 批量查找現有標籤
        const existingTags = await tx.knowledgeTag.findMany({
          where: { name: { in: uniqueTags } }
        })

        const existingTagNames = new Set(existingTags.map(tag => tag.name))
        const newTagNames = uniqueTags.filter(name => !existingTagNames.has(name))

        // 批量創建新標籤
        const newTags = await Promise.all(
          newTagNames.map(name =>
            tx.knowledgeTag.create({
              data: {
                name,
                usage_count: 1,
                color: `#${Math.floor(Math.random()*16777215).toString(16)}` // 隨機顏色
              }
            })
          )
        )

        // 批量更新現有標籤的使用次數
        if (existingTags.length > 0) {
          await tx.knowledgeTag.updateMany({
            where: { id: { in: existingTags.map(tag => tag.id) } },
            data: { usage_count: { increment: 1 } }
          })
        }

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
    }, {
      timeout: 10000, // 10秒超時
      isolationLevel: 'ReadCommitted'
    })

    // 如果有內容，創建處理任務（異步）
    if (result && validatedData.content) {
      prisma.processingTask.create({
        data: {
          knowledge_base_id: result.id,
          task_type: 'VECTORIZATION',
          status: ProcessingStatus.PENDING,
          metadata: {
            content_length: validatedData.content.length,
            user_id: payload.userId,
            estimated_time: Math.ceil(validatedData.content.length / 1000) // 估算處理時間
          }
        }
      }).catch(err => {
        console.error('Failed to create processing task:', err)
      })
    }

    // 清除相關緩存
    cacheService.delPattern('kb:list:*').catch(err => {
      console.warn('Failed to invalidate list cache:', err)
    })

    // 緩存新創建的項目
    if (result) {
      const itemCacheKey = CacheKeyGenerator.knowledgeBaseItem(result.id)
      cacheService.set(itemCacheKey, result, CACHE_TTL.ITEM).catch(err => {
        console.warn('Failed to cache new item:', err)
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Knowledge base item created successfully'
    }, {
      status: 201,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

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

// 導出優化的處理器
export const GET = withPerformanceTracking(getKnowledgeBaseList)
export const POST = withPerformanceTracking(createKnowledgeBase)