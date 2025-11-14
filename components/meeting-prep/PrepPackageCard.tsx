/**
 * @fileoverview 會議準備包卡片組件
📋 功能說明：
- 展示準備包基本信息（類型、狀態、標題、描述）
- 顯示準備進度（已完成項目/總項目數）
- 預計閱讀時間指示器
- 快速操作按鈕（查看、編輯、分享、刪除）
- 狀態視覺化標識
📊 使用場景：
- 準備包列表展示
- 儀表板快速預覽
- 會議詳情頁關聯準備包
作者：Claude Code
日期：2025-10-05
Sprint：Sprint 7 Phase ...
 * @module components/meeting-prep/PrepPackageCard
 *
 * 會議準備包卡片組件
 * 📋 功能說明：
 * - 展示準備包基本信息（類型、狀態、標題、描述）
 * - 顯示準備進度（已完成項目/總項目數）
 * - 預計閱讀時間指示器
 * - 快速操作按鈕（查看、編輯、分享、刪除）
 * - 狀態視覺化標識
 * 📊 使用場景：
 * - 準備包列表展示
 * - 儀表板快速預覽
 * - 會議詳情頁關聯準備包
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Clock,
  Eye,
  Edit,
  Share2,
  Trash2,
  CheckCircle,
  Circle,
  AlertCircle,
  Archive
} from 'lucide-react';
import {
  MeetingPrepPackage,
  PrepPackageType,
  PrepPackageStatus
} from '@/lib/meeting/meeting-prep-package';

/**
 * 準備包類型配置
 */
const PACKAGE_TYPE_CONFIG: Record<PrepPackageType, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  [PrepPackageType.SALES_MEETING]: {
    label: '銷售會議',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  [PrepPackageType.CLIENT_PRESENTATION]: {
    label: '客戶簡報',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-purple-500'
  },
  [PrepPackageType.INTERNAL_REVIEW]: {
    label: '內部審查',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-green-500'
  },
  [PrepPackageType.PROPOSAL_DISCUSSION]: {
    label: '提案討論',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-orange-500'
  },
  [PrepPackageType.TRAINING_SESSION]: {
    label: '培訓會議',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-pink-500'
  },
  [PrepPackageType.CUSTOM]: {
    label: '自定義',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-gray-500'
  }
};

/**
 * 準備包狀態配置
 */
const PACKAGE_STATUS_CONFIG: Record<PrepPackageStatus, {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}> = {
  [PrepPackageStatus.DRAFT]: {
    label: '草稿',
    icon: <Circle className="h-3 w-3" />,
    variant: 'secondary',
    color: 'text-gray-500'
  },
  [PrepPackageStatus.READY]: {
    label: '就緒',
    icon: <CheckCircle className="h-3 w-3" />,
    variant: 'default',
    color: 'text-green-500'
  },
  [PrepPackageStatus.IN_USE]: {
    label: '使用中',
    icon: <AlertCircle className="h-3 w-3" />,
    variant: 'default',
    color: 'text-blue-500'
  },
  [PrepPackageStatus.COMPLETED]: {
    label: '已完成',
    icon: <CheckCircle className="h-3 w-3" />,
    variant: 'outline',
    color: 'text-green-600'
  },
  [PrepPackageStatus.ARCHIVED]: {
    label: '已歸檔',
    icon: <Archive className="h-3 w-3" />,
    variant: 'secondary',
    color: 'text-gray-400'
  }
};

/**
 * PrepPackageCard 組件屬性
 */
export interface PrepPackageCardProps {
  /** 準備包數據 */
  package: MeetingPrepPackage;
  /** 查看詳情回調 */
  onView?: (id: string) => void;
  /** 編輯回調 */
  onEdit?: (id: string) => void;
  /** 分享回調 */
  onShare?: (id: string) => void;
  /** 刪除回調 */
  onDelete?: (id: string) => void;
  /** 是否顯示操作按鈕 */
  showActions?: boolean;
  /** 卡片點擊回調 */
  onClick?: (id: string) => void;
  /** 自定義類名 */
  className?: string;
}

/**
 * 會議準備包卡片組件
 *
 * @example
 * ```tsx
 * <PrepPackageCard
 *   package={prepPackage}
 *   onView={(id) => router.push(`/prep-packages/${id}`)}
 *   onEdit={(id) => setEditingId(id)}
 *   onShare={(id) => handleShare(id)}
 *   onDelete={(id) => handleDelete(id)}
 *   showActions={true}
 * />
 * ```
 */
export function PrepPackageCard({
  package: pkg,
  onView,
  onEdit,
  onShare,
  onDelete,
  showActions = true,
  onClick,
  className = ''
}: PrepPackageCardProps) {

  // 計算完成進度
  const totalItems = pkg.items.length;
  const completedItems = pkg.items.filter(item => item.metadata?.completed).length;
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // 獲取類型和狀態配置
  const typeConfig = PACKAGE_TYPE_CONFIG[pkg.type];
  const statusConfig = PACKAGE_STATUS_CONFIG[pkg.status];

  // 格式化閱讀時間
  const formatReadTime = (minutes?: number): string => {
    if (!minutes) return '未知';
    if (minutes < 60) return `${minutes}分鐘`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小時${mins}分鐘` : `${hours}小時`;
  };

  // 卡片點擊處理
  const handleCardClick = () => {
    if (onClick) {
      onClick(pkg.id);
    }
  };

  return (
    <Card
      className={`hover:shadow-lg transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-10`}>
              {typeConfig.icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {pkg.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {pkg.description || '無描述'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 類型和會議日期 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {typeConfig.label}
            </Badge>
            {pkg.metadata.meetingDate && (
              <span className="text-muted-foreground">
                {new Date(pkg.metadata.meetingDate).toLocaleDateString('zh-TW')}
              </span>
            )}
          </div>
          {pkg.metadata.totalEstimatedReadTime && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatReadTime(pkg.metadata.totalEstimatedReadTime)}</span>
            </div>
          )}
        </div>

        {/* 進度條 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">完成進度</span>
            <span className="font-medium">
              {completedItems}/{totalItems} 項目
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* 客戶名稱和目標 */}
        {pkg.metadata.customerName && (
          <div className="text-sm">
            <span className="text-muted-foreground">客戶：</span>
            <span className="font-medium ml-1">{pkg.metadata.customerName}</span>
          </div>
        )}

        {pkg.metadata.objectives && pkg.metadata.objectives.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">目標：</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {pkg.metadata.objectives.slice(0, 2).map((objective, idx) => (
                <li key={idx}>{objective}</li>
              ))}
              {pkg.metadata.objectives.length > 2 && (
                <li className="text-xs">還有 {pkg.metadata.objectives.length - 2} 個目標...</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(pkg.id);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            查看
          </Button>
          {pkg.status !== PrepPackageStatus.ARCHIVED && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(pkg.id);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                編輯
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(pkg.id);
                }}
              >
                <Share2 className="h-4 w-4 mr-1" />
                分享
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(pkg.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default PrepPackageCard;
