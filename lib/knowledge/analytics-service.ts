/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫分析統計服務
 * ================================================================
 *
 * 【服務功能】
 * 提供知識庫的全面分析統計功能，包括使用頻率、熱門內容、健康度評估等。
 *
 * 【主要職責】
 * • 使用頻率統計 - 文檔查看、編輯、下載次數統計
 * • 熱門內容排行 - Top文檔、最新文檔、最大文檔
 * • 知識庫健康度 - 數量、類型、狀態、分類分布
 * • 搜索趨勢分析 - 熱門搜索詞、搜索頻率
 * • 用戶活動統計 - 活躍貢獻者、編輯者分析
 *
 * 【統計維度】
 * • 時間範圍: 今日/本週/本月/自定義
 * • 數據聚合: 計數、求和、平均、排序
 * • 多維分析: 按類型/狀態/用戶/資料夾
 *
 * @author Claude Code
 * @date 2025-10-03
 * @sprint Sprint 6 Week 12
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * 時間範圍枚舉
 */
export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom'
}

/**
 * 統計數據接口定義
 */
export interface AnalyticsOverview {
  // 總體統計
  totalDocuments: number;
  totalViews: number;
  totalEdits: number;
  totalDownloads: number;

  // 增長統計
  documentsGrowth: number; // 相比上期增長百分比
  viewsGrowth: number;
  editsGrowth: number;

  // 時間範圍
  timeRange: TimeRange;
  startDate: Date;
  endDate: Date;
}

export interface DocumentStats {
  documentId: number;
  title: string;
  category: string;
  mimeType: string | null;
  viewCount: number;
  editCount: number;
  downloadCount: number;
  fileSize: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface TypeDistribution {
  mimeType: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface UserActivity {
  userId: number;
  userName: string;
  documentsCreated: number;
  documentsEdited: number;
  totalViews: number;
  lastActiveAt: Date;
}

export interface SearchTrend {
  keyword: string;
  searchCount: number;
  lastSearchedAt: Date;
}

export interface FolderUsage {
  folderId: number | null;
  folderName: string;
  documentCount: number;
  totalSize: number;
  lastUpdated: Date;
}

/**
 * 知識庫分析統計服務類
 */
export class KnowledgeAnalyticsService {

  /**
   * 獲取時間範圍的開始和結束日期
   */
  private getDateRange(timeRange: TimeRange, customStart?: Date, customEnd?: Date): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;

    switch (timeRange) {
      case TimeRange.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case TimeRange.WEEK:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case TimeRange.MONTH:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case TimeRange.CUSTOM:
        if (!customStart || !customEnd) {
          throw new Error('自定義時間範圍需要提供開始和結束日期');
        }
        startDate = customStart;
        endDate = customEnd;
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  /**
   * 獲取總體統計概覽
   */
  async getOverview(timeRange: TimeRange = TimeRange.MONTH, customStart?: Date, customEnd?: Date): Promise<AnalyticsOverview> {
    const { startDate, endDate } = this.getDateRange(timeRange, customStart, customEnd);

    // 上一期時間範圍（用於計算增長率）
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate);

    // 當前期間統計
    const [totalDocuments, totalViews, totalEdits, totalDownloads] = await Promise.all([
      // 文檔總數
      prisma.knowledgeBase.count({
        where: {
          created_at: { gte: startDate, lte: endDate },
          status: 'ACTIVE'
        }
      }),

      // 查看總次數
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_VIEW',
          created_at: { gte: startDate, lte: endDate }
        }
      }),

      // 編輯總次數
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_UPDATED',
          created_at: { gte: startDate, lte: endDate }
        }
      }),

      // 下載總次數
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_DOWNLOADED',
          created_at: { gte: startDate, lte: endDate }
        }
      })
    ]);

    // 上一期間統計（用於計算增長）
    const [prevDocuments, prevViews, prevEdits] = await Promise.all([
      prisma.knowledgeBase.count({
        where: {
          created_at: { gte: prevStartDate, lte: prevEndDate },
          status: 'ACTIVE'
        }
      }),

      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_VIEW',
          created_at: { gte: prevStartDate, lte: prevEndDate }
        }
      }),

      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_UPDATED',
          created_at: { gte: prevStartDate, lte: prevEndDate }
        }
      })
    ]);

    // 計算增長率
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalDocuments,
      totalViews,
      totalEdits,
      totalDownloads,
      documentsGrowth: calculateGrowth(totalDocuments, prevDocuments),
      viewsGrowth: calculateGrowth(totalViews, prevViews),
      editsGrowth: calculateGrowth(totalEdits, prevEdits),
      timeRange,
      startDate,
      endDate
    };
  }

  /**
   * 獲取熱門文檔排行（按查看次數）
   */
  async getTopViewedDocuments(limit: number = 10, timeRange: TimeRange = TimeRange.MONTH): Promise<DocumentStats[]> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    // 從審計日誌中統計文檔查看次數
    const viewStats = await prisma.auditLog.groupBy({
      by: ['entity_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_VIEW',
        created_at: { gte: startDate, lte: endDate },
        entity_id: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    // 獲取文檔詳細信息
    const documentIds = viewStats.map(stat => stat.entity_id).filter((id): id is number => id !== null);

    const documents = await prisma.knowledgeBase.findMany({
      where: {
        id: { in: documentIds }
      },
      include: {
        _count: {
          select: {
            chunks: true
          }
        }
      }
    });

    // 獲取編輯和下載統計
    const editStats = await this.getDocumentEditCounts(documentIds, startDate, endDate);
    const downloadStats = await this.getDocumentDownloadCounts(documentIds, startDate, endDate);

    // 組合結果
    return viewStats.map(stat => {
      const doc = documents.find(d => d.id === stat.entity_id);
      if (!doc) return null;

      return {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        mimeType: doc.mime_type,
        viewCount: stat._count.id,
        editCount: editStats.get(doc.id) || 0,
        downloadCount: downloadStats.get(doc.id) || 0,
        fileSize: doc.file_size,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      };
    }).filter((stat): stat is DocumentStats => stat !== null);
  }

  /**
   * 獲取最常編輯的文檔
   */
  async getTopEditedDocuments(limit: number = 10, timeRange: TimeRange = TimeRange.MONTH): Promise<DocumentStats[]> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    const editStats = await prisma.auditLog.groupBy({
      by: ['entity_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_UPDATED',
        created_at: { gte: startDate, lte: endDate },
        entity_id: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    const documentIds = editStats.map(stat => stat.entity_id).filter((id): id is number => id !== null);

    const documents = await prisma.knowledgeBase.findMany({
      where: {
        id: { in: documentIds }
      }
    });

    const viewStats = await this.getDocumentViewCounts(documentIds, startDate, endDate);
    const downloadStats = await this.getDocumentDownloadCounts(documentIds, startDate, endDate);

    return editStats.map(stat => {
      const doc = documents.find(d => d.id === stat.entity_id);
      if (!doc) return null;

      return {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        mimeType: doc.mime_type,
        viewCount: viewStats.get(doc.id) || 0,
        editCount: stat._count.id,
        downloadCount: downloadStats.get(doc.id) || 0,
        fileSize: doc.file_size,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      };
    }).filter((stat): stat is DocumentStats => stat !== null);
  }

  /**
   * 獲取文檔類型分布
   */
  async getTypeDistribution(): Promise<TypeDistribution[]> {
    const total = await prisma.knowledgeBase.count({
      where: { status: 'ACTIVE' }
    });

    const distribution = await prisma.knowledgeBase.groupBy({
      by: ['mime_type'],
      where: { status: 'ACTIVE' },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    return distribution.map(item => ({
      mimeType: item.mime_type || 'unknown',
      count: item._count.id,
      percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0
    }));
  }

  /**
   * 獲取文檔分類分布
   */
  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const total = await prisma.knowledgeBase.count({
      where: { status: 'ACTIVE' }
    });

    const distribution = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    return distribution.map(item => ({
      category: item.category,
      count: item._count.id,
      percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0
    }));
  }

  /**
   * 獲取文檔狀態分布
   */
  async getStatusDistribution(): Promise<StatusDistribution[]> {
    const total = await prisma.knowledgeBase.count();

    const distribution = await prisma.knowledgeBase.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    return distribution.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0
    }));
  }

  /**
   * 獲取資料夾使用情況
   */
  async getFolderUsage(limit: number = 10): Promise<FolderUsage[]> {
    // 獲取所有資料夾及其文檔統計
    const folders = await prisma.knowledgeFolder.findMany({
      include: {
        _count: {
          select: {
            documents: true
          }
        },
        documents: {
          select: {
            file_size: true,
            updated_at: true
          },
          orderBy: {
            updated_at: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        documents: {
          _count: 'desc'
        }
      },
      take: limit
    });

    // 包含根目錄（無資料夾）的文檔
    const rootDocuments = await prisma.knowledgeBase.findMany({
      where: {
        folder_id: null,
        status: 'ACTIVE'
      },
      select: {
        file_size: true,
        updated_at: true
      }
    });

    const rootCount = rootDocuments.length;
    const rootSize = rootDocuments.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const rootLastUpdated = rootDocuments.length > 0
      ? new Date(Math.max(...rootDocuments.map(d => d.updated_at.getTime())))
      : new Date();

    const folderUsage: FolderUsage[] = folders.map(folder => ({
      folderId: folder.id,
      folderName: folder.name,
      documentCount: folder._count.documents,
      totalSize: folder.documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
      lastUpdated: folder.documents[0]?.updated_at || folder.updated_at
    }));

    // 添加根目錄統計
    if (rootCount > 0) {
      folderUsage.unshift({
        folderId: null,
        folderName: '根目錄',
        documentCount: rootCount,
        totalSize: rootSize,
        lastUpdated: rootLastUpdated
      });
    }

    return folderUsage;
  }

  /**
   * 獲取用戶活動統計
   */
  async getUserActivity(limit: number = 10, timeRange: TimeRange = TimeRange.MONTH): Promise<UserActivity[]> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    // 獲取創建文檔統計
    const creatorStats = await prisma.knowledgeBase.groupBy({
      by: ['created_by'],
      where: {
        created_at: { gte: startDate, lte: endDate },
        created_by: { not: null }
      },
      _count: {
        id: true
      }
    });

    // 獲取編輯文檔統計
    const editorStats = await prisma.auditLog.groupBy({
      by: ['user_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_UPDATED',
        created_at: { gte: startDate, lte: endDate },
        user_id: { not: null }
      },
      _count: {
        id: true
      }
    });

    // 獲取查看統計
    const viewerStats = await prisma.auditLog.groupBy({
      by: ['user_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_VIEW',
        created_at: { gte: startDate, lte: endDate },
        user_id: { not: null }
      },
      _count: {
        id: true
      }
    });

    // 收集所有用戶ID
    const userIds = new Set<number>();
    creatorStats.forEach(s => s.created_by && userIds.add(s.created_by));
    editorStats.forEach(s => s.user_id && userIds.add(s.user_id));
    viewerStats.forEach(s => s.user_id && userIds.add(s.user_id));

    // 獲取用戶信息
    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(userIds) }
      },
      select: {
        id: true,
        name: true,
        last_login_at: true
      }
    });

    // 組合統計數據
    const activityMap = new Map<number, UserActivity>();

    creatorStats.forEach(stat => {
      if (!stat.created_by) return;
      const user = users.find(u => u.id === stat.created_by);
      if (!user) return;

      activityMap.set(stat.created_by, {
        userId: stat.created_by,
        userName: user.name || 'Unknown',
        documentsCreated: stat._count.id,
        documentsEdited: 0,
        totalViews: 0,
        lastActiveAt: user.last_login_at || new Date()
      });
    });

    editorStats.forEach(stat => {
      if (!stat.user_id) return;
      const existing = activityMap.get(stat.user_id);
      if (existing) {
        existing.documentsEdited = stat._count.id;
      } else {
        const user = users.find(u => u.id === stat.user_id);
        if (!user) return;

        activityMap.set(stat.user_id, {
          userId: stat.user_id,
          userName: user.name || 'Unknown',
          documentsCreated: 0,
          documentsEdited: stat._count.id,
          totalViews: 0,
          lastActiveAt: user.last_login_at || new Date()
        });
      }
    });

    viewerStats.forEach(stat => {
      if (!stat.user_id) return;
      const existing = activityMap.get(stat.user_id);
      if (existing) {
        existing.totalViews = stat._count.id;
      }
    });

    // 轉換為數組並排序
    return Array.from(activityMap.values())
      .sort((a, b) => {
        const scoreA = a.documentsCreated * 3 + a.documentsEdited * 2 + a.totalViews;
        const scoreB = b.documentsCreated * 3 + b.documentsEdited * 2 + b.totalViews;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * 輔助方法：獲取文檔查看次數
   */
  private async getDocumentViewCounts(documentIds: number[], startDate: Date, endDate: Date): Promise<Map<number, number>> {
    const stats = await prisma.auditLog.groupBy({
      by: ['entity_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_VIEW',
        entity_id: { in: documentIds },
        created_at: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    });

    const map = new Map<number, number>();
    stats.forEach(stat => {
      if (stat.entity_id) {
        map.set(stat.entity_id, stat._count.id);
      }
    });
    return map;
  }

  /**
   * 輔助方法：獲取文檔編輯次數
   */
  private async getDocumentEditCounts(documentIds: number[], startDate: Date, endDate: Date): Promise<Map<number, number>> {
    const stats = await prisma.auditLog.groupBy({
      by: ['entity_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_UPDATED',
        entity_id: { in: documentIds },
        created_at: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    });

    const map = new Map<number, number>();
    stats.forEach(stat => {
      if (stat.entity_id) {
        map.set(stat.entity_id, stat._count.id);
      }
    });
    return map;
  }

  /**
   * 輔助方法：獲取文檔下載次數
   */
  private async getDocumentDownloadCounts(documentIds: number[], startDate: Date, endDate: Date): Promise<Map<number, number>> {
    const stats = await prisma.auditLog.groupBy({
      by: ['entity_id'],
      where: {
        entity_type: 'KnowledgeBase',
        action: 'DOCUMENT_DOWNLOADED',
        entity_id: { in: documentIds },
        created_at: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    });

    const map = new Map<number, number>();
    stats.forEach(stat => {
      if (stat.entity_id) {
        map.set(stat.entity_id, stat._count.id);
      }
    });
    return map;
  }
}

// 導出服務實例
export const knowledgeAnalyticsService = new KnowledgeAnalyticsService();
