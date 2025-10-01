/**
 * 通知鈴鐺組件 (Notification Bell Component)
 *
 * 顯示在導航欄的通知圖標，包含未讀計數徽章和下拉預覽
 *
 * 功能：
 * 1. 顯示未讀通知數量徽章
 * 2. 點擊展開通知預覽下拉框
 * 3. 顯示最近的通知（前5條）
 * 4. 支援快速標記已讀和跳轉
 * 5. 實時更新未讀數（可選）
 *
 * @module components/notifications/notification-bell
 * @since Sprint 5 Week 10 Day 2
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Settings } from 'lucide-react'
import { NotificationItem, NotificationData } from './notification-item'

/**
 * 通知統計接口
 */
interface NotificationStats {
  totalUnread: number
  highPriorityUnread: number
  recentNotifications: NotificationData[]
}

/**
 * 通知鈴鐺組件
 */
export const NotificationBell: React.FC = () => {
  // 狀態管理
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * 獲取通知統計
   */
  const fetchStats = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStats(result.data)
        }
      }
    } catch (err) {
      console.error('獲取通知統計失敗:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 標記通知為已讀
   */
  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })

      // 重新獲取統計
      fetchStats()
    } catch (err) {
      console.error('標記已讀失敗:', err)
    }
  }

  /**
   * 點擊外部關閉下拉框
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /**
   * 初始加載統計
   */
  useEffect(() => {
    fetchStats()

    // 每30秒自動刷新（可選）
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  /**
   * 打開/關閉下拉框
   */
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchStats() // 打開時刷新
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知鈴鐺按鈕 */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="通知"
      >
        <Bell className="h-6 w-6" />

        {/* 未讀徽章 */}
        {stats && stats.totalUnread > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {stats.totalUnread > 99 ? '99+' : stats.totalUnread}
          </span>
        )}

        {/* 高優先級指示器 */}
        {stats && stats.highPriorityUnread > 0 && (
          <span className="absolute bottom-1 right-1 h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* 下拉通知預覽 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* 標題欄 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">通知</h3>
              {stats && stats.totalUnread > 0 && (
                <p className="text-sm text-gray-500">
                  {stats.totalUnread} 條未讀
                  {stats.highPriorityUnread > 0 && (
                    <span className="ml-2 text-orange-500">
                      ({stats.highPriorityUnread} 條高優先級)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* 設置按鈕 */}
            <Link
              href="/dashboard/notifications/preferences"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="通知設置"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>

          {/* 通知列表 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : stats && stats.recentNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recentNotifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="p-3 hover:bg-gray-50">
                    <NotificationItem
                      notification={notification}
                      onRead={markAsRead}
                      onClick={(n) => {
                        setIsOpen(false)
                        if (n.action_url) {
                          window.location.href = n.action_url
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">暫無通知</p>
              </div>
            )}
          </div>

          {/* 底部操作欄 */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Link
              href="/dashboard/notifications"
              className="block w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => setIsOpen(false)}
            >
              查看所有通知 →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
