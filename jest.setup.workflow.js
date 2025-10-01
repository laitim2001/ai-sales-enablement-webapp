/**
 * Jest 設置 - 工作流程測試專用
 *
 * 注意：
 * - 不 mock Prisma Client（使用真實數據庫）
 * - 需要配置測試數據庫環境變數
 * - 測試前會自動清理和遷移數據庫
 */

// 加載環境變數
require('dotenv').config({ path: '.env.test' })

// 設置測試環境變數（如果 .env.test 不存在）
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/sales_enablement_test'
}

// 其他必要的環境變數
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-purposes-only'
process.env.AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || 'test-api-key'
process.env.AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://test.openai.azure.com/'
process.env.AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'
process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 = process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4'
process.env.AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS = process.env.AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS || 'text-embedding-ada-002'

// Mock console 來保持測試輸出清潔
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// 全局測試鉤子
beforeAll(async () => {
  console.info('🔧 設置工作流程測試環境...')
  console.info('📊 數據庫連接:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'))
})

afterAll(async () => {
  console.info('🧹 清理工作流程測試環境...')
})
