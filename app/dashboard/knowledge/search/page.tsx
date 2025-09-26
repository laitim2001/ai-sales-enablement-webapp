/**
 * 智能搜索頁面
 *
 * 功能說明：
 * - 提供AI驅動的多模式搜索界面
 * - 支援文本搜索、語義搜索、混合搜索
 * - 整合KnowledgeSearch組件
 * - 顯示搜索結果和相關性評分
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
        {/* 搜索區域 */}
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