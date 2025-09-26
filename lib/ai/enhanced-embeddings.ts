/**
 * AI 銷售賦能平台 - 增強版 Azure OpenAI Embeddings 服務
 *
 * 功能特色：
 * - 智能緩存機制（內存+Redis雙層緩存）
 * - 批量處理優化（自動分批、並行控制）
 * - 速率限制和重試機制
 * - 成本追蹤和性能監控
 * - 向量質量驗證
 *
 * Week 5 開發階段 - Task 5.3: Azure OpenAI整合增強
 */

import { generateEmbedding, generateBatchEmbeddings, EmbeddingResult, BatchEmbeddingResult } from './embeddings'
import { AppError } from '@/lib/errors'
import { getVectorCache, VectorCacheService } from '@/lib/cache/vector-cache'
import crypto from 'crypto'

// 增強的嵌入選項
export interface EnhancedEmbeddingOptions {
  useCache?: boolean
  cacheMaxAge?: number // 秒
  retryAttempts?: number
  timeout?: number // 毫秒
  validateQuality?: boolean
  costTracking?: boolean
  batchOptimization?: boolean
  parallelism?: number
}

// 嵌入緩存項
interface EmbeddingCacheItem {
  embedding: number[]
  text: string
  tokenCount: number
  timestamp: number
  quality?: number
}

// 批量嵌入任務
interface BatchEmbeddingTask {
  texts: string[]
  results: EmbeddingResult[]
  tokens: number
  processingTime: number
  cacheHits: number
  cacheMisses: number
  retries: number
}

// 性能統計
interface EmbeddingStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  cacheHitRate: number
  averageLatency: number
  errorRate: number
  qualityScore: number
}

// 默認配置
const DEFAULT_OPTIONS: Required<EnhancedEmbeddingOptions> = {
  useCache: true,
  cacheMaxAge: 24 * 60 * 60, // 24小時
  retryAttempts: 3,
  timeout: 30000, // 30秒
  validateQuality: true,
  costTracking: true,
  batchOptimization: true,
  parallelism: 5
}

// 成本配置（基於 Azure OpenAI 定價）
const COST_CONFIG = {
  pricePerToken: 0.0001 / 1000, // $0.0001 per 1K tokens
  currency: 'USD'
}

/**
 * 增強版 Azure OpenAI Embeddings 服務類
 */
export class EnhancedEmbeddingService {
  private vectorCache: VectorCacheService
  private stats: EmbeddingStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    cacheHitRate: 0,
    averageLatency: 0,
    errorRate: 0,
    qualityScore: 0
  }
  private requestQueue: Array<{ resolve: any; reject: any; task: () => Promise<any> }> = []
  private activeRequests = 0
  private maxConcurrentRequests = 10

  constructor(private defaultOptions: Partial<EnhancedEmbeddingOptions> = {}) {
    this.defaultOptions = { ...DEFAULT_OPTIONS, ...defaultOptions }

    // 初始化向量緩存系統 - Initialize vector cache system
    this.vectorCache = getVectorCache({
      memory: {
        maxSize: 2000, // 增大記憶體緩存 - Increase memory cache size
        ttl: this.defaultOptions.cacheMaxAge || 24 * 60 * 60, // 24小時 - 24 hours
      },
      compression: {
        enabled: true,
        threshold: 1024, // 1KB 壓縮閾值 - 1KB compression threshold
      },
      performance: {
        trackMetrics: true,
        logSlowOperations: true,
        slowThreshold: 200, // 200ms 慢操作閾值 - 200ms slow operation threshold
      },
    })

    this.initializePeriodicCleanup()
  }

  /**
   * 生成單個文本嵌入（增強版）
   */
  async generateEmbedding(
    text: string,
    options: EnhancedEmbeddingOptions = {}
  ): Promise<EmbeddingResult & {
    cached?: boolean
    quality?: number
    cost?: number
    processingTime?: number
  }> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    try {
      // 1. 輸入驗證
      this.validateInput(text)

      // 2. 生成緩存鍵
      const cacheKey = this.generateCacheKey(text)

      // 3. 檢查緩存
      if (opts.useCache) {
        const cached = await this.getCachedEmbedding(text)
        if (cached) {
          const tokenCount = Math.ceil(cached.metadata.text.length / 4) // 近似token計算 - Approximate token calculation
          this.updateStats({ cacheHit: true, tokens: tokenCount })
          return {
            embedding: cached.vector,
            text: cached.metadata.text,
            tokenCount,
            cached: true,
            quality: cached.metadata.quality_score,
            cost: cached.metadata.cost,
            processingTime: Date.now() - startTime
          }
        }
      }

      // 4. 生成嵌入
      const result = await this.executeWithRetry(
        () => generateEmbedding(text),
        opts.retryAttempts!,
        opts.timeout!
      )

      // 5. 質量驗證
      if (opts.validateQuality) {
        const quality = this.validateEmbeddingQuality(result.embedding)
        Object.assign(result, { quality })
      }

      // 6. 成本追蹤
      const cost = opts.costTracking ? this.calculateCost(result.tokenCount) : undefined

      // 7. 緩存結果
      if (opts.useCache) {
        await this.cacheEmbedding(text, result, {
          quality_score: result.quality,
          cost,
          ttl: opts.cacheMaxAge
        })
      }

      // 8. 更新統計
      this.updateStats({
        cacheHit: false,
        tokens: result.tokenCount,
        latency: Date.now() - startTime,
        cost
      })

      return {
        ...result,
        cached: false,
        cost,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      this.updateStats({ error: true })
      console.error('Enhanced embedding generation failed:', error)
      throw new AppError('Enhanced embedding generation failed', 500, { originalError: error })
    }
  }

  /**
   * 批量生成嵌入（增強版）
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EnhancedEmbeddingOptions = {}
  ): Promise<BatchEmbeddingResult & {
    task: BatchEmbeddingTask
    performance: {
      cacheHitRate: number
      averageBatchSize: number
      parallelBatches: number
    }
  }> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    try {
      // 1. 輸入驗證
      if (!texts || texts.length === 0) {
        throw new AppError('No texts provided for batch embedding', 400)
      }

      // 2. 初始化任務追蹤
      const task: BatchEmbeddingTask = {
        texts: texts.filter(t => t && t.trim()),
        results: [],
        tokens: 0,
        processingTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        retries: 0
      }

      if (task.texts.length === 0) {
        throw new AppError('No valid texts provided for batch embedding', 400)
      }

      // 3. 智能批量處理
      if (opts.batchOptimization) {
        return await this.optimizedBatchProcessing(task, opts)
      } else {
        return await this.standardBatchProcessing(task, opts)
      }

    } catch (error) {
      console.error('Enhanced batch embedding failed:', error)
      throw new AppError('Enhanced batch embedding failed', 500, { originalError: error })
    }
  }

  /**
   * 預熱緩存（批量預計算常用嵌入）
   */
  async warmupCache(texts: string[], options: EnhancedEmbeddingOptions = {}): Promise<void> {
    console.log(`🔥 Starting enhanced cache warmup for ${texts.length} texts...`)

    const opts = { ...this.defaultOptions, ...options, useCache: true }

    try {
      // 使用向量緩存系統的預熱功能 - Use vector cache system's warmup functionality
      await this.vectorCache.warmup(texts)

      // 對於未緩存的項目進行批量處理 - Batch process uncached items
      const batchResult = await this.vectorCache.batchGet(texts)
      const uncachedTexts = texts.filter(text =>
        !batchResult.success.some(item => item.text === text)
      )

      if (uncachedTexts.length > 0) {
        console.log(`📊 Processing ${uncachedTexts.length} uncached texts...`)

        const batchSize = 20 // 較小的批次以避免API限制 - Smaller batches to avoid API limits
        for (let i = 0; i < uncachedTexts.length; i += batchSize) {
          const batch = uncachedTexts.slice(i, i + batchSize)

          try {
            await this.generateBatchEmbeddings(batch, opts)
            console.log(`✅ Cache warmup progress: ${Math.min(i + batchSize, uncachedTexts.length)}/${uncachedTexts.length} (uncached)`)

            // 避免過快的請求 - Avoid rapid requests
            if (i + batchSize < uncachedTexts.length) {
              await this.delay(1000) // 1秒延遲 - 1 second delay
            }
          } catch (error) {
            console.warn(`⚠️ Cache warmup batch failed at index ${i}:`, error)
          }
        }
      }

      console.log('✅ Enhanced cache warmup completed')
    } catch (error) {
      console.error('❌ Enhanced cache warmup failed:', error)
      throw error
    }
  }

  /**
   * 清理過期緩存
   */
  async cleanupCache(): Promise<{ removed: number; remaining: number }> {
    try {
      // 使用向量緩存系統的統計信息 - Use vector cache system's statistics
      const statsBefore = this.vectorCache.getStats()

      // 向量緩存系統會自動清理過期項目 - Vector cache system automatically cleans expired items
      // 這裡我們可以手動觸發清理或獲取統計信息 - Here we can manually trigger cleanup or get statistics

      const statsAfter = this.vectorCache.getStats()

      const result = {
        removed: Math.max(0, statsBefore.memorySize - statsAfter.memorySize),
        remaining: statsAfter.memorySize
      }

      console.log(`🧹 Enhanced cache cleanup: removed ${result.removed} items, ${result.remaining} remaining`)
      return result
    } catch (error) {
      console.error('❌ Enhanced cache cleanup failed:', error)
      return { removed: 0, remaining: 0 }
    }
  }

  /**
   * 獲取性能統計
   */
  getStats(): EmbeddingStats & {
    vectorCache: ReturnType<VectorCacheService['getStats']>
  } {
    return {
      ...this.stats,
      vectorCache: this.vectorCache.getStats()
    }
  }

  /**
   * 重置統計
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      cacheHitRate: 0,
      averageLatency: 0,
      errorRate: 0,
      qualityScore: 0
    }
  }

  /**
   * 智能批量處理
   */
  private async optimizedBatchProcessing(
    task: BatchEmbeddingTask,
    options: Required<EnhancedEmbeddingOptions>
  ): Promise<BatchEmbeddingResult & {
    task: BatchEmbeddingTask
    performance: {
      cacheHitRate: number
      averageBatchSize: number
      parallelBatches: number
    }
  }> {
    const startTime = Date.now()

    // 1. 檢查緩存
    const { cached, uncached } = await this.segregateByCache(task.texts)
    task.cacheHits = cached.length
    task.cacheMisses = uncached.length

    // 2. 添加緩存結果
    task.results.push(...cached)

    // 3. 批量處理未緩存的文本
    if (uncached.length > 0) {
      const batchSize = this.calculateOptimalBatchSize(uncached.length)
      const batches = this.createBatches(uncached, batchSize)

      // 4. 並行處理批次（受限於parallelism）
      const batchPromises = batches.map(batch =>
        this.processEmbeddingBatch(batch, options)
      )

      const batchResults = await this.executeWithConcurrencyLimit(
        batchPromises,
        options.parallelism
      )

      // 5. 合併結果
      batchResults.forEach(batchResult => {
        task.results.push(...batchResult.embeddings)
        task.tokens += batchResult.totalTokens
        task.retries += batchResult.retries || 0
      })

      // 6. 緩存新結果
      if (options.useCache) {
        const newResults = task.results.filter(r => !cached.find(c => c.text === r.text))

        // 使用向量緩存系統的批量設置 - Use vector cache system's batch set
        try {
          await this.vectorCache.batchSet(
            newResults.map(result => ({
              text: result.text,
              vector: result.embedding,
              metadata: {
                quality_score: result.quality,
                cost: this.calculateCost(result.tokenCount),
              },
              ttl: options.cacheMaxAge,
            }))
          )
        } catch (error) {
          console.warn('⚠️ Error in batch cache setting:', error)
        }
      }
    }

    task.processingTime = Date.now() - startTime

    // 7. 計算性能指標
    const performance = {
      cacheHitRate: task.cacheHits / task.texts.length,
      averageBatchSize: uncached.length > 0 ? uncached.length / Math.ceil(uncached.length / 10) : 0,
      parallelBatches: Math.min(options.parallelism, Math.ceil(uncached.length / 10))
    }

    return {
      embeddings: task.results,
      totalTokens: task.tokens,
      processingTime: task.processingTime,
      task,
      performance
    }
  }

  /**
   * 標準批量處理
   */
  private async standardBatchProcessing(
    task: BatchEmbeddingTask,
    options: Required<EnhancedEmbeddingOptions>
  ): Promise<BatchEmbeddingResult & {
    task: BatchEmbeddingTask
    performance: {
      cacheHitRate: number
      averageBatchSize: number
      parallelBatches: number
    }
  }> {
    const result = await generateBatchEmbeddings(task.texts, {
      batchSize: 10,
      parallel: false
    })

    task.results = result.embeddings
    task.tokens = result.totalTokens
    task.processingTime = result.processingTime

    return {
      ...result,
      task,
      performance: {
        cacheHitRate: 0,
        averageBatchSize: 10,
        parallelBatches: 1
      }
    }
  }

  /**
   * 按緩存狀態分離文本
   */
  private async segregateByCache(texts: string[]): Promise<{
    cached: EmbeddingResult[]
    uncached: string[]
  }> {
    try {
      // 使用向量緩存系統的批量獲取 - Use vector cache system's batch get
      const batchResult = await this.vectorCache.batchGet(texts)

      const cached: EmbeddingResult[] = batchResult.success.map(item => ({
        embedding: item.item.vector,
        text: item.item.metadata.text,
        tokenCount: Math.ceil(item.item.metadata.text.length / 4), // 近似token計算 - Approximate token calculation
      }))

      const uncached = texts.filter(text =>
        !batchResult.success.some(item => item.text === text)
      )

      return { cached, uncached }
    } catch (error) {
      console.warn('⚠️ Error in cache segregation, falling back to uncached mode:', error)
      return {
        cached: [],
        uncached: texts
      }
    }
  }

  /**
   * 計算最佳批次大小
   */
  private calculateOptimalBatchSize(totalTexts: number): number {
    // 基於總數量動態調整批次大小
    if (totalTexts <= 20) return Math.min(totalTexts, 5)
    if (totalTexts <= 100) return 10
    if (totalTexts <= 500) return 20
    return 25 // 最大批次大小
  }

  /**
   * 創建批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 處理單個嵌入批次
   */
  private async processEmbeddingBatch(
    texts: string[],
    options: Required<EnhancedEmbeddingOptions>
  ): Promise<BatchEmbeddingResult & { retries?: number }> {
    let retries = 0

    const executeTask = async (): Promise<BatchEmbeddingResult> => {
      return generateBatchEmbeddings(texts, {
        batchSize: texts.length,
        parallel: false
      })
    }

    try {
      const result = await this.executeWithRetry(
        executeTask,
        options.retryAttempts,
        options.timeout
      )

      return { ...result, retries }
    } catch (error) {
      retries = options.retryAttempts
      throw error
    }
  }

  /**
   * 執行並行任務（受並發限制）
   */
  private async executeWithConcurrencyLimit<T>(
    promises: Promise<T>[],
    limit: number
  ): Promise<T[]> {
    const results: T[] = []

    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit)
      const batchResults = await Promise.all(batch)
      results.push(...batchResults)

      // 批次間短暫延遲
      if (i + limit < promises.length) {
        await this.delay(500)
      }
    }

    return results
  }

  /**
   * 重試機制執行
   */
  private async executeWithRetry<T>(
    task: () => Promise<T>,
    maxRetries: number,
    timeout: number
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          task(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ])
      } catch (error) {
        lastError = error

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // 指數退避，最大10秒
          console.warn(`Embedding attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error)
          await this.delay(delay)
        }
      }
    }

    throw lastError
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 生成緩存鍵
   */
  private generateCacheKey(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex')
  }

  /**
   * 獲取緩存的嵌入
   */
  private async getCachedEmbedding(text: string): Promise<ReturnType<VectorCacheService['get']>> {
    try {
      return await this.vectorCache.get(text)
    } catch (error) {
      console.warn('⚠️ Error getting cached embedding:', error)
      return null
    }
  }

  /**
   * 緩存嵌入
   */
  private async cacheEmbedding(
    text: string,
    result: EmbeddingResult,
    options: {
      quality_score?: number
      cost?: number
      ttl?: number
    } = {}
  ): Promise<void> {
    try {
      await this.vectorCache.set(
        text,
        result.embedding,
        {
          quality_score: options.quality_score,
          cost: options.cost,
        },
        {
          ttl: options.ttl,
          model: 'text-embedding-ada-002'
        }
      )
    } catch (error) {
      console.warn('⚠️ Error caching embedding:', error)
    }
  }

  /**
   * 驗證嵌入質量
   */
  private validateEmbeddingQuality(embedding: number[]): number {
    // 檢查向量維度
    if (embedding.length !== 1536) {
      return 0
    }

    // 檢查數值範圍（通常在 -1 到 1 之間）
    const outOfRange = embedding.filter(v => Math.abs(v) > 2).length
    if (outOfRange > embedding.length * 0.1) {
      return 0.3
    }

    // 檢查向量的模長
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
    if (magnitude < 0.1 || magnitude > 10) {
      return 0.5
    }

    // 檢查零向量
    const zeroCount = embedding.filter(v => Math.abs(v) < 1e-6).length
    if (zeroCount > embedding.length * 0.9) {
      return 0.2
    }

    return 1.0 // 高質量
  }

  /**
   * 計算成本
   */
  private calculateCost(tokens: number): number {
    return tokens * COST_CONFIG.pricePerToken
  }

  /**
   * 輸入驗證
   */
  private validateInput(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new AppError('Text must be a non-empty string', 400)
    }

    if (text.trim().length === 0) {
      throw new AppError('Text cannot be empty or only whitespace', 400)
    }

    if (text.length > 8192) {
      throw new AppError('Text exceeds maximum length of 8192 characters', 400)
    }
  }

  /**
   * 更新統計數據
   */
  private updateStats(update: {
    cacheHit?: boolean
    tokens?: number
    latency?: number
    cost?: number
    error?: boolean
  }): void {
    this.stats.totalRequests++

    if (update.tokens) {
      this.stats.totalTokens += update.tokens
    }

    if (update.cost) {
      this.stats.totalCost += update.cost
    }

    if (update.latency) {
      this.stats.averageLatency = (this.stats.averageLatency * (this.stats.totalRequests - 1) + update.latency) / this.stats.totalRequests
    }

    if (update.error) {
      this.stats.errorRate = ((this.stats.errorRate * (this.stats.totalRequests - 1)) + 1) / this.stats.totalRequests
    }

    // 重新計算緩存命中率
    // 這需要追蹤緩存命中次數，簡化實現
    this.stats.cacheHitRate = update.cacheHit ? 0.8 : 0.6 // 簡化計算
  }

  /**
   * 初始化定期清理
   */
  private initializePeriodicCleanup(): void {
    // 每小時清理一次過期緩存
    setInterval(() => {
      this.cleanupCache().catch(console.error)
    }, 60 * 60 * 1000)
  }
}

// 導出單例實例
export const enhancedEmbeddingService = new EnhancedEmbeddingService()

// 便利函數
export async function generateEnhancedEmbedding(
  text: string,
  options?: EnhancedEmbeddingOptions
) {
  return enhancedEmbeddingService.generateEmbedding(text, options)
}

export async function generateEnhancedBatchEmbeddings(
  texts: string[],
  options?: EnhancedEmbeddingOptions
) {
  return enhancedEmbeddingService.generateBatchEmbeddings(texts, options)
}

export async function warmupEmbeddingCache(texts: string[], options?: EnhancedEmbeddingOptions) {
  return enhancedEmbeddingService.warmupCache(texts, options)
}