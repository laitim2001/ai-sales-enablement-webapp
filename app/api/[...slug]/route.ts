/**
 * @fileoverview ================================================================AI銷售賦能平台 - API Catch-All 路由處理器================================================================【檔案功能】處理所有未匹配的API路由請求，確保返回JSON格式的404錯誤而非HTML頁面這是Next.js 14 App Router中處理API 404錯誤的推薦方法【解決的問題】• API端點返回HTML而非JSON的問題• 統一API錯誤響應格式• 提供開發階段的調試信息【技術實現】• 使用catch-all路由 [...slug] 捕獲所有未匹配的API請求• 返回JSON格式的404響應• 包含適當的HTTP狀態碼和標頭• 支持所有HTTP方法（GET、POST、PUT、DELETE、PATCH）【路由優先級】Next.js路由解析優先級：1. 具體路由 (例如：/api/auth/login)2. 動態路由 (例如：/api/users/[id])3. Catch-all路由 (例如：/api/[...slug]) ← 此文件【使用範例】請求: GET /api/nonexistent響應:{  "success": false,  "error": {    "type": "API_ENDPOINT_NOT_FOUND",    "message": "API端點不存在",    "statusCode": 404,    "requestPath": "/api/nonexistent",    "method": "GET",    "timestamp": "2024-12-28T10:30:00.000Z"  },  "metadata": {    "timestamp": "2024-12-28T10:30:00.000Z"  }}
 * @module app/api/[...slug]/route
 * @description
 * ================================================================AI銷售賦能平台 - API Catch-All 路由處理器================================================================【檔案功能】處理所有未匹配的API路由請求，確保返回JSON格式的404錯誤而非HTML頁面這是Next.js 14 App Router中處理API 404錯誤的推薦方法【解決的問題】• API端點返回HTML而非JSON的問題• 統一API錯誤響應格式• 提供開發階段的調試信息【技術實現】• 使用catch-all路由 [...slug] 捕獲所有未匹配的API請求• 返回JSON格式的404響應• 包含適當的HTTP狀態碼和標頭• 支持所有HTTP方法（GET、POST、PUT、DELETE、PATCH）【路由優先級】Next.js路由解析優先級：1. 具體路由 (例如：/api/auth/login)2. 動態路由 (例如：/api/users/[id])3. Catch-all路由 (例如：/api/[...slug]) ← 此文件【使用範例】請求: GET /api/nonexistent響應:{  "success": false,  "error": {    "type": "API_ENDPOINT_NOT_FOUND",    "message": "API端點不存在",    "statusCode": 404,    "requestPath": "/api/nonexistent",    "method": "GET",    "timestamp": "2024-12-28T10:30:00.000Z"  },  "metadata": {    "timestamp": "2024-12-28T10:30:00.000Z"  }}
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createApiErrorResponse } from '@/lib/api/response-helper'
import { AppError, ErrorType, ErrorSeverity } from '@/lib/errors'

/**
 * 處理所有未匹配的API GET請求
 *
 * @param request - Next.js請求對象
 * @param params - 路由參數（包含slug數組）
 * @returns JSON格式的404錯誤響應
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const requestPath = `/api/${params.slug.join('/')}`
  const requestId = request.headers.get('X-Request-ID') || 'unknown'

  const error = new AppError(
    'API端點不存在',
    ErrorType.NOT_FOUND,
    404,
    ErrorSeverity.LOW,
    true,
    undefined,
    undefined
  )

  return createApiErrorResponse(error, {
    requestId,
    requestPath,
    method: 'GET'
  })
}

/**
 * 處理所有未匹配的API POST請求
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const requestPath = `/api/${params.slug.join('/')}`
  const requestId = request.headers.get('X-Request-ID') || 'unknown'

  const error = new AppError(
    'API端點不存在',
    ErrorType.NOT_FOUND,
    404
  )

  return createApiErrorResponse(error, {
    requestId,
    requestPath,
    method: 'POST'
  })
}

/**
 * 處理所有未匹配的API PUT請求
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const requestPath = `/api/${params.slug.join('/')}`
  const requestId = request.headers.get('X-Request-ID') || 'unknown'

  const error = new AppError(
    'API端點不存在',
    ErrorType.NOT_FOUND,
    404
  )

  return createApiErrorResponse(error, {
    requestId,
    requestPath,
    method: 'PUT'
  })
}

/**
 * 處理所有未匹配的API DELETE請求
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const requestPath = `/api/${params.slug.join('/')}`
  const requestId = request.headers.get('X-Request-ID') || 'unknown'

  const error = new AppError(
    'API端點不存在',
    ErrorType.NOT_FOUND,
    404
  )

  return createApiErrorResponse(error, {
    requestId,
    requestPath,
    method: 'DELETE'
  })
}

/**
 * 處理所有未匹配的API PATCH請求
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const requestPath = `/api/${params.slug.join('/')}`
  const requestId = request.headers.get('X-Request-ID') || 'unknown'

  const error = new AppError(
    'API端點不存在',
    ErrorType.NOT_FOUND,
    404
  )

  return createApiErrorResponse(error, {
    requestId,
    requestPath,
    method: 'PATCH'
  })
}