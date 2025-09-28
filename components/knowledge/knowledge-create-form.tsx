/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫創建表單組件 (/components/knowledge/knowledge-create-form.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 提供創建新知識庫文檔的表單介面，包括標題、內容、類別、標籤、作者等資訊的
 * 輸入，支持表單驗證、錯誤處理和讀取狀態管理，創建成功後跳轉到詳情頁。
 *
 * 【主要職責】
 * • 表單管理 - 管理所有表單欄位的狀態和驗證
 * • 數據驗證 - 對必填欄位進行前端驗證
 * • API互動 - 轉換表單數據為API格式並提交
 * • 錯誤處理 - 顯示驗證錯誤和API錯誤訊息
 * • 路由導航 - 成功創建後跳轉到文檔詳情頁
 * • 用戶体驗 - 提供載入狀態和友好的使用介面
 * • 標籤處理 - 將逗號分隔的字符串轉換為數組
 * • 類別選擇 - 提供預定義的文檔類別選項
 *
 * 【Props介面】
 * • 無Props - 這是一個獨立的表單組件，不需要外部傳入參數
 *
 * 【狀態管理】
 * • formData - CreateFormData - 表單数據狀態
 *   - title: string - 文檔標題(必填)
 *   - content: string - 文檔內容(可選)
 *   - category: string - 文檔類別
 *   - source: string - 文檔來源
 *   - author: string - 作者資訊
 *   - language: string - 文檔語言
 *   - tags: string - 標籤字符串(逗號分隔)
 * • errors - CreateFormErrors - 驗證錯誤狀態
 * • isLoading - boolean - 提交狀態
 *
 * 【用戶互動】
 * • 表單輸入 - 即時更新狀態並清除相關錯誤
 * • 表單提交 - 驗證通過後提交到API
 * • 返回操作 - 跳轉回知識庫列表頁
 * • 錯誤關閉 - 手動關閉錯誤提示
 *
 * 【渲染邏輯】
 * • 卡片容器 - 使用Card組件包裝整個表單
 * • 標題區域 - 顯示頁面標題和返回按鈕
 * • 錯誤提示 - 在表單上方顯示通用錯誤
 * • 分組顯示 - 基本資訊和詳細資訊分組顯示
 * • 提交区域 - 提交和取消按鈕區域
 *
 * 【Hook使用】
 * • useState - 管理表單数據、錯誤和載入狀態
 * • useRouter - 用於頁面跳轉和導航
 *
 * 【副作用處理】
 * • API請求 - 提交表單數據到/api/knowledge-base端點
 * • JWT認證 - 在請求標頭中包含認證token
 * • 錯誤處理 - 捕獲和解析API錯誤回應
 *
 * 【相關檔案】
 * • /components/ui/button.tsx - 按鈕組件
 * • /components/ui/input.tsx - 輸入框組件
 * • /components/ui/textarea.tsx - 文本域組件
 * • /components/ui/card.tsx - 卡片容器組件
 * • /components/ui/error-display.tsx - 錯誤顯示組件
 * • /api/knowledge-base - 後端API端點
 * • /app/dashboard/knowledge/create/page.tsx - 父頁面組件
 *
 * 【開發注意】
 * • 表單驗證 - 在提交前进行完整的前端驗證
 * • 錯誤處理 - 提供詳細的錯誤訊息和引導
 * • UX優化 - 載入狀態和停用按鈕的視覺回饋
 * • 数據格式 - 正確轉換標籤字符串為数組格式
 * • 組件性能 - 使用即時狀態更新，避免不必要的重渲染
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormError } from '@/components/ui/error-display'
import {
  DocumentIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface CreateFormData {
  title: string
  content: string
  category: string
  source: string
  author: string
  language: string
  tags: string
}

interface CreateFormErrors {
  title?: string
  content?: string
  category?: string
  general?: string
}

// 文檔類別選項
const CATEGORIES = [
  { value: 'GENERAL', label: '一般' },
  { value: 'PRODUCT_SPEC', label: '產品規格' },
  { value: 'SALES_MATERIAL', label: '銷售資料' },
  { value: 'TECHNICAL_DOC', label: '技術文檔' },
  { value: 'LEGAL_DOC', label: '法律文件' },
  { value: 'TRAINING', label: '培訓資料' },
  { value: 'FAQ', label: '常見問題' },
  { value: 'CASE_STUDY', label: '案例研究' },
  { value: 'WHITE_PAPER', label: '白皮書' },
  { value: 'PRESENTATION', label: '簡報' },
  { value: 'COMPETITOR', label: '競爭分析' },
  { value: 'INDUSTRY_NEWS', label: '行業新聞' },
  { value: 'INTERNAL', label: '內部文檔' }
]

export function KnowledgeCreateForm() {
  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    content: '',
    category: 'GENERAL',
    source: '',
    author: '',
    language: 'zh-TW',
    tags: ''
  })
  const [errors, setErrors] = useState<CreateFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateForm = (): boolean => {
    const newErrors: CreateFormErrors = {}

    // 標題驗證
    if (!formData.title.trim()) {
      newErrors.title = '請輸入標題'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = '標題至少需要 2 個字符'
    } else if (formData.title.trim().length > 255) {
      newErrors.title = '標題不能超過 255 個字符'
    }

    // 內容驗證（可選，但如果提供則需要最少長度）
    if (formData.content.trim() && formData.content.trim().length < 10) {
      newErrors.content = '內容至少需要 10 個字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof CreateFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除該欄位的錯誤
    if (errors[field as keyof CreateFormErrors]) {
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
      // 處理標籤格式（轉換為數組）
      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const requestData = {
        title: formData.title.trim(),
        content: formData.content.trim() || undefined,
        category: formData.category,
        source: formData.source.trim() || undefined,
        author: formData.author.trim() || undefined,
        language: formData.language,
        tags: tagArray.length > 0 ? tagArray : undefined
      }

      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          throw new Error('請先登入')
        } else if (response.status === 409) {
          throw new Error('標題已存在，請使用不同的標題')
        } else {
          throw new Error(errorData.message || '創建失敗')
        }
      }

      const result = await response.json()

      // 創建成功，重導向到知識庫列表
      router.push(`/dashboard/knowledge/${result.data.id}`)
    } catch (error) {
      console.error('Create knowledge base error:', error)
      const errorMessage = error instanceof Error ? error.message : '創建失敗，請稍後再試'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/knowledge">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <DocumentIcon className="h-6 w-6 text-blue-600" />
            <CardTitle>新建知識庫項目</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {errors.general && (
          <FormError
            errors={errors.general}
            onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>

            {/* 標題 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                標題 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="輸入知識庫項目標題"
                value={formData.title}
                onChange={handleInputChange('title')}
                className={errors.title ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* 分類 */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                分類
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={handleInputChange('category')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 內容 */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                內容
              </Label>
              <Textarea
                id="content"
                placeholder="輸入知識庫內容（可選，您也可以稍後上傳文檔）"
                rows={8}
                value={formData.content}
                onChange={handleInputChange('content')}
                className={errors.content ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content}</p>
              )}
              <p className="text-xs text-gray-500">
                如果您暫時沒有內容，可以先創建項目，稍後上傳文檔或編輯內容
              </p>
            </div>
          </div>

          {/* 詳細信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">詳細信息</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 來源 */}
              <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-medium text-gray-700">
                  來源
                </Label>
                <Input
                  id="source"
                  type="text"
                  placeholder="例如：官方文檔、內部資料"
                  value={formData.source}
                  onChange={handleInputChange('source')}
                  disabled={isLoading}
                />
              </div>

              {/* 作者 */}
              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-medium text-gray-700">
                  作者
                </Label>
                <Input
                  id="author"
                  type="text"
                  placeholder="文檔作者姓名"
                  value={formData.author}
                  onChange={handleInputChange('author')}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 標籤 */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                標籤
              </Label>
              <Input
                id="tags"
                type="text"
                placeholder="使用逗號分隔多個標籤，例如：產品, 銷售, 培訓"
                value={formData.tags}
                onChange={handleInputChange('tags')}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                標籤可以幫助您更好地分類和搜索知識庫內容
              </p>
            </div>

            {/* 語言 */}
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                語言
              </Label>
              <select
                id="language"
                value={formData.language}
                onChange={handleInputChange('language')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">簡體中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>創建中...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>創建知識庫項目</span>
                </div>
              )}
            </Button>

            <Link href="/dashboard/knowledge">
              <Button type="button" variant="outline" disabled={isLoading}>
                取消
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}