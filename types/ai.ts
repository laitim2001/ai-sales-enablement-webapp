// AI 服務相關的類型定義文件
// 提供所有 AI 功能的 TypeScript 類型支持

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