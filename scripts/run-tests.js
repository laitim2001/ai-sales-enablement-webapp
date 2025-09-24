#!/usr/bin/env node

/**
 * 測試運行腳本
 * 提供不同類型的測試運行選項
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`

// 測試類型配置
const testConfigs = {
  unit: {
    name: '單元測試',
    command: 'npm test -- --testPathPattern="__tests__/(lib|components)" --coverage',
    description: '運行所有單元測試並生成覆蓋率報告'
  },
  integration: {
    name: '整合測試',
    command: 'npm test -- --testPathPattern="__tests__/api" --forceExit',
    description: '運行 API 和服務整合測試'
  },
  e2e: {
    name: 'E2E 測試',
    command: 'npm run test:e2e',
    description: '運行端到端測試 (需要應用程式運行中)'
  },
  ai: {
    name: 'AI 服務測試',
    command: 'npm test -- --testPathPattern="__tests__/lib/ai"',
    description: '專門測試 AI 服務模組'
  },
  auth: {
    name: '認證測試',
    command: 'npm test -- --testPathPattern="__tests__/api/auth"',
    description: '測試認證相關 API'
  },
  kb: {
    name: '知識庫測試',
    command: 'npm test -- --testPathPattern="tests/knowledge-base"',
    description: '測試知識庫相關 API 和功能'
  },
  all: {
    name: '所有測試',
    command: 'npm test -- --coverage --forceExit',
    description: '運行所有測試並生成完整報告'
  },
  watch: {
    name: '監視模式',
    command: 'npm run test:watch',
    description: '監視文件變化並自動重新運行測試'
  },
  coverage: {
    name: '覆蓋率報告',
    command: 'npm run test:coverage',
    description: '生成詳細的測試覆蓋率報告'
  }
}

// 檢查前置條件
function checkPrerequisites() {
  console.log(colorize('cyan', '🔍 檢查測試環境...'))

  // 檢查 Jest 配置
  if (!fs.existsSync(path.join(__dirname, '..', 'jest.config.js'))) {
    console.log(colorize('red', '❌ 找不到 jest.config.js'))
    process.exit(1)
  }

  // 檢查 Jest setup 文件
  if (!fs.existsSync(path.join(__dirname, '..', 'jest.setup.js'))) {
    console.log(colorize('red', '❌ 找不到 jest.setup.js'))
    process.exit(1)
  }

  // 檢查測試目錄
  if (!fs.existsSync(path.join(__dirname, '..', '__tests__'))) {
    console.log(colorize('red', '❌ 找不到 __tests__ 目錄'))
    process.exit(1)
  }

  console.log(colorize('green', '✅ 測試環境檢查通過'))
}

// 運行測試
function runTest(testType) {
  const config = testConfigs[testType]
  if (!config) {
    console.log(colorize('red', `❌ 未知的測試類型: ${testType}`))
    showUsage()
    process.exit(1)
  }

  console.log(colorize('cyan', `\n🧪 開始運行: ${config.name}`))
  console.log(colorize('yellow', `📝 說明: ${config.description}`))
  console.log(colorize('blue', `🚀 命令: ${config.command}\n`))

  try {
    execSync(config.command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        // 測試環境變數
        JEST_TIMEOUT: '30000',
        DISABLE_ESLINT_PLUGIN: 'true',
      }
    })

    console.log(colorize('green', `\n✅ ${config.name} 運行成功!`))

    // 如果是覆蓋率測試，顯示報告位置
    if (testType === 'coverage' || testType === 'all' || testType === 'unit') {
      const coverageDir = path.join(__dirname, '..', 'coverage')
      if (fs.existsSync(coverageDir)) {
        console.log(colorize('cyan', `📊 覆蓋率報告已生成: ${coverageDir}/lcov-report/index.html`))
      }
    }

  } catch (error) {
    console.log(colorize('red', `\n❌ ${config.name} 運行失敗`))
    console.log(colorize('red', `錯誤: ${error.message}`))
    process.exit(1)
  }
}

// 顯示使用說明
function showUsage() {
  console.log(colorize('cyan', '\n📚 AI 銷售賦能平台 - 測試運行腳本'))
  console.log(colorize('yellow', '\n用法: node scripts/run-tests.js [測試類型]\n'))

  console.log(colorize('cyan', '可用的測試類型:'))
  Object.entries(testConfigs).forEach(([key, config]) => {
    console.log(`  ${colorize('green', key.padEnd(12))} - ${config.description}`)
  })

  console.log(colorize('yellow', '\n範例:'))
  console.log('  node scripts/run-tests.js unit        # 運行單元測試')
  console.log('  node scripts/run-tests.js auth        # 運行認證測試')
  console.log('  node scripts/run-tests.js ai          # 運行 AI 服務測試')
  console.log('  node scripts/run-tests.js all         # 運行所有測試')
  console.log('  node scripts/run-tests.js watch       # 監視模式')
}

// 顯示測試統計
function showTestStats() {
  const testDir = path.join(__dirname, '..', '__tests__')
  if (!fs.existsSync(testDir)) {
    return
  }

  console.log(colorize('cyan', '\n📈 測試統計:'))

  try {
    // 統計測試文件數量
    const countFiles = (dir, pattern) => {
      const files = fs.readdirSync(dir, { recursive: true })
      return files.filter(file => file.toString().match(pattern)).length
    }

    const unitTests = countFiles(testDir, /\.test\.(js|ts)$/)
    const e2eTests = fs.existsSync(path.join(__dirname, '..', 'tests')) ?
      countFiles(path.join(__dirname, '..', 'tests'), /\.spec\.(js|ts)$/) : 0

    console.log(`  測試文件總數: ${colorize('green', unitTests)}`)
    console.log(`  E2E 測試: ${colorize('green', e2eTests)}`)

  } catch (error) {
    console.log(colorize('yellow', '  無法統計測試文件'))
  }
}

// 主函數
function main() {
  const args = process.argv.slice(2)

  // 顯示 banner
  console.log(colorize('cyan', '🧪 AI Sales Enablement Platform - Test Runner'))
  console.log(colorize('cyan', '=' .repeat(50)))

  // 檢查參數
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage()
    showTestStats()
    return
  }

  const testType = args[0].toLowerCase()

  // 特殊命令處理
  if (testType === 'stats' || testType === 'status') {
    showTestStats()
    return
  }

  if (testType === 'clean') {
    console.log(colorize('yellow', '🧹 清理測試相關文件...'))
    try {
      execSync('rm -rf coverage .nyc_output test-results', {
        cwd: path.join(__dirname, '..')
      })
      console.log(colorize('green', '✅ 清理完成'))
    } catch (error) {
      console.log(colorize('red', '❌ 清理失敗'))
    }
    return
  }

  // 檢查前置條件
  checkPrerequisites()

  // 顯示測試統計
  showTestStats()

  // 運行測試
  runTest(testType)
}

// 錯誤處理
process.on('unhandledRejection', (error) => {
  console.log(colorize('red', '\n❌ 未處理的錯誤:'))
  console.error(error)
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log(colorize('yellow', '\n⚠️ 測試被中斷'))
  process.exit(0)
})

// 執行
if (require.main === module) {
  main()
}

module.exports = { runTest, testConfigs }