/**
 * ================================================================
 * 檔案名稱: Register Page
 * 檔案用途: AI銷售賦能平台的用戶註冊頁面
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. 用戶註冊 - 處理新用戶帳戶創建流程
 * 2. 表單驗證 - 多欄位即時驗證(姓名、郵件、密碼、確認密碼)
 * 3. 部門角色選擇 - 下拉選單選擇用戶部門和系統角色
 * 4. 密碼安全性 - 密碼強度驗證和確認密碼比對
 * 5. 錯誤處理 - 全面的客戶端和伺服器端錯誤處理
 * 6. 響應式設計 - 適配各種裝置螢幕尺寸的註冊表單
 * 7. 法律條款 - 內建服務條款和隱私政策同意機制
 *
 * 組件特色:
 * - 多步驟驗證: 即時驗證每個輸入欄位，提供友好的用戶體驗
 * - 雙密碼設計: 密碼和確認密碼均支援顯示/隱藏切換
 * - 組織結構: 支援部門和角色選擇，方便企業用戶管理
 * - 視覺區分: 綠色主題配色，與登入頁面形成視覺差異
 * - 智能驗證: 使用專業的密碼強度驗證規則
 * - 無障礙設計: 完整的標籤、鍵盤導航和螢幕閱讀器支援
 *
 * 依賴組件:
 * - useAuth: 認證狀態管理Hook(註冊功能)
 * - UI組件: Button, Input, Label, Card, Select等基礎組件
 * - FormError: 統一的錯誤訊息顯示組件
 * - 驗證函數: validateEmail, validatePassword
 *
 * 注意事項:
 * - 使用'use client'指令，運行在客戶端
 * - 註冊成功後自動重導向至儀表板
 * - 支援企業級角色權限系統
 * - 必須同意條款才能提交註冊
 *
 * 更新記錄:
 * - Week 1: 建立基礎註冊表單和驗證邏輯
 * - Week 2: 新增部門角色選擇功能
 * - Week 3: 整合密碼強度驗證和確認機制
 * - Week 4: 優化響應式設計和用戶體驗
 * ================================================================
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormError } from '@/components/ui/error-display'
import { useAuth } from '@/hooks/use-auth'
import { validateEmail, validatePassword } from '@/lib/auth'

// 註冊表單資料的型別定義
interface RegisterFormData {
  email: string           // 用戶電子郵件地址
  password: string        // 用戶密碼
  confirmPassword: string // 確認密碼
  firstName: string       // 用戶名字
  lastName: string        // 用戶姓氏
  department?: string     // 用戶部門(可選)
  role?: string          // 用戶角色(可選)
}

// 註冊表單錯誤訊息的型別定義
interface RegisterFormErrors {
  email?: string          // 電子郵件欄位錯誤
  password?: string       // 密碼欄位錯誤
  confirmPassword?: string // 確認密碼欄位錯誤
  firstName?: string      // 名字欄位錯誤
  lastName?: string       // 姓氏欄位錯誤
  department?: string     // 部門欄位錯誤
  role?: string          // 角色欄位錯誤
  general?: string       // 一般性錯誤訊息
}

// 部門選項常數定義 - 用於下拉選單
const DEPARTMENTS = [
  { value: 'sales', label: '銷售部' },
  { value: 'marketing', label: '行銷部' },
  { value: 'customer-service', label: '客戶服務部' },
  { value: 'product', label: '產品部' },
  { value: 'engineering', label: '工程部' },
  { value: 'finance', label: '財務部' },
  { value: 'hr', label: '人力資源部' },
  { value: 'other', label: '其他' }
]

// 用戶角色選項常數定義 - 對應系統權限等級
const USER_ROLES = [
  { value: 'SALES_REP', label: '銷售代表' },
  { value: 'SALES_MANAGER', label: '銷售經理' },
  { value: 'MARKETING_SPECIALIST', label: '行銷專員' },
  { value: 'CUSTOMER_SERVICE', label: '客戶服務' },
  { value: 'ADMIN', label: '系統管理員' }
]

/**
 * 註冊頁面主組件
 *
 * 提供完整的用戶註冊功能，包括多欄位驗證、部門角色選擇和錯誤處理。
 * 支援企業級用戶管理需求。
 *
 * @returns 註冊頁面的完整JSX結構
 */
export default function RegisterPage() {
  // === 狀態管理 ===

  // 表單資料狀態 - 儲存所有註冊相關的用戶輸入
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',              // 初始化為空
    password: '',           // 初始化為空
    confirmPassword: '',    // 初始化為空
    firstName: '',          // 初始化為空
    lastName: '',           // 初始化為空
    department: '',         // 初始化為空
    role: 'SALES_REP'      // 預設為銷售代表角色
  })

  // 錯誤狀態 - 儲存各欄位的驗證錯誤訊息
  const [errors, setErrors] = useState<RegisterFormErrors>({})

  // 載入狀態 - 控制提交按鈕和表單的禁用狀態
  const [isLoading, setIsLoading] = useState(false)

  // 密碼可見性狀態 - 控制主密碼輸入框的顯示模式
  const [showPassword, setShowPassword] = useState(false)

  // 確認密碼可見性狀態 - 控制確認密碼輸入框的顯示模式
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // === Hook依賴 ===

  // Next.js路由器，用於註冊成功後的頁面導航
  const router = useRouter()

  // 認證Hook，提供註冊功能
  const { register } = useAuth()

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {}

    // Email 驗證
    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子郵件'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件格式'
    }

    // 密碼驗證
    if (!formData.password) {
      newErrors.password = '請輸入密碼'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0] || '密碼格式不正確'
      }
    }

    // 確認密碼驗證
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認密碼'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼確認不一致'
    }

    // 姓名驗證
    if (!formData.firstName.trim()) {
      newErrors.firstName = '請輸入名字'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = '名字至少需要 2 個字符'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = '請輸入姓氏'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = '姓氏至少需要 2 個字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSelectChange = (field: keyof RegisterFormData) => (value: string) => {
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
      const result = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        role: formData.role
      })

      if (result.success) {
        // 註冊成功，重導向到儀表板
        router.push('/dashboard')
      } else {
        // 處理註冊失敗
        if (result.error?.statusCode === 409) {
          setErrors({ email: '此電子郵件已被註冊' })
        } else {
          setErrors({ general: result.error?.message || '註冊失敗，請稍後再試' })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: '網路錯誤，請檢查您的網路連線' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              建立您的帳戶
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              加入 AI 銷售賦能平台，開始您的智能銷售之旅
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
              {/* 個人資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    名字 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="名字"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    姓氏 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="姓氏"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    className={errors.lastName ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* 電子郵件 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  電子郵件 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入您的電子郵件"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* 密碼 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    密碼 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少 8 個字符"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    確認密碼 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="再次輸入密碼"
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* 部門和角色 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    部門
                  </Label>
                  <Select onValueChange={handleSelectChange('department')} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇部門" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    角色
                  </Label>
                  <Select
                    defaultValue="SALES_REP"
                    onValueChange={handleSelectChange('role')}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 條款同意 */}
              <div className="flex items-start space-x-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5"
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                  我已閱讀並同意{' '}
                  <Link href="/terms" className="text-green-600 hover:text-green-500 hover:underline">
                    服務條款
                  </Link>{' '}
                  和{' '}
                  <Link href="/privacy" className="text-green-600 hover:text-green-500 hover:underline">
                    隱私政策
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>註冊中...</span>
                  </div>
                ) : (
                  '建立帳戶'
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                已經有帳戶了？{' '}
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-500 hover:underline font-medium"
                >
                  立即登入
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}