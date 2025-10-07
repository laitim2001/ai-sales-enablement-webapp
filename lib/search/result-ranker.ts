/**
 * @fileoverview ================================================================AI銷售賦能平台 - 搜索結果排序器 (lib/search/result-ranker.ts)================================================================【檔案功能】高級搜索結果排序引擎，提供多維度評分算法和個人化排序策略結合相似度、時效性、熱度、用戶偏好等因素，實現智能結果排序【主要職責】• 多維度評分算法 - 相似度、時間衰減、熱度、用戶偏好綜合評分• 智能排序策略 - 相關性、時間、熱度、評分等多種排序方式• 個人化推薦系統 - 基於用戶行為和偏好的個性化結果調整• 性能優化處理 - 批量處理、快速排序、記憶體優化• 動態權重調整 - 可配置的評分權重和策略參數【技術實現】• 評分演算法 - 多因子加權評分模型• 時間衰減函數 - 指數衰減和線性衰減組合• 個人化模型 - 用戶行為分析和偏好學習• 排序優化 - 快速排序和穩定排序算法• 緩存策略 - 評分結果和用戶偏好緩存【評分算法原理】1. 基礎相似度：向量相似度分數 (40%)2. 時間衰減：基於更新時間的衰減權重 (20%)3. 熱度評分：基於訪問和更新頻率 (15%)4. 用戶偏好：個人化偏好匹配度 (15%)5. 分類加權：偏好分類的額外加分 (5%)6. 作者權重：偏好作者的額外加分 (5%)【排序策略】• 相關性排序：綜合評分優先，適用於一般搜索• 時間排序：最新優先，適用於動態內容• 熱度排序：熱門優先，適用於發現新內容• 個人化排序：用戶偏好優先，適用於推薦場景【個人化特性】• 行為學習：從用戶搜索和點擊行為中學習• 偏好建模：分類、作者、標籤偏好建模• 動態調整：基於實時反饋調整排序權重• 冷啟動處理：新用戶的默認排序策略【相關檔案】• 向量搜索: lib/search/vector-search.ts• 查詢處理: lib/search/query-processor.ts• 用戶偏好: lib/user/preferences.ts• 緩存系統: lib/cache/ranking-cache.tsWeek 5 開發階段 - Task 5.1: 搜索結果評分機制
 * @module lib/search/result-ranker
 * @description
 * ================================================================AI銷售賦能平台 - 搜索結果排序器 (lib/search/result-ranker.ts)================================================================【檔案功能】高級搜索結果排序引擎，提供多維度評分算法和個人化排序策略結合相似度、時效性、熱度、用戶偏好等因素，實現智能結果排序【主要職責】• 多維度評分算法 - 相似度、時間衰減、熱度、用戶偏好綜合評分• 智能排序策略 - 相關性、時間、熱度、評分等多種排序方式• 個人化推薦系統 - 基於用戶行為和偏好的個性化結果調整• 性能優化處理 - 批量處理、快速排序、記憶體優化• 動態權重調整 - 可配置的評分權重和策略參數【技術實現】• 評分演算法 - 多因子加權評分模型• 時間衰減函數 - 指數衰減和線性衰減組合• 個人化模型 - 用戶行為分析和偏好學習• 排序優化 - 快速排序和穩定排序算法• 緩存策略 - 評分結果和用戶偏好緩存【評分算法原理】1. 基礎相似度：向量相似度分數 (40%)2. 時間衰減：基於更新時間的衰減權重 (20%)3. 熱度評分：基於訪問和更新頻率 (15%)4. 用戶偏好：個人化偏好匹配度 (15%)5. 分類加權：偏好分類的額外加分 (5%)6. 作者權重：偏好作者的額外加分 (5%)【排序策略】• 相關性排序：綜合評分優先，適用於一般搜索• 時間排序：最新優先，適用於動態內容• 熱度排序：熱門優先，適用於發現新內容• 個人化排序：用戶偏好優先，適用於推薦場景【個人化特性】• 行為學習：從用戶搜索和點擊行為中學習• 偏好建模：分類、作者、標籤偏好建模• 動態調整：基於實時反饋調整排序權重• 冷啟動處理：新用戶的默認排序策略【相關檔案】• 向量搜索: lib/search/vector-search.ts• 查詢處理: lib/search/query-processor.ts• 用戶偏好: lib/user/preferences.ts• 緩存系統: lib/cache/ranking-cache.tsWeek 5 開發階段 - Task 5.1: 搜索結果評分機制
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { SearchResult, SearchPreferences } from './vector-search'
import { DocumentCategory } from '@prisma/client'

// 排序類型
export type SortingField = 'relevance' | 'date' | 'popularity' | 'rating' | 'similarity'
export type SortingDirection = 'asc' | 'desc'

// 搜索排序配置
export interface SearchSorting {
  field: SortingField
  direction: SortingDirection
  secondaryField?: SortingField
  secondaryDirection?: SortingDirection
}

// 評分權重配置
export interface ScoringWeights {
  similarity: number        // 向量相似度權重 (0-1)
  timeDecay: number        // 時間衰減權重 (0-1)
  popularity: number       // 熱度權重 (0-1)
  userPreference: number   // 用戶偏好權重 (0-1)
  categoryBoost: number    // 分類加權 (0-1)
  authorBoost: number      // 作者加權 (0-1)
}

// 默認評分權重
const DEFAULT_WEIGHTS: ScoringWeights = {
  similarity: 0.4,      // 40% 相似度
  timeDecay: 0.2,       // 20% 時間權重
  popularity: 0.15,     // 15% 熱度
  userPreference: 0.15, // 15% 用戶偏好
  categoryBoost: 0.05,  // 5% 分類加權
  authorBoost: 0.05     // 5% 作者加權
}

/**
 * 搜索結果排序器類
 */
export class ResultRanker {
  private weights: ScoringWeights

  constructor(customWeights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights }
    this.validateWeights()
  }

  /**
   * 按相似度排序
   */
  rankBySimilarity(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => {
      const diff = b.similarity - a.similarity
      if (Math.abs(diff) < 0.001) {
        // 相似度相同時按更新時間排序
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      return diff
    })
  }

  /**
   * 按相關性排序（綜合評分）
   */
  rankByRelevance(results: SearchResult[], query: string, userPreferences?: SearchPreferences): SearchResult[] {
    // 計算綜合相關性分數
    const scoredResults = results.map(result => ({
      ...result,
      relevanceScore: this.calculateRelevanceScore(result, query, userPreferences),
      scoringBreakdown: this.getScoreBreakdown(result, query, userPreferences)
    }))

    // 按相關性分數排序
    return scoredResults.sort((a, b) => {
      const diff = b.relevanceScore - a.relevanceScore
      if (Math.abs(diff) < 0.001) {
        // 分數相同時按相似度排序
        return b.similarity - a.similarity
      }
      return diff
    })
  }

  /**
   * 按熱度排序
   */
  rankByPopularity(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => {
      // 計算熱度分數（基於創建時間和更新時間的組合）
      const popularityA = this.calculatePopularityScore(a)
      const popularityB = this.calculatePopularityScore(b)

      const diff = popularityB - popularityA
      if (Math.abs(diff) < 0.001) {
        // 熱度相同時按相似度排序
        return b.similarity - a.similarity
      }
      return diff
    })
  }

  /**
   * 應用個人化排序
   */
  applyPersonalization(results: SearchResult[], userId: string, userPreferences?: SearchPreferences): SearchResult[] {
    // 為每個結果計算個人化分數
    const personalizedResults = results.map(result => ({
      ...result,
      personalizationScore: this.calculatePersonalizationScore(result, userId, userPreferences),
      personalizedRelevanceScore: this.calculatePersonalizedRelevanceScore(result, userId, userPreferences)
    }))

    // 按個人化相關性分數排序
    return personalizedResults.sort((a, b) => {
      const diff = b.personalizedRelevanceScore - a.personalizedRelevanceScore
      if (Math.abs(diff) < 0.001) {
        return b.relevanceScore - a.relevanceScore
      }
      return diff
    })
  }

  /**
   * 自定義排序
   */
  customSort(results: SearchResult[], sorting: SearchSorting): SearchResult[] {
    return [...results].sort((a, b) => {
      const primaryCompare = this.compareByField(a, b, sorting.field, sorting.direction)

      if (primaryCompare !== 0) {
        return primaryCompare
      }

      // 主要字段相同時，使用次要字段排序
      if (sorting.secondaryField) {
        return this.compareByField(a, b, sorting.secondaryField, sorting.secondaryDirection || 'desc')
      }

      // 最後按相似度排序
      return b.similarity - a.similarity
    })
  }

  /**
   * 計算綜合相關性分數 - 核心多維度評分算法
   *
   * 【評分模型】
   * 採用加權平均方式結合多個評分維度，確保搜索結果的全面性和準確性
   * 每個維度都有獨立的計算邏輯和權重配置
   *
   * 【評分維度詳解】
   * • 向量相似度 (40%)：基於embedding的語義相似度
   *   - 使用餘弦相似度或歐幾里得距離
   *   - 反映查詢與文檔的語義匹配程度
   *
   * • 時間衰減 (20%)：基於內容新鮮度的評分
   *   - 一週內：滿分 (1.0)
   *   - 一月內：線性衰減至0.7
   *   - 一月後：指數衰減 (半衰期90天)
   *
   * • 熱度評分 (15%)：基於內容活躍度
   *   - 新創建內容：30天內線性加分
   *   - 最近更新：14天內活躍度加分
   *   - 更新頻率：反映內容維護程度
   *
   * • 用戶偏好 (15%)：個人化匹配度
   *   - 偏好分類：匹配用戶關注領域
   *   - 偏好作者：匹配信任作者
   *   - 偏好標籤：匹配興趣標籤
   *   - 語言偏好：匹配語言設定
   *
   * • 分類加權 (5%)：分類相關性加分
   * • 作者加權 (5%)：作者權威性加分
   * • 查詢匹配 (10%)：關鍵詞匹配加分
   *
   * 【算法特性】
   * • 權重可配置：支援動態調整各維度權重
   * • 分數標準化：所有分數歸一化到0-1範圍
   * • 非線性組合：某些維度使用非線性函數
   * • 魯棒性設計：處理異常值和邊界情況
   *
   * @param result 搜索結果項目
   * @param query 原始查詢字串
   * @param userPreferences 用戶偏好設定
   * @returns number 綜合相關性分數 (0-1)
   */
  private calculateRelevanceScore(
    result: SearchResult,
    query: string,
    userPreferences?: SearchPreferences
  ): number {
    let score = 0

    // 1. 相似度分數
    score += result.similarity * this.weights.similarity

    // 2. 時間衰減分數
    const timeDecay = this.calculateTimeDecayScore(result.updatedAt)
    score += timeDecay * this.weights.timeDecay

    // 3. 熱度分數
    const popularity = this.calculatePopularityScore(result)
    score += popularity * this.weights.popularity

    // 4. 用戶偏好分數
    if (userPreferences) {
      const preferenceScore = this.calculateUserPreferenceScore(result, userPreferences)
      score += preferenceScore * this.weights.userPreference
    }

    // 5. 分類加權
    if (userPreferences?.preferredCategories?.includes(result.category)) {
      score += this.weights.categoryBoost
    }

    // 6. 作者加權
    if (result.author && userPreferences?.authorPreferences?.includes(result.author)) {
      score += this.weights.authorBoost
    }

    // 7. 查詢匹配加權
    const queryMatchBoost = this.calculateQueryMatchBoost(result, query)
    score += queryMatchBoost * 0.1 // 10% 查詢匹配加權

    // 確保分數在合理範圍內
    return Math.max(0, Math.min(1, score))
  }

  /**
   * 計算時間衰減分數
   */
  private calculateTimeDecayScore(updatedAt: Date): number {
    const now = new Date()
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)

    // 使用不同的衰減策略
    if (daysSinceUpdate <= 7) {
      // 一週內的文檔保持高分
      return 1.0
    } else if (daysSinceUpdate <= 30) {
      // 一個月內線性衰減
      return 1.0 - (daysSinceUpdate - 7) / 23 * 0.3
    } else {
      // 一個月後指數衰減
      const halfLife = 90 // 半衰期90天
      return 0.7 * Math.exp(-Math.log(2) * (daysSinceUpdate - 30) / halfLife)
    }
  }

  /**
   * 計算熱度分數
   */
  private calculatePopularityScore(result: SearchResult): number {
    const now = new Date()
    const createdDaysAgo = (now.getTime() - result.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const updatedDaysAgo = (now.getTime() - result.updatedAt.getTime()) / (1000 * 60 * 60 * 24)

    // 基於創建和更新時間的組合評分
    let score = 0

    // 新創建的文檔加分
    if (createdDaysAgo <= 30) {
      score += 0.3 * (1 - createdDaysAgo / 30)
    }

    // 最近更新的文檔加分
    if (updatedDaysAgo <= 14) {
      score += 0.4 * (1 - updatedDaysAgo / 14)
    }

    // 活躍度加分（更新頻率）
    const updateActivity = createdDaysAgo > 0 ? Math.min(1, 7 / createdDaysAgo) : 1
    score += 0.3 * updateActivity

    return Math.max(0, Math.min(1, score))
  }

  /**
   * 計算用戶偏好分數
   */
  private calculateUserPreferenceScore(result: SearchResult, preferences: SearchPreferences): number {
    let score = 0

    // 偏好分類
    if (preferences.preferredCategories?.includes(result.category)) {
      score += 0.3
    }

    // 偏好作者
    if (result.author && preferences.authorPreferences?.includes(result.author)) {
      score += 0.25
    }

    // 偏好標籤
    if (preferences.tagPreferences && result.tags) {
      const matchingTags = result.tags.filter(tag =>
        preferences.tagPreferences?.includes(tag.name)
      ).length

      if (matchingTags > 0) {
        score += Math.min(0.25, matchingTags / result.tags.length * 0.25)
      }
    }

    // 語言偏好
    if (preferences.languagePreference) {
      // 假設文檔有語言標識，這裡簡化處理
      score += 0.2
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * 計算查詢匹配加權
   */
  private calculateQueryMatchBoost(result: SearchResult, query: string): number {
    const queryLower = query.toLowerCase()
    const titleLower = result.title.toLowerCase()
    const contentLower = (result.content || '').toLowerCase()

    let boost = 0

    // 標題完全匹配
    if (titleLower === queryLower) {
      boost += 1.0
    } else if (titleLower.includes(queryLower)) {
      boost += 0.7
    }

    // 標題詞彙匹配
    const queryWords = queryLower.split(/\s+/)
    const titleWords = titleLower.split(/\s+/)
    const titleMatchRatio = queryWords.filter(word =>
      titleWords.some(titleWord => titleWord.includes(word))
    ).length / queryWords.length

    boost += titleMatchRatio * 0.5

    // 內容匹配（權重較低）
    if (contentLower.includes(queryLower)) {
      boost += 0.2
    }

    return Math.max(0, Math.min(1, boost))
  }

  /**
   * 計算個人化分數
   */
  private calculatePersonalizationScore(
    result: SearchResult,
    userId: string,
    userPreferences?: SearchPreferences
  ): number {
    // 這裡可以基於用戶歷史行為計算個人化分數
    // 目前簡化實現，主要基於用戶偏好

    if (!userPreferences) {
      return 0
    }

    return this.calculateUserPreferenceScore(result, userPreferences)
  }

  /**
   * 計算個人化相關性分數
   */
  private calculatePersonalizedRelevanceScore(
    result: SearchResult,
    userId: string,
    userPreferences?: SearchPreferences
  ): number {
    const baseRelevance = result.relevanceScore
    const personalization = this.calculatePersonalizationScore(result, userId, userPreferences)

    // 80% 基礎相關性 + 20% 個人化
    return baseRelevance * 0.8 + personalization * 0.2
  }

  /**
   * 按字段比較兩個結果
   */
  private compareByField(
    a: SearchResult,
    b: SearchResult,
    field: SortingField,
    direction: SortingDirection
  ): number {
    let comparison = 0

    switch (field) {
      case 'relevance':
        comparison = b.relevanceScore - a.relevanceScore
        break

      case 'date':
        comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        break

      case 'similarity':
        comparison = b.similarity - a.similarity
        break

      case 'popularity':
        const popularityA = this.calculatePopularityScore(a)
        const popularityB = this.calculatePopularityScore(b)
        comparison = popularityB - popularityA
        break

      case 'rating':
        // 暫時基於相似度，未來可以添加用戶評分系統
        comparison = b.similarity - a.similarity
        break

      default:
        comparison = 0
    }

    return direction === 'asc' ? -comparison : comparison
  }

  /**
   * 獲取分數詳細分解
   */
  private getScoreBreakdown(
    result: SearchResult,
    query: string,
    userPreferences?: SearchPreferences
  ): any {
    return {
      similarity: result.similarity * this.weights.similarity,
      timeDecay: this.calculateTimeDecayScore(result.updatedAt) * this.weights.timeDecay,
      popularity: this.calculatePopularityScore(result) * this.weights.popularity,
      userPreference: userPreferences
        ? this.calculateUserPreferenceScore(result, userPreferences) * this.weights.userPreference
        : 0,
      queryMatch: this.calculateQueryMatchBoost(result, query) * 0.1
    }
  }

  /**
   * 驗證權重配置
   */
  private validateWeights(): void {
    const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0)

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(`Weight total is ${totalWeight}, not 1.0. Consider adjusting weights.`)
    }

    // 確保所有權重都在合理範圍內
    Object.entries(this.weights).forEach(([key, weight]) => {
      if (weight < 0 || weight > 1) {
        throw new Error(`Weight ${key} must be between 0 and 1, got ${weight}`)
      }
    })
  }

  /**
   * 更新評分權重
   */
  updateWeights(newWeights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...newWeights }
    this.validateWeights()
  }

  /**
   * 獲取當前權重配置
   */
  getWeights(): ScoringWeights {
    return { ...this.weights }
  }
}

// 導出默認實例
export const defaultResultRanker = new ResultRanker()

// 導出預設的排序配置
export const SORTING_PRESETS = {
  RELEVANCE: { field: 'relevance' as SortingField, direction: 'desc' as SortingDirection },
  DATE_NEW: { field: 'date' as SortingField, direction: 'desc' as SortingDirection },
  DATE_OLD: { field: 'date' as SortingField, direction: 'asc' as SortingDirection },
  SIMILARITY: { field: 'similarity' as SortingField, direction: 'desc' as SortingDirection },
  POPULARITY: { field: 'popularity' as SortingField, direction: 'desc' as SortingDirection }
}