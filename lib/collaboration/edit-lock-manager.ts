/**
 * 編輯鎖定管理系統
 *
 * 功能：
 * - 獲取和釋放文檔編輯鎖
 * - 檢測編輯衝突
 * - 自動過期處理
 * - 協作通知
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { PrismaClient } from '@prisma/client';

/**
 * 鎖定類型
 */
export enum LockType {
  EDIT = 'EDIT',           // 編輯鎖定
  READ = 'READ',           // 讀取鎖定（未來擴展）
  EXCLUSIVE = 'EXCLUSIVE', // 獨占鎖定（未來擴展）
}

/**
 * 鎖定狀態
 */
export enum LockStatus {
  ACTIVE = 'ACTIVE',   // 活躍鎖定
  EXPIRED = 'EXPIRED', // 已過期
  RELEASED = 'RELEASED', // 已釋放
}

/**
 * 編輯鎖定記錄
 */
export interface EditLock {
  id: string;
  resourceType: string;
  resourceId: number;
  userId: number;
  userName?: string;
  lockType: LockType;
  status: LockStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  releasedAt?: Date;
}

/**
 * 鎖定獲取選項
 */
export interface AcquireLockOptions {
  lockType?: LockType;
  expiresInMinutes?: number; // 鎖定持續時間（分鐘）
  force?: boolean; // 強制獲取鎖定（管理員）
}

/**
 * 衝突檢測結果
 */
export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType?: 'LOCKED_BY_OTHER' | 'CONCURRENT_EDIT' | 'VERSION_MISMATCH';
  currentLock?: EditLock;
  currentVersion?: number;
  message?: string;
}

/**
 * 編輯鎖定管理器
 */
export class EditLockManager {
  private prisma: PrismaClient;
  private defaultLockDuration = 30; // 默認30分鐘

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 獲取編輯鎖定
   *
   * @param resourceType - 資源類型 (e.g., 'KnowledgeBase', 'Proposal')
   * @param resourceId - 資源ID
   * @param userId - 用戶ID
   * @param options - 鎖定選項
   * @returns 鎖定記錄
   */
  async acquireLock(
    resourceType: string,
    resourceId: number,
    userId: number,
    options: AcquireLockOptions = {}
  ): Promise<EditLock> {
    const {
      lockType = LockType.EDIT,
      expiresInMinutes = this.defaultLockDuration,
      force = false,
    } = options;

    // 1. 檢查是否已有活躍鎖定
    const existingLock = await this.getActiveLock(resourceType, resourceId);

    if (existingLock) {
      // 如果是同一個用戶，刷新鎖定時間
      if (existingLock.userId === userId) {
        return this.refreshLock(existingLock.id, expiresInMinutes);
      }

      // 如果是其他用戶且不強制，拋出錯誤
      if (!force) {
        throw new Error(
          `Resource is locked by user ${existingLock.userId}. Lock expires at ${existingLock.expiresAt.toISOString()}`
        );
      }

      // 強制獲取：釋放現有鎖定
      await this.releaseLock(existingLock.id, userId, true);
    }

    // 2. 創建新鎖定
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // 使用內存存儲（未來可遷移到Redis）
    const lock: EditLock = {
      id: this.generateLockId(),
      resourceType,
      resourceId,
      userId,
      lockType,
      status: LockStatus.ACTIVE,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 存儲到內存緩存（生產環境應使用Redis）
    await this.storeLock(lock);

    // 3. 發送鎖定通知
    await this.sendLockNotification(lock, 'ACQUIRED');

    return lock;
  }

  /**
   * 釋放編輯鎖定
   *
   * @param lockId - 鎖定ID
   * @param userId - 用戶ID
   * @returns 是否成功釋放
   */
  async releaseLock(lockId: string, userId: number, force?: boolean): Promise<boolean> {
    const lock = await this.getLockById(lockId);

    if (!lock) {
      throw new Error(`Lock ${lockId} not found`);
    }

    // 驗證用戶權限（只能釋放自己的鎖定或強制釋放）
    if (lock.userId !== userId && !force) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
        throw new Error('Unauthorized: Cannot release lock owned by another user');
      }
    }

    // 更新鎖定狀態
    lock.status = LockStatus.RELEASED;
    lock.releasedAt = new Date();
    lock.updatedAt = new Date();

    await this.storeLock(lock);

    // 發送釋放通知
    await this.sendLockNotification(lock, 'RELEASED');

    return true;
  }

  /**
   * 刷新鎖定時間
   *
   * @param lockId - 鎖定ID
   * @param expiresInMinutes - 延長時間（分鐘）
   * @returns 更新後的鎖定
   */
  async refreshLock(lockId: string, expiresInMinutes?: number): Promise<EditLock> {
    const lock = await this.getLockById(lockId);

    if (!lock) {
      throw new Error(`Lock ${lockId} not found`);
    }

    if (lock.status !== LockStatus.ACTIVE) {
      throw new Error(`Cannot refresh ${lock.status} lock`);
    }

    const duration = expiresInMinutes || this.defaultLockDuration;
    lock.expiresAt = new Date(Date.now() + duration * 60 * 1000);
    lock.updatedAt = new Date();

    await this.storeLock(lock);

    return lock;
  }

  /**
   * 檢測編輯衝突
   *
   * @param resourceType - 資源類型
   * @param resourceId - 資源ID
   * @param userId - 用戶ID
   * @param currentVersion - 當前版本號
   * @returns 衝突檢測結果
   */
  async detectConflict(
    resourceType: string,
    resourceId: number,
    userId: number,
    currentVersion?: number
  ): Promise<ConflictDetectionResult> {
    // 1. 檢查鎖定衝突
    const activeLock = await this.getActiveLock(resourceType, resourceId);

    if (activeLock && activeLock.userId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: activeLock.userId },
        select: { first_name: true, last_name: true },
      });

      const userName = user ? `${user.first_name} ${user.last_name}` : '未知用戶';

      return {
        hasConflict: true,
        conflictType: 'LOCKED_BY_OTHER',
        currentLock: { ...activeLock, userName },
        message: `文檔正在被 ${userName} 編輯中，鎖定將於 ${activeLock.expiresAt.toLocaleString()} 過期`,
      };
    }

    // 2. 檢查版本衝突（如果提供了版本號）
    if (currentVersion !== undefined) {
      const latestVersion = await this.getLatestVersion(resourceType, resourceId);

      if (latestVersion && latestVersion > currentVersion) {
        return {
          hasConflict: true,
          conflictType: 'VERSION_MISMATCH',
          currentVersion: latestVersion,
          message: `文檔已被更新到版本 ${latestVersion}，您的版本為 ${currentVersion}`,
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * 獲取資源的活躍鎖定
   *
   * @param resourceType - 資源類型
   * @param resourceId - 資源ID
   * @returns 活躍鎖定或null
   */
  async getActiveLock(
    resourceType: string,
    resourceId: number
  ): Promise<EditLock | null> {
    // 從內存緩存獲取（生產環境應使用Redis）
    const locks = await this.getLocksFromCache();

    const activeLocks = locks.filter(
      (lock) =>
        lock.resourceType === resourceType &&
        lock.resourceId === resourceId &&
        lock.status === LockStatus.ACTIVE &&
        lock.expiresAt > new Date()
    );

    return activeLocks.length > 0 ? activeLocks[0] : null;
  }

  /**
   * 獲取用戶的所有活躍鎖定
   *
   * @param userId - 用戶ID
   * @returns 活躍鎖定列表
   */
  async getUserActiveLocks(userId: number): Promise<EditLock[]> {
    const locks = await this.getLocksFromCache();

    return locks.filter(
      (lock) =>
        lock.userId === userId &&
        lock.status === LockStatus.ACTIVE &&
        lock.expiresAt > new Date()
    );
  }

  /**
   * 清理過期鎖定
   *
   * @returns 清理的鎖定數量
   */
  async cleanupExpiredLocks(): Promise<number> {
    const locks = await this.getLocksFromCache();
    const now = new Date();

    let cleanedCount = 0;

    for (const lock of locks) {
      if (lock.status === LockStatus.ACTIVE && lock.expiresAt < now) {
        lock.status = LockStatus.EXPIRED;
        lock.updatedAt = now;
        await this.storeLock(lock);
        cleanedCount++;

        // 發送過期通知
        await this.sendLockNotification(lock, 'EXPIRED');
      }
    }

    return cleanedCount;
  }

  /**
   * 獲取最新版本號
   *
   * @param resourceType - 資源類型
   * @param resourceId - 資源ID
   * @returns 最新版本號
   */
  private async getLatestVersion(
    resourceType: string,
    resourceId: number
  ): Promise<number | null> {
    if (resourceType === 'KnowledgeBase') {
      const kb = await this.prisma.knowledgeBase.findUnique({
        where: { id: resourceId },
        select: { version: true },
      });
      return kb?.version || null;
    }

    if (resourceType === 'Proposal') {
      const proposal = await this.prisma.proposal.findUnique({
        where: { id: resourceId },
      });
      return proposal ? 1 : null; // Proposals沒有版本號，返回1表示存在
    }

    return null;
  }

  /**
   * 發送鎖定通知
   *
   * @param lock - 鎖定記錄
   * @param action - 動作類型
   */
  private async sendLockNotification(
    lock: EditLock,
    action: 'ACQUIRED' | 'RELEASED' | 'EXPIRED'
  ): Promise<void> {
    try {
      // 動態導入通知引擎
      const { NotificationEngine } = await import('@/lib/notification/engine');
      const { NotificationType, NotificationCategory, NotificationPriority, NotificationChannel } =
        await import('@prisma/client');

      const notificationEngine = new NotificationEngine(this.prisma);

      // 獲取用戶信息
      const user = await this.prisma.user.findUnique({
        where: { id: lock.userId },
        select: { first_name: true, last_name: true },
      });

      const userName = user ? `${user.first_name} ${user.last_name}` : '用戶';

      // 根據動作類型構建通知消息
      const messages = {
        ACQUIRED: {
          title: '文檔編輯鎖定已獲取',
          message: `${userName} 已獲取 ${lock.resourceType} #${lock.resourceId} 的編輯鎖定，將於 ${lock.expiresAt.toLocaleString()} 過期`,
        },
        RELEASED: {
          title: '文檔編輯鎖定已釋放',
          message: `${userName} 已釋放 ${lock.resourceType} #${lock.resourceId} 的編輯鎖定`,
        },
        EXPIRED: {
          title: '文檔編輯鎖定已過期',
          message: `${userName} 對 ${lock.resourceType} #${lock.resourceId} 的編輯鎖定已過期`,
        },
      };

      const { title, message } = messages[action];

      // 發送通知給鎖定擁有者
      await notificationEngine.createNotification({
        recipientId: lock.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SYSTEM,
        priority: action === 'EXPIRED' ? NotificationPriority.HIGH : NotificationPriority.LOW,
        title,
        message,
        channels: [NotificationChannel.IN_APP],
        data: {
          lockId: lock.id,
          resourceType: lock.resourceType,
          resourceId: lock.resourceId,
          action,
        },
      });
    } catch (error) {
      console.error('Failed to send lock notification:', error);
    }
  }

  /**
   * 生成鎖定ID
   */
  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 通過ID獲取鎖定
   */
  private async getLockById(lockId: string): Promise<EditLock | null> {
    const locks = await this.getLocksFromCache();
    return locks.find((lock) => lock.id === lockId) || null;
  }

  /**
   * 存儲鎖定（內存實現，生產環境應使用Redis）
   */
  private async storeLock(lock: EditLock): Promise<void> {
    // 簡單的內存存儲實現
    // 生產環境應替換為 Redis SETEX
    if (typeof global !== 'undefined') {
      if (!(global as any).editLocks) {
        (global as any).editLocks = new Map<string, EditLock>();
      }
      (global as any).editLocks.set(lock.id, lock);
    }
  }

  /**
   * 從緩存獲取所有鎖定
   */
  private async getLocksFromCache(): Promise<EditLock[]> {
    if (typeof global !== 'undefined' && (global as any).editLocks) {
      return Array.from((global as any).editLocks.values());
    }
    return [];
  }
}

/**
 * 工廠函數：創建編輯鎖定管理器實例
 */
export function createEditLockManager(prisma: PrismaClient): EditLockManager {
  return new EditLockManager(prisma);
}
