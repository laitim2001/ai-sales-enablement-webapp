/**
 * 通知已讀標記 API 路由 (Notification Read API Route)
 *
 * 處理通知已讀狀態的更新
 *
 * 端點：
 * - PATCH /api/notifications/read - 標記通知為已讀
 *
 * @module app/api/notifications/read/route
 * @since Sprint 5 Week 10 Day 2
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { InAppNotificationService } from '@/lib/notification/in-app-service'
import { NotificationEngine } from '@/lib/notification/engine'
import { verifyAccessToken } from '@/lib/auth/token-service'

const prisma = new PrismaClient()
const notificationEngine = new NotificationEngine(prisma)
const inAppService = new InAppNotificationService(prisma, notificationEngine)

/**
 * PATCH /api/notifications/read
 *
 * 標記通知為已讀
 *
 * 請求體：
 * - notificationIds: number[] - 要標記的通知ID列表（可選）
 * - markAllAsRead: boolean - 標記所有通知為已讀（可選）
 * - category: string - 只標記特定分類的通知（配合 markAllAsRead 使用）
 *
 * @example
 * PATCH /api/notifications/read
 * Body: { "notificationIds": [1, 2, 3] }
 *
 * @example
 * PATCH /api/notifications/read
 * Body: { "markAllAsRead": true }
 *
 * @example
 * PATCH /api/notifications/read
 * Body: { "markAllAsRead": true, "category": "WORKFLOW" }
 */
export async function PATCH(request: NextRequest) {
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
    const { notificationIds, markAllAsRead, category } = body

    let updatedCount = 0

    if (markAllAsRead) {
      // 標記所有通知為已讀（可選擇特定分類）
      updatedCount = await inAppService.markAllAsRead(userId, category)
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 批量標記指定通知為已讀
      updatedCount = await inAppService.markNotificationsAsRead(notificationIds, userId)
    } else {
      return NextResponse.json(
        { error: 'Invalid request: provide notificationIds or markAllAsRead' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount
      }
    })

  } catch (error) {
    console.error('標記通知已讀失敗:', error)
    return NextResponse.json(
      {
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
