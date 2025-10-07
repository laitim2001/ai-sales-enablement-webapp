/**
 * @fileoverview ================================================================AI銷售賦能平台 - 向量嵌入服務 (/lib/ai/embeddings.ts)================================================================【檔案功能】提供基於Azure OpenAI的文本向量嵌入服務，包含單個文本嵌入、批量嵌入、長文檔分塊處理、相似度計算等核心功能，為語意搜索和文檔檢索提供支援。【主要職責】• 單個文本向量嵌入生成 - 將文本轉換為1536維度的向量表示• 批量文本嵌入處理 - 支持批量處理以提高效率• 長文檔智能分塊 - 將超長文檔分割為適當大小的塊進行處理• 相似度計算 - 提供餘弦相似度計算功能• 錯誤處理與重試 - 完整的錯誤恢復機制【技術實現】• Azure OpenAI text-embedding-ada-002模型 - 業界標準嵌入模型• 智能文本分塊算法 - 按句號、換行符、空格優先級分割• 批量處理優化 - 支持並行和串行兩種處理模式• Token使用追蹤 - 精確的成本計算和使用統計【相關檔案】• ./openai.ts - Azure OpenAI客戶端和基礎設施• ./enhanced-embeddings.ts - 增強版嵌入服務（含緩存和優化）• ./types.ts - AI服務相關類型定義
 * @module lib/ai/embeddings
 * @description
 * ================================================================AI銷售賦能平台 - 向量嵌入服務 (/lib/ai/embeddings.ts)================================================================【檔案功能】提供基於Azure OpenAI的文本向量嵌入服務，包含單個文本嵌入、批量嵌入、長文檔分塊處理、相似度計算等核心功能，為語意搜索和文檔檢索提供支援。【主要職責】• 單個文本向量嵌入生成 - 將文本轉換為1536維度的向量表示• 批量文本嵌入處理 - 支持批量處理以提高效率• 長文檔智能分塊 - 將超長文檔分割為適當大小的塊進行處理• 相似度計算 - 提供餘弦相似度計算功能• 錯誤處理與重試 - 完整的錯誤恢復機制【技術實現】• Azure OpenAI text-embedding-ada-002模型 - 業界標準嵌入模型• 智能文本分塊算法 - 按句號、換行符、空格優先級分割• 批量處理優化 - 支持並行和串行兩種處理模式• Token使用追蹤 - 精確的成本計算和使用統計【相關檔案】• ./openai.ts - Azure OpenAI客戶端和基礎設施• ./enhanced-embeddings.ts - 增強版嵌入服務（含緩存和優化）• ./types.ts - AI服務相關類型定義
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { getOpenAIClient, DEPLOYMENT_IDS, callAzureOpenAI, AzureOpenAIError } from './openai'

// 嵌入配置常數
const MAX_CHUNK_SIZE = 8192 // Azure OpenAI text-embedding-ada-002 的最大token限制
const EMBEDDING_DIMENSION = 1536 // text-embedding-ada-002 的向量維度

/**
 * 單個文本嵌入結果接口
 *
 * 包含向量嵌入、原始文本和Token使用量信息
 */
export interface EmbeddingResult {
  embedding: number[]  // 1536維度的向量表示
  text: string        // 原始輸入文本
  tokenCount: number  // 處理該文本消耗的Token數量
}

/**
 * 批量嵌入處理結果接口
 *
 * 包含所有嵌入結果、總Token使用量和處理時間統計
 */
export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[]  // 所有嵌入結果的陣列
  totalTokens: number           // 總共消耗的Token數量
  processingTime: number        // 總處理時間（毫秒）
}

/**
 * 生成單個文本的向量嵌入
 *
 * 將輸入文本轉換為1536維度的向量表示，使用Azure OpenAI的text-embedding-ada-002模型。
 * 此函數包含完整的錯誤處理和重試機制。
 *
 * @param text - 要轉換為向量的文本內容
 * @returns Promise<EmbeddingResult> - 包含向量、原文和Token使用量的結果
 * @throws {AzureOpenAIError} - 當文本為空或API調用失敗時拋出
 *
 * @example
 * ```typescript
 * const result = await generateEmbedding("這是一個測試文檔");
 * console.log(result.embedding.length); // 1536
 * console.log(result.tokenCount); // 6
 * ```
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  // 輸入驗證：檢查文本是否為空
  if (!text || text.trim().length === 0) {
    throw new AzureOpenAIError('Text cannot be empty for embedding generation')
  }

  try {
    // 使用統一的Azure OpenAI調用包裝器（含重試和速率限制）
    const result = await callAzureOpenAI(async () => {
      const client = getOpenAIClient()

      // 調用Azure OpenAI嵌入API
      const response = await client.getEmbeddings(
        DEPLOYMENT_IDS.EMBEDDINGS,
        [text.trim()]
      )

      // 驗證API回應完整性
      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from Azure OpenAI')
      }

      const embeddingData = response.data[0]

      // 構建結果對象
      return {
        embedding: embeddingData.embedding,    // 1536維度向量
        text: text.trim(),                     // 清理後的原始文本
        tokenCount: response.usage?.totalTokens || 0,  // Token使用量
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
 *
 * 高效處理多個文本的向量化需求，支持分批處理和並行執行選項。
 * 適用於大量文檔處理場景，可根據API限制和性能需求調整批次大小。
 *
 * @param texts - 要處理的文本陣列
 * @param options - 批量處理選項
 * @param options.batchSize - 每批處理的文本數量，默認10
 * @param options.parallel - 是否並行處理批次，默認false（串行避免速率限制）
 * @returns Promise<BatchEmbeddingResult> - 包含所有嵌入結果和統計信息
 * @throws {AzureOpenAIError} - 當輸入為空或API調用失敗時拋出
 *
 * @example
 * ```typescript
 * const texts = ["文檔1", "文檔2", "文檔3"];
 * const result = await generateBatchEmbeddings(texts, {
 *   batchSize: 5,
 *   parallel: false
 * });
 * console.log(`處理了 ${result.embeddings.length} 個文檔`);
 * ```
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

  // 處理空陣列情況
  if (texts.length === 0) {
    return {
      embeddings: [],
      totalTokens: 0,
      processingTime: 0,
    }
  }

  // 過濾空文本和無效文本
  const validTexts = texts.filter(text => text && text.trim().length > 0)

  if (validTexts.length === 0) {
    throw new AzureOpenAIError('No valid texts provided for embedding generation')
  }

  try {
    const allResults: EmbeddingResult[] = []
    let totalTokens = 0

    // 將文本分割成批次進行處理
    const batches = []
    for (let i = 0; i < validTexts.length; i += batchSize) {
      batches.push(validTexts.slice(i, i + batchSize))
    }

    /**
     * 處理單個批次的嵌入生成
     * @param batch - 當前批次的文本陣列
     * @returns Promise<EmbeddingResult[]> - 該批次的嵌入結果
     */
    const processBatch = async (batch: string[]): Promise<EmbeddingResult[]> => {
      return callAzureOpenAI(async () => {
        const client = getOpenAIClient()

        // 批量調用Azure OpenAI嵌入API
        const response = await client.getEmbeddings(
          DEPLOYMENT_IDS.EMBEDDINGS,
          batch
        )

        if (!response.data) {
          throw new Error('No embedding data received from Azure OpenAI')
        }

        // 將API回應轉換為標準格式，並分配Token使用量
        const batchResults = response.data.map((embeddingData, index) => ({
          embedding: embeddingData.embedding,
          text: batch[index].trim(),
          // 將總Token使用量平均分配給批次中的每個文本
          tokenCount: Math.ceil((response.usage?.totalTokens || 0) / batch.length),
        }))

        totalTokens += response.usage?.totalTokens || 0
        return batchResults
      })
    }

    // 根據parallel選項決定處理策略
    if (parallel) {
      // 並行處理所有批次 - 速度更快但可能觸發速率限制
      const batchPromises = batches.map(processBatch)
      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(results => allResults.push(...results))
    } else {
      // 串行處理批次 - 速度較慢但避免速率限制
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
 * 智能文本分塊處理（用於長文檔）
 *
 * 將超長文檔分割為適合嵌入處理的小塊，使用智能分割算法確保語意完整性。
 * 按優先級尋找最佳分割點：句號 > 換行符 > 空格，避免在詞語中間分割。
 *
 * @param text - 要分割的原始文本
 * @param chunkSize - 每塊的最大字符數，默認8192（Azure OpenAI限制）
 * @param overlapSize - 塊之間的重疊字符數，默認200（保持上下文連貫性）
 * @returns string[] - 分割後的文本塊陣列
 *
 * @example
 * ```typescript
 * const longText = "很長的文檔內容...";
 * const chunks = splitTextIntoChunks(longText, 1000, 100);
 * console.log(`文檔被分割為 ${chunks.length} 塊`);
 * ```
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = MAX_CHUNK_SIZE,
  overlapSize: number = 200
): string[] {
  // 處理空文本情況
  if (!text || text.trim().length === 0) {
    return []
  }

  const cleanText = text.trim()
  const chunks: string[] = []

  // 如果文本小於塊大小，直接返回整個文本
  if (cleanText.length <= chunkSize) {
    return [cleanText]
  }

  let startIndex = 0

  // 循環分割文本直到處理完所有內容
  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize

    // 如果不是最後一塊，尋找智能分割點
    if (endIndex < cleanText.length) {
      const searchEnd = Math.min(endIndex + 100, cleanText.length)

      // 初始化最佳分割點為當前結束位置
      let bestSplitIndex = endIndex

      // 優先級1：在句號後分割（保持句子完整性）
      const periodIndex = cleanText.lastIndexOf('.', searchEnd)
      if (periodIndex > startIndex + chunkSize * 0.8) {
        bestSplitIndex = periodIndex + 1
      } else {
        // 優先級2：在換行符後分割（保持段落完整性）
        const newlineIndex = cleanText.lastIndexOf('\n', searchEnd)
        if (newlineIndex > startIndex + chunkSize * 0.8) {
          bestSplitIndex = newlineIndex + 1
        } else {
          // 優先級3：在空格處分割（避免詞語分離）
          const spaceIndex = cleanText.lastIndexOf(' ', searchEnd)
          if (spaceIndex > startIndex + chunkSize * 0.8) {
            bestSplitIndex = spaceIndex + 1
          }
        }
      }

      endIndex = bestSplitIndex
    }

    // 提取當前塊並清理空白字符
    const chunk = cleanText.substring(startIndex, endIndex).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    // 設置下一個塊的起始位置（包含重疊以保持上下文連貫性）
    startIndex = Math.max(startIndex + 1, endIndex - overlapSize)
  }

  return chunks
}

/**
 * 處理長文檔的完整向量化
 *
 * 專門處理超長文檔的向量化需求，自動進行智能分塊和批量嵌入處理。
 * 適用於PDF、Word文檔、文章等長文本內容的語意搜索準備。
 *
 * @param text - 要處理的完整文檔文本
 * @param options - 文檔處理選項
 * @param options.chunkSize - 每塊的最大字符數，默認8192
 * @param options.overlapSize - 塊之間的重疊字符數，默認200
 * @param options.batchSize - 批量處理的塊數量，默認10
 * @param options.includeMetadata - 是否包含位置元數據，默認false
 * @returns Promise - 包含所有塊的嵌入結果和統計信息
 *
 * @example
 * ```typescript
 * const documentText = "長篇文檔內容...";
 * const result = await generateDocumentEmbeddings(documentText, {
 *   chunkSize: 1000,
 *   includeMetadata: true
 * });
 * console.log(`文檔分為 ${result.totalChunks} 塊處理`);
 * ```
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

  // 第一步：智能分塊處理
  const chunks = splitTextIntoChunks(text, chunkSize, overlapSize)

  // 處理空文檔情況
  if (chunks.length === 0) {
    return {
      embeddings: [],
      totalChunks: 0,
      totalTokens: 0,
      processingTime: Date.now() - startTime,
    }
  }

  // 第二步：批量生成所有塊的嵌入
  const batchResult = await generateBatchEmbeddings(chunks, { batchSize })

  // 第三步：為每個嵌入結果添加塊級元數據
  const embeddings = batchResult.embeddings.map((embedding, index) => {
    const result: EmbeddingResult & {
      chunkIndex: number
      startPosition?: number
      endPosition?: number
    } = {
      ...embedding,
      chunkIndex: index,  // 塊在文檔中的序號
    }

    // 如果需要位置元數據，計算該塊在原文中的位置
    if (includeMetadata) {
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
    embeddings,                              // 所有塊的嵌入結果（含元數據）
    totalChunks: chunks.length,              // 總塊數
    totalTokens: batchResult.totalTokens,    // 總Token使用量
    processingTime: Date.now() - startTime,  // 總處理時間
  }
}

/**
 * 計算兩個向量的餘弦相似度
 *
 * 餘弦相似度是衡量兩個向量方向相似程度的指標，值介於-1到1之間。
 * 1表示完全相同，0表示正交（無關），-1表示完全相反。
 * 廣泛用於文本語意相似度比較和搜索排序。
 *
 * @param vectorA - 第一個向量（通常是查詢文本的嵌入）
 * @param vectorB - 第二個向量（通常是文檔的嵌入）
 * @returns number - 餘弦相似度值（-1到1之間）
 * @throws {Error} - 當兩個向量維度不匹配時拋出
 *
 * @example
 * ```typescript
 * const queryEmbedding = await generateEmbedding("搜索查詢");
 * const docEmbedding = await generateEmbedding("文檔內容");
 *
 * const similarity = calculateCosineSimilarity(
 *   queryEmbedding.embedding,
 *   docEmbedding.embedding
 * );
 *
 * if (similarity > 0.8) {
 *   console.log("高度相關文檔");
 * } else if (similarity > 0.5) {
 *   console.log("中度相關文檔");
 * } else {
 *   console.log("低相關性文檔");
 * }
 * ```
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  // 檢查向量維度是否匹配
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimension')
  }

  let dotProduct = 0      // 點積累加器
  let magnitudeA = 0      // 向量A的模長平方累加器
  let magnitudeB = 0      // 向量B的模長平方累加器

  // 一次遍歷計算所有需要的值
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]  // 累加點積
    magnitudeA += vectorA[i] * vectorA[i]  // 累加A的模長平方
    magnitudeB += vectorB[i] * vectorB[i]  // 累加B的模長平方
  }

  // 計算實際模長（平方根）
  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  // 處理零向量情況（避免除零錯誤）
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  // 餘弦相似度公式：cos(θ) = (A·B) / (|A|×|B|)
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * 導出系統常數
 *
 * 提供給外部模組使用的關鍵配置參數，確保整個系統使用一致的向量維度和分塊設定。
 *
 * • EMBEDDING_DIMENSION: text-embedding-ada-002模型的標準向量維度（1536）
 * • MAX_CHUNK_SIZE: 單個文本塊的最大字符限制，基於Azure OpenAI的Token限制
 */
export { EMBEDDING_DIMENSION, MAX_CHUNK_SIZE }