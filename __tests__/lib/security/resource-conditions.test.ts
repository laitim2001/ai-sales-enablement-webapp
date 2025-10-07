/**
 * 資源級別權限條件服務測試
 *
 * 測試資源訪問條件驗證服務的所有功能
 */

import {
  ResourceConditionService,
  ResourceConditionType,
  type ResourceAccessCondition,
  type ConditionCheckResult,
} from '../../../lib/security/resource-conditions';
import { UserRole, Resource, Action } from '../../../lib/security/rbac';

describe('ResourceConditionService', () => {
  // ========================================
  // 1. PROPOSALS 資源條件測試
  // ========================================
  describe('PROPOSALS resource conditions', () => {
    test('SALES_REP can update DRAFT proposal', async () => {
      const proposalData = { status: 'DRAFT', userId: 5 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        5
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP can update PENDING_REVIEW proposal', async () => {
      const proposalData = { status: 'PENDING_REVIEW', userId: 5 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        5
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP cannot update APPROVED proposal', async () => {
      const proposalData = { status: 'APPROVED', userId: 5 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('草稿或待審核');
    });

    test('SALES_REP cannot delete APPROVED proposal', async () => {
      const proposalData = { status: 'APPROVED', userId: 5 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.DELETE,
        proposalData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('不能刪除已批准的提案');
    });

    test('SALES_REP can delete DRAFT proposal', async () => {
      const proposalData = { status: 'DRAFT', userId: 5 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.DELETE,
        proposalData,
        5
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_MANAGER can approve PENDING_REVIEW proposal', async () => {
      const proposalData = { status: 'PENDING_REVIEW', userId: 3 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_MANAGER,
        Resource.PROPOSALS,
        Action.APPROVE,
        proposalData,
        10
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_MANAGER cannot approve DRAFT proposal', async () => {
      const proposalData = { status: 'DRAFT', userId: 3 };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_MANAGER,
        Resource.PROPOSALS,
        Action.APPROVE,
        proposalData,
        10
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('待審核狀態');
    });
  });

  // ========================================
  // 2. CUSTOMERS 資源條件測試
  // ========================================
  describe('CUSTOMERS resource conditions', () => {
    test('SALES_REP can update own customer', async () => {
      const customerData = { assignedUserId: 5, name: 'Test Customer' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customerData,
        5
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP cannot update other user customer', async () => {
      const customerData = { assignedUserId: 10, name: 'Test Customer' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customerData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('分配給自己的客戶');
    });

    test('SALES_REP can delete own customer', async () => {
      const customerData = { assignedUserId: 5, name: 'Test Customer' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        customerData,
        5
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP cannot delete other user customer', async () => {
      const customerData = { assignedUserId: 10, name: 'Test Customer' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.DELETE,
        customerData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('分配給自己的客戶');
    });

    test('ADMIN has no conditions for CUSTOMERS', async () => {
      const customerData = { assignedUserId: 10, name: 'Test Customer' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customerData,
        1
      );

      // ADMIN沒有額外條件限制
      expect(result.allowed).toBe(true);
    });
  });

  // ========================================
  // 3. SALES_OPPORTUNITIES 資源條件測試
  // ========================================
  describe('SALES_OPPORTUNITIES resource conditions', () => {
    test('SALES_REP can update own opportunity', async () => {
      const opportunityData = { ownerId: 5, stage: 'PROSPECTING' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        5
      );

      expect(result.allowed).toBe(true);
    });

    test('SALES_REP cannot update other user opportunity', async () => {
      const opportunityData = { ownerId: 10, stage: 'PROSPECTING' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('分配給自己的銷售機會');
    });

    test('SALES_REP cannot update WON opportunity', async () => {
      const opportunityData = { ownerId: 5, stage: 'WON' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已完成的銷售機會');
    });

    test('SALES_REP cannot update LOST opportunity', async () => {
      const opportunityData = { ownerId: 5, stage: 'LOST' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已完成的銷售機會');
    });

    test('SALES_REP can update NEGOTIATION opportunity', async () => {
      const opportunityData = { ownerId: 5, stage: 'NEGOTIATION' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        5
      );

      expect(result.allowed).toBe(true);
    });
  });

  // ========================================
  // 4. KNOWLEDGE_BASE 資源條件測試
  // ========================================
  describe('KNOWLEDGE_BASE resource conditions', () => {
    test('MARKETING can publish REVIEWED knowledge base content', async () => {
      const kbData = { reviewStatus: 'REVIEWED', title: 'Test KB' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.MARKETING,
        Resource.KNOWLEDGE_BASE,
        Action.PUBLISH,
        kbData,
        8
      );

      expect(result.allowed).toBe(true);
    });

    test('MARKETING cannot publish DRAFT knowledge base content', async () => {
      const kbData = { reviewStatus: 'DRAFT', title: 'Test KB' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.MARKETING,
        Resource.KNOWLEDGE_BASE,
        Action.PUBLISH,
        kbData,
        8
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已審核的內容');
    });

    test('SALES_REP cannot delete PUBLISHED knowledge base content', async () => {
      const kbData = { status: 'PUBLISHED', title: 'Test KB' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.KNOWLEDGE_BASE,
        Action.DELETE,
        kbData,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已發布的知識庫內容');
    });

    test('SALES_REP can delete DRAFT knowledge base content', async () => {
      const kbData = { status: 'DRAFT', title: 'Test KB' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.KNOWLEDGE_BASE,
        Action.DELETE,
        kbData,
        5
      );

      expect(result.allowed).toBe(true);
    });
  });

  // ========================================
  // 5. TEMPLATES 資源條件測試
  // ========================================
  describe('TEMPLATES resource conditions', () => {
    test('MARKETING can publish own template', async () => {
      const templateData = { createdBy: 8, title: 'Sales Template' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.MARKETING,
        Resource.TEMPLATES,
        Action.PUBLISH,
        templateData,
        8
      );

      expect(result.allowed).toBe(true);
    });

    test('MARKETING cannot publish other user template', async () => {
      const templateData = { createdBy: 5, title: 'Sales Template' };
      const result = await ResourceConditionService.checkConditions(
        UserRole.MARKETING,
        Resource.TEMPLATES,
        Action.PUBLISH,
        templateData,
        8
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('自己創建的模板');
    });
  });

  // ========================================
  // 6. 條件操作符測試
  // ========================================
  describe('Condition operator tests', () => {
    test('equals operator works correctly', async () => {
      const data1 = { status: 'DRAFT' };
      const data2 = { status: 'APPROVED' };

      const result1 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        data1,
        5
      );
      const result2 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        data2,
        5
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
    });

    test('notEquals operator works correctly', async () => {
      const data1 = { status: 'DRAFT' };
      const data2 = { status: 'APPROVED' };

      const result1 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.DELETE,
        data1,
        5
      );
      const result2 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.DELETE,
        data2,
        5
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
    });

    test('in operator works correctly', async () => {
      const data1 = { status: 'DRAFT' };
      const data2 = { status: 'PENDING_REVIEW' };
      const data3 = { status: 'APPROVED' };

      const result1 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        data1,
        5
      );
      const result2 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        data2,
        5
      );
      const result3 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        data3,
        5
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(false);
    });

    test('notIn operator works correctly', async () => {
      const data1 = { ownerId: 5, stage: 'PROSPECTING' };
      const data2 = { ownerId: 5, stage: 'WON' };
      const data3 = { ownerId: 5, stage: 'LOST' };

      const result1 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        data1,
        5
      );
      const result2 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        data2,
        5
      );
      const result3 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        data3,
        5
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
      expect(result3.allowed).toBe(false);
    });
  });

  // ========================================
  // 7. 動態值替換測試
  // ========================================
  describe('Dynamic value replacement', () => {
    test('{{userId}} is replaced correctly', async () => {
      const customerData = { assignedUserId: 5, name: 'Test Customer' };
      const result1 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customerData,
        5
      );
      const result2 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customerData,
        10
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
    });

    test('Multiple dynamic value replacements work correctly', async () => {
      const opportunityData = { ownerId: 8, stage: 'NEGOTIATION' };
      const result1 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        8
      );
      const result2 = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunityData,
        12
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
    });
  });

  // ========================================
  // 8. 邊界情況和錯誤處理測試
  // ========================================
  describe('Edge cases and error handling', () => {
    test('handles null resourceData gracefully', async () => {
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        null as any,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('資源數據無效');
    });

    test('handles undefined resourceData gracefully', async () => {
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        undefined as any,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('資源數據無效');
    });

    test('handles non-object resourceData gracefully', async () => {
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        'invalid data' as any,
        5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('資源數據無效');
    });

    test('allows access when no conditions are configured', async () => {
      // VIEWER role has no conditions configured for any resource
      const result = await ResourceConditionService.checkConditions(
        UserRole.VIEWER,
        Resource.PROPOSALS,
        Action.UPDATE,
        { status: 'DRAFT' },
        9
      );

      expect(result.allowed).toBe(true);
    });

    test('handles missing field in resourceData', async () => {
      const proposalData = {}; // Missing 'status' field
      const result = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        5
      );

      // undefined !== 'DRAFT' and not in ['DRAFT', 'PENDING_REVIEW']
      expect(result.allowed).toBe(false);
    });
  });

  // ========================================
  // 9. 輔助方法測試
  // ========================================
  describe('Helper methods', () => {
    test('getConditions returns matching conditions', () => {
      const conditions = ResourceConditionService.getConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE
      );

      expect(conditions.length).toBeGreaterThan(0);
      expect(conditions[0].resource).toBe(Resource.PROPOSALS);
      expect(conditions[0].role).toBe(UserRole.SALES_REP);
      expect(conditions[0].action).toBe(Action.UPDATE);
    });

    test('getConditions returns empty array when no conditions exist', () => {
      const conditions = ResourceConditionService.getConditions(
        UserRole.VIEWER,
        Resource.PROPOSALS,
        Action.UPDATE
      );

      expect(conditions).toEqual([]);
    });

    test('hasConditions returns true when conditions exist', () => {
      const hasConditions = ResourceConditionService.hasConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE
      );

      expect(hasConditions).toBe(true);
    });

    test('hasConditions returns false when no conditions exist', () => {
      const hasConditions = ResourceConditionService.hasConditions(
        UserRole.VIEWER,
        Resource.PROPOSALS,
        Action.UPDATE
      );

      expect(hasConditions).toBe(false);
    });

    test('getAllConditions returns all conditions', () => {
      const allConditions = ResourceConditionService.getAllConditions();

      expect(allConditions.length).toBeGreaterThan(0);
      expect(Array.isArray(allConditions)).toBe(true);
    });

    test('getResourceConditions returns all conditions for a resource', () => {
      const proposalConditions =
        ResourceConditionService.getResourceConditions(Resource.PROPOSALS);

      expect(proposalConditions.length).toBeGreaterThan(0);
      expect(proposalConditions.every((c) => c.resource === Resource.PROPOSALS)).toBe(
        true
      );
    });

    test('getRoleConditions returns all conditions for a role', () => {
      const salesRepConditions = ResourceConditionService.getRoleConditions(
        UserRole.SALES_REP
      );

      expect(salesRepConditions.length).toBeGreaterThan(0);
      expect(salesRepConditions.every((c) => c.role === UserRole.SALES_REP)).toBe(
        true
      );
    });
  });

  // ========================================
  // 10. 複雜場景集成測試
  // ========================================
  describe('Complex integration scenarios', () => {
    test('SALES_REP workflow: create draft → update → submit → cannot update', async () => {
      const userId = 5;
      const proposalData = { status: 'DRAFT', userId };

      // Step 1: Can update DRAFT
      const updateDraft = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        userId
      );
      expect(updateDraft.allowed).toBe(true);

      // Step 2: Submit for review
      proposalData.status = 'PENDING_REVIEW';
      const updatePending = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        userId
      );
      expect(updatePending.allowed).toBe(true);

      // Step 3: After approval, cannot update
      proposalData.status = 'APPROVED';
      const updateApproved = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        Action.UPDATE,
        proposalData,
        userId
      );
      expect(updateApproved.allowed).toBe(false);
    });

    test('SALES_MANAGER approval workflow', async () => {
      const managerId = 10;

      // Cannot approve DRAFT
      const draftProposal = { status: 'DRAFT' };
      const approveDraft = await ResourceConditionService.checkConditions(
        UserRole.SALES_MANAGER,
        Resource.PROPOSALS,
        Action.APPROVE,
        draftProposal,
        managerId
      );
      expect(approveDraft.allowed).toBe(false);

      // Can approve PENDING_REVIEW
      const pendingProposal = { status: 'PENDING_REVIEW' };
      const approvePending = await ResourceConditionService.checkConditions(
        UserRole.SALES_MANAGER,
        Resource.PROPOSALS,
        Action.APPROVE,
        pendingProposal,
        managerId
      );
      expect(approvePending.allowed).toBe(true);
    });

    test('Customer assignment and access control', async () => {
      const salesRep1 = 5;
      const salesRep2 = 6;
      const customer = { assignedUserId: salesRep1, name: 'Customer A' };

      // SalesRep1 can update
      const rep1Update = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customer,
        salesRep1
      );
      expect(rep1Update.allowed).toBe(true);

      // SalesRep2 cannot update
      const rep2Update = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        Action.UPDATE,
        customer,
        salesRep2
      );
      expect(rep2Update.allowed).toBe(false);
    });

    test('Sales opportunity lifecycle management', async () => {
      const salesRepId = 5;
      const opportunity = { ownerId: salesRepId, stage: 'PROSPECTING' };

      // Can update during PROSPECTING
      const updateProspecting = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunity,
        salesRepId
      );
      expect(updateProspecting.allowed).toBe(true);

      // Move to NEGOTIATION - still can update
      opportunity.stage = 'NEGOTIATION';
      const updateNegotiation = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunity,
        salesRepId
      );
      expect(updateNegotiation.allowed).toBe(true);

      // After WON - cannot update
      opportunity.stage = 'WON';
      const updateWon = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunity,
        salesRepId
      );
      expect(updateWon.allowed).toBe(false);

      // After LOST - cannot update
      opportunity.stage = 'LOST';
      const updateLost = await ResourceConditionService.checkConditions(
        UserRole.SALES_REP,
        Resource.SALES_OPPORTUNITIES,
        Action.UPDATE,
        opportunity,
        salesRepId
      );
      expect(updateLost.allowed).toBe(false);
    });
  });
});
