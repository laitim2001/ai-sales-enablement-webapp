/**
 * @fileoverview 內容推薦API路由
📋 檔案用途：
提供基於用戶畫像的個性化內容推薦API
🔗 API端點：
- GET /api/recommendations/content - 獲取個性化內容推薦
📊 請求參數：
- limit: 返回數量限制（默認10）
- contentType: 內容類型過濾（KNOWLEDGE_BASE/PROPOSAL/TEMPLATE等）
- strategy: 推薦策略（co...
 * @module app/api/recommendations/content/route
 *
 * 內容推薦API路由
 * 📋 檔案用途：
 * 提供基於用戶畫像的個性化內容推薦API
 * 🔗 API端點：
 * - GET /api/recommendations/content - 獲取個性化內容推薦
 * 📊 請求參數：
 * - limit: 返回數量限制（默認10）
 * - contentType: 內容類型過濾（KNOWLEDGE_BASE/PROPOSAL/TEMPLATE等）
 * - strategy: 推薦策略（collaborative/content_based/hybrid/popularity）
 * - excludeIds: 排除的項目ID列表
 * 📤 響應格式：
 * {
 * success: boolean,
 * data: {
 * items: RecommendationItem[],
 * totalCount: number,
 * strategy: string,
 * confidence: number
 * }
 * }
 * 作者：Claude Code
 * 創建時間：2025-10-05
 * Sprint：Sprint 7 Phase 2
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createRecommendationEngine } from '@/lib/recommendation';
import { createUserBehaviorTracker } from '@/lib/analytics';
import { ContentType } from '@/lib/analytics/user-behavior-tracker';

/**
 * GET /api/recommendations/content
 *
 * 功能：獲取個性化內容推薦
 *
 * 流程：
 * 1. 驗證用戶身份
 * 2. 解析請求參數
 * 3. 調用推薦引擎
 * 4. 返回推薦結果
 *
 * 權限：需要有效的access token
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 身份驗證 - 驗證JWT token
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
    // 2. 解析請求參數
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const contentType = searchParams.get('contentType') as ContentType | null;
    const strategy = searchParams.get('strategy') as 'collaborative' | 'content_based' | 'hybrid' | 'popularity' | null;
    const excludeIdsStr = searchParams.get('excludeIds');
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(',') : [];
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // 參數驗證
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: 'limit參數必須在1-50之間' },
        { status: 400 }
      );
    }

    const validContentTypes = ['KNOWLEDGE_BASE', 'PROPOSAL', 'TEMPLATE', 'CUSTOMER', 'MEETING', 'WORKFLOW'];
    if (contentType && !validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: `無效的contentType，必須是：${validContentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validStrategies = ['collaborative', 'content_based', 'hybrid', 'popularity'];
    if (strategy && !validStrategies.includes(strategy)) {
      return NextResponse.json(
        { success: false, error: `無效的strategy，必須是：${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. 調用推薦引擎 - 生成推薦
    // ========================================================================
    const { prisma } = await import('@/lib/prisma');
    const behaviorTracker = createUserBehaviorTracker(prisma);
    const recommendationEngine = createRecommendationEngine(behaviorTracker);

    const recommendations = await recommendationEngine.generateRecommendations({
      userId,
      limit,
      contentType: contentType || undefined,
      excludeIds,
      strategy: strategy || 'hybrid',
      forceRefresh
    });

    // ========================================================================
    // 4. 返回推薦結果
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        items: recommendations.items,
        totalCount: recommendations.totalCount,
        strategy: recommendations.strategy,
        confidence: recommendations.confidence,
        generatedAt: recommendations.generatedAt
      }
    });

  } catch (error) {
    console.error('獲取內容推薦時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '獲取推薦時發生錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}
