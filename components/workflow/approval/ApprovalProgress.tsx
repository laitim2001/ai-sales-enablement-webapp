/**
 * @fileoverview 審批進度組件功能：- 顯示多級審批流程進度- 並行審批狀態追蹤- 審批歷史時間線- 當前審批者信息作者：Claude Code日期：2025-10-01
 * @module components/workflow/approval/ApprovalProgress
 * @description
 * 審批進度組件功能：- 顯示多級審批流程進度- 並行審批狀態追蹤- 審批歷史時間線- 當前審批者信息作者：Claude Code日期：2025-10-01
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  ArrowRight,
  Users,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { ApprovalStatus, ApprovalTask } from './ApprovalTaskList';

interface ApprovalLevel {
  level: number;
  name: string;
  approvalType: 'SEQUENTIAL' | 'PARALLEL' | 'ANY_ONE';
  tasks: ApprovalTask[];
}

interface ApprovalProgressProps {
  levels: ApprovalLevel[];
  currentLevel: number;
}

export function ApprovalProgress({
  levels,
  currentLevel,
}: ApprovalProgressProps) {
  // 計算整體進度
  const getTotalProgress = () => {
    const totalLevels = levels.length;
    const completedLevels = levels.filter((level) =>
      isLevelCompleted(level)
    ).length;
    return (completedLevels / totalLevels) * 100;
  };

  // 判斷級別是否完成
  const isLevelCompleted = (level: ApprovalLevel) => {
    if (level.approvalType === 'ANY_ONE') {
      return level.tasks.some((t) => t.status === 'APPROVED');
    } else {
      return level.tasks.every(
        (t) => t.status === 'APPROVED' || t.status === 'REJECTED'
      );
    }
  };

  // 判斷級別是否進行中
  const isLevelActive = (level: ApprovalLevel) => {
    return level.level === currentLevel;
  };

  // 獲取級別狀態
  const getLevelStatus = (
    level: ApprovalLevel
  ): 'completed' | 'active' | 'pending' => {
    if (isLevelCompleted(level)) return 'completed';
    if (isLevelActive(level)) return 'active';
    return 'pending';
  };

  // 獲取狀態樣式
  const getStatusStyle = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
        };
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
        };
    }
  };

  // 獲取審批類型標籤
  const getApprovalTypeLabel = (type: ApprovalLevel['approvalType']) => {
    switch (type) {
      case 'SEQUENTIAL':
        return '順序審批';
      case 'PARALLEL':
        return '並行審批';
      case 'ANY_ONE':
        return '任一批准';
    }
  };

  const totalProgress = getTotalProgress();

  return (
    <div className="space-y-6">
      {/* 整體進度 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">審批進度</CardTitle>
          <CardDescription>
            第 {currentLevel} / {levels.length} 級 •{' '}
            {Math.round(totalProgress)}% 完成
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={totalProgress} className="h-2" />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>開始</span>
            <span>完成</span>
          </div>
        </CardContent>
      </Card>

      {/* 審批級別列表 */}
      <div className="space-y-4">
        {levels.map((level, index) => {
          const status = getLevelStatus(level);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

          return (
            <div key={level.level} className="relative">
              {/* 連接線 */}
              {index < levels.length - 1 && (
                <div className="absolute left-6 top-16 h-full w-0.5 bg-gray-200" />
              )}

              <Card
                className={`relative ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {/* 級別圖標 */}
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="text-lg font-bold">{level.level}</span>
                      )}
                    </div>

                    {/* 級別信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {level.name}
                        </CardTitle>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {getApprovalTypeLabel(level.approvalType)}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="bg-blue-600">
                            進行中
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge
                            variant="default"
                            className="gap-1 bg-green-600"
                          >
                            <CheckCircle className="h-3 w-3" />
                            已完成
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {level.tasks.length} 位審批者
                        {level.approvalType === 'PARALLEL' &&
                          ' • 需要全部批准'}
                        {level.approvalType === 'ANY_ONE' &&
                          ' • 任一批准即可'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* 審批者列表 */}
                  <div className="space-y-2">
                    {level.tasks.map((task) => {
                      const taskStyle = getStatusStyle(task.status);
                      const TaskIcon = taskStyle.icon;

                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between rounded-md border p-3 ${
                            task.status === 'PENDING' && isActive
                              ? 'border-blue-200 bg-blue-50'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-200 text-xs">
                                {task.assignee.first_name.charAt(0)}
                                {task.assignee.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {task.assignee.first_name}{' '}
                                  {task.assignee.last_name}
                                </span>
                                {task.delegated_from && (
                                  <Badge
                                    variant="outline"
                                    className="gap-1 text-xs"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                    委派
                                  </Badge>
                                )}
                              </div>
                              {task.completed_at && (
                                <div className="text-xs text-gray-500">
                                  {formatDistanceToNow(
                                    new Date(task.completed_at),
                                    {
                                      addSuffix: true,
                                      locale: zhTW,
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <Badge
                            className={`gap-1 ${taskStyle.bg} ${taskStyle.color}`}
                          >
                            <TaskIcon className="h-3 w-3" />
                            {task.status === 'APPROVED' && '已批准'}
                            {task.status === 'REJECTED' && '已拒絕'}
                            {task.status === 'PENDING' && '待處理'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* 審批意見 */}
                  {level.tasks
                    .filter((t) => t.comment)
                    .map((task) => (
                      <div
                        key={`comment-${task.id}`}
                        className="mt-3 rounded-md bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          {task.assignee.first_name} {task.assignee.last_name}{' '}
                          的意見
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {task.comment}
                        </p>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 精簡進度組件（用於側邊欄）
 */
export function CompactApprovalProgress({
  levels,
  currentLevel,
}: ApprovalProgressProps) {
  const totalLevels = levels.length;
  const progress = (currentLevel / totalLevels) * 100;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">審批進度</span>
          <span className="text-gray-500">
            {currentLevel}/{totalLevels}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </div>

      <div className="space-y-2">
        {levels.slice(0, 3).map((level) => {
          const isActive = level.level === currentLevel;
          const isCompleted = level.level < currentLevel;

          return (
            <div
              key={level.level}
              className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-800'
                  : isCompleted
                  ? 'bg-green-50 text-green-800'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="font-medium">{level.name}</span>
            </div>
          );
        })}

        {levels.length > 3 && (
          <div className="text-center text-xs text-gray-400">
            還有 {levels.length - 3} 個級別...
          </div>
        )}
      </div>
    </div>
  );
}
