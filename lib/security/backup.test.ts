/**
 * 備份系統測試
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 3 - 安全加固與合規
 */

import {
  BackupService,
  BackupType,
  BackupStatus,
  createBackup,
  listBackups,
  getBackup,
  verifyBackup,
  restoreBackup,
  deleteBackup,
  getBackupStats,
} from './backup';

describe('BackupService', () => {
  beforeEach(async () => {
    await BackupService.clear();
    BackupService.enable();
  });

  // ============================================================
  // 備份創建測試
  // ============================================================

  describe('備份創建', () => {
    it('應該成功創建完整備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
        includeFiles: true,
        description: 'Test full backup',
      });

      expect(backup.id).toBeDefined();
      expect(backup.type).toBe(BackupType.FULL);
      expect(backup.status).toBe(BackupStatus.COMPLETED);
      expect(backup.createdAt).toBeInstanceOf(Date);
      expect(backup.completedAt).toBeInstanceOf(Date);
      expect(backup.size).toBeGreaterThan(0);
      expect(backup.checksum).toBeDefined();
      expect(backup.includeFiles).toBe(true);
      expect(backup.description).toBe('Test full backup');
    });

    it('應該創建增量備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.INCREMENTAL,
      });

      expect(backup.type).toBe(BackupType.INCREMENTAL);
      expect(backup.status).toBe(BackupStatus.COMPLETED);
    });

    it('應該創建差異備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.DIFFERENTIAL,
      });

      expect(backup.type).toBe(BackupType.DIFFERENTIAL);
      expect(backup.status).toBe(BackupStatus.COMPLETED);
    });

    it('應該支持壓縮選項', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
        compression: true,
      });

      expect(backup.compression).toBe(true);
    });

    it('應該支持加密選項', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
        encryption: true,
      });

      expect(backup.encryption).toBe(true);
    });

    it('禁用時不應該創建備份', async () => {
      BackupService.disable();

      await expect(
        BackupService.createBackup({
          type: BackupType.FULL,
        })
      ).rejects.toThrow('Backup service is disabled');
    });
  });

  // ============================================================
  // 備份列表測試
  // ============================================================

  describe('備份列表', () => {
    beforeEach(async () => {
      // 創建測試備份
      await BackupService.createBackup({ type: BackupType.FULL });
      await BackupService.createBackup({ type: BackupType.INCREMENTAL });
      await BackupService.createBackup({ type: BackupType.DIFFERENTIAL });
    });

    it('應該列出所有備份', async () => {
      const backups = await BackupService.listBackups();
      expect(backups.length).toBe(3);
    });

    it('應該按類型過濾', async () => {
      const fullBackups = await BackupService.listBackups({
        type: BackupType.FULL,
      });

      expect(fullBackups.length).toBe(1);
      expect(fullBackups[0].type).toBe(BackupType.FULL);
    });

    it('應該按狀態過濾', async () => {
      const completedBackups = await BackupService.listBackups({
        status: BackupStatus.COMPLETED,
      });

      expect(completedBackups.length).toBe(3);
    });

    it('應該按時間倒序排列', async () => {
      const backups = await BackupService.listBackups();

      for (let i = 0; i < backups.length - 1; i++) {
        expect(backups[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          backups[i + 1].createdAt.getTime()
        );
      }
    });
  });

  // ============================================================
  // 備份查詢測試
  // ============================================================

  describe('備份查詢', () => {
    it('應該獲取備份詳情', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      const retrieved = await BackupService.getBackup(backup.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(backup.id);
      expect(retrieved?.type).toBe(BackupType.FULL);
    });

    it('不存在的備份應返回 null', async () => {
      const backup = await BackupService.getBackup('non-existent-id');
      expect(backup).toBeNull();
    });
  });

  // ============================================================
  // 備份驗證測試
  // ============================================================

  describe('備份驗證', () => {
    it('應該成功驗證有效備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      const isValid = await BackupService.verifyBackup(backup.id);
      expect(isValid).toBe(true);

      const verified = await BackupService.getBackup(backup.id);
      expect(verified?.status).toBe(BackupStatus.VERIFIED);
    });

    it('不存在的備份應拋出錯誤', async () => {
      await expect(BackupService.verifyBackup('non-existent-id')).rejects.toThrow(
        'Backup not found'
      );
    });

    it('應該檢測到損壞的備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      // 手動修改校驗和以模擬損壞
      const corruptedBackup = await BackupService.getBackup(backup.id);
      if (corruptedBackup) {
        corruptedBackup.checksum = 'invalid-checksum';
      }

      const isValid = await BackupService.verifyBackup(backup.id);
      expect(isValid).toBe(false);

      const verified = await BackupService.getBackup(backup.id);
      expect(verified?.status).toBe(BackupStatus.CORRUPTED);
    });
  });

  // ============================================================
  // 備份恢復測試
  // ============================================================

  describe('備份恢復', () => {
    it('應該成功恢復備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      const result = await BackupService.restoreBackup({
        backupId: backup.id,
      });

      expect(result.success).toBe(true);
      expect(result.backupId).toBe(backup.id);
      expect(result.restoredAt).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('應該在恢復前驗證備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      const result = await BackupService.restoreBackup({
        backupId: backup.id,
        verifyBeforeRestore: true,
      });

      expect(result.success).toBe(true);

      // 驗證備份狀態應更新為 VERIFIED
      const verified = await BackupService.getBackup(backup.id);
      expect(verified?.status).toBe(BackupStatus.VERIFIED);
    });

    it('不存在的備份應失敗', async () => {
      const result = await BackupService.restoreBackup({
        backupId: 'non-existent-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('損壞的備份在驗證時應失敗', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      // 手動修改校驗和
      const corruptedBackup = await BackupService.getBackup(backup.id);
      if (corruptedBackup) {
        corruptedBackup.checksum = 'invalid-checksum';
      }

      const result = await BackupService.restoreBackup({
        backupId: backup.id,
        verifyBeforeRestore: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('verification failed');
    });
  });

  // ============================================================
  // 備份刪除測試
  // ============================================================

  describe('備份刪除', () => {
    it('應該成功刪除備份', async () => {
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
      });

      const deleted = await BackupService.deleteBackup(backup.id);
      expect(deleted).toBe(true);

      const retrieved = await BackupService.getBackup(backup.id);
      expect(retrieved).toBeNull();
    });

    it('刪除不存在的備份應返回 false', async () => {
      const deleted = await BackupService.deleteBackup('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  // ============================================================
  // 備份清理測試
  // ============================================================

  describe('備份清理', () => {
    it('應該保留指定數量的最新備份', async () => {
      // 創建10個備份
      for (let i = 0; i < 10; i++) {
        await BackupService.createBackup({ type: BackupType.FULL });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // 保留最新5個
      const deleted = await BackupService.cleanupOldBackups(5);

      expect(deleted).toBe(5);

      const remaining = await BackupService.listBackups();
      expect(remaining.length).toBe(5);
    });

    it('備份數量少於保留數時不刪除', async () => {
      await BackupService.createBackup({ type: BackupType.FULL });
      await BackupService.createBackup({ type: BackupType.FULL });

      const deleted = await BackupService.cleanupOldBackups(5);

      expect(deleted).toBe(0);

      const remaining = await BackupService.listBackups();
      expect(remaining.length).toBe(2);
    });
  });

  // ============================================================
  // 備份統計測試
  // ============================================================

  describe('備份統計', () => {
    beforeEach(async () => {
      // 創建測試數據
      await BackupService.createBackup({ type: BackupType.FULL });
      await BackupService.createBackup({ type: BackupType.FULL });
      await BackupService.createBackup({ type: BackupType.INCREMENTAL });
      await BackupService.createBackup({ type: BackupType.DIFFERENTIAL });
    });

    it('應該統計總備份數', async () => {
      const stats = await BackupService.getStats();
      expect(stats.totalBackups).toBe(4);
    });

    it('應該統計總大小', async () => {
      const stats = await BackupService.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('應該識別最新和最舊的備份', async () => {
      const stats = await BackupService.getStats();
      expect(stats.latestBackup).toBeDefined();
      expect(stats.oldestBackup).toBeDefined();
      expect(stats.latestBackup?.createdAt.getTime()).toBeGreaterThanOrEqual(
        stats.oldestBackup?.createdAt.getTime() || 0
      );
    });

    it('應該按類型統計', async () => {
      const stats = await BackupService.getStats();
      expect(stats.byType[BackupType.FULL]).toBe(2);
      expect(stats.byType[BackupType.INCREMENTAL]).toBe(1);
      expect(stats.byType[BackupType.DIFFERENTIAL]).toBe(1);
    });

    it('應該按狀態統計', async () => {
      const stats = await BackupService.getStats();
      expect(stats.byStatus[BackupStatus.COMPLETED]).toBe(4);
    });

    it('應該計算平均大小', async () => {
      const stats = await BackupService.getStats();
      expect(stats.averageSize).toBeGreaterThan(0);
      expect(stats.averageSize).toBe(stats.totalSize / stats.totalBackups);
    });

    it('應該計算成功率', async () => {
      const stats = await BackupService.getStats();
      expect(stats.successRate).toBe(1); // 全部成功
    });
  });

  // ============================================================
  // 便利函數測試
  // ============================================================

  describe('便利函數', () => {
    it('createBackup 應該等同於 BackupService.createBackup', async () => {
      const backup = await createBackup({ type: BackupType.FULL });
      expect(backup.id).toBeDefined();
    });

    it('listBackups 應該等同於 BackupService.listBackups', async () => {
      await createBackup({ type: BackupType.FULL });
      const backups = await listBackups();
      expect(backups.length).toBe(1);
    });

    it('getBackup 應該等同於 BackupService.getBackup', async () => {
      const backup = await createBackup({ type: BackupType.FULL });
      const retrieved = await getBackup(backup.id);
      expect(retrieved?.id).toBe(backup.id);
    });

    it('verifyBackup 應該等同於 BackupService.verifyBackup', async () => {
      const backup = await createBackup({ type: BackupType.FULL });
      const isValid = await verifyBackup(backup.id);
      expect(isValid).toBe(true);
    });

    it('restoreBackup 應該等同於 BackupService.restoreBackup', async () => {
      const backup = await createBackup({ type: BackupType.FULL });
      const result = await restoreBackup({ backupId: backup.id });
      expect(result.success).toBe(true);
    });

    it('deleteBackup 應該等同於 BackupService.deleteBackup', async () => {
      const backup = await createBackup({ type: BackupType.FULL });
      const deleted = await deleteBackup(backup.id);
      expect(deleted).toBe(true);
    });

    it('getBackupStats 應該等同於 BackupService.getStats', async () => {
      await createBackup({ type: BackupType.FULL });
      const stats = await getBackupStats();
      expect(stats.totalBackups).toBe(1);
    });
  });

  // ============================================================
  // 真實業務場景測試
  // ============================================================

  describe('真實業務場景', () => {
    it('場景1: 每日自動備份流程', async () => {
      // 創建每日備份
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
        includeFiles: true,
        compression: true,
        encryption: true,
        description: 'Daily automated backup',
      });

      expect(backup.status).toBe(BackupStatus.COMPLETED);
      expect(backup.includeFiles).toBe(true);
      expect(backup.compression).toBe(true);
      expect(backup.encryption).toBe(true);

      // 驗證備份
      const isValid = await BackupService.verifyBackup(backup.id);
      expect(isValid).toBe(true);
    });

    it('場景2: 增量備份策略', async () => {
      // 週日完整備份
      await BackupService.createBackup({
        type: BackupType.FULL,
        description: 'Sunday full backup',
      });

      // 週一到週六增量備份
      for (let i = 1; i <= 6; i++) {
        await BackupService.createBackup({
          type: BackupType.INCREMENTAL,
          description: `Day ${i} incremental backup`,
        });
      }

      const backups = await BackupService.listBackups();
      expect(backups.length).toBe(7);

      const fullBackups = await BackupService.listBackups({
        type: BackupType.FULL,
      });
      expect(fullBackups.length).toBe(1);

      const incrementalBackups = await BackupService.listBackups({
        type: BackupType.INCREMENTAL,
      });
      expect(incrementalBackups.length).toBe(6);
    });

    it('場景3: 災難恢復演練', async () => {
      // 創建備份
      const backup = await BackupService.createBackup({
        type: BackupType.FULL,
        includeFiles: true,
      });

      // 驗證備份完整性
      const isValid = await BackupService.verifyBackup(backup.id);
      expect(isValid).toBe(true);

      // 執行恢復
      const restoreResult = await BackupService.restoreBackup({
        backupId: backup.id,
        verifyBeforeRestore: true,
      });

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.error).toBeUndefined();
    });

    it('場景4: 備份保留策略', async () => {
      // 創建30天的備份
      for (let i = 0; i < 45; i++) {
        await BackupService.createBackup({
          type: i % 7 === 0 ? BackupType.FULL : BackupType.INCREMENTAL,
        });
      }

      const beforeCleanup = await BackupService.listBackups();
      expect(beforeCleanup.length).toBe(45);

      // 保留最近30個
      const deleted = await BackupService.cleanupOldBackups(30);
      expect(deleted).toBe(15);

      const afterCleanup = await BackupService.listBackups();
      expect(afterCleanup.length).toBe(30);
    });

    it('場景5: 備份監控報告', async () => {
      // 創建各種類型的備份
      await BackupService.createBackup({ type: BackupType.FULL });
      await BackupService.createBackup({ type: BackupType.INCREMENTAL });
      await BackupService.createBackup({ type: BackupType.DIFFERENTIAL });

      // 生成統計報告
      const stats = await BackupService.getStats();

      expect(stats.totalBackups).toBe(3);
      expect(stats.successRate).toBe(1);
      expect(stats.latestBackup).toBeDefined();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.averageSize).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 性能測試
  // ============================================================

  describe('性能測試', () => {
    it('應該快速創建多個備份', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await BackupService.createBackup({ type: BackupType.INCREMENTAL });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 應該在合理時間內完成（<2秒）
      expect(duration).toBeLessThan(2000);
    });

    it('應該快速查詢大量備份', async () => {
      // 創建大量備份
      for (let i = 0; i < 100; i++) {
        await BackupService.createBackup({
          type: i % 3 === 0 ? BackupType.FULL : BackupType.INCREMENTAL,
        });
      }

      const startTime = Date.now();

      const backups = await BackupService.listBackups({
        type: BackupType.FULL,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(backups.length).toBeGreaterThan(0);
      // 查詢應該很快（<100ms）
      expect(duration).toBeLessThan(100);
    });
  });
});
