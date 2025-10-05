/**
 * 用戶行為追蹤引擎
 *
 * 功能：
 * - 追蹤內容瀏覽行為
 * - 追蹤搜索查詢
 * - 追蹤用戶互動
 * - 建立用戶畫像
 * - 生成推薦依據
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 */

import { PrismaClient } from '@prisma/client';

/**
 * 行為類型
 */
export enum BehaviorType {
  VIEW = 'VIEW',                     // 瀏覽內容
  SEARCH = 'SEARCH',                 // 搜索查詢
  CLICK = 'CLICK',                   // 點擊操作
  DOWNLOAD = 'DOWNLOAD',             // 下載文件
  SHARE = 'SHARE',                   // 分享內容
  FAVORITE = 'FAVORITE',             // 收藏
  COMMENT = 'COMMENT',               // 評論
  EDIT = 'EDIT',                     // 編輯
  CREATE = 'CREATE',                 // 創建
  DELETE = 'DELETE',                 // 刪除
}

/**
 * 內容類型
 */
export enum ContentType {
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  PROPOSAL = 'PROPOSAL',
  TEMPLATE = 'TEMPLATE',
  CUSTOMER = 'CUSTOMER',
  MEETING = 'MEETING',
  WORKFLOW = 'WORKFLOW',
}

/**
 * 行為記錄
 */
export interface BehaviorRecord {
  id: string;
  userId: number;
  behaviorType: BehaviorType;
  contentType: ContentType;
  contentId: number;
  contentTitle?: string;
  metadata?: {
    searchQuery?: string;
    viewDuration?: number;      // 瀏覽時長（秒）
    scrollDepth?: number;        // 滾動深度（%）
    clickTarget?: string;        // 點擊目標
    downloadFormat?: string;     // 下載格式
    shareChannel?: string;       // 分享渠道
    commentText?: string;        // 評論內容
    editFields?: string[];       // 編輯欄位
    [key: string]: any;
  };
  timestamp: Date;
  sessionId?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenSize?: string;
  };
}

/**
 * 用戶畫像
 */
export interface UserProfile {
  userId: number;
  interests: {
    contentType: ContentType;
    score: number;              // 興趣分數 0-100
    keywords: string[];         // 關鍵詞
  }[];
  recentActivities: BehaviorRecord[];
  preferences: {
    favoriteContentTypes: ContentType[];
    frequentSearchTerms: string[];
    preferredDownloadFormats: string[];
    activeTimeSlots: string[];  // 活躍時段
  };
  engagementMetrics: {
    totalViews: number;
    totalSearches: number;
    totalClicks: number;
    totalDownloads: number;
    avgViewDuration: number;    // 平均瀏覽時長
    avgScrollDepth: number;     // 平均滾動深度
  };
  lastUpdated: Date;
}

/**
 * 用戶行為追蹤引擎
 */
export class UserBehaviorTracker {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 記錄用戶行為
   */
  async trackBehavior(behavior: Omit<BehaviorRecord, 'id' | 'timestamp'>): Promise<BehaviorRecord> {
    const record: BehaviorRecord = {
      id: this.generateBehaviorId(),
      ...behavior,
      timestamp: new Date(),
    };

    await this.storeBehavior(record);
    return record;
  }

  /**
   * 記錄內容瀏覽
   */
  async trackContentView(
    userId: number,
    contentType: ContentType,
    contentId: number,
    options?: {
      contentTitle?: string;
      viewDuration?: number;
      scrollDepth?: number;
      sessionId?: string;
      deviceInfo?: BehaviorRecord['deviceInfo'];
    }
  ): Promise<BehaviorRecord> {
    return this.trackBehavior({
      userId,
      behaviorType: BehaviorType.VIEW,
      contentType,
      contentId,
      contentTitle: options?.contentTitle,
      metadata: {
        viewDuration: options?.viewDuration,
        scrollDepth: options?.scrollDepth,
      },
      sessionId: options?.sessionId,
      deviceInfo: options?.deviceInfo,
    });
  }

  /**
   * 記錄搜索查詢
   */
  async trackSearch(
    userId: number,
    searchQuery: string,
    options?: {
      resultCount?: number;
      selectedResultId?: number;
      sessionId?: string;
    }
  ): Promise<BehaviorRecord> {
    return this.trackBehavior({
      userId,
      behaviorType: BehaviorType.SEARCH,
      contentType: ContentType.KNOWLEDGE_BASE, // 預設搜索知識庫
      contentId: 0, // 搜索行為沒有特定內容ID
      metadata: {
        searchQuery,
        resultCount: options?.resultCount,
        selectedResultId: options?.selectedResultId,
      },
      sessionId: options?.sessionId,
    });
  }

  /**
   * 記錄點擊行為
   */
  async trackClick(
    userId: number,
    contentType: ContentType,
    contentId: number,
    clickTarget: string,
    options?: {
      sessionId?: string;
    }
  ): Promise<BehaviorRecord> {
    return this.trackBehavior({
      userId,
      behaviorType: BehaviorType.CLICK,
      contentType,
      contentId,
      metadata: {
        clickTarget,
      },
      sessionId: options?.sessionId,
    });
  }

  /**
   * 記錄下載行為
   */
  async trackDownload(
    userId: number,
    contentType: ContentType,
    contentId: number,
    downloadFormat: string,
    options?: {
      contentTitle?: string;
      sessionId?: string;
    }
  ): Promise<BehaviorRecord> {
    return this.trackBehavior({
      userId,
      behaviorType: BehaviorType.DOWNLOAD,
      contentType,
      contentId,
      contentTitle: options?.contentTitle,
      metadata: {
        downloadFormat,
      },
      sessionId: options?.sessionId,
    });
  }

  /**
   * 獲取用戶行為歷史
   */
  async getUserBehaviors(
    userId: number,
    options?: {
      behaviorType?: BehaviorType;
      contentType?: ContentType;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<BehaviorRecord[]> {
    const allBehaviors = await this.getAllBehaviors();

    let filtered = allBehaviors.filter((b) => b.userId === userId);

    if (options?.behaviorType) {
      filtered = filtered.filter((b) => b.behaviorType === options.behaviorType);
    }

    if (options?.contentType) {
      filtered = filtered.filter((b) => b.contentType === options.contentType);
    }

    if (options?.startDate) {
      filtered = filtered.filter((b) => b.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filtered = filtered.filter((b) => b.timestamp <= options.endDate!);
    }

    // 按時間倒序排序
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * 生成用戶畫像
   */
  async generateUserProfile(userId: number): Promise<UserProfile> {
    const behaviors = await this.getUserBehaviors(userId, { limit: 1000 });

    // 計算內容類型興趣分數
    const contentTypeScores = new Map<ContentType, number>();
    const contentTypeKeywords = new Map<ContentType, Set<string>>();

    behaviors.forEach((behavior) => {
      const currentScore = contentTypeScores.get(behavior.contentType) || 0;

      // 不同行為類型的權重
      const weights = {
        [BehaviorType.VIEW]: 1,
        [BehaviorType.SEARCH]: 2,
        [BehaviorType.CLICK]: 3,
        [BehaviorType.DOWNLOAD]: 5,
        [BehaviorType.SHARE]: 7,
        [BehaviorType.FAVORITE]: 10,
        [BehaviorType.COMMENT]: 8,
        [BehaviorType.EDIT]: 6,
        [BehaviorType.CREATE]: 9,
        [BehaviorType.DELETE]: -2,
      };

      contentTypeScores.set(
        behavior.contentType,
        currentScore + (weights[behavior.behaviorType] || 1)
      );

      // 提取關鍵詞
      if (behavior.metadata?.searchQuery) {
        const keywords = contentTypeKeywords.get(behavior.contentType) || new Set();
        behavior.metadata.searchQuery.split(' ').forEach((word) => {
          if (word.length > 2) keywords.add(word.toLowerCase());
        });
        contentTypeKeywords.set(behavior.contentType, keywords);
      }
    });

    // 正規化分數到 0-100
    const maxScore = Math.max(...Array.from(contentTypeScores.values()), 1);
    const interests = Array.from(contentTypeScores.entries()).map(([contentType, score]) => ({
      contentType,
      score: Math.round((score / maxScore) * 100),
      keywords: Array.from(contentTypeKeywords.get(contentType) || []),
    }));

    // 計算偏好
    const searchTerms = behaviors
      .filter((b) => b.behaviorType === BehaviorType.SEARCH)
      .map((b) => b.metadata?.searchQuery)
      .filter((q): q is string => !!q);

    const downloadFormats = behaviors
      .filter((b) => b.behaviorType === BehaviorType.DOWNLOAD)
      .map((b) => b.metadata?.downloadFormat)
      .filter((f): f is string => !!f);

    // 計算活躍時段
    const hourCounts = new Map<number, number>();
    behaviors.forEach((b) => {
      const hour = b.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const activeTimeSlots = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${hour + 1}:00`);

    // 計算互動指標
    const viewBehaviors = behaviors.filter((b) => b.behaviorType === BehaviorType.VIEW);
    const totalViewDuration = viewBehaviors.reduce(
      (sum, b) => sum + (b.metadata?.viewDuration || 0),
      0
    );
    const totalScrollDepth = viewBehaviors.reduce(
      (sum, b) => sum + (b.metadata?.scrollDepth || 0),
      0
    );

    const profile: UserProfile = {
      userId,
      interests: interests.sort((a, b) => b.score - a.score),
      recentActivities: behaviors.slice(0, 50),
      preferences: {
        favoriteContentTypes: interests
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((i) => i.contentType),
        frequentSearchTerms: this.getMostFrequent(searchTerms, 10),
        preferredDownloadFormats: this.getMostFrequent(downloadFormats, 5),
        activeTimeSlots,
      },
      engagementMetrics: {
        totalViews: behaviors.filter((b) => b.behaviorType === BehaviorType.VIEW).length,
        totalSearches: behaviors.filter((b) => b.behaviorType === BehaviorType.SEARCH).length,
        totalClicks: behaviors.filter((b) => b.behaviorType === BehaviorType.CLICK).length,
        totalDownloads: behaviors.filter((b) => b.behaviorType === BehaviorType.DOWNLOAD).length,
        avgViewDuration: viewBehaviors.length > 0 ? totalViewDuration / viewBehaviors.length : 0,
        avgScrollDepth: viewBehaviors.length > 0 ? totalScrollDepth / viewBehaviors.length : 0,
      },
      lastUpdated: new Date(),
    };

    // 緩存用戶畫像
    await this.cacheUserProfile(userId, profile);

    return profile;
  }

  /**
   * 獲取緩存的用戶畫像
   */
  async getCachedUserProfile(userId: number): Promise<UserProfile | null> {
    if (typeof global !== 'undefined' && (global as any).userProfiles) {
      const profile = (global as any).userProfiles.get(userId);

      // 檢查畫像是否過期（24小時）
      if (profile && Date.now() - profile.lastUpdated.getTime() < 24 * 60 * 60 * 1000) {
        return profile;
      }
    }
    return null;
  }

  /**
   * 獲取用戶畫像（含緩存）
   */
  async getUserProfile(userId: number, forceRefresh = false): Promise<UserProfile> {
    if (!forceRefresh) {
      const cached = await this.getCachedUserProfile(userId);
      if (cached) return cached;
    }

    return this.generateUserProfile(userId);
  }

  /**
   * 獲取最頻繁項目
   */
  private getMostFrequent(items: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  // 內存存儲實現（生產環境應使用數據庫）
  private generateBehaviorId(): string {
    return `behavior_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async storeBehavior(behavior: BehaviorRecord): Promise<void> {
    if (typeof global !== 'undefined') {
      if (!(global as any).userBehaviors) {
        (global as any).userBehaviors = new Map<string, BehaviorRecord>();
      }
      (global as any).userBehaviors.set(behavior.id, behavior);
    }
  }

  private async getAllBehaviors(): Promise<BehaviorRecord[]> {
    if (typeof global !== 'undefined' && (global as any).userBehaviors) {
      return Array.from((global as any).userBehaviors.values());
    }
    return [];
  }

  private async cacheUserProfile(userId: number, profile: UserProfile): Promise<void> {
    if (typeof global !== 'undefined') {
      if (!(global as any).userProfiles) {
        (global as any).userProfiles = new Map<number, UserProfile>();
      }
      (global as any).userProfiles.set(userId, profile);
    }
  }
}

/**
 * 工廠函數：創建用戶行為追蹤引擎實例
 */
export function createUserBehaviorTracker(prisma: PrismaClient): UserBehaviorTracker {
  return new UserBehaviorTracker(prisma);
}
