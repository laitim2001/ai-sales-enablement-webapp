/**
 * @fileoverview EditLockIndicator - 工具模組
 * @module components/collaboration/EditLockIndicator
 *
 * EditLockIndicator - 工具模組
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

/**
 * 編輯鎖定指示器組件
 *
 * 顯示文檔的編輯鎖定狀態和衝突警告
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface EditLockInfo {
  id: string;
  userId: number;
  userName: string;
  expiresAt: Date;
  isOwnLock: boolean;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictType?: 'LOCKED_BY_OTHER' | 'CONCURRENT_EDIT' | 'VERSION_MISMATCH';
  message?: string;
  currentVersion?: number;
}

interface EditLockIndicatorProps {
  resourceType: string;
  resourceId: number;
  currentUserId: number;
  onLockStatusChange?: (isLocked: boolean, lock?: EditLockInfo) => void;
  refreshInterval?: number; // 刷新間隔（毫秒）
}

export const EditLockIndicator: React.FC<EditLockIndicatorProps> = ({
  resourceType,
  resourceId,
  currentUserId,
  onLockStatusChange,
  refreshInterval = 30000, // 默認30秒刷新一次
}) => {
  const [lockInfo, setLockInfo] = useState<EditLockInfo | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 檢查鎖定狀態
  const checkLockStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/collaboration/locks/${resourceType}/${resourceId}/status`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.lock) {
          const lock: EditLockInfo = {
            id: data.lock.id,
            userId: data.lock.userId,
            userName: data.lock.userName,
            expiresAt: new Date(data.lock.expiresAt),
            isOwnLock: data.lock.userId === currentUserId,
          };

          setLockInfo(lock);
          onLockStatusChange?.(true, lock);
        } else {
          setLockInfo(null);
          onLockStatusChange?.(false);
        }

        setConflictInfo(data.conflict || null);
      }
    } catch (error) {
      console.error('Failed to check lock status:', error);
    }
  }, [resourceType, resourceId, currentUserId, onLockStatusChange]);

  // 定期刷新鎖定狀態
  useEffect(() => {
    checkLockStatus();

    const interval = setInterval(checkLockStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [checkLockStatus, refreshInterval]);

  // 獲取鎖定
  const acquireLock = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/collaboration/locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        await checkLockStatus();
      } else {
        const error = await response.json();
        alert(`無法獲取編輯鎖定: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      alert('獲取編輯鎖定失敗');
    } finally {
      setLoading(false);
    }
  };

  // 釋放鎖定
  const releaseLock = async () => {
    if (!lockInfo) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/collaboration/locks/${lockInfo.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        await checkLockStatus();
      } else {
        const error = await response.json();
        alert(`無法釋放編輯鎖定: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to release lock:', error);
      alert('釋放編輯鎖定失敗');
    } finally {
      setLoading(false);
    }
  };

  // 格式化剩餘時間
  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return '已過期';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} 小時 ${minutes % 60} 分鐘`;
    }

    return `${minutes} 分鐘`;
  };

  // 如果有衝突，顯示警告
  if (conflictInfo?.hasConflict) {
    const alertVariants: Record<string, 'default' | 'destructive'> = {
      LOCKED_BY_OTHER: 'destructive',
      CONCURRENT_EDIT: 'destructive',
      VERSION_MISMATCH: 'destructive',
    };

    return (
      <Alert variant={alertVariants[conflictInfo.conflictType || 'LOCKED_BY_OTHER']}>
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{conflictInfo.message}</span>
          </div>

          {conflictInfo.conflictType === 'VERSION_MISMATCH' && (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-white text-red-600 rounded hover:bg-red-50"
            >
              重新載入
            </button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // 如果被其他人鎖定
  if (lockInfo && !lockInfo.isOwnLock) {
    return (
      <Alert variant="default">
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <span>
              {lockInfo.userName} 正在編輯此文檔
              <span className="ml-2 text-sm text-gray-500">
                (剩餘 {formatTimeRemaining(lockInfo.expiresAt)})
              </span>
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // 如果是自己的鎖定
  if (lockInfo && lockInfo.isOwnLock) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>
              您正在編輯此文檔
              <span className="ml-2 text-sm text-gray-600">
                (鎖定剩餘 {formatTimeRemaining(lockInfo.expiresAt)})
              </span>
            </span>
          </div>

          <button
            onClick={releaseLock}
            disabled={loading}
            className="px-3 py-1 text-sm bg-white text-green-700 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50"
          >
            {loading ? '處理中...' : '釋放鎖定'}
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // 沒有鎖定 - 顯示獲取鎖定按鈕
  return (
    <Alert variant="default" className="bg-blue-50 border-blue-200">
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔓</span>
          <span>文檔當前可編輯</span>
        </div>

        <button
          onClick={acquireLock}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '處理中...' : '開始編輯'}
        </button>
      </AlertDescription>
    </Alert>
  );
};
