/**
 * @fileoverview ================================================================AI銷售賦能平台 - 向量嵌入緩存系統 (/lib/cache/vector-cache.ts)================================================================【檔案功能】提供Redis分散式緩存和記憶體緩存的雙層緩存架構，專門用於AI向量嵌入的高效儲存和檢索。支援文本向量嵌入的緩存管理，大幅提升AI搜索和相似性比較的性能表現。【主要職責】• 雙層緩存架構 - 記憶體快取(L1) + Redis分散式快取(L2)，確保最佳存取效能• 向量嵌入管理 - 支援各種AI模型的向量嵌入儲存，包含完整的元數據• 批次操作優化 - 提供批次讀寫功能，減少網路往返提升整體效能• 智能壓縮儲存 - 自動壓縮大型向量數據，節省儲存空間和網路頻寬• 性能監控統計 - 追蹤緩存命中率、響應時間、壓縮效果等關鍵指標• 緩存策略管理 - 支援TTL過期、LRU淘汰、預熱等多種緩存策略【技術實現】• Redis連接管理 - 使用ioredis實現穩定的Redis連接，支援重連和錯誤處理• 記憶體緩存優化 - Map-based LRU緩存，自動清理過期項目避免記憶體洩漏• 數據壓縮算法 - gzip壓縮大於1KB的數據，自動計算壓縮效益• Zod數據驗證 - 確保向量數據格式正確性，防止錯誤數據污染• 批次處理引擎 - Promise.all並行處理，提供詳細的成功/失敗統計• 性能指標收集 - 實時統計命中率、響應時間、儲存效率等關鍵性能指標【相關檔案】• /lib/ai/embeddings.ts - AI向量嵌入生成服務，本緩存系統的主要客戶端• /lib/ai/search.ts - 語義搜索服務，使用緩存的向量進行相似性計算• /lib/monitoring/performance-monitor.ts - 性能監控系統，收集緩存性能數據• /components/search/SearchInterface.tsx - 搜索界面組件，受益於緩存加速
 * @module lib/cache/vector-cache
 * @description
 * ================================================================AI銷售賦能平台 - 向量嵌入緩存系統 (/lib/cache/vector-cache.ts)================================================================【檔案功能】提供Redis分散式緩存和記憶體緩存的雙層緩存架構，專門用於AI向量嵌入的高效儲存和檢索。支援文本向量嵌入的緩存管理，大幅提升AI搜索和相似性比較的性能表現。【主要職責】• 雙層緩存架構 - 記憶體快取(L1) + Redis分散式快取(L2)，確保最佳存取效能• 向量嵌入管理 - 支援各種AI模型的向量嵌入儲存，包含完整的元數據• 批次操作優化 - 提供批次讀寫功能，減少網路往返提升整體效能• 智能壓縮儲存 - 自動壓縮大型向量數據，節省儲存空間和網路頻寬• 性能監控統計 - 追蹤緩存命中率、響應時間、壓縮效果等關鍵指標• 緩存策略管理 - 支援TTL過期、LRU淘汰、預熱等多種緩存策略【技術實現】• Redis連接管理 - 使用ioredis實現穩定的Redis連接，支援重連和錯誤處理• 記憶體緩存優化 - Map-based LRU緩存，自動清理過期項目避免記憶體洩漏• 數據壓縮算法 - gzip壓縮大於1KB的數據，自動計算壓縮效益• Zod數據驗證 - 確保向量數據格式正確性，防止錯誤數據污染• 批次處理引擎 - Promise.all並行處理，提供詳細的成功/失敗統計• 性能指標收集 - 實時統計命中率、響應時間、儲存效率等關鍵性能指標【相關檔案】• /lib/ai/embeddings.ts - AI向量嵌入生成服務，本緩存系統的主要客戶端• /lib/ai/search.ts - 語義搜索服務，使用緩存的向量進行相似性計算• /lib/monitoring/performance-monitor.ts - 性能監控系統，收集緩存性能數據• /components/search/SearchInterface.tsx - 搜索界面組件，受益於緩存加速
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import Redis from 'ioredis';
import { z } from 'zod';
import crypto from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';

// 緩存項目架構 - Cache Item Schema
const CacheItemSchema = z.object({
  vector: z.array(z.number()),
  metadata: z.object({
    text: z.string(),
    timestamp: z.number(),
    model: z.string(),
    dimensions: z.number(),
    quality_score: z.number().optional(),
    cost: z.number().optional(),
  }),
  ttl: z.number().optional(),
});

export type CacheItem = z.infer<typeof CacheItemSchema>;

// 緩存配置 - Cache Configuration
interface VectorCacheConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
  };
  memory?: {
    maxSize: number; // 最大項目數 - Maximum number of items
    ttl: number; // 秒 - TTL in seconds
  };
  compression?: {
    enabled: boolean;
    threshold: number; // 壓縮閾值（位元組）- Compression threshold in bytes
  };
  performance?: {
    trackMetrics: boolean;
    logSlowOperations: boolean;
    slowThreshold: number; // 毫秒 - Slow threshold in ms
  };
}

// 緩存統計 - Cache Statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  memoryHits: number;
  redisHits: number;
  compressionSaved: number; // 壓縮節省的位元組數 - Bytes saved by compression
  avgResponseTime: number; // 平均響應時間 - Average response time in ms
  totalSize: number; // 總緩存大小 - Total cache size in bytes
}

// 批次操作結果 - Batch Operation Result
interface BatchResult<T> {
  success: T[];
  errors: Array<{ key: string; error: string }>;
  stats: {
    processed: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
}

/**
 * 向量嵌入緩存服務 - Vector Embedding Cache Service
 * 雙層緩存架構，提供高性能的向量嵌入存儲和檢索
 */
export class VectorCacheService {
  private redis?: Redis;
  private memoryCache: Map<string, { item: CacheItem; expiry: number }>;
  private config: Required<VectorCacheConfig>;
  private stats: CacheStats;
  private isRedisConnected: boolean = false;

  constructor(config: VectorCacheConfig = {}) {
    // 預設配置 - Default configuration
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 1000,
        ...config.redis,
      },
      memory: {
        maxSize: 1000,
        ttl: 3600, // 1小時 - 1 hour
        ...config.memory,
      },
      compression: {
        enabled: true,
        threshold: 1024, // 1KB
        ...config.compression,
      },
      performance: {
        trackMetrics: true,
        logSlowOperations: true,
        slowThreshold: 100, // 100ms
        ...config.performance,
      },
    };

    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memoryHits: 0,
      redisHits: 0,
      compressionSaved: 0,
      avgResponseTime: 0,
      totalSize: 0,
    };

    this.initializeRedis();
    this.startCleanupTimer();
  }

  /**
   * 初始化Redis連接
   *
   * 建立與Redis服務器的連接，設置事件監聽器處理連接狀態變化。
   * 包含自動重連機制和錯誤處理，確保緩存服務的穩定性。
   *
   * 功能特色:
   * - 自動連接測試和狀態追蹤
   * - 完整的事件監聽和日誌記錄
   * - 優雅的錯誤處理和降級策略
   * - 支援連接失敗時的記憶體緩存模式
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis(this.config.redis);

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
        console.log('✅ Vector cache Redis connected');
      });

      this.redis.on('error', (error) => {
        this.isRedisConnected = false;
        console.error('❌ Vector cache Redis error:', error);
      });

      this.redis.on('close', () => {
        this.isRedisConnected = false;
        console.warn('⚠️ Vector cache Redis connection closed');
      });

      // 測試連接 - Test connection
      await this.redis.ping();
      this.isRedisConnected = true;

    } catch (error) {
      console.error('❌ Failed to initialize Redis for vector cache:', error);
      this.isRedisConnected = false;
    }
  }

  /**
   * 生成緩存鍵 - Generate cache key
   */
  private generateKey(text: string, model: string = 'text-embedding-ada-002'): string {
    const hash = crypto.createHash('sha256')
      .update(`${text}:${model}`)
      .digest('hex');
    return `vector:${model}:${hash}`;
  }

  /**
   * 壓縮數據 - Compress data
   */
  private compressData(data: string): Buffer {
    if (!this.config.compression.enabled) {
      return Buffer.from(data);
    }

    const originalSize = Buffer.byteLength(data);
    if (originalSize < this.config.compression.threshold) {
      return Buffer.from(data);
    }

    const compressed = gzipSync(data);
    this.stats.compressionSaved += originalSize - compressed.length;
    return compressed;
  }

  /**
   * 解壓縮數據 - Decompress data
   */
  private decompressData(data: Buffer): string {
    if (!this.config.compression.enabled) {
      return data.toString();
    }

    try {
      return gunzipSync(data).toString();
    } catch {
      // 如果解壓縮失败，假設數據未壓縮 - If decompression fails, assume data is not compressed
      return data.toString();
    }
  }

  /**
   * 記錄性能指標 - Record performance metrics
   */
  private recordMetrics(operation: string, duration: number, hit: boolean): void {
    if (!this.config.performance.trackMetrics) return;

    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    // 更新平均響應時間 - Update average response time
    this.stats.avgResponseTime = (this.stats.avgResponseTime + duration) / 2;

    // 記錄慢操作 - Log slow operations
    if (this.config.performance.logSlowOperations && duration > this.config.performance.slowThreshold) {
      console.warn(`⚠️ Slow vector cache operation: ${operation} took ${duration}ms`);
    }
  }

  /**
   * 從記憶體緩存獲取 - Get from memory cache
   */
  private getFromMemory(key: string): CacheItem | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    // 檢查是否過期 - Check if expired
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    this.stats.memoryHits++;
    return cached.item;
  }

  /**
   * 存儲到記憶體緩存 - Store to memory cache
   */
  private setToMemory(key: string, item: CacheItem): void {
    // 檢查緩存大小限制 - Check cache size limit
    if (this.memoryCache.size >= this.config.memory.maxSize) {
      // 移除最舊的項目 - Remove oldest item
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (this.config.memory.ttl * 1000);
    this.memoryCache.set(key, { item, expiry });
  }

  /**
   * 從Redis獲取 - Get from Redis
   */
  private async getFromRedis(key: string): Promise<CacheItem | null> {
    if (!this.isRedisConnected || !this.redis) return null;

    try {
      const data = await this.redis.getBuffer(key);
      if (!data) return null;

      const decompressed = this.decompressData(data);
      const parsed = JSON.parse(decompressed);
      const validated = CacheItemSchema.parse(parsed);

      this.stats.redisHits++;
      return validated;
    } catch (error) {
      console.error('❌ Error getting from Redis cache:', error);
      return null;
    }
  }

  /**
   * 存儲到Redis - Store to Redis
   */
  private async setToRedis(key: string, item: CacheItem, ttl?: number): Promise<void> {
    if (!this.isRedisConnected || !this.redis) return;

    try {
      const serialized = JSON.stringify(item);
      const compressed = this.compressData(serialized);

      if (ttl) {
        await this.redis.setex(key, ttl, compressed);
      } else {
        await this.redis.set(key, compressed);
      }
    } catch (error) {
      console.error('❌ Error setting to Redis cache:', error);
    }
  }

  /**
   * 獲取向量嵌入 - Get vector embedding
   */
  async get(text: string, model: string = 'text-embedding-ada-002'): Promise<CacheItem | null> {
    const startTime = Date.now();
    const key = this.generateKey(text, model);

    try {
      // 首先檢查記憶體緩存 - First check memory cache
      let item = this.getFromMemory(key);
      if (item) {
        this.recordMetrics('get:memory', Date.now() - startTime, true);
        return item;
      }

      // 然後檢查Redis緩存 - Then check Redis cache
      item = await this.getFromRedis(key);
      if (item) {
        // 回填到記憶體緩存 - Backfill to memory cache
        this.setToMemory(key, item);
        this.recordMetrics('get:redis', Date.now() - startTime, true);
        return item;
      }

      this.recordMetrics('get:miss', Date.now() - startTime, false);
      return null;
    } catch (error) {
      console.error('❌ Error getting from vector cache:', error);
      this.recordMetrics('get:error', Date.now() - startTime, false);
      return null;
    }
  }

  /**
   * 設置向量嵌入 - Set vector embedding
   */
  async set(
    text: string,
    vector: number[],
    metadata: Partial<CacheItem['metadata']> = {},
    options: { ttl?: number; model?: string } = {}
  ): Promise<void> {
    const startTime = Date.now();
    const model = options.model || 'text-embedding-ada-002';
    const key = this.generateKey(text, model);

    try {
      const item: CacheItem = {
        vector,
        metadata: {
          text,
          timestamp: Date.now(),
          model,
          dimensions: vector.length,
          ...metadata,
        },
        ttl: options.ttl,
      };

      // 驗證數據 - Validate data
      CacheItemSchema.parse(item);

      // 同時存儲到記憶體和Redis - Store to both memory and Redis
      this.setToMemory(key, item);
      await this.setToRedis(key, item, options.ttl);

      this.stats.sets++;
      this.recordMetrics('set', Date.now() - startTime, false);
    } catch (error) {
      console.error('❌ Error setting to vector cache:', error);
      throw error;
    }
  }

  /**
   * 批次獲取 - Batch get
   */
  async batchGet(texts: string[], model: string = 'text-embedding-ada-002'): Promise<BatchResult<{ text: string; item: CacheItem }>> {
    const startTime = Date.now();
    const results: { text: string; item: CacheItem }[] = [];
    const errors: Array<{ key: string; error: string }> = [];

    try {
      const promises = texts.map(async (text) => {
        try {
          const item = await this.get(text, model);
          if (item) {
            results.push({ text, item });
          }
        } catch (error) {
          errors.push({
            key: text,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(promises);

      return {
        success: results,
        errors,
        stats: {
          processed: texts.length,
          succeeded: results.length,
          failed: errors.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error('❌ Error in batch get:', error);
      throw error;
    }
  }

  /**
   * 批次設置 - Batch set
   */
  async batchSet(
    items: Array<{
      text: string;
      vector: number[];
      metadata?: Partial<CacheItem['metadata']>;
      ttl?: number;
    }>,
    model: string = 'text-embedding-ada-002'
  ): Promise<BatchResult<string>> {
    const startTime = Date.now();
    const results: string[] = [];
    const errors: Array<{ key: string; error: string }> = [];

    try {
      const promises = items.map(async (item) => {
        try {
          await this.set(item.text, item.vector, item.metadata, {
            ttl: item.ttl,
            model
          });
          results.push(item.text);
        } catch (error) {
          errors.push({
            key: item.text,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(promises);

      return {
        success: results,
        errors,
        stats: {
          processed: items.length,
          succeeded: results.length,
          failed: errors.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error('❌ Error in batch set:', error);
      throw error;
    }
  }

  /**
   * 刪除緩存項目 - Delete cache item
   */
  async delete(text: string, model: string = 'text-embedding-ada-002'): Promise<void> {
    const key = this.generateKey(text, model);

    try {
      // 從記憶體緩存刪除 - Delete from memory cache
      this.memoryCache.delete(key);

      // 從Redis刪除 - Delete from Redis
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
      }

      this.stats.deletes++;
    } catch (error) {
      console.error('❌ Error deleting from vector cache:', error);
      throw error;
    }
  }

  /**
   * 清理過期項目 - Clean expired items
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expiry) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired items from memory cache`);
    }
  }

  /**
   * 啟動清理定時器 - Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // 每分鐘清理一次 - Clean every minute
  }

  /**
   * 預熱緩存 - Warm up cache
   */
  async warmup(texts: string[], model: string = 'text-embedding-ada-002'): Promise<void> {
    console.log(`🔥 Warming up vector cache with ${texts.length} items...`);

    const result = await this.batchGet(texts, model);

    console.log(`✅ Cache warmup completed:`, {
      found: result.success.length,
      missing: result.stats.processed - result.success.length,
      duration: result.stats.duration,
    });
  }

  /**
   * 獲取緩存統計 - Get cache statistics
   */
  getStats(): CacheStats & { memorySize: number; redisConnected: boolean } {
    return {
      ...this.stats,
      memorySize: this.memoryCache.size,
      redisConnected: this.isRedisConnected,
    };
  }

  /**
   * 清理所有緩存 - Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // 清理記憶體緩存 - Clear memory cache
      this.memoryCache.clear();

      // 清理Redis緩存 - Clear Redis cache
      if (this.isRedisConnected && this.redis) {
        const keys = await this.redis.keys('vector:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      console.log('🧹 Vector cache cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing vector cache:', error);
      throw error;
    }
  }

  /**
   * 關閉緩存服務 - Close cache service
   */
  async close(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      this.memoryCache.clear();
      console.log('✅ Vector cache service closed');
    } catch (error) {
      console.error('❌ Error closing vector cache service:', error);
    }
  }
}

// 單例實例 - Singleton instance
let cacheInstance: VectorCacheService | null = null;

/**
 * 獲取向量緩存服務實例 - Get vector cache service instance
 */
export function getVectorCache(config?: VectorCacheConfig): VectorCacheService {
  if (!cacheInstance) {
    cacheInstance = new VectorCacheService(config);
  }
  return cacheInstance;
}

// 匯出類型 - Export types
export type {
  VectorCacheConfig,
  CacheStats,
  BatchResult,
};