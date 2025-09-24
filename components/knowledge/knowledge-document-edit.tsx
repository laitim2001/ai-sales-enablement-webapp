'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface DocumentData {
  id: number
  title: string
  content?: string
  category: string
  status: string
  source?: string
  author?: string
  language?: string
  tags: Array<{
    id: number
    name: string
    color?: string
  }>
}

interface KnowledgeDocumentEditProps {
  documentId: number
}

const categoryOptions = [
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

const statusOptions = [
  { value: 'ACTIVE', label: '啟用' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'ARCHIVED', label: '歸檔' }
]

export function KnowledgeDocumentEdit({ documentId }: KnowledgeDocumentEditProps) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    status: 'ACTIVE',
    author: '',
    tags: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('文檔不存在或已被刪除')
        }
        throw new Error('載入文檔失敗')
      }

      const result = await response.json()
      if (result.success) {
        const doc = result.data
        setDocument(doc)
        setFormData({
          title: doc.title || '',
          content: doc.content || '',
          category: doc.category || 'GENERAL',
          status: doc.status || 'ACTIVE',
          author: doc.author || '',
          tags: doc.tags.map((tag: any) => tag.name).join(', ')
        })
      } else {
        throw new Error(result.error || '載入文檔失敗')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('標題不能為空')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim() || undefined,
        category: formData.category,
        status: formData.status,
        author: formData.author.trim() || undefined,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
      }

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '更新失敗')
      }

      const result = await response.json()
      if (result.success) {
        setSuccessMessage('文檔更新成功！')

        // 3秒後跳轉到文檔詳情頁
        setTimeout(() => {
          router.push(`/dashboard/knowledge/${documentId}`)
        }, 2000)
      } else {
        throw new Error(result.error || '更新失敗')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // 清除錯誤信息
    if (error) setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDocument} variant="outline">
            重試
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 成功訊息 */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
              <p className="text-xs text-green-600 mt-1">正在跳轉到文檔詳情頁...</p>
            </div>
          </div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 編輯表單 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 標題 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            文檔標題 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="輸入文檔標題"
              required
            />
          </div>
        </div>

        {/* 內容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            文檔內容
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="輸入或貼上文檔內容"
          />
          <p className="text-xs text-gray-500 mt-1">
            修改內容將觸發重新處理和向量化
          </p>
        </div>

        {/* 屬性設置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 類別 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              文檔類別
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 狀態 */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              文檔狀態
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 作者和標籤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 作者 */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              作者
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="文檔作者"
            />
          </div>

          {/* 標籤 */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              標籤
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="以逗號分隔多個標籤"
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：產品規格, 重要, 技術文檔
            </p>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={() => router.push(`/dashboard/knowledge/${documentId}`)}
            variant="outline"
            disabled={saving}
          >
            取消
          </Button>

          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? '保存中...' : '保存變更'}
          </Button>
        </div>
      </form>
    </div>
  )
}