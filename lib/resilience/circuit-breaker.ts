/**
 * @fileoverview 熔斷器模式實現功能：- 防止級聯故障- 快速失敗機制- 自動故障恢復- 半開狀態測試- 熔斷統計追蹤使用方式：```typescriptconst breaker = new CircuitBreaker({  name: 'database',  failureThreshold: 5,  resetTimeout: 60000});const result = await breaker.execute(async () => {  return await db.query('SELECT * FROM users');});```@author Claude Code@date 2025-10-01@epic Sprint 4 - 性能優化與高可用性
 * @module lib/resilience/circuit-breaker
 * @description
 * 熔斷器模式實現功能：- 防止級聯故障- 快速失敗機制- 自動故障恢復- 半開狀態測試- 熔斷統計追蹤使用方式：```typescriptconst breaker = new CircuitBreaker({  name: 'database',  failureThreshold: 5,  resetTimeout: 60000});const result = await breaker.execute(async () => {  return await db.query('SELECT * FROM users');});```@author Claude Code@date 2025-10-01@epic Sprint 4 - 性能優化與高可用性
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

/**
 * 熔斷器狀態
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // 關閉狀態（正常運行）
  OPEN = 'OPEN', // 開啟狀態（熔斷）
  HALF_OPEN = 'HALF_OPEN', // 半開狀態（測試恢復）
}

/**
 * 熔斷器配置
 */
export interface CircuitBreakerConfig {
  name: string; // 熔斷器名稱
  failureThreshold?: number; // 失敗閾值（默認 5）
  successThreshold?: number; // 成功閾值（半開狀態，默認 2）
  resetTimeout?: number; // 重置超時時間（毫秒，默認 60000）
  timeout?: number; // 操作超時時間（毫秒，默認 30000）
  monitoringPeriod?: number; // 監控週期（毫秒，默認 10000）
  volumeThreshold?: number; // 最小請求量閾值（默認 10）
  errorThresholdPercentage?: number; // 錯誤率閾值（百分比，默認 50）
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

/**
 * 熔斷器統計
 */
export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  errorRate: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  lastStateChange?: Date;
  uptime: number; // 可用時間百分比
}

/**
 * 熔斷器錯誤
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public breakerName: string,
    public state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * 熔斷器超時錯誤
 */
export class CircuitBreakerTimeoutError extends Error {
  constructor(message: string, public breakerName: string, public timeout: number) {
    super(message);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

/**
 * 熔斷器實現
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private rejectedRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private lastStateChange?: Date;
  private nextAttemptTime = 0;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      name: config.name,
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      resetTimeout: config.resetTimeout ?? 60000,
      timeout: config.timeout ?? 30000,
      monitoringPeriod: config.monitoringPeriod ?? 10000,
      volumeThreshold: config.volumeThreshold ?? 10,
      errorThresholdPercentage: config.errorThresholdPercentage ?? 50,
      onStateChange: config.onStateChange ?? (() => {}),
      onSuccess: config.onSuccess ?? (() => {}),
      onFailure: config.onFailure ?? (() => {}),
    };
  }

  /**
   * 執行操作
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // 檢查熔斷器狀態
    this.checkState();

    // 如果熔斷器開啟，直接拒絕請求
    if (this.state === CircuitState.OPEN) {
      this.rejectedRequests++;
      throw new CircuitBreakerError(
        `Circuit breaker "${this.config.name}" is OPEN`,
        this.config.name,
        this.state
      );
    }

    this.totalRequests++;

    try {
      // 執行帶超時的操作
      const result = await this.executeWithTimeout(operation);

      // 記錄成功
      this.onOperationSuccess();

      return result;
    } catch (error) {
      // 記錄失敗
      this.onOperationFailure(error as Error);

      throw error;
    }
  }

  /**
   * 帶超時執行操作
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new CircuitBreakerTimeoutError(
            `Operation timeout after ${this.config.timeout}ms`,
            this.config.name,
            this.config.timeout
          )
        );
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
   * 檢查並更新熔斷器狀態
   */
  private checkState(): void {
    const now = Date.now();

    // 如果熔斷器開啟且已過重置時間，切換到半開狀態
    if (this.state === CircuitState.OPEN && now >= this.nextAttemptTime) {
      this.setState(CircuitState.HALF_OPEN);
      this.successCount = 0;
      this.failureCount = 0;
    }
  }

  /**
   * 操作成功處理
   */
  private onOperationSuccess(): void {
    this.successfulRequests++;
    this.lastSuccessTime = new Date();
    this.failureCount = 0;

    this.config.onSuccess();

    // 半開狀態下連續成功達到閾值，切換到關閉狀態
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.setState(CircuitState.CLOSED);
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }

  /**
   * 操作失敗處理
   */
  private onOperationFailure(error: Error): void {
    this.failedRequests++;
    this.lastFailureTime = new Date();
    this.successCount = 0;

    this.config.onFailure(error);

    // 關閉或半開狀態下失敗計數增加
    if (
      this.state === CircuitState.CLOSED ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.failureCount++;

      // 關閉狀態：連續失敗達到閾值，開啟熔斷器
      if (
        this.state === CircuitState.CLOSED &&
        this.failureCount >= this.config.failureThreshold
      ) {
        this.openCircuit();
      }

      // 半開狀態：任何失敗都開啟熔斷器
      if (this.state === CircuitState.HALF_OPEN) {
        this.openCircuit();
      }
    }
  }

  /**
   * 開啟熔斷器
   */
  private openCircuit(): void {
    this.setState(CircuitState.OPEN);
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * 設置狀態
   */
  private setState(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState !== newState) {
      this.state = newState;
      this.lastStateChange = new Date();
      this.config.onStateChange(oldState, newState);
    }
  }

  /**
   * 獲取當前狀態
   */
  getState(): CircuitState {
    this.checkState();
    return this.state;
  }

  /**
   * 獲取統計信息
   */
  getStats(): CircuitBreakerStats {
    const total = this.successfulRequests + this.failedRequests;
    const errorRate = total > 0 ? (this.failedRequests / total) * 100 : 0;
    const uptime =
      total > 0 ? (this.successfulRequests / total) * 100 : 100;

    return {
      name: this.config.name,
      state: this.getState(),
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rejectedRequests: this.rejectedRequests,
      consecutiveFailures: this.failureCount,
      consecutiveSuccesses: this.successCount,
      errorRate,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
      uptime,
    };
  }

  /**
   * 重置熔斷器
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.rejectedRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.lastStateChange = new Date();
    this.nextAttemptTime = 0;
  }

  /**
   * 強制開啟熔斷器
   */
  forceOpen(): void {
    this.openCircuit();
  }

  /**
   * 強制關閉熔斷器
   */
  forceClose(): void {
    this.setState(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;
  }
}

/**
 * 熔斷器管理器
 */
export class CircuitBreakerManager {
  private static breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * 創建或獲取熔斷器
   */
  static getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    const existing = this.breakers.get(config.name);
    if (existing) {
      return existing;
    }

    const breaker = new CircuitBreaker(config);
    this.breakers.set(config.name, breaker);
    return breaker;
  }

  /**
   * 獲取熔斷器
   */
  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * 獲取所有熔斷器統計
   */
  static getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.breakers.values()).map((breaker) =>
      breaker.getStats()
    );
  }

  /**
   * 重置所有熔斷器
   */
  static resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  /**
   * 清除所有熔斷器
   */
  static clear(): void {
    this.breakers.clear();
  }
}

/**
 * 便利函數：創建熔斷器包裝函數
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  config?: Partial<CircuitBreakerConfig>
): T {
  const breaker = CircuitBreakerManager.getOrCreate({
    name,
    ...config,
  });

  return (async (...args: Parameters<T>) => {
    return breaker.execute(() => fn(...args));
  }) as T;
}

/**
 * 便利函數：批量執行帶熔斷器的操作
 */
export async function executeBatch<T>(
  operations: Array<{
    name: string;
    operation: () => Promise<T>;
    config?: Partial<CircuitBreakerConfig>;
  }>
): Promise<Array<{ name: string; result?: T; error?: Error }>> {
  return Promise.all(
    operations.map(async ({ name, operation, config }) => {
      const breaker = CircuitBreakerManager.getOrCreate({
        name,
        ...config,
      });

      try {
        const result = await breaker.execute(operation);
        return { name, result };
      } catch (error) {
        return { name, error: error as Error };
      }
    })
  );
}
