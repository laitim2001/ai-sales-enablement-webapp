/**
 * 通知列表組件 (Notification List Component)
 *
 * 顯示通知列表，支援分頁、過濾和批量操作
 *
 * 功能：
 * 1. 分頁加載通知
 * 2. 按分類過濾
 * 3. 批量標記已讀
 * 4. 批量刪除
 * 5. 實時更新（可選）
 *
 * @module components/notifications/notification-list
 * @since Sprint 5 Week 10 Day 2
 */

'use client'

import React, { useState, useEffect } from 'react'
import { NotificationItem, NotificationData } from './notification-item'
import { NotificationCategory } from '@prisma/client'
import { CheckCheck, Trash2, Filter, Loader2 } from 'lucide-react'

/**
 * 通知列表組件屬性
 */
interface NotificationListProps {
  category?: NotificationCategory
  unreadOnly?: boolean
  limit?: number
  onNotificationClick?: (notification: NotificationData) => void
}

/**
 * 通知列表組件
 */
export const NotificationList: React.FC<NotificationListProps> = ({
  category,
  unreadOnly = false,
  limit = 20,
  onNotificationClick
}) => {
  // 狀態管理
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  /**
   * 獲取通知列表
   */
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (category) params.append('category', category)
      if (unreadOnly) params.append('unreadOnly', 'true')

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('獲取通知失敗')
      }

      const result = await response.json()

      if (result.success) {
        setNotifications(result.data.notifications)
        setTotalPages(result.data.pagination.totalPages)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 標記通知為已讀
   */
  const markAsRead = async (notificationIds: number[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        // 更新本地狀態
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        )
      }
    } catch (err) {
      console.error('標記已讀失敗:', err)
    }
  }

  /**
   * 刪除通知
   */
  const deleteNotifications = async (notificationIds: number[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        // 從列表中移除
        setNotifications(prev =>
          prev.filter(n => !notificationIds.includes(n.id))
        )
        setSelectedIds(new Set())
      }
    } catch (err) {
      console.error('刪除通知失敗:', err)
    }
  }

  /**
   * 標記所有為已讀
   */
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markAllAsRead: true,
          category: category || undefined
        })
      })

      if (response.ok) {
        // 重新加載通知
        fetchNotifications()
      }
    } catch (err) {
      console.error('全部標記已讀失敗:', err)
    }
  }

  /**
   * 切換選中狀態
   */
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  /**
   * 全選/取消全選
   */
  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)))
    }
  }

  // 初始加載和分頁變化時重新獲取
  useEffect(() => {
    fetchNotifications()
  }, [page, category, unreadOnly])

  // 加載狀態
  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchNotifications}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          重試
        </button>
      </div>
    )
  }

  // 空狀態
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">暫無通知</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 批量操作工具欄 */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.size === notifications.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-600">
            {selectedIds.size > 0 ? `已選中 ${selectedIds.size} 項` : '全選'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 全部標記已讀 */}
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="全部標記已讀"
          >
            <CheckCheck className="h-4 w-4" />
            全部已讀
          </button>

          {/* 批量標記已讀 */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => markAsRead(Array.from(selectedIds))}
              className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              標記已讀
            </button>
          )}

          {/* 批量刪除 */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => deleteNotifications(Array.from(selectedIds))}
              className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              刪除
            </button>
          )}
        </div>
      </div>

      {/* 通知列表 */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={selectedIds.has(notification.id)}
              onChange={() => toggleSelect(notification.id)}
              className="mt-5 h-4 w-4 text-blue-600 rounded"
            />
            <div className="flex-1">
              <NotificationItem
                notification={notification}
                onRead={(id) => markAsRead([id])}
                onDelete={(id) => deleteNotifications([id])}
                onClick={onNotificationClick}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 分頁控制 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一頁
          </button>
          <span className="text-sm text-gray-600">
            第 {page} / {totalPages} 頁
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  )
}

// 缺少的 Bell 圖標導入
import { Bell } from 'lucide-react'
