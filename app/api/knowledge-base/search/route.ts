/**
 * ================================================================
 * 檔案名稱: 知識庫搜索API路由
 * 檔案用途: AI銷售賦能平台的智能搜索系統核心API
 * 開發階段: 生產環境就緒 - Week 5 優化版本
 * ================================================================
 *
 * 功能索引:
 * 1. POST /api/knowledge-base/search - 智能搜索引擎（支援文本、語義、混合搜索）
 * 2. 增強向量搜索引擎整合（Week 5新增）
 * 3. 降級機制支援（向量服務不可用時的備用方案）
 * 4. 智能搜索建議生成
 *
 * API規格:
 * - 方法: POST
 * - 路徑: /api/knowledge-base/search
 * - 認證: JWT Token (Bearer Token或Cookie)
 * - 權限: 已認證用戶
 * - 請求格式: JSON {query, type, options...}
 * - 回應格式: JSON {success, data, metadata}
 *
 * 搜索類型:
 * - text: 純文本搜索（基於關鍵字匹配）
 * - semantic: 純語義搜索（基於向量相似度）
 * - hybrid: 混合搜索（結合文本和語義，推薦使用）
 *
 * 業務特色:
 * - 智能搜索演算法: 支援餘弦相似度、歐氏距離等多種演算法
 * - 個人化搜索: 基於用戶偏好和搜索歷史的個人化結果
 * - 時間衰減: 考慮文檔新鮮度的搜索排名
 * - 快取機制: 提升搜索性能的智能快取
 * - 降級支援: 增強向量搜索失敗時的備用方案
 * - 分塊匹配: 精確定位相關文檔段落
 * - 搜索建議: 智能生成相關搜索建議
 *
 * 技術特色:
 * - Week 5增強向量搜索引擎: 支援多種搜索演算法和優化
 * - 降級機制: 確保服務可用性的多層備用方案
 * - 性能優化: 並行處理、早期終止、批量計算
 * - 智能評分: 混合評分算法結合多種相關性指標
 * - 結果合併: 智能合併不同搜索來源的結果
 *
 * 注意事項:
 * - 搜索需要用戶認證
 * - 向量搜索依賴AI嵌入服務，服務不可用時會降級到文本搜索
 * - 混合搜索提供最佳的搜索體驗，推薦作為預設選項
 * - 搜索結果會根據用戶偏好進行個人化排序
 *
 * 更新記錄:
 * - Week 1-2: 基礎文本搜索功能
 * - Week 3: 語義搜索和向量支援
 * - Week 4: 混合搜索和性能優化
 * - Week 5: 增強向量搜索引擎、降級機制、個人化功能
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { DocumentCategory, DocumentStatus } from '@prisma/client'
import { vectorSearchEngine, VectorSearchOptions, SearchPreferences } from '@/lib/search/vector-search'

/**
 * ================================================================
 * 搜索請求驗證架構 - Search Request Validation Schema
 * Week 5 增強版本，支援高級搜索選項和個人化設定
 * ================================================================
 */

const SearchKnowledgeBaseSchema = z.object({
  // === 核心搜索參數 ===
  query: z.string().min(1, 'Search query is required'),                     // 搜索關鍵字，必填
  type: z.enum(['text', 'semantic', 'hybrid']).default('hybrid'),          // 搜索類型，預設混合搜索

  // === 基本篩選參數 ===
  category: z.nativeEnum(DocumentCategory).optional(),                      // 文檔分類篩選
  tags: z.array(z.string()).optional(),                                     // 標籤篩選陣列
  limit: z.number().int().min(1).max(50).default(10),                      // 結果數量限制（1-50）
  similarity_threshold: z.number().min(0).max(1).default(0.7),             // 語義相似度閾值（0-1）
  include_chunks: z.boolean().default(true),                               // 是否包含文檔分塊詳情

  // === Week 5 新增高級搜索選項 ===
  search_algorithm: z.enum(['cosine', 'euclidean', 'hybrid']).optional(),  // 向量搜索演算法選擇
  time_decay: z.boolean().default(true),                                   // 是否啟用時間衰減排序
  use_cache: z.boolean().default(true),                                    // 是否使用搜索快取

  // === 個人化偏好設定 ===
  user_preferences: z.object({
    preferred_categories: z.array(z.nativeEnum(DocumentCategory)).optional(),  // 偏好的文檔分類
    recent_activity_weight: z.number().min(0).max(1).optional(),              // 近期活動權重（0-1）
    author_preferences: z.array(z.string()).optional(),                       // 偏好的作者列表
    tag_preferences: z.array(z.string()).optional(),                          // 偏好的標籤列表
    language_preference: z.string().optional()                                // 偏好的語言設定
  }).optional()
})

/**
 * ================================================================
 * POST /api/knowledge-base/search - 智能搜索知識庫
 * ================================================================
 *
 * 功能說明:
 * - 支援三種搜索模式：文本、語義、混合搜索
 * - Week 5增強：整合向量搜索引擎，支援降級機制
 * - 個人化搜索結果排序
 * - 智能搜索建議生成
 * - 分塊級別的精確匹配
 *
 * 請求格式:
 * {
 *   query: string,              // 搜索關鍵字
 *   type: 'text'|'semantic'|'hybrid',  // 搜索類型
 *   category?: DocumentCategory,       // 分類篩選
 *   tags?: string[],                   // 標籤篩選
 *   limit?: number,                    // 結果數量
 *   similarity_threshold?: number,     // 相似度閾值
 *   search_algorithm?: string,         // 向量演算法
 *   user_preferences?: object          // 個人化偏好
 * }
 *
 * 回應格式:
 * {
 *   success: true,
 *   data: [...],               // 搜索結果陣列
 *   metadata: {                // 搜索元數據
 *     query: string,
 *     search_type: string,
 *     total_results: number,
 *     suggestions?: string[]    // 搜索建議
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    /**
     * ===== 第一步：用戶身份驗證 =====
     * 標準JWT Token驗證流程
     */

    // 從Authorization Header或Cookie提取JWT Token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // 驗證token並提取用戶信息
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    /**
     * ===== 第二步：解析和驗證搜索請求 =====
     */

    // 解析JSON請求體
    const body = await request.json()

    // 使用Zod架構驗證搜索參數
    const validatedData = SearchKnowledgeBaseSchema.parse(body)

    // 解構獲取搜索參數
    const {
      query,                    // 搜索關鍵字
      type,                     // 搜索類型（text/semantic/hybrid）
      category,                 // 文檔分類篩選
      tags,                     // 標籤篩選
      limit,                    // 結果數量限制
      similarity_threshold,     // 語義相似度閾值
      include_chunks,           // 是否包含分塊信息
      search_algorithm,         // Week 5: 向量搜索演算法
      time_decay,              // Week 5: 時間衰減開關
      use_cache,               // Week 5: 快取開關
      user_preferences         // Week 5: 個人化偏好
    } = validatedData

    /**
     * ===== 第三步：初始化搜索結果容器 =====
     */
    let results: any[] = []          // 搜索結果陣列
    let searchMetadata: any = {}     // 搜索元數據對象

    /**
     * ===== 第四步：執行智能搜索 =====
     * Week 5 增強：支援向量搜索引擎、降級機制、個人化
     */

    if (type === 'semantic' || type === 'hybrid') {
      try {
        /**
         * 4.1 增強向量搜索引擎處理
         * 使用Week 5新增的向量搜索引擎，支援多種演算法和優化
         */

        // 構建向量搜索配置選項
        const vectorSearchOptions: VectorSearchOptions = {
          query,                                                        // 搜索查詢
          limit,                                                        // 結果數量限制
          threshold: similarity_threshold,                              // 相似度閾值
          searchType: search_algorithm || 'hybrid',                    // 搜索演算法（預設混合）
          timeDecay: time_decay,                                       // 時間衰減權重
          useCache: use_cache,                                         // 啟用搜索快取
          category,                                                    // 分類篩選
          tags,                                                        // 標籤篩選
          includeChunks: include_chunks,                              // 包含分塊詳情
          userPreferences: user_preferences as SearchPreferences      // 個人化偏好設定
        }

        // 執行增強的向量搜索引擎查詢
        const vectorSearchResult = await vectorSearchEngine.search(vectorSearchOptions)

        if (type === 'hybrid') {
          /**
           * 混合搜索模式：結合文本搜索和向量搜索的優勢
           * - 文本搜索：快速關鍵字匹配
           * - 向量搜索：語義理解和相關性
           * - 智能合併：優化的結果融合算法
           */
          const textResults = await performTextSearch(query, category, tags, Math.floor(limit / 2))
          results = mergeEnhancedSearchResults(textResults, vectorSearchResult.results, limit)
          searchMetadata = {
            ...vectorSearchResult.metadata,                           // 包含向量搜索元數據
            hybridSearch: true,                                       // 標記為混合搜索
            textResultsCount: textResults.length,                     // 文本搜索結果數
            vectorResultsCount: vectorSearchResult.results.length    // 向量搜索結果數
          }
        } else {
          /**
           * 純語義搜索模式：僅使用向量相似度
           * 適合概念性查詢和語義理解
           */
          results = vectorSearchResult.results
          searchMetadata = {
            ...vectorSearchResult.metadata,                           // 向量搜索詳細元數據
            hybridSearch: false                                       // 非混合搜索
          }
        }

      } catch (embeddingError) {
        /**
         * 4.2 降級機制：向量搜索失敗時的備用方案
         * 確保服務可用性，即使AI嵌入服務不可用
         */
        console.warn('Enhanced vector search failed, falling back to legacy search:', embeddingError)

        // 根據搜索類型執行對應的降級策略
        if (type === 'semantic') {
          // 語義搜索降級：使用傳統向量搜索
          results = await performLegacySemanticSearch(query, category, tags, limit, similarity_threshold)
        } else {
          // 混合搜索降級：結合文本搜索和傳統語義搜索
          const textResults = await performTextSearch(query, category, tags, limit)
          const legacySemanticResults = await performLegacySemanticSearch(query, category, tags, limit, similarity_threshold)
          results = mergeSearchResults(textResults, legacySemanticResults, limit)
        }

        // 標記為降級模式並記錄錯誤信息
        searchMetadata = {
          fallbackMode: true,                                         // 降級模式標識
          errorMessage: 'Enhanced search unavailable, using legacy mode'  // 降級原因
        }
      }
    } else {
      /**
       * 4.3 純文本搜索模式
       * 基於關鍵字匹配的傳統搜索，速度快，適合精確匹配
       */
      results = await performTextSearch(query, category, tags, limit)
      searchMetadata = {
        searchType: 'text',                                           // 搜索類型標識
        hybridSearch: false                                           // 非混合搜索
      }
    }

    /**
     * ===== 第五步：處理分塊信息（如果需要） =====
     * 為搜索結果附加相關的文檔分塊，提供精確的內容定位
     */
    if (include_chunks && results.length > 0) {
      // 提取所有搜索結果的知識庫ID
      const knowledgeBaseIds = results.map(r => r.id)

      // 查詢包含搜索關鍵字的相關分塊
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledge_base_id: { in: knowledgeBaseIds },               // 限制在搜索結果範圍內
          content: {
            contains: query,                                        // 分塊內容包含搜索關鍵字
            mode: 'insensitive'                                     // 不區分大小寫
          }
        },
        select: {
          id: true,                                                 // 分塊ID
          knowledge_base_id: true,                                  // 所屬文檔ID
          chunk_index: true,                                        // 分塊索引
          content: true,                                           // 分塊內容
          start_pos: true,                                         // 起始位置
          end_pos: true,                                           // 結束位置
          token_count: true                                        // Token數量
        },
        take: limit * 3                                            // 總分塊數限制（每個文檔最多3個）
      })

      // 將分塊數據按文檔分組並附加到搜索結果
      results = results.map(result => ({
        ...result,
        relevant_chunks: chunks
          .filter(chunk => chunk.knowledge_base_id === result.id)  // 篩選屬於當前文檔的分塊
          .slice(0, 3)                                            // 限制每個文檔最多3個分塊
      }))
    }

    /**
     * ===== 第六步：生成增強回應 =====
     * Week 5 增強格式：包含詳細搜索元數據和智能建議
     */
    return NextResponse.json({
      success: true,                                               // 操作成功標識
      data: results,                                              // 搜索結果陣列

      // 詳細的搜索元數據
      metadata: {
        // === 基本搜索信息 ===
        query,                                                    // 原始搜索查詢
        search_type: type,                                        // 搜索類型
        total_results: results.length,                           // 結果總數
        similarity_threshold: type !== 'text' ? similarity_threshold : undefined,  // 相似度閾值（非文本搜索）

        // === Week 5 新增的高級元數據 ===
        search_algorithm: search_algorithm || 'hybrid',          // 使用的搜索演算法
        time_decay_enabled: time_decay,                          // 時間衰減是否啟用
        cache_enabled: use_cache,                                // 快取是否啟用
        user_preferences_applied: !!user_preferences,           // 是否應用了個人化偏好

        // === 搜索引擎回傳的性能和質量指標 ===
        ...searchMetadata,                                       // 包含搜索引擎特定的元數據

        // === 智能搜索建議 ===
        // 當搜索結果較少時，提供搜索建議幫助用戶優化查詢
        suggestions: results.length < Math.floor(limit / 2) ?
          await generateSearchSuggestions(query) : undefined
      }
    })

  } catch (error) {
    /**
     * ===== 錯誤處理機制 =====
     * 分層處理不同類型的搜索錯誤
     */

    console.error('POST /api/knowledge-base/search error:', error)

    // Zod驗證錯誤：搜索參數格式不正確
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',                      // 用戶友好的錯誤信息
          details: error.errors                                    // 詳細的參數驗證錯誤
        },
        { status: 400 }                                           // 400 Bad Request
      )
    }

    // 應用級錯誤：認證失敗、權限不足等
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message                                     // 預定義的業務錯誤信息
        },
        { status: error.statusCode }                              // 使用AppError定義的狀態碼
      )
    }

    // 未預期的系統錯誤：搜索引擎故障、資料庫連接失敗等
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed'                                    // 通用搜索失敗信息
      },
      { status: 500 }                                             // 500 Internal Server Error
    )
  }
}

/**
 * ================================================================
 * 輔助函數：執行文本搜索
 * ================================================================
 * 基於關鍵字匹配的傳統搜索，支援標題、內容、作者的全文搜索
 * 包含智能相關性評分和排序機制
 */
async function performTextSearch(
  query: string,                    // 搜索關鍵字
  category?: DocumentCategory,      // 可選的文檔分類篩選
  tags?: string[],                  // 可選的標籤篩選
  limit: number = 10               // 結果數量限制
) {
  const where: any = {
    status: { in: [DocumentStatus.ACTIVE, DocumentStatus.DRAFT] },
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
      { author: { contains: query, mode: 'insensitive' } }
    ]
  }

  if (category) {
    where.category = category
  }

  if (tags && tags.length > 0) {
    where.tags = {
      some: {
        name: { in: tags }
      }
    }
  }

  // 優化查詢：取更多結果以便進行相關性排序
  const results = await prisma.knowledgeBase.findMany({
    where,
    include: {
      creator: {
        select: { id: true, first_name: true, last_name: true }
      },
      tags: {
        select: { id: true, name: true, color: true }
      },
      _count: {
        select: { chunks: true }
      }
    },
    // 首先按相關性可能影響的字段排序
    orderBy: [
      { updated_at: 'desc' },
      { created_at: 'desc' }
    ],
    take: Math.min(limit * 2, 50) // 取更多結果進行相關性評分，但限制在合理範圍內
  })

  // 計算相關性分數並按分數排序
  const scoredResults = results.map(result => ({
    ...result,
    search_score: calculateTextScore(result, query),
    search_type: 'text'
  }))

  // 按相關性分數排序並返回指定數量的結果
  return scoredResults
    .sort((a, b) => b.search_score - a.search_score)
    .slice(0, limit)
}

// 執行語義搜索
async function performSemanticSearch(
  query: string,
  category?: DocumentCategory,
  tags?: string[],
  limit: number = 10,
  similarity_threshold: number = 0.7
) {
  // 生成查詢向量
  const queryEmbedding = await generateEmbedding(query)

  if (!queryEmbedding || !queryEmbedding.embedding) {
    throw new Error('Failed to generate query embedding')
  }

  // 構建基本查詢條件
  const baseWhere: any = {
    status: { in: [DocumentStatus.ACTIVE, DocumentStatus.DRAFT] }
  }

  if (category) {
    baseWhere.category = category
  }

  if (tags && tags.length > 0) {
    baseWhere.tags = {
      some: {
        name: { in: tags }
      }
    }
  }

  // 由於我們使用的是標準 PostgreSQL 而不是 pgvector，
  // 這裡先實現基本的向量搜索邏輯
  // 在生產環境中，建議使用 pgvector 擴展進行高效的向量搜索

  // 獲取所有符合條件的分塊 - 優化查詢以減少數據傳輸
  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      knowledge_base: baseWhere,
      vector_embedding: { not: null }
    },
    include: {
      knowledge_base: {
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          }
        }
      }
    },
    // 只選擇必要的字段以提高性能
    orderBy: { chunk_index: 'asc' }
  })

  // 優化相似度計算 - 批量處理和早期終止
  const scoredChunks: any[] = []
  const processedKnowledgeBaseIds = new Set()

  for (const chunk of chunks) {
    if (!chunk.vector_embedding) continue

    let chunkEmbedding: number[]
    try {
      chunkEmbedding = JSON.parse(chunk.vector_embedding)
    } catch (e) {
      console.warn(`Failed to parse embedding for chunk ${chunk.id}:`, e)
      continue
    }

    // 快速相似度檢查 - 如果向量長度不匹配則跳過
    if (chunkEmbedding.length !== queryEmbedding.embedding.length) {
      continue
    }

    const similarity = cosineSimilarity(queryEmbedding.embedding, chunkEmbedding)

    // 早期過濾 - 只處理符合閾值的結果
    if (similarity >= similarity_threshold) {
      scoredChunks.push({
        ...chunk,
        similarity_score: similarity
      })
    }

    // 性能優化 - 如果已經找到足夠多的結果，可以提前終止
    if (scoredChunks.length >= limit * 3) { // 留有餘量確保quality
      break
    }
  }

  // 排序 - 只對符合條件的結果排序
  scoredChunks.sort((a, b) => b.similarity_score - a.similarity_score)

  // 按知識庫項目分組，選擇每個項目的最高分分塊
  const groupedByKB = new Map()

  scoredChunks.forEach(chunk => {
    if (!chunk) return

    const kbId = chunk.knowledge_base.id
    if (!groupedByKB.has(kbId) ||
        groupedByKB.get(kbId).similarity_score < chunk.similarity_score) {
      groupedByKB.set(kbId, chunk)
    }
  })

  // 轉換為結果格式
  const results = Array.from(groupedByKB.values())
    .slice(0, limit)
    .map(chunk => ({
      ...chunk.knowledge_base,
      search_score: chunk.similarity_score,
      search_type: 'semantic',
      best_chunk: {
        id: chunk.id,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        similarity_score: chunk.similarity_score
      }
    }))

  return results
}

// 合併搜索結果 - 優化混合搜索評分算法
function mergeSearchResults(textResults: any[], semanticResults: any[], limit: number) {
  const mergedMap = new Map()

  // 正規化分數範圍
  const normalizeTextScore = (score: number) => Math.min(score / 20, 1) // 文本分數通常0-20+
  const normalizeSemanticScore = (score: number) => score // 語義分數已經是0-1範圍

  // 添加文本搜索結果
  textResults.forEach(result => {
    const normalizedTextScore = normalizeTextScore(result.search_score)
    mergedMap.set(result.id, {
      ...result,
      search_scores: { text: normalizedTextScore },
      search_score: normalizedTextScore
    })
  })

  // 合併語義搜索結果
  semanticResults.forEach(result => {
    const normalizedSemanticScore = normalizeSemanticScore(result.search_score)

    if (mergedMap.has(result.id)) {
      const existing = mergedMap.get(result.id)
      existing.search_scores.semantic = normalizedSemanticScore

      // 加權平均：文本搜索權重0.3，語義搜索權重0.7
      existing.search_score = (existing.search_scores.text * 0.3) + (normalizedSemanticScore * 0.7)

      // 如果語義搜索有更好的分塊，使用語義搜索的分塊
      if (result.best_chunk && (!existing.best_chunk || result.search_score > existing.search_score)) {
        existing.best_chunk = result.best_chunk
      }

      existing.search_type = 'hybrid'
    } else {
      mergedMap.set(result.id, {
        ...result,
        search_scores: { semantic: normalizedSemanticScore },
        search_score: normalizedSemanticScore
      })
    }
  })

  // 排序並返回 - 提高排序性能
  return Array.from(mergedMap.values())
    .sort((a, b) => {
      // 先按分數排序，分數相同時按更新時間排序
      const scoreDiff = b.search_score - a.search_score
      if (Math.abs(scoreDiff) < 0.001) {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
      return scoreDiff
    })
    .slice(0, limit)
}

/**
 * ================================================================
 * 輔助函數：計算文本相關性分數
 * ================================================================
 * 基於多個因素計算文檔與搜索查詢的相關性分數
 * 權重分配：標題(10) > 內容(5) > 標籤(3) > 作者(2)
 */
function calculateTextScore(item: any, query: string): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // 標題匹配：權重最高，因為標題通常最能代表文檔主題
  if (item.title.toLowerCase().includes(queryLower)) {
    score += 10
  }

  // 內容匹配：次高權重，文檔的核心內容
  if (item.content && item.content.toLowerCase().includes(queryLower)) {
    score += 5
  }

  // 作者匹配：較低權重，用於按作者搜索
  if (item.author && item.author.toLowerCase().includes(queryLower)) {
    score += 2
  }

  // 標籤匹配：中等權重，標籤是重要的分類信息
  if (item.tags) {
    item.tags.forEach((tag: any) => {
      if (tag.name.toLowerCase().includes(queryLower)) {
        score += 3
      }
    })
  }

  return score
}

/**
 * ================================================================
 * 輔助函數：餘弦相似度計算
 * ================================================================
 * 計算兩個向量之間的餘弦相似度，用於語義搜索
 * 返回值範圍：-1 到 1，值越大表示越相似
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // 驗證向量維度一致性
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0      // 點積
  let normA = 0          // 向量A的模長平方
  let normB = 0          // 向量B的模長平方

  // 計算點積和各向量的模長平方
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  // 計算向量模長
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  // 處理零向量情況，避免除零錯誤
  if (normA === 0 || normB === 0) {
    return 0
  }

  // 返回餘弦相似度：cos(θ) = (A·B) / (|A|×|B|)
  return dotProduct / (normA * normB)
}

/**
 * ================================================================
 * 輔助函數：增強搜索結果合併 (Week 5 新增)
 * ================================================================
 * 智能合併文本搜索和向量搜索的結果，使用加權評分算法
 * 評分權重：語義相似度60% + 相關性20% + 文本匹配20%
 */
function mergeEnhancedSearchResults(textResults: any[], vectorResults: any[], limit: number): any[] {
  const mergedMap = new Map()

  // 添加向量搜索結果（優先級較高）
  vectorResults.forEach(result => {
    mergedMap.set(result.id, {
      ...result,
      search_scores: {
        semantic: result.similarity,
        relevance: result.relevanceScore
      },
      search_score: result.relevanceScore,
      search_type: 'enhanced_semantic'
    })
  })

  // 添加文本搜索結果
  textResults.forEach(result => {
    const normalizedTextScore = Math.min(result.search_score / 20, 1)

    if (mergedMap.has(result.id)) {
      const existing = mergedMap.get(result.id)
      existing.search_scores.text = normalizedTextScore

      // 增強混合評分：語義60% + 相關性20% + 文本20%
      existing.search_score = (existing.search_scores.semantic * 0.6) +
                             (existing.search_scores.relevance * 0.2) +
                             (normalizedTextScore * 0.2)
      existing.search_type = 'enhanced_hybrid'
    } else {
      mergedMap.set(result.id, {
        ...result,
        search_scores: { text: normalizedTextScore },
        search_score: normalizedTextScore,
        search_type: 'text'
      })
    }
  })

  // 排序並返回
  return Array.from(mergedMap.values())
    .sort((a, b) => b.search_score - a.search_score)
    .slice(0, limit)
}

// Week 5 新增函數 - 降級到原有語義搜索（重命名避免衝突）
async function performLegacySemanticSearch(
  query: string,
  category?: DocumentCategory,
  tags?: string[],
  limit: number = 10,
  similarity_threshold: number = 0.7
) {
  // 保留原有的 performSemanticSearch 邏輯作為降級方案
  const queryEmbedding = await generateEmbedding(query)

  if (!queryEmbedding || !queryEmbedding.embedding) {
    throw new Error('Failed to generate query embedding')
  }

  const baseWhere: any = {
    status: { in: [DocumentStatus.ACTIVE, DocumentStatus.DRAFT] }
  }

  if (category) {
    baseWhere.category = category
  }

  if (tags && tags.length > 0) {
    baseWhere.tags = {
      some: {
        name: { in: tags }
      }
    }
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      knowledge_base: baseWhere,
      vector_embedding: { not: null }
    },
    include: {
      knowledge_base: {
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          }
        }
      }
    },
    orderBy: { chunk_index: 'asc' }
  })

  const scoredChunks: any[] = []

  for (const chunk of chunks) {
    if (!chunk.vector_embedding) continue

    let chunkEmbedding: number[]
    try {
      chunkEmbedding = JSON.parse(chunk.vector_embedding)
    } catch (e) {
      continue
    }

    if (chunkEmbedding.length !== queryEmbedding.embedding.length) {
      continue
    }

    const similarity = cosineSimilarity(queryEmbedding.embedding, chunkEmbedding)

    if (similarity >= similarity_threshold) {
      scoredChunks.push({
        ...chunk,
        similarity_score: similarity
      })
    }

    if (scoredChunks.length >= limit * 3) {
      break
    }
  }

  scoredChunks.sort((a, b) => b.similarity_score - a.similarity_score)

  const groupedByKB = new Map()
  scoredChunks.forEach(chunk => {
    const kbId = chunk.knowledge_base.id
    if (!groupedByKB.has(kbId) ||
        groupedByKB.get(kbId).similarity_score < chunk.similarity_score) {
      groupedByKB.set(kbId, chunk)
    }
  })

  return Array.from(groupedByKB.values())
    .slice(0, limit)
    .map(chunk => ({
      ...chunk.knowledge_base,
      search_score: chunk.similarity_score,
      search_type: 'legacy_semantic',
      best_chunk: {
        id: chunk.id,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        similarity_score: chunk.similarity_score
      }
    }))
}

// Week 5 新增函數 - 智能搜索建議
async function generateSearchSuggestions(originalQuery: string): Promise<string[]> {
  try {
    // 基於常見搜索模式生成建議
    const suggestions: string[] = []

    // 1. 查找相似的標籤
    const popularTags = await prisma.knowledgeTag.findMany({
      where: {
        usage_count: { gt: 0 }
      },
      orderBy: {
        usage_count: 'desc'
      },
      take: 10,
      select: {
        name: true
      }
    })

    // 2. 查找相關分類的常見詞彙
    const categories = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 5
    })

    // 3. 生成搜索建議
    const queryWords = originalQuery.toLowerCase().split(/\s+/)

    // 添加標籤建議
    popularTags.forEach(tag => {
      if (tag.name.toLowerCase().includes(queryWords[0]) ||
          queryWords.some(word => tag.name.toLowerCase().includes(word))) {
        suggestions.push(`標籤: ${tag.name}`)
      }
    })

    // 添加分類建議
    categories.forEach(category => {
      const categoryName = category.category.toLowerCase()
      if (queryWords.some(word => categoryName.includes(word) || word.includes(categoryName))) {
        suggestions.push(`分類: ${category.category}`)
      }
    })

    // 添加通用建議
    if (suggestions.length < 3) {
      suggestions.push(
        `試試 "${originalQuery} 文檔"`,
        `試試 "${originalQuery} 教程"`,
        `試試 "${originalQuery} 規格"`
      )
    }

    return suggestions.slice(0, 5)

  } catch (error) {
    console.warn('Failed to generate search suggestions:', error)
    return [
      '試試更具體的關鍵詞',
      '檢查拼寫是否正確',
      '使用同義詞或相關詞彙'
    ]
  }
}