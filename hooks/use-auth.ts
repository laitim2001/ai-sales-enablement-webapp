'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

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

interface AuthError {
  type: string
  message: string
  statusCode: number
  timestamp: string
  requestId?: string
}

interface AuthResponse {
  success: boolean
  data?: any
  error?: AuthError
  message?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (userData: RegisterData) => Promise<AuthResponse>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
  role?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // 檢查現有認證狀態
  useEffect(() => {
    checkAuthStatus()
  }, [])

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
        } else {
          // Token 無效，清除本地儲存
          localStorage.removeItem('auth-token')
        }
      } else {
        // Token 無效或過期，清除本地儲存
        localStorage.removeItem('auth-token')
      }
    } catch (error) {
      console.error('Auth status check failed:', error)
      localStorage.removeItem('auth-token')
    } finally {
      setIsLoading(false)
    }
  }

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
        // 儲存 token 到 localStorage
        if (result.data.token) {
          localStorage.setItem('auth-token', result.data.token)
        }

        // 設置用戶資料
        setUser(result.data.user)

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
        if (result.data.token) {
          localStorage.setItem('auth-token', result.data.token)
        }

        // 設置用戶資料
        setUser(result.data.user)

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

  const logout = () => {
    // 清除本地儲存
    localStorage.removeItem('auth-token')

    // 清除用戶狀態
    setUser(null)

    // 重導向到登入頁面
    router.push('/login')
  }

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

// 認證提供者組件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useAuthState()

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}

// 認證保護組件
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}