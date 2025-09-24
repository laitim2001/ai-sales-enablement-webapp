'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
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
  file_size?: number
  mime_type?: string
  version: number
  processing_status: string
  processing_error?: string
  created_at: string
  updated_at: string
  creator?: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  updater?: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  tags: Array<{
    id: number
    name: string
    color?: string
    description?: string
  }>
  chunks: Array<{
    id: number
    chunk_index: number
    content: string
    token_count?: number
    start_pos?: number
    end_pos?: number
  }>
  processing_tasks: Array<{
    id: number
    task_type: string
    status: string
    progress: number
    error_message?: string
    started_at?: string
    completed_at?: string
  }>
  _count: {
    chunks: number
  }
}

interface KnowledgeDocumentViewProps {
  documentId: number
}

const categoryLabels: Record<string, string> = {
  'GENERAL': '一般',
  'PRODUCT_SPEC': '產品規格',
  'SALES_MATERIAL': '銷售資料',
  'TECHNICAL_DOC': '技術文檔',
  'LEGAL_DOC': '法律文件',
  'TRAINING': '培訓資料',
  'FAQ': '常見問題',
  'CASE_STUDY': '案例研究',
  'WHITE_PAPER': '白皮書',
  'PRESENTATION': '簡報',
  'COMPETITOR': '競爭分析',
  'INDUSTRY_NEWS': '行業新聞',
  'INTERNAL': '內部文檔'
}

const statusLabels: Record<string, string> = {
  'ACTIVE': '啟用',
  'DRAFT': '草稿',
  'ARCHIVED': '歸檔',
  'DELETED': '已刪除'
}

const processingStatusLabels: Record<string, string> = {
  'PENDING': '待處理',
  'IN_PROGRESS': '處理中',
  'COMPLETED': '已完成',
  'FAILED': '失敗'
}

const statusColors: Record<string, string> = {
  'ACTIVE': 'text-green-700 bg-green-50 border-green-200',
  'DRAFT': 'text-blue-700 bg-blue-50 border-blue-200',
  'ARCHIVED': 'text-gray-700 bg-gray-50 border-gray-200',
  'DELETED': 'text-red-700 bg-red-50 border-red-200'
}

const processingStatusColors: Record<string, string> = {
  'PENDING': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'IN_PROGRESS': 'text-blue-700 bg-blue-50 border-blue-200',
  'COMPLETED': 'text-green-700 bg-green-50 border-green-200',
  'FAILED': 'text-red-700 bg-red-50 border-red-200'
}

export function KnowledgeDocumentView({ documentId }: KnowledgeDocumentViewProps) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'chunks' | 'processing'>('content')
  const [deleting, setDeleting] = useState(false)
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
        setDocument(result.data)
      } else {
        throw new Error(result.error || '載入文檔失敗')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!document || !confirm(`確定要刪除文檔「${document.title}」嗎？`)) {
      return
    }

    try {
      setDeleting(true)

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('刪除失敗')
      }

      const result = await response.json()
      if (result.success) {
        router.push('/dashboard/knowledge')
      } else {
        throw new Error(result.error || '刪除失敗')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除失敗')
    } finally {
      setDeleting(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW')
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

  if (error || !document) {
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
      {/* 文檔標題和操作 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <DocumentTextIcon className="h-8 w-8 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span>
                  {document.creator ?
                    `${document.creator.first_name} ${document.creator.last_name}` :
                    document.author || '未知'
                  }
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(document.created_at)}</span>
              </div>

              {document.file_size && (
                <div>
                  <span>{formatFileSize(document.file_size)}</span>
                </div>
              )}

              <div>
                <span>版本 {document.version}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => router.push(`/dashboard/knowledge/${documentId}/edit`)}
              variant="outline"
              size="sm"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              編輯
            </Button>
            <Button variant="outline" size="sm">
              <ShareIcon className="h-4 w-4 mr-1" />
              分享
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              {deleting ? '刪除中...' : '刪除'}
            </Button>
          </div>
        </div>

        {/* 狀態和標籤 */}
        <div className="flex items-center space-x-4 mt-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[document.status] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
            {statusLabels[document.status] || document.status}
          </span>

          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${processingStatusColors[document.processing_status] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
            {document.processing_status === 'IN_PROGRESS' && <ClockIcon className="h-3 w-3 mr-1" />}
            {document.processing_status === 'COMPLETED' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
            {document.processing_status === 'FAILED' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
            {processingStatusLabels[document.processing_status] || document.processing_status}
          </span>

          <span className="text-xs text-gray-600 px-2.5 py-0.5 bg-gray-100 rounded-full">
            {categoryLabels[document.category] || document.category}
          </span>

          {document.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              {document.tags.map(tag => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                    color: tag.color || '#374151'
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 處理錯誤顯示 */}
        {document.processing_error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">處理錯誤</h3>
                <p className="text-sm text-red-700 mt-1">{document.processing_error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 選項卡導航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            內容預覽
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chunks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            內容分塊 ({document._count.chunks})
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'processing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            處理記錄 ({document.processing_tasks.length})
          </button>
        </nav>
      </div>

      {/* 選項卡內容 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {activeTab === 'content' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">文檔內容</h3>
            {document.content ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {document.content}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">暫無內容預覽</p>
            )}
          </div>
        )}

        {activeTab === 'chunks' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">內容分塊</h3>
            {document.chunks.length > 0 ? (
              <div className="space-y-4">
                {document.chunks.map((chunk) => (
                  <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        分塊 #{chunk.chunk_index + 1}
                      </span>
                      <div className="text-xs text-gray-500 space-x-4">
                        {chunk.token_count && <span>Tokens: {chunk.token_count}</span>}
                        {chunk.start_pos !== null && chunk.end_pos !== null && (
                          <span>位置: {chunk.start_pos}-{chunk.end_pos}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暫無分塊數據</p>
            )}
          </div>
        )}

        {activeTab === 'processing' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">處理記錄</h3>
            {document.processing_tasks.length > 0 ? (
              <div className="space-y-4">
                {document.processing_tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {task.task_type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${processingStatusColors[task.status] || 'text-gray-700 bg-gray-50'}`}>
                          {processingStatusLabels[task.status] || task.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        進度: {Math.round(task.progress * 100)}%
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress * 100}%` }}
                      ></div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      {task.started_at && (
                        <div>開始時間: {formatDate(task.started_at)}</div>
                      )}
                      {task.completed_at && (
                        <div>完成時間: {formatDate(task.completed_at)}</div>
                      )}
                      {task.error_message && (
                        <div className="text-red-600">錯誤: {task.error_message}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暫無處理記錄</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}