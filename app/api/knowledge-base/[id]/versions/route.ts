/**
 * 知識庫版本管理 API 路由
 *
 * 端點：
 * - GET /api/knowledge-base/[id]/versions - 獲取版本列表
 * - POST /api/knowledge-base/[id]/versions - 創建新版本
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
 * GET /api/knowledge-base/[id]/versions
 * 獲取知識庫文檔的版本列表
 */
export async function GET(
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

    // 3. 檢查知識庫文檔是否存在
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: knowledgeBaseId },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: 'Not found', message: '知識庫文檔不存在' },
        { status: 404 }
      );
    }

    // 4. 獲取版本列表
    const versionControl = createKnowledgeVersionControl(prisma);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const versions = await versionControl.getVersionHistory(
      knowledgeBaseId,
      limit,
      offset
    );

    // 5. 獲取版本統計
    const stats = await versionControl.getVersionStats(knowledgeBaseId);

    return NextResponse.json({
      versions,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.totalVersions,
      },
    });
  } catch (error) {
    console.error('獲取版本列表失敗:', error);
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
 * POST /api/knowledge-base/[id]/versions
 * 創建新版本快照
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
    const { changeSummary, isMajor, tags } = body;

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

    // 5. 創建版本快照
    const versionControl = createKnowledgeVersionControl(prisma);
    const version = await versionControl.createVersion(
      knowledgeBaseId,
      decoded.userId,
      changeSummary,
      {
        isMajor: isMajor || false,
        tags: tags || [],
      }
    );

    return NextResponse.json({
      message: '版本創建成功',
      version,
    }, { status: 201 });
  } catch (error) {
    console.error('創建版本失敗:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  }
}
