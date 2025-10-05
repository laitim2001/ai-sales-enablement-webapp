/**
 * 智能提醒規則引擎
 *
 * 功能：
 * - 基於時間的提醒規則
 * - 基於事件的提醒規則
 * - 優先級自動計算
 * - 提醒觸發條件評估
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { PrismaClient } from '@prisma/client';

/**
 * 提醒類型
 */
export enum ReminderType {
  MEETING_UPCOMING = 'MEETING_UPCOMING',       // 會議即將開始
  FOLLOW_UP_DUE = 'FOLLOW_UP_DUE',            // 跟進任務到期
  PROPOSAL_EXPIRING = 'PROPOSAL_EXPIRING',    // 提案即將過期
  TASK_OVERDUE = 'TASK_OVERDUE',              // 任務已逾期
  CUSTOM = 'CUSTOM',                           // 自定義提醒
}

/**
 * 提醒優先級
 */
export enum ReminderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * 提醒狀態
 */
export enum ReminderStatus {
  PENDING = 'PENDING',     // 待觸發
  TRIGGERED = 'TRIGGERED', // 已觸發
  SNOOZED = 'SNOOZED',     // 已延遲
  DISMISSED = 'DISMISSED', // 已忽略
  COMPLETED = 'COMPLETED', // 已完成
}

/**
 * 提醒規則
 */
export interface ReminderRule {
  id: string;
  name: string;
  type: ReminderType;
  enabled: boolean;
  triggerCondition: ReminderTriggerCondition;
  priority: ReminderPriority;
  notificationChannels: string[]; // ['IN_APP', 'EMAIL', 'PUSH']
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 觸發條件
 */
export interface ReminderTriggerCondition {
  // 時間相關
  beforeMinutes?: number; // 事件前N分鐘
  beforeHours?: number;   // 事件前N小時
  beforeDays?: number;    // 事件前N天

  // 事件相關
  eventType?: string;     // 事件類型
  eventStatus?: string;   // 事件狀態

  // 自定義條件
  customCondition?: string; // 自定義JavaScript表達式
}

/**
 * 提醒記錄
 */
export interface ReminderRecord {
  id: string;
  ruleId: string;
  userId: number;
  type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  scheduledFor: Date;
  triggeredAt?: Date;
  dismissedAt?: Date;
  snoozedUntil?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 提醒規則引擎
 */
export class ReminderRuleEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 創建提醒規則
   */
  async createRule(rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReminderRule> {
    const newRule: ReminderRule = {
      id: this.generateRuleId(),
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storeRule(newRule);
    return newRule;
  }

  /**
   * 創建會議前提醒
   */
  async scheduleMeetingReminder(
    userId: number,
    meetingId: number,
    meetingTitle: string,
    meetingTime: Date,
    reminderOptions?: {
      beforeHours?: number;
      beforeMinutes?: number;
    }
  ): Promise<ReminderRecord> {
    const { beforeHours = 1, beforeMinutes = 0 } = reminderOptions || {};

    const scheduledFor = new Date(
      meetingTime.getTime() - (beforeHours * 60 + beforeMinutes) * 60 * 1000
    );

    const reminder: ReminderRecord = {
      id: this.generateReminderId(),
      ruleId: 'meeting-reminder-rule',
      userId,
      type: ReminderType.MEETING_UPCOMING,
      priority: this.calculateMeetingPriority(meetingTime, beforeHours),
      status: ReminderStatus.PENDING,
      title: `即將開始會議: ${meetingTitle}`,
      message: `您的會議「${meetingTitle}」將在 ${beforeHours} 小時${beforeMinutes > 0 ? ` ${beforeMinutes} 分鐘` : ''}後開始`,
      actionUrl: `/dashboard/meetings/${meetingId}`,
      actionText: '查看會議詳情',
      scheduledFor,
      metadata: {
        meetingId,
        meetingTime: meetingTime.toISOString(),
        beforeHours,
        beforeMinutes,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storeReminder(reminder);
    return reminder;
  }

  /**
   * 創建跟進任務提醒
   */
  async scheduleFollowUpReminder(
    userId: number,
    taskId: number,
    taskTitle: string,
    dueDate: Date
  ): Promise<ReminderRecord> {
    const now = new Date();
    const isOverdue = dueDate < now;

    const reminder: ReminderRecord = {
      id: this.generateReminderId(),
      ruleId: 'follow-up-reminder-rule',
      userId,
      type: isOverdue ? ReminderType.TASK_OVERDUE : ReminderType.FOLLOW_UP_DUE,
      priority: isOverdue ? ReminderPriority.URGENT : ReminderPriority.NORMAL,
      status: ReminderStatus.PENDING,
      title: isOverdue ? `任務已逾期: ${taskTitle}` : `任務即將到期: ${taskTitle}`,
      message: isOverdue
        ? `您的跟進任務「${taskTitle}」已逾期 ${this.formatTimeDifference(dueDate, now)}`
        : `您的跟進任務「${taskTitle}」將在 ${this.formatTimeDifference(now, dueDate)} 後到期`,
      actionUrl: `/dashboard/tasks/${taskId}`,
      actionText: '查看任務',
      scheduledFor: isOverdue ? now : new Date(dueDate.getTime() - 24 * 60 * 60 * 1000), // 1天前提醒
      metadata: {
        taskId,
        dueDate: dueDate.toISOString(),
        isOverdue,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storeReminder(reminder);
    return reminder;
  }

  /**
   * 創建提案即將過期提醒
   */
  async scheduleProposalExpiryReminder(
    userId: number,
    proposalId: number,
    proposalTitle: string,
    expiryDate: Date
  ): Promise<ReminderRecord> {
    const scheduledFor = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7天前提醒

    const reminder: ReminderRecord = {
      id: this.generateReminderId(),
      ruleId: 'proposal-expiry-rule',
      userId,
      type: ReminderType.PROPOSAL_EXPIRING,
      priority: ReminderPriority.HIGH,
      status: ReminderStatus.PENDING,
      title: `提案即將過期: ${proposalTitle}`,
      message: `您的提案「${proposalTitle}」將在 ${this.formatTimeDifference(new Date(), expiryDate)} 後過期`,
      actionUrl: `/dashboard/proposals/${proposalId}`,
      actionText: '查看提案',
      scheduledFor,
      metadata: {
        proposalId,
        expiryDate: expiryDate.toISOString(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storeReminder(reminder);
    return reminder;
  }

  /**
   * 獲取待觸發的提醒
   */
  async getPendingReminders(now: Date = new Date()): Promise<ReminderRecord[]> {
    const allReminders = await this.getAllReminders();

    return allReminders.filter(
      (reminder) =>
        reminder.status === ReminderStatus.PENDING &&
        reminder.scheduledFor <= now
    );
  }

  /**
   * 觸發提醒
   */
  async triggerReminder(reminderId: string): Promise<void> {
    const reminder = await this.getReminderById(reminderId);

    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }

    if (reminder.status !== ReminderStatus.PENDING) {
      throw new Error(`Reminder ${reminderId} is not in PENDING status`);
    }

    // 更新提醒狀態
    reminder.status = ReminderStatus.TRIGGERED;
    reminder.triggeredAt = new Date();
    reminder.updatedAt = new Date();

    await this.storeReminder(reminder);

    // 發送通知
    await this.sendReminderNotification(reminder);
  }

  /**
   * 延遲提醒
   */
  async snoozeReminder(reminderId: string, snoozeMinutes: number): Promise<ReminderRecord> {
    const reminder = await this.getReminderById(reminderId);

    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }

    const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    reminder.status = ReminderStatus.SNOOZED;
    reminder.snoozedUntil = snoozedUntil;
    reminder.scheduledFor = snoozedUntil;
    reminder.updatedAt = new Date();

    // 重置為待觸發狀態,在snoozedUntil時間後觸發
    setTimeout(() => {
      reminder.status = ReminderStatus.PENDING;
      this.storeReminder(reminder);
    }, snoozeMinutes * 60 * 1000);

    await this.storeReminder(reminder);
    return reminder;
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(reminderId: string): Promise<void> {
    const reminder = await this.getReminderById(reminderId);

    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }

    reminder.status = ReminderStatus.DISMISSED;
    reminder.dismissedAt = new Date();
    reminder.updatedAt = new Date();

    await this.storeReminder(reminder);
  }

  /**
   * 獲取用戶的提醒列表
   */
  async getUserReminders(
    userId: number,
    status?: ReminderStatus
  ): Promise<ReminderRecord[]> {
    const allReminders = await this.getAllReminders();

    return allReminders.filter(
      (reminder) =>
        reminder.userId === userId &&
        (!status || reminder.status === status)
    );
  }

  /**
   * 計算會議優先級
   */
  private calculateMeetingPriority(meetingTime: Date, beforeHours: number): ReminderPriority {
    if (beforeHours <= 1) {
      return ReminderPriority.URGENT;
    } else if (beforeHours <= 4) {
      return ReminderPriority.HIGH;
    } else if (beforeHours <= 24) {
      return ReminderPriority.NORMAL;
    } else {
      return ReminderPriority.LOW;
    }
  }

  /**
   * 格式化時間差異
   */
  private formatTimeDifference(from: Date, to: Date): string {
    const diff = to.getTime() - from.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days} 天${hours > 0 ? ` ${hours} 小時` : ''}`;
    } else if (hours > 0) {
      return `${hours} 小時${minutes > 0 ? ` ${minutes} 分鐘` : ''}`;
    } else {
      return `${minutes} 分鐘`;
    }
  }

  /**
   * 發送提醒通知
   */
  private async sendReminderNotification(reminder: ReminderRecord): Promise<void> {
    try {
      const { NotificationEngine } = await import('@/lib/notification/engine');
      const { NotificationType, NotificationCategory, NotificationPriority, NotificationChannel } =
        await import('@prisma/client');

      const notificationEngine = new NotificationEngine(this.prisma);

      const priorityMap: Record<ReminderPriority, typeof NotificationPriority[keyof typeof NotificationPriority]> = {
        [ReminderPriority.LOW]: NotificationPriority.LOW,
        [ReminderPriority.NORMAL]: NotificationPriority.NORMAL,
        [ReminderPriority.HIGH]: NotificationPriority.HIGH,
        [ReminderPriority.URGENT]: NotificationPriority.HIGH,
      };

      await notificationEngine.createNotification({
        recipientId: reminder.userId,
        type: NotificationType.REMINDER,
        category: NotificationCategory.SYSTEM,
        priority: priorityMap[reminder.priority],
        title: reminder.title,
        message: reminder.message,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        actionUrl: reminder.actionUrl,
        actionText: reminder.actionText,
        data: {
          reminderId: reminder.id,
          reminderType: reminder.type,
          metadata: reminder.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to send reminder notification:', error);
    }
  }

  // 內存存儲實現 (生產環境應使用數據庫)
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateReminderId(): string {
    return `reminder_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async storeRule(rule: ReminderRule): Promise<void> {
    if (typeof global !== 'undefined') {
      if (!(global as any).reminderRules) {
        (global as any).reminderRules = new Map<string, ReminderRule>();
      }
      (global as any).reminderRules.set(rule.id, rule);
    }
  }

  private async storeReminder(reminder: ReminderRecord): Promise<void> {
    if (typeof global !== 'undefined') {
      if (!(global as any).reminders) {
        (global as any).reminders = new Map<string, ReminderRecord>();
      }
      (global as any).reminders.set(reminder.id, reminder);
    }
  }

  private async getReminderById(reminderId: string): Promise<ReminderRecord | null> {
    if (typeof global !== 'undefined' && (global as any).reminders) {
      return (global as any).reminders.get(reminderId) || null;
    }
    return null;
  }

  private async getAllReminders(): Promise<ReminderRecord[]> {
    if (typeof global !== 'undefined' && (global as any).reminders) {
      return Array.from((global as any).reminders.values());
    }
    return [];
  }
}

/**
 * 工廠函數：創建提醒規則引擎實例
 */
export function createReminderRuleEngine(prisma: PrismaClient): ReminderRuleEngine {
  return new ReminderRuleEngine(prisma);
}
