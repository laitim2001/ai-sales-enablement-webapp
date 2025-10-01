/**
 * 響應緩存系統測試
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

import {
  ResponseCache,
  cacheResponse,
  withCache,
  invalidateCache,
  invalidateCacheByTag,
  clearCache,
  getCacheStats,
} from './response-cache';

// Mock next/server module - must use function factory before imports
jest.mock('next/server', () => {
  class MockHeaders {
    private headers = new Map<string, string>();

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null;
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value);
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase());
    }

    forEach(callback: (value: string, key: string) => void): void {
      this.headers.forEach(callback);
    }
  }

  class MockNextRequest {
    url: string;
    method: string;
    headers: MockHeaders;
    cookies: Map<string, { value: string }> = new Map();

    constructor(url: string, init?: { method?: string; headers?: Record<string, string> }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new MockHeaders();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
  }

  class MockNextResponse {
    status: number;
    headers: MockHeaders;
    body: any;

    constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new MockHeaders();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }

    static json(data: any, init?: { status?: number; headers?: Record<string, string> }) {
      const response = new MockNextResponse(data, init);
      response.headers.set('content-type', 'application/json');
      return response as any;
    }

    clone() {
      return new MockNextResponse(this.body, { status: this.status });
    }

    async json() {
      return this.body;
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// Import after mock
const { NextRequest, NextResponse } = require('next/server');

describe('ResponseCache', () => {
  beforeEach(() => {
    ResponseCache.clear();
    ResponseCache.enable();
    jest.clearAllMocks();
  });

  // ============================================================
  // 基本緩存功能測試
  // ============================================================

  describe('基本緩存', () => {
    it('應該緩存數據', async () => {
      let callCount = 0;
      const getData = async () => {
        callCount++;
        return { data: 'test' };
      };

      // 第一次調用
      const result1 = await ResponseCache.cache('test-key', getData);
      expect(result1).toEqual({ data: 'test' });
      expect(callCount).toBe(1);

      // 第二次調用應該從緩存返回
      const result2 = await ResponseCache.cache('test-key', getData);
      expect(result2).toEqual({ data: 'test' });
      expect(callCount).toBe(1); // 沒有再次調用
    });

    it('應該支持自定義 TTL', async () => {
      const getData = async () => ({ data: 'test' });

      await ResponseCache.cache('test-key', getData, { ttl: 1 });

      // 等待超過 TTL
      await new Promise((resolve) => setTimeout(resolve, 1100));

      let callCount = 0;
      const getNewData = async () => {
        callCount++;
        return { data: 'new' };
      };

      const result = await ResponseCache.cache('test-key', getNewData, { ttl: 1 });
      expect(result).toEqual({ data: 'new' });
      expect(callCount).toBe(1); // 緩存過期，重新調用
    });

    it('應該支持標籤', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }), {
        tags: ['tag1'],
      });
      await ResponseCache.cache('key2', async () => ({ data: '2' }), {
        tags: ['tag1', 'tag2'],
      });
      await ResponseCache.cache('key3', async () => ({ data: '3' }), {
        tags: ['tag2'],
      });

      const stats1 = ResponseCache.getStats();
      expect(stats1.totalEntries).toBe(3);

      // 根據標籤失效
      const invalidated = ResponseCache.invalidateByTag('tag1');
      expect(invalidated).toBe(2);

      const stats2 = ResponseCache.getStats();
      expect(stats2.totalEntries).toBe(1);
    });

    it('禁用時不應該緩存', async () => {
      ResponseCache.disable();

      let callCount = 0;
      const getData = async () => {
        callCount++;
        return { data: 'test' };
      };

      await ResponseCache.cache('test-key', getData);
      await ResponseCache.cache('test-key', getData);

      expect(callCount).toBe(2); // 每次都調用
    });
  });

  // ============================================================
  // API 路由包裝測試
  // ============================================================

  describe('API 路由包裝', () => {
    it('應該緩存 GET 請求', async () => {
      let callCount = 0;
      const handler = async (request: any) => {
        callCount++;
        return NextResponse.json({ data: 'test' });
      };

      const cachedHandler = withCache(handler, { ttl: 300 });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      // 第一次調用
      const response1 = await cachedHandler(request);
      expect(callCount).toBe(1);
      expect(response1.headers.get('X-Cache')).toBe('MISS');
      expect(response1.headers.get('ETag')).toBeDefined();

      // 第二次調用應該從緩存返回
      const response2 = await cachedHandler(request);
      expect(callCount).toBe(1); // 沒有再次調用
      expect(response2.headers.get('X-Cache')).toBe('HIT');
    });

    it('不應該緩存非 GET 請求', async () => {
      let callCount = 0;
      const handler = async () => {
        callCount++;
        return NextResponse.json({ data: 'test' });
      };

      const cachedHandler = withCache(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      await cachedHandler(request);
      await cachedHandler(request);

      expect(callCount).toBe(2); // 每次都調用
    });

    it('應該處理 If-None-Match header', async () => {
      const handler = async () => {
        return NextResponse.json({ data: 'test' });
      };

      const cachedHandler = withCache(handler);

      // 第一次調用獲取 ETag
      const request1 = new NextRequest('http://localhost:3000/api/test');
      const response1 = await cachedHandler(request1);
      const etag = response1.headers.get('ETag');

      // 第二次調用帶上 ETag
      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'if-none-match': etag!,
        },
      });
      const response2 = await cachedHandler(request2);

      expect(response2.status).toBe(304);
      expect(response2.headers.get('ETag')).toBe(etag);
    });

    it('應該支持自定義緩存鍵', async () => {
      let callCount = 0;
      const handler = async () => {
        callCount++;
        return NextResponse.json({ data: 'test' });
      };

      const cachedHandler = withCache(handler, { key: 'custom-key' });

      const request1 = new NextRequest('http://localhost:3000/api/test?param=1');
      const request2 = new NextRequest('http://localhost:3000/api/test?param=2');

      await cachedHandler(request1);
      await cachedHandler(request2);

      // 使用相同的自定義鍵，所以只調用一次
      expect(callCount).toBe(1);
    });

    it('應該支持條件緩存', async () => {
      let callCount = 0;
      const handler = async () => {
        callCount++;
        return NextResponse.json({ data: 'test' });
      };

      const cachedHandler = withCache(handler, {
        condition: (request) => {
          const url = new URL(request.url);
          return url.searchParams.get('cache') === 'true';
        },
      });

      // 不滿足條件，不緩存
      const request1 = new NextRequest('http://localhost:3000/api/test');
      await cachedHandler(request1);
      await cachedHandler(request1);
      expect(callCount).toBe(2);

      // 滿足條件，緩存
      const request2 = new NextRequest('http://localhost:3000/api/test?cache=true');
      await cachedHandler(request2);
      await cachedHandler(request2);
      expect(callCount).toBe(3); // 只增加一次
    });
  });

  // ============================================================
  // 緩存失效測試
  // ============================================================

  describe('緩存失效', () => {
    it('應該使單個緩存失效', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }));
      await ResponseCache.cache('key2', async () => ({ data: '2' }));

      expect(ResponseCache.getStats().totalEntries).toBe(2);

      ResponseCache.invalidate('key1');

      expect(ResponseCache.getStats().totalEntries).toBe(1);
    });

    it('應該根據標籤使緩存失效', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }), {
        tags: ['user:1'],
      });
      await ResponseCache.cache('key2', async () => ({ data: '2' }), {
        tags: ['user:1', 'posts'],
      });
      await ResponseCache.cache('key3', async () => ({ data: '3' }), {
        tags: ['user:2'],
      });

      const invalidated = ResponseCache.invalidateByTag('user:1');
      expect(invalidated).toBe(2);
      expect(ResponseCache.getStats().totalEntries).toBe(1);
    });

    it('應該清空所有緩存', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }));
      await ResponseCache.cache('key2', async () => ({ data: '2' }));
      await ResponseCache.cache('key3', async () => ({ data: '3' }));

      expect(ResponseCache.getStats().totalEntries).toBe(3);

      ResponseCache.clear();

      expect(ResponseCache.getStats().totalEntries).toBe(0);
    });
  });

  // ============================================================
  // 緩存清理測試
  // ============================================================

  describe('緩存清理', () => {
    it('應該清理過期緩存', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }), { ttl: 1 });
      await ResponseCache.cache('key2', async () => ({ data: '2' }), {
        ttl: 3600,
      });

      // 等待第一個緩存過期
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const removed = ResponseCache.cleanup();
      expect(removed).toBe(1);
      expect(ResponseCache.getStats().totalEntries).toBe(1);
    });
  });

  // ============================================================
  // 統計測試
  // ============================================================

  describe('緩存統計', () => {
    it('應該統計緩存命中和未命中', async () => {
      const getData = async () => ({ data: 'test' });

      // Miss
      await ResponseCache.cache('key1', getData);

      // Hit
      await ResponseCache.cache('key1', getData);

      // Miss
      await ResponseCache.cache('key2', getData);

      const stats = ResponseCache.getStats();
      expect(stats.totalHits).toBe(1);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(1 / 3, 2);
    });

    it('應該統計總條目數', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }));
      await ResponseCache.cache('key2', async () => ({ data: '2' }));
      await ResponseCache.cache('key3', async () => ({ data: '3' }));

      const stats = ResponseCache.getStats();
      expect(stats.totalEntries).toBe(3);
    });

    it('應該統計內存使用', async () => {
      await ResponseCache.cache('key1', async () => ({ data: 'x'.repeat(1000) }));

      const stats = ResponseCache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('應該統計最舊和最新條目', async () => {
      await ResponseCache.cache('key1', async () => ({ data: '1' }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      await ResponseCache.cache('key2', async () => ({ data: '2' }));

      const stats = ResponseCache.getStats();
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
      expect(stats.newestEntry!.getTime()).toBeGreaterThan(
        stats.oldestEntry!.getTime()
      );
    });

    it('應該統計頂級緩存鍵', async () => {
      // 創建並訪問不同次數
      for (let i = 0; i < 5; i++) {
        await ResponseCache.cache('key1', async () => ({ data: '1' }));
      }
      for (let i = 0; i < 3; i++) {
        await ResponseCache.cache('key2', async () => ({ data: '2' }));
      }
      for (let i = 0; i < 1; i++) {
        await ResponseCache.cache('key3', async () => ({ data: '3' }));
      }

      const stats = ResponseCache.getStats();
      expect(stats.topKeys.length).toBeGreaterThan(0);
      expect(stats.topKeys[0].key).toBe('key1');
      expect(stats.topKeys[0].hits).toBe(4); // 第一次 miss，後面4次 hit
    });
  });

  // ============================================================
  // 便利函數測試
  // ============================================================

  describe('便利函數', () => {
    it('cacheResponse 應該等同於 ResponseCache.cache', async () => {
      const result = await cacheResponse('key', async () => ({ data: 'test' }));
      expect(result).toEqual({ data: 'test' });
    });

    it('invalidateCache 應該等同於 ResponseCache.invalidate', async () => {
      await cacheResponse('key', async () => ({ data: 'test' }));
      const result = invalidateCache('key');
      expect(result).toBe(true);
    });

    it('invalidateCacheByTag 應該等同於 ResponseCache.invalidateByTag', async () => {
      await cacheResponse('key', async () => ({ data: 'test' }), {
        tags: ['tag1'],
      });
      const result = invalidateCacheByTag('tag1');
      expect(result).toBe(1);
    });

    it('clearCache 應該等同於 ResponseCache.clear', async () => {
      await cacheResponse('key', async () => ({ data: 'test' }));
      clearCache();
      expect(getCacheStats().totalEntries).toBe(0);
    });

    it('getCacheStats 應該等同於 ResponseCache.getStats', async () => {
      await cacheResponse('key', async () => ({ data: 'test' }));
      const stats = getCacheStats();
      expect(stats.totalEntries).toBe(1);
    });
  });

  // ============================================================
  // 真實業務場景測試
  // ============================================================

  describe('真實業務場景', () => {
    it('場景1: API 端點響應緩存', async () => {
      let dbCallCount = 0;
      const handler = async () => {
        dbCallCount++;
        // 模擬數據庫查詢
        await new Promise((resolve) => setTimeout(resolve, 10));
        return NextResponse.json({ users: [{ id: 1, name: 'User 1' }] });
      };

      const cachedHandler = withCache(handler, { ttl: 300 });

      const request = new NextRequest('http://localhost:3000/api/users');

      // 第一次請求 - 數據庫查詢
      const start1 = Date.now();
      await cachedHandler(request);
      const duration1 = Date.now() - start1;

      // 第二次請求 - 從緩存返回
      const start2 = Date.now();
      await cachedHandler(request);
      const duration2 = Date.now() - start2;

      expect(dbCallCount).toBe(1);
      expect(duration2).toBeLessThan(duration1); // 緩存更快
    });

    it('場景2: 用戶特定數據緩存', async () => {
      const handler = async (request: any) => {
        const userId = request.headers.get('user-id');
        return NextResponse.json({ profile: { userId } });
      };

      const cachedHandler = withCache(handler, {
        varyBy: ['user-id'],
        ttl: 300,
      });

      const request1 = new NextRequest('http://localhost:3000/api/profile', {
        headers: { 'user-id': '1' },
      });
      const request2 = new NextRequest('http://localhost:3000/api/profile', {
        headers: { 'user-id': '2' },
      });

      await cachedHandler(request1);
      await cachedHandler(request2);

      const stats = ResponseCache.getStats();
      expect(stats.totalEntries).toBe(2); // 為不同用戶創建不同緩存
    });

    it('場景3: 資料更新後失效緩存', async () => {
      // 緩存用戶列表
      await ResponseCache.cache(
        'users:list',
        async () => ({ users: [] }),
        { tags: ['users'] }
      );

      // 緩存用戶詳情
      await ResponseCache.cache(
        'users:1',
        async () => ({ user: { id: 1 } }),
        { tags: ['users', 'user:1'] }
      );

      expect(ResponseCache.getStats().totalEntries).toBe(2);

      // 用戶更新後，失效相關緩存
      ResponseCache.invalidateByTag('user:1');

      expect(ResponseCache.getStats().totalEntries).toBe(1);
    });

    it('場景4: 條件緩存 - 只緩存公開內容', async () => {
      let callCount = 0;
      const handler = async () => {
        callCount++;
        return NextResponse.json({ data: 'test' });
      };

      const cachedHandler = withCache(handler, {
        condition: (request) => {
          const url = new URL(request.url);
          return url.searchParams.get('public') === 'true';
        },
      });

      // 公開內容 - 緩存
      const publicRequest = new NextRequest(
        'http://localhost:3000/api/content?public=true'
      );
      await cachedHandler(publicRequest);
      await cachedHandler(publicRequest);
      expect(callCount).toBe(1); // 只調用一次

      // 私有內容 - 不緩存
      const privateRequest = new NextRequest(
        'http://localhost:3000/api/content?public=false'
      );
      await cachedHandler(privateRequest);
      await cachedHandler(privateRequest);
      expect(callCount).toBe(3); // 每次都調用
    });

    it('場景5: 緩存性能監控', async () => {
      // 模擬一系列請求
      for (let i = 0; i < 100; i++) {
        await ResponseCache.cache(
          `key:${i % 10}`,
          async () => ({ data: i }),
          { ttl: 300 }
        );
      }

      const stats = ResponseCache.getStats();

      expect(stats.totalEntries).toBe(10); // 10 個唯一鍵
      expect(stats.totalHits).toBeGreaterThan(0); // 有緩存命中
      expect(stats.hitRate).toBeGreaterThan(0); // 命中率 > 0
      expect(stats.topKeys.length).toBe(10); // 所有鍵都被追蹤
    });
  });

  // ============================================================
  // 性能測試
  // ============================================================

  describe('性能測試', () => {
    it('應該快速緩存和檢索數據', async () => {
      const getData = async () => ({ data: 'x'.repeat(1000) });

      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        await ResponseCache.cache(`key:${i % 100}`, getData);
      }

      const duration = Date.now() - start;

      // 應該在合理時間內完成（<2秒）
      expect(duration).toBeLessThan(2000);
    });

    it('緩存命中應該比未命中快', async () => {
      const slowOperation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: 'test' };
      };

      // Miss
      const missStart = Date.now();
      await ResponseCache.cache('key', slowOperation);
      const missDuration = Date.now() - missStart;

      // Hit
      const hitStart = Date.now();
      await ResponseCache.cache('key', slowOperation);
      const hitDuration = Date.now() - hitStart;

      expect(hitDuration).toBeLessThan(missDuration);
    });
  });
});
