'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  TagIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface SearchResult {
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
  relevant_chunks?: Array<{
    id: number
    content: string
    chunk_index: number
  }>
}

interface SearchState {
  query: string
  results: SearchResult[]
  loading: boolean
  error: string | null
  searchType: 'text' | 'semantic' | 'hybrid'
  showAdvanced: boolean
  category?: string
  tags: string[]
  hasSearched: boolean
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
  semantic: '基於AI理解的語義相似性搜索',
  hybrid: '結合文本匹配和語義理解的智能搜索'
}

export function KnowledgeSearch() {
  const router = useRouter()
  const [search, setSearch] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    searchType: 'hybrid',
    showAdvanced: false,
    category: '',
    tags: [],
    hasSearched: false
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 聚焦搜索框
    searchInputRef.current?.focus()
  }, [])

  const performSearch = async () => {
    if (!search.query.trim()) {
      return
    }

    setSearch(prev => ({ ...prev, loading: true, error: null, hasSearched: true }))

    try {
      const searchData = {
        query: search.query.trim(),
        type: search.searchType,
        category: search.category || undefined,
        tags: search.tags.length > 0 ? search.tags : undefined,
        limit: 20,
        similarity_threshold: 0.6, // 較低的閾值以獲得更多結果
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
      if (result.success) {
        setSearch(prev => ({
          ...prev,
          results: result.data || [],
          loading: false
        }))
      } else {
        throw new Error(result.error || '搜索失敗')
      }
    } catch (error) {
      setSearch(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '搜索出現錯誤',
        loading: false,
        results: []
      }))
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const clearSearch = () => {
    setSearch({
      query: '',
      results: [],
      loading: false,
      error: null,
      searchType: 'hybrid',
      showAdvanced: false,
      category: '',
      tags: [],
      hasSearched: false
    })
    searchInputRef.current?.focus()
  }

  const addTag = (tagName: string) => {
    if (tagName.trim() && !search.tags.includes(tagName.trim())) {
      setSearch(prev => ({
        ...prev,
        tags: [...prev.tags, tagName.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSearch(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 搜索表單 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* 主搜索欄 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索知識庫文檔... 例如：產品規格、銷售策略、技術文檔"
                value={search.query}
                onChange={(e) => setSearch(prev => ({ ...prev, query: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={search.loading}
              />
            </div>
            <Button
              type="submit"
              disabled={search.loading || !search.query.trim()}
              className="px-6 py-3"
            >
              {search.loading ? '搜索中...' : '搜索'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearch(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
              className="px-4"
            >
              <Cog6ToothIcon className="h-4 w-4" />
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
                        onClick={() => removeTag(tag)}
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
                      addTag(e.currentTarget.value)
                      e.currentTarget.value = ''
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

      {/* 搜索結果 */}
      {search.hasSearched && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* 結果標題 */}
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
              {search.results.length > 0 && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  {getSearchTypeIcon(search.searchType)}
                  {searchTypeLabels[search.searchType]}
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
              <span className="text-gray-600">搜索中...</span>
            </div>
          )}

          {/* 空結果 */}
          {!search.loading && !search.error && search.results.length === 0 && search.hasSearched && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相關結果</h3>
              <p className="text-gray-500 mb-4">
                嘗試使用不同的關鍵字或調整搜索模式
              </p>
            </div>
          )}

          {/* 搜索結果列表 */}
          {search.results.length > 0 && (
            <div className="divide-y divide-gray-200">
              {search.results.map((result, index) => (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* 標題和分數 */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                          <button
                            onClick={() => router.push(`/dashboard/knowledge/${result.id}`)}
                            className="text-left hover:underline"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(result.title, search.query)
                            }}
                          />
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.search_type === 'semantic' ? 'bg-purple-100 text-purple-800' :
                            result.search_type === 'hybrid' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getSearchTypeIcon(result.search_type)}
                            <span className="ml-1">
                              {Math.round(result.search_score * 100)}% 相符
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* 最佳分塊內容 */}
                      {result.best_chunk && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
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
                               __html: highlightText(result.best_chunk.content, search.query)
                             }}
                          />
                        </div>
                      )}

                      {/* 文檔元信息 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDate(result.updated_at)}</span>
                        </div>
                        {result.creator && (
                          <div className="flex items-center gap-1">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}