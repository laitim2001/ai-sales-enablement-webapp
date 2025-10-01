/**
 * 通知中心頁面 (Notifications Center Page)
 *
 * 通知管理主頁面，支援分類查看、批量操作和偏好設置
 *
 * 功能：
 * 1. 按分類查看通知
 * 2. 篩選未讀通知
 * 3. 批量標記已讀/刪除
 * 4. 跳轉到通知偏好設置
 *
 * @module app/dashboard/notifications/page
 * @since Sprint 5 Week 10 Day 2
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { NotificationList } from '@/components/notifications/notification-list'
import { NotificationCategory } from '@prisma/client'
import { Settings, Filter } from 'lucide-react'

/**
 * 分類標籤配置
 */
const CATEGORY_TABS = [
  { value: null, label: '全部' },
  { value: NotificationCategory.WORKFLOW, label: '工作流程' },
  { value: NotificationCategory.APPROVAL, label: '審批' },
  { value: NotificationCategory.COMMENT, label: '評論' },
  { value: NotificationCategory.SYSTEM, label: '系統' },
  { value: NotificationCategory.CUSTOM, label: '自定義' }
]

/**
 * 通知中心頁面組件
 */
export default function NotificationsPage() {
  // 狀態管理
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(null)
  const [unreadOnly, setUnreadOnly] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
          <p className="mt-1 text-gray-600">查看和管理您的所有通知</p>
        </div>

        {/* 偏好設置按鈕 */}
        <Link
          href="/dashboard/notifications/preferences"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Settings className="h-5 w-5" />
          通知設置
        </Link>
      </div>

      {/* 分類標籤和過濾器 */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        {/* 分類標籤 */}
        <div className="flex items-center border-b border-gray-200 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setSelectedCategory(tab.value as NotificationCategory | null)}
              className={`
                px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${selectedCategory === tab.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 過濾器 */}
        <div className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">過濾：</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">只顯示未讀</span>
          </label>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <NotificationList
          category={selectedCategory || undefined}
          unreadOnly={unreadOnly}
          limit={20}
          onNotificationClick={(notification) => {
            // 如果有操作URL，跳轉到對應頁面
            if (notification.action_url) {
              window.location.href = notification.action_url
            }
          }}
        />
      </div>
    </div>
  )
}
