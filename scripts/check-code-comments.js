#!/usr/bin/env node

/**
 * @fileoverview 代碼註釋完整性檢查工具
 * @module scripts/check-code-comments
 * @description
 * 掃描項目中的所有TypeScript/JavaScript文件，檢測:
 * - 缺少文件級註釋的文件
 * - 缺少JSDoc的導出函數/類/接口
 * - 註釋覆蓋率統計
 * - 生成詳細的檢查報告
 *
 * @created 2025-10-08
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  // 要掃描的文件擴展名
  extensions: ['.ts', '.tsx', '.js', '.jsx'],

  // 排除的目錄
  excludeDirs: [
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    'poc/node_modules'
  ],

  // 排除的文件模式
  excludePatterns: [
    /\.test\.(ts|tsx|js|jsx)$/,
    /\.spec\.(ts|tsx|js|jsx)$/,
    /\.config\.(ts|js)$/,
    /\.d\.ts$/
  ],

  // 註釋檢測正則
  patterns: {
    fileOverview: /\/\*\*[\s\S]*?@fileoverview[\s\S]*?\*\//,
    jsDocBlock: /\/\*\*[\s\S]*?\*\//g,
    exportFunction: /export\s+(async\s+)?function\s+(\w+)/g,
    exportClass: /export\s+(abstract\s+)?class\s+(\w+)/g,
    exportInterface: /export\s+interface\s+(\w+)/g,
    exportType: /export\s+type\s+(\w+)/g,
    exportConst: /export\s+const\s+(\w+)\s*[:=]/g
  },

  // 優先級分類
  priorityRules: {
    critical: [
      'lib/security',
      'lib/middleware',
      'lib/workflow',
      'lib/ai',
      'lib/notification'
    ],
    high: [
      'components/knowledge',
      'components/ui',
      'components/dashboard',
      'components/audit'
    ],
    medium: [
      'lib/parsers',
      'lib/search',
      'lib/performance',
      'lib/resilience',
      'lib/monitoring',
      'lib/knowledge'
    ],
    normal: [
      '__tests__',
      'scripts',
      'e2e'
    ]
  }
};

// ============================================================
// 工具函數
// ============================================================

/**
 * 遞歸獲取目錄下所有文件
 *
 * @param {string} dir - 目錄路徑
 * @param {string[]} fileList - 文件列表累加器
 * @returns {string[]} 文件路徑數組
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 檢查是否在排除目錄中
      const shouldExclude = CONFIG.excludeDirs.some(excludeDir =>
        filePath.includes(path.sep + excludeDir + path.sep) ||
        filePath.endsWith(path.sep + excludeDir)
      );

      if (!shouldExclude) {
        getAllFiles(filePath, fileList);
      }
    } else {
      // 檢查文件擴展名
      const ext = path.extname(file);
      if (CONFIG.extensions.includes(ext)) {
        // 檢查是否匹配排除模式
        const shouldExclude = CONFIG.excludePatterns.some(pattern =>
          pattern.test(filePath)
        );

        if (!shouldExclude) {
          fileList.push(filePath);
        }
      }
    }
  });

  return fileList;
}

/**
 * 判斷文件優先級
 *
 * @param {string} filePath - 文件路徑
 * @returns {string} 優先級: 'critical' | 'high' | 'medium' | 'normal' | 'low'
 */
function getFilePriority(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const [priority, patterns] of Object.entries(CONFIG.priorityRules)) {
    if (patterns.some(pattern => normalizedPath.includes(pattern))) {
      return priority;
    }
  }

  return 'low';
}

/**
 * 檢查文件的註釋完整性
 *
 * @param {string} filePath - 文件路徑
 * @returns {Object} 檢查結果
 */
function checkFileComments(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  // 檢查文件級註釋
  const hasFileOverview = CONFIG.patterns.fileOverview.test(content);

  // 提取所有導出
  const exports = {
    functions: [...content.matchAll(CONFIG.patterns.exportFunction)].map(m => m[2]),
    classes: [...content.matchAll(CONFIG.patterns.exportClass)].map(m => m[2]),
    interfaces: [...content.matchAll(CONFIG.patterns.exportInterface)].map(m => m[1]),
    types: [...content.matchAll(CONFIG.patterns.exportType)].map(m => m[1]),
    consts: [...content.matchAll(CONFIG.patterns.exportConst)].map(m => m[1])
  };

  const totalExports =
    exports.functions.length +
    exports.classes.length +
    exports.interfaces.length +
    exports.types.length +
    exports.consts.length;

  // 提取所有JSDoc塊
  const jsDocBlocks = content.match(CONFIG.patterns.jsDocBlock) || [];

  // 簡單啟發式: 假設每個導出應該有一個JSDoc
  const estimatedDocumentedExports = jsDocBlocks.length;
  const documentationRatio = totalExports > 0
    ? (estimatedDocumentedExports / totalExports) * 100
    : 100;

  return {
    filePath: relativePath,
    priority: getFilePriority(relativePath),
    hasFileOverview,
    totalExports,
    jsDocBlocks: jsDocBlocks.length,
    documentationRatio: Math.min(documentationRatio, 100),
    exports,
    issues: {
      missingFileOverview: !hasFileOverview,
      lowDocumentation: documentationRatio < 80 && totalExports > 0
    }
  };
}

/**
 * 生成檢查報告
 *
 * @param {Object[]} results - 檢查結果數組
 * @returns {Object} 報告數據
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      filesWithFileOverview: 0,
      filesWithoutFileOverview: 0,
      totalExports: 0,
      totalJSDocBlocks: 0,
      averageDocumentationRatio: 0
    },
    byPriority: {
      critical: { files: [], issues: 0 },
      high: { files: [], issues: 0 },
      medium: { files: [], issues: 0 },
      normal: { files: [], issues: 0 },
      low: { files: [], issues: 0 }
    },
    issues: {
      missingFileOverview: [],
      lowDocumentation: []
    }
  };

  let totalDocRatio = 0;

  results.forEach(result => {
    // 更新總體統計
    if (result.hasFileOverview) {
      report.summary.filesWithFileOverview++;
    } else {
      report.summary.filesWithoutFileOverview++;
    }

    report.summary.totalExports += result.totalExports;
    report.summary.totalJSDocBlocks += result.jsDocBlocks;
    totalDocRatio += result.documentationRatio;

    // 按優先級分類
    const priorityGroup = report.byPriority[result.priority];
    priorityGroup.files.push(result.filePath);

    if (result.issues.missingFileOverview) {
      priorityGroup.issues++;
      report.issues.missingFileOverview.push({
        file: result.filePath,
        priority: result.priority
      });
    }

    if (result.issues.lowDocumentation) {
      priorityGroup.issues++;
      report.issues.lowDocumentation.push({
        file: result.filePath,
        priority: result.priority,
        ratio: result.documentationRatio.toFixed(1),
        exports: result.totalExports,
        docs: result.jsDocBlocks
      });
    }
  });

  report.summary.averageDocumentationRatio =
    (totalDocRatio / results.length).toFixed(1);

  // 計算覆蓋率
  report.summary.fileOverviewCoverage =
    ((report.summary.filesWithFileOverview / results.length) * 100).toFixed(1);

  report.summary.exportDocumentationCoverage =
    report.summary.totalExports > 0
      ? ((report.summary.totalJSDocBlocks / report.summary.totalExports) * 100).toFixed(1)
      : '100.0';

  return report;
}

/**
 * 輸出彩色文本（簡化版）
 *
 * @param {string} text - 文本內容
 * @param {string} color - 顏色名稱
 * @returns {string} 格式化後的文本
 */
function colorize(text, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };

  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * 打印報告到控制台
 *
 * @param {Object} report - 報告數據
 */
function printReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize('📊 代碼註釋完整性檢查報告', 'cyan'));
  console.log('='.repeat(80) + '\n');

  // 總體統計
  console.log(colorize('📈 總體統計:', 'blue'));
  console.log(`   總文件數: ${report.summary.totalFiles}`);
  console.log(`   文件級註釋覆蓋率: ${colorize(report.summary.fileOverviewCoverage + '%',
    parseFloat(report.summary.fileOverviewCoverage) >= 90 ? 'green' :
    parseFloat(report.summary.fileOverviewCoverage) >= 70 ? 'yellow' : 'red')}`);
  console.log(`   導出項註釋覆蓋率: ${colorize(report.summary.exportDocumentationCoverage + '%',
    parseFloat(report.summary.exportDocumentationCoverage) >= 90 ? 'green' :
    parseFloat(report.summary.exportDocumentationCoverage) >= 70 ? 'yellow' : 'red')}`);
  console.log(`   平均文檔化比率: ${report.summary.averageDocumentationRatio}%`);
  console.log(`   總導出項: ${report.summary.totalExports}`);
  console.log(`   總JSDoc塊: ${report.summary.totalJSDocBlocks}\n`);

  // 按優先級統計
  console.log(colorize('🎯 按優先級分布:', 'blue'));
  const priorityLabels = {
    critical: '🔴 極高優先級',
    high: '🟡 高優先級',
    medium: '🟢 中優先級',
    normal: '🔵 普通優先級',
    low: '⚪ 低優先級'
  };

  for (const [priority, data] of Object.entries(report.byPriority)) {
    if (data.files.length > 0) {
      console.log(`   ${priorityLabels[priority]}: ${data.files.length} 個文件, ${data.issues} 個問題`);
    }
  }
  console.log();

  // 問題詳情
  if (report.issues.missingFileOverview.length > 0) {
    console.log(colorize('⚠️  缺少文件級註釋 (' + report.issues.missingFileOverview.length + ' 個文件):', 'yellow'));

    // 按優先級分組顯示
    ['critical', 'high', 'medium', 'normal', 'low'].forEach(priority => {
      const files = report.issues.missingFileOverview
        .filter(issue => issue.priority === priority)
        .slice(0, 5); // 每個優先級最多顯示5個

      if (files.length > 0) {
        console.log(`\n   ${priorityLabels[priority]}:`);
        files.forEach(issue => {
          console.log(`   - ${issue.file}`);
        });

        const remaining = report.issues.missingFileOverview
          .filter(issue => issue.priority === priority).length - 5;
        if (remaining > 0) {
          console.log(`   ... 還有 ${remaining} 個文件`);
        }
      }
    });
    console.log();
  }

  if (report.issues.lowDocumentation.length > 0) {
    console.log(colorize('📉 文檔化率低於80% (' + report.issues.lowDocumentation.length + ' 個文件):', 'yellow'));

    // 顯示前10個最需要改進的
    const topIssues = report.issues.lowDocumentation
      .sort((a, b) => parseFloat(a.ratio) - parseFloat(b.ratio))
      .slice(0, 10);

    topIssues.forEach(issue => {
      console.log(`   - ${issue.file} (${issue.ratio}% - ${issue.docs}/${issue.exports} 已文檔化)`);
    });

    if (report.issues.lowDocumentation.length > 10) {
      console.log(`   ... 還有 ${report.issues.lowDocumentation.length - 10} 個文件`);
    }
    console.log();
  }

  // 建議
  console.log(colorize('💡 建議:', 'green'));
  if (parseFloat(report.summary.fileOverviewCoverage) < 90) {
    console.log(`   ✓ 優先為 ${report.summary.filesWithoutFileOverview} 個文件添加 @fileoverview 註釋`);
  }
  if (parseFloat(report.summary.exportDocumentationCoverage) < 80) {
    console.log(`   ✓ 為導出的函數/類/接口添加 JSDoc 註釋`);
  }
  if (report.issues.lowDocumentation.length > 0) {
    console.log(`   ✓ 重點改進 🔴 極高優先級 和 🟡 高優先級 文件的註釋`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(colorize('📄 詳細報告已保存: docs/code-comments-check-report.json', 'cyan'));
  console.log('='.repeat(80) + '\n');
}

// ============================================================
// 主程序
// ============================================================

function main() {
  console.log(colorize('\n🔍 開始掃描項目代碼文件...\n', 'cyan'));

  const projectRoot = process.cwd();
  const allFiles = getAllFiles(projectRoot);

  console.log(`✅ 找到 ${allFiles.length} 個代碼文件\n`);
  console.log(colorize('📋 分析註釋完整性...\n', 'cyan'));

  const results = allFiles.map(checkFileComments);

  const report = generateReport(results);

  // 打印報告
  printReport(report);

  // 保存JSON報告
  const reportPath = path.join(projectRoot, 'docs', 'code-comments-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // 保存詳細文件列表
  const detailedReportPath = path.join(projectRoot, 'docs', 'code-comments-detailed-report.json');
  fs.writeFileSync(detailedReportPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(colorize('✅ 檢查完成！\n', 'green'));

  // 返回狀態碼
  const hasIssues =
    report.issues.missingFileOverview.length > 0 ||
    report.issues.lowDocumentation.length > 0;

  process.exit(hasIssues ? 1 : 0);
}

// 執行主程序
if (require.main === module) {
  main();
}

module.exports = { checkFileComments, generateReport };
