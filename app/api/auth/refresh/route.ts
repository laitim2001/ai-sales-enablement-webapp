/**
 * ================================================================
 * 檔案名稱: Token 刷新 API路由
 * 檔案用途: MVP Phase 2 Sprint 1 - Refresh Token端點
 * 開發階段: Sprint 1 Week 1
 * ================================================================
 *
 * 功能索引:
 * 1. refreshHandler() - Refresh token處理函數
 * 2. POST方法 - 使用refresh token獲取新的access token
 *
 * 安全特色:
 * - 自動刷新access token
 * - 可選的refresh token輪換
 * - 設備指紋驗證
 * - IP地址記錄
 * - Token撤銷檢查
 *
 * API規格:
 * - 方法: POST
 * - 路徑: /api/auth/refresh
 * - Cookie: refresh-token (必須)
 * - 請求體: { rotateRefreshToken?: boolean, deviceId?: string }
 * - 回應: { accessToken: string, refreshToken?: string, expiresIn: number }
 *
 * 使用場景:
 * - Access token過期前自動刷新
 * - 無縫的用戶體驗
 * - 減少重新登入頻率
 *
 * 更新記錄:
 * - 2025-09-30: 初始版本，實現refresh token機制
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/auth/token-service'
import { ApiErrorHandler, withErrorHandling, validateRequestBody } from '@/lib/api/error-handler'
import { AppError } from '@/lib/errors'

/**
 * Refresh請求體介面定義
 */
interface RefreshRequestBody {
  rotateRefreshToken?: boolean  // 是否輪換refresh token（默認true）
  deviceId?: string              // 設備ID
}

/**
 * Token刷新處理函數
 *
 * 處理refresh token請求的主要邏輯：
 * 1. 從Cookie獲取refresh token
 * 2. 驗證refresh token有效性
 * 3. 生成新的access token
 * 4. 可選: 輪換refresh token
 * 5. 更新Cookie
 *
 * @param request - Next.js請求物件
 * @returns 包含新token的響應物件
 */
async function refreshHandler(request: NextRequest): Promise<NextResponse> {
  // 記錄處理開始時間
  const processingStartTime = Date.now()

  // 第一步：從Cookie獲取refresh token
  const refreshToken = request.cookies.get('refresh-token')?.value

  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token not found')
  }

  // 第二步：解析請求體（可選參數）
  let body: RefreshRequestBody = {}
  try {
    body = await validateRequestBody<RefreshRequestBody>(request)
  } catch {
    // 請求體為空或格式錯誤時使用默認值
    body = {}
  }

  const { rotateRefreshToken = true, deviceId } = body

  // 第三步：提取設備上下文信息
  const deviceContext = {
    deviceId: deviceId || undefined,
    ipAddress: request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown',
    userAgent: request.headers.get('user-agent') || undefined
  }

  // 第四步：刷新access token（並可選輪換refresh token）
  let tokenPair
  try {
    tokenPair = await refreshAccessToken(
      refreshToken,
      deviceContext,
      rotateRefreshToken
    )
  } catch (error: any) {
    // 處理特定的refresh token錯誤
    if (error.message.includes('not found') ||
        error.message.includes('revoked') ||
        error.message.includes('expired')) {
      throw AppError.unauthorized('Invalid or expired refresh token')
    }
    throw error
  }

  // 第五步：創建成功響應物件
  const response = ApiErrorHandler.createSuccessResponse(
    {
      accessToken: tokenPair.accessToken,
      refreshToken: rotateRefreshToken ? tokenPair.refreshToken : undefined,
      expiresIn: tokenPair.expiresIn
    },
    request,
    processingStartTime,
    'Token refreshed successfully'
  )

  // 第六步：更新Access Token Cookie
  response.cookies.set('auth-token', tokenPair.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: tokenPair.expiresIn  // 15分鐘
  })

  // 第七步：如果輪換了refresh token，更新Cookie
  if (rotateRefreshToken && tokenPair.refreshToken !== refreshToken) {
    response.cookies.set('refresh-token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,  // 30天
      path: '/api/auth/refresh'
    })
  }

  return response
}

/**
 * 導出POST方法處理器
 * 使用統一錯誤處理包裝器
 */
export const POST = withErrorHandling(refreshHandler)

/**
 * OPTIONS方法處理CORS預檢請求
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}