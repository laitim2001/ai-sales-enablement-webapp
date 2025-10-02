/**
 * 提案版本歷史 API 路由
 *
 * 功能：
 * - GET: 獲取提案的所有版本
 * - POST: 創建新版本快照
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { VersionControl } from '@/lib/workflow/version-control';

/**
 * GET /api/proposals/[id]/versions
 * 獲取提案的所有版本記錄
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    // 檢查提案是否存在且用戶有權限訪問
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        user_id: true,
        customer: {
          select: {
            assigned_user_id: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: '提案不存在' }, { status: 404 });
    }

    // 檢查權限：提案創建者或客戶的分配用戶
    const userId = parseInt(session.user.id);
    const hasAccess =
      proposal.user_id === userId ||
      proposal.customer.assigned_user_id === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: '沒有訪問權限' }, { status: 403 });
    }

    // 獲取版本歷史
    const versions = await prisma.proposalVersion.findMany({
      where: { proposal_id: proposalId },
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        version: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        versions,
        total: versions.length,
      },
    });
  } catch (error) {
    console.error('獲取版本歷史失敗:', error);
    return NextResponse.json(
      { error: '獲取版本歷史失敗' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals/[id]/versions
 * 創建新的版本快照
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    const body = await request.json();
    const { label, description } = body;

    // 檢查提案是否存在且用戶有權限
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        user_id: true,
        customer: {
          select: {
            assigned_user_id: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: '提案不存在' }, { status: 404 });
    }

    const userId = parseInt(session.user.id);
    const hasAccess =
      proposal.user_id === userId ||
      proposal.customer.assigned_user_id === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: '沒有訪問權限' }, { status: 403 });
    }

    // 創建版本快照
    const versionControl = new VersionControl();
    const version = await versionControl.createSnapshot(
      proposalId,
      userId,
      label,
      description
    );

    return NextResponse.json({
      success: true,
      data: version,
      message: '版本快照創建成功',
    });
  } catch (error) {
    console.error('創建版本快照失敗:', error);
    return NextResponse.json(
      { error: '創建版本快照失敗' },
      { status: 500 }
    );
  }
}
