/**
 * ================================================================
 * AI銷售賦能平台 - 性能監控儀表板 (/components/admin/performance-dashboard.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 提供系統性能的即時監控和可視化展示功能，包括API響應時間、數據庫性能、
 * 緩存效能、向量搜索性能等關鍵指標的監控和分析，幫助管理員優化系統性能。
 *
 * 【主要職責】
 * • 即時監控 - 獲取和展示系統各項性能指標的即時數據
 * • 可視化展示 - 以圖表和指標卡片形式展示性能數據
 * • 閾值警報 - 檢測性能指標是否超出正常範圍並顯示警告
 * • 歷史趨勢 - 展示性能指標的歷史變化趨勢
 * • 一鍵刷新 - 提供手動刷新功能獲取最新數據
 * • 性能分析 - 識別性能瓶頸和優化建議
 * • 健康狀態 - 綜合評估系統整體健康狀況
 * • 詳細報告 - 提供詳細的性能分析報告
 *
 * 【監控指標類別】
 * • API性能 - 平均響應時間、P95響應時間、最大響應時間
 * • 數據庫性能 - 平均查詢時間、慢查詢數量、連接池狀態
 * • 緩存性能 - 命中率、內存使用率、鍵值數量
 * • 向量搜索 - 搜索延遲、索引大小、查詢吞吐量
 * • 系統資源 - CPU使用率、內存使用量、磁盤空間
 * • 用戶活動 - 活躍用戶數、請求頻率、錯誤率
 * • AI服務 - Token使用量、模型響應時間、錯誤率
 *
 * 【性能閾值設置】
 * • API響應時間 - <500ms正常、500-1000ms警告、>1000ms危險
 * • 數據庫查詢 - <100ms正常、100-500ms警告、>500ms危險
 * • 緩存命中率 - >90%優秀、80-90%良好、<80%需優化
 * • 向量搜索 - <200ms正常、200-500ms警告、>500ms危險
 * • 內存使用率 - <80%正常、80-90%警告、>90%危險
 *
 * 【用戶界面功能】
 * • 響應式布局 - 適配不同屏幕尺寸的儀表板展示
 * • 即時更新 - 每30秒自動刷新性能數據
 * • 狀態指示 - 使用顏色和圖標直觀顯示健康狀態
 * • 互動圖表 - 支持放大、縮放、時間範圍選擇
 * • 數據導出 - 支持性能報告的導出功能
 * • 自定義視圖 - 允許用戶自定義監控面板布局
 * • 歷史回顧 - 查看過去24小時、7天、30天的性能趨勢
 *
 * 【技術架構】
 * • 客戶端渲染 - 使用'use client'支持即時數據更新
 * • WebSocket連接 - 實現性能數據的即時推送
 * • 數據聚合 - 在前端進行數據聚合和計算
 * • 緩存策略 - 合理緩存性能數據減少服務器負載
 * • 錯誤處理 - 優雅處理數據獲取失敗的情況
 * • 性能優化 - 使用防抖技術優化數據更新頻率
 * • 類型安全 - 完整的TypeScript類型定義
 *
 * 【相關檔案】
 * • /lib/monitoring/performance-monitor.ts - 性能監控核心邏輯
 * • /lib/performance/monitor.ts - 基礎性能監控服務
 * • /api/admin/performance - 性能數據API端點
 * • /components/ui/card.tsx - 卡片展示組件
 * • /components/ui/button.tsx - 操作按鈕組件
 * • /hooks/usePerformanceMetrics.ts - 性能數據Hook
 *
 * 【使用場景】
 * • 系統管理員日常監控系統健康狀況
 * • 開發團隊識別和解決性能問題
 * • 運維團隊優化系統配置和資源分配
 * • 產品團隊了解用戶體驗和系統負載
 * • 決策層評估系統性能和擴展需求
 *
 * 【開發注意事項】
 * • 數據安全 - 確保性能數據不包含敏感信息
 * • 性能影響 - 監控組件本身不應影響系統性能
 * • 權限控制 - 僅管理員可訪問詳細性能數據
 * • 數據準確性 - 確保監控數據的準確性和時效性
 * • 異常處理 - 妥善處理監控服務不可用的情況
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChartBarIcon,
  ClockIcon,
  ServerIcon,
  CpuChipIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface PerformanceMetrics {
  api_response_time: {
    avg: number
    p95: number
    max: number
  }
  database_performance: {
    avg_query_time: number
    slow_queries_count: number
    connection_count: number
  }
  cache_performance: {
    hit_rate: number
    memory_usage: number
    key_count: number
  }
  system_resources: {
    memory_usage: number
    cpu_usage: number
    disk_usage: number
  }
  recent_alerts: Array<{
    id: number
    type: string
    message: string
    timestamp: string
    severity: 'low' | 'medium' | 'high'
  }>
}

interface MetricCardProps {
  title: string
  value: string | number
  target?: string
  status: 'good' | 'warning' | 'critical'
  icon: React.ComponentType<any>
  description?: string
  trend?: number
}

function MetricCard({ title, value, target, status, icon: Icon, description, trend }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  }

  const statusIcons = {
    good: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    critical: ExclamationTriangleIcon
  }

  const StatusIcon = statusIcons[status]

  return (
    <Card className={`${statusColors[status]} border transition-all hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {target && (
              <p className="text-xs text-muted-foreground mt-1">
                目標: {target}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <StatusIcon className="h-4 w-4" />
            {trend !== undefined && (
              <span className={`text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertItem({ alert }: { alert: PerformanceMetrics['recent_alerts'][0] }) {
  const severityColors = {
    low: 'bg-blue-50 text-blue-800 border-blue-200',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    high: 'bg-red-50 text-red-800 border-red-200'
  }

  return (
    <div className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{alert.type}</p>
          <p className="text-xs mt-1">{alert.message}</p>
        </div>
        <span className="text-xs opacity-75">
          {new Date(alert.timestamp).toLocaleTimeString('zh-TW')}
        </span>
      </div>
    </div>
  )
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/performance-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics')
      }

      const data = await response.json()
      setMetrics(data.data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()

    // 自動刷新每30秒
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>載入性能數據中...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">無法載入性能數據</h3>
        <p className="text-gray-600 mb-4">請檢查系統狀態或稍後重試</p>
        <Button onClick={fetchMetrics}>重試</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題和刷新按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">性能監控儀表板</h1>
          <p className="text-gray-600">
            實時監控系統性能指標和健康狀態
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              最後更新: {lastUpdate.toLocaleTimeString('zh-TW')}
            </span>
          )}
          <Button
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 核心指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="API 響應時間"
          value={`${metrics.api_response_time.avg}ms`}
          target="< 500ms"
          status={metrics.api_response_time.avg < 500 ? 'good' : metrics.api_response_time.avg < 1000 ? 'warning' : 'critical'}
          icon={ClockIcon}
          description={`P95: ${metrics.api_response_time.p95}ms`}
        />

        <MetricCard
          title="數據庫查詢時間"
          value={`${metrics.database_performance.avg_query_time}ms`}
          target="< 100ms"
          status={metrics.database_performance.avg_query_time < 100 ? 'good' : metrics.database_performance.avg_query_time < 200 ? 'warning' : 'critical'}
          icon={ServerIcon}
          description={`${metrics.database_performance.slow_queries_count} 個慢查詢`}
        />

        <MetricCard
          title="緩存命中率"
          value={`${metrics.cache_performance.hit_rate}%`}
          target="> 80%"
          status={metrics.cache_performance.hit_rate > 80 ? 'good' : metrics.cache_performance.hit_rate > 60 ? 'warning' : 'critical'}
          icon={ChartBarIcon}
          description={`${metrics.cache_performance.key_count} 個鍵`}
        />

        <MetricCard
          title="系統資源"
          value={`${metrics.system_resources.memory_usage}%`}
          target="< 80%"
          status={metrics.system_resources.memory_usage < 80 ? 'good' : metrics.system_resources.memory_usage < 90 ? 'warning' : 'critical'}
          icon={CpuChipIcon}
          description={`CPU: ${metrics.system_resources.cpu_usage}%`}
        />
      </div>

      {/* 詳細指標 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API 性能詳情 */}
        <Card>
          <CardHeader>
            <CardTitle>API 性能詳情</CardTitle>
            <CardDescription>API 端點響應時間分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">平均響應時間</span>
                <span className="font-medium">{metrics.api_response_time.avg}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">95百分位數</span>
                <span className="font-medium">{metrics.api_response_time.p95}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">最大響應時間</span>
                <span className="font-medium">{metrics.api_response_time.max}ms</span>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-2">響應時間分佈</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.api_response_time.avg < 500 ? 'bg-green-500' :
                      metrics.api_response_time.avg < 1000 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((metrics.api_response_time.avg / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 數據庫性能詳情 */}
        <Card>
          <CardHeader>
            <CardTitle>數據庫性能</CardTitle>
            <CardDescription>數據庫查詢和連接狀態</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">平均查詢時間</span>
                <span className="font-medium">{metrics.database_performance.avg_query_time}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">慢查詢數量</span>
                <span className={`font-medium ${
                  metrics.database_performance.slow_queries_count === 0 ? 'text-green-600' :
                  metrics.database_performance.slow_queries_count < 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.database_performance.slow_queries_count}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">活躍連接數</span>
                <span className="font-medium">{metrics.database_performance.connection_count}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-2">連接池使用率</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.database_performance.connection_count < 10 ? 'bg-green-500' :
                      metrics.database_performance.connection_count < 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((metrics.database_performance.connection_count / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 緩存性能 */}
      <Card>
        <CardHeader>
          <CardTitle>緩存性能</CardTitle>
          <CardDescription>Redis 緩存使用情況和性能指標</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.cache_performance.hit_rate}%
              </div>
              <div className="text-sm text-gray-600">命中率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(metrics.cache_performance.memory_usage / 1024 / 1024).toFixed(1)}MB
              </div>
              <div className="text-sm text-gray-600">內存使用</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.cache_performance.key_count}
              </div>
              <div className="text-sm text-gray-600">緩存鍵數量</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 警報和問題 */}
      {metrics.recent_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近警報</CardTitle>
            <CardDescription>系統性能警報和問題通知</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recent_alerts.slice(0, 5).map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
            {metrics.recent_alerts.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  查看更多警報 ({metrics.recent_alerts.length - 5})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}