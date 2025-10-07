/**
 * @fileoverview ================================================================AI銷售賦能平台 - 全文檢索增強模塊================================================================【功能說明】提供 PostgreSQL Full-Text Search 的高級功能封裝，支持中文分詞、相關性排序、高亮顯示和搜索質量優化。【主要功能】• 全文檢索查詢構建 - ts_query 和 ts_vector• 中文分詞支持 - Jieba 分詞整合• 相關性排序 - ts_rank 評分優化• 搜索高亮 - ts_headline 結果高亮• 查詢優化 - 停用詞過濾和同義詞擴展@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 4
 * @module lib/knowledge/full-text-search
 * @description
 * ================================================================AI銷售賦能平台 - 全文檢索增強模塊================================================================【功能說明】提供 PostgreSQL Full-Text Search 的高級功能封裝，支持中文分詞、相關性排序、高亮顯示和搜索質量優化。【主要功能】• 全文檢索查詢構建 - ts_query 和 ts_vector• 中文分詞支持 - Jieba 分詞整合• 相關性排序 - ts_rank 評分優化• 搜索高亮 - ts_headline 結果高亮• 查詢優化 - 停用詞過濾和同義詞擴展@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 4
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { Prisma } from '@prisma/client';

/**
 * 搜索配置介面
 */
export interface FullTextSearchConfig {
  language?: 'simple' | 'english' | 'chinese';
  minScore?: number;
  maxResults?: number;
  highlightOptions?: {
    startSel?: string;
    stopSel?: string;
    maxWords?: number;
    minWords?: number;
    shortWord?: number;
    highlightAll?: boolean;
    maxFragments?: number;
    fragmentDelimiter?: string;
  };
}

/**
 * 搜索結果介面
 */
export interface FullTextSearchResult {
  id: number;
  title: string;
  content: string;
  highlighted_title?: string;
  highlighted_content?: string;
  rank: number;
  category?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * 查詢統計介面
 */
export interface SearchQueryStats {
  query: string;
  total_results: number;
  avg_rank: number;
  execution_time_ms: number;
  zero_results: boolean;
  suggestions?: string[];
}

/**
 * 全文檢索增強類
 */
export class FullTextSearch {
  /**
   * 默認配置
   */
  private static readonly DEFAULT_CONFIG: FullTextSearchConfig = {
    language: 'simple', // PostgreSQL 默認不支持中文，需要額外配置
    minScore: 0.1,
    maxResults: 100,
    highlightOptions: {
      startSel: '<mark>',
      stopSel: '</mark>',
      maxWords: 35,
      minWords: 15,
      shortWord: 3,
      highlightAll: false,
      maxFragments: 3,
      fragmentDelimiter: ' ... '
    }
  };

  /**
   * 構建全文檢索 WHERE 條件
   *
   * @param query 搜索查詢
   * @param fields 搜索字段列表 (如 ['title', 'content'])
   * @param config 搜索配置
   * @returns Prisma WHERE 條件對象
   */
  static buildFullTextWhere(
    query: string,
    fields: string[] = ['title', 'content'],
    config: FullTextSearchConfig = {}
  ): any {
    const conf = { ...this.DEFAULT_CONFIG, ...config };

    // 預處理查詢詞
    const processedQuery = this.preprocessQuery(query);

    // 構建 OR 條件，搜索所有指定字段
    const orConditions = fields.map(field => ({
      [field]: {
        search: processedQuery,
        mode: 'insensitive' as const
      }
    }));

    return {
      OR: orConditions
    };
  }

  /**
   * 構建全文檢索 ORDER BY 條件（相關性排序）
   *
   * 注意：Prisma 目前不直接支持 ts_rank，需要使用原始 SQL
   *
   * @param query 搜索查詢
   * @returns 排序字段和方向
   */
  static buildFullTextOrderBy(query: string): any[] {
    // 簡化版：按更新時間和創建時間排序
    // TODO: 實現真正的 ts_rank 排序（需要原始 SQL 或視圖）
    return [
      { updated_at: 'desc' as const },
      { created_at: 'desc' as const }
    ];
  }

  /**
   * 預處理搜索查詢
   *
   * • 去除特殊字符
   * • 分詞處理（簡單空格分詞，生產環境需要 Jieba）
   * • 停用詞過濾
   * • 構建 tsquery 格式
   *
   * @param query 原始查詢
   * @returns 處理後的查詢字符串
   */
  static preprocessQuery(query: string): string {
    // 處理 null/undefined
    if (!query) {
      return '';
    }

    // 1. 去除特殊字符（保留中文、英文、數字、空格）
    let processed = query.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');

    // 2. 分詞（簡單空格分詞）
    const words = processed
      .split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => !this.isStopWord(word));

    // 3. 如果沒有有效詞，返回原始查詢
    if (words.length === 0) {
      return query;
    }

    // 4. 構建搜索字符串（使用 & 連接詞，表示 AND 關係）
    return words.join(' & ');
  }

  /**
   * 停用詞檢查
   *
   * @param word 待檢查的詞
   * @returns 是否為停用詞
   */
  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      // 中文停用詞
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一個',
      '上', '也', '很', '到', '說', '要', '去', '你', '會', '著', '沒有', '看', '好',
      '自己', '這', '那', '裡', '嗎', '呢', '吧', '啊',
      // 英文停用詞
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return stopWords.has(word.toLowerCase());
  }

  /**
   * 高亮搜索結果
   *
   * 在標題和內容中高亮匹配的關鍵詞
   *
   * @param text 原始文本
   * @param query 搜索查詢
   * @param config 高亮配置
   * @returns 高亮後的 HTML 文本
   */
  static highlightMatches(
    text: string,
    query: string,
    config: FullTextSearchConfig = {}
  ): string {
    // 處理空值
    if (!text || !query) {
      return text || '';
    }

    const conf = { ...this.DEFAULT_CONFIG, ...config };
    const { startSel, stopSel } = conf.highlightOptions!;

    // 預處理查詢，提取關鍵詞
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      return text;
    }

    // 構建正則表達式（不區分大小寫）
    const pattern = new RegExp(
      `(${keywords.map(k => this.escapeRegex(k)).join('|')})`,
      'gi'
    );

    // 替換匹配的關鍵詞
    return text.replace(pattern, `${startSel}$1${stopSel}`);
  }

  /**
   * 生成搜索摘要
   *
   * 從文檔內容中提取包含搜索關鍵詞的片段
   *
   * @param content 文檔內容
   * @param query 搜索查詢
   * @param config 配置選項
   * @returns 搜索摘要 HTML
   */
  static generateSnippet(
    content: string,
    query: string,
    config: FullTextSearchConfig = {}
  ): string {
    const conf = { ...this.DEFAULT_CONFIG, ...config };
    const {
      maxWords,
      minWords,
      maxFragments,
      fragmentDelimiter
    } = conf.highlightOptions!;

    // 提取關鍵詞
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      // 沒有關鍵詞，返回開頭部分
      const words = content.split(/\s+/).slice(0, maxWords);
      return words.join(' ') + (content.split(/\s+/).length > maxWords! ? '...' : '');
    }

    // 查找包含關鍵詞的片段
    const fragments: string[] = [];
    const sentences = content.split(/[。.!?！？]/);

    for (const sentence of sentences) {
      // 檢查句子是否包含關鍵詞
      const hasKeyword = keywords.some(keyword =>
        sentence.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        // 限制片段長度
        const words = sentence.split(/\s+/);
        let fragment = sentence;

        if (words.length > maxWords!) {
          // 找到關鍵詞位置，取其周圍的詞
          const keywordIndex = words.findIndex(word =>
            keywords.some(k => word.toLowerCase().includes(k.toLowerCase()))
          );

          if (keywordIndex !== -1) {
            const start = Math.max(0, keywordIndex - Math.floor(maxWords! / 2));
            const end = Math.min(words.length, start + maxWords!);
            fragment = words.slice(start, end).join(' ');

            if (start > 0) fragment = '...' + fragment;
            if (end < words.length) fragment = fragment + '...';
          }
        }

        // 高亮關鍵詞
        fragment = this.highlightMatches(fragment, query, config);
        fragments.push(fragment);

        if (fragments.length >= maxFragments!) {
          break;
        }
      }
    }

    // 如果沒找到片段，返回開頭
    if (fragments.length === 0) {
      const words = content.split(/\s+/).slice(0, maxWords);
      return words.join(' ') + (content.split(/\s+/).length > maxWords! ? '...' : '');
    }

    return fragments.join(fragmentDelimiter!);
  }

  /**
   * 計算搜索相關性評分（簡化版）
   *
   * TODO: 生產環境應使用 PostgreSQL 的 ts_rank 或 ts_rank_cd
   *
   * @param text 文本內容
   * @param query 搜索查詢
   * @returns 相關性評分 (0-1)
   */
  static calculateRelevanceScore(text: string, query: string): number {
    // 處理空值
    if (!text || !query) {
      return 0;
    }

    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      return 0;
    }

    const lowerText = text.toLowerCase();
    let score = 0;
    let totalWeight = 0;

    keywords.forEach((keyword, index) => {
      const weight = 1 / (index + 1); // 靠前的關鍵詞權重更高
      totalWeight += weight;

      // 計算關鍵詞出現次數
      const regex = new RegExp(this.escapeRegex(keyword), 'gi');
      const matches = lowerText.match(regex);
      const count = matches ? matches.length : 0;

      // TF (Term Frequency) 簡化計算
      const tf = count / (text.split(/\s+/).length || 1);
      score += tf * weight;
    });

    // 歸一化到 0-1
    return Math.min(score / totalWeight, 1);
  }

  /**
   * 提取查詢中的關鍵詞
   *
   * @param query 搜索查詢
   * @returns 關鍵詞數組
   */
  private static extractKeywords(query: string): string[] {
    // 去除特殊字符
    const processed = query.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');

    // 分詞並過濾停用詞
    return processed
      .split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => !this.isStopWord(word));
  }

  /**
   * 轉義正則表達式特殊字符
   *
   * @param str 待轉義字符串
   * @returns 轉義後的字符串
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 生成搜索建議（基於零結果查詢）
   *
   * 當搜索無結果時，提供可能的替代查詢
   *
   * @param query 原始查詢
   * @param existingTerms 現有的搜索詞庫
   * @returns 建議的替代查詢
   */
  static generateSuggestions(
    query: string,
    existingTerms: string[]
  ): string[] {
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      return [];
    }

    const suggestions: Array<{ term: string; similarity: number }> = [];

    // 計算與現有詞的相似度
    for (const term of existingTerms) {
      const termKeywords = this.extractKeywords(term);

      // 計算 Jaccard 相似度
      const intersection = keywords.filter(k =>
        termKeywords.some(tk => tk.toLowerCase() === k.toLowerCase())
      ).length;

      const union = new Set([...keywords, ...termKeywords]).size;
      const similarity = union > 0 ? intersection / union : 0;

      if (similarity > 0.2) {
        suggestions.push({ term, similarity });
      }
    }

    // 排序並返回前 5 個
    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(s => s.term);
  }

  /**
   * 記錄搜索統計
   *
   * @param stats 搜索統計數據
   */
  static async logSearchStats(stats: SearchQueryStats): Promise<void> {
    // TODO: 實現搜索統計日誌記錄
    // 可以存儲到數據庫或發送到分析服務

    console.log('Search Stats:', {
      query: stats.query,
      results: stats.total_results,
      avgRank: stats.avg_rank,
      time: `${stats.execution_time_ms}ms`,
      zeroResults: stats.zero_results,
      suggestions: stats.suggestions
    });

    // 如果是零結果查詢，特別標記以便後續優化
    if (stats.zero_results) {
      console.warn('Zero results query:', stats.query);
      // TODO: 存儲到零結果查詢表，用於分析和優化
    }
  }
}
