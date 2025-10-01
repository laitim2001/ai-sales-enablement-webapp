/**
 * 熔斷器模式測試套件
 *
 * 測試範圍：
 * - 熔斷器狀態轉換
 * - 失敗閾值觸發
 * - 半開狀態恢復
 * - 超時處理
 * - 統計追蹤
 * - 熔斷器管理器
 * - 便利函數
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

import {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  CircuitBreakerError,
  CircuitBreakerTimeoutError,
  withCircuitBreaker,
  executeBatch,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      successThreshold: 2,
      resetTimeout: 1000,
      timeout: 500,
    });
  });

  afterEach(() => {
    CircuitBreakerManager.clear();
  });

  describe('初始狀態', () => {
    it('應該以 CLOSED 狀態開始', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('應該有零統計', () => {
      const stats = breaker.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.rejectedRequests).toBe(0);
    });
  });

  describe('成功執行', () => {
    it('應該執行成功的操作', async () => {
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('應該記錄成功統計', async () => {
      await breaker.execute(async () => 'success');

      const stats = breaker.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(0);
    });

    it('應該重置失敗計數', async () => {
      // 失敗一次
      await breaker.execute(async () => {
        throw new Error('fail');
      }).catch(() => {});

      // 成功一次
      await breaker.execute(async () => 'success');

      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(0);
    });
  });

  describe('失敗處理', () => {
    it('應該傳播操作錯誤', async () => {
      await expect(
        breaker.execute(async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');
    });

    it('應該記錄失敗統計', async () => {
      await breaker
        .execute(async () => {
          throw new Error('fail');
        })
        .catch(() => {});

      const stats = breaker.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(1);
    });

    it('應該累積連續失敗', async () => {
      for (let i = 0; i < 2; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(2);
    });
  });

  describe('熔斷器開啟', () => {
    it('達到失敗閾值時應該開啟', async () => {
      // 失敗 3 次（閾值）
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('開啟時應該拒絕請求', async () => {
      // 開啟熔斷器
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      // 嘗試新請求
      await expect(
        breaker.execute(async () => 'success')
      ).rejects.toThrow(CircuitBreakerError);
    });

    it('應該記錄被拒絕的請求', async () => {
      // 開啟熔斷器
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      // 嘗試被拒絕的請求
      await breaker.execute(async () => 'success').catch(() => {});

      const stats = breaker.getStats();
      expect(stats.rejectedRequests).toBe(1);
    });
  });

  describe('半開狀態', () => {
    it('重置超時後應該切換到半開狀態', async () => {
      // 開啟熔斷器
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // 等待重置超時
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 檢查狀態（通過嘗試執行）
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('半開狀態成功應該切換到關閉', async () => {
      // 開啟熔斷器
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      // 等待半開狀態
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 成功 2 次（successThreshold）
      await breaker.execute(async () => 'success');
      await breaker.execute(async () => 'success');

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('半開狀態失敗應該重新開啟', async () => {
      // 開啟熔斷器
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      // 等待半開狀態
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 失敗一次
      await breaker
        .execute(async () => {
          throw new Error('fail');
        })
        .catch(() => {});

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('超時處理', () => {
    it('應該在超時時拋出錯誤', async () => {
      await expect(
        breaker.execute(
          async () =>
            new Promise((resolve) => setTimeout(resolve, 1000))
        )
      ).rejects.toThrow(CircuitBreakerTimeoutError);
    });

    it('超時應該計入失敗', async () => {
      await breaker
        .execute(
          async () =>
            new Promise((resolve) => setTimeout(resolve, 1000))
        )
        .catch(() => {});

      const stats = breaker.getStats();
      expect(stats.failedRequests).toBe(1);
    });

    it('超時後熔斷器應該可以開啟', async () => {
      // 超時 3 次
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(
            async () =>
              new Promise((resolve) => setTimeout(resolve, 1000))
          )
          .catch(() => {});
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('統計信息', () => {
    it('應該正確計算錯誤率', async () => {
      // 2 成功，3 失敗
      await breaker.execute(async () => 'success');
      await breaker.execute(async () => 'success');

      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      const stats = breaker.getStats();
      expect(stats.errorRate).toBe(60); // 3/5 = 60%
    });

    it('應該正確計算可用率', async () => {
      // 3 成功，2 失敗
      await breaker.execute(async () => 'success');
      await breaker.execute(async () => 'success');
      await breaker.execute(async () => 'success');

      for (let i = 0; i < 2; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      const stats = breaker.getStats();
      expect(stats.uptime).toBe(60); // 3/5 = 60%
    });

    it('應該記錄最後失敗時間', async () => {
      await breaker
        .execute(async () => {
          throw new Error('fail');
        })
        .catch(() => {});

      const stats = breaker.getStats();
      expect(stats.lastFailureTime).toBeInstanceOf(Date);
    });

    it('應該記錄最後成功時間', async () => {
      await breaker.execute(async () => 'success');

      const stats = breaker.getStats();
      expect(stats.lastSuccessTime).toBeInstanceOf(Date);
    });
  });

  describe('狀態變化回調', () => {
    it('應該在狀態變化時調用回調', async () => {
      const onStateChange = jest.fn();

      const customBreaker = new CircuitBreaker({
        name: 'test-callback',
        failureThreshold: 2,
        onStateChange,
      });

      // 觸發狀態變化
      await customBreaker.execute(async () => {
        throw new Error('fail');
      }).catch(() => {});
      await customBreaker.execute(async () => {
        throw new Error('fail');
      }).catch(() => {});

      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.CLOSED,
        CircuitState.OPEN
      );
    });

    it('應該在成功時調用回調', async () => {
      const onSuccess = jest.fn();

      const customBreaker = new CircuitBreaker({
        name: 'test-success',
        onSuccess,
      });

      await customBreaker.execute(async () => 'success');

      expect(onSuccess).toHaveBeenCalled();
    });

    it('應該在失敗時調用回調', async () => {
      const onFailure = jest.fn();

      const customBreaker = new CircuitBreaker({
        name: 'test-failure',
        onFailure,
      });

      await customBreaker
        .execute(async () => {
          throw new Error('fail');
        })
        .catch(() => {});

      expect(onFailure).toHaveBeenCalled();
    });
  });

  describe('重置功能', () => {
    it('應該重置所有統計', async () => {
      // 執行一些操作
      await breaker.execute(async () => 'success');
      await breaker
        .execute(async () => {
          throw new Error('fail');
        })
        .catch(() => {});

      breaker.reset();

      const stats = breaker.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.state).toBe(CircuitState.CLOSED);
    });
  });

  describe('強制控制', () => {
    it('應該能強制開啟熔斷器', () => {
      breaker.forceOpen();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('應該能強制關閉熔斷器', async () => {
      // 先開啟熔斷器
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(async () => {
            throw new Error('fail');
          })
          .catch(() => {});
      }

      breaker.forceClose();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

describe('CircuitBreakerManager', () => {
  beforeEach(() => {
    CircuitBreakerManager.clear();
  });

  afterEach(() => {
    CircuitBreakerManager.clear();
  });

  describe('熔斷器創建和獲取', () => {
    it('應該創建新的熔斷器', () => {
      const breaker = CircuitBreakerManager.getOrCreate({
        name: 'test',
      });

      expect(breaker).toBeInstanceOf(CircuitBreaker);
    });

    it('應該返回現有的熔斷器', () => {
      const breaker1 = CircuitBreakerManager.getOrCreate({
        name: 'test',
      });
      const breaker2 = CircuitBreakerManager.getOrCreate({
        name: 'test',
      });

      expect(breaker1).toBe(breaker2);
    });

    it('應該能通過名稱獲取熔斷器', () => {
      CircuitBreakerManager.getOrCreate({ name: 'test' });

      const breaker = CircuitBreakerManager.get('test');
      expect(breaker).toBeInstanceOf(CircuitBreaker);
    });

    it('不存在的熔斷器應該返回 undefined', () => {
      const breaker = CircuitBreakerManager.get('nonexistent');
      expect(breaker).toBeUndefined();
    });
  });

  describe('批量統計', () => {
    it('應該返回所有熔斷器的統計', async () => {
      const breaker1 = CircuitBreakerManager.getOrCreate({
        name: 'test1',
      });
      const breaker2 = CircuitBreakerManager.getOrCreate({
        name: 'test2',
      });

      await breaker1.execute(async () => 'success');
      await breaker2.execute(async () => 'success');

      const stats = CircuitBreakerManager.getAllStats();
      expect(stats).toHaveLength(2);
      expect(stats[0].name).toBe('test1');
      expect(stats[1].name).toBe('test2');
    });
  });

  describe('批量重置', () => {
    it('應該重置所有熔斷器', async () => {
      const breaker1 = CircuitBreakerManager.getOrCreate({
        name: 'test1',
      });
      const breaker2 = CircuitBreakerManager.getOrCreate({
        name: 'test2',
      });

      await breaker1.execute(async () => 'success');
      await breaker2.execute(async () => 'success');

      CircuitBreakerManager.resetAll();

      const stats = CircuitBreakerManager.getAllStats();
      expect(stats[0].totalRequests).toBe(0);
      expect(stats[1].totalRequests).toBe(0);
    });
  });
});

describe('withCircuitBreaker', () => {
  beforeEach(() => {
    CircuitBreakerManager.clear();
  });

  afterEach(() => {
    CircuitBreakerManager.clear();
  });

  it('應該創建帶熔斷器的函數', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const wrappedFn = withCircuitBreaker('test', fn);

    const result = await wrappedFn();

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalled();
  });

  it('應該傳遞參數到原函數', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const wrappedFn = withCircuitBreaker('test', fn);

    await wrappedFn('arg1', 'arg2');

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('應該使用熔斷器保護', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const wrappedFn = withCircuitBreaker('test', fn, {
      failureThreshold: 2,
    });

    // 失敗 2 次開啟熔斷器
    await wrappedFn().catch(() => {});
    await wrappedFn().catch(() => {});

    // 第 3 次應該被熔斷器拒絕
    await expect(wrappedFn()).rejects.toThrow(CircuitBreakerError);
  });
});

describe('executeBatch', () => {
  beforeEach(() => {
    CircuitBreakerManager.clear();
  });

  afterEach(() => {
    CircuitBreakerManager.clear();
  });

  it('應該執行多個操作', async () => {
    const results = await executeBatch([
      { name: 'op1', operation: async () => 'result1' },
      { name: 'op2', operation: async () => 'result2' },
      { name: 'op3', operation: async () => 'result3' },
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].result).toBe('result1');
    expect(results[1].result).toBe('result2');
    expect(results[2].result).toBe('result3');
  });

  it('應該處理部分失敗', async () => {
    const results = await executeBatch([
      { name: 'op1', operation: async () => 'result1' },
      {
        name: 'op2',
        operation: async () => {
          throw new Error('fail');
        },
      },
      { name: 'op3', operation: async () => 'result3' },
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].result).toBe('result1');
    expect(results[1].error).toBeInstanceOf(Error);
    expect(results[2].result).toBe('result3');
  });

  it('應該為每個操作創建獨立的熔斷器', async () => {
    await executeBatch([
      { name: 'op1', operation: async () => 'result1' },
      { name: 'op2', operation: async () => 'result2' },
    ]);

    expect(CircuitBreakerManager.get('op1')).toBeInstanceOf(
      CircuitBreaker
    );
    expect(CircuitBreakerManager.get('op2')).toBeInstanceOf(
      CircuitBreaker
    );
  });
});

describe('真實業務場景', () => {
  beforeEach(() => {
    CircuitBreakerManager.clear();
  });

  afterEach(() => {
    CircuitBreakerManager.clear();
  });

  it('場景1: 數據庫連接保護', async () => {
    let callCount = 0;
    const dbQuery = jest.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 3) {
        throw new Error('Database connection failed');
      }
      return 'query result';
    });

    const breaker = new CircuitBreaker({
      name: 'database',
      failureThreshold: 3,
      resetTimeout: 1000,
    });

    // 前 3 次失敗
    for (let i = 0; i < 3; i++) {
      await breaker.execute(dbQuery).catch(() => {});
    }

    // 熔斷器應該開啟
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // 後續請求應該被快速拒絕，不調用 dbQuery
    await breaker.execute(dbQuery).catch(() => {});

    // callCount 應該還是 3，因為熔斷器拒絕了請求
    expect(callCount).toBe(3);
  });

  it('場景2: 外部 API 調用保護', async () => {
    const apiCall = jest
      .fn()
      .mockRejectedValue(new Error('API unavailable'));

    const protectedApiCall = withCircuitBreaker('external-api', apiCall, {
      failureThreshold: 5,
      timeout: 2000,
    });

    // 失敗 5 次
    for (let i = 0; i < 5; i++) {
      await protectedApiCall().catch(() => {});
    }

    // 檢查統計
    const breaker = CircuitBreakerManager.get('external-api');
    const stats = breaker!.getStats();

    expect(stats.state).toBe(CircuitState.OPEN);
    expect(stats.failedRequests).toBe(5);
  });

  it('場景3: 微服務健康檢查', async () => {
    const services = ['auth', 'payment', 'notification'];

    const results = await executeBatch(
      services.map((service) => ({
        name: service,
        operation: async () => {
          if (service === 'payment') {
            throw new Error('Service unavailable');
          }
          return `${service} is healthy`;
        },
        config: { failureThreshold: 3, resetTimeout: 5000 },
      }))
    );

    const authResult = results.find((r) => r.name === 'auth');
    const paymentResult = results.find((r) => r.name === 'payment');
    const notificationResult = results.find((r) => r.name === 'notification');

    expect(authResult?.result).toBe('auth is healthy');
    expect(paymentResult?.error).toBeInstanceOf(Error);
    expect(notificationResult?.result).toBe('notification is healthy');
  });

  it('場景4: 自動恢復測試', async () => {
    let shouldFail = true;
    const unstableService = jest.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw new Error('Service error');
      }
      return 'success';
    });

    const breaker = new CircuitBreaker({
      name: 'unstable-service',
      failureThreshold: 2,
      successThreshold: 2,
      resetTimeout: 500,
    });

    // 失敗 2 次，開啟熔斷器
    await breaker.execute(unstableService).catch(() => {});
    await breaker.execute(unstableService).catch(() => {});

    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // 等待進入半開狀態
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 服務恢復
    shouldFail = false;

    // 成功 2 次，關閉熔斷器
    await breaker.execute(unstableService);
    await breaker.execute(unstableService);

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });
});
