/**
 * 工作流程引擎測試套件
 *
 * 測試範圍：
 * - 狀態轉換驗證
 * - 權限檢查
 * - 自動化工作流程
 * - 審計追蹤
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

import { PrismaClient, ProposalStatus } from '@prisma/client';
import {
  WorkflowEngine,
  createWorkflowEngine,
  STATE_TRANSITIONS,
  TransitionType,
} from '@/lib/workflow/engine';

describe('WorkflowEngine', () => {
  let prisma: PrismaClient;
  let engine: WorkflowEngine;
  let testProposalId: number;
  let testUserId: number;
  let managerUserId: number;

  beforeAll(async () => {
    prisma = new PrismaClient();
    engine = createWorkflowEngine(prisma);

    // 創建測試用戶
    const testUser = await prisma.user.create({
      data: {
        email: 'test@workflow.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'SALES_REP',
      },
    });
    testUserId = testUser.id;

    const manager = await prisma.user.create({
      data: {
        email: 'manager@workflow.com',
        first_name: 'Manager',
        last_name: 'User',
        role: 'SALES_MANAGER',
      },
    });
    managerUserId = manager.id;

    // 創建測試客戶
    const customer = await prisma.customer.create({
      data: {
        company_name: 'Test Company',
        status: 'PROSPECT',
      },
    });

    // 創建測試提案
    const proposal = await prisma.proposal.create({
      data: {
        customer_id: customer.id,
        user_id: testUserId,
        title: 'Test Proposal',
        status: ProposalStatus.DRAFT,
      },
    });
    testProposalId = proposal.id;
  });

  afterAll(async () => {
    // 清理測試數據
    await prisma.approvalTask.deleteMany();
    await prisma.workflowStateHistory.deleteMany();
    await prisma.proposalWorkflow.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test@workflow.com', 'manager@workflow.com'] },
      },
    });
    await prisma.$disconnect();
  });

  describe('狀態轉換映射表', () => {
    it('應該定義所有提案狀態的轉換規則', () => {
      const allStates: ProposalStatus[] = [
        'DRAFT',
        'PENDING_APPROVAL',
        'UNDER_REVIEW',
        'REVISING',
        'APPROVED',
        'SENT',
        'VIEWED',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN',
        'EXPIRED',
      ];

      for (const state of allStates) {
        expect(STATE_TRANSITIONS[state]).toBeDefined();
        expect(Array.isArray(STATE_TRANSITIONS[state])).toBe(true);
      }
    });

    it('DRAFT 狀態應該可以轉換到 PENDING_APPROVAL 或 WITHDRAWN', () => {
      expect(STATE_TRANSITIONS.DRAFT).toContain('PENDING_APPROVAL');
      expect(STATE_TRANSITIONS.DRAFT).toContain('WITHDRAWN');
    });

    it('APPROVED 狀態應該可以轉換到 SENT 或 EXPIRED', () => {
      expect(STATE_TRANSITIONS.APPROVED).toContain('SENT');
      expect(STATE_TRANSITIONS.APPROVED).toContain('EXPIRED');
    });
  });

  describe('transitionState', () => {
    it('應該成功從 DRAFT 轉換到 PENDING_APPROVAL', async () => {
      const result = await engine.transitionState(
        testProposalId,
        'PENDING_APPROVAL',
        testUserId,
        {
          reason: 'Submitting for approval',
          comment: 'Ready for review',
        }
      );

      expect(result.success).toBe(true);
      expect(result.previousState).toBe('DRAFT');
      expect(result.currentState).toBe('PENDING_APPROVAL');
      expect(result.historyId).toBeDefined();
    });

    it('應該拒絕無效的狀態轉換', async () => {
      // 從 PENDING_APPROVAL 直接跳到 SENT 是無效的
      const result = await engine.transitionState(
        testProposalId,
        'SENT',
        testUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transition');
    });

    it('應該創建工作流程實例和狀態歷史記錄', async () => {
      const workflow = await prisma.proposalWorkflow.findFirst({
        where: { proposal_id: testProposalId },
        include: { state_history: true },
      });

      expect(workflow).toBeDefined();
      expect(workflow?.current_state).toBe('PENDING_APPROVAL');
      expect(workflow?.state_history.length).toBeGreaterThan(0);
    });

    it('管理員應該可以批准提案', async () => {
      const result = await engine.transitionState(
        testProposalId,
        'APPROVED',
        managerUserId,
        {
          reason: 'Approved by manager',
        }
      );

      expect(result.success).toBe(true);
      expect(result.currentState).toBe('APPROVED');
    });
  });

  describe('validateTransition', () => {
    beforeEach(async () => {
      // 重置提案狀態為 DRAFT
      await prisma.proposal.update({
        where: { id: testProposalId },
        data: { status: 'DRAFT' },
      });
    });

    it('應該驗證合法的狀態轉換', async () => {
      const isValid = await engine.validateTransition(
        'DRAFT',
        'PENDING_APPROVAL',
        testUserId,
        testProposalId
      );

      expect(isValid).toBe(true);
    });

    it('應該拒絕不在轉換映射表中的轉換', async () => {
      const isValid = await engine.validateTransition(
        'DRAFT',
        'SENT',
        testUserId,
        testProposalId
      );

      expect(isValid).toBe(false);
    });

    it('非管理員用戶不應該可以批准提案', async () => {
      const isValid = await engine.validateTransition(
        'PENDING_APPROVAL',
        'APPROVED',
        testUserId, // 普通用戶
        testProposalId
      );

      expect(isValid).toBe(false);
    });

    it('管理員應該可以批准提案', async () => {
      const isValid = await engine.validateTransition(
        'PENDING_APPROVAL',
        'APPROVED',
        managerUserId, // 管理員
        testProposalId
      );

      expect(isValid).toBe(true);
    });
  });

  describe('getAvailableTransitions', () => {
    beforeEach(async () => {
      await prisma.proposal.update({
        where: { id: testProposalId },
        data: { status: 'DRAFT' },
      });
    });

    it('應該返回 DRAFT 狀態的可用轉換', async () => {
      const transitions = await engine.getAvailableTransitions(
        testProposalId,
        testUserId
      );

      expect(transitions.length).toBeGreaterThan(0);
      expect(
        transitions.some((t) => t.targetState === 'PENDING_APPROVAL')
      ).toBe(true);
    });

    it('應該包含轉換類型信息', async () => {
      const transitions = await engine.getAvailableTransitions(
        testProposalId,
        testUserId
      );

      const submitTransition = transitions.find(
        (t) => t.targetState === 'PENDING_APPROVAL'
      );

      expect(submitTransition).toBeDefined();
      expect(submitTransition?.transitionType).toBe(TransitionType.SUBMIT);
      expect(submitTransition?.requiresApproval).toBe(false);
    });

    it('管理員應該看到更多可用轉換', async () => {
      await prisma.proposal.update({
        where: { id: testProposalId },
        data: { status: 'PENDING_APPROVAL' },
      });

      const userTransitions = await engine.getAvailableTransitions(
        testProposalId,
        testUserId
      );

      const managerTransitions = await engine.getAvailableTransitions(
        testProposalId,
        managerUserId
      );

      expect(managerTransitions.length).toBeGreaterThanOrEqual(
        userTransitions.length
      );

      const canApprove = managerTransitions.some(
        (t) => t.targetState === 'APPROVED'
      );
      expect(canApprove).toBe(true);
    });
  });

  describe('executeAutoTransitions', () => {
    it('應該自動過期超過30天的已發送提案', async () => {
      // 創建一個30天前發送的提案
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const oldProposal = await prisma.proposal.create({
        data: {
          customer_id: (await prisma.customer.findFirst())!.id,
          user_id: testUserId,
          title: 'Old Proposal',
          status: 'SENT',
          sent_at: oldDate,
        },
      });

      const count = await engine.executeAutoTransitions();

      expect(count).toBeGreaterThan(0);

      const updated = await prisma.proposal.findUnique({
        where: { id: oldProposal.id },
      });

      expect(updated?.status).toBe('EXPIRED');

      // 清理
      await prisma.proposal.delete({ where: { id: oldProposal.id } });
    });

    it('不應該過期最近發送的提案', async () => {
      const recentProposal = await prisma.proposal.create({
        data: {
          customer_id: (await prisma.customer.findFirst())!.id,
          user_id: testUserId,
          title: 'Recent Proposal',
          status: 'SENT',
          sent_at: new Date(),
        },
      });

      await engine.executeAutoTransitions();

      const updated = await prisma.proposal.findUnique({
        where: { id: recentProposal.id },
      });

      expect(updated?.status).toBe('SENT');

      // 清理
      await prisma.proposal.delete({ where: { id: recentProposal.id } });
    });
  });

  describe('審計追蹤', () => {
    it('每次狀態轉換都應該記錄歷史', async () => {
      const beforeCount = await prisma.workflowStateHistory.count({
        where: {
          workflow: {
            proposal_id: testProposalId,
          },
        },
      });

      await engine.transitionState(
        testProposalId,
        'DRAFT',
        testUserId,
        {
          reason: 'Reset to draft',
        }
      );

      await engine.transitionState(
        testProposalId,
        'PENDING_APPROVAL',
        testUserId,
        {
          reason: 'Submit again',
        }
      );

      const afterCount = await prisma.workflowStateHistory.count({
        where: {
          workflow: {
            proposal_id: testProposalId,
          },
        },
      });

      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('歷史記錄應該包含完整的轉換信息', async () => {
      const result = await engine.transitionState(
        testProposalId,
        'DRAFT',
        testUserId,
        {
          reason: 'Test reason',
          comment: 'Test comment',
          metadata: { test: 'data' },
        }
      );

      const history = await prisma.workflowStateHistory.findUnique({
        where: { id: result.historyId! },
      });

      expect(history).toBeDefined();
      expect(history?.reason).toBe('Test reason');
      expect(history?.comment).toBe('Test comment');
      expect(history?.metadata).toEqual({ test: 'data' });
      expect(history?.triggered_by).toBe(testUserId);
      expect(history?.auto_triggered).toBe(false);
    });
  });
});
