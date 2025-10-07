#!/usr/bin/env node

/**
 * @fileoverview 批量代碼註釋生成協調器
 * @module scripts/batch-generate-comments
 * @description
 * 協調大規模批量處理的主控腳本，負責:
 * - 讀取check-code-comments.js生成的文件清單
 * - 按優先級分組文件
 * - 分批處理以避免資源耗盡
 * - 進度追蹤和錯誤恢復
 * - 生成詳細處理報告
 *
 * ### 批處理策略:
 * - 極高優先級: 每批5個文件 (3層分析, 5分鐘/文件)
 * - 高優先級: 每批10個文件 (2層分析, 2分鐘/文件)
 * - 中優先級: 每批10個文件 (2層分析, 2分鐘/文件)
 * - 普通優先級: 每批15個文件 (1層分析, 1分鐘/文件)
 * - 低優先級: 每批20個文件 (1層分析, 30秒/文件)
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

const fs = require('fs');
const path = require('path');
const { batchProcess } = require('./ai-generate-comments');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  // 批次大小（根據優先級）
  batchSizes: {
    critical: 5,   // 極高優先級：小批次，深度分析
    high: 10,      // 高優先級
    medium: 10,    // 中優先級
    normal: 15,    // 普通優先級
    low: 20        // 低優先級：大批次，快速處理
  },

  // 批次間延遲（毫秒）避免資源耗盡
  batchDelay: {
    critical: 5000,  // 5秒
    high: 3000,      // 3秒
    medium: 2000,    // 2秒
    normal: 1000,    // 1秒
    low: 500         // 0.5秒
  },

  // 報告文件路徑
  reportPath: path.join(process.cwd(), 'docs', 'code-comments-generation-report.json'),

  // 詳細報告路徑
  detailedReportPath: path.join(process.cwd(), 'docs', 'code-comments-generation-detailed.json')
};

// ============================================================
// 主要功能
// ============================================================

/**
 * 從check-code-comments.js的報告中讀取缺少註釋的文件
 */
function loadFilesNeedingComments() {
  const reportPath = path.join(process.cwd(), 'docs', 'code-comments-check-report.json');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ 找不到檢查報告: docs/code-comments-check-report.json');
    console.error('請先運行: node scripts/check-code-comments.js');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  // 提取缺少@fileoverview的文件並按優先級分組
  const filesByPriority = {
    critical: [],
    high: [],
    medium: [],
    normal: [],
    low: []
  };

  report.issues.missingFileOverview.forEach(issue => {
    const priority = issue.priority;
    const filePath = path.join(process.cwd(), issue.file);

    if (filesByPriority[priority]) {
      filesByPriority[priority].push(filePath);
    }
  });

  return filesByPriority;
}

/**
 * 將文件數組分割成批次
 */
function createBatches(files, batchSize) {
  const batches = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * 延遲執行
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 處理單個優先級的所有文件
 */
async function processPriorityLevel(priority, files) {
  if (files.length === 0) {
    console.log(`\n⏭️  ${priority}優先級: 無文件需要處理`);
    return {
      priority,
      totalFiles: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      batches: []
    };
  }

  const batchSize = CONFIG.batchSizes[priority];
  const batchDelay = CONFIG.batchDelay[priority];
  const batches = createBatches(files, batchSize);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 處理${priority}優先級 - ${files.length}個文件，${batches.length}個批次`);
  console.log(`📦 批次大小: ${batchSize}, 批次延遲: ${batchDelay}ms`);
  console.log(`${'='.repeat(80)}\n`);

  const results = {
    priority,
    totalFiles: files.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    batches: [],
    startTime: new Date().toISOString(),
    endTime: null
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNum = i + 1;

    console.log(`\n📦 批次 ${batchNum}/${batches.length} (${batch.length}個文件):`);
    console.log(`   ${batch.map(f => path.relative(process.cwd(), f)).join('\n   ')}\n`);

    const startTime = Date.now();

    try {
      const batchResult = batchProcess(batch);

      results.processed += batchResult.processed;
      results.skipped += batchResult.skipped;
      results.failed += batchResult.failed;
      results.batches.push({
        batchNumber: batchNum,
        files: batch.map(f => path.relative(process.cwd(), f)),
        ...batchResult,
        duration: Date.now() - startTime
      });

      console.log(`\n✅ 批次${batchNum}完成: ${batchResult.processed}成功, ${batchResult.skipped}跳過, ${batchResult.failed}失敗`);
      console.log(`   耗時: ${Math.round((Date.now() - startTime) / 1000)}秒`);

    } catch (err) {
      console.error(`\n❌ 批次${batchNum}失敗: ${err.message}`);
      results.failed += batch.length;
      results.batches.push({
        batchNumber: batchNum,
        files: batch.map(f => path.relative(process.cwd(), f)),
        error: err.message,
        duration: Date.now() - startTime
      });
    }

    // 批次間延遲（最後一批不需要）
    if (i < batches.length - 1) {
      console.log(`\n⏸️  等待${batchDelay}ms後處理下一批...`);
      await delay(batchDelay);
    }
  }

  results.endTime = new Date().toISOString();
  return results;
}

/**
 * 生成最終報告
 */
function generateFinalReport(allResults) {
  const totalStats = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      successRate: 0
    },
    byPriority: allResults,
    overallDuration: null
  };

  // 計算總統計
  allResults.forEach(result => {
    totalStats.summary.totalFiles += result.totalFiles;
    totalStats.summary.processed += result.processed;
    totalStats.summary.skipped += result.skipped;
    totalStats.summary.failed += result.failed;
  });

  totalStats.summary.successRate =
    ((totalStats.summary.processed / totalStats.summary.totalFiles) * 100).toFixed(1);

  // 保存報告
  fs.writeFileSync(
    CONFIG.reportPath,
    JSON.stringify(totalStats, null, 2),
    'utf-8'
  );

  return totalStats;
}

/**
 * 打印最終統計
 */
function printFinalStats(stats) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 批量處理完成！');
  console.log(`${'='.repeat(80)}\n`);

  console.log('📊 總體統計:');
  console.log(`   總文件數: ${stats.summary.totalFiles}`);
  console.log(`   ✅ 成功處理: ${stats.summary.processed} (${stats.summary.successRate}%)`);
  console.log(`   ⏭️  跳過: ${stats.summary.skipped}`);
  console.log(`   ❌ 失敗: ${stats.summary.failed}\n`);

  console.log('📋 按優先級統計:');
  stats.byPriority.forEach(result => {
    if (result.totalFiles > 0) {
      const rate = ((result.processed / result.totalFiles) * 100).toFixed(1);
      console.log(`   ${result.priority}: ${result.processed}/${result.totalFiles} (${rate}%) - 失敗:${result.failed}`);
    }
  });

  console.log(`\n📄 詳細報告已保存: ${CONFIG.reportPath}`);
  console.log(`${'='.repeat(80)}\n`);
}

// ============================================================
// 主程序
// ============================================================

async function main() {
  console.log('🚀 AI代碼註釋批量生成開始...\n');

  const startTime = Date.now();

  // 1. 讀取需要處理的文件
  console.log('📋 讀取文件清單...');
  const filesByPriority = loadFilesNeedingComments();

  const totalFiles = Object.values(filesByPriority).reduce((sum, files) => sum + files.length, 0);
  console.log(`✅ 找到${totalFiles}個文件需要處理\n`);

  // 2. 按優先級順序處理
  const priorityOrder = ['critical', 'high', 'medium', 'normal', 'low'];
  const allResults = [];

  for (const priority of priorityOrder) {
    const files = filesByPriority[priority];
    const result = await processPriorityLevel(priority, files);
    allResults.push(result);
  }

  // 3. 生成最終報告
  const stats = generateFinalReport(allResults);
  stats.overallDuration = Math.round((Date.now() - startTime) / 1000);

  // 4. 更新報告文件
  fs.writeFileSync(
    CONFIG.reportPath,
    JSON.stringify(stats, null, 2),
    'utf-8'
  );

  // 5. 打印統計
  printFinalStats(stats);

  console.log(`⏱️  總耗時: ${Math.floor(stats.overallDuration / 60)}分${stats.overallDuration % 60}秒\n`);

  // 6. 返回退出碼
  process.exit(stats.summary.failed > 0 ? 1 : 0);
}

// 執行
if (require.main === module) {
  main().catch(err => {
    console.error('\n❌ 批量處理失敗:', err);
    process.exit(1);
  });
}

module.exports = { processPriorityLevel, generateFinalReport };
