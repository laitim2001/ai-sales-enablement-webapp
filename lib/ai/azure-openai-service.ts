/**
 * @fileoverview Azure OpenAI 服務核心功能：- 整合Azure OpenAI GPT-4 API- 提供統一的AI生成介面- 處理API速率限制和錯誤重試- 支援流式響應和批量生成- 提供提示工程和參數化生成作者：Claude Code創建時間：2025-09-28
 * @module lib/ai/azure-openai-service
 * @description
 * Azure OpenAI 服務核心功能：- 整合Azure OpenAI GPT-4 API- 提供統一的AI生成介面- 處理API速率限制和錯誤重試- 支援流式響應和批量生成- 提供提示工程和參數化生成作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { OpenAI } from 'openai';

// Azure OpenAI 配置介面
export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  apiVersion: string;
  deploymentName: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// AI生成請求介面
export interface AIGenerationRequest {
  prompt: string;
  templateId?: string;
  variables?: Record<string, any>;
  customerId?: number;
  userId: number;
  config?: Partial<AzureOpenAIConfig>;
  streamResponse?: boolean;
}

// AI生成響應介面
export interface AIGenerationResponse {
  id: string;
  content: string;
  status: 'success' | 'error' | 'timeout';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    modelUsed: string;
    responseTime: number;
    qualityScore?: number;
  };
  error?: string;
}

// 提示工程模板介面
export interface PromptTemplate {
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
}

/**
 * Azure OpenAI 服務類
 *
 * 提供完整的AI內容生成功能，包括：
 * - GPT-4 API整合
 * - 提示工程
 * - 速率限制管理
 * - 錯誤處理和重試
 * - 品質評估
 */
export class AzureOpenAIService {
  private client: OpenAI;
  private config: AzureOpenAIConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: AzureOpenAIConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      presencePenalty: 0,
      frequencyPenalty: 0,
      ...config
    };

    // 初始化Azure OpenAI客戶端
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}`,
      defaultQuery: { 'api-version': this.config.apiVersion },
      defaultHeaders: {
        'api-key': this.config.apiKey,
      },
    });
  }

  /**
   * 生成AI內容
   *
   * @param request AI生成請求
   * @returns Promise<AIGenerationResponse>
   */
  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();
    const generationId = this.generateRequestId();

    try {
      // 檢查速率限制
      await this.checkRateLimit(request.userId.toString());

      // 建構完整的提示
      const fullPrompt = this.buildPrompt(request);

      // 合併配置
      const mergedConfig = { ...this.config, ...request.config };

      // 發送請求到Azure OpenAI
      const completion = await this.client.chat.completions.create({
        model: mergedConfig.deploymentName,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request)
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: mergedConfig.temperature,
        max_tokens: mergedConfig.maxTokens,
        top_p: mergedConfig.topP,
        presence_penalty: mergedConfig.presencePenalty,
        frequency_penalty: mergedConfig.frequencyPenalty,
        stream: false // 暫不支持 streaming
      }) as any; // 類型斷言以處理 Azure SDK 的 union type

      const responseTime = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || '';

      // 計算品質分數（簡化版）
      const qualityScore = this.calculateQualityScore(content, request);

      return {
        id: generationId,
        content,
        status: 'success',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        metadata: {
          modelUsed: mergedConfig.deploymentName,
          responseTime,
          qualityScore
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      console.error('Azure OpenAI API錯誤:', error);

      return {
        id: generationId,
        content: '',
        status: 'error',
        metadata: {
          modelUsed: this.config.deploymentName,
          responseTime
        },
        error: this.formatError(error)
      };
    }
  }

  /**
   * 批量生成內容
   *
   * @param requests AI生成請求陣列
   * @returns Promise<AIGenerationResponse[]>
   */
  async batchGenerateContent(requests: AIGenerationRequest[]): Promise<AIGenerationResponse[]> {
    const results: AIGenerationResponse[] = [];

    // 使用佇列機制處理批量請求，避免速率限制
    for (const request of requests) {
      const result = await this.generateContent(request);
      results.push(result);

      // 批量請求間隔，避免觸發速率限制
      await this.delay(100);
    }

    return results;
  }

  /**
   * 建構完整提示
   *
   * @param request AI生成請求
   * @returns 完整的提示字符串
   */
  private buildPrompt(request: AIGenerationRequest): string {
    let prompt = request.prompt;

    // 如果有變數，進行替換
    if (request.variables) {
      for (const [key, value] of Object.entries(request.variables)) {
        const placeholder = `{{${key}}}`;
        prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }

    return prompt;
  }

  /**
   * 獲取系統提示
   *
   * @param request AI生成請求
   * @returns 系統提示字符串
   */
  private getSystemPrompt(request: AIGenerationRequest): string {
    const baseSystemPrompt = `你是一個專業的AI助手，專門協助生成高品質的商業提案內容。

請遵循以下原則：
1. 生成的內容應該專業、準確且具有說服力
2. 根據提供的客戶信息和範本進行個性化定制
3. 保持內容結構清晰、邏輯性強
4. 使用適當的商業語言和術語
5. 確保內容符合業界標準和最佳實踐

請根據用戶的具體要求生成相應的內容。`;

    // 根據模板ID或客戶信息調整系統提示
    if (request.templateId) {
      return baseSystemPrompt + `\n\n特殊說明：請根據範本ID ${request.templateId} 的要求生成內容。`;
    }

    if (request.customerId) {
      return baseSystemPrompt + `\n\n特殊說明：請為客戶ID ${request.customerId} 生成個性化內容。`;
    }

    return baseSystemPrompt;
  }

  /**
   * 檢查API速率限制
   *
   * @param userId 用戶ID
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const now = Date.now();
    const windowSize = 60000; // 1分鐘窗口
    const maxRequests = 60; // 每分鐘最大請求數

    const userRequests = this.requestCounts.get(userId);

    if (!userRequests) {
      this.requestCounts.set(userId, { count: 1, resetTime: now + windowSize });
      return;
    }

    if (now >= userRequests.resetTime) {
      // 重置計數器
      this.requestCounts.set(userId, { count: 1, resetTime: now + windowSize });
      return;
    }

    if (userRequests.count >= maxRequests) {
      const waitTime = userRequests.resetTime - now;
      throw new Error(`API速率限制：請等待 ${Math.ceil(waitTime / 1000)} 秒後再試`);
    }

    userRequests.count++;
  }

  /**
   * 計算內容品質分數
   *
   * @param content 生成的內容
   * @param request 原始請求
   * @returns 品質分數 (0-100)
   */
  private calculateQualityScore(content: string, request: AIGenerationRequest): number {
    let score = 50; // 基礎分數

    // 長度評分（適當的長度獲得更高分數）
    const length = content.length;
    if (length >= 500 && length <= 3000) {
      score += 20;
    } else if (length >= 200 && length <= 5000) {
      score += 10;
    }

    // 結構評分（包含段落、列表等結構元素）
    const hasStructure = /\n\n|\n[\d\-\*]|\n\#/.test(content);
    if (hasStructure) {
      score += 15;
    }

    // 專業詞彙評分（包含商業術語）
    const businessTerms = /提案|解決方案|客戶|服務|產品|價值|效益|投資回報|ROI/g;
    const termMatches = content.match(businessTerms);
    if (termMatches && termMatches.length >= 3) {
      score += 15;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 格式化錯誤信息
   *
   * @param error 原始錯誤
   * @returns 格式化的錯誤信息
   */
  private formatError(error: any): string {
    if (error.code === 'rate_limit_exceeded') {
      return 'API請求頻率過高，請稍後重試';
    }

    if (error.code === 'invalid_api_key') {
      return 'API密鑰無效，請檢查配置';
    }

    if (error.code === 'insufficient_quota') {
      return 'API配額不足，請聯繫管理員';
    }

    return error.message || '未知錯誤';
  }

  /**
   * 生成請求ID
   *
   * @returns 唯一的請求ID
   */
  private generateRequestId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延遲函數
   *
   * @param ms 延遲毫秒數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 測試API連接
   *
   * @returns Promise<boolean>
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.deploymentName,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('Azure OpenAI 連接測試失敗:', error);
      return false;
    }
  }

  /**
   * 獲取當前配置
   *
   * @returns 當前配置（敏感信息已遮蔽）
   */
  getConfig(): Partial<AzureOpenAIConfig> {
    return {
      endpoint: this.config.endpoint,
      apiVersion: this.config.apiVersion,
      deploymentName: this.config.deploymentName,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      topP: this.config.topP,
      presencePenalty: this.config.presencePenalty,
      frequencyPenalty: this.config.frequencyPenalty
    };
  }
}

// 默認Azure OpenAI服務實例
let defaultAzureOpenAIService: AzureOpenAIService | null = null;

/**
 * 獲取默認的Azure OpenAI服務實例
 *
 * @returns AzureOpenAIService實例
 */
export function getAzureOpenAIService(): AzureOpenAIService {
  if (!defaultAzureOpenAIService) {
    const config: AzureOpenAIConfig = {
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '2000'),
    };

    defaultAzureOpenAIService = new AzureOpenAIService(config);
  }

  return defaultAzureOpenAIService;
}

/**
 * 提示工程預設模板
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  businessProposal: {
    name: '商業提案生成',
    systemPrompt: '你是一個專業的商業提案專家，擅長撰寫具有說服力的商業提案。',
    userPromptTemplate: `請為以下客戶生成一份專業的商業提案：

客戶信息：
- 公司名稱：{{companyName}}
- 行業：{{industry}}
- 需求：{{requirements}}
- 預算範圍：{{budget}}
- 時間要求：{{timeline}}

請生成包含以下部分的完整提案：
1. 執行摘要
2. 客戶需求分析
3. 解決方案概述
4. 服務內容詳細說明
5. 時程規劃
6. 投資回報分析
7. 結論和下一步行動

請確保提案內容專業、具體且具有說服力。`,
    variables: {
      companyName: { type: 'string', required: true, description: '客戶公司名稱' },
      industry: { type: 'string', required: true, description: '客戶所屬行業' },
      requirements: { type: 'string', required: true, description: '客戶具體需求' },
      budget: { type: 'string', required: false, description: '預算範圍', defaultValue: '待商議' },
      timeline: { type: 'string', required: false, description: '時間要求', defaultValue: '待商議' }
    }
  },

  productDescription: {
    name: '產品描述生成',
    systemPrompt: '你是一個專業的產品行銷專家，擅長撰寫引人入勝的產品描述。',
    userPromptTemplate: `請為以下產品生成專業的產品描述：

產品信息：
- 產品名稱：{{productName}}
- 產品類型：{{productType}}
- 主要特性：{{features}}
- 目標客戶：{{targetCustomer}}
- 價格定位：{{pricePosition}}

請生成包含以下元素的產品描述：
1. 吸引人的產品標題
2. 核心價值主張
3. 主要功能和特性
4. 客戶受益點
5. 使用場景
6. 技術規格（如適用）
7. 購買理由

請確保描述生動、準確且具有銷售力。`,
    variables: {
      productName: { type: 'string', required: true, description: '產品名稱' },
      productType: { type: 'string', required: true, description: '產品類型或分類' },
      features: { type: 'string', required: true, description: '主要特性列表' },
      targetCustomer: { type: 'string', required: true, description: '目標客戶群體' },
      pricePosition: { type: 'string', required: false, description: '價格定位', defaultValue: '中等' }
    }
  },

  marketingEmail: {
    name: '行銷郵件生成',
    systemPrompt: '你是一個專業的電子郵件行銷專家，擅長撰寫高轉換率的行銷郵件。',
    userPromptTemplate: `請為以下行銷活動生成專業的電子郵件：

活動信息：
- 活動主題：{{campaignTheme}}
- 目標受眾：{{audience}}
- 主要訊息：{{mainMessage}}
- 行動呼籲：{{callToAction}}
- 活動期限：{{deadline}}

請生成包含以下元素的行銷郵件：
1. 吸引人的主旨行
2. 個性化的開場白
3. 清晰的價值主張
4. 具體的受益點
5. 社會證明（如適用）
6. 明確的行動呼籲
7. 緊迫感營造
8. 專業的結尾

請確保郵件內容簡潔、有針對性且具有行動導向。`,
    variables: {
      campaignTheme: { type: 'string', required: true, description: '活動主題' },
      audience: { type: 'string', required: true, description: '目標受眾描述' },
      mainMessage: { type: 'string', required: true, description: '主要傳達訊息' },
      callToAction: { type: 'string', required: true, description: '期望的行動呼籲' },
      deadline: { type: 'string', required: false, description: '活動或優惠期限', defaultValue: '有限時間' }
    }
  }
};