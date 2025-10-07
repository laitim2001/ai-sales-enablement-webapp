/**
 * @fileoverview ================================================================AI銷售賦能平台 - Azure OpenAI客戶端服務 (/lib/ai/openai.ts)================================================================【檔案功能】提供Azure OpenAI服務的統一客戶端管理，包含連接初始化、部署配置、錯誤處理、重試機制和速率限制管理，為所有AI功能提供基礎設施支援。【主要職責】• Azure OpenAI客戶端初始化 - 單例模式確保連接復用• 環境配置管理 - 統一的配置參數和部署ID管理• 錯誤處理機制 - 自定義錯誤類型和異常管理• 重試邏輯 - 指數退避重試確保服務穩定性• 速率限制管理 - 防止API調用超限的智能排隊系統【技術實現】• Azure OpenAI SDK - 官方TypeScript SDK集成• 單例模式 - 客戶端實例復用降低開銷• 指數退避重試 - 智能重試避免服務過載• 速率限制隊列 - 自動排隊管理API調用頻率• 健康檢查 - 服務可用性監控和狀態驗證【相關檔案】• ./embeddings.ts - 向量嵌入服務（使用此客戶端）• ./chat.ts - 聊天對話服務（使用此客戶端）• ./enhanced-embeddings.ts - 增強版嵌入服務（使用此基礎設施）
 * @module lib/ai/openai
 * @description
 * ================================================================AI銷售賦能平台 - Azure OpenAI客戶端服務 (/lib/ai/openai.ts)================================================================【檔案功能】提供Azure OpenAI服務的統一客戶端管理，包含連接初始化、部署配置、錯誤處理、重試機制和速率限制管理，為所有AI功能提供基礎設施支援。【主要職責】• Azure OpenAI客戶端初始化 - 單例模式確保連接復用• 環境配置管理 - 統一的配置參數和部署ID管理• 錯誤處理機制 - 自定義錯誤類型和異常管理• 重試邏輯 - 指數退避重試確保服務穩定性• 速率限制管理 - 防止API調用超限的智能排隊系統【技術實現】• Azure OpenAI SDK - 官方TypeScript SDK集成• 單例模式 - 客戶端實例復用降低開銷• 指數退避重試 - 智能重試避免服務過載• 速率限制隊列 - 自動排隊管理API調用頻率• 健康檢查 - 服務可用性監控和狀態驗證【相關檔案】• ./embeddings.ts - 向量嵌入服務（使用此客戶端）• ./chat.ts - 聊天對話服務（使用此客戶端）• ./enhanced-embeddings.ts - 增強版嵌入服務（使用此基礎設施）
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { OpenAIClient, AzureKeyCredential } from '@azure/openai'

// Azure OpenAI 服務配置參數
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'

// Azure OpenAI 部署ID配置（對應不同模型的部署實例）
const GPT4_DEPLOYMENT_ID = process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4'
const EMBEDDINGS_DEPLOYMENT_ID = process.env.AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS || 'text-embedding-ada-002'

// 配置驗證：確保必要的環境變數已設定
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
  throw new Error('Missing required Azure OpenAI environment variables')
}

// Azure OpenAI 客戶端實例（單例模式）
let openaiClient: OpenAIClient | null = null

/**
 * 取得Azure OpenAI客戶端實例
 *
 * 使用單例模式確保整個應用程式共享同一個客戶端實例，
 * 避免重複初始化並提升性能。包含配置驗證和錯誤處理。
 *
 * @returns OpenAIClient - Azure OpenAI客戶端實例
 * @throws {Error} - 當環境變數配置不完整時拋出
 *
 * @example
 * ```typescript
 * const client = getOpenAIClient();
 * const response = await client.getEmbeddings(deploymentId, ['text']);
 * ```
 */
export function getOpenAIClient(): OpenAIClient {
  // 檢查是否已存在客戶端實例（單例模式）
  if (!openaiClient) {
    // 再次驗證環境變數（防禦性編程）
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error('Missing required Azure OpenAI environment variables')
    }

    // 初始化Azure OpenAI客戶端
    openaiClient = new OpenAIClient(
      AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(AZURE_OPENAI_API_KEY),
      {
        apiVersion: AZURE_OPENAI_API_VERSION,
      }
    )
  }
  return openaiClient
}

/**
 * Azure OpenAI 部署ID常數
 *
 * 統一管理不同AI模型的部署識別碼，確保整個系統使用一致的部署配置。
 * 使用 const assertion 確保類型安全和不可變性。
 */
export const DEPLOYMENT_IDS = {
  GPT4: GPT4_DEPLOYMENT_ID,           // GPT-4聊天模型部署ID
  EMBEDDINGS: EMBEDDINGS_DEPLOYMENT_ID, // 文本嵌入模型部署ID
} as const

/**
 * Azure OpenAI 服務健康狀態檢查
 *
 * 通過執行簡單的API調用來驗證Azure OpenAI服務是否正常運行。
 * 用於系統初始化時的服務可用性確認和監控檢查。
 *
 * @returns Promise<boolean> - true表示服務正常，false表示服務異常
 *
 * @example
 * ```typescript
 * const isHealthy = await checkOpenAIStatus();
 * if (!isHealthy) {
 *   console.error('Azure OpenAI服務不可用');
 * }
 * ```
 */
export async function checkOpenAIStatus(): Promise<boolean> {
  try {
    const client = getOpenAIClient()
    // 執行輕量級的健康檢查 - 生成測試用嵌入
    await client.getEmbeddings(EMBEDDINGS_DEPLOYMENT_ID, ['test'])
    return true
  } catch (error) {
    console.error('Azure OpenAI service check failed:', error)
    return false
  }
}

/**
 * Azure OpenAI 自定義錯誤類
 *
 * 提供統一的錯誤處理機制，包含HTTP狀態碼和原始錯誤信息。
 * 便於錯誤追蹤、日誌記錄和用戶友好的錯誤提示。
 */
export class AzureOpenAIError extends Error {
  /**
   * 創建Azure OpenAI錯誤實例
   *
   * @param message - 錯誤描述信息
   * @param statusCode - HTTP狀態碼（可選）
   * @param originalError - 原始錯誤對象（可選）
   */
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AzureOpenAIError'
  }
}

/**
 * 通用重試機制
 *
 * 實現指數退避重試策略，用於處理臨時性網絡錯誤、服務暫時不可用等情況。
 * 每次重試的等待時間會線性增加，避免對服務造成過大壓力。
 *
 * @param operation - 要執行的異步操作函數
 * @param maxRetries - 最大重試次數，默認3次
 * @param delayMs - 基礎延遲時間（毫秒），默認1000ms
 * @returns Promise<T> - 操作成功的結果
 * @throws {AzureOpenAIError} - 所有重試失敗後拋出綜合錯誤
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => client.getEmbeddings('deployment', ['text']),
 *   3,     // 最多重試3次
 *   1000   // 基礎延遲1秒
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown

  // 執行主操作和重試循環
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // 如果是最後一次嘗試，跳出循環拋出錯誤
      if (attempt === maxRetries) {
        break
      }

      // 計算延遲時間（線性增加：1秒、2秒、3秒...）
      const waitTime = delayMs * attempt
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`)

      // 等待指定時間後進行下一次重試
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // 所有重試失敗，拋出包裝錯誤
  throw new AzureOpenAIError(
    `Operation failed after ${maxRetries} attempts`,
    undefined,
    lastError
  )
}

/**
 * API速率限制管理器
 *
 * 實現智能的API調用速率控制，防止超過Azure OpenAI的調用頻率限制。
 * 使用隊列機制自動排程請求，確保服務穩定性和可用性。
 */
export class RateLimitManager {
  private requestQueue: Array<() => void> = []   // 請求隊列
  private isProcessing = false                    // 是否正在處理隊列
  private requestsPerMinute: number              // 每分鐘最大請求數
  private requestTimes: number[] = []            // 請求時間戳記錄

  /**
   * 初始化速率限制管理器
   *
   * @param requestsPerMinute - 每分鐘允許的最大請求數，默認60
   */
  constructor(requestsPerMinute: number = 60) {
    this.requestsPerMinute = requestsPerMinute
  }

  /**
   * 對API操作進行速率限制控制
   *
   * 將操作加入隊列，自動根據速率限制進行排程執行。
   * 確保不會超過配置的每分鐘請求數限制。
   *
   * @param operation - 要執行的異步操作
   * @returns Promise<T> - 操作的執行結果
   *
   * @example
   * ```typescript
   * const manager = new RateLimitManager(60);
   * const result = await manager.throttle(async () => {
   *   return client.getEmbeddings(deploymentId, ['text']);
   * });
   * ```
   */
  async throttle<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 將操作包裝後加入隊列
      this.requestQueue.push(async () => {
        try {
          const result = await operation()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      // 啟動隊列處理
      this.processQueue()
    })
  }

  /**
   * 處理請求隊列（私有方法）
   *
   * 按照速率限制順序執行隊列中的請求，包含以下邏輯：
   * 1. 清理過期的請求記錄（超過1分鐘）
   * 2. 檢查當前是否超過速率限制
   * 3. 如果超過限制，等待至允許時間
   * 4. 執行下一個請求並記錄時間戳
   */
  private async processQueue() {
    // 防止重複處理或空隊列處理
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    this.isProcessing = true

    // 持續處理隊列直到為空
    while (this.requestQueue.length > 0) {
      const now = Date.now()

      // 清理超過一分鐘的請求記錄（滑動窗口）
      this.requestTimes = this.requestTimes.filter(time => now - time < 60000)

      // 檢查是否超過每分鐘的請求限制
      if (this.requestTimes.length >= this.requestsPerMinute) {
        // 計算需要等待的時間
        const oldestRequest = Math.min(...this.requestTimes)
        const waitTime = 60000 - (now - oldestRequest)

        if (waitTime > 0) {
          console.log(`Rate limit reached, waiting ${waitTime}ms before next request`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue // 重新檢查限制
        }
      }

      // 執行隊列中的下一個請求
      const nextRequest = this.requestQueue.shift()
      if (nextRequest) {
        this.requestTimes.push(now)  // 記錄請求時間
        await nextRequest()           // 執行請求
      }
    }

    this.isProcessing = false
  }
}

/**
 * 全局速率限制管理器實例
 *
 * 整個應用程式共享的速率限制管理器，從環境變數讀取配置。
 * 默認每分鐘60個請求，可通過OPENAI_RATE_LIMIT_RPM環境變數調整。
 */
export const rateLimitManager = new RateLimitManager(
  parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60')
)

/**
 * Azure OpenAI API 統一調用包裝器
 *
 * 整合了重試機制和速率限制管理的高級API調用包裝器。
 * 提供一致的錯誤處理和性能優化，適用於所有Azure OpenAI API調用。
 *
 * @param operation - 要執行的Azure OpenAI API操作
 * @param options - 調用選項配置
 * @param options.retries - 重試次數，默認3次
 * @param options.rateLimited - 是否啟用速率限制，默認true
 * @returns Promise<T> - API調用的結果
 *
 * @example
 * ```typescript
 * // 基本用法（含重試和速率限制）
 * const result = await callAzureOpenAI(async () => {
 *   const client = getOpenAIClient();
 *   return client.getEmbeddings(deploymentId, ['text']);
 * });
 *
 * // 自定義選項
 * const result = await callAzureOpenAI(
 *   async () => client.getChatCompletions(deploymentId, messages),
 *   { retries: 5, rateLimited: false }
 * );
 * ```
 */
export async function callAzureOpenAI<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number      // 重試次數
    rateLimited?: boolean // 是否啟用速率限制
  } = {}
): Promise<T> {
  const { retries = 3, rateLimited = true } = options

  // 將操作包裝在重試邏輯中
  const wrappedOperation = () => withRetry(operation, retries)

  // 根據配置決定是否使用速率限制
  if (rateLimited) {
    // 使用全局速率限制管理器控制調用頻率
    return rateLimitManager.throttle(wrappedOperation)
  }

  // 直接執行（僅含重試機制）
  return wrappedOperation()
}