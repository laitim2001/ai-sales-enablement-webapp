/**
 * @fileoverview 準備包模板API路由
功能：
- GET: 獲取所有模板
作者：Claude Code
日期：2025-10-05
 * @module app/api/meeting-prep/templates/route
 *
 * 準備包模板API路由
 * 功能：
 * - GET: 獲取所有模板
 * 作者：Claude Code
 * 日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/request-auth';
import prisma from '@/lib/prisma';
import { MeetingPrepPackageManager } from '@/lib/meeting/meeting-prep-package';

/**
 * GET /api/meeting-prep/templates
 * 獲取所有模板
 */
export async function GET(req: NextRequest) {
  try {
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(req);

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
