/**
 * 審計日誌查詢 API
 *
 * GET /api/audit-logs - 查詢審計日誌（需要ADMIN權限）
 *
 * Query Parameters:
 * - userId: 用戶ID過濾
 * - action: 操作類型過濾（支持數組）
 * - resource: 資源類型過濾（支持數組）
 * - severity: 嚴重級別過濾（支持數組）
 * - success: 成功狀態過濾（true/false）
 * - startDate: 開始日期（ISO 8601格式）
 * - endDate: 結束日期（ISO 8601格式）
 * - ipAddress: IP地址過濾
 * - limit: 返回數量限制（默認100，最大1000）
 * - offset: 分頁偏移量（默認0）
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 - 審計日誌系統實施
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/permission-middleware';
import { AuditLoggerPrisma } from '@/lib/security/audit-log-prisma';
import { AuditAction, AuditResource } from '@/lib/security/audit-log';
import { AuditSeverity } from '@prisma/client';

/**
 * GET /api/audit-logs
 * 查詢審計日誌（僅限ADMIN）
 */
export async function GET(request: NextRequest) {
  // 1. 驗證管理員權限
  const authResult = await requireAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // 2. 提取查詢參數
    const searchParams = request.nextUrl.searchParams;

    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const successParam = searchParams.get('success');
    const success = successParam ? successParam === 'true' : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const ipAddress = searchParams.get('ipAddress') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. 查詢審計日誌
    const logs = await AuditLoggerPrisma.query({
      userId,
      action: action as AuditAction | undefined,
      resource: resource as AuditResource | undefined,
      severity: severity as AuditSeverity | undefined,
      success,
      startDate,
      endDate,
      ipAddress,
      limit,
      offset,
    });

    // 4. 返回結果
    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          limit,
          offset,
          count: logs.length,
        },
      },
    });
  } catch (error) {
    console.error('[AuditLogAPI] Error querying audit logs:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: '查詢審計日誌時發生錯誤',
        code: 'AUDIT_LOG_QUERY_ERROR',
      },
      { status: 500 }
    );
  }
}
