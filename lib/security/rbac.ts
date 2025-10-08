/**
 * @fileoverview RBAC (Role-Based Access Control) 角色權限系統功能：- 定義角色和權限映射- 權限檢查和驗證- 資源級別訪問控制- 操作級別權限控制（CRUD）權限模型：- 角色 (Role): 用戶的職能角色（ADMIN, SALES_MANAGER, SALES_REP, MARKETING, VIEWER）- 資源 (Resource): 系統資源（customers, proposals, knowledge_base等）- 操作 (Action): 對資源的操作（create, read, update, delete）- 權限 (Permission): 角色對資源執行操作的許可設計原則：- 最小權限原則（Principle of Least Privilege）- 職責分離原則（Separation of Duties）- 易於擴展和維護@author Claude Code@date 2025-10-01@epic Sprint 3 - 安全加固與合規
 * @module lib/security/rbac
 * @description
 * RBAC (Role-Based Access Control) 角色權限系統功能：- 定義角色和權限映射- 權限檢查和驗證- 資源級別訪問控制- 操作級別權限控制（CRUD）權限模型：- 角色 (Role): 用戶的職能角色（ADMIN, SALES_MANAGER, SALES_REP, MARKETING, VIEWER）- 資源 (Resource): 系統資源（customers, proposals, knowledge_base等）- 操作 (Action): 對資源的操作（create, read, update, delete）- 權限 (Permission): 角色對資源執行操作的許可設計原則：- 最小權限原則（Principle of Least Privilege）- 職責分離原則（Separation of Duties）- 易於擴展和維護@author Claude Code@date 2025-10-01@epic Sprint 3 - 安全加固與合規
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

/**
 * 系統資源枚舉
 */
export enum Resource {
  // 客戶管理
  CUSTOMERS = 'customers',
  CUSTOMER_CONTACTS = 'customer_contacts',
  SALES_OPPORTUNITIES = 'sales_opportunities',

  // 提案管理
  PROPOSALS = 'proposals',
  PROPOSAL_TEMPLATES = 'proposal_templates',
  TEMPLATES = 'proposal_templates', // Alias for PROPOSAL_TEMPLATES
  PROPOSAL_GENERATIONS = 'proposal_generations',

  // 知識庫
  KNOWLEDGE_BASE = 'knowledge_base',
  KNOWLEDGE_CHUNKS = 'knowledge_chunks',
  KNOWLEDGE_TAGS = 'knowledge_tags',

  // 文檔管理
  DOCUMENTS = 'documents',
  CALL_RECORDS = 'call_records',
  INTERACTIONS = 'interactions',

  // 系統管理
  USERS = 'users',
  ROLES = 'roles',
  API_KEYS = 'api_keys',
  AUDIT_LOGS = 'audit_logs',
  SYSTEM_CONFIGS = 'system_configs',

  // AI 功能
  AI_GENERATION_CONFIGS = 'ai_generation_configs',
  AI_ANALYSES = 'ai_analyses',

  // 監控和分析
  ANALYTICS = 'analytics',
  MONITORING = 'monitoring',
  REPORTS = 'reports',
}

/**
 * 操作枚舉（CRUD + 特殊操作）
 */
export enum Action {
  // 基本 CRUD 操作
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',

  // 特殊操作
  LIST = 'list',            // 列表查看
  SEARCH = 'search',        // 搜索
  EXPORT = 'export',        // 導出
  IMPORT = 'import',        // 導入
  APPROVE = 'approve',      // 審批
  PUBLISH = 'publish',      // 發布
  ARCHIVE = 'archive',      // 歸檔
  RESTORE = 'restore',      // 恢復
  ASSIGN = 'assign',        // 分配
  MANAGE = 'manage',        // 管理（完整控制）
}

/**
 * 用戶角色枚舉（與 Prisma UserRole 同步）
 */
export enum UserRole {
  ADMIN = 'ADMIN',                    // 系統管理員
  SALES_MANAGER = 'SALES_MANAGER',    // 銷售經理
  SALES_REP = 'SALES_REP',            // 銷售代表
  MARKETING = 'MARKETING',            // 行銷人員
  VIEWER = 'VIEWER',                  // 訪客/只讀用戶
}

/**
 * 權限定義類型
 */
type Permission = {
  resource: Resource;
  actions: Action[];
};

/**
 * 角色權限映射表
 *
 * 設計理念：
 * - ADMIN: 完全訪問權限（系統管理）
 * - SALES_MANAGER: 銷售團隊管理權限（查看所有，管理團隊）
 * - SALES_REP: 銷售執行權限（管理自己的客戶和提案）
 * - MARKETING: 行銷內容管理權限（知識庫、範本）
 * - VIEWER: 只讀權限（僅查看）
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  /**
   * 系統管理員 - 完全訪問權限
   */
  [UserRole.ADMIN]: [
    // 所有資源的完整權限
    { resource: Resource.CUSTOMERS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.SEARCH, Action.EXPORT, Action.IMPORT, Action.ASSIGN] },
    { resource: Resource.CUSTOMER_CONTACTS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST] },
    { resource: Resource.SALES_OPPORTUNITIES, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.ASSIGN] },
    { resource: Resource.PROPOSALS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.APPROVE, Action.EXPORT] },
    { resource: Resource.PROPOSAL_TEMPLATES, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.PUBLISH] },
    { resource: Resource.PROPOSAL_GENERATIONS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.DELETE, Action.LIST] },
    { resource: Resource.KNOWLEDGE_BASE, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.SEARCH, Action.IMPORT, Action.EXPORT, Action.ARCHIVE, Action.RESTORE] },
    { resource: Resource.KNOWLEDGE_CHUNKS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
    { resource: Resource.KNOWLEDGE_TAGS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST] },
    { resource: Resource.DOCUMENTS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.EXPORT] },
    { resource: Resource.CALL_RECORDS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.EXPORT] },
    { resource: Resource.INTERACTIONS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.DELETE, Action.LIST] },
    { resource: Resource.USERS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST] },
    { resource: Resource.ROLES, actions: [Action.MANAGE, Action.READ, Action.UPDATE, Action.LIST] },
    { resource: Resource.API_KEYS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.DELETE, Action.LIST] },
    { resource: Resource.AUDIT_LOGS, actions: [Action.MANAGE, Action.READ, Action.LIST, Action.SEARCH, Action.EXPORT] },
    { resource: Resource.SYSTEM_CONFIGS, actions: [Action.MANAGE, Action.READ, Action.UPDATE, Action.LIST] },
    { resource: Resource.AI_GENERATION_CONFIGS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST] },
    { resource: Resource.AI_ANALYSES, actions: [Action.MANAGE, Action.READ, Action.LIST, Action.EXPORT] },
    { resource: Resource.ANALYTICS, actions: [Action.MANAGE, Action.READ, Action.EXPORT] },
    { resource: Resource.MONITORING, actions: [Action.MANAGE, Action.READ] },
    { resource: Resource.REPORTS, actions: [Action.MANAGE, Action.CREATE, Action.READ, Action.EXPORT] },
  ],

  /**
   * 銷售經理 - 團隊管理和監督權限
   */
  [UserRole.SALES_MANAGER]: [
    // 客戶和機會：完整訪問（包括團隊成員的資料）
    { resource: Resource.CUSTOMERS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.SEARCH, Action.EXPORT, Action.ASSIGN] },
    { resource: Resource.CUSTOMER_CONTACTS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST] },
    { resource: Resource.SALES_OPPORTUNITIES, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.ASSIGN] },

    // 提案：審批和管理權限
    { resource: Resource.PROPOSALS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.APPROVE, Action.EXPORT] },
    { resource: Resource.PROPOSAL_TEMPLATES, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST, Action.PUBLISH] },
    { resource: Resource.PROPOSAL_GENERATIONS, actions: [Action.CREATE, Action.READ, Action.LIST] },

    // 知識庫：讀取和搜索
    { resource: Resource.KNOWLEDGE_BASE, actions: [Action.READ, Action.LIST, Action.SEARCH, Action.EXPORT] },
    { resource: Resource.KNOWLEDGE_TAGS, actions: [Action.READ, Action.LIST] },

    // 文檔和記錄：完整訪問
    { resource: Resource.DOCUMENTS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.EXPORT] },
    { resource: Resource.CALL_RECORDS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.EXPORT] },
    { resource: Resource.INTERACTIONS, actions: [Action.CREATE, Action.READ, Action.LIST] },

    // 團隊成員：讀取權限
    { resource: Resource.USERS, actions: [Action.READ, Action.LIST] },

    // AI 配置：讀取和創建
    { resource: Resource.AI_GENERATION_CONFIGS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },

    // 分析和報告：完整訪問
    { resource: Resource.ANALYTICS, actions: [Action.READ, Action.EXPORT] },
    { resource: Resource.REPORTS, actions: [Action.CREATE, Action.READ, Action.EXPORT] },
  ],

  /**
   * 銷售代表 - 個人業務執行權限
   */
  [UserRole.SALES_REP]: [
    // 客戶和機會：僅自己負責的
    { resource: Resource.CUSTOMERS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST, Action.SEARCH] },
    { resource: Resource.CUSTOMER_CONTACTS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },
    { resource: Resource.SALES_OPPORTUNITIES, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },

    // 提案：創建和編輯自己的
    { resource: Resource.PROPOSALS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST, Action.EXPORT] },
    { resource: Resource.PROPOSAL_TEMPLATES, actions: [Action.READ, Action.LIST] },
    { resource: Resource.PROPOSAL_GENERATIONS, actions: [Action.CREATE, Action.READ, Action.LIST] },

    // 知識庫：可創建、讀取和搜索（允許銷售代表分享經驗和最佳實踐）
    { resource: Resource.KNOWLEDGE_BASE, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST, Action.SEARCH, Action.IMPORT] },
    { resource: Resource.KNOWLEDGE_TAGS, actions: [Action.CREATE, Action.READ, Action.LIST] },
    { resource: Resource.KNOWLEDGE_CHUNKS, actions: [Action.CREATE, Action.READ] },

    // 文檔和記錄：個人記錄
    { resource: Resource.DOCUMENTS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },
    { resource: Resource.CALL_RECORDS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },
    { resource: Resource.INTERACTIONS, actions: [Action.CREATE, Action.READ, Action.LIST] },

    // AI 配置：個人配置
    { resource: Resource.AI_GENERATION_CONFIGS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },

    // 分析：僅個人數據
    { resource: Resource.ANALYTICS, actions: [Action.READ] },
  ],

  /**
   * 行銷人員 - 內容管理權限
   */
  [UserRole.MARKETING]: [
    // 客戶：只讀訪問
    { resource: Resource.CUSTOMERS, actions: [Action.READ, Action.LIST, Action.SEARCH] },
    { resource: Resource.CUSTOMER_CONTACTS, actions: [Action.READ, Action.LIST] },

    // 提案範本：完整管理
    { resource: Resource.PROPOSAL_TEMPLATES, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.PUBLISH] },

    // 知識庫：完整管理
    { resource: Resource.KNOWLEDGE_BASE, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST, Action.SEARCH, Action.IMPORT, Action.EXPORT, Action.ARCHIVE] },
    { resource: Resource.KNOWLEDGE_CHUNKS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
    { resource: Resource.KNOWLEDGE_TAGS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST] },

    // 文檔：內容管理
    { resource: Resource.DOCUMENTS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST, Action.EXPORT] },

    // AI 配置：內容生成配置
    { resource: Resource.AI_GENERATION_CONFIGS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.LIST] },

    // 分析：內容效果分析
    { resource: Resource.ANALYTICS, actions: [Action.READ] },
  ],

  /**
   * 訪客 - 只讀權限
   */
  [UserRole.VIEWER]: [
    // 客戶：僅查看
    { resource: Resource.CUSTOMERS, actions: [Action.READ, Action.LIST, Action.SEARCH] },
    { resource: Resource.CUSTOMER_CONTACTS, actions: [Action.READ, Action.LIST] },
    { resource: Resource.SALES_OPPORTUNITIES, actions: [Action.READ, Action.LIST] },

    // 提案：僅查看
    { resource: Resource.PROPOSALS, actions: [Action.READ, Action.LIST] },
    { resource: Resource.PROPOSAL_TEMPLATES, actions: [Action.READ, Action.LIST] },

    // 知識庫：搜索和查看
    { resource: Resource.KNOWLEDGE_BASE, actions: [Action.READ, Action.LIST, Action.SEARCH] },
    { resource: Resource.KNOWLEDGE_TAGS, actions: [Action.READ, Action.LIST] },

    // 文檔：僅查看
    { resource: Resource.DOCUMENTS, actions: [Action.READ, Action.LIST] },

    // 分析：僅查看
    { resource: Resource.ANALYTICS, actions: [Action.READ] },
  ],
};

/**
 * RBAC 服務類
 */
export class RBACService {
  /**
   * 檢查用戶是否有權限執行特定操作
   *
   * @param userRole - 用戶角色
   * @param resource - 資源
   * @param action - 操作
   * @returns 是否有權限
   */
  public static hasPermission(
    userRole: UserRole,
    resource: Resource,
    action: Action
  ): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];

    if (!rolePermissions) {
      return false;
    }

    const resourcePermission = rolePermissions.find(
      (p) => p.resource === resource
    );

    if (!resourcePermission) {
      return false;
    }

    // MANAGE 權限包含所有操作
    if (resourcePermission.actions.includes(Action.MANAGE)) {
      return true;
    }

    return resourcePermission.actions.includes(action);
  }

  /**
   * 檢查用戶是否有任意一個權限
   *
   * @param userRole - 用戶角色
   * @param resource - 資源
   * @param actions - 操作列表
   * @returns 是否有任意一個權限
   */
  public static hasAnyPermission(
    userRole: UserRole,
    resource: Resource,
    actions: Action[]
  ): boolean {
    return actions.some((action) =>
      this.hasPermission(userRole, resource, action)
    );
  }

  /**
   * 檢查用戶是否有所有權限
   *
   * @param userRole - 用戶角色
   * @param resource - 資源
   * @param actions - 操作列表
   * @returns 是否有所有權限
   */
  public static hasAllPermissions(
    userRole: UserRole,
    resource: Resource,
    actions: Action[]
  ): boolean {
    return actions.every((action) =>
      this.hasPermission(userRole, resource, action)
    );
  }

  /**
   * 獲取用戶對特定資源的所有權限
   *
   * @param userRole - 用戶角色
   * @param resource - 資源
   * @returns 權限操作列表
   */
  public static getResourcePermissions(
    userRole: UserRole,
    resource: Resource
  ): Action[] {
    const rolePermissions = ROLE_PERMISSIONS[userRole];

    if (!rolePermissions) {
      return [];
    }

    const resourcePermission = rolePermissions.find(
      (p) => p.resource === resource
    );

    if (!resourcePermission) {
      return [];
    }

    return resourcePermission.actions;
  }

  /**
   * 獲取用戶的所有權限
   *
   * @param userRole - 用戶角色
   * @returns 權限列表
   */
  public static getAllPermissions(userRole: UserRole): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * 檢查用戶是否是管理員
   *
   * @param userRole - 用戶角色
   * @returns 是否是管理員
   */
  public static isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  /**
   * 檢查用戶是否是銷售經理
   *
   * @param userRole - 用戶角色
   * @returns 是否是銷售經理
   */
  public static isSalesManager(userRole: UserRole): boolean {
    return userRole === UserRole.SALES_MANAGER;
  }

  /**
   * 檢查用戶是否有管理權限（管理員或銷售經理）
   *
   * @param userRole - 用戶角色
   * @returns 是否有管理權限
   */
  public static hasManagementRole(userRole: UserRole): boolean {
    return this.isAdmin(userRole) || this.isSalesManager(userRole);
  }

  /**
   * 驗證資源擁有權（用於檢查用戶是否可以訪問特定資源）
   *
   * 規則：
   * - 管理員可以訪問所有資源
   * - 銷售經理可以訪問團隊資源
   * - 其他角色只能訪問自己創建的資源
   *
   * @param userRole - 用戶角色
   * @param userId - 當前用戶 ID
   * @param resourceOwnerId - 資源擁有者 ID
   * @returns 是否擁有資源
   */
  public static ownsResource(
    userRole: UserRole,
    userId: number,
    resourceOwnerId: number
  ): boolean {
    // 管理員可以訪問所有資源
    if (this.isAdmin(userRole)) {
      return true;
    }

    // 銷售經理可以訪問團隊資源（需要額外的團隊檢查邏輯）
    // 這裡簡化為可以訪問
    if (this.isSalesManager(userRole)) {
      return true;
    }

    // 其他角色只能訪問自己的資源
    return userId === resourceOwnerId;
  }

  /**
   * 生成權限矩陣（用於調試和文檔）
   *
   * @returns 權限矩陣
   */
  public static generatePermissionMatrix(): Record<string, Record<string, string[]>> {
    const matrix: Record<string, Record<string, string[]>> = {};

    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      matrix[role] = {};

      permissions.forEach((permission) => {
        matrix[role][permission.resource] = permission.actions;
      });
    });

    return matrix;
  }
}

/**
 * 權限檢查便利函數
 */
export function can(
  userRole: UserRole,
  action: Action,
  resource: Resource
): boolean {
  return RBACService.hasPermission(userRole, resource, action);
}

/**
 * 資源擁有權檢查便利函數
 */
export function owns(
  userRole: UserRole,
  userId: number,
  resourceOwnerId: number
): boolean {
  return RBACService.ownsResource(userRole, userId, resourceOwnerId);
}

/**
 * 管理員檢查便利函數
 */
export function isAdmin(userRole: UserRole): boolean {
  return RBACService.isAdmin(userRole);
}

/**
 * 擁有權檢查結果接口
 */
export interface OwnershipCheckResult {
  allowed: boolean;
  reason: string;
}

/**
 * 擁有權檢查參數接口
 */
export interface OwnershipCheckParams {
  userRole: UserRole;
  userId: number;
  resourceOwnerId?: number;
  resource: Resource;
  teamAccess?: boolean;
}

/**
 * 資源擁有權檢查函數
 *
 * @param params - 擁有權檢查參數
 * @returns 擁有權檢查結果（包含 allowed 和 reason）
 */
export function checkOwnership(params: OwnershipCheckParams): OwnershipCheckResult {
  const { userRole, userId, resourceOwnerId, resource, teamAccess = false } = params;

  // ADMIN 可以訪問所有資源
  if (RBACService.isAdmin(userRole)) {
    return {
      allowed: true,
      reason: 'ADMIN has access to all resources'
    };
  }

  // 如果沒有指定資源擁有者，允許訪問（公共資源）
  if (resourceOwnerId === undefined) {
    return {
      allowed: true,
      reason: 'Public resource with no specific owner'
    };
  }

  // 檢查是否是資源擁有者
  if (userId === resourceOwnerId) {
    return {
      allowed: true,
      reason: 'User is the resource owner'
    };
  }

  // SALES_MANAGER 可以訪問團隊資源
  if (RBACService.isSalesManager(userRole) && teamAccess) {
    return {
      allowed: true,
      reason: 'SALES_MANAGER has team access to this resource'
    };
  }

  // 其他情況拒絕訪問
  return {
    allowed: false,
    reason: 'User is not authorized to access this resource'
  };
}

/**
 * 導出 RBAC 服務為默認
 */
export default RBACService;
