import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, validateEmail } from '@/lib/auth'
import { ApiErrorHandler, withErrorHandling, validateRequestBody, validateRequired } from '@/lib/api/error-handler'
import { AppError } from '@/lib/errors'

async function loginHandler(request: NextRequest): Promise<NextResponse> {
  const processingStartTime = Date.now()

  // 驗證請求體
  const body = await validateRequestBody(request)

  // 驗證必要欄位
  validateRequired(body, ['email', 'password'], {
    email: 'Email',
    password: 'Password'
  })

  const { email, password } = body

  // Email 格式驗證
  if (!validateEmail(email)) {
    throw AppError.validation('Invalid email format')
  }

  // 用戶認證
  const result = await authenticateUser(email.toLowerCase().trim(), password)

  if (!result) {
    throw AppError.unauthorized('Invalid email or password')
  }

  // 創建成功響應
  const response = ApiErrorHandler.createSuccessResponse(
    {
      user: result.user,
      token: result.token
    },
    request,
    processingStartTime,
    'Login successful'
  )

  // 設置 Cookie（有效期與 JWT 相同）
  response.cookies.set('auth-token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 // 7 天（秒）
  })

  return response
}

export const POST = withErrorHandling(loginHandler)