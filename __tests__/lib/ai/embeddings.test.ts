/**
 * @jest-environment node
 */

import {
  generateEmbedding,
  generateBatchEmbeddings,
  splitTextIntoChunks,
  calculateCosineSimilarity,
  generateDocumentEmbeddings,
} from '@/lib/ai/embeddings'
import { getOpenAIClient, AzureOpenAIError } from '@/lib/ai/openai'

// Mock the OpenAI client
jest.mock('@/lib/ai/openai', () => ({
  getOpenAIClient: jest.fn(),
  DEPLOYMENT_IDS: {
    EMBEDDINGS: 'text-embedding-ada-002'
  },
  callAzureOpenAI: jest.fn(),
  AzureOpenAIError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AzureOpenAIError'
    }
  }
}))

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>
const mockCallAzureOpenAI = require('@/lib/ai/openai').callAzureOpenAI as jest.MockedFunction<any>

describe('Embeddings Service', () => {
  const mockEmbeddingVector = new Array(1536).fill(0).map(() => Math.random())
  const mockOpenAIResponse = {
    data: [
      {
        embedding: mockEmbeddingVector,
        index: 0,
      }
    ],
    usage: {
      totalTokens: 10,
      promptTokens: 8,
      completionTokens: 2,
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCallAzureOpenAI.mockImplementation(async (operation: any) => {
      return await operation()
    })
  })

  describe('generateEmbedding', () => {
    it('should generate embedding for valid text', async () => {
      const mockClient = {
        getEmbeddings: jest.fn().mockResolvedValue(mockOpenAIResponse)
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      const result = await generateEmbedding('Test document content')

      expect(result).toEqual({
        embedding: mockEmbeddingVector,
        text: 'Test document content',
        tokenCount: 10,
      })
      expect(mockClient.getEmbeddings).toHaveBeenCalledWith({
        input: ['Test document content'],
        model: 'text-embedding-ada-002',
      })
    })

    it('should throw error for empty text', async () => {
      await expect(generateEmbedding('')).rejects.toThrow('Text cannot be empty for embedding generation')
      await expect(generateEmbedding('   ')).rejects.toThrow('Text cannot be empty for embedding generation')
    })

    it('should handle API errors', async () => {
      const mockClient = {
        getEmbeddings: jest.fn().mockRejectedValue(new Error('API Error'))
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      await expect(generateEmbedding('Test text')).rejects.toThrow(AzureOpenAIError)
    })

    it('should trim whitespace from text', async () => {
      const mockClient = {
        getEmbeddings: jest.fn().mockResolvedValue(mockOpenAIResponse)
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      const result = await generateEmbedding('  Test document content  ')

      expect(result.text).toBe('Test document content')
      expect(mockClient.getEmbeddings).toHaveBeenCalledWith({
        input: ['Test document content'],
        model: 'text-embedding-ada-002',
      })
    })
  })

  describe('generateBatchEmbeddings', () => {
    const mockBatchResponse = {
      data: [
        { embedding: mockEmbeddingVector, index: 0 },
        { embedding: mockEmbeddingVector, index: 1 }
      ],
      usage: {
        totalTokens: 20,
        promptTokens: 16,
        completionTokens: 4,
      }
    }

    it('should generate embeddings for multiple texts', async () => {
      const mockClient = {
        getEmbeddings: jest.fn().mockResolvedValue(mockBatchResponse)
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      const texts = ['First document', 'Second document']
      const result = await generateBatchEmbeddings(texts)

      expect(result.embeddings).toHaveLength(2)
      expect(result.totalTokens).toBe(20)
      expect(result.processingTime).toBeGreaterThan(0)
      expect(mockClient.getEmbeddings).toHaveBeenCalledWith({
        input: texts,
        model: 'text-embedding-ada-002',
      })
    })

    it('should handle empty array', async () => {
      const result = await generateBatchEmbeddings([])

      expect(result.embeddings).toHaveLength(0)
      expect(result.totalTokens).toBe(0)
      expect(result.processingTime).toBe(0)
    })

    it('should filter out empty texts', async () => {
      const mockClient = {
        getEmbeddings: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbeddingVector, index: 0 }],
          usage: { totalTokens: 10 }
        })
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      const texts = ['Valid text', '', '  ', 'Another valid text']
      await generateBatchEmbeddings(texts)

      expect(mockClient.getEmbeddings).toHaveBeenCalledWith({
        input: ['Valid text', 'Another valid text'],
        model: 'text-embedding-ada-002',
      })
    })

    it('should throw error if all texts are invalid', async () => {
      const texts = ['', '  ', null, undefined] as any[]

      await expect(generateBatchEmbeddings(texts)).rejects.toThrow('No valid texts provided for embedding generation')
    })

    it('should process in batches', async () => {
      const mockClient = {
        getEmbeddings: jest.fn()
          .mockResolvedValueOnce({
            data: [
              { embedding: mockEmbeddingVector, index: 0 },
              { embedding: mockEmbeddingVector, index: 1 }
            ],
            usage: { totalTokens: 10 }
          })
          .mockResolvedValueOnce({
            data: [
              { embedding: mockEmbeddingVector, index: 0 }
            ],
            usage: { totalTokens: 5 }
          })
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      const texts = ['Text 1', 'Text 2', 'Text 3']
      const result = await generateBatchEmbeddings(texts, { batchSize: 2 })

      expect(result.embeddings).toHaveLength(3)
      expect(result.totalTokens).toBe(15)
      expect(mockClient.getEmbeddings).toHaveBeenCalledTimes(2)
    })
  })

  describe('splitTextIntoChunks', () => {
    it('should return empty array for empty text', () => {
      expect(splitTextIntoChunks('')).toEqual([])
      expect(splitTextIntoChunks('   ')).toEqual([])
    })

    it('should return single chunk for short text', () => {
      const shortText = 'This is a short text.'
      const chunks = splitTextIntoChunks(shortText, 1000)

      expect(chunks).toEqual([shortText])
    })

    it('should split long text into chunks', () => {
      const longText = 'a'.repeat(2000)
      const chunks = splitTextIntoChunks(longText, 500, 50)

      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[0].length).toBeLessThanOrEqual(500)
    })

    it('should prefer splitting at sentence boundaries', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.'
      const chunks = splitTextIntoChunks(text, 30, 5)

      // Should split after periods when possible
      chunks.forEach(chunk => {
        expect(chunk.trim()).toBeTruthy()
      })
    })

    it('should handle overlap correctly', () => {
      const text = 'First chunk content. Second chunk content. Third chunk content.'
      const chunks = splitTextIntoChunks(text, 25, 10)

      if (chunks.length > 1) {
        // Check that there's some overlap between consecutive chunks
        const firstChunkEnd = chunks[0].slice(-10)
        const secondChunkStart = chunks[1].slice(0, 10)
        // Should have some common content (allowing for sentence boundary splitting)
        expect(chunks[1]).toContain(firstChunkEnd.slice(-5))
      }
    })
  })

  describe('calculateCosineSimilarity', () => {
    it('should calculate similarity between identical vectors', () => {
      const vector = [1, 2, 3, 4, 5]
      const similarity = calculateCosineSimilarity(vector, vector)

      expect(similarity).toBeCloseTo(1.0, 5)
    })

    it('should calculate similarity between orthogonal vectors', () => {
      const vectorA = [1, 0]
      const vectorB = [0, 1]
      const similarity = calculateCosineSimilarity(vectorA, vectorB)

      expect(similarity).toBeCloseTo(0.0, 5)
    })

    it('should calculate similarity between opposite vectors', () => {
      const vectorA = [1, 2, 3]
      const vectorB = [-1, -2, -3]
      const similarity = calculateCosineSimilarity(vectorA, vectorB)

      expect(similarity).toBeCloseTo(-1.0, 5)
    })

    it('should throw error for different dimension vectors', () => {
      const vectorA = [1, 2, 3]
      const vectorB = [1, 2]

      expect(() => calculateCosineSimilarity(vectorA, vectorB))
        .toThrow('Vectors must have the same dimension')
    })

    it('should handle zero vectors', () => {
      const vectorA = [0, 0, 0]
      const vectorB = [1, 2, 3]
      const similarity = calculateCosineSimilarity(vectorA, vectorB)

      expect(similarity).toBe(0)
    })
  })

  describe('generateDocumentEmbeddings', () => {
    it('should process document with multiple chunks', async () => {
      const mockClient = {
        getEmbeddings: jest.fn().mockResolvedValue({
          data: [
            { embedding: mockEmbeddingVector, index: 0 },
            { embedding: mockEmbeddingVector, index: 1 }
          ],
          usage: { totalTokens: 20 }
        })
      }
      mockGetOpenAIClient.mockReturnValue(mockClient as any)

      const longDocument = 'a'.repeat(2000) + '. ' + 'b'.repeat(2000)
      const result = await generateDocumentEmbeddings(longDocument, {
        chunkSize: 1000,
        includeMetadata: true
      })

      expect(result.embeddings.length).toBeGreaterThan(0)
      expect(result.totalChunks).toBeGreaterThan(1)
      expect(result.totalTokens).toBe(20)
      expect(result.processingTime).toBeGreaterThan(0)

      // Check metadata is included
      expect(result.embeddings[0]).toHaveProperty('chunkIndex')
      expect(result.embeddings[0]).toHaveProperty('startPosition')
      expect(result.embeddings[0]).toHaveProperty('endPosition')
    })

    it('should handle empty document', async () => {
      const result = await generateDocumentEmbeddings('')

      expect(result.embeddings).toHaveLength(0)
      expect(result.totalChunks).toBe(0)
      expect(result.totalTokens).toBe(0)
    })
  })
})