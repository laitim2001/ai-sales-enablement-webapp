/**
 * @fileoverview use-auth - 工具模組
 * @module hooks/use-auth
 * @description
 * 提供輔助功能的工具函數
 *
 * ### 主要功能:
 * - useAuth(): 函數功能
 * - useAuthState(): 函數功能
 * - AuthProvider(): 函數功能
 * - ProtectedRoute(): 函數功能
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

/**
 * ================================================================
 * 檔案名稱: 認證狀態Hook
 * 檔案用途: AI銷售賦能平台的用戶認證和權限管理
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. useAuth - 主要認證Hook，提供完整認證功能
 * 2. useAuthState - 認證狀態管理Hook
 * 3. AuthProvider - 認證上下文提供者組件
 * 4. ProtectedRoute - 路由保護組件
 * 5. User/AuthError 接口 - 認證相關數據結構
 *
 * 技術特色/核心特色:
 * - React Context認證系統: 全局狀態管理
 * - JWT Token管理: 自動token存取和驗證
 * - 自動路由保護: 未認證用戶自動重導向
 * - 錯誤處理: 結構化錯誤資訊和用戶友好提示
 * - 持久化狀態: localStorage自動狀態保存
 * - TypeScript類型安全: 完整的類型定義和約束
 *
 * 依賴關係:
 * - React 18+: Context、Hooks和組件系統
 * - Next.js 13+: 路由系統和navigation
 * - 後端API: /api/auth/login, /api/auth/register, /api/auth/me
 *
 * 注意事項:
 * - 必須在AuthProvider中使用useAuth
 * - localStorage依賴瀏覽器環境，需考慮SR場景
 * - Token過期自動清理和重導向
 * - 所有網路請求都包含錯誤處理
 *
 * 使用範例:
 * ```tsx
 * // 1. 在應用根部包裝AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // 2. 在組件中使用認證功能
 * const { user, login, logout, isAuthenticated } = useAuth()
 *
 * // 3. 保護路由
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 *
 * 更新記錄:
 * - Week 1: 建立基礎認證Hook和狀態管理
 * - Week 2: 新增註冊功能和錯誤處理
 * - Week 3: 完善路由保護和自動重導向
 * - Week 4: 優化用戶體驗和性能
 * ================================================================
 */

import React, { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 用戶資訊接口
 *
 * 定義系統中用戶的完整資訊結構。
 * 包含基本資訊、權限和狀態資訊。
 */
interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 認證錯誤接口
 *
 * 結構化的認證錯誤資訊，包含錯誤類型、
 * 訊息和追蹤資訊。
 */
interface AuthError {
  type: string
  message: string
  statusCode: number
  timestamp: string
  requestId?: string
}

/**
 * 認證回應接口
 *
 * 所有認證相關 API 請求的統一回應格式。
 * 支援成功和錯誤兩種狀態。
 */
interface AuthResponse {
  success: boolean
  data?: any
  error?: AuthError
  message?: string
}

/**
 * 認證上下文類型
 *
 * 定義認證上下文提供的所有狀態和方法。
 * 這是 useAuth Hook 的返回類型。
 */
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (userData: RegisterData) => Promise<AuthResponse>
  logout: () => void
  refreshUser: () => Promise<void>
}

/**
 * 註冊數據接口
 *
 * 用戶註冊時需要提供的所有資訊。
 */
interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
  role?: string
}

/**
 * 認證上下文
 *
 * React Context 用於在整個應用中共享認證狀態。
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 認證 Hook
 *
 * 提供完整的認證功能，包括用戶狀態、登入、註冊、
 * 登出等功能。必須在 AuthProvider 中使用。
 *
 * @returns 認證上下文的所有狀態和方法
 * @throws Error 當在 AuthProvider 之外使用時
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * 認證狀態管理 Hook
 *
 * 實現認證狀態的核心邏輯，包括用戶狀態管理、
 * 登入登出、token 管理等功能。
 *
 * 功能特性:
 * - 自動检查認證狀態
 * - JWT token 自動管理
 * - 錯誤處理和用戶友好提示
 * - 持久化狀態保存
 *
 * @returns 認證相關的狀態和方法
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  /**
   * 初始化時檢查現有認證狀態
   *
   * 應用啟動時自動檢查 localStorage 中的 token
   * 並驗證其有效性。
   */
  useEffect(() => {
    checkAuthStatus()
  }, [])

  /**
   * 檢查認證狀態
   *
   * 向後端驗證當前 token 的有效性並獲取用戶資訊。
   * 只在確認 token 無效時清理本地存儲（避免因網路問題導致登出）。
   */
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUser(result.data)
          // 快取用戶資料以備離線或伺服器錯誤時使用
          localStorage.setItem('cached-user', JSON.stringify(result.data))
        } else {
          // Token 無效，清除本地儲存
          localStorage.removeItem('auth-token')
          localStorage.removeItem('cached-user')
        }
      } else if (response.status === 401 || response.status === 403) {
        // 只在 401 (Unauthorized) 或 403 (Forbidden) 時清除 token
        // 這表示 token 確實無效或用戶被禁用
        console.warn('Authentication failed: token invalid or user unauthorized')
        localStorage.removeItem('auth-token')
        localStorage.removeItem('cached-user')
      } else {
        // 對於其他錯誤（如 500 伺服器錯誤），保留 token
        // 這可能只是暫時性的伺服器問題
        console.warn(`Auth check failed with status ${response.status}, keeping token for retry`)
        // 從 localStorage 恢復之前的用戶狀態（如果有）
        const cachedUser = localStorage.getItem('cached-user')
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser))
          } catch (e) {
            console.error('Failed to parse cached user:', e)
          }
        }
      }
    } catch (error) {
      // 網路錯誤或其他異常：保留 token，可能只是暫時性問題
      console.warn('Auth status check failed (network error), keeping token:', error)
      // 嘗試從快取恢復用戶狀態
      const cachedUser = localStorage.getItem('cached-user')
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser))
        } catch (e) {
          console.error('Failed to parse cached user:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 用戶登入函數
   *
   * 處理用戶登入請求，包括認證驗證、token 存儲
   * 和用戶狀態更新。
   *
   * @param email 用戶電子郵件
   * @param password 用戶密碼
   * @returns 登入結果，包含成功狀態和用戶資訊
   */
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        // 儲存 access token 到 localStorage
        // API返回 accessToken (不是 token)
        const token = result.data.accessToken || result.data.token
        if (token) {
          localStorage.setItem('auth-token', token)
        }

        // 設置用戶資料
        setUser(result.data.user)
        // 快取用戶資料
        localStorage.setItem('cached-user', JSON.stringify(result.data.user))

        return {
          success: true,
          data: result.data,
          message: result.message
        }
      } else {
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: '網路錯誤，請檢查您的連線',
          statusCode: 0,
          timestamp: new Date().toISOString()
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 用戶註冊函數
   *
   * 處理用戶註冊請求，成功後自動執行登入。
   *
   * @param userData 註冊資訊，包含電子郵件、密碼和個人資訊
   * @returns 註冊結果，成功後包含用戶資訊和 token
   */
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()

      if (result.success && result.data) {
        // 註冊成功後自動登入
        // API返回 accessToken (不是 token)
        const token = result.data.accessToken || result.data.token
        if (token) {
          localStorage.setItem('auth-token', token)
        }

        // 設置用戶資料
        setUser(result.data.user)
        // 快取用戶資料
        localStorage.setItem('cached-user', JSON.stringify(result.data.user))

        return {
          success: true,
          data: result.data,
          message: result.message
        }
      } else {
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: '網路錯誤，請檢查您的連線',
          statusCode: 0,
          timestamp: new Date().toISOString()
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 用戶登出函數
   *
   * 清理所有本地認證資訊並重導向到登入頁面。
   */
  const logout = () => {
    // 清除本地儲存
    localStorage.removeItem('auth-token')
    localStorage.removeItem('cached-user')

    // 清除用戶狀態
    setUser(null)

    // 重導向到登入頁面
    router.push('/login')
  }

  /**
   * 刷新用戶資訊
   *
   * 重新從後端獲取最新的用戶資訊，
   * 用於同步用戶資料更新。
   */
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUser(result.data)
          // 更新快取的用戶資料
          localStorage.setItem('cached-user', JSON.stringify(result.data))
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser
  }
}

/**
 * 認證提供者組件
 *
 * 為整個應用提供認證上下文。必須包裝在應用的
 * 根組件，以便子組件可以使用 useAuth Hook。
 *
 * @param children 子組件
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useAuthState()

  const providerValue = authState;
  return React.createElement(AuthContext.Provider, { value: providerValue }, children);
}

/**
 * 認證保護組件
 *
 * 保護需要認證才能訪問的路由和組件。
 * 未認證的用戶會被自動重導向到登入頁面。
 *
 * 功能特性:
 * - 自動認證狀態檢查
 * - 加載狀態顯示
 * - 自動重導向至登入頁面
 *
 * @param children 需要保護的子組件
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center'
    }, React.createElement('div', {
      className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
    }))
  }

  if (!isAuthenticated) {
    return null
  }

  return React.createElement(React.Fragment, null, children)
}