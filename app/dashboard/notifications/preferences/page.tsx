/**
 * @fileoverview 通知偏好設置頁面 (Notification Preferences Page)用戶通知偏好配置頁面功能：1. 渠道開關（郵件、站內、推送、短信）2. 通知類型選擇3. 安靜時間設置4. 保存和重置@module app/dashboard/notifications/preferences/page@since Sprint 5 Week 10 Day 2
 * @module app/dashboard/notifications/preferences/page
 * @description
 * 通知偏好設置頁面 (Notification Preferences Page)用戶通知偏好配置頁面功能：1. 渠道開關（郵件、站內、推送、短信）2. 通知類型選擇3. 安靜時間設置4. 保存和重置@module app/dashboard/notifications/preferences/page@since Sprint 5 Week 10 Day 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationType, NotificationChannel } from '@prisma/client'
import { ArrowLeft, Save, RotateCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'

/**
 * 通知類型標籤配置
 */
const NOTIFICATION_TYPES = [
  { value: NotificationType.WORKFLOW_STATE_CHANGED, label: '工作流程狀態變更', category: '工作流程' },
  { value: NotificationType.WORKFLOW_ASSIGNED, label: '工作流程分配', category: '工作流程' },
  { value: NotificationType.WORKFLOW_APPROVED, label: '工作流程批准', category: '工作流程' },
  { value: NotificationType.WORKFLOW_REJECTED, label: '工作流程被拒絕', category: '工作流程' },
  { value: NotificationType.WORKFLOW_REVISION_REQUESTED, label: '需要修訂', category: '工作流程' },

  { value: NotificationType.APPROVAL_REQUESTED, label: '審批請求', category: '審批' },
  { value: NotificationType.APPROVAL_REMINDER, label: '審批提醒', category: '審批' },
  { value: NotificationType.APPROVAL_DELEGATED, label: '審批委派', category: '審批' },
  { value: NotificationType.APPROVAL_OVERDUE, label: '審批逾期', category: '審批' },

  { value: NotificationType.COMMENT_ADDED, label: '新評論', category: '評論' },
  { value: NotificationType.COMMENT_MENTION, label: '@提及', category: '評論' },
  { value: NotificationType.COMMENT_REPLY, label: '評論回覆', category: '評論' },
  { value: NotificationType.COMMENT_RESOLVED, label: '評論已解決', category: '評論' },

  { value: NotificationType.VERSION_CREATED, label: '版本創建', category: '版本' },
  { value: NotificationType.VERSION_RESTORED, label: '版本恢復', category: '版本' },

  { value: NotificationType.PROPOSAL_SHARED, label: '提案分享', category: '提案' },
  { value: NotificationType.PROPOSAL_VIEWED, label: '提案查看', category: '提案' },
  { value: NotificationType.PROPOSAL_EXPIRED, label: '提案過期', category: '提案' },

  { value: NotificationType.SYSTEM_MAINTENANCE, label: '系統維護', category: '系統' },
  { value: NotificationType.SYSTEM_ANNOUNCEMENT, label: '系統公告', category: '系統' },
  { value: NotificationType.SYSTEM_UPDATE, label: '系統更新', category: '系統' }
]

/**
 * 按分類分組通知類型
 */
const groupedTypes = NOTIFICATION_TYPES.reduce((acc, type) => {
  if (!acc[type.category]) {
    acc[type.category] = []
  }
  acc[type.category].push(type)
  return acc
}, {} as Record<string, typeof NOTIFICATION_TYPES>)

/**
 * 通知偏好設置頁面組件
 */
export default function NotificationPreferencesPage() {
  const router = useRouter()

  // 狀態管理
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    enabled_types: [] as NotificationType[],
    enabled_channels: [] as NotificationChannel[],
    quiet_hours_start: '',
    quiet_hours_end: ''
  })

  /**
   * 獲取當前偏好設置
   */
  const fetchPreferences = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPreferences(result.data)
        }
      }
    } catch (err) {
      console.error('獲取偏好設置失敗:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 保存偏好設置
   */
  const savePreferences = async () => {
    try {
      setSaving(true)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        alert('偏好設置已保存')
        router.push('/dashboard/notifications')
      } else {
        alert('保存失敗，請重試')
      }
    } catch (err) {
      console.error('保存偏好設置失敗:', err)
      alert('保存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  /**
   * 重置為默認值
   */
  const resetToDefault = () => {
    if (confirm('確定要重置為默認設置嗎？')) {
      setPreferences({
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        enabled_types: Object.values(NotificationType),
        enabled_channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        quiet_hours_start: '',
        quiet_hours_end: ''
      })
    }
  }

  /**
   * 切換通知類型
   */
  const toggleType = (type: NotificationType) => {
    setPreferences(prev => ({
      ...prev,
      enabled_types: prev.enabled_types.includes(type)
        ? prev.enabled_types.filter(t => t !== type)
        : [...prev.enabled_types, type]
    }))
  }

  /**
   * 全選/取消全選分類
   */
  const toggleCategory = (category: string) => {
    const categoryTypes: NotificationType[] = groupedTypes[category].map(t => t.value)
    const allSelected = categoryTypes.every(t => preferences.enabled_types.includes(t))

    if (allSelected) {
      setPreferences(prev => ({
        ...prev,
        enabled_types: prev.enabled_types.filter(t => !categoryTypes.includes(t))
      }))
    } else {
      setPreferences(prev => ({
        ...prev,
        enabled_types: [...new Set([...prev.enabled_types, ...categoryTypes])]
      }))
    }
  }

  // 初始加載
  useEffect(() => {
    fetchPreferences()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/notifications"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">通知偏好設置</h1>
          <p className="mt-1 text-gray-600">自定義您的通知接收方式</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 通知渠道設置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">通知渠道</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <span className="text-gray-700">站內通知</span>
              <input
                type="checkbox"
                checked={preferences.in_app_enabled}
                onChange={(e) => setPreferences({ ...preferences, in_app_enabled: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <span className="text-gray-700">郵件通知</span>
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <span className="text-gray-700">推送通知</span>
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={(e) => setPreferences({ ...preferences, push_enabled: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <span className="text-gray-700">短信通知</span>
              <input
                type="checkbox"
                checked={preferences.sms_enabled}
                onChange={(e) => setPreferences({ ...preferences, sms_enabled: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* 通知類型設置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">通知類型</h2>
          <div className="space-y-4">
            {Object.entries(groupedTypes).map(([category, types]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {types.every(t => preferences.enabled_types.includes(t.value)) ? '取消全選' : '全選'}
                  </button>
                </div>
                <div className="space-y-2">
                  {types.map((type) => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enabled_types.includes(type.value)}
                        onChange={() => toggleType(type.value)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 安靜時間設置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">安靜時間</h2>
          <p className="text-sm text-gray-600 mb-4">在指定時間段內不接收通知（系統警告除外）</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">結束時間</label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            重置為默認
          </button>

          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存設置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
