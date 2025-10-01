/**
 * Jest 配置 - 工作流程測試專用
 *
 * 用途：
 * - 使用真實的 Prisma Client（不使用 mock）
 * - 連接測試數據庫
 * - 支持數據庫整合測試
 *
 * 運行命令：
 * npm run test:workflow
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // 使用專門的測試設置文件（不 mock Prisma）
  setupFilesAfterEnv: ['<rootDir>/jest.setup.workflow.js'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // 使用 Node 環境而不是 jsdom
  testEnvironment: 'node',

  // 只運行工作流程測試
  testMatch: [
    '**/__tests__/workflow/**/*.test.(ts|tsx)',
  ],

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // 增加測試超時時間（數據庫操作可能較慢）
  testTimeout: 30000,

  // 顯示詳細的測試結果
  verbose: true,

  // 覆蓋率配置
  collectCoverageFrom: [
    'lib/workflow/**/*.ts',
    '!lib/workflow/**/*.d.ts',
    '!lib/workflow/index.ts', // 導出文件不需要覆蓋率
  ],

  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/workflow',

  // 最低覆蓋率要求
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
