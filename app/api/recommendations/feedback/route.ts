/**
 * 推薦反饋API路由
 *
 * 📋 檔案用途：
 * 接收用戶對推薦的反饋，用於優化推薦算法
 *
 * 🔗 API端點：
 * - POST /api/recommendations/feedback - 提交推薦反饋
 *
 * 📊 請求體：
 * {
 *   recommendationId: string,
 *   itemId: string,
 *   action: 'view' | 'click' | 'dismiss' | 'like' | 'dislike',
 *   rating?: number (1-5),
 *   comment?: string
 * }
 *
 * 📤 響應格式：
 * {
 *   success: boolean,
 *   data: {
 *     feedbackId: string,
 *     message: string
 *   }
 * }
 *
 * 作者：Claude Code
 * 創建時間：2025-10-05
 * Sprint：Sprint 7 Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createRecommendationEngine } from '@/lib/recommendation';
import { createUserBehaviorTracker } from '@/lib/analytics';
import { RecommendationFeedback } from '@/lib/recommendation';

/**
 * POST /api/recommendations/feedback
 *
 * 功能：提交推薦反饋
 *
 * 流程：
 * 1. 驗證用戶身份
 * 2. 驗證請求體
 * 3. 記錄反饋
 * 4. 更新用戶行為
 * 5. 返回確認
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 身份驗證
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // ========================================================================
    // 2. 解析並驗證請求體
    // ========================================================================
    const body = await request.json();

    const {
      recommendationId,
      itemId,
      action,
      rating,
      comment
    } = body;

    // 必填欄位驗證
    if (!recommendationId || !itemId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必需參數：recommendationId, itemId, action'
        },
        { status: 400 }
      );
    }

    // action欄位驗證
    const validActions = ['view', 'click', 'dismiss', 'like', 'dislike'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: `無效的action，必須是：${validActions.join(', ')}`
        },
        { status: 400 }
      );
    }

    // rating欄位驗證（可選）
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        {
          success: false,
          error: 'rating必須在1-5之間'
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. 構建反饋對象並記錄
    // ========================================================================
    const feedback: RecommendationFeedback = {
      recommendationId,
      itemId,
      userId,
      action,
      timestamp: new Date(),
      rating,
      comment
    };

    const { prisma } = await import('@/lib/prisma');
    const behaviorTracker = createUserBehaviorTracker(prisma);
    const recommendationEngine = createRecommendationEngine(behaviorTracker);

    await recommendationEngine.recordFeedback(feedback);

    // ========================================================================
    // 4. 返回成功響應
    // ========================================================================
    const feedbackId = `feedback_${userId}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        feedbackId,
        message: '反饋已成功記錄',
        action,
        timestamp: feedback.timestamp
      }
    });

  } catch (error) {
    console.error('記錄推薦反饋時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '記錄反饋時發生錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendations/feedback
 *
 * 功能：獲取推薦效果統計
 *
 * 流程：
 * 1. 驗證用戶身份
 * 2. 調用推薦引擎獲取統計
 * 3. 返回統計結果
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 身份驗證
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // ========================================================================
    // 2. 獲取推薦統計
    // ========================================================================
    const { prisma } = await import('@/lib/prisma');
    const behaviorTracker = createUserBehaviorTracker(prisma);
    const recommendationEngine = createRecommendationEngine(behaviorTracker);

    const stats = await recommendationEngine.getRecommendationStats(userId);

    // ========================================================================
    // 3. 返回統計結果
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        totalRecommendations: stats.totalRecommendations,
        totalFeedback: stats.totalFeedback,
        clickThroughRate: Math.round(stats.clickThroughRate * 100) / 100,  // 保留2位小數
        averageRating: Math.round(stats.averageRating * 10) / 10,          // 保留1位小數
        topPerformingItems: stats.topPerformingItems
      }
    });

  } catch (error) {
    console.error('獲取推薦統計時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '獲取統計時發生錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}
