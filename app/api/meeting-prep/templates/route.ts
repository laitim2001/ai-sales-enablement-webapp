/**
 * 準備包模板API路由
 *
 * 功能：
 * - GET: 獲取所有模板
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import prisma from '@/lib/prisma';
import { MeetingPrepPackageManager } from '@/lib/meeting/meeting-prep-package';

/**
 * GET /api/meeting-prep/templates
 * 獲取所有模板
 */
export async function GET(req: NextRequest) {
  try {
    // 驗證用戶身份
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 創建準備包管理器實例
    const manager = new MeetingPrepPackageManager(prisma);

    // 獲取所有模板
    const templates = await manager.getAllTemplates();

    return NextResponse.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
