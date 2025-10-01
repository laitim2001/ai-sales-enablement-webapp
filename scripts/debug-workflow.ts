/**
 * 調試工作流程引擎
 * 單獨測試狀態轉換功能
 */

import { PrismaClient, ProposalStatus } from '@prisma/client';
import { createWorkflowEngine } from '../lib/workflow/engine';

async function main() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  const engine = createWorkflowEngine(prisma);

  try {
    // 查找測試提案
    const proposal = await prisma.proposal.findFirst({
      where: {
        title: 'Test Proposal',
      },
      include: {
        workflow: true,
        user: true,
        customer: true,
      },
    });

    if (!proposal) {
      console.error('❌ 測試提案不存在');
      return;
    }

    console.log('📋 找到測試提案:');
    console.log(JSON.stringify(proposal, null, 2));

    // 嘗試狀態轉換
    console.log('\n🔄 嘗試從 DRAFT 轉換到 PENDING_APPROVAL...');
    const result = await engine.transitionState(
      proposal.id,
      ProposalStatus.PENDING_APPROVAL,
      proposal.user_id,
      {
        reason: 'Debug test transition',
        comment: 'Testing workflow engine',
      }
    );

    console.log('\n✅ 轉換結果:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      // 檢查工作流程
      const workflow = await prisma.proposalWorkflow.findFirst({
        where: { proposal_id: proposal.id },
        include: { state_history: true },
      });

      console.log('\n📊 工作流程狀態:');
      console.log(JSON.stringify(workflow, null, 2));
    }
  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
