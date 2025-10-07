/**
 * @fileoverview ================================================================檔案名稱: 服務器端認證管理檔案用途: AI銷售賦能平台的伺服器端安全認證與授權系統開發階段: 生產環境================================================================功能索引:1. JWT令牌生成與驗證 - 安全的用戶身份驗證2. 密碼加密與驗證 - bcrypt雜湊演算法保護3. 用戶認證流程 - 登入/註冊的完整驗證邏輯4. 角色權限管理 - 基於用戶角色的存取控制安全特色:- JWT令牌：無狀態認證，支援分散式系統- bcrypt加密：12輪雜湊，抵抗彩虹表攻擊- 環境變數：敏感配置與程式碼分離- 令牌過期：自動失效機制防止長期濫用環境變數依賴:- JWT_SECRET: JWT簽名密鑰（必須）- JWT_EXPIRES_IN: 令牌有效期（預設7天）安全考量:- 僅在伺服器端執行，客戶端無法存取JWT_SECRET- 密碼使用bcrypt進行不可逆加密- JWT包含發行者與受眾驗證- 自動檢查環境變數完整性注意事項:- 此檔案包含敏感安全功能，禁止客戶端引用- JWT_SECRET必須足夠複雜且保密- 生產環境建議使用更短的令牌有效期更新記錄:- Week 2: 建立JWT認證系統- Week 2: 新增角色權限控制================================================================
 * @module lib/auth-server
 * @description
 * ================================================================檔案名稱: 服務器端認證管理檔案用途: AI銷售賦能平台的伺服器端安全認證與授權系統開發階段: 生產環境================================================================功能索引:1. JWT令牌生成與驗證 - 安全的用戶身份驗證2. 密碼加密與驗證 - bcrypt雜湊演算法保護3. 用戶認證流程 - 登入/註冊的完整驗證邏輯4. 角色權限管理 - 基於用戶角色的存取控制安全特色:- JWT令牌：無狀態認證，支援分散式系統- bcrypt加密：12輪雜湊，抵抗彩虹表攻擊- 環境變數：敏感配置與程式碼分離- 令牌過期：自動失效機制防止長期濫用環境變數依賴:- JWT_SECRET: JWT簽名密鑰（必須）- JWT_EXPIRES_IN: 令牌有效期（預設7天）安全考量:- 僅在伺服器端執行，客戶端無法存取JWT_SECRET- 密碼使用bcrypt進行不可逆加密- JWT包含發行者與受眾驗證- 自動檢查環境變數完整性注意事項:- 此檔案包含敏感安全功能，禁止客戶端引用- JWT_SECRET必須足夠複雜且保密- 生產環境建議使用更短的令牌有效期更新記錄:- Week 2: 建立JWT認證系統- Week 2: 新增角色權限控制================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { User } from '@prisma/client'

// 服務器端專用 - 包含 JWT_SECRET 的功能
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// 啟動時安全性檢查：確保JWT密鑰已正確設定
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// JWT令牌內容結構定義
export interface JWTPayload {
  userId: number    // 用戶唯一識別碼
  email: string     // 用戶電子郵件
  role: string      // 用戶角色（admin/user等）
  iat?: number      // 簽發時間（由JWT自動添加）
  exp?: number      // 過期時間（由JWT自動添加）
}

/**
 * 生成 JWT Token (僅服務器端)
 *
 * @param user 用戶基本資訊 (id, email, role)
 * @returns 簽名的JWT令牌字串
 *
 * 安全特色:
 * - 包含用戶身份與角色資訊
 * - 設定發行者與受眾進行雙重驗證
 * - 自動設定過期時間防止濫用
 */
export function generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ai-sales-platform',
    audience: 'ai-sales-users'
  } as jwt.SignOptions)
}

/**
 * 驗證 JWT Token (僅服務器端)
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-sales-platform',
      audience: 'ai-sales-users'
    }) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * 加密密碼
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * 驗證密碼
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * 從 Token 獲取用戶信息 (僅服務器端)
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })
    return user
  } catch (error) {
    return null
  }
}

/**
 * 創建用戶
 */
export async function createUser(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
  department?: string
}): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const hashedPassword = await hashPassword(data.password)

  return prisma.user.create({
    data: {
      email: data.email,
      password_hash: hashedPassword,
      first_name: data.firstName,
      last_name: data.lastName,
      role: (data.role as any) || 'SALES_REP',
      department: data.department
    }
  })
}

/**
 * 用戶登入 (僅服務器端)
 */
export async function authenticateUser(email: string, password: string): Promise<{
  user: Omit<User, 'password_hash'>
  token: string
} | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return null
  }

  // 檢查密碼哈希是否存在
  if (!user.password_hash) {
    return null
  }

  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    return null
  }

  // 更新最後登入時間
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() }
  })

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  })

  // 排除密碼字段
  const { password_hash: _, ...userWithoutPassword } = user

  return {
    user: userWithoutPassword,
    token
  }
}