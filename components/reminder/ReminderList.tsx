/**
 * 提醒列表組件
 *
 * 功能：
 * - 顯示用戶的所有提醒
 * - 支持按狀態篩選
 * - 支持刷新列表
 * - 集成提醒卡片操作
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Bell, CheckCircle, Clock } from 'lucide-react';
import { ReminderCard } from './ReminderCard';
import { ReminderRecord, ReminderStatus } from '@/lib/reminder';

interface ReminderListProps {
  initialReminders?: ReminderRecord[];
  autoRefreshInterval?: number; // 自動刷新間隔（毫秒）
}

export const ReminderList: React.FC<ReminderListProps> = ({
  initialReminders = [],
  autoRefreshInterval,
}) => {
  const [reminders, setReminders] = useState<ReminderRecord[]>(initialReminders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReminderStatus | 'ALL'>('ALL');

  // 狀態篩選選項
  const statusOptions = [
    { value: 'ALL', label: '全部', icon: Bell },
    { value: ReminderStatus.PENDING, label: '待觸發', icon: Clock },
    { value: ReminderStatus.TRIGGERED, label: '已觸發', icon: Bell },
    { value: ReminderStatus.SNOOZED, label: '已延遲', icon: Clock },
  ];

  // 獲取提醒列表
  const fetchReminders = async (status?: ReminderStatus) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('未登入');
      }

      const url =
        status && status !== ('ALL' as ReminderStatus)
          ? `/api/reminders?status=${status}`
          : '/api/reminders';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }

      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  // 延遲提醒
  const handleSnooze = async (reminderId: string, minutes: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('未登入');
      }

      const response = await fetch(`/api/reminders/${reminderId}/snooze`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ snoozeMinutes: minutes }),
      });

      if (!response.ok) {
        throw new Error('Failed to snooze reminder');
      }

      // 刷新列表
      fetchReminders(filterStatus === 'ALL' ? undefined : filterStatus);
    } catch (err) {
      console.error('Error snoozing reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to snooze reminder');
    }
  };

  // 忽略提醒
  const handleDismiss = async (reminderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('未登入');
      }

      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss reminder');
      }

      // 從列表中移除
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error('Error dismissing reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to dismiss reminder');
    }
  };

  // 處理操作按鈕點擊
  const handleAction = (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (reminder?.actionUrl) {
      window.location.href = reminder.actionUrl;
    }
  };

  // 手動刷新
  const handleRefresh = () => {
    fetchReminders(filterStatus === 'ALL' ? undefined : filterStatus);
  };

  // 篩選狀態改變
  const handleFilterChange = (status: ReminderStatus | 'ALL') => {
    setFilterStatus(status);
    fetchReminders(status === 'ALL' ? undefined : status);
  };

  // 初始加載
  useEffect(() => {
    if (initialReminders.length === 0) {
      fetchReminders();
    }
  }, []);

  // 自動刷新
  useEffect(() => {
    if (autoRefreshInterval && autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchReminders(filterStatus === 'ALL' ? undefined : filterStatus);
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, filterStatus]);

  // 篩選後的提醒
  const filteredReminders = reminders;

  return (
    <div className="w-full">
      {/* 頭部 - 篩選和刷新 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-1">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filterStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value as ReminderStatus | 'ALL')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <Icon className="w-3 h-3" />
                    <span>{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 rounded text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 提醒列表 */}
      {loading && filteredReminders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">載入中...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">沒有提醒</p>
        </div>
      ) : (
        <div>
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onSnooze={handleSnooze}
              onDismiss={handleDismiss}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* 提醒計數 */}
      {filteredReminders.length > 0 && (
        <div className="mt-4 text-center text-xs text-gray-500">
          共 {filteredReminders.length} 個提醒
        </div>
      )}
    </div>
  );
};
