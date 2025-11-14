/**
 * @fileoverview Calendar Sync API路由
📋 功能說明：
- 增量同步日曆事件（Delta Query）
- 完整同步日曆事件
- 獲取同步狀態
- 重置同步狀態
🔗 路由：
- POST /api/calendar/sync - 增量同步
- POST /api/calendar/sync/full - 完整同步
- GET /api/calendar/sync/status - 獲取同步狀態
-...
 * @module app/api/calendar/sync/route
 *
 * Calendar Sync API路由
 * 📋 功能說明：
 * - 增量同步日曆事件（Delta Query）
 * - 完整同步日曆事件
 * - 獲取同步狀態
 * - 重置同步狀態
 * 🔗 路由：
 * - POST /api/calendar/sync - 增量同步
 * - POST /api/calendar/sync/full - 完整同步
 * - GET /api/calendar/sync/status - 獲取同步狀態
 * - DELETE /api/calendar/sync - 重置同步狀態
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createCalendarSyncService, CalendarEvent } from '@/lib/calendar/calendar-sync-service';
import { MemoryTokenStore } from '@/lib/calendar/microsoft-graph-oauth';

// Token存儲實例（生產環境應使用數據庫存儲）
const tokenStore = new MemoryTokenStore();

// Calendar同步服務實例
const syncService = createCalendarSyncService(tokenStore);

/**
 * POST /api/calendar/sync
 * 增量同步日曆事件（使用Delta Query）
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 事件變更回調（可選：將變更保存到數據庫）
    const onEventChange = async (event: CalendarEvent, changeType: 'added' | 'updated' | 'deleted') => {
      // 這裡可以添加業務邏輯，例如：
      // - 保存事件到數據庫
      // - 發送通知
      // - 觸發工作流程
      console.log(`Event ${changeType}:`, event.id, event.subject);
    };

    // 執行增量同步
    const syncResult = await syncService.syncCalendarDelta(userId, onEventChange);

    return NextResponse.json({
      success: syncResult.success,
      eventsAdded: syncResult.eventsAdded,
      eventsUpdated: syncResult.eventsUpdated,
      eventsDeleted: syncResult.eventsDeleted,
      deltaToken: syncResult.deltaToken,
      errors: syncResult.errors
    });

  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: '日曆同步失敗' },
      { status: 500 }
    );
  }
}

/**
 * 完整同步路由處理器
 */
export async function PUT(request: NextRequest) {
  try {
    // 驗證JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 解析請求體
    const body = await request.json();
    const { daysAhead = 30, daysBehind = 7 } = body;

    // 執行完整同步
    const syncResult = await syncService.fullSyncCalendar(userId, daysAhead, daysBehind);

    return NextResponse.json({
      success: syncResult.success,
      eventsAdded: syncResult.eventsAdded,
      eventsUpdated: syncResult.eventsUpdated,
      eventsDeleted: syncResult.eventsDeleted
    });

  } catch (error) {
    console.error('Calendar full sync error:', error);
    return NextResponse.json(
      { error: '完整同步失敗' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync/status
 * 獲取同步狀態
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 獲取同步狀態
    const syncStatus = syncService.getSyncStatus(userId);

    return NextResponse.json({
      userId: syncStatus.userId,
      lastSyncAt: syncStatus.lastSyncAt,
      isSyncing: syncStatus.isSyncing,
      errorCount: syncStatus.errorCount,
      lastError: syncStatus.lastError,
      hasDeltaToken: !!syncStatus.deltaToken
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { error: '獲取同步狀態失敗' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/sync
 * 重置同步狀態（清除delta token）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 驗證JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 重置同步狀態
    syncService.resetSyncStatus(userId);

    return NextResponse.json({
      success: true,
      message: '同步狀態已重置'
    });

  } catch (error) {
    console.error('Reset sync status error:', error);
    return NextResponse.json(
      { error: '重置同步狀態失敗' },
      { status: 500 }
    );
  }
}
