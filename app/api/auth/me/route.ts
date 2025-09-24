import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { ApiErrorHandler, withErrorHandling } from '@/lib/api/error-handler'
import { AppError } from '@/lib/errors'

const prisma = new PrismaClient()

async function meHandler(request: NextRequest): Promise<NextResponse> {
  const processingStartTime = Date.now()

  // 從 Authorization header 或 Cookie 取得 token
  let token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    token = request.cookies.get('auth-token')?.value
  }

  if (!token) {
    throw AppError.unauthorized('No authentication token provided')
  }

  try {
    // 驗證 JWT token
    const payload = verifyJWT(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 從資料庫取得用戶資料
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        is_active: true
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        department: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        last_login: true
      }
    })

    if (!user) {
      throw AppError.unauthorized('User not found or inactive')
    }

    // 更新最後登入時間
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    })

    return ApiErrorHandler.createSuccessResponse(
      user,
      request,
      processingStartTime
    )
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    // JWT 驗證錯誤
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        throw AppError.unauthorized('Invalid token')
      }
      if (error.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Token expired')
      }
    }

    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export const GET = withErrorHandling(meHandler)