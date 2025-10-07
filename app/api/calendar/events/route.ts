/**
 * @fileoverview Calendar Events API路由📋 功能說明：- 獲取日曆事件列表- 創建新日曆事件- 同步日曆事件🔗 路由：- GET /api/calendar/events - 獲取事件列表- POST /api/calendar/events - 創建新事件作者：Claude Code日期：2025-10-05Sprint：Sprint 7 Phase 3
 * @module app/api/calendar/events/route
 * @description
 * Calendar Events API路由📋 功能說明：- 獲取日曆事件列表- 創建新日曆事件- 同步日曆事件🔗 路由：- GET /api/calendar/events - 獲取事件列表- POST /api/calendar/events - 創建新事件作者：Claude Code日期：2025-10-05Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createCalendarSyncService } from '@/lib/calendar/calendar-sync-service';
import { MemoryTokenStore } from '@/lib/calendar/microsoft-graph-oauth';

// Token存儲實例（生產環境應使用數據庫存儲）
const tokenStore = new MemoryTokenStore();

// Calendar同步服務實例
const syncService = createCalendarSyncService(tokenStore);

/**
 * GET /api/calendar/events
 * 獲取日曆事件列表
 *
 * Query參數：
 * - startDateTime: 開始時間（可選）
 * - endDateTime: 結束時間（可選）
 * - top: 返回數量限制（默認50）
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

    // 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const startDateTimeStr = searchParams.get('startDateTime');
    const endDateTimeStr = searchParams.get('endDateTime');
    const top = parseInt(searchParams.get('top') || '50');

    const startDateTime = startDateTimeStr ? new Date(startDateTimeStr) : undefined;
    const endDateTime = endDateTimeStr ? new Date(endDateTimeStr) : undefined;

    // 獲取日曆事件
    const events = await syncService.getCalendarEvents(
      userId,
      startDateTime,
      endDateTime,
      top
    );

    return NextResponse.json({
      events,
      count: events.length
    });

  } catch (error) {
    console.error('Get calendar events error:', error);
    return NextResponse.json(
      { error: '獲取日曆事件失敗' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/events
 * 創建新日曆事件
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

    // 解析請求體
    const body = await request.json();
    const { subject, start, end, location, body: eventBody, attendees, isOnlineMeeting } = body;

    // 驗證必需字段
    if (!subject || !start || !end) {
      return NextResponse.json(
        { error: '缺少必需字段：subject, start, end' },
        { status: 400 }
      );
    }

    // 創建事件對象
    const event = {
      subject,
      start,
      end,
      location,
      body: eventBody,
      attendees,
      isOnlineMeeting
    };

    // 創建日曆事件
    const createdEvent = await syncService.createCalendarEvent(userId, event);

    return NextResponse.json({
      success: true,
      event: createdEvent
    });

  } catch (error) {
    console.error('Create calendar event error:', error);
    return NextResponse.json(
      { error: '創建日曆事件失敗' },
      { status: 500 }
    );
  }
}
