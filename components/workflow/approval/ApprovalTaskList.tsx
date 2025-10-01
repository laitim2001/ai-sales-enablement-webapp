/**
 * 審批任務列表組件
 *
 * 功能：
 * - 顯示待處理和已完成的審批任務
 * - 支持篩選和排序
 * - 顯示任務優先級和截止日期
 * - 快速操作入口
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELEGATED'
  | 'EXPIRED';

export interface ApprovalTask {
  id: number;
  proposal_id: number;
  proposal_title: string;
  assignee: {
    id: number;
    first_name: string;
    last_name: string;
  };
  delegated_from?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  status: ApprovalStatus;
  assigned_at: Date;
  due_date?: Date | null;
  completed_at?: Date | null;
  decision?: 'APPROVE' | 'REJECT' | null;
  comment?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ApprovalTaskListProps {
  tasks: ApprovalTask[];
  currentUserId: number;
  onApprove?: (taskId: number) => void;
  onReject?: (taskId: number) => void;
  onDelegate?: (taskId: number) => void;
  onViewProposal?: (proposalId: number) => void;
}

export function ApprovalTaskList({
  tasks,
  currentUserId,
  onApprove,
  onReject,
  onDelegate,
  onViewProposal,
}: ApprovalTaskListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  // 篩選任務
  const myPendingTasks = tasks.filter(
    (t) => t.status === 'PENDING' && t.assignee.id === currentUserId
  );
  const myCompletedTasks = tasks.filter(
    (t) =>
      (t.status === 'APPROVED' || t.status === 'REJECTED') &&
      t.assignee.id === currentUserId
  );

  // 排序任務
  const sortTasks = (tasks: ApprovalTask[]) => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else {
        return (
          new Date(a.assigned_at).getTime() -
          new Date(b.assigned_at).getTime()
        );
      }
    });
  };

  // 優先級樣式
  const getPriorityStyle = (priority: ApprovalTask['priority']) => {
    switch (priority) {
      case 'HIGH':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          label: '高',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: '中',
        };
      case 'LOW':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: '低',
        };
    }
  };

  // 狀態樣式
  const getStatusStyle = (status: ApprovalStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          label: '待審批',
        };
      case 'APPROVED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          label: '已批准',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          label: '已拒絕',
        };
      case 'DELEGATED':
        return {
          icon: ArrowRight,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          label: '已委派',
        };
      case 'EXPIRED':
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: '已過期',
        };
    }
  };

  // 渲染任務卡片
  const renderTask = (task: ApprovalTask) => {
    const statusStyle = getStatusStyle(task.status);
    const priorityStyle = getPriorityStyle(task.priority);
    const StatusIcon = statusStyle.icon;
    const isOverdue =
      task.status === 'PENDING' &&
      task.due_date &&
      isPast(new Date(task.due_date));

    return (
      <Card
        key={task.id}
        className={`transition-all hover:shadow-md ${
          isOverdue ? 'border-red-300' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{task.proposal_title}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(task.assigned_at), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                </span>
                {task.delegated_from && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <ArrowRight className="h-3 w-3" />
                    委派自 {task.delegated_from.first_name}{' '}
                    {task.delegated_from.last_name}
                  </span>
                )}
              </CardDescription>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={`${priorityStyle.bg} ${priorityStyle.text}`}>
                {priorityStyle.label}優先級
              </Badge>
              <Badge className={`${statusStyle.bg} ${statusStyle.color} gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {statusStyle.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 截止日期警告 */}
          {task.due_date && (
            <div
              className={`mb-3 flex items-center gap-2 rounded-md p-2 text-sm ${
                isOverdue
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>
                截止日期:{' '}
                {formatDistanceToNow(new Date(task.due_date), {
                  addSuffix: true,
                  locale: zhTW,
                })}
                {isOverdue && ' (已逾期)'}
              </span>
            </div>
          )}

          {/* 決策評論 */}
          {task.comment && (
            <div className="mb-3 rounded-md bg-gray-50 p-3">
              <p className="text-xs text-gray-500">審批意見:</p>
              <p className="mt-1 text-sm text-gray-700">{task.comment}</p>
            </div>
          )}

          {/* 操作按鈕 */}
          {task.status === 'PENDING' && (
            <div className="flex flex-wrap gap-2">
              {onApprove && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onApprove(task.id)}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  批准
                </Button>
              )}
              {onReject && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(task.id)}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  拒絕
                </Button>
              )}
              {onDelegate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelegate(task.id)}
                  className="gap-1"
                >
                  <ArrowRight className="h-4 w-4" />
                  委派
                </Button>
              )}
              {onViewProposal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProposal(task.proposal_id)}
                  className="gap-1"
                >
                  查看提案
                </Button>
              )}
            </div>
          )}

          {/* 完成信息 */}
          {task.completed_at && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              於{' '}
              {formatDistanceToNow(new Date(task.completed_at), {
                addSuffix: true,
                locale: zhTW,
              })}{' '}
              完成
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* 統計概覽 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {myPendingTasks.length}
              </div>
              <div className="mt-1 text-sm text-gray-500">待處理</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {
                  myCompletedTasks.filter((t) => t.status === 'APPROVED')
                    .length
                }
              </div>
              <div className="mt-1 text-sm text-gray-500">已批准</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {
                  myCompletedTasks.filter((t) => t.status === 'REJECTED')
                    .length
                }
              </div>
              <div className="mt-1 text-sm text-gray-500">已拒絕</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任務列表 */}
      <Tabs defaultValue="pending">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              待處理 ({myPendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              已完成 ({myCompletedTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* 排序選項 */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              按日期
            </Button>
            <Button
              variant={sortBy === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('priority')}
            >
              按優先級
            </Button>
          </div>
        </div>

        <TabsContent value="pending" className="space-y-3">
          {sortTasks(myPendingTasks).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-500">沒有待處理的審批任務</p>
              </CardContent>
            </Card>
          ) : (
            sortTasks(myPendingTasks).map(renderTask)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {sortTasks(myCompletedTasks).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-500">沒有已完成的審批記錄</p>
              </CardContent>
            </Card>
          ) : (
            sortTasks(myCompletedTasks).map(renderTask)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
