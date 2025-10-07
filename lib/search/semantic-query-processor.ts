/**
 * @fileoverview ================================================================AI銷售賦能平台 - 高級語義查詢處理器 (lib/search/semantic-query-processor.ts)================================================================【檔案功能】Week 6 自然語言查詢處理增強模組，提供深度語義理解和智能查詢優化集成Azure OpenAI GPT-4進行高級自然語言處理和查詢意圖分析【主要職責】• 深度語義分析 - 使用GPT-4進行複雜語義理解和意圖推斷• 智能查詢重寫 - 自動優化查詢表達和語義擴展• 上下文感知處理 - 基於對話歷史和用戶狀態的查詢理解• 多輪對話支援 - 處理指代消解和上下文依賴查詢• 業務領域適應 - 針對銷售和CRM場景的專門優化• 查詢複雜度分析 - 識別簡單查詢vs複雜分析需求• 智能建議生成 - 基於查詢意圖的個性化搜索建議【技術實現】• Azure OpenAI GPT-4 - 大語言模型深度語義理解• 提示工程技術 - 專門設計的system prompt和few-shot示例• 語義向量化整合 - 結合embedding和LLM的混合方法• 緩存優化策略 - 智能緩存語義分析結果• 批量處理能力 - 支援多查詢並行處理【增強特性】• 查詢意圖細分 - 精細化意圖分類和置信度評估• 實體關係提取 - 識別查詢中的實體和關係• 情境推理能力 - 理解隱含的業務情境和需求• 查詢優化建議 - 主動提供查詢改進建議• 多語言深度支援 - 跨語言語義理解和翻譯【相關檔案】• 基礎查詢處理: lib/search/query-processor.ts• AI服務: lib/ai/chat.ts, lib/ai/embeddings.ts• 向量搜索: lib/search/vector-search.ts• 搜索分析: lib/search/search-analytics.tsWeek 6 開發階段 - Task 6.1: 自然語言查詢處理增強
 * @module lib/search/semantic-query-processor
 * @description
 * ================================================================AI銷售賦能平台 - 高級語義查詢處理器 (lib/search/semantic-query-processor.ts)================================================================【檔案功能】Week 6 自然語言查詢處理增強模組，提供深度語義理解和智能查詢優化集成Azure OpenAI GPT-4進行高級自然語言處理和查詢意圖分析【主要職責】• 深度語義分析 - 使用GPT-4進行複雜語義理解和意圖推斷• 智能查詢重寫 - 自動優化查詢表達和語義擴展• 上下文感知處理 - 基於對話歷史和用戶狀態的查詢理解• 多輪對話支援 - 處理指代消解和上下文依賴查詢• 業務領域適應 - 針對銷售和CRM場景的專門優化• 查詢複雜度分析 - 識別簡單查詢vs複雜分析需求• 智能建議生成 - 基於查詢意圖的個性化搜索建議【技術實現】• Azure OpenAI GPT-4 - 大語言模型深度語義理解• 提示工程技術 - 專門設計的system prompt和few-shot示例• 語義向量化整合 - 結合embedding和LLM的混合方法• 緩存優化策略 - 智能緩存語義分析結果• 批量處理能力 - 支援多查詢並行處理【增強特性】• 查詢意圖細分 - 精細化意圖分類和置信度評估• 實體關係提取 - 識別查詢中的實體和關係• 情境推理能力 - 理解隱含的業務情境和需求• 查詢優化建議 - 主動提供查詢改進建議• 多語言深度支援 - 跨語言語義理解和翻譯【相關檔案】• 基礎查詢處理: lib/search/query-processor.ts• AI服務: lib/ai/chat.ts, lib/ai/embeddings.ts• 向量搜索: lib/search/vector-search.ts• 搜索分析: lib/search/search-analytics.tsWeek 6 開發階段 - Task 6.1: 自然語言查詢處理增強
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { getOpenAIClient } from '@/lib/ai/openai'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { QueryProcessor, SearchIntent, ParsedQuery } from './query-processor'
import { getVectorCache } from '@/lib/cache/vector-cache'
import { z } from 'zod'

// 高級語義分析結果架構
const SemanticAnalysisSchema = z.object({
  // 查詢理解結果
  queryUnderstanding: z.object({
    originalQuery: z.string(),
    processedQuery: z.string(),
    mainIntent: z.string(),
    subIntents: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    businessContext: z.string().optional(),
  }),

  // 實體和關係提取
  entities: z.array(z.object({
    text: z.string(),
    type: z.enum(['person', 'organization', 'product', 'location', 'time', 'concept', 'process']),
    confidence: z.number().min(0).max(1),
    attributes: z.record(z.any()).optional(),
    relationships: z.array(z.object({
      target: z.string(),
      relation: z.string(),
      confidence: z.number().min(0).max(1),
    })).optional(),
  })),

  // 語義擴展建議
  semanticExpansions: z.array(z.object({
    expandedQuery: z.string(),
    type: z.enum(['synonym', 'related_concept', 'broader_context', 'specific_case']),
    relevanceScore: z.number().min(0).max(1),
    explanation: z.string().optional(),
  })),

  // 搜索策略建議
  searchStrategy: z.object({
    recommendedSearchType: z.enum(['precise', 'broad', 'exploratory', 'analytical']),
    suggestedFilters: z.array(z.object({
      type: z.string(),
      value: z.string(),
      reason: z.string(),
    })),
    priorityAreas: z.array(z.string()),
    estimatedResultCount: z.string(),
  }),

  // 用戶意圖分析
  userIntent: z.object({
    primaryGoal: z.string(),
    secondaryGoals: z.array(z.string()),
    urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
    expectedResponseType: z.enum(['factual', 'analytical', 'procedural', 'creative']),
    domainContext: z.enum(['sales', 'technical', 'legal', 'marketing', 'support', 'general']),
  }),

  // 建議和優化
  recommendations: z.object({
    queryOptimizations: z.array(z.string()),
    additionalQuestions: z.array(z.string()),
    relatedTopics: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
})

export type SemanticAnalysis = z.infer<typeof SemanticAnalysisSchema>

// 多輪對話上下文
export interface ConversationContext {
  conversationId: string
  userId?: string
  previousQueries: Array<{
    query: string
    timestamp: Date
    results?: any[]
    userFeedback?: 'helpful' | 'not_helpful' | 'partially_helpful'
  }>
  userProfile?: {
    role: string
    department: string
    experienceLevel: 'beginner' | 'intermediate' | 'expert'
    preferences: Record<string, any>
  }
  sessionContext?: {
    currentTask?: string
    workflowStage?: string
    timeConstraints?: string
  }
}

// 查詢複雜度分析結果
export interface QueryComplexityAnalysis {
  complexity: 'simple' | 'moderate' | 'complex'
  factors: {
    syntacticComplexity: number // 語法複雜度
    semanticDepth: number // 語義深度
    contextDependency: number // 上下文依賴度
    domainSpecificity: number // 領域專業度
    ambiguityLevel: number // 歧義程度
  }
  processingRecommendation: 'fast_track' | 'standard' | 'deep_analysis'
  estimatedProcessingTime: number // 毫秒
}

/**
 * 高級語義查詢處理器類
 */
export class SemanticQueryProcessor {
  private baseProcessor: QueryProcessor
  private cache = getVectorCache()

  // GPT-4 系統提示詞 - 專門針對銷售和CRM場景優化
  private readonly SYSTEM_PROMPT = `
你是一個專業的查詢分析助手，專門處理銷售和客戶關係管理(CRM)領域的搜索查詢。

你的任務是深度分析用戶的自然語言查詢，提供全面的語義理解和智能建議。

分析重點：
1. 查詢意圖：識別用戶的真實需求和目標
2. 業務上下文：理解銷售流程和CRM業務場景
3. 實體提取：識別客戶、產品、流程等關鍵實體
4. 語義擴展：提供相關概念和同義表達
5. 搜索優化：建議最佳搜索策略和參數

業務領域知識：
- 銷售流程：潛客開發、需求分析、提案、談判、成交、售後
- CRM概念：客戶分級、銷售漏斗、轉換率、客戶生命週期價值
- 產品管理：功能特性、價格策略、競爭分析、市場定位
- 客戶服務：問題解決、滿意度、續約、向上銷售

請以JSON格式返回詳細的分析結果，包含所有必要的字段和建議。
`

  constructor() {
    this.baseProcessor = new QueryProcessor()
  }

  /**
   * 執行深度語義分析 - Week 6 核心增強功能
   *
   * 【分析流程】
   * 1. 基礎查詢解析：使用現有QueryProcessor進行初步分析
   * 2. GPT-4語義理解：深度分析查詢意圖和業務上下文
   * 3. 實體關係提取：識別關鍵實體和它們之間的關係
   * 4. 語義擴展生成：基於業務知識生成相關查詢擴展
   * 5. 搜索策略制定：根據分析結果制定最佳搜索策略
   * 6. 個性化建議：基於用戶上下文提供個性化建議
   *
   * 【增強特性】
   * • 業務場景感知：針對銷售和CRM場景的專門優化
   * • 多輪對話支援：理解指代和上下文依賴
   * • 複雜度自適應：根據查詢複雜度選擇處理策略
   * • 智能建議生成：主動提供查詢優化建議
   *
   * @param query 原始查詢字串
   * @param context 會話上下文（可選）
   * @returns Promise<SemanticAnalysis> 完整的語義分析結果
   */
  async analyzeQuery(
    query: string,
    context?: ConversationContext
  ): Promise<SemanticAnalysis> {
    try {
      const startTime = Date.now()

      // 1. 檢查緩存
      const cacheKey = this.generateCacheKey(query, context)
      const cached = await this.getCachedAnalysis(cacheKey)
      if (cached) {
        console.log(`🎯 語義分析緩存命中: ${query.substring(0, 50)}...`)
        return cached
      }

      // 2. 基礎查詢解析
      const baseAnalysis = await this.baseProcessor.parseQuery(query)

      // 3. 查詢複雜度分析
      const complexityAnalysis = await this.analyzeQueryComplexity(query, baseAnalysis)

      // 4. 根據複雜度選擇處理策略
      let semanticAnalysis: SemanticAnalysis

      if (complexityAnalysis.processingRecommendation === 'fast_track') {
        // 簡單查詢：使用快速規則引擎
        semanticAnalysis = await this.fastTrackAnalysis(query, baseAnalysis, context)
      } else {
        // 複雜查詢：使用GPT-4深度分析
        semanticAnalysis = await this.deepSemanticAnalysis(query, baseAnalysis, context)
      }

      // 5. 緩存結果
      await this.cacheAnalysis(cacheKey, semanticAnalysis)

      const processingTime = Date.now() - startTime
      console.log(`✅ 語義分析完成: ${processingTime}ms, 複雜度: ${complexityAnalysis.complexity}`)

      return semanticAnalysis

    } catch (error) {
      console.error('❌ 語義查詢分析失敗:', error)

      // 回退到基礎分析
      return this.fallbackAnalysis(query)
    }
  }

  /**
   * 分析查詢複雜度
   */
  async analyzeQueryComplexity(
    query: string,
    baseAnalysis: ParsedQuery
  ): Promise<QueryComplexityAnalysis> {
    const factors = {
      syntacticComplexity: this.calculateSyntacticComplexity(query),
      semanticDepth: this.calculateSemanticDepth(baseAnalysis),
      contextDependency: this.calculateContextDependency(query),
      domainSpecificity: this.calculateDomainSpecificity(query, baseAnalysis),
      ambiguityLevel: this.calculateAmbiguityLevel(query, baseAnalysis)
    }

    // 綜合複雜度評分
    const overallComplexity = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / 5

    let complexity: 'simple' | 'moderate' | 'complex'
    let processingRecommendation: 'fast_track' | 'standard' | 'deep_analysis'
    let estimatedProcessingTime: number

    if (overallComplexity < 0.3) {
      complexity = 'simple'
      processingRecommendation = 'fast_track'
      estimatedProcessingTime = 500
    } else if (overallComplexity < 0.7) {
      complexity = 'moderate'
      processingRecommendation = 'standard'
      estimatedProcessingTime = 2000
    } else {
      complexity = 'complex'
      processingRecommendation = 'deep_analysis'
      estimatedProcessingTime = 5000
    }

    return {
      complexity,
      factors,
      processingRecommendation,
      estimatedProcessingTime
    }
  }

  /**
   * 快速軌道分析 - 用於簡單查詢
   */
  private async fastTrackAnalysis(
    query: string,
    baseAnalysis: ParsedQuery,
    context?: ConversationContext
  ): Promise<SemanticAnalysis> {
    // 基於規則引擎的快速分析
    const entities = this.extractEntitiesRuleBased(query, baseAnalysis)
    const semanticExpansions = this.generateBasicExpansions(query, baseAnalysis)
    const searchStrategy = this.generateBasicStrategy(baseAnalysis)
    const userIntent = this.inferBasicIntent(baseAnalysis)
    const recommendations = this.generateBasicRecommendations(query, baseAnalysis)

    return {
      queryUnderstanding: {
        originalQuery: query,
        processedQuery: baseAnalysis.cleanedQuery,
        mainIntent: baseAnalysis.intent,
        subIntents: [],
        confidence: baseAnalysis.confidence,
        complexity: 'simple',
        businessContext: this.inferBusinessContext(baseAnalysis.intent)
      },
      entities,
      semanticExpansions,
      searchStrategy,
      userIntent,
      recommendations
    }
  }

  /**
   * 深度語義分析 - 使用GPT-4進行複雜查詢分析
   */
  private async deepSemanticAnalysis(
    query: string,
    baseAnalysis: ParsedQuery,
    context?: ConversationContext
  ): Promise<SemanticAnalysis> {
    // 構建GPT-4查詢上下文
    const prompt = this.buildAnalysisPrompt(query, baseAnalysis, context)

    try {
      // TODO: Week 6 - 實現正確的 Azure OpenAI SDK 調用
      const openaiClient = getOpenAIClient()
      const response = await (openaiClient as any).chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // 低溫度確保一致性
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })

      const gptResult = JSON.parse(response.choices[0].message.content || '{}')

      // 驗證和標準化GPT-4輸出
      return await this.validateAndNormalizeGPTResult(gptResult, query, baseAnalysis)

    } catch (error) {
      console.error('❌ GPT-4語義分析失敗:', error)
      // 回退到快速分析
      return this.fastTrackAnalysis(query, baseAnalysis, context)
    }
  }

  /**
   * 構建GPT-4分析提示詞
   */
  private buildAnalysisPrompt(
    query: string,
    baseAnalysis: ParsedQuery,
    context?: ConversationContext
  ): string {
    let prompt = `
請分析以下銷售/CRM查詢：

查詢: "${query}"

基礎分析結果:
- 清理後查詢: ${baseAnalysis.cleanedQuery}
- 檢測語言: ${baseAnalysis.language}
- 識別意圖: ${baseAnalysis.intent}
- 關鍵詞: ${baseAnalysis.keywords.join(', ')}
- 置信度: ${baseAnalysis.confidence}
`

    // 添加會話上下文
    if (context?.previousQueries && context.previousQueries.length > 0) {
      prompt += `\n歷史查詢上下文:\n`
      context.previousQueries.slice(-3).forEach((prevQuery, index) => {
        prompt += `${index + 1}. ${prevQuery.query}\n`
      })
    }

    // 添加用戶角色信息
    if (context?.userProfile) {
      prompt += `\n用戶資料:\n`
      prompt += `- 角色: ${context.userProfile.role}\n`
      prompt += `- 部門: ${context.userProfile.department}\n`
      prompt += `- 經驗水平: ${context.userProfile.experienceLevel}\n`
    }

    prompt += `
請提供完整的JSON格式分析，包含以下結構：
{
  "queryUnderstanding": {
    "originalQuery": "...",
    "processedQuery": "...",
    "mainIntent": "...",
    "subIntents": ["..."],
    "confidence": 0.0-1.0,
    "complexity": "simple|moderate|complex",
    "businessContext": "..."
  },
  "entities": [
    {
      "text": "...",
      "type": "person|organization|product|location|time|concept|process",
      "confidence": 0.0-1.0,
      "attributes": {},
      "relationships": []
    }
  ],
  "semanticExpansions": [
    {
      "expandedQuery": "...",
      "type": "synonym|related_concept|broader_context|specific_case",
      "relevanceScore": 0.0-1.0,
      "explanation": "..."
    }
  ],
  "searchStrategy": {
    "recommendedSearchType": "precise|broad|exploratory|analytical",
    "suggestedFilters": [],
    "priorityAreas": ["..."],
    "estimatedResultCount": "..."
  },
  "userIntent": {
    "primaryGoal": "...",
    "secondaryGoals": ["..."],
    "urgencyLevel": "low|medium|high|urgent",
    "expectedResponseType": "factual|analytical|procedural|creative",
    "domainContext": "sales|technical|legal|marketing|support|general"
  },
  "recommendations": {
    "queryOptimizations": ["..."],
    "additionalQuestions": ["..."],
    "relatedTopics": ["..."],
    "nextSteps": ["..."]
  }
}
`

    return prompt
  }

  /**
   * 驗證和標準化GPT-4結果
   */
  private async validateAndNormalizeGPTResult(
    gptResult: any,
    query: string,
    baseAnalysis: ParsedQuery
  ): Promise<SemanticAnalysis> {
    try {
      // 使用zod驗證結構
      return SemanticAnalysisSchema.parse(gptResult)
    } catch (error) {
      console.warn('⚠️ GPT-4結果格式不正確，使用回退分析:', error)
      // 回退到快速分析
      return await this.fastTrackAnalysis(query, baseAnalysis, undefined)
    }
  }

  /**
   * 多輪對話查詢處理
   */
  async processConversationalQuery(
    query: string,
    context: ConversationContext
  ): Promise<{
    analysis: SemanticAnalysis
    resolvedQuery: string
    contextualInsights: string[]
  }> {
    try {
      // 1. 指代消解
      const resolvedQuery = await this.resolveReferences(query, context)

      // 2. 上下文增強分析
      const analysis = await this.analyzeQuery(resolvedQuery, context)

      // 3. 生成上下文洞察
      const contextualInsights = this.generateContextualInsights(query, resolvedQuery, context, analysis)

      return {
        analysis,
        resolvedQuery,
        contextualInsights
      }

    } catch (error) {
      console.error('❌ 對話查詢處理失敗:', error)
      throw new Error('無法處理對話查詢')
    }
  }

  /**
   * 指代消解 - 處理"它"、"那個"、"上述"等指代詞
   */
  private async resolveReferences(
    query: string,
    context: ConversationContext
  ): Promise<string> {
    // 檢查是否包含指代詞
    const pronouns = ['它', '那個', '這個', '上述', '之前的', '剛才的', 'it', 'that', 'this', 'previous']
    const hasPronouns = pronouns.some(pronoun => query.toLowerCase().includes(pronoun.toLowerCase()))

    if (!hasPronouns || !context.previousQueries.length) {
      return query
    }

    // 使用GPT-4進行指代消解
    try {
      const contextQueries = context.previousQueries.slice(-3).map(pq => pq.query).join('\n')

      // TODO: Week 6 - 實現正確的 Azure OpenAI SDK 調用
      const openaiClient = getOpenAIClient()
      const response = await (openaiClient as any).chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一個指代消解專家。請將包含指代詞的查詢轉換為明確的查詢，基於提供的上下文。只返回消解後的查詢，不要添加額外說明。'
          },
          {
            role: 'user',
            content: `
上下文查詢:
${contextQueries}

當前查詢: ${query}

請消解當前查詢中的指代詞，返回明確的查詢：`
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })

      const resolvedQuery = response.choices[0].message.content?.trim() || query
      console.log(`🔗 指代消解: "${query}" → "${resolvedQuery}"`)

      return resolvedQuery

    } catch (error) {
      console.warn('⚠️ 指代消解失敗，使用原查詢:', error)
      return query
    }
  }

  /**
   * 生成上下文洞察
   */
  private generateContextualInsights(
    originalQuery: string,
    resolvedQuery: string,
    context: ConversationContext,
    analysis: SemanticAnalysis
  ): string[] {
    const insights: string[] = []

    // 查詢演進分析
    if (originalQuery !== resolvedQuery) {
      insights.push(`查詢經過指代消解，從"${originalQuery}"明確為"${resolvedQuery}"`)
    }

    // 會話模式識別
    if (context.previousQueries.length > 0) {
      const queryPattern = this.identifyConversationPattern(context.previousQueries, analysis)
      if (queryPattern) {
        insights.push(`檢測到${queryPattern}模式的會話流程`)
      }
    }

    // 用戶意圖變化
    if (context.previousQueries.length > 1) {
      const intentEvolution = this.analyzeIntentEvolution(context.previousQueries, analysis)
      if (intentEvolution) {
        insights.push(intentEvolution)
      }
    }

    return insights
  }

  // ==================== 輔助方法 ====================

  /**
   * 計算語法複雜度
   */
  private calculateSyntacticComplexity(query: string): number {
    const factors = [
      query.length / 100, // 長度因子
      (query.match(/[,;:.!?]/g) || []).length / 10, // 標點符號複雜度
      (query.match(/\b(and|or|but|however|therefore|because|if|when|where|what|how|why)\b/gi) || []).length / 10, // 邏輯詞複雜度
      (query.match(/\b\d+\b/g) || []).length / 5 // 數字複雜度
    ]

    return Math.min(factors.reduce((sum, factor) => sum + factor, 0) / factors.length, 1)
  }

  /**
   * 計算語義深度
   */
  private calculateSemanticDepth(baseAnalysis: ParsedQuery): number {
    const factors = [
      baseAnalysis.keywords.length / 10, // 關鍵詞數量
      baseAnalysis.entities.length / 5, // 實體數量
      baseAnalysis.intent === 'general_search' ? 0.2 : 0.8, // 意圖具體性
      baseAnalysis.confidence // 分析置信度
    ]

    return Math.min(factors.reduce((sum, factor) => sum + factor, 0) / factors.length, 1)
  }

  /**
   * 計算上下文依賴度
   */
  private calculateContextDependency(query: string): number {
    const contextWords = ['它', '那個', '這個', '上述', '之前', '剛才', 'it', 'that', 'this', 'previous', 'above']
    const matchCount = contextWords.filter(word =>
      query.toLowerCase().includes(word.toLowerCase())
    ).length

    return Math.min(matchCount / 3, 1)
  }

  /**
   * 計算領域專業度
   */
  private calculateDomainSpecificity(query: string, baseAnalysis: ParsedQuery): number {
    const domainTerms = [
      'ROI', 'KPI', 'CRM', 'API', 'SDK', '轉換率', '客戶生命週期', '銷售漏斗',
      '潛客', '成交率', '客單價', '續約率', '向上銷售', '交叉銷售'
    ]

    const matchCount = domainTerms.filter(term =>
      query.toLowerCase().includes(term.toLowerCase())
    ).length

    return Math.min(matchCount / 5, 1)
  }

  /**
   * 計算歧義程度
   */
  private calculateAmbiguityLevel(query: string, baseAnalysis: ParsedQuery): number {
    // 基於置信度的反向評分
    return 1 - baseAnalysis.confidence
  }

  /**
   * 基於規則的實體提取
   */
  private extractEntitiesRuleBased(query: string, baseAnalysis: ParsedQuery): SemanticAnalysis['entities'] {
    return baseAnalysis.entities.map(entity => ({
      text: entity.text,
      type: entity.type as any,
      confidence: entity.confidence,
      attributes: {},
      relationships: []
    }))
  }

  /**
   * 生成基礎語義擴展
   */
  private generateBasicExpansions(query: string, baseAnalysis: ParsedQuery): SemanticAnalysis['semanticExpansions'] {
    const expansions: SemanticAnalysis['semanticExpansions'] = []

    // 基於關鍵詞的同義詞擴展
    baseAnalysis.keywords.forEach(keyword => {
      // 這裡可以擴展更多同義詞邏輯
      expansions.push({
        expandedQuery: `${query} 相關`,
        type: 'related_concept',
        relevanceScore: 0.7,
        explanation: `添加"相關"以擴大搜索範圍`
      })
    })

    return expansions.slice(0, 3) // 限制數量
  }

  /**
   * 生成基礎搜索策略
   */
  private generateBasicStrategy(baseAnalysis: ParsedQuery): SemanticAnalysis['searchStrategy'] {
    return {
      recommendedSearchType: baseAnalysis.intent === 'specific_document' ? 'precise' : 'broad',
      suggestedFilters: baseAnalysis.filters.categories ?
        baseAnalysis.filters.categories.map(cat => ({
          type: 'category',
          value: cat,
          reason: '基於查詢內容推斷的分類過濾'
        })) : [],
      priorityAreas: baseAnalysis.keywords,
      estimatedResultCount: '5-20個結果'
    }
  }

  /**
   * 推斷基礎用戶意圖
   */
  private inferBasicIntent(baseAnalysis: ParsedQuery): SemanticAnalysis['userIntent'] {
    const intentMapping: Record<SearchIntent, SemanticAnalysis['userIntent']> = {
      'specific_document': {
        primaryGoal: '找到特定文檔',
        secondaryGoals: ['查看詳細內容'],
        urgencyLevel: 'medium',
        expectedResponseType: 'factual',
        domainContext: 'general'
      },
      'how_to_guide': {
        primaryGoal: '學習操作步驟',
        secondaryGoals: ['解決實際問題'],
        urgencyLevel: 'medium',
        expectedResponseType: 'procedural',
        domainContext: 'technical'
      },
      'general_search': {
        primaryGoal: '探索相關信息',
        secondaryGoals: ['了解更多背景'],
        urgencyLevel: 'low',
        expectedResponseType: 'factual',
        domainContext: 'general'
      },
      // 添加其他意圖映射...
      'category_browse': {
        primaryGoal: '瀏覽分類內容',
        secondaryGoals: ['發現新信息'],
        urgencyLevel: 'low',
        expectedResponseType: 'factual',
        domainContext: 'general'
      },
      'concept_learning': {
        primaryGoal: '學習概念知識',
        secondaryGoals: ['建立理解框架'],
        urgencyLevel: 'medium',
        expectedResponseType: 'analytical',
        domainContext: 'general'
      },
      'troubleshooting': {
        primaryGoal: '解決問題',
        secondaryGoals: ['預防類似問題'],
        urgencyLevel: 'high',
        expectedResponseType: 'procedural',
        domainContext: 'technical'
      },
      'comparison': {
        primaryGoal: '比較分析',
        secondaryGoals: ['做出決策'],
        urgencyLevel: 'medium',
        expectedResponseType: 'analytical',
        domainContext: 'general'
      },
      'latest_updates': {
        primaryGoal: '獲取最新信息',
        secondaryGoals: ['保持更新'],
        urgencyLevel: 'low',
        expectedResponseType: 'factual',
        domainContext: 'general'
      }
    }

    return intentMapping[baseAnalysis.intent] || intentMapping['general_search']
  }

  /**
   * 生成基礎建議
   */
  private generateBasicRecommendations(query: string, baseAnalysis: ParsedQuery): SemanticAnalysis['recommendations'] {
    return {
      queryOptimizations: [
        baseAnalysis.keywords.length < 2 ? '嘗試添加更多關鍵詞' : '',
        baseAnalysis.confidence < 0.7 ? '嘗試使用更具體的術語' : ''
      ].filter(Boolean),
      additionalQuestions: [
        `什麼是${baseAnalysis.keywords[0]}？`,
        `如何使用${baseAnalysis.keywords[0]}？`
      ].filter(Boolean),
      relatedTopics: baseAnalysis.keywords.slice(1, 4),
      nextSteps: ['查看搜索結果', '精煉搜索條件']
    }
  }

  /**
   * 推斷業務上下文
   */
  private inferBusinessContext(intent: SearchIntent): string {
    const contextMap: Record<SearchIntent, string> = {
      'specific_document': '文檔查詢場景',
      'how_to_guide': '學習培訓場景',
      'troubleshooting': '問題解決場景',
      'comparison': '決策分析場景',
      'latest_updates': '信息更新場景',
      'concept_learning': '知識學習場景',
      'category_browse': '內容探索場景',
      'general_search': '一般查詢場景'
    }

    return contextMap[intent] || '一般業務場景'
  }

  /**
   * 識別會話模式
   */
  private identifyConversationPattern(
    previousQueries: ConversationContext['previousQueries'],
    currentAnalysis: SemanticAnalysis
  ): string | null {
    if (previousQueries.length < 2) return null

    // 分析查詢序列模式
    const intents = previousQueries.map(pq => pq.query).concat([currentAnalysis.queryUnderstanding.mainIntent])

    // 檢測常見模式
    if (intents.includes('concept_learning') && intents.includes('how_to_guide')) {
      return '學習探索'
    }

    if (intents.includes('troubleshooting') && intents.includes('specific_document')) {
      return '問題解決'
    }

    return null
  }

  /**
   * 分析意圖演進
   */
  private analyzeIntentEvolution(
    previousQueries: ConversationContext['previousQueries'],
    currentAnalysis: SemanticAnalysis
  ): string | null {
    const lastQuery = previousQueries[previousQueries.length - 1]
    if (!lastQuery) return null

    // 這裡可以添加更複雜的意圖演進分析邏輯
    return `用戶查詢從探索性轉向具體性，顯示逐步聚焦的搜索行為`
  }

  /**
   * 回退分析 - 當所有高級分析都失敗時使用
   */
  private async fallbackAnalysis(query: string): Promise<SemanticAnalysis> {
    const baseAnalysis = await this.baseProcessor.parseQuery(query)
    return this.fastTrackAnalysis(query, baseAnalysis)
  }

  /**
   * 生成緩存鍵
   */
  private generateCacheKey(query: string, context?: ConversationContext): string {
    const contextKey = context ? JSON.stringify({
      userId: context.userId,
      previousCount: context.previousQueries.length,
      userRole: context.userProfile?.role
    }) : 'no-context'

    return `semantic_analysis:${Buffer.from(query + contextKey).toString('base64')}`
  }

  /**
   * 獲取緩存的分析結果
   */
  private async getCachedAnalysis(cacheKey: string): Promise<SemanticAnalysis | null> {
    try {
      // TODO: VectorCache不支持通用key-value操作，需要使用專用語義分析緩存
      // const cached = await this.cache.get(cacheKey)
      // return cached ? JSON.parse(cached) : null
      return null
    } catch (error) {
      console.warn('⚠️ 獲取語義分析緩存失敗:', error)
      return null
    }
  }

  /**
   * 緩存分析結果
   */
  private async cacheAnalysis(cacheKey: string, analysis: SemanticAnalysis): Promise<void> {
    try {
      // TODO: VectorCache不支持通用key-value操作，需要使用專用語義分析緩存
      // await this.cache.set(cacheKey, JSON.stringify(analysis), 3600) // 1小時緩存
      console.log('📦 暫時跳過緩存語義分析結果（待實現專用緩存）')
    } catch (error) {
      console.warn('⚠️ 緩存語義分析結果失敗:', error)
    }
  }
}

// 導出單例實例
export const semanticQueryProcessor = new SemanticQueryProcessor()

// 便利函數
export async function analyzeSemanticQuery(
  query: string,
  context?: ConversationContext
): Promise<SemanticAnalysis> {
  return semanticQueryProcessor.analyzeQuery(query, context)
}

export async function processConversationalQuery(
  query: string,
  context: ConversationContext
): Promise<{
  analysis: SemanticAnalysis
  resolvedQuery: string
  contextualInsights: string[]
}> {
  return semanticQueryProcessor.processConversationalQuery(query, context)
}