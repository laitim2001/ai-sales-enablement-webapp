/**
 * 審計日誌系統測試
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 3 - 安全加固與合規
 */

import {
  AuditLogger,
  AuditAction,
  AuditResource,
  AuditSeverity,
  logAudit,
  queryAudit,
  getAuditStats,
} from './audit-log';

describe('AuditLogger', () => {
  beforeEach(async () => {
    // 清空日誌並啟用
    await AuditLogger.clear();
    AuditLogger.enable();
  });

  // ============================================================
  // 基本日誌記錄測試
  // ============================================================

  describe('基本日誌記錄', () => {
    it('應該成功記錄基本審計日誌', async () => {
      const entry = await AuditLogger.log({
        userId: 1,
        userName: 'Test User',
        userEmail: 'test@example.com',
        action: AuditAction.LOGIN,
        resource: AuditResource.AUTH,
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.userId).toBe(1);
      expect(entry.userName).toBe('Test User');
      expect(entry.action).toBe(AuditAction.LOGIN);
      expect(entry.resource).toBe(AuditResource.AUTH);
      expect(entry.success).toBe(true);
      expect(entry.severity).toBe(AuditSeverity.INFO);
    });

    it('應該記錄包含完整信息的審計日誌', async () => {
      const entry = await AuditLogger.log({
        userId: 2,
        userName: 'Admin User',
        userEmail: 'admin@example.com',
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
        resourceId: '123',
        severity: AuditSeverity.INFO,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { name: 'New Customer', industry: 'Tech' },
        requestId: 'req-123',
        sessionId: 'session-456',
      });

      expect(entry.resourceId).toBe('123');
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
      expect(entry.details).toEqual({ name: 'New Customer', industry: 'Tech' });
      expect(entry.requestId).toBe('req-123');
      expect(entry.sessionId).toBe('session-456');
    });

    it('應該記錄失敗的操作', async () => {
      const entry = await AuditLogger.log({
        userId: 3,
        action: AuditAction.LOGIN_FAILED,
        resource: AuditResource.AUTH,
        success: false,
        errorMessage: 'Invalid credentials',
      });

      expect(entry.success).toBe(false);
      expect(entry.errorMessage).toBe('Invalid credentials');
      expect(entry.severity).toBe(AuditSeverity.WARNING);
    });

    it('禁用時不應該記錄日誌', async () => {
      AuditLogger.disable();

      await expect(
        AuditLogger.log({
          userId: 1,
          action: AuditAction.LOGIN,
          resource: AuditResource.AUTH,
        })
      ).rejects.toThrow('Audit logging is disabled');

      const logs = await AuditLogger.getAll();
      expect(logs.length).toBe(0);
    });
  });

  // ============================================================
  // 嚴重級別自動判定測試
  // ============================================================

  describe('嚴重級別自動判定', () => {
    it('關鍵操作應該標記為 CRITICAL', async () => {
      const actions = [
        AuditAction.ENCRYPTION_KEY_ROTATION,
        AuditAction.PERMISSION_GRANT,
        AuditAction.PERMISSION_REVOKE,
        AuditAction.ROLE_CHANGE,
      ];

      for (const action of actions) {
        const entry = await AuditLogger.log({
          userId: 1,
          action,
          resource: AuditResource.SYSTEM_CONFIG,
        });

        expect(entry.severity).toBe(AuditSeverity.CRITICAL);
      }
    });

    it('敏感操作應該標記為 WARNING', async () => {
      const actions = [
        AuditAction.DELETE,
        AuditAction.BULK_DELETE,
        AuditAction.CONFIG_CHANGE,
        AuditAction.SENSITIVE_DATA_ACCESS,
      ];

      for (const action of actions) {
        const entry = await AuditLogger.log({
          userId: 1,
          action,
          resource: AuditResource.CUSTOMER,
        });

        expect(entry.severity).toBe(AuditSeverity.WARNING);
      }
    });

    it('一般操作應該標記為 INFO', async () => {
      const entry = await AuditLogger.log({
        userId: 1,
        action: AuditAction.READ,
        resource: AuditResource.CUSTOMER,
      });

      expect(entry.severity).toBe(AuditSeverity.INFO);
    });

    it('失敗的操作應該提升嚴重級別', async () => {
      const entry = await AuditLogger.log({
        userId: 1,
        action: AuditAction.LOGIN_FAILED,
        resource: AuditResource.AUTH,
        success: false,
      });

      expect(entry.severity).toBe(AuditSeverity.WARNING);
    });
  });

  // ============================================================
  // 日誌查詢測試
  // ============================================================

  describe('日誌查詢', () => {
    beforeEach(async () => {
      // 創建測試數據
      await AuditLogger.log({
        userId: 1,
        userName: 'User 1',
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
        resourceId: '1',
      });

      await AuditLogger.log({
        userId: 2,
        userName: 'User 2',
        action: AuditAction.UPDATE,
        resource: AuditResource.CUSTOMER,
        resourceId: '2',
      });

      await AuditLogger.log({
        userId: 1,
        userName: 'User 1',
        action: AuditAction.DELETE,
        resource: AuditResource.PROPOSAL,
        resourceId: '3',
      });

      await AuditLogger.log({
        userId: 3,
        userName: 'User 3',
        action: AuditAction.LOGIN_FAILED,
        resource: AuditResource.AUTH,
        success: false,
      });
    });

    it('應該查詢所有日誌', async () => {
      const logs = await AuditLogger.query({});
      expect(logs.length).toBe(4);
    });

    it('應該按用戶過濾', async () => {
      const logs = await AuditLogger.query({ userId: 1 });
      expect(logs.length).toBe(2);
      expect(logs.every((log) => log.userId === 1)).toBe(true);
    });

    it('應該按操作過濾', async () => {
      const logs = await AuditLogger.query({ action: AuditAction.CREATE });
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe(AuditAction.CREATE);
    });

    it('應該按多個操作過濾', async () => {
      const logs = await AuditLogger.query({
        action: [AuditAction.CREATE, AuditAction.UPDATE],
      });
      expect(logs.length).toBe(2);
    });

    it('應該按資源過濾', async () => {
      const logs = await AuditLogger.query({ resource: AuditResource.CUSTOMER });
      expect(logs.length).toBe(2);
    });

    it('應該按成功狀態過濾', async () => {
      const logs = await AuditLogger.query({ success: false });
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe(AuditAction.LOGIN_FAILED);
    });

    it('應該按資源 ID 過濾', async () => {
      const logs = await AuditLogger.query({ resourceId: '1' });
      expect(logs.length).toBe(1);
      expect(logs[0].resourceId).toBe('1');
    });

    it('應該按時間範圍過濾', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 3600000); // 1小時前
      const future = new Date(now.getTime() + 3600000); // 1小時後

      const logs = await AuditLogger.query({
        startDate: past,
        endDate: future,
      });

      expect(logs.length).toBe(4);
    });

    it('應該支持分頁', async () => {
      const page1 = await AuditLogger.query({ limit: 2, offset: 0 });
      const page2 = await AuditLogger.query({ limit: 2, offset: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('應該按時間倒序排列', async () => {
      const logs = await AuditLogger.query({});

      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          logs[i + 1].timestamp.getTime()
        );
      }
    });

    it('應該支持複合查詢', async () => {
      const logs = await AuditLogger.query({
        userId: 1,
        resource: AuditResource.CUSTOMER,
        action: AuditAction.CREATE,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe(1);
      expect(logs[0].resource).toBe(AuditResource.CUSTOMER);
      expect(logs[0].action).toBe(AuditAction.CREATE);
    });
  });

  // ============================================================
  // 統計測試
  // ============================================================

  describe('日誌統計', () => {
    beforeEach(async () => {
      // 創建測試數據
      for (let i = 0; i < 10; i++) {
        await AuditLogger.log({
          userId: (i % 3) + 1,
          userName: `User ${(i % 3) + 1}`,
          action: i % 2 === 0 ? AuditAction.CREATE : AuditAction.UPDATE,
          resource: AuditResource.CUSTOMER,
          success: i % 5 !== 0, // 每5個有1個失敗
        });
      }

      await AuditLogger.log({
        userId: 1,
        action: AuditAction.DELETE,
        resource: AuditResource.PROPOSAL,
      });
    });

    it('應該統計總日誌數', async () => {
      const stats = await AuditLogger.getStats();
      expect(stats.totalLogs).toBe(11);
    });

    it('應該統計按操作分組', async () => {
      const stats = await AuditLogger.getStats();
      expect(stats.logsByAction[AuditAction.CREATE]).toBe(5);
      expect(stats.logsByAction[AuditAction.UPDATE]).toBe(5);
      expect(stats.logsByAction[AuditAction.DELETE]).toBe(1);
    });

    it('應該統計按資源分組', async () => {
      const stats = await AuditLogger.getStats();
      expect(stats.logsByResource[AuditResource.CUSTOMER]).toBe(10);
      expect(stats.logsByResource[AuditResource.PROPOSAL]).toBe(1);
    });

    it('應該計算成功率', async () => {
      const stats = await AuditLogger.getStats();
      // 10個中有2個失敗 + 1個成功 = 11個總共，9個成功
      expect(stats.successRate).toBeCloseTo(9 / 11, 2);
    });

    it('應該統計頂級用戶', async () => {
      const stats = await AuditLogger.getStats();
      expect(stats.topUsers.length).toBeGreaterThan(0);
      expect(stats.topUsers[0].count).toBeGreaterThan(0);
    });

    it('應該統計頂級操作', async () => {
      const stats = await AuditLogger.getStats();
      expect(stats.topActions.length).toBeGreaterThan(0);
      expect(stats.topActions[0].count).toBeGreaterThan(0);
    });

    it('應該生成時間線', async () => {
      const stats = await AuditLogger.getStats();
      expect(stats.timeline.length).toBeGreaterThan(0);
      expect(stats.timeline[0].date).toBeDefined();
      expect(stats.timeline[0].count).toBeGreaterThan(0);
    });

    it('應該支持條件統計', async () => {
      const stats = await AuditLogger.getStats({ userId: 1 });
      expect(stats.totalLogs).toBeLessThan(11);
    });
  });

  // ============================================================
  // 日誌清理測試
  // ============================================================

  describe('日誌清理', () => {
    it('應該清理過期日誌', async () => {
      // 創建舊日誌
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // 400天前

      await AuditLogger.log({
        userId: 1,
        action: AuditAction.LOGIN,
        resource: AuditResource.AUTH,
      });

      // 手動修改時間戳（模擬舊日誌）
      const logs = await AuditLogger.getAll();
      logs[0].timestamp = oldDate;

      // 創建新日誌
      await AuditLogger.log({
        userId: 2,
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
      });

      const beforeCleanup = await AuditLogger.getAll();
      expect(beforeCleanup.length).toBe(2);

      // 清理超過365天的日誌
      const removed = await AuditLogger.cleanup(365);

      expect(removed).toBe(1);

      const afterCleanup = await AuditLogger.getAll();
      expect(afterCleanup.length).toBe(1);
      expect(afterCleanup[0].userId).toBe(2);
    });

    it('不應該清理未過期的日誌', async () => {
      await AuditLogger.log({
        userId: 1,
        action: AuditAction.LOGIN,
        resource: AuditResource.AUTH,
      });

      await AuditLogger.log({
        userId: 2,
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
      });

      const removed = await AuditLogger.cleanup(365);
      expect(removed).toBe(0);

      const logs = await AuditLogger.getAll();
      expect(logs.length).toBe(2);
    });
  });

  // ============================================================
  // 便利函數測試
  // ============================================================

  describe('便利函數', () => {
    it('logAudit 應該等同於 AuditLogger.log', async () => {
      const entry = await logAudit({
        userId: 1,
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
      });

      expect(entry.id).toBeDefined();
      expect(entry.userId).toBe(1);
    });

    it('queryAudit 應該等同於 AuditLogger.query', async () => {
      await logAudit({
        userId: 1,
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
      });

      const logs = await queryAudit({ userId: 1 });
      expect(logs.length).toBe(1);
    });

    it('getAuditStats 應該等同於 AuditLogger.getStats', async () => {
      await logAudit({
        userId: 1,
        action: AuditAction.CREATE,
        resource: AuditResource.CUSTOMER,
      });

      const stats = await getAuditStats();
      expect(stats.totalLogs).toBe(1);
    });
  });

  // ============================================================
  // 真實業務場景測試
  // ============================================================

  describe('真實業務場景', () => {
    it('場景1: 用戶登入失敗追蹤', async () => {
      // 記錄3次登入失敗
      for (let i = 0; i < 3; i++) {
        await AuditLogger.log({
          userId: 1,
          userName: 'Test User',
          action: AuditAction.LOGIN_FAILED,
          resource: AuditResource.AUTH,
          success: false,
          ipAddress: '192.168.1.100',
          errorMessage: 'Invalid credentials',
        });
      }

      // 查詢該用戶的登入失敗記錄
      const failedLogins = await AuditLogger.query({
        userId: 1,
        action: AuditAction.LOGIN_FAILED,
        success: false,
      });

      expect(failedLogins.length).toBe(3);
      expect(failedLogins.every((log) => log.severity === AuditSeverity.WARNING)).toBe(
        true
      );
    });

    it('場景2: 敏感資料訪問審計', async () => {
      await AuditLogger.log({
        userId: 2,
        userName: 'Admin User',
        action: AuditAction.SENSITIVE_DATA_ACCESS,
        resource: AuditResource.CUSTOMER,
        resourceId: '123',
        ipAddress: '192.168.1.10',
        details: { fields: ['email', 'phone', 'address'] },
      });

      const accessLogs = await AuditLogger.query({
        action: AuditAction.SENSITIVE_DATA_ACCESS,
      });

      expect(accessLogs.length).toBe(1);
      expect(accessLogs[0].severity).toBe(AuditSeverity.WARNING);
      expect(accessLogs[0].details?.fields).toContain('email');
    });

    it('場景3: 批量刪除操作審計', async () => {
      await AuditLogger.log({
        userId: 1,
        userName: 'Manager',
        action: AuditAction.BULK_DELETE,
        resource: AuditResource.CUSTOMER,
        details: { count: 50, reason: 'Data cleanup' },
      });

      const deleteLogs = await AuditLogger.query({
        action: AuditAction.BULK_DELETE,
      });

      expect(deleteLogs.length).toBe(1);
      expect(deleteLogs[0].severity).toBe(AuditSeverity.WARNING);
      expect(deleteLogs[0].details?.count).toBe(50);
    });

    it('場景4: 權限變更審計追蹤', async () => {
      // 記錄權限授予
      await AuditLogger.log({
        userId: 1,
        userName: 'Admin',
        action: AuditAction.PERMISSION_GRANT,
        resource: AuditResource.USER,
        resourceId: '5',
        details: { permission: 'admin', grantedTo: 'user5@example.com' },
      });

      // 記錄角色變更
      await AuditLogger.log({
        userId: 1,
        userName: 'Admin',
        action: AuditAction.ROLE_CHANGE,
        resource: AuditResource.USER,
        resourceId: '5',
        details: { from: 'SALES_REP', to: 'SALES_MANAGER' },
      });

      const permissionLogs = await AuditLogger.query({
        resource: AuditResource.USER,
        resourceId: '5',
      });

      expect(permissionLogs.length).toBe(2);
      expect(
        permissionLogs.every((log) => log.severity === AuditSeverity.CRITICAL)
      ).toBe(true);
    });

    it('場景5: 合規報告生成', async () => {
      // 模擬一天的操作
      const actions = [
        { action: AuditAction.LOGIN, count: 50 },
        { action: AuditAction.CREATE, count: 20 },
        { action: AuditAction.UPDATE, count: 30 },
        { action: AuditAction.DELETE, count: 5 },
        { action: AuditAction.EXPORT, count: 10 },
      ];

      for (const { action, count } of actions) {
        for (let i = 0; i < count; i++) {
          await AuditLogger.log({
            userId: (i % 5) + 1,
            action,
            resource: AuditResource.CUSTOMER,
          });
        }
      }

      // 生成統計報告
      const stats = await AuditLogger.getStats();

      expect(stats.totalLogs).toBe(115);
      expect(stats.logsByAction[AuditAction.LOGIN]).toBe(50);
      expect(stats.logsByAction[AuditAction.CREATE]).toBe(20);
      expect(stats.successRate).toBe(1); // 全部成功
      expect(stats.topUsers.length).toBeGreaterThan(0);
      expect(stats.timeline.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 性能測試
  // ============================================================

  describe('性能測試', () => {
    it('應該高效處理大量日誌', async () => {
      const startTime = Date.now();

      // 記錄1000條日誌
      for (let i = 0; i < 1000; i++) {
        await AuditLogger.log({
          userId: (i % 10) + 1,
          action: AuditAction.READ,
          resource: AuditResource.CUSTOMER,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 應該在合理時間內完成（<5秒）
      expect(duration).toBeLessThan(5000);
    });

    it('應該高效查詢大量日誌', async () => {
      // 創建大量測試數據
      for (let i = 0; i < 1000; i++) {
        await AuditLogger.log({
          userId: (i % 10) + 1,
          action: AuditAction.READ,
          resource: AuditResource.CUSTOMER,
        });
      }

      const startTime = Date.now();

      // 執行複雜查詢
      const logs = await AuditLogger.query({
        userId: 5,
        action: AuditAction.READ,
        limit: 50,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(logs.length).toBeGreaterThan(0);
      // 查詢應該很快（<100ms）
      expect(duration).toBeLessThan(100);
    });
  });
});
