/**
 * @fileoverview AI銷售賦能平台用戶註冊API路由 - 實現安全的用戶帳號創建功能
 * @module app/api/auth/register/route
 *
 * ## 功能說明
 * 提供用戶註冊端點,實現完整的輸入驗證、密碼加密、Email唯一性檢查,
 * 確保新用戶帳號的安全創建和數據規範化。
 *
 * ## API規格
 * - **端點**: `POST /api/auth/register`
 * - **請求**: { email: string, password: string, firstName: string, lastName: string, department?: string }
 * - **響應**: { user: UserWithoutPassword }
 * - **狀態碼**: 201 (創建成功) | 400 (驗證錯誤) | 409 (Email衝突) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 輸入驗證 - Email格式、密碼強度、姓名長度驗證
 * - 數據清理 - Email小寫轉換、字符串去空白處理
 * - 唯一性檢查 - 防止Email重複註冊
 * - 密碼加密 - 使用bcrypt進行密碼雜湊處理
 * - 安全響應 - 返回數據過濾敏感信息(密碼雜湊)
 *
 * ## 相關文件
 * - `/lib/auth-server.ts` - 用戶創建邏輯
 * - `/lib/auth.ts` - Email和密碼驗證工具
 * - `/lib/api/error-handler.ts` - 統一錯誤處理
 * - `/lib/errors.ts` - 應用錯誤類型
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth-server'
import { validateEmail, validatePassword } from '@/lib/auth'
import { ApiErrorHandler, withErrorHandling, validateRequestBody, validateRequired } from '@/lib/api/error-handler'
import { AppError, ErrorType } from '@/lib/errors'

/**
 * 註冊請求體介面定義
 */
interface RegisterRequestBody {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
}

/**
 * 用戶註冊處理函數
 *
 * 處理用戶註冊請求的主要邏輯：
 * 1. 驗證請求體格式和必要欄位
 * 2. 驗證Email格式
 * 3. 驗證密碼強度
 * 4. 驗證姓名長度
 * 5. 創建新用戶帳號
 * 6. 返回用戶資訊（不含密碼）
 *
 * @param request - Next.js請求物件
 * @returns 包含新建用戶資訊的響應物件
 */
async function registerHandler(request: NextRequest): Promise<NextResponse> {
  // 記錄處理開始時間，用於效能監控
  const processingStartTime = Date.now()

  // 第一步：驗證請求體格式
  const body = await validateRequestBody<RegisterRequestBody>(request)

  // 第二步：驗證必要欄位是否存在
  validateRequired(body, ['email', 'password', 'firstName', 'lastName'], {
    email: 'Email',
    password: 'Password',
    firstName: 'First name',
    lastName: 'Last name'
  })

  const { email, password, firstName, lastName, department } = body

  // 第三步：Email格式驗證
  if (!validateEmail(email)) {
    throw AppError.validation('Invalid email format')
  }

  // 第四步：密碼強度驗證
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    throw new AppError(
      'Password does not meet requirements',
      ErrorType.VALIDATION_ERROR,
      400,
      undefined,
      true,
      undefined,
      undefined
    )
  }

  // 第五步：姓名長度驗證（最少2個字符）
  if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    throw AppError.validation('First name and last name must be at least 2 characters long')
  }

  try {
    // 第六步：創建新用戶帳號
    const user = await createUser({
      email: email.toLowerCase().trim(), // Email標準化：小寫+去空白
      password, // 密碼將在auth-server中進行bcrypt加密
      firstName: firstName.trim(), // 去除首尾空白
      lastName: lastName.trim(), // 去除首尾空白
      department: department?.trim() // 可選欄位，如果存在則去空白
    })

    // 第七步：過濾敏感資訊，返回安全的用戶資料
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _passwordHash, ...userWithoutPassword } = user

    // 第八步：創建成功響應
    return ApiErrorHandler.createSuccessResponse(
      { user: userWithoutPassword },
      request,
      processingStartTime,
      'User created successfully'
    )
  } catch (error) {
    // 處理Email重複錯誤（409 Conflict）
    if (error instanceof Error && error.message === 'User with this email already exists') {
      throw new AppError(
        'User with this email already exists',
        ErrorType.RESOURCE_CONFLICT,
        409
      )
    }
    // 重新拋出其他未知錯誤
    throw error
  }
}

/**
 * 導出POST方法處理器
 * 使用統一錯誤處理包裝器處理所有未捕獲的異常
 */
export const POST = withErrorHandling(registerHandler)
