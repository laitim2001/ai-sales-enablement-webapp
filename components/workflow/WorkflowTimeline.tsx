/**
 * @fileoverview 工作流程時間線組件功能：- 顯示提案狀態轉換歷史- 垂直時間線佈局- 顯示轉換詳情（時間、用戶、原因）- 支持自動轉換標記作者：Claude Code日期：2025-10-01
 * @module components/workflow/WorkflowTimeline
 * @description
 * 工作流程時間線組件功能：- 顯示提案狀態轉換歷史- 垂直時間線佈局- 顯示轉換詳情（時間、用戶、原因）- 支持自動轉換標記作者：Claude Code日期：2025-10-01
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import React from 'react';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { ProposalStatus } from '@prisma/client';
import { Clock, User, MessageSquare, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface WorkflowStateHistoryItem {
  id: number;
  from_state: ProposalStatus;
  to_state: ProposalStatus;
  transitioned_at: Date;
  triggered_by?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  reason?: string | null;
  comment?: string | null;
  auto_triggered: boolean;
}

interface WorkflowTimelineProps {
  history: WorkflowStateHistoryItem[];
  currentState: ProposalStatus;
  compact?: boolean;
}

export function WorkflowTimeline({
  history,
  currentState,
  compact = false,
}: WorkflowTimelineProps) {
  // 按時間倒序排列（最新的在上面）
  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.transitioned_at).getTime() -
      new Date(a.transitioned_at).getTime()
  );

  return (
    <div className="relative">
      {/* 時間線主體 */}
      <div className="space-y-4">
        {/* 當前狀態標記 */}
        <div className="flex items-start gap-4">
          {/* 時間線點 */}
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 ring-4 ring-blue-100">
              <Clock className="h-5 w-5 text-white" />
            </div>
            {sortedHistory.length > 0 && (
              <div className="absolute left-1/2 top-10 h-6 w-0.5 -translate-x-1/2 bg-gray-300" />
            )}
          </div>

          {/* 當前狀態內容 */}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                當前狀態
              </span>
              <ProposalStatusBadge status={currentState} size="sm" />
            </div>
            <p className="mt-1 text-xs text-gray-500">正在處理中</p>
          </div>
        </div>

        {/* 歷史記錄 */}
        {sortedHistory.map((item, index) => (
          <div key={item.id} className="flex items-start gap-4">
            {/* 時間線點 */}
            <div className="relative flex-shrink-0">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  item.auto_triggered
                    ? 'bg-purple-500 ring-4 ring-purple-100'
                    : 'bg-gray-500 ring-4 ring-gray-100'
                }`}
              >
                {item.auto_triggered ? (
                  <Zap className="h-5 w-5 text-white" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              {index < sortedHistory.length - 1 && (
                <div className="absolute left-1/2 top-10 h-6 w-0.5 -translate-x-1/2 bg-gray-300" />
              )}
            </div>

            {/* 轉換詳情 */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <ProposalStatusBadge
                  status={item.from_state}
                  size="sm"
                  showIcon={false}
                />
                <span className="text-gray-400">→</span>
                <ProposalStatusBadge status={item.to_state} size="sm" />
              </div>

              {/* 時間 */}
              <p className="mt-1 text-xs text-gray-500">
                {formatDistanceToNow(new Date(item.transitioned_at), {
                  addSuffix: true,
                  locale: zhTW,
                })}
              </p>

              {/* 觸發者 */}
              {item.triggered_by && !item.auto_triggered && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  {item.triggered_by.first_name} {item.triggered_by.last_name}
                </p>
              )}

              {/* 自動觸發標記 */}
              {item.auto_triggered && (
                <p className="mt-1 flex items-center gap-1 text-xs text-purple-600">
                  <Zap className="h-3 w-3" />
                  系統自動執行
                </p>
              )}

              {/* 原因 */}
              {!compact && item.reason && (
                <p className="mt-2 text-sm text-gray-700">{item.reason}</p>
              )}

              {/* 評論 */}
              {!compact && item.comment && (
                <div className="mt-2 rounded-md bg-gray-50 p-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    評論
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{item.comment}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 空狀態 */}
        {sortedHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            尚無狀態轉換記錄
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 精簡版時間線（用於側邊欄或卡片）
 */
export function CompactWorkflowTimeline({
  history,
  currentState,
  maxItems = 3,
}: WorkflowTimelineProps & { maxItems?: number }) {
  const recentHistory = history
    .sort(
      (a, b) =>
        new Date(b.transitioned_at).getTime() -
        new Date(a.transitioned_at).getTime()
    )
    .slice(0, maxItems);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ProposalStatusBadge status={currentState} size="sm" />
        <span className="text-xs text-gray-500">當前</span>
      </div>

      {recentHistory.map((item) => (
        <div key={item.id} className="flex items-center gap-2 pl-4">
          <div className="h-2 w-2 rounded-full bg-gray-300" />
          <ProposalStatusBadge
            status={item.from_state}
            size="sm"
            showIcon={false}
          />
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(item.transitioned_at), {
              locale: zhTW,
            })}
          </span>
        </div>
      ))}

      {history.length > maxItems && (
        <div className="pl-4 text-xs text-gray-400">
          還有 {history.length - maxItems} 筆記錄...
        </div>
      )}
    </div>
  );
}
