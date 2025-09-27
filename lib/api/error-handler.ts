/**
 * ================================================================
 * 檔案名稱: API錯誤處理器
 * 檔案用途: AI銷售賦能平台的統一API錯誤處理和回應管理
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. ApiResponse - 統一API回應格式接口
 * 2. ApiErrorHandler - API錯誤處理核心類別
 * 3. withErrorHandling - API路由錯誤處理包裝器
 * 4. tryAsync - 異步操作安全包裝器
 * 5. validateRequired - 必要欄位驗證函數
 * 6. validateRequestBody - 請求體驗證函數
 * 7. validatePaginationParams - 分頁參數驗證函數
 *
 * 技術特色/核心特色:
 * - 統一回應格式: 所有API都返回相同結構的回應
 * - 自動錯誤處理: 結合ErrorClassifier自動識別和處理錯誤
 * - 性能監控: 自動計算和記錄API處理時間
 * - 安全回應: 自動過濾敏感資訊的錯誤回應
 * - 請求追蹤: 每個請求自動生成唯一ID用於追蹤
 * - 驗證整合: 內建多種驗證輔助函數
 *
 * 依賴關係:
 * - Next.js: NextRequest/NextResponse用於API路由處理
 * - @/lib/errors: 依賴統一錯誤處理系統
 * - 支援任意驗證庫（Zod, Joi等）
 *
 * 注意事項:
 * - 所有API路由建議使用withErrorHandling包裝
 * - 自動記錄細節錯誤資訊供後續調試
 * - 支援分頁參數自動驗證和安全範圍限制
 * - 所有輸出都包含請求元數據用於監控
 *
 * 更新記錄:
 * - Week 1: 建立基礎錯誤處理和回應格式
 * - Week 2: 新增withErrorHandling高階函數
 * - Week 3: 新增驗證輔助函數和分頁支援
 * - Week 4: 完善性能監控和記錄功能
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { AppError, ErrorClassifier, ErrorLogger, ErrorMetrics, createErrorContext } from '@/lib/errors'

/**
 * API回應格式接口
 *
 * 定義了平台所有API的統一回應格式。
 * 確保前端可以預期和一致地處理所有API回應。
 *
 * 格式特性:
 * - success: 明確標示請求成功或失敗
 * - data: 成功時的數據載荷（可選）
 * - error: 失敗時的錯誤資訊（可選）
 * - metadata: 請求元數據（可選）
 *
 * 使用範例:
 * ```typescript
 * // 成功回應
 * const response: ApiResponse<User> = {
 *   success: true,
 *   data: user,
 *   metadata: { requestId: 'req_123', timestamp: '...', processingTime: 45 }
 * }
 *
 * // 失敗回應
 * const response: ApiResponse = {
 *   success: false,
 *   error: { type: 'VALIDATION_ERROR', message: '...', statusCode: 400 }
 * }
 * ```
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    type: string
    message: string
    statusCode: number
    timestamp: string
    requestId?: string
  }
  metadata?: {
    requestId: string
    timestamp: string
    processingTime: number
  }
}

/**
 * API錯誤處理器
 *
 * 提供統一的API錯誤處理和回應管理功能。
 * 自動處理錯誤記錄、統計收集和安全回應生成。
 *
 * 核心功能:
 * - 自動錯誤分類和記錄
 * - 安全的客戶端回應生成
 * - 性能監控和計時
 * - 請求追蹤和元數據管理
 * - HTTP標頭和狀態碼管理
 */
export class ApiErrorHandler {
  /**
   * 處理API錯誤
   *
   * 統一處理所有API錯誤，包括錯誤分類、記錄、
   * 統計收集和安全回應生成。
   *
   * 處理流程:
   * 1. 從請求中提取上下文資訊
   * 2. 使用ErrorClassifier自動分類錯誤
   * 3. 記錄錯誤到日誌系統
   * 4. 更新錯誤統計指標
   * 5. 計算請求處理時間
   * 6. 生成安全的客戶端回應
   *
   * @param error 原始錯誤對象
   * @param request HTTP請求對象（可選）
   * @param processingStartTime 請求開始處理時間（可選）
   * @returns 結構化的NextResponse回應
   */
  static async handleError(
    error: any,
    request?: NextRequest,
    processingStartTime?: number
  ): Promise<NextResponse<ApiResponse>> {
    const context = request ? createErrorContext(request) : undefined
    const appError = ErrorClassifier.classify(error, context)

    // 記錄錯誤
    await ErrorLogger.log(appError)

    // 更新錯誤統計
    ErrorMetrics.increment(appError.type)

    // 計算處理時間
    const processingTime = processingStartTime
      ? Date.now() - processingStartTime
      : 0

    // 創建客戶端響應
    const clientResponse = appError.toClientResponse()

    // 添加元數據
    const responseData: ApiResponse = {
      success: false,
      error: clientResponse.error,
      metadata: {
        requestId: context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
        processingTime
      }
    }

    return NextResponse.json(responseData, {
      status: appError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': context?.requestId || 'unknown',
        'X-Error-Type': appError.type,
      }
    })
  }

  /**
   * 創建成功回應
   *
   * 生成統一格式的成功回應，包含數據載荷、
   * 元數據和性能指標。
   *
   * 回應特性:
   * - 統一的成功回應格式
   * - 自動計算請求處理時間
   * - 包含請求追蹤資訊
   * - 支援可選成功訊息
   * - 自動設定相關 HTTP 標頭
   *
   * @param data 回應數據
   * @param request HTTP請求對象（可選）
   * @param processingStartTime 請求開始處理時間（可選）
   * @param message 成功訊息（可選）
   * @returns 結構化的NextResponse回應
   */
  static createSuccessResponse<T>(
    data: T,
    request?: NextRequest,
    processingStartTime?: number,
    message?: string
  ): NextResponse<ApiResponse<T>> {
    const context = request ? createErrorContext(request) : undefined
    const processingTime = processingStartTime
      ? Date.now() - processingStartTime
      : 0

    const responseData: ApiResponse<T> = {
      success: true,
      data,
      metadata: {
        requestId: context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
        processingTime
      }
    }

    // 添加成功訊息（如果有）
    if (message) {
      (responseData as any).message = message
    }

    return NextResponse.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': context?.requestId || 'unknown',
        'X-Processing-Time': processingTime.toString(),
      }
    })
  }
}

/**
 * API路由錯誤處理包裝器
 *
 * 高階函數，為任意API路由處理器添加自動錯誤處理功能。
 * 自動捕獲未處理的異常並轉換為統一的錯誤回應。
 *
 * 使用範例:
 * ```typescript
 * // 包裝API路由處理器
 * export const POST = withErrorHandling(async (request: NextRequest) => {
 *   // 業務邏輯代碼
 *   const data = await processRequest(request)
 *   return ApiErrorHandler.createSuccessResponse(data, request, startTime)
 * })
 * ```
 *
 * 功能特性:
 * - 自動異常捕獲和處理
 * - 自動計算請求處理時間
 * - 統一的錯誤日誌記錄
 * - 保持原始函數簽名
 *
 * @param handler 原API路由處理器
 * @returns 包裝後的處理器
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const processingStartTime = Date.now()
    const request = args[0] as NextRequest

    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)
      return ApiErrorHandler.handleError(error, request, processingStartTime)
    }
  }
}

/**
 * 異步操作安全包裝器
 *
 * 為異步操作提供統一的錯誤處理和轉換。
 * 將任意異常轉換為AppError格式。
 *
 * 使用範例:
 * ```typescript
 * // 包裝可能失敗的異步操作
 * const result = await tryAsync(
 *   () => externalApiCall(),
 *   '外部API調用失敗'
 * )
 * ```
 *
 * @param operation 要執行的異步操作
 * @param errorMessage 自定義錯誤訊息（可選）
 * @returns 操作結果或拋出AppError
 */
export async function tryAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw new AppError(
      errorMessage || 'Operation failed',
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      error instanceof Error ? error : new Error(String(error))
    )
  }
}

/**
 * 必要欄位驗證函數
 *
 * 驗證指定欄位是否存在且非空值。
 * 支援自定義欄位標籤，提供更友好的錯誤訊息。
 *
 * 驗證規則:
 * - undefined, null, '' 都被視為空值
 * - 數字0和false被視為有效值
 * - 空陣列[]和空對象{}被視為有效值
 *
 * 使用範例:
 * ```typescript
 * validateRequired(
 *   { name: 'John', email: '' },
 *   ['name', 'email', 'phone'],
 *   { name: '姓名', email: '電子郵件', phone: '電話號碼' }
 * )
 * // 拋出: "Missing required fields: 電子郵件, 電話號碼"
 * ```
 *
 * @param data 要驗證的數據對象
 * @param requiredFields 必要欄位名稱陣列
 * @param fieldLabels 欄位標籤對應（可選）
 * @throws AppError 當有缺少欄位時
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[],
  fieldLabels?: Record<string, string>
): void {
  const missingFields: string[] = []

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      const label = fieldLabels?.[field] || field
      missingFields.push(label)
    }
  }

  if (missingFields.length > 0) {
    throw AppError.validation(
      `Missing required fields: ${missingFields.join(', ')}`
    )
  }
}

/**
 * 請求體驗證函數
 *
 * 解析和驗證HTTP請求體，支援自定義驗證器。
 * 自動處理JSON解析錯誤和驗證失敗。
 *
 * 功能特性:
 * - 自動JSON解析和錯誤處理
 * - 支援任意驗證庫（Zod, Joi, Yup等）
 * - 統一的驗證錯誤格式
 * - TypeScript類型安全
 *
 * 使用範例:
 * ```typescript
 * // 使用Zod驗證器
 * const body = await validateRequestBody(request, (data) => {
 *   return userSchema.parse(data) // Zod驗證
 * })
 *
 * // 沒有驗證器，只解析JSON
 * const body = await validateRequestBody(request)
 * ```
 *
 * @param request HTTP請求對象
 * @param validator 驗證函數（可選）
 * @returns 驗證後的請求體數據
 * @throws AppError 當JSON解析或驗證失敗時
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  validator?: (data: any) => T
): Promise<T> {
  let body: any

  try {
    body = await request.json()
  } catch (error) {
    throw AppError.validation('Invalid JSON in request body')
  }

  if (!body) {
    throw AppError.validation('Request body is required')
  }

  if (validator) {
    try {
      return validator(body)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw AppError.validation(
        error instanceof Error ? error.message : 'Validation failed'
      )
    }
  }

  return body
}

/**
 * 分頁參數驗證函數
 *
 * 驗證和正規化分頁查詢參數，提供安全的預設值和範圍限制。
 *
 * 參數設定:
 * - page: 頁碼，最小值1，預設1
 * - pageSize: 每頁數量，範圍1-100，預設20
 * - offset: 自動計算的偏移量
 *
 * 安全特性:
 * - 自動限制最大每頁數量，防止資源濫用
 * - 自動修正無效值為合理範圍
 * - 自動計算offset，減少計算錯誤
 *
 * 使用範例:
 * ```typescript
 * const url = new URL(request.url)
 * const { page, pageSize, offset } = validatePaginationParams(url.searchParams)
 *
 * const users = await db.user.findMany({
 *   skip: offset,
 *   take: pageSize
 * })
 * ```
 *
 * @param searchParams URL搜尋參數對象
 * @returns 驗證後的分頁參數
 */
export function validatePaginationParams(
  searchParams: URLSearchParams
): {
  page: number
  pageSize: number
  offset: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}