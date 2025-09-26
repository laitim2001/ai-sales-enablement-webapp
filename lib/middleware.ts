import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth-server'

/**
 * 認證中間件
 * 檢查請求是否包含有效的認證 token
 */
export async function authMiddleware(request: NextRequest): Promise<{
  response?: NextResponse
  user?: any
}> {
  try {
    // 從 Authorization header 或 Cookie 獲取 token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      return {
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return {
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }

    // 認證成功，返回用戶信息
    return { user }

  } catch (error) {
    console.error('Auth middleware error:', error)
    return {
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * 角色權限檢查中間件
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest, user: any): Promise<NextResponse | null> => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    return null
  }
}

/**
 * 管理員權限檢查
 */
export const requireAdmin = requireRole(['ADMIN'])

/**
 * 銷售團隊權限檢查
 */
export const requireSalesTeam = requireRole(['ADMIN', 'SALES_MANAGER', 'SALES_REP'])

/**
 * 用戶權限檢查（所有登入用戶）
 */
export const requireUser = requireRole(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'USER'])