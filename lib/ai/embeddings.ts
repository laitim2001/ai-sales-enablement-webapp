import { getOpenAIClient, DEPLOYMENT_IDS, callAzureOpenAI, AzureOpenAIError } from './openai'

// 嵌入配置
const MAX_CHUNK_SIZE = 8192 // Azure OpenAI text-embedding-ada-002 的最大token限制
const EMBEDDING_DIMENSION = 1536 // text-embedding-ada-002 的向量維度

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

/**
 * 生成單個文本的向量嵌入
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    throw new AzureOpenAIError('Text cannot be empty for embedding generation')
  }

  try {
    const result = await callAzureOpenAI(async () => {
      const client = getOpenAIClient()

      const response = await client.getEmbeddings({
        input: [text.trim()],
        model: DEPLOYMENT_IDS.EMBEDDINGS,
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from Azure OpenAI')
      }

      const embeddingData = response.data[0]

      return {
        embedding: embeddingData.embedding,
        text: text.trim(),
        tokenCount: response.usage?.totalTokens || 0,
      }
    })

    return result
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new AzureOpenAIError(
      'Failed to generate embedding',
      undefined,
      error
    )
  }
}

/**
 * 批量生成多個文本的向量嵌入
 */
export async function generateBatchEmbeddings(
  texts: string[],
  options: {
    batchSize?: number
    parallel?: boolean
  } = {}
): Promise<BatchEmbeddingResult> {
  const { batchSize = 10, parallel = false } = options
  const startTime = Date.now()

  if (texts.length === 0) {
    return {
      embeddings: [],
      totalTokens: 0,
      processingTime: 0,
    }
  }

  // 過濾空文本
  const validTexts = texts.filter(text => text && text.trim().length > 0)

  if (validTexts.length === 0) {
    throw new AzureOpenAIError('No valid texts provided for embedding generation')
  }

  try {
    const allResults: EmbeddingResult[] = []
    let totalTokens = 0

    // 分批處理
    const batches = []
    for (let i = 0; i < validTexts.length; i += batchSize) {
      batches.push(validTexts.slice(i, i + batchSize))
    }

    const processBatch = async (batch: string[]): Promise<EmbeddingResult[]> => {
      return callAzureOpenAI(async () => {
        const client = getOpenAIClient()

        const response = await client.getEmbeddings({
          input: batch,
          model: DEPLOYMENT_IDS.EMBEDDINGS,
        })

        if (!response.data) {
          throw new Error('No embedding data received from Azure OpenAI')
        }

        const batchResults = response.data.map((embeddingData, index) => ({
          embedding: embeddingData.embedding,
          text: batch[index].trim(),
          tokenCount: Math.ceil((response.usage?.totalTokens || 0) / batch.length),
        }))

        totalTokens += response.usage?.totalTokens || 0
        return batchResults
      })
    }

    if (parallel) {
      // 並行處理批次
      const batchPromises = batches.map(processBatch)
      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(results => allResults.push(...results))
    } else {
      // 串行處理批次（避免速率限制）
      for (const batch of batches) {
        const results = await processBatch(batch)
        allResults.push(...results)
      }
    }

    const processingTime = Date.now() - startTime

    return {
      embeddings: allResults,
      totalTokens,
      processingTime,
    }
  } catch (error) {
    console.error('Error generating batch embeddings:', error)
    throw new AzureOpenAIError(
      'Failed to generate batch embeddings',
      undefined,
      error
    )
  }
}

/**
 * 文本分塊處理（用於長文檔）
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = MAX_CHUNK_SIZE,
  overlapSize: number = 200
): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const cleanText = text.trim()
  const chunks: string[] = []

  // 如果文本小於塊大小，直接返回
  if (cleanText.length <= chunkSize) {
    return [cleanText]
  }

  let startIndex = 0

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize

    // 如果不是最後一塊，嘗試在句號、換行符或空格處分割
    if (endIndex < cleanText.length) {
      const searchEnd = Math.min(endIndex + 100, cleanText.length)

      // 尋找最佳分割點
      let bestSplitIndex = endIndex

      // 優先在句號後分割
      const periodIndex = cleanText.lastIndexOf('.', searchEnd)
      if (periodIndex > startIndex + chunkSize * 0.8) {
        bestSplitIndex = periodIndex + 1
      } else {
        // 次優在換行符後分割
        const newlineIndex = cleanText.lastIndexOf('\n', searchEnd)
        if (newlineIndex > startIndex + chunkSize * 0.8) {
          bestSplitIndex = newlineIndex + 1
        } else {
          // 最後在空格處分割
          const spaceIndex = cleanText.lastIndexOf(' ', searchEnd)
          if (spaceIndex > startIndex + chunkSize * 0.8) {
            bestSplitIndex = spaceIndex + 1
          }
        }
      }

      endIndex = bestSplitIndex
    }

    const chunk = cleanText.substring(startIndex, endIndex).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    // 設置下一個塊的起始位置（包含重疊）
    startIndex = Math.max(startIndex + 1, endIndex - overlapSize)
  }

  return chunks
}

/**
 * 處理長文檔的向量化
 */
export async function generateDocumentEmbeddings(
  text: string,
  options: {
    chunkSize?: number
    overlapSize?: number
    batchSize?: number
    includeMetadata?: boolean
  } = {}
): Promise<{
  embeddings: Array<EmbeddingResult & {
    chunkIndex: number
    startPosition?: number
    endPosition?: number
  }>
  totalChunks: number
  totalTokens: number
  processingTime: number
}> {
  const {
    chunkSize = MAX_CHUNK_SIZE,
    overlapSize = 200,
    batchSize = 10,
    includeMetadata = false,
  } = options

  const startTime = Date.now()

  // 分塊
  const chunks = splitTextIntoChunks(text, chunkSize, overlapSize)

  if (chunks.length === 0) {
    return {
      embeddings: [],
      totalChunks: 0,
      totalTokens: 0,
      processingTime: Date.now() - startTime,
    }
  }

  // 生成嵌入
  const batchResult = await generateBatchEmbeddings(chunks, { batchSize })

  // 添加元數據
  const embeddings = batchResult.embeddings.map((embedding, index) => {
    const result: EmbeddingResult & {
      chunkIndex: number
      startPosition?: number
      endPosition?: number
    } = {
      ...embedding,
      chunkIndex: index,
    }

    if (includeMetadata) {
      // 計算在原文中的位置（粗略估計）
      const chunkText = embedding.text
      const startPos = text.indexOf(chunkText)
      if (startPos !== -1) {
        result.startPosition = startPos
        result.endPosition = startPos + chunkText.length
      }
    }

    return result
  })

  return {
    embeddings,
    totalChunks: chunks.length,
    totalTokens: batchResult.totalTokens,
    processingTime: Date.now() - startTime,
  }
}

/**
 * 計算兩個向量的餘弦相似度
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimension')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    magnitudeA += vectorA[i] * vectorA[i]
    magnitudeB += vectorB[i] * vectorB[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

// 導出常量
export { EMBEDDING_DIMENSION, MAX_CHUNK_SIZE }