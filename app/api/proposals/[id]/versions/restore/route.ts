/**
 * 版本回滾 API 路由
 *
 * 功能：
 * - POST: 將提案回滾到指定版本
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
 * POST /api/proposals/[id]/versions/restore
 * 將提案回滾到指定版本
 *
 * Body: {
 *   versionId: number,
 *   reason: string,
 *   createBackup?: boolean
 * }
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
    const { versionId, reason, createBackup = true } = body;

    if (!versionId || isNaN(parseInt(versionId))) {
      return NextResponse.json(
        { error: '需要提供有效的版本 ID' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: '需要提供回滾原因' },
        { status: 400 }
      );
    }

    // 檢查提案權限（只有創建者可以回滾）
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
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
        { error: '只有提案創建者可以回滾版本' },
        { status: 403 }
      );
    }

    // 檢查目標版本是否存在
    const targetVersion = await prisma.proposalVersion.findUnique({
      where: {
        id: parseInt(versionId),
        proposal_id: proposalId,
      },
    });

    if (!targetVersion) {
      return NextResponse.json({ error: '目標版本不存在' }, { status: 404 });
    }

    // 不能回滾到當前版本
    if (targetVersion.version === proposal.version) {
      return NextResponse.json(
        { error: '目標版本已經是當前版本' },
        { status: 400 }
      );
    }

    // 如果需要創建備份，先創建當前版本的快照
    const versionControl = new VersionControl();
    let backupVersion = null;

    if (createBackup) {
      try {
        backupVersion = await versionControl.createSnapshot(
          proposalId,
          userId,
          `回滾前備份 (v${proposal.version})`,
          `回滾到版本 ${targetVersion.version} 前的自動備份\n原因: ${reason}`
        );
      } catch (error) {
        console.error('創建備份失敗:', error);
        return NextResponse.json(
          { error: '創建備份失敗，回滾操作已取消' },
          { status: 500 }
        );
      }
    }

    // 執行回滾
    try {
      const restoredVersion = await versionControl.revertToVersion(
        parseInt(versionId),
        userId
      );

      // 記錄回滾原因到元數據
      await prisma.proposalVersion.update({
        where: { id: restoredVersion.id },
        data: {
          description: `${restoredVersion.description || ''}\n\n回滾原因: ${reason}`,
          metadata: {
            ...(restoredVersion.metadata as object),
            restore_reason: reason,
            restored_from_version: targetVersion.version,
            backup_version_id: backupVersion?.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          restoredVersion,
          backupVersion,
        },
        message: `已成功回滾到版本 ${targetVersion.version}`,
      });
    } catch (error) {
      console.error('回滾失敗:', error);

      // 如果回滾失敗，嘗試刪除創建的備份
      if (backupVersion) {
        try {
          await prisma.proposalVersion.delete({
            where: { id: backupVersion.id },
          });
        } catch (deleteError) {
          console.error('刪除失敗備份時出錯:', deleteError);
        }
      }

      return NextResponse.json(
        { error: '版本回滾失敗，已回滾所有更改' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('版本回滾失敗:', error);
    return NextResponse.json({ error: '版本回滾失敗' }, { status: 500 });
  }
}
