/**
 * @fileoverview 模組 - 測試套件
 * @module scripts/check-comments
 * @description
 * 模組的單元測試
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

#!/usr/bin/env node

/**
 * ================================================================
 * AI銷售賦能平台 - 檔案註釋檢查工具
 * ================================================================
 *
 * 【功能描述】
 * 自動檢查項目中所有TypeScript/JavaScript檔案的中文註釋狀況
 * 識別未添加完整中文註釋的檔案並生成統計報告
 *
 * 【檢查標準】
 * • 檔案頭部需要有 /** 開始的多行註釋
 * • 註釋中需包含"AI銷售賦能平台"關鍵字
 * • 或包含其他中文功能描述關鍵字
 */

const fs = require('fs');
const path = require('path');

// 檔案類型過濾
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_PATHS = ['node_modules', '.next', 'dist', 'build'];

// 中文註釋檢查模式
const CHINESE_COMMENT_PATTERNS = [
  /AI銷售賦能平台/,
  /檔案功能/,
  /組件功能/,
  /功能索引/,
  /檔案名稱/,
  /檔案用途/,
  /主要職責/,
  /技術特色/,
  /功能描述/
];

/**
 * 遞歸查找所有相關檔案
 */
function findFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // 跳過排除的目錄
      if (!EXCLUDE_PATHS.some(exclude => entry.name.includes(exclude))) {
        findFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      // 檢查檔案副檔名
      const ext = path.extname(entry.name);
      if (INCLUDE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * 檢查檔案是否有中文註釋
 */
function hasChineseComments(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // 檢查前30行是否有符合模式的中文註釋
    const headerLines = lines.slice(0, 30).join('\n');

    // 檢查是否有多行註釋開始標記
    const hasMultiLineComment = headerLines.includes('/**');

    // 檢查是否包含中文註釋模式
    const hasChinesePattern = CHINESE_COMMENT_PATTERNS.some(pattern =>
      pattern.test(headerLines)
    );

    return hasMultiLineComment && hasChinesePattern;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 按目錄分組檔案
 */
function groupFilesByDirectory(files) {
  const groups = {};

  files.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const dir = path.dirname(relativePath);

    if (!groups[dir]) {
      groups[dir] = [];
    }
    groups[dir].push(path.basename(relativePath));
  });

  return groups;
}

/**
 * 主函數
 */
function main() {
  console.log('🔍 開始檢查AI銷售賦能平台檔案註釋狀況...\n');

  const projectRoot = process.cwd();
  const allFiles = findFiles(projectRoot);

  console.log(`📁 找到 ${allFiles.length} 個相關檔案`);

  const commentedFiles = [];
  const uncommentedFiles = [];

  // 檢查每個檔案
  allFiles.forEach(filePath => {
    if (hasChineseComments(filePath)) {
      commentedFiles.push(filePath);
    } else {
      uncommentedFiles.push(filePath);
    }
  });

  // 生成統計報告
  console.log('\n📊 檔案註釋狀況統計');
  console.log('=' .repeat(50));
  console.log(`總檔案數：${allFiles.length}`);
  console.log(`已註釋檔案：${commentedFiles.length}`);
  console.log(`未註釋檔案：${uncommentedFiles.length}`);
  console.log(`註釋完成率：${((commentedFiles.length / allFiles.length) * 100).toFixed(1)}%`);

  if (uncommentedFiles.length > 0) {
    console.log('\n📋 未註釋檔案清單');
    console.log('=' .repeat(50));

    const groupedUncommented = groupFilesByDirectory(uncommentedFiles);

    Object.keys(groupedUncommented).sort().forEach(dir => {
      console.log(`\n### ${dir}/ 目錄`);
      groupedUncommented[dir].sort().forEach(fileName => {
        console.log(`- ${fileName}`);
      });
    });
  }

  if (commentedFiles.length > 0) {
    console.log('\n✅ 已註釋檔案清單');
    console.log('=' .repeat(50));

    const groupedCommented = groupFilesByDirectory(commentedFiles);

    Object.keys(groupedCommented).sort().forEach(dir => {
      console.log(`\n### ${dir}/ 目錄`);
      groupedCommented[dir].sort().forEach(fileName => {
        console.log(`- ${fileName}`);
      });
    });
  }

  console.log('\n🎯 檢查完成！');

  // 返回退出碼
  process.exit(uncommentedFiles.length > 0 ? 1 : 0);
}

// 執行主函數
if (require.main === module) {
  main();
}

module.exports = { findFiles, hasChineseComments, groupFilesByDirectory };