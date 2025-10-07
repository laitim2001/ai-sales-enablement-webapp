/**
 * @fileoverview 提醒延遲API路由功能：- PATCH: 延遲提醒（snooze）作者：Claude Code日期：2025-10-05
 * @module app/api/reminders/[id]/snooze/route
 * @description
 * 提醒延遲API路由功能：- PATCH: 延遲提醒（snooze）作者：Claude Code日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import prisma from '@/lib/prisma';
import { ReminderRuleEngine } from '@/lib/reminder';

/**
 * PATCH /api/reminders/:id/snooze
 * 延遲提醒
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { snoozeMinutes } = body;

    // 驗證必填字段
    if (!snoozeMinutes || typeof snoozeMinutes !== 'number') {
      return NextResponse.json(
        { error: 'snoozeMinutes is required and must be a number' },
        { status: 400 }
      );
    }

    // 驗證延遲時間範圍
    if (snoozeMinutes < 1 || snoozeMinutes > 1440) {
      return NextResponse.json(
        { error: 'snoozeMinutes must be between 1 and 1440 (24 hours)' },
        { status: 400 }
      );
    }

    // 創建提醒引擎實例
    const reminderEngine = new ReminderRuleEngine(prisma);

    // 驗證提醒屬於當前用戶
    const reminders = await reminderEngine.getUserReminders(payload.userId);
    const reminder = reminders.find((r) => r.id === params.id);

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found or access denied' },
        { status: 404 }
      );
    }

    // 延遲提醒
    const snoozedReminder = await reminderEngine.snoozeReminder(
      params.id,
      snoozeMinutes
    );

    return NextResponse.json({
      message: `Reminder snoozed for ${snoozeMinutes} minutes`,
      reminder: snoozedReminder,
    });
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    return NextResponse.json(
      { error: 'Failed to snooze reminder' },
      { status: 500 }
    );
  }
}
