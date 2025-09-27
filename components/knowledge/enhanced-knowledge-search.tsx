/**
 * ================================================================
 * AI銷售賦能平台 - 增強版知識庫搜索組件 (components/knowledge/enhanced-knowledge-search.tsx)
 * ================================================================
 *
 * 【組件功能】
 * Week 6 增強版搜索組件，集成高級語義分析、上下文感知和智能建議功能
 * 提供下一代搜索體驗，包括實時建議、結果增強、分析洞察和個性化推薦
 *
 * 【主要職責】
 * • 智能查詢建議 - 實時搜索建議和查詢補全
 * • 語義搜索增強 - 深度語義理解和意圖識別
 * • 上下文感知搜索 - 基於用戶上下文的個性化搜索
 * • 結果增強顯示 - 智能摘要、關係和行動建議
 * • 搜索分析洞察 - 實時搜索分析和用戶洞察
 * • 多輪對話支援 - 連續搜索會話和指代消解
 * • 即時反饋收集 - 用戶滿意度和搜索效果追蹤
 * • 個性化體驗 - 基於用戶偏好的搜索優化
 *
 * 【新增功能】
 * • GPT-4語義理解 - 複雜查詢的深度分析
 * • 實時搜索建議 - 智能查詢補全和相關建議
 * • 結果集群分析 - 自動分組和主題識別
 * • 搜索洞察報告 - 即時分析和改進建議
 * • 上下文記憶 - 會話級別的搜索上下文保持
 * • 多維度評分 - 質量、相關性、個性化綜合評分
 * • 智能行動建議 - 基於結果的下一步建議
 * • 實時性能監控 - 搜索性能和用戶體驗追蹤
 *
 * 【相關檔案】
 * • 語義處理: lib/search/semantic-query-processor.ts
 * • 結果增強: lib/search/contextual-result-enhancer.ts
 * • 搜索分析: lib/search/search-analytics.ts
 * • 搜索建議: lib/search/search-suggestions.ts
 *
 * Week 6 開發階段 - Task 6.4: 搜索介面優化和用戶體驗
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  TagIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
  UserIcon,
  BookOpenIcon,
  ShareIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

// 導入新的Week 6功能
import { analyzeSemanticQuery, processConversationalQuery, SemanticAnalysis, ConversationContext } from '@/lib/search/semantic-query-processor'
import { enhanceSearchResults, EnhancedSearchResult, ResultCluster, SearchInsightReport } from '@/lib/search/contextual-result-enhancer'
import { getSearchSuggestionService } from '@/lib/search/search-suggestions'
import { recordSearchEvent, SearchEventType } from '@/lib/search/search-analytics'

// 基礎搜索結果介面（來自原組件）
interface BaseSearchResult {
  id: number
  title: string
  category: string
  content?: string
  search_score: number
  search_type: 'text' | 'semantic' | 'hybrid'
  created_at: string
  updated_at: string
  creator?: {
    first_name: string
    last_name: string
  }
  tags: Array<{
    id: number
    name: string
    color?: string
  }>
  best_chunk?: {
    id: number
    content: string
    chunk_index: number
    similarity_score?: number
  }
}

// 增強版搜索狀態
interface EnhancedSearchState {
  // 基礎搜索
  query: string
  results: BaseSearchResult[]
  loading: boolean
  error: string | null
  searchType: 'text' | 'semantic' | 'hybrid'
  showAdvanced: boolean
  category?: string
  tags: string[]
  hasSearched: boolean

  // Week 6 增強功能
  sessionId: string
  suggestions: string[]
  suggestionsLoading: boolean
  enhancedResults: EnhancedSearchResult[]
  clusters: ResultCluster[]
  insights: SearchInsightReport | null
  semanticAnalysis: SemanticAnalysis | null
  conversationContext: ConversationContext | null
  showInsights: boolean
  showClusters: boolean
  userFeedback: { [resultId: number]: number } // 1-5 評分
  searchHistory: Array<{ query: string; timestamp: Date }>
  currentView: 'list' | 'clusters' | 'insights'
}

// 建議項目介面
interface SuggestionItem {
  text: string
  type: 'completion' | 'related' | 'popular' | 'correction'
  score: number
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

const searchTypeLabels = {
  text: '文本搜索',
  semantic: '語義搜索',
  hybrid: '混合搜索'
}

const searchTypeDescriptions = {
  text: '根據關鍵字匹配標題、內容和標籤',
  semantic: '基於AI理解的語義相似性搜索，支援複雜語義分析',
  hybrid: '結合文本匹配、語義理解和GPT-4分析的智能搜索'
}

export function EnhancedKnowledgeSearch() {
  const router = useRouter()
  const [search, setSearch] = useState<EnhancedSearchState>({
    // 基礎狀態
    query: '',
    results: [],
    loading: false,
    error: null,
    searchType: 'hybrid',
    showAdvanced: false,
    category: '',
    tags: [],
    hasSearched: false,

    // 增強狀態
    sessionId: generateSessionId(),
    suggestions: [],
    suggestionsLoading: false,
    enhancedResults: [],
    clusters: [],
    insights: null,
    semanticAnalysis: null,
    conversationContext: null,
    showInsights: false,
    showClusters: false,
    userFeedback: {},
    searchHistory: [],
    currentView: 'list'
  })

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionService = getSearchSuggestionService()

  // 防抖動處理
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // 初始化搜索會話
    recordSearchEvent('session_started', {
      sessionId: search.sessionId,
      metadata: { startTime: new Date() }
    })

    // 聚焦搜索框
    searchInputRef.current?.focus()

    return () => {
      // 清理會話
      if (search.sessionId) {
        recordSearchEvent('session_ended', {
          sessionId: search.sessionId,
          metadata: {
            endTime: new Date(),
            queriesCount: search.searchHistory.length
          }
        })
      }
    }
  }, [])

  // 實時搜索建議
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearch(prev => ({ ...prev, suggestions: [] }))
      return
    }

    setSearch(prev => ({ ...prev, suggestionsLoading: true }))

    try {
      const suggestions = await suggestionService.getAutoComplete(query, {
        limit: 5,
        includePopular: true
      })

      setSearch(prev => ({
        ...prev,
        suggestions,
        suggestionsLoading: false
      }))
    } catch (error) {
      console.error('獲取搜索建議失敗:', error)
      setSearch(prev => ({
        ...prev,
        suggestions: [],
        suggestionsLoading: false
      }))
    }
  }, [suggestionService])

  // 處理查詢輸入變化
  const handleQueryChange = (value: string) => {
    setSearch(prev => ({ ...prev, query: value }))

    // 防抖動獲取建議
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  // 執行增強搜索
  const performEnhancedSearch = async () => {
    if (!search.query.trim()) return

    const startTime = Date.now()

    setSearch(prev => ({
      ...prev,
      loading: true,
      error: null,
      hasSearched: true,
      suggestions: [] // 清除建議
    }))

    try {
      // 記錄搜索開始事件
      await recordSearchEvent('search_initiated', {
        sessionId: search.sessionId,
        queryData: {
          originalQuery: search.query,
          queryIntent: search.searchType,
          queryComplexity: 'moderate'
        },
        contextData: {
          searchType: search.searchType,
          category: search.category,
          tags: search.tags
        }
      })

      // 1. 語義分析（如果是語義或混合搜索）
      let semanticAnalysis: SemanticAnalysis | null = null
      if (search.searchType === 'semantic' || search.searchType === 'hybrid') {
        try {
          // 構建對話上下文
          const conversationContext: ConversationContext = {
            conversationId: search.sessionId,
            previousQueries: search.searchHistory.map(h => ({
              query: h.query,
              timestamp: h.timestamp,
              results: []
            })),
            userProfile: {
              role: '知識工作者', // 可以從用戶設定獲取
              department: '一般',
              experienceLevel: 'intermediate'
            }
          }

          if (search.searchHistory.length > 0) {
            // 處理多輪對話
            const conversationalResult = await processConversationalQuery(
              search.query,
              conversationContext
            )
            semanticAnalysis = conversationalResult.analysis

            // 如果查詢被解析，更新顯示
            if (conversationalResult.resolvedQuery !== search.query) {
              setSearch(prev => ({
                ...prev,
                query: conversationalResult.resolvedQuery
              }))
            }
          } else {
            // 單次查詢分析
            semanticAnalysis = await analyzeSemanticQuery(search.query, conversationContext)
          }

          setSearch(prev => ({
            ...prev,
            semanticAnalysis,
            conversationContext
          }))
        } catch (error) {
          console.warn('語義分析失敗，使用基礎搜索:', error)
        }
      }

      // 2. 執行基礎搜索
      const searchData = {
        query: search.query.trim(),
        type: search.searchType,
        category: search.category || undefined,
        tags: search.tags.length > 0 ? search.tags : undefined,
        limit: 20,
        similarity_threshold: 0.6,
        include_chunks: true
      }

      const response = await fetch('/api/knowledge-base/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(searchData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '搜索失敗')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '搜索失敗')
      }

      const baseResults = result.data || []

      // 3. 結果增強（如果有語義分析）
      let enhancedResults: EnhancedSearchResult[] = []
      let clusters: ResultCluster[] = []
      let insights: SearchInsightReport | null = null

      if (semanticAnalysis && baseResults.length > 0) {
        try {
          // 轉換結果格式以適配增強器
          const searchResults = baseResults.map((r: BaseSearchResult) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            similarity: r.search_score,
            relevanceScore: r.search_score,
            category: r.category as any,
            status: 'PUBLISHED' as any,
            author: r.creator ? `${r.creator.first_name} ${r.creator.last_name}` : null,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
            tags: r.tags,
            bestChunk: r.best_chunk ? {
              id: r.best_chunk.id,
              content: r.best_chunk.content,
              chunkIndex: r.best_chunk.chunk_index,
              similarityScore: r.best_chunk.similarity_score || r.search_score
            } : undefined
          }))

          const enhancementResult = await enhanceSearchResults(
            searchResults,
            semanticAnalysis,
            search.conversationContext || undefined
          )

          enhancedResults = enhancementResult.enhancedResults
          clusters = enhancementResult.clusters
          insights = enhancementResult.insights

        } catch (error) {
          console.warn('結果增強失敗，使用基礎結果:', error)
          enhancedResults = []
        }
      }

      // 4. 更新搜索歷史
      const newHistoryEntry = {
        query: search.query,
        timestamp: new Date()
      }

      const processingTime = Date.now() - startTime

      // 5. 記錄搜索完成事件
      await recordSearchEvent('search_completed', {
        sessionId: search.sessionId,
        queryData: {
          originalQuery: search.query,
          processedQuery: semanticAnalysis?.queryUnderstanding.processedQuery,
          queryIntent: semanticAnalysis?.queryUnderstanding.mainIntent,
          queryComplexity: semanticAnalysis?.queryUnderstanding.complexity
        },
        resultData: {
          totalResults: baseResults.length
        },
        performanceData: {
          processingTime,
          totalTime: processingTime,
          cacheHit: false,
          errorOccurred: false
        }
      })

      // 6. 更新狀態
      setSearch(prev => ({
        ...prev,
        results: baseResults,
        enhancedResults,
        clusters,
        insights,
        loading: false,
        searchHistory: [newHistoryEntry, ...prev.searchHistory.slice(0, 9)] // 保留最近10次搜索
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索出現錯誤'

      // 記錄錯誤事件
      await recordSearchEvent('search_completed', {
        sessionId: search.sessionId,
        queryData: {
          originalQuery: search.query
        },
        performanceData: {
          processingTime: Date.now() - startTime,
          errorOccurred: true,
          errorMessage
        }
      })

      setSearch(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        results: []
      }))
    }
  }

  // 處理搜索表單提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performEnhancedSearch()
  }

  // 處理建議點擊
  const handleSuggestionClick = (suggestion: string) => {
    setSearch(prev => ({
      ...prev,
      query: suggestion,
      suggestions: []
    }))

    // 記錄建議點擊事件
    recordSearchEvent('suggestion_clicked', {
      sessionId: search.sessionId,
      queryData: {
        originalQuery: suggestion
      },
      metadata: {
        suggestionType: 'auto_complete'
      }
    })

    // 自動執行搜索
    setTimeout(() => {
      performEnhancedSearch()
    }, 100)
  }

  // 處理結果點擊
  const handleResultClick = (result: BaseSearchResult, position: number) => {
    // 記錄點擊事件
    recordSearchEvent('result_clicked', {
      sessionId: search.sessionId,
      queryData: {
        originalQuery: search.query
      },
      resultData: {
        resultId: result.id,
        resultTitle: result.title,
        resultPosition: position,
        resultSimilarity: result.search_score
      }
    })

    router.push(`/dashboard/knowledge/${result.id}`)
  }

  // 處理用戶反饋
  const handleFeedback = async (resultId: number, rating: number) => {
    setSearch(prev => ({
      ...prev,
      userFeedback: { ...prev.userFeedback, [resultId]: rating }
    }))

    // 記錄反饋事件
    await recordSearchEvent('feedback_provided', {
      sessionId: search.sessionId,
      resultData: {
        resultId
      },
      feedbackData: {
        satisfaction: rating,
        helpfulness: rating
      }
    })
  }

  // 清除搜索
  const clearSearch = () => {
    setSearch(prev => ({
      ...prev,
      query: '',
      results: [],
      enhancedResults: [],
      clusters: [],
      insights: null,
      semanticAnalysis: null,
      loading: false,
      error: null,
      searchType: 'hybrid',
      showAdvanced: false,
      category: '',
      tags: [],
      hasSearched: false,
      suggestions: [],
      currentView: 'list'
    }))
    searchInputRef.current?.focus()
  }

  // 切換視圖
  const handleViewChange = (view: 'list' | 'clusters' | 'insights') => {
    setSearch(prev => ({ ...prev, currentView: view }))
  }

  // 工具函數
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW')
  }

  const highlightText = (text: string, query: string) => {
    if (!query || search.searchType === 'semantic') return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'semantic':
        return <SparklesIcon className="h-4 w-4" />
      case 'hybrid':
        return <SparklesIcon className="h-4 w-4" />
      default:
        return <DocumentTextIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 增強搜索表單 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* 主搜索欄 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="智能搜索知識庫... 支援自然語言查詢、多輪對話和語義理解"
                value={search.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={search.loading}
                autoComplete="off"
              />

              {/* 實時建議下拉 */}
              {search.suggestions.length > 0 && search.query && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {search.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      <span dangerouslySetInnerHTML={{
                        __html: highlightText(suggestion, search.query)
                      }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={search.loading || !search.query.trim()}
              className="px-6 py-3"
            >
              {search.loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  分析中...
                </div>
              ) : (
                '智能搜索'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setSearch(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
              className="px-4"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* 搜索類型選擇 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">搜索模式：</span>
            {Object.entries(searchTypeLabels).map(([type, label]) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value={type}
                  checked={search.searchType === type}
                  onChange={(e) => setSearch(prev => ({ ...prev, searchType: e.target.value as any }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  {getSearchTypeIcon(type)}
                  {label}
                </span>
              </label>
            ))}
          </div>

          {/* 高級選項 */}
          {search.showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* 類別篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  限制類別
                </label>
                <select
                  value={search.category}
                  onChange={(e) => setSearch(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 標籤篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  標籤篩選
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {search.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setSearch(prev => ({
                          ...prev,
                          tags: prev.tags.filter(t => t !== tag)
                        }))}
                        className="ml-1 h-3 w-3 flex items-center justify-center hover:bg-blue-200 rounded-full"
                      >
                        <XMarkIcon className="h-2 w-2" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="輸入標籤名稱後按Enter"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const tagName = e.currentTarget.value.trim()
                      if (tagName && !search.tags.includes(tagName)) {
                        setSearch(prev => ({
                          ...prev,
                          tags: [...prev.tags, tagName]
                        }))
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* 搜索類型說明 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <strong>{searchTypeLabels[search.searchType]}：</strong>
            {searchTypeDescriptions[search.searchType]}
          </div>
        </form>

        {/* 語義分析顯示 */}
        {search.semanticAnalysis && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <SparklesIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  AI 查詢理解
                </div>
                <div className="text-sm text-blue-800">
                  <strong>主要意圖：</strong>{search.semanticAnalysis.queryUnderstanding.mainIntent}
                  {search.semanticAnalysis.queryUnderstanding.businessContext && (
                    <>
                      <span className="mx-2">•</span>
                      <strong>業務場景：</strong>{search.semanticAnalysis.queryUnderstanding.businessContext}
                    </>
                  )}
                  <span className="mx-2">•</span>
                  <strong>複雜度：</strong>{search.semanticAnalysis.queryUnderstanding.complexity}
                  <span className="mx-2">•</span>
                  <strong>置信度：</strong>{Math.round(search.semanticAnalysis.queryUnderstanding.confidence * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 清除按鈕 */}
        {(search.query || search.hasSearched) && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={clearSearch} size="sm">
              <XMarkIcon className="h-4 w-4 mr-2" />
              清除搜索
            </Button>
          </div>
        )}
      </div>

      {/* 搜索結果區域 */}
      {search.hasSearched && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* 結果標題和視圖切換 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                搜索結果
                {search.results.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    共 {search.results.length} 個結果
                  </span>
                )}
              </h2>

              {/* 視圖切換 */}
              {search.results.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      className={`px-3 py-1 text-sm flex items-center gap-1 ${
                        search.currentView === 'list'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleViewChange('list')}
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      列表
                    </button>
                    {search.clusters.length > 0 && (
                      <button
                        className={`px-3 py-1 text-sm flex items-center gap-1 border-l border-gray-300 ${
                          search.currentView === 'clusters'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleViewChange('clusters')}
                      >
                        <TagIcon className="h-4 w-4" />
                        主題 ({search.clusters.length})
                      </button>
                    )}
                    {search.insights && (
                      <button
                        className={`px-3 py-1 text-sm flex items-center gap-1 border-l border-gray-300 ${
                          search.currentView === 'insights'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleViewChange('insights')}
                      >
                        <ChartBarIcon className="h-4 w-4" />
                        洞察
                      </button>
                    )}
                  </div>

                  {search.results.length > 0 && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {getSearchTypeIcon(search.searchType)}
                      {searchTypeLabels[search.searchType]}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 錯誤狀態 */}
          {search.error && (
            <div className="p-6">
              <div className="flex items-center text-red-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span>{search.error}</span>
              </div>
            </div>
          )}

          {/* 載入狀態 */}
          {search.loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">正在執行智能搜索分析...</span>
            </div>
          )}

          {/* 空結果 */}
          {!search.loading && !search.error && search.results.length === 0 && search.hasSearched && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相關結果</h3>
              <p className="text-gray-500 mb-4">
                嘗試使用不同的關鍵字、調整搜索模式或使用自然語言描述您的需求
              </p>
              {search.semanticAnalysis?.recommendations.queryOptimizations && (
                <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">AI建議：</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {search.semanticAnalysis.recommendations.queryOptimizations.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 結果內容渲染 */}
          {search.results.length > 0 && (
            <div className="min-h-[400px]">
              {/* 列表視圖 */}
              {search.currentView === 'list' && (
                <ResultsListView
                  results={search.results}
                  enhancedResults={search.enhancedResults}
                  query={search.query}
                  searchType={search.searchType}
                  userFeedback={search.userFeedback}
                  onResultClick={handleResultClick}
                  onFeedback={handleFeedback}
                  highlightText={highlightText}
                  formatDate={formatDate}
                />
              )}

              {/* 集群視圖 */}
              {search.currentView === 'clusters' && search.clusters.length > 0 && (
                <ClustersView
                  clusters={search.clusters}
                  onResultClick={handleResultClick}
                />
              )}

              {/* 洞察視圖 */}
              {search.currentView === 'insights' && search.insights && (
                <InsightsView
                  insights={search.insights}
                  semanticAnalysis={search.semanticAnalysis}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 結果列表視圖組件
function ResultsListView({
  results,
  enhancedResults,
  query,
  searchType,
  userFeedback,
  onResultClick,
  onFeedback,
  highlightText,
  formatDate
}: {
  results: BaseSearchResult[]
  enhancedResults: EnhancedSearchResult[]
  query: string
  searchType: string
  userFeedback: { [resultId: number]: number }
  onResultClick: (result: BaseSearchResult, position: number) => void
  onFeedback: (resultId: number, rating: number) => void
  highlightText: (text: string, query: string) => string
  formatDate: (dateString: string) => string
}) {
  return (
    <div className="divide-y divide-gray-200">
      {results.map((result, index) => {
        const enhanced = enhancedResults.find(er => er.baseResult.id === result.id)

        return (
          <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* 標題和分數 */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 flex-1">
                    <button
                      onClick={() => onResultClick(result, index)}
                      className="text-left hover:underline w-full"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(result.title, query)
                      }}
                    />
                  </h3>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.search_type === 'semantic' ? 'bg-purple-100 text-purple-800' :
                      result.search_type === 'hybrid' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      {Math.round(result.search_score * 100)}% 相符
                    </span>
                  </div>
                </div>

                {/* 增強摘要 */}
                {enhanced?.enhancement.intelligentSummary && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                    <div className="text-sm text-blue-900 font-medium mb-1">
                      AI 智能摘要：
                    </div>
                    <p className="text-sm text-blue-800 mb-2">
                      {enhanced.enhancement.intelligentSummary.mainTheme}
                    </p>
                    <div className="text-xs text-blue-700">
                      <strong>關鍵要點：</strong>
                      {enhanced.enhancement.intelligentSummary.keyPoints.slice(0, 2).join('、')}
                    </div>
                  </div>
                )}

                {/* 最佳分塊內容 */}
                {result.best_chunk && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md border-l-4 border-gray-400">
                    <div className="text-sm text-gray-600 mb-1">
                      最相關內容 (分塊 #{result.best_chunk.chunk_index + 1}):
                    </div>
                    <p className="text-sm text-gray-800"
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 3,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden'
                       }}
                       dangerouslySetInnerHTML={{
                         __html: highlightText(result.best_chunk.content, query)
                       }}
                    />
                  </div>
                )}

                {/* 行動建議 */}
                {enhanced?.enhancement.actionRecommendations && enhanced.enhancement.actionRecommendations.length > 0 && (
                  <div className="mb-3 p-3 bg-green-50 rounded-md border-l-4 border-green-500">
                    <div className="text-sm text-green-900 font-medium mb-1">
                      建議行動：
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enhanced.enhancement.actionRecommendations.slice(0, 2).map((action, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {action.action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 文檔元信息 */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>{formatDate(result.updated_at)}</span>
                  </div>
                  {result.creator && (
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      <span>{result.creator.first_name} {result.creator.last_name}</span>
                    </div>
                  )}
                  {result.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      <div className="flex gap-1">
                        {result.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                              color: tag.color || '#374151'
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{result.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 用戶反饋 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>這個結果對您有幫助嗎？</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => onFeedback(result.id, rating)}
                          className={`w-4 h-4 rounded-full border ${
                            userFeedback[result.id] >= rating
                              ? 'bg-yellow-400 border-yellow-400'
                              : 'border-gray-300 hover:border-yellow-400'
                          }`}
                        >
                          <span className="sr-only">{rating} 星</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 快速操作 */}
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <BookmarkIcon className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <ShareIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 集群視圖組件
function ClustersView({
  clusters,
  onResultClick
}: {
  clusters: ResultCluster[]
  onResultClick: (result: BaseSearchResult, position: number) => void
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        搜索結果已自動分組為 {clusters.length} 個主題，幫助您更好地理解內容結構
      </div>

      {clusters.map((cluster) => (
        <div key={cluster.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{cluster.theme}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{cluster.results.length} 個文檔</span>
                <span>重要性: {Math.round(cluster.importance * 100)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{cluster.description}</p>
          </div>

          <div className="divide-y divide-gray-200">
            {cluster.results.slice(0, 3).map((enhanced, index) => (
              <div key={enhanced.baseResult.id} className="p-4 hover:bg-gray-50">
                <button
                  onClick={() => onResultClick(enhanced.baseResult as any, index)}
                  className="text-left w-full"
                >
                  <h4 className="font-medium text-gray-900 hover:text-blue-600 mb-1">
                    {enhanced.baseResult.title}
                  </h4>
                  {enhanced.enhancement.intelligentSummary && (
                    <p className="text-sm text-gray-600">
                      {enhanced.enhancement.intelligentSummary.mainTheme}
                    </p>
                  )}
                </button>
              </div>
            ))}

            {cluster.results.length > 3 && (
              <div className="p-4 text-center">
                <span className="text-sm text-gray-500">
                  還有 {cluster.results.length - 3} 個文檔...
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// 洞察視圖組件
function InsightsView({
  insights,
  semanticAnalysis
}: {
  insights: SearchInsightReport
  semanticAnalysis: SemanticAnalysis | null
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 結果分析 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            結果分析
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">總結果數:</span>
              <span className="text-blue-900 font-medium">{insights.resultAnalysis.totalResults}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">高質量結果:</span>
              <span className="text-blue-900 font-medium">{insights.resultAnalysis.qualityDistribution.high}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">冗餘程度:</span>
              <span className="text-blue-900 font-medium">{Math.round(insights.resultAnalysis.redundancyLevel * 100)}%</span>
            </div>
          </div>
        </div>

        {/* 用戶洞察 */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            用戶洞察
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-green-700">專業水平:</span>
              <span className="text-green-900 font-medium ml-2">{insights.userInsights.expertiseLevel}</span>
            </div>
            <div>
              <span className="text-green-700">推薦重點:</span>
              <div className="mt-1">
                {insights.userInsights.recommendedFocus.slice(0, 2).map((focus, index) => (
                  <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                    {focus}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 業務洞察 */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5" />
            業務洞察
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-purple-700">潛在影響:</span>
              <span className="text-purple-900 font-medium ml-2">{insights.businessInsights.potentialImpact}</span>
            </div>
            <div>
              <span className="text-purple-700">實施時間:</span>
              <span className="text-purple-900 font-medium ml-2">{insights.businessInsights.timeToImplement}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 改進建議 */}
      {insights.improvements && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5" />
            改進建議
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.improvements.queryOptimizations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-2">查詢優化:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {insights.improvements.queryOptimizations.slice(0, 3).map((opt, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.improvements.userExperience.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-2">體驗改進:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {insights.improvements.userExperience.slice(0, 3).map((imp, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      <span>{imp.improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 語義分析詳情 */}
      {semanticAnalysis && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            語義分析詳情
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-indigo-800 mb-2">用戶意圖:</h4>
              <div className="space-y-1 text-indigo-700">
                <div><strong>主要目標:</strong> {semanticAnalysis.userIntent.primaryGoal}</div>
                <div><strong>緊急程度:</strong> {semanticAnalysis.userIntent.urgencyLevel}</div>
                <div><strong>領域上下文:</strong> {semanticAnalysis.userIntent.domainContext}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-indigo-800 mb-2">搜索策略:</h4>
              <div className="space-y-1 text-indigo-700">
                <div><strong>推薦類型:</strong> {semanticAnalysis.searchStrategy.recommendedSearchType}</div>
                <div><strong>優先領域:</strong> {semanticAnalysis.searchStrategy.priorityAreas.join(', ')}</div>
                <div><strong>預估結果:</strong> {semanticAnalysis.searchStrategy.estimatedResultCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 工具函數
function generateSessionId(): string {
  return `search_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}