/**
 * @fileoverview 推薦列表組件
📋 功能說明：
- 展示推薦項目列表
- 內容類型篩選（知識庫/提案/模板等）
- 推薦策略切換（協同/內容/混合/流行）
- 載入更多/無限滾動
- 錯誤處理和載入狀態
- 空狀態提示
- 反饋統計展示
📊 使用場景：
- 推薦管理頁面
- 儀表板推薦區域
- 會議準備頁面相關推薦
作者：Claude Code
日期：2025-10-05
Sprint：Sprint 7 Phase...
 * @module components/recommendation/RecommendationList
 *
 * 推薦列表組件
 * 📋 功能說明：
 * - 展示推薦項目列表
 * - 內容類型篩選（知識庫/提案/模板等）
 * - 推薦策略切換（協同/內容/混合/流行）
 * - 載入更多/無限滾動
 * - 錯誤處理和載入狀態
 * - 空狀態提示
 * - 反饋統計展示
 * 📊 使用場景：
 * - 推薦管理頁面
 * - 儀表板推薦區域
 * - 會議準備頁面相關推薦
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { RecommendationItem, RecommendationResult } from '@/lib/recommendation/recommendation-engine';
import { ContentType } from '@/lib/analytics/user-behavior-tracker';
import { RecommendationCard } from './RecommendationCard';

/**
 * 推薦策略類型
 */
type RecommendationStrategy = 'collaborative' | 'content_based' | 'hybrid' | 'popularity';

/**
 * RecommendationList 組件屬性
 */
export interface RecommendationListProps {
  /** 推薦結果 */
  recommendations?: RecommendationResult;
  /** 是否載入中 */
  loading?: boolean;
  /** 錯誤信息 */
  error?: string;
  /** 查看詳情回調 */
  onView?: (id: string) => void;
  /** 收藏回調 */
  onFavorite?: (id: string) => void;
  /** 喜歡反饋回調 */
  onLike?: (id: string) => void;
  /** 不喜歡反饋回調 */
  onDislike?: (id: string) => void;
  /** 忽略推薦回調 */
  onDismiss?: (id: string) => void;
  /** 刷新推薦回調 */
  onRefresh?: (strategy?: RecommendationStrategy, contentType?: ContentType) => void;
  /** 載入更多回調 */
  onLoadMore?: () => void;
  /** 是否有更多數據 */
  hasMore?: boolean;
  /** 是否正在載入更多 */
  loadingMore?: boolean;
  /** 初始內容類型篩選 */
  defaultContentType?: ContentType | 'ALL';
  /** 初始推薦策略 */
  defaultStrategy?: RecommendationStrategy;
  /** 是否顯示策略選擇 */
  showStrategySelector?: boolean;
  /** 是否顯示反饋按鈕 */
  showFeedback?: boolean;
  /** 自定義類名 */
  className?: string;
}

/**
 * 推薦列表組件
 *
 * @example
 * ```tsx
 * <RecommendationList
 *   recommendations={recommendationResult}
 *   loading={isLoading}
 *   onView={(id) => router.push(`/items/${id}`)}
 *   onLike={(id) => handleFeedback(id, 'like')}
 *   onRefresh={(strategy, type) => fetchRecommendations(strategy, type)}
 *   showStrategySelector={true}
 * />
 * ```
 */
export function RecommendationList({
  recommendations,
  loading = false,
  error,
  onView,
  onFavorite,
  onLike,
  onDislike,
  onDismiss,
  onRefresh,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  defaultContentType = 'ALL',
  defaultStrategy = 'hybrid',
  showStrategySelector = true,
  showFeedback = true,
  className = ''
}: RecommendationListProps) {

  // 內容類型篩選
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'ALL'>(defaultContentType);

  // 推薦策略
  const [strategy, setStrategy] = useState<RecommendationStrategy>(defaultStrategy);

  // 自動刷新定時器
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);

  // 篩選推薦項目
  const filteredItems = useMemo(() => {
    if (!recommendations?.items) return [];

    if (contentTypeFilter === 'ALL') {
      return recommendations.items;
    }

    return recommendations.items.filter(item => item.type === contentTypeFilter);
  }, [recommendations?.items, contentTypeFilter]);

  // 統計數據
  const stats = useMemo(() => {
    const items = recommendations?.items || [];
    const totalCount = items.length;
    const avgScore = totalCount > 0
      ? items.reduce((sum, item) => sum + item.score, 0) / totalCount
      : 0;

    const typeDistribution: Record<string, number> = { ALL: totalCount };
    items.forEach(item => {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    });

    return {
      totalCount,
      avgScore,
      typeDistribution,
      confidence: recommendations?.confidence || 0
    };
  }, [recommendations]);

  // 刷新推薦
  const handleRefresh = useCallback(() => {
    const selectedType = contentTypeFilter === 'ALL' ? undefined : contentTypeFilter;
    onRefresh?.(strategy, selectedType);
  }, [contentTypeFilter, strategy, onRefresh]);

  // 策略變更
  const handleStrategyChange = useCallback((newStrategy: RecommendationStrategy) => {
    setStrategy(newStrategy);
    const selectedType = contentTypeFilter === 'ALL' ? undefined : contentTypeFilter;
    onRefresh?.(newStrategy, selectedType);
  }, [contentTypeFilter, onRefresh]);

  // 內容類型變更
  const handleContentTypeChange = useCallback((newType: ContentType | 'ALL') => {
    setContentTypeFilter(newType);
  }, []);

  // 錯誤狀態
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="bg-destructive/10 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">載入推薦時發生錯誤</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重試
          </Button>
        </div>
      </div>
    );
  }

  // 載入骨架屏
  if (loading && !recommendations) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 工具欄骨架屏 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        {/* 卡片骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 空狀態
  if (!loading && (!recommendations || recommendations.items.length === 0)) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="bg-muted rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">暫無推薦內容</h3>
            <p className="text-muted-foreground mt-1">
              系統正在學習您的偏好，稍後將為您提供個性化推薦
            </p>
          </div>
          {onRefresh && (
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新推薦
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 篩選後無結果
  if (filteredItems.length === 0 && contentTypeFilter !== 'ALL') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 工具欄 */}
        <ToolBar
          strategy={strategy}
          onStrategyChange={handleStrategyChange}
          contentTypeFilter={contentTypeFilter}
          onContentTypeChange={handleContentTypeChange}
          stats={stats}
          onRefresh={handleRefresh}
          showStrategySelector={showStrategySelector}
          recommendations={recommendations}
        />

        {/* 無結果提示 */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">沒有找到符合條件的推薦</h3>
            <p className="text-muted-foreground">
              嘗試調整內容類型篩選器
            </p>
            <Button variant="outline" onClick={() => setContentTypeFilter('ALL')}>
              顯示所有推薦
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 工具欄 */}
      <ToolBar
        strategy={strategy}
        onStrategyChange={handleStrategyChange}
        contentTypeFilter={contentTypeFilter}
        onContentTypeChange={handleContentTypeChange}
        stats={stats}
        onRefresh={handleRefresh}
        showStrategySelector={showStrategySelector}
        recommendations={recommendations}
      />

      {/* 推薦列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <RecommendationCard
            key={item.id}
            item={item}
            onView={onView}
            onFavorite={onFavorite}
            onLike={onLike}
            onDislike={onDislike}
            onDismiss={onDismiss}
            showFeedback={showFeedback}
            showReasons={true}
          />
        ))}
      </div>

      {/* 載入更多 */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                載入中...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                載入更多推薦
              </>
            )}
          </Button>
        </div>
      )}

      {/* 結果統計 */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center justify-center gap-4">
          <span>
            顯示 {filteredItems.length} / {stats.totalCount} 個推薦
          </span>
          {stats.avgScore > 0 && (
            <>
              <span>•</span>
              <span>
                平均相關度: {Math.round(stats.avgScore * 100)}%
              </span>
            </>
          )}
          {stats.confidence > 0 && (
            <>
              <span>•</span>
              <span>
                信心度: {Math.round(stats.confidence * 100)}%
              </span>
            </>
          )}
        </div>
        {recommendations?.generatedAt && (
          <p className="text-xs mt-1">
            生成時間: {new Date(recommendations.generatedAt).toLocaleString('zh-TW')}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 工具欄組件
 */
interface ToolBarProps {
  strategy: RecommendationStrategy;
  onStrategyChange: (strategy: RecommendationStrategy) => void;
  contentTypeFilter: ContentType | 'ALL';
  onContentTypeChange: (type: ContentType | 'ALL') => void;
  stats: {
    totalCount: number;
    avgScore: number;
    typeDistribution: Record<string, number>;
    confidence: number;
  };
  onRefresh: () => void;
  showStrategySelector: boolean;
  recommendations?: RecommendationResult;
}

function ToolBar({
  strategy,
  onStrategyChange,
  contentTypeFilter,
  onContentTypeChange,
  stats,
  onRefresh,
  showStrategySelector,
  recommendations
}: ToolBarProps) {

  // 策略配置
  const strategyConfig: Record<RecommendationStrategy, { label: string; description: string }> = {
    collaborative: {
      label: '協同過濾',
      description: '基於相似用戶的行為推薦'
    },
    content_based: {
      label: '內容推薦',
      description: '基於您的興趣和偏好'
    },
    hybrid: {
      label: '混合策略',
      description: '綜合多種算法的最佳推薦'
    },
    popularity: {
      label: '熱門推薦',
      description: '基於整體流行度'
    }
  };

  return (
    <div className="space-y-4">
      {/* 標題和刷新 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">智能推薦</h2>
          {recommendations && (
            <Badge variant="secondary">
              {strategyConfig[recommendations.strategy as RecommendationStrategy]?.label || recommendations.strategy}
            </Badge>
          )}
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      {/* 內容類型標籤篩選 */}
      <Tabs value={contentTypeFilter} onValueChange={(v) => onContentTypeChange(v as ContentType | 'ALL')}>
        <TabsList>
          <TabsTrigger value="ALL">
            全部 <Badge variant="secondary" className="ml-1">{stats.typeDistribution.ALL || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={ContentType.KNOWLEDGE_BASE}>
            知識庫 <Badge variant="secondary" className="ml-1">{stats.typeDistribution[ContentType.KNOWLEDGE_BASE] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={ContentType.PROPOSAL}>
            提案 <Badge variant="secondary" className="ml-1">{stats.typeDistribution[ContentType.PROPOSAL] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={ContentType.TEMPLATE}>
            模板 <Badge variant="secondary" className="ml-1">{stats.typeDistribution[ContentType.TEMPLATE] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={ContentType.CUSTOMER}>
            客戶 <Badge variant="secondary" className="ml-1">{stats.typeDistribution[ContentType.CUSTOMER] || 0}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 策略選擇 */}
      {showStrategySelector && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={strategy} onValueChange={(v) => onStrategyChange(v as RecommendationStrategy)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="選擇推薦策略" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(strategyConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default RecommendationList;
