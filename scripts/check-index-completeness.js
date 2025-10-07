/**
 * @fileoverview 模組 - 測試套件
 * @module scripts/check-index-completeness
 * @description
 * 模組的單元測試
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

#!/usr/bin/env node

/**
 * ================================================================
 * 索引完整性檢查腳本
 * ================================================================
 * 用途: 自動掃描項目文件並檢查索引完整性
 * 使用: node scripts/check-index-completeness.js
 * npm: npm run check:index
 * ================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 顏色定義 (ANSI 轉義碼)
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * 遞歸掃描目錄，查找所有 .ts 和 .tsx 文件
 */
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 排除特定目錄
      if (!['node_modules', '.next', 'dist', '.git', 'build'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else {
      // 只包含 .ts 和 .tsx 文件
      if (/\.(ts|tsx)$/.test(file)) {
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

        // 只包含重要目錄
        if (/^(lib|components|app\/api|app\/dashboard)\//.test(relativePath)) {
          fileList.push(relativePath);
        }
      }
    }
  });

  return fileList;
}

/**
 * 從 PROJECT-INDEX.md 提取已索引的文件
 */
function getIndexedFiles() {
  const indexPath = path.join(process.cwd(), 'PROJECT-INDEX.md');

  if (!fs.existsSync(indexPath)) {
    console.error(`${colors.red}❌ 錯誤: 找不到 PROJECT-INDEX.md${colors.reset}`);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  // 提取所有 ` 包圍的 .ts 和 .tsx 文件路徑
  const regex = /`([^`]+\.tsx?)`/g;
  const matches = [];
  let match;

  while ((match = regex.exec(indexContent)) !== null) {
    matches.push(match[1]);
  }

  return [...new Set(matches)].sort(); // 去重並排序
}

/**
 * 按目錄分類文件
 */
function categorizeFiles(files) {
  const categories = {
    lib: [],
    components: [],
    'app/api': [],
    'app/dashboard': [],
    other: [],
  };

  files.forEach(file => {
    if (file.startsWith('lib/')) {
      categories.lib.push(file);
    } else if (file.startsWith('components/')) {
      categories.components.push(file);
    } else if (file.startsWith('app/api/')) {
      categories['app/api'].push(file);
    } else if (file.startsWith('app/dashboard/')) {
      categories['app/dashboard'].push(file);
    } else {
      categories.other.push(file);
    }
  });

  return categories;
}

/**
 * 主函數
 */
function main() {
  console.log(`${colors.blue}================================================${colors.reset}`);
  console.log(`${colors.blue}🔍 索引完整性檢查${colors.reset}`);
  console.log(`${colors.blue}================================================${colors.reset}`);
  console.log('');

  // 1. 掃描所有重要文件
  console.log(`${colors.yellow}1. 掃描項目中的所有重要文件...${colors.reset}`);
  console.log('');

  const currentFiles = scanDirectory(process.cwd()).sort();
  const totalFiles = currentFiles.length;

  console.log(`  找到 ${colors.blue}${totalFiles}${colors.reset} 個重要文件`);
  console.log('');

  // 2. 提取已索引的文件
  console.log(`${colors.yellow}2. 提取 PROJECT-INDEX.md 中已索引的文件...${colors.reset}`);
  console.log('');

  const indexedFiles = getIndexedFiles();
  const indexedCount = indexedFiles.length;

  console.log(`  索引中有 ${colors.green}${indexedCount}${colors.reset} 個文件`);
  console.log('');

  // 3. 查找未索引的文件
  console.log(`${colors.yellow}3. 比對差異，查找未索引文件...${colors.reset}`);
  console.log('');

  const missingFiles = currentFiles.filter(file => !indexedFiles.includes(file));
  const missingCount = missingFiles.length;

  if (missingCount === 0) {
    // 檢查通過
    console.log(`${colors.green}================================================${colors.reset}`);
    console.log(`${colors.green}✅ 索引完整性檢查通過！${colors.reset}`);
    console.log(`${colors.green}================================================${colors.reset}`);
    console.log('');
    console.log(`${colors.green}所有重要文件都已正確索引 🎉${colors.reset}`);
    console.log('');

    // 顯示統計
    const coverage = ((indexedCount / totalFiles) * 100).toFixed(1);
    console.log(`${colors.cyan}📊 索引統計:${colors.reset}`);
    console.log(`  總文件數: ${colors.blue}${totalFiles}${colors.reset}`);
    console.log(`  已索引: ${colors.green}${indexedCount}${colors.reset}`);
    console.log(`  覆蓋率: ${colors.green}${coverage}%${colors.reset}`);
    console.log('');

    process.exit(0);
  }

  // 檢查未通過
  console.log(`${colors.red}================================================${colors.reset}`);
  console.log(`${colors.red}⚠️  發現 ${missingCount} 個未索引文件！${colors.reset}`);
  console.log(`${colors.red}================================================${colors.reset}`);
  console.log('');

  // 按目錄分類顯示
  console.log(`${colors.yellow}未索引文件列表 (按目錄分類):${colors.reset}`);
  console.log('');

  const categorized = categorizeFiles(missingFiles);

  if (categorized.lib.length > 0) {
    console.log(`${colors.cyan}📚 lib/ 目錄:${colors.reset}`);
    categorized.lib.forEach(file => console.log(`  - ${file}`));
    console.log('');
  }

  if (categorized.components.length > 0) {
    console.log(`${colors.cyan}🧩 components/ 目錄:${colors.reset}`);
    categorized.components.forEach(file => console.log(`  - ${file}`));
    console.log('');
  }

  if (categorized['app/api'].length > 0) {
    console.log(`${colors.cyan}🔌 app/api/ 目錄:${colors.reset}`);
    categorized['app/api'].forEach(file => console.log(`  - ${file}`));
    console.log('');
  }

  if (categorized['app/dashboard'].length > 0) {
    console.log(`${colors.cyan}📊 app/dashboard/ 目錄:${colors.reset}`);
    categorized['app/dashboard'].forEach(file => console.log(`  - ${file}`));
    console.log('');
  }

  if (categorized.other.length > 0) {
    console.log(`${colors.cyan}📁 其他目錄:${colors.reset}`);
    categorized.other.forEach(file => console.log(`  - ${file}`));
    console.log('');
  }

  // 顯示統計
  const indexedActual = totalFiles - missingCount;
  const coverage = ((indexedActual / totalFiles) * 100).toFixed(1);

  console.log(`${colors.cyan}📊 索引統計:${colors.reset}`);
  console.log(`  總文件數: ${colors.blue}${totalFiles}${colors.reset}`);
  console.log(`  已索引: ${colors.green}${indexedActual}${colors.reset}`);
  console.log(`  未索引: ${colors.red}${missingCount}${colors.reset}`);
  console.log(`  覆蓋率: ${colors.yellow}${coverage}%${colors.reset}`);
  console.log('');

  // 顯示建議
  console.log(`${colors.yellow}建議操作:${colors.reset}`);
  console.log('');
  console.log('  1. 檢查上述未索引文件是否為重要文件');
  console.log('  2. 編輯 PROJECT-INDEX.md 添加遺漏的文件');
  console.log('  3. 為每個文件添加適當的分類和描述');
  console.log('  4. 標記文件重要程度 (🔴 極高 / 🟡 高 / 🟢 中)');
  console.log('');
  console.log('  提交索引更新:');
  console.log('');
  console.log(`    ${colors.blue}git add PROJECT-INDEX.md${colors.reset}`);
  console.log(`    ${colors.blue}git commit -m "docs: 補充遺漏文件索引 - 添加 ${missingCount} 個文件"${colors.reset}`);
  console.log(`    ${colors.blue}git push origin main${colors.reset}`);
  console.log('');

  // 保存未索引文件列表
  const outputFile = 'missing-index-files.txt';
  fs.writeFileSync(outputFile, missingFiles.join('\n'));

  console.log(`${colors.cyan}💾 已將未索引文件列表保存到: ${colors.yellow}${outputFile}${colors.reset}`);
  console.log('');

  process.exit(1);
}

// 執行主函數
main();
