/**
 * 權限檢查中間件測試
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 3 - 安全加固與合規
 */

// Mock auth-server module FIRST before any imports
const mockVerifyToken = jest.fn();
jest.mock('@/lib/auth-server', () => ({
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
}));

import { NextRequest, NextResponse } from 'next/server';
import {
  requirePermission,
  requireAuth,
  requireAdmin,
  requireManagement,
  withPermission,
  withAuth,
  withAdmin,
  withManagement,
} from './permission-middleware';
import { Resource, Action, UserRole } from './rbac';

describe('Permission Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Token 提取測試
  // ============================================================

  describe('Token 提取', () => {
    it('應該從 Authorization Header 提取 Bearer Token', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer test-token-123',
        },
      });

      const result = await requireAuth(request);

      expect(result.authorized).toBe(true);
      expect(result.user).toEqual(mockPayload);
      expect(mockVerifyToken).toHaveBeenCalledWith('test-token-123');
    });

    it('應該從 Cookie 提取 Token', async () => {
      const mockPayload = {
        userId: 2,
        email: 'user@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const url = new URL('http://localhost:3000/api/test');
      const request = new NextRequest(url, {
        headers: {
          cookie: 'auth-token=cookie-token-456',
        },
      });

      // Manually set cookie (NextRequest cookie handling in tests can be tricky)
      Object.defineProperty(request, 'cookies', {
        value: {
          get: (name: string) => {
            if (name === 'auth-token') {
              return { value: 'cookie-token-456' };
            }
            return undefined;
          },
        },
        writable: false,
      });

      const result = await requireAuth(request);

      expect(result.authorized).toBe(true);
      expect(result.user).toEqual(mockPayload);
      expect(mockVerifyToken).toHaveBeenCalledWith('cookie-token-456');
    });

    it('Authorization Header 應該優先於 Cookie', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer header-token',
          cookie: 'auth-token=cookie-token',
        },
      });

      await requireAuth(request);

      expect(mockVerifyToken).toHaveBeenCalledWith('header-token');
    });

    it('缺少 Token 應該返回 401 錯誤', async () => {
      const url = new URL('http://localhost:3000/api/test');
      const request = new NextRequest(url);

      // Ensure cookies.get returns undefined
      Object.defineProperty(request, 'cookies', {
        value: {
          get: () => undefined,
        },
        writable: false,
      });

      const result = await requireAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.reason).toBe('No authentication token provided');

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('AUTH_TOKEN_MISSING');
      expect(result.response!.status).toBe(401);
    });
  });

  // ============================================================
  // 身份驗證測試
  // ============================================================

  describe('requireAuth - 身份驗證', () => {
    it('有效 Token 應該通過身份驗證', async () => {
      const mockPayload = {
        userId: 1,
        email: 'user@example.com',
        role: UserRole.SALES_REP,
        name: 'Test User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const result = await requireAuth(request);

      expect(result.authorized).toBe(true);
      expect(result.user).toEqual(mockPayload);
      expect(result.response).toBeUndefined();
    });

    it('無效或過期 Token 應該返回 401 錯誤', async () => {
      mockVerifyToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      const result = await requireAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('AUTH_TOKEN_INVALID');
      expect(result.response!.status).toBe(401);
    });

    it('Token 驗證錯誤應該返回 500 錯誤', async () => {
      mockVerifyToken.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const result = await requireAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('AUTH_CHECK_ERROR');
      expect(result.response!.status).toBe(500);
    });
  });

  // ============================================================
  // 權限檢查測試
  // ============================================================

  describe('requirePermission - 權限檢查', () => {
    it('ADMIN 應該有所有資源的權限', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.DELETE,
      });

      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe(UserRole.ADMIN);
    });

    it('SALES_REP 應該有客戶的讀取權限', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.READ,
      });

      expect(result.authorized).toBe(true);
    });

    it('SALES_REP 不應該有客戶的刪除權限', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers/1', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.DELETE,
      });

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('PERMISSION_DENIED');
      expect(result.response!.status).toBe(403);
    });

    it('VIEWER 只有讀取權限', async () => {
      const mockPayload = {
        userId: 5,
        email: 'viewer@example.com',
        role: UserRole.VIEWER,
        name: 'Viewer User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        headers: {
          authorization: 'Bearer viewer-token',
        },
      });

      // 應該有讀取權限
      const readResult = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.READ,
      });
      expect(readResult.authorized).toBe(true);

      // 不應該有創建權限
      const createResult = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.CREATE,
      });
      expect(createResult.authorized).toBe(false);
    });

    it('缺少用戶角色應該返回 403 錯誤', async () => {
      const mockPayload = {
        userId: 1,
        email: 'user@example.com',
        name: 'Test User',
        // 缺少 role 字段
      } as any;

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.READ,
      });

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('USER_ROLE_MISSING');
      expect(result.response!.status).toBe(403);
    });
  });

  // ============================================================
  // 多權限檢查測試
  // ============================================================

  describe('多權限檢查', () => {
    it('hasAnyPermission - 擁有任一權限即通過', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      // SALES_REP 有 READ 權限但沒有 DELETE 權限
      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: [Action.READ, Action.DELETE],
        requireAll: false, // 任一權限即可
      });

      expect(result.authorized).toBe(true);
    });

    it('hasAllPermissions - 需要所有權限才通過', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      // SALES_REP 有 READ 權限但沒有 DELETE 權限
      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: [Action.READ, Action.DELETE],
        requireAll: true, // 需要所有權限
      });

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('PERMISSION_DENIED');
    });
  });

  // ============================================================
  // 資源擁有權檢查測試
  // ============================================================

  describe('資源擁有權檢查', () => {
    it('ADMIN 可以訪問任何資源', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers/999', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.UPDATE,
        checkOwnership: true,
        resourceOwnerId: 999, // 不是自己的資源
      });

      expect(result.authorized).toBe(true);
    });

    it('SALES_REP 只能訪問自己的資源', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers/2', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      // 訪問自己的資源
      const ownResult = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.UPDATE,
        checkOwnership: true,
        resourceOwnerId: 2,
      });

      expect(ownResult.authorized).toBe(true);

      // 訪問別人的資源
      const othersResult = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.UPDATE,
        checkOwnership: true,
        resourceOwnerId: 999,
      });

      expect(othersResult.authorized).toBe(false);
      expect(othersResult.response).toBeDefined();

      const responseData = await othersResult.response!.json();
      expect(responseData.code).toBe('RESOURCE_ACCESS_DENIED');
      expect(othersResult.response!.status).toBe(403);
    });
  });

  // ============================================================
  // 管理員權限測試
  // ============================================================

  describe('requireAdmin - 管理員權限', () => {
    it('ADMIN 角色應該通過', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/admin', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      const result = await requireAdmin(request);

      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe(UserRole.ADMIN);
    });

    it('非 ADMIN 角色應該被拒絕', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/admin', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const result = await requireAdmin(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('ADMIN_REQUIRED');
      expect(result.response!.status).toBe(403);
    });
  });

  // ============================================================
  // 管理角色權限測試
  // ============================================================

  describe('requireManagement - 管理角色權限', () => {
    it('ADMIN 應該通過', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/management', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      const result = await requireManagement(request);

      expect(result.authorized).toBe(true);
    });

    it('SALES_MANAGER 應該通過', async () => {
      const mockPayload = {
        userId: 3,
        email: 'manager@example.com',
        role: UserRole.SALES_MANAGER,
        name: 'Manager User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/management', {
        headers: {
          authorization: 'Bearer manager-token',
        },
      });

      const result = await requireManagement(request);

      expect(result.authorized).toBe(true);
    });

    it('SALES_REP 應該被拒絕', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/management', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const result = await requireManagement(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const responseData = await result.response!.json();
      expect(responseData.code).toBe('MANAGEMENT_REQUIRED');
    });
  });

  // ============================================================
  // Higher-Order Function 包裝器測試
  // ============================================================

  describe('withPermission - HOF 包裝器', () => {
    it('權限通過時應該調用處理函數', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const mockHandler = jest.fn(async (req: NextRequest, context: any) => {
        return NextResponse.json({ success: true, user: context.user });
      });

      const wrappedHandler = withPermission(mockHandler, {
        resource: Resource.CUSTOMERS,
        action: Action.READ,
      });

      const request = new NextRequest('http://localhost:3000/api/customers', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockPayload);
    });

    it('權限不通過時不應該調用處理函數', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const mockHandler = jest.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withPermission(mockHandler, {
        resource: Resource.CUSTOMERS,
        action: Action.DELETE,
      });

      const request = new NextRequest('http://localhost:3000/api/customers/1', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });

  describe('withAuth - HOF 包裝器', () => {
    it('身份驗證通過時應該調用處理函數', async () => {
      const mockPayload = {
        userId: 1,
        email: 'user@example.com',
        role: UserRole.SALES_REP,
        name: 'Test User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const mockHandler = jest.fn(async (req: NextRequest, context: any) => {
        return NextResponse.json({ user: context.user });
      });

      const wrappedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
      const data = await response.json();
      expect(data.user).toEqual(mockPayload);
    });
  });

  describe('withAdmin - HOF 包裝器', () => {
    it('ADMIN 角色應該調用處理函數', async () => {
      const mockPayload = {
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const mockHandler = jest.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAdmin(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/admin', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('非 ADMIN 角色不應該調用處理函數', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const mockHandler = jest.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAdmin(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/admin', {
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });

  describe('withManagement - HOF 包裝器', () => {
    it('SALES_MANAGER 角色應該調用處理函數', async () => {
      const mockPayload = {
        userId: 3,
        email: 'manager@example.com',
        role: UserRole.SALES_MANAGER,
        name: 'Manager User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const mockHandler = jest.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withManagement(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/management', {
        headers: {
          authorization: 'Bearer manager-token',
        },
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  // ============================================================
  // 真實業務場景測試
  // ============================================================

  describe('真實業務場景', () => {
    it('場景1: SALES_REP 創建客戶', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.CREATE,
      });

      expect(result.authorized).toBe(true);
    });

    it('場景2: SALES_REP 更新自己的客戶', async () => {
      const mockPayload = {
        userId: 2,
        email: 'sales@example.com',
        role: UserRole.SALES_REP,
        name: 'Sales User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/customers/2', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer sales-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.CUSTOMERS,
        action: Action.UPDATE,
        checkOwnership: true,
        resourceOwnerId: 2,
      });

      expect(result.authorized).toBe(true);
    });

    it('場景3: VIEWER 查看文檔但不能編輯', async () => {
      const mockPayload = {
        userId: 5,
        email: 'viewer@example.com',
        role: UserRole.VIEWER,
        name: 'Viewer User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        headers: {
          authorization: 'Bearer viewer-token',
        },
      });

      // 可以查看文檔
      const readResult = await requirePermission(request, {
        resource: Resource.DOCUMENTS,
        action: Action.READ,
      });
      expect(readResult.authorized).toBe(true);

      // 不能創建文檔
      const createResult = await requirePermission(request, {
        resource: Resource.DOCUMENTS,
        action: Action.CREATE,
      });
      expect(createResult.authorized).toBe(false);
    });

    it('場景4: SALES_MANAGER 審批提案', async () => {
      const mockPayload = {
        userId: 3,
        email: 'manager@example.com',
        role: UserRole.SALES_MANAGER,
        name: 'Manager User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/proposals/1/approve', {
        method: 'POST',
        headers: {
          authorization: 'Bearer manager-token',
        },
      });

      const result = await requirePermission(request, {
        resource: Resource.PROPOSALS,
        action: Action.APPROVE,
      });

      expect(result.authorized).toBe(true);
    });

    it('場景5: MARKETING 管理知識庫但不能管理用戶', async () => {
      const mockPayload = {
        userId: 4,
        email: 'marketing@example.com',
        role: UserRole.MARKETING,
        name: 'Marketing User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/knowledge', {
        headers: {
          authorization: 'Bearer marketing-token',
        },
      });

      // 可以管理知識庫
      const knowledgeResult = await requirePermission(request, {
        resource: Resource.KNOWLEDGE_BASE,
        action: Action.CREATE,
      });
      expect(knowledgeResult.authorized).toBe(true);

      // 不能管理用戶
      const userResult = await requirePermission(request, {
        resource: Resource.USERS,
        action: Action.CREATE,
      });
      expect(userResult.authorized).toBe(false);
    });
  });
});
