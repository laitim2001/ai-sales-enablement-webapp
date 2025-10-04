/**
 * ================================================================
 * AI銷售賦能平台 - 路由匹配器 (lib/middleware/route-matcher.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供靈活且高效的路由匹配系統，支援字符串、正則表達式和通配符模式。
 * 用於API網關的智能路由分發和配置管理。
 *
 * 【主要職責】
 * • 路由匹配 - 支援字符串、正則表達式、通配符等多種模式
 * • 版本識別 - 從路徑中提取API版本信息 (v1/v2)
 * • 配置管理 - 集中管理路由配置和規則
 * • 優先級處理 - 按優先級順序匹配路由
 * • 性能優化 - 使用緩存提高匹配效率
 *
 * 【技術實現】
 * • Pattern Matching - 支援多種匹配模式
 * • Cache Strategy - LRU緩存優化性能
 * • Priority Queue - 優先級排序確保正確匹配
 * • Type Safety - TypeScript類型保護
 * • Edge Compatible - 支援Edge Runtime
 *
 * 【使用場景】
 * • API Gateway - 路由請求到正確的處理器
 * • 認證檢查 - 根據路由配置決定認證方式
 * • 速率限制 - 應用端點特定的速率限制
 * • CORS處理 - 應用路由特定的CORS規則
 * • 版本控制 - 管理API版本路由
 *
 * 【相關檔案】
 * • middleware.ts - 使用路由匹配器進行請求分發
 * • lib/middleware/routing-config.ts - 路由配置定義
 * • docs/api-gateway-architecture.md - 架構設計文檔
 */

import { NextRequest } from 'next/server'

/**
 * 路由配置接口
 *
 * 定義單個路由的完整配置，包括匹配規則、認證要求、速率限制等。
 */
export interface RouteConfig {
  /**
   * 路由匹配模式
   * - string: 精確匹配或通配符匹配 (支援 * 和 **)
   * - RegExp: 正則表達式匹配
   */
  pattern: string | RegExp

  /**
   * 路由名稱 (可選)
   * 用於日誌和調試
   */
  name?: string

  /**
   * API版本
   */
  version?: 'v1' | 'v2'

  /**
   * 優先級 (數字越大優先級越高)
   * 默認: 0
   */
  priority?: number

  /**
   * 認證配置
   */
  auth: {
    required: boolean
    methods: ('jwt' | 'apiKey' | 'azureAD')[]
    roles?: string[]
  }

  /**
   * 速率限制配置 (可選)
   */
  rateLimit?: {
    windowMs: number
    maxRequests: number
    keyGenerator?: (req: NextRequest) => string
  }

  /**
   * CORS配置 (可選)
   */
  cors?: {
    origins: string[]
    methods: string[]
    credentials: boolean
  }

  /**
   * 轉發目標 (可選)
   */
  target?: {
    rewrite?: string
    proxy?: string
  }

  /**
   * 自定義元數據 (可選)
   */
  metadata?: Record<string, unknown>
}

/**
 * 路由匹配結果
 */
export interface RouteMatchResult {
  matched: boolean
  config?: RouteConfig
  params?: Record<string, string>
  version?: 'v1' | 'v2'
}

/**
 * 路由匹配器選項
 */
export interface RouteMatcherOptions {
  /**
   * 是否啟用緩存
   * 默認: true
   */
  enableCache?: boolean

  /**
   * 緩存大小限制
   * 默認: 1000
   */
  cacheSize?: number

  /**
   * 是否區分大小寫
   * 默認: false (不區分)
   */
  caseSensitive?: boolean

  /**
   * 是否嚴格尾隨斜線
   * 默認: false
   */
  strictTrailingSlash?: boolean
}

/**
 * 路由匹配器類
 *
 * 提供高效的路由匹配功能，支援多種模式和優化策略。
 *
 * @example
 * ```typescript
 * const matcher = new RouteMatcher(routeConfigs, { enableCache: true })
 * const result = matcher.match('/api/v1/users')
 * if (result.matched && result.config) {
 *   console.log('Matched route:', result.config.name)
 * }
 * ```
 */
export class RouteMatcher {
  private configs: RouteConfig[]
  private options: Required<RouteMatcherOptions>
  private cache: Map<string, RouteMatchResult>

  /**
   * 構造函數
   *
   * @param configs 路由配置數組
   * @param options 匹配器選項
   */
  constructor(configs: RouteConfig[], options: RouteMatcherOptions = {}) {
    // 按優先級排序配置 (高優先級在前)
    this.configs = [...configs].sort((a, b) => {
      const priorityA = a.priority ?? 0
      const priorityB = b.priority ?? 0
      return priorityB - priorityA
    })

    this.options = {
      enableCache: options.enableCache ?? true,
      cacheSize: options.cacheSize ?? 1000,
      caseSensitive: options.caseSensitive ?? false,
      strictTrailingSlash: options.strictTrailingSlash ?? false
    }

    this.cache = new Map()
  }

  /**
   * 匹配路徑
   *
   * 根據路由配置匹配給定的路徑名。
   *
   * @param pathname 要匹配的路徑
   * @returns 匹配結果
   */
  match(pathname: string): RouteMatchResult {
    // 規範化路徑
    const normalizedPath = this.normalizePath(pathname)

    // 檢查緩存
    if (this.options.enableCache) {
      const cached = this.cache.get(normalizedPath)
      if (cached) {
        return cached
      }
    }

    // 遍歷配置尋找匹配
    for (const config of this.configs) {
      const matchResult = this.matchPattern(normalizedPath, config.pattern)

      if (matchResult.matched) {
        const result: RouteMatchResult = {
          matched: true,
          config,
          params: matchResult.params,
          version: this.extractVersion(normalizedPath) || config.version
        }

        // 更新緩存
        if (this.options.enableCache) {
          this.addToCache(normalizedPath, result)
        }

        return result
      }
    }

    // 無匹配
    const noMatch: RouteMatchResult = { matched: false }

    if (this.options.enableCache) {
      this.addToCache(normalizedPath, noMatch)
    }

    return noMatch
  }

  /**
   * 從路徑中提取API版本
   *
   * @param pathname 路徑名
   * @returns 版本號或null
   */
  extractVersion(pathname: string): 'v1' | 'v2' | null {
    const versionMatch = pathname.match(/\/api\/(v[12])\//)
    if (versionMatch) {
      return versionMatch[1] as 'v1' | 'v2'
    }
    return null
  }

  /**
   * 獲取指定路徑的配置
   *
   * @param pathname 路徑名
   * @returns 路由配置或null
   */
  getConfig(pathname: string): RouteConfig | null {
    const result = this.match(pathname)
    return result.config || null
  }

  /**
   * 檢查路徑是否需要認證
   *
   * @param pathname 路徑名
   * @returns 是否需要認證
   */
  requiresAuth(pathname: string): boolean {
    const config = this.getConfig(pathname)
    return config?.auth.required ?? false
  }

  /**
   * 獲取路徑的認證方法
   *
   * @param pathname 路徑名
   * @returns 認證方法數組
   */
  getAuthMethods(pathname: string): string[] {
    const config = this.getConfig(pathname)
    return config?.auth.methods ?? []
  }

  /**
   * 清空緩存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 獲取緩存統計
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.options.cacheSize
    }
  }

  /**
   * 規範化路徑
   *
   * @param pathname 原始路徑
   * @returns 規範化後的路徑
   */
  private normalizePath(pathname: string): string {
    let normalized = pathname

    // 處理大小寫
    if (!this.options.caseSensitive) {
      normalized = normalized.toLowerCase()
    }

    // 處理尾隨斜線
    if (!this.options.strictTrailingSlash && normalized !== '/') {
      normalized = normalized.replace(/\/+$/, '')
    }

    return normalized
  }

  /**
   * 匹配單個模式
   *
   * @param pathname 路徑名
   * @param pattern 匹配模式
   * @returns 匹配結果
   */
  private matchPattern(
    pathname: string,
    pattern: string | RegExp
  ): { matched: boolean; params?: Record<string, string> } {
    if (pattern instanceof RegExp) {
      // 正則表達式匹配
      const match = pathname.match(pattern)
      return { matched: !!match, params: this.extractRegExpParams(match) }
    } else {
      // 字符串模式匹配
      return this.matchStringPattern(pathname, pattern)
    }
  }

  /**
   * 匹配字符串模式
   *
   * 支援通配符:
   * - * : 匹配單段路徑 (不包含 /)
   * - ** : 匹配多段路徑 (包含 /)
   * - :param : 命名參數
   *
   * @param pathname 路徑名
   * @param pattern 字符串模式
   * @returns 匹配結果
   */
  private matchStringPattern(
    pathname: string,
    pattern: string
  ): { matched: boolean; params?: Record<string, string> } {
    // 規範化模式
    let normalizedPattern = pattern
    if (!this.options.caseSensitive) {
      normalizedPattern = normalizedPattern.toLowerCase()
    }

    // 處理尾隨斜線
    if (!this.options.strictTrailingSlash && normalizedPattern !== '/') {
      normalizedPattern = normalizedPattern.replace(/\/+$/, '')
    }

    // 轉換模式為正則表達式
    const params: Record<string, string> = {}
    let regexPattern = normalizedPattern
      // 轉義特殊字符
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      // 處理 ** (匹配多段)
      .replace(/\\\*\\\*/g, '.*')
      // 處理 * (匹配單段)
      .replace(/\\\*/g, '[^/]*')
      // 處理命名參數 :param
      .replace(/:(\w+)/g, (_, paramName) => {
        params[paramName] = ''
        return '([^/]+)'
      })

    // 創建正則表達式 (精確匹配)
    const regex = new RegExp(`^${regexPattern}$`)
    const match = pathname.match(regex)

    if (!match) {
      return { matched: false }
    }

    // 提取參數值
    const paramNames = Object.keys(params)
    if (paramNames.length > 0) {
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1] || ''
      })
    }

    return {
      matched: true,
      params: paramNames.length > 0 ? params : undefined
    }
  }

  /**
   * 從正則匹配結果中提取參數
   *
   * @param match 正則匹配結果
   * @returns 參數對象
   */
  private extractRegExpParams(
    match: RegExpMatchArray | null
  ): Record<string, string> | undefined {
    if (!match || match.length <= 1) {
      return undefined
    }

    const params: Record<string, string> = {}
    for (let i = 1; i < match.length; i++) {
      params[`$${i}`] = match[i]
    }

    return params
  }

  /**
   * 添加到緩存 (使用LRU策略)
   *
   * @param key 緩存鍵
   * @param value 緩存值
   */
  private addToCache(key: string, value: RouteMatchResult): void {
    // 如果緩存已滿，刪除最舊的項
    if (this.cache.size >= this.options.cacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, value)
  }
}

/**
 * 默認路由匹配器實例
 *
 * 使用空配置，需要在應用啟動時設置實際配置。
 */
export const defaultRouteMatcher = new RouteMatcher([])

/**
 * 創建路由匹配器的便捷函數
 *
 * @param configs 路由配置數組
 * @param options 匹配器選項
 * @returns 路由匹配器實例
 *
 * @example
 * ```typescript
 * import { createRouteMatcher } from '@/lib/middleware/route-matcher'
 * import { routeConfigs } from '@/lib/middleware/routing-config'
 *
 * const matcher = createRouteMatcher(routeConfigs, {
 *   enableCache: true,
 *   cacheSize: 500
 * })
 *
 * const result = matcher.match(request.nextUrl.pathname)
 * ```
 */
export function createRouteMatcher(
  configs: RouteConfig[],
  options?: RouteMatcherOptions
): RouteMatcher {
  return new RouteMatcher(configs, options)
}

// 類型已在文件開頭導出，無需重複export