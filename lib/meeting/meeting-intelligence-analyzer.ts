/**
 * @fileoverview 會議智能分析引擎
📋 檔案用途：
使用Azure OpenAI GPT-4分析會議信息，提取關鍵信息並生成智能建議
🎯 核心功能：
1. 會議信息提取：參與者、主題、客戶名稱、會議類型
2. 相關資料檢索：客戶歷史、提案、產品資料、案例
3. AI建議生成：議程、討論重點、潛在問題、後續行動
4. 上下文管理：多輪對話和歷史記錄
🔗 依賴關係：
- lib/ai/azure-openai-serv...
 * @module lib/meeting/meeting-intelligence-analyzer
 *
 * 會議智能分析引擎
 * 📋 檔案用途：
 * 使用Azure OpenAI GPT-4分析會議信息，提取關鍵信息並生成智能建議
 * 🎯 核心功能：
 * 1. 會議信息提取：參與者、主題、客戶名稱、會議類型
 * 2. 相關資料檢索：客戶歷史、提案、產品資料、案例
 * 3. AI建議生成：議程、討論重點、潛在問題、後續行動
 * 4. 上下文管理：多輪對話和歷史記錄
 * 🔗 依賴關係：
 * - lib/ai/azure-openai-service.ts - Azure OpenAI API調用
 * - lib/analytics/user-behavior-tracker.ts - 用戶行為分析
 * - lib/meeting/meeting-prep-package.ts - 會議準備包生成
 * 作者：Claude Code
 * 創建時間：2025-10-05
 * Sprint：Sprint 7 Phase 2 - AI智能分析
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { AzureOpenAIService, AIGenerationRequest, AIGenerationResponse } from '@/lib/ai/azure-openai-service';

// ============================================================================
// 📊 類型定義 - 會議信息結構
// ============================================================================

/**
 * 會議基本信息接口
 *
 * 用途：描述會議的基本屬性
 */
export interface MeetingInfo {
  id?: string;
  title: string;                    // 會議標題
  description?: string;              // 會議描述
  startTime: Date;                   // 開始時間
  endTime: Date;                     // 結束時間
  location?: string;                 // 會議地點（物理或線上）
  participants?: string[];           // 參與者列表（姓名或郵箱）
  organizer?: string;                // 組織者
  meetingLink?: string;              // 線上會議鏈接
  notes?: string;                    // 會議備註
}

/**
 * AI提取的會議洞察
 *
 * 用途：存儲AI分析後提取的關鍵信息
 */
export interface MeetingInsights {
  // 參與者分析
  extractedParticipants: {
    name: string;                    // 參與者姓名
    role?: string;                   // 角色（如：決策者、技術專家）
    company?: string;                // 公司名稱
    email?: string;                  // 郵箱地址
    importance: 'high' | 'medium' | 'low';  // 重要程度
  }[];

  // 會議主題分析
  mainTopics: {
    topic: string;                   // 主題名稱
    relevance: number;               // 相關度（0-1）
    keywords: string[];              // 關鍵詞
  }[];

  // 客戶識別
  identifiedCustomers: {
    customerId?: number;             // 客戶ID（如果在系統中存在）
    customerName: string;            // 客戶名稱
    companyName?: string;            // 公司名稱
    industry?: string;               // 行業
    confidence: number;              // 識別信心度（0-1）
  }[];

  // 會議類型分類
  meetingType: {
    primaryType: 'sales' | 'presentation' | 'review' | 'discussion' | 'training' | 'other';  // 主要類型
    subType?: string;                // 子類型（如：首次接觸、需求確認）
    confidence: number;              // 分類信心度（0-1）
  };

  // 情感和語氣分析
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';  // 整體情感
    score: number;                   // 情感分數（-1到1）
    keyPhrases: string[];            // 關鍵短語
  };
}

/**
 * AI生成的會議建議
 *
 * 用途：存儲AI生成的各類建議和內容
 */
export interface MeetingRecommendations {
  // 議程建議
  suggestedAgenda: {
    item: string;                    // 議程項目
    duration: number;                // 建議時長（分鐘）
    priority: 'high' | 'medium' | 'low';  // 優先級
    notes?: string;                  // 備註
  }[];

  // 討論重點
  discussionPoints: {
    point: string;                   // 討論點
    rationale: string;               // 理由/背景
    relatedTopics: string[];         // 相關主題
    importance: 'critical' | 'important' | 'optional';  // 重要性
  }[];

  // 潛在問題和答案
  qAndA: {
    question: string;                // 潛在問題
    suggestedAnswer: string;         // 建議答案
    relatedDocs?: string[];          // 相關文檔
    confidence: number;              // 答案信心度（0-1）
  }[];

  // 後續行動建議
  followUpActions: {
    action: string;                  // 行動項目
    assignee?: string;               // 負責人
    deadline?: Date;                 // 截止日期
    priority: 'high' | 'medium' | 'low';  // 優先級
    dependencies?: string[];         // 依賴項
  }[];

  // 準備資料建議
  prepMaterials: {
    type: 'knowledge_base' | 'proposal' | 'template' | 'case_study' | 'product_info';  // 資料類型
    title: string;                   // 資料標題
    reason: string;                  // 推薦理由
    resourceId?: string;             // 資源ID（如果在系統中存在）
  }[];
}

/**
 * 相關資料檢索結果
 *
 * 用途：存儲AI檢索到的相關業務資料
 */
export interface RelatedResources {
  // 客戶歷史記錄
  customerHistory?: {
    interactions: any[];             // 互動記錄
    proposals: any[];                // 提案歷史
    purchases: any[];                // 購買記錄
    notes: string;                   // AI總結備註
  };

  // 相關提案
  relatedProposals: {
    proposalId: number;              // 提案ID
    title: string;                   // 提案標題
    status: string;                  // 狀態
    relevanceScore: number;          // 相關度分數（0-1）
    matchReason: string;             // 匹配理由
  }[];

  // 產品資料
  productInfo: {
    productId?: string;              // 產品ID
    productName: string;             // 產品名稱
    description: string;             // 描述
    relevanceScore: number;          // 相關度分數（0-1）
    features?: string[];             // 相關特性
  }[];

  // 類似案例
  similarCases: {
    caseId?: string;                 // 案例ID
    title: string;                   // 案例標題
    summary: string;                 // 摘要
    outcome: string;                 // 結果
    relevanceScore: number;          // 相關度分數（0-1）
    lessonsLearned?: string[];       // 經驗教訓
  }[];
}

// ============================================================================
// 🤖 會議智能分析引擎類
// ============================================================================

/**
 * MeetingIntelligenceAnalyzer - 會議智能分析核心類
 *
 * 職責：
 * 1. 分析會議信息並提取關鍵洞察
 * 2. 生成個性化的會議建議
 * 3. 檢索相關業務資料
 * 4. 管理AI對話上下文
 *
 * 設計模式：單例模式（可選），依賴注入（AzureOpenAIService）
 */
export class MeetingIntelligenceAnalyzer {
  private aiService: AzureOpenAIService;
  private conversationHistory: Map<string, any[]> = new Map();  // 會議ID → 對話歷史
  private analysisCache: Map<string, any> = new Map();          // 結果緩存
  private readonly CACHE_TTL = 30 * 60 * 1000;                  // 緩存30分鐘

  /**
   * 構造函數
   *
   * @param aiService - Azure OpenAI服務實例
   */
  constructor(aiService: AzureOpenAIService) {
    this.aiService = aiService;
  }

  // ==========================================================================
  // 📊 會議信息提取 - 核心分析功能
  // ==========================================================================

  /**
   * 分析會議信息並提取關鍵洞察
   *
   * 流程：
   * 1. 檢查緩存
   * 2. 構建分析提示詞
   * 3. 調用GPT-4分析
   * 4. 解析和驗證結果
   * 5. 緩存結果
   *
   * @param meetingInfo - 會議基本信息
   * @param userId - 用戶ID（用於個性化）
   * @returns 提取的會議洞察
   */
  async analyzeMeetingInfo(
    meetingInfo: MeetingInfo,
    userId: number
  ): Promise<MeetingInsights> {
    // 1. 檢查緩存
    const cacheKey = `insights_${meetingInfo.id}_${userId}`;
    const cached = this.getCachedResult<MeetingInsights>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. 構建分析提示詞
    const analysisPrompt = this.buildAnalysisPrompt(meetingInfo);

    // 3. 調用AI服務
    const request: AIGenerationRequest = {
      prompt: analysisPrompt,
      userId: userId,
      config: {
        temperature: 0.3,  // 較低溫度以確保準確性
        maxTokens: 2000,
      }
    };

    const response = await this.aiService.generateContent(request);

    if (response.status !== 'success') {
      throw new Error(`AI分析失敗: ${response.error}`);
    }

    // 4. 解析AI響應為結構化數據
    const insights = this.parseInsightsResponse(response.content);

    // 5. 緩存結果
    this.setCachedResult(cacheKey, insights);

    return insights;
  }

  /**
   * 構建會議分析提示詞
   *
   * @param meetingInfo - 會議信息
   * @returns 格式化的提示詞
   */
  private buildAnalysisPrompt(meetingInfo: MeetingInfo): string {
    return `你是一個專業的會議分析助手。請分析以下會議信息並提取關鍵洞察。

會議信息：
- 標題：${meetingInfo.title}
- 描述：${meetingInfo.description || '無'}
- 時間：${meetingInfo.startTime.toISOString()} 至 ${meetingInfo.endTime.toISOString()}
- 地點：${meetingInfo.location || '無'}
- 參與者：${meetingInfo.participants?.join(', ') || '無'}
- 組織者：${meetingInfo.organizer || '無'}
- 備註：${meetingInfo.notes || '無'}

請提供以下分析（以JSON格式輸出）：

1. extractedParticipants: 從參與者列表中提取結構化信息（姓名、角色、公司、重要程度）
2. mainTopics: 識別3-5個主要討論主題（主題、相關度、關鍵詞）
3. identifiedCustomers: 識別涉及的客戶或公司（名稱、行業、信心度）
4. meetingType: 分類會議類型（sales/presentation/review/discussion/training/other，包含子類型和信心度）
5. sentiment: 分析整體情感和語氣（positive/neutral/negative，分數，關鍵短語）

確保所有信心度和相關度分數在0-1之間。`;
  }

  /**
   * 解析AI響應為MeetingInsights結構
   *
   * @param content - AI返回的JSON字符串
   * @returns 解析後的洞察數據
   */
  private parseInsightsResponse(content: string): MeetingInsights {
    try {
      // 嘗試提取JSON（可能被包裹在其他文本中）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('無法在響應中找到有效的JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 驗證和標準化數據
      return {
        extractedParticipants: parsed.extractedParticipants || [],
        mainTopics: parsed.mainTopics || [],
        identifiedCustomers: parsed.identifiedCustomers || [],
        meetingType: parsed.meetingType || { primaryType: 'other', confidence: 0.5 },
        sentiment: parsed.sentiment || { overall: 'neutral', score: 0, keyPhrases: [] }
      };
    } catch (error) {
      console.error('解析AI響應失敗:', error);
      // 返回默認結構
      return {
        extractedParticipants: [],
        mainTopics: [],
        identifiedCustomers: [],
        meetingType: { primaryType: 'other', confidence: 0 },
        sentiment: { overall: 'neutral', score: 0, keyPhrases: [] }
      };
    }
  }

  // ==========================================================================
  // 💡 AI建議生成 - 智能推薦功能
  // ==========================================================================

  /**
   * 生成會議建議（議程、討論重點、Q&A、後續行動）
   *
   * 流程：
   * 1. 檢查緩存
   * 2. 基於洞察構建建議提示詞
   * 3. 調用GPT-4生成建議
   * 4. 解析和驗證結果
   * 5. 緩存結果
   *
   * @param meetingInfo - 會議信息
   * @param insights - 已提取的洞察
   * @param userId - 用戶ID
   * @returns 生成的建議
   */
  async generateRecommendations(
    meetingInfo: MeetingInfo,
    insights: MeetingInsights,
    userId: number
  ): Promise<MeetingRecommendations> {
    // 1. 檢查緩存
    const cacheKey = `recommendations_${meetingInfo.id}_${userId}`;
    const cached = this.getCachedResult<MeetingRecommendations>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. 構建建議提示詞
    const recommendationPrompt = this.buildRecommendationPrompt(meetingInfo, insights);

    // 3. 調用AI服務
    const request: AIGenerationRequest = {
      prompt: recommendationPrompt,
      userId: userId,
      config: {
        temperature: 0.7,  // 較高溫度以獲得更多創意建議
        maxTokens: 3000,
      }
    };

    const response = await this.aiService.generateContent(request);

    if (response.status !== 'success') {
      throw new Error(`AI建議生成失敗: ${response.error}`);
    }

    // 4. 解析響應
    const recommendations = this.parseRecommendationsResponse(response.content);

    // 5. 緩存結果
    this.setCachedResult(cacheKey, recommendations);

    return recommendations;
  }

  /**
   * 構建建議生成提示詞
   *
   * @param meetingInfo - 會議信息
   * @param insights - 會議洞察
   * @returns 格式化的提示詞
   */
  private buildRecommendationPrompt(
    meetingInfo: MeetingInfo,
    insights: MeetingInsights
  ): string {
    const topicsStr = insights.mainTopics.map(t => t.topic).join(', ');
    const customersStr = insights.identifiedCustomers.map(c => c.customerName).join(', ');

    return `你是一個專業的會議準備顧問。基於以下會議分析，請提供詳細的會議準備建議。

會議信息：
- 標題：${meetingInfo.title}
- 類型：${insights.meetingType.primaryType}
- 主要主題：${topicsStr}
- 涉及客戶：${customersStr}
- 會議時長：${this.calculateDuration(meetingInfo.startTime, meetingInfo.endTime)}分鐘

請提供以下建議（以JSON格式輸出）：

1. suggestedAgenda: 建議的會議議程（項目、時長、優先級、備註）
2. discussionPoints: 關鍵討論重點（討論點、理由、相關主題、重要性）
3. qAndA: 5-10個潛在問題和建議答案（問題、答案、相關文檔、信心度）
4. followUpActions: 建議的後續行動（行動、負責人、截止日期、優先級）
5. prepMaterials: 建議準備的資料（類型、標題、推薦理由）

確保建議實用、具體、可執行。`;
  }

  /**
   * 解析建議響應為MeetingRecommendations結構
   *
   * @param content - AI返回的JSON字符串
   * @returns 解析後的建議數據
   */
  private parseRecommendationsResponse(content: string): MeetingRecommendations {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('無法在響應中找到有效的JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestedAgenda: parsed.suggestedAgenda || [],
        discussionPoints: parsed.discussionPoints || [],
        qAndA: parsed.qAndA || [],
        followUpActions: parsed.followUpActions || [],
        prepMaterials: parsed.prepMaterials || []
      };
    } catch (error) {
      console.error('解析建議響應失敗:', error);
      return {
        suggestedAgenda: [],
        discussionPoints: [],
        qAndA: [],
        followUpActions: [],
        prepMaterials: []
      };
    }
  }

  // ==========================================================================
  // 🔍 相關資料檢索 - 智能搜索功能
  // ==========================================================================

  /**
   * 檢索與會議相關的業務資料
   *
   * 注意：此方法需要與實際的數據庫/API集成
   * 當前版本返回模擬數據結構
   *
   * @param meetingInfo - 會議信息
   * @param insights - 會議洞察
   * @returns 相關資料
   */
  async retrieveRelatedResources(
    meetingInfo: MeetingInfo,
    insights: MeetingInsights
  ): Promise<RelatedResources> {
    // TODO: 實現實際的資料檢索邏輯
    // 1. 基於identifiedCustomers查詢客戶歷史
    // 2. 基於mainTopics查詢相關提案
    // 3. 基於關鍵詞查詢產品信息
    // 4. 基於meetingType查詢類似案例

    return {
      relatedProposals: [],
      productInfo: [],
      similarCases: []
    };
  }

  // ==========================================================================
  // 🔄 上下文管理 - 多輪對話支持
  // ==========================================================================

  /**
   * 添加對話歷史記錄
   *
   * @param meetingId - 會議ID
   * @param role - 角色（user/assistant）
   * @param content - 消息內容
   */
  addToConversationHistory(
    meetingId: string,
    role: 'user' | 'assistant',
    content: string
  ): void {
    if (!this.conversationHistory.has(meetingId)) {
      this.conversationHistory.set(meetingId, []);
    }

    const history = this.conversationHistory.get(meetingId)!;
    history.push({ role, content, timestamp: new Date() });

    // 限制歷史記錄長度（最多保留20條）
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  /**
   * 獲取對話歷史
   *
   * @param meetingId - 會議ID
   * @returns 對話歷史數組
   */
  getConversationHistory(meetingId: string): any[] {
    return this.conversationHistory.get(meetingId) || [];
  }

  /**
   * 清除對話歷史
   *
   * @param meetingId - 會議ID
   */
  clearConversationHistory(meetingId: string): void {
    this.conversationHistory.delete(meetingId);
  }

  // ==========================================================================
  // 🛠️ 工具方法 - 緩存和輔助功能
  // ==========================================================================

  /**
   * 獲取緩存的結果
   *
   * @param key - 緩存鍵
   * @returns 緩存的數據或null
   */
  private getCachedResult<T>(key: string): T | null {
    const cached = this.analysisCache.get(key);
    if (!cached) return null;

    // 檢查是否過期
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.analysisCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 設置緩存結果
   *
   * @param key - 緩存鍵
   * @param data - 要緩存的數據
   */
  private setCachedResult<T>(key: string, data: T): void {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 計算會議時長（分鐘）
   *
   * @param start - 開始時間
   * @param end - 結束時間
   * @returns 時長（分鐘）
   */
  private calculateDuration(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * 清理過期緩存
   *
   * 建議定期調用此方法（如：每小時）以釋放內存
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.analysisCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.analysisCache.delete(key);
      }
    }
  }
}

// ============================================================================
// 🏭 工廠函數 - 創建分析器實例
// ============================================================================

/**
 * 創建MeetingIntelligenceAnalyzer實例
 *
 * 使用工廠函數以確保正確的依賴注入
 *
 * @param aiService - Azure OpenAI服務實例
 * @returns 新的分析器實例
 */
export function createMeetingIntelligenceAnalyzer(
  aiService: AzureOpenAIService
): MeetingIntelligenceAnalyzer {
  return new MeetingIntelligenceAnalyzer(aiService);
}
