/**
 * ================================================================
 * AI銷售賦能平台 - AI服務類型定義 (/types/ai.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 定義AI銷售賦能平台中所有AI相關服務的TypeScript類型定義，包括Azure OpenAI、
 * 向量嵌入、智能搜索、提案生成等核心AI功能的完整類型系統，確保類型安全和開發效率。
 *
 * 【主要職責】
 * • Azure OpenAI類型 - 定義Azure OpenAI服務的配置和響應類型
 * • 向量嵌入類型 - 定義文本向量化和嵌入服務的類型
 * • 搜索服務類型 - 定義智能搜索和查詢處理的類型
 * • 提案生成類型 - 定義AI驅動的銷售提案生成類型
 * • 性能監控類型 - 定義AI服務性能指標的類型
 * • 錯誤處理類型 - 定義AI服務錯誤和異常的類型
 * • 配置管理類型 - 定義AI服務配置和設置的類型
 * • 業務模型類型 - 定義銷售賦能相關的業務實體類型
 *
 * 【類型分類】
 * • 基礎配置類型 - Azure OpenAI連接配置、API密鑰管理
 * • 數據處理類型 - 文本處理、向量生成、批量操作
 * • 搜索引擎類型 - 查詢處理、結果排序、相似度計算
 * • 業務邏輯類型 - 客戶分析、產品推薦、銷售洞察
 * • 性能指標類型 - 響應時間、Token使用量、成功率
 * • 錯誤管理類型 - 異常分類、錯誤恢復、重試策略
 * • 緩存系統類型 - 緩存策略、失效機制、性能優化
 * • 監控告警類型 - 健康檢查、閾值設定、警報通知
 *
 * 【技術特性】
 * • 嚴格類型檢查 - 使用TypeScript strict模式確保類型安全
 * • 泛型支持 - 提供靈活的泛型類型定義
 * • 介面繼承 - 合理的類型繼承和組合設計
 * • 聯合類型 - 使用聯合類型處理多種可能性
 * • 字面量類型 - 精確的字面量類型定義
 * • 可選屬性 - 合理的必填和可選屬性設計
 * • 索引簽名 - 靈活的動態屬性支持
 * • 條件類型 - 高級條件類型邏輯
 *
 * 【業務模型覆蓋】
 * • 客戶管理 - 客戶資料、偏好分析、行為預測
 * • 產品推薦 - 產品匹配、個性化推薦、交叉銷售
 * • 銷售分析 - 銷售數據、趨勢分析、預測建模
 * • 知識管理 - 文檔分類、內容搜索、知識圖譜
 * • 對話系統 - 聊天機器人、智能客服、對話流程
 * • 決策支持 - 數據洞察、風險評估、策略建議
 * • 自動化流程 - 工作流程、任務自動化、智能調度
 * • 報告生成 - 數據分析、報告模板、可視化圖表
 *
 * 【相關檔案】
 * • /lib/ai/types.ts - AI服務內部類型定義
 * • /lib/ai/openai.ts - Azure OpenAI客戶端實現
 * • /lib/ai/embeddings.ts - 向量嵌入服務實現
 * • /lib/search/ - 搜索服務實現
 * • /api/ai/ - AI API端點實現
 * • /components/ai/ - AI相關UI組件
 *
 * 【開發指南】
 * • 類型命名 - 使用清晰的命名規範，如XxxConfig、XxxResult、XxxError
 * • 文檔註釋 - 每個類型都應有詳細的JSDoc註釋
 * • 向後兼容 - 類型變更應考慮向後兼容性
 * • 性能考量 - 避免過於複雜的類型計算
 * • 測試覆蓋 - 確保類型定義有對應的測試用例
 */

// Azure OpenAI 基礎類型
export interface AzureOpenAIConfig {
  endpoint: string
  apiKey: string
  apiVersion: string
  deploymentIds: {
    gpt4: string
    embeddings: string
  }
}

// 向量嵌入相關類型
export interface EmbeddingResult {
  embedding: number[]
  text: string
  tokenCount: number
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[]
  totalTokens: number
  processingTime: number
}

export interface DocumentEmbeddingResult {
  embeddings: Array<EmbeddingResult & {
    chunkIndex: number
    startPosition?: number
    endPosition?: number
  }>
  totalChunks: number
  totalTokens: number
  processingTime: number
}

// 聊天對話相關類型
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface ChatCompletionOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  stream?: boolean
}

export interface ChatCompletionResult {
  message: string
  role: 'assistant'
  finishReason: string | null
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

export interface StreamingChatResult {
  stream: AsyncIterable<{
    content?: string
    finishReason?: string | null
  }>
  usage: Promise<{
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }>
}

// 銷售助手相關類型
export interface SalesContext {
  salesRep?: string
  company?: string
  product?: string
  customer?: string
}

export interface CustomerInfo {
  name: string
  industry?: string
  size?: string
  painPoints?: string[]
  requirements?: string[]
}

export interface ProductInfo {
  name: string
  features: string[]
  benefits: string[]
  pricing?: string
}

export interface ProposalOptions {
  tone?: 'professional' | 'friendly' | 'technical'
  length?: 'brief' | 'detailed' | 'comprehensive'
  includeROI?: boolean
  templateStyle?: string
}

// AI 服務健康檢查類型
export interface AIServicesHealth {
  openai: boolean
  embeddings: boolean
  chat: boolean
  overall: boolean
}

export interface AIServiceTestResult {
  embedding: {
    success: boolean
    result?: EmbeddingResult
    error?: string
  }
  chat: {
    success: boolean
    result?: ChatCompletionResult
    error?: string
  }
  overall: boolean
}

// 錯誤處理類型
export interface AzureOpenAIErrorDetails {
  message: string
  statusCode?: number
  originalError?: unknown
  retryAfter?: number
}

// 文檔處理相關類型
export interface DocumentChunk {
  text: string
  chunkIndex: number
  startPosition?: number
  endPosition?: number
  embedding?: number[]
}

export interface DocumentProcessingOptions {
  chunkSize?: number
  overlapSize?: number
  batchSize?: number
  includeMetadata?: boolean
  generateEmbeddings?: boolean
}

export interface DocumentProcessingResult {
  chunks: DocumentChunk[]
  embeddings?: EmbeddingResult[]
  totalTokens: number
  processingTime: number
  metadata: {
    originalLength: number
    chunkCount: number
    averageChunkSize: number
  }
}

/**
 * 搜索和相似度類型
 * 用於語意搜索和相似度比較功能
 */

/**
 * 相似度搜索結果
 *
 * 包含搜索命中的文檔和相似度分數。
 */
export interface SimilaritySearchResult {
  document: {
    id: string
    title: string
    content: string
    chunk?: string
  }
  similarity: number
  score: number
  metadata?: Record<string, any>
}

export interface SearchOptions {
  maxResults?: number
  minSimilarity?: number
  searchType?: 'semantic' | 'text' | 'hybrid'
  filters?: Record<string, any>
}

// 批量處理類型
export interface BatchProcessingOptions {
  batchSize?: number
  maxConcurrency?: number
  retryAttempts?: number
  progressCallback?: (progress: BatchProgress) => void
}

export interface BatchProgress {
  processed: number
  total: number
  errors: number
  currentBatch: number
  estimatedTimeRemaining?: number
}

export interface BatchProcessingResult<T> {
  results: T[]
  errors: Array<{
    index: number
    error: string
    input: any
  }>
  summary: {
    total: number
    successful: number
    failed: number
    totalTokens: number
    processingTime: number
  }
}

// 速率限制相關類型
export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerMinute?: number
  burstLimit?: number
}

export interface RateLimitStatus {
  remaining: number
  resetTime: Date
  retryAfter?: number
}

// 配置和初始化類型
export interface AIServiceConfig {
  azure: AzureOpenAIConfig
  rateLimit: RateLimitConfig
  defaults: {
    temperature: number
    maxTokens: number
    embeddingModel: string
    chatModel: string
  }
  features: {
    enableStreaming: boolean
    enableBatching: boolean
    enableCaching: boolean
  }
}

// 導出所有類型
export type {
  // 重新導出以確保兼容性
  EmbeddingResult as AIEmbeddingResult,
  ChatCompletionResult as AIChatResult,
  DocumentProcessingResult as AIDocumentResult,
  SimilaritySearchResult as AISearchResult,
}