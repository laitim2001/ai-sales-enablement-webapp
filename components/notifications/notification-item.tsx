/**
 * @fileoverview 通知項目組件 (Notification Item Component)顯示單個通知的詳細信息，支援不同類型的通知展示功能：1. 根據通知類型顯示不同圖標和樣式2. 支援已讀/未讀狀態3. 顯示時間戳和優先級4. 支援點擊跳轉和操作@module components/notifications/notification-item@since Sprint 5 Week 10 Day 2
 * @module components/notifications/notification-item
 * @description
 * 通知項目組件 (Notification Item Component)顯示單個通知的詳細信息，支援不同類型的通知展示功能：1. 根據通知類型顯示不同圖標和樣式2. 支援已讀/未讀狀態3. 顯示時間戳和優先級4. 支援點擊跳轉和操作@module components/notifications/notification-item@since Sprint 5 Week 10 Day 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  MessageSquare,
  UserPlus,
  Clock,
  XCircle
} from 'lucide-react'
import { NotificationType, NotificationPriority } from '@prisma/client'

/**
 * 通知數據接口
 */
export interface NotificationData {
  id: number
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
  action_text?: string
  data?: Record<string, any>
}

/**
 * 通知項目組件屬性
 */
interface NotificationItemProps {
  notification: NotificationData
  onRead?: (id: number) => void
  onDelete?: (id: number) => void
  onClick?: (notification: NotificationData) => void
}

/**
 * 根據通知類型獲取對應圖標
 */
const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    // 工作流程相關
    WORKFLOW_STATE_CHANGED: <FileText className="h-5 w-5" />,
    WORKFLOW_ASSIGNED: <UserPlus className="h-5 w-5" />,
    WORKFLOW_APPROVED: <CheckCircle className="h-5 w-5" />,
    WORKFLOW_REJECTED: <XCircle className="h-5 w-5" />,
    WORKFLOW_REVISION_REQUESTED: <AlertCircle className="h-5 w-5" />,

    // 審批相關
    APPROVAL_REQUESTED: <AlertCircle className="h-5 w-5" />,
    APPROVAL_REMINDER: <Clock className="h-5 w-5" />,
    APPROVAL_DELEGATED: <UserPlus className="h-5 w-5" />,
    APPROVAL_OVERDUE: <XCircle className="h-5 w-5" />,

    // 評論相關
    COMMENT_ADDED: <MessageSquare className="h-5 w-5" />,
    COMMENT_MENTION: <MessageSquare className="h-5 w-5" />,
    COMMENT_REPLY: <MessageSquare className="h-5 w-5" />,
    COMMENT_RESOLVED: <CheckCircle className="h-5 w-5" />,

    // 版本相關
    VERSION_CREATED: <FileText className="h-5 w-5" />,
    VERSION_RESTORED: <FileText className="h-5 w-5" />,

    // 提案相關
    PROPOSAL_SHARED: <FileText className="h-5 w-5" />,
    PROPOSAL_VIEWED: <FileText className="h-5 w-5" />,
    PROPOSAL_EXPIRED: <AlertCircle className="h-5 w-5" />,

    // 系統相關
    SYSTEM_MAINTENANCE: <AlertCircle className="h-5 w-5" />,
    SYSTEM_ANNOUNCEMENT: <Info className="h-5 w-5" />,
    SYSTEM_UPDATE: <Info className="h-5 w-5" />,

    // 自定義
    CUSTOM: <Bell className="h-5 w-5" />
  }

  return iconMap[type] || <Bell className="h-5 w-5" />
}

/**
 * 根據優先級獲取顏色類名
 */
const getPriorityColor = (priority: NotificationPriority) => {
  const colorMap: Record<NotificationPriority, string> = {
    LOW: 'text-gray-500',
    NORMAL: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-500'
  }

  return colorMap[priority] || 'text-gray-500'
}

/**
 * 通知項目組件
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  onClick
}) => {
  const iconColor = getPriorityColor(notification.priority)

  const handleClick = () => {
    // 如果未讀，自動標記為已讀
    if (!notification.is_read && onRead) {
      onRead(notification.id)
    }

    // 執行自定義點擊處理
    if (onClick) {
      onClick(notification)
    }
  }

  const content = (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-lg border transition-all
        ${notification.is_read
          ? 'bg-white border-gray-200'
          : 'bg-blue-50 border-blue-200'
        }
        hover:shadow-md cursor-pointer
      `}
      onClick={handleClick}
    >
      {/* 通知圖標 */}
      <div className={`flex-shrink-0 ${iconColor}`}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* 通知內容 */}
      <div className="flex-1 min-w-0">
        {/* 標題和時間 */}
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-medium ${notification.is_read ? 'text-gray-900' : 'text-blue-900'}`}>
            {notification.title}
          </h4>
          <time className="text-xs text-gray-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: zhCN
            })}
          </time>
        </div>

        {/* 消息內容 */}
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {notification.message}
        </p>

        {/* 操作按鈕 */}
        {notification.action_url && notification.action_text && (
          <div className="mt-2">
            <Link
              href={notification.action_url}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.action_text} →
            </Link>
          </div>
        )}
      </div>

      {/* 操作按鈕組 */}
      <div className="flex items-center gap-2">
        {/* 刪除按鈕 */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="刪除通知"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}

        {/* 未讀指示器 */}
        {!notification.is_read && (
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        )}
      </div>
    </div>
  )

  return content
}
