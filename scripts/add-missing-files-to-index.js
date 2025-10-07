/**
 * 智能補充缺失文件到 PROJECT-INDEX.md
 * 優先級策略：高+中優先級文件（約80個）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(PROJECT_ROOT, 'PROJECT-INDEX.md');
const ANALYSIS_REPORT = path.join(PROJECT_ROOT, 'docs', 'project-index-smart-analysis-report.md');

// 從分析報告讀取缺失文件列表
function loadMissingFiles() {
  const content = fs.readFileSync(ANALYSIS_REPORT, 'utf-8');
  const missingSection = content.match(/## 🔍 缺失索引完整列表\n\n([\s\S]+?)\n\n---/);

  if (!missingSection) {
    console.error('❌ 無法從分析報告中提取缺失文件列表');
    return [];
  }

  const missing = [];
  const lines = missingSection[1].split('\n');
  lines.forEach(line => {
    const match = line.match(/^- `([^`]+)`$/);
    if (match) {
      missing.push(match[1]);
    }
  });

  return missing;
}

// 文件優先級分類
function classifyFilesByPriority(files) {
  const highPriority = [];
  const mediumPriority = [];
  const lowPriority = [];

  files.forEach(file => {
    // 🔴 高優先級
    if (
      // Sprint 6 新增組件
      file.includes('components/audit/') ||
      file.includes('components/knowledge/advanced-editor') ||
      file.includes('components/knowledge/enhanced-knowledge') ||
      file.includes('components/knowledge/knowledge-recommendation') ||
      file.includes('components/knowledge/knowledge-review') ||
      file.includes('components/permissions/') ||
      file.includes('components/ui/sheet.tsx') ||

      // 新增核心服務
      file.includes('lib/meeting/') ||
      file.includes('lib/recommendation/') ||
      file.includes('lib/security/audit-log-prisma') ||
      file.includes('lib/security/resource-conditions') ||

      // 關鍵API路由
      file.includes('app/api/audit-logs/') ||
      file.includes('app/dashboard/admin/audit-logs/') ||

      // 關鍵配置文件
      file === 'middleware.ts' ||
      file === 'next.config.js' ||
      file === 'next-env.d.ts' ||
      file === 'tailwind.config.js' ||
      file === 'postcss.config.js' ||

      // 重要測試
      file.includes('__tests__/lib/security/') ||
      file.includes('__tests__/api/rbac') ||
      file.includes('__tests__/hooks/use-permission')
    ) {
      highPriority.push(file);
    }
    // 🟡 中優先級
    else if (
      // 其他測試文件
      file.includes('__tests__/') ||

      // 文檔文件
      (file.includes('docs/') && file.endsWith('.md')) ||

      // 類型定義
      file.includes('types/') ||

      // 其他配置
      file.endsWith('.json') && !file.includes('node_modules') && !file.includes('package')
    ) {
      mediumPriority.push(file);
    }
    // 🟢 低優先級（poc/測試腳本等）
    else {
      lowPriority.push(file);
    }
  });

  return { highPriority, mediumPriority, lowPriority };
}

// 生成文件描述
function generateFileDescription(filePath) {
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);
  const ext = path.extname(filePath);

  // Sprint 6 組件
  if (filePath.includes('components/audit/')) {
    const nameMap = {
      'AuditLogExport.tsx': '審計日誌導出組件',
      'AuditLogFilters.tsx': '審計日誌篩選組件',
      'AuditLogList.tsx': '審計日誌列表組件',
      'AuditLogStats.tsx': '審計日誌統計組件',
      'index.ts': '審計組件統一導出'
    };
    return nameMap[basename] || '審計日誌UI組件';
  }

  if (filePath.includes('components/knowledge/')) {
    const nameMap = {
      'advanced-editor-toolbar.tsx': '高級編輯器工具欄（模板系統+協作+表格）',
      'enhanced-knowledge-editor.tsx': '增強知識庫編輯器（自動保存+模板應用）',
      'knowledge-recommendation-widget.tsx': '知識庫推薦小部件（5種推薦策略+反饋機制）',
      'knowledge-review-workflow.tsx': '內容審核工作流UI（審核隊列+版本對比+歷史）',
      'knowledge-management-dashboard.tsx': '知識庫管理儀表板（批量操作+統計+篩選）'
    };
    return nameMap[basename] || '知識庫管理UI組件';
  }

  if (filePath.includes('components/permissions/')) {
    const nameMap = {
      'CustomerActions.tsx': '客戶操作權限組件',
      'ProposalActions.tsx': '提案操作權限組件',
      'ProtectedRoute.tsx': '受保護路由組件',
      'index.ts': '權限組件統一導出'
    };
    return nameMap[basename] || '權限控制UI組件';
  }

  if (filePath === 'components/ui/sheet.tsx') {
    return 'Radix UI Sheet側邊抽屜組件';
  }

  // 核心服務
  if (filePath === 'lib/meeting/meeting-intelligence-analyzer.ts') {
    return '會議智能分析服務（Sprint 7完整實施）';
  }
  if (filePath === 'lib/recommendation/recommendation-engine.ts') {
    return '推薦引擎服務（協同過濾+內容推薦）';
  }
  if (filePath === 'lib/security/audit-log-prisma.ts') {
    return '審計日誌Prisma數據層服務';
  }
  if (filePath === 'lib/security/resource-conditions.ts') {
    return '資源條件匹配服務（細粒度權限）';
  }

  // API路由
  if (filePath.includes('app/api/audit-logs/')) {
    if (filePath.endsWith('export/route.ts')) return '審計日誌導出API端點';
    if (filePath.endsWith('stats/route.ts')) return '審計日誌統計API端點';
    if (filePath.endsWith('route.ts')) return '審計日誌查詢API端點';
  }

  // 配置文件
  if (filePath === 'middleware.ts') return 'Next.js中間件入口（API Gateway路由）';
  if (filePath === 'next.config.js') return 'Next.js配置文件';
  if (filePath === 'next-env.d.ts') return 'Next.js TypeScript類型定義';
  if (filePath === 'tailwind.config.js') return 'Tailwind CSS配置';
  if (filePath === 'postcss.config.js') return 'PostCSS配置';

  // 測試文件
  if (filePath.includes('__tests__/')) {
    if (filePath.includes('rbac')) return 'RBAC整合測試';
    if (filePath.includes('security')) return '安全模組測試';
    if (filePath.includes('use-permission')) return '權限Hook測試';
    return '單元測試文件';
  }

  // 默認描述
  if (ext === '.tsx' || ext === '.ts') {
    if (filePath.includes('components/')) return 'React組件';
    if (filePath.includes('lib/')) return '核心服務模組';
    if (filePath.includes('app/api/')) return 'API路由處理';
    return 'TypeScript模組';
  }
  if (ext === '.md') return '項目文檔';
  if (ext === '.json') return 'JSON配置文件';

  return '項目文件';
}

// 確定優先級標記
function determinePriority(filePath, priorityLevel) {
  if (priorityLevel === 'high') {
    if (filePath.includes('components/') || filePath.includes('lib/')) return '🔴 極高';
    if (filePath.includes('app/api/')) return '🟡 高';
    return '🟡 高';
  }
  if (priorityLevel === 'medium') {
    if (filePath.includes('__tests__/')) return '🟢 中';
    if (filePath.includes('docs/')) return '🟡 高';
    return '🟢 中';
  }
  return '🟢 低';
}

// 找到合適的插入位置
function findInsertionPoint(content, filePath) {
  const lines = content.split('\n');

  // 根據文件路徑找到對應的章節
  const dir = path.dirname(filePath);
  const topDir = dir === '.' ? '根目錄' : dir.split('/')[0];

  // 章節關鍵字映射
  const sectionKeywords = {
    'components/audit': '審計日誌UI組件',
    'components/knowledge': '知識庫UI組件',
    'components/permissions': '權限控制組件',
    'components/ui': 'UI基礎組件',
    'lib/meeting': '會議智能',
    'lib/recommendation': '推薦引擎',
    'lib/security': '安全模組',
    'app/api/audit-logs': 'API路由',
    '__tests__': '單元測試',
    'docs': '項目文檔',
    '.': '根目錄'
  };

  // 找到最佳匹配章節
  let bestMatch = null;
  let bestMatchLine = -1;

  Object.entries(sectionKeywords).forEach(([pathPattern, keyword]) => {
    if (filePath.startsWith(pathPattern) || (pathPattern === '.' && !filePath.includes('/'))) {
      // 在內容中搜索包含該關鍵字的章節
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(keyword) && lines[i].match(/^#{2,4}/)) {
          if (!bestMatch || pathPattern.length > bestMatch.length) {
            bestMatch = pathPattern;
            bestMatchLine = i;
          }
        }
      }
    }
  });

  // 如果找到匹配章節，在該章節的表格末尾插入
  if (bestMatchLine !== -1) {
    // 從章節開始向下找表格結束位置
    for (let i = bestMatchLine; i < lines.length; i++) {
      // 表格結束：遇到空行或下一個章節
      if (lines[i].trim() === '' && lines[i - 1].match(/^\|/)) {
        return i;
      }
      if (lines[i].match(/^#{2,4}/) && i > bestMatchLine) {
        return i - 1;
      }
    }
  }

  // 默認：在"最新添加"之前插入
  const latestIndex = lines.findIndex(line => line.includes('## 最新添加'));
  return latestIndex > 0 ? latestIndex - 2 : lines.length - 10;
}

// 主函數
async function addMissingFilesToIndex() {
  console.log('🔧 開始補充缺失文件到 PROJECT-INDEX.md...\n');

  // 1. 讀取缺失文件
  console.log('📋 讀取缺失文件列表...');
  const missingFiles = loadMissingFiles();
  console.log(`   ✅ 找到 ${missingFiles.length} 個缺失文件\n`);

  // 2. 分類
  console.log('🎯 按優先級分類...');
  const { highPriority, mediumPriority, lowPriority } = classifyFilesByPriority(missingFiles);
  console.log(`   🔴 高優先級: ${highPriority.length} 個`);
  console.log(`   🟡 中優先級: ${mediumPriority.length} 個`);
  console.log(`   🟢 低優先級: ${lowPriority.length} 個 (將跳過)\n`);

  // 3. 備份
  console.log('💾 備份原文件...');
  const backupFile = INDEX_FILE + '.backup-' + Date.now();
  fs.copyFileSync(INDEX_FILE, backupFile);
  console.log(`   ✅ 備份保存: ${path.basename(backupFile)}\n`);

  // 4. 讀取索引文件
  let content = fs.readFileSync(INDEX_FILE, 'utf-8');
  const lines = content.split('\n');

  // 5. 準備要添加的文件（高+中優先級）
  const filesToAdd = [...highPriority, ...mediumPriority];
  console.log(`📝 準備添加 ${filesToAdd.length} 個文件...\n`);

  // 6. 按目錄分組
  const grouped = {};
  filesToAdd.forEach(file => {
    const dir = path.dirname(file);
    const topDir = dir === '.' ? '根目錄配置' : dir.split('/').slice(0, 2).join('/');

    if (!grouped[topDir]) {
      grouped[topDir] = [];
    }
    grouped[topDir].push(file);
  });

  // 7. 生成新條目並插入
  console.log('✏️  生成索引條目並插入...\n');
  let addedCount = 0;

  Object.entries(grouped).forEach(([dir, files]) => {
    console.log(`📁 處理目錄: ${dir} (${files.length} 個文件)`);

    files.forEach(file => {
      const basename = path.basename(file);
      const description = generateFileDescription(file);
      const priority = determinePriority(file, highPriority.includes(file) ? 'high' : 'medium');

      const newLine = `| **${basename}** | \`${file}\` | ${description} | ${priority} |`;

      // 找到插入位置
      const insertPos = findInsertionPoint(content, file);
      const contentLines = content.split('\n');
      contentLines.splice(insertPos, 0, newLine);
      content = contentLines.join('\n');

      console.log(`   ✅ ${basename}`);
      addedCount++;
    });
    console.log();
  });

  // 8. 保存文件
  fs.writeFileSync(INDEX_FILE, content, 'utf-8');

  console.log('═'.repeat(80));
  console.log('✅ PROJECT-INDEX.md 更新完成');
  console.log('═'.repeat(80));
  console.log();
  console.log(`📊 添加統計:`);
  console.log(`   - 高優先級: ${highPriority.length} 個`);
  console.log(`   - 中優先級: ${mediumPriority.length} 個`);
  console.log(`   - 總計添加: ${addedCount} 個`);
  console.log(`   - 跳過低優先級: ${lowPriority.length} 個 (poc/等)`);
  console.log();
  console.log(`💾 備份文件: ${path.basename(backupFile)}`);
  console.log();
  console.log('🎯 下一步:');
  console.log('   1. 審查 PROJECT-INDEX.md 確認添加正確');
  console.log('   2. 運行 node scripts/analyze-project-index-smart.js 驗證');
  console.log('   3. 提交變更到 git');
  console.log();
}

// 執行
addMissingFilesToIndex().catch(console.error);
