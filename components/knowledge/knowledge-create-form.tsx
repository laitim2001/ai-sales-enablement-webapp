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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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