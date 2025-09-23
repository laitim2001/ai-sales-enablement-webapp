import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * 生成 JWT Token
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
  })
}

/**
 * 驗證 JWT Token
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
 * 從 Token 獲取用戶信息
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
      role: data.role || 'SALES_REP',
      department: data.department
    }
  })
}

/**
 * 用戶登入
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
    id: user.id.toString(),
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

/**
 * 密碼強度驗證
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密碼長度至少需要 8 個字符')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密碼必須包含至少一個大寫字母')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密碼必須包含至少一個小寫字母')
  }

  if (!/\d/.test(password)) {
    errors.push('密碼必須包含至少一個數字')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密碼必須包含至少一個特殊字符')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Email 格式驗證
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}