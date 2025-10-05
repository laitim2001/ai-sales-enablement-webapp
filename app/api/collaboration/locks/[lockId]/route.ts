/**
 * 編輯鎖定API - 釋放和刷新鎖定
 *
 * DELETE /api/collaboration/locks/:lockId - 釋放鎖定
 * PATCH /api/collaboration/locks/:lockId - 刷新鎖定時間
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
    lockId: string;
  };
}

/**
 * DELETE /api/collaboration/locks/:lockId
 * 釋放編輯鎖定
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 2. 釋放鎖定
    const lockManager = createEditLockManager(prisma);
    const success = await lockManager.releaseLock(params.lockId, decoded.userId);

    return NextResponse.json({
      success,
      message: 'Lock released successfully',
    });
  } catch (error: any) {
    console.error('Failed to release lock:', error);

    return NextResponse.json(
      {
        error: 'Failed to release lock',
        message: error.message,
      },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/collaboration/locks/:lockId
 * 刷新鎖定時間
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // 2. 解析請求體
    const body = await request.json();
    const { expiresInMinutes } = body;

    // 3. 刷新鎖定
    const lockManager = createEditLockManager(prisma);
    const lock = await lockManager.refreshLock(params.lockId, expiresInMinutes);

    return NextResponse.json({
      success: true,
      lock,
      message: 'Lock refreshed successfully',
    });
  } catch (error: any) {
    console.error('Failed to refresh lock:', error);

    return NextResponse.json(
      {
        error: 'Failed to refresh lock',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
