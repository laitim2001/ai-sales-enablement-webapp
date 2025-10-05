/**
 * 提醒調度器
 *
 * 功能：
 * - 定期檢查待觸發的提醒
 * - 自動觸發到期的提醒
 * - 管理提醒調度任務
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { PrismaClient } from '@prisma/client';
import { ReminderRuleEngine, ReminderStatus } from './reminder-rule-engine';

/**
 * 調度器配置
 */
export interface SchedulerConfig {
  checkIntervalMs?: number;  // 檢查間隔（毫秒）
  batchSize?: number;        // 每次處理的提醒數量
  retryAttempts?: number;    // 失敗重試次數
  retryDelayMs?: number;     // 重試延遲（毫秒）
}

/**
 * 提醒調度器
 */
export class ReminderScheduler {
  private ruleEngine: ReminderRuleEngine;
  private config: Required<SchedulerConfig>;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    prisma: PrismaClient,
    config: SchedulerConfig = {}
  ) {
    this.ruleEngine = new ReminderRuleEngine(prisma);
    this.config = {
      checkIntervalMs: config.checkIntervalMs || 60000, // 默認1分鐘
      batchSize: config.batchSize || 50,
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 5000,
    };
  }

  /**
   * 啟動調度器
   */
  start(): void {
    if (this.isRunning) {
      console.log('Reminder scheduler is already running');
      return;
    }

    console.log(`Starting reminder scheduler (check interval: ${this.config.checkIntervalMs}ms)`);

    this.isRunning = true;

    // 立即執行一次檢查
    this.checkAndTriggerReminders();

    // 設置定期檢查
    this.intervalId = setInterval(() => {
      this.checkAndTriggerReminders();
    }, this.config.checkIntervalMs);
  }

  /**
   * 停止調度器
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Reminder scheduler is not running');
      return;
    }

    console.log('Stopping reminder scheduler');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 檢查並觸發提醒
   */
  private async checkAndTriggerReminders(): Promise<void> {
    try {
      const now = new Date();
      const pendingReminders = await this.ruleEngine.getPendingReminders(now);

      if (pendingReminders.length === 0) {
        console.log(`No pending reminders at ${now.toISOString()}`);
        return;
      }

      console.log(`Found ${pendingReminders.length} pending reminders to trigger`);

      // 分批處理提醒
      for (let i = 0; i < pendingReminders.length; i += this.config.batchSize) {
        const batch = pendingReminders.slice(i, i + this.config.batchSize);

        await Promise.all(
          batch.map((reminder) => this.triggerReminderWithRetry(reminder.id))
        );
      }

      console.log(`Successfully triggered ${pendingReminders.length} reminders`);
    } catch (error) {
      console.error('Error checking and triggering reminders:', error);
    }
  }

  /**
   * 帶重試的觸發提醒
   */
  private async triggerReminderWithRetry(
    reminderId: string,
    attempt: number = 1
  ): Promise<void> {
    try {
      await this.ruleEngine.triggerReminder(reminderId);
    } catch (error) {
      console.error(`Failed to trigger reminder ${reminderId} (attempt ${attempt}):`, error);

      if (attempt < this.config.retryAttempts) {
        console.log(`Retrying reminder ${reminderId} in ${this.config.retryDelayMs}ms...`);

        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelayMs));

        return this.triggerReminderWithRetry(reminderId, attempt + 1);
      } else {
        console.error(`Failed to trigger reminder ${reminderId} after ${this.config.retryAttempts} attempts`);
      }
    }
  }

  /**
   * 獲取調度器狀態
   */
  getStatus(): {
    isRunning: boolean;
    config: Required<SchedulerConfig>;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}

/**
 * 全局調度器實例（單例模式）
 */
let globalScheduler: ReminderScheduler | null = null;

/**
 * 獲取或創建全局調度器實例
 */
export function getGlobalScheduler(prisma: PrismaClient, config?: SchedulerConfig): ReminderScheduler {
  if (!globalScheduler) {
    globalScheduler = new ReminderScheduler(prisma, config);
  }
  return globalScheduler;
}

/**
 * 啟動全局調度器
 */
export function startGlobalScheduler(prisma: PrismaClient, config?: SchedulerConfig): void {
  const scheduler = getGlobalScheduler(prisma, config);
  scheduler.start();
}

/**
 * 停止全局調度器
 */
export function stopGlobalScheduler(): void {
  if (globalScheduler) {
    globalScheduler.stop();
  }
}
