/**
 * ================================================================
 * AI銷售賦能平台 - Redis緩存客戶端 (lib/cache/redis-client.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供完整的Redis緩存服務，包含連接管理、緩存操作、鍵生成器、
 * 裝飾器模式、健康檢查等高級緩存功能
 *
 * 【主要職責】
 * • Redis連接管理 - 配置和維護Redis連接池
 * • 緩存操作封裝 - 提供統一的緩存CRUD操作介面
 * • 緩存鍵管理 - 智能生成和管理緩存鍵的命名空間
 * • 裝飾器模式 - 提供方法級別的緩存和失效裝飾器
 * • 性能優化 - 批量操作、管道處理、TTL管理
 * • 健康監控 - 連接狀態監控和健康檢查
 * • 統計資訊 - 記憶體使用、鍵空間、統計資訊
 *
 * 【功能特色】
 * • 單例模式 - 確保全應用使用統一的緩存實例
 * • 自動重連 - 智能重連策略和故障恢復
 * • 多種數據結構 - 支援字串、列表、集合、哈希等
 * • 管道操作 - 批量命令執行提升性能
 * • 緩存裝飾器 - 方法級別的自動緩存和失效
 * • 鍵命名空間 - 結構化的緩存鍵管理系統
 *
 * 【使用場景】
 * • API回應緩存 - 減少資料庫查詢負載
 * • 會話存儲 - 用戶會話和狀態管理
 * • 搜索結果緩存 - 提升搜索性能
 * • 知識庫列表緩存 - 快速載入常用數據
 * • 用戶資料緩存 - 減少認證服務負載
 * • 計數器和統計 - 即時數據統計
 *
 * 【緩存策略】
 * • 時間過期(TTL) - 自動清理過期數據
 * • 主動失效 - 數據更新時主動清理相關緩存
 * • 模式匹配失效 - 批量清理符合模式的緩存
 * • 冷熱數據分離 - 不同TTL策略
 *
 * 【相關檔案】
 * • lib/db.ts - 資料庫操作，緩存的資料來源
 * • app/api/*/route.ts - API路由，緩存的使用者
 * • lib/auth.ts - 認證服務，會話緩存
 * • components/knowledge/* - 前端組件，緩存數據展示
 *
 * 【開發注意】
 * • 使用IORedis提供高性能Redis客戶端
 * • 實現連接池和自動重連機制
 * • 提供完整的錯誤處理和日誌記錄
 * • 支援Redis集群和哨兵模式（可擴展）
 * • 包含緩存統計和監控功能
 * • 使用裝飾器模式簡化緩存使用
 */

import Redis from 'ioredis'                    // 高性能Redis客戶端庫

// Redis 客戶端配置 - Redis Client Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // 連接池配置
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,

  // 性能優化
  enableReadyCheck: false,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,

  // 重連策略
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },

  // 錯誤處理
  maxRetriesPerRequest: 3,
}

// 創建 Redis 實例
export const redis = new Redis(redisConfig)

// 連接事件處理
redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('ready', () => {
  console.log('Redis ready')
})

redis.on('error', (error) => {
  console.error('Redis error:', error)
})

redis.on('close', () => {
  console.log('Redis connection closed')
})

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...')
})

// 緩存鍵生成器
export class CacheKeyGenerator {
  static knowledgeBaseList(filters: any): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((obj, key) => {
        obj[key] = filters[key]
        return obj
      }, {} as any)

    return `kb:list:${Buffer.from(JSON.stringify(sortedFilters)).toString('base64')}`
  }

  static knowledgeBaseItem(id: number): string {
    return `kb:item:${id}`
  }

  static userProfile(userId: number): string {
    return `user:profile:${userId}`
  }

  static searchResults(query: string, type: string): string {
    return `search:${type}:${Buffer.from(query).toString('base64')}`
  }

  static apiResponse(endpoint: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {} as any)

    return `api:${endpoint}:${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`
  }
}

// 緩存服務類
export class CacheService {
  private static instance: CacheService
  private defaultTTL = 300 // 5分鐘

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  // 設置緩存
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      await redis.setex(key, ttl, serialized)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  // 獲取緩存
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached) as T
      }
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // 刪除緩存
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  // 批量刪除（使用模式）
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        return await redis.del(...keys)
      }
      return 0
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return 0
    }
  }

  // 檢查緩存是否存在
  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // 設置過期時間
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      return (await redis.expire(key, ttl)) === 1
    } catch (error) {
      console.error('Cache expire error:', error)
      return false
    }
  }

  // 獲取剩餘TTL
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error('Cache TTL error:', error)
      return -1
    }
  }

  // 原子性增加
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key)
    } catch (error) {
      console.error('Cache incr error:', error)
      return 0
    }
  }

  // 列表操作
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await redis.lpush(key, ...values)
    } catch (error) {
      console.error('Cache lpush error:', error)
      return 0
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await redis.lrange(key, start, stop)
    } catch (error) {
      console.error('Cache lrange error:', error)
      return []
    }
  }

  // 集合操作
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.sadd(key, ...members)
    } catch (error) {
      console.error('Cache sadd error:', error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key)
    } catch (error) {
      console.error('Cache smembers error:', error)
      return []
    }
  }

  // 哈希操作
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await redis.hset(key, field, value)
    } catch (error) {
      console.error('Cache hset error:', error)
      return 0
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await redis.hget(key, field)
    } catch (error) {
      console.error('Cache hget error:', error)
      return null
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await redis.hgetall(key)
    } catch (error) {
      console.error('Cache hgetall error:', error)
      return {}
    }
  }

  // 批量操作
  async mget(...keys: string[]): Promise<(string | null)[]> {
    try {
      return await redis.mget(...keys)
    } catch (error) {
      console.error('Cache mget error:', error)
      return new Array(keys.length).fill(null)
    }
  }

  async mset(...keyValues: string[]): Promise<string> {
    try {
      return await redis.mset(...keyValues)
    } catch (error) {
      console.error('Cache mset error:', error)
      return 'ERR'
    }
  }

  // 管道操作（批量命令）
  async pipeline(commands: Array<[string, ...any[]]>): Promise<any[]> {
    try {
      const pipeline = redis.pipeline()
      commands.forEach(([command, ...args]) => {
        (pipeline as any)[command](...args)
      })
      const results = await pipeline.exec()
      return results?.map(([err, result]) => {
        if (err) throw err
        return result
      }) || []
    } catch (error) {
      console.error('Cache pipeline error:', error)
      return []
    }
  }

  // 緩存統計
  async getStats(): Promise<any> {
    try {
      const info = await redis.info('memory')
      const keyspace = await redis.info('keyspace')
      const stats = await redis.info('stats')

      return {
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        stats: this.parseRedisInfo(stats)
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return null
    }
  }

  // 解析 Redis INFO 輸出
  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {}
    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          result[key] = isNaN(Number(value)) ? value : Number(value)
        }
      }
    })
    return result
  }

  // 健康檢查
  async healthCheck(): Promise<boolean> {
    try {
      const result = await redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Cache health check error:', error)
      return false
    }
  }
}

// 緩存裝飾器
export function cached(ttl: number = 300, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = CacheService.getInstance()

    descriptor.value = async function (...args: any[]) {
      // 生成緩存鍵
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`

      // 嘗試從緩存獲取
      const cached = await cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // 執行原方法
      const result = await originalMethod.apply(this, args)

      // 設置緩存
      await cache.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}

// 緩存失效裝飾器
export function invalidateCache(patterns: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = CacheService.getInstance()

    descriptor.value = async function (...args: any[]) {
      // 執行原方法
      const result = await originalMethod.apply(this, args)

      // 失效相關緩存
      for (const pattern of patterns) {
        await cache.delPattern(pattern)
      }

      return result
    }

    return descriptor
  }
}

// 導出實例
export const cacheService = CacheService.getInstance()

export default redis