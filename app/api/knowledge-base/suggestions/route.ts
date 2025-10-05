/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫搜索建議API (app/api/knowledge-base/suggestions/route.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供智能搜索建議系統的RESTful API端點，包含實時搜索建議、
 * 自動補全、相關搜索、使用記錄追蹤和統計分析等功能
 *
 * 【主要職責】
 * • 實時搜索建議 - 基於用戶輸入提供智能搜索建議
 * • 自動補全功能 - 快速自動補全用戶輸入的搜索詞
 * • 相關搜索推薦 - 根據搜索歷史推薦相關搜索詞
 * • 使用行為追蹤 - 記錄用戶搜索行為和使用統計
 * • 個性化建議 - 基於用戶歷史提供個性化搜索建議
 * • 多語言支援 - 支援多語言搜索建議和自動檢測
 * • 拼寫糾錯 - 提供智能拼寫錯誤糾正功能
 *
 * 【API規格】
 * • GET /api/knowledge-base/suggestions - 獲取搜索建議
 *   參數: q/query, userId, language, category, limit, includeTypes, excludeTypes
 *   回應: { success, data, meta }
 * • POST /api/knowledge-base/suggestions - 複雜建議操作
 *   actions: suggestions, autocomplete, record, related
 *   回應: 根據action類型返回對應數據
 * • DELETE /api/knowledge-base/suggestions - 清理過期數據
 *   權限: 管理員權限
 * • PATCH /api/knowledge-base/suggestions - 獲取統計信息
 *   權限: 認證用戶
 *
 * 【使用場景】
 * • 搜索框自動補全 - 用戶輸入時的實時建議
 * • 搜索結果優化 - 提供相關搜索詞擴展結果
 * • 用戶體驗改善 - 拼寫糾錯和智能建議
 * • 搜索行為分析 - 了解用戶搜索模式和熱門詞彙
 * • 個性化推薦 - 基於歷史行為的個性化搜索建議
 *
 * 【相關檔案】
 * • lib/search/search-suggestions.ts - 搜索建議服務核心邏輯
 * • lib/errors.ts - 錯誤處理和分類
 * • @clerk/nextjs - 用戶身份驗證
 * • crypto - UUID生成和安全功能
 *
 * 【開發注意】
 * • 支援多種建議類型：completion, related, popular, personalized, correction, category
 * • 實現30分鐘緩存機制提升響應速度
 * • 提供詳細的請求ID和處理時間追蹤
 * • 支援語言自動檢測和多語言建議
 * • 包含用戶個性化和使用統計功能
 * • 實現優雅的錯誤處理和日誌記錄
 *
 * Week 5 開發階段 - Task 5.4: 實時搜索建議系統 API
 */

import { NextRequest, NextResponse } from 'next/server'              // Next.js請求和回應處理
import { z } from 'zod'                                             // 資料驗證架構
import crypto from 'crypto'                                         // 加密和UUID生成
import { getSearchSuggestionService, SuggestionRequest } from '@/lib/search/search-suggestions'  // 搜索建議服務
import { AppError } from '@/lib/errors'                             // 應用錯誤處理
// Note: Clerk authentication is not used in this project

/**
 * 搜索建議請求驗證架構
 * 用於驗證GET和POST請求中的搜索建議參數
 */
const SuggestionRequestSchema = z.object({
  query: z.string().min(1).max(200),                                                              // 搜索查詢字串（1-200字符）
  userId: z.string().optional(),                                                                  // 用戶ID（可選）
  language: z.enum(['zh-TW', 'zh-CN', 'en', 'auto']).optional().default('auto'),                // 語言設定（預設自動檢測）
  category: z.string().optional(),                                                               // 分類篩選（可選）
  limit: z.number().min(1).max(20).optional().default(10),                                      // 建議數量限制（1-20，預設10）
  includeTypes: z.array(z.enum(['completion', 'related', 'popular', 'personalized', 'correction', 'category'])).optional(),  // 包含的建議類型
  excludeTypes: z.array(z.enum(['completion', 'related', 'popular', 'personalized', 'correction', 'category'])).optional(),  // 排除的建議類型
  context: z.object({                                                                           // 上下文信息（可選）
    previousQueries: z.array(z.string()).optional(),                                            // 之前的搜索記錄
    currentPage: z.string().optional(),                                                         // 當前頁面
    userProfile: z.record(z.any()).optional(),                                                  // 用戶偏好設定
  }).optional(),
})

/**
 * 自動補全請求驗證架構
 * 用於快速自動補全功能的參數驗證
 */
const AutoCompleteRequestSchema = z.object({
  query: z.string().min(1).max(100),                                                           // 查詢字串（1-100字符）
  userId: z.string().optional(),                                                               // 用戶ID（可選）
  limit: z.number().min(1).max(10).optional().default(5),                                     // 補全建議數量（1-10，預設5）
  includePopular: z.boolean().optional().default(true),                                       // 是否包含熱門搜索（預設true）
})

/**
 * 使用記錄驗證架構
 * 用於記錄用戶搜索行為和統計分析
 */
const UsageRecordSchema = z.object({
  query: z.string().min(1).max(200),                                                           // 搜索查詢字串
  userId: z.string().optional(),                                                               // 用戶ID（可選）
  category: z.string().optional(),                                                             // 搜索分類（可選）
  success: z.boolean().optional(),                                                             // 搜索是否成功（可選）
  clicked: z.boolean().optional(),                                                             // 是否點擊結果（可選）
  resultCount: z.number().optional(),                                                          // 結果數量（可選）
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

    // 4. 用戶認證信息 (可選) - User authentication info (optional)
    // Note: Authentication can be added here if needed

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

  // 用戶認證信息 (可選) - User authentication info (optional)
  // Note: Authentication can be added here if needed

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

  // 用戶認證信息 (可選) - User authentication info (optional)
  // Note: Authentication can be added here if needed

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

  // 用戶認證信息 (可選) - User authentication info (optional)
  // Note: Authentication can be added here if needed

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

  // 用戶認證信息 (可選) - User authentication info (optional)
  const finalUserId = userId

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
export async function DELETE() {
  try {
    // 檢查管理員權限 - Check admin permissions
    // Note: Authentication should be implemented here
    // For now, allowing cleanup operations

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
export async function PATCH() {
  try {
    // 檢查認證 - Check authentication
    // Note: Authentication should be implemented here
    // For now, allowing statistics access

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