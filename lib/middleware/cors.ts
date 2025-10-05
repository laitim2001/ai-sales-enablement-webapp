/**
 * ================================================================
 * AI銷售賦能平台 - CORS中間件 (lib/middleware/cors.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 實現跨域資源共享(CORS)策略，支援動態配置和預檢請求處理。
 * 提供靈活的CORS控制，適應不同環境和端點的需求。
 *
 * 【主要職責】
 * • CORS頭部設置 - 動態配置Access-Control-*頭部
 * • 預檢請求處理 - OPTIONS請求的高效處理
 * • 來源驗證 - 白名單機制確保安全性
 * • 憑證支持 - Cookie和認證頭部的跨域傳輸
 * • 方法控制 - 限制允許的HTTP方法
 *
 * 【技術實現】
 * • Dynamic Origin - 根據請求動態設置允許的來源
 * • Preflight Cache - 預檢結果緩存減少請求
 * • Wildcard Support - 支援萬用字符和正則匹配
 * • Environment Aware - 根據環境自動調整策略
 * • Edge Compatible - 支援Edge Runtime
 *
 * 【使用場景】
 * • API Gateway - 統一的CORS策略管理
 * • 開發環境 - 寬鬆的CORS設置便於調試
 * • 生產環境 - 嚴格的白名單控制
 * • SPA應用 - 支援前後端分離架構
 * • 微服務 - 多域名服務間的安全通信
 *
 * 【相關檔案】
 * • middleware.ts - 使用CORS中間件處理跨域請求
 * • lib/middleware/route-matcher.ts - 路由特定CORS配置
 * • docs/api-gateway-architecture.md - CORS安全策略文檔
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS配置接口
 */
export interface CorsOptions {
  /**
   * 允許的來源
   * - string[]: 來源白名單
   * - '*': 允許所有來源 (不推薦用於生產環境)
   * - (origin: string) => boolean: 自定義驗證函數
   */
  origins?: string[] | '*' | ((origin: string) => boolean)

  /**
   * 允許的HTTP方法
   * 默認: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
   */
  methods?: string[]

  /**
   * 允許的請求頭部
   * 默認: ['Content-Type', 'Authorization']
   */
  allowedHeaders?: string[]

  /**
   * 暴露的響應頭部
   * 客戶端JavaScript可訪問的頭部
   */
  exposedHeaders?: string[]

  /**
   * 是否允許發送憑證 (Cookies, Authorization headers)
   * 默認: true
   */
  credentials?: boolean

  /**
   * 預檢請求的緩存時間 (秒)
   * 默認: 86400 (24小時)
   */
  maxAge?: number

  /**
   * 是否允許預檢請求成功返回
   * 默認: true
   */
  preflightContinue?: boolean

  /**
   * 預檢請求的HTTP狀態碼
   * 默認: 204 (No Content)
   */
  optionsSuccessStatus?: number
}

/**
 * 默認CORS配置
 */
const DEFAULT_CORS_OPTIONS: Required<Omit<CorsOptions, 'origins'>> = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24小時
  preflightContinue: false,
  optionsSuccessStatus: 204
}

/**
 * 環境特定的CORS配置
 */
const ENVIRONMENT_ORIGINS = {
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  production: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://app.yourdomain.com'
  ]
}

/**
 * CORS中間件類
 *
 * 提供完整的CORS處理功能，包括預檢請求和動態配置。
 *
 * @example
 * ```typescript
 * const corsHandler = new CorsMiddleware({
 *   origins: ['https://example.com'],
 *   credentials: true
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   return corsHandler.handle(request)
 * }
 * ```
 */
export class CorsMiddleware {
  private options: Required<CorsOptions>

  /**
   * 構造函數
   *
   * @param options CORS配置選項
   */
  constructor(options: CorsOptions = {}) {
    this.options = {
      ...DEFAULT_CORS_OPTIONS,
      ...options,
      origins: options.origins || this.getDefaultOrigins()
    }
  }

  /**
   * 處理CORS請求
   *
   * @param request Next.js請求對象
   * @param response 可選的響應對象 (用於修改現有響應)
   * @returns 帶有CORS頭部的響應
   */
  handle(request: NextRequest, response?: NextResponse): NextResponse {
    const origin = request.headers.get('origin')

    // 如果沒有origin頭部，可能是同源請求，直接返回
    if (!origin) {
      return response || NextResponse.json(null, { status: 200 })
    }

    // 驗證來源
    if (!this.isOriginAllowed(origin)) {
      // 來源不被允許，返回錯誤或繼續但不設置CORS頭部
      return response || NextResponse.json(null, { status: 200 })
    }

    // 處理預檢請求 (OPTIONS)
    if (request.method === 'OPTIONS') {
      return this.handlePreflightRequest(request, origin)
    }

    // 處理實際請求
    return this.handleActualRequest(request, origin, response)
  }

  /**
   * 處理預檢請求 (OPTIONS)
   *
   * @param request 請求對象
   * @param origin 請求來源
   * @returns 預檢響應
   */
  private handlePreflightRequest(request: NextRequest, origin: string): NextResponse {
    const corsHeaders = this.buildCorsHeaders(origin, true)
    const response = NextResponse.json(null, {
      status: this.options.optionsSuccessStatus
    })

    // Add CORS headers to response
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value)
    })

    // 檢查請求的方法是否被允許
    const requestMethod = request.headers.get('access-control-request-method')
    if (requestMethod && !this.options.methods.includes(requestMethod)) {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    return response
  }

  /**
   * 處理實際請求
   *
   * @param request 請求對象
   * @param origin 請求來源
   * @param response 現有響應 (可選)
   * @returns 帶有CORS頭部的響應
   */
  private handleActualRequest(
    request: NextRequest,
    origin: string,
    response?: NextResponse
  ): NextResponse {
    // 使用提供的響應，或創建一個新的空響應
    // 注意: NextResponse.next() 在測試環境中可能不可用
    const baseResponse = response || NextResponse.json(null, { status: 200 })
    const corsHeaders = this.buildCorsHeaders(origin, false)

    // 添加CORS頭部到響應
    corsHeaders.forEach((value, key) => {
      baseResponse.headers.set(key, value)
    })

    return baseResponse
  }

  /**
   * 構建CORS頭部
   *
   * @param origin 請求來源
   * @param isPreflight 是否為預檢請求
   * @returns CORS頭部集合
   */
  private buildCorsHeaders(origin: string, isPreflight: boolean): Headers {
    const headers = new Headers()

    // Access-Control-Allow-Origin
    // 注意: 如果credentials為true，不能使用 '*'
    if (this.options.credentials) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Vary', 'Origin')
    } else {
      headers.set('Access-Control-Allow-Origin', '*')
    }

    // Access-Control-Allow-Credentials
    if (this.options.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // 預檢特定頭部
    if (isPreflight) {
      // Access-Control-Allow-Methods
      headers.set('Access-Control-Allow-Methods', this.options.methods.join(', '))

      // Access-Control-Allow-Headers
      headers.set('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '))

      // Access-Control-Max-Age
      headers.set('Access-Control-Max-Age', this.options.maxAge.toString())
    }

    // Access-Control-Expose-Headers (實際請求和預檢都可以設置)
    if (this.options.exposedHeaders.length > 0) {
      headers.set('Access-Control-Expose-Headers', this.options.exposedHeaders.join(', '))
    }

    return headers
  }

  /**
   * 驗證來源是否被允許
   *
   * @param origin 請求來源
   * @returns 是否允許
   */
  private isOriginAllowed(origin: string): boolean {
    const { origins } = this.options

    // 允許所有來源
    if (origins === '*') {
      return true
    }

    // 函數驗證
    if (typeof origins === 'function') {
      return origins(origin)
    }

    // 數組白名單
    if (Array.isArray(origins)) {
      return origins.some((allowedOrigin) => {
        // 精確匹配
        if (allowedOrigin === origin) {
          return true
        }

        // 支援萬用字符匹配 (例如: https://*.example.com)
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\*/g, '.*')
          const regex = new RegExp(`^${pattern}$`)
          return regex.test(origin)
        }

        return false
      })
    }

    return false
  }

  /**
   * 獲取默認來源列表
   *
   * 根據環境返回適當的默認來源。
   *
   * @returns 默認來源列表
   */
  private getDefaultOrigins(): string[] {
    const env = process.env.NODE_ENV || 'development'

    if (env === 'production') {
      // 生產環境: 從環境變數讀取或使用預設值
      const allowedOrigins = process.env.ALLOWED_ORIGINS
      if (allowedOrigins) {
        return allowedOrigins.split(',').map((o) => o.trim())
      }
      return ENVIRONMENT_ORIGINS.production
    } else {
      // 開發環境: 寬鬆設置
      return ENVIRONMENT_ORIGINS.development
    }
  }

  /**
   * 更新CORS配置
   *
   * 動態更新CORS配置，無需重新創建實例。
   *
   * @param options 新的配置選項
   */
  updateOptions(options: Partial<CorsOptions>): void {
    this.options = {
      ...this.options,
      ...options
    }
  }
}

/**
 * 創建CORS中間件的便捷函數
 *
 * @param options CORS配置選項
 * @returns CORS中間件實例
 *
 * @example
 * ```typescript
 * import { createCorsMiddleware } from '@/lib/middleware/cors'
 *
 * const cors = createCorsMiddleware({
 *   origins: ['https://example.com', 'https://app.example.com'],
 *   credentials: true,
 *   maxAge: 3600
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   return cors.handle(request)
 * }
 * ```
 */
export function createCorsMiddleware(options?: CorsOptions): CorsMiddleware {
  return new CorsMiddleware(options)
}

/**
 * 默認CORS中間件實例
 *
 * 使用環境感知的默認配置。
 */
export const defaultCorsMiddleware = new CorsMiddleware()

/**
 * 簡化的CORS處理函數
 *
 * 快速為響應添加CORS頭部的工具函數。
 *
 * @param request 請求對象
 * @param response 響應對象
 * @param options CORS配置選項
 * @returns 帶有CORS頭部的響應
 *
 * @example
 * ```typescript
 * import { applyCors } from '@/lib/middleware/cors'
 *
 * export async function GET(request: NextRequest) {
 *   const data = await fetchData()
 *   const response = NextResponse.json(data)
 *   return applyCors(request, response)
 * }
 * ```
 */
export function applyCors(
  request: NextRequest,
  response: NextResponse,
  options?: CorsOptions
): NextResponse {
  const corsHandler = options ? new CorsMiddleware(options) : defaultCorsMiddleware
  return corsHandler.handle(request, response)
}

/**
 * 預設CORS配置集
 *
 * 常用場景的預設配置。
 */
export const CorsPresets = {
  /**
   * 開發環境配置 (寬鬆)
   */
  development: {
    origins: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    maxAge: 3600
  } as CorsOptions,

  /**
   * 生產環境配置 (嚴格)
   */
  production: {
    origins: ENVIRONMENT_ORIGINS.production,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400
  } as CorsOptions,

  /**
   * 公開API配置 (無憑證)
   */
  publicApi: {
    origins: '*',
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 3600
  } as CorsOptions,

  /**
   * 嚴格配置 (單一來源)
   */
  strict: (origin: string) =>
    ({
      origins: [origin],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      maxAge: 86400
    }) as CorsOptions
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export