/**
 * AI 銷售賦能平台 - 搜索建議 API 端點
 * Search Suggestions API Endpoint
 *
 * 提供實時搜索建議、自動補全和相關搜索功能
 * Provides real-time search suggestions, auto-completion, and related search functionality
 *
 * Week 5 開發階段 - Task 5.4: 實時搜索建議系統 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { getSearchSuggestionService, SuggestionRequest } from '@/lib/search/search-suggestions'
import { AppError } from '@/lib/errors'
import { auth } from '@clerk/nextjs'

// 請求架構驗證 - Request Schema Validation
const SuggestionRequestSchema = z.object({
  query: z.string().min(1).max(200),
  userId: z.string().optional(),
  language: z.enum(['zh-TW', 'zh-CN', 'en', 'auto']).optional().default('auto'),
  category: z.string().optional(),
  limit: z.number().min(1).max(20).optional().default(10),
  includeTypes: z.array(z.enum(['completion', 'related', 'popular', 'personalized', 'correction', 'category'])).optional(),
  excludeTypes: z.array(z.enum(['completion', 'related', 'popular', 'personalized', 'correction', 'category'])).optional(),
  context: z.object({
    previousQueries: z.array(z.string()).optional(),
    currentPage: z.string().optional(),
    userProfile: z.record(z.any()).optional(),
  }).optional(),
})

const AutoCompleteRequestSchema = z.object({
  query: z.string().min(1).max(100),
  userId: z.string().optional(),
  limit: z.number().min(1).max(10).optional().default(5),
  includePopular: z.boolean().optional().default(true),
})

const UsageRecordSchema = z.object({
  query: z.string().min(1).max(200),
  userId: z.string().optional(),
  category: z.string().optional(),
  success: z.boolean().optional(),
  clicked: z.boolean().optional(),
  resultCount: z.number().optional(),
})

// 搜索建議服務實例 - Search suggestion service instance
const suggestionService = getSearchSuggestionService({
  maxSuggestions: 15,
  minQueryLength: 1,
  enablePersonalization: true,
  enableCaching: true,
  cacheMaxAge: 1800, // 30分鐘 - 30 minutes
  enablePopularQueries: true,
  enableTypoCorrection: true,
  enableMultiLanguage: true,
})

/**
 * GET /api/knowledge-base/suggestions
 * 獲取搜索建議 - Get search suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startTime = Date.now()

    // 1. 解析查詢參數 - Parse query parameters
    const queryParam = searchParams.get('q') || searchParams.get('query')
    if (!queryParam) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // 2. 構建請求對象 - Build request object
    const requestData: SuggestionRequest = {
      query: queryParam,
      userId: searchParams.get('userId') || undefined,
      language: (searchParams.get('language') as any) || 'auto',
      category: searchParams.get('category') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      includeTypes: searchParams.get('includeTypes')?.split(',') as any,
      excludeTypes: searchParams.get('excludeTypes')?.split(',') as any,
    }

    // 3. 驗證請求 - Validate request
    const validatedRequest = SuggestionRequestSchema.parse(requestData)

    // 4. 獲取用戶認證信息 - Get user authentication info
    const { userId } = auth()
    if (userId) {
      validatedRequest.userId = userId
    }

    // 5. 獲取搜索建議 - Get search suggestions
    const suggestions = await suggestionService.getSuggestions(validatedRequest)

    // 6. 添加響應頭 - Add response headers
    const response = NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0'
      }
    })

    // 設置緩存頭 - Set cache headers
    response.headers.set('Cache-Control', 'public, max-age=300') // 5分鐘緩存 - 5 minutes cache

    return response

  } catch (error) {
    console.error('❌ Error in suggestions API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/knowledge-base/suggestions
 * 記錄查詢使用或獲取復雜建議 - Record query usage or get complex suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'suggestions':
        return await handleSuggestionsRequest(body)
      case 'autocomplete':
        return await handleAutoCompleteRequest(body)
      case 'record':
        return await handleUsageRecord(body)
      case 'related':
        return await handleRelatedSearches(body)
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error in suggestions POST API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * 處理搜索建議請求 - Handle suggestions request
 */
async function handleSuggestionsRequest(body: any) {
  const startTime = Date.now()

  // 驗證請求 - Validate request
  const validatedRequest = SuggestionRequestSchema.parse(body)

  // 獲取用戶認證信息 - Get user authentication info
  const { userId } = auth()
  if (userId) {
    validatedRequest.userId = userId
  }

  // 獲取建議 - Get suggestions
  const suggestions = await suggestionService.getSuggestions(validatedRequest)

  return NextResponse.json({
    success: true,
    data: suggestions,
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      action: 'suggestions'
    }
  })
}

/**
 * 處理自動補全請求 - Handle auto-complete request
 */
async function handleAutoCompleteRequest(body: any) {
  const startTime = Date.now()

  // 驗證請求 - Validate request
  const validatedRequest = AutoCompleteRequestSchema.parse(body)

  // 獲取用戶認證信息 - Get user authentication info
  const { userId } = auth()
  if (userId) {
    validatedRequest.userId = userId
  }

  // 獲取自動補全 - Get auto-complete
  const completions = await suggestionService.getAutoComplete(
    validatedRequest.query,
    {
      userId: validatedRequest.userId,
      limit: validatedRequest.limit,
      includePopular: validatedRequest.includePopular
    }
  )

  return NextResponse.json({
    success: true,
    data: {
      query: validatedRequest.query,
      completions,
      metadata: {
        count: completions.length,
        processingTime: Date.now() - startTime
      }
    },
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'autocomplete'
    }
  })
}

/**
 * 處理使用記錄 - Handle usage record
 */
async function handleUsageRecord(body: any) {
  // 驗證請求 - Validate request
  const validatedRequest = UsageRecordSchema.parse(body)

  // 獲取用戶認證信息 - Get user authentication info
  const { userId } = auth()
  if (userId) {
    validatedRequest.userId = userId
  }

  // 記錄使用 - Record usage
  await suggestionService.recordQueryUsage(
    validatedRequest.query,
    validatedRequest.userId,
    {
      category: validatedRequest.category,
      success: validatedRequest.success,
      clicked: validatedRequest.clicked,
      resultCount: validatedRequest.resultCount
    }
  )

  return NextResponse.json({
    success: true,
    data: {
      message: 'Usage recorded successfully'
    },
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'record'
    }
  })
}

/**
 * 處理相關搜索請求 - Handle related searches request
 */
async function handleRelatedSearches(body: any) {
  const startTime = Date.now()
  const { query, userId, limit = 5, category } = body

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Query is required' },
      { status: 400 }
    )
  }

  // 獲取用戶認證信息 - Get user authentication info
  const { userId: authUserId } = auth()
  const finalUserId = userId || authUserId

  // 獲取相關搜索 - Get related searches
  const relatedSearches = await suggestionService.getRelatedSearches(
    query,
    {
      userId: finalUserId,
      limit,
      category
    }
  )

  return NextResponse.json({
    success: true,
    data: {
      query,
      relatedSearches,
      metadata: {
        count: relatedSearches.length,
        processingTime: Date.now() - startTime
      }
    },
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'related'
    }
  })
}

/**
 * DELETE /api/knowledge-base/suggestions
 * 清理過期數據 - Clean expired data
 */
export async function DELETE(request: NextRequest) {
  try {
    // 檢查管理員權限 - Check admin permissions
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 清理數據 - Clean data
    const cleanupResult = await suggestionService.cleanupExpiredData()

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cleanup completed successfully',
        result: cleanupResult
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'cleanup'
      }
    })

  } catch (error) {
    console.error('❌ Error in suggestions cleanup:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/knowledge-base/suggestions
 * 獲取統計信息 - Get statistics
 */
export async function PATCH(request: NextRequest) {
  try {
    // 檢查認證 - Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 獲取統計信息 - Get statistics
    const statistics = suggestionService.getStatistics()

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        timestamp: new Date().toISOString()
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'statistics'
      }
    })

  } catch (error) {
    console.error('❌ Error getting suggestions statistics:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}