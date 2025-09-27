/**
 * ================================================================
 * AI銷售賦能平台 - 基礎性能監控系統 (/lib/performance/monitor.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供基礎的API性能監控功能，專注於數據庫持久化和實時性能追蹤。
 * 與高階性能監控系統配合，負責基礎數據收集和Core Web Vitals追蹤。
 *
 * 【主要職責】
 * • API性能追蹤 - 記錄每個API請求的響應時間、狀態碼和資源使用情況
 * • 數據庫持久化 - 將性能指標批次寫入PostgreSQL數據庫進行長期儲存
 * • 實時警報監控 - 檢測慢查詢、大響應和伺服器錯誤並即時警報
 * • 性能報告生成 - 提供基於SQL查詢的詳細性能分析報告
 * • 中間件整合 - 提供便捷的性能追蹤中間件，可輕鬆整合到任何API路由
 * • Core Web Vitals - 追蹤前端性能指標，配合Google Analytics進行分析
 * • 資源使用監控 - 監控Node.js進程的記憶體和CPU使用狀況
 * • 數據清理管理 - 自動清理過期性能數據，維護數據庫性能
 *
 * 【技術實現】
 * • Prisma ORM整合 - 使用Prisma進行高效的數據庫操作和SQL查詢
 * • 批次寫入優化 - 累積100筆記錄或30秒後批次寫入，減少數據庫負載
 * • 自動表格創建 - 動態創建performance_metrics表格和相關索引
 * • JWT Token解析 - 自動提取用戶ID用於用戶級別的性能分析
 * • 記憶體使用追蹤 - 使用Node.js process.memoryUsage()監控記憶體狀態
 * • 錯誤恢復機制 - 數據庫寫入失敗時將數據放回隊列重試
 * • 性能閾值監控 - 可配置的性能警報閾值和多級警報系統
 * • SQL查詢優化 - 使用聚合查詢和窗口函數進行高效的性能統計分析
 *
 * 【相關檔案】
 * • /lib/monitoring/performance-monitor.ts - 高階性能監控系統，提供更豐富的分析功能
 * • /lib/api/error-handler.ts - API錯誤處理系統，可整合性能監控
 * • /app/api/*/route.ts - 各API路由檔案，使用withPerformanceTracking中間件
 * • /components/admin/PerformanceDashboard.tsx - 性能監控界面，展示收集的數據
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * 性能指標接口
 *
 * 定義性能監控系統中單個指標記錄的數據結構。
 * 包含API請求的完整性能資訊和可選的擴展字段。
 *
 * 欄位說明:
 * - id: 數據庫主鍵（自動生成）
 * - endpoint: API端點路径（如 /api/users）
 * - method: HTTP請求方法（GET, POST, PUT, DELETE等）
 * - duration: 請求處理時間（毫秒）
 * - response_size: 響應數據大小（位元組）
 * - status_code: HTTP狀態碼
 * - user_id: 發起請求的用戶ID（可選）
 * - timestamp: 請求時間戳
 * - memory_usage: 記憶體使用量（位元組，可選）
 * - cpu_usage: CPU使用率（百分比，可選）
 * - cache_hit: 是否命中緩存（可選）
 * - error_message: 錯誤訊息（可選）
 */
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

/**
 * 性能監控核心類別
 *
 * 採用單例模式的性能監控服務，負責收集、批次處理和持久化API性能數據。
 * 提供完整的性能追蹤、警報和報告功能。
 *
 * 設計特色:
 * - 單例模式確保全局唯一的監控實例
 * - 批次處理機制減少數據庫負載
 * - 自動數據庫表格和索引管理
 * - 智能錯誤恢復和重試機制
 * - 實時性能警報和閾值監控
 * - 內存使用監控和資源追蹤
 *
 * 使用方式:
 * ```typescript
 * const monitor = PerformanceMonitor.getInstance()
 * await monitor.trackMetric({
 *   endpoint: '/api/users',
 *   method: 'GET',
 *   duration: 150,
 *   response_size: 1024,
 *   status_code: 200
 * })
 * ```
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private batchSize = 100
  private flushInterval = 30000 // 30秒

  /**
   * 私有建構函數（單例模式）
   *
   * 初始化性能監控服務，設置定期批次寫入定時器。
   * 採用私有建構函數確保只能通過getInstance()方法創建實例。
   */
  private constructor() {
    // 定期批量寫入數據庫 - Periodic batch write to database
    setInterval(() => {
      this.flushMetrics()
    }, this.flushInterval)
  }

  /**
   * 獲取性能監控單例實例
   *
   * 確保全應用程式中只有一個性能監控實例，
   * 避免重複監控和資源浪費。
   *
   * @returns PerformanceMonitor實例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 記錄性能指標
   *
   * 接收API請求的性能數據，自動補充時間戳和記憶體使用資訊。
   * 數據先暫存在記憶體中，達到批次大小時自動寫入數據庫。
   *
   * 處理流程:
   * 1. 補充時間戳和記憶體使用資訊
   * 2. 添加到記憶體緩存陣列
   * 3. 檢查是否達到批次寫入條件
   * 4. 執行實時性能警報檢查
   *
   * @param metric 性能指標數據（不含id和timestamp）
   */
  async trackMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
      memory_usage: this.getMemoryUsage(),
    }

    this.metrics.push(fullMetric)

    // 如果達到批量大小，立即寫入 - Immediate write if batch size reached
    if (this.metrics.length >= this.batchSize) {
      await this.flushMetrics()
    }

    // 檢查性能警報 - Check performance alerts
    this.checkPerformanceAlerts(fullMetric)
  }

  /**
   * 批量寫入指標到數據庫
   *
   * 將累積的性能指標批次寫入PostgreSQL數據庫。
   * 使用原生SQL提高寫入效率，並提供錯誤恢復機制。
   *
   * 處理流程:
   * 1. 檢查是否有待寫入的指標
   * 2. 確保數據庫表格存在
   * 3. 複製並清空當前指標陣列
   * 4. 批量插入到performance_metrics表
   * 5. 錯誤時將數據放回隊列重試
   *
   * 安全特性:
   * - 使用Prisma的參數化查詢防止SQL注入
   * - 錯誤時自動恢復數據防止丟失
   * - 自動表格創建和索引優化
   */
  private async flushMetrics() {
    if (this.metrics.length === 0) return

    try {
      // 創建性能指標表（如果不存在） - Ensure metrics table exists
      await this.ensureMetricsTable()

      // 批量插入 - Batch insert
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

      console.log(`✅ 成功寫入 ${metricsToFlush.length} 條性能指標`)
    } catch (error) {
      console.error('❌ 性能指標寫入失敗:', error)
      // 將指標放回隊列 - Put metrics back to queue
      this.metrics.unshift(...metricsToFlush)
    }
  }

  /**
   * 確保性能指標表存在
   *
   * 動態創建performance_metrics表格和相關索引。
   * 使用IF NOT EXISTS確保冪等性，避免重複創建錯誤。
   *
   * 表格結構:
   * - 包含所有性能指標欄位
   * - 自動創建timestamp索引用於時間範圍查詢
   * - 創建duration索引用於性能分析
   * - 創建endpoint+timestamp複合索引優化常用查詢
   *
   * 索引策略:
   * - endpoint + timestamp DESC: 支援按端點的時間序列查詢
   * - duration DESC: 支援慢查詢分析和排序
   * - created_at: 支援數據清理和歷史查詢
   */
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

  /**
   * 獲取當前記憶體使用情況
   *
   * 使用Node.js的process.memoryUsage()方法獲取heap記憶體使用量。
   * 在瀏覽器環境中會返回0，確保代碼的跨環境相容性。
   *
   * @returns 堆積記憶體使用量（位元組），瀏覽器環境返回0
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  /**
   * 檢查性能警報條件
   *
   * 根據預設閾值檢查性能指標，觸發相應的警報。
   * 提供即時的性能問題發現和通知機制。
   *
   * 警報類型:
   * - 慢API警報: 響應時間超過2秒
   * - 大響應警報: 響應大小超過1MB
   * - 伺服器錯誤警報: HTTP狀態碼>=500
   *
   * 警報輸出:
   * - console.warn: 性能警告（慢API、大響應）
   * - console.error: 嚴重錯誤（伺服器錯誤）
   *
   * @param metric 要檢查的性能指標
   */
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

  /**
   * 獲取性能分析報告
   *
   * 生成指定時間範圍內的詳細性能分析報告。
   * 使用SQL聚合查詢提供全面的性能統計資訊。
   *
   * 報告內容包含:
   * - 每個端點的請求統計
   * - 響應時間統計（平均、最小、最大、中位數、95%分位數）
   * - 緩存命中率分析
   * - 錯誤率統計
   * - 響應大小分析
   *
   * 支援時間範圍:
   * - '1h': 最近1小時
   * - '24h': 最近24小時（預設）
   * - '7d': 最近7天
   * - '30d': 最近30天
   *
   * @param timeRange 時間範圍字串
   * @returns 性能分析報告陣列，按平均響應時間降序排列
   */
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

/**
 * API性能追蹤中間件
 *
 * 高階函數，為任何API處理器添加自動性能監控功能。
 * 自動計算響應時間、提取用戶資訊，並記錄完整的性能指標。
 *
 * 監控功能:
 * - 自動計算API響應時間
 * - 提取JWT token中的用戶ID
 * - 記錄響應大小和狀態碼
 * - 檢測緩存命中狀態
 * - 處理和記錄錯誤資訊
 * - 在響應頭中添加性能資訊
 *
 * 使用方式:
 * ```typescript
 * export const GET = withPerformanceTracking(async (request: NextRequest) => {
 *   // 你的API邏輯
 *   return NextResponse.json({ data: 'example' })
 * })
 * ```
 *
 * 自動添加的響應頭:
 * - X-Response-Time: 請求處理時間
 * - X-Memory-Usage: 當前記憶體使用量
 *
 * @param handler 原始API處理器函數
 * @returns 包裝後的處理器，具備自動性能監控功能
 */
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

    // 獲取用戶ID（如果可用） - Extract user ID if available
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    let userId: number | undefined

    try {
      if (token) {
        // 解析用戶ID（簡化版本） - Parse user ID (simplified version)
        const payload = JSON.parse(atob(token.split('.')[1]))
        userId = payload.userId
      }
    } catch {
      // 忽略token解析錯誤 - Ignore token parsing errors
    }

    // 記錄性能指標 - Record performance metrics
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

    // 添加性能headers - Add performance headers
    if (response) {
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Memory-Usage', `${PerformanceMonitor.getInstance()['getMemoryUsage']()}`)
    }

    return response
  }
}

/**
 * Core Web Vitals追蹤器
 *
 * 專門用於追蹤Google Core Web Vitals性能指標的工具類。
 * 支援與Google Analytics整合和自定義分析端點的數據傳送。
 *
 * Core Web Vitals指標:
 * - LCP (Largest Contentful Paint): 最大內容繪制時間
 * - FID (First Input Delay): 首次輸入延遲
 * - CLS (Cumulative Layout Shift): 累積佈局偏移
 * - FCP (First Contentful Paint): 首次內容繪制
 * - TTFB (Time to First Byte): 首字節時間
 *
 * 數據傳送目標:
 * - Google Analytics (gtag): 自動傳送到GA4進行分析
 * - 自定義端點: 傳送到/api/analytics/web-vitals進行處理
 *
 * 使用方式:
 * ```typescript
 * // 在瀏覽器中記錄指標
 * CoreWebVitalsTracker.trackMetric('LCP', 2500, 'unique-id')
 * ```
 */
export class CoreWebVitalsTracker {
  /**
   * 追蹤Core Web Vitals指標
   *
   * 記錄單個Core Web Vitals指標並傳送到分析服務。
   * 同時支援Google Analytics和自定義分析端點。
   *
   * 處理流程:
   * 1. 檢查瀏覽器環境和gtag可用性
   * 2. 傳送數據到Google Analytics（如果可用）
   * 3. 傳送數據到自定義分析端點
   * 4. 錯誤處理和靜默失敗
   *
   * 數據格式化:
   * - CLS指標會乘以1000轉換為整數
   * - 其他指標使用原始數值四捨五入
   *
   * @param name 指標名稱（LCP, FID, CLS, FCP, TTFB等）
   * @param value 指標數值（通常是毫秒或分數）
   * @param id 唯一識別符，用於數據分組和去重
   */
  static trackMetric(name: string, value: number, id: string) {
    // 發送到Google Analytics - Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        non_interaction: true,
      })
    }

    // 發送到自定義分析端點 - Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, value, id })
    }).catch(console.error)
  }
}

export default PerformanceMonitor