import { NextRequest, NextResponse } from 'next/server'
import { AppError, ErrorClassifier, ErrorLogger, ErrorMetrics, createErrorContext } from '@/lib/errors'

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

export class ApiErrorHandler {
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

// 包裝 API 路由的高階函數
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

// 異步操作包裝器
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

// 驗證輔助函數
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

// 請求體驗證
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

// 分頁參數驗證
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