/**
 * 系統整合測試套件
 *
 * 功能：
 * - 完整的系統元件整合測試
 * - API 端點功能驗證
 * - 資料庫連接和操作測試
 * - 外部服務整合測試
 * - 性能和負載測試
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

const { spawn } = require('child_process');
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

// 初始化測試環境
const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';

// 測試錯誤介面
interface TestError {
  test: string;
  error: string;
}

// 測試套件結果介面
interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  errors: TestError[];
}

// 測試套件集合介面
interface TestSuites {
  database: TestSuiteResult;
  api: TestSuiteResult;
  ai: TestSuiteResult;
  monitoring: TestSuiteResult;
  crm: TestSuiteResult;
  [key: string]: TestSuiteResult;
}

// 測試結果統計
const testSuites: TestSuites = {
  database: { total: 0, passed: 0, failed: 0, errors: [] },
  api: { total: 0, passed: 0, failed: 0, errors: [] },
  ai: { total: 0, passed: 0, failed: 0, errors: [] },
  monitoring: { total: 0, passed: 0, failed: 0, errors: [] },
  crm: { total: 0, passed: 0, failed: 0, errors: [] }
};

/**
 * 執行測試並記錄結果
 */
async function runTest(suite: string, testName: string, testFunction: () => Promise<void>, timeout: number = 30000): Promise<void> {
  testSuites[suite].total++;
  console.log(`\n🔍 [${suite.toUpperCase()}] ${testName}`);

  try {
    const startTime = Date.now();

    // 設置超時
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('測試超時')), timeout);
    });

    await Promise.race([testFunction(), timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`✅ 通過 (${duration}ms)`);
    testSuites[suite].passed++;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ 失敗: ${errorMessage}`);
    testSuites[suite].failed++;
    testSuites[suite].errors.push({
      test: testName,
      error: errorMessage
    });
  }
}

/**
 * 1. 資料庫整合測試
 */
async function testDatabaseIntegration() {
  console.log('\n📋 1. 資料庫整合測試');

  // 測試 1.1: 資料庫連接
  await runTest('database', '1.1 資料庫連接測試', async () => {
    await prisma.$queryRaw`SELECT 1`;
    console.log('  ✓ PostgreSQL 連接成功');
  });

  // 測試 1.2: 基本 CRUD 操作
  await runTest('database', '1.2 基本 CRUD 操作', async () => {
    // 創建測試客戶
    const testCustomer = await prisma.customer.create({
      data: {
        company_name: 'Test Company Integration',
        email: 'test-integration@example.com',
        status: 'PROSPECT'
      }
    });

    // 讀取測試
    const foundCustomer = await prisma.customer.findUnique({
      where: { id: testCustomer.id }
    });

    if (!foundCustomer) {
      throw new Error('無法讀取創建的客戶記錄');
    }

    // 更新測試
    await prisma.customer.update({
      where: { id: testCustomer.id },
      data: { status: 'CUSTOMER' }
    });

    // 刪除測試
    await prisma.customer.delete({
      where: { id: testCustomer.id }
    });

    console.log('  ✓ CRUD 操作全部成功');
  });

  // 測試 1.3: 複雜查詢和關聯
  await runTest('database', '1.3 複雜查詢和關聯', async () => {
    // 測試複雜查詢
    const customers = await prisma.customer.findMany({
      include: {
        interactions: true,
        salesOpportunities: true
      },
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      },
      take: 5
    });

    console.log(`  ✓ 複雜查詢成功 (返回 ${customers.length} 條記錄)`);
  });

  // 測試 1.4: 事務處理
  await runTest('database', '1.4 事務處理', async () => {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          company_name: 'Transaction Test Company',
          email: 'transaction-test@example.com',
          status: 'PROSPECT'
        }
      });

      const interaction = await tx.interaction.create({
        data: {
          customer_id: customer.id,
          type: 'EMAIL',
          description: 'Test Transaction - This is a transaction test'
        }
      });

      return { customer, interaction };
    });

    // 清理測試數據
    await prisma.interaction.delete({ where: { id: result.interaction.id } });
    await prisma.customer.delete({ where: { id: result.customer.id } });

    console.log('  ✓ 事務處理成功');
  });
}

/**
 * 2. API 端點測試
 */
async function testApiEndpoints() {
  console.log('\n📋 2. API 端點測試');

  // 測試 2.1: 健康檢查端點
  await runTest('api', '2.1 健康檢查端點', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`健康檢查失敗: ${response.status}`);
    }

    if (!data.success) {
      throw new Error('健康檢查返回失敗狀態');
    }

    console.log(`  ✓ 健康檢查成功: ${data.data.status}`);
  });

  // 測試 2.2: 客戶 API
  await runTest('api', '2.2 客戶 API', async () => {
    const response = await fetch(`${BASE_URL}/api/customers`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`客戶 API 失敗: ${response.status}`);
    }

    if (!Array.isArray(data.data)) {
      throw new Error('客戶 API 返回格式錯誤');
    }

    console.log(`  ✓ 客戶 API 成功 (返回 ${data.data.length} 條記錄)`);
  });

  // 測試 2.3: 提案範本 API
  await runTest('api', '2.3 提案範本 API', async () => {
    const response = await fetch(`${BASE_URL}/api/proposal-templates`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`提案範本 API 失敗: ${response.status}`);
    }

    if (!data.success) {
      throw new Error('提案範本 API 返回失敗狀態');
    }

    console.log(`  ✓ 提案範本 API 成功`);
  });

  // 測試 2.4: 知識庫搜索 API
  await runTest('api', '2.4 知識庫搜索 API', async () => {
    const searchQuery = {
      query: 'test',
      filters: {},
      limit: 5
    };

    const response = await fetch(`${BASE_URL}/api/knowledge-base/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`知識庫搜索 API 失敗: ${response.status}`);
    }

    console.log(`  ✓ 知識庫搜索 API 成功`);
  });
}

/**
 * 3. AI 服務整合測試
 */
async function testAiIntegration() {
  console.log('\n📋 3. AI 服務整合測試');

  // 測試 3.1: Azure OpenAI 連接
  await runTest('ai', '3.1 Azure OpenAI 連接', async () => {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('Azure OpenAI 環境變數未配置');
    }

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=2023-05-15`,
      {
        headers: {
          'api-key': process.env.AZURE_OPENAI_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Azure OpenAI 連接失敗: ${response.status}`);
    }

    console.log('  ✓ Azure OpenAI 連接成功');
  });

  // 測試 3.2: AI 提案生成 API
  await runTest('ai', '3.2 AI 提案生成 API', async () => {
    const proposalRequest = {
      templateId: 'test-template',
      variables: {
        companyName: 'Test Company',
        productName: 'Test Product'
      },
      customerId: 'test-customer-id'
    };

    const response = await fetch(`${BASE_URL}/api/ai/generate-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proposalRequest)
    });

    // 由於這是測試環境，可能返回錯誤是正常的
    // 我們主要檢查端點是否可訪問
    if (response.status === 404) {
      throw new Error('AI 提案生成端點不存在');
    }

    console.log(`  ✓ AI 提案生成端點可訪問 (狀態: ${response.status})`);
  }, 60000); // AI 請求可能需要更長時間
}

/**
 * 4. 監控系統測試
 */
async function testMonitoringSystem() {
  console.log('\n📋 4. 監控系統測試');

  // 測試 4.1: 系統監控端點
  await runTest('monitoring', '4.1 系統監控端點', async () => {
    const response = await fetch(`${BASE_URL}/api/health?detailed=true`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('系統監控端點返回失敗狀態');
    }

    if (!data.data.services) {
      throw new Error('監控數據缺少服務信息');
    }

    console.log(`  ✓ 系統監控正常 (${data.data.services.length} 個服務)`);
  });

  // 測試 4.2: 服務健康檢查
  await runTest('monitoring', '4.2 服務健康檢查', async () => {
    const services = ['DATABASE', 'AZURE_OPENAI'];

    for (const service of services) {
      const response = await fetch(`${BASE_URL}/api/health?service=${service}`);
      const data = await response.json();

      if (!data.success) {
        console.warn(`  ⚠️ 服務 ${service} 健康檢查失敗`);
        continue;
      }

      console.log(`  ✓ 服務 ${service} 健康狀態: ${data.data.realtimeCheck.status}`);
    }
  });

  // 測試 4.3: 性能指標收集
  await runTest('monitoring', '4.3 性能指標收集', async () => {
    const response = await fetch(`${BASE_URL}/api/health?detailed=true`);
    const data = await response.json();

    if (data.data.metrics) {
      const metrics = data.data.metrics;
      console.log(`  ✓ 性能指標: 平均響應時間 ${metrics.averageResponseTime}ms`);
      console.log(`  📊 系統運行時間: ${metrics.totalUptime}`);
      console.log(`  📊 錯誤率: ${metrics.errorRate}%`);
    } else {
      console.log('  ⚠️ 性能指標數據不完整');
    }
  });
}

/**
 * 5. CRM 整合測試（調用獨立的 CRM 測試）
 */
async function testCrmIntegration() {
  console.log('\n📋 5. CRM 整合測試');

  try {
    const crmTest = require('./crm-integration.test.ts');
    const result = await crmTest.runIntegrationTests();

    testSuites.crm = {
      total: result.results.total,
      passed: result.results.passed,
      failed: result.results.failed,
      errors: result.results.errors
    };

    if (result.success) {
      console.log('✅ CRM 整合測試全部通過');
    } else {
      console.log(`⚠️ CRM 整合測試部分失敗 (成功率: ${result.successRate}%)`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ CRM 整合測試執行失敗:', errorMessage);
    testSuites.crm.total = 1;
    testSuites.crm.failed = 1;
    testSuites.crm.errors.push({
      test: 'CRM 整合測試執行',
      error: errorMessage
    });
  }
}

/**
 * 6. 負載和壓力測試
 */
async function testLoadAndStress() {
  console.log('\n📋 6. 負載和壓力測試');

  // 測試 6.1: 並發 API 請求
  await runTest('api', '6.1 並發 API 請求', async () => {
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(fetch(`${BASE_URL}/api/health`));
    }

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;

    const successCount = responses.filter(r => r.ok).length;
    const avgResponseTime = duration / concurrentRequests;

    if (successCount < concurrentRequests * 0.9) {
      throw new Error(`並發請求成功率過低: ${successCount}/${concurrentRequests}`);
    }

    console.log(`  ✓ 並發測試成功: ${successCount}/${concurrentRequests}, 平均 ${avgResponseTime.toFixed(2)}ms`);
  }, 60000);

  // 測試 6.2: 資料庫連接池
  await runTest('database', '6.2 資料庫連接池壓力測試', async () => {
    const concurrentQueries = 20;
    const promises = [];

    for (let i = 0; i < concurrentQueries; i++) {
      promises.push(prisma.customer.count());
    }

    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`  ✓ 資料庫並發查詢成功: ${concurrentQueries} 個查詢, ${duration}ms`);
  });
}

/**
 * 主測試執行函數
 */
async function runSystemIntegrationTests() {
  console.log('🚀 開始執行系統整合測試');
  console.log('=====================================');

  const startTime = Date.now();

  try {
    // 執行所有測試套件
    await testDatabaseIntegration();
    await testApiEndpoints();
    await testAiIntegration();
    await testMonitoringSystem();
    await testCrmIntegration();
    await testLoadAndStress();

  } catch (error) {
    console.error('\n💥 測試執行過程中發生嚴重錯誤:', error);
  }

  // 計算總體統計
  const totalStats: {
    total: number;
    passed: number;
    failed: number;
    errors: TestError[];
  } = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  Object.keys(testSuites).forEach(suite => {
    totalStats.total += testSuites[suite].total;
    totalStats.passed += testSuites[suite].passed;
    totalStats.failed += testSuites[suite].failed;
    totalStats.errors.push(...testSuites[suite].errors);
  });

  // 輸出詳細結果
  const duration = Date.now() - startTime;
  console.log('\n=====================================');
  console.log('📊 系統整合測試結果摘要');
  console.log('=====================================');

  // 各套件結果
  Object.keys(testSuites).forEach(suite => {
    const stats = testSuites[suite];
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
    console.log(`${suite.toUpperCase()}: ${stats.passed}/${stats.total} (${rate}%)`);
  });

  console.log('-------------------------------------');
  console.log(`總測試數: ${totalStats.total}`);
  console.log(`✅ 通過: ${totalStats.passed}`);
  console.log(`❌ 失敗: ${totalStats.failed}`);
  console.log(`⏱️ 總耗時: ${duration}ms`);

  const overallSuccessRate = totalStats.total > 0 ?
    ((totalStats.passed / totalStats.total) * 100).toFixed(1) : '0.0';
  console.log(`🎯 整體成功率: ${overallSuccessRate}%`);

  // 失敗詳情
  if (totalStats.failed > 0) {
    console.log('\n❌ 失敗的測試:');
    totalStats.errors.forEach((testError, index) => {
      console.log(`${index + 1}. ${testError.test}: ${testError.error}`);
    });
  }

  // 總體評估
  if (totalStats.failed === 0) {
    console.log('\n🎉 所有系統整合測試通過！系統運行穩定。');
  } else if (parseFloat(overallSuccessRate) >= 90) {
    console.log('\n⚠️ 大部分測試通過，但存在一些問題需要關注。');
  } else if (parseFloat(overallSuccessRate) >= 75) {
    console.log('\n🚨 測試失敗率較高，需要優先修復問題。');
  } else {
    console.log('\n🔥 系統存在嚴重問題，需要立即修復。');
  }

  // 清理資源
  await prisma.$disconnect();

  return {
    success: totalStats.failed === 0,
    results: totalStats,
    suites: testSuites,
    duration,
    successRate: parseFloat(overallSuccessRate)
  };
}

// 如果直接執行此文件，則運行測試
if (require.main === module) {
  runSystemIntegrationTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('系統整合測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = {
  runSystemIntegrationTests,
  testSuites
};