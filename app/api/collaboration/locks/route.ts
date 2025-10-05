/**
 * 編輯鎖定API - 獲取和管理編輯鎖定
 *
 * POST /api/collaboration/locks - 獲取編輯鎖定
 * GET /api/collaboration/locks/user/:userId - 獲取用戶的所有鎖定
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createEditLockManager } from '@/lib/collaboration/edit-lock-manager';
import { verifyAccessToken } from '@/lib/auth/token-service';

const prisma = new PrismaClient();

/**
 * POST /api/collaboration/locks
 * 獲取編輯鎖定
 */
export async function POST(request: NextRequest) {
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

    let userId: number;
    try {
      const decoded = await verifyAccessToken(token);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. 解析請求體
    const body = await request.json();
    const { resourceType, resourceId, expiresInMinutes, force } = body;

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceType, resourceId' },
        { status: 400 }
      );
    }

    // 3. 獲取編輯鎖定
    const lockManager = createEditLockManager(prisma);

    const lock = await lockManager.acquireLock(
      resourceType,
      resourceId,
      userId,
      { expiresInMinutes, force }
    );

    return NextResponse.json({
      success: true,
      lock,
    });
  } catch (error: any) {
    console.error('Failed to acquire lock:', error);

    return NextResponse.json(
      {
        error: 'Failed to acquire lock',
        message: error.message,
      },
      { status: error.message.includes('locked by') ? 409 : 500 }
    );
  }
}

/**
 * GET /api/collaboration/locks?userId=:userId
 * 獲取用戶的所有活躍鎖定
 */
export async function GET(request: NextRequest) {
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

    try {
      await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // 3. 獲取用戶的鎖定
    const lockManager = createEditLockManager(prisma);
    const locks = await lockManager.getUserActiveLocks(parseInt(userId, 10));

    return NextResponse.json({
      success: true,
      locks,
      count: locks.length,
    });
  } catch (error: any) {
    console.error('Failed to get user locks:', error);

    return NextResponse.json(
      {
        error: 'Failed to get user locks',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
