/**
 * 編輯鎖定狀態API - 檢查資源的鎖定和衝突狀態
 *
 * GET /api/collaboration/locks/:resourceType/:resourceId/status
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createEditLockManager } from '@/lib/collaboration/edit-lock-manager';
import { verifyAccessToken } from '@/lib/auth/token-service';

const prisma = new PrismaClient();

interface RouteParams {
  params: {
    resourceType: string;
    resourceId: string;
  };
}

/**
 * GET /api/collaboration/locks/:resourceType/:resourceId/status
 * 檢查資源的鎖定狀態和潛在衝突
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. 驗證用戶身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded;
    try {
      decoded = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const resourceId = parseInt(params.resourceId, 10);
    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: 'Invalid resourceId' },
        { status: 400 }
      );
    }

    // 2. 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('version');

    // 3. 檢查鎖定狀態
    const lockManager = createEditLockManager(prisma);

    const activeLock = await lockManager.getActiveLock(
      params.resourceType,
      resourceId
    );

    // 4. 檢測衝突
    const conflict = await lockManager.detectConflict(
      params.resourceType,
      resourceId,
      decoded.userId,
      currentVersion ? parseInt(currentVersion, 10) : undefined
    );

    // 5. 如果有活躍鎖定，獲取用戶名
    let lockWithUserName = null;
    if (activeLock) {
      const user = await prisma.user.findUnique({
        where: { id: activeLock.userId },
        select: { first_name: true, last_name: true },
      });

      lockWithUserName = {
        ...activeLock,
        userName: user ? `${user.first_name} ${user.last_name}` : '未知用戶',
      };
    }

    return NextResponse.json({
      success: true,
      lock: lockWithUserName,
      conflict: conflict.hasConflict ? conflict : null,
      isLocked: !!activeLock,
      isLockedByCurrentUser: activeLock?.userId === decoded.userId,
    });
  } catch (error: any) {
    console.error('Failed to get lock status:', error);

    return NextResponse.json(
      {
        error: 'Failed to get lock status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
