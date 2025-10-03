/**
 * 知識庫版本回滾 API 路由
 *
 * 端點：
 * - POST /api/knowledge-base/[id]/versions/revert - 回滾到指定版本
 *
 * 作者：Claude Code
 * 日期：2025-10-03
 * Sprint: 6 Week 12
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth-server';
import { createKnowledgeVersionControl } from '@/lib/knowledge';

/**
 * POST /api/knowledge-base/[id]/versions/revert
 * 回滾知識庫文檔到指定版本
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 驗證 JWT Token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '缺少認證令牌' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '無效的認證令牌' },
        { status: 401 }
      );
    }

    // 2. 解析參數
    const knowledgeBaseId = parseInt(params.id);
    if (isNaN(knowledgeBaseId)) {
      return NextResponse.json(
        { error: 'Invalid ID', message: '無效的知識庫ID' },
        { status: 400 }
      );
    }

    // 3. 解析請求體
    const body = await request.json();
    const { versionId, reason } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Bad request', message: '缺少版本ID' },
        { status: 400 }
      );
    }

    // 4. 檢查知識庫文檔是否存在
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: knowledgeBaseId },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: 'Not found', message: '知識庫文檔不存在' },
        { status: 404 }
      );
    }

    // 5. 檢查權限（只有創建者或管理員可以回滾）
    if (
      knowledgeBase.created_by !== decoded.userId &&
      decoded.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden', message: '無權限執行此操作' },
        { status: 403 }
      );
    }

    // 6. 執行版本回滾
    const versionControl = createKnowledgeVersionControl(prisma);
    const restoredKnowledgeBase = await versionControl.revertToVersion(
      knowledgeBaseId,
      versionId,
      decoded.userId
    );

    return NextResponse.json({
      message: '版本回滾成功',
      knowledgeBase: restoredKnowledgeBase,
      reason: reason || '未提供回滾原因',
    });
  } catch (error) {
    console.error('版本回滾失敗:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  }
}
