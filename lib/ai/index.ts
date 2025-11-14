/**
 * @fileoverview ================================================================
AI銷售賦能平台 - AI服務統一入口 (/lib/ai/index.ts)
================================================================
【檔案功能】
作為AI服務模組的統一對外接口，整合所有AI功能...
 * @module lib/ai/index
 *
 * 【檔案功能】
 * 作為AI服務模組的統一對外接口，整合所有AI功能並提供便捷的導入導出。
 * 包含向量嵌入、聊天對話、健康檢查等所有AI相關功能的統一訪問點。
 * 【主要職責】
 * • 統一API導出 - 將各子模組的功能統一對外提供
 * • 服務健康檢查 - 整合各AI服務的狀態監控
 * • 功能測試套件 - 提供完整的AI服務測試功能
 * • 類型定義導出 - 統一管理所有AI相關的TypeScript類型
 * • 便捷訪問接口 - 簡化外部模組對AI功能的使用
 * 【技術實現】
 * • 模組聚合模式 - 將分散的功能統一整合
 * • 健康檢查機制 - 多層次的服務狀態驗證
 * • 統一錯誤處理 - 一致的錯誤回應和異常管理
 * • 性能監控 - 服務回應時間和可用性追蹤
 * 【相關檔案】
 * • ./openai.ts - Azure OpenAI基礎設施和客戶端管理
 * • ./embeddings.ts - 文本向量嵌入服務
 * • ./enhanced-embeddings.ts - 增強版嵌入服務（含緩存）
 * • ./chat.ts - GPT聊天對話服務
 * • ./types.ts - AI服務相關類型定義
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

// 導入AI服務相關類型定義
import type {
  EmbeddingResult,
  ChatCompletionResult
} from '@/types/ai'

// 導入核心AI功能函數
import { generateEmbedding } from './embeddings'
import { generateChatCompletion } from './chat'
import { checkOpenAIStatus } from './openai'

/**
 * ===== Azure OpenAI 基礎設施服務 =====
 * 客戶端管理、錯誤處理、重試機制、速率限制等核心功能
 */
export {
  getOpenAIClient,      // Azure OpenAI客戶端獲取函數
  DEPLOYMENT_IDS,       // 部署ID常數配置
  checkOpenAIStatus,    // 服務健康狀態檢查
  AzureOpenAIError,     // 自定義錯誤類型
  withRetry,           // 通用重試機制
  RateLimitManager,    // 速率限制管理器類
  rateLimitManager,    // 全局速率限制管理器實例
  callAzureOpenAI,     // 統一API調用包裝器
} from './openai'

/**
 * ===== 文本向量嵌入服務 =====
 * 單個/批量嵌入生成、文檔處理、相似度計算等功能
 */
export {
  generateEmbedding,           // 單個文本嵌入生成
  generateBatchEmbeddings,     // 批量文本嵌入生成
  generateDocumentEmbeddings,  // 長文檔智能分塊嵌入
  splitTextIntoChunks,        // 文本智能分塊處理
  calculateCosineSimilarity,   // 餘弦相似度計算
  EMBEDDING_DIMENSION,         // 嵌入向量維度常數
  MAX_CHUNK_SIZE,             // 最大文本塊大小常數
  type EmbeddingResult,        // 單個嵌入結果類型
  type BatchEmbeddingResult,   // 批量嵌入結果類型
} from './embeddings'

/**
 * ===== GPT聊天對話服務 =====
 * 聊天完成、流式對話、銷售助手、提案生成等功能
 */
export {
  generateChatCompletion,         // 標準聊天完成
  generateStreamingChatCompletion, // 流式聊天完成
  SalesAssistantChat,            // 銷售助手聊天類
  createSalesAssistant,          // 創建銷售助手實例
  generateProposal,              // 銷售提案生成
  type ChatMessage,              // 聊天消息類型
  type ChatCompletionOptions,    // 聊天完成選項類型
  type ChatCompletionResult,     // 聊天完成結果類型
  type StreamingChatResult,      // 流式聊天結果類型
} from './chat'

/**
 * ===== AI服務綜合健康檢查 =====
 *
 * 檢查所有AI服務的運行狀態，包括基礎連接、嵌入服務和聊天服務。
 * 用於系統監控、健康儀表板和服務可用性驗證。
 *
 * @returns Promise - 包含各服務狀態的詳細報告
 * @returns openai - Azure OpenAI基礎服務是否可用
 * @returns embeddings - 文本嵌入服務是否正常
 * @returns chat - GPT聊天服務是否正常
 * @returns overall - 所有服務是否都正常運行
 *
 * @example
 * ```typescript
 * const health = await checkAIServicesHealth();
 * if (!health.overall) {
 *   console.error('AI服務異常:', health);
 * }
 * ```
 */
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
    // 第一層檢查：Azure OpenAI基礎服務連接
    results.openai = await checkOpenAIStatus()

    // 第二層檢查：文本嵌入服務功能
    if (results.openai) {
      try {
        await generateEmbedding('test')
        results.embeddings = true
      } catch {
        results.embeddings = false
      }
    }

    // 第三層檢查：GPT聊天服務功能
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

    // 計算整體健康狀態（所有服務都必須正常）
    results.overall = results.openai && results.embeddings && results.chat

  } catch (error) {
    console.error('Error checking AI services health:', error)
  }

  return results
}

/**
 * ===== AI服務完整功能測試 =====
 *
 * 執行完整的AI服務功能測試，包含實際的API調用和結果驗證。
 * 比健康檢查更深入，會進行真實的業務功能測試並返回詳細結果。
 *
 * @returns Promise - 包含各服務測試結果的詳細報告
 * @returns embedding.success - 嵌入服務測試是否成功
 * @returns embedding.result - 嵌入測試的實際結果（如果成功）
 * @returns embedding.error - 嵌入測試的錯誤信息（如果失敗）
 * @returns chat.success - 聊天服務測試是否成功
 * @returns chat.result - 聊天測試的實際結果（如果成功）
 * @returns chat.error - 聊天測試的錯誤信息（如果失敗）
 * @returns overall - 所有測試是否都成功
 *
 * @example
 * ```typescript
 * const testResults = await testAIServices();
 * if (testResults.overall) {
 *   console.log('所有AI服務測試通過');
 *   console.log('嵌入維度:', testResults.embedding.result?.embedding.length);
 *   console.log('聊天回應:', testResults.chat.result?.content);
 * } else {
 *   console.error('測試失敗:', testResults);
 * }
 * ```
 */
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
    embedding: { success: false, result: undefined as EmbeddingResult | undefined, error: undefined as string | undefined },
    chat: { success: false, result: undefined as ChatCompletionResult | undefined, error: undefined as string | undefined },
    overall: false,
  }

  // 測試1：文本嵌入服務功能
  try {
    console.log('🧪 Testing embedding service...')
    const embeddingResult = await generateEmbedding('This is a test document for AI embedding generation.')
    testResults.embedding.success = true
    testResults.embedding.result = embeddingResult
    console.log('✅ Embedding test passed - Vector dimension:', embeddingResult.embedding.length)
  } catch (error) {
    console.error('❌ Embedding test failed:', error)
    testResults.embedding.error = error instanceof Error ? error.message : 'Unknown embedding error'
  }

  // 測試2：GPT聊天服務功能
  try {
    console.log('🧪 Testing chat service...')
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
    console.log('✅ Chat test passed - Response:', chatResult.message)
  } catch (error) {
    console.error('❌ Chat test failed:', error)
    testResults.chat.error = error instanceof Error ? error.message : 'Unknown chat error'
  }

  // 計算整體測試結果
  testResults.overall = testResults.embedding.success && testResults.chat.success

  if (testResults.overall) {
    console.log('🎉 All AI services tests passed successfully!')
  } else {
    console.error('⚠️ Some AI services tests failed')
  }

  return testResults
}