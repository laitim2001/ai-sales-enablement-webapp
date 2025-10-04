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
import { prisma } from '@/lib/db';
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
    // TODO: 實現session認證
    const userId = 1; // 臨時固定值

    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    const body = await request.json();
    const { versionIdA, versionIdB } = body;

    if (
      !versionIdA ||
      !versionIdB ||
      typeof versionIdA !== 'string' ||
      typeof versionIdB !== 'string'
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

    // TODO: 添加權限檢查
    // const hasAccess =
    //   proposal.user_id === userId ||
    //   proposal.customer.assigned_user_id === userId;
    // if (!hasAccess) {
    //   return NextResponse.json({ error: '沒有訪問權限' }, { status: 403 });
    // }

    // 獲取兩個版本
    const [versionA, versionB] = await Promise.all([
      prisma.proposalVersion.findUnique({
        where: {
          id: versionIdA,
        },
        include: {
          creator: {
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
          id: versionIdB,
        },
        include: {
          creator: {
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

    // 驗證版本屬於當前提案
    if (versionA.proposal_id !== proposalId || versionB.proposal_id !== proposalId) {
      return NextResponse.json({ error: '版本不屬於此提案' }, { status: 400 });
    }

    // 比較版本
    const versionControl = new VersionControl(prisma);
    const comparison = await versionControl.compareVersions(
      versionIdA,
      versionIdB
    );

    return NextResponse.json({
      success: true,
      data: {
        versionA: {
          id: versionA.id,
          version: versionA.version,
          title: versionA.title,
          created_at: versionA.created_at,
          creator: versionA.creator,
        },
        versionB: {
          id: versionB.id,
          version: versionB.version,
          title: versionB.title,
          created_at: versionB.created_at,
          creator: versionB.creator,
        },
        comparison,
      },
    });
  } catch (error) {
    console.error('版本比較失敗:', error);
    return NextResponse.json({ error: '版本比較失敗' }, { status: 500 });
  }
}
