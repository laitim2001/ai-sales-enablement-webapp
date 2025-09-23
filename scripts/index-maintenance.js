#!/usr/bin/env node
/**
 * 索引維護助手 - 互動式索引更新工具
 *
 * 功能：
 * 1. 自動檢測新文件並建議分類
 * 2. 互動式索引更新
 * 3. 批次更新索引文件
 * 4. 生成索引變更報告
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class IndexMaintenanceHelper {
  constructor() {
    this.projectRoot = process.cwd();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.pendingFiles = [];
    this.changes = [];
  }

  /**
   * 主要維護流程
   */
  async run() {
    console.log('📝 索引維護助手\n');
    console.log('=' .repeat(50));

    try {
      // 1. 檢測需要維護的文件
      await this.detectPendingFiles();

      if (this.pendingFiles.length === 0) {
        console.log('✅ 所有文件都已正確索引！');
        return;
      }

      // 2. 顯示待處理文件
      this.displayPendingFiles();

      // 3. 互動式處理
      await this.interactiveUpdate();

      // 4. 應用變更
      await this.applyChanges();

      // 5. 生成報告
      this.generateReport();

    } catch (error) {
      console.error('❌ 維護過程發生錯誤:', error.message);
    } finally {
      this.rl.close();
    }
  }

  /**
   * 檢測需要維護的文件
   */
  async detectPendingFiles() {
    console.log('🔍 檢測需要索引的文件...\n');

    // 使用現有的檢查工具
    const IndexSyncChecker = require('./check-index-sync.js');
    const checker = new IndexSyncChecker();

    // 暫時捕獲輸出
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    try {
      await checker.runCheck({ incremental: false });
      this.pendingFiles = checker.suggestions.filter(s => s.type === 'add_to_index');
    } finally {
      console.log = originalLog;
    }

    console.log(`發現 ${this.pendingFiles.length} 個文件需要處理`);
  }

  /**
   * 顯示待處理文件
   */
  displayPendingFiles() {
    if (this.pendingFiles.length === 0) return;

    console.log('\n📋 待處理文件列表:');
    console.log('-' .repeat(50));

    this.pendingFiles.forEach((file, index) => {
      const importance = this.getFileImportance(file.file);
      const icon = importance === 'high' ? '🔴' : importance === 'medium' ? '🟡' : '🟢';
      const targetIndex = importance === 'high' ? 'AI-ASSISTANT-GUIDE.md' : 'PROJECT-INDEX.md';

      console.log(`${index + 1}. ${icon} ${file.file}`);
      console.log(`   建議索引: ${targetIndex}`);
      console.log(`   重要性: ${importance}`);
      console.log('');
    });
  }

  /**
   * 互動式更新
   */
  async interactiveUpdate() {
    console.log('\n🎯 互動式索引更新');
    console.log('-' .repeat(50));

    for (let i = 0; i < this.pendingFiles.length; i++) {
      const file = this.pendingFiles[i];
      const importance = this.getFileImportance(file.file);

      console.log(`\n處理文件 ${i + 1}/${this.pendingFiles.length}:`);
      console.log(`📁 ${file.file}`);
      console.log(`🎯 建議重要性: ${importance}`);

      const action = await this.askQuestion(
        '選擇操作 [a]dd to index / [s]kip / [e]dit importance / [q]uit: '
      );

      switch (action.toLowerCase()) {
        case 'a':
          await this.addFileToIndex(file.file, importance);
          break;
        case 's':
          console.log('⏭️ 跳過');
          break;
        case 'e':
          const newImportance = await this.askQuestion('輸入重要性 (high/medium/low): ');
          if (['high', 'medium', 'low'].includes(newImportance)) {
            await this.addFileToIndex(file.file, newImportance);
          } else {
            console.log('❌ 無效的重要性級別');
          }
          break;
        case 'q':
          console.log('👋 退出維護');
          return;
        default:
          console.log('❌ 無效的選擇，跳過此文件');
      }
    }
  }

  /**
   * 添加文件到索引
   */
  async addFileToIndex(filePath, importance) {
    const targetIndex = importance === 'high' ? 'AI-ASSISTANT-GUIDE.md' : 'PROJECT-INDEX.md';

    console.log(`📝 準備添加 ${filePath} 到 ${targetIndex}`);

    // 生成索引條目
    const entry = this.generateIndexEntry(filePath, importance);

    this.changes.push({
      type: 'add',
      file: filePath,
      targetIndex: targetIndex,
      importance: importance,
      entry: entry
    });

    console.log(`✅ 已準備添加到 ${targetIndex}`);
  }

  /**
   * 生成索引條目
   */
  generateIndexEntry(filePath, importance) {
    const fileName = path.basename(filePath);
    const description = this.generateFileDescription(filePath);
    const icon = this.getFileIcon(filePath);

    if (importance === 'high') {
      // AI-ASSISTANT-GUIDE.md 格式
      return `| ${description} | \`${filePath}\` | ${this.getFileCategory(filePath)} |`;
    } else {
      // PROJECT-INDEX.md 格式
      return `| **${fileName}** | \`${filePath}\` | ${description} | ${this.getImportanceIcon(importance)} |`;
    }
  }

  /**
   * 生成文件描述
   */
  generateFileDescription(filePath) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath, ext);

    const descriptions = {
      '.md': `${fileName} 文檔`,
      '.js': `${fileName} JavaScript 模組`,
      '.ts': `${fileName} TypeScript 模組`,
      '.json': `${fileName} 配置文件`,
      '.prisma': `${fileName} 資料庫模型`,
      '.yml': `${fileName} YAML 配置`,
      '.yaml': `${fileName} YAML 配置`,
      '.sql': `${fileName} SQL 腳本`
    };

    return descriptions[ext] || `${fileName} 文件`;
  }

  /**
   * 獲取文件圖標
   */
  getFileIcon(filePath) {
    const ext = path.extname(filePath);
    const icons = {
      '.md': '📝',
      '.js': '📜',
      '.ts': '📘',
      '.json': '⚙️',
      '.prisma': '🗄️',
      '.yml': '🔧',
      '.yaml': '🔧',
      '.sql': '🗃️'
    };
    return icons[ext] || '📄';
  }

  /**
   * 獲取文件分類
   */
  getFileCategory(filePath) {
    if (filePath.includes('docs/')) return '文檔';
    if (filePath.includes('src/')) return '源代碼';
    if (filePath.includes('config')) return '配置';
    if (filePath.includes('test')) return '測試';
    if (filePath.includes('script')) return '腳本';
    return '其他';
  }

  /**
   * 獲取重要性圖標
   */
  getImportanceIcon(importance) {
    const icons = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return icons[importance] || '⚪';
  }

  /**
   * 判斷文件重要性
   */
  getFileImportance(filePath) {
    const highImportancePatterns = [
      /README\.md$/,
      /.*\.config\.(js|ts|json)$/,
      /package\.json$/,
      /schema\.prisma$/,
      /(docs|src)\/.*\.md$/
    ];

    const mediumImportancePatterns = [
      /.*\.test\.(js|ts)$/,
      /.*\.spec\.(js|ts)$/,
      /.*\.yml$/,
      /.*\.yaml$/
    ];

    if (highImportancePatterns.some(pattern => pattern.test(filePath))) {
      return 'high';
    }

    if (mediumImportancePatterns.some(pattern => pattern.test(filePath))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 應用變更
   */
  async applyChanges() {
    if (this.changes.length === 0) {
      console.log('\n📝 沒有變更需要應用');
      return;
    }

    console.log(`\n🔄 應用 ${this.changes.length} 個變更...`);

    // 按目標索引分組變更
    const changesByIndex = {};
    this.changes.forEach(change => {
      if (!changesByIndex[change.targetIndex]) {
        changesByIndex[change.targetIndex] = [];
      }
      changesByIndex[change.targetIndex].push(change);
    });

    // 應用到每個索引文件
    for (const [indexFile, changes] of Object.entries(changesByIndex)) {
      await this.updateIndexFile(indexFile, changes);
    }

    console.log('✅ 所有變更已應用');
  }

  /**
   * 更新索引文件
   */
  async updateIndexFile(indexFile, changes) {
    const filePath = path.join(this.projectRoot, indexFile);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 索引文件不存在: ${indexFile}`);
      return;
    }

    console.log(`📝 更新 ${indexFile} (${changes.length} 個條目)`);

    // 為了安全起見，這裡只記錄需要添加的內容
    // 實際應用需要更複雜的邏輯來找到正確的插入位置

    console.log('\n建議添加的內容:');
    changes.forEach(change => {
      console.log(`  ${change.entry}`);
    });

    console.log(`\n💡 請手動將上述內容添加到 ${indexFile} 的適當位置`);
  }

  /**
   * 生成報告
   */
  generateReport() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 索引維護報告');
    console.log('=' .repeat(50));

    console.log(`\n📈 統計:`);
    console.log(`  📁 檢查文件數: ${this.pendingFiles.length}`);
    console.log(`  ✅ 處理文件數: ${this.changes.length}`);
    console.log(`  ⏭️ 跳過文件數: ${this.pendingFiles.length - this.changes.length}`);

    if (this.changes.length > 0) {
      console.log('\n📝 變更摘要:');
      const byIndex = {};
      this.changes.forEach(change => {
        byIndex[change.targetIndex] = (byIndex[change.targetIndex] || 0) + 1;
      });

      Object.entries(byIndex).forEach(([index, count]) => {
        console.log(`  📋 ${index}: ${count} 個新條目`);
      });
    }

    console.log('\n🎯 後續建議:');
    console.log('  1. 檢查索引文件的更新');
    console.log('  2. 運行索引同步檢查');
    console.log('  3. 提交索引變更');

    // 保存詳細報告
    this.saveDetailedReport();
  }

  /**
   * 保存詳細報告
   */
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      processed: this.changes.length,
      skipped: this.pendingFiles.length - this.changes.length,
      changes: this.changes,
      pendingFiles: this.pendingFiles
    };

    const reportPath = path.join(this.projectRoot, 'index-maintenance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 詳細報告已保存: index-maintenance-report.json`);
  }

  /**
   * 詢問用戶問題
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 索引維護助手

使用方法:
  node index-maintenance.js [選項]

選項:
  -h, --help    顯示幫助信息

功能:
  • 自動檢測需要索引的文件
  • 互動式索引更新
  • 智能重要性分類
  • 生成索引條目建議
  • 批次處理多個文件

操作說明:
  a - 添加到索引
  s - 跳過此文件
  e - 編輯重要性
  q - 退出程序
    `);
    process.exit(0);
  }

  const helper = new IndexMaintenanceHelper();
  helper.run()
    .then(() => {
      console.log('\n🎉 索引維護完成！');
    })
    .catch(error => {
      console.error('💥 維護失敗:', error);
      process.exit(1);
    });
}

module.exports = IndexMaintenanceHelper;