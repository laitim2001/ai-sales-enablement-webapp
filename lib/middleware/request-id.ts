/**
 * @fileoverview ================================================================AI銷售賦能平台 - 請求ID生成器 (lib/middleware/request-id.ts)================================================================【檔案功能】為每個HTTP請求生成唯一的追蹤ID，用於日誌關聯、錯誤追蹤和分布式追蹤。支援多種ID格式，確保全局唯一性和高性能。【主要職責】• 唯一ID生成 - 使用時間戳+隨機數確保全局唯一性• 請求追蹤 - 貫穿整個請求生命周期的追蹤標識• 日誌關聯 - 關聯同一請求的所有日誌條目• 性能監控 - 支援OpenTelemetry等追蹤系統• 調試支援 - 快速定位和追蹤特定請求【技術實現】• UUID v4格式 - 標準UUID格式，兼容性好• 時間戳前綴 - 便於按時間排序和查詢• 加密隨機數 - 使用crypto.randomUUID確保安全性• 性能優化 - 輕量級實現，<1ms生成時間• 無狀態設計 - 不依賴外部服務或數據庫【使用場景】• API Gateway - 為每個進入的請求生成ID• 日誌系統 - 關聯同一請求的多條日誌• 錯誤追蹤 - 快速定位問題請求• 性能分析 - 追蹤請求的完整處理時間• 分布式追蹤 - 支援微服務間的請求追蹤【相關檔案】• middleware.ts - Next.js全局中間件，使用此生成器• lib/logging/structured-logger.ts - 日誌系統，使用請求ID• lib/monitoring/tracing.ts - 追蹤系統整合
 * @module lib/middleware/request-id
 * @description
 * ================================================================AI銷售賦能平台 - 請求ID生成器 (lib/middleware/request-id.ts)================================================================【檔案功能】為每個HTTP請求生成唯一的追蹤ID，用於日誌關聯、錯誤追蹤和分布式追蹤。支援多種ID格式，確保全局唯一性和高性能。【主要職責】• 唯一ID生成 - 使用時間戳+隨機數確保全局唯一性• 請求追蹤 - 貫穿整個請求生命周期的追蹤標識• 日誌關聯 - 關聯同一請求的所有日誌條目• 性能監控 - 支援OpenTelemetry等追蹤系統• 調試支援 - 快速定位和追蹤特定請求【技術實現】• UUID v4格式 - 標準UUID格式，兼容性好• 時間戳前綴 - 便於按時間排序和查詢• 加密隨機數 - 使用crypto.randomUUID確保安全性• 性能優化 - 輕量級實現，<1ms生成時間• 無狀態設計 - 不依賴外部服務或數據庫【使用場景】• API Gateway - 為每個進入的請求生成ID• 日誌系統 - 關聯同一請求的多條日誌• 錯誤追蹤 - 快速定位問題請求• 性能分析 - 追蹤請求的完整處理時間• 分布式追蹤 - 支援微服務間的請求追蹤【相關檔案】• middleware.ts - Next.js全局中間件，使用此生成器• lib/logging/structured-logger.ts - 日誌系統，使用請求ID• lib/monitoring/tracing.ts - 追蹤系統整合
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * 請求ID配置接口
 *
 * 定義請求ID的生成策略和格式選項。
 */
export interface RequestIdConfig {
  /**
   * ID生成策略
   * - 'uuid': 標準UUID v4格式 (推薦)
   * - 'timestamp': 時間戳 + 隨機數
   * - 'short': 短格式ID (開發環境)
   */
  strategy?: 'uuid' | 'timestamp' | 'short'

  /**
   * HTTP頭部名稱
   * 默認: X-Request-ID
   */
  headerName?: string

  /**
   * ID前綴
   * 用於區分不同環境或服務
   * 例如: 'prod-', 'dev-', 'api-'
   */
  prefix?: string

  /**
   * 是否接受客戶端提供的請求ID
   * 如果為true，優先使用客戶端傳入的ID
   */
  acceptClientId?: boolean
}

/**
 * 默認配置
 */
const DEFAULT_CONFIG: Required<RequestIdConfig> = {
  strategy: 'uuid',
  headerName: 'X-Request-ID',
  prefix: '',
  acceptClientId: false
}

/**
 * 請求ID生成器類
 *
 * 提供多種請求ID生成策略，支援配置化使用。
 *
 * @example
 * ```typescript
 * const generator = new RequestIdGenerator({ strategy: 'uuid' })
 * const requestId = generator.generate()
 * ```
 */
export class RequestIdGenerator {
  private config: Required<RequestIdConfig>

  /**
   * 構造函數
   *
   * @param config 請求ID配置
   */
  constructor(config: RequestIdConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 生成請求ID
   *
   * 根據配置的策略生成唯一的請求ID。
   *
   * @returns 生成的請求ID字符串
   */
  generate(): string {
    const id = this.generateId()
    return this.config.prefix ? `${this.config.prefix}${id}` : id
  }

  /**
   * 從請求中提取或生成請求ID
   *
   * 如果配置允許且請求中包含有效的請求ID，則使用該ID；
   * 否則生成新的請求ID。
   *
   * @param request Next.js請求對象
   * @returns 請求ID字符串
   */
  getOrGenerate(request: NextRequest): string {
    // 如果允許接受客戶端ID，嘗試從請求頭中獲取
    if (this.config.acceptClientId) {
      const clientId = request.headers.get(this.config.headerName)
      if (clientId && this.isValidRequestId(clientId)) {
        return clientId
      }
    }

    // 生成新的請求ID
    return this.generate()
  }

  /**
   * 驗證請求ID格式
   *
   * 檢查請求ID是否符合有效格式，防止注入攻擊。
   *
   * @param id 要驗證的請求ID
   * @returns 是否為有效的請求ID
   */
  private isValidRequestId(id: string): boolean {
    // 基本安全檢查
    if (!id || id.length > 100) {
      return false
    }

    // 只允許字母、數字、連字符和下劃線
    const validPattern = /^[a-zA-Z0-9-_]+$/
    return validPattern.test(id)
  }

  /**
   * 根據策略生成ID
   *
   * @returns 生成的ID字符串
   */
  private generateId(): string {
    switch (this.config.strategy) {
      case 'uuid':
        return this.generateUUID()

      case 'timestamp':
        return this.generateTimestampId()

      case 'short':
        return this.generateShortId()

      default:
        return this.generateUUID()
    }
  }

  /**
   * 生成UUID v4格式ID
   *
   * 使用Node.js crypto模塊生成標準UUID。
   * 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   *
   * @returns UUID字符串
   */
  private generateUUID(): string {
    return randomUUID()
  }

  /**
   * 生成時間戳格式ID
   *
   * 格式: {timestamp}-{random}
   * 優點: 可按時間排序，便於查詢
   *
   * @returns 時間戳ID字符串
   */
  private generateTimestampId(): string {
    const timestamp = Date.now().toString(36) // 36進制時間戳
    const random = Math.random().toString(36).substring(2, 10) // 8位隨機數
    return `${timestamp}-${random}`
  }

  /**
   * 生成短格式ID
   *
   * 格式: {8位隨機字符串}
   * 用途: 開發環境，便於閱讀和調試
   *
   * 注意: 不保證全局唯一性，僅適用於開發環境
   *
   * @returns 短ID字符串
   */
  private generateShortId(): string {
    return Math.random().toString(36).substring(2, 10)
  }

  /**
   * 獲取配置的頭部名稱
   *
   * @returns HTTP頭部名稱
   */
  getHeaderName(): string {
    return this.config.headerName
  }
}

/**
 * 默認請求ID生成器實例
 *
 * 使用默認配置（UUID策略），可直接導入使用。
 */
export const defaultRequestIdGenerator = new RequestIdGenerator()

/**
 * 生成請求ID的便捷函數
 *
 * 使用默認生成器生成請求ID。
 *
 * @returns 生成的請求ID
 *
 * @example
 * ```typescript
 * import { generateRequestId } from '@/lib/middleware/request-id'
 *
 * const requestId = generateRequestId()
 * console.log(requestId) // "a1b2c3d4-e5f6-4g7h-i8j9-k0l1m2n3o4p5"
 * ```
 */
export function generateRequestId(): string {
  return defaultRequestIdGenerator.generate()
}

/**
 * 從請求中提取或生成請求ID
 *
 * 優先使用請求中已存在的ID，否則生成新ID。
 *
 * @param request Next.js請求對象
 * @param config 可選的配置覆蓋
 * @returns 請求ID字符串
 *
 * @example
 * ```typescript
 * import { getOrGenerateRequestId } from '@/lib/middleware/request-id'
 *
 * export async function middleware(request: NextRequest) {
 *   const requestId = getOrGenerateRequestId(request)
 *   console.log('Processing request:', requestId)
 * }
 * ```
 */
export function getOrGenerateRequestId(
  request: NextRequest,
  config?: RequestIdConfig
): string {
  if (config) {
    const generator = new RequestIdGenerator(config)
    return generator.getOrGenerate(request)
  }

  return defaultRequestIdGenerator.getOrGenerate(request)
}

/**
 * 環境特定的請求ID生成器
 *
 * 根據當前環境返回適當配置的生成器。
 * - 生產環境: UUID策略，不接受客戶端ID
 * - 開發環境: Short策略，接受客戶端ID以便調試
 */
export function getEnvironmentGenerator(): RequestIdGenerator {
  const isProduction = process.env.NODE_ENV === 'production'

  return new RequestIdGenerator({
    strategy: isProduction ? 'uuid' : 'short',
    prefix: isProduction ? 'prod-' : 'dev-',
    acceptClientId: !isProduction
  })
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export