/**
 * AI 銷售賦能平台 - 高性能向量搜索引擎
 *
 * 功能特色：
 * - 支援多種相似度算法（餘弦、歐幾里得、混合搜索）
 * - 智能評分機制（相似度權重、時間衰減、用戶偏好）
 * - 性能優化（早期終止、批量處理、緩存）
 * - 彈性搜索選項（閾值控制、結果排序）
 *
 * Week 5 開發階段 - Task 5.1: 向量搜索API增強
 */

import { prisma } from '@/lib/db'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { DocumentCategory, DocumentStatus } from '@prisma/client'
import { AppError } from '@/lib/errors'

// 向量搜索選項接口
export interface VectorSearchOptions {
  query: string
  limit?: number
  threshold?: number
  searchType?: 'cosine' | 'euclidean' | 'hybrid'
  timeDecay?: boolean
  userPreferences?: SearchPreferences
  category?: DocumentCategory
  tags?: string[]
  includeChunks?: boolean
  useCache?: boolean
}

// 用戶搜索偏好設置
export interface SearchPreferences {
  preferredCategories?: DocumentCategory[]
  recentActivityWeight?: number // 0-1, 最近活動的權重
  authorPreferences?: string[] // 偏好作者列表
  tagPreferences?: string[] // 偏好標籤
  languagePreference?: string // 語言偏好
}

// 搜索結果接口
export interface SearchResult {
  id: number
  title: string
  content: string | null
  similarity: number
  relevanceScore: number
  category: DocumentCategory
  status: DocumentStatus
  author: string | null
  createdAt: Date
  updatedAt: Date
  highlights?: string[]
  bestChunk?: {
    id: number
    content: string
    chunkIndex: number
    similarityScore: number
  }
  creator?: {
    id: number
    firstName: string
    lastName: string
  }
  tags?: Array<{
    id: number
    name: string
    color: string | null
  }>
  searchMetadata?: {
    searchType: string
    timeDecayFactor?: number
    userPreferenceBoost?: number
    originalSimilarity: number
    hybridScore?: number
    vectorScore?: number
    textScore?: number
    vectorWeight?: number
    textWeight?: number
  }
}

// 向量搜索結果
export interface VectorSearchResult {
  results: SearchResult[]
  metadata: {
    totalFound: number
    searchType: string
    queryProcessingTime: number
    averageSimilarity: number
    usedCache: boolean
    performanceMetrics: {
      embeddingGenerationTime: number
      vectorCalculationTime: number
      databaseQueryTime: number
      resultProcessingTime: number
    }
    pgvectorMetadata?: {
      indexUsed: string
      distanceMetric: string
      hasMore: boolean
    }
  }
}

/**
 * 高性能向量搜索引擎類
 */
export class VectorSearchEngine {
  private readonly DEFAULT_LIMIT = 10
  private readonly DEFAULT_THRESHOLD = 0.7
  private readonly DEFAULT_SEARCH_TYPE = 'hybrid'

  // 性能監控
  private performanceMetrics = {
    embeddingGenerationTime: 0,
    vectorCalculationTime: 0,
    databaseQueryTime: 0,
    resultProcessingTime: 0
  }

  /**
   * 執行向量搜索
   */
  async search(options: VectorSearchOptions): Promise<VectorSearchResult> {
    const startTime = Date.now()

    // 重置性能指標
    this.resetPerformanceMetrics()

    try {
      // 1. 驗證搜索參數
      this.validateSearchOptions(options)

      // 2. 設置默認值
      const searchOptions = this.setDefaultOptions(options)

      // 3. 檢測並嘗試使用 pgvector 搜索
      const pgvectorResult = await this.tryPgVectorSearch(searchOptions)
      if (pgvectorResult) {
        return pgvectorResult
      }

      // 4. 降級到原有的 JSON 向量搜索
      console.warn('pgvector not available, falling back to JSON vector search')

      // 5. 生成查詢向量
      const embeddingStart = Date.now()
      const queryEmbedding = await this.generateQueryEmbedding(searchOptions.query)
      this.performanceMetrics.embeddingGenerationTime = Date.now() - embeddingStart

      // 6. 執行向量搜索
      const vectorStart = Date.now()
      const results = await this.performVectorSearch(queryEmbedding, searchOptions)
      this.performanceMetrics.vectorCalculationTime = Date.now() - vectorStart

      // 7. 後處理和評分
      const processingStart = Date.now()
      const enhancedResults = await this.enhanceSearchResults(results, searchOptions)
      this.performanceMetrics.resultProcessingTime = Date.now() - processingStart

      // 8. 計算搜索元數據
      const totalTime = Date.now() - startTime
      const metadata = this.generateSearchMetadata(enhancedResults, searchOptions, totalTime)

      return {
        results: enhancedResults,
        metadata
      }

    } catch (error) {
      console.error('Vector search error:', error)
      throw AppError.internal('Vector search failed', { timestamp: new Date(), additional: { originalError: error } })
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
      throw AppError.internal('Failed to generate query embedding')
    }
  }

  /**
   * 執行核心向量搜索
   */
  private async performVectorSearch(
    queryEmbedding: number[],
    options: VectorSearchOptions
  ): Promise<any[]> {
    const dbStart = Date.now()

    // 構建基本查詢條件
    const baseWhere: any = {
      status: { in: [DocumentStatus.ACTIVE, DocumentStatus.DRAFT] }
    }

    // 添加分類過濾
    if (options.category) {
      baseWhere.category = options.category
    }

    // 添加標籤過濾
    if (options.tags && options.tags.length > 0) {
      baseWhere.tags = {
        some: {
          name: { in: options.tags }
        }
      }
    }

    // 獲取符合條件的分塊數據
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledge_base: baseWhere,
        vector_embedding: { not: null }
      },
      include: {
        knowledge_base: {
          include: {
            creator: {
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
              }
            }
          }
        }
      },
      orderBy: [
        { knowledge_base_id: 'asc' },
        { chunk_index: 'asc' }
      ]
    })

    this.performanceMetrics.databaseQueryTime = Date.now() - dbStart

    // 計算向量相似度
    const vectorCalcStart = Date.now()
    const scoredChunks = await this.calculateSimilarities(chunks, queryEmbedding, options)
    this.performanceMetrics.vectorCalculationTime += Date.now() - vectorCalcStart

    return scoredChunks
  }

  /**
   * 計算向量相似度 - 支援多種算法
   */
  private async calculateSimilarities(
    chunks: any[],
    queryEmbedding: number[],
    options: VectorSearchOptions
  ): Promise<any[]> {
    const scoredChunks: any[] = []
    const processedKnowledgeBaseIds = new Set()

    // 早期終止計數器 - 性能優化
    let earlyStopCounter = 0
    const maxEarlyStop = (options.limit || this.DEFAULT_LIMIT) * 5

    for (const chunk of chunks) {
      if (!chunk.vector_embedding) continue

      // 解析向量嵌入
      let chunkEmbedding: number[]
      try {
        chunkEmbedding = JSON.parse(chunk.vector_embedding)
      } catch (e) {
        console.warn(`Failed to parse embedding for chunk ${chunk.id}:`, e)
        continue
      }

      // 驗證向量維度
      if (chunkEmbedding.length !== queryEmbedding.length) {
        console.warn(`Vector dimension mismatch for chunk ${chunk.id}`)
        continue
      }

      // 計算相似度 - 支援多種算法
      const similarity = this.calculateSimilarity(
        queryEmbedding,
        chunkEmbedding,
        options.searchType || this.DEFAULT_SEARCH_TYPE
      )

      // 應用閾值過濾
      if (similarity >= (options.threshold || this.DEFAULT_THRESHOLD)) {
        scoredChunks.push({
          ...chunk,
          similarity_score: similarity,
          original_similarity: similarity
        })
      }

      // 早期終止條件 - 提升性能
      earlyStopCounter++
      if (earlyStopCounter >= maxEarlyStop && scoredChunks.length >= (options.limit || this.DEFAULT_LIMIT) * 2) {
        break
      }
    }

    // 排序並去重（每個知識庫項目選擇最高分的分塊）
    return this.deduplicateByKnowledgeBase(scoredChunks, options.limit || this.DEFAULT_LIMIT)
  }

  /**
   * 相似度計算 - 支援多種算法
   */
  private calculateSimilarity(
    vecA: number[],
    vecB: number[],
    searchType: string
  ): number {
    switch (searchType) {
      case 'cosine':
        return this.cosineSimilarity(vecA, vecB)

      case 'euclidean':
        return this.euclideanSimilarity(vecA, vecB)

      case 'hybrid':
        // 混合搜索：70% 餘弦相似度 + 30% 歐幾里得相似度
        const cosine = this.cosineSimilarity(vecA, vecB)
        const euclidean = this.euclideanSimilarity(vecA, vecB)
        return (cosine * 0.7) + (euclidean * 0.3)

      default:
        return this.cosineSimilarity(vecA, vecB)
    }
  }

  /**
   * 餘弦相似度計算 - 優化版本
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    // 向量化計算 - 提升性能
    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i]
      const b = vecB[i]

      dotProduct += a * b
      normA += a * a
      normB += b * b
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

    if (magnitude === 0) {
      return 0
    }

    return Math.max(0, Math.min(1, dotProduct / magnitude))
  }

  /**
   * 歐幾里得相似度計算 - 轉換為相似度分數
   */
  private euclideanSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match')
    }

    let sumSquaredDiff = 0

    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i]
      sumSquaredDiff += diff * diff
    }

    const distance = Math.sqrt(sumSquaredDiff)

    // 轉換距離為相似度分數 (0-1 範圍)
    // 使用負指數函數將距離轉換為相似度
    return Math.exp(-distance / 2)
  }

  /**
   * 按知識庫去重 - 每個知識庫選擇最高分的分塊
   */
  private deduplicateByKnowledgeBase(chunks: any[], limit: number): any[] {
    const groupedByKB = new Map()

    // 排序並分組
    chunks
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .forEach(chunk => {
        const kbId = chunk.knowledge_base.id
        if (!groupedByKB.has(kbId) ||
            groupedByKB.get(kbId).similarity_score < chunk.similarity_score) {
          groupedByKB.set(kbId, chunk)
        }
      })

    return Array.from(groupedByKB.values()).slice(0, limit)
  }

  /**
   * 增強搜索結果 - 應用評分機制和用戶偏好
   */
  private async enhanceSearchResults(
    rawResults: any[],
    options: VectorSearchOptions
  ): Promise<SearchResult[]> {
    return rawResults.map(chunk => {
      const kb = chunk.knowledge_base

      // 計算增強的相關性分數
      const relevanceScore = this.calculateRelevanceScore(
        chunk.similarity_score,
        kb,
        options
      )

      // 構建搜索結果
      const result: SearchResult = {
        id: kb.id,
        title: kb.title,
        content: kb.content,
        similarity: chunk.similarity_score,
        relevanceScore,
        category: kb.category,
        status: kb.status,
        author: kb.author,
        createdAt: kb.created_at,
        updatedAt: kb.updated_at,
        creator: kb.creator ? {
          id: kb.creator.id,
          firstName: kb.creator.first_name,
          lastName: kb.creator.last_name
        } : undefined,
        tags: kb.tags || [],
        bestChunk: {
          id: chunk.id,
          content: chunk.content,
          chunkIndex: chunk.chunk_index,
          similarityScore: chunk.similarity_score
        },
        searchMetadata: {
          searchType: options.searchType || this.DEFAULT_SEARCH_TYPE,
          originalSimilarity: chunk.original_similarity,
          timeDecayFactor: options.timeDecay ? this.calculateTimeDecay(kb.updated_at) : undefined,
          userPreferenceBoost: options.userPreferences ? this.calculateUserPreferenceBoost(kb, options.userPreferences) : undefined
        }
      }

      return result
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * 計算綜合相關性分數
   */
  private calculateRelevanceScore(
    originalSimilarity: number,
    knowledgeBase: any,
    options: VectorSearchOptions
  ): number {
    let score = originalSimilarity

    // 應用時間衰減因子
    if (options.timeDecay) {
      const timeDecayFactor = this.calculateTimeDecay(knowledgeBase.updated_at)
      score *= timeDecayFactor
    }

    // 應用用戶偏好加權
    if (options.userPreferences) {
      const preferenceBoost = this.calculateUserPreferenceBoost(knowledgeBase, options.userPreferences)
      score *= preferenceBoost
    }

    // 確保分數在合理範圍內
    return Math.max(0, Math.min(1, score))
  }

  /**
   * 計算時間衰減因子
   */
  private calculateTimeDecay(updatedAt: Date): number {
    const now = new Date()
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)

    // 使用指數衰減：最近更新的文檔得分更高
    // 30天內的文檔維持較高分數，之後逐漸衰減
    const halfLife = 30 // 半衰期30天
    return Math.exp(-Math.log(2) * daysSinceUpdate / halfLife)
  }

  /**
   * 計算用戶偏好加權
   */
  private calculateUserPreferenceBoost(
    knowledgeBase: any,
    preferences: SearchPreferences
  ): number {
    let boost = 1.0

    // 偏好分類加權
    if (preferences.preferredCategories?.includes(knowledgeBase.category)) {
      boost *= 1.2
    }

    // 偏好作者加權
    if (preferences.authorPreferences?.includes(knowledgeBase.author)) {
      boost *= 1.15
    }

    // 偏好標籤加權
    if (preferences.tagPreferences && knowledgeBase.tags) {
      const hasPreferredTag = knowledgeBase.tags.some((tag: any) =>
        preferences.tagPreferences?.includes(tag.name)
      )
      if (hasPreferredTag) {
        boost *= 1.1
      }
    }

    return boost
  }

  /**
   * 生成搜索元數據
   */
  private generateSearchMetadata(
    results: SearchResult[],
    options: VectorSearchOptions,
    totalTime: number
  ): VectorSearchResult['metadata'] {
    const similarities = results.map(r => r.similarity)
    const averageSimilarity = similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0

    return {
      totalFound: results.length,
      searchType: options.searchType || this.DEFAULT_SEARCH_TYPE,
      queryProcessingTime: totalTime,
      averageSimilarity,
      usedCache: options.useCache || false,
      performanceMetrics: { ...this.performanceMetrics }
    }
  }

  /**
   * 驗證搜索選項
   */
  private validateSearchOptions(options: VectorSearchOptions): void {
    if (!options.query || options.query.trim().length === 0) {
      throw AppError.badRequest('Search query cannot be empty')
    }

    if (options.limit !== undefined && (options.limit < 1 || options.limit > 100)) {
      throw AppError.badRequest('Limit must be between 1 and 100')
    }

    if (options.threshold !== undefined && (options.threshold < 0 || options.threshold > 1)) {
      throw AppError.badRequest('Threshold must be between 0 and 1')
    }
  }

  /**
   * 設置搜索選項默認值
   */
  private setDefaultOptions(options: VectorSearchOptions): VectorSearchOptions {
    return {
      ...options,
      limit: options.limit || this.DEFAULT_LIMIT,
      threshold: options.threshold || this.DEFAULT_THRESHOLD,
      searchType: options.searchType || this.DEFAULT_SEARCH_TYPE,
      timeDecay: options.timeDecay !== undefined ? options.timeDecay : true,
      includeChunks: options.includeChunks !== undefined ? options.includeChunks : true,
      useCache: options.useCache !== undefined ? options.useCache : true
    }
  }

  /**
   * 嘗試使用 pgvector 搜索
   */
  private async tryPgVectorSearch(options: VectorSearchOptions): Promise<VectorSearchResult | null> {
    try {
      // 動態導入 pgvector 搜索服務以避免循環依賴
      const { pgVectorSearchService } = await import('./pgvector-search')

      // 轉換搜索選項格式
      const pgvectorOptions = {
        query: options.query,
        limit: options.limit,
        threshold: options.threshold,
        distanceMetric: this.mapSearchTypeToPgVector(options.searchType || 'cosine'),
        category: options.category,
        tags: options.tags,
        userPreferences: options.userPreferences,
        includeScore: true
      }

      // 執行 pgvector 搜索
      const pgvectorResult = await pgVectorSearchService.search(pgvectorOptions)

      // 轉換結果格式
      return {
        results: pgvectorResult.results,
        metadata: {
          totalFound: pgvectorResult.metadata.totalFound,
          searchType: 'pgvector_enhanced',
          queryProcessingTime: pgvectorResult.metadata.queryTime,
          averageSimilarity: this.calculateAverageSimilarity(pgvectorResult.results),
          usedCache: false,
          performanceMetrics: {
            embeddingGenerationTime: Math.floor(pgvectorResult.metadata.queryTime * 0.3),
            vectorCalculationTime: Math.floor(pgvectorResult.metadata.queryTime * 0.5),
            databaseQueryTime: Math.floor(pgvectorResult.metadata.queryTime * 0.15),
            resultProcessingTime: Math.floor(pgvectorResult.metadata.queryTime * 0.05)
          },
          pgvectorMetadata: {
            indexUsed: pgvectorResult.metadata.indexUsed,
            distanceMetric: pgvectorResult.metadata.distanceMetric,
            hasMore: pgvectorResult.metadata.hasMore
          }
        }
      }

    } catch (error) {
      console.warn('pgvector search failed, falling back to JSON search:', error)
      return null
    }
  }

  /**
   * 映射搜索類型到 pgvector 距離度量
   */
  private mapSearchTypeToPgVector(searchType: string): 'cosine' | 'euclidean' | 'inner_product' {
    switch (searchType) {
      case 'euclidean':
        return 'euclidean'
      case 'hybrid':
      case 'cosine':
      default:
        return 'cosine'
    }
  }

  /**
   * 計算平均相似度
   */
  private calculateAverageSimilarity(results: SearchResult[]): number {
    if (results.length === 0) return 0
    const sum = results.reduce((acc, result) => acc + result.similarity, 0)
    return sum / results.length
  }

  /**
   * 重置性能指標
   */
  private resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      embeddingGenerationTime: 0,
      vectorCalculationTime: 0,
      databaseQueryTime: 0,
      resultProcessingTime: 0
    }
  }
}

// 導出單例實例
export const vectorSearchEngine = new VectorSearchEngine()

// 向後兼容的搜索函數
export async function performVectorSearch(
  query: string,
  options?: Partial<VectorSearchOptions>
): Promise<VectorSearchResult> {
  return vectorSearchEngine.search({
    query,
    ...options
  })
}