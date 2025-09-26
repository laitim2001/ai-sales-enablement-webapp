/**
 * AI 銷售賦能平台 - pgvector 高性能向量搜索服務
 *
 * 功能特色：
 * - 基於 pgvector 擴展的原生向量搜索
 * - HNSW 索引高速相似度查詢
 * - 支援餘弦相似度和歐幾里得距離
 * - 混合搜索（向量 + SQL 過濾條件）
 * - 分頁和性能優化
 *
 * Week 5 開發階段 - Task 5.2: 數據庫索引優化
 */

import { prisma } from '@/lib/db'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { DocumentCategory, DocumentStatus } from '@prisma/client'
import { AppError } from '@/lib/errors'
import { SearchResult, SearchPreferences } from './vector-search'

// pgvector 搜索選項
export interface PgVectorSearchOptions {
  query: string
  limit?: number
  threshold?: number
  distanceMetric?: 'cosine' | 'euclidean' | 'inner_product'
  category?: DocumentCategory
  tags?: string[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  userPreferences?: SearchPreferences
  includeScore?: boolean
  offset?: number
}

// pgvector 搜索結果
export interface PgVectorSearchResult {
  results: SearchResult[]
  metadata: {
    totalFound: number
    queryTime: number
    indexUsed: string
    distanceMetric: string
    threshold: number
    hasMore: boolean
  }
}

// 距離運算符映射
const DISTANCE_OPERATORS = {
  cosine: '<->',        // 餘弦距離
  euclidean: '<#>',     // 歐幾里得距離
  inner_product: '<#>'  // 內積（pgvector 中等同於歐幾里得）
} as const

/**
 * pgvector 高性能向量搜索類
 */
export class PgVectorSearchService {
  private readonly DEFAULT_LIMIT = 10
  private readonly DEFAULT_THRESHOLD = 0.7
  private readonly DEFAULT_METRIC = 'cosine'

  /**
   * 執行向量搜索
   */
  async search(options: PgVectorSearchOptions): Promise<PgVectorSearchResult> {
    const startTime = Date.now()

    try {
      // 1. 驗證選項
      this.validateOptions(options)

      // 2. 生成查詢向量
      const queryEmbedding = await this.generateQueryEmbedding(options.query)

      // 3. 構建搜索查詢
      const searchQuery = this.buildSearchQuery(options, queryEmbedding)

      // 4. 執行數據庫查詢
      const rawResults = await this.executeSearch(searchQuery)

      // 5. 處理結果
      const results = this.processResults(rawResults, options)

      // 6. 生成元數據
      const metadata = {
        totalFound: results.length,
        queryTime: Date.now() - startTime,
        indexUsed: this.getIndexName(options.distanceMetric || this.DEFAULT_METRIC),
        distanceMetric: options.distanceMetric || this.DEFAULT_METRIC,
        threshold: options.threshold || this.DEFAULT_THRESHOLD,
        hasMore: results.length === (options.limit || this.DEFAULT_LIMIT)
      }

      return { results, metadata }

    } catch (error) {
      console.error('PgVector search error:', error)
      throw new AppError('Vector search failed', 500, { originalError: error })
    }
  }

  /**
   * 批量向量搜索
   */
  async batchSearch(
    queries: string[],
    options: Omit<PgVectorSearchOptions, 'query'>
  ): Promise<PgVectorSearchResult[]> {
    const results = await Promise.allSettled(
      queries.map(query => this.search({ ...options, query }))
    )

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error('Batch search error:', result.reason)
        return {
          results: [],
          metadata: {
            totalFound: 0,
            queryTime: 0,
            indexUsed: 'error',
            distanceMetric: options.distanceMetric || this.DEFAULT_METRIC,
            threshold: options.threshold || this.DEFAULT_THRESHOLD,
            hasMore: false
          }
        }
      }
    })
  }

  /**
   * 相似文檔推薦
   */
  async findSimilarDocuments(
    documentId: number,
    options: Omit<PgVectorSearchOptions, 'query'> = {}
  ): Promise<PgVectorSearchResult> {
    try {
      // 獲取目標文檔的向量
      const targetDocument = await prisma.knowledgeChunk.findFirst({
        where: {
          knowledge_base_id: documentId,
          vector_embedding_pgvector: { not: null }
        },
        select: {
          vector_embedding_pgvector: true
        },
        orderBy: {
          chunk_index: 'asc'
        }
      })

      if (!targetDocument?.vector_embedding_pgvector) {
        throw new AppError('Document vector not found', 404)
      }

      // 使用文檔向量進行相似度搜索
      const searchQuery = this.buildSimilarityQuery(
        targetDocument.vector_embedding_pgvector as any,
        options,
        documentId
      )

      const startTime = Date.now()
      const rawResults = await this.executeSearch(searchQuery)
      const results = this.processResults(rawResults, options)

      return {
        results,
        metadata: {
          totalFound: results.length,
          queryTime: Date.now() - startTime,
          indexUsed: this.getIndexName(options.distanceMetric || this.DEFAULT_METRIC),
          distanceMetric: options.distanceMetric || this.DEFAULT_METRIC,
          threshold: options.threshold || this.DEFAULT_THRESHOLD,
          hasMore: results.length === (options.limit || this.DEFAULT_LIMIT)
        }
      }

    } catch (error) {
      console.error('Similar documents search error:', error)
      throw new AppError('Similar documents search failed', 500, { originalError: error })
    }
  }

  /**
   * 混合搜索（向量 + 文本）
   */
  async hybridSearch(
    options: PgVectorSearchOptions & { textWeight?: number; vectorWeight?: number }
  ): Promise<PgVectorSearchResult> {
    const textWeight = options.textWeight || 0.3
    const vectorWeight = options.vectorWeight || 0.7

    try {
      // 1. 執行向量搜索
      const vectorResults = await this.search(options)

      // 2. 執行文本搜索
      const textResults = await this.performTextSearch(
        options.query,
        options.category,
        options.tags,
        options.limit || this.DEFAULT_LIMIT
      )

      // 3. 合併和重新評分
      const hybridResults = this.mergeHybridResults(
        vectorResults.results,
        textResults,
        vectorWeight,
        textWeight
      )

      return {
        results: hybridResults.slice(0, options.limit || this.DEFAULT_LIMIT),
        metadata: {
          ...vectorResults.metadata,
          totalFound: hybridResults.length,
          indexUsed: 'hybrid'
        }
      }

    } catch (error) {
      console.error('Hybrid search error:', error)
      throw new AppError('Hybrid search failed', 500, { originalError: error })
    }
  }

  /**
   * 生成查詢向量嵌入
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const embedding = await generateEmbedding(query)

      if (!embedding || !embedding.embedding || !Array.isArray(embedding.embedding)) {
        throw new Error('Invalid embedding response')
      }

      return embedding.embedding
    } catch (error) {
      console.error('Failed to generate query embedding:', error)
      throw new AppError('Failed to generate query embedding', 500)
    }
  }

  /**
   * 構建搜索查詢
   */
  private buildSearchQuery(options: PgVectorSearchOptions, queryEmbedding: number[]): string {
    const distanceOp = DISTANCE_OPERATORS[options.distanceMetric || this.DEFAULT_METRIC]
    const threshold = options.threshold || this.DEFAULT_THRESHOLD
    const limit = options.limit || this.DEFAULT_LIMIT
    const offset = options.offset || 0

    // 基礎查詢
    let query = `
      SELECT
        kb.id,
        kb.title,
        kb.content,
        kb.category,
        kb.status,
        kb.author,
        kb.created_at,
        kb.updated_at,
        kc.id as chunk_id,
        kc.content as chunk_content,
        kc.chunk_index,
        kc.vector_embedding_pgvector ${distanceOp} $1 as distance,
        1 - (kc.vector_embedding_pgvector ${distanceOp} $1) as similarity,
        creator.id as creator_id,
        creator.first_name as creator_first_name,
        creator.last_name as creator_last_name
      FROM knowledge_chunks kc
      JOIN knowledge_base kb ON kc.knowledge_base_id = kb.id
      LEFT JOIN users creator ON kb.created_by = creator.id
      WHERE kb.status IN ('ACTIVE', 'DRAFT')
      AND kc.vector_embedding_pgvector IS NOT NULL
    `

    const params: any[] = [JSON.stringify(queryEmbedding)]
    let paramIndex = 2

    // 添加距離閾值過濾
    query += ` AND kc.vector_embedding_pgvector ${distanceOp} $1 < $${paramIndex}`
    params.push(threshold)
    paramIndex++

    // 添加分類過濾
    if (options.category) {
      query += ` AND kb.category = $${paramIndex}`
      params.push(options.category)
      paramIndex++
    }

    // 添加標籤過濾
    if (options.tags && options.tags.length > 0) {
      query += `
        AND EXISTS (
          SELECT 1 FROM knowledge_base_knowledge_tags kbt
          JOIN knowledge_tags kt ON kbt.knowledge_tag_id = kt.id
          WHERE kbt.knowledge_base_id = kb.id
          AND kt.name = ANY($${paramIndex})
        )
      `
      params.push(options.tags)
      paramIndex++
    }

    // 添加日期範圍過濾
    if (options.dateRange?.from) {
      query += ` AND kb.updated_at >= $${paramIndex}`
      params.push(options.dateRange.from)
      paramIndex++
    }

    if (options.dateRange?.to) {
      query += ` AND kb.updated_at <= $${paramIndex}`
      params.push(options.dateRange.to)
      paramIndex++
    }

    // 排序和分頁
    query += `
      ORDER BY kc.vector_embedding_pgvector ${distanceOp} $1
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limit, offset)

    return prisma.$queryRawUnsafe(query, ...params) as any
  }

  /**
   * 構建相似度查詢
   */
  private buildSimilarityQuery(
    targetVector: any,
    options: Omit<PgVectorSearchOptions, 'query'>,
    excludeDocumentId: number
  ): string {
    const distanceOp = DISTANCE_OPERATORS[options.distanceMetric || this.DEFAULT_METRIC]
    const threshold = options.threshold || this.DEFAULT_THRESHOLD
    const limit = options.limit || this.DEFAULT_LIMIT

    const query = `
      SELECT
        kb.id,
        kb.title,
        kb.content,
        kb.category,
        kb.status,
        kb.author,
        kb.created_at,
        kb.updated_at,
        kc.id as chunk_id,
        kc.content as chunk_content,
        kc.chunk_index,
        kc.vector_embedding_pgvector ${distanceOp} $1 as distance,
        1 - (kc.vector_embedding_pgvector ${distanceOp} $1) as similarity
      FROM knowledge_chunks kc
      JOIN knowledge_base kb ON kc.knowledge_base_id = kb.id
      WHERE kb.status = 'ACTIVE'
      AND kc.vector_embedding_pgvector IS NOT NULL
      AND kb.id != $2
      AND kc.vector_embedding_pgvector ${distanceOp} $1 < $3
      ORDER BY kc.vector_embedding_pgvector ${distanceOp} $1
      LIMIT $4
    `

    return prisma.$queryRawUnsafe(query, targetVector, excludeDocumentId, threshold, limit) as any
  }

  /**
   * 執行搜索查詢
   */
  private async executeSearch(queryPromise: any): Promise<any[]> {
    try {
      return await queryPromise
    } catch (error) {
      console.error('Database query execution error:', error)
      throw new AppError('Database query failed', 500, { originalError: error })
    }
  }

  /**
   * 處理搜索結果
   */
  private processResults(rawResults: any[], options: PgVectorSearchOptions): SearchResult[] {
    // 按知識庫分組，每個知識庫只保留最佳匹配的分塊
    const groupedResults = new Map<number, any>()

    rawResults.forEach(row => {
      const kbId = row.id
      if (!groupedResults.has(kbId) ||
          groupedResults.get(kbId).distance > row.distance) {
        groupedResults.set(kbId, row)
      }
    })

    // 轉換為 SearchResult 格式
    return Array.from(groupedResults.values()).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      similarity: Number(row.similarity || (1 - Number(row.distance))),
      relevanceScore: Number(row.similarity || (1 - Number(row.distance))),
      category: row.category,
      status: row.status,
      author: row.author,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: row.creator_id ? {
        id: row.creator_id,
        firstName: row.creator_first_name,
        lastName: row.creator_last_name
      } : undefined,
      bestChunk: {
        id: row.chunk_id,
        content: row.chunk_content,
        chunkIndex: row.chunk_index,
        similarityScore: Number(row.similarity || (1 - Number(row.distance)))
      },
      searchMetadata: {
        searchType: 'pgvector',
        originalSimilarity: Number(row.similarity || (1 - Number(row.distance))),
        distance: Number(row.distance)
      }
    }))
  }

  /**
   * 執行文本搜索（用於混合搜索）
   */
  private async performTextSearch(
    query: string,
    category?: DocumentCategory,
    tags?: string[],
    limit: number = 10
  ): Promise<any[]> {
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
        }
      },
      orderBy: [
        { updated_at: 'desc' }
      ],
      take: limit
    })

    return results.map(result => ({
      ...result,
      search_score: this.calculateTextScore(result, query),
      search_type: 'text'
    }))
  }

  /**
   * 計算文本相關性分數
   */
  private calculateTextScore(item: any, query: string): number {
    const queryLower = query.toLowerCase()
    let score = 0

    if (item.title.toLowerCase().includes(queryLower)) {
      score += 10
    }

    if (item.content && item.content.toLowerCase().includes(queryLower)) {
      score += 5
    }

    if (item.author && item.author.toLowerCase().includes(queryLower)) {
      score += 2
    }

    return Math.min(score / 17, 1) // 正規化到 0-1 範圍
  }

  /**
   * 合併混合搜索結果
   */
  private mergeHybridResults(
    vectorResults: SearchResult[],
    textResults: any[],
    vectorWeight: number,
    textWeight: number
  ): SearchResult[] {
    const mergedMap = new Map<number, SearchResult>()

    // 添加向量搜索結果
    vectorResults.forEach(result => {
      const hybridScore = result.similarity * vectorWeight
      mergedMap.set(result.id, {
        ...result,
        relevanceScore: hybridScore,
        searchMetadata: {
          ...result.searchMetadata,
          hybridScore,
          vectorScore: result.similarity,
          vectorWeight
        }
      })
    })

    // 添加文本搜索結果
    textResults.forEach(result => {
      const textScore = result.search_score
      const existingResult = mergedMap.get(result.id)

      if (existingResult) {
        // 合併分數
        const hybridScore = (existingResult.searchMetadata?.vectorScore || 0) * vectorWeight + textScore * textWeight
        existingResult.relevanceScore = hybridScore
        existingResult.searchMetadata = {
          ...existingResult.searchMetadata,
          hybridScore,
          textScore,
          textWeight,
          searchType: 'hybrid'
        }
      } else {
        // 新結果（僅文本匹配）
        const hybridScore = textScore * textWeight
        mergedMap.set(result.id, {
          id: result.id,
          title: result.title,
          content: result.content,
          similarity: textScore,
          relevanceScore: hybridScore,
          category: result.category,
          status: result.status,
          author: result.author,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
          creator: result.creator,
          tags: result.tags,
          searchMetadata: {
            searchType: 'text_only',
            hybridScore,
            textScore,
            textWeight
          }
        })
      }
    })

    return Array.from(mergedMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * 獲取索引名稱
   */
  private getIndexName(distanceMetric: string): string {
    switch (distanceMetric) {
      case 'cosine':
        return 'idx_chunks_vector_hnsw_cosine'
      case 'euclidean':
        return 'idx_chunks_vector_hnsw_l2'
      case 'inner_product':
        return 'idx_chunks_vector_hnsw_inner'
      default:
        return 'idx_chunks_vector_hnsw_cosine'
    }
  }

  /**
   * 驗證搜索選項
   */
  private validateOptions(options: PgVectorSearchOptions): void {
    if (!options.query || options.query.trim().length === 0) {
      throw new AppError('Search query cannot be empty', 400)
    }

    if (options.limit !== undefined && (options.limit < 1 || options.limit > 100)) {
      throw new AppError('Limit must be between 1 and 100', 400)
    }

    if (options.threshold !== undefined && (options.threshold < 0 || options.threshold > 2)) {
      throw new AppError('Threshold must be between 0 and 2', 400)
    }

    if (options.offset !== undefined && options.offset < 0) {
      throw new AppError('Offset must be non-negative', 400)
    }
  }
}

// 導出單例實例
export const pgVectorSearchService = new PgVectorSearchService()

// 便利函數
export async function searchWithPgVector(
  options: PgVectorSearchOptions
): Promise<PgVectorSearchResult> {
  return pgVectorSearchService.search(options)
}

export async function findSimilarDocuments(
  documentId: number,
  options: Omit<PgVectorSearchOptions, 'query'> = {}
): Promise<PgVectorSearchResult> {
  return pgVectorSearchService.findSimilarDocuments(documentId, options)
}

export async function hybridSearchWithPgVector(
  options: PgVectorSearchOptions & { textWeight?: number; vectorWeight?: number }
): Promise<PgVectorSearchResult> {
  return pgVectorSearchService.hybridSearch(options)
}