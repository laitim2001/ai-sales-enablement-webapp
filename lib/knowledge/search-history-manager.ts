/**
 * @fileoverview ================================================================AI銷售賦能平台 - 搜索歷史管理器================================================================【功能說明】提供搜索歷史記錄的本地和雲端同步管理，支援智能建議、熱門搜索統計、以及個人化推薦。【主要功能】• 搜索歷史記錄 - localStorage持久化• 雲端同步 - 跨設備搜索歷史• 熱門搜索詞 - 統計和排行• 智能建議 - 基於歷史的搜索建議• 自動完成 - 實時搜索提示@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 3
 * @module lib/knowledge/search-history-manager
 * @description
 * ================================================================AI銷售賦能平台 - 搜索歷史管理器================================================================【功能說明】提供搜索歷史記錄的本地和雲端同步管理，支援智能建議、熱門搜索統計、以及個人化推薦。【主要功能】• 搜索歷史記錄 - localStorage持久化• 雲端同步 - 跨設備搜索歷史• 熱門搜索詞 - 統計和排行• 智能建議 - 基於歷史的搜索建議• 自動完成 - 實時搜索提示@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

/**
 * 搜索歷史記錄介面
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'text' | 'semantic' | 'hybrid' | 'advanced';
  filters?: Record<string, any>;
  results_count: number;
  clicked_result_ids: number[];
  timestamp: number;
  device?: string;
  synced?: boolean;
}

/**
 * 熱門搜索詞介面
 */
export interface PopularSearchTerm {
  term: string;
  count: number;
  last_searched: number;
}

/**
 * 搜索建議介面
 */
export interface SearchSuggestion {
  text: string;
  type: 'history' | 'popular' | 'related' | 'autocomplete';
  score: number;
  metadata?: Record<string, any>;
}

/**
 * 搜索歷史管理器類
 */
export class SearchHistoryManager {
  private static readonly STORAGE_KEY = 'knowledge_search_history';
  private static readonly POPULAR_TERMS_KEY = 'knowledge_popular_searches';
  private static readonly MAX_HISTORY_ITEMS = 100;
  private static readonly MAX_POPULAR_TERMS = 50;

  /**
   * 添加搜索歷史記錄
   */
  static addHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp'>): void {
    const history = this.getHistory();

    const newItem: SearchHistoryItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      device: this.getDeviceInfo(),
      synced: false
    };

    // 去重：如果相同查詢在5分鐘內已存在，則更新而非新增
    const recentIndex = history.findIndex(h =>
      h.query === item.query &&
      h.type === item.type &&
      Date.now() - h.timestamp < 5 * 60 * 1000
    );

    if (recentIndex !== -1) {
      history[recentIndex] = {
        ...history[recentIndex],
        results_count: item.results_count,
        timestamp: Date.now()
      };
    } else {
      history.unshift(newItem);
    }

    // 限制最大數量
    const trimmed = history.slice(0, this.MAX_HISTORY_ITEMS);

    // 保存到localStorage
    this.saveHistory(trimmed);

    // 更新熱門搜索詞統計
    this.updatePopularTerms(item.query);

    // 異步同步到雲端（如果配置了）
    this.syncToCloud(newItem).catch(err =>
      console.error('Failed to sync search history to cloud:', err)
    );
  }

  /**
   * 獲取搜索歷史
   */
  static getHistory(limit?: number): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history: SearchHistoryItem[] = JSON.parse(stored);
      return limit ? history.slice(0, limit) : history;
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * 清空搜索歷史
   */
  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 刪除單個歷史記錄
   */
  static deleteHistoryItem(id: string): void {
    const history = this.getHistory();
    const updated = history.filter(item => item.id !== id);
    this.saveHistory(updated);
  }

  /**
   * 更新歷史記錄（記錄點擊的結果）
   */
  static updateHistoryClick(historyId: string, resultId: number): void {
    const history = this.getHistory();
    const item = history.find(h => h.id === historyId);

    if (item) {
      if (!item.clicked_result_ids.includes(resultId)) {
        item.clicked_result_ids.push(resultId);
      }
      this.saveHistory(history);
    }
  }

  /**
   * 獲取熱門搜索詞
   */
  static getPopularTerms(limit: number = 10): PopularSearchTerm[] {
    try {
      const stored = localStorage.getItem(this.POPULAR_TERMS_KEY);
      if (!stored) return [];

      const terms: PopularSearchTerm[] = JSON.parse(stored);
      return terms
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to load popular terms:', error);
      return [];
    }
  }

  /**
   * 獲取智能搜索建議
   */
  static getSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // 1. 從歷史記錄中匹配
    const history = this.getHistory(20);
    const historyMatches = history
      .filter(item =>
        item.query.toLowerCase().includes(query.toLowerCase()) &&
        item.query.toLowerCase() !== query.toLowerCase()
      )
      .map(item => ({
        text: item.query,
        type: 'history' as const,
        score: this.calculateSuggestionScore(item, query),
        metadata: {
          results_count: item.results_count,
          last_used: item.timestamp
        }
      }));

    suggestions.push(...historyMatches);

    // 2. 從熱門搜索詞中匹配
    const popularTerms = this.getPopularTerms(20);
    const popularMatches = popularTerms
      .filter(term =>
        term.term.toLowerCase().includes(query.toLowerCase()) &&
        term.term.toLowerCase() !== query.toLowerCase()
      )
      .map(term => ({
        text: term.term,
        type: 'popular' as const,
        score: this.calculatePopularScore(term, query),
        metadata: {
          search_count: term.count,
          last_searched: term.last_searched
        }
      }));

    suggestions.push(...popularMatches);

    // 3. 生成自動完成建議（簡單的前綴匹配）
    const autocompleteSuggestions = this.generateAutocompleteSuggestions(query);
    suggestions.push(...autocompleteSuggestions);

    // 去重並排序
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    return uniqueSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 獲取相關搜索建議
   */
  static getRelatedSearches(query: string, limit: number = 5): string[] {
    const history = this.getHistory();

    // 找到與當前查詢相似的歷史記錄
    const related = history
      .filter(item => {
        const similarity = this.calculateStringSimilarity(
          item.query.toLowerCase(),
          query.toLowerCase()
        );
        return similarity > 0.3 && similarity < 0.9;
      })
      .map(item => item.query);

    // 去重並返回
    return Array.from(new Set(related)).slice(0, limit);
  }

  /**
   * 搜索歷史統計
   */
  static getStatistics(): {
    total_searches: number;
    total_clicks: number;
    avg_results_per_search: number;
    most_searched_term: string | null;
    search_types: Record<string, number>;
  } {
    const history = this.getHistory();

    if (history.length === 0) {
      return {
        total_searches: 0,
        total_clicks: 0,
        avg_results_per_search: 0,
        most_searched_term: null,
        search_types: {}
      };
    }

    const total_searches = history.length;
    const total_clicks = history.reduce((sum, item) =>
      sum + item.clicked_result_ids.length, 0
    );
    const avg_results_per_search = history.reduce((sum, item) =>
      sum + item.results_count, 0
    ) / total_searches;

    const popularTerms = this.getPopularTerms(1);
    const most_searched_term = popularTerms.length > 0 ? popularTerms[0].term : null;

    const search_types = history.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_searches,
      total_clicks,
      avg_results_per_search: Math.round(avg_results_per_search * 10) / 10,
      most_searched_term,
      search_types
    };
  }

  // ========== 私有方法 ==========

  /**
   * 保存搜索歷史到localStorage
   */
  private static saveHistory(history: SearchHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * 更新熱門搜索詞統計
   */
  private static updatePopularTerms(query: string): void {
    try {
      const stored = localStorage.getItem(this.POPULAR_TERMS_KEY);
      const terms: PopularSearchTerm[] = stored ? JSON.parse(stored) : [];

      const existing = terms.find(t => t.term === query);
      if (existing) {
        existing.count++;
        existing.last_searched = Date.now();
      } else {
        terms.push({
          term: query,
          count: 1,
          last_searched: Date.now()
        });
      }

      // 限制數量並保存
      const trimmed = terms
        .sort((a, b) => b.count - a.count)
        .slice(0, this.MAX_POPULAR_TERMS);

      localStorage.setItem(this.POPULAR_TERMS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to update popular terms:', error);
    }
  }

  /**
   * 計算建議評分（歷史記錄）
   */
  private static calculateSuggestionScore(
    item: SearchHistoryItem,
    query: string
  ): number {
    let score = 0;

    // 時間因素（最近的記錄分數更高）
    const daysSince = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 1 - daysSince / 30); // 30天內線性衰減
    score += timeScore * 30;

    // 匹配度（前綴匹配分數更高）
    const queryLower = query.toLowerCase();
    const itemLower = item.query.toLowerCase();
    if (itemLower.startsWith(queryLower)) {
      score += 40;
    } else if (itemLower.includes(queryLower)) {
      score += 20;
    }

    // 結果數量（有結果的查詢分數更高）
    if (item.results_count > 0) {
      score += Math.min(item.results_count / 10, 10);
    }

    // 點擊率（有點擊的查詢分數更高）
    score += item.clicked_result_ids.length * 5;

    return score;
  }

  /**
   * 計算熱門搜索詞評分
   */
  private static calculatePopularScore(
    term: PopularSearchTerm,
    query: string
  ): number {
    let score = 0;

    // 搜索次數
    score += Math.min(term.count * 2, 40);

    // 匹配度
    const queryLower = query.toLowerCase();
    const termLower = term.term.toLowerCase();
    if (termLower.startsWith(queryLower)) {
      score += 30;
    } else if (termLower.includes(queryLower)) {
      score += 15;
    }

    // 時效性
    const daysSince = (Date.now() - term.last_searched) / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 1 - daysSince / 30);
    score += timeScore * 20;

    return score;
  }

  /**
   * 生成自動完成建議（簡化版）
   */
  private static generateAutocompleteSuggestions(query: string): SearchSuggestion[] {
    // TODO: 實現更智能的自動完成邏輯
    // 可以從常見搜索模板、分類名稱等生成
    return [];
  }

  /**
   * 去重建議列表
   */
  private static deduplicateSuggestions(
    suggestions: SearchSuggestion[]
  ): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.text.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 計算字串相似度（簡單版Levenshtein距離）
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein距離算法
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取設備信息
   */
  private static getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = window.navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * 同步到雲端（異步）
   */
  private static async syncToCloud(item: SearchHistoryItem): Promise<void> {
    // TODO: 實現雲端同步API調用
    // const token = localStorage.getItem('token');
    // await fetch('/api/knowledge-base/search-history', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   },
    //   body: JSON.stringify(item)
    // });
  }
}
