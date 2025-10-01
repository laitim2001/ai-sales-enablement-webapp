/**
 * 健康檢查系統測試套件
 *
 * 測試範圍：
 * - 服務註冊和取消註冊
 * - 單個服務檢查
 * - 全系統健康檢查
 * - 依賴關係管理
 * - 健康度評分
 * - 定期檢查
 * - 熔斷器整合
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

import {
  HealthCheckSystem,
  HealthStatus,
  getHealthCheckSystem,
  resetHealthCheckSystem,
  createSimpleHealthCheck,
} from './health-check';
import { CircuitBreakerManager } from './circuit-breaker';

describe('HealthCheckSystem', () => {
  let healthCheck: HealthCheckSystem;

  beforeEach(() => {
    healthCheck = new HealthCheckSystem();
    CircuitBreakerManager.clear();
  });

  afterEach(() => {
    healthCheck.stopAllPeriodicChecks();
    CircuitBreakerManager.clear();
  });

  describe('服務註冊', () => {
    it('應該註冊健康檢查', () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const health = healthCheck.getServiceHealth('test-service');
      expect(health).toBeDefined();
      expect(health?.name).toBe('test-service');
    });

    it('應該使用默認配置', () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const health = healthCheck.getServiceHealth('test-service');
      expect(health?.status).toBe(HealthStatus.UNKNOWN);
      expect(health?.consecutiveFailures).toBe(0);
      expect(health?.uptime).toBe(100);
    });

    it('應該創建熔斷器', () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const breaker = CircuitBreakerManager.get(
        'health-check-test-service'
      );
      expect(breaker).toBeDefined();
    });
  });

  describe('服務取消註冊', () => {
    it('應該取消註冊服務', () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.unregister('test-service');

      const health = healthCheck.getServiceHealth('test-service');
      expect(health).toBeUndefined();
    });

    it('應該停止定期檢查', async () => {
      const checkFn = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      });

      healthCheck.register({
        name: 'test-service',
        check: checkFn,
        interval: 100,
      });

      await new Promise((resolve) => setTimeout(resolve, 250));
      healthCheck.unregister('test-service');

      const callCount = checkFn.mock.calls.length;
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(checkFn.mock.calls.length).toBe(callCount);
    });
  });

  describe('單個服務檢查', () => {
    it('應該檢查健康服務', async () => {
      healthCheck.register({
        name: 'healthy-service',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          message: 'All good',
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const health = await healthCheck.checkService('healthy-service');

      expect(health.status).toBe(HealthStatus.HEALTHY);
      expect(health.result?.message).toBe('All good');
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.consecutiveFailures).toBe(0);
    });

    it('應該檢查不健康服務', async () => {
      healthCheck.register({
        name: 'unhealthy-service',
        check: async () => {
          throw new Error('Service down');
        },
      });

      const health = await healthCheck.checkService('unhealthy-service');

      expect(health.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.result?.error).toBe('Service down');
      expect(health.consecutiveFailures).toBe(1);
    });

    it('應該記錄檢查時間', async () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return {
            status: HealthStatus.HEALTHY,
            timestamp: new Date(),
            duration: 0,
          };
        },
      });

      const health = await healthCheck.checkService('test-service');

      expect(health.result?.duration).toBeGreaterThanOrEqual(50);
    });

    it('應該更新平均響應時間', async () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => {
          // 添加小延遲以確保有測量時間
          await new Promise((resolve) => setTimeout(resolve, 1));
          return {
            status: HealthStatus.HEALTHY,
            timestamp: new Date(),
            duration: 0,
          };
        },
      });

      await healthCheck.checkService('test-service');
      await healthCheck.checkService('test-service');

      const health = healthCheck.getServiceHealth('test-service');
      expect(health?.averageResponseTime).toBeGreaterThan(0);
    });

    it('應該拋出未註冊服務的錯誤', async () => {
      await expect(
        healthCheck.checkService('nonexistent')
      ).rejects.toThrow('not registered');
    });
  });

  describe('依賴關係', () => {
    it('應該檢查依賴服務', async () => {
      healthCheck.register({
        name: 'database',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.register({
        name: 'api',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
        dependencies: ['database'],
      });

      // 先檢查依賴
      await healthCheck.checkService('database');

      // 再檢查依賴它的服務
      const health = await healthCheck.checkService('api');

      expect(health.status).toBe(HealthStatus.HEALTHY);
    });

    it('依賴不健康時應該失敗', async () => {
      healthCheck.register({
        name: 'database',
        check: async () => {
          throw new Error('Database down');
        },
      });

      healthCheck.register({
        name: 'api',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
        dependencies: ['database'],
      });

      // 檢查依賴（失敗）
      await healthCheck.checkService('database');

      // 檢查依賴它的服務（應該失敗）
      const health = await healthCheck.checkService('api');

      expect(health.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.result?.error).toContain('Dependency');
    });
  });

  describe('全系統檢查', () => {
    it('應該檢查所有服務', async () => {
      healthCheck.register({
        name: 'service1',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.register({
        name: 'service2',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const report = await healthCheck.checkAll();

      expect(report.services['service1']).toBeDefined();
      expect(report.services['service2']).toBeDefined();
      expect(report.summary.total).toBe(2);
    });

    it('應該計算正確的摘要', async () => {
      healthCheck.register({
        name: 'healthy',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.register({
        name: 'degraded',
        check: async () => ({
          status: HealthStatus.DEGRADED,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.register({
        name: 'unhealthy',
        check: async () => {
          throw new Error('fail');
        },
      });

      const report = await healthCheck.checkAll();

      expect(report.summary.healthy).toBe(1);
      expect(report.summary.degraded).toBe(1);
      expect(report.summary.unhealthy).toBe(1);
    });

    it('應該計算健康分數', async () => {
      healthCheck.register({
        name: 'service1',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.register({
        name: 'service2',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const report = await healthCheck.checkAll();

      expect(report.score).toBe(100);
    });

    it('關鍵服務失敗應該降低分數', async () => {
      healthCheck.register({
        name: 'critical',
        check: async () => {
          throw new Error('fail');
        },
        critical: true,
      });

      healthCheck.register({
        name: 'normal',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const report = await healthCheck.checkAll();

      expect(report.score).toBeLessThan(50);
      expect(report.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('應該收集關鍵問題', async () => {
      healthCheck.register({
        name: 'critical',
        check: async () => {
          throw new Error('Critical failure');
        },
        critical: true,
      });

      const report = await healthCheck.checkAll();

      expect(report.criticalIssues.length).toBeGreaterThan(0);
      expect(report.criticalIssues[0]).toContain('critical');
    });

    it('應該收集警告', async () => {
      healthCheck.register({
        name: 'degraded',
        check: async () => ({
          status: HealthStatus.DEGRADED,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      const report = await healthCheck.checkAll();

      expect(report.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('定期檢查', () => {
    it('應該定期執行檢查', async () => {
      const checkFn = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      });

      healthCheck.register({
        name: 'test-service',
        check: checkFn,
        interval: 100,
      });

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(checkFn.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('應該啟動所有定期檢查', async () => {
      const checkFn1 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      });

      const checkFn2 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      });

      healthCheck.register({
        name: 'service1',
        check: checkFn1,
        interval: 100,
      });

      healthCheck.register({
        name: 'service2',
        check: checkFn2,
        interval: 100,
      });

      healthCheck.startAllPeriodicChecks();

      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(checkFn1).toHaveBeenCalled();
      expect(checkFn2).toHaveBeenCalled();
    });

    it('應該停止所有定期檢查', async () => {
      const checkFn = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      });

      healthCheck.register({
        name: 'test-service',
        check: checkFn,
        interval: 100,
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      healthCheck.stopAllPeriodicChecks();

      const callCount = checkFn.mock.calls.length;
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(checkFn.mock.calls.length).toBe(callCount);
    });
  });

  describe('熔斷器整合', () => {
    it('熔斷器應該保護健康檢查', async () => {
      const checkFn = jest
        .fn()
        .mockRejectedValue(new Error('Service down'));

      healthCheck.register({
        name: 'unstable',
        check: checkFn,
        retries: 2,
      });

      // 失敗 2 次觸發熔斷器
      await healthCheck.checkService('unstable');
      await healthCheck.checkService('unstable');

      // 第 3 次應該被熔斷器拒絕
      const health = await healthCheck.checkService('unstable');

      expect(health.status).toBe(HealthStatus.UNHEALTHY);
      expect(checkFn.mock.calls.length).toBe(2); // 熔斷器阻止了第3次調用
    });

    it('熔斷器開啟後應該快速失敗', async () => {
      healthCheck.register({
        name: 'failing',
        check: async () => {
          throw new Error('fail');
        },
        retries: 2,
        timeout: 100,
      });

      // 觸發熔斷器
      await healthCheck.checkService('failing');
      await healthCheck.checkService('failing');

      // 快速失敗（不等待 timeout）
      const startTime = Date.now();
      await healthCheck.checkService('failing');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50); // 遠小於 timeout
    });
  });

  describe('統計和重置', () => {
    it('應該獲取所有服務健康信息', async () => {
      healthCheck.register({
        name: 'service1',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      healthCheck.register({
        name: 'service2',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      await healthCheck.checkService('service1');
      await healthCheck.checkService('service2');

      const allHealth = healthCheck.getAllServiceHealth();

      expect(Object.keys(allHealth).length).toBe(2);
      expect(allHealth['service1']).toBeDefined();
      expect(allHealth['service2']).toBeDefined();
    });

    it('應該重置所有統計', async () => {
      healthCheck.register({
        name: 'test-service',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        }),
      });

      await healthCheck.checkService('test-service');

      healthCheck.reset();

      const health = healthCheck.getServiceHealth('test-service');
      expect(health?.status).toBe(HealthStatus.UNKNOWN);
      expect(health?.result).toBeUndefined();
      expect(health?.consecutiveFailures).toBe(0);
    });
  });
});

describe('全局健康檢查', () => {
  afterEach(() => {
    resetHealthCheckSystem();
  });

  it('應該獲取全局實例', () => {
    const instance1 = getHealthCheckSystem();
    const instance2 = getHealthCheckSystem();

    expect(instance1).toBe(instance2);
  });

  it('應該重置全局實例', () => {
    const instance1 = getHealthCheckSystem();
    resetHealthCheckSystem();
    const instance2 = getHealthCheckSystem();

    expect(instance1).not.toBe(instance2);
  });
});

describe('便利函數', () => {
  it('應該創建簡單的健康檢查', async () => {
    const check = createSimpleHealthCheck(
      'simple-service',
      async () => true
    );

    expect(check.name).toBe('simple-service');

    const result = await check.check();
    expect(result.status).toBe(HealthStatus.HEALTHY);
  });

  it('應該處理失敗的簡單檢查', async () => {
    const check = createSimpleHealthCheck(
      'simple-service',
      async () => false
    );

    const result = await check.check();
    expect(result.status).toBe(HealthStatus.UNHEALTHY);
  });

  it('應該支持自定義選項', async () => {
    const check = createSimpleHealthCheck(
      'simple-service',
      async () => true,
      { critical: true, timeout: 1000 }
    );

    expect(check.critical).toBe(true);
    expect(check.timeout).toBe(1000);
  });
});

describe('真實業務場景', () => {
  let healthCheck: HealthCheckSystem;

  beforeEach(() => {
    healthCheck = new HealthCheckSystem();
  });

  afterEach(() => {
    healthCheck.stopAllPeriodicChecks();
    CircuitBreakerManager.clear();
  });

  it('場景1: 微服務健康監控', async () => {
    // 註冊多個微服務
    healthCheck.register({
      name: 'auth-service',
      check: async () => ({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      }),
      critical: true,
    });

    healthCheck.register({
      name: 'payment-service',
      check: async () => ({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      }),
      critical: true,
    });

    healthCheck.register({
      name: 'notification-service',
      check: async () => ({
        status: HealthStatus.DEGRADED,
        timestamp: new Date(),
        duration: 0,
      }),
      critical: false,
    });

    const report = await healthCheck.checkAll();

    expect(report.status).toBe(HealthStatus.HEALTHY);
    expect(report.summary.healthy).toBe(2);
    expect(report.summary.degraded).toBe(1);
  });

  it('場景2: 依賴鏈檢查', async () => {
    // 數據庫 <- API <- 前端
    healthCheck.register({
      name: 'database',
      check: async () => ({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      }),
      critical: true,
    });

    healthCheck.register({
      name: 'api',
      check: async () => ({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      }),
      dependencies: ['database'],
      critical: true,
    });

    healthCheck.register({
      name: 'frontend',
      check: async () => ({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        duration: 0,
      }),
      dependencies: ['api'],
    });

    // 按依賴順序檢查
    await healthCheck.checkService('database');
    await healthCheck.checkService('api');
    await healthCheck.checkService('frontend');

    const report = await healthCheck.checkAll();
    expect(report.status).toBe(HealthStatus.HEALTHY);
  });

  it('場景3: 故障恢復檢測', async () => {
    let isHealthy = false;

    healthCheck.register({
      name: 'recovering-service',
      check: async () => {
        if (!isHealthy) {
          throw new Error('Service down');
        }
        return {
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        };
      },
      retries: 2,
    });

    // 第一次檢查失敗
    let health = await healthCheck.checkService('recovering-service');
    expect(health.status).toBe(HealthStatus.UNHEALTHY);

    // 服務恢復
    isHealthy = true;

    // 等待熔斷器重置
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 檢查恢復
    health = await healthCheck.checkService('recovering-service');
    expect(health.status).toBe(HealthStatus.HEALTHY);
    expect(health.consecutiveFailures).toBe(0);
  });

  it('場景4: 性能監控', async () => {
    healthCheck.register({
      name: 'slow-service',
      check: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
          duration: 0,
        };
      },
    });

    // 多次檢查以建立平均響應時間
    for (let i = 0; i < 5; i++) {
      await healthCheck.checkService('slow-service');
    }

    const health = healthCheck.getServiceHealth('slow-service');
    expect(health?.averageResponseTime).toBeGreaterThan(50);
  });
});
