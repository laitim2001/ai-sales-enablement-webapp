/**
 * @fileoverview ================================================================AI銷售賦能平台 - 文檔上傳頁面 (app/dashboard/knowledge/upload/page.tsx)================================================================【檔案功能】提供知識庫文檔上傳的統一界面，支持多種文件格式和批量上傳，整合AI自動處理和向量化功能，為用戶提供高效、安全的文檔管理体驗。【主要職責】• 文檔上傳管理 - 支持拖拽上傳、批量選擇和進度追蹤• 格式兼容性 - 支持PDF/Word/文本/Markdown等多種格式• AI自動處理 - 文檔內容提取和向量化索引建立• 安全標窗 - 文件安全檢查和重複檢測• 上傳指導 - 上傳須知和使用說明提供【頁面結構】• 導航區域 - 返回按鈕 + 標題 + 功能介紹• 麵包屑區域 - 完整的導航路徑显示• 主要上傳區 - 左側KnowledgeBaseUpload組件(2/3寬度)• 導引信息區 - 右側功能說明卡片(1/3寬度)【功能特色】• 格式支持 - PDF/Word/TXT/MD/CSV/JSON/HTML/RTF等八種主流格式• 拖拽上傳 - 支持拖拽放置和點擊選擇雙方式• 批量處理 - 同時上傳多個文件和進度管理• 安全檢查 - 自動檢測重複文件和安全掩描• AI處理 - 自動文本提取和向量化索引建立【用戶流程】1. 從知識庫主頁面進入上傳頁面2. 閱讀支持格式和上傳須知3. 拖拽文件到上傳區域或點擊選擇文件4. 系統顯示上傳進度和處理狀態5. 等待AI處理完成和索引建立6. 查看上傳結果和錯誤訊息7. 使用快速操作連結執行後續操作【上傳限制】• 文件大小 - 單個文件不超過10MB• 處理時間 - 1-3分鐘AI處理和索引建立• 安全檢查 - 所有文件經過安全掃描• 重複檢測 - 自動識別和處理重複內容【URL參數】• 路徑：/dashboard/knowledge/upload• 無動態參數，為靜態頁面【狀態管理】• 無本地狀態，狀態管理由KnowledgeBaseUpload組件負責• 上傳進度和結果由組件內部處理【相關檔案】• components/knowledge/knowledge-base-upload.tsx - 核心上傳組件• app/dashboard/knowledge/page.tsx - 知識庫主頁面• app/dashboard/knowledge/create/page.tsx - 手動創建頁面• app/dashboard/knowledge/search/page.tsx - 智能搜尋頁面• components/ui/card.tsx - UI卡片組件• components/ui/button.tsx - 按鈕UI組件【開發注意】• 文件安全：上傳文件需進行安全掃描和格式驗證• 儲存管理：大文件和批量上傳的儲存空間管理• 錯誤處理：上傳失敗、網路中斷的恢復機制• 進度顯示：大文件上傳進度的友好顯示• 性能優化：批量上傳時的串行/平行處理策略
 * @module app/dashboard/knowledge/upload/page
 * @description
 * ================================================================AI銷售賦能平台 - 文檔上傳頁面 (app/dashboard/knowledge/upload/page.tsx)================================================================【檔案功能】提供知識庫文檔上傳的統一界面，支持多種文件格式和批量上傳，整合AI自動處理和向量化功能，為用戶提供高效、安全的文檔管理体驗。【主要職責】• 文檔上傳管理 - 支持拖拽上傳、批量選擇和進度追蹤• 格式兼容性 - 支持PDF/Word/文本/Markdown等多種格式• AI自動處理 - 文檔內容提取和向量化索引建立• 安全標窗 - 文件安全檢查和重複檢測• 上傳指導 - 上傳須知和使用說明提供【頁面結構】• 導航區域 - 返回按鈕 + 標題 + 功能介紹• 麵包屑區域 - 完整的導航路徑显示• 主要上傳區 - 左側KnowledgeBaseUpload組件(2/3寬度)• 導引信息區 - 右側功能說明卡片(1/3寬度)【功能特色】• 格式支持 - PDF/Word/TXT/MD/CSV/JSON/HTML/RTF等八種主流格式• 拖拽上傳 - 支持拖拽放置和點擊選擇雙方式• 批量處理 - 同時上傳多個文件和進度管理• 安全檢查 - 自動檢測重複文件和安全掩描• AI處理 - 自動文本提取和向量化索引建立【用戶流程】1. 從知識庫主頁面進入上傳頁面2. 閱讀支持格式和上傳須知3. 拖拽文件到上傳區域或點擊選擇文件4. 系統顯示上傳進度和處理狀態5. 等待AI處理完成和索引建立6. 查看上傳結果和錯誤訊息7. 使用快速操作連結執行後續操作【上傳限制】• 文件大小 - 單個文件不超過10MB• 處理時間 - 1-3分鐘AI處理和索引建立• 安全檢查 - 所有文件經過安全掃描• 重複檢測 - 自動識別和處理重複內容【URL參數】• 路徑：/dashboard/knowledge/upload• 無動態參數，為靜態頁面【狀態管理】• 無本地狀態，狀態管理由KnowledgeBaseUpload組件負責• 上傳進度和結果由組件內部處理【相關檔案】• components/knowledge/knowledge-base-upload.tsx - 核心上傳組件• app/dashboard/knowledge/page.tsx - 知識庫主頁面• app/dashboard/knowledge/create/page.tsx - 手動創建頁面• app/dashboard/knowledge/search/page.tsx - 智能搜尋頁面• components/ui/card.tsx - UI卡片組件• components/ui/button.tsx - 按鈕UI組件【開發注意】• 文件安全：上傳文件需進行安全掃描和格式驗證• 儲存管理：大文件和批量上傳的儲存空間管理• 錯誤處理：上傳失敗、網路中斷的恢復機制• 進度顯示：大文件上傳進度的友好顯示• 性能優化：批量上傳時的串行/平行處理策略
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { KnowledgeBaseUpload } from '@/components/knowledge/knowledge-base-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '上傳文檔',
  description: '上傳文檔到知識庫，支援PDF、Word、文本等多種格式',
}

/**
 * 文檔上傳頁面組件
 *
 * 頁面結構：
 * 1. 頁面標題和導航
 * 2. 上傳說明卡片
 * 3. 文檔上傳組件
 * 4. 支援格式說明
 */
export default function UploadKnowledgePage() {
  return (
    <div className="space-y-6">
      {/* 頁面標題和導航 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/knowledge">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">上傳文檔</h1>
          <p className="mt-1 text-sm text-gray-600">
            將您的文檔上傳到知識庫，AI將自動處理和建立索引
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
            <span className="text-gray-900">上傳文檔</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 上傳區域 */}
        <div className="lg:col-span-2">
          <KnowledgeBaseUpload />
        </div>

        {/* 側邊欄說明 */}
        <div className="space-y-6">
          {/* 支援格式 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudArrowUpIcon className="h-5 w-5" />
                支援格式
              </CardTitle>
              <CardDescription>
                以下是目前支援的文件格式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">PDF 文檔</span>
                  <span className="text-xs text-gray-500">.pdf</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Word 文檔</span>
                  <span className="text-xs text-gray-500">.doc .docx</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">純文本</span>
                  <span className="text-xs text-gray-500">.txt</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Markdown</span>
                  <span className="text-xs text-gray-500">.md</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">CSV 數據</span>
                  <span className="text-xs text-gray-500">.csv</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">JSON 數據</span>
                  <span className="text-xs text-gray-500">.json</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">HTML 網頁</span>
                  <span className="text-xs text-gray-500">.html</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">RTF 文檔</span>
                  <span className="text-xs text-gray-500">.rtf</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 上傳須知 */}
          <Card>
            <CardHeader>
              <CardTitle>上傳須知</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>文件大小限制:</strong> 單個文件不超過 10MB
              </div>
              <div>
                <strong>處理時間:</strong> 上傳後需要1-3分鐘進行AI處理
              </div>
              <div>
                <strong>自動檢測:</strong> 系統會自動檢測重複文件
              </div>
              <div>
                <strong>向量化:</strong> 文檔會自動建立AI搜索索引
              </div>
              <div>
                <strong>安全性:</strong> 所有上傳文件都經過安全檢查
              </div>
            </CardContent>
          </Card>

          {/* 快速連結 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/knowledge/create">
                <Button variant="outline" className="w-full justify-start">
                  手動創建項目
                </Button>
              </Link>
              <Link href="/dashboard/knowledge/search">
                <Button variant="outline" className="w-full justify-start">
                  搜索現有文檔
                </Button>
              </Link>
              <Link href="/dashboard/knowledge">
                <Button variant="outline" className="w-full justify-start">
                  瀏覽知識庫
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}