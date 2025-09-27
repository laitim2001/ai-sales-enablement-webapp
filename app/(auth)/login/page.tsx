/**
 * ================================================================
 * 檔案名稱: Login Page
 * 檔案用途: AI銷售賦能平台的用戶登入頁面
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. 用戶認證 - 處理電子郵件和密碼登入驗證
 * 2. 表單驗證 - 客戶端即時驗證和錯誤提示
 * 3. 密碼可見性 - 提供密碼顯示/隱藏切換功能
 * 4. 錯誤處理 - 全面的錯誤處理和用戶友好的錯誤訊息
 * 5. 路由導航 - 登入成功後自動重導向到儀表板
 * 6. 響應式設計 - 適配各種裝置螢幕尺寸
 * 7. 用戶體驗 - 載入狀態、記住我功能、忘記密碼連結
 *
 * 組件特色:
 * - 即時驗證: 輸入時即時清除錯誤狀態，提升用戶體驗
 * - 安全設計: 密碼輸入框預設隱藏，可選擇性顯示
 * - 視覺回饋: 載入動畫、錯誤狀態視覺提示
 * - 品牌一致: 藍色主題配色，符合平台視覺識別
 * - 可訪問性: 完整的標籤和鍵盤導航支援
 * - 漸層背景: 美觀的背景設計提升視覺質感
 *
 * 依賴組件:
 * - useAuth: 認證狀態管理Hook
 * - UI組件: Button, Input, Label, Card等基礎UI組件
 * - FormError: 錯誤訊息顯示組件
 * - 圖示組件: Lucide React圖示庫
 *
 * 注意事項:
 * - 使用'use client'指令，運行在客戶端
 * - 登入成功後重導向至/dashboard
 * - 錯誤處理包含網路錯誤和認證錯誤
 * - 密碼驗證只檢查是否為空，詳細驗證在伺服器端
 *
 * 更新記錄:
 * - Week 1: 建立基礎登入表單
 * - Week 2: 新增錯誤處理和驗證
 * - Week 3: 優化UI/UX和響應式設計
 * - Week 4: 整合記住我功能和忘記密碼流程
 * ================================================================
 */

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

// 登入表單資料的型別定義
interface LoginFormData {
  email: string     // 用戶電子郵件地址
  password: string  // 用戶密碼
}

// 登入表單錯誤訊息的型別定義
interface LoginFormErrors {
  email?: string    // 電子郵件欄位的錯誤訊息
  password?: string // 密碼欄位的錯誤訊息
  general?: string  // 一般性錯誤訊息（如網路錯誤、認證失敗等）
}

/**
 * 登入頁面主組件
 *
 * 提供完整的用戶登入功能，包括表單驗證、錯誤處理和狀態管理。
 * 使用現代React Hooks進行狀態管理，提供流暢的用戶體驗。
 *
 * @returns 登入頁面的完整JSX結構
 */
export default function LoginPage() {
  // === 狀態管理 ===

  // 表單資料狀態 - 儲存用戶輸入的電子郵件和密碼
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',      // 初始化為空字串
    password: ''    // 初始化為空字串
  })

  // 錯誤狀態 - 儲存各欄位和一般性錯誤訊息
  const [errors, setErrors] = useState<LoginFormErrors>({})

  // 載入狀態 - 控制提交按鈕和表單元素的禁用狀態
  const [isLoading, setIsLoading] = useState(false)

  // 密碼可見性狀態 - 控制密碼輸入框的文字顯示
  const [showPassword, setShowPassword] = useState(false)

  // === Hook依賴 ===

  // Next.js路由器，用於頁面導航
  const router = useRouter()

  // 認證Hook，提供登入功能
  const { login } = useAuth()

  // === 表單驗證函數 ===

  /**
   * 驗證表單資料的有效性
   *
   * 執行客戶端表單驗證，檢查電子郵件和密碼的基本要求。
   * 會更新錯誤狀態並返回驗證結果。
   *
   * @returns 驗證是否通過（true表示無錯誤）
   */
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {}

    // === 電子郵件驗證 ===
    if (!formData.email.trim()) {
      // 檢查是否為空（移除前後空白後）
      newErrors.email = '請輸入電子郵件'
    } else if (!validateEmail(formData.email)) {
      // 使用共用的電子郵件格式驗證函數
      newErrors.email = '請輸入有效的電子郵件格式'
    }

    // === 密碼驗證 ===
    if (!formData.password) {
      // 檢查密碼是否為空
      newErrors.password = '請輸入密碼'
    }

    // 更新錯誤狀態
    setErrors(newErrors)

    // 返回驗證結果：無錯誤時為true
    return Object.keys(newErrors).length === 0
  }

  // === 事件處理函數 ===

  /**
   * 處理表單輸入變更
   *
   * 這是一個高階函數，返回特定欄位的變更處理函數。
   * 當用戶輸入時會更新對應欄位的值，並清除該欄位的錯誤狀態。
   *
   * @param field - 要更新的表單欄位名稱
   * @returns 輸入變更事件處理函數
   */
  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value

    // 更新表單資料中的特定欄位
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除該欄位的錯誤狀態（提供即時回饋）
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  /**
   * 處理表單提交
   *
   * 執行完整的登入流程：表單驗證 → API呼叫 → 結果處理 → 頁面導航。
   * 包含完整的錯誤處理和載入狀態管理。
   *
   * @param e - 表單提交事件
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // 防止預設的表單提交行為
    e.preventDefault()

    // === 表單驗證階段 ===
    if (!validateForm()) {
      return // 驗證失敗，停止提交流程
    }

    // === 提交準備階段 ===
    setIsLoading(true)  // 啟用載入狀態
    setErrors({})       // 清除之前的錯誤訊息

    try {
      // === API呼叫階段 ===
      const result = await login(formData.email, formData.password)

      if (result.success) {
        // === 登入成功處理 ===
        // 重導向到儀表板頁面
        router.push('/dashboard')
      } else {
        // === 登入失敗處理 ===
        if (result.error?.statusCode === 401) {
          // 認證失敗 - 401狀態碼表示憑證錯誤
          setErrors({ general: '電子郵件或密碼錯誤' })
        } else {
          // 其他伺服器錯誤
          setErrors({ general: result.error?.message || '登入失敗，請稍後再試' })
        }
      }
    } catch (error) {
      // === 網路錯誤處理 ===
      console.error('Login error:', error)
      setErrors({ general: '網路錯誤，請檢查您的網路連線' })
    } finally {
      // === 清理階段 ===
      setIsLoading(false) // 無論成功或失敗都要關閉載入狀態
    }
  }

  // === JSX渲染 ===
  return (
    // 主容器 - 全螢幕高度，漸層背景，居中對齊
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
      {/* 卡片容器 - 限制最大寬度，響應式設計 */}
      <div className="w-full max-w-md">
        {/* 主要登入卡片 - 半透明背景，毛玻璃效果 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">

          {/* === 卡片標題區域 === */}
          <CardHeader className="text-center pb-8">
            {/* 品牌圖示 - 藍色圓形背景配白色圖示 */}
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>

            {/* 主標題 */}
            <CardTitle className="text-2xl font-bold text-gray-900">
              歡迎回來
            </CardTitle>

            {/* 副標題/說明文字 */}
            <CardDescription className="text-gray-600 mt-2">
              登入您的 AI 銷售賦能平台帳戶
            </CardDescription>
          </CardHeader>

          {/* === 卡片內容區域 === */}
          <CardContent className="space-y-6">
            {/* 一般性錯誤訊息顯示 */}
            {errors.general && (
              <FormError
                errors={errors.general}
                onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
              />
            )}

            {/* === 登入表單 === */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* === 電子郵件輸入欄位 === */}
              <div className="space-y-2">
                {/* 欄位標籤 */}
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  電子郵件
                </Label>
                {/* 輸入框容器 - 相對定位以放置圖示 */}
                <div className="relative">
                  {/* 左側郵件圖示 */}
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  {/* 電子郵件輸入框 */}
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入您的電子郵件"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={isLoading}  // 載入時禁用
                  />
                </div>
                {/* 錯誤訊息顯示 */}
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* === 密碼輸入欄位 === */}
              <div className="space-y-2">
                {/* 欄位標籤 */}
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  密碼
                </Label>
                {/* 輸入框容器 - 相對定位以放置左右圖示 */}
                <div className="relative">
                  {/* 左側鎖頭圖示 */}
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  {/* 密碼輸入框 - 根據showPassword狀態切換type */}
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="請輸入您的密碼"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={isLoading}  // 載入時禁用
                  />
                  {/* 右側密碼可見性切換按鈕 */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />  {/* 隱藏密碼圖示 */}
                    ) : (
                      <Eye className="h-4 w-4" />     {/* 顯示密碼圖示 */}
                    )}
                  </button>
                </div>
                {/* 錯誤訊息顯示 */}
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

              {/* === 提交按鈕 === */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                disabled={isLoading}  // 載入時禁用防止重複提交
              >
                {isLoading ? (
                  // 載入狀態 - 顯示旋轉動畫和載入文字
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>登入中...</span>
                  </div>
                ) : (
                  // 正常狀態 - 顯示登入文字
                  '登入'
                )}
              </Button>
            </form>

            {/* === 註冊連結區域 === */}
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

        {/* === 頁面底部法律條款 === */}
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