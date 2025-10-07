/**
 * @fileoverview 操作級別權限限制服務提供CRUD操作的細粒度控制，包括速率限制、配額限制、欄位限制和條件限制@module lib/security/action-restrictions
 * @module lib/security/action-restrictions
 * @description
 * 操作級別權限限制服務提供CRUD操作的細粒度控制，包括速率限制、配額限制、欄位限制和條件限制@module lib/security/action-restrictions
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { UserRole, Resource, Action } from './rbac';

/**
 * 操作限制類型
 */
export enum ActionRestrictionType {
  /** 速率限制 - 時間窗口內的操作次數限制 */
  RATE_LIMIT = 'rate_limit',
  /** 配額限制 - 特定時期內的總操作次數限制 */
  QUOTA = 'quota',
  /** 欄位限制 - 限制可以修改的欄位 */
  FIELD_RESTRICTION = 'field',
  /** 條件限制 - 基於資源狀態的操作限制 */
  CONDITION = 'condition',
}

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /** 限制數量 */
  limit: number;
  /** 時間窗口 (例如: '1h', '1d', '1m') */
  window: string;
}

/**
 * 配額限制配置
 */
export interface QuotaConfig {
  /** 配額數量 */
  limit: number;
  /** 時期 (例如: '1day', '1week', '1month') */
  period: string;
}

/**
 * 欄位限制配置
 */
export interface FieldRestrictionConfig {
  /** 允許修改的欄位列表 */
  allowedFields?: string[];
  /** 禁止修改的欄位列表 */
  restrictedFields?: string[];
}

/**
 * 條件限制配置
 */
export interface ConditionRestrictionConfig {
  /** 要求特定欄位為空（例如：刪除前必須沒有關聯資料） */
  requireEmpty?: string[];
  /** 要求特定欄位滿足條件 */
  requireConditions?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'in' | 'notIn';
    value: any;
  }[];
}

/**
 * 操作限制配置
 */
export interface ActionRestriction {
  /** 資源類型 */
  resource: Resource;
  /** 操作類型 */
  action: Action;
  /** 適用角色 */
  role: UserRole;
  /** 限制列表 */
  restrictions: {
    type: ActionRestrictionType;
    config: RateLimitConfig | QuotaConfig | FieldRestrictionConfig | ConditionRestrictionConfig;
    description?: string;
  }[];
}

/**
 * 操作限制檢查結果
 */
export interface RestrictionCheckResult {
  /** 是否允許操作 */
  allowed: boolean;
  /** 拒絕原因 (當allowed為false時) */
  reason?: string;
  /** 剩餘配額/次數 (用於rate limit和quota) */
  remaining?: number;
}

/**
 * 操作限制配置表
 */
const ACTION_RESTRICTIONS: ActionRestriction[] = [
  // ========================================
  // CUSTOMERS (客戶) 操作限制
  // ========================================

  // SALES_REP 創建客戶的速率限制
  {
    resource: Resource.CUSTOMERS,
    action: Action.CREATE,
    role: UserRole.SALES_REP,
    restrictions: [
      {
        type: ActionRestrictionType.RATE_LIMIT,
        config: {
          limit: 20,
          window: '1h', // 1小時內最多創建20個客戶
        } as RateLimitConfig,
        description: 'SALES_REP每小時最多創建20個客戶',
      },
    ],
  },

  // SALES_REP 刪除客戶需要滿足條件
  {
    resource: Resource.CUSTOMERS,
    action: Action.DELETE,
    role: UserRole.SALES_REP,
    restrictions: [
      {
        type: ActionRestrictionType.CONDITION,
        config: {
          requireEmpty: ['proposals', 'opportunities'],
        } as ConditionRestrictionConfig,
        description: 'SALES_REP只能刪除沒有相關業務的客戶',
      },
    ],
  },

  // ========================================
  // PROPOSALS (提案) 操作限制
  // ========================================

  // SALES_REP 更新提案時只能修改特定欄位
  {
    resource: Resource.PROPOSALS,
    action: Action.UPDATE,
    role: UserRole.SALES_REP,
    restrictions: [
      {
        type: ActionRestrictionType.FIELD_RESTRICTION,
        config: {
          allowedFields: ['title', 'description', 'content', 'status'],
          restrictedFields: ['approvalNotes', 'cost', 'margin'],
        } as FieldRestrictionConfig,
        description: 'SALES_REP只能更新部分欄位',
      },
    ],
  },

  // SALES_REP 創建提案的速率限制
  {
    resource: Resource.PROPOSALS,
    action: Action.CREATE,
    role: UserRole.SALES_REP,
    restrictions: [
      {
        type: ActionRestrictionType.RATE_LIMIT,
        config: {
          limit: 10,
          window: '1h',
        } as RateLimitConfig,
        description: 'SALES_REP每小時最多創建10個提案',
      },
    ],
  },

  // ========================================
  // KNOWLEDGE_BASE (知識庫) 操作限制
  // ========================================

  // MARKETING 每月創建知識庫的配額限制
  {
    resource: Resource.KNOWLEDGE_BASE,
    action: Action.CREATE,
    role: UserRole.MARKETING,
    restrictions: [
      {
        type: ActionRestrictionType.QUOTA,
        config: {
          limit: 50,
          period: '1month',
        } as QuotaConfig,
        description: 'MARKETING每月最多創建50篇知識庫文章',
      },
    ],
  },

  // SALES_REP 創建知識庫的速率限制
  {
    resource: Resource.KNOWLEDGE_BASE,
    action: Action.CREATE,
    role: UserRole.SALES_REP,
    restrictions: [
      {
        type: ActionRestrictionType.RATE_LIMIT,
        config: {
          limit: 5,
          window: '1d',
        } as RateLimitConfig,
        description: 'SALES_REP每天最多創建5篇知識庫文章',
      },
    ],
  },

  // ========================================
  // TEMPLATES (模板) 操作限制
  // ========================================

  // MARKETING 更新模板時可以修改所有欄位
  {
    resource: Resource.TEMPLATES,
    action: Action.UPDATE,
    role: UserRole.MARKETING,
    restrictions: [
      {
        type: ActionRestrictionType.FIELD_RESTRICTION,
        config: {
          allowedFields: ['name', 'description', 'content', 'category', 'tags', 'isPublic'],
        } as FieldRestrictionConfig,
        description: 'MARKETING可以更新模板的所有主要欄位',
      },
    ],
  },

  // ========================================
  // SALES_OPPORTUNITIES (銷售機會) 操作限制
  // ========================================

  // SALES_REP 創建銷售機會的速率限制
  {
    resource: Resource.SALES_OPPORTUNITIES,
    action: Action.CREATE,
    role: UserRole.SALES_REP,
    restrictions: [
      {
        type: ActionRestrictionType.RATE_LIMIT,
        config: {
          limit: 15,
          window: '1h',
        } as RateLimitConfig,
        description: 'SALES_REP每小時最多創建15個銷售機會',
      },
    ],
  },
];

/**
 * 內存操作計數器 (生產環境應使用Redis或資料庫)
 */
interface OperationCounter {
  count: number;
  windowStart: number;
}

const operationCounters = new Map<string, OperationCounter>();

/**
 * 操作限制驗證服務
 *
 * 提供CRUD操作的細粒度控制
 */
export class ActionRestrictionService {
  /**
   * 檢查操作是否滿足所有限制
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @param userId - 當前用戶ID
   * @param resourceData - 資源數據 (用於條件檢查)
   * @param updateData - 更新數據 (用於欄位限制檢查)
   * @returns 限制檢查結果
   *
   * @example
   * ```typescript
   * const result = await ActionRestrictionService.checkRestrictions(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   Action.CREATE,
   *   5
   * );
   * if (!result.allowed) {
   *   console.log(result.reason); // "已超過速率限制"
   * }
   * ```
   */
  public static async checkRestrictions(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    userId: number,
    resourceData?: any,
    updateData?: any
  ): Promise<RestrictionCheckResult> {
    // 查找匹配的限制配置
    const matchingRestrictions = ACTION_RESTRICTIONS.filter(
      (config) =>
        config.resource === resource &&
        config.role === userRole &&
        config.action === action
    );

    // 沒有限制配置，允許操作
    if (matchingRestrictions.length === 0) {
      return { allowed: true };
    }

    // 檢查所有限制配置 (所有限制都必須滿足)
    let finalRemaining: number | undefined;

    for (const config of matchingRestrictions) {
      for (const restriction of config.restrictions) {
        let result: RestrictionCheckResult;

        switch (restriction.type) {
          case ActionRestrictionType.RATE_LIMIT:
            result = await this.checkRateLimit(
              userRole,
              resource,
              action,
              userId,
              restriction.config as RateLimitConfig
            );
            break;

          case ActionRestrictionType.QUOTA:
            result = await this.checkQuota(
              userRole,
              resource,
              action,
              userId,
              restriction.config as QuotaConfig
            );
            break;

          case ActionRestrictionType.FIELD_RESTRICTION:
            result = this.checkFieldRestriction(
              updateData,
              restriction.config as FieldRestrictionConfig
            );
            break;

          case ActionRestrictionType.CONDITION:
            result = this.checkConditionRestriction(
              resourceData,
              restriction.config as ConditionRestrictionConfig
            );
            break;

          default:
            result = { allowed: true };
        }

        if (!result.allowed) {
          return {
            allowed: false,
            reason: result.reason || restriction.description,
            remaining: result.remaining,
          };
        }

        // Track remaining for rate limits/quotas
        if (result.remaining !== undefined) {
          finalRemaining = result.remaining;
        }
      }
    }

    return { allowed: true, remaining: finalRemaining };
  }

  /**
   * 檢查速率限制
   */
  private static async checkRateLimit(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    userId: number,
    config: RateLimitConfig
  ): Promise<RestrictionCheckResult> {
    const key = `${userRole}:${resource}:${action}:${userId}`;
    const windowMs = this.parseTimeWindow(config.window);
    const now = Date.now();

    let counter = operationCounters.get(key);

    if (!counter || now - counter.windowStart > windowMs) {
      // 新窗口開始
      counter = {
        count: 1,
        windowStart: now,
      };
      operationCounters.set(key, counter);
      return { allowed: true, remaining: config.limit - 1 };
    }

    if (counter.count >= config.limit) {
      const resetIn = Math.ceil((counter.windowStart + windowMs - now) / 1000);
      return {
        allowed: false,
        reason: `已超過速率限制 (${config.limit}次/${config.window})，請在${resetIn}秒後重試`,
        remaining: 0,
      };
    }

    counter.count++;
    return { allowed: true, remaining: config.limit - counter.count };
  }

  /**
   * 檢查配額限制
   */
  private static async checkQuota(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    userId: number,
    config: QuotaConfig
  ): Promise<RestrictionCheckResult> {
    // 簡化實現：使用與rate limit類似的邏輯
    // 生產環境應該查詢資料庫統計實際操作次數
    const key = `quota:${userRole}:${resource}:${action}:${userId}`;
    const periodMs = this.parseTimePeriod(config.period);
    const now = Date.now();

    let counter = operationCounters.get(key);

    if (!counter || now - counter.windowStart > periodMs) {
      // 新週期開始
      counter = {
        count: 1,
        windowStart: now,
      };
      operationCounters.set(key, counter);
      return { allowed: true, remaining: config.limit - 1 };
    }

    if (counter.count >= config.limit) {
      return {
        allowed: false,
        reason: `已超過配額限制 (${config.limit}次/${config.period})`,
        remaining: 0,
      };
    }

    counter.count++;
    return { allowed: true, remaining: config.limit - counter.count };
  }

  /**
   * 檢查欄位限制
   */
  private static checkFieldRestriction(
    updateData: any,
    config: FieldRestrictionConfig
  ): RestrictionCheckResult {
    if (!updateData || typeof updateData !== 'object') {
      return { allowed: true };
    }

    const updateFields = Object.keys(updateData);

    // 檢查禁止修改的欄位
    if (config.restrictedFields && config.restrictedFields.length > 0) {
      const violatedFields = updateFields.filter((field) =>
        config.restrictedFields!.includes(field)
      );

      if (violatedFields.length > 0) {
        return {
          allowed: false,
          reason: `無權修改以下欄位: ${violatedFields.join(', ')}`,
        };
      }
    }

    // 檢查允許修改的欄位
    if (config.allowedFields && config.allowedFields.length > 0) {
      const violatedFields = updateFields.filter(
        (field) => !config.allowedFields!.includes(field)
      );

      if (violatedFields.length > 0) {
        return {
          allowed: false,
          reason: `無權修改以下欄位: ${violatedFields.join(', ')}`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 檢查條件限制
   */
  private static checkConditionRestriction(
    resourceData: any,
    config: ConditionRestrictionConfig
  ): RestrictionCheckResult {
    if (!resourceData || typeof resourceData !== 'object') {
      return {
        allowed: false,
        reason: '資源數據無效',
      };
    }

    // 檢查要求為空的欄位
    if (config.requireEmpty && config.requireEmpty.length > 0) {
      for (const field of config.requireEmpty) {
        const value = resourceData[field];
        if (value !== null && value !== undefined && value !== '' &&
            !(Array.isArray(value) && value.length === 0)) {
          return {
            allowed: false,
            reason: `欄位 '${field}' 必須為空才能執行此操作`,
          };
        }
      }
    }

    // 檢查條件要求
    if (config.requireConditions && config.requireConditions.length > 0) {
      for (const condition of config.requireConditions) {
        const fieldValue = resourceData[condition.field];
        let satisfied = false;

        switch (condition.operator) {
          case 'equals':
            satisfied = fieldValue === condition.value;
            break;
          case 'notEquals':
            satisfied = fieldValue !== condition.value;
            break;
          case 'in':
            satisfied = Array.isArray(condition.value) && condition.value.includes(fieldValue);
            break;
          case 'notIn':
            satisfied = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
            break;
        }

        if (!satisfied) {
          return {
            allowed: false,
            reason: `條件不滿足: ${condition.field} ${condition.operator} ${condition.value}`,
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * 解析時間窗口字符串 (例如: '1h' -> 3600000ms)
   */
  private static parseTimeWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time window format: ${window}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid time unit: ${unit}`);
    }
  }

  /**
   * 解析時期字符串 (例如: '1month' -> 30天的毫秒數)
   */
  private static parseTimePeriod(period: string): number {
    const match = period.match(/^(\d+)(day|week|month)$/);
    if (!match) {
      throw new Error(`Invalid time period format: ${period}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'day':
        return value * 24 * 60 * 60 * 1000;
      case 'week':
        return value * 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return value * 30 * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid period unit: ${unit}`);
    }
  }

  /**
   * 獲取特定操作的所有限制
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @returns 匹配的限制配置列表
   */
  public static getRestrictions(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): ActionRestriction[] {
    return ACTION_RESTRICTIONS.filter(
      (config) =>
        config.resource === resource &&
        config.role === userRole &&
        config.action === action
    );
  }

  /**
   * 檢查特定角色對特定資源和操作是否有限制
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @returns 是否有限制
   */
  public static hasRestrictions(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): boolean {
    return this.getRestrictions(userRole, resource, action).length > 0;
  }

  /**
   * 獲取所有操作限制配置 (用於測試和調試)
   *
   * @returns 完整的操作限制配置表
   */
  public static getAllRestrictions(): ActionRestriction[] {
    return [...ACTION_RESTRICTIONS];
  }

  /**
   * 獲取特定資源的所有限制
   *
   * @param resource - 資源類型
   * @returns 該資源的所有限制配置
   */
  public static getResourceRestrictions(resource: Resource): ActionRestriction[] {
    return ACTION_RESTRICTIONS.filter((config) => config.resource === resource);
  }

  /**
   * 獲取特定角色的所有限制
   *
   * @param userRole - 用戶角色
   * @returns 該角色的所有限制配置
   */
  public static getRoleRestrictions(userRole: UserRole): ActionRestriction[] {
    return ACTION_RESTRICTIONS.filter((config) => config.role === userRole);
  }

  /**
   * 清除操作計數器 (用於測試)
   */
  public static clearCounters(): void {
    operationCounters.clear();
  }

  /**
   * 獲取當前計數器狀態 (用於測試和調試)
   */
  public static getCounterStatus(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    userId: number,
    type: 'rate' | 'quota' = 'rate'
  ): { count: number; limit: number; remaining: number } | null {
    const key = type === 'quota'
      ? `quota:${userRole}:${resource}:${action}:${userId}`
      : `${userRole}:${resource}:${action}:${userId}`;

    const counter = operationCounters.get(key);
    if (!counter) return null;

    const restrictions = this.getRestrictions(userRole, resource, action);
    if (restrictions.length === 0) return null;

    const restriction = restrictions[0].restrictions.find(
      (r) => r.type === (type === 'quota' ? ActionRestrictionType.QUOTA : ActionRestrictionType.RATE_LIMIT)
    );

    if (!restriction) return null;

    const config = restriction.config as RateLimitConfig | QuotaConfig;
    const limit = config.limit;

    return {
      count: counter.count,
      limit,
      remaining: Math.max(0, limit - counter.count),
    };
  }
}
