/**
 * @fileoverview 系統健康檢查 API 路由功能：- 提供系統整體健康狀態- 各服務連接狀態監控- 性能指標統計- 健康檢查端點作者：Claude Code創建時間：2025-09-28
 * @module app/api/health/route
 * @description
 * 系統健康檢查 API 路由功能：- 提供系統整體健康狀態- 各服務連接狀態監控- 性能指標統計- 健康檢查端點作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnectionMonitor, quickHealthCheck, ServiceType, ConnectionStatus } from '@/lib/monitoring/connection-monitor';

/**
 * 獲取系統健康狀態
 *
 * @param request HTTP請求對象
 * @returns JSON格式的健康狀態
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const service = searchParams.get('service') as ServiceType;

    // 如果請求特定服務
    if (service && Object.values(ServiceType).includes(service)) {
      const monitor = getConnectionMonitor();
      const serviceHealth = monitor.getServiceHealth(service);

      if (!serviceHealth) {
        return NextResponse.json({
          success: false,
          error: 'SERVICE_NOT_FOUND',
          message: '服務不存在'
        }, { status: 404 });
      }

      // 執行實時檢查
      const realtimeCheck = await monitor.checkServiceHealth(service);

      return NextResponse.json({
        success: true,
        data: {
          service,
          currentStatus: serviceHealth,
          realtimeCheck,
          isHealthy: realtimeCheck.status === ConnectionStatus.HEALTHY
        },
        timestamp: new Date().toISOString()
      });
    }

    // 獲取系統整體健康狀態
    const systemHealth = await quickHealthCheck();

    // 基本響應
    const response = {
      success: true,
      data: {
        status: systemHealth.overallStatus,
        healthy: systemHealth.overallStatus === ConnectionStatus.HEALTHY,
        summary: {
          total: systemHealth.totalServices,
          healthy: systemHealth.healthyServices,
          degraded: systemHealth.degradedServices,
          down: systemHealth.downServices
        },
        timestamp: systemHealth.timestamp
      }
    };

    // 詳細響應
    if (detailed) {
      (response.data as any).services = systemHealth.services.map(service => ({
        name: service.service,
        status: service.status,
        lastCheck: service.lastCheck,
        responseTime: service.averageResponseTime,
        errorCount: service.errorCount,
        uptime: formatUptime(service.uptime),
        lastError: service.lastError
      }));

      // 添加性能指標
      (response.data as any).metrics = {
        averageResponseTime: calculateAverageResponseTime(systemHealth.services),
        totalUptime: calculateTotalUptime(systemHealth.services),
        errorRate: calculateErrorRate(systemHealth.services)
      };
    }

    // 根據健康狀態設置HTTP狀態碼
    const httpStatus = getHttpStatusFromHealth(systemHealth.overallStatus);

    return NextResponse.json(response, { status: httpStatus });

  } catch (error: any) {
    console.error('健康檢查失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'HEALTH_CHECK_FAILED',
      message: '健康檢查失敗',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * 觸發健康檢查
 *
 * @param request HTTP請求對象
 * @returns 執行結果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { service, action } = await request.json();

    const monitor = getConnectionMonitor();

    if (action === 'check') {
      // 執行健康檢查
      if (service && Object.values(ServiceType).includes(service)) {
        // 檢查特定服務
        const result = await monitor.checkServiceHealth(service);

        return NextResponse.json({
          success: true,
          data: {
            service,
            result,
            message: `${service} 服務檢查完成`
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // 檢查所有服務
        const promises = Object.values(ServiceType).map(async (svc) => {
          try {
            const result = await monitor.checkServiceHealth(svc);
            return { service: svc, result, success: true };
          } catch (error: any) {
            return { service: svc, error: error.message, success: false };
          }
        });

        const results = await Promise.all(promises);

        return NextResponse.json({
          success: true,
          data: {
            results,
            message: '所有服務檢查完成'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    if (action === 'reset' && service) {
      // 重置服務錯誤計數
      if (Object.values(ServiceType).includes(service)) {
        monitor.resetServiceErrors(service);

        return NextResponse.json({
          success: true,
          data: {
            service,
            message: `${service} 服務錯誤計數已重置`
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'INVALID_ACTION',
      message: '無效的操作或參數'
    }, { status: 400 });

  } catch (error: any) {
    console.error('健康檢查操作失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'OPERATION_FAILED',
      message: '操作失敗',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * 根據健康狀態獲取HTTP狀態碼
 */
function getHttpStatusFromHealth(status: ConnectionStatus): number {
  switch (status) {
    case ConnectionStatus.HEALTHY:
      return 200;
    case ConnectionStatus.DEGRADED:
      return 206; // Partial Content
    case ConnectionStatus.DOWN:
      return 503; // Service Unavailable
    case ConnectionStatus.UNKNOWN:
    default:
      return 503;
  }
}

/**
 * 計算平均響應時間
 */
function calculateAverageResponseTime(services: any[]): number {
  if (services.length === 0) return 0;

  const total = services.reduce((sum, service) => sum + service.averageResponseTime, 0);
  return Math.round(total / services.length);
}

/**
 * 計算總運行時間
 */
function calculateTotalUptime(services: any[]): string {
  if (services.length === 0) return '0s';

  const totalMs = services.reduce((sum, service) => sum + service.uptime, 0);
  return formatUptime(totalMs);
}

/**
 * 計算錯誤率
 */
function calculateErrorRate(services: any[]): number {
  if (services.length === 0) return 0;

  const totalErrors = services.reduce((sum, service) => sum + service.errorCount, 0);
  const totalChecks = services.length * 100; // 假設每個服務進行了100次檢查

  return totalChecks > 0 ? Math.round((totalErrors / totalChecks) * 100 * 100) / 100 : 0;
}

/**
 * 格式化運行時間
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}