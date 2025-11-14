/**
 * @fileoverview 個性化推薦引擎
📋 檔案用途：
基於用戶畫像和行為歷史提供智能內容推薦
🎯 核心功能：
1. 內容推薦：知識庫文章、提案模板、產品信息
2. 會議準備推薦：根據會議類型推薦相關資料
3. 協同過濾：基於相似用戶的行為推薦
4. 混合推薦策略：結合多種算法提供最佳推薦
🔗 依賴關係：
- lib/analytics/user-behavior-tracker.ts - 用戶行為和畫像數據
- lib...
 * @module lib/recommendation/recommendation-engine
 *
 * 個性化推薦引擎
 * 📋 檔案用途：
 * 基於用戶畫像和行為歷史提供智能內容推薦
 * 🎯 核心功能：
 * 1. 內容推薦：知識庫文章、提案模板、產品信息
 * 2. 會議準備推薦：根據會議類型推薦相關資料
 * 3. 協同過濾：基於相似用戶的行為推薦
 * 4. 混合推薦策略：結合多種算法提供最佳推薦
 * 🔗 依賴關係：
 * - lib/analytics/user-behavior-tracker.ts - 用戶行為和畫像數據
 * - lib/meeting/meeting-prep-package.ts - 會議準備包
 * 作者：Claude Code
 * 創建時間：2025-10-05
 * Sprint：Sprint 7 Phase 2 - 個性化推薦
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { UserBehaviorTracker, UserProfile, BehaviorType, ContentType } from '@/lib/analytics/user-behavior-tracker';

// ============================================================================
// 📊 類型定義 - 推薦結構
// ============================================================================

/**
 * 推薦項目接口
 *
 * 用途：描述單個推薦項目的詳細信息
 */
export interface RecommendationItem {
  id: string;                        // 推薦項目ID
  type: ContentType | 'case_study';  // 項目類型（使用ContentType枚舉 + 額外類型）
  title: string;                     // 標題
  description?: string;              // 描述
  score: number;                     // 推薦分數（0-1）
  reasons: string[];                 // 推薦理由
  metadata?: {
    author?: string;                 // 作者
    createdAt?: Date;                // 創建時間
    tags?: string[];                 // 標籤
    category?: string;               // 分類
    viewCount?: number;              // 查看次數
    [key: string]: any;              // 其他元數據
  };
}

/**
 * 推薦結果接口
 *
 * 用途：包含推薦列表和相關元信息
 */
export interface RecommendationResult {
  items: RecommendationItem[];       // 推薦項目列表
  totalCount: number;                // 總推薦數量
  strategy: string;                  // 使用的推薦策略
  confidence: number;                // 整體信心度（0-1）
  generatedAt: Date;                 // 生成時間
  userId: number;                    // 用戶ID
}

/**
 * 推薦請求參數
 *
 * 用途：定義推薦請求的過濾和配置選項
 */
export interface RecommendationRequest {
  userId: number;                    // 用戶ID
  limit?: number;                    // 返回數量限制（默認10）
  contentType?: ContentType;         // 限制內容類型
  excludeIds?: string[];             // 排除的項目ID
  contextualInfo?: {                 // 上下文信息
    meetingId?: string;              // 會議ID（用於會議相關推薦）
    customerId?: number;             // 客戶ID
    projectId?: string;              // 項目ID
    keywords?: string[];             // 關鍵詞
  };
  strategy?: 'collaborative' | 'content_based' | 'hybrid' | 'popularity';  // 推薦策略
  forceRefresh?: boolean;            // 強制刷新（跳過緩存）
}

/**
 * 推薦反饋
 *
 * 用途：收集用戶對推薦的反饋以優化算法
 */
export interface RecommendationFeedback {
  recommendationId: string;          // 推薦ID
  itemId: string;                    // 項目ID
  userId: number;                    // 用戶ID
  action: 'view' | 'click' | 'dismiss' | 'like' | 'dislike';  // 用戶行動
  timestamp: Date;                   // 反饋時間
  rating?: number;                   // 評分（1-5）
  comment?: string;                  // 評論
}

// ============================================================================
// 🤖 個性化推薦引擎類
// ============================================================================

/**
 * RecommendationEngine - 個性化推薦核心類
 *
 * 職責：
 * 1. 基於用戶畫像生成個性化推薦
 * 2. 實現多種推薦算法（協同過濾、內容推薦、混合）
 * 3. 管理推薦結果緩存
 * 4. 處理推薦反饋並優化算法
 *
 * 設計模式：策略模式（多種推薦策略），單例模式（可選）
 */
export class RecommendationEngine {
  private behaviorTracker: UserBehaviorTracker;
  private recommendationCache: Map<string, RecommendationResult> = new Map();
  private feedbackStore: RecommendationFeedback[] = [];  // 在生產環境應使用數據庫
  private readonly CACHE_TTL = 60 * 60 * 1000;  // 緩存1小時

  /**
   * 構造函數
   *
   * @param behaviorTracker - 用戶行為追蹤器實例
   */
  constructor(behaviorTracker: UserBehaviorTracker) {
    this.behaviorTracker = behaviorTracker;
  }

  // ==========================================================================
  // 📊 主要推薦方法 - 統一入口
  // ==========================================================================

  /**
   * 生成個性化推薦
   *
   * 流程：
   * 1. 檢查緩存
   * 2. 獲取用戶畫像
   * 3. 根據策略生成推薦
   * 4. 合併和排序結果
   * 5. 緩存結果
   *
   * @param request - 推薦請求參數
   * @returns 推薦結果
   */
  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResult> {
    const {
      userId,
      limit = 10,
      contentType,
      excludeIds = [],
      contextualInfo = {},
      strategy = 'hybrid',
      forceRefresh = false
    } = request;

    // 1. 檢查緩存
    if (!forceRefresh) {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getCachedRecommendations(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 2. 獲取用戶畫像
    const userProfile = await this.behaviorTracker.getUserProfile(userId);

    // 3. 根據策略生成推薦
    let recommendations: RecommendationItem[] = [];

    switch (strategy) {
      case 'collaborative':
        recommendations = await this.collaborativeFiltering(userId, userProfile, contentType);
        break;
      case 'content_based':
        recommendations = await this.contentBasedRecommendation(userId, userProfile, contentType);
        break;
      case 'popularity':
        recommendations = await this.popularityBasedRecommendation(contentType);
        break;
      case 'hybrid':
      default:
        recommendations = await this.hybridRecommendation(userId, userProfile, contentType, contextualInfo);
        break;
    }

    // 4. 過濾排除項目並排序
    recommendations = recommendations
      .filter(item => !excludeIds.includes(item.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 5. 構建結果
    const result: RecommendationResult = {
      items: recommendations,
      totalCount: recommendations.length,
      strategy: strategy,
      confidence: this.calculateOverallConfidence(recommendations),
      generatedAt: new Date(),
      userId: userId
    };

    // 6. 緩存結果
    const cacheKey = this.generateCacheKey(request);
    this.setCachedRecommendations(cacheKey, result);

    return result;
  }

  // ==========================================================================
  // 🎯 推薦策略實現 - 核心算法
  // ==========================================================================

  /**
   * 協同過濾推薦
   *
   * 原理：找到行為相似的用戶，推薦他們喜歡但當前用戶未接觸的內容
   *
   * @param userId - 用戶ID
   * @param userProfile - 用戶畫像
   * @param contentType - 內容類型過濾
   * @returns 推薦項目列表
   */
  private async collaborativeFiltering(
    userId: number,
    userProfile: UserProfile,
    contentType?: ContentType
  ): Promise<RecommendationItem[]> {
    // TODO: 實現實際的協同過濾算法
    // 1. 找到相似用戶（基於興趣列表和行為模式）
    // 2. 收集相似用戶的高分內容
    // 3. 過濾當前用戶已接觸的內容
    // 4. 計算推薦分數

    // 當前返回模擬數據
    const recommendations: RecommendationItem[] = [];

    // 基於用戶興趣生成推薦
    for (const [index, interest] of userProfile.interests.slice(0, 5).entries()) {
      recommendations.push({
        id: `collab_${interest.contentType}_${index}`,
        type: interest.contentType as any,
        title: `基於協同過濾的推薦 ${interest.contentType}`,
        score: interest.score / 100,  // 標準化分數
        reasons: [
          '相似用戶高度關注此內容',
          `與您的興趣相關度：${interest.score}%`
        ],
        metadata: {
          category: interest.contentType,
          tags: interest.keywords
        }
      });
    }

    return contentType
      ? recommendations.filter(r => r.type === contentType)
      : recommendations;
  }

  /**
   * 基於內容的推薦
   *
   * 原理：分析用戶歷史喜好的內容特徵，推薦相似內容
   *
   * @param userId - 用戶ID
   * @param userProfile - 用戶畫像
   * @param contentType - 內容類型過濾
   * @returns 推薦項目列表
   */
  private async contentBasedRecommendation(
    userId: number,
    userProfile: UserProfile,
    contentType?: ContentType
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];

    // 基於用戶最常搜索的關鍵詞推薦
    for (const [index, searchTerm] of userProfile.preferences.frequentSearchTerms.slice(0, 5).entries()) {
      recommendations.push({
        id: `content_${searchTerm}_${index}`,
        type: ContentType.KNOWLEDGE_BASE,
        title: `與"${searchTerm}"相關的內容`,
        score: (5 - index) / 5,  // 簡單的遞減分數
        reasons: [
          `您經常搜索"${searchTerm}"`,
          '基於您的搜索歷史推薦'
        ],
        metadata: {
          keywords: [searchTerm],
          category: 'search_based'
        }
      });
    }

    return contentType
      ? recommendations.filter(r => r.type === contentType)
      : recommendations;
  }

  /**
   * 基於流行度的推薦
   *
   * 原理：推薦全局熱門內容（適用於冷啟動用戶）
   *
   * @param contentType - 內容類型過濾
   * @returns 推薦項目列表
   */
  private async popularityBasedRecommendation(
    contentType?: ContentType
  ): Promise<RecommendationItem[]> {
    // TODO: 從數據庫查詢熱門內容
    // 當前返回模擬數據

    const popularItems: RecommendationItem[] = [
      {
        id: 'popular_1',
        type: ContentType.KNOWLEDGE_BASE,
        title: '最受歡迎的銷售技巧文檔',
        score: 0.95,
        reasons: ['全站瀏覽量最高', '用戶評分最高'],
        metadata: { viewCount: 1000, category: 'sales' }
      },
      {
        id: 'popular_2',
        type: ContentType.TEMPLATE,
        title: '熱門提案模板',
        score: 0.90,
        reasons: ['使用次數最多', '成功率最高'],
        metadata: { viewCount: 800, category: 'proposal' }
      },
      {
        id: 'popular_3',
        type: 'case_study',
        title: '成功案例精選',
        score: 0.85,
        reasons: ['最多分享', '最多收藏'],
        metadata: { viewCount: 600, category: 'case_study' }
      }
    ];

    return contentType
      ? popularItems.filter(item => item.type === contentType)
      : popularItems;
  }

  /**
   * 混合推薦策略
   *
   * 原理：結合多種算法的優勢，提供最佳推薦
   *
   * @param userId - 用戶ID
   * @param userProfile - 用戶畫像
   * @param contentType - 內容類型過濾
   * @param contextualInfo - 上下文信息
   * @returns 推薦項目列表
   */
  private async hybridRecommendation(
    userId: number,
    userProfile: UserProfile,
    contentType?: ContentType,
    contextualInfo?: any
  ): Promise<RecommendationItem[]> {
    // 1. 獲取各策略的推薦
    const collaborativeRecs = await this.collaborativeFiltering(userId, userProfile, contentType);
    const contentBasedRecs = await this.contentBasedRecommendation(userId, userProfile, contentType);
    const popularityRecs = await this.popularityBasedRecommendation(contentType);

    // 2. 如果有會議上下文，添加會議相關推薦
    let contextualRecs: RecommendationItem[] = [];
    if (contextualInfo?.meetingId) {
      contextualRecs = await this.getMeetingContextRecommendations(
        contextualInfo.meetingId,
        userProfile
      );
    }

    // 3. 合併推薦並調整權重
    const allRecommendations = [
      ...collaborativeRecs.map(r => ({ ...r, score: r.score * 0.4 })),      // 協同過濾 40%
      ...contentBasedRecs.map(r => ({ ...r, score: r.score * 0.3 })),       // 內容推薦 30%
      ...popularityRecs.map(r => ({ ...r, score: r.score * 0.2 })),         // 流行度 20%
      ...contextualRecs.map(r => ({ ...r, score: r.score * 0.1 }))          // 上下文 10%
    ];

    // 4. 去重並合併同一項目的分數
    const merged = this.mergeRecommendations(allRecommendations);

    return merged;
  }

  /**
   * 獲取會議上下文相關推薦
   *
   * @param meetingId - 會議ID
   * @param userProfile - 用戶畫像
   * @returns 推薦項目列表
   */
  private async getMeetingContextRecommendations(
    meetingId: string,
    userProfile: UserProfile
  ): Promise<RecommendationItem[]> {
    // TODO: 基於會議類型、參與者、主題推薦相關資料
    return [];
  }

  // ==========================================================================
  // 🔄 推薦反饋處理 - 學習和優化
  // ==========================================================================

  /**
   * 記錄推薦反饋
   *
   * @param feedback - 用戶反饋數據
   */
  async recordFeedback(feedback: RecommendationFeedback): Promise<void> {
    this.feedbackStore.push(feedback);

    // 基於反饋更新用戶行為
    const behaviorType = this.mapFeedbackToBehavior(feedback.action);
    if (behaviorType) {
      await this.behaviorTracker.trackBehavior({
        userId: feedback.userId,
        behaviorType: behaviorType,
        contentId: parseInt(feedback.itemId) || 1,
        contentType: ContentType.KNOWLEDGE_BASE, // TODO: 從推薦項目類型映射
        metadata: {
          recommendationId: feedback.recommendationId,
          rating: feedback.rating
        }
      });
    }

    // TODO: 在生產環境中，應將反饋保存到數據庫
    // 並定期分析反饋以優化推薦算法
  }

  /**
   * 將反饋行動映射到行為類型
   *
   * @param action - 反饋行動
   * @returns 對應的行為類型
   */
  private mapFeedbackToBehavior(
    action: RecommendationFeedback['action']
  ): BehaviorType | null {
    const mapping: Record<string, BehaviorType> = {
      'view': BehaviorType.VIEW,
      'click': BehaviorType.CLICK,
      'like': BehaviorType.FAVORITE
    };

    return mapping[action] || null;
  }

  /**
   * 獲取推薦效果統計
   *
   * @param userId - 用戶ID（可選，不傳則返回全局統計）
   * @returns 推薦效果統計
   */
  async getRecommendationStats(userId?: number): Promise<{
    totalRecommendations: number;
    totalFeedback: number;
    clickThroughRate: number;
    averageRating: number;
    topPerformingItems: { itemId: string; clicks: number }[];
  }> {
    const relevantFeedback = userId
      ? this.feedbackStore.filter(f => f.userId === userId)
      : this.feedbackStore;

    const totalRecommendations = relevantFeedback.length;
    const clicks = relevantFeedback.filter(f => f.action === 'click').length;
    const ratings = relevantFeedback.filter(f => f.rating !== undefined).map(f => f.rating!);

    // 統計各項目的點擊次數
    const itemClicks = new Map<string, number>();
    relevantFeedback.filter(f => f.action === 'click').forEach(f => {
      itemClicks.set(f.itemId, (itemClicks.get(f.itemId) || 0) + 1);
    });

    const topPerformingItems = Array.from(itemClicks.entries())
      .map(([itemId, clicks]) => ({ itemId, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return {
      totalRecommendations,
      totalFeedback: relevantFeedback.length,
      clickThroughRate: totalRecommendations > 0 ? clicks / totalRecommendations : 0,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      topPerformingItems
    };
  }

  // ==========================================================================
  // 🛠️ 工具方法 - 輔助功能
  // ==========================================================================

  /**
   * 合併重複的推薦項目
   *
   * @param recommendations - 推薦列表
   * @returns 合併後的推薦列表
   */
  private mergeRecommendations(
    recommendations: RecommendationItem[]
  ): RecommendationItem[] {
    const merged = new Map<string, RecommendationItem>();

    for (const rec of recommendations) {
      const existing = merged.get(rec.id);
      if (existing) {
        // 合併分數（取平均）
        existing.score = (existing.score + rec.score) / 2;
        // 合併推薦理由
        existing.reasons = [...new Set([...existing.reasons, ...rec.reasons])];
      } else {
        merged.set(rec.id, { ...rec });
      }
    }

    return Array.from(merged.values());
  }

  /**
   * 計算整體推薦信心度
   *
   * @param recommendations - 推薦列表
   * @returns 信心度（0-1）
   */
  private calculateOverallConfidence(
    recommendations: RecommendationItem[]
  ): number {
    if (recommendations.length === 0) return 0;

    const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
    return avgScore;
  }

  /**
   * 生成緩存鍵
   *
   * @param request - 推薦請求
   * @returns 緩存鍵字符串
   */
  private generateCacheKey(request: RecommendationRequest): string {
    const {
      userId,
      limit,
      contentType,
      strategy,
      contextualInfo
    } = request;

    return `rec_${userId}_${limit}_${contentType || 'all'}_${strategy}_${JSON.stringify(contextualInfo || {})}`;
  }

  /**
   * 獲取緩存的推薦結果
   *
   * @param key - 緩存鍵
   * @returns 緩存的推薦結果或null
   */
  private getCachedRecommendations(key: string): RecommendationResult | null {
    const cached = this.recommendationCache.get(key);
    if (!cached) return null;

    // 檢查是否過期
    const age = Date.now() - cached.generatedAt.getTime();
    if (age > this.CACHE_TTL) {
      this.recommendationCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * 設置緩存的推薦結果
   *
   * @param key - 緩存鍵
   * @param result - 推薦結果
   */
  private setCachedRecommendations(key: string, result: RecommendationResult): void {
    this.recommendationCache.set(key, result);
  }

  /**
   * 清理過期緩存
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, result] of this.recommendationCache.entries()) {
      const age = now - result.generatedAt.getTime();
      if (age > this.CACHE_TTL) {
        this.recommendationCache.delete(key);
      }
    }
  }
}

// ============================================================================
// 🏭 工廠函數 - 創建推薦引擎實例
// ============================================================================

/**
 * 創建RecommendationEngine實例
 *
 * @param behaviorTracker - 用戶行為追蹤器實例
 * @returns 新的推薦引擎實例
 */
export function createRecommendationEngine(
  behaviorTracker: UserBehaviorTracker
): RecommendationEngine {
  return new RecommendationEngine(behaviorTracker);
}
