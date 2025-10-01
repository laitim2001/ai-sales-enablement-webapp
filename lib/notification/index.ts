/**
 * 通知系統統一導出 (Notification System)
 *
 * Sprint 5 Week 10 - 通知系統基礎實現
 *
 * 模組架構：
 * - NotificationEngine: 核心通知引擎
 * - InAppNotificationService: 站內通知服務
 * - EmailNotificationService: 郵件通知服務
 *
 * @module lib/notification
 * @since Sprint 5 Week 10
 */

// 核心引擎
export {
  NotificationEngine,
  createNotificationEngine,
  type NotificationData,
  type BatchNotificationData,
  type NotificationFilter,
  type NotificationStats
} from './engine'

// 站內通知服務
export {
  InAppNotificationService,
  createInAppNotificationService,
  type NotificationGroup,
  type NotificationSummary
} from './in-app-service'

// 郵件通知服務
export {
  EmailNotificationService,
  createEmailNotificationService,
  type EmailConfig,
  type EmailData,
  type EmailTemplateVars
} from './email-service'

// 重新導出 Prisma 枚舉類型
export {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel
} from '@prisma/client'
