/**
 * 通知 API 路由 (Notifications API Route)
 *
 * 處理通知的查詢、創建和刪除操作
 *
 * 端點：
 * - GET /api/notifications - 獲取通知列表（支援分頁、過濾）
 * - DELETE /api/notifications - 刪除通知（支援批量刪除）
 *
 * @module app/api/notifications/route
 * @since Sprint 5 Week 10 Day 2
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, NotificationType, NotificationCategory, NotificationStatus } from '@prisma/client'
import { NotificationEngine } from '@/lib/notification/engine'
import { InAppNotificationService } from '@/lib/notification/in-app-service'
import { verifyAccessToken } from '@/lib/auth/token-service'

const prisma = new PrismaClient()
const notificationEngine = new NotificationEngine(prisma)
const inAppService = new InAppNotificationService(prisma, notificationEngine)

/**
 * GET /api/notifications
 *
 * 獲取用戶通知列表
 *
 * 查詢參數：
 * - page: 頁碼（默認 1）
 * - limit: 每頁數量（默認 20）
 * - category: 通知分類過濾
 * - unreadOnly: 只顯示未讀（true/false）
 * - type: 通知類型過濾
 *
 * @example
 * GET /api/notifications?page=1&limit=20&unreadOnly=true
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

    // 解析查詢參數
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') as NotificationCategory | null
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') as NotificationType | null

    // 構建過濾條件
    const where: any = {
      recipient_id: userId
    }

    if (category) {
      where.category = category
    }

    if (unreadOnly) {
      where.is_read = false
    }

    if (type) {
      where.type = type
    }

    // 獲取通知列表
    const notifications = await inAppService.getNotificationList(
      userId,
      {
        category: category || undefined,
        unreadOnly,
        page,
        limit
      }
    )

    // 獲取總數
    const total = await prisma.notification.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('獲取通知列表失敗:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 *
 * 刪除通知（支援批量刪除）
 *
 * 請求體：
 * - notificationIds: number[] - 要刪除的通知ID列表
 * - deleteAll: boolean - 刪除所有已讀通知（可選）
 *
 * @example
 * DELETE /api/notifications
 * Body: { "notificationIds": [1, 2, 3] }
 *
 * @example
 * DELETE /api/notifications
 * Body: { "deleteAll": true }
 */
export async function DELETE(request: NextRequest) {
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
    const { notificationIds, deleteAll } = body

    let deletedCount = 0

    if (deleteAll) {
      // 刪除所有已讀通知
      deletedCount = await inAppService.clearReadNotifications(userId)
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 批量刪除指定通知
      deletedCount = await inAppService.deleteNotifications(userId, notificationIds)
    } else {
      return NextResponse.json(
        { error: 'Invalid request: provide notificationIds or deleteAll' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount
      }
    })

  } catch (error) {
    console.error('刪除通知失敗:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
