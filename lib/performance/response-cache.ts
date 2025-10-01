/**
 * API 響應緩存系統
 *
 * 功能：
 * - HTTP 響應緩存
 * - 智能緩存失效
 * - ETags 支持
 * - 條件請求處理
 * - 緩存統計
 *
 * 使用方式：
 * ```typescript
 * // 在 API Route 中使用
 * export const GET = withCache(
 *   async (request) => {
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   },
 *   { ttl: 300, key: 'custom-key' }
 * );
 *
 * // 或使用便利函數
 * const cached = await cacheResponse('key', async () => {
 *   return await expensiveOperation();
 * }, { ttl: 600 });
 * ```
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

/**
 * 緩存配置
 */
export interface CacheConfig {
  ttl?: number; // 生存時間（秒），默認 300
  key?: string; // 自定義緩存鍵
  tags?: string[]; // 緩存標籤（用於批量失效）
  varyBy?: string[]; // 變化因子（如 userId, query 等）
  condition?: (request: NextRequest) => boolean; // 緩存條件
}

/**
 * 緩存項
 */
interface CacheEntry {
  data: any;
  etag: string;
  timestamp: number;
  ttl: number;
  tags: string[];
  hits: number;
}

/**
 * 緩存統計
 */
export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number; // 字節
  oldestEntry?: Date;
  newestEntry?: Date;
  topKeys: Array<{ key: string; hits: number }>;
}

/**
 * 緩存存儲
 */
class CacheStorage {
  private cache: Map<string, CacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * 設置緩存
   */
  set(key: string, data: any, ttl: number, tags: string[] = []): string {
    const etag = this.generateETag(data);

    const entry: CacheEntry = {
      data,
      etag,
      timestamp: Date.now(),
      ttl: ttl * 1000, // 轉換為毫秒
      tags,
      hits: 0,
    };

    this.cache.set(key, entry);

    // 更新標籤索引
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    return etag;
  }

  /**
   * 獲取緩存
   */
  get(key: string): { data: any; etag: string } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 檢查是否過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // 更新命中統計
    entry.hits++;
    this.stats.hits++;

    return {
      data: entry.data,
      etag: entry.etag,
    };
  }

  /**
   * 刪除緩存
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // 從標籤索引中移除
    for (const tag of entry.tags) {
      this.tagIndex.get(tag)?.delete(key);
      if (this.tagIndex.get(tag)?.size === 0) {
        this.tagIndex.delete(tag);
      }
    }

    return this.cache.delete(key);
  }

  /**
   * 根據標籤失效緩存
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);

    if (!keys) {
      return 0;
    }

    let count = 0;
    for (const key of Array.from(keys)) {
      if (this.delete(key)) {
        count++;
      }
    }

    return count;
  }

  /**
   * 清空所有緩存
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * 清理過期緩存
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * 獲取統計信息
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.entries());

    // 計算內存使用（估算）
    let memoryUsage = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = -Infinity;

    for (const [key, entry] of entries) {
      memoryUsage += key.length + JSON.stringify(entry.data).length;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }

    // 頂級緩存鍵
    const topKeys = entries
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    const total = this.stats.hits + this.stats.misses;

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      memoryUsage,
      oldestEntry:
        oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      newestEntry:
        newestTimestamp !== -Infinity ? new Date(newestTimestamp) : undefined,
      topKeys,
    };
  }

  /**
   * 生成 ETag
   */
  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash('md5').update(content).digest('hex');
  }
}

/**
 * 響應緩存服務
 */
export class ResponseCache {
  private static storage = new CacheStorage();
  private static enabled = true;

  /**
   * 緩存響應數據
   */
  static async cache<T>(
    key: string,
    getData: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    if (!this.enabled) {
      return getData();
    }

    // 嘗試從緩存獲取
    const cached = this.storage.get(key);
    if (cached) {
      return cached.data as T;
    }

    // 獲取新數據
    const data = await getData();

    // 存入緩存
    const ttl = config.ttl || 300;
    const tags = config.tags || [];
    this.storage.set(key, data, ttl, tags);

    return data;
  }

  /**
   * 包裝 API 路由處理器
   */
  static wrap(
    handler: (request: NextRequest) => Promise<NextResponse>,
    config: CacheConfig = {}
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      if (!this.enabled) {
        return handler(request);
      }

      // 檢查緩存條件
      if (config.condition && !config.condition(request)) {
        return handler(request);
      }

      // 只緩存 GET 請求
      if (request.method !== 'GET') {
        return handler(request);
      }

      // 生成緩存鍵
      const cacheKey = this.generateCacheKey(request, config);

      // 檢查 If-None-Match header
      const ifNoneMatch = request.headers.get('if-none-match');

      // 嘗試從緩存獲取
      const cached = this.storage.get(cacheKey);

      if (cached) {
        // 如果 ETag 匹配，返回 304
        if (ifNoneMatch === cached.etag) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              ETag: cached.etag,
              'Cache-Control': `public, max-age=${config.ttl || 300}`,
            },
          });
        }

        // 返回緩存的響應
        return NextResponse.json(cached.data, {
          headers: {
            ETag: cached.etag,
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${config.ttl || 300}`,
          },
        });
      }

      // 執行處理器獲取新數據
      const response = await handler(request);

      // 只緩存成功的響應
      if (response.status === 200) {
        try {
          const data = await response.clone().json();
          const ttl = config.ttl || 300;
          const tags = config.tags || [];
          const etag = this.storage.set(cacheKey, data, ttl, tags);

          // 返回帶有緩存頭的響應
          return NextResponse.json(data, {
            headers: {
              ETag: etag,
              'X-Cache': 'MISS',
              'Cache-Control': `public, max-age=${ttl}`,
            },
          });
        } catch (error) {
          // 如果無法解析 JSON，直接返回原響應
          return response;
        }
      }

      return response;
    };
  }

  /**
   * 使緩存失效
   */
  static invalidate(key: string): boolean {
    return this.storage.delete(key);
  }

  /**
   * 根據標籤使緩存失效
   */
  static invalidateByTag(tag: string): number {
    return this.storage.invalidateByTag(tag);
  }

  /**
   * 清空所有緩存
   */
  static clear(): void {
    this.storage.clear();
  }

  /**
   * 清理過期緩存
   */
  static cleanup(): number {
    return this.storage.cleanup();
  }

  /**
   * 獲取緩存統計
   */
  static getStats(): CacheStats {
    return this.storage.getStats();
  }

  /**
   * 啟用緩存
   */
  static enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用緩存
   */
  static disable(): void {
    this.enabled = false;
  }

  /**
   * 檢查是否啟用
   */
  static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 生成緩存鍵
   */
  private static generateCacheKey(
    request: NextRequest,
    config: CacheConfig
  ): string {
    if (config.key) {
      return config.key;
    }

    const url = new URL(request.url);
    let key = `${request.method}:${url.pathname}`;

    // 添加查詢參數
    if (url.search) {
      key += url.search;
    }

    // 添加變化因子
    if (config.varyBy) {
      for (const factor of config.varyBy) {
        const value = request.headers.get(factor) || request.cookies.get(factor)?.value;
        if (value) {
          key += `:${factor}=${value}`;
        }
      }
    }

    return key;
  }
}

/**
 * 便利函數
 */
export const cacheResponse = ResponseCache.cache.bind(ResponseCache);
export const withCache = ResponseCache.wrap.bind(ResponseCache);
export const invalidateCache = ResponseCache.invalidate.bind(ResponseCache);
export const invalidateCacheByTag = ResponseCache.invalidateByTag.bind(ResponseCache);
export const clearCache = ResponseCache.clear.bind(ResponseCache);
export const getCacheStats = ResponseCache.getStats.bind(ResponseCache);

/**
 * 自動清理過期緩存（每分鐘）
 */
if (typeof global !== 'undefined') {
  setInterval(() => {
    ResponseCache.cleanup();
  }, 60000);
}
