/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫創建頁面 (app/dashboard/knowledge/create/page.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 知識庫項目創建頁面，提供手動創建知識庫項目的表單介面
 * 支援用戶直接輸入內容或創建空項目後續上傳文檔
 *
 * 【主要職責】
 * • 表單介面 - 提供完整的知識庫項目創建表單
 * • 導航支援 - 麵包屑導航和返回按鈕
 * • 用戶體驗 - 清晰的頁面標題和描述指引
 * • 表單驗證 - 整合表單組件的驗證邏輯
 * • 成功處理 - 創建成功後的導航和回饋
 * • 響應式設計 - 適配不同螢幕尺寸的佈局
 *
 * 【頁面結構】
 * • 頁面標題區 - 返回按鈕、標題和描述
 * • 麵包屑導航 - 顯示當前位置的層級結構
 * • 創建表單區 - KnowledgeCreateForm組件
 * • 最大寬度限制 - 確保表單在大螢幕上的可讀性
 *
 * 【功能特色】
 * • 快速返回 - 一鍵返回知識庫列表頁面
 * • 麵包屑導航 - 清晰的頁面層級指示
 * • 表單封裝 - 使用專門的表單組件處理複雜邏輯
 * • 響應式佈局 - 移動設備友好的介面設計
 * • 訪問性支援 - 正確的ARIA標籤和語義結構
 *
 * 【用戶流程】
 * 1. 從知識庫列表頁面點擊「新建項目」
 * 2. 進入此創建頁面，填寫項目資訊
 * 3. 提交表單創建項目
 * 4. 創建成功後導航到項目詳情或列表頁
 * 5. 可選擇返回列表頁面或繼續操作
 *
 * 【表單內容包含】
 * • 項目標題 - 必填，知識庫項目名稱
 * • 項目分類 - 可選，項目分類標籤
 * • 內容描述 - 可選，項目簡要描述
 * • 標籤設定 - 可選，項目標籤管理
 * • 可見性設定 - 項目的訪問權限設定
 *
 * 【相關檔案】
 * • components/knowledge/knowledge-create-form.tsx - 創建表單組件
 * • app/dashboard/knowledge/page.tsx - 知識庫列表頁面
 * • app/dashboard/knowledge/upload/page.tsx - 文檔上傳頁面
 * • app/dashboard/knowledge/[id]/page.tsx - 項目詳情頁面
 *
 * 【開發注意】
 * • 使用max-w-3xl限制表單寬度，提升可讀性
 * • 麵包屑導航使用語義化的nav和ol結構
 * • 返回按鈕使用outline樣式，不與主要操作衝突
 * • 頁面標題和描述提供清晰的操作指引
 * • 表單組件負責處理資料驗證和提交邏輯
 */

import { Metadata } from 'next'                              // Next.js元資料類型
import Link from 'next/link'                                // Next.js路由連結
import { ArrowLeftIcon } from '@heroicons/react/24/outline' // Heroicons返回箭頭圖示
import { KnowledgeCreateForm } from '@/components/knowledge/knowledge-create-form'  // 知識庫創建表單組件
import { Button } from '@/components/ui/button'             // UI按鈕組件

// 頁面元資料配置 - 用於SEO和瀏覽器標題
export const metadata: Metadata = {
  title: '新建知識庫項目',                                    // 頁面標題
  description: '創建新的知識庫項目，組織您的文檔和資料',        // 頁面描述
}

/**
 * 知識庫創建頁面組件
 *
 * 提供完整的知識庫項目創建介面，包含導航、表單和用戶指引。
 * 使用專門的表單組件處理複雜的創建邏輯和驗證。
 *
 * @returns 知識庫創建頁面的完整JSX結構
 */
export default function CreateKnowledgePage() {
  return (
    <div className="space-y-6">
      {/* 頁面標題和導航控制區域 */}
      <div className="flex items-center gap-4">
        {/* 返回按鈕 - 快速返回知識庫列表頁面 */}
        <Link href="/dashboard/knowledge">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>

        {/* 頁面標題和描述區域 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建知識庫項目</h1>
          <p className="mt-1 text-sm text-gray-600">
            創建新的知識庫項目，手動輸入內容或稍後上傳文檔
          </p>
        </div>
      </div>

      {/* 麵包屑導航 - 顯示當前頁面在網站層級中的位置 */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          {/* 儀表板層級 */}
          <li>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
              儀表板
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>

          {/* 知識庫層級 */}
          <li>
            <Link href="/dashboard/knowledge" className="text-gray-400 hover:text-gray-500">
              知識庫
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>

          {/* 當前頁面 - 新建項目 */}
          <li>
            <span className="text-gray-900">新建項目</span>
          </li>
        </ol>
      </nav>

      {/* 創建表單區域 */}
      {/* 使用max-w-3xl限制寬度，在大螢幕上保持良好的可讀性 */}
      <div className="max-w-3xl">
        {/* KnowledgeCreateForm組件處理所有表單邏輯 */}
        {/* 包含表單驗證、提交處理、錯誤展示等功能 */}
        <KnowledgeCreateForm />
      </div>
    </div>
  )
}