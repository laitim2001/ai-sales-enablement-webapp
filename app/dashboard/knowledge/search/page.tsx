/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫智能搜尋頁面 (app/dashboard/knowledge/search/page.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 提供知識庫專用的AI驅動智能搜尋界面，整合多種搜尋模式和高級篩選功能，
 * 支持文本、語義和混合搜尋，為用戶提供精確、高效的知識檢索体驗。
 *
 * 【主要職責】
 * • 多模式搜尋引擎 - 文本/語義/混合三種搜尋模式
 * • 知識庫整合 - KnowledgeSearch組件深度整合
 * • 搜尋結果顯示 - 相關性評分和精確匹配
 * • 操作指導系統 - 搜尋技巧和使用建議
 * • 快速導航系統 - 麵包屑導航和快速操作連結
 *
 * 【頁面結構】
 * • 導航區域 - 返回按鈕 + 標題 + 功能介紹
 * • 麵包屑區域 - 完整的導航路徑显示
 * • 主要內容區 - 左側KnowledgeSearch組件(2/3寬度)
 * • 側邊欄區域 - 右側功能卡片集合(1/3寬度)
 *
 * 【側邊欄功能】
 * • 搜尋模式說明 - 文本/語義/混合搜尋的特點說明
 * • 搜尋技巧指導 - 精確匹配、語義查詢、篩選技巧
 * • 常用查詢快速入口 - 預設的常見搜尋主題
 * • 快速操作連結 - 上傳、創建、瀏覽等快捷入口
 *
 * 【搜尋模式】
 * • 文本搜尋 - 關鍵字精確匹配，適合查找特定詞彙
 * • 語義搜尋 - AI理解查詢含義，找到語義相關內容
 * • 混合搜尋 - 結合文本和語義搜尋，提供最佳結果
 *
 * 【用戶流程】
 * 1. 從知識庫主頁面進入智能搜尋
 * 2. 閱讀搜尋模式說明，選擇適合的搜尋方式
 * 3. 輸入搜尋查詢或使用常用查詢快捷入口
 * 4. 點擊搜尋或調整搜尋參數
 * 5. 查看搜尋結果和相關性評分
 * 6. 使用快速操作連結執行後續操作
 *
 * 【URL參數】
 * • 路徑：/dashboard/knowledge/search
 * • 無動態參數，為靜態頁面
 *
 * 【狀態管理】
 * • 無本地狀態，狀態管理由KnowledgeSearch組件負責
 * • 搜尋歷史和緩存由組件內部處理
 *
 * 【相關檔案】
 * • components/knowledge/knowledge-search.tsx - 核心搜尋組件
 * • app/dashboard/knowledge/page.tsx - 知識庫主頁面
 * • app/dashboard/knowledge/upload/page.tsx - 文檔上傳頁面
 * • app/dashboard/knowledge/create/page.tsx - 手動創建頁面
 * • components/ui/card.tsx - UI卡片組件
 * • components/ui/button.tsx - 按鈕UI組件
 *
 * 【開發注意】
 * • 搜尋性能：KnowledgeSearch組件需優化搜尋速度和精確度
 * • 緩存機制：搜尋結果和常用查詢的緩存策略
 * • 可訪問性：搜尋界面和結果列表的鍵盤導航
 * • 響應式設計：大小螢幕上的側邊欄適配
 * • 錯誤處理：搜尋失敗和網路中斷的用戶提示
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { KnowledgeSearch } from '@/components/knowledge/knowledge-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'AI 智能搜索',
  description: '使用AI驅動的智能搜索引擎，快速找到相關文檔和資訊',
}

/**
 * 智能搜索頁面組件
 *
 * 頁面結構：
 * 1. 頁面標題和導航
 * 2. 搜索說明和功能介紹
 * 3. 智能搜索組件
 * 4. 搜索模式說明
 */
export default function SearchKnowledgePage() {
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            AI 智能搜索
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            使用先進的AI技術，智能理解您的查詢意圖並找到最相關的內容
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
            <span className="text-gray-900">智能搜索</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 搜索區域 - Sprint 6 Week 11 Day 2: 使用增強版搜索組件 */}
        <div className="lg:col-span-2">
          <KnowledgeSearch />
        </div>

        {/* 側邊欄說明 */}
        <div className="space-y-6">
          {/* 搜索模式說明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5" />
                搜索模式
              </CardTitle>
              <CardDescription>
                選擇最適合的搜索方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">文本搜索</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    基於關鍵字匹配，適合查找特定詞彙或短語
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">語義搜索</h4>
                  <p className="text-sm text-green-700 mt-1">
                    AI理解查詢含義，找到語義相關的內容
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">混合搜索</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    結合文本和語義搜索，提供最佳結果
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 搜索技巧 */}
          <Card>
            <CardHeader>
              <CardTitle>搜索技巧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>精確匹配:</strong> 使用引號包圍短語，如 "銷售策略"
              </div>
              <div>
                <strong>語義查詢:</strong> 使用自然語言，如 "如何提高客戶滿意度"
              </div>
              <div>
                <strong>標籤篩選:</strong> 選擇特定標籤縮小搜索範圍
              </div>
              <div>
                <strong>類別篩選:</strong> 限定搜索特定文檔類別
              </div>
              <div>
                <strong>相似度調整:</strong> 調整語義搜索的匹配嚴格程度
              </div>
            </CardContent>
          </Card>

          {/* 搜索歷史 */}
          <Card>
            <CardHeader>
              <CardTitle>常用查詢</CardTitle>
              <CardDescription>
                快速搜索常見主題
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                產品介紹文檔
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                銷售流程指南
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                客戶服務政策
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                技術規格文檔
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                培訓材料
              </Button>
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/knowledge/upload">
                <Button variant="outline" className="w-full justify-start">
                  上傳新文檔
                </Button>
              </Link>
              <Link href="/dashboard/knowledge/create">
                <Button variant="outline" className="w-full justify-start">
                  創建新項目
                </Button>
              </Link>
              <Link href="/dashboard/knowledge">
                <Button variant="outline" className="w-full justify-start">
                  瀏覽所有文檔
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}