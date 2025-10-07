/**
 * 操作級別權限限制服務測試
 *
 * @module __tests__/lib/security/action-restrictions.test
 */

import {
  ActionRestrictionService,
  ActionRestrictionType,
} from '@/lib/security/action-restrictions';
import { UserRole, Resource, Action } from '@/lib/security/rbac';

describe('ActionRestrictionService', () => {
  // 每個測試前清除計數器
  beforeEach(() => {
    ActionRestrictionService.clearCounters();
  });

  // ========================================
  // 速率限制測試
  // ========================================

  describe('Rate Limit Tests', () => {
    test('SALES_REP can create customer within rate limit', async () => {
      // SALES_REP每小時最多創建20個客戶
      for (let i = 0; i < 20; i++) {
        const result = await ActionRestrictionService.checkRestrictions(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          Action.CREATE,
          5
        );
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(19 - i);
      }
    });

    test('SALES_REP exceeds customer creation rate limit', async () => {
      // 先創建20個客戶（達到限制）
      for (let i = 0; i < 20; i++) {
        await ActionRestrictionService.checkRestrictions(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          Action.CREATE,
          5
        );
      }

      // 第21個應該被拒絕
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已超過速率限制');
      expect(result.remaining).toBe(0);
    });

    test('SALES_REP proposal creation rate limit works correctly', async () => {
      // SALES_REP每小時最多創建10個提案
      for (let i = 0; i < 10; i++) {
        const result = await ActionRestrictionService.checkRestrictions(
          UserRole.SALES_REP,
          Resource.PROPOSALS,
          Action.CREATE,
          5
        );
        expect(result.allowed).toBe(true);
      }

      // 第11個應該被拒絕
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.CREATE,
        5
      );
      expect(result.allowed).toBe(false);
    });

    test('Different users have separate rate limit counters', async () => {
      // 用戶5創建20個客戶
      for (let i = 0; i < 20; i++) {
        await ActionRestrictionService.checkRestrictions(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          Action.CREATE,
          5
        );
      }

      // 用戶6應該還能創建
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        6
      );
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(19);
    });

    test('Rate limit status can be queried', async () => {
      // 創建5個客戶
      for (let i = 0; i < 5; i++) {
        await ActionRestrictionService.checkRestrictions(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          Action.CREATE,
          5
        );
      }

      const status = ActionRestrictionService.getCounterStatus(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5,
        'rate'
      );

      expect(status).not.toBeNull();
      expect(status!.count).toBe(5);
      expect(status!.limit).toBe(20);
      expect(status!.remaining).toBe(15);
    });
  });

  // ========================================
  // 配額限制測試
  // ========================================

  describe('Quota Limit Tests', () => {
    test('MARKETING can create knowledge base articles within quota', async () => {
      // MARKETING每月最多創建50篇知識庫文章
      for (let i = 0; i < 50; i++) {
        const result = await ActionRestrictionService.checkRestrictions(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.CREATE,
          10
        );
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(49 - i);
      }
    });

    test('MARKETING exceeds knowledge base creation quota', async () => {
      // 創建50篇文章（達到配額）
      for (let i = 0; i < 50; i++) {
        await ActionRestrictionService.checkRestrictions(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.CREATE,
          10
        );
      }

      // 第51篇應該被拒絕
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.MARKETING,
        Resource.KNOWLEDGE_BASE,
        Action.CREATE,
        10
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已超過配額限制');
      expect(result.remaining).toBe(0);
    });

    test('Quota status can be queried', async () => {
      // 創建10篇文章
      for (let i = 0; i < 10; i++) {
        await ActionRestrictionService.checkRestrictions(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.CREATE,
          10
        );
      }

      const status = ActionRestrictionService.getCounterStatus(
        UserRole.MARKETING,
        Resource.KNOWLEDGE_BASE,
        Action.CREATE,
        10,
        'quota'
      );

      expect(status).not.toBeNull();
      expect(status!.count).toBe(10);
      expect(status!.limit).toBe(50);
      expect(status!.remaining).toBe(40);
    });
  });

  // ========================================
  // 欄位限制測試
  // ========================================

  describe('Field Restriction Tests', () => {
    test('SALES_REP can update allowed proposal fields', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        content: 'Updated content',
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        5,
        undefined,
        updateData
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP cannot update restricted proposal fields', async () => {
      const updateData = {
        title: 'Updated Title',
        approvalNotes: 'Trying to update approval notes', // 禁止欄位
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        5,
        undefined,
        updateData
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('無權修改');
      expect(result.reason).toContain('approvalNotes');
    });

    test('SALES_REP cannot update cost and margin fields', async () => {
      const updateData = {
        cost: 10000,
        margin: 0.2,
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        5,
        undefined,
        updateData
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('無權修改');
    });

    test('MARKETING can update allowed template fields', async () => {
      const updateData = {
        name: 'Updated Template',
        description: 'Updated description',
        content: 'Updated content',
        category: 'sales',
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.MARKETING,
        Resource.TEMPLATES,
        Action.UPDATE,
        10,
        undefined,
        updateData
      );

      expect(result.allowed).toBe(true);
    });

    test('Field restriction with empty update data is allowed', async () => {
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        5,
        undefined,
        {}
      );

      expect(result.allowed).toBe(true);
    });
  });

  // ========================================
  // 條件限制測試
  // ========================================

  describe('Condition Restriction Tests', () => {
    test('SALES_REP can delete customer with no related business', async () => {
      const customerData = {
        id: 1,
        name: 'Test Customer',
        proposals: [],
        opportunities: [],
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        customerData
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP cannot delete customer with proposals', async () => {
      const customerData = {
        id: 1,
        name: 'Test Customer',
        proposals: [{ id: 1 }, { id: 2 }],
        opportunities: [],
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        customerData
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('proposals');
      expect(result.reason).toContain('必須為空');
    });

    test('SALES_REP cannot delete customer with opportunities', async () => {
      const customerData = {
        id: 1,
        name: 'Test Customer',
        proposals: [],
        opportunities: [{ id: 1 }],
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        customerData
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('opportunities');
    });

    test('Null and empty string are considered empty', async () => {
      const customerData = {
        id: 1,
        name: 'Test Customer',
        proposals: null,
        opportunities: '',
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        customerData
      );

      expect(result.allowed).toBe(true);
    });
  });

  // ========================================
  // 無限制場景測試
  // ========================================

  describe('No Restriction Tests', () => {
    test('ADMIN has no restrictions on customer creation', async () => {
      // ADMIN沒有速率限制，應該可以創建任意數量
      for (let i = 0; i < 100; i++) {
        const result = await ActionRestrictionService.checkRestrictions(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          Action.CREATE,
          1
        );
        expect(result.allowed).toBe(true);
      }
    });

    test('SALES_MANAGER has no restrictions on proposal updates', async () => {
      const updateData = {
        approvalNotes: 'Manager approval notes',
        cost: 10000,
        margin: 0.3,
      };

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_MANAGER,
        Resource.PROPOSALS,
        Action.UPDATE,
        2,
        undefined,
        updateData
      );

      expect(result.allowed).toBe(true);
    });

    test('VIEWER has no restrictions when no config exists', async () => {
      // VIEWER沒有任何操作限制配置
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.VIEWER,
        Resource.CUSTOMERS,
        Action.READ,
        15
      );

      expect(result.allowed).toBe(true);
    });
  });

  // ========================================
  // 輔助方法測試
  // ========================================

  describe('Helper Methods Tests', () => {
    test('getRestrictions returns matching restrictions', () => {
      const restrictions = ActionRestrictionService.getRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE
      );

      expect(restrictions.length).toBeGreaterThan(0);
      expect(restrictions[0].role).toBe(UserRole.SALES_REP);
      expect(restrictions[0].resource).toBe(Resource.CUSTOMERS);
      expect(restrictions[0].action).toBe(Action.CREATE);
    });

    test('hasRestrictions returns true for configured restrictions', () => {
      const hasRestrictions = ActionRestrictionService.hasRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE
      );

      expect(hasRestrictions).toBe(true);
    });

    test('hasRestrictions returns false for non-configured restrictions', () => {
      const hasRestrictions = ActionRestrictionService.hasRestrictions(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        Action.CREATE
      );

      expect(hasRestrictions).toBe(false);
    });

    test('getAllRestrictions returns all configurations', () => {
      const allRestrictions = ActionRestrictionService.getAllRestrictions();

      expect(allRestrictions.length).toBeGreaterThan(0);
      expect(Array.isArray(allRestrictions)).toBe(true);
    });

    test('getResourceRestrictions returns all restrictions for a resource', () => {
      const resourceRestrictions = ActionRestrictionService.getResourceRestrictions(
        Resource.CUSTOMERS
      );

      expect(resourceRestrictions.length).toBeGreaterThan(0);
      resourceRestrictions.forEach((restriction) => {
        expect(restriction.resource).toBe(Resource.CUSTOMERS);
      });
    });

    test('getRoleRestrictions returns all restrictions for a role', () => {
      const roleRestrictions = ActionRestrictionService.getRoleRestrictions(
        UserRole.SALES_REP
      );

      expect(roleRestrictions.length).toBeGreaterThan(0);
      roleRestrictions.forEach((restriction) => {
        expect(restriction.role).toBe(UserRole.SALES_REP);
      });
    });

    test('clearCounters resets all operation counters', async () => {
      // 創建一些操作
      await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5
      );

      let status = ActionRestrictionService.getCounterStatus(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5,
        'rate'
      );
      expect(status).not.toBeNull();
      expect(status!.count).toBe(1);

      // 清除計數器
      ActionRestrictionService.clearCounters();

      status = ActionRestrictionService.getCounterStatus(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5,
        'rate'
      );
      expect(status).toBeNull();
    });
  });

  // ========================================
  // 邊界條件和錯誤處理測試
  // ========================================

  describe('Edge Cases and Error Handling', () => {
    test('checkRestrictions with null resourceData for condition check fails', async () => {
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        null // null resourceData
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('資源數據無效');
    });

    test('checkRestrictions with undefined updateData for field check passes', async () => {
      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        5,
        undefined,
        undefined // undefined updateData
      );

      // 沒有更新數據時，欄位限制應該通過
      expect(result.allowed).toBe(true);
    });

    test('Multiple restriction types can be applied together', async () => {
      // 這個測試確保即使有多個限制類型，也能正確檢查
      // SALES_REP創建提案既有速率限制，也可能有其他限制
      for (let i = 0; i < 10; i++) {
        const result = await ActionRestrictionService.checkRestrictions(
          UserRole.SALES_REP,
          Resource.PROPOSALS,
          Action.CREATE,
          5
        );
        expect(result.allowed).toBe(true);
      }

      const result = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.CREATE,
        5
      );
      expect(result.allowed).toBe(false);
    });

    test('getCounterStatus returns null for non-existent counter', () => {
      const status = ActionRestrictionService.getCounterStatus(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        Action.CREATE,
        999,
        'rate'
      );

      expect(status).toBeNull();
    });

    test('getCounterStatus returns null when no restrictions configured', () => {
      // 先創建一個操作
      ActionRestrictionService.checkRestrictions(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        Action.CREATE,
        1
      );

      // ADMIN對CUSTOMERS CREATE沒有限制配置
      const status = ActionRestrictionService.getCounterStatus(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        Action.CREATE,
        1,
        'rate'
      );

      expect(status).toBeNull();
    });
  });

  // ========================================
  // 複雜整合場景測試
  // ========================================

  describe('Complex Integration Scenarios', () => {
    test('Sales rep workflow: create customer, create proposal, update proposal', async () => {
      // 1. 創建客戶 (速率限制檢查)
      const createCustomerResult = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5
      );
      expect(createCustomerResult.allowed).toBe(true);

      // 2. 創建提案 (速率限制檢查)
      const createProposalResult = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.CREATE,
        5
      );
      expect(createProposalResult.allowed).toBe(true);

      // 3. 更新提案 (欄位限制檢查)
      const updateData = {
        title: 'Updated Proposal',
        description: 'Updated description',
      };
      const updateProposalResult = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        5,
        undefined,
        updateData
      );
      expect(updateProposalResult.allowed).toBe(true);
    });

    test('Marketing workflow: create multiple knowledge base articles', async () => {
      // MARKETING創建多篇知識庫文章，測試配額限制
      for (let i = 0; i < 30; i++) {
        const result = await ActionRestrictionService.checkRestrictions(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.CREATE,
          10
        );
        expect(result.allowed).toBe(true);
      }

      // 驗證剩餘配額
      const status = ActionRestrictionService.getCounterStatus(
        UserRole.MARKETING,
        Resource.KNOWLEDGE_BASE,
        Action.CREATE,
        10,
        'quota'
      );
      expect(status!.remaining).toBe(20);
    });

    test('Customer lifecycle: create, update, attempt delete with business', async () => {
      // 1. 創建客戶
      const createResult = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.CREATE,
        5
      );
      expect(createResult.allowed).toBe(true);

      // 2. 嘗試刪除有業務的客戶 (應該失敗)
      const customerWithBusiness = {
        id: 1,
        proposals: [{ id: 1 }],
        opportunities: [],
      };
      const deleteWithBusinessResult = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        customerWithBusiness
      );
      expect(deleteWithBusinessResult.allowed).toBe(false);

      // 3. 刪除沒有業務的客戶 (應該成功)
      const customerWithoutBusiness = {
        id: 1,
        proposals: [],
        opportunities: [],
      };
      const deleteWithoutBusinessResult = await ActionRestrictionService.checkRestrictions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        5,
        customerWithoutBusiness
      );
      expect(deleteWithoutBusinessResult.allowed).toBe(true);
    });
  });
});
