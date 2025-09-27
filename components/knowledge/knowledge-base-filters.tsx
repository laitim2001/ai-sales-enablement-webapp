/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫篩選器組件 (/components/knowledge/knowledge-base-filters.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 提供知識庫文檔的多維度篩選和搜索功能，包括搜索框、類別篩選、狀態篩選、
 * 標籤篩選、排序功能等，並支持URL同步和高級篩選器展開收起。
 *
 * 【主要職責】
 * • 搜索功能 - 支持文檔標題、內容、標籤的全文搜索
 * • 類別篩選 - 根據文檔類別(PRODUCT_SPEC、SALES_MATERIAL等)篩選
 * • 狀態篩選 - 根據文檔狀態(ACTIVE、INACTIVE、ARCHIVED等)篩選
 * • 排序控制 - 支持按更新時間、創建時間、標題等欄位排序
 * • 標籤篩選 - 支持多標籤篩選功能
 * • URL同步 - 篩選條件與URL參數同步，支持書籤和分享
 * • 狀態管理 - 管理當前激活的篩選條件和顯示狀態
 * • 清除功能 - 提供一鍵清除所有篩選條件的功能
 *
 * 【Props介面】
 * • initialFilters - KnowledgeBaseFiltersProps - 初始篩選條件
 *   - page: number - 當前頁碼
 *   - limit: number - 每頁顯示數量
 *   - category?: string - 可選的類別篩選
 *   - status?: string - 可選的狀態篩選
 *   - search?: string - 可選的搜索關鍵字
 *   - tags?: string - 可選的標籤篩選
 *   - sort: string - 排序欄位
 *   - order: 'asc' | 'desc' - 排序方向
 *
 * 【狀態管理】
 * • search - 搜索關鍵字狀態
 * • category - 選中的類別篩選
 * • status - 選中的狀態篩選
 * • tags - 標籤篩選字符串
 * • sort - 當前排序欄位
 * • order - 當前排序方向
 * • showAdvanced - 高級篩選器展開狀態
 *
 * 【用戶互動】
 * • 搜索提交 - 表單提交觸發搜索
 * • 篩選器變更 - 下拉選單變更即時更新URL
 * • 高級篩選器切換 - 顯示/隱藏高級篩選選項
 * • 標籤操作 - 顯示當前篩選標籤並支持單獨移除
 * • 清除操作 - 一鍵清除所有篩選條件
 *
 * 【渲染邏輯】
 * • 基礎搜索框 - 始終顯示，支持即時輸入
 * • 高級篩選器 - 根據showAdvanced狀態條件顯示
 * • 篩選標籤 - 有激活篩選條件時顯示標籤列表
 * • 清除按鈕 - 有激活篩選條件時顯示
 *
 * 【Hook使用】
 * • useRouter - Next.js路由器，用於URL導航
 * • useSearchParams - 獲取當前URL查詢參數
 * • useState - 管理各種篩選條件的本地狀態
 * • useEffect - 檢測高級篩選器激活狀態
 *
 * 【相關檔案】
 * • /components/knowledge/knowledge-base-list.tsx - 接收篩選條件的列表組件
 * • /app/dashboard/knowledge/page.tsx - 父頁面組件
 * • /api/knowledge-base - 後端API端點
 *
 * 【開發注意】
 * • URL參數同步 - 所有篩選變更都會更新URL並重置到第一頁
 * • 性能優化 - 使用即時篩選，避免不必要的API請求
 * • 狀態同步 - 組件狀態與URL參數保持同步
 * • 用戶體驗 - 提供視覺化的篩選標籤和清除功能
 * • 響應式設計 - 在不同螢幕尺寸下適當調整佈局
 */

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