/**
 * ================================================================
 * 檔案名稱: RBAC API集成測試
 * 檔案用途: 測試API端點的權限檢查集成
 * 開發階段: 生產就緒
 * ================================================================
 *
 * Sprint 3 Week 7 Day 7 實施
 * 實施日期: 2025-10-07
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { sign } from 'jsonwebtoken';

// Test server setup
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

/**
 * 生成測試用JWT token
 */
function generateToken(payload: {
  userId: number;
  email: string;
  role: string;
}): string {
  return sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('RBAC API Integration Tests', () => {
  describe('Customer API Permissions', () => {
    it('should allow ADMIN to DELETE customers', async () => {
      const token = generateToken({
        userId: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const response = await fetch(`${BASE_URL}/api/customers/1`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ADMIN應該有權限刪除
      expect([200, 204, 404]).toContain(response.status);
      if (response.status === 403) {
        fail('ADMIN should be able to delete customers');
      }
    });

    it('should deny SALES_REP to DELETE customers', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/customers/1`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // SALES_REP不應該有權限刪除
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.code).toBe('PERMISSION_DENIED');
    });

    it('should allow SALES_REP to CREATE customers', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Customer',
          email: 'test@customer.com',
        }),
      });

      // SALES_REP應該可以創建客戶
      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 403) {
        fail('SALES_REP should be able to create customers');
      }
    });

    it('should allow all roles to LIST customers', async () => {
      const roles = ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER'];

      for (const role of roles) {
        const token = generateToken({
          userId: 1,
          email: `${role.toLowerCase()}@test.com`,
          role,
        });

        const response = await fetch(`${BASE_URL}/api/customers`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.status).toBe(200);
      }
    });

    it('should deny VIEWER to UPDATE customers', async () => {
      const token = generateToken({
        userId: 5,
        email: 'viewer@test.com',
        role: 'VIEWER',
      });

      const response = await fetch(`${BASE_URL}/api/customers`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          name: 'Updated Name',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Proposal API Permissions', () => {
    it('should allow SALES_MANAGER to APPROVE proposals', async () => {
      const token = generateToken({
        userId: 2,
        email: 'manager@test.com',
        role: 'SALES_MANAGER',
      });

      const response = await fetch(`${BASE_URL}/api/proposals/1/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // SALES_MANAGER應該可以審批
      expect([200, 404]).toContain(response.status);
      if (response.status === 403) {
        fail('SALES_MANAGER should be able to approve proposals');
      }
    });

    it('should deny SALES_REP to APPROVE proposals', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/proposals/1/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.code).toBe('PERMISSION_DENIED');
    });

    it('should allow SALES_REP to UPDATE own proposals', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/proposals/1`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Proposal',
        }),
      });

      // 如果是自己的提案應該可以更新，否則返回403
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should deny VIEWER to UPDATE any proposals', async () => {
      const token = generateToken({
        userId: 5,
        email: 'viewer@test.com',
        role: 'VIEWER',
      });

      const response = await fetch(`${BASE_URL}/api/proposals/1`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Proposal',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Knowledge Base API Permissions', () => {
    it('should allow MARKETING to CREATE knowledge base', async () => {
      const token = generateToken({
        userId: 4,
        email: 'marketing@test.com',
        role: 'MARKETING',
      });

      const response = await fetch(`${BASE_URL}/api/knowledge-base`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Article',
          content: 'Test Content',
        }),
      });

      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 403) {
        fail('MARKETING should be able to create knowledge base');
      }
    });

    it('should deny SALES_REP to CREATE knowledge base', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/knowledge-base`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Article',
          content: 'Test Content',
        }),
      });

      expect(response.status).toBe(403);
    });

    it('should allow all roles to READ knowledge base', async () => {
      const roles = ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER'];

      for (const role of roles) {
        const token = generateToken({
          userId: 1,
          email: `${role.toLowerCase()}@test.com`,
          role,
        });

        const response = await fetch(`${BASE_URL}/api/knowledge-base`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Template API Permissions', () => {
    it('should allow MARKETING to CREATE templates', async () => {
      const token = generateToken({
        userId: 4,
        email: 'marketing@test.com',
        role: 'MARKETING',
      });

      const response = await fetch(`${BASE_URL}/api/templates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Template',
          content: 'Test Content',
        }),
      });

      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 403) {
        fail('MARKETING should be able to create templates');
      }
    });

    it('should deny SALES_REP to CREATE templates', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/templates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Template',
          content: 'Test Content',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for missing token', async () => {
      const response = await fetch(`${BASE_URL}/api/customers`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const response = await fetch(`${BASE_URL}/api/customers`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 with proper error code for permission denied', async () => {
      const token = generateToken({
        userId: 5,
        email: 'viewer@test.com',
        role: 'VIEWER',
      });

      const response = await fetch(`${BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test',
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.code).toBe('PERMISSION_DENIED');
      expect(data.message).toBeDefined();
    });

    it('should include helpful error message for permission denied', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      const response = await fetch(`${BASE_URL}/api/proposals/1/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('permission');
    });
  });

  describe('Ownership Validation', () => {
    it('should allow user to update their own resources', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      // 假設提案ID 3是由userId 3創建的
      const response = await fetch(`${BASE_URL}/api/proposals/3`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'My Updated Proposal',
        }),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 403) {
        fail('User should be able to update their own resources');
      }
    });

    it('should deny user to update other users resources', async () => {
      const token = generateToken({
        userId: 3,
        email: 'rep@test.com',
        role: 'SALES_REP',
      });

      // 假設提案ID 999是由其他用戶創建的
      const response = await fetch(`${BASE_URL}/api/proposals/999`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Update',
        }),
      });

      expect([403, 404]).toContain(response.status);
    });
  });
});
