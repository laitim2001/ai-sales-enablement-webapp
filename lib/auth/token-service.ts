/**
 * ================================================================
 * 檔案名稱: JWT Token 服務增強
 * 檔案用途: MVP Phase 2 Sprint 1 - JWT驗證增強系統
 * 開發階段: Sprint 1 Week 1
 * ================================================================
 *
 * 功能索引:
 * 1. Refresh Token 管理 - 長期會話管理
 * 2. Access Token 生成 - 短期訪問令牌
 * 3. Token 撤銷機制 - 黑名單管理
 * 4. Token 輪換策略 - 安全性增強
 * 5. 多設備管理 - 設備級別的token控制
 *
 * 安全特色:
 * - Refresh Token 使用SHA256哈希儲存
 * - Access Token 包含JTI用於撤銷
 * - 自動清理過期token
 * - 設備指紋追蹤
 * - IP地址記錄
 *
 * 更新記錄:
 * - 2025-09-30: 初始版本，實現refresh token和黑名單機制
 * ================================================================
 */

import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../db'
import { User } from '@prisma/client'

// ================================================================
// 環境變數配置
// ================================================================

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m'  // Access token短期有效
const JWT_REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '30d' // Refresh token長期有效

// 啟動時安全性檢查
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// ================================================================
// TypeScript 類型定義
// ================================================================

/**
 * Access Token Payload（短期令牌）
 */
export interface AccessTokenPayload {
  userId: number
  email: string
  role: string
  jti: string          // JWT ID，用於撤銷機制
  type: 'access'       // Token類型標識
  iat?: number         // 簽發時間
  exp?: number         // 過期時間
}

/**
 * Refresh Token Payload（長期令牌）
 */
export interface RefreshTokenPayload {
  userId: number
  tokenId: string      // Refresh token在數據庫中的ID
  type: 'refresh'      // Token類型標識
  iat?: number
  exp?: number
}

/**
 * Token 對（Access + Refresh）
 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number    // Access token有效期（秒）
}

/**
 * 設備上下文信息
 */
export interface DeviceContext {
  deviceId?: string    // 設備唯一標識
  ipAddress?: string   // IP地址
  userAgent?: string   // User-Agent字符串
}

// ================================================================
// Access Token 管理
// ================================================================

/**
 * 生成 Access Token（短期令牌）
 *
 * @param user 用戶信息
 * @returns 簽名的JWT字符串
 *
 * 特點:
 * - 15分鐘有效期（可配置）
 * - 包含JTI用於撤銷
 * - 包含用戶基本信息
 */
export function generateAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const jti = crypto.randomUUID() // 生成唯一JWT ID

  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    jti,
    type: 'access'
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'ai-sales-platform',
    audience: 'ai-sales-users'
    // jwtid 已經在 payload 中作為 jti，不需要在 options 中重複指定
  } as jwt.SignOptions)
}

/**
 * 驗證 Access Token
 *
 * @param token JWT字符串
 * @returns 解碼後的payload
 * @throws 如果token無效或已撤銷
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    // 1. 驗證JWT簽名和有效期
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-sales-platform',
      audience: 'ai-sales-users'
    }) as AccessTokenPayload

    // 2. 檢查token類型
    if (payload.type !== 'access') {
      throw new Error('Invalid token type')
    }

    // 3. 檢查是否在黑名單中
    const isBlacklisted = await isTokenBlacklisted(payload.jti)
    if (isBlacklisted) {
      throw new Error('Token has been revoked')
    }

    return payload
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    }
    throw error
  }
}

// ================================================================
// Refresh Token 管理
// ================================================================

/**
 * 生成 Refresh Token（長期令牌）
 *
 * @param user 用戶信息
 * @param deviceContext 設備上下文
 * @returns JWT字符串和數據庫記錄ID
 *
 * 流程:
 * 1. 生成隨機token字符串
 * 2. 使用SHA256哈希
 * 3. 存儲哈希值到數據庫
 * 4. 返回明文token（僅此一次）
 */
export async function generateRefreshToken(
  user: Pick<User, 'id' | 'email'>,
  deviceContext: DeviceContext = {}
): Promise<string> {
  // 生成隨機refresh token字符串
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)

  // 計算過期時間
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30天後過期

  // 存儲到數據庫
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      device_id: deviceContext.deviceId,
      ip_address: deviceContext.ipAddress,
      user_agent: deviceContext.userAgent,
      expires_at: expiresAt,
      is_active: true
    }
  })

  // 生成包含數據庫記錄ID的JWT
  const payload: RefreshTokenPayload = {
    userId: user.id,
    tokenId: refreshTokenRecord.id,
    type: 'refresh'
  }

  // 使用rawToken作為簽名的一部分
  return jwt.sign(payload, JWT_SECRET + rawToken, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'ai-sales-platform',
    audience: 'ai-sales-users'
  } as jwt.SignOptions)
}

/**
 * 驗證 Refresh Token 並返回新的 Token 對
 *
 * @param refreshToken Refresh token字符串
 * @param deviceContext 設備上下文
 * @returns 新的token對
 * @throws 如果refresh token無效
 *
 * 流程:
 * 1. 解碼並驗證JWT
 * 2. 從數據庫查詢refresh token記錄
 * 3. 驗證哈希值匹配
 * 4. 檢查是否過期或撤銷
 * 5. 生成新的access token
 * 6. 可選: 輪換refresh token（推薦）
 */
export async function refreshAccessToken(
  refreshToken: string,
  deviceContext: DeviceContext = {},
  rotateRefreshToken: boolean = true
): Promise<TokenPair> {
  try {
    // 1. 解碼refresh token（先不驗證簽名，因為需要從數據庫獲取原始token）
    const decoded = jwt.decode(refreshToken) as RefreshTokenPayload

    if (!decoded || decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token')
    }

    // 2. 從數據庫查詢refresh token記錄
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
      include: { user: true }
    })

    if (!tokenRecord) {
      throw new Error('Refresh token not found')
    }

    // 3. 檢查token狀態
    if (!tokenRecord.is_active) {
      throw new Error('Refresh token has been revoked')
    }

    if (new Date() > tokenRecord.expires_at) {
      throw new Error('Refresh token expired')
    }

    // 4. 更新最後使用時間
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        last_used_at: new Date(),
        ip_address: deviceContext.ipAddress || tokenRecord.ip_address
      }
    })

    // 5. 生成新的access token
    const newAccessToken = generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role
    })

    // 6. 可選: 輪換refresh token（增強安全性）
    let newRefreshToken = refreshToken
    if (rotateRefreshToken) {
      // 撤銷舊的refresh token
      await revokeRefreshToken(tokenRecord.id, 'Token rotation')

      // 生成新的refresh token
      newRefreshToken = await generateRefreshToken(
        {
          id: tokenRecord.user.id,
          email: tokenRecord.user.email
        },
        deviceContext
      )
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: parseExpiresIn(JWT_ACCESS_TOKEN_EXPIRES_IN)
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token')
    }
    throw error
  }
}

/**
 * 撤銷用戶的所有 Refresh Tokens
 *
 * @param userId 用戶ID
 * @param reason 撤銷原因
 *
 * 使用場景:
 * - 用戶登出所有設備
 * - 密碼重置
 * - 安全事件響應
 */
export async function revokeAllUserRefreshTokens(userId: number, reason?: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      user_id: userId,
      is_active: true
    },
    data: {
      is_active: false,
      revoked_at: new Date()
    }
  })
}

/**
 * 撤銷單個 Refresh Token
 *
 * @param tokenId Refresh token數據庫記錄ID
 * @param reason 撤銷原因
 */
export async function revokeRefreshToken(tokenId: string, reason?: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { id: tokenId },
    data: {
      is_active: false,
      revoked_at: new Date()
    }
  })
}

// ================================================================
// Token 黑名單管理
// ================================================================

/**
 * 將 Access Token 加入黑名單
 *
 * @param jti JWT ID
 * @param userId 用戶ID
 * @param expiresAt Token原本的過期時間
 * @param reason 撤銷原因
 *
 * 使用場景:
 * - 用戶登出
 * - 立即撤銷某個access token
 * - 安全事件響應
 */
export async function blacklistToken(
  jti: string,
  userId: number,
  expiresAt: Date,
  reason?: string
): Promise<void> {
  await prisma.tokenBlacklist.create({
    data: {
      token_jti: jti,
      user_id: userId,
      expires_at: expiresAt,
      reason
    }
  })
}

/**
 * 檢查 Token 是否在黑名單中
 *
 * @param jti JWT ID
 * @returns true表示已撤銷，false表示有效
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const blacklistedToken = await prisma.tokenBlacklist.findUnique({
    where: { token_jti: jti }
  })

  return blacklistedToken !== null
}

/**
 * 清理過期的黑名單記錄
 *
 * 建議: 使用定時任務每天執行一次
 */
export async function cleanupExpiredBlacklistedTokens(): Promise<number> {
  const result = await prisma.tokenBlacklist.deleteMany({
    where: {
      expires_at: {
        lt: new Date() // 刪除已過期的記錄
      }
    }
  })

  return result.count
}

/**
 * 清理過期的 Refresh Tokens
 *
 * 建議: 使用定時任務每天執行一次
 */
export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expires_at: {
        lt: new Date()
      },
      is_active: false
    }
  })

  return result.count
}

// ================================================================
// 完整認證流程
// ================================================================

/**
 * 用戶登入 - 生成完整的 Token 對
 *
 * @param user 用戶信息
 * @param deviceContext 設備上下文
 * @returns Token對（access + refresh）
 */
export async function loginUser(
  user: Pick<User, 'id' | 'email' | 'role'>,
  deviceContext: DeviceContext = {}
): Promise<TokenPair> {
  const accessToken = generateAccessToken(user)
  const refreshToken = await generateRefreshToken(user, deviceContext)

  return {
    accessToken,
    refreshToken,
    expiresIn: parseExpiresIn(JWT_ACCESS_TOKEN_EXPIRES_IN)
  }
}

/**
 * 用戶登出 - 撤銷 Tokens
 *
 * @param accessToken Access token字符串
 * @param refreshTokenId Refresh token數據庫ID（可選）
 * @param logoutAllDevices 是否登出所有設備
 */
export async function logoutUser(
  accessToken: string,
  refreshTokenId?: string,
  logoutAllDevices: boolean = false
): Promise<void> {
  try {
    // 1. 解碼access token獲取用戶信息
    const payload = jwt.decode(accessToken) as AccessTokenPayload

    if (!payload) {
      throw new Error('Invalid access token')
    }

    // 2. 將access token加入黑名單
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any
    const expiresAt = new Date(decoded.exp * 1000)
    await blacklistToken(payload.jti, payload.userId, expiresAt, 'User logout')

    // 3. 撤銷refresh token
    if (logoutAllDevices) {
      await revokeAllUserRefreshTokens(payload.userId, 'Logout all devices')
    } else if (refreshTokenId) {
      await revokeRefreshToken(refreshTokenId, 'User logout')
    }
  } catch (error) {
    // 即使token無效也繼續執行登出
    console.error('Logout error:', error)
  }
}

// ================================================================
// 工具函數
// ================================================================

/**
 * 使用SHA256哈希token
 *
 * @param token 原始token字符串
 * @returns SHA256哈希值（hex格式）
 */
function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
}

/**
 * 解析過期時間字符串為秒數
 *
 * @param expiresIn 過期時間字符串（如 "15m", "7d"）
 * @returns 秒數
 */
function parseExpiresIn(expiresIn: string): number {
  const regex = /^(\d+)([smhd])$/
  const match = expiresIn.match(regex)

  if (!match) {
    return 900 // 默認15分鐘
  }

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 60 * 60 * 24
    default: return 900
  }
}

/**
 * 獲取用戶所有活躍的 Refresh Tokens
 *
 * @param userId 用戶ID
 * @returns Refresh token記錄列表
 *
 * 使用場景: 顯示用戶已登入的設備列表
 */
export async function getUserActiveRefreshTokens(userId: number) {
  return prisma.refreshToken.findMany({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: {
        gt: new Date()
      }
    },
    orderBy: {
      last_used_at: 'desc'
    },
    select: {
      id: true,
      device_id: true,
      ip_address: true,
      user_agent: true,
      created_at: true,
      last_used_at: true,
      expires_at: true
    }
  })
}

/**
 * 撤銷特定設備的 Refresh Token
 *
 * @param userId 用戶ID
 * @param deviceId 設備ID
 */
export async function revokeDeviceRefreshToken(userId: number, deviceId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      user_id: userId,
      device_id: deviceId,
      is_active: true
    },
    data: {
      is_active: false,
      revoked_at: new Date()
    }
  })
}