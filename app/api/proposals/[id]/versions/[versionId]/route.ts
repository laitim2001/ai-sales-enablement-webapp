/**
 * 單個版本操作 API 路由
 *
 * 功能：
 * - GET: 獲取特定版本詳情
 * - DELETE: 刪除版本（僅非當前版本）
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/proposals/[id]/versions/[versionId]
 * 獲取特定版本的詳細信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const proposalId = parseInt(params.id);
    const versionId = parseInt(params.versionId);

    if (isNaN(proposalId) || isNaN(versionId)) {
      return NextResponse.json({ error: '無效的 ID' }, { status: 400 });
    }

    // 檢查提案權限
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
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

    // 獲取版本詳情
    const version = await prisma.proposalVersion.findUnique({
      where: {
        id: versionId,
        proposal_id: proposalId,
      },
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
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('獲取版本詳情失敗:', error);
    return NextResponse.json(
      { error: '獲取版本詳情失敗' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals/[id]/versions/[versionId]
 * 刪除指定版本（僅非當前版本可刪除）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const proposalId = parseInt(params.id);
    const versionId = parseInt(params.versionId);

    if (isNaN(proposalId) || isNaN(versionId)) {
      return NextResponse.json({ error: '無效的 ID' }, { status: 400 });
    }

    // 檢查提案權限（只有創建者可以刪除版本）
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        user_id: true,
        version: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: '提案不存在' }, { status: 404 });
    }

    const userId = parseInt(session.user.id);
    if (proposal.user_id !== userId) {
      return NextResponse.json(
        { error: '只有提案創建者可以刪除版本' },
        { status: 403 }
      );
    }

    // 檢查版本是否存在
    const version = await prisma.proposalVersion.findUnique({
      where: {
        id: versionId,
        proposal_id: proposalId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 不能刪除當前版本
    if (version.version === proposal.version) {
      return NextResponse.json(
        { error: '不能刪除當前版本' },
        { status: 400 }
      );
    }

    // 刪除版本
    await prisma.proposalVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({
      success: true,
      message: '版本已刪除',
    });
  } catch (error) {
    console.error('刪除版本失敗:', error);
    return NextResponse.json({ error: '刪除版本失敗' }, { status: 500 });
  }
}
