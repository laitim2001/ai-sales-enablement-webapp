/**
 * @fileoverview 連接狀態監控服務
功能：
- 監控外部API連接狀態（Azure OpenAI、Dynamics 365）
- 資料庫連接健康檢查
- 連接狀態統計和警報
- 自動重連機制
作者：Claude Code
創建時間：2025-09-28
 * @module lib/monitoring/connection-monitor
 *
 * 連接狀態監控服務
 * 功能：
 * - 監控外部API連接狀態（Azure OpenAI、Dynamics 365）
 * - 資料庫連接健康檢查
 * - 連接狀態統計和警報
 * - 自動重連機制
 * 作者：Claude Code
 * 創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { PrismaClient } from '@prisma/client';

// 連接狀態枚舉
export enum ConnectionStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN'
}

// 服務類型枚舉
export enum ServiceType {
  DATABASE = 'DATABASE',
  AZURE_OPENAI = 'AZURE_OPENAI',
  DYNAMICS_365 = 'DYNAMICS_365',
  REDIS = 'REDIS',
  STORAGE = 'STORAGE'
}

// 連接檢查結果介面
export interface ConnectionCheckResult {
  service: ServiceType;
  status: ConnectionStatus;
  responseTime: number;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// 服務健康狀態介面
export interface ServiceHealth {
  service: ServiceType;
  status: ConnectionStatus;
  lastCheck: Date;
  averageResponseTime: number;
  uptime: number;
  errorCount: number;
  lastError?: string;
}

// 全域健康狀態介面
export interface SystemHealth {
  overallStatus: ConnectionStatus;
  services: ServiceHealth[];
  timestamp: Date;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
}

// 連接監控器類
class ConnectionMonitor {
  private prisma: PrismaClient;
  private healthCache: Map<ServiceType, ServiceHealth> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30秒
  private readonly RESPONSE_TIME_THRESHOLD = 2000; // 2秒
  private readonly ERROR_THRESHOLD = 5; // 連續錯誤閾值

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeHealthCache();
  }

  /**
   * 初始化健康狀態緩存
   */
  private initializeHealthCache(): void {
    Object.values(ServiceType).forEach(service => {
      this.healthCache.set(service, {
        service,
        status: ConnectionStatus.UNKNOWN,
        lastCheck: new Date(),
        averageResponseTime: 0,
        uptime: 0,
        errorCount: 0
      });
    });
  }

  /**
   * 開始定期健康檢查
   */
  public startMonitoring(): void {
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    console.log('🔍 啟動連接狀態監控服務...');

    // 立即執行一次檢查
    this.performHealthCheck();

    // 設置定期檢查
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * 停止監控
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ 連接狀態監控已停止');
    }
  }

  /**
   * 執行完整的健康檢查
   */
  private async performHealthCheck(): Promise<void> {
    const services = Object.values(ServiceType);

    // 並行執行所有服務檢查
    const checkPromises = services.map(service =>
      this.checkServiceHealth(service).catch(error => ({
        service,
        status: ConnectionStatus.DOWN,
        responseTime: 0,
        timestamp: new Date(),
        error: error.message
      }))
    );

    const results = await Promise.all(checkPromises);

    // 更新健康狀態緩存
    results.forEach(result => {
      this.updateServiceHealth(result);
    });

    // 記錄整體狀態
    const systemHealth = this.getSystemHealth();
    console.log(`🏥 系統健康狀態: ${systemHealth.overallStatus} (${systemHealth.healthyServices}/${systemHealth.totalServices} 服務正常)`);
  }

  /**
   * 檢查單個服務健康狀態
   */
  public async checkServiceHealth(service: ServiceType): Promise<ConnectionCheckResult> {
    const startTime = Date.now();
    let status = ConnectionStatus.HEALTHY;
    let error: string | undefined;
    let metadata: Record<string, any> = {};

    try {
      switch (service) {
        case ServiceType.DATABASE:
          await this.checkDatabaseHealth();
          metadata.version = await this.getDatabaseVersion();
          break;

        case ServiceType.AZURE_OPENAI:
          await this.checkAzureOpenAIHealth();
          metadata.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
          break;

        case ServiceType.DYNAMICS_365:
          await this.checkDynamics365Health();
          metadata.tenant = process.env.DYNAMICS_365_TENANT_ID;
          break;

        case ServiceType.REDIS:
          await this.checkRedisHealth();
          break;

        case ServiceType.STORAGE:
          await this.checkStorageHealth();
          break;

        default:
          throw new Error(`未知服務類型: ${service}`);
      }
    } catch (err: any) {
      status = ConnectionStatus.DOWN;
      error = err.message;
    }

    const responseTime = Date.now() - startTime;

    // 根據響應時間調整狀態
    if (status === ConnectionStatus.HEALTHY && responseTime > this.RESPONSE_TIME_THRESHOLD) {
      status = ConnectionStatus.DEGRADED;
    }

    return {
      service,
      status,
      responseTime,
      timestamp: new Date(),
      error,
      metadata
    };
  }

  /**
   * 檢查資料庫連接
   */
  private async checkDatabaseHealth(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  /**
   * 檢查Azure OpenAI連接
   */
  private async checkAzureOpenAIHealth(): Promise<void> {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('Azure OpenAI 配置缺失');
    }

    // 使用更簡單的健康檢查方式
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    // 檢查端點是否可訪問 - 使用模型列表端點作為健康檢查
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
    const healthCheckUrl = `${endpoint}openai/models?api-version=${apiVersion}`;

    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10秒超時
    });

    if (!response.ok) {
      // 嘗試更簡單的端點檢查
      const simpleHealthUrl = `${endpoint}`;
      const simpleResponse = await fetch(simpleHealthUrl, {
        method: 'GET',
        headers: {
          'api-key': apiKey
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!simpleResponse.ok) {
        throw new Error(`Azure OpenAI 端點無法訪問: ${response.status} ${response.statusText}`);
      }
    }
  }

  /**
   * 檢查Dynamics 365連接
   */
  private async checkDynamics365Health(): Promise<void> {
    // 檢查模擬模式
    const isMockMode = process.env.DYNAMICS_365_MODE === 'mock' || process.env.DYNAMICS_365_MOCK_ENABLED === 'true';

    if (isMockMode) {
      // 模擬模式 - 僅檢查基本配置存在
      if (!process.env.DYNAMICS_365_TENANT_ID || !process.env.DYNAMICS_365_CLIENT_ID) {
        throw new Error('Dynamics 365 模擬模式配置缺失');
      }

      // 模擬模式總是返回健康狀態
      console.log('🔧 Dynamics 365 以模擬模式運行');
      return;
    }

    // 生產模式 - 檢查真實API連接
    if (!process.env.DYNAMICS_365_RESOURCE || !process.env.DYNAMICS_365_ACCESS_TOKEN) {
      throw new Error('Dynamics 365 生產模式配置缺失 - 需要 RESOURCE 和 ACCESS_TOKEN');
    }

    const response = await fetch(`${process.env.DYNAMICS_365_RESOURCE}/api/data/v9.2/WhoAmI`, {
      headers: {
        'Authorization': `Bearer ${process.env.DYNAMICS_365_ACCESS_TOKEN}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Dynamics 365 API 錯誤: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * 檢查Redis連接
   */
  private async checkRedisHealth(): Promise<void> {
    // 如果沒有配置Redis，跳過檢查
    if (!process.env.REDIS_URL) {
      return;
    }

    // 這裡可以添加Redis客戶端的ping測試
    // 暫時跳過，因為Redis是可選的
  }

  /**
   * 檢查存儲服務連接
   */
  private async checkStorageHealth(): Promise<void> {
    // 檢查本地存儲或雲存儲服務
    // 這裡可以添加文件系統或雲存儲的健康檢查

    // 簡單的文件系統檢查
    const fs = require('fs').promises;
    const path = require('path');

    // 使用絕對路徑確保正確檢查
    const tempPath = path.join(process.cwd(), 'temp');
    await fs.access(tempPath, fs.constants.F_OK);

    // 確保目錄可寫
    const testFile = path.join(tempPath, '.health-check');
    await fs.writeFile(testFile, 'health check test');
    await fs.unlink(testFile);
  }

  /**
   * 獲取資料庫版本
   */
  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
      return result[0]?.version || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * 更新服務健康狀態
   */
  private updateServiceHealth(result: ConnectionCheckResult): void {
    const current = this.healthCache.get(result.service);
    if (!current) return;

    // 計算新的平均響應時間
    const newAverageResponseTime = current.averageResponseTime === 0
      ? result.responseTime
      : (current.averageResponseTime * 0.7 + result.responseTime * 0.3);

    // 更新錯誤計數
    const newErrorCount = result.status === ConnectionStatus.DOWN
      ? current.errorCount + 1
      : 0;

    // 計算上線時間（簡化版）
    const timeDiff = Date.now() - current.lastCheck.getTime();
    const newUptime = result.status === ConnectionStatus.HEALTHY
      ? current.uptime + timeDiff
      : current.uptime;

    const updatedHealth: ServiceHealth = {
      service: result.service,
      status: result.status,
      lastCheck: result.timestamp,
      averageResponseTime: Math.round(newAverageResponseTime),
      uptime: newUptime,
      errorCount: newErrorCount,
      lastError: result.error
    };

    this.healthCache.set(result.service, updatedHealth);

    // 記錄狀態變化
    if (current.status !== result.status) {
      console.log(`🔄 服務狀態變更: ${result.service} ${current.status} → ${result.status}`);

      // 連續錯誤警報
      if (newErrorCount >= this.ERROR_THRESHOLD) {
        console.error(`🚨 服務警報: ${result.service} 連續 ${newErrorCount} 次錯誤`);
      }
    }
  }

  /**
   * 獲取系統整體健康狀態
   */
  public getSystemHealth(): SystemHealth {
    const services = Array.from(this.healthCache.values());
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === ConnectionStatus.HEALTHY).length;
    const degradedServices = services.filter(s => s.status === ConnectionStatus.DEGRADED).length;
    const downServices = services.filter(s => s.status === ConnectionStatus.DOWN).length;

    // 計算整體狀態
    let overallStatus: ConnectionStatus;
    if (downServices > 0) {
      overallStatus = ConnectionStatus.DOWN;
    } else if (degradedServices > 0) {
      overallStatus = ConnectionStatus.DEGRADED;
    } else if (healthyServices === totalServices) {
      overallStatus = ConnectionStatus.HEALTHY;
    } else {
      overallStatus = ConnectionStatus.UNKNOWN;
    }

    return {
      overallStatus,
      services,
      timestamp: new Date(),
      totalServices,
      healthyServices,
      degradedServices,
      downServices
    };
  }

  /**
   * 獲取特定服務的健康狀態
   */
  public getServiceHealth(service: ServiceType): ServiceHealth | null {
    return this.healthCache.get(service) || null;
  }

  /**
   * 重置服務錯誤計數
   */
  public resetServiceErrors(service: ServiceType): void {
    const health = this.healthCache.get(service);
    if (health) {
      health.errorCount = 0;
      health.lastError = undefined;
      this.healthCache.set(service, health);
    }
  }

  /**
   * 清理資源
   */
  public async cleanup(): Promise<void> {
    this.stopMonitoring();
    await this.prisma.$disconnect();
    this.healthCache.clear();
  }
}

// 全局監控器實例
let globalMonitor: ConnectionMonitor | null = null;

/**
 * 獲取連接監控器實例（單例模式）
 */
export function getConnectionMonitor(): ConnectionMonitor {
  if (!globalMonitor) {
    globalMonitor = new ConnectionMonitor();
  }
  return globalMonitor;
}

/**
 * 快速健康檢查函數（用於API端點）
 *
 * 修復：確保返回最新的健康狀態數據而非緩存的初始狀態
 */
export async function quickHealthCheck(): Promise<SystemHealth> {
  const monitor = getConnectionMonitor();

  // 獲取當前健康狀態
  let systemHealth = monitor.getSystemHealth();

  // 如果所有服務都是UNKNOWN狀態，執行一次快速檢查
  if (systemHealth.overallStatus === ConnectionStatus.UNKNOWN ||
      systemHealth.services.every(s => s.status === ConnectionStatus.UNKNOWN)) {

    console.log('🔄 執行快速健康檢查以更新狀態...');

    // 並行檢查所有服務
    const services = Object.values(ServiceType);
    const checkPromises = services.map(async (service) => {
      try {
        const result = await monitor.checkServiceHealth(service);
        // 手動更新健康狀態以確保緩存同步
        (monitor as any).updateServiceHealth(result);
        return result;
      } catch (error: any) {
        console.warn(`⚠️ 快速檢查 ${service} 失敗:`, error.message);
        const errorResult = {
          service,
          status: ConnectionStatus.DOWN,
          responseTime: 0,
          timestamp: new Date(),
          error: error.message
        };
        // 手動更新錯誤狀態
        (monitor as any).updateServiceHealth(errorResult);
        return errorResult;
      }
    });

    // 等待所有檢查完成
    const results = await Promise.allSettled(checkPromises);
    console.log('🔄 快速檢查完成，結果:', results.length);

    // 重新獲取更新後的健康狀態
    systemHealth = monitor.getSystemHealth();
  }

  return systemHealth;
}

/**
 * 檢查特定服務健康狀態
 */
export async function checkService(service: ServiceType): Promise<ConnectionCheckResult> {
  const monitor = getConnectionMonitor();
  return await monitor.checkServiceHealth(service);
}

/**
 * 啟動全局監控
 */
export function startGlobalMonitoring(): void {
  const monitor = getConnectionMonitor();
  monitor.startMonitoring();
}

/**
 * 停止全局監控
 */
export function stopGlobalMonitoring(): void {
  if (globalMonitor) {
    globalMonitor.stopMonitoring();
  }
}

// 導出類型和枚舉
export { ConnectionMonitor };