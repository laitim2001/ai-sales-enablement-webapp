// AI 服務模組入口文件
// 提供統一的 AI 功能接口

// OpenAI 客戶端和基礎設施
export {
  getOpenAIClient,
  DEPLOYMENT_IDS,
  checkOpenAIStatus,
  AzureOpenAIError,
  withRetry,
  RateLimitManager,
  rateLimitManager,
  callAzureOpenAI,
} from './openai'

// 向量嵌入功能
export {
  generateEmbedding,
  generateBatchEmbeddings,
  generateDocumentEmbeddings,
  splitTextIntoChunks,
  calculateCosineSimilarity,
  EMBEDDING_DIMENSION,
  MAX_CHUNK_SIZE,
  type EmbeddingResult,
  type BatchEmbeddingResult,
} from './embeddings'

// 聊天和對話功能
export {
  generateChatCompletion,
  generateStreamingChatCompletion,
  SalesAssistantChat,
  createSalesAssistant,
  generateProposal,
  type ChatMessage,
  type ChatCompletionOptions,
  type ChatCompletionResult,
  type StreamingChatResult,
} from './chat'

// AI 服務狀態和健康檢查
export async function checkAIServicesHealth(): Promise<{
  openai: boolean
  embeddings: boolean
  chat: boolean
  overall: boolean
}> {
  const results = {
    openai: false,
    embeddings: false,
    chat: false,
    overall: false,
  }

  try {
    // 檢查 OpenAI 基礎服務
    results.openai = await checkOpenAIStatus()

    // 檢查嵌入服務
    if (results.openai) {
      try {
        await generateEmbedding('test')
        results.embeddings = true
      } catch {
        results.embeddings = false
      }
    }

    // 檢查聊天服務
    if (results.openai) {
      try {
        await generateChatCompletion([
          { role: 'user', content: 'test' }
        ], { maxTokens: 10 })
        results.chat = true
      } catch {
        results.chat = false
      }
    }

    // 整體狀態
    results.overall = results.openai && results.embeddings && results.chat

  } catch (error) {
    console.error('Error checking AI services health:', error)
  }

  return results
}

// 快速測試所有 AI 功能
export async function testAIServices(): Promise<{
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
}> {
  const testResults = {
    embedding: { success: false, result: undefined, error: undefined },
    chat: { success: false, result: undefined, error: undefined },
    overall: false,
  }

  // 測試嵌入功能
  try {
    const embeddingResult = await generateEmbedding('This is a test document for AI embedding generation.')
    testResults.embedding.success = true
    testResults.embedding.result = embeddingResult
  } catch (error) {
    testResults.embedding.error = error instanceof Error ? error.message : 'Unknown embedding error'
  }

  // 測試聊天功能
  try {
    const chatResult = await generateChatCompletion([
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Please respond briefly.'
      },
      {
        role: 'user',
        content: 'Please respond with exactly: "AI service test successful"'
      }
    ], { maxTokens: 50 })

    testResults.chat.success = true
    testResults.chat.result = chatResult
  } catch (error) {
    testResults.chat.error = error instanceof Error ? error.message : 'Unknown chat error'
  }

  testResults.overall = testResults.embedding.success && testResults.chat.success

  return testResults
}