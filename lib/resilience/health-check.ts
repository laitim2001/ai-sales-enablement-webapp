/**
 * @fileoverview 增強健康檢查系統功能：- 多服務健康檢查- 依賴關係管理- 健康度評分- 自動恢復檢測- 熔斷器整合- 健康指標追蹤使用方式：```typescriptconst healthCheck = new HealthCheckSystem();healthCheck.register('database', async () => {  await db.ping();  return { status: 'healthy' };});const status = await healthCheck.check();```@author Claude Code@date 2025-10-01@epic Sprint 4 - 性能優化與高可用性
 * @module lib/resilience/health-check
 * @description
 * 增強健康檢查系統功能：- 多服務健康檢查- 依賴關係管理- 健康度評分- 自動恢復檢測- 熔斷器整合- 健康指標追蹤使用方式：```typescriptconst healthCheck = new HealthCheckSystem();healthCheck.register('database', async () => {  await db.ping();  return { status: 'healthy' };});const status = await healthCheck.check();```@author Claude Code@date 2025-10-01@epic Sprint 4 - 性能優化與高可用性
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { CircuitBreaker, CircuitBreakerManager } from './circuit-breaker';

/**
 * 健康狀態
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

/**
 * 健康檢查結果
 */
export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration: number; // 檢查耗時（毫秒）
  error?: string;
}

/**
 * 服務健康信息
 */
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  result?: HealthCheckResult;
  lastCheck?: Date;
  lastHealthy?: Date;
  consecutiveFailures: number;
  uptime: number; // 可用時間百分比
  averageResponseTime: number;
}

/**
 * 系統健康報告
 */
export interface SystemHealthReport {
  status: HealthStatus;
  score: number; // 0-100
  timestamp: Date;
  services: Record<string, ServiceHealth>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
  };
  criticalIssues: string[];
  warnings: string[];
}

/**
 * 健康檢查配置
 */
export interface HealthCheckConfig {
  name: string;
  check: () => Promise<HealthCheckResult>;
  critical?: boolean; // 是否為關鍵服務
  timeout?: number; // 超時時間（毫秒）
  interval?: number; // 檢查間隔（毫秒）
  retries?: number; // 重試次數
  dependencies?: string[]; // 依賴的其他服務
  tags?: string[]; // 標籤
}

/**
 * 健康檢查系統
 */
export class HealthCheckSystem {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, ServiceHealth> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * 註冊健康檢查
   */
  register(config: HealthCheckConfig): void {
    this.checks.set(config.name, {
      critical: false,
      timeout: 5000,
      interval: 30000,
      retries: 3,
      dependencies: [],
      tags: [],
      ...config,
    });

    // 初始化服務健康信息
    this.results.set(config.name, {
      name: config.name,
      status: HealthStatus.UNKNOWN,
      consecutiveFailures: 0,
      uptime: 100,
      averageResponseTime: 0,
    });

    // 創建熔斷器
    const breaker = CircuitBreakerManager.getOrCreate({
      name: `health-check-${config.name}`,
      failureThreshold: config.retries || 3,
      resetTimeout: 60000,
      timeout: config.timeout,
    });
    this.breakers.set(config.name, breaker);

    // 如果配置了定期檢查，啟動定時器
    if (config.interval && config.interval > 0) {
      this.startPeriodicCheck(config.name);
    }
  }

  /**
   * 取消註冊健康檢查
   */
  unregister(name: string): void {
    this.stopPeriodicCheck(name);
    this.checks.delete(name);
    this.results.delete(name);
    this.breakers.delete(name);
  }

  /**
   * 檢查單個服務
   */
  async checkService(name: string): Promise<ServiceHealth> {
    const config = this.checks.get(name);
    if (!config) {
      throw new Error(`Health check "${name}" not registered`);
    }

    const serviceHealth = this.results.get(name)!;
    const startTime = Date.now();

    try {
      // 檢查依賴服務
      await this.checkDependencies(config.dependencies || []);

      // 使用熔斷器執行健康檢查
      const breaker = this.breakers.get(name)!;
      const result = await breaker.execute(async () => {
        return await this.executeCheck(config);
      });

      const duration = Date.now() - startTime;

      // 更新服務健康信息
      serviceHealth.status = result.status;
      serviceHealth.result = { ...result, duration };
      serviceHealth.lastCheck = new Date();

      // 只有完全健康才重置失敗計數
      if (result.status === HealthStatus.HEALTHY) {
        serviceHealth.consecutiveFailures = 0;
        serviceHealth.lastHealthy = new Date();
      }

      // 更新平均響應時間（使用實際測量的duration）
      this.updateAverageResponseTime(serviceHealth, duration);

      return serviceHealth;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 記錄失敗
      serviceHealth.status = HealthStatus.UNHEALTHY;
      serviceHealth.result = {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        duration,
        error: (error as Error).message,
      };
      serviceHealth.lastCheck = new Date();

      // 只有非熔斷器錯誤才累加失敗計數
      const isCircuitBreakerError = (error as Error).name === 'CircuitBreakerError';
      if (!isCircuitBreakerError) {
        serviceHealth.consecutiveFailures++;
      }

      // 更新平均響應時間
      this.updateAverageResponseTime(serviceHealth, duration);

      return serviceHealth;
    }
  }

  /**
   * 檢查所有服務
   */
  async checkAll(): Promise<SystemHealthReport> {
    const timestamp = new Date();
    const services: Record<string, ServiceHealth> = {};

    // 並行檢查所有服務
    await Promise.all(
      Array.from(this.checks.keys()).map(async (name) => {
        const health = await this.checkService(name);
        services[name] = health;
      })
    );

    // 計算系統健康度
    const summary = this.calculateSummary(services);
    const score = this.calculateHealthScore(services);
    const status = this.determineSystemStatus(services, score);
    const { criticalIssues, warnings } = this.collectIssues(services);

    return {
      status,
      score,
      timestamp,
      services,
      summary,
      criticalIssues,
      warnings,
    };
  }

  /**
   * 獲取服務健康信息
   */
  getServiceHealth(name: string): ServiceHealth | undefined {
    return this.results.get(name);
  }

  /**
   * 獲取所有服務健康信息
   */
  getAllServiceHealth(): Record<string, ServiceHealth> {
    const result: Record<string, ServiceHealth> = {};
    this.results.forEach((health, name) => {
      result[name] = health;
    });
    return result;
  }

  /**
   * 啟動所有定期檢查
   */
  startAllPeriodicChecks(): void {
    this.checks.forEach((config) => {
      if (config.interval && config.interval > 0) {
        this.startPeriodicCheck(config.name);
      }
    });
  }

  /**
   * 停止所有定期檢查
   */
  stopAllPeriodicChecks(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * 重置所有統計
   */
  reset(): void {
    this.results.forEach((health) => {
      health.status = HealthStatus.UNKNOWN;
      health.result = undefined;
      health.lastCheck = undefined;
      health.lastHealthy = undefined;
      health.consecutiveFailures = 0;
      health.uptime = 100;
      health.averageResponseTime = 0;
    });

    CircuitBreakerManager.resetAll();
  }

  /**
   * 執行健康檢查
   */
  private async executeCheck(
    config: HealthCheckConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const result = await config.check();
    const duration = Date.now() - startTime;

    return {
      status: result.status || HealthStatus.HEALTHY,
      message: result.message,
      details: result.details,
      timestamp: new Date(),
      duration,
    };
  }

  /**
   * 檢查依賴服務
   */
  private async checkDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      const health = this.results.get(dep);

      if (!health || health.status === HealthStatus.UNHEALTHY) {
        throw new Error(`Dependency "${dep}" is unhealthy`);
      }
    }
  }

  /**
   * 啟動定期檢查
   */
  private startPeriodicCheck(name: string): void {
    const config = this.checks.get(name);
    if (!config || !config.interval) return;

    // 停止現有定時器
    this.stopPeriodicCheck(name);

    // 立即執行一次檢查
    this.checkService(name).catch(() => {});

    // 啟動定時器
    const interval = setInterval(() => {
      this.checkService(name).catch(() => {});
    }, config.interval);

    this.intervals.set(name, interval);
  }

  /**
   * 停止定期檢查
   */
  private stopPeriodicCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  /**
   * 更新平均響應時間
   */
  private updateAverageResponseTime(
    health: ServiceHealth,
    duration: number
  ): void {
    if (health.averageResponseTime === 0) {
      health.averageResponseTime = duration;
    } else {
      // 使用指數移動平均
      health.averageResponseTime =
        health.averageResponseTime * 0.7 + duration * 0.3;
    }
  }

  /**
   * 計算摘要統計
   */
  private calculateSummary(services: Record<string, ServiceHealth>) {
    const summary = {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unknown: 0,
    };

    Object.values(services).forEach((health) => {
      summary.total++;
      switch (health.status) {
        case HealthStatus.HEALTHY:
          summary.healthy++;
          break;
        case HealthStatus.DEGRADED:
          summary.degraded++;
          break;
        case HealthStatus.UNHEALTHY:
          summary.unhealthy++;
          break;
        case HealthStatus.UNKNOWN:
          summary.unknown++;
          break;
      }
    });

    return summary;
  }

  /**
   * 計算健康分數
   */
  private calculateHealthScore(
    services: Record<string, ServiceHealth>
  ): number {
    const serviceList = Object.values(services);
    if (serviceList.length === 0) return 100;

    let totalScore = 0;
    let totalWeight = 0;

    serviceList.forEach((health) => {
      const config = this.checks.get(health.name);
      const weight = config?.critical ? 2 : 1;

      let score = 0;
      switch (health.status) {
        case HealthStatus.HEALTHY:
          score = 100;
          break;
        case HealthStatus.DEGRADED:
          score = 50;
          break;
        case HealthStatus.UNHEALTHY:
          score = 0;
          break;
        case HealthStatus.UNKNOWN:
          score = 50;
          break;
      }

      totalScore += score * weight;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  /**
   * 確定系統狀態
   */
  private determineSystemStatus(
    services: Record<string, ServiceHealth>,
    score: number
  ): HealthStatus {
    // 檢查關鍵服務
    const criticalServices = Object.values(services).filter((health) => {
      const config = this.checks.get(health.name);
      return config?.critical;
    });

    const hasCriticalFailure = criticalServices.some(
      (health) => health.status === HealthStatus.UNHEALTHY
    );

    if (hasCriticalFailure) {
      return HealthStatus.UNHEALTHY;
    }

    // 根據分數判斷
    if (score >= 80) {
      return HealthStatus.HEALTHY;
    } else if (score >= 50) {
      return HealthStatus.DEGRADED;
    } else {
      return HealthStatus.UNHEALTHY;
    }
  }

  /**
   * 收集問題
   */
  private collectIssues(services: Record<string, ServiceHealth>): {
    criticalIssues: string[];
    warnings: string[];
  } {
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    Object.values(services).forEach((health) => {
      const config = this.checks.get(health.name);

      if (health.status === HealthStatus.UNHEALTHY) {
        const message = `Service "${health.name}" is unhealthy${
          health.result?.error ? `: ${health.result.error}` : ''
        }`;

        if (config?.critical) {
          criticalIssues.push(message);
        } else {
          warnings.push(message);
        }
      } else if (health.status === HealthStatus.DEGRADED) {
        warnings.push(`Service "${health.name}" is degraded`);
      }

      // 檢查連續失敗
      if (health.consecutiveFailures >= 3) {
        warnings.push(
          `Service "${health.name}" has ${health.consecutiveFailures} consecutive failures`
        );
      }

      // 檢查響應時間
      if (health.averageResponseTime > 5000) {
        warnings.push(
          `Service "${health.name}" has high average response time: ${Math.round(
            health.averageResponseTime
          )}ms`
        );
      }
    });

    return { criticalIssues, warnings };
  }
}

/**
 * 全局健康檢查實例
 */
let globalHealthCheck: HealthCheckSystem | null = null;

/**
 * 獲取全局健康檢查實例
 */
export function getHealthCheckSystem(): HealthCheckSystem {
  if (!globalHealthCheck) {
    globalHealthCheck = new HealthCheckSystem();
  }
  return globalHealthCheck;
}

/**
 * 重置全局健康檢查實例
 */
export function resetHealthCheckSystem(): void {
  if (globalHealthCheck) {
    globalHealthCheck.stopAllPeriodicChecks();
    globalHealthCheck.reset();
  }
  globalHealthCheck = null;
}

/**
 * 便利函數：創建簡單的健康檢查
 */
export function createSimpleHealthCheck(
  name: string,
  checkFn: () => Promise<boolean>,
  options?: Partial<HealthCheckConfig>
): HealthCheckConfig {
  return {
    name,
    check: async () => {
      const isHealthy = await checkFn();
      return {
        status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        duration: 0,
      };
    },
    ...options,
  };
}
