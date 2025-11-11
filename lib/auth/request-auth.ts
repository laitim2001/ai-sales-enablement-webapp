/**
 * @fileoverview 統一請求認證工具 (Unified Request Authentication)
 *
 * 提供統一的token提取和驗證邏輯，支持雙重認證來源：
 * 1. Authorization header (Bearer token) - API和移動端優先
 * 2. auth-token cookie - 網頁應用fallback
 *
 * @module lib/auth/request-auth
 * @since Sprint 3 Week 7 - 認證架構統一
 * @created 2025-11-11
 */

import { NextRequest } from 'next/server'
import { verifyAccessToken, type AccessTokenPayload } from './token-service'

/**
 * 從請求中提取認證token（支持雙來源）
 *
 * 提取優先級：
 * 1. Authorization header (Bearer token) - 優先
 * 2. auth-token cookie - Fallback
 *
 * @param request - Next.js請求物件
 * @returns Token字符串，如果未找到則返回null
 *
 * @example
 * // Bearer token認證
 * const token = extractTokenFromRequest(request)
 * // Authorization: Bearer eyJhbGci...
 *
 * @example
 * // Cookie認證（fallback）
 * const token = extractTokenFromRequest(request)
 * // Cookie: auth-token=eyJhbGci...
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // 1. 優先檢查Authorization header（Bearer token格式）
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7) // 移除 "Bearer " 前綴
  }

  // 2. Fallback到auth-token cookie
  const cookieToken = request.cookies.get('auth-token')?.value
  return cookieToken || null
}

/**
 * 統一請求認證函數
 *
 * 執行完整的認證流程：
 * 1. 從請求提取token（雙來源支持）
 * 2. 驗證JWT簽名和有效期
 * 3. 檢查token類型
 * 4. 檢查黑名單
 *
 * @param request - Next.js請求物件
 * @returns 解碼後的access token payload
 * @throws Error 如果token缺失、無效或已撤銷
 *
 * @example
 * try {
 *   const payload = await authenticateRequest(request)
 *   const userId = payload.userId
 *   const userRole = payload.role
 * } catch (error) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * }
 */
export async function authenticateRequest(request: NextRequest): Promise<AccessTokenPayload> {
  // 提取token
  const token = extractTokenFromRequest(request)

  if (!token) {
    throw new Error('Missing authorization token')
  }

  // 驗證token（包含簽名、有效期、類型、黑名單檢查）
  try {
    const payload = await verifyAccessToken(token)
    return payload
  } catch (error) {
    // 保持原始錯誤訊息（Invalid token, Token expired等）
    throw error
  }
}

/**
 * 可選的認證函數 - 允許未認證請求
 *
 * 用於需要支持匿名訪問的端點，但在有token時提供用戶上下文
 *
 * @param request - Next.js請求物件
 * @returns 解碼後的payload，如果未認證則返回null
 *
 * @example
 * const payload = await authenticateRequestOptional(request)
 * if (payload) {
 *   // 已認證用戶 - 提供個性化內容
 *   const userId = payload.userId
 * } else {
 *   // 匿名用戶 - 提供通用內容
 * }
 */
export async function authenticateRequestOptional(
  request: NextRequest
): Promise<AccessTokenPayload | null> {
  try {
    return await authenticateRequest(request)
  } catch {
    return null
  }
}

/**
 * 提取用戶ID的便捷函數
 *
 * @param request - Next.js請求物件
 * @returns 用戶ID
 * @throws Error 如果認證失敗
 *
 * @example
 * const userId = await extractUserId(request)
 * const user = await prisma.user.findUnique({ where: { id: userId } })
 */
export async function extractUserId(request: NextRequest): Promise<number> {
  const payload = await authenticateRequest(request)
  return payload.userId
}

/**
 * 提取用戶角色的便捷函數
 *
 * @param request - Next.js請求物件
 * @returns 用戶角色字符串
 * @throws Error 如果認證失敗
 *
 * @example
 * const role = await extractUserRole(request)
 * if (role === 'ADMIN') {
 *   // 管理員特權操作
 * }
 */
export async function extractUserRole(request: NextRequest): Promise<string> {
  const payload = await authenticateRequest(request)
  return payload.role
}
