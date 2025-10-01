/**
 * 工作流程引擎核心類
 *
 * 功能：
 * - 管理提案狀態轉換
 * - 驗證狀態轉換規則
 * - 執行狀態變更和審計記錄
 * - 處理自動化工作流程邏輯
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

import { PrismaClient, ProposalStatus, WorkflowType } from '@prisma/client';

/**
 * 狀態轉換映射表
 * 定義每個狀態可以轉換到哪些目標狀態
 */
export const STATE_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  // 草稿狀態：可提交審批或撤回
  DRAFT: ['PENDING_APPROVAL', 'WITHDRAWN'],

  // 待審批：可進入審核、直接批准/拒絕、要求修訂或退回草稿
  PENDING_APPROVAL: [
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'REVISING',
    'DRAFT',
  ],

  // 審核中：可批准、拒絕、要求修訂或退回待審批
  UNDER_REVIEW: [
    'APPROVED',
    'REJECTED',
    'REVISING',
    'PENDING_APPROVAL',
  ],

  // 修訂中：可提交審批或退回草稿
  REVISING: ['PENDING_APPROVAL', 'DRAFT'],

  // 已批准：可發送或過期
  APPROVED: ['SENT', 'EXPIRED'],

  // 已發送：可被查看、過期或撤回
  SENT: ['VIEWED', 'EXPIRED', 'WITHDRAWN'],

  // 已查看：可接受、拒絕或過期
  VIEWED: ['ACCEPTED', 'REJECTED', 'EXPIRED'],

  // 已接受：終態（可過期）
  ACCEPTED: ['EXPIRED'],

  // 已拒絕：終態（可重新激活到草稿）
  REJECTED: ['DRAFT'],

  // 已撤回：可重新激活到草稿
  WITHDRAWN: ['DRAFT'],

  // 已過期：可重新激活到草稿
  EXPIRED: ['DRAFT'],
};

/**
 * 轉換類型定義
 */
export enum TransitionType {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REVISE = 'revise',
  SEND = 'send',
  VIEW = 'view',
  ACCEPT = 'accept',
  WITHDRAW = 'withdraw',
  EXPIRE = 'expire',
  REACTIVATE = 'reactivate',
}

/**
 * 狀態轉換選項
 */
export interface TransitionOptions {
  reason?: string;
  comment?: string;
  metadata?: Record<string, any>;
  skipValidation?: boolean;
  autoTriggered?: boolean;
}

/**
 * 狀態轉換結果
 */
export interface TransitionResult {
  success: boolean;
  previousState: ProposalStatus;
  currentState: ProposalStatus;
  message?: string;
  error?: string;
  historyId?: string;
}

/**
 * 可用轉換資訊
 */
export interface AvailableTransition {
  targetState: ProposalStatus;
  transitionType: string;
  requiresApproval: boolean;
  requiresPermission: string[];
}

/**
 * 工作流程引擎類
 */
export class WorkflowEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 執行狀態轉換
   *
   * @param proposalId - 提案ID
   * @param targetState - 目標狀態
   * @param userId - 執行用戶ID
   * @param options - 轉換選項
   * @returns 轉換結果
   */
  async transitionState(
    proposalId: number,
    targetState: ProposalStatus,
    userId: number,
    options: TransitionOptions = {}
  ): Promise<TransitionResult> {
    try {
      // 1. 獲取提案和工作流程信息
      const proposal = await this.prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { workflow: true },
      });

      if (!proposal) {
        return {
          success: false,
          previousState: 'DRAFT' as ProposalStatus,
          currentState: 'DRAFT' as ProposalStatus,
          error: `Proposal ${proposalId} not found`,
        };
      }

      const currentState = proposal.status;

      // 2. 驗證轉換是否合法（除非跳過驗證）
      if (!options.skipValidation) {
        const isValid = await this.validateTransition(
          currentState,
          targetState,
          userId,
          proposalId
        );

        if (!isValid) {
          return {
            success: false,
            previousState: currentState,
            currentState: currentState,
            error: `Invalid transition from ${currentState} to ${targetState}`,
          };
        }
      }

      // 3. 開始事務執行狀態轉換
      const result = await this.prisma.$transaction(async (tx) => {
        // 3.1 更新提案狀態
        await tx.proposal.update({
          where: { id: proposalId },
          data: { status: targetState, updated_at: new Date() },
        });

        // 3.2 更新工作流程狀態
        let workflow = proposal.workflow;
        if (!workflow) {
          // 如果工作流程不存在，創建一個
          workflow = await tx.proposalWorkflow.create({
            data: {
              proposal_id: proposalId,
              current_state: targetState,
              workflow_type: WorkflowType.STANDARD,
            },
          });
        } else {
          // 更新現有工作流程
          await tx.proposalWorkflow.update({
            where: { id: workflow.id },
            data: {
              previous_state: currentState,
              current_state: targetState,
            },
          });
        }

        // 3.3 記錄狀態變更歷史
        const history = await tx.workflowStateHistory.create({
          data: {
            workflow_id: workflow.id,
            from_state: currentState,
            to_state: targetState,
            transition_type: this.getTransitionType(currentState, targetState),
            reason: options.reason,
            comment: options.comment,
            metadata: options.metadata || {},
            triggered_by: userId,
            auto_triggered: options.autoTriggered || false,
          },
        });

        return {
          success: true,
          previousState: currentState,
          currentState: targetState,
          message: `Successfully transitioned from ${currentState} to ${targetState}`,
          historyId: history.id,
        };
      });

      // 4. 觸發後續自動化操作（如發送通知等）
      await this.handlePostTransitionActions(proposalId, currentState, targetState, userId);

      return result;
    } catch (error) {
      return {
        success: false,
        previousState: 'DRAFT' as ProposalStatus,
        currentState: 'DRAFT' as ProposalStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 驗證狀態轉換是否合法
   *
   * @param currentState - 當前狀態
   * @param targetState - 目標狀態
   * @param userId - 用戶ID
   * @param proposalId - 提案ID
   * @returns 是否合法
   */
  async validateTransition(
    currentState: ProposalStatus,
    targetState: ProposalStatus,
    userId: number,
    proposalId?: number
  ): Promise<boolean> {
    // 1. 檢查狀態轉換映射表
    const allowedTransitions = STATE_TRANSITIONS[currentState];
    if (!allowedTransitions || !allowedTransitions.includes(targetState)) {
      return false;
    }

    // 2. 如果需要審批，檢查用戶權限
    if (proposalId) {
      const needsApproval = await this.requiresApproval(currentState, targetState);
      if (needsApproval) {
        const hasPermission = await this.checkApprovalPermission(proposalId, userId);
        if (!hasPermission) {
          return false;
        }
      }
    }

    // 3. 檢查業務規則（可擴展）
    const businessRulesValid = await this.validateBusinessRules(
      currentState,
      targetState,
      userId,
      proposalId
    );

    return businessRulesValid;
  }

  /**
   * 獲取可用的狀態轉換
   *
   * @param proposalId - 提案ID
   * @param userId - 用戶ID
   * @returns 可用轉換列表
   */
  async getAvailableTransitions(
    proposalId: number,
    userId: number
  ): Promise<AvailableTransition[]> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { workflow: true },
    });

    if (!proposal) {
      return [];
    }

    const currentState = proposal.status;
    const allowedStates = STATE_TRANSITIONS[currentState] || [];

    const transitions: AvailableTransition[] = [];

    for (const targetState of allowedStates) {
      const isValid = await this.validateTransition(
        currentState,
        targetState,
        userId,
        proposalId
      );

      if (isValid) {
        const requiresApproval = await this.requiresApproval(currentState, targetState);

        transitions.push({
          targetState,
          transitionType: this.getTransitionType(currentState, targetState),
          requiresApproval,
          requiresPermission: requiresApproval ? ['approve_proposal'] : [],
        });
      }
    }

    return transitions;
  }

  /**
   * 執行自動化狀態轉換（如過期處理）
   *
   * @returns 處理的提案數量
   */
  async executeAutoTransitions(): Promise<number> {
    let count = 0;

    // 1. 處理已發送但超過有效期的提案（自動過期）
    const sentProposals = await this.prisma.proposal.findMany({
      where: {
        status: 'SENT',
        sent_at: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
        },
      },
    });

    for (const proposal of sentProposals) {
      const result = await this.transitionState(
        proposal.id,
        'EXPIRED',
        0, // 系統用戶
        {
          reason: 'Auto-expired after 30 days',
          autoTriggered: true,
        }
      );

      if (result.success) {
        count++;
      }
    }

    // 2. 處理審批超時的提案（可根據業務需求配置）
    // TODO: 實現審批超時邏輯

    return count;
  }

  /**
   * 檢查狀態轉換是否需要審批
   *
   * @param currentState - 當前狀態
   * @param targetState - 目標狀態
   * @returns 是否需要審批
   */
  private async requiresApproval(
    currentState: ProposalStatus,
    targetState: ProposalStatus
  ): Promise<boolean> {
    // 以下轉換需要審批權限
    const approvalRequired = [
      ['PENDING_APPROVAL', 'APPROVED'],
      ['PENDING_APPROVAL', 'REJECTED'],
      ['UNDER_REVIEW', 'APPROVED'],
      ['UNDER_REVIEW', 'REJECTED'],
    ];

    return approvalRequired.some(
      ([from, to]) => from === currentState && to === targetState
    );
  }

  /**
   * 檢查用戶是否有審批權限
   *
   * @param proposalId - 提案ID
   * @param userId - 用戶ID
   * @returns 是否有權限
   */
  private async checkApprovalPermission(
    proposalId: number,
    userId: number
  ): Promise<boolean> {
    // 1. 檢查用戶角色
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // 管理員和銷售經理有審批權限
    if (user.role === 'ADMIN' || user.role === 'SALES_MANAGER') {
      return true;
    }

    // 2. 檢查是否在工作流程的審批者列表中
    const workflow = await this.prisma.proposalWorkflow.findFirst({
      where: { proposal_id: proposalId },
    });

    if (workflow) {
      const approvers = workflow.required_approvers || [];
      return approvers.includes(userId);
    }

    return false;
  }

  /**
   * 驗證業務規則
   *
   * @param currentState - 當前狀態
   * @param targetState - 目標狀態
   * @param userId - 用戶ID
   * @param proposalId - 提案ID（可選）
   * @returns 是否通過驗證
   */
  private async validateBusinessRules(
    currentState: ProposalStatus,
    targetState: ProposalStatus,
    userId: number,
    proposalId?: number
  ): Promise<boolean> {
    // 可根據業務需求添加額外的驗證規則
    // 例如：檢查提案內容完整性、審批者數量等

    // 默認通過
    return true;
  }

  /**
   * 獲取轉換類型
   *
   * @param fromState - 起始狀態
   * @param toState - 目標狀態
   * @returns 轉換類型
   */
  private getTransitionType(
    fromState: ProposalStatus,
    toState: ProposalStatus
  ): string {
    // 根據狀態變化推斷轉換類型
    if (toState === 'PENDING_APPROVAL' || toState === 'UNDER_REVIEW') {
      return TransitionType.SUBMIT;
    }
    if (toState === 'APPROVED') {
      return TransitionType.APPROVE;
    }
    if (toState === 'REJECTED') {
      return TransitionType.REJECT;
    }
    if (toState === 'REVISING') {
      return TransitionType.REVISE;
    }
    if (toState === 'SENT') {
      return TransitionType.SEND;
    }
    if (toState === 'VIEWED') {
      return TransitionType.VIEW;
    }
    if (toState === 'ACCEPTED') {
      return TransitionType.ACCEPT;
    }
    if (toState === 'WITHDRAWN') {
      return TransitionType.WITHDRAW;
    }
    if (toState === 'EXPIRED') {
      return TransitionType.EXPIRE;
    }
    if (fromState === 'EXPIRED' || fromState === 'REJECTED' || fromState === 'WITHDRAWN') {
      return TransitionType.REACTIVATE;
    }

    return 'unknown';
  }

  /**
   * 處理轉換後的自動化操作
   *
   * @param proposalId - 提案ID
   * @param fromState - 起始狀態
   * @param toState - 目標狀態
   * @param userId - 用戶ID
   */
  private async handlePostTransitionActions(
    proposalId: number,
    fromState: ProposalStatus,
    toState: ProposalStatus,
    userId: number
  ): Promise<void> {
    // TODO: 實現後續自動化操作
    // 1. 發送通知給相關用戶
    // 2. 創建審批任務
    // 3. 觸發webhook
    // 4. 更新統計數據等
  }
}

/**
 * 工廠函數：創建工作流程引擎實例
 */
export function createWorkflowEngine(prisma: PrismaClient): WorkflowEngine {
  return new WorkflowEngine(prisma);
}
