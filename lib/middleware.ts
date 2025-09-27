/**
 * ================================================================
 * AI銷售賦能平台 - 中間件系統 (/lib/middleware.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供統一的API中間件功能，包含認證驗證、權限控制和角色管理。
 * 確保所有API端點都具備適當的安全性檢查和訪問控制機制。
 *
 * 【主要職責】
 * • 認證中間件 - 驗證JWT token的有效性，支援Header和Cookie兩種傳遞方式
 * • 權限控制系統 - 基於角色的存取控制(RBAC)，支援細粒度權限管理
 * • 角色層級驗證 - 預定義常用角色權限組合，簡化權限檢查邏輯
 * • 安全響應處理 - 統一的認證失敗和權限不足錯誤響應格式
 * • 用戶身份注入 - 將驗證後的用戶資訊注入到請求上下文中
 *
 * 【技術實現】
 * • JWT Token解析 - 支援Bearer Token和Cookie兩種認證方式
 * • 角色繼承體系 - ADMIN > SALES_MANAGER > SALES_REP > USER 的權限層級
 * • 中間件鏈式調用 - 支援多個中間件的組合使用和順序執行
 * • 錯誤統一處理 - 標準化的401/403錯誤響應格式
 * • 類型安全保證 - TypeScript類型定義確保中間件使用的正確性
 *
 * 【相關檔案】
 * • /lib/auth-server.ts - 伺服器端認證邏輯，提供token驗證功能
 * • /lib/api/error-handler.ts - API錯誤處理系統，處理認證相關錯誤
 * • /app/api/*/route.ts - 各API路由檔案，使用中間件保護敏感端點
 * • /components/auth/* - 前端認證組件，配合中間件實現完整認證流程
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth-server'

/**
 * 認證中間件
 *
 * 檢查HTTP請求是否包含有效的認證token，並驗證token的合法性。
 * 支援Authorization Header和Cookie兩種token傳遞方式。
 *
 * 驗證流程:
 * 1. 從Authorization Header提取Bearer Token
 * 2. 如果Header中沒有token，則從Cookie中獲取auth-token
 * 3. 使用auth-server的getUserFromToken方法驗證token
 * 4. 返回驗證結果和用戶資訊
 *
 * @param request HTTP請求物件
 * @returns 包含驗證結果的物件，成功時返回用戶資訊，失敗時返回錯誤響應
 */
export async function authMiddleware(request: NextRequest): Promise<{
  response?: NextResponse
  user?: any
}> {
  try {
    // 從 Authorization header 或 Cookie 獲取 token - Extract token from Authorization header or Cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    // 檢查token是否存在 - Check if token exists
    if (!token) {
      return {
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // 驗證token並獲取用戶資訊 - Validate token and get user information
    const user = await getUserFromToken(token)

    if (!user) {
      return {
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }

    // 認證成功，返回用戶信息 - Authentication successful, return user info
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
 * 角色權限檢查中間件生成器
 *
 * 創建基於角色的權限檢查中間件，支援多種角色組合。
 * 檢查當前用戶是否具備指定角色權限。
 *
 * 使用方式:
 * ```typescript
 * const adminOnly = requireRole(['ADMIN'])
 * const salesTeam = requireRole(['ADMIN', 'SALES_MANAGER', 'SALES_REP'])
 * ```
 *
 * @param allowedRoles 允許存取的角色列表
 * @returns 權限檢查中間件函數
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
 * 管理員權限檢查中間件
 *
 * 僅允許ADMIN角色存取的資源使用。
 * 適用於系統管理、用戶管理等高權限操作。
 */
export const requireAdmin = requireRole(['ADMIN'])

/**
 * 銷售團隊權限檢查中間件
 *
 * 允許銷售相關角色存取，包含管理員、銷售經理和銷售代表。
 * 適用於銷售數據、客戶資訊、業績報表等業務功能。
 */
export const requireSalesTeam = requireRole(['ADMIN', 'SALES_MANAGER', 'SALES_REP'])

/**
 * 一般用戶權限檢查中間件
 *
 * 允許所有已登入用戶存取的資源。
 * 適用於基本功能、個人資料、一般查詢等操作。
 */
export const requireUser = requireRole(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'USER'])