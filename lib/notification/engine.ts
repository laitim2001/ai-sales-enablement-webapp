/**
 * 通知引擎 (Notification Engine)
 *
 * 核心通知生成和發送引擎，支援多渠道通知、優先級管理、批次處理和模板系統
 *
 * 主要功能：
 * 1. 通知創建和管理
 * 2. 多渠道發送（站內、郵件）
 * 3. 優先級和過期管理
 * 4. 用戶偏好支援
 * 5. 模板系統整合
 * 6. 批次處理
 *
 * @module lib/notification/engine
 * @since Sprint 5 Week 10
 */

import { PrismaClient, NotificationType, NotificationCategory, NotificationPriority, NotificationStatus, NotificationChannel } from '@prisma/client'

// =====================================================
// 類型定義
// =====================================================

/**
 * 通知數據接口
 */
export interface NotificationData {
  recipientId: number
  type: NotificationType
  category?: NotificationCategory
  priority?: NotificationPriority
  title: string
  message: string
  data?: Record<string, any>
  channels?: NotificationChannel[]
  entityType?: string
  entityId?: number
  actionUrl?: string
  actionText?: string
  expiresAt?: Date
}

/**
 * 批次通知數據接口
 */
export interface BatchNotificationData {
  name: string
  notifications: NotificationData[]
  scheduledAt?: Date
}

/**
 * 通知過濾條件
 */
export interface NotificationFilter {
  recipientId?: number
  type?: NotificationType
  category?: NotificationCategory
  status?: NotificationStatus
  isRead?: boolean
  fromDate?: Date
  toDate?: Date
}

/**
 * 通知統計接口
 */
export interface NotificationStats {
  total: number
  unread: number
  byType: Record<string, number>
  byPriority: Record<string, number>
}

// =====================================================
// 通知引擎類
// =====================================================

/**
 * NotificationEngine - 核心通知引擎
 *
 * 設計模式：
 * - Factory Pattern: 創建不同類型的通知
 * - Strategy Pattern: 不同渠道的發送策略
 * - Observer Pattern: 通知事件監聽
 */
export class NotificationEngine {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // =====================================================
  // 通知創建方法
  // =====================================================

  /**
   * 創建單個通知
   *
   * @param data - 通知數據
   * @returns 創建的通知對象
   *
   * @example
   * ```typescript
   * const notification = await engine.createNotification({
   *   recipientId: 1,
   *   type: 'WORKFLOW_APPROVED',
   *   title: '提案已批准',
   *   message: '您的提案「企業方案V1」已獲批准',
   *   priority: 'HIGH',
   *   actionUrl: '/proposals/123'
   * })
   * ```
   */
  async createNotification(data: NotificationData) {
    // 檢查用戶偏好
    const preference = await this.getUserPreference(data.recipientId)

    // 應用用戶偏好過濾
    if (!this.shouldSendNotification(data.type, preference)) {
      console.log(`[NotificationEngine] 通知已被用戶偏好過濾: ${data.type}`)
      return null
    }

    // 過濾渠道
    const channels = this.filterChannelsByPreference(
      data.channels || [NotificationChannel.IN_APP],
      preference
    )

    if (channels.length === 0) {
      console.log(`[NotificationEngine] 沒有可用的發送渠道`)
      return null
    }

    // 創建通知
    const notification = await this.prisma.notification.create({
      data: {
        recipient_id: data.recipientId,
        type: data.type,
        category: data.category || this.getCategoryFromType(data.type),
        priority: data.priority || NotificationPriority.NORMAL,
        title: data.title,
        message: data.message,
        data: data.data || {},
        channels,
        status: NotificationStatus.PENDING,
        entity_type: data.entityType,
        entity_id: data.entityId,
        action_url: data.actionUrl,
        action_text: data.actionText,
        expires_at: data.expiresAt,
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          }
        }
      }
    })

    console.log(`[NotificationEngine] 通知已創建: ID=${notification.id}, Type=${data.type}`)
    return notification
  }

  /**
   * 批次創建通知
   *
   * @param notifications - 通知數據數組
   * @returns 創建的通知數組
   */
  async createBatchNotifications(notifications: NotificationData[]) {
    const created = []

    for (const data of notifications) {
      try {
        const notification = await this.createNotification(data)
        if (notification) {
          created.push(notification)
        }
      } catch (error) {
        console.error(`[NotificationEngine] 批次創建通知失敗:`, error)
      }
    }

    console.log(`[NotificationEngine] 批次創建完成: ${created.length}/${notifications.length}`)
    return created
  }

  // =====================================================
  // 通知發送方法
  // =====================================================

  /**
   * 發送通知
   *
   * @param notificationId - 通知ID
   * @returns 發送結果
   */
  async sendNotification(notificationId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { recipient: true }
    })

    if (!notification) {
      throw new Error(`通知不存在: ${notificationId}`)
    }

    if (notification.status !== NotificationStatus.PENDING) {
      console.log(`[NotificationEngine] 通知狀態不是待發送: ${notification.status}`)
      return notification
    }

    // 更新狀態為發送中
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.SENDING }
    })

    try {
      // 根據渠道發送
      const results = await Promise.allSettled(
        notification.channels.map(channel =>
          this.sendByChannel(notification, channel)
        )
      )

      // 檢查發送結果
      const allSuccess = results.every(r => r.status === 'fulfilled')

      // 更新通知狀態
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: allSuccess ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sent_at: allSuccess ? new Date() : undefined,
          failed_at: allSuccess ? undefined : new Date(),
          error_message: allSuccess ? undefined : '部分渠道發送失敗'
        }
      })

      console.log(`[NotificationEngine] 通知發送完成: ID=${notificationId}, Success=${allSuccess}`)

      return await this.prisma.notification.findUnique({
        where: { id: notificationId }
      })
    } catch (error) {
      // 發送失敗，更新狀態
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          failed_at: new Date(),
          error_message: error instanceof Error ? error.message : '未知錯誤',
          retry_count: { increment: 1 }
        }
      })

      console.error(`[NotificationEngine] 通知發送失敗: ID=${notificationId}`, error)
      throw error
    }
  }

  /**
   * 根據渠道發送通知
   *
   * @param notification - 通知對象
   * @param channel - 發送渠道
   */
  private async sendByChannel(notification: any, channel: NotificationChannel) {
    switch (channel) {
      case NotificationChannel.IN_APP:
        // 站內通知無需額外處理（已存入數據庫）
        return { success: true, channel }

      case NotificationChannel.EMAIL:
        // 郵件發送（由 EmailNotificationService 處理）
        console.log(`[NotificationEngine] 郵件發送: ${notification.recipient.email}`)
        // TODO: 整合 EmailNotificationService
        return { success: true, channel }

      case NotificationChannel.PUSH:
        // 推送通知（未來實現）
        console.log(`[NotificationEngine] 推送通知: User ${notification.recipient_id}`)
        return { success: true, channel }

      default:
        throw new Error(`不支援的渠道: ${channel}`)
    }
  }

  // =====================================================
  // 通知查詢方法
  // =====================================================

  /**
   * 獲取用戶通知列表
   *
   * @param filter - 過濾條件
   * @param page - 頁碼
   * @param limit - 每頁數量
   * @returns 通知列表
   */
  async getNotifications(filter: NotificationFilter, page = 1, limit = 20) {
    const where: any = {}

    if (filter.recipientId) where.recipient_id = filter.recipientId
    if (filter.type) where.type = filter.type
    if (filter.category) where.category = filter.category
    if (filter.status) where.status = filter.status
    if (filter.isRead !== undefined) where.is_read = filter.isRead

    if (filter.fromDate || filter.toDate) {
      where.created_at = {}
      if (filter.fromDate) where.created_at.gte = filter.fromDate
      if (filter.toDate) where.created_at.lte = filter.toDate
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      this.prisma.notification.count({ where })
    ])

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * 標記通知為已讀
   *
   * @param notificationId - 通知ID
   * @param userId - 用戶ID（驗證權限）
   */
  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipient_id: userId
      }
    })

    if (!notification) {
      throw new Error('通知不存在或無權限')
    }

    return await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date()
      }
    })
  }

  /**
   * 批次標記為已讀
   *
   * @param notificationIds - 通知ID數組
   * @param userId - 用戶ID
   */
  async markMultipleAsRead(notificationIds: number[], userId: number) {
    return await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipient_id: userId
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    })
  }

  /**
   * 標記所有通知為已讀
   *
   * @param userId - 用戶ID
   */
  async markAllAsRead(userId: number) {
    return await this.prisma.notification.updateMany({
      where: {
        recipient_id: userId,
        is_read: false
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    })
  }

  /**
   * 刪除通知
   *
   * @param notificationId - 通知ID
   * @param userId - 用戶ID
   */
  async deleteNotification(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipient_id: userId
      }
    })

    if (!notification) {
      throw new Error('通知不存在或無權限')
    }

    return await this.prisma.notification.delete({
      where: { id: notificationId }
    })
  }

  // =====================================================
  // 通知統計方法
  // =====================================================

  /**
   * 獲取用戶通知統計
   *
   * @param userId - 用戶ID
   * @returns 統計數據
   */
  async getNotificationStats(userId: number): Promise<NotificationStats> {
    const [total, unread, byType, byPriority] = await Promise.all([
      // 總數
      this.prisma.notification.count({
        where: { recipient_id: userId }
      }),

      // 未讀數
      this.prisma.notification.count({
        where: { recipient_id: userId, is_read: false }
      }),

      // 按類型統計
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { recipient_id: userId },
        _count: { id: true }
      }),

      // 按優先級統計
      this.prisma.notification.groupBy({
        by: ['priority'],
        where: { recipient_id: userId },
        _count: { id: true }
      })
    ])

    return {
      total,
      unread,
      byType: Object.fromEntries(
        byType.map(item => [item.type, item._count.id])
      ),
      byPriority: Object.fromEntries(
        byPriority.map(item => [item.priority, item._count.id])
      )
    }
  }

  // =====================================================
  // 用戶偏好方法
  // =====================================================

  /**
   * 獲取用戶通知偏好
   *
   * @param userId - 用戶ID
   * @returns 用戶偏好設定
   */
  async getUserPreference(userId: number) {
    let preference = await this.prisma.notificationPreference.findUnique({
      where: { user_id: userId }
    })

    // 如果不存在，創建默認偏好
    if (!preference) {
      preference = await this.prisma.notificationPreference.create({
        data: { user_id: userId }
      })
    }

    return preference
  }

  /**
   * 更新用戶通知偏好
   *
   * @param userId - 用戶ID
   * @param updates - 更新數據
   */
  async updateUserPreference(userId: number, updates: any) {
    return await this.prisma.notificationPreference.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...updates },
      update: updates
    })
  }

  // =====================================================
  // 輔助方法
  // =====================================================

  /**
   * 檢查是否應該發送通知
   *
   * @param type - 通知類型
   * @param preference - 用戶偏好
   * @returns 是否發送
   */
  private shouldSendNotification(type: NotificationType, preference: any): boolean {
    // 檢查類型偏好
    if (preference.type_preferences) {
      const typePrefs = preference.type_preferences as Record<string, boolean>
      if (typePrefs[type] === false) {
        return false
      }
    }

    // 檢查安靜時間
    if (preference.quiet_hours_enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (preference.quiet_hours_start && preference.quiet_hours_end) {
        const start = preference.quiet_hours_start
        const end = preference.quiet_hours_end

        // 簡單時間範圍檢查
        if (start <= end) {
          if (currentTime >= start && currentTime <= end) {
            return false
          }
        } else {
          // 跨午夜情況
          if (currentTime >= start || currentTime <= end) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * 根據用戶偏好過濾渠道
   *
   * @param channels - 原始渠道列表
   * @param preference - 用戶偏好
   * @returns 過濾後的渠道列表
   */
  private filterChannelsByPreference(
    channels: NotificationChannel[],
    preference: any
  ): NotificationChannel[] {
    return channels.filter(channel => {
      switch (channel) {
        case NotificationChannel.IN_APP:
          return preference.in_app_enabled !== false
        case NotificationChannel.EMAIL:
          return preference.email_enabled !== false
        case NotificationChannel.PUSH:
          return preference.push_enabled === true
        default:
          return true
      }
    })
  }

  /**
   * 根據通知類型獲取分類
   *
   * @param type - 通知類型
   * @returns 通知分類
   */
  private getCategoryFromType(type: NotificationType): NotificationCategory {
    if (type.startsWith('WORKFLOW_')) return NotificationCategory.WORKFLOW
    if (type.startsWith('APPROVAL_')) return NotificationCategory.APPROVAL
    if (type.startsWith('COMMENT_')) return NotificationCategory.COMMENT
    if (type.startsWith('SYSTEM_')) return NotificationCategory.SYSTEM
    return NotificationCategory.CUSTOM
  }

  // =====================================================
  // 清理和維護方法
  // =====================================================

  /**
   * 清理過期通知
   *
   * @returns 刪除數量
   */
  async cleanupExpiredNotifications() {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expires_at: {
          lte: new Date()
        }
      }
    })

    console.log(`[NotificationEngine] 清理過期通知: ${result.count} 條`)
    return result.count
  }

  /**
   * 清理舊通知
   *
   * @param days - 保留天數
   * @returns 刪除數量
   */
  async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await this.prisma.notification.deleteMany({
      where: {
        created_at: {
          lte: cutoffDate
        },
        is_read: true
      }
    })

    console.log(`[NotificationEngine] 清理舊通知 (${days}天前): ${result.count} 條`)
    return result.count
  }
}

/**
 * 創建通知引擎實例
 *
 * @param prisma - Prisma 客戶端
 * @returns NotificationEngine 實例
 */
export function createNotificationEngine(prisma: PrismaClient): NotificationEngine {
  return new NotificationEngine(prisma)
}
