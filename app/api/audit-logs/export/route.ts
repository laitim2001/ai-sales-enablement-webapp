/**
 * @fileoverview 審計日誌導出 APIPOST /api/audit-logs/export - 導出審計日誌為CSV或JSON（需要ADMIN權限）Request Body:{  "format": "csv" | "json",  // 導出格式  "filters": {                // 可選過濾條件    "userId": number,    "action": string | string[],    "resource": string | string[],    "severity": string | string[],    "success": boolean,    "startDate": string (ISO 8601),    "endDate": string (ISO 8601),    "ipAddress": string  }}@author Claude Code@date 2025-10-07@epic Sprint 3 Week 8 - 審計日誌系統實施
 * @module app/api/audit-logs/export/route
 * @description
 * 審計日誌導出 APIPOST /api/audit-logs/export - 導出審計日誌為CSV或JSON（需要ADMIN權限）Request Body:{  "format": "csv" | "json",  // 導出格式  "filters": {                // 可選過濾條件    "userId": number,    "action": string | string[],    "resource": string | string[],    "severity": string | string[],    "success": boolean,    "startDate": string (ISO 8601),    "endDate": string (ISO 8601),    "ipAddress": string  }}@author Claude Code@date 2025-10-07@epic Sprint 3 Week 8 - 審計日誌系統實施
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/permission-middleware';
import { AuditLoggerPrisma } from '@/lib/security/audit-log-prisma';
import { AuditAction, AuditResource, AuditLogEntry } from '@/lib/security/audit-log';
import { AuditSeverity } from '@prisma/client';

/**
 * POST /api/audit-logs/export
 * 導出審計日誌（僅限ADMIN）
 */
export async function POST(request: NextRequest) {
  // 1. 驗證管理員權限
  const authResult = await requireAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // 2. 解析請求體
    const body = await request.json();
    const { format = 'json', filters = {} } = body;

    // 3. 驗證導出格式
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: '不支持的導出格式',
          code: 'INVALID_EXPORT_FORMAT',
        },
        { status: 400 }
      );
    }

    // 4. 查詢審計日誌（最多導出10000條）
    const logs = await AuditLoggerPrisma.query({
      userId: filters.userId,
      action: filters.action as AuditAction | AuditAction[] | undefined,
      resource: filters.resource as AuditResource | AuditResource[] | undefined,
      severity: filters.severity as any, // Type assertion needed due to Prisma enum vs app enum
      success: filters.success,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      ipAddress: filters.ipAddress,
      limit: 10000, // 最多導出10000條
      offset: 0,
    });

    // 5. 根據格式生成導出文件
    if (format === 'csv') {
      const csv = convertToCSV(logs);
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // JSON format
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;

      return new NextResponse(JSON.stringify(logs, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('[AuditLogExportAPI] Error exporting audit logs:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: '導出審計日誌時發生錯誤',
        code: 'AUDIT_LOG_EXPORT_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * 將審計日誌轉換為CSV格式
 */
function convertToCSV(logs: AuditLogEntry[]): string {
  if (logs.length === 0) {
    return 'No data to export';
  }

  // CSV Header
  const headers = [
    'ID',
    'Timestamp',
    'User ID',
    'User Name',
    'User Email',
    'User Role',
    'Action',
    'Resource',
    'Resource ID',
    'Severity',
    'Success',
    'IP Address',
    'User Agent',
    'Error Message',
    'Request ID',
    'Session ID',
    'Details',
  ];

  // CSV Rows
  const rows = logs.map((log) => [
    log.id,
    log.timestamp.toISOString(),
    log.userId,
    log.userName || '',
    log.userEmail || '',
    log.userRole || '',
    log.action,
    log.resource,
    log.resourceId || '',
    log.severity,
    log.success,
    log.ipAddress || '',
    log.userAgent || '',
    log.errorMessage || '',
    log.requestId || '',
    log.sessionId || '',
    JSON.stringify(log.details || {}),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}
