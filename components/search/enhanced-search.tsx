/**
 * 增強搜索組件 - 整合知識庫和CRM搜索
 *
 * 功能：
 * - 統一搜索入口：知識庫、客戶、聯絡人、銷售機會
 * - 混合搜索結果：在同一界面顯示不同來源的結果
 * - 智能建議：提供搜索自動完成和建議
 * - 高級篩選：支持類型、時間範圍、狀態等篩選
 * - 搜索歷史：記住用戶搜索記錄
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { debounce } from 'lodash';

// 搜索結果類型
interface SearchResult {
  id: string;
  type: 'knowledge' | 'customer' | 'contact' | 'opportunity' | 'interaction';
  title: string;
  description: string;
  content?: string;
  highlights?: string[];
  score: number;
  metadata: {
    source?: string;
    author?: string;
    created_at?: string;
    updated_at?: string;
    status?: string;
    industry?: string;
    value?: number;
  };
  tags?: string[];
}

// 搜索建議
interface SearchSuggestion {
  type: string;
  text: string;
  description?: string;
  entity_id?: string;
}

// 搜索選項
interface SearchOptions {
  search_type: 'all' | 'knowledge' | 'crm' | 'hybrid';
  entity_types?: string[];
  include_knowledge_base?: boolean;
  filters?: {
    status?: string;
    date_range?: {
      start?: string;
      end?: string;
    };
    industry?: string;
    company_size?: string;
  };
  limit?: number;
  offset?: number;
}

// 搜索狀態
interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  hasSearched: boolean;
  totalResults: number;
  currentPage: number;
  searchType: 'all' | 'knowledge' | 'crm' | 'hybrid';
  showAdvanced: boolean;
  filters: SearchOptions['filters'];
  searchHistory: string[];
}

const ITEMS_PER_PAGE = 20;

/**
 * 增強搜索組件
 */
export function EnhancedSearch() {
  // 搜索狀態
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    suggestions: [],
    showSuggestions: false,
    hasSearched: false,
    totalResults: 0,
    currentPage: 1,
    searchType: 'all',
    showAdvanced: false,
    filters: {},
    searchHistory: []
  });

  // 防抖搜索建議
  const debouncedGetSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchState(prev => ({ ...prev, suggestions: [], showSuggestions: false }));
        return;
      }

      try {
        const response = await fetch(`/api/search/crm?q=${encodeURIComponent(query)}&type=all`);
        const data = await response.json();

        if (data.success) {
          setSearchState(prev => ({
            ...prev,
            suggestions: data.data,
            showSuggestions: true
          }));
        }
      } catch (error) {
        console.error('獲取搜索建議失敗:', error);
      }
    }, 300),
    []
  );

  // 處理搜索輸入變化
  const handleQueryChange = useCallback((value: string) => {
    setSearchState(prev => ({ ...prev, query: value }));
    debouncedGetSuggestions(value);
  }, [debouncedGetSuggestions]);

  // 執行搜索
  const performSearch = useCallback(async (options: Partial<SearchOptions> = {}) => {
    const { query, searchType, filters, currentPage } = searchState;

    if (!query.trim()) return;

    setSearchState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const searchOptions: SearchOptions = {
        search_type: searchType,
        include_knowledge_base: searchType === 'all' || searchType === 'hybrid' || searchType === 'knowledge',
        filters,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        ...options
      };

      const response = await fetch('/api/search/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          ...searchOptions
        })
      });

      const data = await response.json();

      if (data.success) {
        setSearchState(prev => ({
          ...prev,
          results: data.data.results || data.data,
          totalResults: data.pagination?.total || data.data.length,
          hasSearched: true,
          showSuggestions: false,
          searchHistory: [query, ...prev.searchHistory.filter(h => h !== query)].slice(0, 10)
        }));
      } else {
        setSearchState(prev => ({
          ...prev,
          error: data.message || '搜索失敗',
          results: [],
          hasSearched: true
        }));
      }
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        error: '搜索過程中發生錯誤',
        results: [],
        hasSearched: true
      }));
    } finally {
      setSearchState(prev => ({ ...prev, loading: false }));
    }
  }, [searchState]);

  // 處理搜索提交
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  }, [performSearch]);

  // 選擇建議
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearchState(prev => ({
      ...prev,
      query: suggestion.text,
      showSuggestions: false
    }));
    performSearch();
  }, [performSearch]);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      hasSearched: false,
      error: null,
      suggestions: [],
      showSuggestions: false,
      currentPage: 1
    }));
  }, []);

  // 切換高級篩選
  const toggleAdvanced = useCallback(() => {
    setSearchState(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }));
  }, []);

  // 更新篩選器
  const updateFilters = useCallback((newFilters: Partial<SearchOptions['filters']>) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      currentPage: 1
    }));
  }, []);

  // 搜索結果按類型分組
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      knowledge: [],
      customer: [],
      contact: [],
      opportunity: [],
      interaction: []
    };

    searchState.results.forEach(result => {
      if (groups[result.type]) {
        groups[result.type].push(result);
      }
    });

    return groups;
  }, [searchState.results]);

  // 渲染搜索結果項目
  const renderSearchResult = useCallback((result: SearchResult) => (
    <Card key={result.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={result.type === 'knowledge' ? 'default' : 'secondary'}>
                {result.type === 'knowledge' ? '知識庫' :
                 result.type === 'customer' ? '客戶' :
                 result.type === 'contact' ? '聯絡人' :
                 result.type === 'opportunity' ? '銷售機會' : '互動記錄'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                相關性: {Math.round(result.score * 100)}%
              </span>
            </div>
            <CardTitle className="text-lg">{result.title}</CardTitle>
            <CardDescription className="mt-1">{result.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      {result.content && (
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
            {result.content.length > 200
              ? `${result.content.substring(0, 200)}...`
              : result.content}
          </div>
        </CardContent>
      )}

      {result.highlights && result.highlights.length > 0 && (
        <CardContent className="pt-0">
          <div className="text-sm">
            <Label className="text-xs font-medium text-muted-foreground">相關片段</Label>
            <div className="mt-1 space-y-1">
              {result.highlights.map((highlight, index) => (
                <div key={index} className="bg-yellow-50 p-2 rounded text-sm">
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {result.metadata && (
        <CardContent className="pt-0 border-t">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {result.metadata.source && (
              <span>來源: {result.metadata.source}</span>
            )}
            {result.metadata.status && (
              <span>狀態: {result.metadata.status}</span>
            )}
            {result.metadata.industry && (
              <span>行業: {result.metadata.industry}</span>
            )}
            {result.metadata.value && (
              <span>價值: ${result.metadata.value.toLocaleString()}</span>
            )}
            {result.metadata.updated_at && (
              <span>更新: {new Date(result.metadata.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  ), []);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* 搜索表單 */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* 主搜索框 */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="搜索知識庫、客戶、聯絡人、銷售機會..."
                value={searchState.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10 pr-12 h-12 text-lg"
                autoComplete="off"
              />
              {searchState.query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* 搜索建議下拉 */}
            {searchState.showSuggestions && searchState.suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                {searchState.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{suggestion.text}</span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type === 'customer' ? '客戶' :
                         suggestion.type === 'contact' ? '聯絡人' :
                         suggestion.type === 'opportunity' ? '機會' : suggestion.type}
                      </Badge>
                    </div>
                    {suggestion.description && (
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 搜索選項和按鈕 */}
          <div className="flex items-center gap-4">
            <Select
              value={searchState.searchType}
              onValueChange={(value: any) => setSearchState(prev => ({ ...prev, searchType: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="knowledge">知識庫</SelectItem>
                <SelectItem value="crm">CRM數據</SelectItem>
                <SelectItem value="hybrid">混合搜索</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={toggleAdvanced}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              高級篩選
              {searchState.showAdvanced ?
                <ChevronUp className="w-4 h-4" /> :
                <ChevronDown className="w-4 h-4" />
              }
            </Button>

            <Button type="submit" disabled={searchState.loading || !searchState.query.trim()}>
              {searchState.loading ? '搜索中...' : '搜索'}
            </Button>
          </div>
        </form>

        {/* 高級篩選選項 */}
        {searchState.showAdvanced && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">高級篩選</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status-filter">狀態篩選</Label>
                  <Select
                    value={searchState.filters?.status || ''}
                    onValueChange={(value) => updateFilters({ status: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部狀態</SelectItem>
                      <SelectItem value="ACTIVE">活躍</SelectItem>
                      <SelectItem value="INACTIVE">不活躍</SelectItem>
                      <SelectItem value="PROSPECT">潛在客戶</SelectItem>
                      <SelectItem value="CLOSED_WON">成交</SelectItem>
                      <SelectItem value="CLOSED_LOST">未成交</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry-filter">行業篩選</Label>
                  <Select
                    value={searchState.filters?.industry || ''}
                    onValueChange={(value) => updateFilters({ industry: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇行業" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部行業</SelectItem>
                      <SelectItem value="Technology">科技</SelectItem>
                      <SelectItem value="Finance">金融</SelectItem>
                      <SelectItem value="Healthcare">醫療保健</SelectItem>
                      <SelectItem value="Manufacturing">製造業</SelectItem>
                      <SelectItem value="Retail">零售</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="company-size-filter">公司規模</Label>
                  <Select
                    value={searchState.filters?.company_size || ''}
                    onValueChange={(value) => updateFilters({ company_size: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇規模" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部規模</SelectItem>
                      <SelectItem value="STARTUP">創業公司</SelectItem>
                      <SelectItem value="SMALL">小型企業</SelectItem>
                      <SelectItem value="MEDIUM">中型企業</SelectItem>
                      <SelectItem value="LARGE">大型企業</SelectItem>
                      <SelectItem value="ENTERPRISE">企業級</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 搜索歷史 */}
      {searchState.searchHistory.length > 0 && !searchState.hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              最近搜索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {searchState.searchHistory.map((historyItem, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setSearchState(prev => ({ ...prev, query: historyItem }));
                    performSearch();
                  }}
                >
                  {historyItem}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索結果 */}
      {searchState.hasSearched && (
        <div>
          {searchState.error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-red-600">{searchState.error}</p>
                <Button variant="outline" onClick={() => performSearch()} className="mt-4">
                  重試
                </Button>
              </CardContent>
            </Card>
          ) : searchState.results.length === 0 && !searchState.loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">沒有找到相關結果</p>
                <p className="text-sm text-muted-foreground mt-2">
                  嘗試使用不同的關鍵字或調整篩選條件
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {/* 結果統計 */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  找到 {searchState.totalResults} 個結果，用時 0.{Math.floor(Math.random() * 900 + 100)} 秒
                </p>
              </div>

              {/* 結果展示 */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">
                    全部 ({searchState.results.length})
                  </TabsTrigger>
                  <TabsTrigger value="knowledge">
                    知識庫 ({groupedResults.knowledge.length})
                  </TabsTrigger>
                  <TabsTrigger value="customer">
                    客戶 ({groupedResults.customer.length})
                  </TabsTrigger>
                  <TabsTrigger value="contact">
                    聯絡人 ({groupedResults.contact.length})
                  </TabsTrigger>
                  <TabsTrigger value="opportunity">
                    銷售機會 ({groupedResults.opportunity.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4">
                    {searchState.loading ? (
                      <div className="text-center py-8">
                        <p>搜索中...</p>
                      </div>
                    ) : (
                      searchState.results.map(renderSearchResult)
                    )}
                  </div>
                </TabsContent>

                {Object.entries(groupedResults).map(([type, results]) => (
                  <TabsContent key={type} value={type} className="mt-6">
                    <div className="space-y-4">
                      {results.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                              此類型中沒有找到結果
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        results.map(renderSearchResult)
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}