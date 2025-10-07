/**
 * @fileoverview ================================================================AI銷售賦能平台 - 請求驗證中間件 (lib/middleware/request-validator.ts)================================================================【檔案功能】提供全面的請求驗證功能，使用 Zod schema 驗證請求數據。確保 API 輸入的正確性和安全性，防止無效數據進入系統。【主要職責】• Schema 驗證 - 使用 Zod 驗證請求數據結構• 多源驗證 - 支援 body/query/params/headers 驗證• 錯誤格式化 - 提供清晰的驗證錯誤消息• 類型安全 - TypeScript 類型推導和保護• 自定義規則 - 支援業務邏輯驗證規則【技術實現】• Zod Integration - 完整的 Zod schema 支援• Error Formatting - 友好的錯誤消息格式• Type Inference - 自動類型推導• Async Validation - 支援異步驗證規則• Edge Compatible - 支援 Edge Runtime【使用場景】• API Input 驗證 - 確保請求數據格式正確• 安全防護 - 防止惡意輸入和注入攻擊• 業務規則 - 驗證業務邏輯約束• 數據清理 - 自動轉換和淨化輸入數據• 文檔生成 - Schema 可用於 API 文檔生成【相關檔案】• middleware.ts - 使用驗證中間件處理請求• app/api/{route}/route.ts - API 路由中的驗證應用• docs/api-validation-guide.md - 驗證規則文檔作者：Claude Code創建時間：2025-09-30
 * @module lib/middleware/request-validator
 * @description
 * ================================================================AI銷售賦能平台 - 請求驗證中間件 (lib/middleware/request-validator.ts)================================================================【檔案功能】提供全面的請求驗證功能，使用 Zod schema 驗證請求數據。確保 API 輸入的正確性和安全性，防止無效數據進入系統。【主要職責】• Schema 驗證 - 使用 Zod 驗證請求數據結構• 多源驗證 - 支援 body/query/params/headers 驗證• 錯誤格式化 - 提供清晰的驗證錯誤消息• 類型安全 - TypeScript 類型推導和保護• 自定義規則 - 支援業務邏輯驗證規則【技術實現】• Zod Integration - 完整的 Zod schema 支援• Error Formatting - 友好的錯誤消息格式• Type Inference - 自動類型推導• Async Validation - 支援異步驗證規則• Edge Compatible - 支援 Edge Runtime【使用場景】• API Input 驗證 - 確保請求數據格式正確• 安全防護 - 防止惡意輸入和注入攻擊• 業務規則 - 驗證業務邏輯約束• 數據清理 - 自動轉換和淨化輸入數據• 文檔生成 - Schema 可用於 API 文檔生成【相關檔案】• middleware.ts - 使用驗證中間件處理請求• app/api/{route}/route.ts - API 路由中的驗證應用• docs/api-validation-guide.md - 驗證規則文檔作者：Claude Code創建時間：2025-09-30
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError, ZodSchema, ZodIssue } from 'zod'

/**
 * 驗證目標類型
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers'

/**
 * 驗證配置接口
 */
export interface ValidationConfig {
  /**
   * Body schema (用於 POST/PUT/PATCH 請求)
   */
  body?: ZodSchema

  /**
   * Query parameters schema
   */
  query?: ZodSchema

  /**
   * URL parameters schema
   */
  params?: ZodSchema

  /**
   * Headers schema
   */
  headers?: ZodSchema

  /**
   * 是否允許額外的欄位
   * 默認: false (strict mode)
   */
  allowExtra?: boolean

  /**
   * 是否自動清理數據 (移除未定義的欄位)
   * 默認: true
   */
  stripUnknown?: boolean

  /**
   * 自定義錯誤處理器
   */
  errorHandler?: (errors: ValidationError[]) => NextResponse

  /**
   * 驗證成功後的回調
   */
  onSuccess?: (validatedData: ValidatedData) => void | Promise<void>
}

/**
 * 驗證錯誤接口
 */
export interface ValidationError {
  /**
   * 錯誤的欄位路徑
   */
  path: (string | number)[]

  /**
   * 錯誤消息
   */
  message: string

  /**
   * 錯誤代碼
   */
  code: string

  /**
   * 驗證目標 (body/query/params/headers)
   */
  target: ValidationTarget
}

/**
 * 驗證結果接口
 */
export interface ValidationResult<T = any> {
  /**
   * 是否驗證成功
   */
  success: boolean

  /**
   * 驗證後的數據 (僅在成功時)
   */
  data?: T

  /**
   * 驗證錯誤列表 (僅在失敗時)
   */
  errors?: ValidationError[]
}

/**
 * 已驗證的數據接口
 */
export interface ValidatedData {
  body?: any
  query?: any
  params?: any
  headers?: any
}

/**
 * 請求驗證中間件類
 *
 * 提供全面的請求數據驗證功能。
 *
 * @example
 * ```typescript
 * const validator = new RequestValidator({
 *   body: z.object({
 *     name: z.string().min(1),
 *     email: z.string().email()
 *   })
 * })
 *
 * export async function POST(request: NextRequest) {
 *   const result = await validator.validate(request)
 *   if (!result.success) {
 *     return NextResponse.json({ errors: result.errors }, { status: 400 })
 *   }
 *   // 使用 result.data.body
 * }
 * ```
 */
export class RequestValidator {
  private config: ValidationConfig

  /**
   * 構造函數
   *
   * @param config 驗證配置
   */
  constructor(config: ValidationConfig) {
    this.config = {
      allowExtra: false,
      stripUnknown: true,
      ...config
    }
  }

  /**
   * 驗證請求
   *
   * 根據配置的 schema 驗證請求的各個部分。
   *
   * @param request Next.js 請求對象
   * @param params 可選的 URL 參數對象
   * @returns 驗證結果
   */
  async validate(
    request: NextRequest,
    params?: Record<string, string>
  ): Promise<ValidationResult> {
    const validatedData: ValidatedData = {}
    const errors: ValidationError[] = []

    // 驗證 body
    if (this.config.body) {
      const bodyResult = await this.validateBody(request)
      if (bodyResult.success) {
        validatedData.body = bodyResult.data
      } else {
        errors.push(...(bodyResult.errors || []))
      }
    }

    // 驗證 query parameters
    if (this.config.query) {
      const queryResult = this.validateQuery(request)
      if (queryResult.success) {
        validatedData.query = queryResult.data
      } else {
        errors.push(...(queryResult.errors || []))
      }
    }

    // 驗證 URL parameters
    if (this.config.params && params) {
      const paramsResult = this.validateParams(params)
      if (paramsResult.success) {
        validatedData.params = paramsResult.data
      } else {
        errors.push(...(paramsResult.errors || []))
      }
    }

    // 驗證 headers
    if (this.config.headers) {
      const headersResult = this.validateHeaders(request)
      if (headersResult.success) {
        validatedData.headers = headersResult.data
      } else {
        errors.push(...(headersResult.errors || []))
      }
    }

    // 返回結果
    if (errors.length > 0) {
      return {
        success: false,
        errors
      }
    }

    // 調用成功回調
    if (this.config.onSuccess) {
      await this.config.onSuccess(validatedData)
    }

    return {
      success: true,
      data: validatedData
    }
  }

  /**
   * 處理驗證並返回響應
   *
   * 便捷方法，自動處理驗證錯誤響應。
   *
   * @param request Next.js 請求對象
   * @param params 可選的 URL 參數對象
   * @returns 驗證結果或錯誤響應
   */
  async handle(
    request: NextRequest,
    params?: Record<string, string>
  ): Promise<NextResponse | ValidationResult> {
    const result = await this.validate(request, params)

    if (!result.success) {
      // 使用自定義錯誤處理器或默認處理器
      if (this.config.errorHandler) {
        return this.config.errorHandler(result.errors!)
      }

      return this.createErrorResponse(result.errors!)
    }

    return result
  }

  /**
   * 驗證請求 body
   *
   * @param request 請求對象
   * @returns 驗證結果
   */
  private async validateBody(request: NextRequest): Promise<ValidationResult> {
    try {
      // 解析 JSON body
      let body: any
      try {
        body = await request.json()
      } catch (error) {
        return {
          success: false,
          errors: [
            {
              path: ['body'],
              message: 'Invalid JSON in request body',
              code: 'invalid_json',
              target: 'body'
            }
          ]
        }
      }

      // 使用 schema 驗證
      const validated = this.config.body!.parse(body)

      return {
        success: true,
        data: validated
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error, 'body')
        }
      }

      return {
        success: false,
        errors: [
          {
            path: ['body'],
            message: 'Validation failed',
            code: 'validation_error',
            target: 'body'
          }
        ]
      }
    }
  }

  /**
   * 驗證 query parameters
   *
   * @param request 請求對象
   * @returns 驗證結果
   */
  private validateQuery(request: NextRequest): ValidationResult {
    try {
      // 從 URL 提取 query parameters
      const query: Record<string, any> = {}
      request.nextUrl.searchParams.forEach((value, key) => {
        query[key] = value
      })

      // 使用 schema 驗證
      const validated = this.config.query!.parse(query)

      return {
        success: true,
        data: validated
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error, 'query')
        }
      }

      return {
        success: false,
        errors: [
          {
            path: ['query'],
            message: 'Validation failed',
            code: 'validation_error',
            target: 'query'
          }
        ]
      }
    }
  }

  /**
   * 驗證 URL parameters
   *
   * @param params 參數對象
   * @returns 驗證結果
   */
  private validateParams(params: Record<string, string>): ValidationResult {
    try {
      // 使用 schema 驗證
      const validated = this.config.params!.parse(params)

      return {
        success: true,
        data: validated
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error, 'params')
        }
      }

      return {
        success: false,
        errors: [
          {
            path: ['params'],
            message: 'Validation failed',
            code: 'validation_error',
            target: 'params'
          }
        ]
      }
    }
  }

  /**
   * 驗證 headers
   *
   * @param request 請求對象
   * @returns 驗證結果
   */
  private validateHeaders(request: NextRequest): ValidationResult {
    try {
      // 從請求中提取 headers
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        headers[key] = value
      })

      // 使用 schema 驗證
      const validated = this.config.headers!.parse(headers)

      return {
        success: true,
        data: validated
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error, 'headers')
        }
      }

      return {
        success: false,
        errors: [
          {
            path: ['headers'],
            message: 'Validation failed',
            code: 'validation_error',
            target: 'headers'
          }
        ]
      }
    }
  }

  /**
   * 格式化 Zod 錯誤
   *
   * 將 Zod 錯誤轉換為統一的錯誤格式。
   *
   * @param error Zod 錯誤對象
   * @param target 驗證目標
   * @returns 格式化的錯誤列表
   */
  private formatZodErrors(error: ZodError, target: ValidationTarget): ValidationError[] {
    return error.issues.map((issue: ZodIssue) => ({
      path: issue.path,
      message: issue.message,
      code: issue.code,
      target
    }))
  }

  /**
   * 創建錯誤響應
   *
   * @param errors 錯誤列表
   * @returns Next.js 響應對象
   */
  private createErrorResponse(errors: ValidationError[]): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors: errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          target: err.target
        }))
      },
      { status: 400 }
    )
  }
}

/**
 * 創建請求驗證器的便捷函數
 *
 * @param config 驗證配置
 * @returns 請求驗證器實例
 *
 * @example
 * ```typescript
 * import { createRequestValidator } from '@/lib/middleware/request-validator'
 * import { z } from 'zod'
 *
 * const validator = createRequestValidator({
 *   body: z.object({
 *     name: z.string().min(1).max(100),
 *     email: z.string().email(),
 *     age: z.number().int().positive().optional()
 *   })
 * })
 *
 * export async function POST(request: NextRequest) {
 *   const result = await validator.handle(request)
 *   if (result instanceof NextResponse) {
 *     return result // 驗證失敗，返回錯誤響應
 *   }
 *   // 使用 result.data.body
 * }
 * ```
 */
export function createRequestValidator(config: ValidationConfig): RequestValidator {
  return new RequestValidator(config)
}

/**
 * 驗證中間件工廠函數
 *
 * 創建一個可以直接用於中間件的驗證函數。
 *
 * @param config 驗證配置
 * @returns 驗證中間件函數
 *
 * @example
 * ```typescript
 * import { validateRequest } from '@/lib/middleware/request-validator'
 * import { z } from 'zod'
 *
 * export const POST = validateRequest({
 *   body: z.object({
 *     name: z.string(),
 *     email: z.string().email()
 *   })
 * })(async (request, { data }) => {
 *   // data.body 已經過驗證
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function validateRequest(config: ValidationConfig) {
  const validator = new RequestValidator(config)

  return function (
    handler: (
      request: NextRequest,
      context: { data: ValidatedData; params?: Record<string, string> }
    ) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, params?: Record<string, string>) => {
      const result = await validator.validate(request, params)

      if (!result.success) {
        if (config.errorHandler) {
          return config.errorHandler(result.errors!)
        }
        return validator['createErrorResponse'](result.errors!)
      }

      return handler(request, { data: result.data!, params })
    }
  }
}

/**
 * 常用驗證 schema 預設
 */
export const CommonSchemas = {
  /**
   * 分頁參數 schema
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  /**
   * ID 參數 schema
   */
  id: z.object({
    id: z.string().uuid()
  }),

  /**
   * 日期範圍 schema
   */
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  }),

  /**
   * 搜索參數 schema
   */
  search: z.object({
    q: z.string().min(1).max(200),
    filters: z.record(z.string()).optional()
  }),

  /**
   * 認證 headers schema
   */
  authHeaders: z.object({
    authorization: z.string().regex(/^Bearer .+$/, 'Invalid authorization header format')
  })
}

/**
 * 類型導出
 */
// 類型已在文件開頭導出，無需重複export