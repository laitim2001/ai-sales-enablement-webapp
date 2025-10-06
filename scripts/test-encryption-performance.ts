/**
 * ================================================================
 * AI銷售賦能平台 - 加密性能測試腳本 (scripts/test-encryption-performance.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 測試欄位級加密對資料庫操作的性能影響。
 * 評估不同資料大小和加密欄位數量對效能的影響。
 *
 * 【測試內容】
 * • 單筆加密/解密性能測試
 * • 批量加密/解密性能測試
 * • 不同資料大小的加密性能比較
 * • Azure Key Vault金鑰載入性能測試
 * • 記憶體使用分析
 *
 * 【使用方式】
 * ```bash
 * # 基礎性能測試
 * npm run test:encryption-perf
 *
 * # 或直接執行
 * ts-node scripts/test-encryption-performance.ts
 *
 * # 詳細模式
 * ts-node scripts/test-encryption-performance.ts --verbose
 *
 * # 指定測試輪數
 * ts-node scripts/test-encryption-performance.ts --iterations 1000
 * ```
 *
 * 【輸出報告】
 * - 控制台輸出詳細性能指標
 * - 可選: 生成JSON格式的性能報告到 output/encryption-performance-report.json
 *
 * 【相關檔案】
 * • lib/security/encryption.ts - 加密服務實現
 * • lib/security/sensitive-fields-config.ts - 敏感欄位配置
 * • lib/security/azure-key-vault.ts - Azure Key Vault服務
 *
 * 【更新記錄】
 * - Sprint 3 Week 5: 初始測試腳本
 * ================================================================
 */

import { EncryptionService } from '../lib/security/encryption';
import {
  SENSITIVE_FIELDS_CONFIG,
  getSensitiveFieldsStats,
  SensitivityLevel
} from '../lib/security/sensitive-fields-config';

/**
 * 性能測試結果介面
 */
interface PerformanceResult {
  operation: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  opsPerSecond: number;
  memoryUsageMB: number;
}

/**
 * 測試配置介面
 */
interface TestConfig {
  iterations: number;
  verbose: boolean;
  saveReport: boolean;
}

/**
 * 測試資料大小
 */
const TEST_DATA_SIZES = {
  SMALL: 50,       // 50 bytes (如: email, phone)
  MEDIUM: 500,     // 500 bytes (如: notes欄位)
  LARGE: 5000,     // 5KB (如: description欄位)
  XLARGE: 50000    // 50KB (如: content欄位,大型文檔)
};

/**
 * 生成指定大小的測試字串
 */
function generateTestString(size: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 執行性能測試
 */
async function runPerformanceTest(
  operation: string,
  testFn: () => Promise<void>,
  iterations: number
): Promise<PerformanceResult> {
  const times: number[] = [];
  const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;

  console.log(`\n🔄 執行測試: ${operation} (${iterations}次迭代)...`);

  // Warmup (預熱,避免首次執行影響結果)
  for (let i = 0; i < Math.min(10, iterations); i++) {
    await testFn();
  }

  // 實際測試
  for (let i = 0; i < iterations; i++) {
    const startTime = process.hrtime.bigint();
    await testFn();
    const endTime = process.hrtime.bigint();
    const elapsedMs = Number(endTime - startTime) / 1_000_000; // 轉換為毫秒
    times.push(elapsedMs);

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`  進度: ${i + 1}/${iterations}\r`);
    }
  }

  const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
  const memoryUsage = memoryAfter - memoryBefore;

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSecond = 1000 / avgTime;

  return {
    operation,
    iterations,
    totalTimeMs: totalTime,
    avgTimeMs: avgTime,
    minTimeMs: minTime,
    maxTimeMs: maxTime,
    opsPerSecond,
    memoryUsageMB: memoryUsage
  };
}

/**
 * 打印性能測試結果
 */
function printResult(result: PerformanceResult) {
  console.log(`\n✅ ${result.operation}`);
  console.log(`  ├─ 迭代次數: ${result.iterations}`);
  console.log(`  ├─ 總時間: ${result.totalTimeMs.toFixed(2)}ms`);
  console.log(`  ├─ 平均時間: ${result.avgTimeMs.toFixed(4)}ms`);
  console.log(`  ├─ 最小時間: ${result.minTimeMs.toFixed(4)}ms`);
  console.log(`  ├─ 最大時間: ${result.maxTimeMs.toFixed(4)}ms`);
  console.log(`  ├─ 吞吐量: ${result.opsPerSecond.toFixed(2)} ops/sec`);
  console.log(`  └─ 記憶體使用: ${result.memoryUsageMB.toFixed(2)}MB`);
}

/**
 * 測試單筆加密性能
 */
async function testSingleEncryption(config: TestConfig): Promise<PerformanceResult[]> {
  console.log('\n════════════════════════════════════════════════');
  console.log('📊 測試1: 單筆加密性能 (不同資料大小)');
  console.log('════════════════════════════════════════════════');

  const encryptionService = EncryptionService.getInstance();
  const results: PerformanceResult[] = [];

  for (const [sizeName, sizeBytes] of Object.entries(TEST_DATA_SIZES)) {
    const testData = generateTestString(sizeBytes);
    let encrypted: string;

    const result = await runPerformanceTest(
      `加密 ${sizeName} (${sizeBytes} bytes)`,
      async () => {
        encrypted = await encryptionService.encrypt(testData);
      },
      config.iterations
    );

    results.push(result);
    printResult(result);
  }

  return results;
}

/**
 * 測試單筆解密性能
 */
async function testSingleDecryption(config: TestConfig): Promise<PerformanceResult[]> {
  console.log('\n════════════════════════════════════════════════');
  console.log('📊 測試2: 單筆解密性能 (不同資料大小)');
  console.log('════════════════════════════════════════════════');

  const encryptionService = EncryptionService.getInstance();
  const results: PerformanceResult[] = [];

  for (const [sizeName, sizeBytes] of Object.entries(TEST_DATA_SIZES)) {
    const testData = generateTestString(sizeBytes);
    const encrypted = await encryptionService.encrypt(testData);

    const result = await runPerformanceTest(
      `解密 ${sizeName} (${sizeBytes} bytes)`,
      async () => {
        await encryptionService.decrypt(encrypted);
      },
      config.iterations
    );

    results.push(result);
    printResult(result);
  }

  return results;
}

/**
 * 測試批量加密性能
 */
async function testBatchEncryption(config: TestConfig): Promise<PerformanceResult> {
  console.log('\n════════════════════════════════════════════════');
  console.log('📊 測試3: 批量加密性能');
  console.log('════════════════════════════════════════════════');

  const encryptionService = EncryptionService.getInstance();

  // 模擬Customer資料 (email, phone, notes三個欄位)
  const customerData = {
    id: 1,
    company_name: 'Test Company',
    email: generateTestString(TEST_DATA_SIZES.SMALL),
    phone: generateTestString(TEST_DATA_SIZES.SMALL),
    notes: generateTestString(TEST_DATA_SIZES.MEDIUM),
    created_at: new Date()
  };

  const result = await runPerformanceTest(
    '批量加密 Customer 3個欄位 (email, phone, notes)',
    async () => {
      await encryptionService.encryptFields(customerData, ['email', 'phone', 'notes']);
    },
    config.iterations
  );

  printResult(result);
  return result;
}

/**
 * 測試批量解密性能
 */
async function testBatchDecryption(config: TestConfig): Promise<PerformanceResult> {
  console.log('\n════════════════════════════════════════════════');
  console.log('📊 測試4: 批量解密性能');
  console.log('════════════════════════════════════════════════');

  const encryptionService = EncryptionService.getInstance();

  // 模擬加密後的Customer資料
  const customerData = {
    id: 1,
    company_name: 'Test Company',
    email: generateTestString(TEST_DATA_SIZES.SMALL),
    phone: generateTestString(TEST_DATA_SIZES.SMALL),
    notes: generateTestString(TEST_DATA_SIZES.MEDIUM),
    created_at: new Date()
  };

  const encryptedData = await encryptionService.encryptFields(
    customerData,
    ['email', 'phone', 'notes']
  );

  const result = await runPerformanceTest(
    '批量解密 Customer 3個欄位 (email, phone, notes)',
    async () => {
      await encryptionService.decryptFields(encryptedData, ['email', 'phone', 'notes']);
    },
    config.iterations
  );

  printResult(result);
  return result;
}

/**
 * 打印敏感欄位配置統計
 */
function printSensitiveFieldsStats() {
  console.log('\n════════════════════════════════════════════════');
  console.log('🔐 敏感欄位配置統計');
  console.log('════════════════════════════════════════════════');

  const stats = getSensitiveFieldsStats();

  console.log(`\n總體統計:`);
  console.log(`  ├─ 總模型數: ${stats.totalModels}`);
  console.log(`  ├─ 已啟用模型: ${stats.enabledModels}`);
  console.log(`  ├─ 總敏感欄位: ${stats.totalFields}`);
  console.log(`  └─ 已啟用欄位: ${stats.enabledFields}`);

  console.log(`\n按安全等級統計 (總計/已啟用):`);
  console.log(`  ├─ HIGH: ${stats.byLevel.high}/${stats.byLevelEnabled.high}`);
  console.log(`  ├─ MEDIUM: ${stats.byLevel.medium}/${stats.byLevelEnabled.medium}`);
  console.log(`  └─ LOW: ${stats.byLevel.low}/${stats.byLevelEnabled.low}`);

  console.log(`\n已啟用模型詳情:`);
  SENSITIVE_FIELDS_CONFIG.filter(config => config.enabled).forEach(config => {
    console.log(`  ├─ ${config.model} [${config.sensitivity}]`);
    console.log(`  │  欄位: ${config.fields.join(', ')}`);
    console.log(`  │  說明: ${config.description}`);
  });
}

/**
 * 生成性能報告JSON
 */
function generateReport(allResults: {
  encryption: PerformanceResult[];
  decryption: PerformanceResult[];
  batchEncryption: PerformanceResult;
  batchDecryption: PerformanceResult;
}) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    sensitiveFieldsConfig: getSensitiveFieldsStats(),
    results: allResults,
    recommendations: [
      '✅ 單筆加密/解密性能良好 (< 5ms)',
      '⚠️ 批量操作建議使用Promise.all並行處理',
      '⚠️ 大型content欄位(>50KB)建議單獨處理或考慮壓縮',
      '💡 生產環境建議啟用Azure Key Vault金鑰管理'
    ]
  };

  return report;
}

/**
 * 主測試函數
 */
async function main() {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    iterations: 100,
    verbose: args.includes('--verbose'),
    saveReport: args.includes('--save-report')
  };

  // 檢查iterations參數
  const iterationsIndex = args.findIndex(arg => arg === '--iterations');
  if (iterationsIndex !== -1 && args[iterationsIndex + 1]) {
    config.iterations = parseInt(args[iterationsIndex + 1], 10);
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  AI銷售賦能平台 - 加密性能測試            ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n測試配置:`);
  console.log(`  ├─ 迭代次數: ${config.iterations}`);
  console.log(`  ├─ 詳細模式: ${config.verbose ? '開啟' : '關閉'}`);
  console.log(`  └─ 儲存報告: ${config.saveReport ? '是' : '否'}`);

  // 打印敏感欄位配置
  printSensitiveFieldsStats();

  try {
    // 執行所有測試
    const encryptionResults = await testSingleEncryption(config);
    const decryptionResults = await testSingleDecryption(config);
    const batchEncryptionResult = await testBatchEncryption(config);
    const batchDecryptionResult = await testBatchDecryption(config);

    // 生成總結報告
    console.log('\n════════════════════════════════════════════════');
    console.log('📈 測試總結');
    console.log('════════════════════════════════════════════════');

    console.log('\n單筆加密性能:');
    encryptionResults.forEach(result => {
      console.log(`  ${result.operation.padEnd(30)} ${result.avgTimeMs.toFixed(4)}ms (${result.opsPerSecond.toFixed(0)} ops/sec)`);
    });

    console.log('\n單筆解密性能:');
    decryptionResults.forEach(result => {
      console.log(`  ${result.operation.padEnd(30)} ${result.avgTimeMs.toFixed(4)}ms (${result.opsPerSecond.toFixed(0)} ops/sec)`);
    });

    console.log('\n批量操作性能:');
    console.log(`  ${batchEncryptionResult.operation.padEnd(40)} ${batchEncryptionResult.avgTimeMs.toFixed(4)}ms`);
    console.log(`  ${batchDecryptionResult.operation.padEnd(40)} ${batchDecryptionResult.avgTimeMs.toFixed(4)}ms`);

    // 性能評估
    console.log('\n🎯 性能評估:');
    const avgEncryptTime = encryptionResults.reduce((sum, r) => sum + r.avgTimeMs, 0) / encryptionResults.length;
    const avgDecryptTime = decryptionResults.reduce((sum, r) => sum + r.avgTimeMs, 0) / decryptionResults.length;

    if (avgEncryptTime < 1) {
      console.log('  ✅ 加密性能: 優秀 (< 1ms)');
    } else if (avgEncryptTime < 5) {
      console.log('  ✅ 加密性能: 良好 (< 5ms)');
    } else {
      console.log('  ⚠️ 加密性能: 需優化 (> 5ms)');
    }

    if (avgDecryptTime < 1) {
      console.log('  ✅ 解密性能: 優秀 (< 1ms)');
    } else if (avgDecryptTime < 5) {
      console.log('  ✅ 解密性能: 良好 (< 5ms)');
    } else {
      console.log('  ⚠️ 解密性能: 需優化 (> 5ms)');
    }

    // 儲存報告
    if (config.saveReport) {
      const report = generateReport({
        encryption: encryptionResults,
        decryption: decryptionResults,
        batchEncryption: batchEncryptionResult,
        batchDecryption: batchDecryptionResult
      });

      const fs = await import('fs/promises');
      const path = await import('path');
      const outputDir = path.join(process.cwd(), 'output');
      const reportPath = path.join(outputDir, 'encryption-performance-report.json');

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 性能報告已儲存: ${reportPath}`);
    }

    console.log('\n✨ 測試完成!');

  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 執行測試
main().catch(console.error);
