/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫管理儀表板組件
 * ================================================================
 *
 * 【組件功能】
 * 提供企業級知識庫管理功能的統一控制面板，包括批量操作、
 * 統計視圖、高級篩選等核心管理能力。
 *
 * 【主要職責】
 * • 批量操作 - 多選、批量刪除、批量移動、批量標籤更新、批量狀態變更
 * • 統計視圖 - 分類分布、狀態統計、使用頻率、作者活動分析
 * • 快速篩選 - 高級篩選面板、保存條件、快速預設、自定義視圖
 * • 數據可視化 - 圖表展示、趨勢分析、活動監控
 * • 管理效率 - 快捷鍵支持、批量確認、操作歷史
 *
 * @created 2025-10-07
 * @sprint Sprint 6 - 知識庫管理UI完善
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/knowledge/analytics/StatsCard'
import {
  DocumentIcon,
  TrashIcon,
  FolderIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  BookmarkIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { cn } from '@/lib/utils'

/**
 * 知識庫項目數據結構
 */
interface KnowledgeBaseItem {
  id: number
  title: string
  category: string
  status: string
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

/**
 * 統計數據結構
 */
interface DashboardStats {
  totalDocuments: number
  activeDocuments: number
  archivedDocuments: number
  draftDocuments: number
  categoryDistribution: Record<string, number>
  statusDistribution: Record<string, number>
  recentActivity: Array<{
    date: string
    count: number
  }>
  topAuthors: Array<{
    authorId: number
    authorName: string
    documentCount: number
  }>
}

/**
 * 篩選條件結構
 */
interface FilterCondition {
  id: string
  name: string
  filters: {
    category?: string[]
    status?: string[]
    tags?: string[]
    author?: number[]
    dateRange?: {
      start: string
      end: string
    }
  }
}

/**
 * 批量操作類型
 */
type BatchOperation = 'delete' | 'move' | 'tag' | 'status' | 'archive'

/**
 * 組件Props
 */
interface KnowledgeManagementDashboardProps {
  /** 是否顯示統計視圖 */
  showStats?: boolean
  /** 是否顯示批量操作 */
  showBatchOperations?: boolean
  /** 是否顯示快速篩選 */
  showQuickFilters?: boolean
  /** 自定義類名 */
  className?: string
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
  INTERNAL: '內部文檔',
}

// 狀態標籤映射
const statusLabels: Record<string, string> = {
  ACTIVE: '啟用',
  INACTIVE: '停用',
  ARCHIVED: '封存',
  DELETED: '已刪除',
  DRAFT: '草稿',
}

// 狀態顏色映射
const statusColors: Record<string, string> = {
  ACTIVE: 'text-green-700 bg-green-50',
  INACTIVE: 'text-gray-600 bg-gray-50',
  ARCHIVED: 'text-yellow-700 bg-yellow-50',
  DELETED: 'text-red-700 bg-red-50',
  DRAFT: 'text-blue-700 bg-blue-50',
}

// 快速篩選預設
const quickFilterPresets: FilterCondition[] = [
  {
    id: 'my-documents',
    name: '我的文檔',
    filters: { status: ['ACTIVE', 'DRAFT'] },
  },
  {
    id: 'recent',
    name: '最近更新',
    filters: {},
  },
  {
    id: 'pending-review',
    name: '待審核',
    filters: { status: ['DRAFT'] },
  },
  {
    id: 'archived',
    name: '已封存',
    filters: { status: ['ARCHIVED'] },
  },
]

/**
 * 知識庫管理儀表板主組件
 */
export const KnowledgeManagementDashboard: React.FC<KnowledgeManagementDashboardProps> = ({
  showStats = true,
  showBatchOperations = true,
  showQuickFilters = true,
  className,
}) => {
  // === 狀態管理 ===
  const [documents, setDocuments] = useState<KnowledgeBaseItem[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [currentFilter, setCurrentFilter] = useState<FilterCondition | null>(null)
  const [savedFilters, setSavedFilters] = useState<FilterCondition[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [batchOperationMode, setBatchOperationMode] = useState(false)

  /**
   * 載入統計數據
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/knowledge-base/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [])

  /**
   * 載入文檔列表
   */
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentFilter?.filters) {
        Object.entries(currentFilter.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else if (typeof value === 'object') {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, String(value))
          }
        })
      }

      const response = await fetch(`/api/knowledge-base?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setDocuments(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }, [currentFilter])

  /**
   * 初始化載入
   */
  useEffect(() => {
    if (showStats) {
      loadStats()
    }
    loadDocuments()
  }, [showStats, loadStats, loadDocuments])

  /**
   * 處理文檔選擇
   */
  const handleSelectDocument = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  /**
   * 全選/取消全選
   */
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(documents.map((doc) => doc.id)))
    }
  }, [documents, selectedIds])

  /**
   * 批量刪除
   */
  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個文檔嗎？此操作無法撤銷。`)) {
      return
    }

    try {
      const response = await fetch('/api/knowledge-base/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      if (response.ok) {
        await loadDocuments()
        await loadStats()
        setSelectedIds(new Set())
        alert('批量刪除成功')
      } else {
        throw new Error('批量刪除失敗')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '批量刪除失敗')
    }
  }, [selectedIds, loadDocuments, loadStats])

  /**
   * 批量狀態更新
   */
  const handleBatchStatusUpdate = useCallback(
    async (status: string) => {
      if (selectedIds.size === 0) return

      try {
        const response = await fetch('/api/knowledge-base/batch-update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          },
          body: JSON.stringify({
            ids: Array.from(selectedIds),
            status,
          }),
        })

        if (response.ok) {
          await loadDocuments()
          await loadStats()
          setSelectedIds(new Set())
          alert(`已將 ${selectedIds.size} 個文檔狀態更新為 ${statusLabels[status]}`)
        } else {
          throw new Error('批量狀態更新失敗')
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : '批量狀態更新失敗')
      }
    },
    [selectedIds, loadDocuments, loadStats]
  )

  /**
   * 應用快速篩選預設
   */
  const applyQuickFilter = useCallback((preset: FilterCondition) => {
    setCurrentFilter(preset)
  }, [])

  /**
   * 清除篩選
   */
  const clearFilters = useCallback(() => {
    setCurrentFilter(null)
  }, [])

  /**
   * 保存當前篩選條件
   */
  const saveCurrentFilter = useCallback(() => {
    if (!currentFilter) return

    const name = prompt('請輸入篩選條件名稱：')
    if (!name) return

    const newFilter: FilterCondition = {
      id: `custom-${Date.now()}`,
      name,
      filters: currentFilter.filters,
    }

    setSavedFilters((prev) => [...prev, newFilter])
    alert('篩選條件已保存')
  }, [currentFilter])

  return (
    <div className={cn('space-y-6', className)}>
      {/* 統計視圖 */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="總文檔數"
            value={stats.totalDocuments}
            icon={DocumentIcon}
            description="知識庫總文檔數量"
          />
          <StatsCard
            title="啟用文檔"
            value={stats.activeDocuments}
            icon={CheckCircleIcon}
            description="當前啟用的文檔"
            className="border-green-200"
          />
          <StatsCard
            title="草稿文檔"
            value={stats.draftDocuments}
            icon={DocumentTextIcon}
            description="待完成的草稿"
            className="border-blue-200"
          />
          <StatsCard
            title="封存文檔"
            value={stats.archivedDocuments}
            icon={ArchiveBoxIcon}
            description="已封存的文檔"
            className="border-yellow-200"
          />
        </div>
      )}

      {/* 批量操作工具欄 */}
      {showBatchOperations && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant={batchOperationMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBatchOperationMode(!batchOperationMode)}
              >
                {batchOperationMode ? '退出批量模式' : '批量操作'}
              </Button>

              {batchOperationMode && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedIds.size === documents.length ? '取消全選' : '全選'}
                  </Button>

                  <span className="text-sm text-gray-600">
                    已選擇 {selectedIds.size} / {documents.length} 項
                  </span>

                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBatchDelete}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        批量刪除
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchStatusUpdate('ACTIVE')}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        設為啟用
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchStatusUpdate('ARCHIVED')}
                        className="text-yellow-600 hover:bg-yellow-50"
                      >
                        <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                        封存
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchStatusUpdate('INACTIVE')}
                        className="text-gray-600 hover:bg-gray-50"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        停用
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={loadDocuments}>
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              刷新
            </Button>
          </div>
        </div>
      )}

      {/* 快速篩選 */}
      {showQuickFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <FunnelIcon className="w-4 h-4" />
              快速篩選
            </h3>

            <div className="flex items-center gap-2">
              {currentFilter && (
                <Button variant="outline" size="sm" onClick={saveCurrentFilter}>
                  <BookmarkIcon className="w-4 h-4 mr-1" />
                  保存條件
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <FunnelIcon className="w-4 h-4 mr-1" />
                高級篩選
              </Button>

              {currentFilter && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  清除
                </Button>
              )}
            </div>
          </div>

          {/* 快速預設 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickFilterPresets.map((preset) => (
              <Button
                key={preset.id}
                variant={currentFilter?.id === preset.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyQuickFilter(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>

          {/* 保存的篩選條件 */}
          {savedFilters.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-2">已保存的篩選條件</p>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={currentFilter?.id === filter.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyQuickFilter(filter)}
                  >
                    <BookmarkIcon className="w-3 h-3 mr-1" />
                    {filter.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 高級篩選面板 */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 分類篩選 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分類
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        applyQuickFilter({
                          id: 'custom-category',
                          name: `分類: ${categoryLabels[e.target.value]}`,
                          filters: { category: [e.target.value] },
                        })
                      }
                    }}
                  >
                    <option value="">全部分類</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 狀態篩選 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    狀態
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        applyQuickFilter({
                          id: 'custom-status',
                          name: `狀態: ${statusLabels[e.target.value]}`,
                          filters: { status: [e.target.value] },
                        })
                      }
                    }}
                  >
                    <option value="">全部狀態</option>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 日期範圍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    更新時間
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        const now = new Date()
                        const start = new Date()
                        if (value === '7d') start.setDate(now.getDate() - 7)
                        else if (value === '30d') start.setDate(now.getDate() - 30)
                        else if (value === '90d') start.setDate(now.getDate() - 90)

                        applyQuickFilter({
                          id: 'custom-date',
                          name: `更新於 ${value}`,
                          filters: {
                            dateRange: {
                              start: start.toISOString(),
                              end: now.toISOString(),
                            },
                          },
                        })
                      }
                    }}
                  >
                    <option value="">全部時間</option>
                    <option value="7d">最近7天</option>
                    <option value="30d">最近30天</option>
                    <option value="90d">最近90天</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 當前篩選條件顯示 */}
          {currentFilter && (
            <div className="mt-3 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-900">
                當前篩選: <span className="font-medium">{currentFilter.name}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* 文檔列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">載入中...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">沒有找到文檔</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentFilter ? '嘗試調整篩選條件' : '開始上傳您的第一個文檔'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'p-4 hover:bg-gray-50 transition-colors',
                  selectedIds.has(doc.id) && 'bg-blue-50'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* 複選框 (批量模式) */}
                  {batchOperationMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(doc.id)}
                      onChange={() => handleSelectDocument(doc.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  )}

                  {/* 文檔信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <DocumentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </h4>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          statusColors[doc.status]
                        )}
                      >
                        {statusLabels[doc.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3" />
                        {categoryLabels[doc.category]}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {doc.creator.first_name} {doc.creator.last_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDistanceToNow(new Date(doc.updated_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                      {doc._count.chunks > 0 && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {doc._count.chunks} 片段
                        </span>
                      )}
                    </div>

                    {/* 標籤 */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{doc.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeManagementDashboard
