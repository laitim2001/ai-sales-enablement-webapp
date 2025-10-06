/**
 * ================================================================
 * 檔案名稱: usePermission Hook測試
 * 檔案用途: 測試前端權限Hook功能
 * 開發階段: 生產就緒
 * ================================================================
 *
 * Sprint 3 Week 7 Day 6 實施
 * 實施日期: 2025-10-07
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { usePermission } from '@/hooks/use-permission';
import { Resource, Action } from '@/lib/security/rbac';
import * as useAuthModule from '@/hooks/use-auth';

// Mock useAuth
jest.mock('@/hooks/use-auth');

describe('usePermission Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission function', () => {
    it('should return true for ADMIN with any permission', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.DELETE)).toBe(
        true
      );
      expect(result.current.hasPermission(Resource.PROPOSALS, Action.APPROVE)).toBe(
        true
      );
      expect(result.current.hasPermission(Resource.SYSTEM_CONFIGS, Action.MANAGE)).toBe(
        true
      );
    });

    it('should return false when user is not logged in', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.READ)).toBe(
        false
      );
    });

    it('should return false when user has no role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'test@test.com', role: null },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.READ)).toBe(
        false
      );
    });

    it('should validate SALES_MANAGER permissions correctly', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 2, email: 'manager@test.com', role: 'SALES_MANAGER' },
      });

      const { result } = renderHook(() => usePermission());

      // SALES_MANAGER可以審批提案
      expect(result.current.hasPermission(Resource.PROPOSALS, Action.APPROVE)).toBe(
        true
      );

      // SALES_MANAGER可以分配銷售機會
      expect(
        result.current.hasPermission(Resource.SALES_OPPORTUNITIES, Action.ASSIGN)
      ).toBe(true);

      // SALES_MANAGER不能管理系統配置
      expect(
        result.current.hasPermission(Resource.SYSTEM_CONFIGS, Action.MANAGE)
      ).toBe(false);

      // SALES_MANAGER不能刪除用戶
      expect(result.current.hasPermission(Resource.USERS, Action.DELETE)).toBe(
        false
      );
    });

    it('should validate SALES_REP permissions correctly', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 3, email: 'rep@test.com', role: 'SALES_REP' },
      });

      const { result } = renderHook(() => usePermission());

      // SALES_REP可以創建客戶
      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.CREATE)).toBe(
        true
      );

      // SALES_REP可以讀取知識庫
      expect(result.current.hasPermission(Resource.KNOWLEDGE_BASE, Action.READ)).toBe(
        true
      );

      // SALES_REP不能刪除客戶
      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.DELETE)).toBe(
        false
      );

      // SALES_REP不能審批提案
      expect(result.current.hasPermission(Resource.PROPOSALS, Action.APPROVE)).toBe(
        false
      );
    });

    it('should validate MARKETING permissions correctly', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 4, email: 'marketing@test.com', role: 'MARKETING' },
      });

      const { result } = renderHook(() => usePermission());

      // MARKETING可以管理知識庫
      expect(
        result.current.hasPermission(Resource.KNOWLEDGE_BASE, Action.MANAGE)
      ).toBe(true);

      // MARKETING可以發布模板
      expect(
        result.current.hasPermission(Resource.PROPOSAL_TEMPLATES, Action.PUBLISH)
      ).toBe(true);

      // MARKETING不能更新客戶
      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.UPDATE)).toBe(
        false
      );

      // MARKETING不能審批提案
      expect(result.current.hasPermission(Resource.PROPOSALS, Action.APPROVE)).toBe(
        false
      );
    });

    it('should validate VIEWER permissions correctly', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 5, email: 'viewer@test.com', role: 'VIEWER' },
      });

      const { result } = renderHook(() => usePermission());

      // VIEWER可以讀取客戶
      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.READ)).toBe(
        true
      );

      // VIEWER可以讀取提案
      expect(result.current.hasPermission(Resource.PROPOSALS, Action.READ)).toBe(
        true
      );

      // VIEWER不能創建客戶
      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.CREATE)).toBe(
        false
      );

      // VIEWER不能更新提案
      expect(result.current.hasPermission(Resource.PROPOSALS, Action.UPDATE)).toBe(
        false
      );

      // VIEWER不能刪除任何資源
      expect(result.current.hasPermission(Resource.CUSTOMERS, Action.DELETE)).toBe(
        false
      );
    });
  });

  describe('Role check functions', () => {
    it('isAdmin should return true for ADMIN role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.isSalesManager()).toBe(false);
      expect(result.current.isSalesRep()).toBe(false);
      expect(result.current.isMarketing()).toBe(false);
      expect(result.current.isViewer()).toBe(false);
    });

    it('isSalesManager should return true for SALES_MANAGER role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 2, email: 'manager@test.com', role: 'SALES_MANAGER' },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isSalesManager()).toBe(true);
      expect(result.current.isSalesRep()).toBe(false);
      expect(result.current.isMarketing()).toBe(false);
      expect(result.current.isViewer()).toBe(false);
    });

    it('isSalesRep should return true for SALES_REP role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 3, email: 'rep@test.com', role: 'SALES_REP' },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isSalesManager()).toBe(false);
      expect(result.current.isSalesRep()).toBe(true);
      expect(result.current.isMarketing()).toBe(false);
      expect(result.current.isViewer()).toBe(false);
    });

    it('isMarketing should return true for MARKETING role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 4, email: 'marketing@test.com', role: 'MARKETING' },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isSalesManager()).toBe(false);
      expect(result.current.isSalesRep()).toBe(false);
      expect(result.current.isMarketing()).toBe(true);
      expect(result.current.isViewer()).toBe(false);
    });

    it('isViewer should return true for VIEWER role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 5, email: 'viewer@test.com', role: 'VIEWER' },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isSalesManager()).toBe(false);
      expect(result.current.isSalesRep()).toBe(false);
      expect(result.current.isMarketing()).toBe(false);
      expect(result.current.isViewer()).toBe(true);
    });

    it('all role checks should return false when user is null', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isSalesManager()).toBe(false);
      expect(result.current.isSalesRep()).toBe(false);
      expect(result.current.isMarketing()).toBe(false);
      expect(result.current.isViewer()).toBe(false);
    });

    it('all role checks should return false when role is undefined', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'test@test.com', role: undefined },
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isSalesManager()).toBe(false);
      expect(result.current.isSalesRep()).toBe(false);
      expect(result.current.isMarketing()).toBe(false);
      expect(result.current.isViewer()).toBe(false);
    });
  });

  describe('User property', () => {
    it('should return user object from useAuth', () => {
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
        name: 'Admin User',
      };

      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.user).toEqual(mockUser);
    });

    it('should return null when no user is logged in', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => usePermission());

      expect(result.current.user).toBeNull();
    });
  });

  describe('Hook re-rendering', () => {
    it('should update permissions when user changes', () => {
      const { result, rerender } = renderHook(() => usePermission());

      // 初始狀態: SALES_REP
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 3, email: 'rep@test.com', role: 'SALES_REP' },
      });
      rerender();

      expect(result.current.hasPermission(Resource.PROPOSALS, Action.APPROVE)).toBe(
        false
      );

      // 用戶角色變更為SALES_MANAGER
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 2, email: 'manager@test.com', role: 'SALES_MANAGER' },
      });
      rerender();

      expect(result.current.hasPermission(Resource.PROPOSALS, Action.APPROVE)).toBe(
        true
      );
    });
  });

  describe('Permission combinations', () => {
    it('should validate multiple permission checks for a single role', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        user: { id: 2, email: 'manager@test.com', role: 'SALES_MANAGER' },
      });

      const { result } = renderHook(() => usePermission());

      const permissions = [
        { resource: Resource.CUSTOMERS, action: Action.CREATE, expected: true },
        { resource: Resource.CUSTOMERS, action: Action.READ, expected: true },
        { resource: Resource.CUSTOMERS, action: Action.UPDATE, expected: true },
        { resource: Resource.CUSTOMERS, action: Action.DELETE, expected: true },
        { resource: Resource.PROPOSALS, action: Action.APPROVE, expected: true },
        { resource: Resource.SYSTEM_CONFIGS, action: Action.MANAGE, expected: false },
        { resource: Resource.USERS, action: Action.DELETE, expected: false },
      ];

      permissions.forEach(({ resource, action, expected }) => {
        expect(result.current.hasPermission(resource, action)).toBe(expected);
      });
    });
  });
});
