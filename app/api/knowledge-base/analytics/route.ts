/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫分析統計API================================================================【API功能】提供知識庫的全面分析統計數據，支持多維度數據查詢和時間範圍篩選。【路由端點】GET /api/knowledge-base/analytics - 獲取知識庫分析統計數據【查詢參數】• type: 統計類型  - overview: 總體概覽  - top-viewed: 熱門查看文檔  - top-edited: 熱門編輯文檔  - type-distribution: 類型分布  - category-distribution: 分類分布  - status-distribution: 狀態分布  - folder-usage: 資料夾使用  - user-activity: 用戶活動• timeRange: 時間範圍 (today/week/month/custom)• startDate: 自定義開始日期 (ISO格式)• endDate: 自定義結束日期 (ISO格式)• limit: 結果數量限制 (默認10)【響應格式】{  "success": true,  "data": { ... },  "metadata": {    "type": "overview",    "timeRange": "month",    "timestamp": "2025-10-03T12:00:00Z"  }}【權限要求】• 需要 JWT 驗證• 需要 ADMIN 或 MANAGER 角色（部分統計功能）@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 * @module app/api/knowledge-base/analytics/route
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫分析統計API================================================================【API功能】提供知識庫的全面分析統計數據，支持多維度數據查詢和時間範圍篩選。【路由端點】GET /api/knowledge-base/analytics - 獲取知識庫分析統計數據【查詢參數】• type: 統計類型  - overview: 總體概覽  - top-viewed: 熱門查看文檔  - top-edited: 熱門編輯文檔  - type-distribution: 類型分布  - category-distribution: 分類分布  - status-distribution: 狀態分布  - folder-usage: 資料夾使用  - user-activity: 用戶活動• timeRange: 時間範圍 (today/week/month/custom)• startDate: 自定義開始日期 (ISO格式)• endDate: 自定義結束日期 (ISO格式)• limit: 結果數量限制 (默認10)【響應格式】{  "success": true,  "data": { ... },  "metadata": {    "type": "overview",    "timeRange": "month",    "timestamp": "2025-10-03T12:00:00Z"  }}【權限要求】• 需要 JWT 驗證• 需要 ADMIN 或 MANAGER 角色（部分統計功能）@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { knowledgeAnalyticsService, TimeRange } from '@/lib/knowledge/analytics-service';

/**
 * 統計類型枚舉
 */
type AnalyticsType =
  | 'overview'
  | 'top-viewed'
  | 'top-edited'
  | 'type-distribution'
  | 'category-distribution'
  | 'status-distribution'
  | 'folder-usage'
  | 'user-activity';

/**
 * GET /api/knowledge-base/analytics
 * 獲取知識庫分析統計數據
 */
export async function GET(request: NextRequest) {
  try {
    // 1. JWT 驗證
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: '未提供認證令牌'
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: '無效的認證令牌'
        },
        { status: 401 }
      );
    }

    // 2. 解析查詢參數
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'overview') as AnalyticsType;
    const timeRangeParam = searchParams.get('timeRange') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // 3. 驗證時間範圍
    let timeRange: TimeRange;
    switch (timeRangeParam) {
      case 'today':
        timeRange = TimeRange.TODAY;
        break;
      case 'week':
        timeRange = TimeRange.WEEK;
        break;
      case 'month':
        timeRange = TimeRange.MONTH;
        break;
      case 'custom':
        timeRange = TimeRange.CUSTOM;
        break;
      default:
        timeRange = TimeRange.MONTH;
    }

    // 4. 解析自定義日期範圍
    let customStart: Date | undefined;
    let customEnd: Date | undefined;
    if (timeRange === TimeRange.CUSTOM) {
      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          {
            success: false,
            error: '自定義時間範圍需要提供 startDate 和 endDate'
          },
          { status: 400 }
        );
      }
      customStart = new Date(startDateParam);
      customEnd = new Date(endDateParam);

      if (isNaN(customStart.getTime()) || isNaN(customEnd.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: '無效的日期格式，請使用 ISO 8601 格式'
          },
          { status: 400 }
        );
      }
    }

    // 5. 根據類型獲取統計數據
    let data: any;

    switch (type) {
      case 'overview':
        data = await knowledgeAnalyticsService.getOverview(timeRange, customStart, customEnd);
        break;

      case 'top-viewed':
        data = await knowledgeAnalyticsService.getTopViewedDocuments(limit, timeRange);
        break;

      case 'top-edited':
        data = await knowledgeAnalyticsService.getTopEditedDocuments(limit, timeRange);
        break;

      case 'type-distribution':
        data = await knowledgeAnalyticsService.getTypeDistribution();
        break;

      case 'category-distribution':
        data = await knowledgeAnalyticsService.getCategoryDistribution();
        break;

      case 'status-distribution':
        data = await knowledgeAnalyticsService.getStatusDistribution();
        break;

      case 'folder-usage':
        data = await knowledgeAnalyticsService.getFolderUsage(limit);
        break;

      case 'user-activity':
        // 用戶活動統計需要管理員或經理權限
        if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER') {
          return NextResponse.json(
            {
              success: false,
              error: '需要管理員或經理權限'
            },
            { status: 403 }
          );
        }
        data = await knowledgeAnalyticsService.getUserActivity(limit, timeRange);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `不支持的統計類型: ${type}`
          },
          { status: 400 }
        );
    }

    // 6. 返回成功響應
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        type,
        timeRange: timeRangeParam,
        limit,
        timestamp: new Date().toISOString(),
        userId: payload.userId
      }
    });

  } catch (error) {
    console.error('知識庫分析統計API錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取統計數據失敗'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/knowledge-base/analytics
 * CORS 預檢請求處理
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
