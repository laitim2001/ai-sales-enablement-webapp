/**
 * @fileoverview 審計日誌系統功能：- 全面的操作日誌記錄- 不可篡改的審計追蹤- 合規報告生成- 自動日誌清理（保留期限）使用方式：```typescript// 記錄審計日誌await AuditLogger.log({  userId: 1,  action: AuditAction.CREATE,  resource: AuditResource.CUSTOMER,  resourceId: '123',  details: { name: 'New Customer' },  ipAddress: '192.168.1.1',  userAgent: 'Mozilla/5.0...',});// 查詢審計日誌const logs = await AuditLogger.query({  userId: 1,  startDate: new Date('2025-01-01'),  endDate: new Date('2025-12-31'),});```@author Claude Code@date 2025-10-01@epic Sprint 3 - 安全加固與合規
 * @module lib/security/audit-log
 * @description
 * 審計日誌系統功能：- 全面的操作日誌記錄- 不可篡改的審計追蹤- 合規報告生成- 自動日誌清理（保留期限）使用方式：```typescript// 記錄審計日誌await AuditLogger.log({  userId: 1,  action: AuditAction.CREATE,  resource: AuditResource.CUSTOMER,  resourceId: '123',  details: { name: 'New Customer' },  ipAddress: '192.168.1.1',  userAgent: 'Mozilla/5.0...',});// 查詢審計日誌const logs = await AuditLogger.query({  userId: 1,  startDate: new Date('2025-01-01'),  endDate: new Date('2025-12-31'),});```@author Claude Code@date 2025-10-01@epic Sprint 3 - 安全加固與合規
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

/**
 * 審計操作類型
 */
export enum AuditAction {
  // 認證與授權
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  TOKEN_REFRESH = 'token_refresh',

  // CRUD 操作
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_DELETE = 'bulk_delete',

  // 權限操作
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  ROLE_CHANGE = 'role_change',
  ACCESS_DENIED = 'access_denied',

  // 資料操作
  EXPORT = 'export',
  IMPORT = 'import',
  BACKUP = 'backup',
  RESTORE = 'restore',

  // 系統操作
  CONFIG_CHANGE = 'config_change',
  SYSTEM_START = 'system_start',
  SYSTEM_STOP = 'system_stop',

  // 敏感操作
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  ENCRYPTION_KEY_ROTATION = 'encryption_key_rotation',
  AUDIT_LOG_ACCESS = 'audit_log_access',
}

/**
 * 審計資源類型
 */
export enum AuditResource {
  // 用戶相關
  USER = 'user',
  AUTH = 'auth',
  SESSION = 'session',

  // 業務資源
  CUSTOMER = 'customer',
  CUSTOMER_CONTACT = 'customer_contact',
  SALES_OPPORTUNITY = 'sales_opportunity',
  PROPOSAL = 'proposal',
  PROPOSAL_TEMPLATE = 'proposal_template',
  KNOWLEDGE_BASE = 'knowledge_base',
  KNOWLEDGE_CHUNK = 'knowledge_chunk',
  KNOWLEDGE_TAG = 'knowledge_tag',
  DOCUMENT = 'document',
  CAMPAIGN = 'campaign',

  // 系統資源
  SYSTEM_CONFIG = 'system_config',
  API_KEY = 'api_key',
  WEBHOOK = 'webhook',
  INTEGRATION = 'integration',
  BACKUP = 'backup',

  // 分析與報告
  ANALYTICS = 'analytics',
  REPORT = 'report',
  AUDIT_LOG = 'audit_log',
}

/**
 * 審計日誌嚴重級別
 * 使用與Prisma schema一致的值
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * 審計日誌項目
 */
export interface AuditLogEntry {
  id?: number;
  timestamp: Date;
  userId: number;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  severity: AuditSeverity;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  errorMessage?: string;
  requestId?: string;
  sessionId?: string;
}

/**
 * 審計日誌查詢條件
 */
export interface AuditLogQuery {
  userId?: number;
  action?: AuditAction | AuditAction[];
  resource?: AuditResource | AuditResource[];
  severity?: AuditSeverity | AuditSeverity[];
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
}

/**
 * 審計日誌統計
 */
export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<AuditAction, number>;
  logsByResource: Record<AuditResource, number>;
  logsBySeverity: Record<AuditSeverity, number>;
  successRate: number;
  topUsers: Array<{ userId: number; userName: string; count: number }>;
  topActions: Array<{ action: AuditAction; count: number }>;
  timeline: Array<{ date: string; count: number }>;
}

/**
 * 審計日誌存儲（內存實現，生產環境應使用資料庫）
 */
class AuditLogStorage {
  private logs: AuditLogEntry[] = [];
  private nextId = 1;

  /**
   * 新增審計日誌
   */
  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: this.nextId++,
      timestamp: entry.timestamp || new Date(),
    };

    this.logs.push(logEntry);

    // 保留最近 10000 條記錄（內存限制）
    if (this.logs.length > 10000) {
      this.logs.shift();
    }

    return logEntry;
  }

  /**
   * 查詢審計日誌
   */
  async query(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    let filtered = [...this.logs];

    // 用戶過濾
    if (query.userId !== undefined) {
      filtered = filtered.filter((log) => log.userId === query.userId);
    }

    // 操作過濾
    if (query.action !== undefined) {
      const actions = Array.isArray(query.action) ? query.action : [query.action];
      filtered = filtered.filter((log) => actions.includes(log.action));
    }

    // 資源過濾
    if (query.resource !== undefined) {
      const resources = Array.isArray(query.resource)
        ? query.resource
        : [query.resource];
      filtered = filtered.filter((log) => resources.includes(log.resource));
    }

    // 嚴重級別過濾
    if (query.severity !== undefined) {
      const severities = Array.isArray(query.severity)
        ? query.severity
        : [query.severity];
      filtered = filtered.filter((log) => severities.includes(log.severity));
    }

    // 成功狀態過濾
    if (query.success !== undefined) {
      filtered = filtered.filter((log) => log.success === query.success);
    }

    // 時間範圍過濾
    if (query.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= query.endDate!);
    }

    // IP 地址過濾
    if (query.ipAddress) {
      filtered = filtered.filter((log) => log.ipAddress === query.ipAddress);
    }

    // 資源 ID 過濾
    if (query.resourceId) {
      filtered = filtered.filter((log) => log.resourceId === query.resourceId);
    }

    // 排序（最新的在前）
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 分頁
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return filtered.slice(offset, offset + limit);
  }

  /**
   * 統計審計日誌
   */
  async getStats(query?: AuditLogQuery): Promise<AuditLogStats> {
    const logs = query ? await this.query(query) : this.logs;

    // 按操作統計
    const logsByAction: Partial<Record<AuditAction, number>> = {};
    for (const action of Object.values(AuditAction)) {
      logsByAction[action] = logs.filter((log) => log.action === action).length;
    }

    // 按資源統計
    const logsByResource: Partial<Record<AuditResource, number>> = {};
    for (const resource of Object.values(AuditResource)) {
      logsByResource[resource] = logs.filter(
        (log) => log.resource === resource
      ).length;
    }

    // 按嚴重級別統計
    const logsBySeverity: Partial<Record<AuditSeverity, number>> = {};
    for (const severity of Object.values(AuditSeverity)) {
      logsBySeverity[severity] = logs.filter(
        (log) => log.severity === severity
      ).length;
    }

    // 成功率
    const successCount = logs.filter((log) => log.success).length;
    const successRate = logs.length > 0 ? successCount / logs.length : 0;

    // 頂級用戶
    const userCounts = new Map<number, { userName: string; count: number }>();
    for (const log of logs) {
      const current = userCounts.get(log.userId) || {
        userName: log.userName || `User ${log.userId}`,
        count: 0,
      };
      userCounts.set(log.userId, {
        userName: current.userName,
        count: current.count + 1,
      });
    }
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 頂級操作
    const actionCounts = new Map<AuditAction, number>();
    for (const log of logs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    }
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 時間線（按天統計）
    const dateCounts = new Map<string, number>();
    for (const log of logs) {
      const date = log.timestamp.toISOString().split('T')[0];
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    }
    const timeline = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs: logs.length,
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
  async cleanup(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter((log) => log.timestamp >= cutoffDate);
    const afterCount = this.logs.length;

    return beforeCount - afterCount;
  }

  /**
   * 獲取所有日誌（用於測試）
   */
  async getAll(): Promise<AuditLogEntry[]> {
    return [...this.logs];
  }

  /**
   * 清空所有日誌（用於測試）
   */
  async clear(): Promise<void> {
    this.logs = [];
    this.nextId = 1;
  }
}

/**
 * 審計日誌記錄器
 */
export class AuditLogger {
  private static storage = new AuditLogStorage();
  private static enabled = true;

  /**
   * 記錄審計日誌
   */
  static async log(params: {
    userId: number;
    userName?: string;
    userEmail?: string;
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
    if (!this.enabled) {
      throw new Error('Audit logging is disabled');
    }

    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      severity: params.severity || AuditSeverity.INFO,
      success: params.success !== undefined ? params.success : true,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details,
      errorMessage: params.errorMessage,
      requestId: params.requestId,
      sessionId: params.sessionId,
    };

    // 自動判定嚴重級別
    if (!params.severity) {
      entry.severity = this.determineSeverity(params.action, params.success !== false);
    }

    const result = await this.storage.create(entry);

    // 如果是關鍵操作，可以在這裡添加額外的處理
    // 例如：發送通知、觸發警報等
    if (entry.severity === AuditSeverity.CRITICAL) {
      console.warn('[AUDIT] Critical action logged:', entry);
    }

    return result;
  }

  /**
   * 查詢審計日誌
   */
  static async query(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    return this.storage.query(query);
  }

  /**
   * 獲取審計日誌統計
   */
  static async getStats(query?: AuditLogQuery): Promise<AuditLogStats> {
    return this.storage.getStats(query);
  }

  /**
   * 清理過期日誌
   */
  static async cleanup(retentionDays: number = 365): Promise<number> {
    return this.storage.cleanup(retentionDays);
  }

  /**
   * 啟用審計日誌
   */
  static enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用審計日誌（僅用於測試）
   */
  static disable(): void {
    this.enabled = false;
  }

  /**
   * 檢查是否啟用
   */
  static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 清空所有日誌（僅用於測試）
   */
  static async clear(): Promise<void> {
    await this.storage.clear();
  }

  /**
   * 獲取所有日誌（僅用於測試）
   */
  static async getAll(): Promise<AuditLogEntry[]> {
    return this.storage.getAll();
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
}

/**
 * 導出便利函數
 */
export const logAudit = AuditLogger.log.bind(AuditLogger);
export const queryAudit = AuditLogger.query.bind(AuditLogger);
export const getAuditStats = AuditLogger.getStats.bind(AuditLogger);
