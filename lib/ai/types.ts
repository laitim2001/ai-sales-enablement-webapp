/**
 * @fileoverview ================================================================AI銷售賦能平台 - AI服務類型定義 (/lib/ai/types.ts)================================================================【檔案功能】提供AI服務相關的完整TypeScript類型定義，包含配置參數、業務模型、API回應結構、錯誤類型等，確保整個AI系統的類型安全和開發體驗。【主要職責】• 服務配置類型 - Azure OpenAI連接和部署參數• 業務模型類型 - 銷售場景、客戶信息、提案生成等• API介面類型 - 請求回應結構和選項參數• 狀態管理類型 - 任務狀態、健康檢查、使用統計• 錯誤處理類型 - 異常分類和錯誤信息結構【技術實現】• 嚴格類型定義 - 完整的TypeScript類型覆蓋• 業務領域建模 - 銷售賦能相關的專業類型• 泛型支持 - 靈活的API回應包裝器• 可選屬性設計 - 平衡必需與可選的配置【相關檔案】• ./openai.ts - 使用基礎配置和錯誤類型• ./embeddings.ts - 使用嵌入相關類型• ./chat.ts - 使用聊天和銷售助手類型• ./enhanced-embeddings.ts - 使用緩存和性能類型
 * @module lib/ai/types
 * @description
 * ================================================================AI銷售賦能平台 - AI服務類型定義 (/lib/ai/types.ts)================================================================【檔案功能】提供AI服務相關的完整TypeScript類型定義，包含配置參數、業務模型、API回應結構、錯誤類型等，確保整個AI系統的類型安全和開發體驗。【主要職責】• 服務配置類型 - Azure OpenAI連接和部署參數• 業務模型類型 - 銷售場景、客戶信息、提案生成等• API介面類型 - 請求回應結構和選項參數• 狀態管理類型 - 任務狀態、健康檢查、使用統計• 錯誤處理類型 - 異常分類和錯誤信息結構【技術實現】• 嚴格類型定義 - 完整的TypeScript類型覆蓋• 業務領域建模 - 銷售賦能相關的專業類型• 泛型支持 - 靈活的API回應包裝器• 可選屬性設計 - 平衡必需與可選的配置【相關檔案】• ./openai.ts - 使用基礎配置和錯誤類型• ./embeddings.ts - 使用嵌入相關類型• ./chat.ts - 使用聊天和銷售助手類型• ./enhanced-embeddings.ts - 使用緩存和性能類型
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

/**
 * ===== 基礎AI服務配置類型 =====
 */

/**
 * Azure OpenAI服務配置接口
 *
 * 定義連接Azure OpenAI服務所需的所有配置參數，
 * 包含端點、認證、版本和速率限制等設定。
 */
export interface AIServiceConfig {
  endpoint: string              // Azure OpenAI服務端點URL
  apiKey: string               // API密鑰用於身份驗證
  apiVersion: string           // API版本號
  deploymentIds: {             // 各模型的部署識別碼
    gpt4: string              // GPT-4聊天模型部署ID
    embeddings: string        // 文本嵌入模型部署ID
  }
  rateLimits: {               // 速率限制配置
    requestsPerMinute: number // 每分鐘最大請求數
    tokensPerMinute: number   // 每分鐘最大Token數
  }
}

/**
 * AI服務健康狀態監控
 *
 * 用於追蹤各個AI服務的運行狀態和性能指標
 */
export interface AIServiceHealth {
  service: string                                    // 服務名稱
  status: 'healthy' | 'degraded' | 'unhealthy'     // 健康狀態
  lastCheck: Date                                    // 最後檢查時間
  responseTime?: number                              // 回應時間（毫秒）
  errorMessage?: string                              // 錯誤信息（如果異常）
}

/**
 * ===== 文檔處理相關類型 =====
 */

/**
 * 文檔處理選項配置
 *
 * 定義文檔解析和處理過程的各種參數
 */
export interface DocumentProcessingOptions {
  chunkSize: number            // 文檔分塊大小
  overlapSize: number          // 塊之間的重疊大小
  preserveFormatting: boolean  // 是否保留格式
  extractMetadata: boolean     // 是否提取元數據
  supportedFormats: string[]   // 支持的文件格式列表
}

/**
 * 已處理的文檔對象
 *
 * 包含完整的文檔處理結果，包括原始內容、分塊結果和元數據
 */
export interface ProcessedDocument {
  id: string                  // 文檔唯一識別碼
  title: string              // 文檔標題
  content: string            // 原始文檔內容
  chunks: DocumentChunk[]    // 分塊結果陣列
  metadata: DocumentMetadata // 文檔元數據
  processingTime: number     // 處理耗時（毫秒）
  tokenCount: number         // 總Token數量
}

/**
 * 文檔分塊對象
 *
 * 代表文檔的一個處理塊，包含內容、向量嵌入和位置信息
 */
export interface DocumentChunk {
  id: string                 // 塊的唯一識別碼
  content: string            // 塊的文本內容
  embedding?: number[]       // 該塊的向量嵌入（可選）
  position: {                // 在原文檔中的位置
    start: number            // 起始位置
    end: number              // 結束位置
  }
  metadata?: Record<string, any> // 額外的元數據
}

/**
 * 文檔元數據
 *
 * 包含文檔的基本信息和屬性
 */
export interface DocumentMetadata {
  fileName: string        // 文件名稱
  fileSize: number        // 文件大小（字節）
  mimeType: string        // MIME類型
  language?: string       // 語言（可選）
  author?: string         // 作者（可選）
  createdAt: Date         // 創建時間
  lastModified?: Date     // 最後修改時間（可選）
  tags?: string[]         // 標籤列表（可選）
  category?: string       // 分類（可選）
}

/**
 * ===== 語意搜索相關類型 =====
 */

/**
 * 搜索查詢對象
 *
 * 定義語意搜索的查詢參數，包含搜索文本、過濾條件和選項
 */
export interface SearchQuery {
  text: string              // 搜索查詢文本
  filters?: {               // 搜索過濾條件（可選）
    categories?: string[]   // 按分類過濾
    tags?: string[]         // 按標籤過濾
    dateRange?: {           // 按日期範圍過濾
      start: Date           // 開始日期
      end: Date             // 結束日期
    }
    author?: string         // 按作者過濾
    language?: string       // 按語言過濾
  }
  options?: {               // 搜索選項（可選）
    maxResults: number      // 最大結果數量
    minSimilarity: number   // 最小相似度閾值
    includeMetadata: boolean // 是否包含元數據
    highlightMatches: boolean // 是否高亮匹配
  }
}

/**
 * 單個搜索結果
 *
 * 代表一個語意搜索的匹配結果，包含相似度評分和高亮信息
 */
export interface SearchResult {
  id: string                  // 結果唯一識別碼
  title: string              // 文檔標題
  content: string            // 匹配的內容片段
  similarity: number         // 相似度評分（0-1）
  metadata: DocumentMetadata // 文檔元數據
  highlights?: string[]      // 高亮匹配片段（可選）
  chunk?: {                  // 匹配的文檔塊信息（可選）
    id: string               // 塊識別碼
    position: { start: number; end: number } // 在原文檔中的位置
  }
}

/**
 * 搜索回應結果
 *
 * 包含完整的搜索結果和相關統計信息
 */
export interface SearchResponse {
  results: SearchResult[]  // 搜索結果陣列
  query: SearchQuery       // 原始查詢
  totalResults: number     // 總結果數量
  processingTime: number   // 處理時間（毫秒）
  suggestions?: string[]   // 搜索建議（可選）
}

/**
 * ===== 銷售賦能相關類型 =====
 */

/**
 * 銷售情境上下文
 *
 * 包含銷售場景中的所有相關信息：銷售代表、客戶、機會和產品
 * 用於AI助手提供個性化的銷售建議和內容生成
 */
export interface SalesContext {
  salesRep: {               // 銷售代表信息
    id: string              // 銷售代表ID
    name: string            // 姓名
    email: string           // 電子郵件
    department?: string     // 部門（可選）
  }
  customer: {               // 客戶信息
    id: string              // 客戶ID
    name: string            // 客戶姓名
    company: string         // 公司名稱
    industry?: string       // 行業（可選）
    size?: string           // 公司規模（可選）
    painPoints?: string[]   // 痛點列表（可選）
    requirements?: string[] // 需求列表（可選）
  }
  opportunity: {            // 銷售機會信息
    id?: string             // 機會ID（可選）
    stage: string           // 銷售階段
    value?: number          // 預期金額（可選）
    probability?: number    // 成交概率（可選）
    closeDate?: Date        // 預期成交日期（可選）
  }
  product: {                // 產品信息
    id: string              // 產品ID
    name: string            // 產品名稱
    category: string        // 產品分類
    features: string[]      // 功能特色列表
    benefits: string[]      // 效益列表
    pricing?: string        // 價格信息（可選）
  }
}

/**
 * 銷售互動記錄
 *
 * 記錄銷售過程中的各種互動活動和結果
 */
export interface SalesInteraction {
  id: string                                                           // 互動記錄ID
  timestamp: Date                                                      // 互動時間
  type: 'email' | 'call' | 'meeting' | 'demo' | 'proposal' | 'other' // 互動類型
  summary: string                                                      // 互動摘要
  outcome?: string                                                     // 互動結果（可選）
  nextSteps?: string[]                                                // 後續行動（可選）
  attachments?: string[]                                              // 附件列表（可選）
}

/**
 * ===== 提案生成相關類型 =====
 */

/**
 * 提案生成選項配置
 *
 * 定義AI生成銷售提案時的各種參數和偏好設定
 */
export interface ProposalGenerationOptions {
  template?: string                                                     // 使用的模板名稱（可選）
  tone: 'professional' | 'friendly' | 'technical' | 'consultative'    // 提案語調風格
  length: 'brief' | 'standard' | 'detailed' | 'comprehensive'         // 提案詳細程度
  includeROI: boolean                                                   // 是否包含投資回報分析
  includePricing: boolean                                               // 是否包含價格信息
  includeTimeline: boolean                                              // 是否包含時間規劃
  includeTestimonials: boolean                                          // 是否包含客戶推薦
  customSections?: {                                                    // 自定義章節（可選）
    title: string                                                       // 章節標題
    content: string                                                     // 章節內容
  }[]
}

/**
 * AI生成的銷售提案
 *
 * 包含完整的提案內容、結構化章節和生成元數據
 */
export interface GeneratedProposal {
  id: string                        // 提案唯一識別碼
  title: string                     // 提案標題
  content: string                   // 完整提案內容
  sections: ProposalSection[]       // 結構化章節陣列
  metadata: {                       // 提案元數據
    generatedAt: Date               // 生成時間
    customerId: string              // 客戶ID
    salesRepId: string              // 銷售代表ID
    templateUsed?: string           // 使用的模板（可選）
    options: ProposalGenerationOptions // 生成選項
  }
  estimatedValue?: number           // 預估金額（可選）
  timeline?: string                 // 實施時間規劃（可選）
}

/**
 * 提案章節結構
 *
 * 定義提案中單個章節的結構和內容
 */
export interface ProposalSection {
  id: string                                                                                              // 章節ID
  type: 'executive_summary' | 'problem_statement' | 'solution' | 'benefits' | 'pricing' | 'timeline' | 'next_steps' | 'custom' // 章節類型
  title: string                                                                                           // 章節標題
  content: string                                                                                         // 章節內容
  order: number                                                                                           // 章節順序
}

// AI 任務和處理狀態
export interface AITask {
  id: string
  type: 'embedding' | 'chat' | 'proposal' | 'analysis' | 'search'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  progress: number // 0-100
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  input: Record<string, any>
  output?: Record<string, any>
  error?: {
    message: string
    code: string
    details?: any
  }
}

// 使用量統計
export interface UsageStats {
  period: {
    start: Date
    end: Date
  }
  requests: {
    total: number
    successful: number
    failed: number
    byType: Record<string, number>
  }
  tokens: {
    total: number
    prompt: number
    completion: number
    embedding: number
  }
  costs: {
    total: number
    byService: Record<string, number>
  }
}

// 錯誤類型
export interface AIServiceError {
  code: string
  message: string
  service: string
  timestamp: Date
  context?: Record<string, any>
  retryable: boolean
}

// API 回應包裝器
export interface AIApiResponse<T = any> {
  success: boolean
  data?: T
  error?: AIServiceError
  metadata: {
    requestId: string
    timestamp: Date
    processingTime: number
    tokensUsed?: number
  }
}

// 配置驗證
export interface ConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiredFields: string[]
  optionalFields: string[]
}

// 快取相關
export interface CacheEntry<T = any> {
  key: string
  data: T
  createdAt: Date
  expiresAt: Date
  size: number
  hitCount: number
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  oldestEntry: Date
  newestEntry: Date
  topKeys: Array<{ key: string; hits: number }>
}