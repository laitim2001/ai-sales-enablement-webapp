// AI 服務相關的類型定義

// 基礎 AI 服務配置
export interface AIServiceConfig {
  endpoint: string
  apiKey: string
  apiVersion: string
  deploymentIds: {
    gpt4: string
    embeddings: string
  }
  rateLimits: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

// 服務健康狀態
export interface AIServiceHealth {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: Date
  responseTime?: number
  errorMessage?: string
}

// 文檔處理相關類型
export interface DocumentProcessingOptions {
  chunkSize: number
  overlapSize: number
  preserveFormatting: boolean
  extractMetadata: boolean
  supportedFormats: string[]
}

export interface ProcessedDocument {
  id: string
  title: string
  content: string
  chunks: DocumentChunk[]
  metadata: DocumentMetadata
  processingTime: number
  tokenCount: number
}

export interface DocumentChunk {
  id: string
  content: string
  embedding?: number[]
  position: {
    start: number
    end: number
  }
  metadata?: Record<string, any>
}

export interface DocumentMetadata {
  fileName: string
  fileSize: number
  mimeType: string
  language?: string
  author?: string
  createdAt: Date
  lastModified?: Date
  tags?: string[]
  category?: string
}

// 搜索相關類型
export interface SearchQuery {
  text: string
  filters?: {
    categories?: string[]
    tags?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
    author?: string
    language?: string
  }
  options?: {
    maxResults: number
    minSimilarity: number
    includeMetadata: boolean
    highlightMatches: boolean
  }
}

export interface SearchResult {
  id: string
  title: string
  content: string
  similarity: number
  metadata: DocumentMetadata
  highlights?: string[]
  chunk?: {
    id: string
    position: { start: number; end: number }
  }
}

export interface SearchResponse {
  results: SearchResult[]
  query: SearchQuery
  totalResults: number
  processingTime: number
  suggestions?: string[]
}

// 銷售助手相關類型
export interface SalesContext {
  salesRep: {
    id: string
    name: string
    email: string
    department?: string
  }
  customer: {
    id: string
    name: string
    company: string
    industry?: string
    size?: string
    painPoints?: string[]
    requirements?: string[]
  }
  opportunity: {
    id?: string
    stage: string
    value?: number
    probability?: number
    closeDate?: Date
  }
  product: {
    id: string
    name: string
    category: string
    features: string[]
    benefits: string[]
    pricing?: string
  }
}

export interface SalesInteraction {
  id: string
  timestamp: Date
  type: 'email' | 'call' | 'meeting' | 'demo' | 'proposal' | 'other'
  summary: string
  outcome?: string
  nextSteps?: string[]
  attachments?: string[]
}

// 提案生成相關類型
export interface ProposalGenerationOptions {
  template?: string
  tone: 'professional' | 'friendly' | 'technical' | 'consultative'
  length: 'brief' | 'standard' | 'detailed' | 'comprehensive'
  includeROI: boolean
  includePricing: boolean
  includeTimeline: boolean
  includeTestimonials: boolean
  customSections?: {
    title: string
    content: string
  }[]
}

export interface GeneratedProposal {
  id: string
  title: string
  content: string
  sections: ProposalSection[]
  metadata: {
    generatedAt: Date
    customerId: string
    salesRepId: string
    templateUsed?: string
    options: ProposalGenerationOptions
  }
  estimatedValue?: number
  timeline?: string
}

export interface ProposalSection {
  id: string
  type: 'executive_summary' | 'problem_statement' | 'solution' | 'benefits' | 'pricing' | 'timeline' | 'next_steps' | 'custom'
  title: string
  content: string
  order: number
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