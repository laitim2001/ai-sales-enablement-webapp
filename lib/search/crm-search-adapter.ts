/**
 * CRM 搜索適配器
 *
 * 功能：
 * - 將CRM資料整合到現有搜索系統
 * - 支援客戶、聯絡人、銷售機會的智能搜索
 * - 與語義搜索引擎整合
 * - 提供統一的搜索介面和結果格式
 * - 支援混合搜索（知識庫 + CRM）
 *
 * 搜索實體類型：
 * - Customer (客戶公司)
 * - CustomerContact (聯絡人)
 * - SalesOpportunity (銷售機會)
 * - Interaction (互動記錄)
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { PrismaClient } from '@prisma/client';
import { getCustomer360Service } from '../integrations/customer-360/service';
import { SemanticQueryProcessor } from './semantic-query-processor';

// CRM 搜索結果介面
interface CrmSearchResult {
  id: string;                    // 唯一識別碼
  type: 'customer' | 'contact' | 'opportunity' | 'interaction';
  title: string;                 // 主標題
  subtitle?: string;             // 副標題
  description?: string;          // 描述
  score: number;                 // 相關性分數 (0-1)
  metadata: Record<string, any>; // 額外元數據
  highlights?: string[];         // 高亮片段
  relatedEntities?: RelatedEntity[]; // 相關實體
  lastUpdated: Date;            // 最後更新時間
  source: 'local' | 'dynamics365'; // 資料來源
}

// 相關實體介面
interface RelatedEntity {
  id: string;
  type: string;
  name: string;
  relationship: string; // 關係描述
}

// 搜索建議介面
interface SearchSuggestion {
  type: string;               // 建議類型 (customer, contact, opportunity)
  text: string;               // 建議文本
  description?: string;       // 建議描述
  entity_id?: string;         // 關聯實體 ID
  relevance_score?: number;   // 相關性分數
}

// CRM 搜索選項
interface CrmSearchOptions {
  entityTypes?: ('customer' | 'contact' | 'opportunity' | 'interaction')[];
  includeInactive?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
  assignedUserId?: number;
  customerStatuses?: string[];
  opportunityStatuses?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'name' | 'value';
  sortOrder?: 'asc' | 'desc';
}

// 混合搜索結果介面
interface HybridSearchResult {
  query: string;                 // 原始查詢
  totalResults: number;          // 總結果數
  knowledgeResults: any[];       // 知識庫搜索結果
  crmResults: CrmSearchResult[]; // CRM 搜索結果
  semanticAnalysis?: any;        // 語義分析結果
  suggestions?: string[];        // 搜索建議
  processingTime: number;        // 處理時間 (毫秒)
}

/**
 * CRM 搜索適配器類
 *
 * 將CRM資料整合到搜索系統，提供統一的搜索介面
 * 支援語義搜索和傳統文本搜索的混合模式
 */
export class CrmSearchAdapter {
  private prisma: PrismaClient;
  private customer360Service: ReturnType<typeof getCustomer360Service>;
  private semanticProcessor: SemanticQueryProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.customer360Service = getCustomer360Service();
    this.semanticProcessor = new SemanticQueryProcessor();
  }

  /**
   * 執行CRM搜索
   *
   * 支援自然語言查詢和傳統關鍵字搜索
   *
   * @param query 搜索查詢
   * @param options 搜索選項
   * @returns Promise<CrmSearchResult[]> 搜索結果
   */
  async searchCrmData(
    query: string,
    options: CrmSearchOptions = {}
  ): Promise<CrmSearchResult[]> {
    const startTime = Date.now();

    try {
      // 預設搜索所有實體類型
      const entityTypes = options.entityTypes || ['customer', 'contact', 'opportunity', 'interaction'];

      // 並行執行不同實體的搜索
      const searchPromises = entityTypes.map(entityType => {
        switch (entityType) {
          case 'customer':
            return this.searchCustomers(query, options);
          case 'contact':
            return this.searchContacts(query, options);
          case 'opportunity':
            return this.searchOpportunities(query, options);
          case 'interaction':
            return this.searchInteractions(query, options);
          default:
            return Promise.resolve([]);
        }
      });

      const searchResults = await Promise.all(searchPromises);

      // 合併和排序結果
      const allResults = searchResults.flat();
      const sortedResults = this.sortSearchResults(allResults, options);

      // 應用限制
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const paginatedResults = sortedResults.slice(offset, offset + limit);

      console.log(`CRM搜索完成: ${query} - ${Date.now() - startTime}ms`);
      return paginatedResults;

    } catch (error) {
      console.error('CRM搜索失敗:', error);
      throw new Error(`CRM搜索失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 執行混合搜索 (知識庫 + CRM)
   *
   * 結合知識庫搜索和CRM搜索的綜合結果
   *
   * @param query 搜索查詢
   * @param options CRM搜索選項
   * @param knowledgeOptions 知識庫搜索選項 (可選)
   * @returns Promise<HybridSearchResult> 混合搜索結果
   */
  async performHybridSearch(
    query: string,
    options: CrmSearchOptions = {},
    knowledgeOptions: any = {}
  ): Promise<HybridSearchResult> {
    const startTime = Date.now();

    try {
      // 執行語義分析
      const semanticAnalysis = await this.semanticProcessor.analyzeQuery(query);

      // 並行執行知識庫和CRM搜索
      const [crmResults, knowledgeResults] = await Promise.all([
        this.searchCrmData(query, options),
        this.searchKnowledgeBase(query, knowledgeOptions) // 需要實現知識庫搜索整合
      ]);

      // 生成搜索建議
      const suggestions = await this.generateSearchSuggestions(query, semanticAnalysis);

      const processingTime = Date.now() - startTime;

      return {
        query,
        totalResults: crmResults.length + knowledgeResults.length,
        knowledgeResults,
        crmResults,
        semanticAnalysis,
        suggestions,
        processingTime
      };

    } catch (error) {
      console.error('混合搜索失敗:', error);
      throw new Error(`混合搜索失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 搜索客戶
   *
   * @param query 搜索查詢
   * @param options 搜索選項
   * @returns Promise<CrmSearchResult[]> 客戶搜索結果
   */
  private async searchCustomers(
    query: string,
    options: CrmSearchOptions
  ): Promise<CrmSearchResult[]> {
    // 建構查詢條件
    const whereConditions: any = {
      OR: [
        { company_name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { website: { contains: query, mode: 'insensitive' } },
        { industry: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } }
      ]
    };

    // 應用篩選條件
    if (!options.includeInactive) {
      // 這裡假設有 is_active 欄位，實際可能需要根據 status 判斷
    }

    if (options.customerStatuses?.length) {
      whereConditions.status = { in: options.customerStatuses };
    }

    if (options.assignedUserId) {
      whereConditions.assigned_user_id = options.assignedUserId;
    }

    if (options.timeRange) {
      whereConditions.created_at = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    // 執行查詢
    const customers = await this.prisma.customer.findMany({
      where: whereConditions,
      include: {
        assignedUser: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        contacts: {
          where: { is_active: true },
          select: {
            id: true,
            full_name: true,
            job_title: true
          },
          take: 3
        },
        salesOpportunities: {
          where: { status: 'OPEN' },
          select: {
            id: true,
            name: true,
            estimated_value: true
          },
          take: 3
        }
      },
      take: 20
    });

    // 轉換為搜索結果格式
    return customers.map(customer => {
      const score = this.calculateRelevanceScore(query, {
        company_name: customer.company_name,
        email: customer.email,
        industry: customer.industry,
        notes: customer.notes
      });

      const highlights = this.generateHighlights(query, [
        customer.company_name,
        customer.email,
        customer.industry
      ].filter(Boolean) as string[]);

      const relatedEntities: RelatedEntity[] = [
        ...customer.contacts.map(contact => ({
          id: contact.id.toString(),
          type: 'contact',
          name: contact.full_name,
          relationship: contact.job_title || '聯絡人'
        })),
        ...customer.salesOpportunities.map(opp => ({
          id: opp.id.toString(),
          type: 'opportunity',
          name: opp.name,
          relationship: `銷售機會 - ${opp.estimated_value ? `$${opp.estimated_value}` : '未定價值'}`
        }))
      ];

      return {
        id: `customer-${customer.id}`,
        type: 'customer' as const,
        title: customer.company_name,
        subtitle: customer.industry || undefined,
        description: customer.notes || `聯絡人: ${customer.contacts.length}, 機會: ${customer.salesOpportunities.length}`,
        score,
        metadata: {
          customerId: customer.id,
          status: customer.status,
          assignedUser: customer.assignedUser ?
            `${customer.assignedUser.first_name} ${customer.assignedUser.last_name}` : null,
          email: customer.email,
          phone: customer.phone,
          website: customer.website,
          companySize: customer.company_size,
          externalId: customer.external_id,
          externalSource: customer.external_source
        },
        highlights,
        relatedEntities,
        lastUpdated: customer.updated_at,
        source: customer.external_source === 'dynamics365' ? 'dynamics365' : 'local'
      };
    });
  }

  /**
   * 搜索聯絡人
   *
   * @param query 搜索查詢
   * @param options 搜索選項
   * @returns Promise<CrmSearchResult[]> 聯絡人搜索結果
   */
  private async searchContacts(
    query: string,
    options: CrmSearchOptions
  ): Promise<CrmSearchResult[]> {
    const whereConditions: any = {
      OR: [
        { full_name: { contains: query, mode: 'insensitive' } },
        { first_name: { contains: query, mode: 'insensitive' } },
        { last_name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { mobile: { contains: query } },
        { job_title: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (!options.includeInactive) {
      whereConditions.is_active = true;
    }

    if (options.timeRange) {
      whereConditions.created_at = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    const contacts = await this.prisma.customerContact.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            company_name: true,
            status: true
          }
        }
      },
      take: 20
    });

    return contacts.map(contact => {
      const score = this.calculateRelevanceScore(query, {
        full_name: contact.full_name,
        email: contact.email,
        job_title: contact.job_title,
        department: contact.department,
        notes: contact.notes
      });

      const highlights = this.generateHighlights(query, [
        contact.full_name,
        contact.email,
        contact.job_title,
        contact.department
      ].filter(Boolean) as string[]);

      const relatedEntities: RelatedEntity[] = [{
        id: contact.customer.id.toString(),
        type: 'customer',
        name: contact.customer.company_name,
        relationship: '所屬公司'
      }];

      return {
        id: `contact-${contact.id}`,
        type: 'contact' as const,
        title: contact.full_name,
        subtitle: contact.job_title || contact.department || undefined,
        description: `${contact.customer.company_name} ${contact.email ? `- ${contact.email}` : ''}`,
        score,
        metadata: {
          contactId: contact.id,
          customerId: contact.customer_id,
          customerName: contact.customer.company_name,
          email: contact.email,
          phone: contact.phone,
          mobile: contact.mobile,
          isPrimary: contact.is_primary,
          isActive: contact.is_active,
          externalId: contact.external_id,
          externalSource: contact.external_source
        },
        highlights,
        relatedEntities,
        lastUpdated: contact.updated_at,
        source: contact.external_source === 'dynamics365' ? 'dynamics365' : 'local'
      };
    });
  }

  /**
   * 搜索銷售機會
   *
   * @param query 搜索查詢
   * @param options 搜索選項
   * @returns Promise<CrmSearchResult[]> 銷售機會搜索結果
   */
  private async searchOpportunities(
    query: string,
    options: CrmSearchOptions
  ): Promise<CrmSearchResult[]> {
    const whereConditions: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { stage: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
        { lost_reason: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (options.opportunityStatuses?.length) {
      whereConditions.status = { in: options.opportunityStatuses };
    }

    if (options.assignedUserId) {
      whereConditions.assigned_user_id = options.assignedUserId;
    }

    if (options.timeRange) {
      whereConditions.created_at = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    const opportunities = await this.prisma.salesOpportunity.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            company_name: true
          }
        },
        contact: {
          select: {
            id: true,
            full_name: true
          }
        },
        assignedUser: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      take: 20
    });

    return opportunities.map(opp => {
      const score = this.calculateRelevanceScore(query, {
        name: opp.name,
        description: opp.description,
        stage: opp.stage,
        notes: opp.notes
      });

      const highlights = this.generateHighlights(query, [
        opp.name,
        opp.description,
        opp.stage
      ].filter(Boolean) as string[]);

      const relatedEntities: RelatedEntity[] = [
        {
          id: opp.customer.id.toString(),
          type: 'customer',
          name: opp.customer.company_name,
          relationship: '客戶'
        }
      ];

      if (opp.contact) {
        relatedEntities.push({
          id: opp.contact.id.toString(),
          type: 'contact',
          name: opp.contact.full_name,
          relationship: '主要聯絡人'
        });
      }

      const estimatedValue = opp.estimated_value ? Number(opp.estimated_value) : null;

      return {
        id: `opportunity-${opp.id}`,
        type: 'opportunity' as const,
        title: opp.name,
        subtitle: `${opp.customer.company_name} - ${opp.stage || opp.status}`,
        description: `${estimatedValue ? `價值: $${estimatedValue.toLocaleString()}` : ''} ${opp.close_probability ? `機率: ${opp.close_probability}%` : ''}`,
        score,
        metadata: {
          opportunityId: opp.id,
          customerId: opp.customer_id,
          customerName: opp.customer.company_name,
          contactId: opp.contact_id,
          contactName: opp.contact?.full_name,
          estimatedValue,
          closeProbability: opp.close_probability,
          estimatedCloseDate: opp.estimated_close_date,
          stage: opp.stage,
          status: opp.status,
          assignedUser: opp.assignedUser ?
            `${opp.assignedUser.first_name} ${opp.assignedUser.last_name}` : null,
          externalId: opp.external_id,
          externalSource: opp.external_source
        },
        highlights,
        relatedEntities,
        lastUpdated: opp.updated_at,
        source: opp.external_source === 'dynamics365' ? 'dynamics365' : 'local'
      };
    });
  }

  /**
   * 搜索互動記錄
   *
   * @param query 搜索查詢
   * @param options 搜索選項
   * @returns Promise<CrmSearchResult[]> 互動記錄搜索結果
   */
  private async searchInteractions(
    query: string,
    options: CrmSearchOptions
  ): Promise<CrmSearchResult[]> {
    // 簡化實現 - 搜索通話記錄作為互動記錄的代表
    const whereConditions: any = {
      OR: [
        { summary: { contains: query, mode: 'insensitive' } },
        { action_items: { contains: query, mode: 'insensitive' } }
        // 注意：outcome是枚舉類型，不能使用contains操作符
        // 如果需要搜索outcome，應該使用精確匹配或in操作符
      ]
    };

    if (options.assignedUserId) {
      whereConditions.user_id = options.assignedUserId;
    }

    if (options.timeRange) {
      whereConditions.call_date = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    const callRecords = await this.prisma.callRecord.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            company_name: true
          }
        },
        user: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      take: 20,
      orderBy: { call_date: 'desc' }
    });

    return callRecords.map(call => {
      const score = this.calculateRelevanceScore(query, {
        summary: call.summary,
        action_items: call.action_items,
        outcome: call.outcome
      });

      const highlights = this.generateHighlights(query, [
        call.summary,
        call.action_items,
        call.outcome
      ].filter(Boolean) as string[]);

      const relatedEntities: RelatedEntity[] = [{
        id: call.customer.id.toString(),
        type: 'customer',
        name: call.customer.company_name,
        relationship: '客戶'
      }];

      return {
        id: `interaction-${call.id}`,
        type: 'interaction' as const,
        title: `通話記錄 - ${call.customer.company_name}`,
        subtitle: call.outcome || `通話時長: ${call.duration || 0}分鐘`,
        description: call.summary || call.action_items || '無摘要',
        score,
        metadata: {
          callId: call.id,
          customerId: call.customer_id,
          customerName: call.customer.company_name,
          callDate: call.call_date,
          duration: call.duration,
          outcome: call.outcome,
          status: call.status,
          assignedUser: call.user ?
            `${call.user.first_name} ${call.user.last_name}` : null,
          recordingUrl: call.recording_url
        },
        highlights,
        relatedEntities,
        lastUpdated: call.updated_at,
        source: 'local'
      };
    });
  }

  // ==================== 輔助方法 ====================

  /**
   * 計算相關性分數
   *
   * @param query 搜索查詢
   * @param fields 要比對的欄位
   * @returns number 相關性分數 (0-1)
   */
  private calculateRelevanceScore(
    query: string,
    fields: Record<string, string | null | undefined>
  ): number {
    const queryLower = query.toLowerCase();
    let totalScore = 0;
    let fieldCount = 0;

    Object.entries(fields).forEach(([fieldName, value]) => {
      if (!value) return;

      const valueLower = value.toLowerCase();
      let fieldScore = 0;

      // 完全匹配
      if (valueLower === queryLower) {
        fieldScore = 1.0;
      }
      // 開頭匹配
      else if (valueLower.startsWith(queryLower)) {
        fieldScore = 0.8;
      }
      // 包含匹配
      else if (valueLower.includes(queryLower)) {
        fieldScore = 0.6;
      }
      // 部分詞匹配
      else {
        const queryWords = queryLower.split(/\s+/);
        const matchedWords = queryWords.filter(word =>
          valueLower.includes(word)
        );
        fieldScore = matchedWords.length / queryWords.length * 0.4;
      }

      // 根據欄位重要性調整權重
      const fieldWeight = this.getFieldWeight(fieldName);
      totalScore += fieldScore * fieldWeight;
      fieldCount += fieldWeight;
    });

    return fieldCount > 0 ? Math.min(1, totalScore / fieldCount) : 0;
  }

  /**
   * 獲取欄位權重
   *
   * @param fieldName 欄位名稱
   * @returns number 權重值
   */
  private getFieldWeight(fieldName: string): number {
    const weights: Record<string, number> = {
      company_name: 2.0,
      full_name: 2.0,
      name: 2.0,
      email: 1.5,
      job_title: 1.3,
      industry: 1.2,
      department: 1.1,
      description: 1.0,
      notes: 0.8,
      summary: 1.0,
      stage: 1.0,
      outcome: 0.9
    };

    return weights[fieldName] || 1.0;
  }

  /**
   * 生成搜索高亮
   *
   * @param query 搜索查詢
   * @param texts 要高亮的文本陣列
   * @returns string[] 高亮片段
   */
  private generateHighlights(query: string, texts: string[]): string[] {
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();

    texts.forEach(text => {
      if (!text) return;

      const textLower = text.toLowerCase();
      const queryIndex = textLower.indexOf(queryLower);

      if (queryIndex !== -1) {
        // 提取包含查詢詞的上下文
        const start = Math.max(0, queryIndex - 20);
        const end = Math.min(text.length, queryIndex + query.length + 20);
        let highlight = text.substring(start, end);

        // 添加省略號
        if (start > 0) highlight = '...' + highlight;
        if (end < text.length) highlight = highlight + '...';

        highlights.push(highlight);
      }
    });

    return highlights.slice(0, 3); // 限制高亮數量
  }

  /**
   * 排序搜索結果
   *
   * @param results 搜索結果
   * @param options 搜索選項
   * @returns CrmSearchResult[] 排序後的結果
   */
  private sortSearchResults(
    results: CrmSearchResult[],
    options: CrmSearchOptions
  ): CrmSearchResult[] {
    const sortBy = options.sortBy || 'relevance';
    const sortOrder = options.sortOrder || 'desc';

    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.score - b.score;
          break;
        case 'date':
          comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'value':
          const aValue = a.metadata.estimatedValue || 0;
          const bValue = b.metadata.estimatedValue || 0;
          comparison = aValue - bValue;
          break;
        default:
          comparison = a.score - b.score;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * 搜索知識庫 (整合現有搜索系統)
   *
   * @param query 搜索查詢
   * @param options 知識庫搜索選項
   * @returns Promise<any[]> 知識庫搜索結果
   */
  private async searchKnowledgeBase(query: string, options: any = {}): Promise<any[]> {
    try {
      // 調用現有的知識庫搜索API
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          searchType: 'hybrid', // 使用混合搜索
          limit: options.limit || 10,
          offset: options.offset || 0
        })
      });

      if (!response.ok) {
        console.warn('知識庫搜索API調用失敗:', response.statusText);
        return [];
      }

      const data = await response.json();

      // 將知識庫搜索結果轉換為統一格式
      if (data.results && Array.isArray(data.results)) {
        return data.results.map((result: any) => ({
          id: result.id || `kb_${Math.random()}`,
          type: 'knowledge',
          title: result.title || result.fileName || '未命名文檔',
          description: result.summary || result.content?.substring(0, 200) || '',
          content: result.content,
          highlights: result.chunks?.map((chunk: any) => chunk.content) || [],
          score: result.similarity_score || result.score || 0.5,
          lastUpdated: new Date(result.updated_at || result.created_at || Date.now()),
          metadata: {
            source: 'knowledge_base',
            author: result.author,
            created_at: result.created_at,
            updated_at: result.updated_at,
            file_type: result.file_type,
            category: result.category,
            tags: result.tags
          },
          tags: result.tags || []
        }));
      }

      return [];
    } catch (error) {
      console.error('搜索知識庫時發生錯誤:', error);
      return [];
    }
  }

  /**
   * 生成搜索建議
   *
   * @param query 原始查詢
   * @param semanticAnalysis 語義分析結果
   * @returns Promise<string[]> 搜索建議
   */
  private async generateSearchSuggestions(
    query: string,
    semanticAnalysis: any
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // 基於語義分析生成建議
    if (semanticAnalysis?.entities?.length > 0) {
      semanticAnalysis.entities.forEach((entity: any) => {
        if (entity.type === 'ORGANIZATION') {
          suggestions.push(`公司: ${entity.value}`);
        } else if (entity.type === 'PERSON') {
          suggestions.push(`聯絡人: ${entity.value}`);
        }
      });
    }

    // 添加一些常見的搜索建議
    suggestions.push(
      `"${query}" 相關客戶`,
      `"${query}" 銷售機會`,
      `"${query}" 最近互動`
    );

    return suggestions.slice(0, 5);
  }

  /**
   * 獲取搜索建議
   *
   * @param query 搜索查詢
   * @param options 搜索選項
   * @returns Promise<SearchSuggestion[]> 搜索建議列表
   */
  async getSearchSuggestions(query: string, options: any = {}): Promise<SearchSuggestion[]> {
    try {
      const { entity_types = ['customers', 'contacts', 'opportunities'], limit = 10 } = options;
      const suggestions: SearchSuggestion[] = [];

      // 為每個實體類型生成建議
      for (const entityType of entity_types) {
        let entitySuggestions: SearchSuggestion[] = [];

        switch (entityType) {
          case 'customers':
            entitySuggestions = await this.getCustomerSuggestions(query, Math.ceil(limit / entity_types.length));
            break;
          case 'contacts':
            entitySuggestions = await this.getContactSuggestions(query, Math.ceil(limit / entity_types.length));
            break;
          case 'opportunities':
            entitySuggestions = await this.getOpportunitySuggestions(query, Math.ceil(limit / entity_types.length));
            break;
        }

        suggestions.push(...entitySuggestions);
      }

      // 按相關性排序並限制結果數量
      return suggestions
        .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
        .slice(0, limit);

    } catch (error) {
      console.error('獲取搜索建議失敗:', error);
      return [];
    }
  }

  /**
   * 獲取客戶搜索建議
   */
  private async getCustomerSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        OR: [
          { company_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        company_name: true,
        industry: true,
        status: true
      },
      take: limit
    });

    return customers.map(customer => ({
      type: 'customer',
      text: customer.company_name,
      description: `${customer.industry} • ${customer.status}`,
      entity_id: customer.id.toString(),
      relevance_score: this.calculateTextSimilarity(query, customer.company_name)
    }));
  }

  /**
   * 獲取聯絡人搜索建議
   */
  private async getContactSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const contacts = await this.prisma.customerContact.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { job_title: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        job_title: true,
        customer: {
          select: {
            company_name: true
          }
        }
      },
      take: limit
    });

    return contacts.map(contact => ({
      type: 'contact',
      text: contact.name,
      description: `${contact.job_title} @ ${contact.customer.company_name}`,
      entity_id: contact.id.toString(),
      relevance_score: this.calculateTextSimilarity(query, contact.name)
    }));
  }

  /**
   * 獲取銷售機會搜索建議
   */
  private async getOpportunitySuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const opportunities = await this.prisma.salesOpportunity.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        estimated_value: true,
        status: true,
        customer: {
          select: {
            company_name: true
          }
        }
      },
      take: limit
    });

    return opportunities.map(opportunity => ({
      type: 'opportunity',
      text: opportunity.title,
      description: `$${opportunity.estimated_value?.toLocaleString()} • ${opportunity.customer.company_name}`,
      entity_id: opportunity.id.toString(),
      relevance_score: this.calculateTextSimilarity(query, opportunity.title)
    }));
  }

  /**
   * 計算文本相似度
   */
  private calculateTextSimilarity(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    if (textLower === queryLower) return 1.0;
    if (textLower.startsWith(queryLower)) return 0.8;
    if (textLower.includes(queryLower)) return 0.6;

    // 計算詞匹配度
    const queryWords = queryLower.split(/\s+/);
    const textWords = textLower.split(/\s+/);
    const matchedWords = queryWords.filter(word =>
      textWords.some(textWord => textWord.includes(word))
    );

    return matchedWords.length / queryWords.length * 0.4;
  }

  /**
   * 清理資源
   */
  async dispose(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// 單例模式
let crmSearchAdapterInstance: CrmSearchAdapter | null = null;

/**
 * 獲取CRM搜索適配器的單例實例
 *
 * @returns CrmSearchAdapter 搜索適配器實例
 */
export function getCrmSearchAdapter(): CrmSearchAdapter {
  if (!crmSearchAdapterInstance) {
    crmSearchAdapterInstance = new CrmSearchAdapter();
  }
  return crmSearchAdapterInstance;
}

// 匯出類型供其他模組使用
export type {
  CrmSearchResult,
  CrmSearchOptions,
  HybridSearchResult,
  RelatedEntity,
  SearchSuggestion
};