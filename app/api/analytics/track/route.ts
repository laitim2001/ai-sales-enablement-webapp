/**
 * @fileoverview 用戶行為追蹤API路由功能：- POST: 記錄用戶行為作者：Claude Code日期：2025-10-05
 * @module app/api/analytics/track/route
 * @description
 * 用戶行為追蹤API路由功能：- POST: 記錄用戶行為作者：Claude Code日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
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
 * POST /api/analytics/track
 * 記錄用戶行為
 */
export async function POST(req: NextRequest) {
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

    // 解析請求體
    const body = await req.json();
    const {
      behaviorType,
      contentType,
      contentId,
      contentTitle,
      metadata,
      sessionId,
      deviceInfo,
    } = body;

    // 驗證必填字段
    if (!behaviorType || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: behaviorType, contentType' },
        { status: 400 }
      );
    }

    // 驗證枚舉值
    if (!Object.values(BehaviorType).includes(behaviorType)) {
      return NextResponse.json(
        { error: `Invalid behaviorType: ${behaviorType}` },
        { status: 400 }
      );
    }

    if (!Object.values(ContentType).includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType: ${contentType}` },
        { status: 400 }
      );
    }

    // 創建行為追蹤引擎實例
    const tracker = new UserBehaviorTracker(prisma);

    // 記錄行為
    const behavior = await tracker.trackBehavior({
      userId: payload.userId,
      behaviorType,
      contentType,
      contentId: contentId || 0,
      contentTitle,
      metadata,
      sessionId,
      deviceInfo,
    });

    return NextResponse.json(
      {
        message: 'Behavior tracked successfully',
        behavior,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json(
      { error: 'Failed to track behavior' },
      { status: 500 }
    );
  }
}
