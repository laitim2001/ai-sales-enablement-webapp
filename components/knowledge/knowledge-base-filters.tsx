'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface KnowledgeBaseFiltersProps {
  initialFilters: {
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

const categoryOptions = [
  { value: '', label: '所有類別' },
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
  { value: '', label: '所有狀態' },
  { value: 'ACTIVE', label: '啟用' },
  { value: 'INACTIVE', label: '停用' },
  { value: 'ARCHIVED', label: '封存' },
  { value: 'DRAFT', label: '草稿' }
]

const sortOptions = [
  { value: 'updated_at', label: '更新時間' },
  { value: 'created_at', label: '建立時間' },
  { value: 'title', label: '標題' }
]

export function KnowledgeBaseFilters({ initialFilters }: KnowledgeBaseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(initialFilters.search || '')
  const [category, setCategory] = useState(initialFilters.category || '')
  const [status, setStatus] = useState(initialFilters.status || '')
  const [tags, setTags] = useState(initialFilters.tags || '')
  const [sort, setSort] = useState(initialFilters.sort)
  const [order, setOrder] = useState(initialFilters.order)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 檢查是否有高級篩選器激活
  useEffect(() => {
    const hasAdvancedFilters = Boolean(category || status || tags || sort !== 'updated_at' || order !== 'desc')
    setShowAdvanced(hasAdvancedFilters)
  }, [category, status, tags, sort, order])

  const updateUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)

    // 更新參數
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // 重置到第一頁
    params.set('page', '1')

    // 導航到新的 URL
    router.push(`/dashboard/knowledge?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl({ search: search.trim() || undefined })
  }

  const handleFilterChange = (key: string, value: string) => {
    updateUrl({ [key]: value || undefined })
  }

  const clearAllFilters = () => {
    setSearch('')
    setCategory('')
    setStatus('')
    setTags('')
    setSort('updated_at')
    setOrder('desc')
    router.push('/dashboard/knowledge')
  }

  const hasActiveFilters = search || category || status || tags || sort !== 'updated_at' || order !== 'desc'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* 搜索欄 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文檔標題、內容或標籤..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button type="submit">
          搜索
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          篩選器
        </Button>
      </form>

      {/* 高級篩選器 */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* 類別篩選 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              類別
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                handleFilterChange('category', e.target.value)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 狀態篩選 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              狀態
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                handleFilterChange('status', e.target.value)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 排序 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排序依據
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                handleFilterChange('sort', e.target.value)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 排序方向 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排序方向
            </label>
            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value as 'asc' | 'desc')
                handleFilterChange('order', e.target.value)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">由新到舊</option>
              <option value="asc">由舊到新</option>
            </select>
          </div>

          {/* 標籤輸入 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標籤 (逗號分隔)
            </label>
            <input
              type="text"
              placeholder="例如：產品,規格,重要"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onBlur={() => handleFilterChange('tags', tags)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 清除篩選器 */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-full"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                清除所有
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 當前篩選器標籤 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {search && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              搜索: {search}
              <button
                onClick={() => {
                  setSearch('')
                  updateUrl({ search: undefined })
                }}
                className="ml-1 h-3 w-3 flex items-center justify-center"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              類別: {categoryOptions.find(c => c.value === category)?.label}
              <button
                onClick={() => {
                  setCategory('')
                  handleFilterChange('category', '')
                }}
                className="ml-1 h-3 w-3 flex items-center justify-center"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {status && (
            <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
              狀態: {statusOptions.find(s => s.value === status)?.label}
              <button
                onClick={() => {
                  setStatus('')
                  handleFilterChange('status', '')
                }}
                className="ml-1 h-3 w-3 flex items-center justify-center"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {tags && (
            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
              標籤: {tags}
              <button
                onClick={() => {
                  setTags('')
                  handleFilterChange('tags', '')
                }}
                className="ml-1 h-3 w-3 flex items-center justify-center"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}