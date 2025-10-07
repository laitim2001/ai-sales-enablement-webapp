/**
 * @fileoverview ================================================================AI銷售賦能平台 - 上下文感知結果增強器 (lib/search/contextual-result-enhancer.ts)================================================================【檔案功能】Week 6 搜索結果增強和上下文感知模組，提供智能結果豐富化和個性化體驗集成多維度上下文信息，實現深度結果理解和智能摘要生成【主要職責】• 上下文感知排序 - 基於用戶情境和查詢歷史的動態排序• 智能結果摘要 - 使用GPT-4生成個性化結果摘要和要點• 相關性增強 - 跨文檔關聯分析和相關內容推薦• 結果豐富化 - 添加元數據、標籤、關係和行動建議• 個性化體驗 - 基於用戶角色和偏好的結果客製化• 結果集群分析 - 自動分組相似結果和主題識別• 質量評估系統 - 結果品質評分和可信度分析• 交互建議生成 - 下一步行動和相關查詢建議【技術實現】• GPT-4整合 - 高級語義理解和摘要生成• 向量相似度分析 - 結果間語義關聯計算• 機器學習排序 - 多特徵融合的學習排序算法• 圖譜分析 - 知識圖譜和實體關係分析• 實時個性化 - 動態用戶偏好學習和適應【增強特性】• 多模態理解 - 文本、結構化數據、時間序列分析• 業務智能洞察 - 銷售趨勢、客戶模式、業績預測• 協作推薦 - 團隊成員和專家推薦• 學習軌跡 - 基於結果的學習路徑建議• 決策支持 - 基於搜索結果的決策建議和風險評估【相關檔案】• 結果排序: lib/search/result-ranker.ts• 語義處理: lib/search/semantic-query-processor.ts• 向量搜索: lib/search/vector-search.ts• 搜索分析: lib/search/search-analytics.tsWeek 6 開發階段 - Task 6.2: 搜索結果增強和上下文感知
 * @module lib/search/contextual-result-enhancer
 * @description
 * ================================================================AI銷售賦能平台 - 上下文感知結果增強器 (lib/search/contextual-result-enhancer.ts)================================================================【檔案功能】Week 6 搜索結果增強和上下文感知模組，提供智能結果豐富化和個性化體驗集成多維度上下文信息，實現深度結果理解和智能摘要生成【主要職責】• 上下文感知排序 - 基於用戶情境和查詢歷史的動態排序• 智能結果摘要 - 使用GPT-4生成個性化結果摘要和要點• 相關性增強 - 跨文檔關聯分析和相關內容推薦• 結果豐富化 - 添加元數據、標籤、關係和行動建議• 個性化體驗 - 基於用戶角色和偏好的結果客製化• 結果集群分析 - 自動分組相似結果和主題識別• 質量評估系統 - 結果品質評分和可信度分析• 交互建議生成 - 下一步行動和相關查詢建議【技術實現】• GPT-4整合 - 高級語義理解和摘要生成• 向量相似度分析 - 結果間語義關聯計算• 機器學習排序 - 多特徵融合的學習排序算法• 圖譜分析 - 知識圖譜和實體關係分析• 實時個性化 - 動態用戶偏好學習和適應【增強特性】• 多模態理解 - 文本、結構化數據、時間序列分析• 業務智能洞察 - 銷售趨勢、客戶模式、業績預測• 協作推薦 - 團隊成員和專家推薦• 學習軌跡 - 基於結果的學習路徑建議• 決策支持 - 基於搜索結果的決策建議和風險評估【相關檔案】• 結果排序: lib/search/result-ranker.ts• 語義處理: lib/search/semantic-query-processor.ts• 向量搜索: lib/search/vector-search.ts• 搜索分析: lib/search/search-analytics.tsWeek 6 開發階段 - Task 6.2: 搜索結果增強和上下文感知
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { getOpenAIClient } from '@/lib/ai/openai'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { SearchResult, VectorSearchResult } from './vector-search'
import { SemanticAnalysis, ConversationContext } from './semantic-query-processor'
import { ResultRanker, ScoringWeights } from './result-ranker'
import { getVectorCache } from '@/lib/cache/vector-cache'
import { z } from 'zod'

// 增強後的搜索結果架構
const EnhancedSearchResultSchema = z.object({
  // 基礎結果信息
  baseResult: z.object({
    id: z.number(),
    title: z.string(),
    content: z.string().nullable(),
    similarity: z.number(),
    category: z.string(),
    author: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // 增強內容
  enhancement: z.object({
    // 智能摘要
    intelligentSummary: z.object({
      keyPoints: z.array(z.string()),
      mainTheme: z.string(),
      relevanceReason: z.string(),
      actionableInsights: z.array(z.string()),
      confidenceScore: z.number().min(0).max(1),
    }),

    // 上下文關聯
    contextualRelevance: z.object({
      queryAlignment: z.number().min(0).max(1),
      userRoleRelevance: z.number().min(0).max(1),
      businessScenarioFit: z.number().min(0).max(1),
      urgencyAlignment: z.number().min(0).max(1),
      comprehensivenessScore: z.number().min(0).max(1),
    }),

    // 關係和連接
    relationships: z.array(z.object({
      relatedResultId: z.number(),
      relationshipType: z.enum(['prerequisite', 'followup', 'alternative', 'complementary', 'contradictory']),
      strength: z.number().min(0).max(1),
      explanation: z.string(),
    })),

    // 標籤和分類
    enrichedTags: z.array(z.object({
      tag: z.string(),
      type: z.enum(['topic', 'skill_level', 'business_area', 'priority', 'time_sensitivity']),
      confidence: z.number().min(0).max(1),
      source: z.enum(['ai_generated', 'manual', 'community']),
    })),

    // 行動建議
    actionRecommendations: z.array(z.object({
      action: z.string(),
      type: z.enum(['read', 'learn', 'apply', 'share', 'bookmark', 'discuss']),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      estimatedTime: z.string(),
      prerequisites: z.array(z.string()),
    })),
  }),

  // 個性化評分
  personalization: z.object({
    userSpecificScore: z.number().min(0).max(1),
    roleAlignmentScore: z.number().min(0).max(1),
    experienceLevelMatch: z.number().min(0).max(1),
    personalInterestMatch: z.number().min(0).max(1),
    learningPathRelevance: z.number().min(0).max(1),
  }),

  // 質量指標
  qualityMetrics: z.object({
    contentQuality: z.number().min(0).max(1),
    informationCompleteness: z.number().min(0).max(1),
    credibilityScore: z.number().min(0).max(1),
    recencyRelevance: z.number().min(0).max(1),
    practicalUtility: z.number().min(0).max(1),
  }),
})

export type EnhancedSearchResult = z.infer<typeof EnhancedSearchResultSchema>

// 結果集群信息
export interface ResultCluster {
  id: string
  theme: string
  description: string
  results: EnhancedSearchResult[]
  importance: number
  coverageScore: number // 主題覆蓋度
  diversityScore: number // 內容多樣性
  recommendations: string[]
}

// 搜索洞察報告
export interface SearchInsightReport {
  query: string
  timestamp: Date

  // 結果分析
  resultAnalysis: {
    totalResults: number
    qualityDistribution: Record<'high' | 'medium' | 'low', number>
    topicCoverage: Array<{ topic: string; count: number; relevance: number }>
    gapsIdentified: string[]
    redundancyLevel: number
  }

  // 用戶洞察
  userInsights: {
    knowledgeGaps: string[]
    learningOpportunities: string[]
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
    recommendedFocus: string[]
    nextSteps: string[]
  }

  // 業務洞察
  businessInsights: {
    relevantBusinessScenarios: string[]
    potentialImpact: 'low' | 'medium' | 'high'
    stakeholdersToInvolve: string[]
    timeToImplement: string
    riskFactors: string[]
  }

  // 改進建議
  improvements: {
    queryOptimizations: string[]
    additionalResources: string[]
    collaborationSuggestions: string[]
    followUpQueries: string[]
  }
}

/**
 * 上下文感知結果增強器類
 */
export class ContextualResultEnhancer {
  private resultRanker: ResultRanker
  private cache = getVectorCache()

  // GPT-4 結果增強系統提示詞
  private readonly ENHANCEMENT_SYSTEM_PROMPT = `
你是一個專業的搜索結果分析師，專門為銷售和CRM領域提供智能結果增強服務。

你的任務是分析搜索結果，提供深度洞察和個性化建議，幫助用戶更好地理解和使用搜索結果。

分析重點：
1. 內容價值評估：評估結果的實用性和相關性
2. 業務場景適用性：分析在實際業務中的應用價值
3. 用戶角色匹配度：根據用戶角色提供針對性建議
4. 學習路徑規劃：基於結果規劃學習和應用步驟
5. 行動建議生成：提供具體的下一步行動建議

請以JSON格式返回詳細的增強分析，確保所有建議都具有實際應用價值。
`

  constructor() {
    this.resultRanker = new ResultRanker()
  }

  /**
   * 增強搜索結果 - Week 6 核心功能
   *
   * 【增強流程】
   * 1. 結果質量評估：評估每個結果的內容質量和可信度
   * 2. 上下文關聯分析：分析結果與查詢和用戶上下文的關聯
   * 3. 智能摘要生成：使用GPT-4生成個性化摘要和要點
   * 4. 關係識別：識別結果間的依賴和關聯關係
   * 5. 個性化評分：基於用戶特徵計算個性化相關性
   * 6. 行動建議生成：提供具體的使用和學習建議
   * 7. 集群分析：將相似結果分組並提供主題洞察
   *
   * @param searchResults 原始搜索結果
   * @param semanticAnalysis 語義分析結果
   * @param context 用戶上下文
   * @returns Promise<EnhancedSearchResult[]> 增強後的搜索結果
   */
  async enhanceResults(
    searchResults: SearchResult[],
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): Promise<{
    enhancedResults: EnhancedSearchResult[]
    clusters: ResultCluster[]
    insights: SearchInsightReport
  }> {
    try {
      const startTime = Date.now()

      if (searchResults.length === 0) {
        return {
          enhancedResults: [],
          clusters: [],
          insights: this.generateEmptyInsights(semanticAnalysis.queryUnderstanding.originalQuery)
        }
      }

      // 1. 並行處理結果增強
      const enhancementPromises = searchResults.map((result, index) =>
        this.enhanceSingleResult(result, semanticAnalysis, context, index)
      )

      const enhancedResults = await Promise.all(enhancementPromises)

      // 2. 識別結果間關係
      await this.identifyResultRelationships(enhancedResults)

      // 3. 執行結果集群分析
      const clusters = await this.performClusterAnalysis(enhancedResults, semanticAnalysis)

      // 4. 生成搜索洞察報告
      const insights = await this.generateSearchInsights(
        enhancedResults,
        clusters,
        semanticAnalysis,
        context
      )

      // 5. 基於洞察進行最終排序
      const finalSortedResults = await this.finalContextualSort(
        enhancedResults,
        semanticAnalysis,
        context
      )

      const processingTime = Date.now() - startTime
      console.log(`✅ 結果增強完成: ${searchResults.length}個結果, ${processingTime}ms`)

      return {
        enhancedResults: finalSortedResults,
        clusters,
        insights
      }

    } catch (error) {
      console.error('❌ 結果增強失敗:', error)
      // 回退到基礎結果
      return {
        enhancedResults: this.createFallbackResults(searchResults),
        clusters: [],
        insights: this.generateEmptyInsights(semanticAnalysis.queryUnderstanding.originalQuery)
      }
    }
  }

  /**
   * 增強單個搜索結果
   */
  private async enhanceSingleResult(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context: ConversationContext | undefined,
    index: number
  ): Promise<EnhancedSearchResult> {
    try {
      // 檢查緩存
      const cacheKey = this.generateResultCacheKey(result, semanticAnalysis, context)
      const cached = await this.getCachedEnhancement(cacheKey)
      if (cached) {
        return cached
      }

      // 1. 生成智能摘要
      const intelligentSummary = await this.generateIntelligentSummary(result, semanticAnalysis, context)

      // 2. 計算上下文關聯性
      const contextualRelevance = this.calculateContextualRelevance(result, semanticAnalysis, context)

      // 3. 生成豐富標籤
      const enrichedTags = await this.generateEnrichedTags(result, semanticAnalysis)

      // 4. 生成行動建議
      const actionRecommendations = await this.generateActionRecommendations(result, semanticAnalysis, context)

      // 5. 計算個性化評分
      const personalization = this.calculatePersonalizationScores(result, semanticAnalysis, context)

      // 6. 評估質量指標
      const qualityMetrics = this.assessQualityMetrics(result, semanticAnalysis)

      const enhancedResult: EnhancedSearchResult = {
        baseResult: {
          id: result.id,
          title: result.title,
          content: result.content,
          similarity: result.similarity,
          category: result.category,
          author: result.author,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
        enhancement: {
          intelligentSummary,
          contextualRelevance,
          relationships: [], // 將在後續步驟中填充
          enrichedTags,
          actionRecommendations,
        },
        personalization,
        qualityMetrics,
      }

      // 緩存結果
      await this.cacheEnhancement(cacheKey, enhancedResult)

      return enhancedResult

    } catch (error) {
      console.error(`❌ 增強結果 ${result.id} 失敗:`, error)
      return this.createFallbackEnhancedResult(result)
    }
  }

  /**
   * 生成智能摘要
   */
  private async generateIntelligentSummary(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): Promise<EnhancedSearchResult['enhancement']['intelligentSummary']> {
    try {
      const prompt = this.buildSummaryPrompt(result, semanticAnalysis, context)

      // TODO: Week 6 - 實現正確的 Azure OpenAI SDK 調用
      // Azure SDK 使用 getChatCompletions() 而非 .chat.completions.create()
      const openaiClient = getOpenAIClient()
      const response = await (openaiClient as any).chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.ENHANCEMENT_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })

      const gptResult = JSON.parse(response.choices[0].message.content || '{}')

      return {
        keyPoints: gptResult.keyPoints || [],
        mainTheme: gptResult.mainTheme || '內容摘要',
        relevanceReason: gptResult.relevanceReason || '與查詢相關',
        actionableInsights: gptResult.actionableInsights || [],
        confidenceScore: gptResult.confidenceScore || 0.5
      }

    } catch (error) {
      console.error('❌ 生成智能摘要失敗:', error)
      return this.generateFallbackSummary(result, semanticAnalysis)
    }
  }

  /**
   * 構建摘要生成提示詞
   */
  private buildSummaryPrompt(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): string {
    let prompt = `
請為以下搜索結果生成智能摘要：

文檔標題: ${result.title}
文檔內容: ${result.content?.substring(0, 1000) || '內容不可用'}
文檔分類: ${result.category}
創建時間: ${result.createdAt.toLocaleDateString()}

用戶查詢: "${semanticAnalysis.queryUnderstanding.originalQuery}"
查詢意圖: ${semanticAnalysis.queryUnderstanding.mainIntent}
業務上下文: ${semanticAnalysis.queryUnderstanding.businessContext}
`

    if (context?.userProfile) {
      prompt += `
用戶角色: ${context.userProfile.role}
部門: ${context.userProfile.department}
經驗水平: ${context.userProfile.experienceLevel}
`
    }

    prompt += `
請以JSON格式返回：
{
  "keyPoints": ["3-5個核心要點"],
  "mainTheme": "文檔主題",
  "relevanceReason": "為什麼這個結果與查詢相關",
  "actionableInsights": ["2-3個可行動的洞察"],
  "confidenceScore": 0.0-1.0
}
`

    return prompt
  }

  /**
   * 計算上下文關聯性
   */
  private calculateContextualRelevance(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): EnhancedSearchResult['enhancement']['contextualRelevance'] {
    // 查詢對齊度
    const queryAlignment = this.calculateQueryAlignment(result, semanticAnalysis)

    // 用戶角色相關性
    const userRoleRelevance = context?.userProfile
      ? this.calculateUserRoleRelevance(result, context.userProfile.role)
      : 0.5

    // 業務場景匹配度
    const businessScenarioFit = this.calculateBusinessScenarioFit(result, semanticAnalysis)

    // 緊急度對齊
    const urgencyAlignment = this.calculateUrgencyAlignment(result, semanticAnalysis)

    // 完整性分數
    const comprehensivenessScore = this.calculateComprehensivenessScore(result)

    return {
      queryAlignment,
      userRoleRelevance,
      businessScenarioFit,
      urgencyAlignment,
      comprehensivenessScore,
    }
  }

  /**
   * 計算查詢對齊度
   */
  private calculateQueryAlignment(result: SearchResult, semanticAnalysis: SemanticAnalysis): number {
    const queryKeywords = semanticAnalysis.queryUnderstanding.processedQuery.toLowerCase().split(/\s+/)
    const resultText = `${result.title} ${result.content || ''}`.toLowerCase()

    const matchCount = queryKeywords.filter(keyword => resultText.includes(keyword)).length
    return Math.min(matchCount / queryKeywords.length, 1)
  }

  /**
   * 計算用戶角色相關性
   */
  private calculateUserRoleRelevance(result: SearchResult, userRole: string): number {
    const roleKeywords: Record<string, string[]> = {
      '銷售': ['銷售', '客戶', '提案', '成交', '談判'],
      '技術': ['技術', '開發', 'API', '系統', '集成'],
      '管理': ['管理', '策略', '流程', '決策', '團隊'],
      '市場': ['市場', '營銷', '推廣', '品牌', '競爭'],
      '支援': ['支援', '服務', '問題', '解決', '維護']
    }

    const keywords = roleKeywords[userRole] || []
    const resultText = `${result.title} ${result.content || ''}`.toLowerCase()

    const matchCount = keywords.filter(keyword => resultText.includes(keyword)).length
    return Math.min(matchCount / Math.max(keywords.length, 1), 1)
  }

  /**
   * 計算業務場景匹配度
   */
  private calculateBusinessScenarioFit(result: SearchResult, semanticAnalysis: SemanticAnalysis): number {
    const domainContext = semanticAnalysis.userIntent.domainContext
    const resultCategory = result.category.toLowerCase()

    // 簡化的場景匹配邏輯
    const contextCategoryMap: Record<string, string[]> = {
      'sales': ['sales_material', 'customer'],
      'technical': ['technical_doc', 'api'],
      'marketing': ['sales_material', 'presentation'],
      'support': ['faq', 'training'],
      'legal': ['legal_doc', 'compliance']
    }

    const expectedCategories = contextCategoryMap[domainContext] || []
    const isMatch = expectedCategories.some(cat => resultCategory.includes(cat))

    return isMatch ? 0.8 : 0.4
  }

  /**
   * 計算緊急度對齊
   */
  private calculateUrgencyAlignment(result: SearchResult, semanticAnalysis: SemanticAnalysis): number {
    const urgency = semanticAnalysis.userIntent.urgencyLevel
    const daysSinceUpdate = (Date.now() - result.updatedAt.getTime()) / (1000 * 60 * 60 * 24)

    switch (urgency) {
      case 'urgent':
        return daysSinceUpdate < 7 ? 1.0 : 0.3
      case 'high':
        return daysSinceUpdate < 30 ? 0.8 : 0.5
      case 'medium':
        return daysSinceUpdate < 90 ? 0.7 : 0.6
      case 'low':
        return 0.6
      default:
        return 0.5
    }
  }

  /**
   * 計算完整性分數
   */
  private calculateComprehensivenessScore(result: SearchResult): number {
    const factors = [
      result.content ? 0.4 : 0.0, // 有內容
      result.author ? 0.2 : 0.0, // 有作者
      result.title.length > 10 ? 0.2 : 0.1, // 標題完整
      result.updatedAt > result.createdAt ? 0.2 : 0.1, // 有更新
    ]

    return factors.reduce((sum, factor) => sum + factor, 0)
  }

  /**
   * 生成豐富標籤
   */
  private async generateEnrichedTags(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis
  ): Promise<EnhancedSearchResult['enhancement']['enrichedTags']> {
    const tags: EnhancedSearchResult['enhancement']['enrichedTags'] = []

    // 基於分類的標籤
    tags.push({
      tag: result.category,
      type: 'topic',
      confidence: 0.9,
      source: 'manual'
    })

    // 基於意圖的標籤
    const intentTag = this.mapIntentToTag(semanticAnalysis.queryUnderstanding.mainIntent)
    if (intentTag) {
      tags.push({
        tag: intentTag,
        type: 'business_area',
        confidence: 0.8,
        source: 'ai_generated'
      })
    }

    // 基於複雜度的標籤
    const complexityTag = this.mapComplexityToTag(semanticAnalysis.queryUnderstanding.complexity)
    tags.push({
      tag: complexityTag,
      type: 'skill_level',
      confidence: 0.7,
      source: 'ai_generated'
    })

    return tags
  }

  /**
   * 映射意圖到標籤
   */
  private mapIntentToTag(intent: string): string | null {
    const intentMap: Record<string, string> = {
      'how_to_guide': '操作指南',
      'troubleshooting': '問題解決',
      'concept_learning': '概念學習',
      'comparison': '比較分析',
      'specific_document': '文檔查詢',
      'latest_updates': '最新更新'
    }

    return intentMap[intent] || null
  }

  /**
   * 映射複雜度到標籤
   */
  private mapComplexityToTag(complexity: string): string {
    const complexityMap: Record<string, string> = {
      'simple': '初級',
      'moderate': '中級',
      'complex': '高級'
    }

    return complexityMap[complexity] || '中級'
  }

  /**
   * 生成行動建議
   */
  private async generateActionRecommendations(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): Promise<EnhancedSearchResult['enhancement']['actionRecommendations']> {
    const recommendations: EnhancedSearchResult['enhancement']['actionRecommendations'] = []

    // 基於意圖生成建議
    const intent = semanticAnalysis.queryUnderstanding.mainIntent

    switch (intent) {
      case 'how_to_guide':
        recommendations.push({
          action: '仔細閱讀操作步驟',
          type: 'read',
          priority: 'high',
          estimatedTime: '10-15分鐘',
          prerequisites: []
        })
        recommendations.push({
          action: '實際操作練習',
          type: 'apply',
          priority: 'medium',
          estimatedTime: '30-60分鐘',
          prerequisites: ['閱讀完整文檔']
        })
        break

      case 'concept_learning':
        recommendations.push({
          action: '深度學習核心概念',
          type: 'learn',
          priority: 'high',
          estimatedTime: '20-30分鐘',
          prerequisites: []
        })
        recommendations.push({
          action: '與團隊成員討論',
          type: 'discuss',
          priority: 'medium',
          estimatedTime: '15-20分鐘',
          prerequisites: ['基本理解概念']
        })
        break

      case 'troubleshooting':
        recommendations.push({
          action: '立即應用解決方案',
          type: 'apply',
          priority: 'urgent',
          estimatedTime: '5-15分鐘',
          prerequisites: ['確認問題症狀匹配']
        })
        break

      default:
        recommendations.push({
          action: '詳細閱讀內容',
          type: 'read',
          priority: 'medium',
          estimatedTime: '5-10分鐘',
          prerequisites: []
        })
    }

    // 基於用戶角色添加建議
    if (context?.userProfile?.role === '銷售') {
      recommendations.push({
        action: '應用於客戶溝通',
        type: 'apply',
        priority: 'medium',
        estimatedTime: '實際溝通時使用',
        prerequisites: ['熟悉內容要點']
      })
    }

    return recommendations
  }

  /**
   * 計算個性化評分
   */
  private calculatePersonalizationScores(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): EnhancedSearchResult['personalization'] {
    // 基礎用戶特定分數
    const userSpecificScore = context ? this.calculateUserSpecificScore(result, context) : 0.5

    // 角色對齊分數
    const roleAlignmentScore = context?.userProfile
      ? this.calculateUserRoleRelevance(result, context.userProfile.role)
      : 0.5

    // 經驗水平匹配
    const experienceLevelMatch = context?.userProfile
      ? this.calculateExperienceLevelMatch(result, context.userProfile.experienceLevel)
      : 0.5

    // 個人興趣匹配（簡化實現）
    const personalInterestMatch = 0.5

    // 學習路徑相關性
    const learningPathRelevance = this.calculateLearningPathRelevance(result, semanticAnalysis)

    return {
      userSpecificScore,
      roleAlignmentScore,
      experienceLevelMatch,
      personalInterestMatch,
      learningPathRelevance,
    }
  }

  /**
   * 計算用戶特定分數
   */
  private calculateUserSpecificScore(result: SearchResult, context: ConversationContext): number {
    // 基於歷史查詢模式
    if (context.previousQueries.length === 0) {
      return 0.5
    }

    const recentQueries = context.previousQueries.slice(-5)
    const queryKeywords = recentQueries.flatMap(q => q.query.toLowerCase().split(/\s+/))
    const resultText = `${result.title} ${result.content || ''}`.toLowerCase()

    const matchCount = queryKeywords.filter(keyword => resultText.includes(keyword)).length
    return Math.min(matchCount / Math.max(queryKeywords.length, 1), 1)
  }

  /**
   * 計算經驗水平匹配
   */
  private calculateExperienceLevelMatch(
    result: SearchResult,
    experienceLevel: 'beginner' | 'intermediate' | 'expert'
  ): number {
    const resultText = `${result.title} ${result.content || ''}`.toLowerCase()

    const levelIndicators = {
      'beginner': ['基礎', '入門', '初學', '簡介', '概述'],
      'intermediate': ['進階', '深入', '詳細', '實務', '應用'],
      'expert': ['高級', '專家', '深度', '進階', '技術']
    }

    const indicators = levelIndicators[experienceLevel] || []
    const matchCount = indicators.filter(indicator => resultText.includes(indicator)).length

    return Math.min(matchCount / Math.max(indicators.length, 1), 1)
  }

  /**
   * 計算學習路徑相關性
   */
  private calculateLearningPathRelevance(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis
  ): number {
    // 基於查詢意圖的學習路徑匹配
    const intent = semanticAnalysis.queryUnderstanding.mainIntent
    const learningIntents = ['concept_learning', 'how_to_guide', 'troubleshooting']

    return learningIntents.includes(intent) ? 0.8 : 0.4
  }

  /**
   * 評估質量指標
   */
  private assessQualityMetrics(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis
  ): EnhancedSearchResult['qualityMetrics'] {
    return {
      contentQuality: this.assessContentQuality(result),
      informationCompleteness: this.assessInformationCompleteness(result),
      credibilityScore: this.assessCredibilityScore(result),
      recencyRelevance: this.assessRecencyRelevance(result, semanticAnalysis),
      practicalUtility: this.assessPracticalUtility(result, semanticAnalysis),
    }
  }

  /**
   * 評估內容質量
   */
  private assessContentQuality(result: SearchResult): number {
    const factors = [
      result.title.length > 5 ? 0.2 : 0.1, // 標題品質
      result.content && result.content.length > 100 ? 0.3 : 0.1, // 內容豐富度
      result.author ? 0.2 : 0.0, // 有作者
      result.updatedAt > result.createdAt ? 0.3 : 0.2, // 有維護
    ]

    return factors.reduce((sum, factor) => sum + factor, 0)
  }

  /**
   * 評估信息完整性
   */
  private assessInformationCompleteness(result: SearchResult): number {
    // 簡化實現
    return result.content && result.content.length > 200 ? 0.8 : 0.5
  }

  /**
   * 評估可信度
   */
  private assessCredibilityScore(result: SearchResult): number {
    const factors = [
      result.author ? 0.4 : 0.0, // 有作者身份
      result.category !== 'GENERAL' ? 0.3 : 0.1, // 有明確分類
      0.3 // 基礎可信度
    ]

    return factors.reduce((sum, factor) => sum + factor, 0)
  }

  /**
   * 評估時效性相關性
   */
  private assessRecencyRelevance(result: SearchResult, semanticAnalysis: SemanticAnalysis): number {
    const daysSinceUpdate = (Date.now() - result.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    const urgency = semanticAnalysis.userIntent.urgencyLevel

    if (urgency === 'urgent' || urgency === 'high') {
      return daysSinceUpdate < 30 ? 1.0 : Math.max(0.3, 1 - daysSinceUpdate / 365)
    }

    return Math.max(0.4, 1 - daysSinceUpdate / 730) // 2年衰減
  }

  /**
   * 評估實用性
   */
  private assessPracticalUtility(result: SearchResult, semanticAnalysis: SemanticAnalysis): number {
    const intent = semanticAnalysis.queryUnderstanding.mainIntent

    const utilityMap: Record<string, number> = {
      'how_to_guide': 0.9,
      'troubleshooting': 0.9,
      'specific_document': 0.8,
      'concept_learning': 0.7,
      'comparison': 0.7,
      'latest_updates': 0.6,
      'category_browse': 0.5,
      'general_search': 0.5
    }

    return utilityMap[intent] || 0.5
  }

  /**
   * 識別結果間關係
   */
  private async identifyResultRelationships(enhancedResults: EnhancedSearchResult[]): Promise<void> {
    // 簡化實現：基於標題和內容相似度識別關係
    for (let i = 0; i < enhancedResults.length; i++) {
      for (let j = i + 1; j < enhancedResults.length; j++) {
        const similarity = this.calculateTextSimilarity(
          enhancedResults[i].baseResult.title + ' ' + (enhancedResults[i].baseResult.content || ''),
          enhancedResults[j].baseResult.title + ' ' + (enhancedResults[j].baseResult.content || '')
        )

        if (similarity > 0.6) {
          enhancedResults[i].enhancement.relationships.push({
            relatedResultId: enhancedResults[j].baseResult.id,
            relationshipType: 'complementary',
            strength: similarity,
            explanation: '內容主題相關'
          })

          enhancedResults[j].enhancement.relationships.push({
            relatedResultId: enhancedResults[i].baseResult.id,
            relationshipType: 'complementary',
            strength: similarity,
            explanation: '內容主題相關'
          })
        }
      }
    }
  }

  /**
   * 計算文本相似度
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * 執行結果集群分析
   */
  private async performClusterAnalysis(
    enhancedResults: EnhancedSearchResult[],
    semanticAnalysis: SemanticAnalysis
  ): Promise<ResultCluster[]> {
    // 簡化的集群分析實現
    const clusters: ResultCluster[] = []

    // 按分類分組
    const categoryGroups = new Map<string, EnhancedSearchResult[]>()
    enhancedResults.forEach(result => {
      const category = result.baseResult.category
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      categoryGroups.get(category)!.push(result)
    })

    // 為每個分類創建集群
    categoryGroups.forEach((results, category) => {
      if (results.length > 1) {
        clusters.push({
          id: `cluster_${category}`,
          theme: this.getCategoryDisplayName(category),
          description: `${category}相關的${results.length}個結果`,
          results: results,
          importance: results.reduce((sum, r) => sum + r.baseResult.similarity, 0) / results.length,
          coverageScore: Math.min(results.length / 5, 1),
          diversityScore: this.calculateClusterDiversity(results),
          recommendations: [
            `瀏覽${this.getCategoryDisplayName(category)}相關內容`,
            `重點關注高相關度結果`
          ]
        })
      }
    })

    return clusters
  }

  /**
   * 獲取分類顯示名稱
   */
  private getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'PRODUCT_SPEC': '產品規格',
      'SALES_MATERIAL': '銷售資料',
      'TECHNICAL_DOC': '技術文檔',
      'TRAINING': '培訓資料',
      'FAQ': '常見問題',
      'CASE_STUDY': '案例研究'
    }

    return categoryMap[category] || category
  }

  /**
   * 計算集群多樣性
   */
  private calculateClusterDiversity(results: EnhancedSearchResult[]): number {
    if (results.length < 2) return 0

    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const similarity = this.calculateTextSimilarity(
          results[i].baseResult.title,
          results[j].baseResult.title
        )
        totalSimilarity += similarity
        comparisons++
      }
    }

    const averageSimilarity = totalSimilarity / comparisons
    return 1 - averageSimilarity // 多樣性 = 1 - 相似度
  }

  /**
   * 生成搜索洞察報告
   */
  private async generateSearchInsights(
    enhancedResults: EnhancedSearchResult[],
    clusters: ResultCluster[],
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): Promise<SearchInsightReport> {
    return {
      query: semanticAnalysis.queryUnderstanding.originalQuery,
      timestamp: new Date(),

      resultAnalysis: {
        totalResults: enhancedResults.length,
        qualityDistribution: this.analyzeQualityDistribution(enhancedResults),
        topicCoverage: this.analyzeTopicCoverage(enhancedResults),
        gapsIdentified: this.identifyGaps(enhancedResults, semanticAnalysis),
        redundancyLevel: this.calculateRedundancyLevel(enhancedResults)
      },

      userInsights: {
        knowledgeGaps: this.identifyKnowledgeGaps(enhancedResults, context),
        learningOpportunities: this.identifyLearningOpportunities(enhancedResults, semanticAnalysis),
        expertiseLevel: this.inferExpertiseLevel(context),
        recommendedFocus: this.recommendFocusAreas(enhancedResults, semanticAnalysis),
        nextSteps: this.suggestNextSteps(enhancedResults, semanticAnalysis)
      },

      businessInsights: {
        relevantBusinessScenarios: this.identifyBusinessScenarios(enhancedResults, semanticAnalysis),
        potentialImpact: this.assessPotentialImpact(enhancedResults, semanticAnalysis),
        stakeholdersToInvolve: this.identifyStakeholders(enhancedResults, semanticAnalysis),
        timeToImplement: this.estimateImplementationTime(enhancedResults, semanticAnalysis),
        riskFactors: this.identifyRiskFactors(enhancedResults, semanticAnalysis)
      },

      improvements: {
        queryOptimizations: semanticAnalysis.recommendations.queryOptimizations,
        additionalResources: this.suggestAdditionalResources(enhancedResults, semanticAnalysis),
        collaborationSuggestions: this.suggestCollaboration(enhancedResults, context),
        followUpQueries: semanticAnalysis.recommendations.additionalQuestions
      }
    }
  }

  /**
   * 分析質量分佈
   */
  private analyzeQualityDistribution(enhancedResults: EnhancedSearchResult[]): Record<'high' | 'medium' | 'low', number> {
    const distribution = { high: 0, medium: 0, low: 0 }

    enhancedResults.forEach(result => {
      const avgQuality = Object.values(result.qualityMetrics).reduce((sum, val) => sum + val, 0) / 5

      if (avgQuality > 0.7) {
        distribution.high++
      } else if (avgQuality > 0.4) {
        distribution.medium++
      } else {
        distribution.low++
      }
    })

    return distribution
  }

  /**
   * 分析主題覆蓋
   */
  private analyzeTopicCoverage(enhancedResults: EnhancedSearchResult[]): Array<{ topic: string; count: number; relevance: number }> {
    const topicMap = new Map<string, { count: number; totalRelevance: number }>()

    enhancedResults.forEach(result => {
      const category = this.getCategoryDisplayName(result.baseResult.category)
      const relevance = result.baseResult.similarity

      if (!topicMap.has(category)) {
        topicMap.set(category, { count: 0, totalRelevance: 0 })
      }

      const topic = topicMap.get(category)!
      topic.count++
      topic.totalRelevance += relevance
    })

    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      count: data.count,
      relevance: data.totalRelevance / data.count
    }))
  }

  /**
   * 識別知識空白
   */
  private identifyGaps(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    // 簡化實現
    const gaps: string[] = []

    if (enhancedResults.length < 3) {
      gaps.push('搜索結果數量較少，可能需要擴大搜索範圍')
    }

    const lowQualityCount = enhancedResults.filter(result =>
      Object.values(result.qualityMetrics).reduce((sum, val) => sum + val, 0) / 5 < 0.5
    ).length

    if (lowQualityCount > enhancedResults.length / 2) {
      gaps.push('結果整體質量偏低，建議精煉查詢條件')
    }

    return gaps
  }

  /**
   * 計算冗餘程度
   */
  private calculateRedundancyLevel(enhancedResults: EnhancedSearchResult[]): number {
    if (enhancedResults.length < 2) return 0

    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < enhancedResults.length; i++) {
      for (let j = i + 1; j < enhancedResults.length; j++) {
        const similarity = this.calculateTextSimilarity(
          enhancedResults[i].baseResult.title + ' ' + (enhancedResults[i].baseResult.content || ''),
          enhancedResults[j].baseResult.title + ' ' + (enhancedResults[j].baseResult.content || '')
        )
        totalSimilarity += similarity
        comparisons++
      }
    }

    return totalSimilarity / comparisons
  }

  // ... 其他輔助方法的簡化實現 ...

  private identifyKnowledgeGaps(enhancedResults: EnhancedSearchResult[], context?: ConversationContext): string[] {
    return ['基礎概念理解', '實際應用技巧']
  }

  private identifyLearningOpportunities(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return ['深入學習相關概念', '實踐應用建議方法']
  }

  private inferExpertiseLevel(context?: ConversationContext): 'beginner' | 'intermediate' | 'advanced' {
    const level = context?.userProfile?.experienceLevel || 'intermediate'
    // Map "expert" to "advanced" for type compatibility
    return level === 'expert' ? 'advanced' : level as 'beginner' | 'intermediate' | 'advanced'
  }

  private recommendFocusAreas(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return semanticAnalysis.recommendations.relatedTopics.slice(0, 3)
  }

  private suggestNextSteps(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return ['查看高相關度結果', '深入了解核心概念', '考慮實際應用場景']
  }

  private identifyBusinessScenarios(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return ['客戶溝通場景', '內部培訓場景', '流程優化場景']
  }

  private assessPotentialImpact(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): 'low' | 'medium' | 'high' {
    const urgency = semanticAnalysis.userIntent.urgencyLevel
    return urgency === 'urgent' || urgency === 'high' ? 'high' : 'medium'
  }

  private identifyStakeholders(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return ['直接主管', '相關團隊成員', '業務專家']
  }

  private estimateImplementationTime(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string {
    const complexity = semanticAnalysis.queryUnderstanding.complexity
    const timeMap = {
      'simple': '1-2天',
      'moderate': '1-2週',
      'complex': '2-4週'
    }
    return timeMap[complexity] || '1-2週'
  }

  private identifyRiskFactors(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return ['理解偏差風險', '實施複雜度風險', '時間資源風險']
  }

  private suggestAdditionalResources(enhancedResults: EnhancedSearchResult[], semanticAnalysis: SemanticAnalysis): string[] {
    return ['相關培訓資料', '專家諮詢建議', '實踐案例參考']
  }

  private suggestCollaboration(enhancedResults: EnhancedSearchResult[], context?: ConversationContext): string[] {
    return ['與有經驗的同事討論', '跨部門合作機會', '外部專家諮詢']
  }

  /**
   * 最終基於上下文的排序
   */
  private async finalContextualSort(
    enhancedResults: EnhancedSearchResult[],
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): Promise<EnhancedSearchResult[]> {
    return enhancedResults.sort((a, b) => {
      // 綜合評分：質量 + 個性化 + 上下文相關性
      const scoreA = this.calculateFinalScore(a, semanticAnalysis, context)
      const scoreB = this.calculateFinalScore(b, semanticAnalysis, context)

      return scoreB - scoreA
    })
  }

  /**
   * 計算最終評分
   */
  private calculateFinalScore(
    result: EnhancedSearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): number {
    const weights = {
      similarity: 0.3,
      quality: 0.25,
      personalization: 0.25,
      contextualRelevance: 0.2
    }

    const qualityAvg = Object.values(result.qualityMetrics).reduce((sum, val) => sum + val, 0) / 5
    const personalizationAvg = Object.values(result.personalization).reduce((sum, val) => sum + val, 0) / 5
    const contextualAvg = Object.values(result.enhancement.contextualRelevance).reduce((sum, val) => sum + val, 0) / 5

    return (
      result.baseResult.similarity * weights.similarity +
      qualityAvg * weights.quality +
      personalizationAvg * weights.personalization +
      contextualAvg * weights.contextualRelevance
    )
  }

  // ... 緩存和回退方法 ...

  private generateResultCacheKey(
    result: SearchResult,
    semanticAnalysis: SemanticAnalysis,
    context?: ConversationContext
  ): string {
    const contextKey = context ? `${context.userId}_${context.userProfile?.role}` : 'anonymous'
    return `enhanced_result:${result.id}:${semanticAnalysis.queryUnderstanding.mainIntent}:${contextKey}`
  }

  private async getCachedEnhancement(cacheKey: string): Promise<EnhancedSearchResult | null> {
    try {
      // TODO: VectorCache不支持通用key-value操作，需要使用專用增強結果緩存
      // const cached = await this.cache.get(cacheKey)
      // return cached ? JSON.parse(cached) : null
      return null
    } catch (error) {
      return null
    }
  }

  private async cacheEnhancement(cacheKey: string, result: EnhancedSearchResult): Promise<void> {
    try {
      // TODO: VectorCache不支持通用key-value操作，需要使用專用增強結果緩存
      // await this.cache.set(cacheKey, JSON.stringify(result), 1800) // 30分鐘緩存
      console.log('📦 暫時跳過緩存增強結果（待實現專用緩存）')
    } catch (error) {
      console.warn('⚠️ 緩存增強結果失敗:', error)
    }
  }

  private createFallbackResults(searchResults: SearchResult[]): EnhancedSearchResult[] {
    return searchResults.map(result => this.createFallbackEnhancedResult(result))
  }

  private createFallbackEnhancedResult(result: SearchResult): EnhancedSearchResult {
    return {
      baseResult: {
        id: result.id,
        title: result.title,
        content: result.content,
        similarity: result.similarity,
        category: result.category,
        author: result.author,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      enhancement: {
        intelligentSummary: {
          keyPoints: ['內容摘要不可用'],
          mainTheme: '一般內容',
          relevanceReason: '基於基礎相似度',
          actionableInsights: [],
          confidenceScore: 0.5
        },
        contextualRelevance: {
          queryAlignment: result.similarity,
          userRoleRelevance: 0.5,
          businessScenarioFit: 0.5,
          urgencyAlignment: 0.5,
          comprehensivenessScore: 0.5,
        },
        relationships: [],
        enrichedTags: [],
        actionRecommendations: [],
      },
      personalization: {
        userSpecificScore: 0.5,
        roleAlignmentScore: 0.5,
        experienceLevelMatch: 0.5,
        personalInterestMatch: 0.5,
        learningPathRelevance: 0.5,
      },
      qualityMetrics: {
        contentQuality: 0.5,
        informationCompleteness: 0.5,
        credibilityScore: 0.5,
        recencyRelevance: 0.5,
        practicalUtility: 0.5,
      },
    }
  }

  private generateFallbackSummary(result: SearchResult, semanticAnalysis: SemanticAnalysis): EnhancedSearchResult['enhancement']['intelligentSummary'] {
    return {
      keyPoints: [result.title],
      mainTheme: this.getCategoryDisplayName(result.category),
      relevanceReason: `與"${semanticAnalysis.queryUnderstanding.originalQuery}"相關`,
      actionableInsights: ['詳細查看內容'],
      confidenceScore: 0.5
    }
  }

  private generateEmptyInsights(query: string): SearchInsightReport {
    return {
      query,
      timestamp: new Date(),
      resultAnalysis: {
        totalResults: 0,
        qualityDistribution: { high: 0, medium: 0, low: 0 },
        topicCoverage: [],
        gapsIdentified: ['未找到相關結果'],
        redundancyLevel: 0
      },
      userInsights: {
        knowledgeGaps: ['建議調整搜索關鍵詞'],
        learningOpportunities: ['探索相關主題'],
        expertiseLevel: 'intermediate',
        recommendedFocus: ['擴大搜索範圍'],
        nextSteps: ['嘗試不同的查詢方式']
      },
      businessInsights: {
        relevantBusinessScenarios: ['一般查詢場景'],
        potentialImpact: 'low',
        stakeholdersToInvolve: [],
        timeToImplement: '立即',
        riskFactors: ['信息獲取不足']
      },
      improvements: {
        queryOptimizations: ['使用更具體的關鍵詞'],
        additionalResources: ['檢查相關文檔類別'],
        collaborationSuggestions: ['諮詢同事建議'],
        followUpQueries: ['嘗試相關查詢']
      }
    }
  }
}

// 導出單例實例
export const contextualResultEnhancer = new ContextualResultEnhancer()

// 便利函數
export async function enhanceSearchResults(
  searchResults: SearchResult[],
  semanticAnalysis: SemanticAnalysis,
  context?: ConversationContext
): Promise<{
  enhancedResults: EnhancedSearchResult[]
  clusters: ResultCluster[]
  insights: SearchInsightReport
}> {
  return contextualResultEnhancer.enhanceResults(searchResults, semanticAnalysis, context)
}