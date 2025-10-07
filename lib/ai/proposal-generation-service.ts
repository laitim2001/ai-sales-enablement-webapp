/**
 * @fileoverview 提案生成管理服務功能：- 管理提案生成的完整流程- 整合Azure OpenAI和數據庫操作- 處理範本變數替換和內容生成- 提供生成歷史和版本管理- 實現生成狀態追蹤和錯誤處理作者：Claude Code創建時間：2025-09-28
 * @module lib/ai/proposal-generation-service
 * @description
 * 提案生成管理服務功能：- 管理提案生成的完整流程- 整合Azure OpenAI和數據庫操作- 處理範本變數替換和內容生成- 提供生成歷史和版本管理- 實現生成狀態追蹤和錯誤處理作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { PrismaClient } from '@prisma/client';
import { AzureOpenAIService, AIGenerationRequest, AIGenerationResponse, getAzureOpenAIService } from './azure-openai-service';
import Handlebars from 'handlebars';

const prisma = new PrismaClient();

// 提案生成請求介面
export interface ProposalGenerationRequest {
  templateId: string;
  title: string;
  variables: Record<string, any>;
  customerId?: number;
  opportunityId?: number;
  generatedBy: number;
  aiConfig?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

// 提案生成結果介面
export interface ProposalGenerationResult {
  id: string;
  proposalId?: number;
  content: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  qualityScore?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  generatedAt: Date;
}

// 範本變數定義介面
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  description: string;
  defaultValue?: any;
  options?: string[]; // for select type
}

/**
 * 提案生成管理服務類
 *
 * 負責協調AI服務、數據庫操作和範本處理
 */
export class ProposalGenerationService {
  private azureOpenAI: AzureOpenAIService;

  constructor(azureOpenAIService?: AzureOpenAIService) {
    this.azureOpenAI = azureOpenAIService || getAzureOpenAIService();
  }

  /**
   * 生成提案內容
   *
   * @param request 提案生成請求
   * @returns Promise<ProposalGenerationResult>
   */
  async generateProposal(request: ProposalGenerationRequest): Promise<ProposalGenerationResult> {
    let generationRecord;

    try {
      // 1. 驗證範本存在性
      const template = await prisma.proposalTemplate.findUnique({
        where: { id: request.templateId },
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          }
        }
      });

      if (!template) {
        throw new Error(`範本 ${request.templateId} 不存在`);
      }

      if (!template.is_active) {
        throw new Error(`範本 ${request.templateId} 已停用`);
      }

      // 2. 創建生成記錄
      generationRecord = await prisma.proposalGeneration.create({
        data: {
          template_id: request.templateId,
          title: request.title,
          content: '', // 初始為空，生成後更新
          status: 'GENERATING',
          parameters: {
            templateId: request.templateId,
            customerId: request.customerId,
            opportunityId: request.opportunityId
          },
          variables: request.variables,
          customer_id: request.customerId,
          proposal_id: request.opportunityId, // 先設為機會ID，後續創建提案後更新
          generated_by: request.generatedBy,
          ai_model: request.aiConfig?.model || 'gpt-4',
          ai_settings: {
            temperature: request.aiConfig?.temperature || 0.7,
            maxTokens: request.aiConfig?.maxTokens || 2000
          },
          token_usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        }
      });

      // 3. 驗證變數完整性
      const templateVariables = template.variables as Record<string, any>;
      const missingRequired = this.validateRequiredVariables(templateVariables, request.variables);
      if (missingRequired.length > 0) {
        throw new Error(`缺少必要變數: ${missingRequired.join(', ')}`);
      }

      // 4. 編譯範本內容
      const compiledContent = this.compileTemplate(template.content, request.variables);

      // 5. 構建AI生成請求
      const aiRequest: AIGenerationRequest = {
        prompt: compiledContent,
        templateId: request.templateId,
        variables: request.variables,
        customerId: request.customerId,
        userId: request.generatedBy,
        config: {
          temperature: request.aiConfig?.temperature || 0.7,
          maxTokens: request.aiConfig?.maxTokens || 2000,
          deploymentName: request.aiConfig?.model || 'gpt-4'
        }
      };

      // 6. 呼叫Azure OpenAI生成內容
      const aiResponse: AIGenerationResponse = await this.azureOpenAI.generateContent(aiRequest);

      // 7. 更新生成記錄
      const updatedRecord = await prisma.proposalGeneration.update({
        where: { id: generationRecord.id },
        data: {
          content: aiResponse.content,
          status: aiResponse.status === 'success' ? 'COMPLETED' : 'FAILED',
          quality_score: aiResponse.metadata?.qualityScore,
          token_usage: {
            promptTokens: aiResponse.usage?.promptTokens || 0,
            completionTokens: aiResponse.usage?.completionTokens || 0,
            totalTokens: aiResponse.usage?.totalTokens || 0
          },
          generation_time_ms: aiResponse.metadata?.responseTime || 0,
          error_message: aiResponse.error
        }
      });

      // 8. 更新範本使用次數
      await prisma.proposalTemplate.update({
        where: { id: request.templateId },
        data: {
          usage_count: {
            increment: 1
          }
        }
      });

      // 9. 如果生成成功且有客戶ID，可選擇創建正式提案
      let proposalId;
      if (aiResponse.status === 'success' && request.customerId) {
        proposalId = await this.createFormalProposal({
          customerId: request.customerId,
          opportunityId: request.opportunityId,
          title: request.title,
          content: aiResponse.content,
          generatedBy: request.generatedBy,
          generationId: updatedRecord.id
        });

        // 更新生成記錄的提案關聯
        if (proposalId) {
          await prisma.proposalGeneration.update({
            where: { id: updatedRecord.id },
            data: { proposal_id: proposalId }
          });
        }
      }

      const tokenUsage = updatedRecord.token_usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | null;

      return {
        id: updatedRecord.id,
        proposalId,
        content: updatedRecord.content,
        status: updatedRecord.status as any,
        qualityScore: updatedRecord.quality_score || undefined,
        usage: {
          promptTokens: tokenUsage?.promptTokens || 0,
          completionTokens: tokenUsage?.completionTokens || 0,
          totalTokens: tokenUsage?.totalTokens || 0
        },
        error: updatedRecord.error_message || undefined,
        generatedAt: updatedRecord.created_at
      };

    } catch (error: any) {
      console.error('提案生成失敗:', error);

      // 更新生成記錄為失敗狀態
      if (generationRecord) {
        await prisma.proposalGeneration.update({
          where: { id: generationRecord.id },
          data: {
            status: 'FAILED',
            error_message: error.message
          }
        });
      }

      return {
        id: generationRecord?.id || 'unknown',
        content: '',
        status: 'FAILED',
        error: error.message,
        generatedAt: new Date()
      };
    }
  }

  /**
   * 重新生成提案內容
   *
   * @param originalGenerationId 原始生成記錄ID
   * @param updates 更新的變數或配置
   * @returns Promise<ProposalGenerationResult>
   */
  async regenerateProposal(
    originalGenerationId: string,
    updates?: {
      variables?: Record<string, any>;
      aiConfig?: Record<string, any>;
    }
  ): Promise<ProposalGenerationResult> {
    try {
      // 獲取原始生成記錄
      const originalGeneration = await prisma.proposalGeneration.findUnique({
        where: { id: originalGenerationId },
        include: {
          template: true,
          generator: {
            select: { id: true, first_name: true, last_name: true }
          }
        }
      });

      if (!originalGeneration) {
        throw new Error(`生成記錄 ${originalGenerationId} 不存在`);
      }

      // 合併變數和配置
      const mergedVariables = {
        ...(originalGeneration.variables as Record<string, any>),
        ...updates?.variables
      };

      const aiSettings = originalGeneration.ai_settings as { temperature?: number; maxTokens?: number } | null;
      const mergedAiConfig = {
        temperature: aiSettings?.temperature || 0.7,
        maxTokens: aiSettings?.maxTokens || 2000,
        model: originalGeneration.ai_model,
        ...updates?.aiConfig
      };

      // 創建新的生成請求
      const regenerationRequest: ProposalGenerationRequest = {
        templateId: originalGeneration.template_id,
        title: `${originalGeneration.title} (重新生成)`,
        variables: mergedVariables,
        customerId: originalGeneration.customer_id || undefined,
        opportunityId: originalGeneration.proposal_id || undefined,
        generatedBy: originalGeneration.generated_by,
        aiConfig: mergedAiConfig
      };

      // 執行重新生成
      const result = await this.generateProposal(regenerationRequest);

      // 建立版本關聯
      if (result.status === 'COMPLETED') {
        await prisma.proposalGeneration.update({
          where: { id: result.id },
          data: {
            regenerated_from: originalGenerationId
          }
        });
      }

      return result;

    } catch (error: any) {
      console.error('重新生成提案失敗:', error);
      return {
        id: 'unknown',
        content: '',
        status: 'FAILED',
        error: error.message,
        generatedAt: new Date()
      };
    }
  }

  /**
   * 獲取提案生成歷史
   *
   * @param filters 過濾條件
   * @returns Promise<ProposalGenerationResult[]>
   */
  async getGenerationHistory(filters: {
    userId?: number;
    customerId?: number;
    templateId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    generations: ProposalGenerationResult[];
    total: number;
  }> {
    const where: any = {};

    if (filters.userId) where.generated_by = filters.userId;
    if (filters.customerId) where.customer_id = filters.customerId;
    if (filters.templateId) where.template_id = filters.templateId;
    if (filters.status) where.status = filters.status;

    const [generations, total] = await Promise.all([
      prisma.proposalGeneration.findMany({
        where,
        include: {
          template: {
            select: { name: true, category: true }
          },
          generator: {
            select: { first_name: true, last_name: true, email: true }
          },
          customer: {
            select: { company_name: true }
          },
          proposal: {
            select: { id: true, title: true, status: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: filters.offset || 0,
        take: filters.limit || 20
      }),
      prisma.proposalGeneration.count({ where })
    ]);

    return {
      generations: generations.map(gen => {
        const tokenUsage = gen.token_usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | null;
        return {
          id: gen.id,
          proposalId: gen.proposal_id || undefined,
          content: gen.content,
          status: gen.status as any,
          qualityScore: gen.quality_score || undefined,
          usage: {
            promptTokens: tokenUsage?.promptTokens || 0,
            completionTokens: tokenUsage?.completionTokens || 0,
            totalTokens: tokenUsage?.totalTokens || 0
          },
          error: gen.error_message || undefined,
          generatedAt: gen.created_at
        };
      }),
      total
    };
  }

  /**
   * 驗證必要變數
   *
   * @param templateVariables 範本變數定義
   * @param providedVariables 提供的變數
   * @returns 缺少的必要變數名稱陣列
   */
  private validateRequiredVariables(
    templateVariables: Record<string, any>,
    providedVariables: Record<string, any>
  ): string[] {
    const missing: string[] = [];

    for (const [varName, varDef] of Object.entries(templateVariables)) {
      if (varDef.required && (!providedVariables[varName] || providedVariables[varName] === '')) {
        missing.push(varName);
      }
    }

    return missing;
  }

  /**
   * 編譯範本內容
   *
   * @param templateContent 範本內容（Handlebars格式）
   * @param variables 變數值
   * @returns 編譯後的內容
   */
  private compileTemplate(templateContent: string, variables: Record<string, any>): string {
    try {
      const template = Handlebars.compile(templateContent);
      return template(variables);
    } catch (error: any) {
      throw new Error(`範本編譯失敗: ${error.message}`);
    }
  }

  /**
   * 創建正式提案記錄
   *
   * @param params 提案創建參數
   * @returns Promise<number> 新創建的提案ID
   */
  private async createFormalProposal(params: {
    customerId: number;
    opportunityId?: number;
    title: string;
    content: string;
    generatedBy: number;
    generationId: string;
  }): Promise<number | undefined> {
    try {
      const proposal = await prisma.proposal.create({
        data: {
          customer_id: params.customerId,
          opportunity_id: params.opportunityId,
          user_id: params.generatedBy,
          title: params.title,
          description: `由AI生成 (生成ID: ${params.generationId})`,
          status: 'DRAFT',
          version: 1
        }
      });

      return proposal.id;
    } catch (error: any) {
      console.error('創建正式提案失敗:', error);
      return undefined;
    }
  }

  /**
   * 獲取範本變數定義
   *
   * @param templateId 範本ID
   * @returns Promise<TemplateVariable[]>
   */
  async getTemplateVariables(templateId: string): Promise<TemplateVariable[]> {
    const template = await prisma.proposalTemplate.findUnique({
      where: { id: templateId },
      select: { variables: true }
    });

    if (!template) {
      throw new Error(`範本 ${templateId} 不存在`);
    }

    const variables = template.variables as Record<string, any>;
    return Object.entries(variables).map(([name, def]) => ({
      name,
      type: def.type || 'text',
      required: def.required || false,
      description: def.description || '',
      defaultValue: def.defaultValue,
      options: def.options
    }));
  }

  /**
   * 測試範本生成
   *
   * @param templateId 範本ID
   * @param testVariables 測試變數
   * @returns Promise<string> 編譯後的範本內容
   */
  async testTemplate(templateId: string, testVariables: Record<string, any>): Promise<string> {
    const template = await prisma.proposalTemplate.findUnique({
      where: { id: templateId },
      select: { content: true, variables: true }
    });

    if (!template) {
      throw new Error(`範本 ${templateId} 不存在`);
    }

    return this.compileTemplate(template.content, testVariables);
  }
}

// 默認提案生成服務實例
let defaultProposalGenerationService: ProposalGenerationService | null = null;

/**
 * 獲取默認的提案生成服務實例
 *
 * @returns ProposalGenerationService實例
 */
export function getProposalGenerationService(): ProposalGenerationService {
  if (!defaultProposalGenerationService) {
    defaultProposalGenerationService = new ProposalGenerationService();
  }
  return defaultProposalGenerationService;
}