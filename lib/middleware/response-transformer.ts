/**
 * ================================================================
 * AI銷售賦能平台 - 響應轉換中間件 (lib/middleware/response-transformer.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供全面的響應轉換功能，支援多種格式、分頁包裝和 HATEOAS 連結生成。
 * 確保 API 響應的一致性、可讀性和 RESTful 最佳實踐。
 *
 * 【主要職責】
 * • Content Negotiation - 根據 Accept header 返回不同格式
 * • Format Transformation - JSON/XML/CSV 格式轉換
 * • Pagination Envelope - 統一的分頁響應格式
 * • HATEOAS Links - 自動生成相關資源連結
 * • Field Filtering - 根據查詢參數選擇性返回欄位
 * • Response Normalization - 標準化響應結構
 *
 * 【技術實現】
 * • Content Type Negotiation - 智能格式選擇
 * • Transformer Pipeline - 可組合的轉換鏈
 * • Hypermedia Support - RESTful HATEOAS 實現
 * • Selective Serialization - 欄位過濾和投影
 * • Edge Compatible - 支援 Edge Runtime
 *
 * 【使用場景】
 * • RESTful API - 標準化響應格式
 * • 分頁端點 - 統一分頁結構
 * • 資源導航 - HATEOAS 連結生成
 * • 多格式支援 - JSON/XML/CSV 輸出
 * • 性能優化 - 欄位過濾減少傳輸
 *
 * 【相關檔案】
 * • middleware.ts - 使用轉換中間件處理響應
 * • app/api/{route}/route.ts - API 路由中的響應轉換
 * • docs/api-response-format.md - 響應格式文檔
 *
 * 作者：Claude Code
 * 創建時間：2025-09-30
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * 響應格式類型
 */
export type ResponseFormat = 'json' | 'xml' | 'csv'

/**
 * 分頁元數據接口
 */
export interface PaginationMeta {
  /**
   * 當前頁碼
   */
  page: number

  /**
   * 每頁數量
   */
  limit: number

  /**
   * 總記錄數
   */
  total: number

  /**
   * 總頁數
   */
  totalPages: number

  /**
   * 是否有下一頁
   */
  hasNext: boolean

  /**
   * 是否有上一頁
   */
  hasPrev: boolean
}

/**
 * HATEOAS 連結接口
 */
export interface HateoasLink {
  /**
   * 連結關係類型
   */
  rel: 'self' | 'next' | 'prev' | 'first' | 'last' | string

  /**
   * 連結 URL
   */
  href: string

  /**
   * HTTP 方法
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

  /**
   * 連結描述
   */
  title?: string
}

/**
 * 分頁響應接口
 */
export interface PaginatedResponse<T = any> {
  /**
   * 響應數據
   */
  data: T[]

  /**
   * 分頁元數據
   */
  meta: PaginationMeta

  /**
   * HATEOAS 連結
   */
  links?: HateoasLink[]
}

/**
 * 響應轉換選項
 */
export interface TransformOptions {
  /**
   * 是否啟用分頁包裝
   * 默認: false
   */
  paginate?: boolean

  /**
   * 分頁元數據
   */
  pagination?: {
    page: number
    limit: number
    total: number
  }

  /**
   * 是否啟用 HATEOAS 連結
   * 默認: true
   */
  enableLinks?: boolean

  /**
   * 基礎 URL (用於生成連結)
   */
  baseUrl?: string

  /**
   * 資源路徑 (用於生成連結)
   */
  resourcePath?: string

  /**
   * 允許的響應格式
   * 默認: ['json']
   */
  allowedFormats?: ResponseFormat[]

  /**
   * 默認格式
   * 默認: 'json'
   */
  defaultFormat?: ResponseFormat

  /**
   * 是否啟用欄位過濾
   * 默認: true
   */
  enableFieldFiltering?: boolean

  /**
   * 是否包裝單一對象
   * 默認: false (直接返回對象)
   */
  wrapSingleObject?: boolean

  /**
   * 自訂數據轉換器
   */
  customTransformer?: (data: any) => any

  /**
   * 自訂連結生成器
   */
  customLinkGenerator?: (
    request: NextRequest,
    data: any,
    pagination?: PaginationMeta
  ) => HateoasLink[]
}

/**
 * 響應轉換中間件類
 *
 * 提供完整的響應轉換功能，支援多種格式和 RESTful 最佳實踐。
 *
 * @example
 * ```typescript
 * const transformer = new ResponseTransformer({
 *   enableLinks: true,
 *   baseUrl: 'https://api.example.com'
 * })
 *
 * export async function GET(request: NextRequest) {
 *   const data = await fetchData()
 *   return transformer.transform(request, data, {
 *     paginate: true,
 *     pagination: { page: 1, limit: 10, total: 100 }
 *   })
 * }
 * ```
 */
export class ResponseTransformer {
  private options: TransformOptions

  /**
   * 構造函數
   *
   * @param options 轉換選項
   */
  constructor(options: TransformOptions = {}) {
    this.options = {
      enableLinks: true,
      allowedFormats: ['json'],
      defaultFormat: 'json',
      enableFieldFiltering: true,
      wrapSingleObject: false,
      ...options
    }
  }

  /**
   * 轉換響應
   *
   * 根據配置和請求參數轉換響應數據。
   *
   * @param request Next.js 請求對象
   * @param data 響應數據
   * @param options 可選的轉換選項（覆蓋構造函數選項）
   * @returns 轉換後的響應
   */
  transform(
    request: NextRequest,
    data: any,
    options?: Partial<TransformOptions>
  ): NextResponse {
    const mergedOptions = { ...this.options, ...options }

    // 1. 應用自訂轉換器
    let transformedData = mergedOptions.customTransformer
      ? mergedOptions.customTransformer(data)
      : data

    // 2. 應用欄位過濾
    if (mergedOptions.enableFieldFiltering) {
      transformedData = this.filterFields(request, transformedData)
    }

    // 3. 包裝響應（分頁或標準）
    let wrappedData: any
    if (mergedOptions.paginate && mergedOptions.pagination) {
      wrappedData = this.wrapPaginated(
        request,
        transformedData,
        mergedOptions.pagination,
        mergedOptions
      )
    } else if (mergedOptions.wrapSingleObject) {
      wrappedData = { data: transformedData }
    } else {
      wrappedData = transformedData
    }

    // 4. 選擇響應格式
    const format = this.negotiateFormat(request, mergedOptions)

    // 5. 轉換為目標格式
    return this.formatResponse(wrappedData, format)
  }

  /**
   * 包裝分頁響應
   *
   * @param request 請求對象
   * @param data 數據
   * @param pagination 分頁信息
   * @param options 選項
   * @returns 分頁響應對象
   */
  private wrapPaginated(
    request: NextRequest,
    data: any[],
    pagination: { page: number; limit: number; total: number },
    options: TransformOptions
  ): PaginatedResponse {
    const { page, limit, total } = pagination
    const totalPages = Math.ceil(total / limit)

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    const response: PaginatedResponse = {
      data,
      meta
    }

    // 添加 HATEOAS 連結
    if (options.enableLinks) {
      response.links = options.customLinkGenerator
        ? options.customLinkGenerator(request, data, meta)
        : this.generatePaginationLinks(request, meta, options)
    }

    return response
  }

  /**
   * 生成分頁 HATEOAS 連結
   *
   * @param request 請求對象
   * @param meta 分頁元數據
   * @param options 選項
   * @returns 連結數組
   */
  private generatePaginationLinks(
    request: NextRequest,
    meta: PaginationMeta,
    options: TransformOptions
  ): HateoasLink[] {
    const links: HateoasLink[] = []
    const baseUrl = options.baseUrl || request.nextUrl.origin
    const pathname = options.resourcePath || request.nextUrl.pathname

    // 獲取當前查詢參數
    const params = new URLSearchParams(request.nextUrl.searchParams)

    // self 連結
    params.set('page', meta.page.toString())
    params.set('limit', meta.limit.toString())
    links.push({
      rel: 'self',
      href: `${baseUrl}${pathname}?${params.toString()}`,
      method: 'GET'
    })

    // first 連結（只在不是第一頁時添加）
    if (meta.page !== 1) {
      params.set('page', '1')
      links.push({
        rel: 'first',
        href: `${baseUrl}${pathname}?${params.toString()}`,
        method: 'GET'
      })
    }

    // prev 連結
    if (meta.hasPrev) {
      params.set('page', (meta.page - 1).toString())
      links.push({
        rel: 'prev',
        href: `${baseUrl}${pathname}?${params.toString()}`,
        method: 'GET'
      })
    }

    // next 連結
    if (meta.hasNext) {
      params.set('page', (meta.page + 1).toString())
      links.push({
        rel: 'next',
        href: `${baseUrl}${pathname}?${params.toString()}`,
        method: 'GET'
      })
    }

    // last 連結（只在不是最後一頁時添加）
    if (meta.page !== meta.totalPages) {
      params.set('page', meta.totalPages.toString())
      links.push({
        rel: 'last',
        href: `${baseUrl}${pathname}?${params.toString()}`,
        method: 'GET'
      })
    }

    return links
  }

  /**
   * 協商響應格式
   *
   * 根據 Accept header 和查詢參數決定響應格式。
   *
   * @param request 請求對象
   * @param options 選項
   * @returns 選定的格式
   */
  private negotiateFormat(
    request: NextRequest,
    options: TransformOptions
  ): ResponseFormat {
    // 1. 檢查查詢參數 (優先級最高)
    const formatParam = request.nextUrl.searchParams.get('format')
    if (formatParam && this.isValidFormat(formatParam, options)) {
      return formatParam as ResponseFormat
    }

    // 2. 檢查 Accept header
    const acceptHeader = request.headers.get('accept')
    if (acceptHeader) {
      if (
        acceptHeader.includes('application/xml') &&
        options.allowedFormats?.includes('xml')
      ) {
        return 'xml'
      }
      if (
        acceptHeader.includes('text/csv') &&
        options.allowedFormats?.includes('csv')
      ) {
        return 'csv'
      }
    }

    // 3. 使用默認格式
    return options.defaultFormat || 'json'
  }

  /**
   * 驗證格式是否有效
   *
   * @param format 格式字符串
   * @param options 選項
   * @returns 是否有效
   */
  private isValidFormat(format: string, options: TransformOptions): boolean {
    return (
      options.allowedFormats?.includes(format as ResponseFormat) || false
    )
  }

  /**
   * 過濾響應欄位
   *
   * 根據 ?fields= 參數選擇性返回欄位。
   *
   * @param request 請求對象
   * @param data 數據
   * @returns 過濾後的數據
   */
  private filterFields(request: NextRequest, data: any): any {
    const fieldsParam = request.nextUrl.searchParams.get('fields')
    if (!fieldsParam) {
      return data
    }

    const fields = fieldsParam.split(',').map((f) => f.trim())

    if (Array.isArray(data)) {
      return data.map((item) => this.selectFields(item, fields))
    } else {
      return this.selectFields(data, fields)
    }
  }

  /**
   * 選擇對象的指定欄位
   *
   * @param obj 對象
   * @param fields 欄位列表
   * @returns 過濾後的對象
   */
  private selectFields(obj: any, fields: string[]): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    const result: any = {}
    fields.forEach((field) => {
      // 支援嵌套欄位 (例如: user.name)
      if (field.includes('.')) {
        const parts = field.split('.')
        let value = obj
        let valid = true

        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part]
          } else {
            valid = false
            break
          }
        }

        if (valid) {
          this.setNestedField(result, parts, value)
        }
      } else if (field in obj) {
        result[field] = obj[field]
      }
    })

    return result
  }

  /**
   * 設置嵌套欄位
   *
   * @param obj 目標對象
   * @param path 路徑數組
   * @param value 值
   */
  private setNestedField(obj: any, path: string[], value: any): void {
    let current = obj
    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in current)) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
  }

  /**
   * 格式化響應
   *
   * 將數據轉換為指定格式。
   *
   * @param data 數據
   * @param format 格式
   * @returns Next.js 響應對象
   */
  private formatResponse(data: any, format: ResponseFormat): NextResponse {
    switch (format) {
      case 'json':
        return NextResponse.json(data)

      case 'xml':
        const xml = this.toXML(data)
        return new NextResponse(xml, {
          headers: {
            'Content-Type': 'application/xml'
          }
        })

      case 'csv':
        const csv = this.toCSV(data)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="data.csv"'
          }
        })

      default:
        return NextResponse.json(data)
    }
  }

  /**
   * 轉換為 XML
   *
   * @param data 數據
   * @returns XML 字符串
   */
  private toXML(data: any): string {
    const buildXML = (obj: any, rootName: string = 'root'): string => {
      if (obj === null || obj === undefined) {
        return `<${rootName}/>`
      }

      if (typeof obj !== 'object') {
        return `<${rootName}>${this.escapeXML(String(obj))}</${rootName}>`
      }

      if (Array.isArray(obj)) {
        const items = obj
          .map((item, index) => buildXML(item, 'item'))
          .join('')
        return `<${rootName}>${items}</${rootName}>`
      }

      const entries = Object.entries(obj)
        .map(([key, value]) => buildXML(value, key))
        .join('')
      return `<${rootName}>${entries}</${rootName}>`
    }

    return `<?xml version="1.0" encoding="UTF-8"?>${buildXML(data, 'response')}`
  }

  /**
   * 轉義 XML 特殊字符
   *
   * @param str 字符串
   * @returns 轉義後的字符串
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * 轉換為 CSV
   *
   * @param data 數據
   * @returns CSV 字符串
   */
  private toCSV(data: any): string {
    // 處理分頁響應
    const items = data.data ? data.data : Array.isArray(data) ? data : [data]

    if (items.length === 0) {
      return ''
    }

    // 提取所有可能的欄位
    const fields = new Set<string>()
    items.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((key) => fields.add(key))
      }
    })

    const fieldArray = Array.from(fields)

    // 生成 CSV header
    const header = fieldArray.map((f) => this.escapeCSV(f)).join(',')

    // 生成 CSV rows
    const rows = items.map((item: any) => {
      return fieldArray
        .map((field) => {
          const value = item[field]
          if (value === null || value === undefined) {
            return ''
          }
          if (typeof value === 'object') {
            return this.escapeCSV(JSON.stringify(value))
          }
          return this.escapeCSV(String(value))
        })
        .join(',')
    })

    return [header, ...rows].join('\n')
  }

  /**
   * 轉義 CSV 特殊字符
   *
   * @param str 字符串
   * @returns 轉義後的字符串
   */
  private escapeCSV(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
}

/**
 * 創建響應轉換器的便捷函數
 *
 * @param options 轉換選項
 * @returns 響應轉換器實例
 *
 * @example
 * ```typescript
 * import { createResponseTransformer } from '@/lib/middleware/response-transformer'
 *
 * const transformer = createResponseTransformer({
 *   enableLinks: true,
 *   allowedFormats: ['json', 'xml', 'csv']
 * })
 *
 * export async function GET(request: NextRequest) {
 *   const users = await fetchUsers()
 *   return transformer.transform(request, users, {
 *     paginate: true,
 *     pagination: { page: 1, limit: 10, total: 100 }
 *   })
 * }
 * ```
 */
export function createResponseTransformer(
  options?: TransformOptions
): ResponseTransformer {
  return new ResponseTransformer(options)
}

/**
 * 響應轉換中間件工廠函數
 *
 * 創建一個可以包裝路由處理器的中間件函數。
 *
 * @param options 轉換選項
 * @returns 中間件函數
 *
 * @example
 * ```typescript
 * import { withResponseTransformer } from '@/lib/middleware/response-transformer'
 *
 * export const GET = withResponseTransformer({
 *   enableLinks: true,
 *   paginate: true
 * })(async (request) => {
 *   const data = await fetchData()
 *   // 直接返回數據，中間件會自動轉換
 *   return { data }
 * })
 * ```
 */
export function withResponseTransformer(options?: TransformOptions) {
  const transformer = new ResponseTransformer(options)

  return function (
    handler: (request: NextRequest, params?: any) => Promise<any>
  ) {
    return async (request: NextRequest, params?: any) => {
      const result = await handler(request, params)

      // 如果已經是 NextResponse，直接返回
      if (result instanceof NextResponse) {
        return result
      }

      // 否則進行轉換
      return transformer.transform(request, result, options)
    }
  }
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export