/**
 * @fileoverview 會議準備包API路由功能：- GET: 獲取用戶的準備包列表- POST: 創建新準備包作者：Claude Code日期：2025-10-05
 * @module app/api/meeting-prep/route
 * @description
 * 會議準備包API路由功能：- GET: 獲取用戶的準備包列表- POST: 創建新準備包作者：Claude Code日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/request-auth';
import prisma from '@/lib/prisma';
import {
  MeetingPrepPackageManager,
  PrepPackageType,
  PrepPackageStatus,
} from '@/lib/meeting/meeting-prep-package';

/**
 * GET /api/meeting-prep
 * 獲取用戶的準備包列表
 */
export async function GET(req: NextRequest) {
  try {
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(req);
    const userId = payload.userId;

    // 獲取查詢參數
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as PrepPackageStatus | null;
    const type = searchParams.get('type') as PrepPackageType | null;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined;

    // 創建準備包管理器實例
    const manager = new MeetingPrepPackageManager(prisma);

    // 獲取準備包列表
    const packages = await manager.getUserPrepPackages(userId, {
      status: status || undefined,
      type: type || undefined,
      limit,
    });

    return NextResponse.json({
      packages,
      total: packages.length,
    });
  } catch (error) {
    console.error('Error fetching prep packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prep packages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meeting-prep
 * 創建新準備包
 */
export async function POST(req: NextRequest) {
  try {
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(req);
    const userId = payload.userId;

    // 解析請求體
    const body = await req.json();
    const { type, title, description, items, metadata, templateId, autoGenerate, meetingInfo } =
      body;

    // 創建準備包管理器實例
    const manager = new MeetingPrepPackageManager(prisma);

    let prepPackage;

    // 智能生成準備包
    if (autoGenerate && meetingInfo) {
      prepPackage = await manager.autoGeneratePrepPackage(userId, {
        ...meetingInfo,
        meetingType: type || PrepPackageType.SALES_MEETING,
      });
    }
    // 從模板創建
    else if (templateId) {
      prepPackage = await manager.createFromTemplate(templateId, userId, {
        title,
        description,
        metadata,
      });
    }
    // 手動創建
    else {
      if (!type || !title) {
        return NextResponse.json(
          { error: 'Missing required fields: type, title' },
          { status: 400 }
        );
      }

      prepPackage = await manager.createPrepPackage({
        userId: userId,
        type,
        title,
        description,
        status: PrepPackageStatus.DRAFT,
        items: items || [],
        metadata: metadata || {},
      });
    }

    return NextResponse.json(
      {
        message: 'Prep package created successfully',
        package: prepPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating prep package:', error);
    return NextResponse.json(
      { error: 'Failed to create prep package' },
      { status: 500 }
    );
  }
}
