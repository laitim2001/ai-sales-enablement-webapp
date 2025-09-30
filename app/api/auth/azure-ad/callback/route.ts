/**
 * ================================================================
 * 檔案名稱: Azure AD SSO回調API路由
 * 檔案用途: AI銷售賦能平台的Azure AD認證回調處理端點
 * 開發階段: MVP Phase 2 Sprint 1 - 企業級認證增強
 * ================================================================
 *
 * 功能索引:
 * 1. GET方法 - 處理Azure AD認證回調
 *
 * 認證流程:
 * 1. 接收Azure AD的授權碼和state參數
 * 2. 驗證state參數防止CSRF
 * 3. 用授權碼交換access token
 * 4. 獲取用戶信息並同步到本地資料庫
 * 5. 生成JWT tokens
 * 6. 設置cookies
 * 7. 重定向用戶到應用首頁
 *
 * API規格:
 * - 方法: GET
 * - 路徑: /api/auth/azure-ad/callback
 * - Query參數: code (授權碼), state (CSRF防護)
 * - 回應: 302重定向到應用首頁
 *
 * 安全特性:
 * - State參數驗證
 * - Authorization code驗證
 * - Token安全存儲
 * - HttpOnly cookies
 *
 * 錯誤處理:
 * - 缺少授權碼
 * - State驗證失敗
 * - Token交換失敗
 * - 用戶同步失敗
 *
 * 更新記錄:
 * - 2025-09-30: 初始版本，實現Azure AD SSO回調處理
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleAzureADCallback } from '@/lib/auth/azure-ad-service'

/**
 * Azure AD回調處理函數
 *
 * 處理Azure AD認證回調的完整流程：
 * 1. 驗證state參數
 * 2. 用授權碼交換token
 * 3. 同步用戶信息
 * 4. 生成JWT tokens
 * 5. 設置cookies並重定向
 *
 * @param request - Next.js請求物件
 * @returns 重定向響應到應用首頁或錯誤頁面
 */
export async function GET(request: NextRequest) {
  try {
    // 第一步：從URL獲取授權碼和state
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // 檢查Azure AD是否返回錯誤
    if (error) {
      console.error('Azure AD error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=azure_ad_error&message=${encodeURIComponent(errorDescription || error)}`
      )
    }

    // 檢查是否有授權碼
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=missing_code`
      )
    }

    // 第二步：從cookie獲取並驗證state參數
    const storedState = request.cookies.get('azure-ad-state')?.value

    if (!storedState || !state || storedState !== state) {
      console.error('State mismatch or missing. Expected:', storedState, 'Got:', state)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_state`
      )
    }

    // 第三步：提取設備上下文信息
    const deviceContext = {
      ipAddress: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 request.ip ||
                 'unknown',
      userAgent: request.headers.get('user-agent') || undefined
    }

    // 第四步：處理Azure AD回調（token交換、用戶同步、JWT生成）
    const result = await handleAzureADCallback(code, state, deviceContext)

    // 第五步：創建重定向響應到應用首頁
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)

    // 第六步：設置JWT tokens到cookies
    // Access Token (15分鐘)
    response.cookies.set('auth-token', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.tokens.expiresIn
    })

    // Refresh Token (30天)
    response.cookies.set('refresh-token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/api/auth/refresh'
    })

    // 第七步：清除state cookie
    response.cookies.set('azure-ad-state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/api/auth/azure-ad'
    })

    // 第八步：可選 - 存儲用戶基本信息到cookie（非敏感信息）
    response.cookies.set('user-info', JSON.stringify({
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role
    }), {
      httpOnly: false, // 允許前端讀取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.tokens.expiresIn
    })

    return response

  } catch (error) {
    console.error('Azure AD callback error:', error)

    // 重定向到登入頁面並顯示錯誤
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=authentication_failed`
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}