/**
 * 系統監控初始化配置
 *
 * 功能：
 * - 啟動連接狀態監控服務
 * - 配置監控參數和警報閾值
 * - 提供監控生命周期管理
 * - 整合速率限制統計監控
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { startGlobalMonitoring, stopGlobalMonitoring, getConnectionMonitor } from './connection-monitor';

// 監控配置介面
interface MonitorConfig {
  enabled: boolean;
  healthCheckInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    consecutiveErrors: number;
  };
  notifications: {
    email: boolean;
    webhook: boolean;
    console: boolean;
  };
}

// 默認監控配置
const DEFAULT_CONFIG: MonitorConfig = {
  enabled: process.env.NODE_ENV === 'production',
  healthCheckInterval: 30000, // 30秒
  alertThresholds: {
    responseTime: 2000, // 2秒
    errorRate: 10, // 10%
    consecutiveErrors: 5 // 連續5次錯誤
  },
  notifications: {
    email: false,
    webhook: false,
    console: true
  }
};

// 全局監控狀態
let monitoringStarted = false;
let currentConfig: MonitorConfig = DEFAULT_CONFIG;

/**
 * 初始化系統監控
 *
 * @param config 監控配置選項
 */
export function initializeMonitoring(config?: Partial<MonitorConfig>): void {
  // 合併配置
  currentConfig = { ...DEFAULT_CONFIG, ...config };

  // 記錄初始化信息
  console.log('🔍 系統監控初始化中...', {
    enabled: currentConfig.enabled,
    interval: currentConfig.healthCheckInterval,
    environment: process.env.NODE_ENV
  });

  // 如果監控已啟用，開始監控
  if (currentConfig.enabled && !monitoringStarted) {
    startSystemMonitoring();
  }

  // 設置優雅關閉處理
  setupGracefulShutdown();
}

/**
 * 啟動系統監控
 */
export function startSystemMonitoring(): void {
  if (monitoringStarted) {
    console.log('⚠️ 系統監控已經在運行中');
    return;
  }

  try {
    // 啟動連接監控
    startGlobalMonitoring();

    // 設置監控狀態
    monitoringStarted = true;

    console.log('✅ 系統監控已啟動', {
      interval: currentConfig.healthCheckInterval,
      thresholds: currentConfig.alertThresholds
    });

    // 設置警報處理
    setupAlertHandling();

  } catch (error) {
    console.error('❌ 系統監控啟動失敗:', error);
    throw error;
  }
}

/**
 * 停止系統監控
 */
export function stopSystemMonitoring(): void {
  if (!monitoringStarted) {
    console.log('⚠️ 系統監控未運行');
    return;
  }

  try {
    // 停止連接監控
    stopGlobalMonitoring();

    // 重置監控狀態
    monitoringStarted = false;

    console.log('⏹️ 系統監控已停止');

  } catch (error) {
    console.error('❌ 系統監控停止失敗:', error);
  }
}

/**
 * 獲取監控狀態
 */
export function getMonitoringStatus(): {
  started: boolean;
  config: MonitorConfig;
  uptime: number;
} {
  return {
    started: monitoringStarted,
    config: currentConfig,
    uptime: monitoringStarted ? Date.now() : 0
  };
}

/**
 * 更新監控配置
 */
export function updateMonitoringConfig(newConfig: Partial<MonitorConfig>): void {
  const oldConfig = { ...currentConfig };
  currentConfig = { ...currentConfig, ...newConfig };

  console.log('🔧 監控配置已更新', {
    old: oldConfig,
    new: currentConfig
  });

  // 如果啟用狀態發生變化，重新啟動或停止監控
  if (oldConfig.enabled !== currentConfig.enabled) {
    if (currentConfig.enabled) {
      startSystemMonitoring();
    } else {
      stopSystemMonitoring();
    }
  }
}

/**
 * 設置警報處理
 */
function setupAlertHandling(): void {
  // 這裡可以設置定期檢查和警報邏輯
  setInterval(async () => {
    try {
      const monitor = getConnectionMonitor();
      const systemHealth = monitor.getSystemHealth();

      // 檢查是否需要發送警報
      checkAndSendAlerts(systemHealth);

    } catch (error) {
      console.error('警報檢查失敗:', error);
    }
  }, currentConfig.healthCheckInterval);
}

/**
 * 檢查並發送警報
 */
function checkAndSendAlerts(systemHealth: any): void {
  // 檢查整體系統狀態
  if (systemHealth.overallStatus === 'DOWN') {
    sendAlert('SYSTEM_DOWN', '系統整體狀態異常', {
      downServices: systemHealth.downServices,
      timestamp: new Date().toISOString()
    });
  }

  // 檢查各個服務
  systemHealth.services?.forEach((service: any) => {
    // 檢查響應時間
    if (service.averageResponseTime > currentConfig.alertThresholds.responseTime) {
      sendAlert('HIGH_RESPONSE_TIME', `服務 ${service.service} 響應時間過長`, {
        service: service.service,
        responseTime: service.averageResponseTime,
        threshold: currentConfig.alertThresholds.responseTime
      });
    }

    // 檢查錯誤率
    if (service.errorCount >= currentConfig.alertThresholds.consecutiveErrors) {
      sendAlert('HIGH_ERROR_RATE', `服務 ${service.service} 錯誤率過高`, {
        service: service.service,
        errorCount: service.errorCount,
        threshold: currentConfig.alertThresholds.consecutiveErrors
      });
    }
  });
}

/**
 * 發送警報
 */
function sendAlert(type: string, message: string, data: any): void {
  const alert = {
    type,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  // 控制台通知
  if (currentConfig.notifications.console) {
    console.warn('🚨 系統警報:', alert);
  }

  // 郵件通知（需要實現）
  if (currentConfig.notifications.email) {
    // TODO: 實現郵件通知
    console.log('📧 發送郵件警報:', alert);
  }

  // Webhook通知（需要實現）
  if (currentConfig.notifications.webhook) {
    // TODO: 實現Webhook通知
    console.log('🔗 發送Webhook警報:', alert);
  }
}

/**
 * 設置優雅關閉處理
 */
function setupGracefulShutdown(): void {
  const shutdownHandler = () => {
    console.log('🔄 正在優雅關閉系統監控...');
    stopSystemMonitoring();
    process.exit(0);
  };

  // 監聽關閉信號
  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGQUIT', shutdownHandler);

  // 監聽未處理的異常
  process.on('uncaughtException', (error) => {
    console.error('❌ 未處理的異常:', error);
    stopSystemMonitoring();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未處理的Promise拒絕:', reason, 'at:', promise);
    stopSystemMonitoring();
    process.exit(1);
  });
}

/**
 * 健康檢查端點助手
 */
export async function performHealthCheck(): Promise<{
  status: string;
  timestamp: string;
  details?: any;
}> {
  try {
    const monitor = getConnectionMonitor();
    const systemHealth = monitor.getSystemHealth();

    return {
      status: systemHealth.overallStatus,
      timestamp: new Date().toISOString(),
      details: {
        summary: systemHealth,
        monitoring: getMonitoringStatus()
      }
    };
  } catch (error) {
    return {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// 導出配置和狀態
export { currentConfig as monitoringConfig, monitoringStarted };

// 自動初始化（僅在生產環境）
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 生產環境檢測到，自動初始化系統監控...');
  initializeMonitoring();
}