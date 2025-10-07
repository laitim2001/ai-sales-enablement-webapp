/**
 * @fileoverview ================================================================AI銷售賦能平台 - 搜索分析儀表板組件================================================================【組件功能】提供搜索行為分析和性能監控的可視化儀表板，幫助管理員了解用戶搜索習慣和優化搜索質量。【主要特性】• 搜索統計 - 總搜索次數、平均結果數、零結果率• 熱門查詢 - Top 10 最常搜索的關鍵詞• 零結果查詢 - 需要優化的查詢列表• 性能指標 - 平均響應時間、慢查詢追蹤• 趨勢圖表 - 搜索量時間趨勢@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 4
 * @module components/knowledge/search-analytics-dashboard
 * @description
 * ================================================================AI銷售賦能平台 - 搜索分析儀表板組件================================================================【組件功能】提供搜索行為分析和性能監控的可視化儀表板，幫助管理員了解用戶搜索習慣和優化搜索質量。【主要特性】• 搜索統計 - 總搜索次數、平均結果數、零結果率• 熱門查詢 - Top 10 最常搜索的關鍵詞• 零結果查詢 - 需要優化的查詢列表• 性能指標 - 平均響應時間、慢查詢追蹤• 趨勢圖表 - 搜索量時間趨勢@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 4
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchHistoryManager } from '@/lib/knowledge/search-history-manager';

/**
 * 統計卡片數據介面
 */
interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

/**
 * 零結果查詢介面
 */
interface ZeroResultQuery {
  query: string;
  count: number;
  lastSearched: Date;
  suggestions?: string[];
}

/**
 * 搜索分析儀表板組件
 */
export function SearchAnalyticsDashboard() {
  const [stats, setStats] = useState({
    total_searches: 0,
    total_clicks: 0,
    avg_results_per_search: 0,
    most_searched_term: null as string | null,
    search_types: {} as Record<string, number>
  });

  const [popularTerms, setPopularTerms] = useState<Array<{ term: string; count: number }>>([]);
  const [zeroResultQueries, setZeroResultQueries] = useState<ZeroResultQuery[]>([]);

  /**
   * 載入統計數據
   */
  useEffect(() => {
    loadAnalytics();
  }, []);

  /**
   * 載入分析數據
   */
  const loadAnalytics = () => {
    // 基礎統計
    const statistics = SearchHistoryManager.getStatistics();
    setStats(statistics);

    // 熱門搜索
    const popular = SearchHistoryManager.getPopularTerms(10);
    setPopularTerms(popular);

    // 零結果查詢（模擬數據，實際需要從後端API獲取）
    // TODO: 實現後端API獲取真實的零結果查詢數據
    setZeroResultQueries([]);
  };

  /**
   * 計算點擊率
   */
  const clickThroughRate = stats.total_searches > 0
    ? ((stats.total_clicks / stats.total_searches) * 100).toFixed(1)
    : '0.0';

  /**
   * 統計卡片數據
   */
  const statCards: StatCard[] = [
    {
      title: '總搜索次數',
      value: stats.total_searches,
      icon: <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />,
      changeType: 'neutral'
    },
    {
      title: '平均結果數',
      value: stats.avg_results_per_search.toFixed(1),
      icon: <ChartBarIcon className="h-6 w-6 text-green-600" />,
      changeType: 'positive'
    },
    {
      title: '點擊率',
      value: `${clickThroughRate}%`,
      icon: <SparklesIcon className="h-6 w-6 text-purple-600" />,
      changeType: stats.total_clicks > stats.total_searches * 0.3 ? 'positive' : 'negative'
    },
    {
      title: '零結果查詢',
      value: zeroResultQueries.length,
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />,
      changeType: zeroResultQueries.length > 0 ? 'negative' : 'positive'
    }
  ];

  /**
   * 獲取搜索類型百分比
   */
  const getSearchTypePercentage = (type: string): string => {
    const total = Object.values(stats.search_types).reduce((sum, count) => sum + count, 0);
    const count = stats.search_types[type] || 0;
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  };

  /**
   * 搜索類型顏色映射
   */
  const searchTypeColors: Record<string, string> = {
    text: 'bg-blue-500',
    semantic: 'bg-green-500',
    hybrid: 'bg-purple-500',
    advanced: 'bg-orange-500'
  };

  /**
   * 搜索類型名稱映射
   */
  const searchTypeNames: Record<string, string> = {
    text: '文本搜索',
    semantic: '語義搜索',
    hybrid: '混合搜索',
    advanced: '高級搜索'
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-full">
                  {card.icon}
                </div>
              </div>
              {card.change && (
                <div className="mt-4">
                  <span
                    className={`text-sm font-medium ${
                      card.changeType === 'positive'
                        ? 'text-green-600'
                        : card.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {card.change}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 熱門搜索詞 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FireIcon className="h-5 w-5 text-orange-500" />
              熱門搜索詞 Top 10
            </CardTitle>
            <CardDescription>
              最常被搜索的關鍵詞和次數
            </CardDescription>
          </CardHeader>
          <CardContent>
            {popularTerms.length > 0 ? (
              <div className="space-y-3">
                {popularTerms.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                            ? 'bg-gray-400 text-white'
                            : index === 2
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        } font-bold text-sm`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{term.term}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-semibold">{term.count} 次</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FireIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">尚無搜索數據</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 搜索類型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              搜索類型分布
            </CardTitle>
            <CardDescription>
              不同搜索模式的使用情況
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.search_types).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.search_types).map(([type, count]) => {
                  const percentage = getSearchTypePercentage(type);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {searchTypeNames[type] || type}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count} 次 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${searchTypeColors[type] || 'bg-gray-500'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">尚無搜索類型數據</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 零結果查詢 */}
      {zeroResultQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
              零結果查詢
            </CardTitle>
            <CardDescription>
              需要優化的查詢 - 這些搜索沒有找到任何結果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zeroResultQueries.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.query}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(item.lastSearched).toLocaleString('zh-TW')}
                        </span>
                        <span>{item.count} 次嘗試</span>
                      </div>
                      {item.suggestions && item.suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-1">建議優化:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.suggestions.map((suggestion, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white border border-orange-300 rounded text-xs text-gray-700"
                              >
                                {suggestion}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最常搜索的關鍵詞（單獨高亮）*/}
      {stats.most_searched_term && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-100">最熱門關鍵詞</p>
                <p className="text-3xl font-bold mt-2">{stats.most_searched_term}</p>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-full">
                <SparklesIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
