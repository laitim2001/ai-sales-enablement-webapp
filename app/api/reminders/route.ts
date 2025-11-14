/**
 * @fileoverview AI銷售賦能平台提醒API - 實現用戶提醒列表查詢和創建功能
 * @module app/api/reminders/route
 *
 * ## 功能說明
 * 提供用戶提醒的列表查詢和創建功能,支援狀態篩選和多種提醒類型。
 *
 * ## API規格
 * - **端點**: `GET /api/reminders` - 獲取用戶提醒列表
 *   - 查詢參數: status (可選,篩選狀態)
 *   - 響應: { reminders: [...], total: number }
 * - **端點**: `POST /api/reminders` - 創建新提醒
 *   - 請求: { type, resourceId, resourceTitle, scheduledFor?, options? }
 *   - 響應: { message, reminder: {...} }
 * - **狀態碼**: 200/201 (成功) | 400 (驗證錯誤) | 401 (未認證) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 提醒查詢 - 獲取用戶的提醒列表,支援狀態過濾
 * - 提醒創建 - 根據類型創建相應的提醒(會議、跟進、任務、提案)
 * - 類型支援 - MEETING_UPCOMING, FOLLOW_UP_DUE, TASK_OVERDUE, PROPOSAL_EXPIRING
 * - JWT認證 - Bearer Token驗證
 *
 * ## 相關文件
 * - `/lib/auth/token-service.ts` - JWT令牌驗證
 * - `/lib/prisma.ts` - Prisma數據庫客戶端
 * - `/lib/reminder.ts` - 提醒規則引擎和類型定義
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import prisma from '@/lib/prisma';
import {
  ReminderRuleEngine,
  ReminderType,
  ReminderStatus,
} from '@/lib/reminder';

/**
 * GET /api/reminders
 * 獲取用戶的提醒列表
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
    const statusParam = searchParams.get('status');
    const status = statusParam
      ? (statusParam.toUpperCase() as ReminderStatus)
      : undefined;

    // 創建提醒引擎實例
    const reminderEngine = new ReminderRuleEngine(prisma);

    // 獲取用戶的提醒
    const reminders = await reminderEngine.getUserReminders(
      payload.userId,
      status
    );

    return NextResponse.json({
      reminders,
      total: reminders.length,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reminders
 * 創建新提醒
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
    const { type, resourceId, resourceTitle, scheduledFor, options } = body;

    // 驗證必填字段
    if (!type || !resourceId || !resourceTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: type, resourceId, resourceTitle' },
        { status: 400 }
      );
    }

    // 創建提醒引擎實例
    const reminderEngine = new ReminderRuleEngine(prisma);

    let reminder;

    // 根據類型創建相應的提醒
    switch (type as ReminderType) {
      case ReminderType.MEETING_UPCOMING:
        if (!scheduledFor) {
          return NextResponse.json(
            { error: 'scheduledFor is required for meeting reminders' },
            { status: 400 }
          );
        }
        reminder = await reminderEngine.scheduleMeetingReminder(
          payload.userId,
          resourceId,
          resourceTitle,
          new Date(scheduledFor),
          options
        );
        break;

      case ReminderType.FOLLOW_UP_DUE:
      case ReminderType.TASK_OVERDUE:
        if (!scheduledFor) {
          return NextResponse.json(
            { error: 'scheduledFor is required for task reminders' },
            { status: 400 }
          );
        }
        reminder = await reminderEngine.scheduleFollowUpReminder(
          payload.userId,
          resourceId,
          resourceTitle,
          new Date(scheduledFor)
        );
        break;

      case ReminderType.PROPOSAL_EXPIRING:
        if (!scheduledFor) {
          return NextResponse.json(
            { error: 'scheduledFor is required for proposal reminders' },
            { status: 400 }
          );
        }
        reminder = await reminderEngine.scheduleProposalExpiryReminder(
          payload.userId,
          resourceId,
          resourceTitle,
          new Date(scheduledFor)
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported reminder type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        message: 'Reminder created successfully',
        reminder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
