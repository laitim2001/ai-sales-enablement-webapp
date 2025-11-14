/**
 * @fileoverview AI銷售賦能平台用戶登入API路由 - 實現JWT雙令牌認證機制
 * @module app/api/auth/login/route
 *
 * ## 功能說明
 * 提供用戶登入認證端點,實現Access Token + Refresh Token雙令牌機制,
 * 包含設備指紋追蹤、IP記錄和完整的安全驗證功能。
 *
 * ## API規格
 * - **端點**: `POST /api/auth/login`
 * - **請求**: { email: string, password: string, deviceId?: string }
 * - **響應**: { user: User, accessToken: string, refreshToken: string, expiresIn: number }
 * - **狀態碼**: 200 (成功) | 400 (驗證錯誤) | 401 (認證失敗) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 用戶身份認證 - Email/密碼驗證和用戶狀態檢查
 * - 雙令牌生成 - Access Token (15分鐘) + Refresh Token (30天)
 * - 安全Cookie設置 - HTTP-Only、Secure、SameSite防護
 * - 設備追蹤 - 設備指紋、IP地址和User-Agent記錄
 * - 輸入驗證 - Email格式和密碼要求驗證
 *
 * ## 相關文件
 * - `/lib/auth-server.ts` - 用戶認證邏輯
 * - `/lib/auth/token-service.ts` - 令牌生成和管理
 * - `/lib/auth.ts` - Email驗證工具
 * - `/lib/api/error-handler.ts` - 統一錯誤處理
 * - `/lib/errors.ts` - 應用錯誤類型
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-server'
import { loginUser } from '@/lib/auth/token-service'
import { validateEmail } from '@/lib/auth'
import { ApiErrorHandler, withErrorHandling, validateRequestBody, validateRequired } from '@/lib/api/error-handler'
import { AppError } from '@/lib/errors'

/**
 * 登入請求體介面定義（增強版）
 */
interface LoginRequestBody {
  email: string
  password: string
  deviceId?: string  // 可選的設備ID用於多設備管理
}

/**
 * 用戶登入處理函數（增強版）
 *
 * 處理用戶登入請求的主要邏輯：
 * 1. 驗證請求體格式和必要欄位
 * 2. 驗證Email格式
 * 3. 執行用戶認證
 * 4. 提取設備上下文信息
 * 5. 生成Access Token + Refresh Token對
 * 6. 設置安全cookie（雙令牌）
 *
 * @param request - Next.js請求物件
 * @returns 包含用戶資訊和雙令牌的響應物件
 */
async function loginHandler(request: NextRequest): Promise<NextResponse> {
  // 記錄處理開始時間，用於效能監控
  const processingStartTime = Date.now()

  // 第一步：驗證請求體格式
  const body = await validateRequestBody<LoginRequestBody>(request)

  // 第二步：驗證必要欄位是否存在
  validateRequired(body, ['email', 'password'], {
    email: 'Email',
    password: 'Password'
  })

  const { email, password, deviceId } = body

  // 第三步：Email格式驗證
  if (!validateEmail(email)) {
    throw AppError.validation('Invalid email format')
  }

  // 第四步：執行用戶認證（密碼驗證和用戶狀態檢查）
  const result = await authenticateUser(email.toLowerCase().trim(), password)

  // 認證失敗：使用通用錯誤訊息防止帳號探測攻擊
  if (!result) {
    throw AppError.unauthorized('Invalid email or password')
  }

  // 第五步：提取設備上下文信息
  const deviceContext = {
    deviceId: deviceId || undefined,
    ipAddress: request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown',
    userAgent: request.headers.get('user-agent') || undefined
  }

  // 第六步：生成新的Token對（Access + Refresh）
  const tokenPair = await loginUser(result.user, deviceContext)

  // 第七步：創建成功響應物件
  const response = ApiErrorHandler.createSuccessResponse(
    {
      user: result.user,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn
    },
    request,
    processingStartTime,
    'Login successful'
  )

  // 第八步：設置安全認證Cookie（Access Token）
  response.cookies.set('auth-token', tokenPair.accessToken, {
    httpOnly: true,                                  // 防止XSS攻擊
    secure: process.env.NODE_ENV === 'production',   // Production強制HTTPS
    sameSite: 'strict',                              // 防止CSRF攻擊
    maxAge: tokenPair.expiresIn                      // 15分鐘（與access token同步）
  })

  // 第九步：設置Refresh Token Cookie（長期有效）
  response.cookies.set('refresh-token', tokenPair.refreshToken, {
    httpOnly: true,                                  // 防止XSS攻擊
    secure: process.env.NODE_ENV === 'production',   // Production強制HTTPS
    sameSite: 'strict',                              // 防止CSRF攻擊
    maxAge: 30 * 24 * 60 * 60,                       // 30天
    path: '/api/auth/refresh'                        // 僅用於refresh端點
  })

  return response
}

/**
 * 導出POST方法處理器
 * 使用統一錯誤處理包裝器處理所有未捕獲的異常
 */
export const POST = withErrorHandling(loginHandler)
