/**
 * 整合測試執行腳本
 *
 * 功能：
 * - 自動化執行所有整合測試
 * - 生成測試報告
 * - 環境檢查和設置
 * - 測試結果分析
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

// 載入環境變數
require('dotenv').config({ path: '.env.local' });

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { runSystemIntegrationTests } = require('../tests/integration/system-integration.test.ts');

// 配置
const CONFIG = {
  reportDir: './test-reports',
  logLevel: process.env.LOG_LEVEL || 'info',
  timeout: 300000, // 5分鐘總超時
  retryCount: 2
};

/**
 * 日誌輸出函數
 */
function log(level, message) {
  const timestamp = new Date().toISOString();
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levels[CONFIG.logLevel] || 2;

  if (levels[level] <= currentLevel) {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

/**
 * 檢查環境配置
 */
async function checkEnvironment() {
  log('info', '🔧 檢查環境配置...');

  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const optionalEnvVars = [
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'DYNAMICS_365_TENANT_ID',
    'DYNAMICS_365_CLIENT_ID',
    'DYNAMICS_365_CLIENT_SECRET',
    'DYNAMICS_365_RESOURCE'
  ];

  // 檢查必要環境變數
  const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingRequired.length > 0) {
    throw new Error(`缺少必要環境變數: ${missingRequired.join(', ')}`);
  }

  // 檢查可選環境變數
  const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    log('warn', `缺少可選環境變數: ${missingOptional.join(', ')} - 相關測試將被跳過`);
  }

  log('info', '✅ 環境配置檢查完成');
  return {
    hasRequired: missingRequired.length === 0,
    hasAzureOpenAI: process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY,
    hasDynamics365: process.env.DYNAMICS_365_TENANT_ID &&
                   process.env.DYNAMICS_365_CLIENT_ID &&
                   process.env.DYNAMICS_365_CLIENT_SECRET &&
                   process.env.DYNAMICS_365_RESOURCE
  };
}

/**
 * 檢查服務狀態
 */
async function checkServices() {
  log('info', '🔍 檢查服務狀態...');

  // 檢查開發服務器
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3001/api/health', {
      timeout: 5000
    });

    if (response.ok) {
      log('info', '✅ 開發服務器運行正常');
    } else {
      log('warn', `⚠️ 開發服務器狀態異常: ${response.status}`);
    }
  } catch (error) {
    log('error', `❌ 無法連接開發服務器: ${error.message}`);
    throw new Error('開發服務器未啟動，請先運行 npm run dev');
  }

  // 檢查資料庫連接
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    log('info', '✅ 資料庫連接正常');
  } catch (error) {
    log('error', `❌ 資料庫連接失敗: ${error.message}`);
    throw new Error('資料庫連接失敗，請檢查 DATABASE_URL 配置');
  }
}

/**
 * 準備測試環境
 */
async function prepareTestEnvironment() {
  log('info', '🛠️ 準備測試環境...');

  // 創建測試報告目錄
  try {
    await fs.mkdir(CONFIG.reportDir, { recursive: true });
    log('debug', `創建測試報告目錄: ${CONFIG.reportDir}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }

  // 設置測試環境變數
  process.env.NODE_ENV = 'test';
  process.env.TEST_BASE_URL = 'http://localhost:3002';

  log('info', '✅ 測試環境準備完成');
}

/**
 * 執行整合測試
 */
async function executeIntegrationTests() {
  log('info', '🚀 開始執行整合測試...');

  const startTime = Date.now();
  let attempt = 1;
  let lastError = null;

  while (attempt <= CONFIG.retryCount) {
    try {
      log('info', `第 ${attempt} 次嘗試執行測試...`);

      // 執行測試
      const result = await Promise.race([
        runSystemIntegrationTests(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('測試總體超時')), CONFIG.timeout);
        })
      ]);

      const duration = Date.now() - startTime;
      log('info', `✅ 整合測試完成，耗時 ${duration}ms`);

      return result;

    } catch (error) {
      lastError = error;
      log('error', `❌ 第 ${attempt} 次測試失敗: ${error.message}`);

      if (attempt < CONFIG.retryCount) {
        log('info', `等待 5 秒後重試...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      attempt++;
    }
  }

  throw lastError;
}

/**
 * 生成測試報告
 */
async function generateTestReport(testResult, environment) {
  log('info', '📊 生成測試報告...');

  const reportData = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ...environment
    },
    summary: {
      total: testResult.results.total,
      passed: testResult.results.passed,
      failed: testResult.results.failed,
      successRate: testResult.successRate,
      duration: testResult.duration
    },
    suites: testResult.suites,
    errors: testResult.results.errors,
    recommendations: generateRecommendations(testResult)
  };

  // 生成 JSON 報告
  const jsonReportPath = path.join(CONFIG.reportDir, `integration-test-${Date.now()}.json`);
  await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));

  // 生成 Markdown 報告
  const markdownReport = generateMarkdownReport(reportData);
  const mdReportPath = path.join(CONFIG.reportDir, `integration-test-${Date.now()}.md`);
  await fs.writeFile(mdReportPath, markdownReport);

  log('info', `✅ 測試報告已生成:`);
  log('info', `  JSON: ${jsonReportPath}`);
  log('info', `  Markdown: ${mdReportPath}`);

  return { jsonReportPath, mdReportPath };
}

/**
 * 生成建議
 */
function generateRecommendations(testResult) {
  const recommendations = [];

  // 基於成功率的建議
  if (testResult.successRate < 80) {
    recommendations.push({
      priority: 'HIGH',
      category: 'RELIABILITY',
      message: '系統穩定性需要改善，成功率低於 80%'
    });
  }

  // 基於失敗類型的建議
  const errorCategories = {};
  testResult.results.errors.forEach(error => {
    const category = error.test.split(' ')[0];
    errorCategories[category] = (errorCategories[category] || 0) + 1;
  });

  Object.entries(errorCategories).forEach(([category, count]) => {
    if (count >= 2) {
      recommendations.push({
        priority: 'MEDIUM',
        category: category.toUpperCase(),
        message: `${category} 模組存在多個問題，需要重點檢查`
      });
    }
  });

  // 性能建議
  if (testResult.duration > 120000) { // 2分鐘
    recommendations.push({
      priority: 'LOW',
      category: 'PERFORMANCE',
      message: '測試執行時間較長，可能需要性能優化'
    });
  }

  return recommendations;
}

/**
 * 生成 Markdown 報告
 */
function generateMarkdownReport(reportData) {
  return `# 系統整合測試報告

## 測試摘要

- **執行時間**: ${reportData.timestamp}
- **總測試數**: ${reportData.summary.total}
- **通過**: ${reportData.summary.passed}
- **失敗**: ${reportData.summary.failed}
- **成功率**: ${reportData.summary.successRate}%
- **執行時長**: ${reportData.summary.duration}ms

## 環境信息

- **Node.js 版本**: ${reportData.environment.nodeVersion}
- **平台**: ${reportData.environment.platform}
- **Azure OpenAI**: ${reportData.environment.hasAzureOpenAI ? '✅ 已配置' : '❌ 未配置'}
- **Dynamics 365**: ${reportData.environment.hasDynamics365 ? '✅ 已配置' : '❌ 未配置'}

## 測試套件結果

${Object.entries(reportData.suites).map(([suite, stats]) => {
  const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
  return `### ${suite.toUpperCase()}
- 通過: ${stats.passed}/${stats.total} (${rate}%)
- 失敗: ${stats.failed}`;
}).join('\n\n')}

## 失敗詳情

${reportData.errors.length > 0 ?
  reportData.errors.map((error, index) =>
    `${index + 1}. **${error.test}**: ${error.error}`
  ).join('\n') :
  '無失敗項目'
}

## 建議

${reportData.recommendations.length > 0 ?
  reportData.recommendations.map(rec =>
    `- **[${rec.priority}] ${rec.category}**: ${rec.message}`
  ).join('\n') :
  '系統運行良好，無特殊建議'
}

---
*報告生成時間: ${reportData.timestamp}*
`;
}

/**
 * 主執行函數
 */
async function main() {
  const startTime = Date.now();

  try {
    log('info', '🔥 開始系統整合測試流程');

    // 1. 環境檢查
    const environment = await checkEnvironment();

    // 2. 服務檢查
    await checkServices();

    // 3. 準備測試環境
    await prepareTestEnvironment();

    // 4. 執行整合測試
    const testResult = await executeIntegrationTests();

    // 5. 生成測試報告
    const reports = await generateTestReport(testResult, environment);

    const totalDuration = Date.now() - startTime;

    // 6. 輸出結果摘要
    console.log('\n=====================================');
    console.log('🎉 系統整合測試流程完成');
    console.log('=====================================');
    console.log(`總耗時: ${totalDuration}ms`);
    console.log(`測試成功率: ${testResult.successRate}%`);
    console.log(`報告位置: ${reports.mdReportPath}`);

    if (testResult.success) {
      console.log('\n✅ 所有測試通過，系統整合穩定！');
      process.exit(0);
    } else {
      console.log('\n⚠️ 部分測試失敗，請檢查報告詳情。');
      process.exit(1);
    }

  } catch (error) {
    log('error', `❌ 測試流程失敗: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行主函數
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkEnvironment,
  checkServices,
  executeIntegrationTests,
  generateTestReport
};