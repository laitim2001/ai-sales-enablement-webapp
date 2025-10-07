/**
 * @fileoverview 提案版本歷史 API 路由功能：- GET: 獲取提案的所有版本- POST: 創建新版本快照@author Claude Code@date 2025-10-02
 * @module app/api/proposals/[id]/versions/route
 * @description
 * 提案版本歷史 API 路由功能：- GET: 獲取提案的所有版本- POST: 創建新版本快照@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
    // TODO: 實現session認證
    const userId = 1; // 臨時固定值

    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    // 檢查提案是否存在
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

    // TODO: 添加權限檢查
    // const hasAccess =
    //   proposal.user_id === userId ||
    //   proposal.customer.assigned_user_id === userId;
    // if (!hasAccess) {
    //   return NextResponse.json({ error: '沒有訪問權限' }, { status: 403 });
    // }

    // 獲取版本歷史
    const versions = await prisma.proposalVersion.findMany({
      where: { proposal_id: proposalId },
      include: {
        creator: {
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
    // TODO: 實現session認證
    const userId = 1; // 臨時固定值

    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    const body = await request.json();
    const { label, description } = body;

    // 檢查提案是否存在
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

    // TODO: 添加權限檢查
    // const hasAccess =
    //   proposal.user_id === userId ||
    //   proposal.customer.assigned_user_id === userId;
    // if (!hasAccess) {
    //   return NextResponse.json({ error: '沒有訪問權限' }, { status: 403 });
    // }

    // 創建版本快照
    const versionControl = new VersionControl(prisma);
    const version = await versionControl.createVersion(
      proposalId,
      userId,
      label,
      { tags: description ? ['manual-snapshot'] : [] }
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
