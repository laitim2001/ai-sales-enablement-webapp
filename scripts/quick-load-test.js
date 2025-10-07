/**
 * 快速負載測試 - 用於驗證系統基本性能
 * 短時間測試: 30秒，模擬不同負載級別
 */

const autocannon = require('autocannon');

const CONFIG = {
  baseUrl: process.env.LOAD_TEST_URL || 'http://localhost:3005',
  token: process.env.LOAD_TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJqdGkiOiI5NDYxZGE4MC1iOWRmLTQzYTQtYjRhNy1hOTEwMTE4MTZkMGMiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5ODQwMjg3LCJleHAiOjE3NTk4NDExODcsImF1ZCI6ImFpLXNhbGVzLXVzZXJzIiwiaXNzIjoiYWktc2FsZXMtcGxhdGZvcm0ifQ.kKij3NfGJerjekOUTw9zD6zgWrDgQQLhm0YtGNXkhTQ'
};

// 測試場景
const scenarios = [
  { name: '輕量負載', connections: 10, duration: 30 },
  { name: '中度負載', connections: 50, duration: 30 },
  { name: '高度負載', connections: 100, duration: 30 }
];

async function runQuickTest(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 執行快速測試: ${scenario.name}`);
  console.log(`   並發連接: ${scenario.connections}`);
  console.log(`   測試時長: ${scenario.duration}秒`);
  console.log(`${'='.repeat(60)}\n`);

  const instance = autocannon({
    url: `${CONFIG.baseUrl}/api/knowledge-base`,
    connections: scenario.connections,
    duration: scenario.duration,
    headers: {
      'Authorization': `Bearer ${CONFIG.token}`,
      'Content-Type': 'application/json'
    },
    requests: [
      {
        method: 'GET',
        path: '/api/knowledge-base?page=1&limit=10'
      }
    ]
  });

  autocannon.track(instance, {renderProgressBar: true});

  return new Promise((resolve, reject) => {
    instance.on('done', (result) => {
      console.log(`\n📊 測試結果 - ${scenario.name}:`);
      console.log(`   總請求: ${result.requests.total}`);
      console.log(`   成功: ${result.requests.total - result.errors}`);
      console.log(`   錯誤: ${result.errors}`);
      console.log(`   錯誤率: ${((result.errors / result.requests.total) * 100).toFixed(2)}%`);
      console.log(`   平均響應時間: ${result.latency.mean.toFixed(2)}ms`);
      console.log(`   P50: ${result.latency.p50}ms`);
      console.log(`   P95: ${result.latency.p95}ms`);
      console.log(`   P99: ${result.latency.p99}ms`);
      console.log(`   RPS: ${result.requests.average.toFixed(2)}`);
      console.log(`   吞吐量: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);

      // 性能評估
      const criteria = {
        errorRate: (result.errors / result.requests.total) * 100 < 1,
        p95Latency: result.latency.p95 < 2000,
        p99Latency: result.latency.p99 < 5000
      };

      console.log(`\n   ✅ 錯誤率 < 1%: ${criteria.errorRate ? '通過' : '未通過'}`);
      console.log(`   ✅ P95 < 2000ms: ${criteria.p95Latency ? '通過' : '未通過'}`);
      console.log(`   ✅ P99 < 5000ms: ${criteria.p99Latency ? '通過' : '未通過'}`);

      const allPassed = Object.values(criteria).every(v => v === true);
      console.log(`\n   ${allPassed ? '✅ 測試通過' : '⚠️ 測試未達標準'}`);

      resolve({ scenario: scenario.name, result, passed: allPassed });
    });

    instance.on('error', reject);
  });
}

async function main() {
  console.log('\n🚀 開始快速負載測試...\n');
  console.log(`目標URL: ${CONFIG.baseUrl}`);
  console.log(`Token配置: ${CONFIG.token ? '已設置' : '未設置'}\n`);

  const results = [];

  for (const scenario of scenarios) {
    try {
      const result = await runQuickTest(scenario);
      results.push(result);

      // 冷卻期
      if (scenario !== scenarios[scenarios.length - 1]) {
        console.log('\n⏱️  冷卻期 10秒...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error(`\n❌ 測試失敗 - ${scenario.name}:`, error.message);
      results.push({ scenario: scenario.name, error: error.message, passed: false });
    }
  }

  // 總結報告
  console.log('\n' + '='.repeat(60));
  console.log('📊 快速負載測試總結');
  console.log('='.repeat(60));

  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.scenario}: ${r.passed ? '✅ 通過' : '❌ 未通過'}`);
    if (r.error) {
      console.log(`   錯誤: ${r.error}`);
    } else if (r.result) {
      console.log(`   平均RPS: ${r.result.requests.average.toFixed(2)}`);
      console.log(`   P95延遲: ${r.result.latency.p95}ms`);
      console.log(`   錯誤率: ${((r.result.errors / r.result.requests.total) * 100).toFixed(2)}%`);
    }
  });

  const passCount = results.filter(r => r.passed).length;
  console.log(`\n總體評估: ${passCount}/${results.length} 測試通過`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
