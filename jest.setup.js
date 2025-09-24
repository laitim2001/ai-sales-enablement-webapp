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
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: jest.fn(() => Promise.resolve(body)),
      status: init?.status || 200,
      headers: init?.headers || new Headers(),
    })),
  },
}))

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