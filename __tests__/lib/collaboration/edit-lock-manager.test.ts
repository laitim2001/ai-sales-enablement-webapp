/**
 * 編輯鎖定管理器測試
 *
 * 測試編輯鎖定的獲取、釋放、衝突檢測等功能
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { PrismaClient } from '@prisma/client';
import {
  EditLockManager,
  LockType,
  LockStatus,
} from '@/lib/collaboration/edit-lock-manager';

// Mock Prisma
jest.mock('@prisma/client');

describe('EditLockManager', () => {
  let lockManager: EditLockManager;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // 清理全局鎖定緩存
    if (typeof global !== 'undefined') {
      (global as any).editLocks = new Map();
    }

    const mockUserFindUnique = jest.fn();
    const mockKnowledgeBaseFindUnique = jest.fn();
    const mockProposalFindUnique = jest.fn();

    mockPrisma = {
      user: {
        findUnique: mockUserFindUnique,
      },
      knowledgeBase: {
        findUnique: mockKnowledgeBaseFindUnique,
      },
      proposal: {
        findUnique: mockProposalFindUnique,
      },
    } as any;

    lockManager = new EditLockManager(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('應該成功獲取新鎖定', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100);

      expect(lock).toBeDefined();
      expect(lock.resourceType).toBe('KnowledgeBase');
      expect(lock.resourceId).toBe(1);
      expect(lock.userId).toBe(100);
      expect(lock.status).toBe(LockStatus.ACTIVE);
      expect(lock.lockType).toBe(LockType.EDIT);
      expect(lock.expiresAt).toBeInstanceOf(Date);
    });

    it('應該自動刷新同一用戶的鎖定', async () => {
      // 第一次獲取鎖定
      const lock1 = await lockManager.acquireLock('KnowledgeBase', 1, 100);
      const firstExpiry = lock1.expiresAt;

      // 等待一小段時間
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 同一用戶再次獲取
      const lock2 = await lockManager.acquireLock('KnowledgeBase', 1, 100);

      expect(lock2.id).toBe(lock1.id);
      expect(lock2.expiresAt.getTime()).toBeGreaterThan(firstExpiry.getTime());
    });

    it('應該在其他用戶鎖定時拋出錯誤', async () => {
      // 用戶100獲取鎖定
      await lockManager.acquireLock('KnowledgeBase', 1, 100);

      // 用戶200嘗試獲取
      await expect(
        lockManager.acquireLock('KnowledgeBase', 1, 200)
      ).rejects.toThrow(/locked by user/i);
    });

    it('應該支持強制獲取鎖定', async () => {
      // 用戶100獲取鎖定
      await lockManager.acquireLock('KnowledgeBase', 1, 100);

      // 用戶200強制獲取
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 200, {
        force: true,
      });

      expect(lock.userId).toBe(200);

      // 驗證原鎖定已釋放
      const activeLock = await lockManager.getActiveLock('KnowledgeBase', 1);
      expect(activeLock?.userId).toBe(200);
    });

    it('應該自定義鎖定過期時間', async () => {
      const customMinutes = 60;
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100, {
        expiresInMinutes: customMinutes,
      });

      const expectedExpiry = Date.now() + customMinutes * 60 * 1000;
      const actualExpiry = lock.expiresAt.getTime();

      // 允許5秒誤差
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(5000);
    });
  });

  describe('releaseLock', () => {
    it('應該成功釋放自己的鎖定', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100);

      const released = await lockManager.releaseLock(lock.id, 100);

      expect(released).toBe(true);

      const activeLock = await lockManager.getActiveLock('KnowledgeBase', 1);
      expect(activeLock).toBeNull();
    });

    it('應該在鎖定不存在時拋出錯誤', async () => {
      await expect(
        lockManager.releaseLock('non-existent-lock', 100)
      ).rejects.toThrow(/not found/i);
    });

    it('應該在非擁有者嘗試釋放時拋出錯誤', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100);

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: 200,
        role: 'SALES_REP',
      } as any);

      await expect(
        lockManager.releaseLock(lock.id, 200)
      ).rejects.toThrow(/unauthorized/i);
    });

    it('應該允許管理員釋放他人的鎖定', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100);

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: 200,
        role: 'ADMIN',
      } as any);

      const released = await lockManager.releaseLock(lock.id, 200);

      expect(released).toBe(true);
    });
  });

  describe('refreshLock', () => {
    it('應該成功刷新鎖定時間', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100, {
        expiresInMinutes: 30,
      });

      const originalExpiry = lock.expiresAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const refreshedLock = await lockManager.refreshLock(lock.id, 60);

      expect(refreshedLock.expiresAt.getTime()).toBeGreaterThan(
        originalExpiry.getTime()
      );
    });

    it('應該在鎖定已釋放時拋出錯誤', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100);
      await lockManager.releaseLock(lock.id, 100);

      await expect(lockManager.refreshLock(lock.id)).rejects.toThrow(
        /cannot refresh/i
      );
    });
  });

  describe('detectConflict', () => {
    it('應該檢測到其他用戶的鎖定衝突', async () => {
      await lockManager.acquireLock('KnowledgeBase', 1, 100);

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: 100,
        first_name: 'Test',
        last_name: 'User',
      } as any);

      const conflict = await lockManager.detectConflict('KnowledgeBase', 1, 200);

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictType).toBe('LOCKED_BY_OTHER');
      expect(conflict.message).toContain('Test User');
    });

    it('應該檢測到版本衝突', async () => {
      (mockPrisma.knowledgeBase.findUnique as any).mockResolvedValue({
        id: 1,
        version: 5,
      } as any);

      const conflict = await lockManager.detectConflict(
        'KnowledgeBase',
        1,
        100,
        3
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictType).toBe('VERSION_MISMATCH');
      expect(conflict.currentVersion).toBe(5);
    });

    it('應該在沒有衝突時返回無衝突', async () => {
      (mockPrisma.knowledgeBase.findUnique as any).mockResolvedValue({
        id: 1,
        version: 3,
      } as any);

      const conflict = await lockManager.detectConflict(
        'KnowledgeBase',
        1,
        100,
        3
      );

      expect(conflict.hasConflict).toBe(false);
    });
  });

  describe('getActiveLock', () => {
    it('應該返回活躍鎖定', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100);

      const activeLock = await lockManager.getActiveLock('KnowledgeBase', 1);

      expect(activeLock).not.toBeNull();
      expect(activeLock?.id).toBe(lock.id);
    });

    it('應該在沒有鎖定時返回null', async () => {
      const activeLock = await lockManager.getActiveLock('KnowledgeBase', 1);

      expect(activeLock).toBeNull();
    });

    it('應該不返回已過期的鎖定', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100, {
        expiresInMinutes: -1, // 立即過期
      });

      const activeLock = await lockManager.getActiveLock('KnowledgeBase', 1);

      expect(activeLock).toBeNull();
    });
  });

  describe('getUserActiveLocks', () => {
    it('應該返回用戶的所有活躍鎖定', async () => {
      await lockManager.acquireLock('KnowledgeBase', 1, 100);
      await lockManager.acquireLock('KnowledgeBase', 2, 100);
      await lockManager.acquireLock('Proposal', 1, 100);

      const locks = await lockManager.getUserActiveLocks(100);

      expect(locks).toHaveLength(3);
    });

    it('應該只返回屬於該用戶的鎖定', async () => {
      await lockManager.acquireLock('KnowledgeBase', 1, 100);
      await lockManager.acquireLock('KnowledgeBase', 2, 200);

      const locks = await lockManager.getUserActiveLocks(100);

      expect(locks).toHaveLength(1);
      expect(locks[0].userId).toBe(100);
    });
  });

  describe('cleanupExpiredLocks', () => {
    it('應該清理過期鎖定', async () => {
      // 創建一個立即過期的鎖定
      await lockManager.acquireLock('KnowledgeBase', 1, 100, {
        expiresInMinutes: -1,
      });

      // 創建一個正常鎖定
      await lockManager.acquireLock('KnowledgeBase', 2, 100);

      const cleanedCount = await lockManager.cleanupExpiredLocks();

      expect(cleanedCount).toBe(1);

      // 驗證正常鎖定仍然存在
      const locks = await lockManager.getUserActiveLocks(100);
      expect(locks).toHaveLength(1);
      expect(locks[0].resourceId).toBe(2);
    });

    it('應該更新過期鎖定的狀態', async () => {
      const lock = await lockManager.acquireLock('KnowledgeBase', 1, 100, {
        expiresInMinutes: -1,
      });

      await lockManager.cleanupExpiredLocks();

      // 從緩存直接獲取以檢查狀態
      const locks = await (lockManager as any).getLocksFromCache();
      const expiredLock = locks.find((l: any) => l.id === lock.id);

      expect(expiredLock?.status).toBe(LockStatus.EXPIRED);
    });
  });
});
