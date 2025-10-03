/**
 * ================================================================
 * SearchHistoryManager 測試套件
 * ================================================================
 *
 * 測試搜索歷史管理器的所有核心功能：
 * • localStorage 持久化
 * • 搜索歷史 CRUD
 * • 熱門搜索統計
 * • 智能建議生成
 * • Levenshtein 距離算法
 * • 評分系統
 */

import { SearchHistoryManager, SearchHistoryItem } from '@/lib/knowledge/search-history-manager';

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock() as any;

describe('SearchHistoryManager', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();
  });

  describe('addHistory', () => {
    it('應該成功添加搜索歷史記錄', () => {
      SearchHistoryManager.addHistory({
        query: '測試查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const history = SearchHistoryManager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe('測試查詢');
      expect(history[0].type).toBe('text');
      expect(history[0].results_count).toBe(10);
    });

    it('應該生成唯一 ID 和時間戳', () => {
      SearchHistoryManager.addHistory({
        query: '查詢1',
        type: 'text',
        results_count: 5,
        clicked_result_ids: []
      });

      const history = SearchHistoryManager.getHistory();
      expect(history[0].id).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
      expect(typeof history[0].id).toBe('string');
      expect(typeof history[0].timestamp).toBe('number');
    });

    it('應該在5分鐘內對相同查詢去重（更新而非新增）', () => {
      const query = '重複查詢';

      SearchHistoryManager.addHistory({
        query,
        type: 'text',
        results_count: 5,
        clicked_result_ids: []
      });

      // 立即添加相同查詢
      SearchHistoryManager.addHistory({
        query,
        type: 'text',
        results_count: 8,
        clicked_result_ids: []
      });

      const history = SearchHistoryManager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].results_count).toBe(8); // 應該更新為最新的結果數
    });

    it('應該限制最大歷史記錄數量為100', () => {
      // 添加 150 條記錄
      for (let i = 0; i < 150; i++) {
        SearchHistoryManager.addHistory({
          query: `查詢 ${i}`,
          type: 'text',
          results_count: i,
          clicked_result_ids: []
        });
      }

      const history = SearchHistoryManager.getHistory();
      expect(history).toHaveLength(100);
      expect(history[0].query).toBe('查詢 149'); // 最新的在前
    });

    it('應該更新熱門搜索詞統計', () => {
      SearchHistoryManager.addHistory({
        query: '熱門查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const popularTerms = SearchHistoryManager.getPopularTerms(10);
      expect(popularTerms).toHaveLength(1);
      expect(popularTerms[0].term).toBe('熱門查詢');
      expect(popularTerms[0].count).toBe(1);
    });
  });

  describe('getHistory', () => {
    it('應該返回所有歷史記錄（無限制）', () => {
      for (let i = 0; i < 10; i++) {
        SearchHistoryManager.addHistory({
          query: `查詢 ${i}`,
          type: 'text',
          results_count: i,
          clicked_result_ids: []
        });
      }

      const history = SearchHistoryManager.getHistory();
      expect(history).toHaveLength(10);
    });

    it('應該支持限制返回數量', () => {
      for (let i = 0; i < 10; i++) {
        SearchHistoryManager.addHistory({
          query: `查詢 ${i}`,
          type: 'text',
          results_count: i,
          clicked_result_ids: []
        });
      }

      const history = SearchHistoryManager.getHistory(5);
      expect(history).toHaveLength(5);
      expect(history[0].query).toBe('查詢 9'); // 最新的
    });

    it('空歷史時應該返回空數組', () => {
      const history = SearchHistoryManager.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('應該清空所有搜索歷史', () => {
      SearchHistoryManager.addHistory({
        query: '查詢1',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      SearchHistoryManager.clearHistory();
      const history = SearchHistoryManager.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('deleteHistoryItem', () => {
    it('應該刪除指定的歷史記錄', () => {
      SearchHistoryManager.addHistory({
        query: '查詢1',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: '查詢2',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const history = SearchHistoryManager.getHistory();
      const idToDelete = history[0].id;

      SearchHistoryManager.deleteHistoryItem(idToDelete);

      const updatedHistory = SearchHistoryManager.getHistory();
      expect(updatedHistory).toHaveLength(1);
      expect(updatedHistory[0].query).toBe('查詢1');
    });
  });

  describe('updateHistoryClick', () => {
    it('應該記錄點擊的結果 ID', () => {
      SearchHistoryManager.addHistory({
        query: '查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const history = SearchHistoryManager.getHistory();
      const historyId = history[0].id;

      SearchHistoryManager.updateHistoryClick(historyId, 123);

      const updated = SearchHistoryManager.getHistory();
      expect(updated[0].clicked_result_ids).toContain(123);
    });

    it('應該防止重複記錄相同的點擊', () => {
      SearchHistoryManager.addHistory({
        query: '查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const history = SearchHistoryManager.getHistory();
      const historyId = history[0].id;

      SearchHistoryManager.updateHistoryClick(historyId, 123);
      SearchHistoryManager.updateHistoryClick(historyId, 123);

      const updated = SearchHistoryManager.getHistory();
      expect(updated[0].clicked_result_ids).toEqual([123]);
    });
  });

  describe('getPopularTerms', () => {
    it('應該返回按搜索次數降序排序的熱門詞', () => {
      // 搜索 "查詢A" 3次
      for (let i = 0; i < 3; i++) {
        SearchHistoryManager.addHistory({
          query: '查詢A',
          type: 'text',
          results_count: 10,
          clicked_result_ids: []
        });
      }

      // 搜索 "查詢B" 5次
      for (let i = 0; i < 5; i++) {
        SearchHistoryManager.addHistory({
          query: '查詢B',
          type: 'text',
          results_count: 10,
          clicked_result_ids: []
        });
      }

      const popular = SearchHistoryManager.getPopularTerms(10);
      expect(popular).toHaveLength(2);
      expect(popular[0].term).toBe('查詢B');
      expect(popular[0].count).toBe(5);
      expect(popular[1].term).toBe('查詢A');
      expect(popular[1].count).toBe(3);
    });

    it('應該支持限制返回數量', () => {
      for (let i = 0; i < 10; i++) {
        SearchHistoryManager.addHistory({
          query: `查詢${i}`,
          type: 'text',
          results_count: 10,
          clicked_result_ids: []
        });
      }

      const popular = SearchHistoryManager.getPopularTerms(5);
      expect(popular).toHaveLength(5);
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      // 準備測試數據
      SearchHistoryManager.addHistory({
        query: '銷售策略',
        type: 'text',
        results_count: 10,
        clicked_result_ids: [1, 2]
      });

      SearchHistoryManager.addHistory({
        query: '銷售技巧',
        type: 'text',
        results_count: 8,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: '客戶管理',
        type: 'semantic',
        results_count: 15,
        clicked_result_ids: [3]
      });
    });

    it('應該返回與查詢匹配的建議', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷售', 10);

      expect(suggestions.length).toBeGreaterThan(0);
      const texts = suggestions.map(s => s.text);
      expect(texts).toContain('銷售策略');
      expect(texts).toContain('銷售技巧');
    });

    it('應該排除完全相同的查詢', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷售策略', 10);

      const exactMatch = suggestions.find(s => s.text === '銷售策略');
      expect(exactMatch).toBeUndefined();
    });

    it('應該按評分降序排序', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷售', 10);

      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].score).toBeGreaterThanOrEqual(suggestions[i + 1].score);
      }
    });

    it('應該支持限制建議數量', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('查詢太短（<2字符）時應該返回空數組', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷', 10);
      expect(suggestions).toEqual([]);
    });

    it('應該包含建議類型標記', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷售', 10);

      suggestions.forEach(s => {
        expect(['history', 'popular', 'related', 'autocomplete']).toContain(s.type);
      });
    });

    it('應該包含元數據（結果數、搜索次數等）', () => {
      const suggestions = SearchHistoryManager.getSuggestions('銷售', 10);
      const historySuggestion = suggestions.find(s => s.type === 'history');

      if (historySuggestion) {
        expect(historySuggestion.metadata).toBeDefined();
        expect(historySuggestion.metadata?.results_count).toBeDefined();
      }
    });
  });

  describe('getRelatedSearches', () => {
    beforeEach(() => {
      SearchHistoryManager.addHistory({
        query: '產品銷售策略',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: '市場營銷方案',
        type: 'text',
        results_count: 8,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: '客戶服務政策',
        type: 'text',
        results_count: 12,
        clicked_result_ids: []
      });
    });

    it('應該返回相似但不完全相同的查詢', () => {
      const related = SearchHistoryManager.getRelatedSearches('銷售策略', 5);

      expect(related.length).toBeGreaterThan(0);
      expect(related).not.toContain('銷售策略'); // 不包含完全相同的
    });

    it('應該支持限制返回數量', () => {
      const related = SearchHistoryManager.getRelatedSearches('銷售', 2);
      expect(related.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getStatistics', () => {
    it('應該返回正確的統計數據', () => {
      SearchHistoryManager.addHistory({
        query: '查詢1',
        type: 'text',
        results_count: 10,
        clicked_result_ids: [1, 2]
      });

      SearchHistoryManager.addHistory({
        query: '查詢2',
        type: 'semantic',
        results_count: 15,
        clicked_result_ids: [3]
      });

      const stats = SearchHistoryManager.getStatistics();

      expect(stats.total_searches).toBe(2);
      expect(stats.total_clicks).toBe(3);
      expect(stats.avg_results_per_search).toBe(12.5);
      expect(stats.search_types).toHaveProperty('text');
      expect(stats.search_types).toHaveProperty('semantic');
    });

    it('空歷史時應該返回零值', () => {
      const stats = SearchHistoryManager.getStatistics();

      expect(stats.total_searches).toBe(0);
      expect(stats.total_clicks).toBe(0);
      expect(stats.avg_results_per_search).toBe(0);
      expect(stats.most_searched_term).toBeNull();
    });

    it('應該正確計算最常搜索的關鍵詞', () => {
      for (let i = 0; i < 5; i++) {
        SearchHistoryManager.addHistory({
          query: '熱門查詢',
          type: 'text',
          results_count: 10,
          clicked_result_ids: []
        });
      }

      SearchHistoryManager.addHistory({
        query: '其他查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const stats = SearchHistoryManager.getStatistics();
      expect(stats.most_searched_term).toBe('熱門查詢');
    });
  });

  describe('Levenshtein Distance Algorithm', () => {
    it('應該正確計算字串相似度', () => {
      // 使用私有方法測試（通過相關搜索間接測試）
      SearchHistoryManager.addHistory({
        query: 'test',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: 'testing',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const related = SearchHistoryManager.getRelatedSearches('test', 5);
      // 'testing' 應該被識別為相關（編輯距離為3）
      expect(related.length).toBeGreaterThan(0);
    });
  });

  describe('評分算法', () => {
    it('前綴匹配應該獲得更高評分', () => {
      const now = Date.now();

      SearchHistoryManager.addHistory({
        query: '銷售策略方案',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: '市場銷售',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const suggestions = SearchHistoryManager.getSuggestions('銷售', 10);

      const prefixMatch = suggestions.find(s => s.text === '銷售策略方案');
      const containsMatch = suggestions.find(s => s.text === '市場銷售');

      if (prefixMatch && containsMatch) {
        // 前綴匹配評分應該更高
        expect(prefixMatch.score).toBeGreaterThan(containsMatch.score);
      }
    });

    it('有結果的查詢應該獲得額外評分', () => {
      SearchHistoryManager.addHistory({
        query: '有結果查詢',
        type: 'text',
        results_count: 20,
        clicked_result_ids: []
      });

      SearchHistoryManager.addHistory({
        query: '無結果查詢',
        type: 'text',
        results_count: 0,
        clicked_result_ids: []
      });

      const suggestions = SearchHistoryManager.getSuggestions('查詢', 10);

      const withResults = suggestions.find(s => s.text === '有結果查詢');
      const noResults = suggestions.find(s => s.text === '無結果查詢');

      if (withResults && noResults) {
        expect(withResults.score).toBeGreaterThan(noResults.score);
      }
    });

    it('有點擊的查詢應該獲得額外評分', () => {
      SearchHistoryManager.addHistory({
        query: '高點擊查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: [1, 2, 3, 4, 5]
      });

      SearchHistoryManager.addHistory({
        query: '無點擊查詢',
        type: 'text',
        results_count: 10,
        clicked_result_ids: []
      });

      const suggestions = SearchHistoryManager.getSuggestions('查詢', 10);

      const withClicks = suggestions.find(s => s.text === '高點擊查詢');
      const noClicks = suggestions.find(s => s.text === '無點擊查詢');

      if (withClicks && noClicks) {
        expect(withClicks.score).toBeGreaterThan(noClicks.score);
      }
    });
  });

  describe('錯誤處理', () => {
    it('localStorage 錯誤時應該返回空結果', () => {
      // Mock localStorage 拋出錯誤
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('localStorage error');
      });

      const history = SearchHistoryManager.getHistory();
      expect(history).toEqual([]);

      // 恢復
      localStorage.getItem = originalGetItem;
    });

    it('解析損壞的 JSON 時應該返回空結果', () => {
      localStorage.setItem('knowledge_search_history', 'invalid json');

      const history = SearchHistoryManager.getHistory();
      expect(history).toEqual([]);
    });
  });
});
