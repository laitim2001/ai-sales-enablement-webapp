/**
 * @fileoverview ================================================================
AI銷售賦能平台 - 知識庫分析統計儀表板頁面
================================================================
【頁面功能】
提供知識庫的全面分析統計儀表板，包括使用頻率、熱門內容、
數據分布和用戶活動等...
 * @module app/dashboard/knowledge/analytics/page
 *
 * 【頁面功能】
 * 提供知識庫的全面分析統計儀表板，包括使用頻率、熱門內容、
 * 數據分布和用戶活動等多維度數據可視化。
 * 【主要職責】
 * • 總體概覽 - 關鍵指標卡片展示
 * • 熱門文檔 - Top排行榜（查看/編輯）
 * • 數據分布 - 類型/分類/狀態分布圖表
 * • 資料夾使用 - 儲存空間和文檔數量統計
 * • 用戶活動 - 活躍貢獻者分析
 * • 時間篩選 - 今日/本週/本月/自定義範圍
 * 【頁面結構】
 * • 頁面標題和時間範圍選擇器
 * • 總體統計卡片區
 * • 熱門文檔排行區
 * • 數據分布圖表區
 * • 資料夾和用戶活動區
 * 【URL路徑】
 * /dashboard/knowledge/analytics
 * @author Claude Code
 * @date 2025-10-03
 * @sprint Sprint 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  FolderIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Activity
} from 'lucide-react';
import { StatsCard, BarChart, PieChart, DocumentList } from '@/components/knowledge/analytics';
import { Button } from '@/components/ui/button';

// 時間範圍選項
const TIME_RANGES = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定義' }
] as const;

type TimeRange = typeof TIME_RANGES[number]['value'];

export default function KnowledgeAnalyticsPage() {
  // 狀態管理
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [topViewed, setTopViewed] = useState<any[]>([]);
  const [topEdited, setTopEdited] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [typeDist, setTypeDist] = useState<any[]>([]);
  const [folderUsage, setFolderUsage] = useState<any[]>([]);

  // 獲取統計數據
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('未找到認證令牌');
        return;
      }

      // 並行獲取所有統計數據
      const [
        overviewRes,
        topViewedRes,
        topEditedRes,
        categoryDistRes,
        typeDistRes,
        folderUsageRes
      ] = await Promise.all([
        fetch(`/api/knowledge-base/analytics?type=overview&timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/knowledge-base/analytics?type=top-viewed&timeRange=${timeRange}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/knowledge-base/analytics?type=top-edited&timeRange=${timeRange}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/knowledge-base/analytics?type=category-distribution`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/knowledge-base/analytics?type=type-distribution`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/knowledge-base/analytics?type=folder-usage&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [
        overviewData,
        topViewedData,
        topEditedData,
        categoryDistData,
        typeDistData,
        folderUsageData
      ] = await Promise.all([
        overviewRes.json(),
        topViewedRes.json(),
        topEditedRes.json(),
        categoryDistRes.json(),
        typeDistRes.json(),
        folderUsageRes.json()
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (topViewedData.success) setTopViewed(topViewedData.data);
      if (topEditedData.success) setTopEdited(topEditedData.data);
      if (categoryDistData.success) setCategoryDist(categoryDistData.data);
      if (typeDistData.success) setTypeDist(typeDistData.data);
      if (folderUsageData.success) setFolderUsage(folderUsageData.data);

    } catch (error) {
      console.error('獲取統計數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加載統計數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-indigo-600" />
              知識庫分析統計
            </h1>
            <p className="mt-2 text-gray-600">
              全面了解知識庫使用情況和數據分布
            </p>
          </div>

          {/* 時間範圍選擇器 */}
          <div className="flex items-center gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 總體統計卡片 */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="文檔總數"
              value={overview.totalDocuments.toLocaleString()}
              growth={overview.documentsGrowth}
              icon={FileText}
              description="相比上期"
            />
            <StatsCard
              title="總查看次數"
              value={overview.totalViews.toLocaleString()}
              growth={overview.viewsGrowth}
              icon={Activity}
              description="相比上期"
            />
            <StatsCard
              title="總編輯次數"
              value={overview.totalEdits.toLocaleString()}
              growth={overview.editsGrowth}
              icon={TrendingUp}
              description="相比上期"
            />
            <StatsCard
              title="總下載次數"
              value={overview.totalDownloads.toLocaleString()}
              icon={BarChart3}
              description="累計統計"
            />
          </div>
        )}

        {/* 熱門文檔排行 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DocumentList
            documents={topViewed}
            title="🔥 最常查看文檔 Top 10"
            showRank={true}
          />
          <DocumentList
            documents={topEdited}
            title="✏️ 最常編輯文檔 Top 10"
            showRank={true}
          />
        </div>

        {/* 數據分布圖表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PieChart
            data={categoryDist.map(item => ({
              label: item.category,
              value: item.count,
              percentage: item.percentage
            }))}
            title="📊 文檔分類分布"
            size={220}
          />
          <PieChart
            data={typeDist.map(item => ({
              label: item.mimeType === 'unknown' ? '未知類型' : item.mimeType.split('/')[1] || item.mimeType,
              value: item.count,
              percentage: item.percentage
            }))}
            title="📁 文檔類型分布"
            size={220}
          />
        </div>

        {/* 資料夾使用情況 */}
        <div className="mb-8">
          <BarChart
            data={folderUsage.map(folder => ({
              label: folder.folderName,
              value: folder.documentCount,
              percentage: Math.round((folder.documentCount / (folderUsage.reduce((sum, f) => sum + f.documentCount, 0) || 1)) * 100)
            }))}
            title="📂 資料夾使用情況"
            showPercentage={false}
          />
        </div>

        {/* 儲存空間統計 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💾 儲存空間統計
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {folderUsage.slice(0, 3).map((folder, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FolderIcon className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-medium text-gray-900 truncate">
                    {folder.folderName}
                  </h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(folder.totalSize)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {folder.documentCount} 個文檔
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
