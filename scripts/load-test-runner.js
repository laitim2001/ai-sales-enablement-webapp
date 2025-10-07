/**
 * MVP2 負載測試運行器
 * 使用 autocannon 進行HTTP負載測試
 *
 * 測試場景:
 * 1. 煙霧測試 (Smoke Test): 10用戶, 5分鐘
 * 2. 負載測試 (Load Test): 100→300→500用戶
 * 3. 壓力測試 (Stress Test): 700→1000用戶
 *
 * 使用方法:
 * node scripts/load-test-runner.js [test-type]
 *
 * test-type: smoke | load | stress | all
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  baseUrl: process.env.LOAD_TEST_URL || 'http://localhost:3005',
  reportDir: './load-test-results',

  // JWT Token (需要定期更新)
  token: process.env.LOAD_TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJqdGkiOiI5NDYxZGE4MC1iOWRmLTQzYTQtYjRhNy1hOTEwMTE4MTZkMGMiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5ODQwMjg3LCJleHAiOjE3NTk4NDExODcsImF1ZCI6ImFpLXNhbGVzLXVzZXJzIiwiaXNzIjoiYWktc2FsZXMtcGxhdGZvcm0ifQ.kKij3NfGJerjekOUTw9zD6zgWrDgQQLhm0YtGNXkhTQ',

  // 測試場景配置
  scenarios: {
    smoke: {
      connections: 10,
      duration: 300, // 5分鐘
      pipelining: 1,
      title: '煙霧測試 (Smoke Test)'
    },
    load_stage1: {
      connections: 100,
      duration: 600, // 10分鐘
      pipelining: 1,
      title: '負載測試 Stage 1 - 100用戶'
    },
    load_stage2: {
      connections: 300,
      duration: 600, // 10分鐘
      pipelining: 1,
      title: '負載測試 Stage 2 - 300用戶'
    },
    load_stage3: {
      connections: 500,
      duration: 900, // 15分鐘
      pipelining: 1,
      title: '負載測試 Stage 3 - 500用戶'
    },
    stress_stage1: {
      connections: 700,
      duration: 600, // 10分鐘
      pipelining: 1,
      title: '壓力測試 Stage 1 - 700用戶'
    },
    stress_stage2: {
      connections: 1000,
      duration: 600, // 10分鐘
      pipelining: 1,
      title: '壓力測試 Stage 2 - 1000用戶'
    }
  },

  // API端點配置
  endpoints: {
    // 70% - 用戶登入和瀏覽
    browse: {
      weight: 0.7,
      requests: [
        {
          method: 'GET',
          path: '/api/knowledge-base',
          setupRequest: (req) => {
            req.headers = {
              'Authorization': `Bearer ${CONFIG.token}`,
              'Content-Type': 'application/json'
            };
            return req;
          }
        }
      ]
    },
    // 20% - 知識庫搜索
    search: {
      weight: 0.2,
      requests: [
        {
          method: 'GET',
          path: '/api/knowledge-base/search?query=產品&limit=10',
          setupRequest: (req) => {
            req.headers = {
              'Authorization': `Bearer ${CONFIG.token}`,
              'Content-Type': 'application/json'
            };
            return req;
          }
        }
      ]
    },
    // 10% - AI助理對話
    aiChat: {
      weight: 0.1,
      requests: [
        {
          method: 'POST',
          path: '/api/assistant/chat',
          body: JSON.stringify({
            message: '幫我準備明天的會議',
            sessionId: 'load-test-session'
          }),
          setupRequest: (req) => {
            req.headers = {
              'Authorization': `Bearer ${CONFIG.token}`,
              'Content-Type': 'application/json'
            };
            return req;
          }
        }
      ]
    }
  }
};

// ============================================================================
// 工具函數
// ============================================================================

function ensureReportDir() {
  if (!fs.existsSync(CONFIG.reportDir)) {
    fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  }
}

function saveReport(testName, results) {
  ensureReportDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName}_${timestamp}.json`;
  const filepath = path.join(CONFIG.reportDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n📄 測試報告已保存: ${filepath}`);
}

function printSummary(testName, results) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 ${testName} - 測試結果摘要`);
  console.log('='.repeat(80));
  console.log(`🎯 測試時長: ${results.duration}秒`);
  console.log(`📈 總請求數: ${results.requests.total}`);
  console.log(`✅ 成功請求: ${results.requests.total - results.errors}`);
  console.log(`❌ 失敗請求: ${results.errors}`);
  console.log(`📊 錯誤率: ${((results.errors / results.requests.total) * 100).toFixed(2)}%`);
  console.log(`\n⏱️  響應時間統計:`);
  console.log(`   - 平均: ${results.latency.mean.toFixed(2)}ms`);
  console.log(`   - P50: ${results.latency.p50}ms`);
  console.log(`   - P95: ${results.latency.p95}ms`);
  console.log(`   - P99: ${results.latency.p99}ms`);
  console.log(`   - 最大: ${results.latency.max}ms`);
  console.log(`\n🔄 吞吐量:`);
  console.log(`   - RPS (每秒請求): ${results.requests.average.toFixed(2)}`);
  console.log(`   - 帶寬: ${(results.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
  console.log('='.repeat(80));

  // 性能評估
  const passed = evaluatePerformance(results);
  if (passed) {
    console.log('✅ 測試通過 - 所有性能指標達標');
  } else {
    console.log('❌ 測試失敗 - 部分性能指標未達標');
  }
  console.log('='.repeat(80) + '\n');
}

function evaluatePerformance(results) {
  const criteria = {
    errorRate: (results.errors / results.requests.total) * 100 < 1, // < 1%
    p95Latency: results.latency.p95 < 2000, // < 2秒
    p99Latency: results.latency.p99 < 5000, // < 5秒
    rps: results.requests.average > 100 // > 100 RPS
  };

  console.log('\n📋 性能標準檢查:');
  console.log(`   ${criteria.errorRate ? '✅' : '❌'} 錯誤率 < 1%: ${((results.errors / results.requests.total) * 100).toFixed(2)}%`);
  console.log(`   ${criteria.p95Latency ? '✅' : '❌'} P95 < 2000ms: ${results.latency.p95}ms`);
  console.log(`   ${criteria.p99Latency ? '✅' : '❌'} P99 < 5000ms: ${results.latency.p99}ms`);
  console.log(`   ${criteria.rps ? '✅' : '❌'} RPS > 100: ${results.requests.average.toFixed(2)}`);

  return Object.values(criteria).every(v => v === true);
}

// ============================================================================
// 測試執行函數
// ============================================================================

async function runTest(scenarioName, endpoint = 'browse') {
  const scenario = CONFIG.scenarios[scenarioName];
  const endpointConfig = CONFIG.endpoints[endpoint];

  if (!scenario) {
    throw new Error(`未知測試場景: ${scenarioName}`);
  }

  if (!endpointConfig) {
    throw new Error(`未知API端點: ${endpoint}`);
  }

  console.log(`\n🚀 開始執行: ${scenario.title}`);
  console.log(`📊 配置: ${scenario.connections}連接, ${scenario.duration}秒`);
  console.log(`🎯 端點: ${endpoint}`);

  const request = endpointConfig.requests[0];
  const url = `${CONFIG.baseUrl}${request.path}`;

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections: scenario.connections,
      duration: scenario.duration,
      pipelining: scenario.pipelining,
      method: request.method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: request.body,
      setupClient: (client) => {
        client.on('response', (statusCode, resBytes, responseTime) => {
          // 可以在這裡添加自定義響應處理
        });
      }
    }, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });

    // 實時進度顯示
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function runSmokeTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🔥 煙霧測試 (Smoke Test)');
  console.log('='.repeat(80));

  const results = await runTest('smoke', 'browse');
  printSummary('煙霧測試', results);
  saveReport('smoke-test', results);

  return results;
}

async function runLoadTest() {
  console.log('\n' + '='.repeat(80));
  console.log('📈 負載測試 (Load Test)');
  console.log('='.repeat(80));

  const allResults = [];

  // Stage 1: 100用戶
  console.log('\n--- Stage 1: 100並發用戶 ---');
  let results = await runTest('load_stage1', 'browse');
  printSummary('負載測試 Stage 1', results);
  saveReport('load-test-stage1', results);
  allResults.push(results);

  // 等待30秒讓系統穩定
  console.log('\n⏳ 等待30秒讓系統穩定...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Stage 2: 300用戶
  console.log('\n--- Stage 2: 300並發用戶 ---');
  results = await runTest('load_stage2', 'browse');
  printSummary('負載測試 Stage 2', results);
  saveReport('load-test-stage2', results);
  allResults.push(results);

  // 等待30秒讓系統穩定
  console.log('\n⏳ 等待30秒讓系統穩定...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Stage 3: 500用戶
  console.log('\n--- Stage 3: 500並發用戶 ---');
  results = await runTest('load_stage3', 'browse');
  printSummary('負載測試 Stage 3', results);
  saveReport('load-test-stage3', results);
  allResults.push(results);

  return allResults;
}

async function runStressTest() {
  console.log('\n' + '='.repeat(80));
  console.log('💥 壓力測試 (Stress Test)');
  console.log('='.repeat(80));

  const allResults = [];

  // Stage 1: 700用戶
  console.log('\n--- Stage 1: 700並發用戶 ---');
  let results = await runTest('stress_stage1', 'browse');
  printSummary('壓力測試 Stage 1', results);
  saveReport('stress-test-stage1', results);
  allResults.push(results);

  // 等待30秒讓系統穩定
  console.log('\n⏳ 等待30秒讓系統穩定...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Stage 2: 1000用戶
  console.log('\n--- Stage 2: 1000並發用戶 ---');
  results = await runTest('stress_stage2', 'browse');
  printSummary('壓力測試 Stage 2', results);
  saveReport('stress-test-stage2', results);
  allResults.push(results);

  return allResults;
}

// ============================================================================
// 主程序
// ============================================================================

async function main() {
  const testType = process.argv[2] || 'smoke';

  console.log('\n' + '='.repeat(80));
  console.log('🚀 MVP2 負載測試運行器');
  console.log('='.repeat(80));
  console.log(`📅 開始時間: ${new Date().toISOString()}`);
  console.log(`🎯 測試類型: ${testType}`);
  console.log(`🌐 目標URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(80));

  try {
    switch (testType) {
      case 'smoke':
        await runSmokeTest();
        break;

      case 'load':
        await runLoadTest();
        break;

      case 'stress':
        await runStressTest();
        break;

      case 'all':
        console.log('\n🔥 執行完整測試套件...\n');
        await runSmokeTest();
        console.log('\n⏳ 等待60秒後開始負載測試...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        await runLoadTest();
        console.log('\n⏳ 等待60秒後開始壓力測試...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        await runStressTest();
        break;

      default:
        console.error(`\n❌ 未知測試類型: ${testType}`);
        console.log('\n可用測試類型: smoke, load, stress, all');
        process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 測試執行完成');
    console.log(`📅 結束時間: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ 測試執行失敗:', error);
    process.exit(1);
  }
}

// 執行主程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTest,
  runSmokeTest,
  runLoadTest,
  runStressTest
};
