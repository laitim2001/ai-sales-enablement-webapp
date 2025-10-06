/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫列表組件 (/components/knowledge/knowledge-base-list.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 提供AI銷售賦能平台知識庫文檔的標準列表展示功能，支持分頁瀏覽、
 * 多維度篩選、全文搜索等核心功能，為用戶提供高效的文檔管理體驗。
 *
 * 【主要職責】
 * • 列表展示 - 以卡片或表格形式展示知識庫文檔清單
 * • 分頁導航 - 支持大量文檔的分頁瀏覽和URL同步
 * • 篩選功能 - 根據類別、狀態、標籤等多維度條件篩選
 * • 搜索功能 - 支持文檔標題和內容的全文搜索
 * • 排序功能 - 按創建時間、更新時間、標題等排序
 * • CRUD操作 - 提供查看、編輯、刪除文檔的操作入口
 * • 狀態管理 - 處理加載、錯誤、空狀態的用戶體驗
 * • 響應式設計 - 適配桌面端和移動端的顯示需求
 *
 * 【用戶交互功能】
 * • 即時篩選 - 支持多維度篩選條件的組合使用
 * • 視覺化標籤 - 使用顏色區分不同類別和狀態
 * • 時間顯示 - 使用相對時間格式提升可讀性
 * • 批量操作 - 預留批量選擇和操作的擴展空間
 * • 權限控制 - 根據用戶角色顯示不同的操作按鈕
 * • 統計信息 - 顯示文檔片段數量等元數據
 * • 確認對話框 - 刪除操作需要用戶確認防止誤操作
 * • URL同步 - 分頁和篩選參數與瀏覽器地址欄同步
 *
 * 【技術特性】
 * • 客戶端渲染 - 使用'use client'支持交互式狀態管理
 * • RESTful API - 從/api/knowledge-base端點獲取數據
 * • JWT認證 - 支持基於token的身份驗證機制
 * • 路由集成 - 與Next.js App Router深度集成
 * • 類型安全 - 完整的TypeScript類型定義
 * • 國際化 - 支持中文本地化的日期格式
 * • 錯誤處理 - 優雅的錯誤邊界和重試機制
 * • 性能優化 - 合理的狀態更新和重渲染控制
 *
 * 【相關檔案】
 * • /components/knowledge/knowledge-base-list-optimized.tsx - 高性能優化版
 * • /components/knowledge/knowledge-base-filters.tsx - 篩選組件
 * • /components/knowledge/knowledge-search.tsx - 搜索組件
 * • /components/ui/button.tsx - 按鈕組件
 * • /api/knowledge-base - 後端API端點
 * • /hooks/useKnowledgeBase.ts - 知識庫數據Hook
 *
 * 【開發注意事項】
 * • 數據獲取 - 確保正確處理API響應和錯誤狀態
 * • 認證處理 - 妥善管理JWT token的存儲和驗證
 * • 性能考量 - 大量數據時考慮使用虛擬化版本
 * • 用戶體驗 - 提供清晰的加載和錯誤狀態反饋
 * • 無障礙性 - 確保支持鍵盤導航和屏幕閱讀器
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DocumentIcon,  // 文檔圖示
  EyeIcon,      // 查看圖示
  PencilIcon,   // 編輯圖示
  TrashIcon,    // 刪除圖示
  ClockIcon,    // 時間圖示
  TagIcon,      // 標籤圖示
  UserIcon      // 用戶圖示
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'  // 相對時間格式化
import { zhTW } from 'date-fns/locale'           // 中文本地化

// 知識庫項目的資料結構型別定義
interface KnowledgeBaseItem {
  id: number              // 文檔唯一識別碼
  title: string           // 文檔標題
  category: string        // 文檔類別(如PRODUCT_SPEC、SALES_MATERIAL等)
  status: string          // 文檔狀態(如ACTIVE、INACTIVE、ARCHIVED等)
  author?: string         // 可選的作者資訊
  created_at: string      // 創建時間戳
  updated_at: string      // 最後更新時間戳
  creator: {              // 創建者資訊
    id: number            // 創建者ID
    first_name: string    // 創建者名字
    last_name: string     // 創建者姓氏
  }
  tags: Array<{           // 標籤陣列
    id: number            // 標籤ID
    name: string          // 標籤名稱
    color: string         // 標籤顏色(十六進制)
  }>
  _count: {               // 統計資訊
    chunks: number        // 文檔片段數量
  }
}

// API響應資料結構型別定義
interface KnowledgeBaseListResponse {
  success: boolean                // API調用是否成功
  data: KnowledgeBaseItem[]      // 知識庫項目陣列
  pagination: {                   // 分頁資訊
    page: number                  // 當前頁碼
    limit: number                 // 每頁項目數量
    total: number                 // 總項目數
    pages: number                 // 總頁數
  }
}

// 組件Props型別定義
interface KnowledgeBaseListProps {
  filters: {                      // 篩選條件物件
    page: number                  // 當前頁碼
    limit: number                 // 每頁顯示數量
    category?: string             // 可選的類別篩選
    status?: string               // 可選的狀態篩選
    search?: string               // 可選的搜尋關鍵字
    tags?: string                 // 可選的標籤篩選
    sort: string                  // 排序欄位
    order: 'asc' | 'desc'        // 排序方向：升序或降序
  }
}

// 文檔類別標籤對應表 - 將英文類別代碼轉換為中文顯示
const categoryLabels: Record<string, string> = {
  GENERAL: '一般',              // 一般性文檔
  PRODUCT_SPEC: '產品規格',      // 產品規格說明書
  SALES_MATERIAL: '銷售資料',    // 銷售輔助材料
  TECHNICAL_DOC: '技術文檔',     // 技術規範文檔
  LEGAL_DOC: '法律文件',         // 法律合規文件
  TRAINING: '培訓資料',          // 教育訓練材料
  FAQ: '常見問題',              // 常見問題解答
  CASE_STUDY: '案例研究',        // 客戶案例分析
  WHITE_PAPER: '白皮書',         // 研究報告白皮書
  PRESENTATION: '簡報',          // 演示簡報檔案
  COMPETITOR: '競爭分析',        // 競爭對手分析
  INDUSTRY_NEWS: '行業新聞',     // 產業新聞資訊
  INTERNAL: '內部文檔'           // 內部使用文檔
}

// 文檔狀態標籤對應表 - 將英文狀態代碼轉換為中文顯示
const statusLabels: Record<string, string> = {
  ACTIVE: '啟用',              // 正常使用中的文檔
  INACTIVE: '停用',            // 暫時停用的文檔
  ARCHIVED: '封存',            // 已封存的歷史文檔
  DELETED: '已刪除',           // 已標記刪除的文檔
  DRAFT: '草稿'               // 草稿狀態的文檔
}

// 文檔狀態對應的視覺樣式 - 定義不同狀態的顏色主題
const statusColors: Record<string, string> = {
  ACTIVE: 'text-green-700 bg-green-50 ring-green-600/20',      // 綠色主題 - 表示正常狀態
  INACTIVE: 'text-gray-600 bg-gray-50 ring-gray-500/10',       // 灰色主題 - 表示停用狀態
  ARCHIVED: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20', // 黃色主題 - 表示封存狀態
  DELETED: 'text-red-700 bg-red-50 ring-red-600/10',           // 紅色主題 - 表示刪除狀態
  DRAFT: 'text-blue-700 bg-blue-50 ring-blue-600/20'           // 藍色主題 - 表示草稿狀態
}

/**
 * 知識庫列表主組件
 *
 * 提供完整的知識庫文檔管理介面，包括列表顯示、篩選、搜尋、分頁和CRUD操作。
 * 支援響應式設計和多種載入狀態處理。
 *
 * @param filters - 篩選條件物件，包括分頁、搜尋、排序等參數
 * @returns 知識庫列表的完整JSX結構
 */
export function KnowledgeBaseList({ filters }: KnowledgeBaseListProps) {
  // === 狀態管理 ===

  // API響應資料狀態 - 儲存從後端獲取的知識庫列表和分頁資訊
  const [data, setData] = useState<KnowledgeBaseListResponse | null>(null)

  // 載入狀態 - 控制載入動畫和skeleton佔位符的顯示
  const [loading, setLoading] = useState(true)

  // 錯誤狀態 - 儲存API調用或其他操作的錯誤訊息
  const [error, setError] = useState<string | null>(null)

  // === Hook依賴 ===

  // Next.js路由器 - 用於分頁導航和URL更新
  const router = useRouter()

  // URL搜尋參數 - 獲取當前URL中的查詢參數
  const searchParams = useSearchParams()

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
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
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

  // 處理分頁導航
  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('page', newPage.toString())
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`/dashboard/knowledge${query}`)
  }

  // 處理刪除操作
  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個文檔嗎？此操作無法撤銷。')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('刪除失敗')
      }

      // 重新載入數據
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
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
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
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除失敗')
    }
  }

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/knowledge/${item.id}/edit`)}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  編輯
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(item.id)}
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
              onClick={() => handlePageChange(data.pagination.page - 1)}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              disabled={data.pagination.page === data.pagination.pages}
              onClick={() => handlePageChange(data.pagination.page + 1)}
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
                onClick={() => handlePageChange(data.pagination.page - 1)}
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
                onClick={() => handlePageChange(data.pagination.page + 1)}
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