/**
 * 性能監控系統測試套件
 *
 * 測試範圍：
 * - 單例模式驗證
 * - 性能指標追蹤
 * - 批次寫入機制
 * - 性能警報系統
 * - 報告生成
 * - 中間件整合
 * - Core Web Vitals追蹤
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  PerformanceMonitor,
  PerformanceMetric,
  withPerformanceTracking,
  CoreWebVitalsTracker,
} from './monitor';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance for testing
    (PerformanceMonitor as any).instance = undefined;
    monitor = PerformanceMonitor.getInstance();
  });

  describe('單例模式', () => {
    it('應該返回相同的實例', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('性能指標追蹤', () => {
    it('應該成功記錄性能指標', async () => {
      const metric = {
        endpoint: '/api/users',
        method: 'GET',
        duration: 150,
        response_size: 1024,
        status_code: 200,
      };

      await monitor.trackMetric(metric);

      // 驗證指標已添加到內部緩存
      expect((monitor as any).metrics.length).toBe(1);
      expect((monitor as any).metrics[0]).toMatchObject(metric);
      expect((monitor as any).metrics[0].timestamp).toBeInstanceOf(Date);
    });

    it('應該自動添加時間戳和記憶體使用資訊', async () => {
      const metric = {
        endpoint: '/api/test',
        method: 'POST',
        duration: 200,
        response_size: 2048,
        status_code: 201,
      };

      await monitor.trackMetric(metric);

      const trackedMetric = (monitor as any).metrics[0];
      expect(trackedMetric.timestamp).toBeInstanceOf(Date);
      expect(typeof trackedMetric.memory_usage).toBe('number');
    });

    it('應該支援可選的用戶ID', async () => {
      const metric = {
        endpoint: '/api/profile',
        method: 'GET',
        duration: 100,
        response_size: 512,
        status_code: 200,
        user_id: 123,
      };

      await monitor.trackMetric(metric);

      expect((monitor as any).metrics[0].user_id).toBe(123);
    });

    it('應該記錄緩存命中狀態', async () => {
      const metric = {
        endpoint: '/api/cached',
        method: 'GET',
        duration: 50,
        response_size: 256,
        status_code: 200,
        cache_hit: true,
      };

      await monitor.trackMetric(metric);

      expect((monitor as any).metrics[0].cache_hit).toBe(true);
    });

    it('應該記錄錯誤訊息', async () => {
      const metric = {
        endpoint: '/api/error',
        method: 'POST',
        duration: 300,
        response_size: 128,
        status_code: 500,
        error_message: 'Database connection failed',
      };

      await monitor.trackMetric(metric);

      expect((monitor as any).metrics[0].error_message).toBe(
        'Database connection failed'
      );
    });
  });

  describe('批次寫入機制', () => {
    it('達到批次大小時應該自動寫入', async () => {
      (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);

      // 設置較小的批次大小進行測試
      (monitor as any).batchSize = 3;

      // 添加3條指標觸發批次寫入
      for (let i = 0; i < 3; i++) {
        await monitor.trackMetric({
          endpoint: `/api/test${i}`,
          method: 'GET',
          duration: 100,
          response_size: 1024,
          status_code: 200,
        });
      }

      // 驗證批次寫入已被調用
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect((monitor as any).metrics.length).toBe(0);
    });

    it('寫入失敗時應該保留指標', async () => {
      (prisma.$executeRaw as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      (monitor as any).batchSize = 2;

      // 先添加一個指標
      await monitor.trackMetric({
        endpoint: '/api/test1',
        method: 'GET',
        duration: 100,
        response_size: 1024,
        status_code: 200,
      });

      // 添加第二個指標會觸發批次寫入
      const trackPromise = monitor.trackMetric({
        endpoint: '/api/test2',
        method: 'GET',
        duration: 100,
        response_size: 1024,
        status_code: 200,
      });

      // 等待批次寫入完成
      await trackPromise;
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 指標應該被保留在隊列中（因為寫入失敗）
      expect((monitor as any).metrics.length).toBe(2);
    });
  });

  describe('性能警報系統', () => {
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('應該警告慢API請求', async () => {
      await monitor.trackMetric({
        endpoint: '/api/slow',
        method: 'GET',
        duration: 3000, // 超過2秒閾值
        response_size: 1024,
        status_code: 200,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow API detected')
      );
    });

    it('應該警告大響應', async () => {
      await monitor.trackMetric({
        endpoint: '/api/large',
        method: 'GET',
        duration: 100,
        response_size: 2 * 1024 * 1024, // 超過1MB閾值
        status_code: 200,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large response')
      );
    });

    it('應該報告伺服器錯誤', async () => {
      await monitor.trackMetric({
        endpoint: '/api/error',
        method: 'POST',
        duration: 100,
        response_size: 256,
        status_code: 500,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Server error')
      );
    });

    it('正常請求不應該觸發警報', async () => {
      await monitor.trackMetric({
        endpoint: '/api/normal',
        method: 'GET',
        duration: 150,
        response_size: 1024,
        status_code: 200,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('性能報告生成', () => {
    it('應該生成性能報告', async () => {
      const mockReport = [
        {
          endpoint: '/api/users',
          request_count: BigInt(100),
          avg_duration: 150.5,
          min_duration: 50,
          max_duration: 500,
          median_duration: 120,
          p95_duration: 450,
          avg_response_size: 1024.5,
          cache_hit_rate: 75.5,
          error_rate: 2.5,
        },
      ];

      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockReport);

      const report = await monitor.getPerformanceReport('24h');

      expect(report).toEqual(mockReport);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('應該支援不同的時間範圍', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await monitor.getPerformanceReport('1h');
      await monitor.getPerformanceReport('7d');
      await monitor.getPerformanceReport('30d');

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('錯誤時應該返回空陣列', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Query error')
      );

      const report = await monitor.getPerformanceReport();

      expect(report).toEqual([]);
    });
  });

  describe('實時指標', () => {
    it('應該獲取實時性能指標', async () => {
      const mockMetrics = {
        avg_response_time: 150.5,
        total_requests: BigInt(1000),
        cache_hit_rate: 75.5,
        error_rate: 2.5,
        avg_memory_usage: BigInt(1024000),
      };

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockMetrics]);

      const metrics = await monitor.getRealTimeMetrics();

      expect(metrics).toEqual(mockMetrics);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('錯誤時應該返回空對象', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Query error')
      );

      const metrics = await monitor.getRealTimeMetrics();

      expect(metrics).toEqual({});
    });
  });

  describe('數據清理', () => {
    it('應該清理過期數據', async () => {
      (prisma.$executeRaw as jest.Mock).mockResolvedValue(50);

      const result = await monitor.cleanup(30);

      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(result).toBe(50);
    });

    it('應該支援自定義保留天數', async () => {
      (prisma.$executeRaw as jest.Mock).mockResolvedValue(100);

      await monitor.cleanup(7);

      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('錯誤時應該正常處理', async () => {
      (prisma.$executeRaw as jest.Mock).mockRejectedValue(
        new Error('Delete error')
      );

      const result = await monitor.cleanup();

      expect(result).toBeUndefined();
    });
  });
});

describe('withPerformanceTracking 中間件', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    (PerformanceMonitor as any).instance = undefined;
    monitor = PerformanceMonitor.getInstance();
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);
  });

  it('應該追蹤成功的請求', async () => {
    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ data: 'test' }, { status: 200 })
    );

    const wrappedHandler = withPerformanceTracking(handler);

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    });

    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
    expect((monitor as any).metrics.length).toBeGreaterThan(0);

    const metric = (monitor as any).metrics[0];
    expect(metric.endpoint).toBe('/api/test');
    expect(metric.method).toBe('GET');
    expect(metric.status_code).toBe(200);
    expect(typeof metric.duration).toBe('number');
  });

  it('應該追蹤失敗的請求', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Test error'));

    const wrappedHandler = withPerformanceTracking(handler);

    const request = new NextRequest('http://localhost:3000/api/error', {
      method: 'POST',
    });

    const response = await wrappedHandler(request);

    expect(response.status).toBe(500);
    expect((monitor as any).metrics.length).toBeGreaterThan(0);

    const metric = (monitor as any).metrics[0];
    expect(metric.endpoint).toBe('/api/error');
    expect(metric.status_code).toBe(500);
    expect(metric.error_message).toBe('Test error');
  });

  it('應該添加性能響應頭', async () => {
    const handler = jest
      .fn()
      .mockResolvedValue(NextResponse.json({ data: 'test' }));

    const wrappedHandler = withPerformanceTracking(handler);

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    });

    const response = await wrappedHandler(request);

    expect(response.headers.has('X-Response-Time')).toBe(true);
    expect(response.headers.has('X-Memory-Usage')).toBe(true);
    expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
  });

  it('應該提取JWT token中的用戶ID', async () => {
    // 創建測試JWT token (header.payload.signature)
    const payload = { userId: 123 };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;

    const handler = jest
      .fn()
      .mockResolvedValue(NextResponse.json({ data: 'test' }));

    const wrappedHandler = withPerformanceTracking(handler);

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    await wrappedHandler(request);

    const metric = (monitor as any).metrics[0];
    expect(metric.user_id).toBe(123);
  });

  it('應該檢測緩存命中', async () => {
    const response = NextResponse.json({ data: 'cached' });
    response.headers.set('X-Cache', 'HIT');

    const handler = jest.fn().mockResolvedValue(response);

    const wrappedHandler = withPerformanceTracking(handler);

    const request = new NextRequest('http://localhost:3000/api/cached', {
      method: 'GET',
    });

    await wrappedHandler(request);

    const metric = (monitor as any).metrics[0];
    expect(metric.cache_hit).toBe(true);
  });

  it('token解析失敗時應該正常處理', async () => {
    const handler = jest
      .fn()
      .mockResolvedValue(NextResponse.json({ data: 'test' }));

    const wrappedHandler = withPerformanceTracking(handler);

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    const response = await wrappedHandler(request);

    expect(response.status).toBe(200);
    const metric = (monitor as any).metrics[0];
    expect(metric.user_id).toBeUndefined();
  });
});

describe('CoreWebVitalsTracker', () => {
  let fetchMock: jest.SpyInstance;
  let gtagMock: jest.Mock;
  let windowSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    gtagMock = jest.fn();
    // Mock window and gtag properly
    windowSpy = jest.spyOn(global, 'window', 'get').mockReturnValue({
      gtag: gtagMock,
    } as any);
  });

  afterEach(() => {
    fetchMock.mockRestore();
    windowSpy.mockRestore();
  });

  it('應該傳送指標到Google Analytics', () => {
    CoreWebVitalsTracker.trackMetric('LCP', 2500, 'test-id');

    expect(gtagMock).toHaveBeenCalledWith('event', 'LCP', {
      event_category: 'Web Vitals',
      value: 2500,
      event_label: 'test-id',
      non_interaction: true,
    });
  });

  it('應該傳送指標到自定義端點', () => {
    CoreWebVitalsTracker.trackMetric('FID', 100, 'test-id');

    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'FID', value: 100, id: 'test-id' }),
    });
  });

  it('應該正確處理CLS指標（乘以1000）', () => {
    CoreWebVitalsTracker.trackMetric('CLS', 0.1, 'test-id');

    expect(gtagMock).toHaveBeenCalledWith('event', 'CLS', {
      event_category: 'Web Vitals',
      value: 100, // 0.1 * 1000
      event_label: 'test-id',
      non_interaction: true,
    });
  });

  it('應該處理不同的指標類型', () => {
    const metrics = [
      { name: 'LCP', value: 2500 },
      { name: 'FID', value: 100 },
      { name: 'CLS', value: 0.1 },
      { name: 'FCP', value: 1800 },
      { name: 'TTFB', value: 600 },
    ];

    metrics.forEach((metric) => {
      CoreWebVitalsTracker.trackMetric(metric.name, metric.value, 'test-id');
    });

    expect(gtagMock).toHaveBeenCalledTimes(5);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('fetch錯誤時應該靜默處理', () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    expect(() => {
      CoreWebVitalsTracker.trackMetric('LCP', 2500, 'test-id');
    }).not.toThrow();
  });
});

describe('真實業務場景', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    (PerformanceMonitor as any).instance = undefined;
    monitor = PerformanceMonitor.getInstance();
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
  });

  it('場景1: API請求完整生命週期追蹤', async () => {
    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ users: [] }, { status: 200 })
    );

    const wrappedHandler = withPerformanceTracking(handler);

    // 模擬多個API請求
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest(
        `http://localhost:3000/api/users?page=${i}`,
        { method: 'GET' }
      );
      await wrappedHandler(request);
    }

    expect((monitor as any).metrics.length).toBe(5);
    expect(handler).toHaveBeenCalledTimes(5);
  });

  it('場景2: 性能警報和報告', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // 記錄正常請求
    await monitor.trackMetric({
      endpoint: '/api/fast',
      method: 'GET',
      duration: 100,
      response_size: 1024,
      status_code: 200,
    });

    // 記錄慢請求（觸發警報）
    await monitor.trackMetric({
      endpoint: '/api/slow',
      method: 'GET',
      duration: 3000,
      response_size: 1024,
      status_code: 200,
    });

    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('場景3: 批次寫入和錯誤恢復', async () => {
    (monitor as any).batchSize = 3;

    // Mock ensureMetricsTable to succeed, but executeRaw for INSERT to fail
    (prisma.$executeRaw as jest.Mock)
      .mockResolvedValueOnce(undefined) // ensureMetricsTable CREATE TABLE
      .mockResolvedValueOnce(undefined) // ensureMetricsTable CREATE INDEX 1
      .mockResolvedValueOnce(undefined) // ensureMetricsTable CREATE INDEX 2
      .mockRejectedValueOnce(new Error('Connection lost')); // INSERT fails

    // 添加兩個指標
    await monitor.trackMetric({
      endpoint: '/api/test0',
      method: 'GET',
      duration: 100,
      response_size: 1024,
      status_code: 200,
    });

    await monitor.trackMetric({
      endpoint: '/api/test1',
      method: 'GET',
      duration: 100,
      response_size: 1024,
      status_code: 200,
    });

    // 第三個指標觸發批次寫入
    const trackPromise = monitor.trackMetric({
      endpoint: '/api/test2',
      method: 'GET',
      duration: 100,
      response_size: 1024,
      status_code: 200,
    });

    // 等待批次寫入完成
    await trackPromise;
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 指標應該被保留（因為寫入失敗）
    expect((monitor as any).metrics.length).toBe(3);

    // 第二次寫入成功 - mock both ensureMetricsTable and INSERT
    (prisma.$executeRaw as jest.Mock)
      .mockResolvedValueOnce(undefined) // ensureMetricsTable CREATE TABLE
      .mockResolvedValueOnce(undefined) // ensureMetricsTable CREATE INDEX 1
      .mockResolvedValueOnce(undefined) // ensureMetricsTable CREATE INDEX 2
      .mockResolvedValueOnce(undefined); // INSERT succeeds

    // 再次觸發寫入（達到批次大小）
    await monitor.trackMetric({
      endpoint: '/api/test3',
      method: 'GET',
      duration: 100,
      response_size: 1024,
      status_code: 200,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // 這次應該成功寫入，隊列清空
    expect((monitor as any).metrics.length).toBeLessThanOrEqual(1);
  });

  it('場景4: 用戶級別性能分析', async () => {
    const users = [101, 102, 103];

    for (const userId of users) {
      await monitor.trackMetric({
        endpoint: '/api/profile',
        method: 'GET',
        duration: 150,
        response_size: 2048,
        status_code: 200,
        user_id: userId,
      });
    }

    const metrics = (monitor as any).metrics;
    expect(metrics.filter((m: any) => m.user_id === 101).length).toBe(1);
    expect(metrics.filter((m: any) => m.user_id === 102).length).toBe(1);
    expect(metrics.filter((m: any) => m.user_id === 103).length).toBe(1);
  });

  it('場景5: 緩存效能分析', async () => {
    // 緩存未命中
    await monitor.trackMetric({
      endpoint: '/api/data',
      method: 'GET',
      duration: 500,
      response_size: 5120,
      status_code: 200,
      cache_hit: false,
    });

    // 緩存命中（更快）
    await monitor.trackMetric({
      endpoint: '/api/data',
      method: 'GET',
      duration: 50,
      response_size: 5120,
      status_code: 200,
      cache_hit: true,
    });

    const metrics = (monitor as any).metrics;
    const cacheHit = metrics.find((m: any) => m.cache_hit);
    const cacheMiss = metrics.find((m: any) => !m.cache_hit);

    expect(cacheHit.duration).toBeLessThan(cacheMiss.duration);
  });
});
