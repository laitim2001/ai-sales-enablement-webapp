import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth-server'
import { validateEmail, validatePassword } from '@/lib/auth'
import { ApiErrorHandler, withErrorHandling, validateRequestBody, validateRequired } from '@/lib/api/error-handler'
import { AppError, ErrorType } from '@/lib/errors'

async function registerHandler(request: NextRequest): Promise<NextResponse> {
  const processingStartTime = Date.now()

  // 驗證請求體
  const body = await validateRequestBody(request)

  // 驗證必要欄位
  validateRequired(body, ['email', 'password', 'firstName', 'lastName'], {
    email: 'Email',
    password: 'Password',
    firstName: 'First name',
    lastName: 'Last name'
  })

  const { email, password, firstName, lastName, department } = body

  // Email 格式驗證
  if (!validateEmail(email)) {
    throw AppError.validation('Invalid email format')
  }

  // 密碼強度驗證
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

  // 名稱長度驗證
  if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    throw AppError.validation('First name and last name must be at least 2 characters long')
  }

  try {
    // 創建用戶
    const user = await createUser({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      department: department?.trim()
    })

    // 返回用戶信息（不包含密碼）
    const { password_hash: _, ...userWithoutPassword } = user

    return ApiErrorHandler.createSuccessResponse(
      { user: userWithoutPassword },
      request,
      processingStartTime,
      'User created successfully'
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'User with this email already exists') {
      throw new AppError(
        'User with this email already exists',
        ErrorType.RESOURCE_CONFLICT,
        409
      )
    }
    throw error
  }
}

export const POST = withErrorHandling(registerHandler)