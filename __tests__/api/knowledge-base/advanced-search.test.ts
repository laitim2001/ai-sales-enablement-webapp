/**
 * ================================================================
 * Advanced Search API 測試套件
 * ================================================================
 *
 * 測試高級搜索 API 端點：
 * • 基本查詢處理
 * • 複雜條件組合
 * • 認證和授權
 * • 錯誤處理
 * • 性能
 */

import { POST } from '@/app/api/knowledge-base/advanced-search/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    knowledgeBase: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

const prisma = new PrismaClient();

// Mock JWT
jest.mock('jsonwebtoken');

describe('Advanced Search API', () => {
  const validToken = 'valid.jwt.token';
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT 驗證
    (jwt.verify as jest.Mock).mockReturnValue({
      userId,
      email: 'test@example.com'
    });

    // Mock Prisma 默認響應
    (prisma.knowledgeBase.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        title: '測試文檔',
        content: '這是測試內容',
        category: 'test',
        author: 'Test User',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    (prisma.knowledgeBase.count as jest.Mock).mockResolvedValue(1);
  });

  describe('基本查詢', () => {
    it('應該成功處理簡單的單條件查詢', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'title',
              operator: 'contains',
              value: '測試'
            }
          ],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
    });

    it('應該支持 AND 運算符組合多個條件', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'title',
              operator: 'contains',
              value: '測試'
            },
            {
              field: 'category',
              operator: 'equals',
              value: 'test'
            }
          ],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array)
          })
        })
      );
    });

    it('應該支持 OR 運算符組合多個條件', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'title',
              operator: 'contains',
              value: '測試'
            },
            {
              field: 'content',
              operator: 'contains',
              value: '測試'
            }
          ],
          operator: 'OR',
          groups: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array)
          })
        })
      );
    });
  });

  describe('操作符支持', () => {
    it('should support "contains" operator', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'title',
              operator: 'contains',
              value: '測試'
            }
          ],
          operator: 'AND',
          groups: []
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalled();
    });

    it('should support "equals" operator', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'category',
              operator: 'equals',
              value: 'test'
            }
          ],
          operator: 'AND',
          groups: []
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalled();
    });

    it('should support "starts_with" operator', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'title',
              operator: 'starts_with',
              value: '測試'
            }
          ],
          operator: 'AND',
          groups: []
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalled();
    });

    it('should support date operators (before/after/between)', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [
            {
              field: 'created_at',
              operator: 'after',
              value: '2025-01-01'
            }
          ],
          operator: 'AND',
          groups: []
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalled();
    });
  });

  describe('嵌套組查詢', () => {
    it('應該支持單層嵌套組', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: [
            {
              id: 'group1',
              operator: 'OR',
              conditions: [
                {
                  field: 'title',
                  operator: 'contains',
                  value: '測試1'
                },
                {
                  field: 'title',
                  operator: 'contains',
                  value: '測試2'
                }
              ],
              groups: []
            }
          ]
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.knowledgeBase.findMany).toHaveBeenCalled();
    });

    it('應該支持多層嵌套組', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: [
            {
              id: 'group1',
              operator: 'OR',
              conditions: [
                {
                  field: 'title',
                  operator: 'contains',
                  value: '測試1'
                }
              ],
              groups: [
                {
                  id: 'group2',
                  operator: 'AND',
                  conditions: [
                    {
                      field: 'category',
                      operator: 'equals',
                      value: 'test'
                    }
                  ],
                  groups: []
                }
              ]
            }
          ]
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('認證和授權', () => {
    it('沒有 token 應該返回 401', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('無效 token 應該返回 401', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid.token'
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('應該只返回用戶自己的數據', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: []
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId
          })
        })
      );
    });
  });

  describe('錯誤處理', () => {
    it('無效的請求體應該返回 400', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('缺少必要字段應該返回 400', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          // 缺少 conditions 和 operator
          groups: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('數據庫錯誤應該返回 500', async () => {
      (prisma.knowledgeBase.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('分頁和排序', () => {
    it('應該支持分頁', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: [],
          page: 2,
          pageSize: 10
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });

    it('應該支持排序', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: [],
          sortBy: 'created_at',
          sortOrder: 'desc'
        })
      });

      await POST(request);

      expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            created_at: 'desc'
          })
        })
      );
    });
  });

  describe('性能', () => {
    it('複雜查詢應該在合理時間內完成', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: Array(10).fill(0).map((_, i) => ({
            field: 'title',
            operator: 'contains',
            value: `測試${i}`
          })),
          operator: 'OR',
          groups: []
        })
      });

      const start = Date.now();
      await POST(request);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000); // 應該在1秒內完成
    });
  });

  describe('響應格式', () => {
    it('成功響應應該包含所有必要字段', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('pageSize');
    });

    it('錯誤響應應該包含錯誤信息', async () => {
      const request = new NextRequest('http://localhost:3000/api/knowledge-base/advanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 缺少 Authorization
        },
        body: JSON.stringify({
          conditions: [],
          operator: 'AND',
          groups: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });
  });
});
