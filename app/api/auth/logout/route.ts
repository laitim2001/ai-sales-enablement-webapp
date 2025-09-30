/**
 * ================================================================
 * 檔案名稱: 用戶登出API路由（增強版）
 * 檔案用途: AI銷售賦能平台的用戶登出端點
 * 開發階段: MVP Phase 2 Sprint 1 - JWT驗證增強
 * ================================================================
 *
 * 功能索引:
 * 1. POST方法 - 處理用戶登出請求
 *
 * 安全特色（MVP Phase 2增強）:
 * - Token撤銷: 將access token加入黑名單
 * - Refresh token撤銷: 撤銷當前或所有設備的refresh token
 * - Cookie清除: 立即失效認證cookie
 * - 安全配置: 保持與登入時相同的安全設定
 * - 容錯設計: 即使token無效仍可登出
 * - 錯誤處理: 完整錯誤處理確保服務穩定性
 *
 * API規格:
 * - 方法: POST
 * - 路徑: /api/auth/logout
 * - 請求體: { logoutAllDevices?: boolean }
 * - 回應: { message: 'Logout successful' } | ErrorResponse
 * - Cookie操作: 清除auth-token和refresh-token
 *
 * 注意事項:
 * - 採用容錯設計，即使token無效仍會清除cookie
 * - 支援單設備登出或所有設備登出
 * - 前端應在收到成功響應後清除本地儲存的認證資訊
 *
 * 更新記錄:
 * - Week 1: 初始版本，基礎登出功能
 * - 2025-09-30: Sprint 1升級 - 新增token撤銷機制
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth/token-service'

/**
 * 登出請求體介面定義
 */
interface LogoutRequestBody {
  logoutAllDevices?: boolean  // 是否登出所有設備（默認false）
}

/**
 * 用戶登出處理函數（增強版）
 *
 * 處理用戶登出請求的主要邏輯：
 * 1. 獲取當前的access token和refresh token
 * 2. 將access token加入黑名單
 * 3. 撤銷refresh token（單設備或所有設備）
 * 4. 清除認證cookie
 *
 * 採用容錯設計：即使token無效或不存在，仍會清除cookie並返回成功
 *
 * @param request - Next.js請求物件
 * @returns 登出成功響應或錯誤響應
 */
export async function POST(request: NextRequest) {
  try {
    // 第一步：解析請求體（可選參數）
    let body: LogoutRequestBody = {}
    try {
      body = await request.json()
    } catch {
      // 請求體為空時使用默認值
      body = {}
    }

    const { logoutAllDevices = false } = body

    // 第二步：獲取tokens（從Cookie或Authorization header）
    const accessToken = request.cookies.get('auth-token')?.value ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

    const refreshToken = request.cookies.get('refresh-token')?.value

    // 第三步：如果有有效token，執行撤銷操作
    if (accessToken) {
      try {
        // 解析refresh token獲取tokenId（如果有）
        let refreshTokenId: string | undefined
        if (refreshToken) {
          const jwt = require('jsonwebtoken')
          const decoded = jwt.decode(refreshToken) as any
          refreshTokenId = decoded?.tokenId
        }

        // 執行登出（撤銷tokens）
        await logoutUser(accessToken, refreshTokenId, logoutAllDevices)
      } catch (error) {
        // 容錯設計：即使撤銷失敗也繼續清除cookie
        console.error('Token revocation error:', error)
      }
    }

    // 第四步：創建登出成功響應
    const response = NextResponse.json({
      message: logoutAllDevices
        ? 'Logged out from all devices successfully'
        : 'Logout successful'
    })

    // 第五步：清除Access Token Cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0  // 立即過期
    })

    // 第六步：清除Refresh Token Cookie
    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,  // 立即過期
      path: '/api/auth/refresh'
    })

    return response

  } catch (error) {
    // 記錄錯誤便於除錯
    console.error('Logout error:', error)

    // 返回通用錯誤響應
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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