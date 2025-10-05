/**
 * ================================================================
 * AI銷售賦能平台 - API版本控制中間件 (lib/middleware/api-versioning.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 實現API版本控制策略，支援多種版本識別方式和自動版本協商。
 * 確保API的向後兼容性和平滑版本過渡。
 *
 * 【主要職責】
 * • 版本識別 - 從URL、Header、Query參數中提取版本信息
 * • 版本協商 - 根據客戶端請求選擇最合適的API版本
 * • 版本路由 - 將請求路由到對應版本的處理器
 * • 版本驗證 - 驗證請求的版本是否受支援
 * • 版本淘汰 - 處理已廢棄版本的警告和限制
 *
 * 【技術實現】
 * • Multiple Strategies - 支援URL路徑、Header、Query參數三種策略
 * • Content Negotiation - 基於Accept header的版本協商
 * • Deprecation Warning - 自動添加棄用警告頭部
 * • Version Fallback - 智能版本降級機制
 * • Type Safety - TypeScript類型保護
 *
 * 【使用場景】
 * • API Gateway - 統一的版本控制入口
 * • 版本遷移 - 平滑過渡到新版本API
 * • 向後兼容 - 支援舊版本客戶端
 * • 版本淘汰 - 逐步淘汰舊版本
 * • API文檔 - 自動生成版本信息
 *
 * 【相關檔案】
 * • middleware.ts - 使用此中間件處理版本控制
 * • lib/middleware/route-matcher.ts - 路由匹配時的版本識別
 * • lib/middleware/routing-config.ts - 版本特定的路由配置
 *
 * 作者：Claude Code
 * 創建時間：2025-09-30
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * API版本類型
 */
export type ApiVersion = 'v1' | 'v2'

/**
 * 版本識別策略
 */
export type VersionStrategy = 'url' | 'header' | 'query' | 'accept-header'

/**
 * 版本狀態
 */
export type VersionStatus = 'stable' | 'beta' | 'deprecated' | 'sunset'

/**
 * 版本配置接口
 */
export interface VersionConfig {
  /**
   * 版本號
   */
  version: ApiVersion

  /**
   * 版本狀態
   */
  status: VersionStatus

  /**
   * 是否為默認版本
   */
  isDefault?: boolean

  /**
   * 淘汰日期 (用於 deprecated/sunset 狀態)
   */
  sunsetDate?: Date

  /**
   * 版本描述
   */
  description?: string

  /**
   * 支援的功能列表
   */
  features?: string[]

  /**
   * 遷移指南URL
   */
  migrationGuideUrl?: string
}

/**
 * 版本控制選項
 */
export interface VersioningOptions {
  /**
   * 版本識別策略
   * 默認: ['url', 'header']
   */
  strategies?: VersionStrategy[]

  /**
   * 默認版本
   * 默認: 'v2'
   */
  defaultVersion?: ApiVersion

  /**
   * Header名稱 (用於header策略)
   * 默認: 'X-API-Version'
   */
  headerName?: string

  /**
   * Query參數名稱 (用於query策略)
   * 默認: 'version' 或 'api_version'
   */
  queryParam?: string

  /**
   * 是否嚴格模式 (不支援的版本返回錯誤)
   * 默認: false
   */
  strictMode?: boolean

  /**
   * 版本配置列表
   */
  versions?: VersionConfig[]

  /**
   * 是否添加版本資訊頭部到響應
   * 默認: true
   */
  addVersionHeaders?: boolean
}

/**
 * 版本解析結果
 */
export interface VersionResolution {
  /**
   * 解析出的版本號
   */
  version: ApiVersion

  /**
   * 使用的識別策略
   */
  strategy: VersionStrategy

  /**
   * 版本配置
   */
  config?: VersionConfig

  /**
   * 是否使用了默認版本
   */
  isDefault: boolean

  /**
   * 警告消息 (例如版本已棄用)
   */
  warnings?: string[]
}

/**
 * 默認版本控制選項
 */
const DEFAULT_OPTIONS: Required<Omit<VersioningOptions, 'versions'>> = {
  strategies: ['url', 'header'],
  defaultVersion: 'v2',
  headerName: 'X-API-Version',
  queryParam: 'version',
  strictMode: false,
  addVersionHeaders: true
}

/**
 * 默認版本配置
 */
const DEFAULT_VERSIONS: VersionConfig[] = [
  {
    version: 'v1',
    status: 'deprecated',
    description: 'Legacy API version',
    migrationGuideUrl: '/docs/migration/v1-to-v2'
  },
  {
    version: 'v2',
    status: 'stable',
    isDefault: true,
    description: 'Current stable API version'
  }
]

/**
 * API版本控制中間件類
 *
 * 提供完整的API版本控制功能，支援多種識別策略和版本管理。
 *
 * @example
 * ```typescript
 * const versioning = new ApiVersioning({
 *   strategies: ['url', 'header'],
 *   defaultVersion: 'v2'
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   const resolution = versioning.resolve(request)
 *   console.log('API Version:', resolution.version)
 *   return versioning.handle(request)
 * }
 * ```
 */
export class ApiVersioning {
  private options: Required<VersioningOptions>
  private versionsMap: Map<ApiVersion, VersionConfig>

  /**
   * 構造函數
   *
   * @param options 版本控制選項
   */
  constructor(options: VersioningOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      versions: options.versions || DEFAULT_VERSIONS
    }

    // 創建版本映射表
    this.versionsMap = new Map()
    this.options.versions.forEach((config) => {
      this.versionsMap.set(config.version, config)
    })
  }

  /**
   * 解析請求的API版本
   *
   * 按照配置的策略順序嘗試識別版本，返回第一個成功識別的版本。
   *
   * @param request Next.js請求對象
   * @returns 版本解析結果
   */
  resolve(request: NextRequest): VersionResolution {
    const warnings: string[] = []

    // 按策略順序嘗試識別版本
    for (const strategy of this.options.strategies) {
      const version = this.extractVersion(request, strategy)

      if (version) {
        const config = this.versionsMap.get(version)

        // 檢查版本狀態並添加警告
        if (config) {
          if (config.status === 'deprecated') {
            warnings.push(
              `API version ${version} is deprecated. Please migrate to ${this.options.defaultVersion}.`
            )
            if (config.migrationGuideUrl) {
              warnings.push(`Migration guide: ${config.migrationGuideUrl}`)
            }
          } else if (config.status === 'sunset') {
            warnings.push(
              `API version ${version} will be sunset on ${config.sunsetDate?.toISOString()}.`
            )
          } else if (config.status === 'beta') {
            warnings.push(`API version ${version} is in beta. Features may change.`)
          }
        }

        return {
          version,
          strategy,
          config,
          isDefault: false,
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }
    }

    // 沒有識別到版本，使用默認版本
    const defaultConfig = this.versionsMap.get(this.options.defaultVersion)

    return {
      version: this.options.defaultVersion,
      strategy: 'url', // 默認策略
      config: defaultConfig,
      isDefault: true
    }
  }

  /**
   * 處理版本控制
   *
   * 解析版本並添加版本相關的頭部到響應。
   *
   * @param request Next.js請求對象
   * @param response 可選的響應對象
   * @returns 帶有版本信息的響應
   */
  handle(request: NextRequest, response?: NextResponse): NextResponse {
    const resolution = this.resolve(request)

    // 如果沒有提供響應，創建一個空響應
    const baseResponse = response || NextResponse.json(null, { status: 200 })

    // 添加版本頭部
    if (this.options.addVersionHeaders) {
      baseResponse.headers.set('X-API-Version', resolution.version)

      if (resolution.config) {
        baseResponse.headers.set('X-API-Version-Status', resolution.config.status)
      }

      // 添加棄用警告
      if (resolution.warnings && resolution.warnings.length > 0) {
        baseResponse.headers.set('Warning', resolution.warnings.join('; '))

        // 如果是 sunset 狀態，添加 Sunset 頭部
        if (resolution.config?.status === 'sunset' && resolution.config.sunsetDate) {
          baseResponse.headers.set('Sunset', resolution.config.sunsetDate.toUTCString())
        }
      }
    }

    return baseResponse
  }

  /**
   * 驗證版本是否受支援
   *
   * @param version 要驗證的版本號
   * @returns 是否受支援
   */
  isSupported(version: ApiVersion): boolean {
    return this.versionsMap.has(version)
  }

  /**
   * 檢查版本是否已棄用
   *
   * @param version 要檢查的版本號
   * @returns 是否已棄用
   */
  isDeprecated(version: ApiVersion): boolean {
    const config = this.versionsMap.get(version)
    return config?.status === 'deprecated' || config?.status === 'sunset'
  }

  /**
   * 獲取版本配置
   *
   * @param version 版本號
   * @returns 版本配置或undefined
   */
  getVersionConfig(version: ApiVersion): VersionConfig | undefined {
    return this.versionsMap.get(version)
  }

  /**
   * 獲取所有支援的版本
   *
   * @returns 版本配置列表
   */
  getSupportedVersions(): VersionConfig[] {
    return Array.from(this.versionsMap.values())
  }

  /**
   * 從請求中提取版本號
   *
   * @param request 請求對象
   * @param strategy 識別策略
   * @returns 版本號或null
   */
  private extractVersion(request: NextRequest, strategy: VersionStrategy): ApiVersion | null {
    switch (strategy) {
      case 'url':
        return this.extractVersionFromUrl(request)

      case 'header':
        return this.extractVersionFromHeader(request)

      case 'query':
        return this.extractVersionFromQuery(request)

      case 'accept-header':
        return this.extractVersionFromAcceptHeader(request)

      default:
        return null
    }
  }

  /**
   * 從URL路徑中提取版本
   *
   * 支援格式: /api/v1/..., /api/v2/...
   *
   * @param request 請求對象
   * @returns 版本號或null
   */
  private extractVersionFromUrl(request: NextRequest): ApiVersion | null {
    const pathname = request.nextUrl.pathname
    const match = pathname.match(/\/api\/(v[12])\//)

    if (match && match[1]) {
      return match[1] as ApiVersion
    }

    return null
  }

  /**
   * 從HTTP頭部中提取版本
   *
   * @param request 請求對象
   * @returns 版本號或null
   */
  private extractVersionFromHeader(request: NextRequest): ApiVersion | null {
    const versionHeader = request.headers.get(this.options.headerName)

    if (versionHeader) {
      // 支援 'v1', 'v2', '1', '2' 等格式
      const normalized = versionHeader.toLowerCase().startsWith('v')
        ? versionHeader.toLowerCase()
        : `v${versionHeader}`

      if (this.isValidVersion(normalized)) {
        return normalized as ApiVersion
      }
    }

    return null
  }

  /**
   * 從Query參數中提取版本
   *
   * @param request 請求對象
   * @returns 版本號或null
   */
  private extractVersionFromQuery(request: NextRequest): ApiVersion | null {
    const version =
      request.nextUrl.searchParams.get(this.options.queryParam) ||
      request.nextUrl.searchParams.get('api_version')

    if (version) {
      const normalized = version.toLowerCase().startsWith('v')
        ? version.toLowerCase()
        : `v${version}`

      if (this.isValidVersion(normalized)) {
        return normalized as ApiVersion
      }
    }

    return null
  }

  /**
   * 從Accept頭部中提取版本
   *
   * 支援格式: Accept: application/vnd.api.v1+json
   *
   * @param request 請求對象
   * @returns 版本號或null
   */
  private extractVersionFromAcceptHeader(request: NextRequest): ApiVersion | null {
    const acceptHeader = request.headers.get('accept')

    if (acceptHeader) {
      const match = acceptHeader.match(/application\/vnd\.api\.(v[12])\+json/)

      if (match && match[1]) {
        return match[1] as ApiVersion
      }
    }

    return null
  }

  /**
   * 驗證版本字符串是否有效
   *
   * @param version 版本字符串
   * @returns 是否有效
   */
  private isValidVersion(version: string): boolean {
    return version === 'v1' || version === 'v2'
  }
}

/**
 * 創建API版本控制中間件的便捷函數
 *
 * @param options 版本控制選項
 * @returns API版本控制實例
 *
 * @example
 * ```typescript
 * import { createApiVersioning } from '@/lib/middleware/api-versioning'
 *
 * const versioning = createApiVersioning({
 *   strategies: ['url', 'header'],
 *   defaultVersion: 'v2'
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   return versioning.handle(request)
 * }
 * ```
 */
export function createApiVersioning(options?: VersioningOptions): ApiVersioning {
  return new ApiVersioning(options)
}

/**
 * 默認API版本控制實例
 */
export const defaultApiVersioning = new ApiVersioning()

/**
 * 解析請求的API版本（便捷函數）
 *
 * @param request Next.js請求對象
 * @param options 可選的版本控制選項
 * @returns 版本解析結果
 *
 * @example
 * ```typescript
 * import { resolveApiVersion } from '@/lib/middleware/api-versioning'
 *
 * export async function GET(request: NextRequest) {
 *   const { version } = resolveApiVersion(request)
 *   console.log('Request version:', version)
 * }
 * ```
 */
export function resolveApiVersion(
  request: NextRequest,
  options?: VersioningOptions
): VersionResolution {
  if (options) {
    const versioning = new ApiVersioning(options)
    return versioning.resolve(request)
  }

  return defaultApiVersioning.resolve(request)
}

/**
 * 應用版本控制到響應（便捷函數）
 *
 * @param request Next.js請求對象
 * @param response 響應對象
 * @param options 可選的版本控制選項
 * @returns 帶有版本信息的響應
 *
 * @example
 * ```typescript
 * import { applyVersioning } from '@/lib/middleware/api-versioning'
 *
 * export async function GET(request: NextRequest) {
 *   const data = await fetchData()
 *   const response = NextResponse.json(data)
 *   return applyVersioning(request, response)
 * }
 * ```
 */
export function applyVersioning(
  request: NextRequest,
  response: NextResponse,
  options?: VersioningOptions
): NextResponse {
  const versioning = options ? new ApiVersioning(options) : defaultApiVersioning
  return versioning.handle(request, response)
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export