/**
 * ================================================================
 * 檔案名稱: RBAC擁有權驗證測試
 * 檔案用途: 測試資源擁有權檢查邏輯
 * 開發階段: 生產就緒
 * ================================================================
 *
 * Sprint 3 Week 7 Day 6 實施
 * 實施日期: 2025-10-07
 */

import { describe, it, expect } from '@jest/globals';
import { checkOwnership, UserRole, Resource } from '@/lib/security/rbac';

describe('RBAC Ownership Verification', () => {
  describe('ADMIN Ownership Rules', () => {
    it('should allow ADMIN to access all resources regardless of ownership', () => {
      const result = checkOwnership({
        userRole: UserRole.ADMIN,
        userId: 1,
        resourceOwnerId: 999, // 不同的擁有者
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('ADMIN');
    });

    it('should allow ADMIN to access resources with undefined owner', () => {
      const result = checkOwnership({
        userRole: UserRole.ADMIN,
        userId: 1,
        resourceOwnerId: undefined,
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('SALES_MANAGER Ownership Rules', () => {
    it('should allow SALES_MANAGER to access own resources', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_MANAGER,
        userId: 2,
        resourceOwnerId: 2, // 相同的擁有者
        resource: Resource.PROPOSALS,
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('owner');
    });

    it('should allow SALES_MANAGER to access team resources', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_MANAGER,
        userId: 2,
        resourceOwnerId: 3, // 團隊成員的資源
        resource: Resource.PROPOSALS,
        teamAccess: true, // 表示有團隊訪問權
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('team');
    });

    it('should deny SALES_MANAGER to access non-team resources', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_MANAGER,
        userId: 2,
        resourceOwnerId: 999, // 非團隊成員的資源
        resource: Resource.PROPOSALS,
        teamAccess: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
    });
  });

  describe('SALES_REP Ownership Rules', () => {
    it('should allow SALES_REP to access own resources', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: 3,
        resourceOwnerId: 3, // 相同的擁有者
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('owner');
    });

    it('should deny SALES_REP to access other users resources', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: 3,
        resourceOwnerId: 4, // 不同的擁有者
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('own resources');
    });

    it('should deny SALES_REP to access resources without owner', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: 3,
        resourceOwnerId: undefined,
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('MARKETING Ownership Rules', () => {
    it('should allow MARKETING to access own knowledge base', () => {
      const result = checkOwnership({
        userRole: UserRole.MARKETING,
        userId: 4,
        resourceOwnerId: 4,
        resource: Resource.KNOWLEDGE_BASE,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny MARKETING to access other users customers', () => {
      const result = checkOwnership({
        userRole: UserRole.MARKETING,
        userId: 4,
        resourceOwnerId: 5,
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('VIEWER Ownership Rules', () => {
    it('should allow VIEWER to READ own resources', () => {
      const result = checkOwnership({
        userRole: UserRole.VIEWER,
        userId: 5,
        resourceOwnerId: 5,
        resource: Resource.PROPOSALS,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny VIEWER to access other users resources', () => {
      const result = checkOwnership({
        userRole: UserRole.VIEWER,
        userId: 5,
        resourceOwnerId: 6,
        resource: Resource.PROPOSALS,
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null userId', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: null as any,
        resourceOwnerId: 1,
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(false);
    });

    it('should handle null resourceOwnerId', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: 1,
        resourceOwnerId: null as any,
        resource: Resource.CUSTOMERS,
      });

      expect(result.allowed).toBe(false);
    });

    it('should handle string userId and resourceOwnerId', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: '3' as any,
        resourceOwnerId: '3' as any,
        resource: Resource.CUSTOMERS,
      });

      // 應該進行寬鬆比較
      expect(result.allowed).toBe(true);
    });

    it('should handle different types for userId and resourceOwnerId', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: 3,
        resourceOwnerId: '3' as any,
        resource: Resource.CUSTOMERS,
      });

      // 應該進行寬鬆比較
      expect(result.allowed).toBe(true);
    });
  });

  describe('Resource-Specific Ownership Rules', () => {
    it('should validate CUSTOMERS resource ownership', () => {
      const scenarios = [
        {
          role: UserRole.ADMIN,
          userId: 1,
          ownerId: 999,
          expected: true,
          description: 'ADMIN can access any customer',
        },
        {
          role: UserRole.SALES_MANAGER,
          userId: 2,
          ownerId: 2,
          expected: true,
          description: 'SALES_MANAGER can access own customers',
        },
        {
          role: UserRole.SALES_REP,
          userId: 3,
          ownerId: 3,
          expected: true,
          description: 'SALES_REP can access own customers',
        },
        {
          role: UserRole.SALES_REP,
          userId: 3,
          ownerId: 4,
          expected: false,
          description: 'SALES_REP cannot access other customers',
        },
      ];

      scenarios.forEach(scenario => {
        const result = checkOwnership({
          userRole: scenario.role,
          userId: scenario.userId,
          resourceOwnerId: scenario.ownerId,
          resource: Resource.CUSTOMERS,
        });

        expect(result.allowed).toBe(scenario.expected);
      });
    });

    it('should validate PROPOSALS resource ownership', () => {
      const scenarios = [
        {
          role: UserRole.ADMIN,
          userId: 1,
          ownerId: 999,
          expected: true,
          description: 'ADMIN can access any proposal',
        },
        {
          role: UserRole.SALES_MANAGER,
          userId: 2,
          ownerId: 3,
          teamAccess: true,
          expected: true,
          description: 'SALES_MANAGER can access team proposals',
        },
        {
          role: UserRole.SALES_REP,
          userId: 3,
          ownerId: 3,
          expected: true,
          description: 'SALES_REP can access own proposals',
        },
        {
          role: UserRole.VIEWER,
          userId: 5,
          ownerId: 3,
          expected: false,
          description: 'VIEWER cannot access other proposals',
        },
      ];

      scenarios.forEach(scenario => {
        const result = checkOwnership({
          userRole: scenario.role,
          userId: scenario.userId,
          resourceOwnerId: scenario.ownerId,
          resource: Resource.PROPOSALS,
          teamAccess: scenario.teamAccess,
        });

        expect(result.allowed).toBe(scenario.expected);
      });
    });
  });

  describe('Team Access Logic', () => {
    it('should allow SALES_MANAGER with teamAccess=true', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_MANAGER,
        userId: 2,
        resourceOwnerId: 10,
        resource: Resource.CUSTOMERS,
        teamAccess: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('team');
    });

    it('should deny SALES_MANAGER with teamAccess=false', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_MANAGER,
        userId: 2,
        resourceOwnerId: 10,
        resource: Resource.CUSTOMERS,
        teamAccess: false,
      });

      expect(result.allowed).toBe(false);
    });

    it('should ignore teamAccess for ADMIN', () => {
      const result = checkOwnership({
        userRole: UserRole.ADMIN,
        userId: 1,
        resourceOwnerId: 10,
        resource: Resource.CUSTOMERS,
        teamAccess: false,
      });

      expect(result.allowed).toBe(true);
    });

    it('should ignore teamAccess for SALES_REP', () => {
      const result = checkOwnership({
        userRole: UserRole.SALES_REP,
        userId: 3,
        resourceOwnerId: 10,
        resource: Resource.CUSTOMERS,
        teamAccess: true, // teamAccess不適用於SALES_REP
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('own resources');
    });
  });

  describe('Ownership Check Performance', () => {
    it('should handle large number of ownership checks efficiently', () => {
      const startTime = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        checkOwnership({
          userRole: UserRole.SALES_REP,
          userId: i % 100,
          resourceOwnerId: i % 100,
          resource: Resource.CUSTOMERS,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 10000次檢查應該在1秒內完成
      expect(duration).toBeLessThan(1000);
    });
  });
});
