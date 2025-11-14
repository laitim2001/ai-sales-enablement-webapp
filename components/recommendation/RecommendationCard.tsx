/**
 * @fileoverview 推薦項目卡片組件
📋 功能說明：
- 展示推薦項目信息（標題、類型、相關度分數）
- 推薦理由說明展示
- 反饋按鈕（喜歡/不喜歡/忽略）
- 快速查看/收藏操作
- 視覺化相關度指示器
📊 使用場景：
- 推薦列表展示
- 儀表板智能推薦區
- 會議準備頁面相關推薦
作者：Claude Code
日期：2025-10-05
Sprint：Sprint 7 Phase 3
 * @module components/recommendation/RecommendationCard
 *
 * 推薦項目卡片組件
 * 📋 功能說明：
 * - 展示推薦項目信息（標題、類型、相關度分數）
 * - 推薦理由說明展示
 * - 反饋按鈕（喜歡/不喜歡/忽略）
 * - 快速查看/收藏操作
 * - 視覺化相關度指示器
 * 📊 使用場景：
 * - 推薦列表展示
 * - 儀表板智能推薦區
 * - 會議準備頁面相關推薦
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ThumbsUp,
  ThumbsDown,
  X,
  Eye,
  Star,
  FileText,
  Users,
  Briefcase,
  Calendar,
  Workflow,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { RecommendationItem } from '@/lib/recommendation/recommendation-engine';
import { ContentType } from '@/lib/analytics/user-behavior-tracker';

/**
 * 內容類型配置
 */
const CONTENT_TYPE_CONFIG: Record<ContentType | 'case_study', {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  [ContentType.KNOWLEDGE_BASE]: {
    label: '知識庫',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  [ContentType.PROPOSAL]: {
    label: '提案',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-purple-500'
  },
  [ContentType.TEMPLATE]: {
    label: '模板',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-green-500'
  },
  [ContentType.CUSTOMER]: {
    label: '客戶',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-orange-500'
  },
  [ContentType.MEETING]: {
    label: '會議',
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-pink-500'
  },
  [ContentType.WORKFLOW]: {
    label: '工作流',
    icon: <Workflow className="h-4 w-4" />,
    color: 'bg-indigo-500'
  },
  case_study: {
    label: '案例研究',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'bg-teal-500'
  }
};

/**
 * 相關度等級
 */
const getRelevanceLevel = (score: number): {
  label: string;
  color: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} => {
  if (score >= 0.8) {
    return { label: '高度相關', color: 'text-green-600', variant: 'default' };
  } else if (score >= 0.6) {
    return { label: '相關', color: 'text-blue-600', variant: 'secondary' };
  } else if (score >= 0.4) {
    return { label: '可能相關', color: 'text-yellow-600', variant: 'outline' };
  } else {
    return { label: '低相關', color: 'text-gray-600', variant: 'outline' };
  }
};

/**
 * RecommendationCard 組件屬性
 */
export interface RecommendationCardProps {
  /** 推薦項目數據 */
  item: RecommendationItem;
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
  /** 是否顯示反饋按鈕 */
  showFeedback?: boolean;
  /** 是否顯示理由 */
  showReasons?: boolean;
  /** 卡片點擊回調 */
  onClick?: (id: string) => void;
  /** 自定義類名 */
  className?: string;
}

/**
 * 推薦項目卡片組件
 *
 * @example
 * ```tsx
 * <RecommendationCard
 *   item={recommendationItem}
 *   onView={(id) => router.push(`/items/${id}`)}
 *   onLike={(id) => handleFeedback(id, 'like')}
 *   onDislike={(id) => handleFeedback(id, 'dislike')}
 *   onDismiss={(id) => handleDismiss(id)}
 *   showFeedback={true}
 *   showReasons={true}
 * />
 * ```
 */
export function RecommendationCard({
  item,
  onView,
  onFavorite,
  onLike,
  onDislike,
  onDismiss,
  showFeedback = true,
  showReasons = true,
  onClick,
  className = ''
}: RecommendationCardProps) {

  const [feedbackGiven, setFeedbackGiven] = useState<'like' | 'dislike' | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // 獲取內容類型配置
  const typeConfig = CONTENT_TYPE_CONFIG[item.type] || CONTENT_TYPE_CONFIG[ContentType.KNOWLEDGE_BASE];

  // 獲取相關度等級
  const relevanceLevel = getRelevanceLevel(item.score);

  // 相關度百分比
  const relevancePercentage = Math.round(item.score * 100);

  // 處理喜歡
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (feedbackGiven !== 'like') {
      setFeedbackGiven('like');
      onLike?.(item.id);
    }
  };

  // 處理不喜歡
  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (feedbackGiven !== 'dislike') {
      setFeedbackGiven('dislike');
      onDislike?.(item.id);
    }
  };

  // 處理忽略
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    onDismiss?.(item.id);
  };

  // 卡片點擊處理
  const handleCardClick = () => {
    if (onClick) {
      onClick(item.id);
    }
  };

  // 如果已忽略，不顯示卡片
  if (isDismissed) {
    return null;
  }

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-10`}>
              {typeConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base font-semibold">
                  {item.title}
                </CardTitle>
                {item.metadata?.tags && item.metadata.tags.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {item.metadata.tags[0]}
                  </Badge>
                )}
              </div>
              {item.description && (
                <CardDescription className="text-sm line-clamp-2">
                  {item.description}
                </CardDescription>
              )}
            </div>
          </div>

          {showFeedback && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 內容類型和相關度 */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-normal">
            {typeConfig.label}
          </Badge>
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${relevanceLevel.color}`} />
            <Badge variant={relevanceLevel.variant} className={relevanceLevel.color}>
              {relevanceLevel.label}
            </Badge>
          </div>
        </div>

        {/* 相關度進度條 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>匹配度</span>
            <span className="font-medium">{relevancePercentage}%</span>
          </div>
          <Progress value={relevancePercentage} className="h-1.5" />
        </div>

        {/* 推薦理由 */}
        {showReasons && item.reasons && item.reasons.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">推薦理由：</p>
            <ul className="space-y-1">
              {item.reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
              {item.reasons.length > 2 && (
                <li className="text-xs text-muted-foreground italic">
                  還有 {item.reasons.length - 2} 個理由...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* 元數據 */}
        {item.metadata && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {item.metadata.author && (
              <span>作者: {item.metadata.author}</span>
            )}
            {item.metadata.viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {item.metadata.viewCount} 次查看
              </span>
            )}
            {item.metadata.createdAt && (
              <span>
                {new Date(item.metadata.createdAt).toLocaleDateString('zh-TW')}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onView?.(item.id);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          查看
        </Button>

        {onFavorite && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(item.id);
            }}
          >
            <Star className="h-4 w-4" />
          </Button>
        )}

        {showFeedback && (
          <>
            <Button
              variant={feedbackGiven === 'like' ? 'default' : 'outline'}
              size="sm"
              onClick={handleLike}
              disabled={feedbackGiven === 'dislike'}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant={feedbackGiven === 'dislike' ? 'default' : 'outline'}
              size="sm"
              onClick={handleDislike}
              disabled={feedbackGiven === 'like'}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default RecommendationCard;
