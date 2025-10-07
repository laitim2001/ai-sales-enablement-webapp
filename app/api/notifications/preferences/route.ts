/**
 * @fileoverview 通知偏好設置 API 路由 (Notification Preferences API Route)處理用戶通知偏好的查詢和更新端點：- GET /api/notifications/preferences - 獲取用戶通知偏好- PUT /api/notifications/preferences - 更新用戶通知偏好@module app/api/notifications/preferences/route@since Sprint 5 Week 10 Day 2
 * @module app/api/notifications/preferences/route
 * @description
 * 通知偏好設置 API 路由 (Notification Preferences API Route)處理用戶通知偏好的查詢和更新端點：- GET /api/notifications/preferences - 獲取用戶通知偏好- PUT /api/notifications/preferences - 更新用戶通知偏好@module app/api/notifications/preferences/route@since Sprint 5 Week 10 Day 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, NotificationType, NotificationChannel } from '@prisma/client'
import { NotificationEngine } from '@/lib/notification/engine'
import { verifyAccessToken } from '@/lib/auth/token-service'

const prisma = new PrismaClient()
const notificationEngine = new NotificationEngine(prisma)

/**
 * GET /api/notifications/preferences
 *
 * 獲取用戶通知偏好設置
 *
 * @example
 * GET /api/notifications/preferences
 * Response: {
 *   "success": true,
 *   "data": {
 *     "email_enabled": true,
 *     "in_app_enabled": true,
 *     "enabled_types": ["WORKFLOW_STATUS_CHANGED", ...],
 *     "quiet_hours_start": "22:00",
 *     "quiet_hours_end": "08:00"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證用戶身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = await verifyAccessToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // 獲取用戶通知偏好
    const preferences = await notificationEngine.getUserPreference(userId)

    if (!preferences) {
      // 如果沒有設置，返回默認值
      return NextResponse.json({
        success: true,
        data: {
          email_enabled: true,
          in_app_enabled: true,
          push_enabled: false,
          sms_enabled: false,
          enabled_types: Object.values(NotificationType),
          enabled_channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          quiet_hours_start: null,
          quiet_hours_end: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences
    })

  } catch (error) {
    console.error('獲取通知偏好失敗:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 *
 * 更新用戶通知偏好設置
 *
 * 請求體：
 * - email_enabled: boolean - 是否啟用郵件通知
 * - in_app_enabled: boolean - 是否啟用站內通知
 * - push_enabled: boolean - 是否啟用推送通知
 * - sms_enabled: boolean - 是否啟用短信通知
 * - enabled_types: NotificationType[] - 啟用的通知類型
 * - enabled_channels: NotificationChannel[] - 啟用的通知渠道
 * - quiet_hours_start: string - 安靜時間開始（HH:mm）
 * - quiet_hours_end: string - 安靜時間結束（HH:mm）
 *
 * @example
 * PUT /api/notifications/preferences
 * Body: {
 *   "email_enabled": true,
 *   "in_app_enabled": true,
 *   "enabled_types": ["WORKFLOW_STATUS_CHANGED", "COMMENT_MENTIONED"],
 *   "quiet_hours_start": "22:00",
 *   "quiet_hours_end": "08:00"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // 驗證用戶身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = await verifyAccessToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // 解析請求體
    const body = await request.json()

    // 更新用戶通知偏好
    const updatedPreferences = await notificationEngine.updateUserPreference(userId, body)

    return NextResponse.json({
      success: true,
      data: updatedPreferences
    })

  } catch (error) {
    console.error('更新通知偏好失敗:', error)
    return NextResponse.json(
      {
        error: 'Failed to update notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
