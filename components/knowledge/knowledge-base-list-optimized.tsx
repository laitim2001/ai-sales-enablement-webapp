'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useVirtualizer } from '@tanstack/react-virtual'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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

// 優化的單個項目組件 - 使用 memo 避免不必要的重新渲染
const KnowledgeBaseItem = memo(({
  item,
  onDelete,
  style
}: {
  item: KnowledgeBaseItem
  onDelete: (id: number) => void
  style?: React.CSSProperties
}) => {
  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  // 預計算昂貴的操作
  const formattedDate = useMemo(() => {
    return formatDistanceToNow(new Date(item.updated_at), {
      addSuffix: true,
      locale: zhTW
    })
  }, [item.updated_at])

  const displayTags = useMemo(() => {
    return item.tags.slice(0, 3)
  }, [item.tags])

  const extraTagsCount = useMemo(() => {
    return Math.max(0, item.tags.length - 3)
  }, [item.tags.length])

  return (
    <div
      style={style}
      className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow bg-white"
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
              {formattedDate}
            </div>

            {item._count.chunks > 0 && (
              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                {item._count.chunks} 個片段
              </div>
            )}
          </div>

          {/* 標籤 */}
          {displayTags.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              {displayTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {extraTagsCount > 0 && (
                <span className="text-xs text-gray-500">
                  +{extraTagsCount} 個標籤
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
            onClick={handleDelete}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            刪除
          </Button>
        </div>
      </div>
    </div>
  )
})

KnowledgeBaseItem.displayName = 'KnowledgeBaseItem'

// 加載骨架組件
const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-6">
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
))

LoadingSkeleton.displayName = 'LoadingSkeleton'

// 分頁組件
const Pagination = memo(({ pagination, onPageChange }: {
  pagination: KnowledgeBaseListResponse['pagination']
  onPageChange: (page: number) => void
}) => {
  const handlePrevious = useCallback(() => {
    onPageChange(pagination.page - 1)
  }, [pagination.page, onPageChange])

  const handleNext = useCallback(() => {
    onPageChange(pagination.page + 1)
  }, [pagination.page, onPageChange])

  if (pagination.pages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          disabled={pagination.page === 1}
          onClick={handlePrevious}
        >
          上一頁
        </Button>
        <Button
          variant="outline"
          disabled={pagination.page === pagination.pages}
          onClick={handleNext}
        >
          下一頁
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            顯示第 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} 項，
            共 {pagination.total} 項
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={handlePrevious}
          >
            上一頁
          </Button>
          <span className="text-sm text-gray-500">
            第 {pagination.page} 頁，共 {pagination.pages} 頁
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={handleNext}
          >
            下一頁
          </Button>
        </div>
      </div>
    </div>
  )
})

Pagination.displayName = 'Pagination'

// 主組件
export function KnowledgeBaseListOptimized({ filters }: KnowledgeBaseListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // 使用 React Query 進行數據管理和緩存
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge-base', filters],
    queryFn: async (): Promise<KnowledgeBaseListResponse> => {
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

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5分鐘內數據被認為是新鮮的
    gcTime: 10 * 60 * 1000, // 10分鐘後垃圾回收
    refetchOnWindowFocus: false, // 避免不必要的重新請求
  })

  // 虛擬化設置（用於大量數據）
  const parentRef = useState<HTMLDivElement | null>(null)[0]
  const virtualizer = useVirtualizer({
    count: data?.data.length || 0,
    getScrollElement: () => parentRef,
    estimateSize: () => 200, // 估計每項高度
    overscan: 5, // 預渲染項目數
  })

  // 優化的分頁處理
  const handlePageChange = useCallback((newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('page', newPage.toString())
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`/dashboard/knowledge${query}`)
  }, [router, searchParams])

  // 優化的刪除處理
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('確定要刪除這個文檔嗎？此操作無法撤銷。')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('刪除失敗')
      }

      // 使用 React Query 的 invalidateQueries 重新獲取數據
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除失敗')
    }
  }, [queryClient])

  // 錯誤狀態
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">載入失敗</div>
        <div className="text-sm text-gray-500">{error.message}</div>
        <Button onClick={() => refetch()} className="mt-4">
          重試
        </Button>
      </div>
    )
  }

  // 加載狀態
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // 空狀態
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

  // 決定是否使用虛擬化（數據量大時）
  const useVirtualization = data.data.length > 50

  return (
    <div className="space-y-4">
      {/* 文檔列表 */}
      <div className="space-y-4">
        {useVirtualization ? (
          // 虛擬化渲染（大量數據）
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => (
                <KnowledgeBaseItem
                  key={data.data[virtualItem.index].id}
                  item={data.data[virtualItem.index]}
                  onDelete={handleDelete}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          // 普通渲染（少量數據）
          data.data.map((item) => (
            <KnowledgeBaseItem
              key={item.id}
              item={item}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 分頁 */}
      <Pagination pagination={data.pagination} onPageChange={handlePageChange} />
    </div>
  )
}