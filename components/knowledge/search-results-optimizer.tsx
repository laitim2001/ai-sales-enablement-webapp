/**
 * @fileoverview ================================================================AI銷售賦能平台 - 搜索結果優化器組件================================================================【組件功能】提供強大的搜索結果優化功能，包括多維度排序、分面過濾、結果高亮、以及智能結果分組。【主要特性】• 多維度排序 - 相關性/時間/熱度/評分/字母• 分面過濾 - 按分類/標籤/作者/狀態快速篩選• 結果高亮 - 關鍵字高亮顯示• 結果分組 - 按分類/日期智能分組• 視圖切換 - 列表/卡片/緊湊視圖@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 2
 * @module components/knowledge/search-results-optimizer
 * @description
 * ================================================================AI銷售賦能平台 - 搜索結果優化器組件================================================================【組件功能】提供強大的搜索結果優化功能，包括多維度排序、分面過濾、結果高亮、以及智能結果分組。【主要特性】• 多維度排序 - 相關性/時間/熱度/評分/字母• 分面過濾 - 按分類/標籤/作者/狀態快速篩選• 結果高亮 - 關鍵字高亮顯示• 結果分組 - 按分類/日期智能分組• 視圖切換 - 列表/卡片/緊湊視圖@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import { useState, useMemo } from 'react';
import {
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * 搜索結果介面
 */
export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: string;
  created_at: string;
  updated_at: string;
  relevance_score?: number;
  view_count?: number;
  download_count?: number;
}

/**
 * 排序選項
 */
export type SortOption =
  | 'relevance'      // 相關性（預設）
  | 'date_desc'      // 最新優先
  | 'date_asc'       // 最舊優先
  | 'title_asc'      // 標題 A-Z
  | 'title_desc'     // 標題 Z-A
  | 'popularity'     // 熱門度（查看次數）
  | 'downloads';     // 下載次數

/**
 * 視圖模式
 */
export type ViewMode = 'list' | 'grid' | 'compact';

/**
 * 分面過濾器
 */
export interface FacetFilters {
  categories: string[];
  tags: string[];
  authors: string[];
  statuses: string[];
}

/**
 * 組件屬性
 */
interface SearchResultsOptimizerProps {
  results: SearchResult[];
  searchQuery?: string;
  onResultClick?: (result: SearchResult) => void;
  showFacets?: boolean;
  defaultSortBy?: SortOption;
  defaultViewMode?: ViewMode;
}

/**
 * 搜索結果優化器組件
 */
export function SearchResultsOptimizer({
  results,
  searchQuery = '',
  onResultClick,
  showFacets = true,
  defaultSortBy = 'relevance',
  defaultViewMode = 'list'
}: SearchResultsOptimizerProps) {
  // 狀態管理
  const [sortBy, setSortBy] = useState<SortOption>(defaultSortBy);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [selectedFacets, setSelectedFacets] = useState<FacetFilters>({
    categories: [],
    tags: [],
    authors: [],
    statuses: []
  });
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'date'>('none');
  const [showFilters, setShowFilters] = useState(true);

  /**
   * 計算可用的分面選項
   */
  const facetOptions = useMemo(() => {
    const categories = new Set<string>();
    const tags = new Set<string>();
    const authors = new Set<string>();
    const statuses = new Set<string>();

    results.forEach(result => {
      if (result.category) categories.add(result.category);
      if (result.tags) result.tags.forEach(tag => tags.add(tag));
      if (result.author) authors.add(result.author);
      if (result.status) statuses.add(result.status);
    });

    return {
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      authors: Array.from(authors).sort(),
      statuses: Array.from(statuses).sort()
    };
  }, [results]);

  /**
   * 過濾結果（分面過濾）
   */
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // 分類過濾
      if (selectedFacets.categories.length > 0 &&
          !selectedFacets.categories.includes(result.category)) {
        return false;
      }

      // 標籤過濾
      if (selectedFacets.tags.length > 0) {
        const hasMatchingTag = result.tags?.some(tag =>
          selectedFacets.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // 作者過濾
      if (selectedFacets.authors.length > 0 &&
          !selectedFacets.authors.includes(result.author)) {
        return false;
      }

      // 狀態過濾
      if (selectedFacets.statuses.length > 0 &&
          !selectedFacets.statuses.includes(result.status)) {
        return false;
      }

      return true;
    });
  }, [results, selectedFacets]);

  /**
   * 排序結果
   */
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];

    switch (sortBy) {
      case 'relevance':
        sorted.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
        break;

      case 'date_desc':
        sorted.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        break;

      case 'date_asc':
        sorted.sort((a, b) =>
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        );
        break;

      case 'title_asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case 'title_desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;

      case 'popularity':
        sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;

      case 'downloads':
        sorted.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        break;
    }

    return sorted;
  }, [filteredResults, sortBy]);

  /**
   * 分組結果
   */
  const groupedResults = useMemo(() => {
    if (groupBy === 'none') {
      return { '所有結果': sortedResults };
    }

    const groups: Record<string, SearchResult[]> = {};

    sortedResults.forEach(result => {
      let key: string;

      if (groupBy === 'category') {
        key = result.category || '未分類';
      } else if (groupBy === 'date') {
        const date = new Date(result.updated_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
          key = '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
          key = '昨天';
        } else if (date > new Date(today.setDate(today.getDate() - 7))) {
          key = '本週';
        } else if (date > new Date(today.setDate(today.getDate() - 30))) {
          key = '本月';
        } else {
          key = '更早';
        }
      } else {
        key = '所有結果';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
    });

    return groups;
  }, [sortedResults, groupBy]);

  /**
   * 切換分面過濾器
   */
  const toggleFacet = (type: keyof FacetFilters, value: string) => {
    setSelectedFacets(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      return { ...prev, [type]: updated };
    });
  };

  /**
   * 清空所有過濾器
   */
  const clearAllFilters = () => {
    setSelectedFacets({
      categories: [],
      tags: [],
      authors: [],
      statuses: []
    });
  };

  /**
   * 高亮搜索關鍵字
   */
  const highlightText = (text: string, query: string): JSX.Element => {
    if (!query.trim()) {
      return <span>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 font-semibold">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  /**
   * 渲染單個結果（列表視圖）
   */
  const renderListItem = (result: SearchResult) => (
    <div
      key={result.id}
      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onResultClick?.(result)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 hover:text-indigo-600">
            {highlightText(result.title, searchQuery)}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {highlightText(result.content.substring(0, 200), searchQuery)}...
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
              {result.category}
            </span>
            <span>作者：{result.author}</span>
            <span>更新：{formatDate(result.updated_at)}</span>
            {result.view_count !== undefined && (
              <span>查看：{result.view_count}次</span>
            )}
          </div>
          {result.tags && result.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {result.relevance_score !== undefined && (
          <div className="ml-4 text-right">
            <div className="text-sm font-medium text-indigo-600">
              {Math.round(result.relevance_score * 100)}%
            </div>
            <div className="text-xs text-gray-500">相關度</div>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * 渲染單個結果（卡片視圖）
   */
  const renderGridItem = (result: SearchResult) => (
    <Card
      key={result.id}
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onResultClick?.(result)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
            {result.category}
          </span>
          {result.relevance_score !== undefined && (
            <span className="text-sm font-medium text-indigo-600">
              {Math.round(result.relevance_score * 100)}%
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 hover:text-indigo-600 mb-2">
          {highlightText(result.title, searchQuery)}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
          {highlightText(result.content.substring(0, 150), searchQuery)}...
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{result.author}</span>
          <span>{formatDate(result.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );

  /**
   * 渲染單個結果（緊湊視圖）
   */
  const renderCompactItem = (result: SearchResult) => (
    <div
      key={result.id}
      className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
      onClick={() => onResultClick?.(result)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 hover:text-indigo-600">
            {highlightText(result.title, searchQuery)}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-gray-100 rounded">{result.category}</span>
            <span>{result.author}</span>
            <span>{formatDate(result.updated_at)}</span>
          </div>
        </div>
        {result.relevance_score !== undefined && (
          <span className="text-sm font-medium text-indigo-600 ml-4">
            {Math.round(result.relevance_score * 100)}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 工具欄 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          {/* 排序選擇 */}
          <div className="flex items-center gap-2">
            <ArrowsUpDownIcon className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="relevance">相關性</option>
              <option value="date_desc">最新優先</option>
              <option value="date_asc">最舊優先</option>
              <option value="title_asc">標題 A-Z</option>
              <option value="title_desc">標題 Z-A</option>
              <option value="popularity">熱門度</option>
              <option value="downloads">下載次數</option>
            </select>
          </div>

          {/* 分組選擇 */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">不分組</option>
              <option value="category">按分類</option>
              <option value="date">按日期</option>
            </select>
          </div>

          {/* 顯示過濾器切換 */}
          {showFacets && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              {showFilters ? '隱藏' : '顯示'}過濾器
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 視圖模式切換 */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="列表視圖"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="卡片視圖"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded ${viewMode === 'compact' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="緊湊視圖"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* 結果計數 */}
          <span className="text-sm text-gray-600">
            {filteredResults.length} 個結果
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 分面過濾器側邊欄 */}
        {showFacets && showFilters && (
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">過濾器</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    清空
                  </Button>
                </div>

                {/* 分類過濾 */}
                {facetOptions.categories.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">分類</h4>
                    <div className="space-y-2">
                      {facetOptions.categories.map(category => (
                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFacets.categories.includes(category)}
                            onChange={() => toggleFacet('categories', category)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-xs text-gray-400">
                            ({results.filter(r => r.category === category).length})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 標籤過濾 */}
                {facetOptions.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">標籤</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {facetOptions.tags.slice(0, 10).map(tag => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFacets.tags.includes(tag)}
                            onChange={() => toggleFacet('tags', tag)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-600">#{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 作者過濾 */}
                {facetOptions.authors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">作者</h4>
                    <div className="space-y-2">
                      {facetOptions.authors.slice(0, 5).map(author => (
                        <label key={author} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFacets.authors.includes(author)}
                            onChange={() => toggleFacet('authors', author)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-600">{author}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 搜索結果主區域 */}
        <div className={showFacets && showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {Object.entries(groupedResults).map(([groupName, groupResults]) => (
            <div key={groupName} className="mb-6">
              {groupBy !== 'none' && (
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {groupName} ({groupResults.length})
                </h2>
              )}

              {viewMode === 'list' && (
                <div className="space-y-4">
                  {groupResults.map(renderListItem)}
                </div>
              )}

              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupResults.map(renderGridItem)}
                </div>
              )}

              {viewMode === 'compact' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {groupResults.map(renderCompactItem)}
                </div>
              )}
            </div>
          ))}

          {filteredResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">未找到符合條件的結果</p>
              <p className="mt-2 text-sm">請嘗試調整搜索條件或過濾器</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
