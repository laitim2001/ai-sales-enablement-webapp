import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 性能指標接口
export interface PerformanceMetric {
  id?: number
  endpoint: string
  method: string
  duration: number
  response_size: number
  status_code: number
  user_id?: number
  timestamp: Date
  memory_usage?: number
  cpu_usage?: number
  cache_hit?: boolean
  error_message?: string
}

// 性能監控類
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private batchSize = 100
  private flushInterval = 30000 // 30秒

  private constructor() {
    // 定期批量寫入數據庫
    setInterval(() => {
      this.flushMetrics()
    }, this.flushInterval)
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 記錄性能指標
  async trackMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
      memory_usage: this.getMemoryUsage(),
    }

    this.metrics.push(fullMetric)

    // 如果達到批量大小，立即寫入
    if (this.metrics.length >= this.batchSize) {
      await this.flushMetrics()
    }

    // 檢查性能警報
    this.checkPerformanceAlerts(fullMetric)
  }

  // 批量寫入指標到數據庫
  private async flushMetrics() {
    if (this.metrics.length === 0) return

    try {
      // 創建性能指標表（如果不存在）
      await this.ensureMetricsTable()

      // 批量插入
      const metricsToFlush = [...this.metrics]
      this.metrics = []

      await prisma.$executeRaw`
        INSERT INTO performance_metrics (
          endpoint, method, duration, response_size, status_code,
          user_id, timestamp, memory_usage, cpu_usage, cache_hit, error_message
        ) VALUES ${metricsToFlush.map(m => `(
          ${m.endpoint}, ${m.method}, ${m.duration}, ${m.response_size}, ${m.status_code},
          ${m.user_id || null}, ${m.timestamp}, ${m.memory_usage || null},
          ${m.cpu_usage || null}, ${m.cache_hit || false}, ${m.error_message || null}
        )`).join(', ')}
      `

      console.log(`Flushed ${metricsToFlush.length} performance metrics`)
    } catch (error) {
      console.error('Failed to flush performance metrics:', error)
      // 將指標放回隊列
      this.metrics.unshift(...metricsToFlush)
    }
  }

  // 確保性能指標表存在
  private async ensureMetricsTable() {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id SERIAL PRIMARY KEY,
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          duration INTEGER NOT NULL,
          response_size INTEGER,
          status_code INTEGER NOT NULL,
          user_id INTEGER,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          memory_usage BIGINT,
          cpu_usage FLOAT,
          cache_hit BOOLEAN DEFAULT FALSE,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint_timestamp
        ON performance_metrics (endpoint, timestamp DESC)
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration
        ON performance_metrics (duration DESC)
      `
    } catch (error) {
      console.error('Failed to ensure metrics table:', error)
    }
  }

  // 獲取內存使用情況
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  // 檢查性能警報
  private checkPerformanceAlerts(metric: PerformanceMetric) {
    // API 響應時間警報
    if (metric.duration > 2000) { // 2秒
      console.warn(`Slow API detected: ${metric.endpoint} took ${metric.duration}ms`)
    }

    // 大響應警報
    if (metric.response_size > 1024 * 1024) { // 1MB
      console.warn(`Large response: ${metric.endpoint} returned ${metric.response_size} bytes`)
    }

    // 錯誤狀態碼警報
    if (metric.status_code >= 500) {
      console.error(`Server error: ${metric.endpoint} returned ${metric.status_code}`)
    }
  }

  // 獲取性能報告
  async getPerformanceReport(timeRange: string = '24h'): Promise<any> {
    const timeCondition = this.getTimeCondition(timeRange)

    try {
      const result = await prisma.$queryRaw`
        SELECT
          endpoint,
          COUNT(*) as request_count,
          AVG(duration) as avg_duration,
          MIN(duration) as min_duration,
          MAX(duration) as max_duration,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration) as median_duration,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration,
          AVG(response_size) as avg_response_size,
          SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as cache_hit_rate,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as error_rate
        FROM performance_metrics
        WHERE timestamp >= ${timeCondition}
        GROUP BY endpoint
        ORDER BY avg_duration DESC
      `

      return result
    } catch (error) {
      console.error('Failed to get performance report:', error)
      return []
    }
  }

  // 獲取實時指標
  async getRealTimeMetrics(): Promise<any> {
    try {
      const result = await prisma.$queryRaw`
        SELECT
          AVG(duration) as avg_response_time,
          COUNT(*) as total_requests,
          SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as cache_hit_rate,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as error_rate,
          AVG(memory_usage) as avg_memory_usage
        FROM performance_metrics
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
      `

      return result[0] || {}
    } catch (error) {
      console.error('Failed to get real-time metrics:', error)
      return {}
    }
  }

  // 獲取時間條件
  private getTimeCondition(timeRange: string): Date {
    const now = new Date()
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  // 清理舊數據
  async cleanup(retentionDays: number = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const result = await prisma.$executeRaw`
        DELETE FROM performance_metrics
        WHERE timestamp < ${cutoffDate}
      `

      console.log(`Cleaned up performance metrics older than ${retentionDays} days`)
      return result
    } catch (error) {
      console.error('Failed to cleanup performance metrics:', error)
    }
  }
}

// 性能中間件
export function withPerformanceTracking(handler: Function) {
  return async function (request: NextRequest, ...args: any[]) {
    const startTime = Date.now()
    const monitor = PerformanceMonitor.getInstance()

    let response: NextResponse
    let error: Error | null = null

    try {
      response = await handler(request, ...args)
    } catch (err) {
      error = err as Error
      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // 獲取用戶ID（如果可用）
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    let userId: number | undefined

    try {
      if (token) {
        // 解析用戶ID（簡化版本）
        const payload = JSON.parse(atob(token.split('.')[1]))
        userId = payload.userId
      }
    } catch {
      // 忽略token解析錯誤
    }

    // 記錄性能指標
    await monitor.trackMetric({
      endpoint: new URL(request.url).pathname,
      method: request.method,
      duration,
      response_size: response ? JSON.stringify(response).length : 0,
      status_code: response.status,
      user_id: userId,
      cache_hit: response.headers.get('X-Cache') === 'HIT',
      error_message: error?.message
    })

    // 添加性能headers
    if (response) {
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Memory-Usage', `${PerformanceMonitor.getInstance()['getMemoryUsage']()}`)
    }

    return response
  }
}

// Core Web Vitals 追蹤
export class CoreWebVitalsTracker {
  static trackMetric(name: string, value: number, id: string) {
    // 發送到分析服務
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        non_interaction: true,
      })
    }

    // 也可以發送到自定義分析端點
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, value, id })
    }).catch(console.error)
  }
}

export default PerformanceMonitor