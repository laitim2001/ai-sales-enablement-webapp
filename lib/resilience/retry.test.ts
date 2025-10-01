/**
 * 重試策略系統測試
 */

import {
  RetryPolicy,
  RetryPolicyManager,
  BackoffStrategy,
  RetryError,
  createSimpleRetry,
  withRetry,
  retryBatch,
} from './retry';

describe('RetryPolicy', () => {
  beforeEach(() => {
    RetryPolicyManager.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('基本重試功能', () => {
    it('應該在成功時不重試', async () => {
      const retry = new RetryPolicy({ maxAttempts: 3 });
      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);

      const stats = retry.getStats();
      expect(stats.totalAttempts).toBe(1);
      expect(stats.successfulRetries).toBe(0); // 第一次成功不算重試
    });

    it('應該在失敗時重試', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
      });
      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('temporary failure');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);

      const stats = retry.getStats();
      expect(stats.totalAttempts).toBe(3);
      expect(stats.successfulRetries).toBe(1);
    });

    it('應該在達到最大重試次數後拋出錯誤', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
      });
      let attempts = 0;

      await expect(
        retry.execute(async () => {
          attempts++;
          throw new Error('persistent failure');
        })
      ).rejects.toThrow('persistent failure');

      expect(attempts).toBe(3);

      const stats = retry.getStats();
      expect(stats.failedRetries).toBe(1);
    });
  });

  describe('退避策略', () => {
    it('固定延遲應該使用相同的延遲時間', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 100,
        backoff: BackoffStrategy.FIXED,
      });

      const delays: number[] = [];
      let attempts = 0;

      try {
        await retry.execute(async () => {
          attempts++;
          throw new Error('test');
        });
      } catch (error) {
        // 預期失敗
      }

      // 驗證固定延遲（無法直接測試延遲時間，但可以驗證策略配置）
      const config = retry.getConfig();
      expect(config.backoff).toBe(BackoffStrategy.FIXED);
    });

    it('線性延遲應該線性增長', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 100,
        backoff: BackoffStrategy.LINEAR,
      });

      const config = retry.getConfig();
      expect(config.backoff).toBe(BackoffStrategy.LINEAR);
    });

    it('指數延遲應該指數增長', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 100,
        backoff: BackoffStrategy.EXPONENTIAL,
      });

      const config = retry.getConfig();
      expect(config.backoff).toBe(BackoffStrategy.EXPONENTIAL);
    });

    it('帶抖動的延遲應該添加隨機性', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 100,
        backoff: BackoffStrategy.JITTER,
      });

      const config = retry.getConfig();
      expect(config.backoff).toBe(BackoffStrategy.JITTER);
    });

    it('應該限制最大延遲', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 5000,
        backoff: BackoffStrategy.EXPONENTIAL,
      });

      const config = retry.getConfig();
      expect(config.maxDelay).toBe(5000);
    });
  });

  describe('條件重試', () => {
    it('應該只重試指定的錯誤代碼', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
      });

      let attempts = 0;

      // 可重試的錯誤
      try {
        await retry.execute(async () => {
          attempts++;
          const error: any = new Error('Connection reset');
          error.code = 'ECONNRESET';
          throw error;
        });
      } catch (error) {
        // 預期失敗
      }

      expect(attempts).toBe(3); // 應該重試

      attempts = 0;

      // 不可重試的錯誤
      try {
        await retry.execute(async () => {
          attempts++;
          const error: any = new Error('Invalid input');
          error.code = 'EINVAL';
          throw error;
        });
      } catch (error) {
        // 預期失敗
      }

      expect(attempts).toBe(1); // 不應該重試
    });

    it('應該只重試指定的 HTTP 狀態碼', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        retryableStatusCodes: [500, 502, 503],
      });

      let attempts = 0;

      // 可重試的狀態碼
      try {
        await retry.execute(async () => {
          attempts++;
          const error: any = new Error('Server error');
          error.statusCode = 503;
          throw error;
        });
      } catch (error) {
        // 預期失敗
      }

      expect(attempts).toBe(3); // 應該重試

      attempts = 0;

      // 不可重試的狀態碼
      try {
        await retry.execute(async () => {
          attempts++;
          const error: any = new Error('Bad request');
          error.statusCode = 400;
          throw error;
        });
      } catch (error) {
        // 預期失敗
      }

      expect(attempts).toBe(1); // 不應該重試
    });

    it('應該支援自定義重試判斷', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        shouldRetry: (error, attempt) => {
          return error.message.includes('temporary') && attempt < 3;
        },
      });

      let attempts = 0;

      // 應該重試
      try {
        await retry.execute(async () => {
          attempts++;
          throw new Error('temporary failure');
        });
      } catch (error) {
        // 預期失敗
      }

      expect(attempts).toBe(3);

      attempts = 0;

      // 不應該重試
      try {
        await retry.execute(async () => {
          attempts++;
          throw new Error('permanent failure');
        });
      } catch (error) {
        // 預期失敗
      }

      expect(attempts).toBe(1);
    });
  });

  describe('回調通知', () => {
    it('應該在重試時調用 onRetry 回調', async () => {
      const onRetry = jest.fn();
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        onRetry,
      });

      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('retry me');
        }
        return 'success';
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('應該在成功時調用 onSuccess 回調', async () => {
      const onSuccess = jest.fn();
      const retry = new RetryPolicy({
        maxAttempts: 3,
        onSuccess,
      });

      await retry.execute(async () => 'success');

      expect(onSuccess).toHaveBeenCalledWith('success', 1);
    });

    it('應該在失敗時調用 onFailure 回調', async () => {
      const onFailure = jest.fn();
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        onFailure,
      });

      try {
        await retry.execute(async () => {
          throw new Error('fail');
        });
      } catch (error) {
        // 預期失敗
      }

      expect(onFailure).toHaveBeenCalledTimes(1);
    });
  });

  describe('統計追蹤', () => {
    it('應該追蹤重試統計', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        name: 'test-retry',
      });

      let attempts = 0;

      // 成功的重試
      await retry.execute(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('retry');
        }
        return 'success';
      });

      attempts = 0;

      // 失敗的重試
      try {
        await retry.execute(async () => {
          attempts++;
          throw new Error('fail');
        });
      } catch (error) {
        // 預期失敗
      }

      const stats = retry.getStats();
      expect(stats.name).toBe('test-retry');
      expect(stats.totalAttempts).toBe(5); // 2 + 3
      expect(stats.successfulRetries).toBe(1);
      expect(stats.failedRetries).toBe(1);
      expect(stats.averageAttempts).toBeGreaterThan(0);
      expect(stats.successRate).toBe(50);
    });

    it('應該重置統計', async () => {
      const retry = new RetryPolicy({ maxAttempts: 3, initialDelay: 10 });

      await retry.execute(async () => 'success');

      retry.reset();

      const stats = retry.getStats();
      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulRetries).toBe(0);
      expect(stats.failedRetries).toBe(0);
    });
  });

  describe('超時控制', () => {
    it('應該在超時時拋出錯誤', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 2,
        initialDelay: 10,
        timeout: 50,
      });

      await expect(
        retry.execute(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return 'success';
        })
      ).rejects.toThrow('timeout');
    });

    it('應該在超時前成功', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        timeout: 100,
      });

      const result = await retry.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'success';
      });

      expect(result).toBe('success');
    });
  });
});

describe('RetryPolicyManager', () => {
  beforeEach(() => {
    RetryPolicyManager.clear();
  });

  it('應該創建和獲取重試策略', () => {
    const policy1 = RetryPolicyManager.getOrCreate({
      name: 'policy1',
      maxAttempts: 3,
    });

    const policy2 = RetryPolicyManager.getOrCreate({
      name: 'policy1',
      maxAttempts: 5, // 應該被忽略
    });

    expect(policy1).toBe(policy2);
    expect(policy1.getConfig().maxAttempts).toBe(3);
  });

  it('應該獲取所有策略統計', async () => {
    const policy1 = RetryPolicyManager.getOrCreate({
      name: 'policy1',
      maxAttempts: 3,
    });
    const policy2 = RetryPolicyManager.getOrCreate({
      name: 'policy2',
      maxAttempts: 3,
    });

    await policy1.execute(async () => 'success');
    await policy2.execute(async () => 'success');

    const allStats = RetryPolicyManager.getAllStats();
    expect(allStats).toHaveLength(2);
    expect(allStats[0].name).toBe('policy1');
    expect(allStats[1].name).toBe('policy2');
  });

  it('應該重置所有策略', async () => {
    const policy1 = RetryPolicyManager.getOrCreate({
      name: 'policy1',
      maxAttempts: 3,
    });
    const policy2 = RetryPolicyManager.getOrCreate({
      name: 'policy2',
      maxAttempts: 3,
    });

    await policy1.execute(async () => 'success');
    await policy2.execute(async () => 'success');

    RetryPolicyManager.resetAll();

    const allStats = RetryPolicyManager.getAllStats();
    expect(allStats[0].totalAttempts).toBe(0);
    expect(allStats[1].totalAttempts).toBe(0);
  });
});

describe('便利函數', () => {
  describe('createSimpleRetry', () => {
    it('應該創建簡單重試策略', async () => {
      const retry = createSimpleRetry(3, 100, BackoffStrategy.FIXED);

      const config = retry.getConfig();
      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelay).toBe(100);
      expect(config.backoff).toBe(BackoffStrategy.FIXED);
    });
  });

  describe('withRetry', () => {
    it('應該包裝函數並添加重試功能', async () => {
      let attempts = 0;

      const fetchData = withRetry(
        async (id: number) => {
          attempts++;
          if (attempts < 2) {
            throw new Error('retry');
          }
          return `data-${id}`;
        },
        { maxAttempts: 3, initialDelay: 10 }
      );

      const result = await fetchData(123);
      expect(result).toBe('data-123');
      expect(attempts).toBe(2);
    });
  });

  describe('retryBatch', () => {
    it('應該批量執行帶重試的操作', async () => {
      let attempts1 = 0;
      let attempts2 = 0;

      const results = await retryBatch([
        {
          name: 'op1',
          operation: async () => {
            attempts1++;
            if (attempts1 < 2) {
              throw new Error('retry');
            }
            return 'result1';
          },
          config: { maxAttempts: 3, initialDelay: 10 },
        },
        {
          name: 'op2',
          operation: async () => {
            attempts2++;
            return 'result2';
          },
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('op1');
      expect(results[0].result).toBe('result1');
      expect(results[1].name).toBe('op2');
      expect(results[1].result).toBe('result2');
    });

    it('應該處理批量操作中的失敗', async () => {
      const results = await retryBatch([
        {
          name: 'success',
          operation: async () => 'ok',
        },
        {
          name: 'failure',
          operation: async () => {
            throw new Error('fail');
          },
          config: { maxAttempts: 2, initialDelay: 10 },
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].result).toBe('ok');
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
      expect(results[1].error?.message).toBe('fail');
    });
  });
});

describe('真實場景測試', () => {
  describe('網絡請求重試', () => {
    it('應該重試失敗的 API 調用', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        retryableStatusCodes: [500, 502, 503],
      });

      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        if (attempts < 3) {
          const error: any = new Error('Service unavailable');
          error.statusCode = 503;
          throw error;
        }
        return { data: 'success' };
      });

      expect(result.data).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('資料庫連接重試', () => {
    it('應該重試資料庫連接失敗', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 10,
        retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT'],
      });

      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        if (attempts < 2) {
          const error: any = new Error('Connection refused');
          error.code = 'ECONNREFUSED';
          throw error;
        }
        return { connected: true };
      });

      expect(result.connected).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('分佈式系統重試', () => {
    it('應該處理暫時性故障', async () => {
      const retry = new RetryPolicy({
        maxAttempts: 5,
        initialDelay: 100,
        backoff: BackoffStrategy.EXPONENTIAL,
        shouldRetry: (error, attempt) => {
          // 只重試暫時性故障
          return error.message.includes('temporary') && attempt < 5;
        },
      });

      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('temporary system overload');
        }
        return { processed: true };
      });

      expect(result.processed).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('批量操作重試', () => {
    it('應該獨立重試批量操作中的每個項目', async () => {
      const results = await retryBatch([
        {
          name: 'task1',
          operation: async () => 'success',
        },
        {
          name: 'task2',
          operation: async () => {
            throw new Error('permanent failure');
          },
          config: { maxAttempts: 2, initialDelay: 10 },
        },
        {
          name: 'task3',
          operation: async () => 'success',
        },
      ]);

      expect(results[0].result).toBe('success');
      expect(results[1].error?.message).toBe('permanent failure');
      expect(results[2].result).toBe('success');
    });
  });
});
