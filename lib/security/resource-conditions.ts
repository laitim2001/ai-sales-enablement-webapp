/**
 * @fileoverview 資源級別權限細化服務基於資源狀態、屬性、關係等條件的細粒度訪問控制@module lib/security/resource-conditions
 * @module lib/security/resource-conditions
 * @description
 * 資源級別權限細化服務基於資源狀態、屬性、關係等條件的細粒度訪問控制@module lib/security/resource-conditions
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { UserRole, Resource, Action } from './rbac';

/**
 * 資源訪問條件類型
 */
export enum ResourceConditionType {
  /** 基於狀態的條件 (例如: 提案狀態) */
  STATUS = 'status',
  /** 基於屬性的條件 (例如: 地區、部門) */
  ATTRIBUTE = 'attribute',
  /** 基於關係的條件 (例如: 分配關係) */
  RELATIONSHIP = 'relationship',
  /** 基於時間的條件 (例如: 工作時間) */
  TIME = 'time',
  /** 自定義條件函數 */
  CUSTOM = 'custom',
}

/**
 * 條件操作符類型
 */
export type ConditionOperator =
  | 'equals' // 等於
  | 'notEquals' // 不等於
  | 'in' // 在集合中
  | 'notIn' // 不在集合中
  | 'contains' // 包含 (字符串)
  | 'gt' // 大於
  | 'lt' // 小於
  | 'gte' // 大於等於
  | 'lte'; // 小於等於

/**
 * 資源訪問條件定義
 */
export interface ResourceAccessCondition {
  /** 資源類型 */
  resource: Resource;
  /** 適用角色 */
  role: UserRole;
  /** 適用操作 */
  action: Action;
  /** 條件列表 (AND邏輯) */
  conditions: {
    type: ResourceConditionType;
    field: string;
    operator: ConditionOperator;
    value: any;
    description?: string;
  }[];
}

/**
 * 資源條件檢查結果
 */
export interface ConditionCheckResult {
  /** 是否允許訪問 */
  allowed: boolean;
  /** 拒絕原因 (當allowed為false時) */
  reason?: string;
}

/**
 * 資源條件配置表
 *
 * 定義了不同角色對不同資源和操作的額外訪問條件
 */
const RESOURCE_CONDITIONS: ResourceAccessCondition[] = [
  // ========================================
  // PROPOSALS (提案) 資源條件
  // ========================================

  // SALES_REP 只能編輯草稿或待審核狀態的提案
  {
    resource: Resource.PROPOSALS,
    role: UserRole.SALES_REP,
    action: Action.UPDATE,
    conditions: [
      {
        type: ResourceConditionType.STATUS,
        field: 'status',
        operator: 'in',
        value: ['DRAFT', 'PENDING_REVIEW'],
        description: 'SALES_REP只能編輯草稿或待審核狀態的提案',
      },
    ],
  },

  // SALES_REP 不能刪除已批准的提案
  {
    resource: Resource.PROPOSALS,
    role: UserRole.SALES_REP,
    action: Action.DELETE,
    conditions: [
      {
        type: ResourceConditionType.STATUS,
        field: 'status',
        operator: 'notEquals',
        value: 'APPROVED',
        description: 'SALES_REP不能刪除已批准的提案',
      },
    ],
  },

  // SALES_MANAGER 只能批准待審核狀態的提案
  {
    resource: Resource.PROPOSALS,
    role: UserRole.SALES_MANAGER,
    action: Action.APPROVE,
    conditions: [
      {
        type: ResourceConditionType.STATUS,
        field: 'status',
        operator: 'equals',
        value: 'PENDING_REVIEW',
        description: 'SALES_MANAGER只能批准待審核狀態的提案',
      },
    ],
  },

  // ========================================
  // CUSTOMERS (客戶) 資源條件
  // ========================================

  // SALES_REP 只能更新分配給自己的客戶
  {
    resource: Resource.CUSTOMERS,
    role: UserRole.SALES_REP,
    action: Action.UPDATE,
    conditions: [
      {
        type: ResourceConditionType.RELATIONSHIP,
        field: 'assignedUserId',
        operator: 'equals',
        value: '{{userId}}', // 動態值，運行時替換為當前用戶ID
        description: 'SALES_REP只能更新分配給自己的客戶',
      },
    ],
  },

  // SALES_REP 只能刪除分配給自己的客戶
  {
    resource: Resource.CUSTOMERS,
    role: UserRole.SALES_REP,
    action: Action.DELETE,
    conditions: [
      {
        type: ResourceConditionType.RELATIONSHIP,
        field: 'assignedUserId',
        operator: 'equals',
        value: '{{userId}}',
        description: 'SALES_REP只能刪除分配給自己的客戶',
      },
    ],
  },

  // ========================================
  // SALES_OPPORTUNITIES (銷售機會) 資源條件
  // ========================================

  // SALES_REP 只能更新分配給自己的銷售機會
  {
    resource: Resource.SALES_OPPORTUNITIES,
    role: UserRole.SALES_REP,
    action: Action.UPDATE,
    conditions: [
      {
        type: ResourceConditionType.RELATIONSHIP,
        field: 'ownerId',
        operator: 'equals',
        value: '{{userId}}',
        description: 'SALES_REP只能更新分配給自己的銷售機會',
      },
    ],
  },

  // SALES_REP 不能關閉已完成的銷售機會
  {
    resource: Resource.SALES_OPPORTUNITIES,
    role: UserRole.SALES_REP,
    action: Action.UPDATE,
    conditions: [
      {
        type: ResourceConditionType.STATUS,
        field: 'stage',
        operator: 'notIn',
        value: ['WON', 'LOST'],
        description: 'SALES_REP不能修改已完成的銷售機會',
      },
    ],
  },

  // ========================================
  // KNOWLEDGE_BASE (知識庫) 資源條件
  // ========================================

  // MARKETING 只能發布已審核的知識庫內容
  {
    resource: Resource.KNOWLEDGE_BASE,
    role: UserRole.MARKETING,
    action: Action.PUBLISH,
    conditions: [
      {
        type: ResourceConditionType.ATTRIBUTE,
        field: 'reviewStatus',
        operator: 'equals',
        value: 'REVIEWED',
        description: 'MARKETING只能發布已審核的內容',
      },
    ],
  },

  // SALES_REP 不能刪除已發布的知識庫內容
  {
    resource: Resource.KNOWLEDGE_BASE,
    role: UserRole.SALES_REP,
    action: Action.DELETE,
    conditions: [
      {
        type: ResourceConditionType.STATUS,
        field: 'status',
        operator: 'notEquals',
        value: 'PUBLISHED',
        description: 'SALES_REP不能刪除已發布的知識庫內容',
      },
    ],
  },

  // ========================================
  // TEMPLATES (模板) 資源條件
  // ========================================

  // MARKETING 只能發布自己創建的模板
  {
    resource: Resource.TEMPLATES,
    role: UserRole.MARKETING,
    action: Action.PUBLISH,
    conditions: [
      {
        type: ResourceConditionType.RELATIONSHIP,
        field: 'createdBy',
        operator: 'equals',
        value: '{{userId}}',
        description: 'MARKETING只能發布自己創建的模板',
      },
    ],
  },
];

/**
 * 資源級別條件驗證服務
 *
 * 提供基於資源狀態、屬性、關係等條件的細粒度訪問控制
 */
export class ResourceConditionService {
  /**
   * 檢查資源是否滿足訪問條件
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @param resourceData - 資源數據對象
   * @param userId - 當前用戶ID (用於動態值替換)
   * @returns 條件檢查結果
   *
   * @example
   * ```typescript
   * const proposal = { status: 'DRAFT', userId: 5 };
   * const result = await ResourceConditionService.checkConditions(
   *   UserRole.SALES_REP,
   *   Resource.PROPOSALS,
   *   Action.UPDATE,
   *   proposal,
   *   5
   * );
   * // result: { allowed: true }
   * ```
   */
  public static async checkConditions(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    resourceData: any,
    userId: number
  ): Promise<ConditionCheckResult> {
    // Null/undefined safety
    if (!resourceData || typeof resourceData !== 'object') {
      return {
        allowed: false,
        reason: '資源數據無效',
      };
    }

    // 查找匹配的條件配置
    const matchingConditions = RESOURCE_CONDITIONS.filter(
      (config) =>
        config.resource === resource &&
        config.role === userRole &&
        config.action === action
    );

    // 沒有額外條件限制，允許訪問
    if (matchingConditions.length === 0) {
      return { allowed: true };
    }

    // 檢查所有條件配置 (AND邏輯 - 所有配置都必須滿足)
    const failureReasons: string[] = [];

    for (const config of matchingConditions) {
      // 檢查配置內的所有條件 (AND邏輯 - 所有條件都必須滿足)
      for (const condition of config.conditions) {
        const fieldValue = resourceData[condition.field];
        let conditionValue = condition.value;

        // 替換動態值 (例如: {{userId}})
        if (typeof conditionValue === 'string' && conditionValue.startsWith('{{')) {
          const dynamicVar = conditionValue.slice(2, -2); // 移除 {{ }}
          if (dynamicVar === 'userId') {
            conditionValue = userId;
          }
        }

        // 根據操作符驗證條件
        const satisfied = this.evaluateCondition(
          fieldValue,
          condition.operator,
          conditionValue
        );

        if (!satisfied) {
          const failureReason =
            condition.description ||
            `條件不滿足: ${condition.field} ${condition.operator} ${conditionValue}`;
          failureReasons.push(failureReason);
          return {
            allowed: false,
            reason: failureReason,
          };
        }
      }
    }

    // 所有條件都滿足
    return { allowed: true };
  }

  /**
   * 評估單個條件
   *
   * @param fieldValue - 資源欄位值
   * @param operator - 條件操作符
   * @param conditionValue - 條件預期值
   * @returns 條件是否滿足
   */
  private static evaluateCondition(
    fieldValue: any,
    operator: ConditionOperator,
    conditionValue: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;

      case 'notEquals':
        return fieldValue !== conditionValue;

      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);

      case 'notIn':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);

      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof conditionValue === 'string' &&
          fieldValue.includes(conditionValue)
        );

      case 'gt':
        return fieldValue > conditionValue;

      case 'lt':
        return fieldValue < conditionValue;

      case 'gte':
        return fieldValue >= conditionValue;

      case 'lte':
        return fieldValue <= conditionValue;

      default:
        return false;
    }
  }

  /**
   * 獲取資源的所有訪問條件
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @returns 匹配的條件配置列表
   *
   * @example
   * ```typescript
   * const conditions = ResourceConditionService.getConditions(
   *   UserRole.SALES_REP,
   *   Resource.PROPOSALS,
   *   Action.UPDATE
   * );
   * // conditions: [{ resource, role, action, conditions: [...] }]
   * ```
   */
  public static getConditions(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): ResourceAccessCondition[] {
    return RESOURCE_CONDITIONS.filter(
      (config) =>
        config.resource === resource &&
        config.role === userRole &&
        config.action === action
    );
  }

  /**
   * 檢查特定角色對特定資源和操作是否有額外條件限制
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @returns 是否有額外條件限制
   *
   * @example
   * ```typescript
   * const hasConditions = ResourceConditionService.hasConditions(
   *   UserRole.SALES_REP,
   *   Resource.PROPOSALS,
   *   Action.UPDATE
   * );
   * // hasConditions: true
   * ```
   */
  public static hasConditions(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): boolean {
    return this.getConditions(userRole, resource, action).length > 0;
  }

  /**
   * 獲取所有資源條件配置 (主要用於測試和調試)
   *
   * @returns 完整的資源條件配置表
   */
  public static getAllConditions(): ResourceAccessCondition[] {
    return [...RESOURCE_CONDITIONS];
  }

  /**
   * 獲取特定資源的所有條件配置
   *
   * @param resource - 資源類型
   * @returns 該資源的所有條件配置
   */
  public static getResourceConditions(resource: Resource): ResourceAccessCondition[] {
    return RESOURCE_CONDITIONS.filter((config) => config.resource === resource);
  }

  /**
   * 獲取特定角色的所有條件配置
   *
   * @param userRole - 用戶角色
   * @returns 該角色的所有條件配置
   */
  public static getRoleConditions(userRole: UserRole): ResourceAccessCondition[] {
    return RESOURCE_CONDITIONS.filter((config) => config.role === userRole);
  }
}
