/**
 * @fileoverview 知識庫版本比較 API 路由端點：- POST /api/knowledge-base/[id]/versions/compare - 比較兩個版本作者：Claude Code日期：2025-10-03Sprint: 6 Week 12
 * @module app/api/knowledge-base/[id]/versions/compare/route
 * @description
 * 知識庫版本比較 API 路由端點：- POST /api/knowledge-base/[id]/versions/compare - 比較兩個版本作者：Claude Code日期：2025-10-03Sprint: 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth-server';
import { createKnowledgeVersionControl } from '@/lib/knowledge';

/**
 * POST /api/knowledge-base/[id]/versions/compare
 * 比較兩個版本的差異
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

    const decoded = verifyToken(token);
    if (!decoded) {
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
    const { versionId1, versionId2 } = body;

    if (!versionId1 || !versionId2) {
      return NextResponse.json(
        { error: 'Bad request', message: '缺少版本ID' },
        { status: 400 }
      );
    }

    // 4. 比較版本
    const versionControl = createKnowledgeVersionControl(prisma);
    const diff = await versionControl.compareVersions(versionId1, versionId2);

    // 5. 獲取版本詳情
    const [version1, version2] = await Promise.all([
      versionControl.getVersionDetail(versionId1),
      versionControl.getVersionDetail(versionId2),
    ]);

    return NextResponse.json({
      diff,
      version1,
      version2,
    });
  } catch (error) {
    console.error('版本比較失敗:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  }
}
