import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { DocumentCategory, DocumentStatus } from '@prisma/client'
import { vectorSearchEngine, VectorSearchOptions, SearchPreferences } from '@/lib/search/vector-search'

// 增強的搜索請求驗證 schema - Week 5 優化
const SearchKnowledgeBaseSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['text', 'semantic', 'hybrid']).default('hybrid'),

  // 基本搜索參數
  category: z.nativeEnum(DocumentCategory).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10),
  similarity_threshold: z.number().min(0).max(1).default(0.7),
  include_chunks: z.boolean().default(true),

  // Week 5 新增的高級搜索選項
  search_algorithm: z.enum(['cosine', 'euclidean', 'hybrid']).optional(),
  time_decay: z.boolean().default(true),
  use_cache: z.boolean().default(true),

  // 用戶偏好設置
  user_preferences: z.object({
    preferred_categories: z.array(z.nativeEnum(DocumentCategory)).optional(),
    recent_activity_weight: z.number().min(0).max(1).optional(),
    author_preferences: z.array(z.string()).optional(),
    tag_preferences: z.array(z.string()).optional(),
    language_preference: z.string().optional()
  }).optional()
})

// POST /api/knowledge-base/search - 搜索知識庫
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
    const validatedData = SearchKnowledgeBaseSchema.parse(body)

    const {
      query,
      type,
      category,
      tags,
      limit,
      similarity_threshold,
      include_chunks,
      search_algorithm,
      time_decay,
      use_cache,
      user_preferences
    } = validatedData

    let results: any[] = []
    let searchMetadata: any = {}

    // Week 5 優化：使用新的向量搜索引擎進行語義和混合搜索
    if (type === 'semantic' || type === 'hybrid') {
      try {
        // 構建向量搜索選項
        const vectorSearchOptions: VectorSearchOptions = {
          query,
          limit,
          threshold: similarity_threshold,
          searchType: search_algorithm || 'hybrid',
          timeDecay: time_decay,
          useCache: use_cache,
          category,
          tags,
          includeChunks: include_chunks,
          userPreferences: user_preferences as SearchPreferences
        }

        // 執行增強的向量搜索
        const vectorSearchResult = await vectorSearchEngine.search(vectorSearchOptions)

        if (type === 'hybrid') {
          // 混合搜索：結合文本搜索和向量搜索
          const textResults = await performTextSearch(query, category, tags, Math.floor(limit / 2))
          results = mergeEnhancedSearchResults(textResults, vectorSearchResult.results, limit)
          searchMetadata = {
            ...vectorSearchResult.metadata,
            hybridSearch: true,
            textResultsCount: textResults.length,
            vectorResultsCount: vectorSearchResult.results.length
          }
        } else {
          // 純語義搜索
          results = vectorSearchResult.results
          searchMetadata = {
            ...vectorSearchResult.metadata,
            hybridSearch: false
          }
        }

      } catch (embeddingError) {
        console.warn('Enhanced vector search failed, falling back to legacy search:', embeddingError)

        // 降級到原有的搜索邏輯
        if (type === 'semantic') {
          results = await performLegacySemanticSearch(query, category, tags, limit, similarity_threshold)
        } else {
          const textResults = await performTextSearch(query, category, tags, limit)
          const legacySemanticResults = await performLegacySemanticSearch(query, category, tags, limit, similarity_threshold)
          results = mergeSearchResults(textResults, legacySemanticResults, limit)
        }

        searchMetadata = {
          fallbackMode: true,
          errorMessage: 'Enhanced search unavailable, using legacy mode'
        }
      }
    } else {
      // 純文本搜索
      results = await performTextSearch(query, category, tags, limit)
      searchMetadata = {
        searchType: 'text',
        hybridSearch: false
      }
    }

    // 如果需要包含分塊信息，獲取相關分塊
    if (include_chunks && results.length > 0) {
      const knowledgeBaseIds = results.map(r => r.id)
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledge_base_id: { in: knowledgeBaseIds },
          content: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          knowledge_base_id: true,
          chunk_index: true,
          content: true,
          start_pos: true,
          end_pos: true,
          token_count: true
        },
        take: limit * 3 // 每個文檔最多返回3個相關分塊
      })

      // 將分塊數據附加到結果中
      results = results.map(result => ({
        ...result,
        relevant_chunks: chunks
          .filter(chunk => chunk.knowledge_base_id === result.id)
          .slice(0, 3) // 限制每個文檔的分塊數量
      }))
    }

    // Week 5 增強響應格式 - 包含詳細的搜索元數據
    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        query,
        search_type: type,
        total_results: results.length,
        similarity_threshold: type !== 'text' ? similarity_threshold : undefined,

        // Week 5 新增的搜索元數據
        search_algorithm: search_algorithm || 'hybrid',
        time_decay_enabled: time_decay,
        cache_enabled: use_cache,
        user_preferences_applied: !!user_preferences,

        // 性能和搜索質量指標
        ...searchMetadata,

        // 搜索建議（如果結果少於預期）
        suggestions: results.length < Math.floor(limit / 2) ? await generateSearchSuggestions(query) : undefined
      }
    })

  } catch (error) {
    console.error('POST /api/knowledge-base/search error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.errors },
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
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}

// 執行文本搜索
async function performTextSearch(
  query: string,
  category?: DocumentCategory,
  tags?: string[],
  limit: number = 10
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

// 計算文本相關性分數
function calculateTextScore(item: any, query: string): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // 標題匹配權重更高
  if (item.title.toLowerCase().includes(queryLower)) {
    score += 10
  }

  // 內容匹配
  if (item.content && item.content.toLowerCase().includes(queryLower)) {
    score += 5
  }

  // 作者匹配
  if (item.author && item.author.toLowerCase().includes(queryLower)) {
    score += 2
  }

  // 標籤匹配
  if (item.tags) {
    item.tags.forEach((tag: any) => {
      if (tag.name.toLowerCase().includes(queryLower)) {
        score += 3
      }
    })
  }

  return score
}

// 餘弦相似度計算
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

// Week 5 新增函數 - 增強搜索結果合併
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