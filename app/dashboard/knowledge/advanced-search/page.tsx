/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫高級搜索頁面
 * ================================================================
 *
 * 【頁面功能】
 * 提供專業級的高級搜索介面，支援複雜的多條件組合查詢、
 * 搜索結果優化排序、以及搜索歷史管理。
 *
 * 【主要職責】
 * • 高級查詢構建 - 可視化的多條件組合介面
 * • 搜索結果展示 - 優化的結果列表和排序
 * • 歷史管理 - 搜索歷史和常用查詢
 * • 結果導出 - 支援CSV/Excel導出
 *
 * 【頁面結構】
 * • 頁面標題和導航
 * • 高級搜索構建器
 * • 搜索結果列表
 * • 側邊欄（搜索歷史、常用查詢）
 *
 * @author Claude Code
 * @date 2025-10-03
 * @sprint Sprint 6 Week 12 - Advanced Search
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, BookmarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AdvancedSearchBuilder,
  SearchConditionGroup
} from '@/components/knowledge/advanced-search-builder';
import {
  SearchResultsOptimizer,
  SearchResult as OptimizerSearchResult
} from '@/components/knowledge/search-results-optimizer';

/**
 * 搜索結果介面
 */
interface SearchResult {
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
 * 保存的搜索查詢
 */
interface SavedSearch {
  id: string;
  name: string;
  query: SearchConditionGroup;
  created_at: string;
}

/**
 * 高級搜索頁面組件
 */
export default function AdvancedSearchPage() {
  // 狀態管理
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SavedSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [currentQuery, setCurrentQuery] = useState<SearchConditionGroup | null>(null);

  /**
   * 載入搜索歷史和保存的查詢
   */
  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, []);

  /**
   * 從localStorage載入搜索歷史
   */
  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('advanced_search_history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('載入搜索歷史失敗:', error);
    }
  };

  /**
   * 從localStorage載入保存的查詢
   */
  const loadSavedSearches = () => {
    try {
      const saved = localStorage.getItem('saved_searches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('載入保存的查詢失敗:', error);
    }
  };

  /**
   * 保存搜索到歷史
   */
  const saveToHistory = (query: SearchConditionGroup) => {
    const newHistory: SavedSearch = {
      id: Date.now().toString(),
      name: `搜索 - ${new Date().toLocaleString('zh-TW')}`,
      query,
      created_at: new Date().toISOString()
    };

    const updated = [newHistory, ...searchHistory].slice(0, 10); // 只保留最近10次
    setSearchHistory(updated);
    localStorage.setItem('advanced_search_history', JSON.stringify(updated));
  };

  /**
   * 保存當前查詢
   */
  const saveCurrentSearch = () => {
    if (!currentQuery) return;

    const name = prompt('請輸入查詢名稱：');
    if (!name) return;

    const newSaved: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: currentQuery,
      created_at: new Date().toISOString()
    };

    const updated = [...savedSearches, newSaved];
    setSavedSearches(updated);
    localStorage.setItem('saved_searches', JSON.stringify(updated));
  };

  /**
   * 刪除保存的查詢
   */
  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('saved_searches', JSON.stringify(updated));
  };

  /**
   * 執行搜索
   */
  const handleSearch = async (query: SearchConditionGroup) => {
    setIsSearching(true);
    setCurrentQuery(query);

    try {
      // 保存到歷史
      saveToHistory(query);

      // 將查詢轉換為API參數
      const searchParams = convertQueryToParams(query);

      // 調用搜索API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error('搜索失敗');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('搜索錯誤:', error);
      alert('搜索失敗，請稍後重試');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * 清空搜索
   */
  const handleClear = () => {
    setResults([]);
    setCurrentQuery(null);
  };

  /**
   * 載入歷史查詢
   */
  const loadHistoryQuery = (saved: SavedSearch) => {
    // TODO: 實現載入歷史查詢到構建器
    handleSearch(saved.query);
  };

  /**
   * 將查詢轉換為API參數（TODO: 實現完整轉換邏輯）
   */
  const convertQueryToParams = (query: SearchConditionGroup): any => {
    // 簡化版本，實際需要遞歸處理所有條件和組
    return {
      conditions: query.conditions,
      operator: query.operator,
      groups: query.groups
    };
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 頁面標題 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/knowledge/search">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                返回普通搜索
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">高級搜索</h1>
          <p className="mt-2 text-gray-600">
            使用複雜的條件組合進行精確搜索
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主要內容區 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 搜索構建器 */}
            <AdvancedSearchBuilder
              onSearch={handleSearch}
              onClear={handleClear}
              showPreview={true}
            />

            {/* 搜索結果 */}
            {isSearching ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">搜索中...</p>
                  </div>
                </CardContent>
              </Card>
            ) : results.length > 0 ? (
              <>
                {/* 保存查詢按鈕 */}
                {currentQuery && (
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      onClick={saveCurrentSearch}
                    >
                      <BookmarkIcon className="h-4 w-4 mr-2" />
                      保存此查詢
                    </Button>
                  </div>
                )}

                {/* 使用搜索結果優化器 */}
                <SearchResultsOptimizer
                  results={results}
                  searchQuery=""
                  onResultClick={(result) => {
                    window.location.href = `/dashboard/knowledge/${result.id}`;
                  }}
                  showFacets={true}
                  defaultSortBy="relevance"
                  defaultViewMode="list"
                />
              </>
            ) : currentQuery ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <p className="text-lg">未找到符合條件的文檔</p>
                    <p className="mt-2 text-sm">請嘗試調整搜索條件</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* 側邊欄 */}
          <div className="space-y-6">
            {/* 保存的查詢 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookmarkIcon className="h-4 w-4" />
                  保存的查詢
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedSearches.length > 0 ? (
                  <div className="space-y-2">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        className="group p-3 border border-gray-200 rounded-lg hover:border-indigo-500 cursor-pointer"
                        onClick={() => loadHistoryQuery(saved)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 group-hover:text-indigo-600">
                              {saved.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(saved.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedSearch(saved.id);
                            }}
                            className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    尚無保存的查詢
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 搜索歷史 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  搜索歷史
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchHistory.length > 0 ? (
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((history) => (
                      <div
                        key={history.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-indigo-500 cursor-pointer hover:bg-indigo-50 transition-all"
                        onClick={() => loadHistoryQuery(history)}
                      >
                        <p className="text-sm text-gray-900">{history.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(history.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    尚無搜索歷史
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 搜索技巧 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">搜索技巧</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span>使用 AND 要求所有條件都滿足</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span>使用 OR 要求任一條件滿足</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span>可以創建多層嵌套的條件組</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span>保存常用查詢以便快速使用</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
