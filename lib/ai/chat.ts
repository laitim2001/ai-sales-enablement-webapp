import { getOpenAIClient, DEPLOYMENT_IDS, callAzureOpenAI, AzureOpenAIError } from './openai'

// 對話配置
const DEFAULT_MAX_TOKENS = 4000
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_TOP_P = 0.95

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

/**
 * 生成聊天回應
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    topP = DEFAULT_TOP_P,
    frequencyPenalty = 0,
    presencePenalty = 0,
    stop = [],
  } = options

  if (!messages || messages.length === 0) {
    throw new AzureOpenAIError('Messages array cannot be empty')
  }

  try {
    const result = await callAzureOpenAI(async () => {
      const client = getOpenAIClient()

      const response = await client.getChatCompletions(
        DEPLOYMENT_IDS.GPT4,
        messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
        })),
        {
          maxTokens,
          temperature,
          topP,
          frequencyPenalty,
          presencePenalty,
          stop: stop.length > 0 ? stop : undefined,
        }
      )

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response received from Azure OpenAI')
      }

      const choice = response.choices[0]
      const message = choice.message

      if (!message) {
        throw new Error('No message in response')
      }

      return {
        message: message.content || '',
        role: 'assistant' as const,
        finishReason: choice.finishReason,
        usage: {
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
        },
        model: DEPLOYMENT_IDS.GPT4,
      }
    })

    return result
  } catch (error) {
    console.error('Error generating chat completion:', error)
    throw new AzureOpenAIError(
      'Failed to generate chat completion',
      undefined,
      error
    )
  }
}

/**
 * 流式聊天回應
 */
export async function generateStreamingChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<StreamingChatResult> {
  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    topP = DEFAULT_TOP_P,
    frequencyPenalty = 0,
    presencePenalty = 0,
    stop = [],
  } = options

  if (!messages || messages.length === 0) {
    throw new AzureOpenAIError('Messages array cannot be empty')
  }

  try {
    let totalPromptTokens = 0
    let totalCompletionTokens = 0

    const streamResult = await callAzureOpenAI(async () => {
      const client = getOpenAIClient()

      return client.streamChatCompletions(
        DEPLOYMENT_IDS.GPT4,
        messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
        })),
        {
          maxTokens,
          temperature,
          topP,
          frequencyPenalty,
          presencePenalty,
          stop: stop.length > 0 ? stop : undefined,
        }
      )
    })

    const stream = (async function* () {
      for await (const chunk of streamResult) {
        if (chunk.choices && chunk.choices.length > 0) {
          const choice = chunk.choices[0]

          if (choice.delta?.content) {
            yield {
              content: choice.delta.content,
              finishReason: choice.finishReason,
            }
          }

          if (choice.finishReason) {
            yield {
              content: undefined,
              finishReason: choice.finishReason,
            }
          }
        }

        // 累積使用量統計
        if (chunk.usage) {
          totalPromptTokens = chunk.usage.promptTokens || 0
          totalCompletionTokens = chunk.usage.completionTokens || 0
        }
      }
    })()

    const usagePromise = (async () => {
      // 等待流完成後返回使用量
      for await (const _ of stream) {
        // 消耗流
      }
      return {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      }
    })()

    return {
      stream,
      usage: usagePromise,
    }
  } catch (error) {
    console.error('Error generating streaming chat completion:', error)
    throw new AzureOpenAIError(
      'Failed to generate streaming chat completion',
      undefined,
      error
    )
  }
}

/**
 * 銷售場景專用的對話模板
 */
export class SalesAssistantChat {
  private systemMessage: ChatMessage
  private conversationHistory: ChatMessage[] = []

  constructor(
    context: {
      salesRep?: string
      company?: string
      product?: string
      customer?: string
    } = {}
  ) {
    this.systemMessage = {
      role: 'system',
      content: this.generateSystemPrompt(context),
    }
  }

  private generateSystemPrompt(context: {
    salesRep?: string
    company?: string
    product?: string
    customer?: string
  }): string {
    const { salesRep, company, product, customer } = context

    return `你是一個專業的AI銷售助手，專門幫助銷售團隊提升業績和客戶關係。

你的角色和責任：
- 提供專業的銷售建議和策略
- 分析客戶需求和痛點
- 幫助準備銷售演示和提案
- 回答產品和服務相關問題
- 協助處理客戶異議

當前上下文：
${salesRep ? `- 銷售代表：${salesRep}` : ''}
${company ? `- 公司：${company}` : ''}
${product ? `- 產品/服務：${product}` : ''}
${customer ? `- 客戶：${customer}` : ''}

請保持專業、友好、且以結果為導向的溝通風格。
提供具體、可操作的建議。
如果不確定答案，請誠實說明並建議如何獲取更多資訊。`
  }

  /**
   * 發送消息並獲取回應
   */
  async sendMessage(
    userMessage: string,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
    }

    this.conversationHistory.push(userChatMessage)

    const messages = [
      this.systemMessage,
      ...this.conversationHistory,
    ]

    const response = await generateChatCompletion(messages, options)

    // 添加助手回應到歷史記錄
    this.conversationHistory.push({
      role: 'assistant',
      content: response.message,
    })

    return response
  }

  /**
   * 流式發送消息
   */
  async sendStreamingMessage(
    userMessage: string,
    options: ChatCompletionOptions = {}
  ): Promise<StreamingChatResult> {
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
    }

    this.conversationHistory.push(userChatMessage)

    const messages = [
      this.systemMessage,
      ...this.conversationHistory,
    ]

    const result = await generateStreamingChatCompletion(messages, options)

    // 包裝流以更新歷史記錄
    const originalStream = result.stream
    let assistantMessage = ''

    const wrappedStream = (async function* () {
      for await (const chunk of originalStream) {
        if (chunk.content) {
          assistantMessage += chunk.content
        }
        yield chunk
      }
    })()

    // 包裝使用量Promise以更新歷史記錄
    const wrappedUsage = result.usage.then(usage => {
      // 添加完整的助手回應到歷史記錄
      if (assistantMessage) {
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage,
        })
      }
      return usage
    })

    return {
      stream: wrappedStream,
      usage: wrappedUsage,
    }
  }

  /**
   * 獲取對話歷史
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  /**
   * 清除對話歷史
   */
  clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * 更新系統上下文
   */
  updateContext(context: {
    salesRep?: string
    company?: string
    product?: string
    customer?: string
  }): void {
    this.systemMessage = {
      role: 'system',
      content: this.generateSystemPrompt(context),
    }
  }
}

/**
 * 快速創建銷售助手實例
 */
export function createSalesAssistant(context?: {
  salesRep?: string
  company?: string
  product?: string
  customer?: string
}): SalesAssistantChat {
  return new SalesAssistantChat(context)
}

/**
 * 提案生成專用函數
 */
export async function generateProposal(
  customerInfo: {
    name: string
    industry?: string
    size?: string
    painPoints?: string[]
    requirements?: string[]
  },
  productInfo: {
    name: string
    features: string[]
    benefits: string[]
    pricing?: string
  },
  options: {
    tone?: 'professional' | 'friendly' | 'technical'
    length?: 'brief' | 'detailed' | 'comprehensive'
    includeROI?: boolean
    templateStyle?: string
  } = {}
): Promise<ChatCompletionResult> {
  const { tone = 'professional', length = 'detailed', includeROI = true } = options

  const systemPrompt = `你是一個專業的銷售提案撰寫專家。請根據客戶資訊和產品資訊生成一份${length === 'brief' ? '簡潔' : length === 'detailed' ? '詳細' : '全面'}的銷售提案。

語調風格：${tone === 'professional' ? '專業正式' : tone === 'friendly' ? '友善親和' : '技術性詳細'}

提案應包含：
1. 客戶痛點分析
2. 解決方案說明
3. 產品特性和優勢
4. 實施計劃概述
${includeROI ? '5. 投資回報率分析' : ''}
6. 下一步行動建議

請確保提案個人化、具體且有說服力。`

  const userPrompt = `客戶資訊：
- 客戶名稱：${customerInfo.name}
${customerInfo.industry ? `- 行業：${customerInfo.industry}` : ''}
${customerInfo.size ? `- 公司規模：${customerInfo.size}` : ''}
${customerInfo.painPoints ? `- 痛點：${customerInfo.painPoints.join(', ')}` : ''}
${customerInfo.requirements ? `- 需求：${customerInfo.requirements.join(', ')}` : ''}

產品資訊：
- 產品名稱：${productInfo.name}
- 主要功能：${productInfo.features.join(', ')}
- 核心優勢：${productInfo.benefits.join(', ')}
${productInfo.pricing ? `- 價格資訊：${productInfo.pricing}` : ''}

請生成一份完整的銷售提案。`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  return generateChatCompletion(messages, {
    maxTokens: length === 'brief' ? 2000 : length === 'detailed' ? 4000 : 6000,
    temperature: 0.3, // 較低的創造性，保持專業
  })
}