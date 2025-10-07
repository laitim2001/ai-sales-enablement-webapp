/**
 * @fileoverview PROJECT-INDEX.md 智能分析腳本 (多視圖索引感知版本)理解 PROJECT-INDEX.md 的設計:- 多視圖索引: 同一文件在不同章節出現是正常的 (docs目錄、快速導航、優先級)- 真正重複: 同一章節/表格內出現相同文件，或相同目錄被完整索引兩次
 * @module scripts/analyze-project-index-smart
 * @description
 * PROJECT-INDEX.md 智能分析腳本 (多視圖索引感知版本)理解 PROJECT-INDEX.md 的設計:- 多視圖索引: 同一文件在不同章節出現是正常的 (docs目錄、快速導航、優先級)- 真正重複: 同一章節/表格內出現相同文件，或相同目錄被完整索引兩次
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(PROJECT_ROOT, 'PROJECT-INDEX.md');

// 掃描實際文件 (排除node_modules等)
function scanDirectory(dir, extensions) {
  const results = [];
  try {
    const findCmd = `find "${dir}" -type f ${extensions.map(ext => `-name "${ext}"`).join(' -o ')} ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*"`;
    const output = execSync(findCmd, { cwd: PROJECT_ROOT, encoding: 'utf-8' });
    output.split('\n').forEach(line => {
      if (line.trim()) {
        const normalized = line.replace(/^\.\//, '').replace(/\\/g, '/');
        results.push(normalized);
      }
    });
  } catch (error) {
    // Directory might not exist, skip silently
  }
  return results;
}

// 解析 PROJECT-INDEX.md 的章節結構
function parseIndexStructure() {
  const content = fs.readFileSync(INDEX_FILE, 'utf-8');
  const lines = content.split('\n');

  const sections = [];
  let currentSection = null;
  let currentTable = null;
  let inTable = false;

  lines.forEach((line, lineNum) => {
    // 檢測章節標題
    if (line.match(/^#{2,4}\s+/)) {
      const level = line.match(/^(#{2,4})/)[1].length;
      const title = line.replace(/^#{2,4}\s+/, '').trim();

      currentSection = {
        level,
        title,
        startLine: lineNum + 1,
        endLine: lineNum + 1,
        tables: [],
        files: []
      };
      sections.push(currentSection);
      inTable = false;
      currentTable = null;
    }

    // 檢測表格開始
    if (line.match(/^\|.*\|.*\|/) && !inTable) {
      inTable = true;
      currentTable = {
        startLine: lineNum + 1,
        files: []
      };
      if (currentSection) {
        currentSection.tables.push(currentTable);
      }
    }

    // 檢測表格結束 (空行或非表格行)
    if (inTable && !line.match(/^\|/)) {
      inTable = false;
      currentTable = null;
    }

    // 提取表格中的文件路徑
    if (inTable && currentTable) {
      const match = line.match(/\|\s*\*\*[^*]+\*\*\s*\|\s*`([^`]+\.(ts|tsx|js|jsx|md))`/);
      if (match) {
        const filePath = match[1].replace(/\\/g, '/');
        currentTable.files.push({
          path: filePath,
          line: lineNum + 1
        });
        if (currentSection) {
          currentSection.files.push({
            path: filePath,
            line: lineNum + 1,
            table: currentTable
          });
        }
      }
    }

    // 更新章節結束行
    if (currentSection) {
      currentSection.endLine = lineNum + 1;
    }
  });

  return sections;
}

// 識別多視圖章節 (這些章節中的文件重複是正常的)
function identifyMultiViewSections(sections) {
  const multiViewKeywords = [
    '快速導航',
    '優先級',
    '重要性',
    '必須熟悉',
    '重要參考',
    '補充信息',
    '查詢場景'
  ];

  return sections.map(section => ({
    ...section,
    isMultiView: multiViewKeywords.some(keyword => section.title.includes(keyword))
  }));
}

// 檢測同一表格內的重複
function detectTableDuplicates(sections) {
  const tableDuplicates = [];

  sections.forEach(section => {
    section.tables.forEach(table => {
      const pathCounts = {};
      table.files.forEach(file => {
        if (!pathCounts[file.path]) {
          pathCounts[file.path] = [];
        }
        pathCounts[file.path].push(file.line);
      });

      Object.entries(pathCounts).forEach(([filePath, lines]) => {
        if (lines.length > 1) {
          tableDuplicates.push({
            section: section.title,
            path: filePath,
            lines,
            count: lines.length
          });
        }
      });
    });
  });

  return tableDuplicates;
}

// 檢測相同目錄被多次完整索引
function detectDirectoryDuplicates(sections) {
  const directoryIndexes = {};
  const directoryDuplicates = [];

  // 只分析非多視圖章節
  const contentSections = sections.filter(s => !s.isMultiView);

  contentSections.forEach(section => {
    // 檢測是否是目錄級別章節 (如 "lib/ai/", "components/ui/")
    const dirMatch = section.title.match(/([a-z_\-]+\/[a-z_\-]+\/?).*-/i) ||
                     section.title.match(/\(([a-z_\-]+\/[a-z_\-]+\/?).*\)/i);

    if (dirMatch || section.files.length > 5) {
      // 提取該章節中文件的共同目錄
      const directories = {};
      section.files.forEach(file => {
        const dir = path.dirname(file.path);
        if (!directories[dir]) {
          directories[dir] = [];
        }
        directories[dir].push(file.path);
      });

      // 記錄每個目錄的索引情況
      Object.entries(directories).forEach(([dir, files]) => {
        if (files.length >= 3) { // 至少3個文件才算是"完整索引"
          if (!directoryIndexes[dir]) {
            directoryIndexes[dir] = [];
          }
          directoryIndexes[dir].push({
            section: section.title,
            sectionLine: section.startLine,
            files
          });
        }
      });
    }
  });

  // 檢測重複索引
  Object.entries(directoryIndexes).forEach(([dir, indexes]) => {
    if (indexes.length > 1) {
      directoryDuplicates.push({
        directory: dir,
        count: indexes.length,
        indexes
      });
    }
  });

  return directoryDuplicates;
}

// 掃描根目錄文件
function scanRootDirectory() {
  const results = [];
  try {
    // 掃描根目錄的配置文件和文檔
    const findCmd = `find . -maxdepth 1 -type f \\( -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" \\) ! -name "package*.json" ! -name "tsconfig*.json"`;
    const output = execSync(findCmd, { cwd: PROJECT_ROOT, encoding: 'utf-8' });
    output.split('\n').forEach(line => {
      if (line.trim() && !line.includes('node_modules')) {
        const normalized = line.replace(/^\.\//, '').replace(/\\/g, '/');
        results.push(normalized);
      }
    });
  } catch (error) {
    // Root directory might have issues, skip silently
  }
  return results;
}

// 檢測缺失和幽靈文件
function detectMissingAndPhantom(sections) {
  // 掃描實際文件（包含根目錄）
  const actualFiles = new Set([
    ...scanRootDirectory(),
    ...scanDirectory('lib', ['*.ts', '*.tsx']),
    ...scanDirectory('components', ['*.ts', '*.tsx']),
    ...scanDirectory('app', ['*.ts', '*.tsx']),
    ...scanDirectory('__tests__', ['*.test.ts', '*.test.tsx']),
    ...scanDirectory('docs', ['*.md']),
    ...scanDirectory('claudedocs', ['*.md']),
    ...scanDirectory('scripts', ['*.js', '*.ts']),
    ...scanDirectory('prisma', ['*.prisma']),
    ...scanDirectory('e2e', ['*.spec.ts']),
    ...scanDirectory('types', ['*.ts', '*.d.ts']),
    ...scanDirectory('poc', ['*.js', '*.md'])
  ]);

  // 提取所有索引文件 (包括多視圖章節)
  const indexedFiles = new Set();
  sections.forEach(section => {
    section.files.forEach(file => {
      indexedFiles.add(file.path);
    });
  });

  // 缺失文件: 實際存在但未索引
  const missingFiles = Array.from(actualFiles).filter(f => !indexedFiles.has(f));

  // 幽靈文件: 已索引但不存在
  const phantomFiles = Array.from(indexedFiles).filter(f => !actualFiles.has(f));

  return { missingFiles, phantomFiles, actualFiles, indexedFiles };
}

// 生成目錄統計
function generateDirectoryStats(sections, actualFiles) {
  const dirStats = {
    '.': { actual: scanRootDirectory().length, indexed: 0, sections: [] },
    'lib': { actual: scanDirectory('lib', ['*.ts', '*.tsx']).length, indexed: 0, sections: [] },
    'components': { actual: scanDirectory('components', ['*.ts', '*.tsx']).length, indexed: 0, sections: [] },
    'app': { actual: scanDirectory('app', ['*.ts', '*.tsx']).length, indexed: 0, sections: [] },
    '__tests__': { actual: scanDirectory('__tests__', ['*.test.ts', '*.test.tsx']).length, indexed: 0, sections: [] },
    'docs': { actual: scanDirectory('docs', ['*.md']).length, indexed: 0, sections: [] },
    'claudedocs': { actual: scanDirectory('claudedocs', ['*.md']).length, indexed: 0, sections: [] },
    'scripts': { actual: scanDirectory('scripts', ['*.js', '*.ts']).length, indexed: 0, sections: [] },
    'prisma': { actual: scanDirectory('prisma', ['*.prisma']).length, indexed: 0, sections: [] },
    'e2e': { actual: scanDirectory('e2e', ['*.spec.ts']).length, indexed: 0, sections: [] },
    'types': { actual: scanDirectory('types', ['*.ts', '*.d.ts']).length, indexed: 0, sections: [] },
    'poc': { actual: scanDirectory('poc', ['*.js', '*.md']).length, indexed: 0, sections: [] }
  };

  // 只統計非多視圖章節
  const contentSections = sections.filter(s => !s.isMultiView);

  contentSections.forEach(section => {
    section.files.forEach(file => {
      // 判斷是根目錄文件還是子目錄文件
      const parts = file.path.split('/');
      const topDir = parts.length === 1 ? '.' : parts[0];

      if (dirStats[topDir]) {
        dirStats[topDir].indexed++;
        if (!dirStats[topDir].sections.includes(section.title)) {
          dirStats[topDir].sections.push(section.title);
        }
      }
    });
  });

  return dirStats;
}

// 主分析函數
async function analyzeProjectIndex() {
  console.log('🔍 開始智能分析 PROJECT-INDEX.md...\n');
  console.log('📖 理解多視圖索引設計:');
  console.log('   - 同一文件在不同視圖出現 = ✅ 正常 (例: docs/, 快速導航, 優先級)');
  console.log('   - 同一表格內重複 = ⚠️ 問題');
  console.log('   - 相同目錄被多次完整索引 = ⚠️ 問題\n');

  // 1. 解析章節結構
  console.log('📋 解析索引結構...');
  let sections = parseIndexStructure();
  console.log(`   ✅ 找到 ${sections.length} 個章節`);

  sections = identifyMultiViewSections(sections);
  const multiViewCount = sections.filter(s => s.isMultiView).length;
  console.log(`   ✅ 識別 ${multiViewCount} 個多視圖章節 (文件重複是正常的)`);
  console.log(`   ✅ 識別 ${sections.length - multiViewCount} 個內容章節 (需檢測重複)\n`);

  // 2. 檢測表格內重複
  console.log('🔄 檢測表格內重複...');
  const tableDuplicates = detectTableDuplicates(sections);
  console.log(`   ${tableDuplicates.length > 0 ? '⚠️' : '✅'} 找到 ${tableDuplicates.length} 個表格內重複\n`);

  // 3. 檢測目錄重複索引
  console.log('📂 檢測目錄重複索引...');
  const directoryDuplicates = detectDirectoryDuplicates(sections);
  console.log(`   ${directoryDuplicates.length > 0 ? '⚠️' : '✅'} 找到 ${directoryDuplicates.length} 個目錄被多次索引\n`);

  // 4. 檢測缺失和幽靈
  console.log('🔍 檢測缺失和幽靈文件...');
  const { missingFiles, phantomFiles, actualFiles, indexedFiles } = detectMissingAndPhantom(sections);
  console.log(`   ${missingFiles.length > 0 ? '⚠️' : '✅'} 缺失索引: ${missingFiles.length} 個文件`);
  console.log(`   ${phantomFiles.length > 0 ? '⚠️' : '✅'} 幽靈條目: ${phantomFiles.length} 個文件\n`);

  // 5. 目錄統計
  console.log('📊 生成目錄統計...');
  const dirStats = generateDirectoryStats(sections, actualFiles);
  console.log(`   ✅ 統計完成\n`);

  // 生成報告
  console.log('═'.repeat(80));
  console.log('📊 PROJECT-INDEX.md 智能分析報告');
  console.log('═'.repeat(80));
  console.log();

  // 總體統計
  console.log('## 📈 總體統計');
  console.log(`- 實際文件總數: ${actualFiles.size}`);
  console.log(`- 唯一索引文件: ${indexedFiles.size}`);
  console.log(`- 章節總數: ${sections.length} (${sections.length - multiViewCount} 內容章節 + ${multiViewCount} 多視圖章節)`);
  console.log();

  // 真正的重複問題
  console.log('## 🔄 真正的重複問題');
  console.log();

  if (tableDuplicates.length === 0 && directoryDuplicates.length === 0) {
    console.log('✅ **無真正重複問題** - 所有"重複"都是多視圖索引設計');
    console.log();
  } else {
    if (tableDuplicates.length > 0) {
      console.log('### 表格內重複 (同一表格中相同文件出現多次)');
      console.log();
      tableDuplicates.forEach(dup => {
        console.log(`📄 **${dup.path}**`);
        console.log(`   章節: ${dup.section}`);
        console.log(`   重複次數: ${dup.count}`);
        console.log(`   行號: ${dup.lines.join(', ')}`);
        console.log();
      });
    }

    if (directoryDuplicates.length > 0) {
      console.log('### 目錄重複索引 (相同目錄在多個章節完整索引)');
      console.log();
      directoryDuplicates.forEach(dup => {
        console.log(`📁 **${dup.directory}/** (被索引 ${dup.count} 次)`);
        dup.indexes.forEach((idx, i) => {
          console.log(`   ${i + 1}. 章節: ${idx.section} (行 ${idx.sectionLine})`);
          console.log(`      包含 ${idx.files.length} 個文件`);
        });
        console.log();
      });
    }
  }

  // 缺失和幽靈
  if (missingFiles.length > 0) {
    console.log('## 🔍 缺失索引 (前30個)');
    console.log();
    missingFiles.slice(0, 30).forEach(f => {
      console.log(`   - ${f}`);
    });
    if (missingFiles.length > 30) {
      console.log(`   ... 還有 ${missingFiles.length - 30} 個文件`);
    }
    console.log();
  }

  if (phantomFiles.length > 0) {
    console.log('## 👻 幽靈條目 (前30個)');
    console.log();
    phantomFiles.slice(0, 30).forEach(f => {
      console.log(`   - ${f}`);
    });
    if (phantomFiles.length > 30) {
      console.log(`   ... 還有 ${phantomFiles.length - 30} 個文件`);
    }
    console.log();
  }

  // 目錄統計
  console.log('## 📂 目錄統計 (僅內容章節)');
  console.log();
  console.log('| 目錄 | 實際文件 | 索引條目 | 差異 | 覆蓋率 | 索引章節數 |');
  console.log('|------|----------|----------|------|--------|-----------|');
  Object.entries(dirStats).forEach(([dir, stats]) => {
    const diff = stats.indexed - stats.actual;
    const coverage = stats.actual > 0 ? ((stats.indexed / stats.actual) * 100).toFixed(1) : '0.0';
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    console.log(`| ${dir} | ${stats.actual} | ${stats.indexed} | ${diffStr} | ${coverage}% | ${stats.sections.length} |`);
  });
  console.log();

  // 索引健康度
  const healthScore = ((indexedFiles.size - phantomFiles.length) / actualFiles.size * 100).toFixed(1);
  console.log('═'.repeat(80));
  console.log('## 🎯 結論');
  console.log('═'.repeat(80));
  console.log();
  console.log(`📊 **索引健康度**: ${healthScore}%`);
  console.log();

  if (tableDuplicates.length > 0 || directoryDuplicates.length > 0) {
    console.log(`⚠️ **真正重複問題**: ${tableDuplicates.length + directoryDuplicates.length} 個`);
    console.log('   建議: 移除真正的重複條目');
    console.log();
  } else {
    console.log('✅ **無真正重複**: 所有"重複"都是合理的多視圖索引');
    console.log();
  }

  if (missingFiles.length > 0) {
    console.log(`⚠️ **缺失索引**: ${missingFiles.length} 個文件未被索引`);
    console.log('   建議: 為新增文件添加索引條目');
    console.log();
  }

  if (phantomFiles.length > 0) {
    console.log(`⚠️ **幽靈條目**: ${phantomFiles.length} 個索引指向已刪除文件`);
    console.log('   建議: 清理過時的索引條目');
    console.log();
  }

  // 保存詳細報告
  const reportPath = path.join(PROJECT_ROOT, 'docs', 'project-index-smart-analysis-report.md');
  const reportContent = generateMarkdownReport({
    sections,
    tableDuplicates,
    directoryDuplicates,
    missingFiles,
    phantomFiles,
    dirStats,
    healthScore,
    actualFilesCount: actualFiles.size,
    indexedFilesCount: indexedFiles.size
  });

  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`📄 詳細報告已保存: ${reportPath}`);
  console.log();
}

function generateMarkdownReport(data) {
  const timestamp = new Date().toISOString();

  return `# PROJECT-INDEX.md 智能分析報告

> **生成時間**: ${timestamp}
> **分析工具**: analyze-project-index-smart.js (多視圖索引感知版本)
> **分析範圍**: 全項目文件索引

---

## 📊 執行摘要

### 設計理解
PROJECT-INDEX.md 採用**多視圖索引設計**:
- ✅ 同一文件在不同視圖出現是**正常的** (如: docs目錄視圖、快速導航視圖、優先級視圖)
- ⚠️ 同一表格內重複或相同目錄被多次完整索引才是**真正的問題**

### 整體統計
- **實際文件總數**: ${data.actualFilesCount}
- **唯一索引文件**: ${data.indexedFilesCount}
- **章節總數**: ${data.sections.length} (${data.sections.filter(s => !s.isMultiView).length} 內容章節 + ${data.sections.filter(s => s.isMultiView).length} 多視圖章節)
- **索引健康度**: ${data.healthScore}%

### 真正的問題統計
- ⚠️ **表格內重複**: ${data.tableDuplicates.length} 個
- ⚠️ **目錄重複索引**: ${data.directoryDuplicates.length} 個
- ⚠️ **缺失索引**: ${data.missingFiles.length} 個文件
- ⚠️ **幽靈條目**: ${data.phantomFiles.length} 個條目

---

## 🔄 真正的重複問題

${data.tableDuplicates.length === 0 && data.directoryDuplicates.length === 0 ?
'✅ **無真正重複問題** - 所有"重複"都是合理的多視圖索引設計\n' :
'### 表格內重複\n\n' +
data.tableDuplicates.map(dup => `
#### \`${dup.path}\`
- **章節**: ${dup.section}
- **重複次數**: ${dup.count}
- **行號**: ${dup.lines.join(', ')}
`).join('\n') +
'\n### 目錄重複索引\n\n' +
data.directoryDuplicates.map(dup => `
#### \`${dup.directory}/\`
被索引 ${dup.count} 次:
${dup.indexes.map((idx, i) => `
${i + 1}. **章節**: ${idx.section} (行 ${idx.sectionLine})
   - 包含 ${idx.files.length} 個文件
`).join('\n')}
`).join('\n')
}

---

## 🔍 缺失索引完整列表

${data.missingFiles.map(f => `- \`${f}\``).join('\n')}

---

## 👻 幽靈條目完整列表

${data.phantomFiles.map(f => `- \`${f}\``).join('\n')}

---

## 📂 目錄詳細統計 (僅內容章節)

| 目錄 | 實際文件 | 索引條目 | 差異 | 覆蓋率 | 索引章節數 |
|------|----------|----------|------|--------|-----------|
${Object.entries(data.dirStats).map(([dir, stats]) => {
  const diff = stats.indexed - stats.actual;
  const coverage = stats.actual > 0 ? ((stats.indexed / stats.actual) * 100).toFixed(1) : '0.0';
  const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
  return `| ${dir} | ${stats.actual} | ${stats.indexed} | ${diffStr} | ${coverage}% | ${stats.sections.length} |`;
}).join('\n')}

---

## 🎯 修復建議

### 1. 處理真正的重複 (優先級: ${data.tableDuplicates.length + data.directoryDuplicates.length > 0 ? '🔴 高' : '✅ 無需處理'})
${data.tableDuplicates.length + data.directoryDuplicates.length === 0 ?
'✅ 無需處理 - 沒有真正的重複問題' :
`- 表格內重複: ${data.tableDuplicates.length} 個 → 移除重複條目
- 目錄重複索引: ${data.directoryDuplicates.length} 個 → 合併或移除冗餘章節`}

### 2. 補充缺失索引 (優先級: 🟡 中)
- 總計: ${data.missingFiles.length} 個未索引文件
- 方法: 為新增文件添加適當的索引條目

### 3. 清理幽靈條目 (優先級: 🟢 低)
- 總計: ${data.phantomFiles.length} 個過時條目
- 方法: 移除指向已刪除文件的索引

---

**報告結束**
`;
}

// 執行分析
analyzeProjectIndex().catch(console.error);
