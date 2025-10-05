/**
 * ================================================================
 * 檔案名稱: 用戶註冊API路由
 * 檔案用途: AI銷售賦能平台的用戶註冊端點
 * 開發階段: 開發完成
 * ================================================================
 *
 * 功能索引:
 * 1. registerHandler() - 用戶註冊處理函數
 * 2. POST方法 - 處理用戶註冊請求
 *
 * 安全特色:
 * - 密碼安全驗證: 強制密碼複雜度要求
 * - Email唯一性檢查: 防止重複註冊
 * - 輸入清理: 自動清理和規範化用戶輸入
 * - 密碼加密: 使用bcrypt進行密碼雜湊
 * - 資料驗證: 完整的前端和後端雙重驗證
 *
 * API規格:
 * - 方法: POST
 * - 路徑: /api/auth/register
 * - 請求體: { email, password, firstName, lastName, department? }
 * - 回應: { user: UserWithoutPassword } | ErrorResponse
 * - 狀態碼: 201 (成功) | 400 (驗證錯誤) | 409 (Email衝突)
 *
 * 注意事項:
 * - 返回的用戶資料不包含密碼雜湊
 * - Email會自動轉換為小寫並去除空白
 * - 姓名欄位最少2個字符要求
 * - 部門欄位為可選
 *
 * 更新記錄:
 * - Week 1: 初始版本，基礎註冊功能
 * - Week 2: 增加完整驗證和錯誤處理
 * ================================================================
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