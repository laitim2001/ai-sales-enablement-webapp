// 測試輔助工具

export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'SALES_REP',
  department: 'Sales',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  last_login: null,
  ...overrides,
})

export const createMockCustomer = (overrides = {}) => ({
  id: 1,
  company_name: 'Test Company',
  email: 'contact@testcompany.com',
  phone: '+1-555-123-4567',
  website: 'https://testcompany.com',
  industry: 'Technology',
  company_size: 'MEDIUM',
  status: 'PROSPECT',
  assigned_user_id: 1,
  notes: 'Test customer',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

export const createMockKnowledgeBase = (overrides = {}) => ({
  id: 1,
  title: 'Test Document',
  content: 'This is test document content for knowledge base testing.',
  file_path: '/path/to/test/document.pdf',
  file_size: 1024,
  mime_type: 'application/pdf',
  hash: 'test-hash-123',
  version: 1,
  status: 'ACTIVE',
  category: 'GENERAL',
  source: 'manual-upload',
  author: 'Test Author',
  language: 'en',
  processing_status: 'COMPLETED',
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 1,
  updated_by: 1,
  ...overrides,
})

export const createMockEmbedding = (dimension = 1536) => {
  return new Array(dimension).fill(0).map(() => Math.random() * 2 - 1)
}

export const createMockAPIResponse = <T>(data: T, status = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
  }
  return mockResponse as unknown as Response
}

export const mockNextRequest = (
  method: string,
  body?: any,
  headers: Record<string, string> = {}
) => {
  const mockRequest = {
    method,
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(headers),
    url: 'http://localhost:3000/api/test',
  }
  return mockRequest as any
}

export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Test environment helpers
export const isTestEnvironment = () => process.env.NODE_ENV === 'test'

export const skipIfNoEnv = (envVar: string) => {
  if (!process.env[envVar]) {
    return test.skip
  }
  return test
}

// Database test helpers (for integration tests)
export const cleanupTestDatabase = async (prisma: any) => {
  // Clean up in reverse dependency order
  await prisma.auditLog.deleteMany({})
  await prisma.aiAnalysis.deleteMany({})
  await prisma.interaction.deleteMany({})
  await prisma.document.deleteMany({})
  await prisma.proposalItem.deleteMany({})
  await prisma.proposal.deleteMany({})
  await prisma.callRecord.deleteMany({})
  await prisma.processingTask.deleteMany({})
  await prisma.knowledgeChunk.deleteMany({})
  await prisma.knowledgeBase.deleteMany({})
  await prisma.knowledgeTag.deleteMany({})
  await prisma.customer.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.systemConfig.deleteMany({})
}

// Mock Azure OpenAI responses
export const createMockEmbeddingResponse = (texts: string[]) => ({
  data: texts.map((text, index) => ({
    embedding: createMockEmbedding(),
    index,
  })),
  usage: {
    totalTokens: texts.join(' ').length / 4, // Rough token estimation
    promptTokens: texts.join(' ').length / 4,
    completionTokens: 0,
  }
})

export const createMockChatResponse = (message: string) => ({
  choices: [{
    message: {
      role: 'assistant',
      content: message,
    },
    finishReason: 'stop',
    index: 0,
  }],
  usage: {
    totalTokens: message.length / 4,
    promptTokens: message.length / 6,
    completionTokens: message.length / 8,
  }
})

// Test data generators
export const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2)
}

export const generateRandomEmail = () => {
  return `test${generateRandomString(8)}@example.com`
}

// Assertion helpers
export const expectValidJWT = (token: string) => {
  expect(token).toBeDefined()
  expect(typeof token).toBe('string')
  expect(token.split('.')).toHaveLength(3) // Header.Payload.Signature
}

export const expectValidEmbedding = (embedding: number[], dimension = 1536) => {
  expect(embedding).toBeDefined()
  expect(Array.isArray(embedding)).toBe(true)
  expect(embedding).toHaveLength(dimension)
  embedding.forEach(value => {
    expect(typeof value).toBe('number')
    expect(value).not.toBeNaN()
  })
}

export const expectValidAPIResponse = (response: any) => {
  expect(response).toBeDefined()
  expect(response).toHaveProperty('success')
  expect(response).toHaveProperty('data')
  expect(response).toHaveProperty('metadata')
  expect(response.metadata).toHaveProperty('requestId')
  expect(response.metadata).toHaveProperty('timestamp')
  expect(response.metadata).toHaveProperty('processingTime')
}