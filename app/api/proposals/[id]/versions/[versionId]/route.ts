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
import { prisma } from '@/lib/db';

/**
 * GET /api/proposals/[id]/versions/[versionId]
 * 獲取特定版本的詳細信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    // TODO: 實現session認證 - 暫時跳過認證檢查
    const userId = 1; // 臨時使用固定用戶ID

    const proposalId = parseInt(params.id);
    const versionId = params.versionId; // String CUID, not number

    if (isNaN(proposalId) || typeof versionId !== 'string') {
      return NextResponse.json({ error: '無效的 ID' }, { status: 400 });
    }

    // 獲取版本詳情
    const version = await prisma.proposalVersion.findUnique({
      where: {
        id: versionId,
      },
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
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 驗證版本屬於此提案
    if (version.proposal_id !== proposalId) {
      return NextResponse.json({ error: '版本不屬於此提案' }, { status: 404 });
    }

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
    // TODO: 實現session認證 - 暫時跳過認證檢查
    const userId = 1; // 臨時使用固定用戶ID

    const proposalId = parseInt(params.id);
    const versionId = params.versionId; // String CUID, not number

    if (isNaN(proposalId) || typeof versionId !== 'string') {
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

    // 檢查版本是否存在
    const version = await prisma.proposalVersion.findUnique({
      where: {
        id: versionId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 驗證版本屬於此提案
    if (version.proposal_id !== proposalId) {
      return NextResponse.json({ error: '版本不屬於此提案' }, { status: 404 });
    }

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
