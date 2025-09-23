import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 從 Authorization header 或 Cookie 獲取 token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // 返回用戶信息（不包含密碼）
    const { password_hash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Get user error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}