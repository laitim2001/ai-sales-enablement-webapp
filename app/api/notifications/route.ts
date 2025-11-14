/**
 * @fileoverview AI銷售賦能平台通知API - 實現通知列表查詢和刪除功能
 * @module app/api/notifications/route
 *
 * ## 功能說明
 * 提供通知的列表查詢和刪除功能,支援分頁、過濾和批量刪除操作。
 *
 * ## API規格
 * - **端點**: `GET /api/notifications` - 獲取通知列表
 *   - 查詢參數: page, limit, category, unreadOnly, type
 *   - 響應: { success, data: { notifications: [...], pagination: {...} } }
 * - **端點**: `DELETE /api/notifications` - 刪除通知
 *   - 請求: { notificationIds?: number[], deleteAll?: boolean }
 *   - 響應: { success, data: { deletedCount: number } }
 * - **狀態碼**: 200 (成功) | 400 (驗證錯誤) | 401 (未認證) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 通知查詢 - 支援分頁、分類和未讀過濾
 * - 批量刪除 - 支援指定ID列表或刪除所有已讀通知
 * - 分頁處理 - 包含總數和總頁數計算
 * - 統一認證 - 使用authenticateRequest支援Bearer Token和Cookie
 *
 * ## 相關文件
 * - `/lib/notification/engine.ts` - 通知引擎
 * - `/lib/notification/in-app-service.ts` - 站內通知服務
 * - `/lib/auth/request-auth.ts` - 統一請求認證
 * - `@prisma/client` - NotificationType, NotificationCategory, NotificationStatus枚舉
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, NotificationType, NotificationCategory, NotificationStatus } from '@prisma/client'
import { NotificationEngine } from '@/lib/notification/engine'
import { InAppNotificationService } from '@/lib/notification/in-app-service'
import { authenticateRequest } from '@/lib/auth/request-auth'

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
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(request)
    const userId = payload.userId

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
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(request)
    const userId = payload.userId

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
