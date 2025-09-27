/**
 * ================================================================
 * AI銷售賦能平台 - 智能搜尋頁面 (app/dashboard/search/page.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 提供全局AI驅動的智能搜尋界面，整合文檔、知識庫和對話記錄的結構化搜尋，
 * 支持多種搜尋模式和精確相關性評分，為銷售團隊提供快速的資訊檢索能力。
 *
 * 【主要職責】
 * • 智能搜尋引擎 - 實現多模式搜尋（文檔/知識/對話）
 * • 實時結果展示 - 動態搜尋結果和相關性排序
 * • 結果分類管理 - 按內容類型組織和篩選結果
 * • 互動式搜尋 - 支持鍵盤輸入和點擊搜尋
 * • 搜尋狀態管理 - 載入中、無結果、初始狀態處理
 *
 * 【頁面結構】
 * • 標題区域 - 智能搜尋功能介紹和使用說明
 * • 搜尋框卡片 - Input輸入框 + 搜尋按鈕組合
 * • 結果展示區 - 搜尋結果列表和結果統計
 * • 狀態顯示區 - 載入中/無結果/初始狀態界面
 *
 * 【功能特色】
 * • 多類型支持 - document(文檔)/knowledge(知識)/conversation(對話)
 * • 相關性評分 - 百分比相關性排序和展示
 * • 標籤系統 - 支持標籤篩選和分類查看
 * • 日期顯示 - 內容創建和更新時間記錄
 * • 選择性搜尋 - 鍵盤Enter和點擊搜尋雙支持
 *
 * 【用戶流程】
 * 1. 輸入搜尋關鍵字或自然語言查詢
 * 2. 點擊搜尋或按Enter執行搜尋
 * 3. 系統顯示載入狀態和進度
 * 4. 查看搜尋結果和相關性評分
 * 5. 按類型和標籤篩選結果
 * 6. 點擊結果項目查看詳細內容
 *
 * 【狀態管理】
 * • query: 搜尋查詢字串狀態
 * • results: SearchResult[]搜尋結果陣列
 * • isLoading: 搜尋載入狀態標記
 *
 * 【相關檔案】
 * • app/dashboard/layout.tsx - Dashboard佈局包裝
 * • components/ui/card.tsx - 卡片UI組件
 * • components/ui/input.tsx - 輸入框組件
 * • components/ui/button.tsx - 按鈕UI組件
 * • components/ui/badge.tsx - 標籤顯示UI組件
 *
 * 【開發注意】
 * • 搜尋性能：需考慮防抖動(debounce)和搜尋緩存
 * • 結果限制：大量結果需考慮分頁和虛擬化
 * • 錯誤處理：搜尋失敗和網路錯誤的友好提示
 * • 可訪問性：鍵盤導航和screen reader支持
 * • SEO優化：搜尋結果的結構化標記和元數據
 */

'use client'

import { useState } from 'react'
import { Search, Bot, FileText, Clock, Star, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  title: string
  content: string
  type: 'document' | 'knowledge' | 'conversation'
  relevance: number
  date: string
  tags: string[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 模擬搜索結果
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: '產品定價策略指南',
      content: '本指南涵蓋了各種定價模型，包括成本加成定價、競爭定價和價值定價...',
      type: 'document',
      relevance: 95,
      date: '2024-09-20',
      tags: ['定價', '策略', '產品']
    },
    {
      id: '2',
      title: '客戶需求分析報告',
      content: '基於最近100位客戶的訪談，我們發現了以下關鍵需求模式...',
      type: 'knowledge',
      relevance: 88,
      date: '2024-09-18',
      tags: ['客戶', '需求', '分析']
    },
    {
      id: '3',
      title: '銷售對話記錄 - ABC公司',
      content: '與ABC公司的技術總監討論了他們對自動化解決方案的需求...',
      type: 'conversation',
      relevance: 82,
      date: '2024-09-22',
      tags: ['對話', 'ABC公司', '自動化']
    }
  ]

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    // 模擬API調用延遲
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 根據query過濾結果（簡單模擬）
    const filtered = mockResults.filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.content.toLowerCase().includes(query.toLowerCase()) ||
      result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )

    setResults(filtered)
    setIsLoading(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />
      case 'knowledge': return <Bot className="h-4 w-4" />
      case 'conversation': return <Star className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-700'
      case 'knowledge': return 'bg-green-100 text-green-700'
      case 'conversation': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 智能搜索</h1>
        <p className="text-gray-600">
          使用AI驅動的智能搜索，快速找到相關的文檔、知識和對話記錄
        </p>
      </div>

      {/* 搜索框 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="輸入您要搜索的內容..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-lg h-12"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="h-12 px-8"
            >
              <Search className="h-5 w-5 mr-2" />
              {isLoading ? '搜索中...' : '搜索'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 搜索結果 */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              找到 {results.length} 個結果
            </h2>
            <div className="text-sm text-gray-500">
              按相關性排序
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={getTypeColor(result.type)}
                        >
                          {getTypeIcon(result.type)}
                          <span className="ml-1">
                            {result.type === 'document' && '文檔'}
                            {result.type === 'knowledge' && '知識庫'}
                            {result.type === 'conversation' && '對話'}
                          </span>
                        </Badge>
                        <Badge variant="outline">
                          {result.relevance}% 相關
                        </Badge>
                      </div>
                      <CardTitle className="text-lg hover:text-blue-600 cursor-pointer">
                        {result.title}
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 mb-3">
                    {result.content}
                  </CardDescription>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {result.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {result.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 無搜索結果時的狀態 */}
      {results.length === 0 && query && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              沒有找到相關結果
            </h3>
            <p className="text-gray-600 mb-4">
              嘗試使用不同的關鍵字或檢查拼寫
            </p>
            <Button variant="outline" onClick={() => setQuery('')}>
              清除搜索
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 初始狀態 */}
      {results.length === 0 && !query && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              開始搜索
            </h3>
            <p className="text-gray-600">
              輸入關鍵字來搜索文檔、知識庫和對話記錄
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}