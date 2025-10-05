/**
 * ================================================================
 * AI銷售賦能平台 - 安全頭部中間件 (lib/middleware/security-headers.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 實現完整的HTTP安全頭部配置，防範常見的Web安全威脅。
 * 提供OWASP推薦的安全標準和最佳實踐。
 *
 * 【主要職責】
 * • XSS防護 - X-XSS-Protection和CSP頭部
 * • 點擊劫持防護 - X-Frame-Options配置
 * • HTTPS強制 - HSTS (HTTP Strict Transport Security)
 * • 內容類型保護 - X-Content-Type-Options
 * • 引用來源控制 - Referrer-Policy
 *
 * 【技術實現】
 * • CSP Builder - 靈活的內容安全策略構建器
 * • Environment Aware - 根據環境調整安全級別
 * • OWASP Compliant - 遵循OWASP安全標準
 * • Performance Optimized - 最小化頭部大小
 * • Edge Compatible - 支援Edge Runtime
 *
 * 【使用場景】
 * • API Gateway - 統一的安全頭部管理
 * • Web應用 - 全站安全防護
 * • 微服務 - 服務間通信安全
 * • 合規要求 - 滿足安全審計標準
 * • 生產環境 - 企業級安全保護
 *
 * 【相關檔案】
 * • middleware.ts - 使用安全頭部中間件
 * • docs/api-gateway-architecture.md - 安全策略文檔
 * • docs/security-guidelines.md - 安全實踐指南
 */

import { NextResponse } from 'next/server'

/**
 * Content Security Policy (CSP) 配置接口
 */
export interface CspDirectives {
  'default-src'?: string[]
  'script-src'?: string[]
  'style-src'?: string[]
  'img-src'?: string[]
  'font-src'?: string[]
  'connect-src'?: string[]
  'frame-src'?: string[]
  'object-src'?: string[]
  'media-src'?: string[]
  'worker-src'?: string[]
  'child-src'?: string[]
  'form-action'?: string[]
  'frame-ancestors'?: string[]
  'base-uri'?: string[]
  'manifest-src'?: string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
}

/**
 * 安全頭部配置接口
 */
export interface SecurityHeadersOptions {
  /**
   * Content Security Policy配置
   */
  csp?: CspDirectives | false

  /**
   * HTTP Strict Transport Security (HSTS)
   * - true: 啟用默認配置 (max-age=31536000; includeSubDomains)
   * - false: 禁用
   * - object: 自定義配置
   */
  hsts?:
    | boolean
    | {
        maxAge?: number
        includeSubDomains?: boolean
        preload?: boolean
      }

  /**
   * X-Frame-Options
   * - 'DENY': 禁止任何域嵌入
   * - 'SAMEORIGIN': 只允許同源嵌入
   * - false: 禁用 (使用CSP frame-ancestors替代)
   */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false

  /**
   * X-Content-Type-Options
   * 防止MIME類型嗅探
   */
  noSniff?: boolean

  /**
   * X-XSS-Protection
   * 啟用瀏覽器內建XSS過濾器
   * 注意: 現代瀏覽器依賴CSP，此頭部逐漸被淘汰
   */
  xssProtection?: boolean

  /**
   * Referrer-Policy
   * 控制Referrer信息發送
   */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'

  /**
   * Permissions-Policy (舊稱 Feature-Policy)
   * 控制瀏覽器功能訪問
   */
  permissionsPolicy?: {
    geolocation?: string[]
    microphone?: string[]
    camera?: string[]
    payment?: string[]
    usb?: string[]
    autoplay?: string[]
  }

  /**
   * 自定義頭部
   */
  customHeaders?: Record<string, string>
}

/**
 * 默認CSP配置
 */
const DEFAULT_CSP: CspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true
}

/**
 * 開發環境寬鬆CSP
 */
const DEVELOPMENT_CSP: CspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'http:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'localhost:*', 'ws://localhost:*', 'wss://localhost:*'],
  'frame-src': ["'self'"],
  'object-src': ["'none'"]
}

/**
 * 默認安全頭部配置
 */
const DEFAULT_SECURITY_OPTIONS: Required<Omit<SecurityHeadersOptions, 'customHeaders'>> = {
  csp: DEFAULT_CSP,
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: false
  },
  frameOptions: 'DENY',
  noSniff: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    payment: []
  }
}

/**
 * 安全頭部中間件類
 *
 * 提供完整的HTTP安全頭部管理。
 *
 * @example
 * ```typescript
 * const securityHeaders = new SecurityHeadersMiddleware({
 *   hsts: { maxAge: 31536000, includeSubDomains: true },
 *   frameOptions: 'DENY'
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *   return securityHeaders.apply(response)
 * }
 * ```
 */
export class SecurityHeadersMiddleware {
  private options: SecurityHeadersOptions

  /**
   * 構造函數
   *
   * @param options 安全頭部配置選項
   */
  constructor(options: SecurityHeadersOptions = {}) {
    this.options = this.mergeWithDefaults(options)
  }

  /**
   * 應用安全頭部到響應
   *
   * @param response Next.js響應對象
   * @returns 帶有安全頭部的響應
   */
  apply(response: NextResponse): NextResponse {
    // Content Security Policy
    if (this.options.csp !== false) {
      const cspHeader = this.buildCspHeader(this.options.csp!)
      if (cspHeader) {
        response.headers.set('Content-Security-Policy', cspHeader)
      }
    }

    // HTTP Strict Transport Security
    if (this.options.hsts !== false) {
      const hstsHeader = this.buildHstsHeader(this.options.hsts!)
      if (hstsHeader) {
        response.headers.set('Strict-Transport-Security', hstsHeader)
      }
    }

    // X-Frame-Options
    if (this.options.frameOptions !== false) {
      response.headers.set('X-Frame-Options', this.options.frameOptions!)
    }

    // X-Content-Type-Options
    if (this.options.noSniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff')
    }

    // X-XSS-Protection
    if (this.options.xssProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block')
    }

    // Referrer-Policy
    if (this.options.referrerPolicy) {
      response.headers.set('Referrer-Policy', this.options.referrerPolicy)
    }

    // Permissions-Policy
    if (this.options.permissionsPolicy) {
      const permissionsHeader = this.buildPermissionsPolicyHeader(
        this.options.permissionsPolicy
      )
      if (permissionsHeader) {
        response.headers.set('Permissions-Policy', permissionsHeader)
      }
    }

    // 自定義頭部
    if (this.options.customHeaders) {
      Object.entries(this.options.customHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    return response
  }

  /**
   * 構建CSP頭部字符串
   *
   * @param directives CSP指令
   * @returns CSP頭部字符串
   */
  private buildCspHeader(directives: CspDirectives): string {
    const parts: string[] = []

    Object.entries(directives).forEach(([key, value]) => {
      if (key === 'upgrade-insecure-requests' && value === true) {
        parts.push('upgrade-insecure-requests')
      } else if (key === 'block-all-mixed-content' && value === true) {
        parts.push('block-all-mixed-content')
      } else if (Array.isArray(value) && value.length > 0) {
        parts.push(`${key} ${value.join(' ')}`)
      }
    })

    return parts.join('; ')
  }

  /**
   * 構建HSTS頭部字符串
   *
   * @param config HSTS配置
   * @returns HSTS頭部字符串
   */
  private buildHstsHeader(
    config: boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean }
  ): string {
    if (config === true) {
      return 'max-age=31536000; includeSubDomains'
    }

    if (config === false || typeof config !== 'object') {
      return ''
    }

    const parts: string[] = [`max-age=${config.maxAge ?? 31536000}`]

    if (config.includeSubDomains) {
      parts.push('includeSubDomains')
    }

    if (config.preload) {
      parts.push('preload')
    }

    return parts.join('; ')
  }

  /**
   * 構建Permissions-Policy頭部字符串
   *
   * @param policy 權限策略配置
   * @returns Permissions-Policy頭部字符串
   */
  private buildPermissionsPolicyHeader(
    policy: NonNullable<SecurityHeadersOptions['permissionsPolicy']>
  ): string {
    const parts: string[] = []

    Object.entries(policy).forEach(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        parts.push(`${feature}=()`)
      } else if (allowlist.includes('*')) {
        parts.push(`${feature}=*`)
      } else {
        const origins = allowlist.map((origin) => `"${origin}"`).join(' ')
        parts.push(`${feature}=(${origins})`)
      }
    })

    return parts.join(', ')
  }

  /**
   * 合併用戶配置和默認配置
   *
   * @param options 用戶配置
   * @returns 合併後的配置
   */
  private mergeWithDefaults(options: SecurityHeadersOptions): SecurityHeadersOptions {
    const env = process.env.NODE_ENV || 'development'

    // 根據環境選擇默認CSP
    const defaultCsp = env === 'production' ? DEFAULT_CSP : DEVELOPMENT_CSP

    return {
      csp: options.csp === false ? false : { ...defaultCsp, ...options.csp },
      hsts:
        options.hsts === false
          ? false
          : typeof options.hsts === 'object' && options.hsts !== null
            ? { ...(DEFAULT_SECURITY_OPTIONS.hsts as object), ...options.hsts }
            : DEFAULT_SECURITY_OPTIONS.hsts,
      frameOptions: options.frameOptions ?? DEFAULT_SECURITY_OPTIONS.frameOptions,
      noSniff: options.noSniff ?? DEFAULT_SECURITY_OPTIONS.noSniff,
      xssProtection: options.xssProtection ?? DEFAULT_SECURITY_OPTIONS.xssProtection,
      referrerPolicy: options.referrerPolicy ?? DEFAULT_SECURITY_OPTIONS.referrerPolicy,
      permissionsPolicy: options.permissionsPolicy
        ? { ...DEFAULT_SECURITY_OPTIONS.permissionsPolicy, ...options.permissionsPolicy }
        : DEFAULT_SECURITY_OPTIONS.permissionsPolicy,
      customHeaders: options.customHeaders
    }
  }

  /**
   * 更新安全配置
   *
   * @param options 新的配置選項
   */
  updateOptions(options: Partial<SecurityHeadersOptions>): void {
    this.options = this.mergeWithDefaults({ ...this.options, ...options })
  }
}

/**
 * 創建安全頭部中間件的便捷函數
 *
 * @param options 安全頭部配置選項
 * @returns 安全頭部中間件實例
 *
 * @example
 * ```typescript
 * import { createSecurityHeaders } from '@/lib/middleware/security-headers'
 *
 * const securityHeaders = createSecurityHeaders({
 *   hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
 *   frameOptions: 'DENY',
 *   csp: {
 *     'default-src': ["'self'"],
 *     'script-src': ["'self'", 'https://trusted-cdn.com']
 *   }
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *   return securityHeaders.apply(response)
 * }
 * ```
 */
export function createSecurityHeaders(
  options?: SecurityHeadersOptions
): SecurityHeadersMiddleware {
  return new SecurityHeadersMiddleware(options)
}

/**
 * 默認安全頭部中間件實例
 *
 * 使用環境感知的默認配置。
 */
export const defaultSecurityHeaders = new SecurityHeadersMiddleware()

/**
 * 簡化的安全頭部應用函數
 *
 * 快速為響應添加安全頭部的工具函數。
 *
 * @param response 響應對象
 * @param options 安全頭部配置選項
 * @returns 帶有安全頭部的響應
 *
 * @example
 * ```typescript
 * import { applySecurityHeaders } from '@/lib/middleware/security-headers'
 *
 * export async function GET(request: NextRequest) {
 *   const data = await fetchData()
 *   const response = NextResponse.json(data)
 *   return applySecurityHeaders(response)
 * }
 * ```
 */
export function applySecurityHeaders(
  response: NextResponse,
  options?: SecurityHeadersOptions
): NextResponse {
  const securityHandler = options
    ? new SecurityHeadersMiddleware(options)
    : defaultSecurityHeaders
  return securityHandler.apply(response)
}

/**
 * 預設安全配置集
 *
 * 常用場景的預設配置。
 */
export const SecurityPresets = {
  /**
   * 開發環境配置 (寬鬆)
   */
  development: {
    csp: DEVELOPMENT_CSP,
    hsts: false,
    frameOptions: 'SAMEORIGIN',
    noSniff: true,
    xssProtection: true,
    referrerPolicy: 'no-referrer-when-downgrade'
  } as SecurityHeadersOptions,

  /**
   * 生產環境配置 (嚴格)
   */
  production: {
    csp: DEFAULT_CSP,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameOptions: 'DENY',
    noSniff: true,
    xssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      geolocation: [],
      microphone: [],
      camera: [],
      payment: []
    }
  } as SecurityHeadersOptions,

  /**
   * 最大安全配置
   */
  maximum: {
    csp: {
      ...DEFAULT_CSP,
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true
    },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    frameOptions: 'DENY',
    noSniff: true,
    xssProtection: true,
    referrerPolicy: 'no-referrer',
    permissionsPolicy: {
      geolocation: [],
      microphone: [],
      camera: [],
      payment: [],
      usb: [],
      autoplay: []
    }
  } as SecurityHeadersOptions,

  /**
   * API專用配置
   */
  api: {
    csp: false, // API通常不需要CSP
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameOptions: 'DENY',
    noSniff: true,
    xssProtection: false, // API不需要XSS保護
    referrerPolicy: 'no-referrer'
  } as SecurityHeadersOptions
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export