/**
 * @fileoverview 系統監控組件功能：- 顯示系統整體健康狀態- 各服務連接狀態監控- 速率限制統計顯示- 實時狀態更新作者：Claude Code創建時間：2025-09-28
 * @module components/admin/system-monitor
 * @description
 * 系統監控組件功能：- 顯示系統整體健康狀態- 各服務連接狀態監控- 速率限制統計顯示- 實時狀態更新作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  Server,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Shield
} from 'lucide-react';

// 服務狀態類型
type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

// 系統健康狀態介面
interface SystemHealth {
  status: ServiceStatus;
  healthy: boolean;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  services?: ServiceHealth[];
  metrics?: {
    averageResponseTime: number;
    totalUptime: string;
    errorRate: number;
  };
  timestamp: string;
}

// 服務健康狀態介面
interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  lastCheck: string;
  responseTime: number;
  errorCount: number;
  uptime: string;
  lastError?: string;
}

// 速率限制統計介面
interface RateLimitStats {
  totalKeys: number;
  activeKeys: number;
  topKeys: Array<{
    key: string;
    count: number;
    resetTime: number;
  }>;
}

export default function SystemMonitor() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [rateLimitStats, setRateLimitStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 獲取系統健康狀態
  const fetchSystemHealth = async (showLoading = true) => {
    if (showLoading) setRefreshing(true);

    try {
      const response = await fetch('/api/health?detailed=true');
      const data = await response.json();

      if (data.success) {
        setSystemHealth(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('獲取系統健康狀態失敗:', error);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  // 獲取速率限制統計
  const fetchRateLimitStats = async () => {
    try {
      // 這裡需要實現速率限制統計API
      // const response = await fetch('/api/rate-limit/stats');
      // const data = await response.json();
      // setRateLimitStats(data);

      // 暫時使用模擬數據
      setRateLimitStats({
        totalKeys: 150,
        activeKeys: 45,
        topKeys: [
          { key: 'user:12345', count: 8, resetTime: Date.now() + 300000 },
          { key: 'user:67890', count: 6, resetTime: Date.now() + 200000 },
          { key: 'ip:192.168.1.100', count: 4, resetTime: Date.now() + 400000 }
        ]
      });
    } catch (error) {
      console.error('獲取速率限制統計失敗:', error);
    }
  };

  // 執行服務檢查
  const checkService = async (serviceName: string) => {
    setRefreshing(true);

    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: serviceName,
          action: 'check'
        })
      });

      const data = await response.json();

      if (data.success) {
        // 重新獲取整體狀態
        await fetchSystemHealth(false);
      }
    } catch (error) {
      console.error('檢查服務失敗:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 重置服務錯誤
  const resetServiceErrors = async (serviceName: string) => {
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: serviceName,
          action: 'reset'
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchSystemHealth(false);
      }
    } catch (error) {
      console.error('重置服務錯誤失敗:', error);
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'DEGRADED': return 'text-yellow-600';
      case 'DOWN': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 獲取狀態圖標
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DEGRADED': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'DOWN': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // 獲取服務圖標
  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'DATABASE': return <Database className="h-4 w-4" />;
      case 'AZURE_OPENAI': return <Activity className="h-4 w-4" />;
      case 'DYNAMICS_365': return <Server className="h-4 w-4" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  // 初始化和自動刷新
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchSystemHealth(false),
        fetchRateLimitStats()
      ]);
      setLoading(false);
    };

    initialize();

    // 設置自動刷新
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchSystemHealth(false);
        fetchRateLimitStats();
      }
    }, 30000); // 每30秒刷新

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">載入系統狀態中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 系統狀態總覽 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">系統監控</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSystemHealth()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            自動刷新 {autoRefresh ? '開' : '關'}
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-gray-500">
          最後更新: {lastUpdated.toLocaleString()}
        </p>
      )}

      {/* 整體健康狀態 */}
      {systemHealth && (
        <Alert className={systemHealth.healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <div className="flex items-center">
            {systemHealth.healthy ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className="ml-2">
              系統狀態: {systemHealth.status}
            </AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            {systemHealth.summary.healthy}/{systemHealth.summary.total} 服務正常運行
            {systemHealth.summary.down > 0 && ` • ${systemHealth.summary.down} 服務離線`}
            {systemHealth.summary.degraded > 0 && ` • ${systemHealth.summary.degraded} 服務性能下降`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">服務狀態</TabsTrigger>
          <TabsTrigger value="metrics">性能指標</TabsTrigger>
          <TabsTrigger value="ratelimit">速率限制</TabsTrigger>
        </TabsList>

        {/* 服務狀態 */}
        <TabsContent value="services" className="space-y-4">
          {systemHealth?.services?.map((service) => (
            <Card key={service.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getServiceIcon(service.name)}
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant={service.status === 'HEALTHY' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkService(service.name)}
                      disabled={refreshing}
                    >
                      檢查
                    </Button>
                    {service.errorCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetServiceErrors(service.name)}
                      >
                        重置錯誤
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">響應時間</p>
                    <p className="font-medium">{service.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-500">運行時間</p>
                    <p className="font-medium">{service.uptime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">錯誤數</p>
                    <p className="font-medium">{service.errorCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">最後檢查</p>
                    <p className="font-medium">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {service.lastError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">
                      <strong>最後錯誤:</strong> {service.lastError}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 性能指標 */}
        <TabsContent value="metrics" className="space-y-4">
          {systemHealth?.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">平均響應時間</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemHealth.metrics.averageResponseTime}ms</div>
                  <Progress
                    value={Math.min(systemHealth.metrics.averageResponseTime / 20, 100)}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">系統運行時間</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemHealth.metrics.totalUptime}</div>
                  <p className="text-sm text-gray-500 mt-1">持續運行</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">錯誤率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemHealth.metrics.errorRate}%</div>
                  <Progress
                    value={systemHealth.metrics.errorRate}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 速率限制 */}
        <TabsContent value="ratelimit" className="space-y-4">
          {rateLimitStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      速率限制統計
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>總密鑰數:</span>
                        <span className="font-medium">{rateLimitStats.totalKeys}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>活躍密鑰:</span>
                        <span className="font-medium">{rateLimitStats.activeKeys}</span>
                      </div>
                      <Progress
                        value={(rateLimitStats.activeKeys / rateLimitStats.totalKeys) * 100}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">頂級使用者</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {rateLimitStats.topKeys.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm truncate">{item.key}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{item.count}</Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round((item.resetTime - Date.now()) / 1000 / 60)}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}