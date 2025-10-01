/**
 * 提案版本控制系統
 *
 * 功能：
 * - 追蹤提案的所有修改歷史
 * - 支援版本比較和回溯
 * - 記錄變更詳情和差異
 * - 提供版本標籤和分類
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

import { PrismaClient, Proposal, ProposalVersion } from '@prisma/client';

/**
 * 版本創建選項
 */
export interface CreateVersionOptions {
  changeSummary?: string;
  isMajor?: boolean;
  tags?: string[];
  autoGenerate?: boolean;
}

/**
 * 版本比較結果
 */
export interface VersionDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

/**
 * 版本詳情
 */
export interface VersionDetail extends ProposalVersion {
  creatorName?: string;
  diffFromParent?: VersionDiff[];
}

/**
 * 版本統計
 */
export interface VersionStats {
  totalVersions: number;
  majorVersions: number;
  minorVersions: number;
  lastModified: Date;
  contributors: number;
}

/**
 * 版本控制系統類
 */
export class VersionControl {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 創建新版本（快照）
   *
   * @param proposalId - 提案ID
   * @param userId - 創建者ID
   * @param changeSummary - 變更摘要
   * @param options - 創建選項
   * @returns 創建的版本
   */
  async createVersion(
    proposalId: number,
    userId: number,
    changeSummary?: string,
    options: CreateVersionOptions = {}
  ): Promise<ProposalVersion> {
    // 1. 獲取當前提案數據
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { items: true },
    });

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // 2. 獲取最新版本號
    const latestVersion = await this.prisma.proposalVersion.findFirst({
      where: { proposal_id: proposalId },
      orderBy: { version: 'desc' },
    });

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // 3. 計算變更欄位（如果有父版本）
    let changedFields: any = null;
    if (latestVersion) {
      changedFields = this.calculateChangedFields(latestVersion, proposal);
    }

    // 4. 創建版本快照
    const version = await this.prisma.proposalVersion.create({
      data: {
        proposal_id: proposalId,
        version: newVersionNumber,
        title: proposal.title,
        description: proposal.description,
        content: proposal as any, // 完整內容快照
        total_value: proposal.total_value,
        items: proposal.items, // 提案項目快照
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
      this.prisma.proposalVersion.findUnique({ where: { id: versionId1 } }),
      this.prisma.proposalVersion.findUnique({ where: { id: versionId2 } }),
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    return this.generateDiff(version1, version2);
  }

  /**
   * 回溯到特定版本
   *
   * @param proposalId - 提案ID
   * @param versionId - 目標版本ID
   * @param userId - 執行用戶ID
   * @returns 回溯後的提案
   */
  async revertToVersion(
    proposalId: number,
    versionId: string,
    userId: number
  ): Promise<Proposal> {
    // 1. 獲取目標版本
    const targetVersion = await this.prisma.proposalVersion.findUnique({
      where: { id: versionId },
    });

    if (!targetVersion || targetVersion.proposal_id !== proposalId) {
      throw new Error('Version not found or does not belong to this proposal');
    }

    // 2. 先創建當前狀態的版本（回溯前快照）
    await this.createVersion(proposalId, userId, 'Pre-revert snapshot', {
      tags: ['pre-revert'],
      autoGenerate: true,
    });

    // 3. 恢復提案到目標版本狀態
    const restoredProposal = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        title: targetVersion.title,
        description: targetVersion.description,
        total_value: targetVersion.total_value,
        updated_at: new Date(),
      },
    });

    // 4. 創建回溯後的新版本
    await this.createVersion(
      proposalId,
      userId,
      `Reverted to version ${targetVersion.version}`,
      {
        tags: ['reverted', `from-v${targetVersion.version}`],
      }
    );

    return restoredProposal;
  }

  /**
   * 獲取提案的版本歷史
   *
   * @param proposalId - 提案ID
   * @param limit - 限制數量
   * @param offset - 偏移量
   * @returns 版本歷史列表
   */
  async getVersionHistory(
    proposalId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<VersionDetail[]> {
    const versions = await this.prisma.proposalVersion.findMany({
      where: { proposal_id: proposalId },
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
          const parentVersion = await this.prisma.proposalVersion.findFirst({
            where: {
              proposal_id: proposalId,
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
    const version = await this.prisma.proposalVersion.findUnique({
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
      const parentVersion = await this.prisma.proposalVersion.findFirst({
        where: {
          proposal_id: version.proposal_id,
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
   * @param proposalId - 提案ID
   * @returns 統計信息
   */
  async getVersionStats(proposalId: number): Promise<VersionStats> {
    const versions = await this.prisma.proposalVersion.findMany({
      where: { proposal_id: proposalId },
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
  ): Promise<ProposalVersion> {
    const version = await this.prisma.proposalVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    const existingTags = version.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    return this.prisma.proposalVersion.update({
      where: { id: versionId },
      data: { tags: newTags },
    });
  }

  /**
   * 搜索特定標籤的版本
   *
   * @param proposalId - 提案ID
   * @param tag - 標籤
   * @returns 版本列表
   */
  async findVersionsByTag(
    proposalId: number,
    tag: string
  ): Promise<ProposalVersion[]> {
    const versions = await this.prisma.proposalVersion.findMany({
      where: {
        proposal_id: proposalId,
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
   * @param newProposal - 新提案數據
   * @returns 變更欄位對象
   */
  private calculateChangedFields(
    oldVersion: ProposalVersion,
    newProposal: Proposal
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    // 比較標題
    if (oldVersion.title !== newProposal.title) {
      changes.title = { old: oldVersion.title, new: newProposal.title };
    }

    // 比較描述
    if (oldVersion.description !== newProposal.description) {
      changes.description = {
        old: oldVersion.description,
        new: newProposal.description,
      };
    }

    // 比較總價值
    if (oldVersion.total_value?.toString() !== newProposal.total_value?.toString()) {
      changes.total_value = {
        old: oldVersion.total_value?.toString(),
        new: newProposal.total_value?.toString(),
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
   */
  private generateDiff(
    version1: ProposalVersion,
    version2: ProposalVersion
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

    // 比較描述
    if (version1.description !== version2.description) {
      diffs.push({
        field: 'description',
        oldValue: version1.description,
        newValue: version2.description,
        changeType: version1.description ? 'modified' : 'added',
      });
    }

    // 比較總價值
    if (version1.total_value?.toString() !== version2.total_value?.toString()) {
      diffs.push({
        field: 'total_value',
        oldValue: version1.total_value?.toString(),
        newValue: version2.total_value?.toString(),
        changeType: 'modified',
      });
    }

    // 比較提案項目
    const items1 = version1.items as any[];
    const items2 = version2.items as any[];

    if (JSON.stringify(items1) !== JSON.stringify(items2)) {
      diffs.push({
        field: 'items',
        oldValue: items1?.length || 0,
        newValue: items2?.length || 0,
        changeType: 'modified',
      });
    }

    return diffs;
  }
}

/**
 * 工廠函數：創建版本控制實例
 */
export function createVersionControl(prisma: PrismaClient): VersionControl {
  return new VersionControl(prisma);
}
