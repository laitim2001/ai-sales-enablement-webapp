/**
 * @fileoverview jest.setup - 工具模組
 * @module jest.setup
 * @description
 * 提供輔助功能的工具函數
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.AZURE_OPENAI_API_KEY = 'test-api-key'
process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com/'
process.env.AZURE_OPENAI_API_VERSION = '2024-02-01'
process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 = 'gpt-4'
process.env.AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS = 'text-embedding-ada-002'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods in tests to keep output clean
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Next.js modules
jest.mock('next/server', () => {
  // 創建一個 Headers mock
  class MockHeaders {
    constructor(init) {
      this.map = new Map()
      if (init) {
        if (init instanceof MockHeaders) {
          // Copy from MockHeaders
          this.map = new Map(init.map)
        } else if (init && typeof init.forEach === 'function') {
          // Handle Headers-like objects (including real Headers API)
          init.forEach((value, key) => {
            this.map.set(key.toLowerCase(), value)
          })
        } else if (typeof init === 'object') {
          // Handle plain objects
          Object.entries(init).forEach(([key, value]) => {
            this.map.set(key.toLowerCase(), value)
          })
        }
      }
    }
    get(name) {
      return this.map.get(name?.toLowerCase()) || null
    }
    set(name, value) {
      this.map.set(name.toLowerCase(), value)
    }
    has(name) {
      return this.map.has(name?.toLowerCase())
    }
    entries() {
      return this.map.entries()
    }
    keys() {
      return this.map.keys()
    }
    values() {
      return this.map.values()
    }
    forEach(callback) {
      this.map.forEach((value, key) => callback(value, key, this))
    }
  }

  return {
    NextRequest: class NextRequest {
      constructor(url, init = {}) {
        this.url = url
        this.method = init.method || 'GET'
        this.headers = new MockHeaders(init.headers)
        this._body = init.body
        this._jsonBody = null

        // Parse JSON body if provided
        if (this._body && typeof this._body === 'string') {
          try {
            this._jsonBody = JSON.parse(this._body)
          } catch (e) {
            // Not JSON, keep as string
          }
        }
      }

      async json() {
        if (this._jsonBody !== null) {
          return this._jsonBody
        }
        if (this._body && typeof this._body === 'string') {
          return JSON.parse(this._body)
        }
        throw new Error('No body to parse')
      }

      async text() {
        return this._body || ''
      }

      clone() {
        return new NextRequest(this.url, {
          method: this.method,
          headers: this.headers,
          body: this._body
        })
      }
    },
    NextResponse: class NextResponse {
      constructor(body, init = {}) {
        this.body = body
        this.status = init.status || 200
        this.statusText = init.statusText || ''
        this.headers = new MockHeaders(init.headers)
      }

      static json(body, init = {}) {
        // Handle Headers object properly
        const headers = new MockHeaders()
        headers.set('Content-Type', 'application/json')

        // Merge init.headers if provided
        if (init.headers) {
          if (init.headers instanceof MockHeaders) {
            // Copy from MockHeaders
            init.headers.forEach((value, key) => {
              headers.set(key, value)
            })
          } else if (typeof init.headers === 'object') {
            // Copy from plain object or Headers
            if (typeof init.headers.forEach === 'function') {
              // It's a Headers-like object
              init.headers.forEach((value, key) => {
                headers.set(key, value)
              })
            } else {
              // It's a plain object
              Object.entries(init.headers).forEach(([key, value]) => {
                headers.set(key, value)
              })
            }
          }
        }

        const response = new NextResponse(JSON.stringify(body), {
          ...init,
          headers
        })
        response._jsonBody = body
        return response
      }

      async json() {
        if (this._jsonBody !== undefined) {
          return this._jsonBody
        }
        if (this.body === 'undefined' || this.body === undefined) {
          return undefined
        }
        return JSON.parse(this.body)
      }

      async text() {
        return this.body
      }

      clone() {
        const cloned = new this.constructor(this.body, {
          status: this.status,
          statusText: this.statusText,
          headers: this.headers
        })
        if (this._jsonBody !== undefined) {
          cloned._jsonBody = this._jsonBody
        }
        return cloned
      }
    },
  }
})

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    knowledgeBase: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  })),
}))

// Mock Azure OpenAI
jest.mock('@azure/openai', () => ({
  OpenAIApi: jest.fn().mockImplementation(() => ({
    getChatCompletions: jest.fn(),
    getEmbeddings: jest.fn(),
    getModel: jest.fn(),
  })),
}))

// Setup and teardown hooks
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
})

afterEach(() => {
  // Clean up after each test
  jest.resetModules()
})