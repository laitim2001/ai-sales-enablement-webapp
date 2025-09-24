import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { DocumentCategory, DocumentStatus } from '@prisma/client'

// 搜索請求驗證 schema
const SearchKnowledgeBaseSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['text', 'semantic', 'hybrid']).default('hybrid'),
  category: z.nativeEnum(DocumentCategory).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10),
  similarity_threshold: z.number().min(0).max(1).default(0.7),
  include_chunks: z.boolean().default(true)
})

// POST /api/knowledge-base/search - 搜索知識庫
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶身份
    const user = await verifyToken(request)
    if (!user) {
      throw AppError.unauthorized('Authentication required')
    }

    // 解析請求數據
    const body = await request.json()
    const validatedData = SearchKnowledgeBaseSchema.parse(body)

    const { query, type, category, tags, limit, similarity_threshold, include_chunks } = validatedData

    let results = []

    if (type === 'text' || type === 'hybrid') {
      // 文本搜索
      const textResults = await performTextSearch(query, category, tags, limit)
      results = [...textResults]
    }

    if (type === 'semantic' || type === 'hybrid') {
      // 語義搜索
      try {
        const semanticResults = await performSemanticSearch(
          query,
          category,
          tags,
          limit,
          similarity_threshold
        )

        if (type === 'hybrid') {
          // 合併和去重結果
          results = mergeSearchResults(results, semanticResults, limit)
        } else {
          results = semanticResults
        }
      } catch (embeddingError) {
        console.warn('Semantic search failed, falling back to text search:', embeddingError)
        if (type === 'semantic') {
          // 如果純語義搜索失敗，返回文本搜索結果
          results = await performTextSearch(query, category, tags, limit)
        }
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

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        query,
        search_type: type,
        total_results: results.length,
        similarity_threshold: type !== 'text' ? similarity_threshold : undefined
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