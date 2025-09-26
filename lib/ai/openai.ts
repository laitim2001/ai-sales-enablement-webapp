import { OpenAIClient, AzureKeyCredential } from '@azure/openai'

// Azure OpenAI 配置
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'

// 部署ID配置
const GPT4_DEPLOYMENT_ID = process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4'
const EMBEDDINGS_DEPLOYMENT_ID = process.env.AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS || 'text-embedding-ada-002'

if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
  throw new Error('Missing required Azure OpenAI environment variables')
}

// 創建 OpenAI 客戶端
let openaiClient: OpenAIClient | null = null

export function getOpenAIClient(): OpenAIClient {
  if (!openaiClient) {
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error('Missing required Azure OpenAI environment variables')
    }

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

// 導出部署ID供其他模組使用
export const DEPLOYMENT_IDS = {
  GPT4: GPT4_DEPLOYMENT_ID,
  EMBEDDINGS: EMBEDDINGS_DEPLOYMENT_ID,
} as const

// Azure OpenAI 服務狀態檢查
export async function checkOpenAIStatus(): Promise<boolean> {
  try {
    const client = getOpenAIClient()
    // 簡單的健康檢查 - 嘗試生成一個簡單的嵌入
    await client.getEmbeddings(EMBEDDINGS_DEPLOYMENT_ID, ['test'])
    return true
  } catch (error) {
    console.error('Azure OpenAI service check failed:', error)
    return false
  }
}

// 錯誤類型定義
export class AzureOpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AzureOpenAIError'
  }
}

// 通用的重試邏輯
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // 如果是最後一次嘗試，拋出錯誤
      if (attempt === maxRetries) {
        break
      }

      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw new AzureOpenAIError(
    `Operation failed after ${maxRetries} attempts`,
    undefined,
    lastError
  )
}

// 速率限制處理
export class RateLimitManager {
  private requestQueue: Array<() => void> = []
  private isProcessing = false
  private requestsPerMinute: number
  private requestTimes: number[] = []

  constructor(requestsPerMinute: number = 60) {
    this.requestsPerMinute = requestsPerMinute
  }

  async throttle<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await operation()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.requestQueue.length > 0) {
      // 清理超過一分鐘的請求記錄
      const now = Date.now()
      this.requestTimes = this.requestTimes.filter(time => now - time < 60000)

      // 檢查是否超過速率限制
      if (this.requestTimes.length >= this.requestsPerMinute) {
        const oldestRequest = Math.min(...this.requestTimes)
        const waitTime = 60000 - (now - oldestRequest)
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }

      // 執行下一個請求
      const nextRequest = this.requestQueue.shift()
      if (nextRequest) {
        this.requestTimes.push(now)
        await nextRequest()
      }
    }

    this.isProcessing = false
  }
}

// 全局速率限制管理器
export const rateLimitManager = new RateLimitManager(
  parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60')
)

// 通用的 API 調用包裝器
export async function callAzureOpenAI<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number
    rateLimited?: boolean
  } = {}
): Promise<T> {
  const { retries = 3, rateLimited = true } = options

  const wrappedOperation = () => withRetry(operation, retries)

  if (rateLimited) {
    return rateLimitManager.throttle(wrappedOperation)
  }

  return wrappedOperation()
}