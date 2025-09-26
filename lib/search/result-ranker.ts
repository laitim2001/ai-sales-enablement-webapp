/**
 * AI 銷售賦能平台 - 搜索結果排序器
 *
 * 功能特色：
 * - 多維度評分算法（相似度、時間權重、用戶偏好、熱度）
 * - 智能排序策略（相關性、時間、熱度、評分）
 * - 個人化推薦（基於用戶行為和偏好）
 * - 性能優化（批量處理、快速排序）
 *
 * Week 5 開發階段 - Task 5.1: 搜索結果評分機制
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
   * 計算綜合相關性分數
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