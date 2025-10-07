/**
 * @fileoverview ================================================================AI銷售賦能平台 - API響應助手模組================================================================【檔案功能】提供統一的API響應格式化工具，確保所有API端點使用一致的響應結構支援成功響應、錯誤響應和元數據管理【主要職責】• 響應格式標準化 - 所有API響應使用統一格式• 錯誤處理標準化 - 統一的錯誤響應結構• 元數據管理 - 請求ID、時間戳等系統信息• HTTP狀態碼管理 - 自動設置正確的HTTP狀態【響應格式】成功響應:{  success: true,  data: any,  metadata: { requestId, timestamp, ... }}錯誤響應:{  success: false,  error: { type, message, statusCode, ... },  metadata: { requestId, timestamp, ... }}【技術特點】• TypeScript類型安全 - 完整的類型定義• 自動狀態碼處理 - 根據錯誤類型自動設置• 元數據自動填充 - 自動添加系統相關信息• 擴展性設計 - 支援自定義元數據和錯誤信息【相關檔案】• lib/errors.ts - 統一錯誤處理系統• app/api/ - 所有API路由處理器• middleware.ts - 中間件系統
 * @module lib/api/response-helper
 * @description
 * ================================================================AI銷售賦能平台 - API響應助手模組================================================================【檔案功能】提供統一的API響應格式化工具，確保所有API端點使用一致的響應結構支援成功響應、錯誤響應和元數據管理【主要職責】• 響應格式標準化 - 所有API響應使用統一格式• 錯誤處理標準化 - 統一的錯誤響應結構• 元數據管理 - 請求ID、時間戳等系統信息• HTTP狀態碼管理 - 自動設置正確的HTTP狀態【響應格式】成功響應:{  success: true,  data: any,  metadata: { requestId, timestamp, ... }}錯誤響應:{  success: false,  error: { type, message, statusCode, ... },  metadata: { requestId, timestamp, ... }}【技術特點】• TypeScript類型安全 - 完整的類型定義• 自動狀態碼處理 - 根據錯誤類型自動設置• 元數據自動填充 - 自動添加系統相關信息• 擴展性設計 - 支援自定義元數據和錯誤信息【相關檔案】• lib/errors.ts - 統一錯誤處理系統• app/api/ - 所有API路由處理器• middleware.ts - 中間件系統
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextResponse } from 'next/server'
import { AppError } from '@/lib/errors'

/**
 * API響應的元數據接口
 */
export interface ApiMetadata {
  requestId?: string
  timestamp: string
  processingTime?: number
  [key: string]: any
}

/**
 * 成功響應的數據結構
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  metadata: ApiMetadata
}

/**
 * 錯誤響應的數據結構
 */
export interface ApiErrorResponse {
  success: false
  error: {
    type: string
    message: string
    statusCode: number
    details?: any
    timestamp: string
  }
  metadata: ApiMetadata
}

/**
 * 通用API響應類型
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 創建標準化的API成功響應
 *
 * @param data - 要返回的數據
 * @param metadata - 額外的元數據信息
 * @param status - HTTP狀態碼 (默認: 200)
 * @returns NextResponse對象
 */
export function createApiSuccessResponse<T>(
  data: T,
  metadata: Partial<ApiMetadata> = {},
  status: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }

  return NextResponse.json(response, { status })
}

/**
 * 創建標準化的API錯誤響應
 *
 * @param error - AppError實例或錯誤信息
 * @param metadata - 額外的元數據信息
 * @param defaultStatus - 默認HTTP狀態碼 (當error不是AppError時使用)
 * @returns NextResponse對象
 */
export function createApiErrorResponse(
  error: AppError | string,
  metadata: Partial<ApiMetadata> = {},
  defaultStatus: number = 500
): NextResponse {
  let errorData: ApiErrorResponse['error']

  if (error instanceof AppError) {
    errorData = {
      type: error.type || 'APPLICATION_ERROR',
      message: error.message,
      statusCode: error.statusCode || defaultStatus,
      details: error.context, // AppError使用context而非details
      timestamp: new Date().toISOString()
    }
  } else {
    errorData = {
      type: 'GENERIC_ERROR',
      message: error,
      statusCode: defaultStatus,
      timestamp: new Date().toISOString()
    }
  }

  const response: ApiErrorResponse = {
    success: false,
    error: errorData,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }

  return NextResponse.json(response, { status: errorData.statusCode })
}

/**
 * 通用API響應創建器
 *
 * 根據提供的數據或錯誤，自動選擇創建成功或錯誤響應
 *
 * @param data - 成功時返回的數據 (null表示錯誤)
 * @param error - 錯誤信息 (null表示成功)
 * @param metadata - 額外的元數據信息
 * @param successStatus - 成功時的HTTP狀態碼
 * @param errorStatus - 錯誤時的默認HTTP狀態碼
 * @returns NextResponse對象
 */
export function createApiResponse<T>(
  data: T | null,
  error: AppError | string | null,
  metadata: Partial<ApiMetadata> = {},
  successStatus: number = 200,
  errorStatus: number = 500
): NextResponse {
  if (error !== null) {
    return createApiErrorResponse(error, metadata, errorStatus)
  } else {
    return createApiSuccessResponse(data, metadata, successStatus)
  }
}

/**
 * 驗證錯誤響應創建器
 *
 * 專門用於輸入驗證錯誤的快捷函數
 *
 * @param message - 驗證錯誤訊息
 * @param details - 詳細的驗證錯誤信息
 * @param metadata - 額外的元數據信息
 * @returns NextResponse對象
 */
export function createValidationErrorResponse(
  message: string,
  details?: any,
  metadata: Partial<ApiMetadata> = {}
): NextResponse {
  const error = AppError.badRequest(message, {
    timestamp: new Date(),
    additional: details ? { details } : undefined
  });

  return createApiErrorResponse(error, metadata)
}

/**
 * 認證錯誤響應創建器
 *
 * 專門用於認證和授權錯誤的快捷函數
 *
 * @param message - 認證錯誤訊息
 * @param metadata - 額外的元數據信息
 * @returns NextResponse對象
 */
export function createAuthErrorResponse(
  message: string = '認證失敗',
  metadata: Partial<ApiMetadata> = {}
): NextResponse {
  const error = AppError.unauthorized(message, {
    timestamp: new Date()
  });

  return createApiErrorResponse(error, metadata)
}

/**
 * 權限錯誤響應創建器
 *
 * 專門用於權限不足錯誤的快捷函數
 *
 * @param message - 權限錯誤訊息
 * @param metadata - 額外的元數據信息
 * @returns NextResponse對象
 */
export function createForbiddenErrorResponse(
  message: string = '權限不足',
  metadata: Partial<ApiMetadata> = {}
): NextResponse {
  const error = AppError.forbidden(message, {
    timestamp: new Date()
  });

  return createApiErrorResponse(error, metadata)
}

/**
 * 資源未找到錯誤響應創建器
 *
 * 專門用於404錯誤的快捷函數
 *
 * @param resource - 未找到的資源名稱
 * @param metadata - 額外的元數據信息
 * @returns NextResponse對象
 */
export function createNotFoundErrorResponse(
  resource: string = '資源',
  metadata: Partial<ApiMetadata> = {}
): NextResponse {
  const error = AppError.notFound(`${resource}未找到`, {
    timestamp: new Date()
  });

  return createApiErrorResponse(error, metadata)
}

/**
 * 速率限制錯誤響應創建器
 *
 * 專門用於速率限制錯誤的快捷函數
 *
 * @param message - 限制錯誤訊息
 * @param metadata - 額外的元數據信息
 * @returns NextResponse對象
 */
export function createRateLimitErrorResponse(
  message: string = '請求過於頻繁，請稍後再試',
  metadata: Partial<ApiMetadata> = {}
): NextResponse {
  const error = AppError.rateLimited(message, {
    timestamp: new Date()
  });

  return createApiErrorResponse(error, metadata)
}

/**
 * 內部服務器錯誤響應創建器
 *
 * 專門用於500錯誤的快捷函數
 *
 * @param message - 錯誤訊息
 * @param metadata - 額外的元數據信息
 * @returns NextResponse對象
 */
export function createInternalErrorResponse(
  message: string = '內部服務器錯誤',
  metadata: Partial<ApiMetadata> = {}
): NextResponse {
  const error = AppError.internal(message, {
    timestamp: new Date()
  });

  return createApiErrorResponse(error, metadata)
}