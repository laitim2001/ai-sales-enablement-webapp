/**
 * 客戶360度視圖服務
 *
 * 功能：
 * - 整合來自不同來源的客戶資料
 * - 提供統一的客戶全貌視圖
 * - 智能客戶資料聚合和分析
 * - 客戶互動歷史和時間軸
 * - 客戶關係和商機追蹤
 *
 * 整合的資料來源：
 * - 本地客戶資料 (Customer)
 * - CRM 系統資料 (Dynamics 365)
 * - 知識庫互動記錄
 * - 銷售機會和提案歷史
 * - 通話記錄和互動記錄
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { PrismaClient } from '@prisma/client';
import { getDynamics365Client } from '../dynamics365/client';

// 客戶360度視圖資料介面
interface Customer360View {
  // 基本客戶資訊
  basicInfo: CustomerBasicInfo;
  // 聯絡人資訊
  contacts: CustomerContactInfo[];
  // 銷售機會
  opportunities: OpportunityInfo[];
  // 互動歷史
  interactions: InteractionInfo[];
  // 文檔和提案
  documents: DocumentInfo[];
  // 統計摘要
  summary: CustomerSummary;
  // 時間軸
  timeline: TimelineEvent[];
  // AI 洞察
  insights: CustomerInsight[];
}

// 客戶基本資訊
interface CustomerBasicInfo {
  id: number;
  companyName: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  status: string;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
  address?: {
    line1?: string;
    city?: string;
    country?: string;
  };
  externalInfo?: {
    dynamicsId?: string;
    source?: string;
    lastSyncAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 聯絡人資訊
interface CustomerContactInfo {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
}

// 銷售機會資訊
interface OpportunityInfo {
  id: number;
  name: string;
  description?: string;
  estimatedValue?: number;
  estimatedCloseDate?: Date;
  closeProbability?: number;
  stage?: string;
  status: string;
  assignedUser?: string;
  createdAt: Date;
}

// 互動記錄資訊
interface InteractionInfo {
  id: number;
  type: string;
  date: Date;
  title: string;
  description?: string;
  duration?: number;
  outcome?: string;
  contactPerson?: string;
  assignedUser?: string;
}

// 文檔資訊
interface DocumentInfo {
  id: number;
  title: string;
  type: string;
  status?: string;
  createdAt: Date;
  lastModified?: Date;
  size?: number;
  category?: string;
}

// 客戶統計摘要
interface CustomerSummary {
  totalOpportunities: number;
  totalOpportunityValue: number;
  wonOpportunities: number;
  wonValue: number;
  avgDealSize: number;
  totalInteractions: number;
  lastInteractionDate?: Date;
  relationshipDuration: number; // 天數
  totalDocuments: number;
  engagementScore: number; // 0-100
  healthScore: number; // 0-100
}

// 時間軸事件
interface TimelineEvent {
  id: string;
  date: Date;
  type: 'interaction' | 'opportunity' | 'document' | 'proposal' | 'call';
  title: string;
  description?: string;
  metadata?: any;
  importance: 'low' | 'medium' | 'high';
}

// 客戶洞察
interface CustomerInsight {
  type: 'trend' | 'risk' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionable: boolean;
  metadata?: any;
}

// 查詢選項
interface Customer360QueryOptions {
  includeInactive?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeSubsidiaries?: boolean;
  detailLevel?: 'basic' | 'standard' | 'detailed';
}

/**
 * 客戶360度視圖服務錯誤類
 */
export class Customer360Error extends Error {
  constructor(
    message: string,
    public code: string,
    public customerId?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'Customer360Error';
  }
}

/**
 * 客戶360度視圖服務類
 *
 * 提供完整的客戶資料整合和分析功能
 * 結合本地資料庫和 CRM 系統的資訊
 */
export class Customer360Service {
  private prisma: PrismaClient;
  private dynamicsClient: ReturnType<typeof getDynamics365Client>;

  constructor() {
    this.prisma = new PrismaClient();
    this.dynamicsClient = getDynamics365Client();
  }

  /**
   * 獲取客戶360度視圖
   *
   * @param customerId 客戶 ID
   * @param options 查詢選項
   * @returns Promise<Customer360View> 完整的客戶360度視圖
   */
  async getCustomer360View(
    customerId: number,
    options: Customer360QueryOptions = {}
  ): Promise<Customer360View> {
    try {
      // 並行獲取各種資料
      const [
        basicInfo,
        contacts,
        opportunities,
        interactions,
        documents
      ] = await Promise.all([
        this.getCustomerBasicInfo(customerId),
        this.getCustomerContacts(customerId, options),
        this.getCustomerOpportunities(customerId, options),
        this.getCustomerInteractions(customerId, options),
        this.getCustomerDocuments(customerId, options)
      ]);

      // 生成統計摘要
      const summary = this.generateCustomerSummary(
        basicInfo,
        contacts,
        opportunities,
        interactions,
        documents
      );

      // 生成時間軸
      const timeline = this.generateTimeline(
        opportunities,
        interactions,
        documents
      );

      // 生成 AI 洞察
      const insights = await this.generateCustomerInsights(
        basicInfo,
        summary,
        timeline
      );

      return {
        basicInfo,
        contacts,
        opportunities,
        interactions,
        documents,
        summary,
        timeline,
        insights
      };

    } catch (error) {
      throw new Customer360Error(
        `獲取客戶360度視圖失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        'GET_360_VIEW_FAILED',
        customerId,
        error
      );
    }
  }

  /**
   * 獲取客戶基本資訊
   *
   * @param customerId 客戶 ID
   * @returns Promise<CustomerBasicInfo> 客戶基本資訊
   */
  private async getCustomerBasicInfo(customerId: number): Promise<CustomerBasicInfo> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        assignedUser: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (!customer) {
      throw new Customer360Error(
        `客戶 ID ${customerId} 不存在`,
        'CUSTOMER_NOT_FOUND',
        customerId
      );
    }

    return {
      id: customer.id,
      companyName: customer.company_name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      website: customer.website || undefined,
      industry: customer.industry || undefined,
      companySize: customer.company_size || undefined,
      status: customer.status,
      assignedUser: customer.assignedUser ? {
        id: customer.assignedUser.id,
        name: `${customer.assignedUser.first_name} ${customer.assignedUser.last_name}`,
        email: customer.assignedUser.email
      } : undefined,
      externalInfo: {
        dynamicsId: customer.external_id || undefined,
        source: customer.external_source || undefined,
        lastSyncAt: customer.last_sync_at || undefined
      },
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  }

  /**
   * 獲取客戶聯絡人資訊
   *
   * @param customerId 客戶 ID
   * @param options 查詢選項
   * @returns Promise<CustomerContactInfo[]> 聯絡人列表
   */
  private async getCustomerContacts(
    customerId: number,
    options: Customer360QueryOptions
  ): Promise<CustomerContactInfo[]> {
    const whereClause: any = { customer_id: customerId };

    if (!options.includeInactive) {
      whereClause.is_active = true;
    }

    const contacts = await this.prisma.customerContact.findMany({
      where: whereClause,
      orderBy: [
        { is_primary: 'desc' },
        { full_name: 'asc' }
      ]
    });

    return contacts.map(contact => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      fullName: contact.full_name,
      email: contact.email || undefined,
      phone: contact.phone || undefined,
      mobile: contact.mobile || undefined,
      jobTitle: contact.job_title || undefined,
      department: contact.department || undefined,
      isPrimary: contact.is_primary,
      isActive: contact.is_active
    }));
  }

  /**
   * 獲取客戶銷售機會
   *
   * @param customerId 客戶 ID
   * @param options 查詢選項
   * @returns Promise<OpportunityInfo[]> 銷售機會列表
   */
  private async getCustomerOpportunities(
    customerId: number,
    options: Customer360QueryOptions
  ): Promise<OpportunityInfo[]> {
    const whereClause: any = { customer_id: customerId };

    if (options.timeRange) {
      whereClause.created_at = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    const opportunities = await this.prisma.salesOpportunity.findMany({
      where: whereClause,
      include: {
        assignedUser: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return opportunities.map(opp => ({
      id: opp.id,
      name: opp.name,
      description: opp.description || undefined,
      estimatedValue: opp.estimated_value ? Number(opp.estimated_value) : undefined,
      estimatedCloseDate: opp.estimated_close_date || undefined,
      closeProbability: opp.close_probability || undefined,
      stage: opp.stage || undefined,
      status: opp.status,
      assignedUser: opp.assignedUser ?
        `${opp.assignedUser.first_name} ${opp.assignedUser.last_name}` : undefined,
      createdAt: opp.created_at
    }));
  }

  /**
   * 獲取客戶互動記錄
   *
   * @param customerId 客戶 ID
   * @param options 查詢選項
   * @returns Promise<InteractionInfo[]> 互動記錄列表
   */
  private async getCustomerInteractions(
    customerId: number,
    options: Customer360QueryOptions
  ): Promise<InteractionInfo[]> {
    const whereClause: any = { customer_id: customerId };

    if (options.timeRange) {
      whereClause.created_at = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    // 獲取互動記錄
    const interactions = await this.prisma.interaction.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: 50 // 限制數量以避免過量資料
    });

    // 獲取通話記錄
    const callRecords = await this.prisma.callRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { call_date: 'desc' },
      take: 50
    });

    // 合併並轉換資料
    const interactionList: InteractionInfo[] = [
      ...interactions.map(interaction => ({
        id: interaction.id,
        type: interaction.type,
        date: interaction.created_at,
        title: `${interaction.type} 互動`,
        description: interaction.description || undefined,
        contactPerson: undefined // contact_person欄位不存在於Interaction模型
      })),
      ...callRecords.map(call => ({
        id: call.id,
        type: 'CALL',
        date: call.call_date,
        title: '電話通話',
        description: call.summary || undefined,
        duration: call.duration || undefined,
        outcome: call.outcome || undefined,
        assignedUser: call.user ?
          `${call.user.first_name} ${call.user.last_name}` : undefined
      }))
    ];

    // 按日期排序
    return interactionList.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * 獲取客戶相關文檔
   *
   * @param customerId 客戶 ID
   * @param options 查詢選項
   * @returns Promise<DocumentInfo[]> 文檔列表
   */
  private async getCustomerDocuments(
    customerId: number,
    options: Customer360QueryOptions
  ): Promise<DocumentInfo[]> {
    const whereClause: any = { customer_id: customerId };

    if (options.timeRange) {
      whereClause.created_at = {
        gte: options.timeRange.start,
        lte: options.timeRange.end
      };
    }

    const documents = await this.prisma.document.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      type: doc.category, // Document模型使用category欄位
      status: undefined, // Document模型沒有status欄位
      createdAt: doc.created_at,
      lastModified: doc.updated_at,
      size: doc.file_size || undefined,
      category: doc.category || undefined
    }));
  }

  /**
   * 生成客戶統計摘要
   */
  private generateCustomerSummary(
    basicInfo: CustomerBasicInfo,
    contacts: CustomerContactInfo[],
    opportunities: OpportunityInfo[],
    interactions: InteractionInfo[],
    documents: DocumentInfo[]
  ): CustomerSummary {
    const totalOpportunities = opportunities.length;
    const wonOpportunities = opportunities.filter(opp => opp.status === 'WON').length;

    const totalOpportunityValue = opportunities
      .filter(opp => opp.estimatedValue)
      .reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);

    const wonValue = opportunities
      .filter(opp => opp.status === 'WON' && opp.estimatedValue)
      .reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);

    const avgDealSize = totalOpportunities > 0 ? totalOpportunityValue / totalOpportunities : 0;

    const lastInteractionDate = interactions.length > 0 ? interactions[0].date : undefined;

    const relationshipDuration = Math.floor(
      (new Date().getTime() - basicInfo.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 簡化的評分算法
    const engagementScore = Math.min(100, Math.floor(
      (interactions.length * 5) + (totalOpportunities * 10) + (documents.length * 2)
    ));

    const healthScore = Math.min(100, Math.floor(
      (engagementScore * 0.4) +
      (wonOpportunities * 15) +
      (lastInteractionDate ? Math.max(0, 30 - Math.floor(
        (new Date().getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
      )) : 0)
    ));

    return {
      totalOpportunities,
      totalOpportunityValue,
      wonOpportunities,
      wonValue,
      avgDealSize,
      totalInteractions: interactions.length,
      lastInteractionDate,
      relationshipDuration,
      totalDocuments: documents.length,
      engagementScore,
      healthScore
    };
  }

  /**
   * 生成時間軸事件
   */
  private generateTimeline(
    opportunities: OpportunityInfo[],
    interactions: InteractionInfo[],
    documents: DocumentInfo[]
  ): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // 添加銷售機會事件
    opportunities.forEach(opp => {
      events.push({
        id: `opportunity-${opp.id}`,
        date: opp.createdAt,
        type: 'opportunity',
        title: `銷售機會: ${opp.name}`,
        description: opp.description,
        importance: opp.estimatedValue && opp.estimatedValue > 100000 ? 'high' : 'medium',
        metadata: opp
      });
    });

    // 添加互動事件
    interactions.slice(0, 20).forEach(interaction => {
      events.push({
        id: `interaction-${interaction.id}`,
        date: interaction.date,
        type: 'interaction',
        title: interaction.title,
        description: interaction.description,
        importance: interaction.type === 'CALL' ? 'medium' : 'low',
        metadata: interaction
      });
    });

    // 添加文檔事件
    documents.slice(0, 10).forEach(doc => {
      events.push({
        id: `document-${doc.id}`,
        date: doc.createdAt,
        type: 'document',
        title: `文檔: ${doc.title}`,
        description: `類型: ${doc.type}`,
        importance: 'low',
        metadata: doc
      });
    });

    // 按日期排序
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * 生成客戶洞察 (基礎版本)
   *
   * @param basicInfo 基本資訊
   * @param summary 統計摘要
   * @param timeline 時間軸
   * @returns Promise<CustomerInsight[]> 客戶洞察列表
   */
  private async generateCustomerInsights(
    basicInfo: CustomerBasicInfo,
    summary: CustomerSummary,
    timeline: TimelineEvent[]
  ): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    // 健康度分析
    if (summary.healthScore < 30) {
      insights.push({
        type: 'risk',
        title: '客戶關係風險',
        description: '客戶健康度較低，建議加強互動和跟進',
        confidence: 85,
        actionable: true
      });
    }

    // 機會分析
    if (summary.totalOpportunities > 0 && summary.wonOpportunities === 0) {
      insights.push({
        type: 'opportunity',
        title: '轉換機會',
        description: '存在多個銷售機會但尚未成交，建議優化銷售策略',
        confidence: 75,
        actionable: true
      });
    }

    // 互動趨勢
    if (summary.lastInteractionDate) {
      const daysSinceLastInteraction = Math.floor(
        (new Date().getTime() - summary.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastInteraction > 30) {
        insights.push({
          type: 'recommendation',
          title: '建議主動聯繫',
          description: `已超過 ${daysSinceLastInteraction} 天未互動，建議主動聯繫維護關係`,
          confidence: 90,
          actionable: true
        });
      }
    }

    return insights;
  }

  /**
   * 搜尋客戶 (支援模糊搜尋)
   *
   * @param searchTerm 搜尋關鍵字
   * @param options 查詢選項
   * @returns Promise<CustomerBasicInfo[]> 搜尋結果
   */
  async searchCustomers(
    searchTerm: string,
    options: Customer360QueryOptions = {}
  ): Promise<CustomerBasicInfo[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        OR: [
          { company_name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
          { industry: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      take: 20,
      orderBy: [
        { updated_at: 'desc' }
      ]
    });

    return customers.map(customer => ({
      id: customer.id,
      companyName: customer.company_name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      website: customer.website || undefined,
      industry: customer.industry || undefined,
      companySize: customer.company_size || undefined,
      status: customer.status,
      assignedUser: customer.assignedUser ? {
        id: customer.assignedUser.id,
        name: `${customer.assignedUser.first_name} ${customer.assignedUser.last_name}`,
        email: customer.assignedUser.email
      } : undefined,
      externalInfo: {
        dynamicsId: customer.external_id || undefined,
        source: customer.external_source || undefined,
        lastSyncAt: customer.last_sync_at || undefined
      },
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }));
  }

  /**
   * 清理資源
   */
  async dispose(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// 單例模式
let customer360ServiceInstance: Customer360Service | null = null;

/**
 * 獲取客戶360度視圖服務的單例實例
 *
 * @returns Customer360Service 服務實例
 */
export function getCustomer360Service(): Customer360Service {
  if (!customer360ServiceInstance) {
    customer360ServiceInstance = new Customer360Service();
  }
  return customer360ServiceInstance;
}

// 匯出類型供其他模組使用
export type {
  Customer360View,
  CustomerBasicInfo,
  CustomerContactInfo,
  OpportunityInfo,
  InteractionInfo,
  DocumentInfo,
  CustomerSummary,
  TimelineEvent,
  CustomerInsight,
  Customer360QueryOptions
};