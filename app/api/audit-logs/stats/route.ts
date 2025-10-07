/**
 * @fileoverview 審計日誌統計 APIGET /api/audit-logs/stats - 獲取審計日誌統計（需要ADMIN權限）Query Parameters:- startDate: 開始日期（ISO 8601格式）- endDate: 結束日期（ISO 8601格式）- userId: 用戶ID過濾- action: 操作類型過濾- resource: 資源類型過濾@author Claude Code@date 2025-10-07@epic Sprint 3 Week 8 - 審計日誌系統實施
 * @module app/api/audit-logs/stats/route
 * @description
 * 審計日誌統計 APIGET /api/audit-logs/stats - 獲取審計日誌統計（需要ADMIN權限）Query Parameters:- startDate: 開始日期（ISO 8601格式）- endDate: 結束日期（ISO 8601格式）- userId: 用戶ID過濾- action: 操作類型過濾- resource: 資源類型過濾@author Claude Code@date 2025-10-07@epic Sprint 3 Week 8 - 審計日誌系統實施
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/permission-middleware';
import { AuditLoggerPrisma } from '@/lib/security/audit-log-prisma';
import { AuditAction, AuditResource } from '@/lib/security/audit-log';

/**
 * GET /api/audit-logs/stats
 * 獲取審計日誌統計（僅限ADMIN）
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
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // 3. 獲取統計數據
    const stats = await AuditLoggerPrisma.getStats({
      userId,
      action: action as AuditAction | undefined,
      resource: resource as AuditResource | undefined,
      startDate,
      endDate,
    });

    // 4. 返回結果
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[AuditLogStatsAPI] Error getting audit log stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: '獲取審計日誌統計時發生錯誤',
        code: 'AUDIT_LOG_STATS_ERROR',
      },
      { status: 500 }
    );
  }
}
