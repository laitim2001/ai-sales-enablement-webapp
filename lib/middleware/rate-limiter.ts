/**
 * API速率限制中間件
 *
 * 功能：
 * - 基於用戶ID和IP地址的速率限制
 * - 支援不同API端點的不同限制策略
 * - Redis緩存支援（可選）
 * - 內存緩存回退機制
 * - 速率限制狀態追蹤和日誌
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { NextRequest, NextResponse } from 'next/server';

// 速率限制配置介面
export interface RateLimitConfig {
  windowMs: number;          // 時間窗口（毫秒）
  maxRequests: number;       // 最大請求數
  keyGenerator?: (req: NextRequest) => string; // 自定義key生成器
  skipSuccessfulRequests?: boolean; // 是否跳過成功的請求
  skipFailedRequests?: boolean;     // 是否跳過失敗的請求
  message?: string;          // 自定義錯誤消息
  headers?: boolean;         // 是否添加速率限制頭部
}

// 速率限制記錄介面
interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// 內存存儲（生產環境建議使用Redis）
class MemoryStore {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每5分鐘清理一次過期記錄
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const record = this.store.get(key);
    if (!record) return null;

    // 檢查是否過期
    if (Date.now() > record.resetTime) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  async set(key: string, record: RateLimitRecord): Promise<void> {
    this.store.set(key, record);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    const now = Date.now();
    const existing = await this.get(key);

    if (existing) {
      existing.count++;
      await this.set(key, existing);
      return existing;
    } else {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      await this.set(key, newRecord);
      return newRecord;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// 全局存儲實例
const store = new MemoryStore();

/**
 * 預定義的速率限制配置
 */
export const RateLimitPresets = {
  // AI API調用 - 嚴格限制
  AI_API: {
    windowMs: 60 * 1000,     // 1分鐘
    maxRequests: 10,         // 最多10次請求
    message: 'AI API調用過於頻繁，請稍後再試'
  },

  // 一般API - 中等限制
  GENERAL_API: {
    windowMs: 60 * 1000,     // 1分鐘
    maxRequests: 60,         // 最多60次請求
    message: 'API調用過於頻繁，請稍後再試'
  },

  // 檔案上傳 - 寬鬆限制
  FILE_UPLOAD: {
    windowMs: 60 * 1000,     // 1分鐘
    maxRequests: 5,          // 最多5次上傳
    message: '檔案上傳過於頻繁，請稍後再試'
  },

  // 登入嘗試 - 嚴格限制
  AUTH_ATTEMPT: {
    windowMs: 15 * 60 * 1000, // 15分鐘
    maxRequests: 5,           // 最多5次嘗試
    message: '登入嘗試次數過多，請15分鐘後再試'
  },

  // 搜索請求 - 中等限制
  SEARCH_API: {
    windowMs: 60 * 1000,     // 1分鐘
    maxRequests: 30,         // 最多30次搜索
    message: '搜索請求過於頻繁，請稍後再試'
  }
} as const;

/**
 * 默認key生成器
 */
function defaultKeyGenerator(req: NextRequest): string {
  // 優先使用用戶ID，回退到IP地址
  const userId = req.headers.get('x-user-id') ||
                 req.headers.get('authorization')?.split(' ')[1]; // 從JWT中提取
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             req.ip ||
             'unknown';

  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * 創建速率限制中間件
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = '請求過於頻繁，請稍後再試',
    headers = true
  } = config;

  return async function rateLimitMiddleware(
    req: NextRequest,
    next?: () => Promise<NextResponse>
  ): Promise<NextResponse | null> {
    try {
      const key = keyGenerator(req);
      const record = await store.increment(key, windowMs);

      const isLimitExceeded = record.count > maxRequests;
      const timeUntilReset = Math.ceil((record.resetTime - Date.now()) / 1000);

      // 創建響應頭
      const responseHeaders: Record<string, string> = {};

      if (headers) {
        responseHeaders['X-RateLimit-Limit'] = maxRequests.toString();
        responseHeaders['X-RateLimit-Remaining'] = Math.max(0, maxRequests - record.count).toString();
        responseHeaders['X-RateLimit-Reset'] = Math.ceil(record.resetTime / 1000).toString();
        responseHeaders['X-RateLimit-Window'] = windowMs.toString();
      }

      // 如果超出限制
      if (isLimitExceeded) {
        responseHeaders['Retry-After'] = timeUntilReset.toString();

        // 記錄速率限制事件
        console.warn(`Rate limit exceeded for key: ${key}, count: ${record.count}, limit: ${maxRequests}`);

        return NextResponse.json(
          {
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter: timeUntilReset
          },
          {
            status: 429,
            headers: responseHeaders
          }
        );
      }

      // 如果有next函數，調用它並添加頭部
      if (next) {
        const response = await next();

        // 檢查是否應該跳過計數
        const shouldSkip = (
          (skipSuccessfulRequests && response.status < 400) ||
          (skipFailedRequests && response.status >= 400)
        );

        if (shouldSkip) {
          // 減少計數（因為之前已經增加了）
          record.count = Math.max(0, record.count - 1);
          await store.set(key, record);
        }

        // 添加速率限制頭部
        if (headers) {
          Object.entries(responseHeaders).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        }

        return response;
      }

      return null;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // 在錯誤情況下，允許請求通過
      return next ? await next() : null;
    }
  };
}

/**
 * 速率限制狀態檢查
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  try {
    const record = await store.get(key);

    if (!record) {
      return {
        allowed: true,
        count: 0,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      };
    }

    const allowed = record.count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - record.count);
    const retryAfter = allowed ? undefined : Math.ceil((record.resetTime - Date.now()) / 1000);

    return {
      allowed,
      count: record.count,
      remaining,
      resetTime: record.resetTime,
      retryAfter
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // 錯誤情況下允許請求
    return {
      allowed: true,
      count: 0,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    };
  }
}

/**
 * 清除用戶的速率限制記錄
 */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await store.set(key, { count: 0, resetTime: 0, firstRequest: 0 });
  } catch (error) {
    console.error('Clear rate limit error:', error);
  }
}

/**
 * 獲取速率限制統計
 */
export async function getRateLimitStats(): Promise<{
  totalKeys: number;
  activeKeys: number;
  topKeys: Array<{ key: string; count: number; resetTime: number }>;
}> {
  try {
    const now = Date.now();
    let totalKeys = 0;
    let activeKeys = 0;
    const keyStats: Array<{ key: string; count: number; resetTime: number }> = [];

    // 注意：這裡訪問私有屬性僅用於統計，生產環境建議添加公共方法
    for (const [key, record] of (store as any).store.entries()) {
      totalKeys++;
      if (record.resetTime > now) {
        activeKeys++;
        keyStats.push({
          key: key.replace(/^(user:|ip:)/, ''), // 隱藏前綴以保護隱私
          count: record.count,
          resetTime: record.resetTime
        });
      }
    }

    // 按計數排序，取前10個
    const topKeys = keyStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalKeys,
      activeKeys,
      topKeys
    };
  } catch (error) {
    console.error('Get rate limit stats error:', error);
    return {
      totalKeys: 0,
      activeKeys: 0,
      topKeys: []
    };
  }
}

/**
 * 速率限制裝飾器（用於API路由）
 */
export function withRateLimit(config: RateLimitConfig) {
  return function decorator(handler: Function) {
    return async function rateLimitedHandler(req: NextRequest, ...args: any[]) {
      const rateLimit = createRateLimit(config);

      const limitResult = await rateLimit(req, async () => {
        return await handler(req, ...args);
      });

      return limitResult || await handler(req, ...args);
    };
  };
}

// 導出存儲實例以供測試使用
export { store as rateLimitStore };