'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorDisplay, FormError } from '@/components/ui/error-display'
import { useAuth } from '@/hooks/use-auth'
import { validateEmail } from '@/lib/auth'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const { login } = useAuth()

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {}

    // Email 驗證
    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子郵件'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件格式'
    }

    // 密碼驗證
    if (!formData.password) {
      newErrors.password = '請輸入密碼'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await login(formData.email, formData.password)

      if (result.success) {
        // 登入成功，重導向到儀表板
        router.push('/dashboard')
      } else {
        // 處理登入失敗
        if (result.error?.statusCode === 401) {
          setErrors({ general: '電子郵件或密碼錯誤' })
        } else {
          setErrors({ general: result.error?.message || '登入失敗，請稍後再試' })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: '網路錯誤，請檢查您的網路連線' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              歡迎回來
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              登入您的 AI 銷售賦能平台帳戶
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {errors.general && (
              <FormError
                errors={errors.general}
                onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  電子郵件
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入您的電子郵件"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  密碼
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="請輸入您的密碼"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    記住我
                  </Label>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                >
                  忘記密碼？
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>登入中...</span>
                  </div>
                ) : (
                  '登入'
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                還沒有帳戶？{' '}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
                >
                  立即註冊
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            使用本服務即表示您同意我們的{' '}
            <Link href="/terms" className="hover:underline">
              服務條款
            </Link>{' '}
            和{' '}
            <Link href="/privacy" className="hover:underline">
              隱私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}