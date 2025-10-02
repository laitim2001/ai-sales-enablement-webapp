/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫管理頁面 (app/dashboard/knowledge/page.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 知識庫主管理頁面，提供文檔的展示、篩選、搜索、創建和管理功能
 * 是用戶與知識庫系統交互的主要介面
 *
 * 【主要職責】
 * • 知識庫展示 - 以列表形式展示用戶的知識庫項目
 * • 篩選功能 - 支援按分類、狀態、標籤等條件篩選
 * • 搜索支援 - 提供關鍵字搜索和智能搜索功能
 * • 快速操作 - 提供新建、上傳、搜索等快速入口
 * • 分頁管理 - 處理大量數據的分頁展示
 * • URL狀態管理 - 通過URL參數保持篩選和搜索狀態
 * • 響應式佈局 - 適配不同螢幕尺寸的使用體驗
 *
 * 【頁面結構】
 * • 頁面標題區 - 標題、描述和主要操作按鈕
 * • 篩選器區域 - 分類、狀態、標籤等篩選選項
 * • 內容列表區 - 知識庫項目的表格或卡片展示
 * • 分頁控制 - 頁面導航和每頁數量控制
 *
 * 【功能特色】
 * • 智能搜索 - 語義搜索和關鍵字匹配
 * • 多種視圖 - 列表視圖和卡片視圖切換
 * • 批量操作 - 支援多選和批量管理
 * • 狀態指示 - 處理狀態和同步狀態顯示
 * • 預覽功能 - 快速預覽文檔內容
 *
 * 【URL參數支援】
 * • page - 當前頁碼（預設: 1）
 * • limit - 每頁項目數（預設: 20）
 * • category - 分類篩選
 * • status - 狀態篩選
 * • search - 搜索關鍵字
 * • tags - 標籤篩選
 * • sort - 排序欄位（預設: updated_at）
 * • order - 排序方向（預設: desc）
 *
 * 【相關檔案】
 * • components/knowledge/knowledge-base-list.tsx - 知識庫列表組件
 * • components/knowledge/knowledge-base-filters.tsx - 篩選器組件
 * • app/dashboard/knowledge/create/page.tsx - 新建知識庫項目
 * • app/dashboard/knowledge/search/page.tsx - 智能搜索頁面
 * • app/dashboard/knowledge/upload/page.tsx - 文檔上傳頁面
 *
 * 【開發注意】
 * • 使用Suspense處理非同步載入，提升用戶體驗
 * • URL參數與組件狀態保持同步
 * • 支援伺服器端渲染的篩選和搜索
 * • 合理的預設值設定，確保良好的初始體驗
 * • 錯誤邊界處理，避免載入失敗影響整個頁面
 */

import { Metadata } from 'next'                              // Next.js元資料類型
import { Suspense } from 'react'                            // React Suspense組件
import { KnowledgeBaseList } from '@/components/knowledge/knowledge-base-list'     // 知識庫列表組件
import { KnowledgeBaseFilters } from '@/components/knowledge/knowledge-base-filters'  // 篩選器組件
import { BreadcrumbNavigation } from '@/components/knowledge/breadcrumb-navigation'  // 麵包屑導航組件
import { Button } from '@/components/ui/button'             // UI按鈕組件
import Link from 'next/link'                                // Next.js路由連結
import { PlusIcon, MagnifyingGlassIcon, FolderIcon } from '@heroicons/react/24/outline'  // Heroicons圖示

// 頁面元資料配置 - 用於SEO和瀏覽器標題
export const metadata: Metadata = {
  title: '知識庫',                                          // 頁面標題
  description: '管理和搜索您的知識庫文檔',                    // 頁面描述
}

/**
 * 頁面組件屬性介面定義
 * 定義從URL搜索參數接收的篩選和分頁選項
 */
interface PageProps {
  searchParams: {
    page?: string        // 當前頁碼（字串形式）
    limit?: string       // 每頁項目數量
    category?: string    // 分類篩選
    status?: string      // 狀態篩選（processing, completed, failed等）
    search?: string      // 搜索關鍵字
    tags?: string        // 標籤篩選（逗號分隔）
    sort?: string        // 排序欄位
    order?: string       // 排序方向（asc/desc）
    folder?: string      // 資料夾ID篩選 (Sprint 6 Week 12)
  }
}

/**
 * 知識庫管理主頁面組件
 *
 * 提供知識庫項目的綜合管理介面，包含展示、篩選、搜索和管理功能。
 * 支援URL參數狀態管理，確保分享和書籤功能正常工作。
 *
 * @param searchParams - URL搜索參數，包含篩選和分頁設定
 * @returns 知識庫管理頁面的完整JSX結構
 */
export default function KnowledgePage({ searchParams }: PageProps) {
  // 解析並格式化URL搜索參數為篩選器設定
  // 提供合理的預設值確保頁面正常運行
  const filters = {
    page: parseInt(searchParams.page || '1'),                        // 當前頁碼，預設第1頁
    limit: parseInt(searchParams.limit || '20'),                     // 每頁項目數，預設20項
    category: searchParams.category,                                 // 分類篩選，可選
    status: searchParams.status,                                     // 狀態篩選，可選
    search: searchParams.search,                                     // 搜索關鍵字，可選
    tags: searchParams.tags,                                         // 標籤篩選，可選
    sort: searchParams.sort || 'updated_at',                        // 排序欄位，預設按更新時間
    order: (searchParams.order as 'asc' | 'desc') || 'desc',        // 排序方向，預設降序（最新在前）
  }

  // 解析資料夾ID
  const folderId = searchParams.folder ? parseInt(searchParams.folder) : null

  return (
    <div className="space-y-6">
      {/* 麵包屑導航 - Sprint 6 Week 12 Day 1 */}
      {folderId && (
        <BreadcrumbNavigation folderId={folderId} showHome={true} />
      )}

      {/* 頁面標題和主要操作區域 */}
      <div className="flex items-center justify-between">
        {/* 左側：頁面標題和描述 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知識庫</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理您的文檔和知識資料，讓AI助手更好地協助您
          </p>
        </div>

        {/* 右側：快速操作按鈕組 */}
        <div className="flex items-center gap-3">
          {/* 資料夾管理按鈕 - Sprint 6 Week 11 Day 2 */}
          <Link href="/dashboard/knowledge/folders">
            <Button variant="outline">
              <FolderIcon className="h-4 w-4 mr-2" />
              資料夾管理
            </Button>
          </Link>

          {/* 智能搜索按鈕 - 跳轉到專門的搜索頁面 */}
          <Link href="/dashboard/knowledge/search">
            <Button variant="outline">
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              智能搜索
            </Button>
          </Link>

          {/* 新建項目按鈕 - 手動創建知識庫項目 */}
          <Link href="/dashboard/knowledge/create">
            <Button variant="outline">
              <PlusIcon className="h-4 w-4 mr-2" />
              新建項目
            </Button>
          </Link>

          {/* 上傳文檔按鈕 - 主要操作，使用實心樣式突出 */}
          <Link href="/dashboard/knowledge/upload">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              上傳文檔
            </Button>
          </Link>
        </div>
      </div>

      {/* 篩選器區域 */}
      {/* 提供分類、狀態、標籤等多維度篩選功能 */}
      <KnowledgeBaseFilters initialFilters={filters} />

      {/* 知識庫項目列表區域 */}
      {/* 使用Suspense包裝，提供載入狀態顯示 */}
      <Suspense fallback={<div className="text-center py-8">載入中...</div>}>
        <KnowledgeBaseList filters={filters} />
      </Suspense>
    </div>
  )
}