/**
 * 重試策略系統
 *
 * 功能：
 * - 可配置重試策略
 * - 退避算法（固定、線性、指數、抖動）
 * - 條件重試（基於錯誤類型）
 * - 重試統計追蹤
 * - 超時控制
 * - 回調通知
 *
 * 使用方式：
 * ```typescript
 * const retry = new RetryPolicy({
 *   maxAttempts: 3,
 *   backoff: 'exponential',
 *   retryableErrors: ['ECONNRESET', 'ETIMEDOUT']
 * });
 *
 * const result = await retry.execute(async () => {
 *   return await fetch('https://api.example.com/data');
 * });
 * ```
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 4 - 性能優化與高可用性
 */

/**
 * 退避策略類型
 */
export enum BackoffStrategy {
  FIXED = 'fixed', // 固定延遲
  LINEAR = 'linear', // 線性增長
  EXPONENTIAL = 'exponential', // 指數增長
  JITTER = 'jitter', // 帶抖動的指數增長
}

/**
 * 重試結果
 */
export interface RetryResult<T> {
  value?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
  success: boolean;
}

/**
 * 重試統計
 */
export interface RetryStats {
  name: string;
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  totalDelay: number;
  averageAttempts: number;
  successRate: number;
  lastRetry?: Date;
}

/**
 * 重試策略配置
 */
export interface RetryPolicyConfig {
  name?: string; // 策略名稱
  maxAttempts?: number; // 最大重試次數（默認 3）
  initialDelay?: number; // 初始延遲（毫秒，默認 1000）
  maxDelay?: number; // 最大延遲（毫秒，默認 30000）
  backoff?: BackoffStrategy; // 退避策略（默認 exponential）
  timeout?: number; // 單次操作超時（毫秒，默認 30000）
  retryableErrors?: string[]; // 可重試的錯誤代碼/名稱
  retryableStatusCodes?: number[]; // 可重試的 HTTP 狀態碼
  shouldRetry?: (error: Error, attempt: number) => boolean; // 自定義重試判斷
  onRetry?: (error: Error, attempt: number, delay: number) => void; // 重試回調
  onSuccess?: (result: any, attempts: number) => void; // 成功回調
  onFailure?: (error: Error, attempts: number) => void; // 失敗回調
}

/**
 * 重試策略錯誤
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public lastError: Error,
    public attempts: number,
    public totalDelay: number
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * 重試策略實現
 */
export class RetryPolicy {
  private stats: RetryStats;
  private readonly config: Required<RetryPolicyConfig>;

  constructor(config: RetryPolicyConfig = {}) {
    this.config = {
      name: config.name ?? 'default',
      maxAttempts: config.maxAttempts ?? 3,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      backoff: config.backoff ?? BackoffStrategy.EXPONENTIAL,
      timeout: config.timeout ?? 30000,
      retryableErrors: config.retryableErrors ?? [],
      retryableStatusCodes: config.retryableStatusCodes ?? [
        408, 429, 500, 502, 503, 504,
      ],
      shouldRetry: config.shouldRetry ?? (() => true),
      onRetry: config.onRetry ?? (() => {}),
      onSuccess: config.onSuccess ?? (() => {}),
      onFailure: config.onFailure ?? (() => {}),
    };

    this.stats = {
      name: this.config.name,
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalDelay: 0,
      averageAttempts: 0,
      successRate: 0,
    };
  }

  /**
   * 執行帶重試的操作
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      this.stats.totalAttempts++;

      try {
        // 執行帶超時的操作
        const result = await this.executeWithTimeout(operation);

        // 成功
        this.onOperationSuccess(result, attempt, totalDelay);
        return result;
      } catch (error) {
        lastError = error as Error;

        // 檢查是否應該重試
        const shouldRetry = this.shouldRetryOperation(
          lastError,
          attempt,
          totalDelay
        );

        if (!shouldRetry || attempt >= this.config.maxAttempts) {
          // 不重試或已達最大次數
          this.onOperationFailure(lastError, attempt, totalDelay);
          throw lastError;
        }

        // 計算延遲時間
        const delay = this.calculateDelay(attempt);
        totalDelay += delay;

        // 通知重試
        this.config.onRetry(lastError, attempt, delay);

        // 等待後重試
        await this.sleep(delay);
      }
    }

    // 理論上不會到這裡，但為了類型安全
    const error = lastError || new Error('Unknown error');
    this.onOperationFailure(error, this.config.maxAttempts, totalDelay);
    throw error;
  }

  /**
   * 帶超時執行操作
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * 判斷是否應該重試
   */
  private shouldRetryOperation(
    error: Error,
    attempt: number,
    totalDelay: number
  ): boolean {
    // 檢查總延遲是否超過最大延遲
    if (totalDelay >= this.config.maxDelay) {
      return false;
    }

    // 檢查錯誤代碼
    if (this.config.retryableErrors.length > 0) {
      const errorCode = (error as any).code || error.name;
      if (!this.config.retryableErrors.includes(errorCode)) {
        return false;
      }
    }

    // 檢查 HTTP 狀態碼
    if ('statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if (
        this.config.retryableStatusCodes.length > 0 &&
        !this.config.retryableStatusCodes.includes(statusCode)
      ) {
        return false;
      }
    }

    // 自定義判斷
    return this.config.shouldRetry(error, attempt);
  }

  /**
   * 計算延遲時間
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.backoff) {
      case BackoffStrategy.FIXED:
        delay = this.config.initialDelay;
        break;

      case BackoffStrategy.LINEAR:
        delay = this.config.initialDelay * attempt;
        break;

      case BackoffStrategy.EXPONENTIAL:
        delay = this.config.initialDelay * Math.pow(2, attempt - 1);
        break;

      case BackoffStrategy.JITTER:
        const exponentialDelay =
          this.config.initialDelay * Math.pow(2, attempt - 1);
        // 添加 ±25% 的隨機抖動
        const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
        delay = exponentialDelay + jitter;
        break;

      default:
        delay = this.config.initialDelay;
    }

    // 限制最大延遲
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * 睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 操作成功處理
   */
  private onOperationSuccess<T>(
    result: T,
    attempts: number,
    totalDelay: number
  ): void {
    if (attempts > 1) {
      this.stats.successfulRetries++;
      this.stats.lastRetry = new Date();
    }

    this.stats.totalDelay += totalDelay;
    this.updateAverageAttempts();
    this.updateSuccessRate();

    this.config.onSuccess(result, attempts);
  }

  /**
   * 操作失敗處理
   */
  private onOperationFailure(
    error: Error,
    attempts: number,
    totalDelay: number
  ): void {
    this.stats.failedRetries++;
    this.stats.totalDelay += totalDelay;
    this.stats.lastRetry = new Date();

    this.updateAverageAttempts();
    this.updateSuccessRate();

    this.config.onFailure(error, attempts);
  }

  /**
   * 更新平均嘗試次數
   */
  private updateAverageAttempts(): void {
    const totalOperations =
      this.stats.successfulRetries + this.stats.failedRetries;
    if (totalOperations > 0) {
      this.stats.averageAttempts = this.stats.totalAttempts / totalOperations;
    }
  }

  /**
   * 更新成功率
   */
  private updateSuccessRate(): void {
    const totalOperations =
      this.stats.successfulRetries + this.stats.failedRetries;
    if (totalOperations > 0) {
      this.stats.successRate =
        (this.stats.successfulRetries / totalOperations) * 100;
    }
  }

  /**
   * 獲取統計信息
   */
  getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * 重置統計
   */
  reset(): void {
    this.stats = {
      name: this.config.name,
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalDelay: 0,
      averageAttempts: 0,
      successRate: 0,
    };
  }

  /**
   * 獲取配置
   */
  getConfig(): Required<RetryPolicyConfig> {
    return { ...this.config };
  }
}

/**
 * 重試策略管理器
 */
export class RetryPolicyManager {
  private static policies: Map<string, RetryPolicy> = new Map();

  /**
   * 創建或獲取重試策略
   */
  static getOrCreate(config: RetryPolicyConfig): RetryPolicy {
    const name = config.name || 'default';
    const existing = this.policies.get(name);
    if (existing) {
      return existing;
    }

    const policy = new RetryPolicy(config);
    this.policies.set(name, policy);
    return policy;
  }

  /**
   * 獲取重試策略
   */
  static get(name: string): RetryPolicy | undefined {
    return this.policies.get(name);
  }

  /**
   * 獲取所有策略統計
   */
  static getAllStats(): RetryStats[] {
    return Array.from(this.policies.values()).map((policy) =>
      policy.getStats()
    );
  }

  /**
   * 重置所有策略
   */
  static resetAll(): void {
    this.policies.forEach((policy) => policy.reset());
  }

  /**
   * 清除所有策略
   */
  static clear(): void {
    this.policies.clear();
  }
}

/**
 * 便利函數：創建簡單重試策略
 */
export function createSimpleRetry(
  maxAttempts: number = 3,
  delay: number = 1000,
  backoff: BackoffStrategy = BackoffStrategy.EXPONENTIAL
): RetryPolicy {
  return new RetryPolicy({
    maxAttempts,
    initialDelay: delay,
    backoff,
  });
}

/**
 * 便利函數：帶重試包裝函數
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: RetryPolicyConfig
): T {
  const policy = new RetryPolicy(config);

  return (async (...args: Parameters<T>) => {
    return policy.execute(() => fn(...args));
  }) as T;
}

/**
 * 便利函數：批量重試執行
 */
export async function retryBatch<T>(
  operations: Array<{
    name: string;
    operation: () => Promise<T>;
    config?: RetryPolicyConfig;
  }>
): Promise<Array<{ name: string; result?: T; error?: Error }>> {
  return Promise.all(
    operations.map(async ({ name, operation, config }) => {
      const policy = new RetryPolicy(config);

      try {
        const result = await policy.execute(operation);
        return { name, result };
      } catch (error) {
        return { name, error: error as Error };
      }
    })
  );
}
