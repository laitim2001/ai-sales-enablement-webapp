/**
 * @fileoverview 監控系統初始化器功能：- 在應用程式啟動時自動初始化連接監控服務- 確保健康檢查系統正常工作- 提供監控狀態查詢接口作者：Claude Code創建時間：2025-09-29最後更新：2025-09-29
 * @module lib/startup/monitoring-initializer
 * @description
 * 監控系統初始化器功能：- 在應用程式啟動時自動初始化連接監控服務- 確保健康檢查系統正常工作- 提供監控狀態查詢接口作者：Claude Code創建時間：2025-09-29最後更新：2025-09-29
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { startGlobalMonitoring, stopGlobalMonitoring, getConnectionMonitor } from '@/lib/monitoring/connection-monitor';

/**
 * 監控初始化器類
 *
 * 負責管理整個應用的監控服務生命周期
 */
class MonitoringInitializer {
  private static instance: MonitoringInitializer | null = null;
  private isInitialized = false;
  private initializationTime: Date | null = null;

  /**
   * 獲取單例實例
   */
  static getInstance(): MonitoringInitializer {
    if (!MonitoringInitializer.instance) {
      MonitoringInitializer.instance = new MonitoringInitializer();
    }
    return MonitoringInitializer.instance;
  }

  /**
   * 初始化監控系統
   *
   * 這個方法會：
   * 1. 啟動全局連接監控服務
   * 2. 執行首次健康檢查
   * 3. 設置初始化狀態
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔍 監控系統已經初始化，跳過重複初始化');
      return;
    }

    try {
      console.log('🚀 正在初始化監控系統...');

      // 啟動全局監控
      startGlobalMonitoring();

      // 等待一小段時間讓監控器初始化
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 執行首次健康檢查
      const monitor = getConnectionMonitor();

      console.log('🔍 執行首次健康檢查...');

      // 檢查所有服務
      const services = ['DATABASE', 'AZURE_OPENAI', 'DYNAMICS_365', 'REDIS', 'STORAGE'];
      const healthCheckPromises = services.map(service =>
        monitor.checkServiceHealth(service as any).catch(error => {
          console.warn(`⚠️ 服務 ${service} 初始檢查失敗:`, error.message);
          return null;
        })
      );

      await Promise.all(healthCheckPromises);

      this.isInitialized = true;
      this.initializationTime = new Date();

      console.log('✅ 監控系統初始化完成');
      console.log(`📊 監控開始時間: ${this.initializationTime.toISOString()}`);

      // 輸出系統健康狀況摘要
      const systemHealth = monitor.getSystemHealth();
      console.log(`🏥 系統健康狀況: ${systemHealth.overallStatus} (${systemHealth.healthyServices}/${systemHealth.totalServices} 服務正常)`);

    } catch (error: any) {
      console.error('❌ 監控系統初始化失敗:', error.message);
      console.error('🔧 請檢查服務配置和連接設置');
      throw error;
    }
  }

  /**
   * 停止監控系統
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log('🔍 監控系統未初始化，無需關閉');
      return;
    }

    try {
      console.log('⏹️ 正在關閉監控系統...');

      stopGlobalMonitoring();

      this.isInitialized = false;
      this.initializationTime = null;

      console.log('✅ 監控系統已關閉');
    } catch (error: any) {
      console.error('❌ 監控系統關閉失敗:', error.message);
      throw error;
    }
  }

  /**
   * 檢查初始化狀態
   */
  getInitializationStatus(): {
    initialized: boolean;
    initializationTime: Date | null;
    uptime: number | null;
  } {
    return {
      initialized: this.isInitialized,
      initializationTime: this.initializationTime,
      uptime: this.initializationTime
        ? Date.now() - this.initializationTime.getTime()
        : null
    };
  }

  /**
   * 重新初始化監控系統
   */
  async reinitialize(): Promise<void> {
    console.log('🔄 重新初始化監控系統...');

    await this.shutdown();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒確保完全關閉
    await this.initialize();
  }
}

/**
 * 獲取監控初始化器實例
 */
export function getMonitoringInitializer(): MonitoringInitializer {
  return MonitoringInitializer.getInstance();
}

/**
 * 便捷函數：初始化監控
 */
export async function initializeMonitoring(): Promise<void> {
  const initializer = getMonitoringInitializer();
  await initializer.initialize();
}

/**
 * 便捷函數：關閉監控
 */
export async function shutdownMonitoring(): Promise<void> {
  const initializer = getMonitoringInitializer();
  await initializer.shutdown();
}

/**
 * 便捷函數：獲取監控狀態
 */
export function getMonitoringStatus() {
  const initializer = getMonitoringInitializer();
  return initializer.getInitializationStatus();
}

// 處理進程退出事件，確保監控服務優雅關閉
if (typeof process !== 'undefined') {
  const handleExit = () => {
    console.log('📡 收到程序退出信號，關閉監控系統...');
    shutdownMonitoring().catch(error => {
      console.error('❌ 關閉監控時出錯:', error);
    });
  };

  process.on('SIGTERM', handleExit);
  process.on('SIGINT', handleExit);
  process.on('exit', handleExit);
}