/**
 * @fileoverview 知識庫單個版本 API 路由端點：- GET /api/knowledge-base/[id]/versions/[versionId] - 獲取版本詳情- DELETE /api/knowledge-base/[id]/versions/[versionId] - 刪除版本作者：Claude Code日期：2025-10-03Sprint: 6 Week 12
 * @module app/api/knowledge-base/[id]/versions/[versionId]/route
 * @description
 * 知識庫單個版本 API 路由端點：- GET /api/knowledge-base/[id]/versions/[versionId] - 獲取版本詳情- DELETE /api/knowledge-base/[id]/versions/[versionId] - 刪除版本作者：Claude Code日期：2025-10-03Sprint: 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth-server';
import { createKnowledgeVersionControl } from '@/lib/knowledge';

/**
 * GET /api/knowledge-base/[id]/versions/[versionId]
 * 獲取單個版本的詳情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '無效的認證令牌' },
        { status: 401 }
      );
    }

    // 2. 獲取版本詳情
    const versionControl = createKnowledgeVersionControl(prisma);
    const version = await versionControl.getVersionDetail(params.versionId);

    if (!version) {
      return NextResponse.json(
        { error: 'Not found', message: '版本不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('獲取版本詳情失敗:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-base/[id]/versions/[versionId]
 * 刪除版本（軟刪除或硬刪除，根據需求）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '無效的認證令牌' },
        { status: 401 }
      );
    }

    // 2. 檢查版本是否存在
    const version = await prisma.knowledgeVersion.findUnique({
      where: { id: params.versionId },
      include: {
        knowledge_base: {
          select: {
            created_by: true,
            version: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Not found', message: '版本不存在' },
        { status: 404 }
      );
    }

    // 3. 檢查權限（只有創建者或管理員可以刪除）
    if (
      version.knowledge_base.created_by !== decoded.userId &&
      decoded.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden', message: '無權限執行此操作' },
        { status: 403 }
      );
    }

    // 4. 防止刪除當前版本
    if (version.version === version.knowledge_base.version) {
      return NextResponse.json(
        { error: 'Bad request', message: '不能刪除當前版本' },
        { status: 400 }
      );
    }

    // 5. 刪除版本
    await prisma.knowledgeVersion.delete({
      where: { id: params.versionId },
    });

    return NextResponse.json({
      message: '版本刪除成功',
    });
  } catch (error) {
    console.error('刪除版本失敗:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  }
}
