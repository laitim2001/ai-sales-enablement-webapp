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
    orderBy: [
      { updated_at: 'desc' },
      { created_at: 'desc' }
    ],
    take: limit
  })

  return results.map(result => ({
    ...result,
    search_score: calculateTextScore(result, query),
    search_type: 'text'
  }))
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

  if (!queryEmbedding.success || !queryEmbedding.embedding) {
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

  // 獲取所有符合條件的分塊
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
    }
  })

  // 計算相似度並過濾結果
  const scoredChunks = chunks
    .map(chunk => {
      if (!chunk.vector_embedding) return null

      let chunkEmbedding
      try {
        chunkEmbedding = JSON.parse(chunk.vector_embedding)
      } catch (e) {
        return null
      }

      const similarity = cosineSimilarity(queryEmbedding.embedding, chunkEmbedding)

      if (similarity < similarity_threshold) return null

      return {
        ...chunk,
        similarity_score: similarity
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b?.similarity_score || 0) - (a?.similarity_score || 0))

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

// 合併搜索結果
function mergeSearchResults(textResults: any[], semanticResults: any[], limit: number) {
  const mergedMap = new Map()

  // 添加文本搜索結果
  textResults.forEach(result => {
    mergedMap.set(result.id, {
      ...result,
      search_scores: { text: result.search_score }
    })
  })

  // 合併語義搜索結果
  semanticResults.forEach(result => {
    if (mergedMap.has(result.id)) {
      const existing = mergedMap.get(result.id)
      existing.search_scores.semantic = result.search_score
      existing.search_score = (existing.search_scores.text + result.search_score) / 2
      if (result.best_chunk) {
        existing.best_chunk = result.best_chunk
      }
    } else {
      mergedMap.set(result.id, {
        ...result,
        search_scores: { semantic: result.search_score }
      })
    }
  })

  // 排序並返回
  return Array.from(mergedMap.values())
    .sort((a, b) => b.search_score - a.search_score)
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