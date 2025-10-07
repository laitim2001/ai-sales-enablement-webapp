/**
 * @fileoverview 提醒API路由 - 列表和創建功能：- GET: 獲取用戶的提醒列表（支持狀態篩選）- POST: 創建新提醒作者：Claude Code日期：2025-10-05
 * @module app/api/reminders/route
 * @description
 * 提醒API路由 - 列表和創建功能：- GET: 獲取用戶的提醒列表（支持狀態篩選）- POST: 創建新提醒作者：Claude Code日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
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
