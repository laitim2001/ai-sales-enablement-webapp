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
          this.map = new Map(init.map)
        } else if (typeof init === 'object') {
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
  }

  return {
    NextRequest: jest.fn(),
    NextResponse: class NextResponse {
      constructor(body, init = {}) {
        this.body = body
        this.status = init.status || 200
        this.statusText = init.statusText || ''
        this.headers = new MockHeaders(init.headers)
      }

      static json(body, init = {}) {
        const response = new NextResponse(JSON.stringify(body), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init.headers,
          },
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