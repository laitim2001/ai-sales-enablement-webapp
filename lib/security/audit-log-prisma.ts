/**
 * @fileoverview 審計日誌系統 - Prisma整合版本功能：- 使用Prisma ORM進行資料庫存儲- 完整的RBAC權限檢查審計- 不可篡改的審計追蹤- 合規報告生成- 自動日誌清理（保留期限）@author Claude Code@date 2025-10-07@epic Sprint 3 Week 8 - 審計日誌系統實施
 * @module lib/security/audit-log-prisma
 * @description
 * 審計日誌系統 - Prisma整合版本功能：- 使用Prisma ORM進行資料庫存儲- 完整的RBAC權限檢查審計- 不可篡改的審計追蹤- 合規報告生成- 自動日誌清理（保留期限）@author Claude Code@date 2025-10-07@epic Sprint 3 Week 8 - 審計日誌系統實施
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { PrismaClient, UserRole, AuditSeverity } from '@prisma/client';
import {
  AuditAction,
  AuditResource,
  AuditLogEntry,
  AuditLogQuery,
  AuditLogStats
} from './audit-log';

// 初始化Prisma客戶端 (使用單例模式)
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

/**
 * Prisma審計日誌記錄器
 */
export class AuditLoggerPrisma {
  /**
   * 記錄審計日誌到資料庫
   */
  static async log(params: {
    userId: number;
    userName?: string;
    userEmail?: string;
    userRole?: UserRole;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    severity?: AuditSeverity;
    success?: boolean;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    errorMessage?: string;
    requestId?: string;
    sessionId?: string;
  }): Promise<AuditLogEntry> {
    // 自動判定嚴重級別
    const severity = params.severity || this.determineSeverity(params.action, params.success !== false);

    // 創建審計日誌記錄
    const auditLog = await prisma.auditLog.create({
      data: {
        user_id: params.userId,
        user_name: params.userName,
        user_email: params.userEmail,
        user_role: params.userRole,
        entity_type: params.resource,
        entity_id: params.resourceId ? parseInt(params.resourceId) : null,
        action: params.action,
        severity: severity,
        success: params.success !== undefined ? params.success : true,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        error_message: params.errorMessage,
        request_id: params.requestId,
        session_id: params.sessionId,
        details: params.details || {},
      },
    });

    // 如果是關鍵操作，記錄警告
    if (severity === AuditSeverity.CRITICAL) {
      console.warn('[AUDIT] Critical action logged:', {
        id: auditLog.id,
        userId: auditLog.user_id,
        action: auditLog.action,
        resource: auditLog.entity_type,
      });
    }

    // 轉換為AuditLogEntry格式
    return {
      id: auditLog.id,
      timestamp: auditLog.created_at,
      userId: auditLog.user_id!,
      userName: auditLog.user_name || undefined,
      userEmail: auditLog.user_email || undefined,
      action: auditLog.action as AuditAction,
      resource: auditLog.entity_type as AuditResource,
      resourceId: auditLog.entity_id?.toString(),
      severity: auditLog.severity,
      success: auditLog.success,
      ipAddress: auditLog.ip_address || undefined,
      userAgent: auditLog.user_agent || undefined,
      details: auditLog.details as Record<string, any> || undefined,
      errorMessage: auditLog.error_message || undefined,
      requestId: auditLog.request_id || undefined,
      sessionId: auditLog.session_id || undefined,
    };
  }

  /**
   * 查詢審計日誌
   */
  static async query(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    const where: any = {};

    // 用戶過濾
    if (query.userId !== undefined) {
      where.user_id = query.userId;
    }

    // 操作過濾
    if (query.action !== undefined) {
      where.action = Array.isArray(query.action)
        ? { in: query.action }
        : query.action;
    }

    // 資源過濾
    if (query.resource !== undefined) {
      where.entity_type = Array.isArray(query.resource)
        ? { in: query.resource }
        : query.resource;
    }

    // 嚴重級別過濾
    if (query.severity !== undefined) {
      where.severity = Array.isArray(query.severity)
        ? { in: query.severity }
        : query.severity;
    }

    // 成功狀態過濾
    if (query.success !== undefined) {
      where.success = query.success;
    }

    // 時間範圍過濾
    if (query.startDate || query.endDate) {
      where.created_at = {};
      if (query.startDate) where.created_at.gte = query.startDate;
      if (query.endDate) where.created_at.lte = query.endDate;
    }

    // IP 地址過濾
    if (query.ipAddress) {
      where.ip_address = query.ipAddress;
    }

    // 資源 ID 過濾
    if (query.resourceId) {
      where.entity_id = parseInt(query.resourceId);
    }

    // 查詢資料庫
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      skip: query.offset || 0,
      take: query.limit || 100,
    });

    // 轉換為AuditLogEntry格式
    return logs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      userId: log.user_id!,
      userName: log.user_name || undefined,
      userEmail: log.user_email || undefined,
      action: log.action as AuditAction,
      resource: log.entity_type as AuditResource,
      resourceId: log.entity_id?.toString(),
      severity: log.severity,
      success: log.success,
      ipAddress: log.ip_address || undefined,
      userAgent: log.user_agent || undefined,
      details: log.details as Record<string, any> || undefined,
      errorMessage: log.error_message || undefined,
      requestId: log.request_id || undefined,
      sessionId: log.session_id || undefined,
    }));
  }

  /**
   * 獲取審計日誌統計
   */
  static async getStats(query?: AuditLogQuery): Promise<AuditLogStats> {
    const where: any = query ? this.buildWhereClause(query) : {};

    // 總日誌數
    const totalLogs = await prisma.auditLog.count({ where });

    // 按操作統計
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    });

    const logsByAction: Partial<Record<AuditAction, number>> = {};
    actionStats.forEach(stat => {
      logsByAction[stat.action as AuditAction] = stat._count;
    });

    // 按資源統計
    const resourceStats = await prisma.auditLog.groupBy({
      by: ['entity_type'],
      where,
      _count: true,
    });

    const logsByResource: Partial<Record<AuditResource, number>> = {};
    resourceStats.forEach(stat => {
      logsByResource[stat.entity_type as AuditResource] = stat._count;
    });

    // 按嚴重級別統計
    const severityStats = await prisma.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: true,
    });

    const logsBySeverity: Partial<Record<AuditSeverity, number>> = {};
    severityStats.forEach(stat => {
      logsBySeverity[stat.severity] = stat._count;
    });

    // 成功率
    const successCount = await prisma.auditLog.count({
      where: { ...where, success: true },
    });
    const successRate = totalLogs > 0 ? successCount / totalLogs : 0;

    // 頂級用戶
    const userStats = await prisma.auditLog.groupBy({
      by: ['user_id', 'user_name'],
      where: { ...where, user_id: { not: null } },
      _count: true,
      orderBy: {
        _count: {
          user_id: 'desc',
        },
      },
      take: 10,
    });

    const topUsers = userStats.map(stat => ({
      userId: stat.user_id!,
      userName: stat.user_name || `User ${stat.user_id}`,
      count: stat._count,
    }));

    // 頂級操作
    const topActionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    const topActions = topActionStats.map(stat => ({
      action: stat.action as AuditAction,
      count: stat._count,
    }));

    // 時間線（按天統計）
    const logs = await prisma.auditLog.findMany({
      where,
      select: {
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const dateCounts = new Map<string, number>();
    logs.forEach(log => {
      const date = log.created_at.toISOString().split('T')[0];
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    });

    const timeline = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs,
      logsByAction: logsByAction as Record<AuditAction, number>,
      logsByResource: logsByResource as Record<AuditResource, number>,
      logsBySeverity: logsBySeverity as Record<AuditSeverity, number>,
      successRate,
      topUsers,
      topActions,
      timeline,
    };
  }

  /**
   * 清理過期日誌
   */
  static async cleanup(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[AUDIT] Cleaned up ${result.count} expired audit logs (retention: ${retentionDays} days)`);
    return result.count;
  }

  /**
   * 根據操作和結果判定嚴重級別
   */
  private static determineSeverity(
    action: AuditAction,
    success: boolean
  ): AuditSeverity {
    // 失敗的操作提升嚴重級別
    if (!success) {
      switch (action) {
        case AuditAction.LOGIN_FAILED:
        case AuditAction.ACCESS_DENIED:
          return AuditSeverity.WARNING;
        case AuditAction.DELETE:
        case AuditAction.BULK_DELETE:
        case AuditAction.CONFIG_CHANGE:
          return AuditSeverity.ERROR;
        default:
          return AuditSeverity.WARNING;
      }
    }

    // 關鍵操作
    switch (action) {
      case AuditAction.ENCRYPTION_KEY_ROTATION:
      case AuditAction.SYSTEM_STOP:
      case AuditAction.PERMISSION_GRANT:
      case AuditAction.PERMISSION_REVOKE:
      case AuditAction.ROLE_CHANGE:
        return AuditSeverity.CRITICAL;

      case AuditAction.DELETE:
      case AuditAction.BULK_DELETE:
      case AuditAction.CONFIG_CHANGE:
      case AuditAction.BACKUP:
      case AuditAction.RESTORE:
      case AuditAction.SENSITIVE_DATA_ACCESS:
        return AuditSeverity.WARNING;

      default:
        return AuditSeverity.INFO;
    }
  }

  /**
   * 構建Prisma where子句
   */
  private static buildWhereClause(query: AuditLogQuery): any {
    const where: any = {};

    if (query.userId !== undefined) where.user_id = query.userId;
    if (query.action !== undefined) {
      where.action = Array.isArray(query.action)
        ? { in: query.action }
        : query.action;
    }
    if (query.resource !== undefined) {
      where.entity_type = Array.isArray(query.resource)
        ? { in: query.resource }
        : query.resource;
    }
    if (query.severity !== undefined) {
      where.severity = Array.isArray(query.severity)
        ? { in: query.severity }
        : query.severity;
    }
    if (query.success !== undefined) where.success = query.success;
    if (query.startDate || query.endDate) {
      where.created_at = {};
      if (query.startDate) where.created_at.gte = query.startDate;
      if (query.endDate) where.created_at.lte = query.endDate;
    }
    if (query.ipAddress) where.ip_address = query.ipAddress;
    if (query.resourceId) where.entity_id = parseInt(query.resourceId);

    return where;
  }
}

/**
 * 導出便利函數
 */
export const logAuditPrisma = AuditLoggerPrisma.log.bind(AuditLoggerPrisma);
export const queryAuditPrisma = AuditLoggerPrisma.query.bind(AuditLoggerPrisma);
export const getAuditStatsPrisma = AuditLoggerPrisma.getStats.bind(AuditLoggerPrisma);
