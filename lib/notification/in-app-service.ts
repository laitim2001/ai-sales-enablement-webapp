/**
 * @fileoverview 站內通知服務 (In-App Notification Service)處理站內通知的實時推送和查詢功能主要功能：1. 實時通知推送（未來可整合 WebSocket/SSE）2. 通知徽章計數3. 通知分組和排序4. 通知預覽和詳情@module lib/notification/in-app-service@since Sprint 5 Week 10
 * @module lib/notification/in-app-service
 * @description
 * 站內通知服務 (In-App Notification Service)處理站內通知的實時推送和查詢功能主要功能：1. 實時通知推送（未來可整合 WebSocket/SSE）2. 通知徽章計數3. 通知分組和排序4. 通知預覽和詳情@module lib/notification/in-app-service@since Sprint 5 Week 10
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { PrismaClient, NotificationPriority, NotificationCategory } from '@prisma/client'
import { NotificationEngine } from './engine'

// =====================================================
// 類型定義
// =====================================================

/**
 * 通知分組接口
 */
export interface NotificationGroup {
  category: NotificationCategory
  count: number
  unreadCount: number
  latestNotification: any
}

/**
 * 通知摘要接口
 */
export interface NotificationSummary {
  totalUnread: number
  highPriorityUnread: number
  groups: NotificationGroup[]
  recentNotifications: any[]
}

// =====================================================
// 站內通知服務類
// =====================================================

/**
 * InAppNotificationService - 站內通知服務
 *
 * 負責站內通知的展示、查詢和實時更新
 */
export class InAppNotificationService {
  private prisma: PrismaClient
  private engine: NotificationEngine

  constructor(prisma: PrismaClient, engine: NotificationEngine) {
    this.prisma = prisma
    this.engine = engine
  }

  // =====================================================
  // 通知查詢方法
  // =====================================================

  /**
   * 獲取用戶通知摘要（用於導航欄徽章）
   *
   * @param userId - 用戶ID
   * @returns 通知摘要
   *
   * @example
   * ```typescript
   * const summary = await service.getNotificationSummary(1)
   * console.log(`未讀通知: ${summary.totalUnread}`)
   * ```
   */
  async getNotificationSummary(userId: number): Promise<NotificationSummary> {
    // 獲取未讀總數
    const totalUnread = await this.prisma.notification.count({
      where: {
        recipient_id: userId,
        is_read: false
      }
    })

    // 獲取高優先級未讀數
    const highPriorityUnread = await this.prisma.notification.count({
      where: {
        recipient_id: userId,
        is_read: false,
        priority: {
          in: [NotificationPriority.HIGH, NotificationPriority.URGENT]
        }
      }
    })

    // 獲取按分類的統計
    const groupStats = await this.prisma.notification.groupBy({
      by: ['category'],
      where: { recipient_id: userId },
      _count: { id: true }
    })

    // 獲取每個分類的未讀數和最新通知
    const groups: NotificationGroup[] = await Promise.all(
      groupStats.map(async (stat) => {
        const unreadCount = await this.prisma.notification.count({
          where: {
            recipient_id: userId,
            category: stat.category,
            is_read: false
          }
        })

        const latestNotification = await this.prisma.notification.findFirst({
          where: {
            recipient_id: userId,
            category: stat.category
          },
          orderBy: { created_at: 'desc' }
        })

        return {
          category: stat.category,
          count: stat._count.id,
          unreadCount,
          latestNotification
        }
      })
    )

    // 獲取最近通知（前5條）
    const recentNotifications = await this.prisma.notification.findMany({
      where: { recipient_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        recipient: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    return {
      totalUnread,
      highPriorityUnread,
      groups,
      recentNotifications
    }
  }

  /**
   * 獲取通知列表（支援分頁和過濾）
   *
   * @param userId - 用戶ID
   * @param options - 查詢選項
   * @returns 通知列表
   */
  async getNotificationList(
    userId: number,
    options: {
      category?: NotificationCategory
      unreadOnly?: boolean
      page?: number
      limit?: number
    } = {}
  ) {
    const { category, unreadOnly = false, page = 1, limit = 20 } = options

    const where: any = { recipient_id: userId }
    if (category) where.category = category
    if (unreadOnly) where.is_read = false

    return await this.engine.getNotifications(where, page, limit)
  }

  /**
   * 獲取單個通知詳情
   *
   * @param notificationId - 通知ID
   * @param userId - 用戶ID
   * @returns 通知詳情
   */
  async getNotificationDetail(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipient_id: userId
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    if (!notification) {
      throw new Error('通知不存在或無權限')
    }

    // 自動標記為已讀（如果未讀）
    if (!notification.is_read) {
      await this.engine.markAsRead(notificationId, userId)
      notification.is_read = true
      notification.read_at = new Date()
    }

    return notification
  }

  // =====================================================
  // 通知操作方法
  // =====================================================

  /**
   * 標記通知為已讀
   *
   * @param notificationIds - 通知ID數組
   * @param userId - 用戶ID
   * @returns 更新的記錄數量
   */
  async markNotificationsAsRead(notificationIds: number[], userId: number): Promise<number> {
    const result = await this.engine.markMultipleAsRead(notificationIds, userId)
    return result.count
  }

  /**
   * 標記所有通知為已讀
   *
   * @param userId - 用戶ID
   * @param category - 可選：僅標記特定分類
   * @returns 更新的記錄數量
   */
  async markAllAsRead(userId: number, category?: NotificationCategory): Promise<number> {
    if (category) {
      const result = await this.prisma.notification.updateMany({
        where: {
          recipient_id: userId,
          category,
          is_read: false
        },
        data: {
          is_read: true,
          read_at: new Date()
        }
      })
      return result.count
    }

    const result = await this.engine.markAllAsRead(userId)
    return result.count
  }

  /**
   * 刪除通知
   *
   * @param notificationIds - 通知ID數組
   * @param userId - 用戶ID
   * @returns 刪除的記錄數量
   */
  async deleteNotifications(userId: number, notificationIds: number[]): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        recipient_id: userId
      }
    })
    return result.count
  }

  /**
   * 清空所有已讀通知
   *
   * @param userId - 用戶ID
   * @returns 刪除的記錄數量
   */
  async clearReadNotifications(userId: number): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        recipient_id: userId,
        is_read: true
      }
    })
    return result.count
  }

  // =====================================================
  // 實時通知方法（未來擴展）
  // =====================================================

  /**
   * 訂閱實時通知（未來實現 WebSocket/SSE）
   *
   * @param userId - 用戶ID
   * @param callback - 通知回調函數
   *
   * @remarks
   * 未來可整合 WebSocket 或 Server-Sent Events
   * 實現真正的實時推送
   */
  async subscribeToNotifications(userId: number, callback: (notification: any) => void) {
    console.log(`[InAppNotificationService] 用戶 ${userId} 訂閱實時通知（待實現）`)
    // TODO: 實現 WebSocket/SSE 訂閱
  }

  /**
   * 取消訂閱實時通知
   *
   * @param userId - 用戶ID
   */
  async unsubscribeFromNotifications(userId: number) {
    console.log(`[InAppNotificationService] 用戶 ${userId} 取消訂閱實時通知（待實現）`)
    // TODO: 實現取消訂閱
  }

  // =====================================================
  // 通知偏好方法
  // =====================================================

  /**
   * 獲取用戶站內通知偏好
   *
   * @param userId - 用戶ID
   */
  async getInAppPreferences(userId: number) {
    const preference = await this.engine.getUserPreference(userId)
    return {
      enabled: preference.in_app_enabled,
      typePreferences: preference.type_preferences || {}
    }
  }

  /**
   * 更新用戶站內通知偏好
   *
   * @param userId - 用戶ID
   * @param enabled - 是否啟用站內通知
   */
  async updateInAppPreferences(userId: number, enabled: boolean) {
    return await this.engine.updateUserPreference(userId, {
      in_app_enabled: enabled
    })
  }
}

/**
 * 創建站內通知服務實例
 *
 * @param prisma - Prisma 客戶端
 * @param engine - 通知引擎
 * @returns InAppNotificationService 實例
 */
export function createInAppNotificationService(
  prisma: PrismaClient,
  engine: NotificationEngine
): InAppNotificationService {
  return new InAppNotificationService(prisma, engine)
}
