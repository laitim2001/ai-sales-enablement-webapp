/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫文檔編輯組件 (/components/knowledge/knowledge-document-edit.tsx)================================================================【組件功能】提供知識庫文檔的編輯功能，包括標題、內容、類別、狀態、作者和標籤的修改，支持富文本編輯、自動保存、表單驗證、數據同步和錯誤處理。【主要職責】• 文檔加載 - 從後端API獲取現有文檔數據• 富文本編輯 - 整合Tiptap編輯器支持格式化內容• 自動保存 - 3秒防抖自動保存機制• 表單管理 - 管理所有編輯表單欄位的狀態• 數據驗證 - 對表單輸入進行基本驗證• 數據更新 - 提交修改後的數據到後端• 錯誤處理 - 顯示驗證和API錯誤訊息• 成功回饋 - 顯示成功消息和自動跳轉• 路由導航 - 提供取消和返回功能• 資料格式 - 轉換標籤字符串為陣列格式【新增功能 - Sprint 6 Week 11 Day 2】• 富文本編輯器 - Tiptap編輯器整合 (替代原textarea)• 自動保存 - 3秒防抖自動保存，實時保存狀態顯示• 保存狀態 - idle/saving/saved/error 狀態管理• 手動保存 - 保留手動保存按鈕支持【Props介面】• documentId - number - 要編輯的文檔ID【狀態管理】• document - DocumentData | null - 原始文檔數據• formData - 表單數據物件  - title: string - 文檔標題  - content: string - 文檔內容 (HTML格式)  - category: string - 文檔類別  - status: string - 文檔狀態  - author: string - 作者資訊  - tags: string - 標籤字符串(逗號分隔)• loading - boolean - 數據加載狀態• saveStatus - 'idle' | 'saving' | 'saved' | 'error' - 保存狀態• lastSaved - Date | null - 最後保存時間• error - string | null - 錯誤訊息• successMessage - string | null - 成功訊息【用戶互動】• 富文本編輯 - 使用Tiptap編輯器編輯內容• 表單輸入 - 即時更新表單狀態並清除錯誤• 自動保存 - 3秒後自動保存修改• 手動保存 - 點擊保存按鈕立即保存• 表單提交 - 驗證通過後提交更新数據• 取消操作 - 返回文檔詳情頁面【相關檔案】• /api/knowledge-base/[id] - 文檔獲取和更新API端點• /components/knowledge/rich-text-editor.tsx - 富文本編輯器組件• /components/ui/button.tsx - 按鈕組件• /app/dashboard/knowledge/[id]/edit/page.tsx - 父頁面組件• /app/dashboard/knowledge/[id]/page.tsx - 文檔詳情頁面@updated 2025-10-02 - Sprint 6 Week 11 Day 2
 * @module components/knowledge/knowledge-document-edit
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫文檔編輯組件 (/components/knowledge/knowledge-document-edit.tsx)================================================================【組件功能】提供知識庫文檔的編輯功能，包括標題、內容、類別、狀態、作者和標籤的修改，支持富文本編輯、自動保存、表單驗證、數據同步和錯誤處理。【主要職責】• 文檔加載 - 從後端API獲取現有文檔數據• 富文本編輯 - 整合Tiptap編輯器支持格式化內容• 自動保存 - 3秒防抖自動保存機制• 表單管理 - 管理所有編輯表單欄位的狀態• 數據驗證 - 對表單輸入進行基本驗證• 數據更新 - 提交修改後的數據到後端• 錯誤處理 - 顯示驗證和API錯誤訊息• 成功回饋 - 顯示成功消息和自動跳轉• 路由導航 - 提供取消和返回功能• 資料格式 - 轉換標籤字符串為陣列格式【新增功能 - Sprint 6 Week 11 Day 2】• 富文本編輯器 - Tiptap編輯器整合 (替代原textarea)• 自動保存 - 3秒防抖自動保存，實時保存狀態顯示• 保存狀態 - idle/saving/saved/error 狀態管理• 手動保存 - 保留手動保存按鈕支持【Props介面】• documentId - number - 要編輯的文檔ID【狀態管理】• document - DocumentData | null - 原始文檔數據• formData - 表單數據物件  - title: string - 文檔標題  - content: string - 文檔內容 (HTML格式)  - category: string - 文檔類別  - status: string - 文檔狀態  - author: string - 作者資訊  - tags: string - 標籤字符串(逗號分隔)• loading - boolean - 數據加載狀態• saveStatus - 'idle' | 'saving' | 'saved' | 'error' - 保存狀態• lastSaved - Date | null - 最後保存時間• error - string | null - 錯誤訊息• successMessage - string | null - 成功訊息【用戶互動】• 富文本編輯 - 使用Tiptap編輯器編輯內容• 表單輸入 - 即時更新表單狀態並清除錯誤• 自動保存 - 3秒後自動保存修改• 手動保存 - 點擊保存按鈕立即保存• 表單提交 - 驗證通過後提交更新数據• 取消操作 - 返回文檔詳情頁面【相關檔案】• /api/knowledge-base/[id] - 文檔獲取和更新API端點• /components/knowledge/rich-text-editor.tsx - 富文本編輯器組件• /components/ui/button.tsx - 按鈕組件• /app/dashboard/knowledge/[id]/edit/page.tsx - 父頁面組件• /app/dashboard/knowledge/[id]/page.tsx - 文檔詳情頁面@updated 2025-10-02 - Sprint 6 Week 11 Day 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Loader2, Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/knowledge/rich-text-editor'

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

/**
 * 保存狀態類型
 */
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadDocument()
  }, [documentId])

  /**
   * 自動保存功能 (3秒防抖)
   * 當 title, content, category, status, author, tags 改變時觸發
   */
  useEffect(() => {
    if (!document || saveStatus === 'saving') return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 3000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.title, formData.content, formData.category, formData.status, formData.author, formData.tags])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
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

  /**
   * 自動保存處理
   */
  const handleAutoSave = useCallback(async () => {
    if (!document) return

    try {
      setSaveStatus('saving')

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
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('自動保存失敗')
      }

      setSaveStatus('saved')
      setLastSaved(new Date())

      // 2秒後重置保存狀態
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (err) {
      console.error('自動保存失敗:', err)
      setSaveStatus('error')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
  }, [document, documentId, formData])

  /**
   * 手動保存處理
   */
  const handleManualSave = async () => {
    await handleAutoSave()

    if (saveStatus !== 'error') {
      setSuccessMessage('文檔保存成功！')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  /**
   * 提交並返回 (原有的 handleSubmit)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('標題不能為空')
      return
    }

    try {
      setSaveStatus('saving')
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
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '更新失敗')
      }

      const result = await response.json()
      if (result.success) {
        setSuccessMessage('文檔更新成功！正在跳轉...')
        setSaveStatus('saved')

        // 2秒後跳轉到文檔詳情頁
        setTimeout(() => {
          router.push(`/dashboard/knowledge/${documentId}`)
        }, 2000)
      } else {
        throw new Error(result.error || '更新失敗')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤')
      setSaveStatus('error')
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

  /**
   * 渲染保存狀態指示器
   */
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>保存中...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <span>已保存</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>保存失敗</span>
          </div>
        )
      default:
        return lastSaved ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>上次保存: {lastSaved.toLocaleTimeString()}</span>
          </div>
        ) : null
    }
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
      {/* 保存狀態欄 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
        {renderSaveStatus()}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-2" />
            手動保存
          </Button>
        </div>
      </div>

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

        {/* 內容 - 富文本編輯器 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文檔內容
          </label>
          <RichTextEditor
            content={formData.content}
            onUpdate={(content) => {
              setFormData(prev => ({ ...prev, content }))
              if (error) setError(null)
            }}
            placeholder="開始編寫文檔內容..."
            minHeight="400px"
            maxHeight="600px"
          />
          <p className="text-xs text-gray-500 mt-2">
            支持富文本格式化和Markdown語法。修改內容將觸發重新處理和向量化。
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
            disabled={saveStatus === 'saving'}
          >
            取消
          </Button>

          <Button
            type="submit"
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? '保存中...' : '保存變更'}
          </Button>
        </div>
      </form>
    </div>
  )
}