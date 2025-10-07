/**
 * @fileoverview 會議相關推薦API路由📋 檔案用途：提供基於會議上下文的個性化推薦API🔗 API端點：- GET /api/recommendations/meetings - 獲取會議相關推薦📊 請求參數：- meetingId: 會議ID（必需）- limit: 返回數量限制（默認10）- contentType: 內容類型過濾📤 響應格式：{  success: boolean,  data: {    items: RecommendationItem[],    totalCount: number,    meetingContext: {      meetingId: string,      meetingType?: string,      participants?: string[]    }  }}作者：Claude Code創建時間：2025-10-05Sprint：Sprint 7 Phase 2
 * @module app/api/recommendations/meetings/route
 * @description
 * 會議相關推薦API路由📋 檔案用途：提供基於會議上下文的個性化推薦API🔗 API端點：- GET /api/recommendations/meetings - 獲取會議相關推薦📊 請求參數：- meetingId: 會議ID（必需）- limit: 返回數量限制（默認10）- contentType: 內容類型過濾📤 響應格式：{  success: boolean,  data: {    items: RecommendationItem[],    totalCount: number,    meetingContext: {      meetingId: string,      meetingType?: string,      participants?: string[]    }  }}作者：Claude Code創建時間：2025-10-05Sprint：Sprint 7 Phase 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createRecommendationEngine } from '@/lib/recommendation';
import { createUserBehaviorTracker } from '@/lib/analytics';
import { ContentType } from '@/lib/analytics/user-behavior-tracker';

/**
 * GET /api/recommendations/meetings
 *
 * 功能：獲取會議相關推薦
 *
 * 流程：
 * 1. 驗證用戶身份
 * 2. 解析請求參數（包含meetingId）
 * 3. 調用推薦引擎（帶會議上下文）
 * 4. 返回推薦結果
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
    // 2. 解析請求參數
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;

    const meetingId = searchParams.get('meetingId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const contentType = searchParams.get('contentType') as ContentType | null;
    const customerId = searchParams.get('customerId');
    const keywords = searchParams.get('keywords');

    // 參數驗證
    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: '缺少必需參數：meetingId' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: 'limit參數必須在1-50之間' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. 構建會議上下文並調用推薦引擎
    // ========================================================================
    const { prisma } = await import('@/lib/prisma');
    const behaviorTracker = createUserBehaviorTracker(prisma);
    const recommendationEngine = createRecommendationEngine(behaviorTracker);

    const contextualInfo = {
      meetingId,
      customerId: customerId ? parseInt(customerId, 10) : undefined,
      keywords: keywords ? keywords.split(',') : undefined
    };

    const recommendations = await recommendationEngine.generateRecommendations({
      userId,
      limit,
      contentType: contentType || undefined,
      contextualInfo,
      strategy: 'hybrid'  // 會議推薦使用混合策略
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
        meetingContext: {
          meetingId,
          customerId: contextualInfo.customerId,
          keywords: contextualInfo.keywords
        },
        generatedAt: recommendations.generatedAt
      }
    });

  } catch (error) {
    console.error('獲取會議推薦時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '獲取會議推薦時發生錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}
