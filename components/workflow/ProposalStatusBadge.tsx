/**
 * 提案狀態徽章組件
 *
 * 功能：
 * - 顯示提案當前狀態
 * - 狀態對應的顏色和圖標
 * - 支持大小變化
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ProposalStatus } from '@prisma/client';
import {
  FileText,
  Clock,
  Search,
  Edit,
  CheckCircle,
  Send,
  Eye,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Archive
} from 'lucide-react';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * 狀態配置映射
 */
const STATUS_CONFIG: Record<ProposalStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  DRAFT: {
    label: '草稿',
    variant: 'outline',
    color: 'text-gray-600',
    icon: FileText,
  },
  PENDING_APPROVAL: {
    label: '待審批',
    variant: 'secondary',
    color: 'text-yellow-600',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: '審核中',
    variant: 'secondary',
    color: 'text-blue-600',
    icon: Search,
  },
  REVISING: {
    label: '修訂中',
    variant: 'outline',
    color: 'text-orange-600',
    icon: Edit,
  },
  APPROVED: {
    label: '已批准',
    variant: 'default',
    color: 'text-green-600',
    icon: CheckCircle,
  },
  SENT: {
    label: '已發送',
    variant: 'default',
    color: 'text-indigo-600',
    icon: Send,
  },
  VIEWED: {
    label: '已查看',
    variant: 'secondary',
    color: 'text-purple-600',
    icon: Eye,
  },
  ACCEPTED: {
    label: '已接受',
    variant: 'default',
    color: 'text-green-700',
    icon: ThumbsUp,
  },
  REJECTED: {
    label: '已拒絕',
    variant: 'destructive',
    color: 'text-red-600',
    icon: ThumbsDown,
  },
  WITHDRAWN: {
    label: '已撤回',
    variant: 'outline',
    color: 'text-gray-500',
    icon: XCircle,
  },
  EXPIRED: {
    label: '已過期',
    variant: 'destructive',
    color: 'text-red-500',
    icon: Archive,
  },
};

/**
 * 大小配置
 */
const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    icon: 'h-5 w-5',
  },
};

export function ProposalStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: ProposalStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${sizeConfig.badge} ${config.color} flex items-center gap-1.5`}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * 狀態組列表顯示（用於顯示所有可能的狀態）
 */
export function ProposalStatusLegend() {
  const allStatuses = Object.keys(STATUS_CONFIG) as ProposalStatus[];

  return (
    <div className="flex flex-wrap gap-2">
      {allStatuses.map((status) => (
        <ProposalStatusBadge key={status} status={status} size="sm" />
      ))}
    </div>
  );
}
