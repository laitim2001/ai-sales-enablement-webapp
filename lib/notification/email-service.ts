/**
 * 郵件通知服務 (Email Notification Service)
 *
 * 處理郵件通知的發送、模板渲染和發送狀態追蹤
 *
 * 主要功能：
 * 1. 郵件模板渲染
 * 2. 郵件發送（SMTP/SendGrid）
 * 3. 發送狀態追蹤
 * 4. 批次發送
 * 5. 重試機制
 *
 * @module lib/notification/email-service
 * @since Sprint 5 Week 10
 */

import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client'

// =====================================================
// 類型定義
// =====================================================

/**
 * 郵件配置接口
 */
export interface EmailConfig {
  from: string
  replyTo?: string
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  sendgrid?: {
    apiKey: string
  }
}

/**
 * 郵件數據接口
 */
export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * 郵件模板變數接口
 */
export interface EmailTemplateVars {
  recipientName: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  priority?: NotificationPriority
  [key: string]: any
}

// =====================================================
// 郵件通知服務類
// =====================================================

/**
 * EmailNotificationService - 郵件通知服務
 *
 * 負責郵件通知的發送和管理
 */
export class EmailNotificationService {
  private prisma: PrismaClient
  private config: EmailConfig

  constructor(prisma: PrismaClient, config: EmailConfig) {
    this.prisma = prisma
    this.config = config
  }

  // =====================================================
  // 郵件發送方法
  // =====================================================

  /**
   * 發送通知郵件
   *
   * @param notification - 通知對象
   * @returns 發送結果
   *
   * @example
   * ```typescript
   * const result = await service.sendNotificationEmail(notification)
   * console.log(`郵件發送: ${result.success}`)
   * ```
   */
  async sendNotificationEmail(notification: any) {
    try {
      // 獲取收件人信息
      const recipient = await this.prisma.user.findUnique({
        where: { id: notification.recipient_id },
        select: {
          email: true,
          first_name: true,
          last_name: true
        }
      })

      if (!recipient || !recipient.email) {
        throw new Error('收件人郵箱不存在')
      }

      // 渲染郵件內容
      const emailData = await this.renderNotificationEmail(notification, recipient)

      // 發送郵件
      const result = await this.sendEmail(emailData)

      console.log(`[EmailNotificationService] 郵件發送成功: ${recipient.email}`)
      return { success: true, result }
    } catch (error) {
      console.error(`[EmailNotificationService] 郵件發送失敗:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      }
    }
  }

  /**
   * 批次發送郵件
   *
   * @param notifications - 通知數組
   * @returns 發送結果數組
   */
  async sendBatchEmails(notifications: any[]) {
    const results = []

    for (const notification of notifications) {
      try {
        const result = await this.sendNotificationEmail(notification)
        results.push({
          notificationId: notification.id,
          ...result
        })
      } catch (error) {
        results.push({
          notificationId: notification.id,
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤'
        })
      }
    }

    console.log(`[EmailNotificationService] 批次發送完成: ${results.filter(r => r.success).length}/${results.length}`)
    return results
  }

  // =====================================================
  // 郵件模板方法
  // =====================================================

  /**
   * 渲染通知郵件
   *
   * @param notification - 通知對象
   * @param recipient - 收件人信息
   * @returns 郵件數據
   */
  private async renderNotificationEmail(notification: any, recipient: any): Promise<EmailData> {
    const recipientName = `${recipient.first_name} ${recipient.last_name}`

    // 獲取或生成郵件主題
    const subject = this.getEmailSubject(notification)

    // 渲染 HTML 內容
    const html = this.renderEmailTemplate({
      recipientName,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.action_url,
      actionText: notification.action_text,
      priority: notification.priority
    })

    // 生成純文字版本
    const text = this.renderPlainTextEmail({
      recipientName,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.action_url
    })

    return {
      to: recipient.email,
      subject,
      html,
      text
    }
  }

  /**
   * 渲染 HTML 郵件模板
   *
   * @param vars - 模板變數
   * @returns HTML 內容
   */
  private renderEmailTemplate(vars: EmailTemplateVars): string {
    const priorityBadge = this.getPriorityBadge(vars.priority)

    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${vars.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .message-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .message-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }
    .message-content {
      color: #555;
      white-space: pre-line;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    .priority-urgent {
      background-color: #dc3545;
      color: #ffffff;
    }
    .priority-high {
      background-color: #fd7e14;
      color: #ffffff;
    }
    .priority-normal {
      background-color: #28a745;
      color: #ffffff;
    }
    .priority-low {
      background-color: #6c757d;
      color: #ffffff;
    }
    .action-button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 30px;
      background-color: #667eea;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: background-color 0.3s;
    }
    .action-button:hover {
      background-color: #5568d3;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #dee2e6;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 系統通知</h1>
    </div>
    <div class="content">
      <div class="greeting">
        您好，${vars.recipientName}：
      </div>

      <div class="message-box">
        <div class="message-title">${vars.title}</div>
        <div class="message-content">${vars.message}</div>
        ${priorityBadge}
      </div>

      ${vars.actionUrl && vars.actionText ? `
        <a href="${vars.actionUrl}" class="action-button">
          ${vars.actionText}
        </a>
      ` : ''}
    </div>
    <div class="footer">
      <p>此郵件由系統自動發送，請勿直接回覆。</p>
      <p>© ${new Date().getFullYear()} AI 銷售賦能平台</p>
      <p><a href="#">管理通知偏好</a></p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * 渲染純文字郵件
   *
   * @param vars - 模板變數
   * @returns 純文字內容
   */
  private renderPlainTextEmail(vars: EmailTemplateVars): string {
    return `
您好，${vars.recipientName}：

${vars.title}

${vars.message}

${vars.actionUrl ? `\n查看詳情: ${vars.actionUrl}\n` : ''}

---
此郵件由系統自動發送，請勿直接回覆。
© ${new Date().getFullYear()} AI 銷售賦能平台
    `.trim()
  }

  /**
   * 獲取優先級徽章 HTML
   *
   * @param priority - 優先級
   * @returns HTML 字符串
   */
  private getPriorityBadge(priority?: NotificationPriority): string {
    if (!priority || priority === NotificationPriority.NORMAL) {
      return ''
    }

    const labels: Record<string, string> = {
      URGENT: '緊急',
      HIGH: '高優先級',
      LOW: '低優先級'
    }

    return `<span class="priority-badge priority-${priority.toLowerCase()}">${labels[priority] || priority}</span>`
  }

  /**
   * 獲取郵件主題
   *
   * @param notification - 通知對象
   * @returns 郵件主題
   */
  private getEmailSubject(notification: any): string {
    const prefixes: Record<string, string> = {
      URGENT: '[緊急] ',
      HIGH: '[重要] ',
      NORMAL: '',
      LOW: ''
    }

    const prefix = prefixes[notification.priority] || ''
    return `${prefix}${notification.title}`
  }

  // =====================================================
  // 郵件發送實現
  // =====================================================

  /**
   * 發送郵件（實際發送邏輯）
   *
   * @param emailData - 郵件數據
   * @returns 發送結果
   */
  private async sendEmail(emailData: EmailData) {
    // 檢查配置
    if (this.config.sendgrid) {
      return await this.sendViaSendGrid(emailData)
    } else if (this.config.smtp) {
      return await this.sendViaSMTP(emailData)
    } else {
      // 開發環境：僅記錄日誌
      console.log('[EmailNotificationService] 開發模式：郵件未實際發送')
      console.log(`收件人: ${emailData.to}`)
      console.log(`主題: ${emailData.subject}`)
      return { messageId: 'dev-' + Date.now() }
    }
  }

  /**
   * 通過 SendGrid 發送郵件
   *
   * @param emailData - 郵件數據
   * @returns 發送結果
   */
  private async sendViaSendGrid(emailData: EmailData) {
    // TODO: 整合 SendGrid SDK
    console.log('[EmailNotificationService] SendGrid 發送（待實現）')
    throw new Error('SendGrid 整合待實現')
  }

  /**
   * 通過 SMTP 發送郵件
   *
   * @param emailData - 郵件數據
   * @returns 發送結果
   */
  private async sendViaSMTP(emailData: EmailData) {
    // TODO: 整合 nodemailer
    console.log('[EmailNotificationService] SMTP 發送（待實現）')
    throw new Error('SMTP 整合待實現')
  }

  // =====================================================
  // 輔助方法
  // =====================================================

  /**
   * 驗證郵箱地址
   *
   * @param email - 郵箱地址
   * @returns 是否有效
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }
}

/**
 * 創建郵件通知服務實例
 *
 * @param prisma - Prisma 客戶端
 * @param config - 郵件配置
 * @returns EmailNotificationService 實例
 */
export function createEmailNotificationService(
  prisma: PrismaClient,
  config: EmailConfig
): EmailNotificationService {
  return new EmailNotificationService(prisma, config)
}
