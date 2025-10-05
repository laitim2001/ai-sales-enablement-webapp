/**
 * Request Transformation 中間件
 *
 * 提供請求數據的標準化、清理和轉換功能，確保 API 接收到格式統一的數據。
 *
 * 【核心功能】
 * 1. 數據標準化 - 統一欄位命名、日期格式、數值格式
 * 2. 批量請求處理 - 支援批量操作的包裝和解包
 * 3. 數據轉換 - 扁平化/深化、結構重組
 * 4. 數據清理 - 移除空值、修剪空白、去重
 *
 * 【使用場景】
 * - 前端數據格式不統一（camelCase vs snake_case）
 * - 需要批量處理多個請求
 * - 需要清理和標準化用戶輸入
 * - 需要轉換嵌套數據結構
 *
 * 【使用範例】
 * ```typescript
 * import { createRequestTransformer } from '@/lib/middleware/request-transformer'
 *
 * const transformer = createRequestTransformer({
 *   fieldNaming: 'snake_case',
 *   removeEmpty: true,
 *   trimStrings: true
 * })
 *
 * export async function POST(request: NextRequest) {
 *   const transformedRequest = await transformer.transform(request)
 *   // 現在 request body 已經標準化
 * }
 * ```
 *
 * @module lib/middleware/request-transformer
 * @author Claude Code
 * @since 2025-10-01
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * 欄位命名格式
 */
export type FieldNamingFormat = 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase'

/**
 * 日期格式
 */
export type DateFormat = 'iso' | 'timestamp' | 'custom'

/**
 * 轉換選項
 *
 * 控制請求轉換行為的配置選項。
 */
export interface TransformOptions {
  /**
   * 欄位命名格式轉換
   * @default undefined (不轉換)
   */
  fieldNaming?: FieldNamingFormat

  /**
   * 日期格式化選項
   * @default 'iso'
   */
  dateFormat?: DateFormat

  /**
   * 自定義日期格式字符串（當 dateFormat 為 'custom' 時使用）
   */
  customDateFormat?: string

  /**
   * 是否移除空值欄位（null、undefined、空字符串）
   * @default false
   */
  removeEmpty?: boolean

  /**
   * 是否修剪字符串前後空白
   * @default false
   */
  trimStrings?: boolean

  /**
   * 是否移除數組中的重複項
   * @default false
   */
  removeDuplicates?: boolean

  /**
   * 是否扁平化嵌套對象
   * @default false
   */
  flatten?: boolean

  /**
   * 是否深化扁平對象
   * @default false
   */
  unflatten?: boolean

  /**
   * 扁平化/深化的最大深度
   * @default 10
   */
  maxDepth?: number

  /**
   * 是否啟用批量請求處理
   * @default false
   */
  enableBatch?: boolean

  /**
   * 批量請求的最大數量
   * @default 100
   */
  maxBatchSize?: number

  /**
   * 自定義轉換器函數數組
   */
  customTransformers?: TransformerFunction[]

  /**
   * 是否啟用轉換（總開關）
   * @default true
   */
  enabled?: boolean
}

/**
 * 批量請求項
 */
export interface BatchRequestItem {
  /**
   * 請求 ID（可選，用於追蹤）
   */
  id?: string

  /**
   * HTTP 方法
   */
  method: string

  /**
   * 請求路徑
   */
  url: string

  /**
   * 請求體
   */
  body?: any

  /**
   * 請求頭
   */
  headers?: Record<string, string>
}

/**
 * 批量請求格式
 */
export interface BatchRequest {
  /**
   * 批量請求數組
   */
  batch: BatchRequestItem[]
}

/**
 * 批量響應項
 */
export interface BatchResponseItem {
  /**
   * 請求 ID
   */
  id?: string

  /**
   * 狀態碼
   */
  status: number

  /**
   * 響應體
   */
  body?: any

  /**
   * 錯誤信息
   */
  error?: string
}

/**
 * 轉換器函數類型
 *
 * 接收數據並返回轉換後的數據。
 */
export type TransformerFunction = (data: any) => any

/**
 * 請求轉換中間件類
 *
 * 提供完整的請求數據轉換功能。
 */
export class RequestTransformer {
  private options: Required<TransformOptions>

  /**
   * 構造函數
   *
   * @param options 轉換選項
   */
  constructor(options: TransformOptions = {}) {
    this.options = {
      fieldNaming: options.fieldNaming || 'snake_case',
      dateFormat: options.dateFormat || 'iso',
      customDateFormat: options.customDateFormat || '',
      removeEmpty: options.removeEmpty ?? false,
      trimStrings: options.trimStrings ?? false,
      removeDuplicates: options.removeDuplicates ?? false,
      flatten: options.flatten ?? false,
      unflatten: options.unflatten ?? false,
      maxDepth: options.maxDepth ?? 10,
      enableBatch: options.enableBatch ?? false,
      maxBatchSize: options.maxBatchSize ?? 100,
      customTransformers: options.customTransformers ?? [],
      enabled: options.enabled ?? true
    }
  }

  /**
   * 轉換請求
   *
   * 主要入口方法，轉換請求的 body 數據。
   *
   * @param request Next.js 請求對象
   * @returns 轉換後的請求對象
   */
  async transform(request: NextRequest): Promise<NextRequest> {
    if (!this.options.enabled) {
      return request
    }

    // 只處理有 body 的請求
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return request
    }

    try {
      // 解析請求 body
      const body = await request.json()

      // 檢查是否為批量請求
      if (this.options.enableBatch && this.isBatchRequest(body)) {
        // 批量請求處理將在實際執行時進行
        // 這裡只做驗證
        this.validateBatchRequest(body as BatchRequest)

        // 對於批量請求，也要轉換每個項目的 body
        const transformedBatch = {
          ...body,
          batch: body.batch.map((item: any) => ({
            ...item,
            body: item.body ? this.applyAllTransformations(item.body) : item.body
          }))
        }

        return new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(transformedBatch)
        })
      }

      // 應用所有轉換
      const transformedData = this.applyAllTransformations(body)

      // 創建新的請求對象（帶有轉換後的 body）
      return new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(transformedData)
      })
    } catch (error) {
      // 重新拋出驗證錯誤
      if (error instanceof Error && error.message.includes('Batch')) {
        throw error
      }
      // 對於其他錯誤（如 JSON 解析錯誤），返回原始請求
      console.error('Request transformation error:', error)
      return request
    }
  }

  /**
   * 應用所有轉換
   *
   * @param data 要轉換的數據
   * @returns 轉換後的數據
   */
  private applyAllTransformations(data: any): any {
    let transformedData = data

    // 1. 數據清理
    if (this.options.removeEmpty || this.options.trimStrings) {
      transformedData = this.cleanData(transformedData)
    }

    // 2. 欄位命名轉換
    if (this.options.fieldNaming) {
      transformedData = this.transformFieldNames(
        transformedData,
        this.options.fieldNaming
      )
    }

    // 3. 日期格式化
    transformedData = this.formatDates(transformedData)

    // 4. 扁平化/深化
    if (this.options.flatten) {
      transformedData = this.flattenObject(transformedData, this.options.maxDepth)
    } else if (this.options.unflatten) {
      transformedData = this.unflattenObject(transformedData)
    }

    // 5. 去重（對象中的數組欄位）
    if (this.options.removeDuplicates) {
      transformedData = this.removeDuplicatesFromData(transformedData)
    }

    // 6. 自定義轉換器
    if (this.options.customTransformers.length > 0) {
      try {
        transformedData = this.applyCustomTransformers(transformedData)
      } catch (error) {
        console.error('Custom transformer error:', error)
        // 繼續使用當前的 transformedData
      }
    }

    return transformedData
  }

  /**
   * 檢查是否為批量請求
   *
   * @param body 請求體
   * @returns 是否為批量請求
   */
  private isBatchRequest(body: any): boolean {
    return (
      typeof body === 'object' &&
      body !== null &&
      'batch' in body &&
      Array.isArray(body.batch)
    )
  }

  /**
   * 驗證批量請求
   *
   * @param batchRequest 批量請求對象
   * @throws 如果批量請求無效
   */
  private validateBatchRequest(batchRequest: BatchRequest): void {
    if (!Array.isArray(batchRequest.batch)) {
      throw new Error('Batch request must contain a "batch" array')
    }

    if (batchRequest.batch.length === 0) {
      throw new Error('Batch request cannot be empty')
    }

    if (batchRequest.batch.length > this.options.maxBatchSize) {
      throw new Error(
        `Batch size exceeds maximum: ${batchRequest.batch.length} > ${this.options.maxBatchSize}`
      )
    }

    // 驗證每個批量項
    batchRequest.batch.forEach((item, index) => {
      if (!item.method || !item.url) {
        throw new Error(`Batch item ${index} missing required fields: method, url`)
      }

      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      if (!validMethods.includes(item.method.toUpperCase())) {
        throw new Error(`Batch item ${index} has invalid method: ${item.method}`)
      }
    })
  }

  /**
   * 轉換欄位命名格式
   *
   * @param data 數據
   * @param format 目標格式
   * @returns 轉換後的數據
   */
  private transformFieldNames(data: any, format: FieldNamingFormat): any {
    if (data === null || data === undefined) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformFieldNames(item, format))
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      const transformed: any = {}

      for (const [key, value] of Object.entries(data)) {
        const newKey = this.convertFieldName(key, format)
        transformed[newKey] = this.transformFieldNames(value, format)
      }

      return transformed
    }

    return data
  }

  /**
   * 轉換單個欄位名稱
   *
   * @param fieldName 原始欄位名稱
   * @param format 目標格式
   * @returns 轉換後的欄位名稱
   */
  private convertFieldName(fieldName: string, format: FieldNamingFormat): string {
    switch (format) {
      case 'camelCase':
        return this.toCamelCase(fieldName)
      case 'snake_case':
        return this.toSnakeCase(fieldName)
      case 'kebab-case':
        return this.toKebabCase(fieldName)
      case 'PascalCase':
        return this.toPascalCase(fieldName)
      default:
        return fieldName
    }
  }

  /**
   * 轉換為 camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^[A-Z]/, (c) => c.toLowerCase())
  }

  /**
   * 轉換為 snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[-\s]+/g, '_')
  }

  /**
   * 轉換為 kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/[_\s]+/g, '-')
  }

  /**
   * 轉換為 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^[a-z]/, (c) => c.toUpperCase())
  }

  /**
   * 格式化日期
   *
   * @param data 數據
   * @returns 格式化後的數據
   */
  private formatDates(data: any): any {
    if (data === null || data === undefined) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.formatDates(item))
    }

    if (data instanceof Date) {
      return this.formatDate(data)
    }

    if (typeof data === 'object') {
      const formatted: any = {}

      for (const [key, value] of Object.entries(data)) {
        // 檢查是否為日期字符串
        if (typeof value === 'string' && this.isDateString(value)) {
          formatted[key] = this.formatDate(new Date(value))
        } else {
          formatted[key] = this.formatDates(value)
        }
      }

      return formatted
    }

    return data
  }

  /**
   * 檢查字符串是否為日期格式
   */
  private isDateString(str: string): boolean {
    // 簡單的日期檢測（ISO 8601 格式）
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/
    return isoDatePattern.test(str) && !isNaN(Date.parse(str))
  }

  /**
   * 格式化單個日期
   */
  private formatDate(date: Date): any {
    switch (this.options.dateFormat) {
      case 'iso':
        return date.toISOString()
      case 'timestamp':
        return date.getTime()
      case 'custom':
        // 自定義格式化（簡化版）
        return date.toISOString()
      default:
        return date.toISOString()
    }
  }

  /**
   * 清理數據
   *
   * @param data 數據
   * @returns 清理後的數據
   */
  private cleanData(data: any): any {
    if (data === null || data === undefined) {
      return this.options.removeEmpty ? undefined : data
    }

    if (Array.isArray(data)) {
      const cleaned = data.map((item) => this.cleanData(item))
      return this.options.removeEmpty
        ? cleaned.filter((item) => item !== undefined)
        : cleaned
    }

    if (typeof data === 'string') {
      const trimmed = this.options.trimStrings ? data.trim() : data
      return this.options.removeEmpty && trimmed === '' ? undefined : trimmed
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      const cleaned: any = {}

      for (const [key, value] of Object.entries(data)) {
        const cleanedValue = this.cleanData(value)

        // 只保留非空值（如果啟用 removeEmpty）
        if (!this.options.removeEmpty || cleanedValue !== undefined) {
          cleaned[key] = cleanedValue
        }
      }

      return cleaned
    }

    return data
  }

  /**
   * 扁平化對象
   *
   * 將嵌套對象轉換為扁平結構，使用點號分隔嵌套層級。
   *
   * @example
   * { user: { name: 'John', age: 30 } }
   * → { 'user.name': 'John', 'user.age': 30 }
   *
   * @param obj 對象
   * @param maxDepth 最大深度
   * @param prefix 前綴（內部使用）
   * @param depth 當前深度（內部使用）
   * @returns 扁平化的對象
   */
  private flattenObject(
    obj: any,
    maxDepth: number,
    prefix = '',
    depth = 0
  ): any {
    if (
      obj === null ||
      obj === undefined ||
      typeof obj !== 'object' ||
      obj instanceof Date ||
      Array.isArray(obj) ||
      depth >= maxDepth
    ) {
      return prefix ? { [prefix]: obj } : obj
    }

    const flattened: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (
        value !== null &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !Array.isArray(value) &&
        depth < maxDepth - 1
      ) {
        Object.assign(
          flattened,
          this.flattenObject(value, maxDepth, newKey, depth + 1)
        )
      } else {
        flattened[newKey] = value
      }
    }

    return flattened
  }

  /**
   * 深化扁平對象
   *
   * 將扁平對象轉換為嵌套結構。
   *
   * @example
   * { 'user.name': 'John', 'user.age': 30 }
   * → { user: { name: 'John', age: 30 } }
   *
   * @param obj 扁平對象
   * @returns 深化的對象
   */
  private unflattenObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj
    }

    const unflattened: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split('.')
      let current = unflattened

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!(k in current)) {
          current[k] = {}
        }
        current = current[k]
      }

      current[keys[keys.length - 1]] = value
    }

    return unflattened
  }

  /**
   * 移除數組中的重複項
   *
   * @param arr 數組
   * @returns 去重後的數組
   */
  private removeDuplicatesFromArray(arr: any[]): any[] {
    // 使用 JSON 序列化進行對象比較（簡化版）
    const seen = new Set<string>()
    return arr.filter((item) => {
      const key = JSON.stringify(item)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * 遞歸地移除數據中所有數組的重複項
   *
   * @param data 要處理的數據
   * @returns 去重後的數據
   */
  private removeDuplicatesFromData(data: any): any {
    if (Array.isArray(data)) {
      return this.removeDuplicatesFromArray(data.map((item) => this.removeDuplicatesFromData(item)))
    }

    if (data && typeof data === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.removeDuplicatesFromData(value)
      }
      return result
    }

    return data
  }

  /**
   * 應用自定義轉換器
   *
   * @param data 數據
   * @returns 轉換後的數據
   */
  private applyCustomTransformers(data: any): any {
    let transformed = data

    for (const transformer of this.options.customTransformers) {
      try {
        transformed = transformer(transformed)
      } catch (error) {
        console.error('Custom transformer error:', error)
      }
    }

    return transformed
  }
}

/**
 * 創建請求轉換器的便捷函數
 *
 * @param options 轉換選項
 * @returns 請求轉換器實例
 *
 * @example
 * ```typescript
 * const transformer = createRequestTransformer({
 *   fieldNaming: 'snake_case',
 *   removeEmpty: true
 * })
 * ```
 */
export function createRequestTransformer(
  options?: TransformOptions
): RequestTransformer {
  return new RequestTransformer(options)
}

/**
 * 請求轉換中間件工廠函數
 *
 * 創建一個可以包裝路由處理器的中間件函數。
 *
 * @param options 轉換選項
 * @returns 中間件函數
 *
 * @example
 * ```typescript
 * export const POST = withRequestTransformer({
 *   fieldNaming: 'camelCase',
 *   trimStrings: true
 * })(async (request) => {
 *   const body = await request.json()
 *   // body 已經被轉換
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withRequestTransformer(options?: TransformOptions) {
  const transformer = new RequestTransformer(options)

  return function (
    handler: (request: NextRequest, params?: any) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, params?: any): Promise<NextResponse> => {
      try {
        const transformedRequest = await transformer.transform(request)
        return await handler(transformedRequest, params)
      } catch (error) {
        console.error('Request transformation middleware error:', error)
        return NextResponse.json(
          {
            error: 'Request transformation failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        )
      }
    }
  }
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export
export type {
  TransformOptions as RequestTransformOptions,
  TransformerFunction
}
