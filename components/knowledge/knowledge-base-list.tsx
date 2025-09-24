'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DocumentIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  TagIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface KnowledgeBaseItem {
  id: number
  title: string
  category: string
  status: string
  author?: string
  created_at: string
  updated_at: string
  creator: {
    id: number
    first_name: string
    last_name: string
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

interface KnowledgeBaseListResponse {
  success: boolean
  data: KnowledgeBaseItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface KnowledgeBaseListProps {
  filters: {
    page: number
    limit: number
    category?: string
    status?: string
    search?: string
    tags?: string
    sort: string
    order: 'asc' | 'desc'
  }
}

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

const statusLabels: Record<string, string> = {
  ACTIVE: '啟用',
  INACTIVE: '停用',
  ARCHIVED: '封存',
  DELETED: '已刪除',
  DRAFT: '草稿'
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-green-700 bg-green-50 ring-green-600/20',
  INACTIVE: 'text-gray-600 bg-gray-50 ring-gray-500/10',
  ARCHIVED: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
  DELETED: 'text-red-700 bg-red-50 ring-red-600/10',
  DRAFT: 'text-blue-700 bg-blue-50 ring-blue-600/20'
}

export function KnowledgeBaseList({ filters }: KnowledgeBaseListProps) {
  const [data, setData] = useState<KnowledgeBaseListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString())
          }
        })

        const response = await fetch(`/api/knowledge-base?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch knowledge base items')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters])

  if (loading) {
    return (
      <div className="animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">載入失敗</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">沒有找到文檔</h3>
        <p className="mt-1 text-sm text-gray-500">
          嘗試調整搜索條件或上傳新的文檔
        </p>
        <div className="mt-6">
          <Link href="/dashboard/knowledge/upload">
            <Button>
              <DocumentIcon className="h-4 w-4 mr-2" />
              上傳文檔
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 文檔列表 */}
      <div className="space-y-4">
        {data.data.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* 文檔信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {item.title}
                  </h3>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[item.status] || statusColors.ACTIVE}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>

                {/* 元數據 */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <TagIcon className="h-4 w-4" />
                    {categoryLabels[item.category] || item.category}
                  </div>

                  {item.creator && (
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {item.creator.first_name} {item.creator.last_name}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {formatDistanceToNow(new Date(item.updated_at), {
                      addSuffix: true,
                      locale: zhTW
                    })}
                  </div>

                  {item._count.chunks > 0 && (
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {item._count.chunks} 個片段
                    </div>
                  )}
                </div>

                {/* 標籤 */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{item.tags.length - 3} 個標籤
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-center gap-2 ml-4">
                <Link href={`/dashboard/knowledge/${item.id}`}>
                  <Button variant="outline" size="sm">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                </Link>
                <Link href={`/dashboard/knowledge/${item.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    編輯
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  刪除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分頁 */}
      {data.pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              disabled={data.pagination.page === 1}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              disabled={data.pagination.page === data.pagination.pages}
            >
              下一頁
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                顯示第 {((data.pagination.page - 1) * data.pagination.limit) + 1} 到{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} 項，
                共 {data.pagination.total} 項
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.pagination.page === 1}
              >
                上一頁
              </Button>
              <span className="text-sm text-gray-500">
                第 {data.pagination.page} 頁，共 {data.pagination.pages} 頁
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.pagination.page === data.pagination.pages}
              >
                下一頁
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}