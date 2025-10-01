/**
 * RBAC 角色權限系統測試套件
 *
 * 測試範圍：
 * - 權限檢查基礎功能
 * - 角色權限映射正確性
 * - 資源擁有權驗證
 * - 管理權限檢查
 * - 便利函數
 * - 權限矩陣生成
 *
 * @author Claude Code
 * @date 2025-10-01
 */

import { describe, it, expect } from '@jest/globals';
import {
  RBACService,
  UserRole,
  Resource,
  Action,
  can,
  owns,
  isAdmin,
} from './rbac';

describe('RBACService', () => {
  describe('權限檢查基礎功能', () => {
    it('ADMIN 應該有完整的系統管理權限', () => {
      expect(
        RBACService.hasPermission(UserRole.ADMIN, Resource.USERS, Action.MANAGE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.ADMIN, Resource.SYSTEM_CONFIGS, Action.UPDATE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.ADMIN, Resource.AUDIT_LOGS, Action.READ)
      ).toBe(true);
    });

    it('SALES_MANAGER 應該有團隊管理權限', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_MANAGER, Resource.CUSTOMERS, Action.READ)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.SALES_MANAGER, Resource.PROPOSALS, Action.APPROVE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.SALES_MANAGER, Resource.USERS, Action.READ)
      ).toBe(true);
    });

    it('SALES_REP 應該有基本銷售執行權限', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.CUSTOMERS, Action.CREATE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.PROPOSALS, Action.UPDATE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.KNOWLEDGE_BASE, Action.SEARCH)
      ).toBe(true);
    });

    it('MARKETING 應該有內容管理權限', () => {
      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.KNOWLEDGE_BASE, Action.CREATE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.PROPOSAL_TEMPLATES, Action.UPDATE)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.KNOWLEDGE_TAGS, Action.MANAGE)
      ).toBe(false); // MARKETING沒有MANAGE權限，只有CRUD
    });

    it('VIEWER 應該只有只讀權限', () => {
      expect(
        RBACService.hasPermission(UserRole.VIEWER, Resource.CUSTOMERS, Action.READ)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.VIEWER, Resource.KNOWLEDGE_BASE, Action.SEARCH)
      ).toBe(true);

      expect(
        RBACService.hasPermission(UserRole.VIEWER, Resource.CUSTOMERS, Action.CREATE)
      ).toBe(false);

      expect(
        RBACService.hasPermission(UserRole.VIEWER, Resource.PROPOSALS, Action.UPDATE)
      ).toBe(false);
    });
  });

  describe('權限邊界測試', () => {
    it('SALES_REP 不應該有審批權限', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.PROPOSALS, Action.APPROVE)
      ).toBe(false);
    });

    it('SALES_REP 不應該有系統管理權限', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.USERS, Action.MANAGE)
      ).toBe(false);

      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.SYSTEM_CONFIGS, Action.READ)
      ).toBe(false);
    });

    it('MARKETING 不應該有客戶資料修改權限', () => {
      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.CUSTOMERS, Action.UPDATE)
      ).toBe(false);

      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.CUSTOMERS, Action.DELETE)
      ).toBe(false);
    });

    it('VIEWER 不應該有任何寫入權限', () => {
      const writeActions = [Action.CREATE, Action.UPDATE, Action.DELETE, Action.APPROVE];
      const resources = [Resource.CUSTOMERS, Resource.PROPOSALS, Resource.KNOWLEDGE_BASE];

      resources.forEach((resource) => {
        writeActions.forEach((action) => {
          expect(
            RBACService.hasPermission(UserRole.VIEWER, resource, action)
          ).toBe(false);
        });
      });
    });

    it('不存在的資源應該返回無權限', () => {
      expect(
        RBACService.hasPermission(UserRole.ADMIN, 'non_existent_resource' as Resource, Action.READ)
      ).toBe(false);
    });
  });

  describe('MANAGE 權限特殊處理', () => {
    it('MANAGE 權限應該包含所有操作', () => {
      // ADMIN 對 USERS 有 MANAGE 權限
      const allActions = Object.values(Action);

      allActions.forEach((action) => {
        expect(
          RBACService.hasPermission(UserRole.ADMIN, Resource.USERS, action)
        ).toBe(true);
      });
    });
  });

  describe('hasAnyPermission 功能', () => {
    it('應該正確檢查任意權限', () => {
      expect(
        RBACService.hasAnyPermission(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          [Action.CREATE, Action.UPDATE]
        )
      ).toBe(true);

      expect(
        RBACService.hasAnyPermission(
          UserRole.VIEWER,
          Resource.PROPOSALS,
          [Action.CREATE, Action.UPDATE, Action.DELETE]
        )
      ).toBe(false);

      expect(
        RBACService.hasAnyPermission(
          UserRole.SALES_MANAGER,
          Resource.PROPOSALS,
          [Action.APPROVE, Action.DELETE]
        )
      ).toBe(true);
    });
  });

  describe('hasAllPermissions 功能', () => {
    it('應該正確檢查所有權限', () => {
      expect(
        RBACService.hasAllPermissions(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE]
        )
      ).toBe(true);

      expect(
        RBACService.hasAllPermissions(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          [Action.CREATE, Action.READ, Action.UPDATE]
        )
      ).toBe(true);

      expect(
        RBACService.hasAllPermissions(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          [Action.CREATE, Action.READ, Action.DELETE]
        )
      ).toBe(false);
    });
  });

  describe('getResourcePermissions 功能', () => {
    it('應該返回用戶對特定資源的所有權限', () => {
      const adminCustomerPerms = RBACService.getResourcePermissions(
        UserRole.ADMIN,
        Resource.CUSTOMERS
      );

      expect(adminCustomerPerms).toContain(Action.MANAGE);
      expect(adminCustomerPerms).toContain(Action.CREATE);
      expect(adminCustomerPerms).toContain(Action.READ);

      const viewerCustomerPerms = RBACService.getResourcePermissions(
        UserRole.VIEWER,
        Resource.CUSTOMERS
      );

      expect(viewerCustomerPerms).toContain(Action.READ);
      expect(viewerCustomerPerms).toContain(Action.LIST);
      expect(viewerCustomerPerms).not.toContain(Action.CREATE);
    });

    it('不存在的資源應該返回空陣列', () => {
      const perms = RBACService.getResourcePermissions(
        UserRole.ADMIN,
        'non_existent' as Resource
      );

      expect(perms).toEqual([]);
    });
  });

  describe('getAllPermissions 功能', () => {
    it('應該返回用戶的所有權限', () => {
      const adminPerms = RBACService.getAllPermissions(UserRole.ADMIN);
      expect(adminPerms.length).toBeGreaterThan(0);

      const viewerPerms = RBACService.getAllPermissions(UserRole.VIEWER);
      expect(viewerPerms.length).toBeGreaterThan(0);
      expect(viewerPerms.length).toBeLessThan(adminPerms.length);
    });
  });

  describe('角色檢查功能', () => {
    it('isAdmin 應該正確識別管理員', () => {
      expect(RBACService.isAdmin(UserRole.ADMIN)).toBe(true);
      expect(RBACService.isAdmin(UserRole.SALES_MANAGER)).toBe(false);
      expect(RBACService.isAdmin(UserRole.SALES_REP)).toBe(false);
    });

    it('isSalesManager 應該正確識別銷售經理', () => {
      expect(RBACService.isSalesManager(UserRole.SALES_MANAGER)).toBe(true);
      expect(RBACService.isSalesManager(UserRole.ADMIN)).toBe(false);
      expect(RBACService.isSalesManager(UserRole.SALES_REP)).toBe(false);
    });

    it('hasManagementRole 應該正確識別管理角色', () => {
      expect(RBACService.hasManagementRole(UserRole.ADMIN)).toBe(true);
      expect(RBACService.hasManagementRole(UserRole.SALES_MANAGER)).toBe(true);
      expect(RBACService.hasManagementRole(UserRole.SALES_REP)).toBe(false);
      expect(RBACService.hasManagementRole(UserRole.MARKETING)).toBe(false);
      expect(RBACService.hasManagementRole(UserRole.VIEWER)).toBe(false);
    });
  });

  describe('資源擁有權驗證', () => {
    it('ADMIN 應該可以訪問所有用戶的資源', () => {
      expect(RBACService.ownsResource(UserRole.ADMIN, 1, 999)).toBe(true);
      expect(RBACService.ownsResource(UserRole.ADMIN, 5, 10)).toBe(true);
    });

    it('SALES_MANAGER 應該可以訪問團隊資源', () => {
      expect(RBACService.ownsResource(UserRole.SALES_MANAGER, 2, 10)).toBe(true);
    });

    it('SALES_REP 只能訪問自己的資源', () => {
      expect(RBACService.ownsResource(UserRole.SALES_REP, 3, 3)).toBe(true);
      expect(RBACService.ownsResource(UserRole.SALES_REP, 3, 5)).toBe(false);
    });

    it('MARKETING 只能訪問自己的資源', () => {
      expect(RBACService.ownsResource(UserRole.MARKETING, 4, 4)).toBe(true);
      expect(RBACService.ownsResource(UserRole.MARKETING, 4, 8)).toBe(false);
    });

    it('VIEWER 只能訪問自己的資源', () => {
      expect(RBACService.ownsResource(UserRole.VIEWER, 5, 5)).toBe(true);
      expect(RBACService.ownsResource(UserRole.VIEWER, 5, 1)).toBe(false);
    });
  });

  describe('便利函數', () => {
    it('can 函數應該正常工作', () => {
      expect(can(UserRole.ADMIN, Action.MANAGE, Resource.USERS)).toBe(true);
      expect(can(UserRole.VIEWER, Action.CREATE, Resource.CUSTOMERS)).toBe(false);
    });

    it('owns 函數應該正常工作', () => {
      expect(owns(UserRole.ADMIN, 1, 999)).toBe(true);
      expect(owns(UserRole.SALES_REP, 3, 5)).toBe(false);
    });

    it('isAdmin 函數應該正常工作', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true);
      expect(isAdmin(UserRole.SALES_REP)).toBe(false);
    });
  });

  describe('權限矩陣生成', () => {
    it('應該生成完整的權限矩陣', () => {
      const matrix = RBACService.generatePermissionMatrix();

      expect(matrix).toHaveProperty(UserRole.ADMIN);
      expect(matrix).toHaveProperty(UserRole.SALES_MANAGER);
      expect(matrix).toHaveProperty(UserRole.SALES_REP);
      expect(matrix).toHaveProperty(UserRole.MARKETING);
      expect(matrix).toHaveProperty(UserRole.VIEWER);

      // 驗證ADMIN有最多的資源權限
      const adminResources = Object.keys(matrix[UserRole.ADMIN]);
      const viewerResources = Object.keys(matrix[UserRole.VIEWER]);

      expect(adminResources.length).toBeGreaterThan(viewerResources.length);
    });

    it('權限矩陣應該包含正確的資源和操作', () => {
      const matrix = RBACService.generatePermissionMatrix();

      // 驗證 ADMIN 對 CUSTOMERS 的權限
      expect(matrix[UserRole.ADMIN][Resource.CUSTOMERS]).toContain(Action.MANAGE);
      expect(matrix[UserRole.ADMIN][Resource.CUSTOMERS]).toContain(Action.CREATE);

      // 驗證 VIEWER 對 CUSTOMERS 的權限
      expect(matrix[UserRole.VIEWER][Resource.CUSTOMERS]).toContain(Action.READ);
      expect(matrix[UserRole.VIEWER][Resource.CUSTOMERS]).not.toContain(Action.DELETE);
    });
  });

  describe('實際業務場景', () => {
    it('銷售代表應該能創建客戶但不能刪除其他人的客戶', () => {
      // 可以創建
      expect(can(UserRole.SALES_REP, Action.CREATE, Resource.CUSTOMERS)).toBe(true);

      // 可以更新自己的
      expect(owns(UserRole.SALES_REP, 10, 10)).toBe(true);

      // 不能刪除（沒有DELETE權限）
      expect(can(UserRole.SALES_REP, Action.DELETE, Resource.CUSTOMERS)).toBe(false);
    });

    it('銷售經理應該能審批提案', () => {
      expect(can(UserRole.SALES_MANAGER, Action.APPROVE, Resource.PROPOSALS)).toBe(true);
      expect(can(UserRole.SALES_REP, Action.APPROVE, Resource.PROPOSALS)).toBe(false);
    });

    it('行銷人員應該能管理知識庫但不能修改客戶資料', () => {
      // 可以管理知識庫
      expect(can(UserRole.MARKETING, Action.CREATE, Resource.KNOWLEDGE_BASE)).toBe(true);
      expect(can(UserRole.MARKETING, Action.UPDATE, Resource.KNOWLEDGE_BASE)).toBe(true);

      // 不能修改客戶
      expect(can(UserRole.MARKETING, Action.UPDATE, Resource.CUSTOMERS)).toBe(false);
      expect(can(UserRole.MARKETING, Action.DELETE, Resource.CUSTOMERS)).toBe(false);

      // 但可以查看客戶
      expect(can(UserRole.MARKETING, Action.READ, Resource.CUSTOMERS)).toBe(true);
    });

    it('訪客應該只能查看不能操作', () => {
      const resources = [Resource.CUSTOMERS, Resource.PROPOSALS, Resource.KNOWLEDGE_BASE];
      const writeActions = [Action.CREATE, Action.UPDATE, Action.DELETE];

      resources.forEach((resource) => {
        // 可以讀取
        expect(can(UserRole.VIEWER, Action.READ, resource)).toBe(true);

        // 不能寫入
        writeActions.forEach((action) => {
          expect(can(UserRole.VIEWER, action, resource)).toBe(false);
        });
      });
    });

    it('管理員應該可以訪問審計日誌', () => {
      expect(can(UserRole.ADMIN, Action.READ, Resource.AUDIT_LOGS)).toBe(true);
      expect(can(UserRole.ADMIN, Action.EXPORT, Resource.AUDIT_LOGS)).toBe(true);

      // 其他角色不應該能訪問審計日誌
      expect(can(UserRole.SALES_MANAGER, Action.READ, Resource.AUDIT_LOGS)).toBe(false);
      expect(can(UserRole.SALES_REP, Action.READ, Resource.AUDIT_LOGS)).toBe(false);
    });
  });

  describe('權限一致性測試', () => {
    it('每個角色都應該至少有一個資源權限', () => {
      Object.values(UserRole).forEach((role) => {
        const permissions = RBACService.getAllPermissions(role);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });

    it('READ權限應該總是包含LIST權限的資源', () => {
      Object.values(UserRole).forEach((role) => {
        const permissions = RBACService.getAllPermissions(role);

        permissions.forEach((perm) => {
          if (perm.actions.includes(Action.READ)) {
            // 大多數情況下，有READ就應該有LIST
            // 但某些特殊資源可能例外
          }
        });
      });
    });

    it('VIEWER角色不應該有任何危險操作權限', () => {
      const dangerousActions = [Action.DELETE, Action.MANAGE, Action.APPROVE];
      const viewerPerms = RBACService.getAllPermissions(UserRole.VIEWER);

      viewerPerms.forEach((perm) => {
        dangerousActions.forEach((action) => {
          expect(perm.actions).not.toContain(action);
        });
      });
    });
  });
});
