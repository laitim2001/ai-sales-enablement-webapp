/**
 * 版本比較 API 路由
 *
 * 功能：
 * - POST: 比較兩個版本的差異
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
 * POST /api/proposals/[id]/versions/compare
 * 比較兩個版本的差異
 *
 * Body: { versionIdA: number, versionIdB: number }
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
    const { versionIdA, versionIdB } = body;

    if (
      !versionIdA ||
      !versionIdB ||
      isNaN(parseInt(versionIdA)) ||
      isNaN(parseInt(versionIdB))
    ) {
      return NextResponse.json(
        { error: '需要提供兩個有效的版本 ID' },
        { status: 400 }
      );
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

    // 獲取兩個版本
    const [versionA, versionB] = await Promise.all([
      prisma.proposalVersion.findUnique({
        where: {
          id: parseInt(versionIdA),
          proposal_id: proposalId,
        },
        include: {
          created_by: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      prisma.proposalVersion.findUnique({
        where: {
          id: parseInt(versionIdB),
          proposal_id: proposalId,
        },
        include: {
          created_by: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
    ]);

    if (!versionA || !versionB) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 比較版本
    const versionControl = new VersionControl();
    const comparison = await versionControl.compareVersions(
      parseInt(versionIdA),
      parseInt(versionIdB)
    );

    return NextResponse.json({
      success: true,
      data: {
        versionA: {
          id: versionA.id,
          version: versionA.version,
          label: versionA.label,
          created_at: versionA.created_at,
          created_by: versionA.created_by,
          snapshot_data: versionA.snapshot_data,
        },
        versionB: {
          id: versionB.id,
          version: versionB.version,
          label: versionB.label,
          created_at: versionB.created_at,
          created_by: versionB.created_by,
          snapshot_data: versionB.snapshot_data,
        },
        comparison,
      },
    });
  } catch (error) {
    console.error('版本比較失敗:', error);
    return NextResponse.json({ error: '版本比較失敗' }, { status: 500 });
  }
}
