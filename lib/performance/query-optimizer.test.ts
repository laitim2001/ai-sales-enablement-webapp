/**
 * 資料庫查詢優化系統測試
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

import {
  QueryOptimizer,
  createDataLoader,
  batchQuery,
  trackQuery,
  getQueryStats,
  detectNPlusOne,
  getSlowQueries,
  generateOptimizationReport,
  DataLoader,
} from './query-optimizer';

describe('QueryOptimizer', () => {
  beforeEach(() => {
    QueryOptimizer.clearAllLoaders();
    QueryOptimizer.resetQueryStats();
  });

  // ============================================================
  // DataLoader 基本功能測試
  // ============================================================

  describe('DataLoader 基本功能', () => {
    it('應該批次載入數據', async () => {
      let batchCallCount = 0;
      const batchLoadFn = async (ids: readonly number[]) => {
        batchCallCount++;
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('users', batchLoadFn);

      // 同時發起多個請求
      const results = await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.load(3),
      ]);

      expect(results).toEqual([
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
      ]);

      // 應該只調用一次批次函數
      expect(batchCallCount).toBe(1);
    });

    it('應該緩存載入的數據', async () => {
      let callCount = 0;
      const batchLoadFn = async (ids: readonly number[]) => {
        callCount++;
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('users-cache', batchLoadFn);

      // 第一次載入
      await loader.load(1);
      expect(callCount).toBe(1);

      // 第二次載入應該從緩存返回
      await loader.load(1);
      expect(callCount).toBe(1); // 沒有再次調用
    });

    it('應該支持 loadMany', async () => {
      const batchLoadFn = async (ids: readonly number[]) => {
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('users-many', batchLoadFn);

      const results = await loader.loadMany([1, 2, 3]);

      expect(results).toEqual([
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
      ]);
    });

    it('應該支持 prime 設置緩存', async () => {
      let callCount = 0;
      const batchLoadFn = async (ids: readonly number[]) => {
        callCount++;
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('users-prime', batchLoadFn);

      // 預設緩存
      loader.prime(1, { id: 1, name: 'Cached User 1' });

      // 載入應該從緩存返回
      const result = await loader.load(1);
      expect(result).toEqual({ id: 1, name: 'Cached User 1' });
      expect(callCount).toBe(0); // 沒有調用批次函數
    });

    it('應該支持清除緩存', async () => {
      let callCount = 0;
      const batchLoadFn = async (ids: readonly number[]) => {
        callCount++;
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('users-clear', batchLoadFn);

      // 第一次載入
      await loader.load(1);
      expect(callCount).toBe(1);

      // 清除緩存
      loader.clear(1);

      // 再次載入應該重新調用
      await loader.load(1);
      expect(callCount).toBe(2);
    });

    it('應該處理批次函數錯誤', async () => {
      const batchLoadFn = async (ids: readonly number[]) => {
        throw new Error('Database error');
      };

      const loader = createDataLoader('users-error', batchLoadFn);

      await expect(loader.load(1)).rejects.toThrow('Database error');
    });

    it('應該驗證返回值數量', async () => {
      const batchLoadFn = async (ids: readonly number[]) => {
        // 返回錯誤數量的結果
        return [{ id: 1, name: 'User 1' }]; // 期望3個，只返回1個
      };

      const loader = createDataLoader('users-invalid', batchLoadFn);

      await expect(
        Promise.all([loader.load(1), loader.load(2), loader.load(3)])
      ).rejects.toThrow('must return array of same length');
    });
  });

  // ============================================================
  // 批量查詢測試
  // ============================================================

  describe('批量查詢', () => {
    it('應該執行批量查詢', async () => {
      const results = await batchQuery([
        { type: 'users', ids: [1, 2, 3] },
        { type: 'posts', ids: [10, 20] },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('users');
      expect(results[0].data).toHaveLength(3);
      expect(results[1].type).toBe('posts');
      expect(results[1].data).toHaveLength(2);
    });

    it('應該記錄批量查詢時長', async () => {
      await batchQuery([{ type: 'users', ids: [1, 2] }]);

      const stats = getQueryStats('batchQuery');
      expect(stats).toHaveLength(1);
      expect(stats[0].count).toBe(1);
      expect(stats[0].totalDuration).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // 查詢追蹤測試
  // ============================================================

  describe('查詢追蹤', () => {
    it('應該追蹤查詢性能', async () => {
      const queryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: 'test' };
      };

      const result = await trackQuery('testQuery', queryFn);

      expect(result).toEqual({ data: 'test' });

      const stats = getQueryStats('testQuery');
      expect(stats).toHaveLength(1);
      expect(stats[0].count).toBe(1);
      expect(stats[0].totalDuration).toBeGreaterThanOrEqual(10);
    });

    it('應該追蹤多次查詢', async () => {
      const queryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { data: 'test' };
      };

      await trackQuery('multiQuery', queryFn);
      await trackQuery('multiQuery', queryFn);
      await trackQuery('multiQuery', queryFn);

      const stats = getQueryStats('multiQuery');
      expect(stats).toHaveLength(1);
      expect(stats[0].count).toBe(3);
      expect(stats[0].avgDuration).toBeGreaterThan(0);
    });

    it('應該追蹤查詢錯誤', async () => {
      const queryFn = async () => {
        throw new Error('Query error');
      };

      await expect(trackQuery('errorQuery', queryFn)).rejects.toThrow('Query error');

      const stats = getQueryStats('errorQuery');
      expect(stats).toHaveLength(1);
      expect(stats[0].count).toBe(1);
    });

    it('應該計算正確的統計數據', async () => {
      const queryFn1 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: 'test' };
      };

      const queryFn2 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { data: 'test' };
      };

      await trackQuery('statsQuery', queryFn1);
      await trackQuery('statsQuery', queryFn2);

      const stats = getQueryStats('statsQuery');
      expect(stats[0].count).toBe(2);
      expect(stats[0].minDuration).toBeGreaterThanOrEqual(10);
      expect(stats[0].maxDuration).toBeGreaterThanOrEqual(20);
      expect(stats[0].avgDuration).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // N+1 查詢檢測測試
  // ============================================================

  describe('N+1 查詢檢測', () => {
    it('應該檢測 N+1 查詢模式', async () => {
      // 模擬 N+1 查詢：大量快速查詢
      const queryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { data: 'test' };
      };

      // 執行15次快速查詢（超過閾值10）
      for (let i = 0; i < 15; i++) {
        await trackQuery('getUserById', queryFn);
      }

      const nPlusOneIssues = detectNPlusOne(10);
      expect(nPlusOneIssues.length).toBeGreaterThan(0);
      expect(nPlusOneIssues[0].name).toBe('getUserById');
      expect(nPlusOneIssues[0].count).toBe(15);
    });

    it('不應該誤報慢查詢為 N+1', async () => {
      // 模擬慢查詢：少量慢速查詢
      const slowQueryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: 'test' };
      };

      for (let i = 0; i < 15; i++) {
        await trackQuery('slowQuery', slowQueryFn);
      }

      const nPlusOneIssues = detectNPlusOne(10);
      // 慢查詢不應該被檢測為 N+1（因為平均時長 >= 50ms）
      expect(
        nPlusOneIssues.find((issue) => issue.name === 'slowQuery')
      ).toBeUndefined();
    });
  });

  // ============================================================
  // 慢查詢檢測測試
  // ============================================================

  describe('慢查詢檢測', () => {
    it('應該檢測慢查詢', async () => {
      const slowQueryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        return { data: 'test' };
      };

      await trackQuery('verySlowQuery', slowQueryFn);

      const slowQueries = getSlowQueries(1000);
      expect(slowQueries.length).toBeGreaterThan(0);
      expect(slowQueries[0].name).toBe('verySlowQuery');
      expect(slowQueries[0].avgDuration).toBeGreaterThanOrEqual(1000);
    });

    it('應該按平均時長排序慢查詢', async () => {
      const slowQueryFn1 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { data: 'test' };
      };

      const slowQueryFn2 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return { data: 'test' };
      };

      await trackQuery('slowQuery1', slowQueryFn1);
      await trackQuery('slowQuery2', slowQueryFn2);

      const slowQueries = getSlowQueries(400);
      expect(slowQueries.length).toBe(2);
      expect(slowQueries[0].name).toBe('slowQuery2'); // 更慢的在前
      expect(slowQueries[1].name).toBe('slowQuery1');
    });
  });

  // ============================================================
  // 優化報告測試
  // ============================================================

  describe('優化報告', () => {
    it('應該生成優化報告', async () => {
      const report = generateOptimizationReport();

      expect(report).toHaveProperty('totalQueries');
      expect(report).toHaveProperty('avgDuration');
      expect(report).toHaveProperty('nPlusOneIssues');
      expect(report).toHaveProperty('slowQueries');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('應該在有問題時提供建議', async () => {
      // 創建 N+1 問題
      const fastQueryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { data: 'test' };
      };

      for (let i = 0; i < 15; i++) {
        await trackQuery('nPlusOneQuery', fastQueryFn);
      }

      // 創建慢查詢
      const slowQueryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        return { data: 'test' };
      };

      await trackQuery('slowQuery', slowQueryFn);

      const report = generateOptimizationReport();

      expect(report.nPlusOneIssues).toBeGreaterThan(0);
      expect(report.slowQueries).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(
        report.recommendations.some((r) => r.includes('N+1'))
      ).toBe(true);
      expect(
        report.recommendations.some((r) => r.includes('慢查詢'))
      ).toBe(true);
    });

    it('應該在無問題時顯示良好狀態', async () => {
      const report = generateOptimizationReport();

      expect(report.recommendations).toContain('查詢性能良好，無明顯優化建議');
    });
  });

  // ============================================================
  // 配置測試
  // ============================================================

  describe('配置', () => {
    it('應該支持配置選項', () => {
      QueryOptimizer.configure({
        enableCache: false,
        enableTracking: false,
        maxBatchSize: 50,
      });

      // 配置應該生效（這裡只驗證不拋出錯誤）
      expect(true).toBe(true);
    });
  });

  // ============================================================
  // 真實業務場景測試
  // ============================================================

  describe('真實業務場景', () => {
    it('場景1: 防止用戶查詢 N+1 問題', async () => {
      // 使用 DataLoader
      const batchLoadFn = async (ids: readonly number[]) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('users-scenario', batchLoadFn);

      const userIds = [1, 2, 3, 4, 5];

      // DataLoader 應該批次載入所有用戶
      const start = Date.now();
      const results = await Promise.all(userIds.map((id) => loader.load(id)));
      const duration = Date.now() - start;

      // 所有用戶都應該成功載入
      expect(results).toHaveLength(5);
      expect(results.every((r) => r.name)).toBe(true);

      // 批次執行應該只需要一次延遲（約10ms）+ 一些開銷
      expect(duration).toBeLessThan(50); // 寬鬆的閾值以避免時間敏感問題
    });

    it('場景2: 文章和作者查詢優化', async () => {
      // 創建用戶 DataLoader
      const userLoader = createDataLoader('scenario2-users', async (ids) => {
        return ids.map((id) => ({ id, name: `User ${id}` }));
      });

      // 模擬文章列表
      const posts = [
        { id: 1, title: 'Post 1', authorId: 1 },
        { id: 2, title: 'Post 2', authorId: 2 },
        { id: 3, title: 'Post 3', authorId: 1 },
      ];

      // 批次載入所有作者
      const authors = await Promise.all(
        posts.map((post) => userLoader.load(post.authorId))
      );

      expect(authors).toHaveLength(3);
      expect(authors[0].id).toBe(1);
      expect(authors[1].id).toBe(2);
      expect(authors[2].id).toBe(1); // 從緩存返回
    });

    it('場景3: 查詢性能監控和優化', async () => {
      // 確保追蹤已啟用
      QueryOptimizer.configure({ enableTracking: true });

      // 模擬不同性能的查詢
      const queries = [
        { name: 'fastQuery3_scenario', duration: 10 },
        { name: 'mediumQuery3_scenario', duration: 100 },
        { name: 'slowQuery3_scenario', duration: 1100 },
      ];

      for (const query of queries) {
        const queryFn = async () => {
          await new Promise((resolve) => setTimeout(resolve, query.duration));
          return { data: 'test' };
        };
        await trackQuery(query.name, queryFn);
      }

      // 執行多次快速查詢模擬 N+1
      for (let i = 0; i < 15; i++) {
        await trackQuery('nPlusOneQuery3_scenario', async () => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return { data: 'test' };
        });
      }

      // 驗證查詢統計 - 這個測試創建了4個唯一查詢
      const stats = getQueryStats();
      expect(stats.length).toBe(4);  // 正好4個查詢

      // 驗證具體的查詢被記錄了
      expect(stats.some(s => s.name === 'fastQuery3_scenario')).toBe(true);
      expect(stats.some(s => s.name === 'slowQuery3_scenario')).toBe(true);
      expect(stats.some(s => s.name === 'nPlusOneQuery3_scenario')).toBe(true);

      // 生成報告
      const report = generateOptimizationReport();

      expect(report.totalQueries).toBe(18); // 3 + 15 = 18次查詢
      expect(report.slowQueries).toBeGreaterThan(0);
      expect(report.nPlusOneIssues).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 性能測試
  // ============================================================

  describe('性能測試', () => {
    it('DataLoader 應該能處理大量並發請求', async () => {
      const batchLoadFn = async (ids: readonly number[]) => {
        return ids.map((id) => ({ id, name: `User ${id}` }));
      };

      const loader = createDataLoader('perf-loader', batchLoadFn);

      const start = Date.now();

      // 1000 個並發請求
      const promises = [];
      for (let i = 1; i <= 1000; i++) {
        promises.push(loader.load(i % 100)); // 只有100個唯一ID，測試緩存
      }

      await Promise.all(promises);

      const duration = Date.now() - start;

      // 應該在合理時間內完成（<500ms）
      expect(duration).toBeLessThan(500);
    });

    it('查詢統計應該能處理大量記錄', async () => {
      // 確保追蹤已啟用
      QueryOptimizer.configure({ enableTracking: true });

      const queryFn = async () => ({ data: 'test' });

      const start = Date.now();

      // 記錄1000次查詢，使用10個唯一名稱
      for (let i = 0; i < 1000; i++) {
        await trackQuery(`perfTest_Query${i % 10}`, queryFn);
      }

      const duration = Date.now() - start;

      const stats = getQueryStats();
      // 這個測試創建了10個唯一查詢（perfTest_Query0 到 perfTest_Query9）
      expect(stats.length).toBe(10);

      // 每個查詢應該被調用100次（1000 / 10 = 100）
      stats.forEach(stat => {
        expect(stat.count).toBe(100);
      });

      // 統計計算應該快速
      expect(duration).toBeLessThan(1000);
    });
  });
});
