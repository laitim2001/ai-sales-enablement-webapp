/**
 * @fileoverview 用戶畫像API路由功能：- GET: 獲取用戶畫像作者：Claude Code日期：2025-10-05
 * @module app/api/analytics/profile/route
 * @description
 * 用戶畫像API路由功能：- GET: 獲取用戶畫像作者：Claude Code日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import prisma from '@/lib/prisma';
import { UserBehaviorTracker } from '@/lib/analytics/user-behavior-tracker';

/**
 * GET /api/analytics/profile
 * 獲取用戶畫像
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

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 獲取查詢參數
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 創建行為追蹤引擎實例
    const tracker = new UserBehaviorTracker(prisma);

    // 獲取用戶畫像
    const profile = await tracker.getUserProfile(payload.userId, forceRefresh);

    return NextResponse.json({
      profile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
