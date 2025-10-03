/**
 * ================================================================
 * FullTextSearch 測試套件
 * ================================================================
 *
 * 測試全文檢索功能：
 * • 查詢預處理
 * • 停用詞過濾
 * • 搜索高亮
 * • 摘要生成
 * • 相關性評分
 * • 建議生成
 */

import { FullTextSearch } from '@/lib/knowledge/full-text-search';

describe('FullTextSearch', () => {
  describe('preprocessQuery', () => {
    it('應該去除特殊字符', () => {
      const query = '銷售@#$策略!&*';
      const processed = FullTextSearch.preprocessQuery(query);

      expect(processed).not.toContain('@');
      expect(processed).not.toContain('#');
      expect(processed).not.toContain('$');
      expect(processed).not.toContain('!');
      expect(processed).not.toContain('&');
      expect(processed).not.toContain('*');
    });

    it('應該過濾停用詞', () => {
      const query = '的 我 在 銷售 有 策略';
      const processed = FullTextSearch.preprocessQuery(query);

      // 停用詞應該被過濾掉
      expect(processed).not.toContain('的');
      expect(processed).not.toContain('我');
      expect(processed).not.toContain('在');
      expect(processed).not.toContain('有');

      // 有效詞應該保留
      expect(processed).toContain('銷售');
      expect(processed).toContain('策略');
    });

    it('應該使用 & 連接詞（AND 關係）', () => {
      const query = '銷售 策略 方案';
      const processed = FullTextSearch.preprocessQuery(query);

      expect(processed).toContain('&');
    });

    it('空查詢應該返回原始字符串', () => {
      const query = '   ';
      const processed = FullTextSearch.preprocessQuery(query);

      expect(processed).toBe(query);
    });

    it('應該處理中英文混合查詢', () => {
      const query = 'sales 銷售 strategy 策略';
      const processed = FullTextSearch.preprocessQuery(query);

      expect(processed).toContain('sales');
      expect(processed).toContain('銷售');
      expect(processed).toContain('strategy');
      expect(processed).toContain('策略');
    });
  });

  describe('highlightMatches', () => {
    it('應該使用 <mark> 標籤高亮匹配的關鍵詞', () => {
      const text = '這是一個關於銷售策略的文檔';
      const query = '銷售';
      const highlighted = FullTextSearch.highlightMatches(text, query);

      expect(highlighted).toContain('<mark>');
      expect(highlighted).toContain('</mark>');
      expect(highlighted).toContain('<mark>銷售</mark>');
    });

    it('應該不區分大小寫匹配', () => {
      const text = 'This is a SALES document';
      const query = 'sales';
      const highlighted = FullTextSearch.highlightMatches(text, query);

      expect(highlighted).toContain('<mark>SALES</mark>');
    });

    it('應該高亮所有匹配項', () => {
      const text = '銷售策略包括銷售技巧和銷售流程';
      const query = '銷售';
      const highlighted = FullTextSearch.highlightMatches(text, query);

      const matches = highlighted.match(/<mark>銷售<\/mark>/g);
      expect(matches).toHaveLength(3);
    });

    it('應該支持多個關鍵詞高亮', () => {
      const text = '銷售策略和市場推廣';
      const query = '銷售 策略';
      const highlighted = FullTextSearch.highlightMatches(text, query);

      expect(highlighted).toContain('<mark>銷售</mark>');
      expect(highlighted).toContain('<mark>策略</mark>');
    });

    it('沒有匹配時應該返回原文', () => {
      const text = '這是一段文本';
      const query = '不存在的詞';
      const highlighted = FullTextSearch.highlightMatches(text, query);

      expect(highlighted).toBe(text);
      expect(highlighted).not.toContain('<mark>');
    });

    it('應該支持自定義高亮標籤', () => {
      const text = '這是一個測試';
      const query = '測試';
      const config = {
        highlightOptions: {
          startSel: '<strong>',
          stopSel: '</strong>',
          maxWords: 35,
          minWords: 15,
          shortWord: 3,
          highlightAll: false,
          maxFragments: 3,
          fragmentDelimiter: ' ... '
        }
      };

      const highlighted = FullTextSearch.highlightMatches(text, query, config);

      expect(highlighted).toContain('<strong>測試</strong>');
      expect(highlighted).not.toContain('<mark>');
    });
  });

  describe('generateSnippet', () => {
    it('應該提取包含關鍵詞的片段', () => {
      const content = '這是第一段。這是包含銷售策略的第二段。這是第三段。';
      const query = '銷售策略';
      const snippet = FullTextSearch.generateSnippet(content, query);

      expect(snippet).toContain('銷售策略');
      expect(snippet).toContain('<mark>');
    });

    it('應該限制片段長度', () => {
      const longContent = '這是一段非常長的文本 '.repeat(100) + '銷售策略 ' + '繼續很長的文本 '.repeat(100);
      const query = '銷售策略';
      const config = {
        highlightOptions: {
          startSel: '<mark>',
          stopSel: '</mark>',
          maxWords: 20,
          minWords: 10,
          shortWord: 3,
          highlightAll: false,
          maxFragments: 1,
          fragmentDelimiter: ' ... '
        }
      };

      const snippet = FullTextSearch.generateSnippet(longContent, query, config);

      const wordCount = snippet.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(25); // 允許一些誤差
    });

    it('應該支持多個片段', () => {
      const content = '第一段包含銷售。第二段包含策略。第三段包含方案。第四段包含執行。';
      const query = '銷售 策略 方案';
      const config = {
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

      const snippet = FullTextSearch.generateSnippet(content, query, config);

      expect(snippet).toContain(' ... '); // 片段分隔符
    });

    it('沒有關鍵詞時應該返回開頭部分', () => {
      const content = '這是一段很長的文檔內容'.repeat(50);
      const query = '不存在的詞';
      const snippet = FullTextSearch.generateSnippet(content, query);

      expect(snippet).toBeTruthy();
      expect(snippet.length).toBeLessThan(content.length);
    });
  });

  describe('calculateRelevanceScore', () => {
    it('應該計算相關性評分（0-1）', () => {
      const text = '銷售策略包括市場分析、客戶定位和銷售技巧';
      const query = '銷售 策略';
      const score = FullTextSearch.calculateRelevanceScore(text, query);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('關鍵詞出現次數越多，評分越高', () => {
      const text1 = '銷售策略';
      const text2 = '銷售策略、銷售技巧、銷售流程';
      const query = '銷售';

      const score1 = FullTextSearch.calculateRelevanceScore(text1, query);
      const score2 = FullTextSearch.calculateRelevanceScore(text2, query);

      expect(score2).toBeGreaterThan(score1);
    });

    it('靠前的關鍵詞權重更高', () => {
      const text = '銷售策略和市場推廣方案';
      const query1 = '銷售 市場';
      const query2 = '市場 銷售';

      const score1 = FullTextSearch.calculateRelevanceScore(text, query1);
      const score2 = FullTextSearch.calculateRelevanceScore(text, query2);

      // 第一個關鍵詞權重更高，所以順序不同會影響評分
      expect(score1).not.toBe(score2);
    });

    it('沒有匹配時應該返回 0', () => {
      const text = '這是一段文本';
      const query = '完全不相關的詞';
      const score = FullTextSearch.calculateRelevanceScore(text, query);

      expect(score).toBe(0);
    });

    it('空文本應該返回 0', () => {
      const text = '';
      const query = '銷售';
      const score = FullTextSearch.calculateRelevanceScore(text, query);

      expect(score).toBe(0);
    });
  });

  describe('generateSuggestions', () => {
    it('應該基於 Jaccard 相似度生成建議', () => {
      const query = '銷售 策略';
      const existingTerms = [
        '銷售策略方案',
        '市場營銷策略',
        '客戶服務政策',
        '產品銷售技巧'
      ];

      const suggestions = FullTextSearch.generateSuggestions(query, existingTerms);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('應該返回最相似的前 5 個建議', () => {
      const query = '銷售';
      const existingTerms = Array(20).fill(0).map((_, i) => `銷售${i}`);

      const suggestions = FullTextSearch.generateSuggestions(query, existingTerms);

      expect(suggestions).toHaveLength(5);
    });

    it('沒有相似詞時應該返回空數組', () => {
      const query = '銷售 策略';
      const existingTerms = ['完全不相關的詞'];

      const suggestions = FullTextSearch.generateSuggestions(query, existingTerms);

      expect(suggestions).toEqual([]);
    });

    it('空查詢應該返回空數組', () => {
      const query = '';
      const existingTerms = ['詞1', '詞2'];

      const suggestions = FullTextSearch.generateSuggestions(query, existingTerms);

      expect(suggestions).toEqual([]);
    });
  });

  describe('buildFullTextWhere', () => {
    it('應該構建正確的 WHERE 條件', () => {
      const query = '銷售策略';
      const fields = ['title', 'content'];

      const where = FullTextSearch.buildFullTextWhere(query, fields);

      expect(where).toHaveProperty('OR');
      expect(where.OR).toBeInstanceOf(Array);
      expect(where.OR).toHaveLength(2);
    });

    it('應該支持單個字段搜索', () => {
      const query = '銷售';
      const fields = ['title'];

      const where = FullTextSearch.buildFullTextWhere(query, fields);

      expect(where.OR).toHaveLength(1);
      expect(where.OR[0]).toHaveProperty('title');
    });

    it('應該使用不區分大小寫模式', () => {
      const query = '銷售';
      const fields = ['title'];

      const where = FullTextSearch.buildFullTextWhere(query, fields);

      expect(where.OR[0].title.mode).toBe('insensitive');
    });
  });

  describe('buildFullTextOrderBy', () => {
    it('應該返回按日期降序的排序條件', () => {
      const query = '銷售';
      const orderBy = FullTextSearch.buildFullTextOrderBy(query);

      expect(orderBy).toBeInstanceOf(Array);
      expect(orderBy.length).toBeGreaterThan(0);
      expect(orderBy[0]).toHaveProperty('updated_at');
    });
  });

  describe('logSearchStats', () => {
    it('應該記錄搜索統計（不拋出錯誤）', async () => {
      const stats = {
        query: '測試查詢',
        total_results: 10,
        avg_rank: 0.8,
        execution_time_ms: 150,
        zero_results: false
      };

      await expect(FullTextSearch.logSearchStats(stats)).resolves.not.toThrow();
    });

    it('應該標記零結果查詢', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const stats = {
        query: '沒有結果的查詢',
        total_results: 0,
        avg_rank: 0,
        execution_time_ms: 100,
        zero_results: true
      };

      await FullTextSearch.logSearchStats(stats);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Zero results query:',
        '沒有結果的查詢'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('停用詞處理', () => {
    const chineseStopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人'];
    const englishStopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on'];

    it('應該過濾中文停用詞', () => {
      const query = chineseStopWords.join(' ') + ' 銷售 策略';
      const processed = FullTextSearch.preprocessQuery(query);

      chineseStopWords.forEach(word => {
        expect(processed).not.toContain(word);
      });

      expect(processed).toContain('銷售');
      expect(processed).toContain('策略');
    });

    it('應該過濾英文停用詞', () => {
      const query = englishStopWords.join(' ') + ' sales strategy';
      const processed = FullTextSearch.preprocessQuery(query);

      englishStopWords.forEach(word => {
        expect(processed.toLowerCase()).not.toContain(word);
      });

      expect(processed).toContain('sales');
      expect(processed).toContain('strategy');
    });
  });

  describe('邊界情況', () => {
    it('應該處理 null 和 undefined', () => {
      expect(() => FullTextSearch.preprocessQuery(null as any)).not.toThrow();
      expect(() => FullTextSearch.preprocessQuery(undefined as any)).not.toThrow();
    });

    it('應該處理空字符串', () => {
      const processed = FullTextSearch.preprocessQuery('');
      expect(processed).toBe('');
    });

    it('應該處理只有空格的字符串', () => {
      const processed = FullTextSearch.preprocessQuery('    ');
      expect(processed).toBe('    ');
    });

    it('應該處理超長查詢', () => {
      const longQuery = '銷售 '.repeat(1000);
      expect(() => FullTextSearch.preprocessQuery(longQuery)).not.toThrow();
    });

    it('應該處理特殊Unicode字符', () => {
      const query = '銷售策略 😀 🎉';
      const processed = FullTextSearch.preprocessQuery(query);

      expect(processed).toContain('銷售');
      expect(processed).toContain('策略');
    });
  });

  describe('性能測試', () => {
    it('處理大文本應該在合理時間內完成', () => {
      const largeText = '這是一段很長的文本內容。'.repeat(10000);
      const query = '文本';

      const start = Date.now();
      FullTextSearch.calculateRelevanceScore(largeText, query);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000); // 應該在1秒內完成
    });

    it('生成大量建議應該在合理時間內完成', () => {
      const query = '銷售';
      const existingTerms = Array(1000).fill(0).map((_, i) => `銷售策略${i}`);

      const start = Date.now();
      FullTextSearch.generateSuggestions(query, existingTerms);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(500); // 應該在0.5秒內完成
    });
  });
});
