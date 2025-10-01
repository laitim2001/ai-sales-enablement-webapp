/**
 * 通知統計 API 路由 (Notification Stats API Route)
 *
 * 處理通知統計數據的查詢
 *
 * 端點：
 * - GET /api/notifications/stats - 獲取通知統計摘要
 *
 * @module app/api/notifications/stats/route
 * @since Sprint 5 Week 10 Day 2
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { NotificationEngine } from '@/lib/notification/engine'
import { InAppNotificationService } from '@/lib/notification/in-app-service'
import { verifyAccessToken } from '@/lib/auth/token-service'

const prisma = new PrismaClient()
const notificationEngine = new NotificationEngine(prisma)
const inAppService = new InAppNotificationService(prisma, notificationEngine)

/**
 * GET /api/notifications/stats
 *
 * 獲取用戶通知統計摘要
 *
 * 返回數據：
 * - totalUnread: 未讀通知總數
 * - highPriorityUnread: 高優先級未讀通知數
 * - groups: 按分類分組的統計
 * - recentNotifications: 最近的通知（前5條）
 *
 * @example
 * GET /api/notifications/stats
 * Response: {
 *   "success": true,
 *   "data": {
 *     "totalUnread": 12,
 *     "highPriorityUnread": 3,
 *     "groups": [...],
 *     "recentNotifications": [...]
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

    // 獲取通知摘要統計
    const summary = await inAppService.getNotificationSummary(userId)

    // 也獲取詳細統計
    const stats = await notificationEngine.getNotificationStats(userId)

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        detailedStats: stats
      }
    })

  } catch (error) {
    console.error('獲取通知統計失敗:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notification stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
