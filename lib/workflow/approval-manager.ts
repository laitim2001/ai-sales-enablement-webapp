/**
 * 審批管理系統
 *
 * 功能：
 * - 管理單個和多級審批任務
 * - 支援審批委派
 * - 追蹤審批時效和提醒
 * - 支援順序審批、並行審批、條件審批
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

import {
  PrismaClient,
  ApprovalTask,
  ApprovalStatus,
  ApprovalDecision,
  WorkflowType,
} from '@prisma/client';

/**
 * 審批配置
 */
export interface ApprovalConfig {
  workflowType: WorkflowType;
  approvers: ApproverConfig[];
  minApprovals?: number;
  autoApprove?: boolean;
  approvalTimeout?: number; // 審批超時時間（小時）
}

/**
 * 審批者配置
 */
export interface ApproverConfig {
  userId: number;
  role?: string;
  sequence?: number;
  isRequired?: boolean;
  dueHours?: number;
}

/**
 * 提交審批選項
 */
export interface SubmitApprovalOptions {
  decision: ApprovalDecision;
  comments?: string;
  notifyNext?: boolean;
}

/**
 * 審批任務詳情
 */
export interface ApprovalTaskDetail extends ApprovalTask {
  approverName?: string;
  delegateName?: string;
  isOverdue?: boolean;
}

/**
 * 審批進度
 */
export interface ApprovalProgress {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  approvedCount: number;
  rejectedCount: number;
  percentComplete: number;
  nextApprovers: string[];
  isComplete: boolean;
  finalDecision?: 'approved' | 'rejected' | 'pending';
}

/**
 * 審批管理器類
 */
export class ApprovalManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 創建審批工作流程
   *
   * @param proposalId - 提案ID
   * @param config - 審批配置
   * @returns 創建的審批任務列表
   */
  async createApprovalWorkflow(
    proposalId: number,
    config: ApprovalConfig
  ): Promise<ApprovalTask[]> {
    // 1. 獲取或創建工作流程實例
    let workflow = await this.prisma.proposalWorkflow.findFirst({
      where: { proposal_id: proposalId },
    });

    if (!workflow) {
      workflow = await this.prisma.proposalWorkflow.create({
        data: {
          proposal_id: proposalId,
          workflow_type: config.workflowType,
          current_state: 'PENDING_APPROVAL',
          approval_config: config as any,
          required_approvers: config.approvers
            .filter((a) => a.isRequired !== false)
            .map((a) => a.userId),
          optional_approvers: config.approvers
            .filter((a) => a.isRequired === false)
            .map((a) => a.userId),
          min_approvals: config.minApprovals || 1,
        },
      });
    }

    // 2. 創建審批任務
    const tasks: ApprovalTask[] = [];

    for (const approver of config.approvers) {
      const dueAt = approver.dueHours
        ? new Date(Date.now() + approver.dueHours * 60 * 60 * 1000)
        : config.approvalTimeout
        ? new Date(Date.now() + config.approvalTimeout * 60 * 60 * 1000)
        : undefined;

      const task = await this.prisma.approvalTask.create({
        data: {
          workflow_id: workflow.id,
          proposal_id: proposalId,
          approver_id: approver.userId,
          role: approver.role,
          sequence: approver.sequence || 1,
          is_required: approver.isRequired !== false,
          due_at: dueAt,
          status: ApprovalStatus.PENDING,
        },
      });

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * 提交審批決定
   *
   * @param taskId - 任務ID
   * @param userId - 審批者ID
   * @param options - 提交選項
   * @returns 更新後的任務
   */
  async submitApproval(
    taskId: string,
    userId: number,
    options: SubmitApprovalOptions
  ): Promise<ApprovalTask> {
    // 1. 驗證任務和用戶權限
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
      include: { workflow: true },
    });

    if (!task) {
      throw new Error(`Approval task ${taskId} not found`);
    }

    // 檢查是否是指定的審批者或被委派者
    if (task.approver_id !== userId && task.delegated_to !== userId) {
      throw new Error('Unauthorized: Not the assigned approver or delegate');
    }

    // 2. 更新任務狀態
    const updatedTask = await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: ApprovalStatus.COMPLETED,
        decision: options.decision,
        comments: options.comments,
        completed_at: new Date(),
      },
    });

    // 3. 檢查工作流程是否完成
    const isComplete = await this.checkApprovalCompletion(task.workflow_id);

    // 4. 如果工作流程完成，更新提案狀態
    if (isComplete) {
      await this.finalizeApprovalWorkflow(task.workflow_id);
    }

    // 5. 通知下一個審批者（如果是順序審批）
    if (options.notifyNext !== false) {
      await this.notifyNextApprover(task.workflow_id, task.sequence);
    }

    return updatedTask;
  }

  /**
   * 委派審批任務
   *
   * @param taskId - 任務ID
   * @param fromUserId - 原審批者ID
   * @param toUserId - 新審批者ID
   * @param reason - 委派原因
   * @returns 更新後的任務
   */
  async delegateApproval(
    taskId: string,
    fromUserId: number,
    toUserId: number,
    reason?: string
  ): Promise<ApprovalTask> {
    // 1. 驗證任務和權限
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Approval task ${taskId} not found`);
    }

    if (task.approver_id !== fromUserId) {
      throw new Error('Unauthorized: Not the assigned approver');
    }

    // 2. 更新委派信息
    const updatedTask = await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        delegated_to: toUserId,
        delegated_at: new Date(),
        delegation_reason: reason,
        status: ApprovalStatus.IN_PROGRESS,
      },
    });

    // 3. 發送委派通知
    await this.sendDelegationNotification(updatedTask, toUserId);

    return updatedTask;
  }

  /**
   * 取消委派
   *
   * @param taskId - 任務ID
   * @param userId - 原審批者ID
   * @returns 更新後的任務
   */
  async cancelDelegation(
    taskId: string,
    userId: number
  ): Promise<ApprovalTask> {
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.approver_id !== userId) {
      throw new Error('Unauthorized or task not found');
    }

    return this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        delegated_to: null,
        delegated_at: null,
        delegation_reason: null,
        status: ApprovalStatus.PENDING,
      },
    });
  }

  /**
   * 獲取用戶的待辦審批任務
   *
   * @param userId - 用戶ID
   * @param includeExpired - 是否包含過期任務
   * @returns 審批任務列表
   */
  async getUserPendingApprovals(
    userId: number,
    includeExpired: boolean = false
  ): Promise<ApprovalTaskDetail[]> {
    const where: any = {
      OR: [
        { approver_id: userId },
        { delegated_to: userId },
      ],
      status: {
        in: [ApprovalStatus.PENDING, ApprovalStatus.IN_PROGRESS],
      },
    };

    if (!includeExpired) {
      where.OR.push({
        due_at: {
          gte: new Date(),
        },
      });
    }

    const tasks = await this.prisma.approvalTask.findMany({
      where,
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            customer_id: true,
            total_value: true,
          },
        },
        approver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        delegate: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { due_at: 'asc' },
    });

    return tasks.map((task) => ({
      ...task,
      approverName: `${task.approver.first_name} ${task.approver.last_name}`,
      delegateName: task.delegate
        ? `${task.delegate.first_name} ${task.delegate.last_name}`
        : undefined,
      isOverdue: task.due_at ? task.due_at < new Date() : false,
    }));
  }

  /**
   * 獲取提案的審批進度
   *
   * @param proposalId - 提案ID
   * @returns 審批進度
   */
  async getApprovalProgress(proposalId: number): Promise<ApprovalProgress> {
    const workflow = await this.prisma.proposalWorkflow.findFirst({
      where: { proposal_id: proposalId },
      include: {
        approval_tasks: {
          include: {
            approver: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!workflow) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        approvedCount: 0,
        rejectedCount: 0,
        percentComplete: 0,
        nextApprovers: [],
        isComplete: false,
      };
    }

    const tasks = workflow.approval_tasks;
    const completedTasks = tasks.filter(
      (t) => t.status === ApprovalStatus.COMPLETED
    );
    const approvedCount = completedTasks.filter(
      (t) => t.decision === ApprovalDecision.APPROVED
    ).length;
    const rejectedCount = completedTasks.filter(
      (t) => t.decision === ApprovalDecision.REJECTED
    ).length;

    // 獲取下一個待審批者（按sequence排序）
    const pendingTasks = tasks
      .filter((t) => t.status === ApprovalStatus.PENDING)
      .sort((a, b) => a.sequence - b.sequence);

    const nextSequence = pendingTasks.length > 0 ? pendingTasks[0].sequence : 0;
    const nextApprovers = pendingTasks
      .filter((t) => t.sequence === nextSequence)
      .map((t) => `${t.approver.first_name} ${t.approver.last_name}`);

    const isComplete = completedTasks.length === tasks.length;
    let finalDecision: 'approved' | 'rejected' | 'pending' = 'pending';

    if (isComplete) {
      if (rejectedCount > 0) {
        finalDecision = 'rejected';
      } else if (approvedCount >= workflow.min_approvals) {
        finalDecision = 'approved';
      }
    }

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: tasks.length - completedTasks.length,
      approvedCount,
      rejectedCount,
      percentComplete: tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0,
      nextApprovers,
      isComplete,
      finalDecision,
    };
  }

  /**
   * 檢查審批工作流程是否完成
   *
   * @param workflowId - 工作流程ID
   * @returns 是否完成
   */
  async checkApprovalCompletion(workflowId: string): Promise<boolean> {
    const workflow = await this.prisma.proposalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        approval_tasks: true,
      },
    });

    if (!workflow) {
      return false;
    }

    const tasks = workflow.approval_tasks;
    const completedTasks = tasks.filter(
      (t) => t.status === ApprovalStatus.COMPLETED
    );

    // 檢查是否所有必須的審批都已完成
    const requiredTasks = tasks.filter((t) => t.is_required);
    const completedRequiredTasks = requiredTasks.filter(
      (t) => t.status === ApprovalStatus.COMPLETED
    );

    // 如果有任何拒絕，工作流程立即完成
    const hasRejection = completedTasks.some(
      (t) => t.decision === ApprovalDecision.REJECTED
    );

    if (hasRejection) {
      return true;
    }

    // 檢查是否達到最小審批數
    const approvedCount = completedTasks.filter(
      (t) => t.decision === ApprovalDecision.APPROVED
    ).length;

    return (
      completedRequiredTasks.length === requiredTasks.length &&
      approvedCount >= workflow.min_approvals
    );
  }

  /**
   * 完成審批工作流程並更新提案狀態
   *
   * @param workflowId - 工作流程ID
   */
  private async finalizeApprovalWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.prisma.proposalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        approval_tasks: true,
      },
    });

    if (!workflow) {
      return;
    }

    const completedTasks = workflow.approval_tasks.filter(
      (t) => t.status === ApprovalStatus.COMPLETED
    );

    const hasRejection = completedTasks.some(
      (t) => t.decision === ApprovalDecision.REJECTED
    );

    const approvedCount = completedTasks.filter(
      (t) => t.decision === ApprovalDecision.APPROVED
    ).length;

    // 確定最終決定
    const finalStatus = hasRejection
      ? 'REJECTED'
      : approvedCount >= workflow.min_approvals
      ? 'APPROVED'
      : 'PENDING_APPROVAL';

    // 更新提案狀態
    await this.prisma.proposal.update({
      where: { id: workflow.proposal_id },
      data: {
        status: finalStatus as any,
        approved_at: finalStatus === 'APPROVED' ? new Date() : null,
      },
    });

    // 更新工作流程完成狀態
    await this.prisma.proposalWorkflow.update({
      where: { id: workflowId },
      data: {
        completed_at: new Date(),
        is_active: false,
      },
    });
  }

  /**
   * 通知下一個審批者
   *
   * @param workflowId - 工作流程ID
   * @param currentSequence - 當前序列
   */
  private async notifyNextApprover(
    workflowId: string,
    currentSequence: number
  ): Promise<void> {
    // TODO: 實現通知邏輯
    // 1. 查找下一個序列的審批者
    // 2. 發送郵件通知
    // 3. 推送即時通知

    console.log(`Notifying next approver for workflow ${workflowId}, sequence ${currentSequence + 1}`);
  }

  /**
   * 發送委派通知
   *
   * @param task - 審批任務
   * @param toUserId - 新審批者ID
   */
  private async sendDelegationNotification(
    task: ApprovalTask,
    toUserId: number
  ): Promise<void> {
    // TODO: 實現通知邏輯
    console.log(`Delegation notification sent for task ${task.id} to user ${toUserId}`);
  }

  /**
   * 處理過期審批任務
   *
   * @returns 處理的任務數量
   */
  async handleExpiredApprovals(): Promise<number> {
    const expiredTasks = await this.prisma.approvalTask.findMany({
      where: {
        status: {
          in: [ApprovalStatus.PENDING, ApprovalStatus.IN_PROGRESS],
        },
        due_at: {
          lt: new Date(),
        },
      },
    });

    let count = 0;

    for (const task of expiredTasks) {
      await this.prisma.approvalTask.update({
        where: { id: task.id },
        data: {
          status: ApprovalStatus.EXPIRED,
        },
      });

      count++;
    }

    return count;
  }
}

/**
 * 工廠函數：創建審批管理器實例
 */
export function createApprovalManager(prisma: PrismaClient): ApprovalManager {
  return new ApprovalManager(prisma);
}
