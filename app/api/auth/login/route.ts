import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 輸入驗證
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Email 格式驗證
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // 用戶認證
    const result = await authenticateUser(email.toLowerCase().trim(), password)

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 設置 HttpOnly Cookie（可選，提供額外安全性）
    const response = NextResponse.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    })

    // 設置 Cookie（有效期與 JWT 相同）
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 天（秒）
    })

    return response

  } catch (error) {
    console.error('Login error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}