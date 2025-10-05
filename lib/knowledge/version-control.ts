/**
 * 知識庫版本控制系統
 *
 * 功能：
 * - 追蹤知識庫文檔的所有修改歷史
 * - 支援版本比較和回溯
 * - 記錄變更詳情和差異
 * - 提供版本標籤和分類
 *
 * 參考: lib/workflow/version-control.ts (Sprint 5 提案版本控制)
 * 作者：Claude Code
 * 日期：2025-10-03
 * Sprint: 6 Week 12
 */

import { PrismaClient, KnowledgeBase, KnowledgeVersion } from '@prisma/client';

/**
 * 版本創建選項
 */
export interface CreateVersionOptions {
  changeSummary?: string;      // 變更摘要
  isMajor?: boolean;             // 是否為主要版本
  tags?: string[];               // 版本標籤
  autoGenerate?: boolean;        // 自動生成標記
}

/**
 * 版本比較結果
 */
export interface VersionDiff {
  field: string;                           // 欄位名稱
  oldValue: any;                           // 舊值
  newValue: any;                           // 新值
  changeType: 'added' | 'removed' | 'modified'; // 變更類型
}

/**
 * 版本詳情（含創建者信息）
 */
export interface VersionDetail extends KnowledgeVersion {
  creatorName?: string;          // 創建者姓名
  diffFromParent?: VersionDiff[]; // 與父版本的差異
}

/**
 * 版本統計信息
 */
export interface VersionStats {
  totalVersions: number;         // 總版本數
  majorVersions: number;         // 主要版本數
  minorVersions: number;         // 次要版本數
  lastModified: Date;            // 最後修改時間
  contributors: number;          // 貢獻者數量
}

/**
 * 知識庫版本控制系統類
 */
export class KnowledgeVersionControl {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 創建新版本（快照）
   *
   * @param knowledgeBaseId - 知識庫文檔ID
   * @param userId - 創建者ID
   * @param changeSummary - 變更摘要
   * @param options - 創建選項
   * @returns 創建的版本
   */
  async createVersion(
    knowledgeBaseId: number,
    userId: number,
    changeSummary?: string,
    options: CreateVersionOptions = {}
  ): Promise<KnowledgeVersion> {
    // 1. 獲取當前知識庫文檔數據
    const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
      where: { id: knowledgeBaseId },
    });

    if (!knowledgeBase) {
      throw new Error(`Knowledge base ${knowledgeBaseId} not found`);
    }

    // 2. 獲取最新版本號
    const latestVersion = await this.prisma.knowledgeVersion.findFirst({
      where: { knowledge_base_id: knowledgeBaseId },
      orderBy: { version: 'desc' },
    });

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // 3. 計算變更欄位（如果有父版本）
    let changedFields: any = null;
    if (latestVersion) {
      changedFields = this.calculateChangedFields(latestVersion, knowledgeBase);
    }

    // 4. 創建版本快照
    const version = await this.prisma.knowledgeVersion.create({
      data: {
        knowledge_base_id: knowledgeBaseId,
        version: newVersionNumber,
        title: knowledgeBase.title,
        content: knowledgeBase.content,
        file_path: knowledgeBase.file_path,
        file_size: knowledgeBase.file_size,
        mime_type: knowledgeBase.mime_type,
        metadata: knowledgeBase.metadata as any,
        change_summary: changeSummary || options.changeSummary,
        changed_fields: changedFields,
        parent_version: latestVersion?.version,
        created_by: userId,
        is_major: options.isMajor || false,
        tags: options.tags || [],
      },
    });

    return version;
  }

  /**
   * 比較兩個版本的差異
   *
   * @param versionId1 - 版本1 ID
   * @param versionId2 - 版本2 ID
   * @returns 差異列表
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<VersionDiff[]> {
    const [version1, version2] = await Promise.all([
      this.prisma.knowledgeVersion.findUnique({ where: { id: versionId1 } }),
      this.prisma.knowledgeVersion.findUnique({ where: { id: versionId2 } }),
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    return this.generateDiff(version1, version2);
  }

  /**
   * 回溯到特定版本
   *
   * @param knowledgeBaseId - 知識庫文檔ID
   * @param versionId - 目標版本ID
   * @param userId - 執行用戶ID
   * @returns 回溯後的知識庫文檔
   */
  async revertToVersion(
    knowledgeBaseId: number,
    versionId: string,
    userId: number
  ): Promise<KnowledgeBase> {
    // 1. 獲取目標版本
    const targetVersion = await this.prisma.knowledgeVersion.findUnique({
      where: { id: versionId },
    });

    if (!targetVersion || targetVersion.knowledge_base_id !== knowledgeBaseId) {
      throw new Error('Version not found or does not belong to this knowledge base');
    }

    // 2. 先創建當前狀態的版本（回溯前快照）
    await this.createVersion(knowledgeBaseId, userId, 'Pre-revert snapshot', {
      tags: ['pre-revert'],
      autoGenerate: true,
    });

    // 3. 恢復知識庫文檔到目標版本狀態
    const restoredKnowledgeBase = await this.prisma.knowledgeBase.update({
      where: { id: knowledgeBaseId },
      data: {
        title: targetVersion.title,
        content: targetVersion.content,
        file_path: targetVersion.file_path,
        file_size: targetVersion.file_size,
        mime_type: targetVersion.mime_type,
        metadata: targetVersion.metadata as any,
        updated_at: new Date(),
        updated_by: userId,
      },
    });

    // 4. 創建回溯後的新版本
    await this.createVersion(
      knowledgeBaseId,
      userId,
      `Reverted to version ${targetVersion.version}`,
      {
        tags: ['reverted', `from-v${targetVersion.version}`],
      }
    );

    return restoredKnowledgeBase;
  }

  /**
   * 獲取知識庫文檔的版本歷史
   *
   * @param knowledgeBaseId - 知識庫文檔ID
   * @param limit - 限制數量
   * @param offset - 偏移量
   * @returns 版本歷史列表
   */
  async getVersionHistory(
    knowledgeBaseId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<VersionDetail[]> {
    const versions = await this.prisma.knowledgeVersion.findMany({
      where: { knowledge_base_id: knowledgeBaseId },
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
      orderBy: { version: 'desc' },
      take: limit,
      skip: offset,
    });

    // 為每個版本添加與父版本的差異
    const versionsWithDiff = await Promise.all(
      versions.map(async (version) => {
        let diffFromParent: VersionDiff[] | undefined;

        if (version.parent_version) {
          const parentVersion = await this.prisma.knowledgeVersion.findFirst({
            where: {
              knowledge_base_id: knowledgeBaseId,
              version: version.parent_version,
            },
          });

          if (parentVersion) {
            diffFromParent = this.generateDiff(parentVersion, version);
          }
        }

        return {
          ...version,
          creatorName: `${version.creator.first_name} ${version.creator.last_name}`,
          diffFromParent,
        };
      })
    );

    return versionsWithDiff;
  }

  /**
   * 獲取特定版本詳情
   *
   * @param versionId - 版本ID
   * @returns 版本詳情
   */
  async getVersionDetail(versionId: string): Promise<VersionDetail | null> {
    const version = await this.prisma.knowledgeVersion.findUnique({
      where: { id: versionId },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        comments: {
          include: {
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!version) {
      return null;
    }

    // 獲取與父版本的差異
    let diffFromParent: VersionDiff[] | undefined;
    if (version.parent_version) {
      const parentVersion = await this.prisma.knowledgeVersion.findFirst({
        where: {
          knowledge_base_id: version.knowledge_base_id,
          version: version.parent_version,
        },
      });

      if (parentVersion) {
        diffFromParent = this.generateDiff(parentVersion, version);
      }
    }

    return {
      ...version,
      creatorName: `${version.creator.first_name} ${version.creator.last_name}`,
      diffFromParent,
    };
  }

  /**
   * 獲取版本統計信息
   *
   * @param knowledgeBaseId - 知識庫文檔ID
   * @returns 統計信息
   */
  async getVersionStats(knowledgeBaseId: number): Promise<VersionStats> {
    const versions = await this.prisma.knowledgeVersion.findMany({
      where: { knowledge_base_id: knowledgeBaseId },
      select: {
        is_major: true,
        created_at: true,
        created_by: true,
      },
    });

    const majorVersions = versions.filter((v) => v.is_major).length;
    const uniqueContributors = new Set(versions.map((v) => v.created_by)).size;
    const lastModified =
      versions.length > 0
        ? versions.reduce((latest, v) =>
            v.created_at > latest ? v.created_at : latest
          , versions[0].created_at)
        : new Date();

    return {
      totalVersions: versions.length,
      majorVersions,
      minorVersions: versions.length - majorVersions,
      lastModified,
      contributors: uniqueContributors,
    };
  }

  /**
   * 為版本添加標籤
   *
   * @param versionId - 版本ID
   * @param tags - 標籤數組
   * @returns 更新後的版本
   */
  async addVersionTags(
    versionId: string,
    tags: string[]
  ): Promise<KnowledgeVersion> {
    const version = await this.prisma.knowledgeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    const existingTags = version.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    return this.prisma.knowledgeVersion.update({
      where: { id: versionId },
      data: { tags: newTags },
    });
  }

  /**
   * 搜索特定標籤的版本
   *
   * @param knowledgeBaseId - 知識庫文檔ID
   * @param tag - 標籤
   * @returns 版本列表
   */
  async findVersionsByTag(
    knowledgeBaseId: number,
    tag: string
  ): Promise<KnowledgeVersion[]> {
    const versions = await this.prisma.knowledgeVersion.findMany({
      where: {
        knowledge_base_id: knowledgeBaseId,
        tags: {
          has: tag,
        },
      },
      orderBy: { version: 'desc' },
    });

    return versions;
  }

  /**
   * 計算變更欄位
   *
   * @param oldVersion - 舊版本
   * @param newKnowledgeBase - 新知識庫數據
   * @returns 變更欄位對象
   * @private
   */
  private calculateChangedFields(
    oldVersion: KnowledgeVersion,
    newKnowledgeBase: KnowledgeBase
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    // 比較標題
    if (oldVersion.title !== newKnowledgeBase.title) {
      changes.title = { old: oldVersion.title, new: newKnowledgeBase.title };
    }

    // 比較內容
    if (oldVersion.content !== newKnowledgeBase.content) {
      changes.content = {
        old: oldVersion.content,
        new: newKnowledgeBase.content,
      };
    }

    // 比較檔案路徑
    if (oldVersion.file_path !== newKnowledgeBase.file_path) {
      changes.file_path = {
        old: oldVersion.file_path,
        new: newKnowledgeBase.file_path,
      };
    }

    // 比較檔案大小
    if (oldVersion.file_size !== newKnowledgeBase.file_size) {
      changes.file_size = {
        old: oldVersion.file_size,
        new: newKnowledgeBase.file_size,
      };
    }

    // 比較 MIME 類型
    if (oldVersion.mime_type !== newKnowledgeBase.mime_type) {
      changes.mime_type = {
        old: oldVersion.mime_type,
        new: newKnowledgeBase.mime_type,
      };
    }

    return changes;
  }

  /**
   * 生成兩個版本的差異
   *
   * @param version1 - 版本1
   * @param version2 - 版本2
   * @returns 差異列表
   * @private
   */
  private generateDiff(
    version1: KnowledgeVersion,
    version2: KnowledgeVersion
  ): VersionDiff[] {
    const diffs: VersionDiff[] = [];

    // 比較標題
    if (version1.title !== version2.title) {
      diffs.push({
        field: 'title',
        oldValue: version1.title,
        newValue: version2.title,
        changeType: 'modified',
      });
    }

    // 比較內容
    if (version1.content !== version2.content) {
      diffs.push({
        field: 'content',
        oldValue: version1.content,
        newValue: version2.content,
        changeType: version1.content ? 'modified' : 'added',
      });
    }

    // 比較檔案路徑
    if (version1.file_path !== version2.file_path) {
      diffs.push({
        field: 'file_path',
        oldValue: version1.file_path,
        newValue: version2.file_path,
        changeType: version1.file_path ? 'modified' : 'added',
      });
    }

    // 比較檔案大小
    if (version1.file_size !== version2.file_size) {
      diffs.push({
        field: 'file_size',
        oldValue: version1.file_size,
        newValue: version2.file_size,
        changeType: 'modified',
      });
    }

    // 比較 MIME 類型
    if (version1.mime_type !== version2.mime_type) {
      diffs.push({
        field: 'mime_type',
        oldValue: version1.mime_type,
        newValue: version2.mime_type,
        changeType: version1.mime_type ? 'modified' : 'added',
      });
    }

    return diffs;
  }
}

/**
 * 工廠函數：創建知識庫版本控制實例
 *
 * @param prisma - Prisma Client 實例
 * @returns KnowledgeVersionControl 實例
 */
export function createKnowledgeVersionControl(
  prisma: PrismaClient
): KnowledgeVersionControl {
  return new KnowledgeVersionControl(prisma);
}
