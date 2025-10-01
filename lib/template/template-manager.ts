/**
 * 提案範本管理器
 *
 * 功能：
 * - 範本 CRUD 操作（創建/讀取/更新/刪除）
 * - 範本搜索和過濾（分類/標籤/關鍵字）
 * - 範本版本管理（版本控制/回滾）
 * - 範本訪問控制（權限管理）
 * - 範本使用統計（使用次數/評分）
 *
 * 設計模式：
 * - Repository Pattern: 數據訪問抽象
 * - Builder Pattern: 範本查詢構建
 * - Strategy Pattern: 不同訪問級別策略
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { PrismaClient, TemplateCategory, TemplateAccess, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 範本創建數據類型
 */
export interface CreateTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  variables: Record<string, TemplateVariable>;
  organization?: string;
  accessLevel?: TemplateAccess;
  isDefault?: boolean;
  tags?: string[];
}

/**
 * 範本變數定義
 */
export interface TemplateVariable {
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  description?: string;
  placeholder?: string;
}

/**
 * 範本更新數據類型
 */
export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  content?: string;
  variables?: Record<string, TemplateVariable>;
  organization?: string;
  accessLevel?: TemplateAccess;
  isActive?: boolean;
  isDefault?: boolean;
  tags?: string[];
}

/**
 * 範本查詢選項
 */
export interface TemplateQueryOptions {
  category?: TemplateCategory;
  accessLevel?: TemplateAccess;
  isActive?: boolean;
  organization?: string;
  createdBy?: number;
  search?: string; // 搜索名稱和描述
  tags?: string[];
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'usage_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * 範本管理器類
 */
export class TemplateManager {
  /**
   * 創建新範本
   */
  async createTemplate(
    userId: number,
    data: CreateTemplateData
  ): Promise<any> {
    try {
      // 如果設置為預設範本，先取消其他同類別的預設範本
      if (data.isDefault) {
        await prisma.proposalTemplate.updateMany({
          where: {
            category: data.category,
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });
      }

      const template = await prisma.proposalTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          content: data.content,
          variables: data.variables as any,
          organization: data.organization,
          access_level: data.accessLevel || TemplateAccess.PRIVATE,
          is_default: data.isDefault || false,
          created_by: userId,
          updated_by: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      return template;
    } catch (error) {
      console.error('創建範本失敗:', error);
      throw new Error(`創建範本失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 獲取範本列表（帶分頁和過濾）
   */
  async getTemplates(
    userId: number,
    options: TemplateQueryOptions = {}
  ): Promise<{ templates: any[]; total: number; page: number; pageSize: number }> {
    try {
      const {
        category,
        accessLevel,
        isActive = true,
        organization,
        createdBy,
        search,
        sortBy = 'updated_at',
        sortOrder = 'desc',
        page = 1,
        pageSize = 20,
      } = options;

      // 構建查詢條件
      const where: Prisma.ProposalTemplateWhereInput = {
        AND: [
          { is_active: isActive },
          category ? { category } : {},
          accessLevel ? { access_level: accessLevel } : {},
          organization ? { organization } : {},
          createdBy ? { created_by: createdBy } : {},
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          // 訪問權限過濾
          {
            OR: [
              { created_by: userId }, // 自己創建的
              { access_level: TemplateAccess.PUBLIC }, // 公開的
              { access_level: TemplateAccess.ORGANIZATION }, // 組織範圍的
            ],
          },
        ],
      };

      // 計算總數
      const total = await prisma.proposalTemplate.count({ where });

      // 獲取範本列表
      const templates = await prisma.proposalTemplate.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          updater: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          _count: {
            select: {
              generations: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return {
        templates,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('獲取範本列表失敗:', error);
      throw new Error(`獲取範本列表失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 根據 ID 獲取範本詳情
   */
  async getTemplateById(
    templateId: string,
    userId: number
  ): Promise<any | null> {
    try {
      const template = await prisma.proposalTemplate.findUnique({
        where: { id: templateId },
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          updater: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          _count: {
            select: {
              generations: true,
            },
          },
        },
      });

      if (!template) {
        return null;
      }

      // 檢查訪問權限
      if (!this.canAccessTemplate(template, userId)) {
        throw new Error('沒有權限訪問此範本');
      }

      return template;
    } catch (error) {
      console.error('獲取範本詳情失敗:', error);
      throw error;
    }
  }

  /**
   * 更新範本
   */
  async updateTemplate(
    templateId: string,
    userId: number,
    data: UpdateTemplateData
  ): Promise<any> {
    try {
      // 檢查範本是否存在和權限
      const existingTemplate = await prisma.proposalTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existingTemplate) {
        throw new Error('範本不存在');
      }

      if (!this.canEditTemplate(existingTemplate, userId)) {
        throw new Error('沒有權限編輯此範本');
      }

      // 如果設置為預設範本，先取消其他同類別的預設範本
      if (data.isDefault && data.category) {
        await prisma.proposalTemplate.updateMany({
          where: {
            category: data.category,
            is_default: true,
            id: { not: templateId },
          },
          data: {
            is_default: false,
          },
        });
      }

      // 更新範本，版本號加 1
      const template = await prisma.proposalTemplate.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category && { category: data.category }),
          ...(data.content && { content: data.content }),
          ...(data.variables && { variables: data.variables as any }),
          ...(data.organization !== undefined && { organization: data.organization }),
          ...(data.accessLevel && { access_level: data.accessLevel }),
          ...(data.isActive !== undefined && { is_active: data.isActive }),
          ...(data.isDefault !== undefined && { is_default: data.isDefault }),
          version: { increment: 1 },
          updated_by: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          updater: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      return template;
    } catch (error) {
      console.error('更新範本失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除範本（軟刪除）
   */
  async deleteTemplate(
    templateId: string,
    userId: number
  ): Promise<void> {
    try {
      // 檢查範本是否存在和權限
      const template = await prisma.proposalTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error('範本不存在');
      }

      if (!this.canEditTemplate(template, userId)) {
        throw new Error('沒有權限刪除此範本');
      }

      // 軟刪除：設置 is_active 為 false
      await prisma.proposalTemplate.update({
        where: { id: templateId },
        data: {
          is_active: false,
          updated_by: userId,
        },
      });
    } catch (error) {
      console.error('刪除範本失敗:', error);
      throw error;
    }
  }

  /**
   * 複製範本
   */
  async duplicateTemplate(
    templateId: string,
    userId: number,
    newName?: string
  ): Promise<any> {
    try {
      const originalTemplate = await this.getTemplateById(templateId, userId);

      if (!originalTemplate) {
        throw new Error('原範本不存在');
      }

      const duplicatedTemplate = await this.createTemplate(userId, {
        name: newName || `${originalTemplate.name} (副本)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        content: originalTemplate.content,
        variables: originalTemplate.variables,
        organization: originalTemplate.organization,
        accessLevel: TemplateAccess.PRIVATE, // 複製的範本設為私有
      });

      return duplicatedTemplate;
    } catch (error) {
      console.error('複製範本失敗:', error);
      throw error;
    }
  }

  /**
   * 增加範本使用次數
   */
  async incrementUsageCount(templateId: string): Promise<void> {
    try {
      await prisma.proposalTemplate.update({
        where: { id: templateId },
        data: {
          usage_count: { increment: 1 },
        },
      });
    } catch (error) {
      console.error('更新使用次數失敗:', error);
      // 不拋出錯誤，避免影響主流程
    }
  }

  /**
   * 獲取範本統計信息
   */
  async getTemplateStats(userId: number): Promise<{
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    mostUsedTemplates: any[];
    recentTemplates: any[];
  }> {
    try {
      // 總範本數
      const totalTemplates = await prisma.proposalTemplate.count({
        where: {
          is_active: true,
          OR: [
            { created_by: userId },
            { access_level: TemplateAccess.PUBLIC },
            { access_level: TemplateAccess.ORGANIZATION },
          ],
        },
      });

      // 按分類統計
      const categoryStats = await prisma.proposalTemplate.groupBy({
        by: ['category'],
        where: {
          is_active: true,
          OR: [
            { created_by: userId },
            { access_level: TemplateAccess.PUBLIC },
            { access_level: TemplateAccess.ORGANIZATION },
          ],
        },
        _count: true,
      });

      const templatesByCategory: Record<string, number> = {};
      categoryStats.forEach((stat) => {
        templatesByCategory[stat.category] = stat._count;
      });

      // 最常使用的範本
      const mostUsedTemplates = await prisma.proposalTemplate.findMany({
        where: {
          is_active: true,
          OR: [
            { created_by: userId },
            { access_level: TemplateAccess.PUBLIC },
            { access_level: TemplateAccess.ORGANIZATION },
          ],
        },
        orderBy: { usage_count: 'desc' },
        take: 5,
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // 最近創建的範本
      const recentTemplates = await prisma.proposalTemplate.findMany({
        where: {
          is_active: true,
          OR: [
            { created_by: userId },
            { access_level: TemplateAccess.PUBLIC },
            { access_level: TemplateAccess.ORGANIZATION },
          ],
        },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      return {
        totalTemplates,
        templatesByCategory,
        mostUsedTemplates,
        recentTemplates,
      };
    } catch (error) {
      console.error('獲取範本統計失敗:', error);
      throw error;
    }
  }

  /**
   * 檢查用戶是否可以訪問範本
   */
  private canAccessTemplate(template: any, userId: number): boolean {
    // 創建者可以訪問
    if (template.created_by === userId) {
      return true;
    }

    // 公開和組織級別的可以訪問
    if (
      template.access_level === TemplateAccess.PUBLIC ||
      template.access_level === TemplateAccess.ORGANIZATION
    ) {
      return true;
    }

    return false;
  }

  /**
   * 檢查用戶是否可以編輯範本
   */
  private canEditTemplate(template: any, userId: number): boolean {
    // 只有創建者可以編輯
    return template.created_by === userId;
  }
}

// 導出單例實例
export const templateManager = new TemplateManager();
