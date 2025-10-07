/**
 * 欄位級別權限控制服務 (Field-Level Permissions)
 *
 * 功能：
 * - 控制不同角色對資源敏感欄位的訪問
 * - 自動過濾API響應中的敏感欄位
 * - 支持單個對象和數組批量過濾
 * - 提供欄位訪問查詢功能
 *
 * 使用場景：
 * - SALES_REP 不能查看客戶的 revenue (營收) 欄位
 * - VIEWER 不能查看提案的 cost (成本) 和 margin (利潤率) 欄位
 * - ADMIN 可以查看所有欄位
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 9 - 細粒度權限控制擴展
 */

import { Resource, UserRole } from './rbac';

/**
 * 欄位敏感級別枚舉
 */
export enum FieldSensitivityLevel {
  PUBLIC = 'public',             // 公開欄位 (所有角色可見)
  INTERNAL = 'internal',         // 內部欄位 (員工可見)
  CONFIDENTIAL = 'confidential', // 機密欄位 (管理層可見)
  RESTRICTED = 'restricted',     // 限制欄位 (僅ADMIN可見)
}

/**
 * 敏感欄位定義接口
 */
export interface SensitiveField {
  fieldName: string;
  sensitivity: FieldSensitivityLevel;
  allowedRoles: UserRole[];
  description?: string;
}

/**
 * 資源敏感欄位配置接口
 */
export interface SensitiveFieldConfig {
  resource: Resource;
  fields: SensitiveField[];
}

/**
 * 敏感欄位配置表
 *
 * 定義各資源類型的敏感欄位及其訪問權限
 */
const SENSITIVE_FIELDS: SensitiveFieldConfig[] = [
  /**
   * 客戶資源敏感欄位 (CUSTOMERS)
   */
  {
    resource: Resource.CUSTOMERS,
    fields: [
      {
        fieldName: 'email',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_REP],
        description: '客戶聯絡郵箱'
      },
      {
        fieldName: 'phone',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_REP],
        description: '客戶聯絡電話'
      },
      {
        fieldName: 'revenue',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '客戶年營收'
      },
      {
        fieldName: 'creditScore',
        sensitivity: FieldSensitivityLevel.RESTRICTED,
        allowedRoles: [UserRole.ADMIN],
        description: '信用評分'
      },
      {
        fieldName: 'internalNotes',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '內部評估備註'
      },
      {
        fieldName: 'paymentTerms',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '付款條款'
      },
    ],
  },

  /**
   * 提案資源敏感欄位 (PROPOSALS)
   */
  {
    resource: Resource.PROPOSALS,
    fields: [
      {
        fieldName: 'cost',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '成本估算'
      },
      {
        fieldName: 'margin',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '利潤率'
      },
      {
        fieldName: 'discount',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '折扣金額'
      },
      {
        fieldName: 'approvalNotes',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_REP],
        description: '審批意見'
      },
      {
        fieldName: 'internalCost',
        sensitivity: FieldSensitivityLevel.RESTRICTED,
        allowedRoles: [UserRole.ADMIN],
        description: '內部成本'
      },
    ],
  },

  /**
   * 用戶資源敏感欄位 (USERS)
   */
  {
    resource: Resource.USERS,
    fields: [
      {
        fieldName: 'email',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '用戶郵箱'
      },
      {
        fieldName: 'phone',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '用戶電話'
      },
      {
        fieldName: 'salary',
        sensitivity: FieldSensitivityLevel.RESTRICTED,
        allowedRoles: [UserRole.ADMIN],
        description: '薪資信息'
      },
      {
        fieldName: 'performance',
        sensitivity: FieldSensitivityLevel.RESTRICTED,
        allowedRoles: [UserRole.ADMIN],
        description: '績效評估'
      },
      {
        fieldName: 'password',
        sensitivity: FieldSensitivityLevel.RESTRICTED,
        allowedRoles: [], // 任何人都不能直接訪問密碼欄位
        description: '密碼（永不返回）'
      },
    ],
  },

  /**
   * 銷售機會敏感欄位 (SALES_OPPORTUNITIES)
   */
  {
    resource: Resource.SALES_OPPORTUNITIES,
    fields: [
      {
        fieldName: 'expectedRevenue',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '預期營收'
      },
      {
        fieldName: 'probability',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_REP],
        description: '成交概率'
      },
      {
        fieldName: 'competitorInfo',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '競爭對手信息'
      },
      {
        fieldName: 'dealStructure',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '交易結構'
      },
    ],
  },

  /**
   * 客戶聯絡人敏感欄位 (CUSTOMER_CONTACTS)
   */
  {
    resource: Resource.CUSTOMER_CONTACTS,
    fields: [
      {
        fieldName: 'email',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_REP],
        description: '聯絡人郵箱'
      },
      {
        fieldName: 'phone',
        sensitivity: FieldSensitivityLevel.INTERNAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_REP],
        description: '聯絡人電話'
      },
      {
        fieldName: 'personalNotes',
        sensitivity: FieldSensitivityLevel.CONFIDENTIAL,
        allowedRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
        description: '個人備註'
      },
    ],
  },
];

/**
 * 欄位級別權限控制服務
 */
export class FieldLevelPermissionService {
  /**
   * 檢查用戶是否可以訪問特定欄位
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param fieldName - 欄位名稱
   * @returns 是否有權限訪問該欄位
   *
   * @example
   * ```typescript
   * const canAccess = FieldLevelPermissionService.canAccessField(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   'revenue'
   * );
   * // 返回 false - SALES_REP 不能訪問 revenue 欄位
   * ```
   */
  public static canAccessField(
    userRole: UserRole,
    resource: Resource,
    fieldName: string
  ): boolean {
    // 查找資源的欄位配置
    const resourceConfig = SENSITIVE_FIELDS.find(
      (config) => config.resource === resource
    );

    if (!resourceConfig) {
      // 未配置的資源，默認允許訪問所有欄位
      return true;
    }

    // 查找欄位配置
    const fieldConfig = resourceConfig.fields.find(
      (field) => field.fieldName === fieldName
    );

    if (!fieldConfig) {
      // 未配置的欄位，默認允許訪問
      return true;
    }

    // 檢查角色是否在允許列表中
    return fieldConfig.allowedRoles.includes(userRole);
  }

  /**
   * 過濾對象中用戶無權訪問的欄位
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param data - 原始數據對象
   * @returns 過濾後的數據對象
   *
   * @example
   * ```typescript
   * const customer = {
   *   id: 1,
   *   name: 'Acme Corp',
   *   email: 'contact@acme.com',
   *   revenue: 1000000,
   *   creditScore: 750
   * };
   *
   * const filtered = FieldLevelPermissionService.filterFields(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   customer
   * );
   * // 返回: { id: 1, name: 'Acme Corp', email: 'contact@acme.com' }
   * // revenue 和 creditScore 被過濾掉
   * ```
   */
  public static filterFields<T extends Record<string, any>>(
    userRole: UserRole,
    resource: Resource,
    data: T
  ): Partial<T> {
    // Handle null/undefined input
    if (!data || typeof data !== 'object') {
      return {};
    }

    const filteredData: Partial<T> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.canAccessField(userRole, resource, key)) {
        filteredData[key as keyof T] = value;
      }
    }

    return filteredData;
  }

  /**
   * 批量過濾數組中的敏感欄位
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @param dataArray - 原始數據數組
   * @returns 過濾後的數據數組
   *
   * @example
   * ```typescript
   * const customers = [
   *   { id: 1, name: 'Acme', revenue: 1000000 },
   *   { id: 2, name: 'Tech Inc', revenue: 2000000 }
   * ];
   *
   * const filtered = FieldLevelPermissionService.filterFieldsArray(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS,
   *   customers
   * );
   * // 返回: [{ id: 1, name: 'Acme' }, { id: 2, name: 'Tech Inc' }]
   * ```
   */
  public static filterFieldsArray<T extends Record<string, any>>(
    userRole: UserRole,
    resource: Resource,
    dataArray: T[]
  ): Partial<T>[] {
    // Handle null/undefined input
    if (!dataArray || !Array.isArray(dataArray)) {
      return [];
    }

    return dataArray.map((data) => this.filterFields(userRole, resource, data));
  }

  /**
   * 獲取用戶可訪問的欄位列表
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @returns 可訪問的欄位名稱數組
   *
   * @example
   * ```typescript
   * const accessibleFields = FieldLevelPermissionService.getAccessibleFields(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS
   * );
   * // 返回: ['email', 'phone']
   * ```
   */
  public static getAccessibleFields(
    userRole: UserRole,
    resource: Resource
  ): string[] {
    const resourceConfig = SENSITIVE_FIELDS.find(
      (config) => config.resource === resource
    );

    if (!resourceConfig) {
      return []; // 返回空表示所有欄位都可訪問
    }

    return resourceConfig.fields
      .filter((field) => field.allowedRoles.includes(userRole))
      .map((field) => field.fieldName);
  }

  /**
   * 獲取用戶被限制訪問的欄位列表
   *
   * @param userRole - 用戶角色
   * @param resource - 資源類型
   * @returns 被限制的欄位名稱數組
   *
   * @example
   * ```typescript
   * const restrictedFields = FieldLevelPermissionService.getRestrictedFields(
   *   UserRole.SALES_REP,
   *   Resource.CUSTOMERS
   * );
   * // 返回: ['revenue', 'creditScore', 'internalNotes', 'paymentTerms']
   * ```
   */
  public static getRestrictedFields(
    userRole: UserRole,
    resource: Resource
  ): string[] {
    const resourceConfig = SENSITIVE_FIELDS.find(
      (config) => config.resource === resource
    );

    if (!resourceConfig) {
      return [];
    }

    return resourceConfig.fields
      .filter((field) => !field.allowedRoles.includes(userRole))
      .map((field) => field.fieldName);
  }

  /**
   * 獲取資源的所有敏感欄位配置
   *
   * @param resource - 資源類型
   * @returns 資源的敏感欄位配置，如果未配置則返回 undefined
   */
  public static getResourceFieldConfig(
    resource: Resource
  ): SensitiveFieldConfig | undefined {
    return SENSITIVE_FIELDS.find((config) => config.resource === resource);
  }

  /**
   * 獲取欄位的敏感級別
   *
   * @param resource - 資源類型
   * @param fieldName - 欄位名稱
   * @returns 欄位的敏感級別，如果未配置則返回 PUBLIC
   */
  public static getFieldSensitivity(
    resource: Resource,
    fieldName: string
  ): FieldSensitivityLevel {
    const resourceConfig = SENSITIVE_FIELDS.find(
      (config) => config.resource === resource
    );

    if (!resourceConfig) {
      return FieldSensitivityLevel.PUBLIC;
    }

    const fieldConfig = resourceConfig.fields.find(
      (field) => field.fieldName === fieldName
    );

    if (!fieldConfig) {
      return FieldSensitivityLevel.PUBLIC;
    }

    return fieldConfig.sensitivity;
  }

  /**
   * 檢查欄位是否為敏感欄位
   *
   * @param resource - 資源類型
   * @param fieldName - 欄位名稱
   * @returns 是否為敏感欄位
   */
  public static isSensitiveField(resource: Resource, fieldName: string): boolean {
    const resourceConfig = SENSITIVE_FIELDS.find(
      (config) => config.resource === resource
    );

    if (!resourceConfig) {
      return false;
    }

    return resourceConfig.fields.some((field) => field.fieldName === fieldName);
  }
}

/**
 * API響應數據過濾輔助函數
 *
 * 用於在API路由中自動過濾敏感欄位
 *
 * @param userRole - 用戶角色
 * @param resource - 資源類型
 * @param data - 響應數據（單個對象或數組）
 * @returns 過濾後的數據
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requirePermission(request, {
 *     resource: Resource.CUSTOMERS,
 *     action: Action.LIST,
 *   });
 *
 *   if (!authResult.authorized) {
 *     return authResult.response;
 *   }
 *
 *   const customers = await prisma.customer.findMany();
 *
 *   // 根據用戶角色過濾敏感欄位
 *   const filteredCustomers = filterResponseFields(
 *     authResult.user!.role as UserRole,
 *     Resource.CUSTOMERS,
 *     customers
 *   );
 *
 *   return NextResponse.json({ data: filteredCustomers });
 * }
 * ```
 */
export function filterResponseFields(
  userRole: UserRole,
  resource: Resource,
  data: any
): any {
  if (Array.isArray(data)) {
    return FieldLevelPermissionService.filterFieldsArray(userRole, resource, data);
  } else if (typeof data === 'object' && data !== null) {
    return FieldLevelPermissionService.filterFields(userRole, resource, data);
  }

  return data;
}

/**
 * 導出便利函數
 */
export const {
  canAccessField,
  filterFields,
  filterFieldsArray,
  getAccessibleFields,
  getRestrictedFields,
  getResourceFieldConfig,
  getFieldSensitivity,
  isSensitiveField,
} = FieldLevelPermissionService;

/**
 * 導出欄位級別權限服務為默認
 */
export default FieldLevelPermissionService;
