/**
 * 範本管理器測試套件
 *
 * 測試範圍：
 * - 範本 CRUD 操作
 * - 範本搜索和過濾
 * - 範本訪問控制
 * - 範本統計功能
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { PrismaClient, TemplateCategory, TemplateAccess } from '@prisma/client';
import {
  TemplateManager,
  CreateTemplateData,
  UpdateTemplateData,
  TemplateQueryOptions,
} from '@/lib/template/template-manager';

describe('TemplateManager', () => {
  let prisma: PrismaClient;
  let manager: TemplateManager;
  let testUserId: number;
  let testUserId2: number;
  let testTemplateId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    manager = new TemplateManager();

    // 創建測試用戶 1
    const user1 = await prisma.user.create({
      data: {
        email: 'template-test@example.com',
        first_name: 'Template',
        last_name: 'Tester',
        role: 'SALES_REP',
      },
    });
    testUserId = user1.id;

    // 創建測試用戶 2
    const user2 = await prisma.user.create({
      data: {
        email: 'template-test2@example.com',
        first_name: 'Template2',
        last_name: 'Tester2',
        role: 'SALES_MANAGER',
      },
    });
    testUserId2 = user2.id;
  });

  afterAll(async () => {
    // 清理測試數據
    if (testTemplateId) {
      await prisma.proposalTemplate.deleteMany({
        where: {
          OR: [
            { id: testTemplateId },
            { created_by: testUserId },
            { created_by: testUserId2 },
          ],
        },
      });
    }

    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId, testUserId2] },
      },
    });

    await prisma.$disconnect();
  });

  describe('createTemplate', () => {
    it('應該成功創建新範本', async () => {
      const templateData: CreateTemplateData = {
        name: '測試銷售提案範本',
        description: '這是一個測試用的銷售提案範本',
        category: 'SALES_PROPOSAL' as TemplateCategory,
        content: '# {{title}}\n\n客戶：{{customerName}}\n價格：{{price}}',
        variables: {
          title: {
            type: 'text',
            label: '標題',
            required: true,
            defaultValue: '產品提案',
          },
          customerName: {
            type: 'text',
            label: '客戶名稱',
            required: true,
          },
          price: {
            type: 'number',
            label: '價格',
            required: true,
            validation: {
              min: 0,
              message: '價格必須大於0',
            },
          },
        },
        organization: 'Test Org',
        accessLevel: 'PRIVATE' as TemplateAccess,
        isDefault: false,
        tags: ['test', 'sales'],
      };

      const template = await manager.createTemplate(testUserId, templateData);

      expect(template).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.category).toBe(templateData.category);
      expect(template.access_level).toBe(templateData.accessLevel);
      expect(template.created_by).toBe(testUserId);
      expect(template.is_active).toBe(true);
      expect(template.version).toBe(1);

      testTemplateId = template.id;
    });

    it('應該在缺少必需字段時拋出錯誤', async () => {
      const invalidData = {
        name: '',
        category: 'SALES_PROPOSAL' as TemplateCategory,
        content: 'test',
        variables: {},
      } as CreateTemplateData;

      await expect(manager.createTemplate(testUserId, invalidData)).rejects.toThrow();
    });
  });

  describe('getTemplate', () => {
    it('應該能獲取指定 ID 的範本', async () => {
      const template = await manager.getTemplate(testTemplateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(testTemplateId);
      expect(template?.name).toBe('測試銷售提案範本');
    });

    it('應該在範本不存在時返回 null', async () => {
      const template = await manager.getTemplate('non-existent-id');
      expect(template).toBeNull();
    });
  });

  describe('updateTemplate', () => {
    it('應該能更新範本內容', async () => {
      const updateData: UpdateTemplateData = {
        name: '更新後的範本名稱',
        description: '更新後的描述',
        content: '# {{title}}\n\n更新的內容',
      };

      const updatedTemplate = await manager.updateTemplate(
        testTemplateId,
        testUserId,
        updateData
      );

      expect(updatedTemplate).toBeDefined();
      expect(updatedTemplate.name).toBe(updateData.name);
      expect(updatedTemplate.description).toBe(updateData.description);
      expect(updatedTemplate.content).toBe(updateData.content);
      expect(updatedTemplate.version).toBe(2); // 版本應該增加
    });

    it('應該在未授權時拋出錯誤', async () => {
      const updateData: UpdateTemplateData = {
        name: '未授權更新',
      };

      // 使用另一個用戶嘗試更新（假設 PRIVATE 訪問級別）
      await expect(
        manager.updateTemplate(testTemplateId, testUserId2, updateData)
      ).rejects.toThrow();
    });
  });

  describe('listTemplates', () => {
    beforeAll(async () => {
      // 創建多個測試範本
      await manager.createTemplate(testUserId, {
        name: '產品演示範本',
        category: 'PRODUCT_DEMO' as TemplateCategory,
        content: 'Demo content',
        variables: {},
        accessLevel: 'TEAM' as TemplateAccess,
      });

      await manager.createTemplate(testUserId, {
        name: '價格報價範本',
        category: 'PRICING_QUOTE' as TemplateCategory,
        content: 'Quote content',
        variables: {},
        accessLevel: 'ORGANIZATION' as TemplateAccess,
        tags: ['pricing', 'quote'],
      });
    });

    it('應該能列出所有範本', async () => {
      const result = await manager.listTemplates({});

      expect(result.templates).toBeDefined();
      expect(result.templates.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('應該能按分類過濾範本', async () => {
      const result = await manager.listTemplates({
        category: 'PRODUCT_DEMO' as TemplateCategory,
      });

      expect(result.templates.length).toBeGreaterThan(0);
      result.templates.forEach((template) => {
        expect(template.category).toBe('PRODUCT_DEMO');
      });
    });

    it('應該能按標籤過濾範本', async () => {
      const result = await manager.listTemplates({
        tags: ['pricing'],
      });

      expect(result.templates.length).toBeGreaterThan(0);
    });

    it('應該能搜索範本', async () => {
      const result = await manager.listTemplates({
        search: '價格',
      });

      expect(result.templates.length).toBeGreaterThan(0);
      expect(result.templates[0].name).toContain('價格');
    });

    it('應該支持分頁', async () => {
      const page1 = await manager.listTemplates({
        page: 1,
        pageSize: 1,
      });

      const page2 = await manager.listTemplates({
        page: 2,
        pageSize: 1,
      });

      expect(page1.templates.length).toBe(1);
      expect(page2.templates.length).toBeGreaterThanOrEqual(0);
      if (page2.templates.length > 0) {
        expect(page1.templates[0].id).not.toBe(page2.templates[0].id);
      }
    });

    it('應該能按創建時間排序', async () => {
      const result = await manager.listTemplates({
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      expect(result.templates.length).toBeGreaterThan(0);
      // 驗證降序排序
      for (let i = 0; i < result.templates.length - 1; i++) {
        const current = new Date(result.templates[i].created_at);
        const next = new Date(result.templates[i + 1].created_at);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe('duplicateTemplate', () => {
    it('應該能複製範本', async () => {
      const duplicated = await manager.duplicateTemplate(testTemplateId, testUserId);

      expect(duplicated).toBeDefined();
      expect(duplicated.id).not.toBe(testTemplateId);
      expect(duplicated.name).toContain('副本');
      expect(duplicated.created_by).toBe(testUserId);
      expect(duplicated.version).toBe(1); // 新範本版本從 1 開始
      expect(duplicated.content).toBeDefined();
    });
  });

  describe('deleteTemplate', () => {
    let templateToDelete: string;

    beforeAll(async () => {
      const template = await manager.createTemplate(testUserId, {
        name: '待刪除範本',
        category: 'CUSTOM' as TemplateCategory,
        content: 'To be deleted',
        variables: {},
      });
      templateToDelete = template.id;
    });

    it('應該能軟刪除範本', async () => {
      await manager.deleteTemplate(templateToDelete, testUserId);

      const deletedTemplate = await prisma.proposalTemplate.findUnique({
        where: { id: templateToDelete },
      });

      expect(deletedTemplate).toBeDefined();
      expect(deletedTemplate?.is_active).toBe(false);
    });
  });

  describe('getTemplateStats', () => {
    it('應該能獲取範本統計信息', async () => {
      const stats = await manager.getTemplateStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byAccessLevel).toBeDefined();
      expect(stats.active).toBeGreaterThan(0);
    });
  });

  describe('incrementUsageCount', () => {
    it('應該能增加範本使用次數', async () => {
      const before = await manager.getTemplate(testTemplateId);
      const beforeCount = before?.usage_count || 0;

      await manager.incrementUsageCount(testTemplateId);

      const after = await manager.getTemplate(testTemplateId);
      expect(after?.usage_count).toBe(beforeCount + 1);
    });
  });
});
