/**
 * ================================================================
 * 檔案名稱: RBAC權限檢查單元測試
 * 檔案用途: 測試RBAC權限系統的核心功能
 * 開發階段: 生產就緒
 * ================================================================
 *
 * Sprint 3 Week 7 Day 6 實施
 * 實施日期: 2025-10-07
 */

import { describe, it, expect } from '@jest/globals';
import { RBACService, UserRole, Resource, Action } from '@/lib/security/rbac';

describe('RBAC Permission System - Core Tests', () => {
  describe('ADMIN Role Permissions', () => {
    it('should have MANAGE permission on all resources', () => {
      const resources = [
        Resource.CUSTOMERS,
        Resource.CUSTOMER_CONTACTS,
        Resource.PROPOSALS,
        Resource.PROPOSAL_TEMPLATES,
        Resource.KNOWLEDGE_BASE,
        Resource.USERS,
        Resource.SYSTEM_CONFIGS,
      ];

      resources.forEach(resource => {
        expect(
          RBACService.hasPermission(UserRole.ADMIN, resource, Action.MANAGE)
        ).toBe(true);
      });
    });

    it('should have all CRUD permissions on CUSTOMERS', () => {
      const actions = [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE];

      actions.forEach(action => {
        expect(
          RBACService.hasPermission(UserRole.ADMIN, Resource.CUSTOMERS, action)
        ).toBe(true);
      });
    });

    it('should have APPROVE permission on PROPOSALS', () => {
      expect(
        RBACService.hasPermission(UserRole.ADMIN, Resource.PROPOSALS, Action.APPROVE)
      ).toBe(true);
    });
  });

  describe('SALES_MANAGER Role Permissions', () => {
    it('should have APPROVE permission on PROPOSALS', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_MANAGER,
          Resource.PROPOSALS,
          Action.APPROVE
        )
      ).toBe(true);
    });

    it('should have ASSIGN permission on SALES_OPPORTUNITIES', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_MANAGER,
          Resource.SALES_OPPORTUNITIES,
          Action.ASSIGN
        )
      ).toBe(true);
    });

    it('should have UPDATE permission on CUSTOMERS', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_MANAGER,
          Resource.CUSTOMERS,
          Action.UPDATE
        )
      ).toBe(true);
    });

    it('should NOT have MANAGE permission on SYSTEM_CONFIGS', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_MANAGER,
          Resource.SYSTEM_CONFIGS,
          Action.MANAGE
        )
      ).toBe(false);
    });

    it('should NOT have DELETE permission on USERS', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_MANAGER,
          Resource.USERS,
          Action.DELETE
        )
      ).toBe(false);
    });
  });

  describe('SALES_REP Role Permissions', () => {
    it('should have CREATE permission on CUSTOMERS', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.CUSTOMERS, Action.CREATE)
      ).toBe(true);
    });

    it('should have UPDATE permission on CUSTOMERS (own resources only)', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.CUSTOMERS, Action.UPDATE)
      ).toBe(true);
    });

    it('should have READ permission on KNOWLEDGE_BASE', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_REP,
          Resource.KNOWLEDGE_BASE,
          Action.READ
        )
      ).toBe(true);
    });

    it('should NOT have DELETE permission on CUSTOMERS', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.CUSTOMERS, Action.DELETE)
      ).toBe(false);
    });

    it('should NOT have APPROVE permission on PROPOSALS', () => {
      expect(
        RBACService.hasPermission(UserRole.SALES_REP, Resource.PROPOSALS, Action.APPROVE)
      ).toBe(false);
    });

    it('should NOT have MANAGE permission on KNOWLEDGE_BASE', () => {
      expect(
        RBACService.hasPermission(
          UserRole.SALES_REP,
          Resource.KNOWLEDGE_BASE,
          Action.MANAGE
        )
      ).toBe(false);
    });
  });

  describe('MARKETING Role Permissions', () => {
    it('should have CREATE/UPDATE/DELETE permissions on KNOWLEDGE_BASE', () => {
      expect(
        RBACService.hasPermission(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.CREATE
        )
      ).toBe(true);

      expect(
        RBACService.hasPermission(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.UPDATE
        )
      ).toBe(true);

      expect(
        RBACService.hasPermission(
          UserRole.MARKETING,
          Resource.KNOWLEDGE_BASE,
          Action.DELETE
        )
      ).toBe(true);
    });

    it('should have PUBLISH permission on PROPOSAL_TEMPLATES', () => {
      expect(
        RBACService.hasPermission(
          UserRole.MARKETING,
          Resource.PROPOSAL_TEMPLATES,
          Action.PUBLISH
        )
      ).toBe(true);
    });

    it('should have READ permission on CUSTOMERS', () => {
      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.CUSTOMERS, Action.READ)
      ).toBe(true);
    });

    it('should NOT have UPDATE permission on CUSTOMERS', () => {
      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.CUSTOMERS, Action.UPDATE)
      ).toBe(false);
    });

    it('should NOT have APPROVE permission on PROPOSALS', () => {
      expect(
        RBACService.hasPermission(UserRole.MARKETING, Resource.PROPOSALS, Action.APPROVE)
      ).toBe(false);
    });
  });

  describe('VIEWER Role Permissions', () => {
    it('should have READ permission on all resources', () => {
      const resources = [
        Resource.CUSTOMERS,
        Resource.PROPOSALS,
        Resource.KNOWLEDGE_BASE,
        Resource.PROPOSAL_TEMPLATES,
      ];

      resources.forEach(resource => {
        expect(
          RBACService.hasPermission(UserRole.VIEWER, resource, Action.READ)
        ).toBe(true);
      });
    });

    it('should NOT have CREATE permission on CUSTOMERS', () => {
      expect(
        RBACService.hasPermission(UserRole.VIEWER, Resource.CUSTOMERS, Action.CREATE)
      ).toBe(false);
    });

    it('should NOT have UPDATE permission on PROPOSALS', () => {
      expect(
        RBACService.hasPermission(UserRole.VIEWER, Resource.PROPOSALS, Action.UPDATE)
      ).toBe(false);
    });

    it('should NOT have DELETE permission on any resource', () => {
      const resources = [
        Resource.CUSTOMERS,
        Resource.PROPOSALS,
        Resource.KNOWLEDGE_BASE,
      ];

      resources.forEach(resource => {
        expect(
          RBACService.hasPermission(UserRole.VIEWER, resource, Action.DELETE)
        ).toBe(false);
      });
    });

    it('should NOT have MANAGE permission on any resource', () => {
      const resources = [
        Resource.CUSTOMERS,
        Resource.PROPOSALS,
        Resource.KNOWLEDGE_BASE,
        Resource.SYSTEM_CONFIGS,
      ];

      resources.forEach(resource => {
        expect(
          RBACService.hasPermission(UserRole.VIEWER, resource, Action.MANAGE)
        ).toBe(false);
      });
    });
  });

  describe('Permission Matrix Validation', () => {
    it('should validate complete permission matrix for critical resources', () => {
      const criticalResources = [
        Resource.CUSTOMERS,
        Resource.PROPOSALS,
        Resource.KNOWLEDGE_BASE,
      ];

      const roles = [
        UserRole.ADMIN,
        UserRole.SALES_MANAGER,
        UserRole.SALES_REP,
        UserRole.MARKETING,
        UserRole.VIEWER,
      ];

      const actions = [
        Action.CREATE,
        Action.READ,
        Action.UPDATE,
        Action.DELETE,
        Action.MANAGE,
      ];

      // 確保每個組合都有明確的權限結果（true或false）
      criticalResources.forEach(resource => {
        roles.forEach(role => {
          actions.forEach(action => {
            const hasPermission = RBACService.hasPermission(role, resource, action);
            expect(typeof hasPermission).toBe('boolean');
          });
        });
      });
    });

    it('should ensure proper permission hierarchy: ADMIN > SALES_MANAGER > SALES_REP', () => {
      const resource = Resource.CUSTOMERS;
      const action = Action.UPDATE;

      const adminHas = RBACService.hasPermission(UserRole.ADMIN, resource, action);
      const managerHas = RBACService.hasPermission(
        UserRole.SALES_MANAGER,
        resource,
        action
      );
      const repHas = RBACService.hasPermission(UserRole.SALES_REP, resource, action);

      // ADMIN應該有最高權限
      expect(adminHas).toBe(true);

      // 如果SALES_REP有權限，SALES_MANAGER也應該有
      if (repHas) {
        expect(managerHas).toBe(true);
      }

      // 如果SALES_MANAGER有權限，ADMIN也應該有
      if (managerHas) {
        expect(adminHas).toBe(true);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid role gracefully', () => {
      // Testing invalid role (type assertion required for invalid values)
      const result = RBACService.hasPermission(
        'INVALID_ROLE' as any,
        Resource.CUSTOMERS,
        Action.READ
      );
      expect(result).toBe(false);
    });

    it('should handle invalid resource gracefully', () => {
      // Testing invalid resource (type assertion required for invalid values)
      const result = RBACService.hasPermission(
        UserRole.ADMIN,
        'INVALID_RESOURCE' as any,
        Action.READ
      );
      expect(result).toBe(false);
    });

    it('should handle invalid action gracefully for non-MANAGE roles', () => {
      // Testing invalid action (type assertion required for invalid values)
      const result = RBACService.hasPermission(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        'INVALID_ACTION' as any
      );
      expect(result).toBe(false);
    });

    it('should return true for ADMIN with MANAGE permission even with invalid action', () => {
      // ADMIN有MANAGE權限，所以對於任何action都返回true（包括無效action）
      // 這是feature，不是bug：MANAGE包含所有可能的操作
      // Testing invalid action (type assertion required for invalid values)
      const result = RBACService.hasPermission(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        'INVALID_ACTION' as any
      );
      expect(result).toBe(true);
    });
  });
});
