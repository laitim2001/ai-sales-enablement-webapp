/**
 * 提醒API路由 - 單個提醒操作
 *
 * 功能：
 * - GET: 獲取單個提醒詳情
 * - DELETE: 忽略提醒
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import prisma from '@/lib/prisma';
import { ReminderRuleEngine } from '@/lib/reminder';

/**
 * GET /api/reminders/:id
 * 獲取單個提醒詳情
 */
export async function GET(
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
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 創建提醒引擎實例
    const reminderEngine = new ReminderRuleEngine(prisma);

    // 獲取用戶的所有提醒
    const reminders = await reminderEngine.getUserReminders(payload.userId);
    const reminder = reminders.find((r) => r.id === params.id);

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reminder });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reminders/:id
 * 忽略提醒
 */
export async function DELETE(
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
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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

    // 忽略提醒
    await reminderEngine.dismissReminder(params.id);

    return NextResponse.json({
      message: 'Reminder dismissed successfully',
    });
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss reminder' },
      { status: 500 }
    );
  }
}
