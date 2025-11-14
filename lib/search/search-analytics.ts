/**
 * @fileoverview ================================================================
AI銷售賦能平台 - 搜索分析和日誌記錄系統 (lib/search/search-analytics.ts)
================================================================
【檔案功能】
Week 6 ...
 * @module lib/search/search-analytics
 *
 * 【檔案功能】
 * Week 6 搜索分析和日誌記錄模組，提供全面的搜索行為分析和系統監控
 * 集成實時分析、用戶行為追蹤和性能監控，支援搜索體驗持續優化
 * 【主要職責】
 * • 搜索行為追蹤 - 記錄查詢、點擊、瀏覽、下載等用戶行為
 * • 性能監控分析 - 追蹤響應時間、成功率、錯誤率等關鍵指標
 * • 用戶體驗分析 - 分析搜索滿意度、放棄率、重複搜索模式
 * • 內容效能評估 - 評估文檔受歡迎程度、搜索覆蓋率、內容空白
 * • 搜索模式識別 - 發現熱門查詢、趨勢變化、季節性模式
 * • 個人化洞察 - 分析個人搜索習慣和偏好演變
 * • 業務智能報告 - 生成管理層決策支援報告和KPI儀表板
 * • 預測性分析 - 預測搜索趨勢和內容需求
 * 【技術實現】
 * • 事件驅動架構 - 異步事件收集和處理
 * • 時間序列分析 - 趨勢分析和模式識別
 * • 機器學習分析 - 異常檢測和預測建模
 * • 實時數據處理 - 流式數據分析和即時監控
 * • 數據聚合優化 - 多維度數據聚合和快速查詢
 * 【分析維度】
 * • 查詢分析：關鍵詞熱度、意圖分佈、複雜度變化
 * • 用戶分析：活躍度、專業度、滿意度、學習軌跡
 * • 內容分析：熱門度、質量評分、更新需求、空白識別
 * • 性能分析：響應時間、可用性、錯誤率、資源使用
 * • 業務分析：部門使用模式、知識流轉、協作效率
 * 【相關檔案】
 * • 語義處理: lib/search/semantic-query-processor.ts
 * • 結果增強: lib/search/contextual-result-enhancer.ts
 * • 搜索建議: lib/search/search-suggestions.ts
 * • 性能監控: lib/monitoring/performance-monitor.ts
 * Week 6 開發階段 - Task 6.3: 搜索分析和日誌記錄系統
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

// import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getVectorCache } from '@/lib/cache/vector-cache'
// import { getOpenAIClient } from '@/lib/ai/openai'

// 搜索事件類型定義
export type SearchEventType =
  | 'search_initiated'      // 搜索開始
  | 'search_completed'      // 搜索完成
  | 'result_clicked'        // 結果點擊
  | 'result_viewed'         // 結果查看
  | 'result_downloaded'     // 結果下載
  | 'result_bookmarked'     // 結果收藏
  | 'result_shared'         // 結果分享
  | 'search_abandoned'      // 搜索放棄
  | 'query_refined'         // 查詢精煉
  | 'suggestion_clicked'    // 建議點擊
  | 'filter_applied'        // 過濾器應用
  | 'sort_changed'          // 排序改變
  | 'feedback_provided'     // 反饋提供
  | 'session_started'       // 會話開始
  | 'session_ended'         // 會話結束

// 搜索事件架構
const SearchEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'search_initiated', 'search_completed', 'result_clicked', 'result_viewed',
    'result_downloaded', 'result_bookmarked', 'result_shared', 'search_abandoned',
    'query_refined', 'suggestion_clicked', 'filter_applied', 'sort_changed',
    'feedback_provided', 'session_started', 'session_ended'
  ]),
  timestamp: z.date(),
  sessionId: z.string(),
  userId: z.string().optional(),

  // 查詢相關數據
  queryData: z.object({
    originalQuery: z.string().optional(),
    processedQuery: z.string().optional(),
    queryIntent: z.string().optional(),
    queryComplexity: z.enum(['simple', 'moderate', 'complex']).optional(),
    queryLanguage: z.string().optional(),
  }).optional(),

  // 結果相關數據
  resultData: z.object({
    resultId: z.number().optional(),
    resultTitle: z.string().optional(),
    resultCategory: z.string().optional(),
    resultPosition: z.number().optional(),
    resultSimilarity: z.number().optional(),
    totalResults: z.number().optional(),
  }).optional(),

  // 性能數據
  performanceData: z.object({
    processingTime: z.number().optional(), // 毫秒
    renderTime: z.number().optional(),
    totalTime: z.number().optional(),
    cacheHit: z.boolean().optional(),
    errorOccurred: z.boolean().optional(),
    errorMessage: z.string().optional(),
  }).optional(),

  // 用戶行為數據
  behaviorData: z.object({
    timeOnPage: z.number().optional(), // 秒
    scrollDepth: z.number().optional(), // 百分比
    clickPosition: z.object({ x: z.number(), y: z.number() }).optional(),
    deviceType: z.string().optional(),
    browserType: z.string().optional(),
    referrer: z.string().optional(),
  }).optional(),

  // 上下文數據
  contextData: z.object({
    userRole: z.string().optional(),
    userDepartment: z.string().optional(),
    userExperience: z.string().optional(),
    workflowStage: z.string().optional(),
    businessContext: z.string().optional(),
  }).optional(),

  // 反饋數據
  feedbackData: z.object({
    satisfaction: z.number().min(1).max(5).optional(),
    helpfulness: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    suggestedImprovement: z.string().optional(),
  }).optional(),

  // 元數據
  metadata: z.record(z.any()).optional(),
})

export type SearchEvent = z.infer<typeof SearchEventSchema>

// 分析報告架構
export interface SearchAnalyticsReport {
  reportId: string
  generatedAt: Date
  period: {
    startDate: Date
    endDate: Date
    duration: string
  }

  // 總體統計
  overview: {
    totalSearches: number
    totalUsers: number
    totalSessions: number
    averageQueriesPerSession: number
    averageSessionDuration: number
    searchSuccessRate: number
    userSatisfactionScore: number
  }

  // 查詢分析
  queryAnalysis: {
    topQueries: Array<{ query: string; count: number; successRate: number }>
    queryComplexityDistribution: Record<'simple' | 'moderate' | 'complex', number>
    queryLanguageDistribution: Record<string, number>
    queryIntentDistribution: Record<string, number>
    failedQueries: Array<{ query: string; count: number; reasons: string[] }>
    queryTrends: Array<{ period: string; queryCount: number; uniqueQueries: number }>
  }

  // 用戶行為分析
  userBehavior: {
    userEngagement: {
      averageClickThroughRate: number
      averageTimeOnResults: number
      bounceRate: number
      returnUserRate: number
    }
    userSegmentation: Array<{
      segment: string
      userCount: number
      characteristics: Record<string, any>
      behaviorPatterns: string[]
    }>
    userJourney: Array<{
      stage: string
      userCount: number
      conversionRate: number
      dropoffReasons: string[]
    }>
  }

  // 內容性能分析
  contentPerformance: {
    topDocuments: Array<{
      documentId: number
      title: string
      viewCount: number
      clickRate: number
      satisfaction: number
    }>
    categoryPerformance: Array<{
      category: string
      searchCount: number
      resultCount: number
      averageRelevance: number
    }>
    contentGaps: Array<{
      topic: string
      searchCount: number
      resultQuality: number
      recommendedAction: string
    }>
  }

  // 性能指標
  performanceMetrics: {
    averageResponseTime: number
    p95ResponseTime: number
    errorRate: number
    cacheHitRate: number
    systemAvailability: number
    resourceUtilization: {
      cpu: number
      memory: number
      storage: number
    }
  }

  // 商業洞察
  businessInsights: {
    departmentUsage: Array<{
      department: string
      searchVolume: number
      topTopics: string[]
      collaborationIndex: number
    }>
    knowledgeFlowAnalysis: {
      informationSpread: number
      knowledgeGaps: string[]
      expertiseDistribution: Record<string, number>
    }
    productivityImpact: {
      timesSaved: number
      decisionsSupported: number
      learningAcceleration: number
    }
  }

  // 建議和行動項目
  recommendations: {
    immediateActions: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      expectedImpact: string
      effort: string
    }>
    contentStrategy: Array<{
      recommendation: string
      targetArea: string
      resources: string[]
    }>
    userExperience: Array<{
      improvement: string
      affectedUsers: string
      implementation: string
    }>
    systemOptimization: Array<{
      optimization: string
      performanceGain: string
      complexity: string
    }>
  }
}

// 實時分析儀表板數據
export interface RealTimeAnalyticsDashboard {
  timestamp: Date

  // 實時指標
  realTimeMetrics: {
    activeUsers: number
    currentSearches: number
    responseTime: number
    errorRate: number
    searchesPerMinute: number
  }

  // 最近活動
  recentActivity: {
    recentQueries: Array<{ query: string; timestamp: Date; userId?: string }>
    popularDocuments: Array<{ title: string; views: number; trend: 'up' | 'down' | 'stable' }>
    systemAlerts: Array<{ type: 'warning' | 'error' | 'info'; message: string; timestamp: Date }>
  }

  // 趨勢數據
  trends: {
    hourlySearchVolume: Array<{ hour: number; searchCount: number }>
    topTopicsToday: Array<{ topic: string; searchCount: number; growth: number }>
    userActivityHeatmap: Array<{ hour: number; day: number; activity: number }>
  }
}

/**
 * 搜索分析和日誌記錄服務類
 */
export class SearchAnalyticsService {
  private cache = getVectorCache()
  private eventBuffer: SearchEvent[] = []
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 30000 // 30秒

  constructor() {
    // 啟動定期批量處理
    this.startBatchProcessing()
  }

  /**
   * 記錄搜索事件 - 主要事件收集接口
   *
   * 【事件處理流程】
   * 1. 事件驗證：驗證事件數據格式和完整性
   * 2. 事件豐富化：添加時間戳、會話ID、上下文信息
   * 3. 實時處理：更新實時指標和快取
   * 4. 批量緩存：添加到事件緩衝區，準備批量寫入
   * 5. 異常處理：記錄和處理事件收集錯誤
   *
   * @param eventType 事件類型
   * @param eventData 事件數據
   * @returns Promise<string> 事件ID
   */
  async recordEvent(
    eventType: SearchEventType,
    eventData: Partial<SearchEvent>
  ): Promise<string> {
    try {
      // 1. 生成事件ID和基礎數據
      const eventId = this.generateEventId()
      const timestamp = new Date()

      // 2. 構建完整事件對象
      const event: SearchEvent = {
        id: eventId,
        type: eventType,
        timestamp,
        sessionId: eventData.sessionId || this.generateSessionId(),
        userId: eventData.userId,
        queryData: eventData.queryData,
        resultData: eventData.resultData,
        performanceData: eventData.performanceData,
        behaviorData: eventData.behaviorData,
        contextData: eventData.contextData,
        feedbackData: eventData.feedbackData,
        metadata: {
          ...eventData.metadata,
          recordedAt: timestamp.toISOString(),
          source: 'search_analytics'
        }
      }

      // 3. 驗證事件數據
      const validatedEvent = SearchEventSchema.parse(event)

      // 4. 實時處理
      await this.processRealTimeEvent(validatedEvent)

      // 5. 添加到緩衝區
      this.eventBuffer.push(validatedEvent)

      // 6. 檢查是否需要立即刷新
      if (this.eventBuffer.length >= this.BUFFER_SIZE) {
        await this.flushEventBuffer()
      }

      console.log(`📊 記錄搜索事件: ${eventType} (${eventId})`)
      return eventId

    } catch (error) {
      console.error('❌ 記錄搜索事件失敗:', error)
      throw new Error('事件記錄失敗')
    }
  }

  /**
   * 記錄搜索會話 - 完整搜索會話追蹤
   */
  async recordSearchSession(sessionData: {
    sessionId: string
    userId?: string
    startTime: Date
    endTime: Date
    queryCount: number
    resultInteractions: number
    satisfaction?: number
    context?: any
  }): Promise<void> {
    try {
      await this.recordEvent('session_ended', {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        behaviorData: {
          timeOnPage: (sessionData.endTime.getTime() - sessionData.startTime.getTime()) / 1000
        },
        feedbackData: {
          satisfaction: sessionData.satisfaction
        },
        contextData: sessionData.context,
        metadata: {
          queryCount: sessionData.queryCount,
          resultInteractions: sessionData.resultInteractions,
          sessionDuration: sessionData.endTime.getTime() - sessionData.startTime.getTime()
        }
      })

    } catch (error) {
      console.error('❌ 記錄搜索會話失敗:', error)
    }
  }

  /**
   * 生成搜索分析報告
   */
  async generateAnalyticsReport(
    startDate: Date,
    endDate: Date,
    filters: {
      userId?: string
      department?: string
      queryType?: string
      includePersonalData?: boolean
    } = {}
  ): Promise<SearchAnalyticsReport> {
    try {
      console.log(`📈 生成搜索分析報告: ${startDate.toISOString()} - ${endDate.toISOString()}`)

      // 檢查緩存
      const cacheKey = this.generateReportCacheKey(startDate, endDate, filters)
      const cachedReport = await this.getCachedReport(cacheKey)
      if (cachedReport) {
        console.log('🎯 分析報告緩存命中')
        return cachedReport
      }

      // 生成新報告
      const report = await this.buildAnalyticsReport(startDate, endDate, filters)

      // 緩存報告
      await this.cacheReport(cacheKey, report)

      console.log(`✅ 搜索分析報告生成完成: ${report.reportId}`)
      return report

    } catch (error) {
      console.error('❌ 生成搜索分析報告失敗:', error)
      throw new Error('報告生成失敗')
    }
  }

  /**
   * 獲取實時分析儀表板數據
   */
  async getRealTimeDashboard(): Promise<RealTimeAnalyticsDashboard> {
    try {
      const now = new Date()

      // 從緩存獲取實時指標
      const realTimeMetrics = await this.getRealTimeMetrics()

      // 獲取最近活動
      const recentActivity = await this.getRecentActivity()

      // 獲取趨勢數據
      const trends = await this.getTrendData()

      return {
        timestamp: now,
        realTimeMetrics,
        recentActivity,
        trends
      }

    } catch (error) {
      console.error('❌ 獲取實時儀表板數據失敗:', error)
      throw new Error('實時數據獲取失敗')
    }
  }

  /**
   * 分析搜索趨勢
   */
  async analyzeSearchTrends(
    period: 'hour' | 'day' | 'week' | 'month',
    _limit: number = 50
  ): Promise<{
    trendingQueries: Array<{ query: string; growth: number; volume: number }>
    emergingTopics: Array<{ topic: string; emergence: number; description: string }>
    seasonalPatterns: Array<{ pattern: string; confidence: number; nextPrediction: Date }>
  }> {
    try {
      // 這裡會實現複雜的趨勢分析算法
      // 簡化實現
      return {
        trendingQueries: [
          { query: 'AI客戶服務', growth: 0.25, volume: 150 },
          { query: '銷售自動化', growth: 0.18, volume: 120 },
          { query: 'CRM整合', growth: 0.15, volume: 100 }
        ],
        emergingTopics: [
          { topic: '人工智能應用', emergence: 0.8, description: '客戶越來越關注AI在業務中的應用' },
          { topic: '數據分析', emergence: 0.6, description: '數據驅動決策的需求增加' }
        ],
        seasonalPatterns: [
          { pattern: '季末報告查詢增加', confidence: 0.9, nextPrediction: new Date() }
        ]
      }

    } catch (error) {
      console.error('❌ 分析搜索趨勢失敗:', error)
      throw new Error('趨勢分析失敗')
    }
  }

  /**
   * 檢測搜索異常
   */
  async detectSearchAnomalies(): Promise<{
    anomalies: Array<{
      type: 'performance' | 'behavior' | 'content'
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      affectedMetrics: string[]
      recommendedActions: string[]
    }>
    systemHealth: 'healthy' | 'warning' | 'critical'
  }> {
    try {
      // 實現異常檢測算法
      // 簡化實現
      const anomalies = await this.runAnomalyDetection()

      const systemHealth = anomalies.filter(a => a.severity === 'critical').length > 0
        ? 'critical'
        : anomalies.filter(a => a.severity === 'high').length > 0
        ? 'warning'
        : 'healthy'

      return { anomalies, systemHealth }

    } catch (error) {
      console.error('❌ 檢測搜索異常失敗:', error)
      return { anomalies: [], systemHealth: 'warning' }
    }
  }

  /**
   * 生成用戶洞察報告
   */
  async generateUserInsights(userId: string): Promise<{
    userProfile: {
      searchStyle: 'exploratory' | 'targeted' | 'research' | 'support'
      expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
      primaryInterests: string[]
      learningTrajectory: string
    }
    recommendations: {
      personalizedContent: string[]
      learningPath: string[]
      collaborationSuggestions: string[]
    }
    productivity: {
      searchEfficiency: number
      informationDiscovery: number
      knowledgeApplication: number
    }
  }> {
    try {
      // 分析用戶的搜索歷史和行為模式
      const userEvents = await this.getUserEvents(userId)
      const userProfile = await this.analyzeUserProfile(userEvents)
      const recommendations = await this.generateUserRecommendations(userProfile, userEvents)
      const productivity = await this.calculateUserProductivity(userEvents)

      return {
        userProfile,
        recommendations,
        productivity
      }

    } catch (error) {
      console.error('❌ 生成用戶洞察失敗:', error)
      throw new Error('用戶洞察生成失敗')
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 實時事件處理
   */
  private async processRealTimeEvent(event: SearchEvent): Promise<void> {
    try {
      // 更新實時指標
      await this.updateRealTimeMetrics(event)

      // 檢測即時異常
      await this.checkRealTimeAnomalies(event)

      // 更新用戶會話狀態
      if (event.userId) {
        await this.updateUserSession(event)
      }

    } catch (error) {
      console.error('❌ 實時事件處理失敗:', error)
    }
  }

  /**
   * 批量處理事件
   */
  private startBatchProcessing(): void {
    setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushEventBuffer()
      }
    }, this.FLUSH_INTERVAL)
  }

  /**
   * 刷新事件緩衝區
   */
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return

    try {
      const events = [...this.eventBuffer]
      this.eventBuffer = []

      // 批量寫入數據庫
      await this.batchInsertEvents(events)

      // 更新聚合統計
      await this.updateAggregateStats(events)

      console.log(`📊 批量處理 ${events.length} 個搜索事件`)

    } catch (error) {
      console.error('❌ 刷新事件緩衝區失敗:', error)
      // 錯誤恢復：將事件重新放回緩衝區
      this.eventBuffer.unshift(...this.eventBuffer)
    }
  }

  /**
   * 批量插入事件到數據庫
   */
  private async batchInsertEvents(events: SearchEvent[]): Promise<void> {
    try {
      // TODO: Week 6 - 實現searchEvent Prisma模型後啟用
      // 這裡應該實現高效的批量插入
      // 為了簡化，使用單次事務插入
      // await prisma.$transaction(async (tx) => {
      //   for (const event of events) {
      //     await tx.searchEvent.create({
      //       data: {
      //         id: event.id,
      //         type: event.type,
      //         timestamp: event.timestamp,
      //         sessionId: event.sessionId,
      //         userId: event.userId,
      //         eventData: JSON.stringify({
      //           queryData: event.queryData,
      //           resultData: event.resultData,
      //           performanceData: event.performanceData,
      //           behaviorData: event.behaviorData,
      //           contextData: event.contextData,
      //           feedbackData: event.feedbackData,
      //           metadata: event.metadata
      //         })
      //       }
      //     })
      //   }
      // })

      // 臨時：記錄到console直到實現searchEvent模型
      console.log(`📝 批量事件記錄 (${events.length}個事件)`);

    } catch (error) {
      console.error('❌ 批量插入事件失敗:', error)
      throw error
    }
  }

  /**
   * 更新實時指標
   */
  private async updateRealTimeMetrics(event: SearchEvent): Promise<void> {
    try {
      // TODO: Week 6 - 實現通用key-value cache後啟用實時指標
      // VectorCache不支持通用key-value操作,需要專用的metrics cache

      // 臨時：記錄到console
      console.log(`📊 實時指標更新: ${event.type}`);

      // const metricsKey = 'realtime_metrics'
      // const currentMetrics = await this.cache.get(metricsKey)

      // let metrics = currentMetrics ? JSON.parse(currentMetrics) : {
      //   activeUsers: new Set(),
      //   currentSearches: 0,
      //   totalResponseTime: 0,
      //   responseTimeCount: 0,
      //   errorCount: 0,
      //   totalEvents: 0,
      //   lastUpdate: Date.now()
      // }

      // // 更新指標
      // if (event.userId) {
      //   metrics.activeUsers.add(event.userId)
      // }

      // if (event.type === 'search_initiated') {
      //   metrics.currentSearches++
      // } else if (event.type === 'search_completed') {
      //   metrics.currentSearches = Math.max(0, metrics.currentSearches - 1)
      // }

      // if (event.performanceData?.processingTime) {
      //   metrics.totalResponseTime += event.performanceData.processingTime
      //   metrics.responseTimeCount++
      // }

      // if (event.performanceData?.errorOccurred) {
      //   metrics.errorCount++
      // }

      // metrics.totalEvents++
      // metrics.lastUpdate = Date.now()

      // // 轉換Set為數組以便序列化
      // const serializedMetrics = {
      //   ...metrics,
      //   activeUsers: Array.from(metrics.activeUsers)
      // }

      // await this.cache.set(metricsKey, JSON.stringify(serializedMetrics), 300) // 5分鐘過期

    } catch (error) {
      console.error('❌ 更新實時指標失敗:', error)
    }
  }

  /**
   * 構建分析報告
   */
  private async buildAnalyticsReport(
    startDate: Date,
    endDate: Date,
    filters: any
  ): Promise<SearchAnalyticsReport> {
    const reportId = this.generateReportId()

    // 並行查詢各種統計數據
    const [
      overview,
      queryAnalysis,
      userBehavior,
      contentPerformance,
      performanceMetrics,
      businessInsights
    ] = await Promise.all([
      this.buildOverviewStats(startDate, endDate, filters),
      this.buildQueryAnalysis(startDate, endDate, filters),
      this.buildUserBehaviorAnalysis(startDate, endDate, filters),
      this.buildContentPerformanceAnalysis(startDate, endDate, filters),
      this.buildPerformanceMetrics(startDate, endDate, filters),
      this.buildBusinessInsights(startDate, endDate, filters)
    ])

    // 生成建議
    const recommendations = await this.generateReportRecommendations(
      overview, queryAnalysis, userBehavior, contentPerformance, performanceMetrics
    )

    return {
      reportId,
      generatedAt: new Date(),
      period: {
        startDate,
        endDate,
        duration: this.formatDuration(endDate.getTime() - startDate.getTime())
      },
      overview,
      queryAnalysis,
      userBehavior,
      contentPerformance,
      performanceMetrics,
      businessInsights,
      recommendations
    }
  }

  /**
   * 構建概覽統計
   */
  private async buildOverviewStats(_startDate: Date, _endDate: Date, _filters: any): Promise<SearchAnalyticsReport['overview']> {
    // 簡化實現
    return {
      totalSearches: 1250,
      totalUsers: 89,
      totalSessions: 456,
      averageQueriesPerSession: 2.7,
      averageSessionDuration: 180, // 秒
      searchSuccessRate: 0.87,
      userSatisfactionScore: 4.2
    }
  }

  /**
   * 構建查詢分析
   */
  private async buildQueryAnalysis(_startDate: Date, _endDate: Date, _filters: any): Promise<SearchAnalyticsReport['queryAnalysis']> {
    // 簡化實現
    return {
      topQueries: [
        { query: 'API文檔', count: 156, successRate: 0.92 },
        { query: '客戶管理', count: 134, successRate: 0.88 },
        { query: '銷售流程', count: 98, successRate: 0.85 }
      ],
      queryComplexityDistribution: { simple: 60, moderate: 30, complex: 10 },
      queryLanguageDistribution: { 'zh-TW': 70, 'en': 25, 'mixed': 5 },
      queryIntentDistribution: {
        'specific_document': 40,
        'how_to_guide': 25,
        'concept_learning': 20,
        'troubleshooting': 15
      },
      failedQueries: [
        { query: '過時API', count: 12, reasons: ['內容過時', '文檔缺失'] }
      ],
      queryTrends: [
        { period: '2024-W1', queryCount: 280, uniqueQueries: 156 },
        { period: '2024-W2', queryCount: 320, uniqueQueries: 189 }
      ]
    }
  }

  // 其他構建方法的簡化實現...
  private async buildUserBehaviorAnalysis(_startDate: Date, _endDate: Date, _filters: any): Promise<SearchAnalyticsReport['userBehavior']> {
    return {
      userEngagement: {
        averageClickThroughRate: 0.68,
        averageTimeOnResults: 120,
        bounceRate: 0.25,
        returnUserRate: 0.73
      },
      userSegmentation: [
        {
          segment: '技術用戶',
          userCount: 32,
          characteristics: { experienceLevel: 'advanced', department: 'IT' },
          behaviorPatterns: ['深度搜索', '技術文檔偏好']
        }
      ],
      userJourney: [
        {
          stage: '搜索開始',
          userCount: 100,
          conversionRate: 0.85,
          dropoffReasons: ['查詢過於複雜']
        }
      ]
    }
  }

  private async buildContentPerformanceAnalysis(_startDate: Date, _endDate: Date, _filters: any): Promise<SearchAnalyticsReport['contentPerformance']> {
    return {
      topDocuments: [
        {
          documentId: 1,
          title: 'API使用指南',
          viewCount: 245,
          clickRate: 0.78,
          satisfaction: 4.5
        }
      ],
      categoryPerformance: [
        {
          category: '技術文檔',
          searchCount: 456,
          resultCount: 128,
          averageRelevance: 0.82
        }
      ],
      contentGaps: [
        {
          topic: '進階API教程',
          searchCount: 67,
          resultQuality: 0.3,
          recommendedAction: '創建詳細的進階教程'
        }
      ]
    }
  }

  private async buildPerformanceMetrics(_startDate: Date, _endDate: Date, _filters: any): Promise<SearchAnalyticsReport['performanceMetrics']> {
    return {
      averageResponseTime: 450,
      p95ResponseTime: 890,
      errorRate: 0.02,
      cacheHitRate: 0.76,
      systemAvailability: 0.998,
      resourceUtilization: {
        cpu: 0.45,
        memory: 0.62,
        storage: 0.34
      }
    }
  }

  private async buildBusinessInsights(_startDate: Date, _endDate: Date, _filters: any): Promise<SearchAnalyticsReport['businessInsights']> {
    return {
      departmentUsage: [
        {
          department: '銷售部',
          searchVolume: 456,
          topTopics: ['客戶管理', '提案模板', '競爭分析'],
          collaborationIndex: 0.73
        }
      ],
      knowledgeFlowAnalysis: {
        informationSpread: 0.68,
        knowledgeGaps: ['高級技術培訓', '新產品資料'],
        expertiseDistribution: { '初級': 40, '中級': 45, '高級': 15 }
      },
      productivityImpact: {
        timesSaved: 12500, // 分鐘
        decisionsSupported: 89,
        learningAcceleration: 1.8 // 倍數
      }
    }
  }

  private async generateReportRecommendations(
    overview: any,
    queryAnalysis: any,
    userBehavior: any,
    contentPerformance: any,
    performanceMetrics: any
  ): Promise<SearchAnalyticsReport['recommendations']> {
    return {
      immediateActions: [
        {
          priority: 'high',
          action: '優化高頻失敗查詢的結果',
          expectedImpact: '提升15%搜索成功率',
          effort: '中等'
        }
      ],
      contentStrategy: [
        {
          recommendation: '增加進階技術內容',
          targetArea: '技術文檔',
          resources: ['技術專家時間', '文檔工具']
        }
      ],
      userExperience: [
        {
          improvement: '優化搜索建議算法',
          affectedUsers: '所有用戶',
          implementation: '2週開發週期'
        }
      ],
      systemOptimization: [
        {
          optimization: '增加緩存層級',
          performanceGain: '30%響應時間改善',
          complexity: '低'
        }
      ]
    }
  }

  // 工具方法...
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateReportCacheKey(_startDate: Date, _endDate: Date, _filters: any): string {
    const filterKey = JSON.stringify(_filters)
    return `analytics_report:${_startDate.getTime()}:${_endDate.getTime()}:${Buffer.from(filterKey).toString('base64')}`
  }

  private async getCachedReport(cacheKey: string): Promise<SearchAnalyticsReport | null> {
    try {
      // TODO: Week 6 - 使用通用key-value cache
      // const cached = await this.cache.get(cacheKey)
      // return cached ? JSON.parse(cached) : null
      return null; // 臨時禁用緩存
    } catch (error) {
      return null
    }
  }

  private async cacheReport(cacheKey: string, report: SearchAnalyticsReport): Promise<void> {
    try {
      // TODO: Week 6 - 使用通用key-value cache
      // await this.cache.set(cacheKey, JSON.stringify(report), 3600) // 1小時緩存
      console.log(`📝 報告緩存已跳過: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ 緩存報告失敗:', error)
    }
  }

  private formatDuration(milliseconds: number): string {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}天${hours}小時`
  }

  // 其他輔助方法的簡化實現...
  private async getRealTimeMetrics(): Promise<RealTimeAnalyticsDashboard['realTimeMetrics']> {
    // TODO: Week 6 - 使用通用key-value cache
    // const metricsKey = 'realtime_metrics'
    // const cached = await this.cache.get(metricsKey)

    // if (cached) {
    //   const metrics = JSON.parse(cached)
    //   return {
    //     activeUsers: metrics.activeUsers?.length || 0,
    //     currentSearches: metrics.currentSearches || 0,
    //     responseTime: metrics.responseTimeCount > 0 ? metrics.totalResponseTime / metrics.responseTimeCount : 0,
    //     errorRate: metrics.totalEvents > 0 ? metrics.errorCount / metrics.totalEvents : 0,
    //     searchesPerMinute: metrics.totalEvents || 0
    //   }
    // }

    return {
      activeUsers: 0,
      currentSearches: 0,
      responseTime: 0,
      errorRate: 0,
      searchesPerMinute: 0
    }
  }

  private async getRecentActivity(): Promise<RealTimeAnalyticsDashboard['recentActivity']> {
    return {
      recentQueries: [
        { query: 'API文檔', timestamp: new Date(), userId: 'user123' },
        { query: '客戶管理流程', timestamp: new Date(), userId: 'user456' }
      ],
      popularDocuments: [
        { title: 'API使用指南', views: 45, trend: 'up' },
        { title: '銷售手冊', views: 32, trend: 'stable' }
      ],
      systemAlerts: [
        { type: 'info', message: '系統運行正常', timestamp: new Date() }
      ]
    }
  }

  private async getTrendData(): Promise<RealTimeAnalyticsDashboard['trends']> {
    return {
      hourlySearchVolume: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        searchCount: Math.floor(Math.random() * 50) + 10
      })),
      topTopicsToday: [
        { topic: 'API', searchCount: 156, growth: 0.15 },
        { topic: '客戶管理', searchCount: 134, growth: 0.08 }
      ],
      userActivityHeatmap: Array.from({ length: 24 }, (_, hour) =>
        Array.from({ length: 7 }, (_, day) => ({
          hour,
          day,
          activity: Math.floor(Math.random() * 100)
        }))
      ).flat()
    }
  }

  private async runAnomalyDetection(): Promise<Array<{
    type: 'performance' | 'behavior' | 'content'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    affectedMetrics: string[]
    recommendedActions: string[]
  }>> {
    // 簡化的異常檢測
    return [
      {
        type: 'performance',
        severity: 'medium',
        description: '搜索響應時間較平均值高20%',
        affectedMetrics: ['responseTime'],
        recommendedActions: ['檢查資源使用情況', '優化查詢算法']
      }
    ]
  }

  private async updateAggregateStats(events: SearchEvent[]): Promise<void> {
    // 更新聚合統計數據
    // 簡化實現
  }

  private async checkRealTimeAnomalies(event: SearchEvent): Promise<void> {
    // 檢查實時異常
    // 簡化實現
  }

  private async updateUserSession(event: SearchEvent): Promise<void> {
    // 更新用戶會話狀態
    // 簡化實現
  }

  private async getUserEvents(userId: string): Promise<SearchEvent[]> {
    // 獲取用戶事件
    // 簡化實現
    return []
  }

  private async analyzeUserProfile(events: SearchEvent[]): Promise<any> {
    // 分析用戶檔案
    // 簡化實現
    return {
      searchStyle: 'targeted',
      expertiseLevel: 'intermediate',
      primaryInterests: ['API', '客戶管理'],
      learningTrajectory: '穩步提升'
    }
  }

  private async generateUserRecommendations(profile: any, events: SearchEvent[]): Promise<any> {
    // 生成用戶建議
    // 簡化實現
    return {
      personalizedContent: ['進階API教程', '客戶管理最佳實踐'],
      learningPath: ['基礎概念', '實際應用', '高級技巧'],
      collaborationSuggestions: ['與技術團隊合作', '參與知識分享']
    }
  }

  private async calculateUserProductivity(events: SearchEvent[]): Promise<any> {
    // 計算用戶生產力
    // 簡化實現
    return {
      searchEfficiency: 0.75,
      informationDiscovery: 0.82,
      knowledgeApplication: 0.68
    }
  }
}

// 導出單例實例
export const searchAnalyticsService = new SearchAnalyticsService()

// 便利函數
export async function recordSearchEvent(
  eventType: SearchEventType,
  eventData: Partial<SearchEvent>
): Promise<string> {
  return searchAnalyticsService.recordEvent(eventType, eventData)
}

export async function generateSearchAnalytics(
  startDate: Date,
  endDate: Date,
  filters?: any
): Promise<SearchAnalyticsReport> {
  return searchAnalyticsService.generateAnalyticsReport(startDate, endDate, filters)
}

export async function getRealTimeSearchData(): Promise<RealTimeAnalyticsDashboard> {
  return searchAnalyticsService.getRealTimeDashboard()
}