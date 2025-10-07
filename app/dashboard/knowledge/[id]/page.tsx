/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫詳情頁面 (app/dashboard/knowledge/[id]/page.tsx)================================================================【檔案功能】提供知識庫文檔的詳細資訊查看界面，展示文檔完整內容、元數據、版本信息、標籤分類等全方位資訊，支援快速編輯、刪除和內容管理功能。【主要職責】• 文檔詳情展示 - 顯示文檔標題、內容、分類、狀態等基本資訊• 元數據管理 - 展示創建者、創建時間、更新時間等元數據• 標籤系統 - 顯示文檔關聯的標籤和分類信息• 版本控制 - 展示文檔版本號和歷史記錄• 快速操作 - 提供編輯、刪除、返回等操作按鈕• 內容預覽 - 渲染文檔內容的完整預覽【頁面結構】• 導航區域 - 返回按鈕和麵包屑導航• 標題區域 - 文檔標題、狀態標籤、操作按鈕• 元數據卡片 - 分類、創建者、時間、版本、片段數等信息• 標籤卡片 - 文檔關聯的所有標籤展示• 內容卡片 - 文檔完整內容的渲染展示【功能特色】• 響應式設計 - 適配不同屏幕尺寸的最優顯示效果• 即時載入 - 快速獲取並展示文檔詳細資訊• 狀態管理 - 優雅處理載入、錯誤和空狀態• 時間格式化 - 使用相對時間顯示更新信息• 權限控制 - 基於角色的文檔訪問和操作權限【用戶流程】1. 從知識庫列表點擊查看按鈕進入詳情頁2. 檢視文檔完整內容和元數據信息3. 瀏覽文檔關聯的標籤和分類4. 執行編輯或刪除操作（需要權限）5. 返回知識庫列表繼續瀏覽【路由參數】• params.id: 知識庫文檔ID，用於載入特定文檔的詳細資料【相關檔案】• components/knowledge/knowledge-base-list-optimized.tsx - 知識庫列表組件• app/api/knowledge-base/[id]/route.ts - 知識庫詳情API• app/dashboard/knowledge/[id]/edit/page.tsx - 知識庫編輯頁面• app/dashboard/knowledge/page.tsx - 知識庫列表頁面【開發注意】• 數據載入：處理文檔不存在和權限不足的情況• 內容渲染：安全渲染用戶提交的文檔內容• 權限控制：基於角色的編輯和刪除權限檢查• 錯誤邊界：優雅處理API調用和組件載入錯誤• SEO優化：提供適當的頁面標題和元數據
 * @module app/dashboard/knowledge/[id]/page
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫詳情頁面 (app/dashboard/knowledge/[id]/page.tsx)================================================================【檔案功能】提供知識庫文檔的詳細資訊查看界面，展示文檔完整內容、元數據、版本信息、標籤分類等全方位資訊，支援快速編輯、刪除和內容管理功能。【主要職責】• 文檔詳情展示 - 顯示文檔標題、內容、分類、狀態等基本資訊• 元數據管理 - 展示創建者、創建時間、更新時間等元數據• 標籤系統 - 顯示文檔關聯的標籤和分類信息• 版本控制 - 展示文檔版本號和歷史記錄• 快速操作 - 提供編輯、刪除、返回等操作按鈕• 內容預覽 - 渲染文檔內容的完整預覽【頁面結構】• 導航區域 - 返回按鈕和麵包屑導航• 標題區域 - 文檔標題、狀態標籤、操作按鈕• 元數據卡片 - 分類、創建者、時間、版本、片段數等信息• 標籤卡片 - 文檔關聯的所有標籤展示• 內容卡片 - 文檔完整內容的渲染展示【功能特色】• 響應式設計 - 適配不同屏幕尺寸的最優顯示效果• 即時載入 - 快速獲取並展示文檔詳細資訊• 狀態管理 - 優雅處理載入、錯誤和空狀態• 時間格式化 - 使用相對時間顯示更新信息• 權限控制 - 基於角色的文檔訪問和操作權限【用戶流程】1. 從知識庫列表點擊查看按鈕進入詳情頁2. 檢視文檔完整內容和元數據信息3. 瀏覽文檔關聯的標籤和分類4. 執行編輯或刪除操作（需要權限）5. 返回知識庫列表繼續瀏覽【路由參數】• params.id: 知識庫文檔ID，用於載入特定文檔的詳細資料【相關檔案】• components/knowledge/knowledge-base-list-optimized.tsx - 知識庫列表組件• app/api/knowledge-base/[id]/route.ts - 知識庫詳情API• app/dashboard/knowledge/[id]/edit/page.tsx - 知識庫編輯頁面• app/dashboard/knowledge/page.tsx - 知識庫列表頁面【開發注意】• 數據載入：處理文檔不存在和權限不足的情況• 內容渲染：安全渲染用戶提交的文檔內容• 權限控制：基於角色的編輯和刪除權限檢查• 錯誤邊界：優雅處理API調用和組件載入錯誤• SEO優化：提供適當的頁面標題和元數據
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Tag,
  Hash,
  Clock,
  Folder
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 知識庫文檔詳情介面
interface KnowledgeBaseDetail {
  id: number
  title: string
  content: string
  category: string
  status: string
  version: number
  created_at: string
  updated_at: string
  creator: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  tags: Array<{
    id: number
    name: string
    color: string
  }>
  _count: {
    chunks: number
  }
}

// API響應介面
interface ApiResponse {
  success: boolean
  data: KnowledgeBaseDetail
  message?: string
}

// 分類標籤映射
const categoryLabels: Record<string, string> = {
  GENERAL: '一般',
  PRODUCT_SPEC: '產品規格',
  SALES_MATERIAL: '銷售資料',
  TECHNICAL_DOC: '技術文檔',
  LEGAL_DOC: '法律文件',
  TRAINING: '培訓資料',
  FAQ: '常見問題',
  CASE_STUDY: '案例研究',
  WHITE_PAPER: '白皮書',
  PRESENTATION: '簡報',
  COMPETITOR: '競爭分析',
  INDUSTRY_NEWS: '行業新聞',
  INTERNAL: '內部文檔'
}

// 狀態標籤映射
const statusLabels: Record<string, string> = {
  ACTIVE: '啟用',
  INACTIVE: '停用',
  ARCHIVED: '封存',
  DELETED: '已刪除',
  DRAFT: '草稿'
}

// 狀態顏色映射
const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 ring-green-600/20',
  INACTIVE: 'bg-gray-100 text-gray-600 ring-gray-500/10',
  ARCHIVED: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20',
  DELETED: 'bg-red-100 text-red-700 ring-red-600/10',
  DRAFT: 'bg-blue-100 text-blue-700 ring-blue-600/20'
}

export default function KnowledgeBaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  // 狀態管理
  const [document, setDocument] = useState<KnowledgeBaseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 載入文檔資料
  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          throw new Error('未找到授權令牌，請重新登入')
        }

        // 驗證文檔ID
        if (!documentId || documentId === 'undefined') {
          throw new Error('無效的文檔ID')
        }

        const response = await fetch(`/api/knowledge-base/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('找不到指定的文檔')
          } else if (response.status === 401) {
            throw new Error('未授權訪問，請重新登入')
          } else {
            throw new Error('載入文檔失敗')
          }
        }

        const result: ApiResponse = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.message || '載入文檔失敗')
        }

        setDocument(result.data)

      } catch (err) {
        console.error('載入文檔資料失敗:', err)
        setError(err instanceof Error ? err.message : '載入文檔時發生未知錯誤')
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [documentId])

  // 刪除文檔處理
  const handleDelete = async () => {
    if (!document) return

    const confirmed = window.confirm(
      `確定要刪除文檔「${document.title}」嗎？此操作無法撤銷。`
    )

    if (!confirmed) return

    setIsDeleting(true)

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('未找到授權令牌，請重新登入')
      }

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('刪除文檔失敗')
      }

      // 刪除成功，返回列表頁
      router.push('/dashboard/knowledge')

    } catch (err) {
      console.error('刪除文檔失敗:', err)
      alert(err instanceof Error ? err.message : '刪除文檔時發生錯誤')
    } finally {
      setIsDeleting(false)
    }
  }

  // 格式化日期時間
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化相對時間
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhTW
    })
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">載入文檔資料中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 錯誤狀態
  if (error || !document) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              載入文檔失敗
            </h3>
            <p className="text-gray-600 mb-4">
              {error || '找不到指定的文檔'}
            </p>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/knowledge')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
              <Button onClick={() => window.location.reload()}>
                重新載入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColor = statusColors[document.status] || statusColors.ACTIVE
  const statusLabel = statusLabels[document.status] || document.status
  const categoryLabel = categoryLabels[document.category] || document.category

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* 導航和標題 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/dashboard/knowledge')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回知識庫列表
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-8 w-8 text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900">
                {document.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusColor} ring-1 ring-inset`}>
                {statusLabel}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Hash className="h-3 w-3 mr-1" />
                版本 {document.version}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/knowledge/${documentId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  刪除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 元數據信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 分類 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">分類</span>
            </div>
            <div className="text-lg font-medium text-gray-900">
              {categoryLabel}
            </div>
          </CardContent>
        </Card>

        {/* 創建者 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">創建者</span>
            </div>
            <div className="text-lg font-medium text-gray-900">
              {document.creator.first_name} {document.creator.last_name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {document.creator.email}
            </div>
          </CardContent>
        </Card>

        {/* 創建時間 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">創建時間</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(document.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* 更新時間 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">最後更新</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatRelativeTime(document.updated_at)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(document.updated_at)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 標籤卡片 */}
      {document.tags && document.tags.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              標籤
            </CardTitle>
            <CardDescription>
              此文檔關聯的標籤分類
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="px-3 py-1"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 統計信息卡片 */}
      {document._count && document._count.chunks > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">文檔片段數量</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {document._count.chunks}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              此文檔已被分割為 {document._count.chunks} 個片段用於向量搜索
            </p>
          </CardContent>
        </Card>
      )}

      {/* 內容卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            文檔內容
          </CardTitle>
          <CardDescription>
            完整的文檔內容預覽
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap bg-gray-50 p-6 rounded-lg border border-gray-200">
              {document.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部操作區 */}
      <div className="mt-6 flex items-center justify-between pt-6 border-t">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/knowledge')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/knowledge/${documentId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯文檔
          </Button>
        </div>
      </div>
    </div>
  )
}
