/**
 * 統一的細粒度權限檢查入口
 *
 * 整合三層權限控制：欄位級別、資源級別、操作級別
 *
 * @module lib/security/fine-grained-permissions
 */

import { UserRole, Resource, Action } from './rbac';
import {
  FieldLevelPermissionService,
  FieldFilterResult,
} from './field-level-permissions';
import {
  ResourceConditionService,
  ConditionCheckResult,
} from './resource-conditions';
import {
  ActionRestrictionService,
  RestrictionCheckResult,
} from './action-restrictions';

/**
 * 細粒度權限檢查結果
 */
export interface FineGrainedPermissionResult {
  /** 是否允許操作 */
  allowed: boolean;
  /** 拒絕原因 (當allowed為false時) */
  reason?: string;
  /** 過濾後的數據 (當適用時) */
  filteredData?: any;
  /** 剩餘配額/次數 (當適用時) */
  remaining?: number;
  /** 限制詳情 (用於調試) */
  restrictionDetails?: {
    fieldRestriction?: boolean;
    resourceCondition?: boolean;
    actionRestriction?: boolean;
  };
}

/**
 * 細粒度權限檢查選項
 */
export interface PermissionCheckOptions {
  /** 是否應用欄位級別過濾 (默認: true) */
  applyFieldFilter?: boolean;
  /** 是否檢查資源條件 (默認: true) */
  checkResourceConditions?: boolean;
  /** 是否檢查操作限制 (默認: true) */
  checkActionRestrictions?: boolean;
  /** 是否返回詳細限制信息 (默認: false) */
  includeDetails?: boolean;
}

/**
 * 統一的細粒度權限服務
 *
 * 提供三層權限控制的統一入口
 */
export class FineGrainedPermissionService {
  /**
   * 檢查操作權限並處理數據
   *
   * 統一的權限檢查流程:
   * 1. 檢查操作限制 (rate limit, quota, field restriction, condition)
   * 2. 檢查資源條件 (status, attribute, relationship, time)
   * 3. 應用欄位級別過濾 (敏感欄位保護)
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @param userId - 當前用戶ID
   * @param data - 資源數據或批量資源數據
   * @param updateData - 更新數據 (用於UPDATE操作)
   * @param options - 權限檢查選項
   * @returns 權限檢查結果
   *
   * @example
   * ```typescript
   * // CREATE操作檢查
   * const createResult = await FineGrainedPermissionService.checkPermission(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   Action.CREATE,
   *   userId
   * );
   *
   * // UPDATE操作檢查
   * const updateResult = await FineGrainedPermissionService.checkPermission(
   *   UserRole.SALES_REP,
   *   Resource.PROPOSALS,
   *   Action.UPDATE,
   *   userId,
   *   proposalData,
   *   updateFields
   * );
   *
   * // READ操作檢查 (帶欄位過濾)
   * const readResult = await FineGrainedPermissionService.checkPermission(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   Action.READ,
   *   userId,
   *   customerData
   * );
   * console.log(readResult.filteredData); // 敏感欄位已被移除
   * ```
   */
  public static async checkPermission(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    userId: number,
    data?: any,
    updateData?: any,
    options: PermissionCheckOptions = {}
  ): Promise<FineGrainedPermissionResult> {
    const {
      applyFieldFilter = true,
      checkResourceConditions = true,
      checkActionRestrictions = true,
      includeDetails = false,
    } = options;

    const details = includeDetails
      ? {
          fieldRestriction: false,
          resourceCondition: false,
          actionRestriction: false,
        }
      : undefined;

    // Step 1: 檢查操作限制 (rate limit, quota, field restriction, condition)
    if (checkActionRestrictions) {
      const actionResult: RestrictionCheckResult =
        await ActionRestrictionService.checkRestrictions(
          userRole,
          resource,
          action,
          userId,
          data,
          updateData
        );

      if (!actionResult.allowed) {
        if (details) details.actionRestriction = true;
        return {
          allowed: false,
          reason: actionResult.reason,
          remaining: actionResult.remaining,
          restrictionDetails: details,
        };
      }

      // 如果操作限制通過，保存剩餘配額信息
      if (actionResult.remaining !== undefined) {
        return {
          allowed: true,
          remaining: actionResult.remaining,
          restrictionDetails: details,
        };
      }
    }

    // Step 2: 檢查資源條件 (適用於UPDATE和DELETE操作)
    if (
      checkResourceConditions &&
      data &&
      (action === Action.UPDATE || action === Action.DELETE)
    ) {
      const conditionResult: ConditionCheckResult =
        await ResourceConditionService.checkConditions(
          userRole,
          resource,
          action,
          data,
          userId
        );

      if (!conditionResult.allowed) {
        if (details) details.resourceCondition = true;
        return {
          allowed: false,
          reason: conditionResult.reason,
          restrictionDetails: details,
        };
      }
    }

    // Step 3: 應用欄位級別過濾 (適用於READ和LIST操作)
    if (
      applyFieldFilter &&
      data &&
      (action === Action.READ || action === Action.LIST)
    ) {
      // 批量數據過濾
      if (Array.isArray(data)) {
        const filteredData = FieldLevelPermissionService.filterFieldsBatch(
          resource,
          userRole,
          data
        );
        if (details) details.fieldRestriction = true;
        return {
          allowed: true,
          filteredData,
          restrictionDetails: details,
        };
      }

      // 單條數據過濾
      const filterResult: FieldFilterResult =
        FieldLevelPermissionService.filterFields(resource, userRole, data);

      if (filterResult.filteredData !== data) {
        if (details) details.fieldRestriction = true;
      }

      return {
        allowed: true,
        filteredData: filterResult.filteredData,
        restrictionDetails: details,
      };
    }

    // 所有檢查通過
    return {
      allowed: true,
      filteredData: data,
      restrictionDetails: details,
    };
  }

  /**
   * 批量檢查權限
   *
   * 用於批量操作場景，返回每個資源的權限檢查結果
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @param userId - 當前用戶ID
   * @param dataList - 資源數據列表
   * @param options - 權限檢查選項
   * @returns 批量權限檢查結果
   *
   * @example
   * ```typescript
   * const results = await FineGrainedPermissionService.checkPermissionBatch(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   Action.DELETE,
   *   userId,
   *   customersToDelete
   * );
   *
   * const allowedDeletions = results
   *   .filter(r => r.allowed)
   *   .map(r => r.filteredData);
   * ```
   */
  public static async checkPermissionBatch(
    userRole: UserRole,
    resource: Resource,
    action: Action,
    userId: number,
    dataList: any[],
    options: PermissionCheckOptions = {}
  ): Promise<FineGrainedPermissionResult[]> {
    const results: FineGrainedPermissionResult[] = [];

    for (const data of dataList) {
      const result = await this.checkPermission(
        userRole,
        resource,
        action,
        userId,
        data,
        undefined,
        options
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 檢查是否有任何細粒度限制
   *
   * 用於判斷是否需要執行細粒度權限檢查
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @returns 是否有細粒度限制
   *
   * @example
   * ```typescript
   * if (FineGrainedPermissionService.hasRestrictions(
   *   UserRole.SALES_REP,
   *   Resource.PROPOSALS,
   *   Action.UPDATE
   * )) {
   *   // 執行細粒度權限檢查
   *   const result = await FineGrainedPermissionService.checkPermission(...);
   * } else {
   *   // 直接允許操作
   * }
   * ```
   */
  public static hasRestrictions(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): boolean {
    // 檢查是否有欄位級別限制
    const hasFieldRestrictions =
      FieldLevelPermissionService.hasRestrictedFields(resource, userRole);

    // 檢查是否有資源條件限制
    const hasResourceConditions = ResourceConditionService.hasConditions(
      userRole,
      resource,
      action
    );

    // 檢查是否有操作限制
    const hasActionRestrictions = ActionRestrictionService.hasRestrictions(
      userRole,
      resource,
      action
    );

    return (
      hasFieldRestrictions || hasResourceConditions || hasActionRestrictions
    );
  }

  /**
   * 獲取細粒度限制摘要
   *
   * 用於調試和審計，返回特定角色、資源、操作的所有限制信息
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param action - 操作類型
   * @returns 限制摘要
   *
   * @example
   * ```typescript
   * const summary = FineGrainedPermissionService.getRestrictionSummary(
   *   UserRole.SALES_REP,
   *   Resource.PROPOSALS,
   *   Action.UPDATE
   * );
   * console.log(summary);
   * // {
   * //   fieldRestrictions: ['approvalNotes', 'cost', 'margin'],
   * //   resourceConditions: ['status must be DRAFT or PENDING_REVIEW'],
   * //   actionRestrictions: ['field restriction: allowed fields only']
   * // }
   * ```
   */
  public static getRestrictionSummary(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): {
    fieldRestrictions: string[];
    resourceConditions: string[];
    actionRestrictions: string[];
  } {
    const summary = {
      fieldRestrictions: [] as string[],
      resourceConditions: [] as string[],
      actionRestrictions: [] as string[],
    };

    // 獲取欄位級別限制
    const restrictedFields =
      FieldLevelPermissionService.getRestrictedFields(resource, userRole) ||
      [];
    summary.fieldRestrictions = restrictedFields.map(
      (field) => `${field.field} (${field.securityLevel})`
    );

    // 獲取資源條件限制
    const resourceConditions = ResourceConditionService.getConditions(
      userRole,
      resource,
      action
    );
    summary.resourceConditions = resourceConditions.flatMap((config) =>
      config.conditions.map(
        (cond) => cond.description || `${cond.field} ${cond.operator}`
      )
    );

    // 獲取操作限制
    const actionRestrictions = ActionRestrictionService.getRestrictions(
      userRole,
      resource,
      action
    );
    summary.actionRestrictions = actionRestrictions.flatMap((config) =>
      config.restrictions.map(
        (restriction) =>
          restriction.description || `${restriction.type} restriction`
      )
    );

    return summary;
  }
}
