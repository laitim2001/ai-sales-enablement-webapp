/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫文檔編輯頁面 (app/dashboard/knowledge/[id]/edit/page.tsx)================================================================【檔案功能】提供知識庫文檔的全面編輯界面，支持內容修改、元數據更新和屬性管理，整合智能編輯器和實時預覽功能，為用戶提供高效、直覺的文檔編輯体驗。【主要職責】• 內容編輯管理 - 支持富文本編輯器和Markdown格式• 元數據更新 - 文檔標題、標籤、分類等屬性修改• 版本控制 - 編輯歷史追蹤和更改回滾功能• 保存機制 - 自動保存、手動保存和取消操作• 預覽功能 - 實時預覽和格式化顯示【頁面結構】• 標題和導航區 - 返回按鈕 + 編輯標題 + 功能說明• 麵包屑導航區 - 完整的面包屑路徑到編輯層級• 編輯表單區 - KnowledgeDocumentEdit組件容器【功能特色】• 動態路由 - 支持[id]參數的動態路由處理• 元數據產生 - generateMetadata函數動態產生編輯頁元數據• 參數驗證 - 文檔ID的數字驗證和404處理• 限制寬度 - max-w-4xl限制編輯區域最大寬度• 導航連結 - 返回詳情頁面的精確連結【用戶流程】1. 從文檔詳情頁面點擊編輯按鈕進入2. 查看當前文檔內容和元數據3. 修改文檔標題、內容和標籤4. 使用預覽功能查看修改效果5. 保存更改或取消編輯6. 返回文檔詳情頁面查看更新結果【編輯功能】• 文本編輯 - 支持Markdown和富文本格式• 標題修改 - 文檔標題的即時更新• 標籤管理 - 標籤新增、刪除和修改• 分類設定 - 文檔分類和權限設定• 預覽模式 - 實時預覽和格式化顯示【URL參數】• 路徑：/dashboard/knowledge/[id]/edit• 動態參數：  - id: 文檔ID（數字，必須 > 0）【狀態管理】• documentId: 由URL參數解析的文檔ID• 編輯狀態由KnowledgeDocumentEdit組件管理【相關檔案】• components/knowledge/knowledge-document-edit.tsx - 核心編輯組件• app/dashboard/knowledge/[id]/page.tsx - 文檔詳情頁面• app/dashboard/knowledge/page.tsx - 知識庫主頁面• app/api/knowledge-base/[id]/route.ts - 文檔更新API• components/ui/button.tsx - 按鈕UI組件【開發注意】• 數據驗證：編輯表單需加入完整的前後端驗證• 自動保存：防止數據遺失的定時自動保存機制• 衝突處理：多用戶同時編輯時的衝突解決• 權限控制：編輯權限的實時檢查和控制• 性能優化：大文檔編輯時的懶載入和分段處理
 * @module app/dashboard/knowledge/[id]/edit/page
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫文檔編輯頁面 (app/dashboard/knowledge/[id]/edit/page.tsx)================================================================【檔案功能】提供知識庫文檔的全面編輯界面，支持內容修改、元數據更新和屬性管理，整合智能編輯器和實時預覽功能，為用戶提供高效、直覺的文檔編輯体驗。【主要職責】• 內容編輯管理 - 支持富文本編輯器和Markdown格式• 元數據更新 - 文檔標題、標籤、分類等屬性修改• 版本控制 - 編輯歷史追蹤和更改回滾功能• 保存機制 - 自動保存、手動保存和取消操作• 預覽功能 - 實時預覽和格式化顯示【頁面結構】• 標題和導航區 - 返回按鈕 + 編輯標題 + 功能說明• 麵包屑導航區 - 完整的面包屑路徑到編輯層級• 編輯表單區 - KnowledgeDocumentEdit組件容器【功能特色】• 動態路由 - 支持[id]參數的動態路由處理• 元數據產生 - generateMetadata函數動態產生編輯頁元數據• 參數驗證 - 文檔ID的數字驗證和404處理• 限制寬度 - max-w-4xl限制編輯區域最大寬度• 導航連結 - 返回詳情頁面的精確連結【用戶流程】1. 從文檔詳情頁面點擊編輯按鈕進入2. 查看當前文檔內容和元數據3. 修改文檔標題、內容和標籤4. 使用預覽功能查看修改效果5. 保存更改或取消編輯6. 返回文檔詳情頁面查看更新結果【編輯功能】• 文本編輯 - 支持Markdown和富文本格式• 標題修改 - 文檔標題的即時更新• 標籤管理 - 標籤新增、刪除和修改• 分類設定 - 文檔分類和權限設定• 預覽模式 - 實時預覽和格式化顯示【URL參數】• 路徑：/dashboard/knowledge/[id]/edit• 動態參數：  - id: 文檔ID（數字，必須 > 0）【狀態管理】• documentId: 由URL參數解析的文檔ID• 編輯狀態由KnowledgeDocumentEdit組件管理【相關檔案】• components/knowledge/knowledge-document-edit.tsx - 核心編輯組件• app/dashboard/knowledge/[id]/page.tsx - 文檔詳情頁面• app/dashboard/knowledge/page.tsx - 知識庫主頁面• app/api/knowledge-base/[id]/route.ts - 文檔更新API• components/ui/button.tsx - 按鈕UI組件【開發注意】• 數據驗證：編輯表單需加入完整的前後端驗證• 自動保存：防止數據遺失的定時自動保存機制• 衝突處理：多用戶同時編輯時的衝突解決• 權限控制：編輯權限的實時檢查和控制• 性能優化：大文檔編輯時的懶載入和分段處理
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { KnowledgeDocumentEditWithVersion } from '@/components/knowledge/knowledge-document-edit-with-version'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: {
    id: string
  }
}

/**
 * 生成頁面元數據
 * 使用靜態metadata避免SSR阻塞
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: '編輯文檔',
    description: '編輯知識庫文檔的內容和屬性'
  }
}

/**
 * 文檔編輯頁面組件
 *
 * 路由參數：
 * - id: 知識庫項目ID（數字）
 *
 * 頁面結構：
 * 1. 頁面標題和導航
 * 2. 麵包屑導航
 * 3. 文檔編輯表單組件
 */
export default function EditKnowledgePage({ params }: PageProps) {
  // 驗證ID參數是否為有效數字
  const documentId = parseInt(params.id)
  if (isNaN(documentId) || documentId <= 0) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和導航 */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/knowledge/${documentId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回詳情
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">編輯文檔</h1>
          <p className="mt-1 text-sm text-gray-600">
            修改文檔的內容、標題、標籤和其他屬性
          </p>
        </div>
      </div>

      {/* 麵包屑導航 */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
              儀表板
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <Link href="/dashboard/knowledge" className="text-gray-400 hover:text-gray-500">
              知識庫
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <Link href={`/dashboard/knowledge/${documentId}`} className="text-gray-400 hover:text-gray-500">
              文檔詳情
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <span className="text-gray-900">編輯</span>
          </li>
        </ol>
      </nav>

      {/* 編輯表單 - 含版本控制 */}
      <div className="max-w-6xl">
        <KnowledgeDocumentEditWithVersion documentId={documentId} />
      </div>
    </div>
  )
}