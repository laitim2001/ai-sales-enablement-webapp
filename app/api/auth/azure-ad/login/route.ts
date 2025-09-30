/**
 * ================================================================
 * 檔案名稱: Azure AD SSO登入API路由
 * 檔案用途: AI銷售賦能平台的Azure AD單一登入啟動端點
 * 開發階段: MVP Phase 2 Sprint 1 - 企業級認證增強
 * ================================================================
 *
 * 功能索引:
 * 1. GET方法 - 重定向到Azure AD登入頁面
 *
 * 認證流程:
 * 1. 生成CSRF防護的state參數
 * 2. 生成Azure AD授權URL
 * 3. 重定向用戶到Azure AD登入頁面
 * 4. Azure AD驗證後重定向回callback端點
 *
 * API規格:
 * - 方法: GET
 * - 路徑: /api/auth/azure-ad/login
 * - 回應: 302重定向到Azure AD
 *
 * 安全特性:
 * - State參數防CSRF攻擊
 * - PKCE支援（由MSAL自動處理）
 * - 安全的重定向URL
 *
 * 更新記錄:
 * - 2025-09-30: 初始版本，實現Azure AD SSO登入啟動
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAzureADLoginUrl, isAzureADConfigured } from '@/lib/auth/azure-ad-service'
import crypto from 'crypto'

/**
 * Azure AD登入啟動處理函數
 *
 * 生成登入URL並重定向用戶到Azure AD
 * 使用state參數防止CSRF攻擊
 *
 * @param request - Next.js請求物件
 * @returns 重定向響應到Azure AD登入頁面
 */
export async function GET(request: NextRequest) {
  try {
    // 第一步：檢查Azure AD配置
    if (!isAzureADConfigured()) {
      return NextResponse.json(
        { error: 'Azure AD SSO is not configured' },
        { status: 500 }
      )
    }

    // 第二步：生成CSRF防護的state參數
    const state = crypto.randomBytes(32).toString('hex')

    // 第三步：生成Azure AD登入URL
    const loginUrl = await getAzureADLoginUrl(state)

    // 第四步：將state存儲到cookie以便callback時驗證
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set('azure-ad-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 允許從Azure AD重定向回來
      maxAge: 600, // 10分鐘過期
      path: '/api/auth/azure-ad'
    })

    return response

  } catch (error) {
    console.error('Azure AD login error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Azure AD login' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}