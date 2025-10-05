/**
 * 提醒卡片組件
 *
 * 功能：
 * - 顯示單個提醒的詳細信息
 * - 支持延遲（snooze）和忽略（dismiss）操作
 * - 優先級視覺化展示
 * - 時間格式化顯示
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

'use client';

import React, { useState } from 'react';
import { Bell, Clock, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ReminderRecord, ReminderPriority, ReminderStatus } from '@/lib/reminder';

interface ReminderCardProps {
  reminder: ReminderRecord;
  onSnooze?: (reminderId: string, minutes: number) => void;
  onDismiss?: (reminderId: string) => void;
  onAction?: (reminderId: string) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onSnooze,
  onDismiss,
  onAction,
}) => {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  // 優先級顏色映射
  const priorityConfig = {
    [ReminderPriority.URGENT]: {
      color: 'bg-red-100 border-red-300 text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    [ReminderPriority.HIGH]: {
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
    },
    [ReminderPriority.NORMAL]: {
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      icon: Bell,
      iconColor: 'text-blue-600',
    },
    [ReminderPriority.LOW]: {
      color: 'bg-gray-100 border-gray-300 text-gray-800',
      icon: Info,
      iconColor: 'text-gray-600',
    },
  };

  const config = priorityConfig[reminder.priority];
  const PriorityIcon = config.icon;

  // 延遲選項（分鐘）
  const snoozeOptions = [
    { label: '5 分鐘', value: 5 },
    { label: '15 分鐘', value: 15 },
    { label: '30 分鐘', value: 30 },
    { label: '1 小時', value: 60 },
    { label: '2 小時', value: 120 },
    { label: '明天', value: 1440 },
  ];

  // 格式化時間
  const formatTime = (date: Date) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diff = targetDate.getTime() - now.getTime();
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) {
      return '已過期';
    } else if (minutes < 60) {
      return `${minutes} 分鐘後`;
    } else if (hours < 24) {
      return `${hours} 小時後`;
    } else {
      return `${days} 天後`;
    }
  };

  // 處理延遲
  const handleSnooze = (minutes: number) => {
    if (onSnooze) {
      onSnooze(reminder.id, minutes);
    }
    setShowSnoozeOptions(false);
  };

  // 處理忽略
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(reminder.id);
    }
  };

  // 處理操作按鈕點擊
  const handleActionClick = () => {
    if (onAction) {
      onAction(reminder.id);
    }
  };

  // 不顯示已忽略或已完成的提醒
  if (
    reminder.status === ReminderStatus.DISMISSED ||
    reminder.status === ReminderStatus.COMPLETED
  ) {
    return null;
  }

  return (
    <div
      className={`border rounded-lg p-4 mb-3 transition-all hover:shadow-md ${config.color}`}
    >
      {/* 頭部 - 標題和優先級 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-3 flex-1">
          <PriorityIcon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{reminder.title}</h3>
            <p className="text-xs mt-1 opacity-90">{reminder.message}</p>
          </div>
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
          title="忽略提醒"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 時間信息 */}
      <div className="flex items-center space-x-2 text-xs opacity-75 mb-3">
        <Clock className="w-3 h-3" />
        <span>{formatTime(reminder.scheduledFor)}</span>
        {reminder.snoozedUntil && (
          <span className="ml-2 px-2 py-0.5 bg-white/50 rounded">
            已延遲至 {new Date(reminder.snoozedUntil).toLocaleString('zh-TW')}
          </span>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center space-x-2">
        {reminder.actionUrl && reminder.actionText && (
          <button
            onClick={handleActionClick}
            className="px-3 py-1.5 bg-white rounded text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            {reminder.actionText}
          </button>
        )}

        {/* 延遲按鈕 */}
        <div className="relative">
          <button
            onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
            className="px-3 py-1.5 bg-white/70 rounded text-xs font-medium hover:bg-white transition-colors"
          >
            延遲
          </button>

          {/* 延遲選項彈出框 */}
          {showSnoozeOptions && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[120px]">
              {snoozeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSnooze(option.value)}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
