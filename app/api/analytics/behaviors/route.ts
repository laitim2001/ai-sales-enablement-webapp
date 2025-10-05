/**
 * 用戶行為歷史API路由
 *
 * 功能：
 * - GET: 獲取用戶行為歷史
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import prisma from '@/lib/prisma';
import {
  UserBehaviorTracker,
  BehaviorType,
  ContentType,
} from '@/lib/analytics/user-behavior-tracker';

/**
 * GET /api/analytics/behaviors
 * 獲取用戶行為歷史
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

    // 獲取查詢參數
    const { searchParams } = new URL(req.url);
    const behaviorType = searchParams.get('behaviorType') as BehaviorType | null;
    const contentType = searchParams.get('contentType') as ContentType | null;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 100;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    // 創建行為追蹤引擎實例
    const tracker = new UserBehaviorTracker(prisma);

    // 獲取用戶行為歷史
    const behaviors = await tracker.getUserBehaviors(payload.userId, {
      behaviorType: behaviorType || undefined,
      contentType: contentType || undefined,
      limit,
      startDate,
      endDate,
    });

    return NextResponse.json({
      behaviors,
      total: behaviors.length,
    });
  } catch (error) {
    console.error('Error fetching user behaviors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user behaviors' },
      { status: 500 }
    );
  }
}
