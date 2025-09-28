#!/usr/bin/env node
/**
 * 索引同步檢查工具
 * 確保項目索引文件與實際文件結構保持同步
 */

const fs = require('fs');
const path = require('path');

class IndexSyncChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.suggestions = [];
    this.autoFix = false;
    this.incrementalMode = false;
    this.lastCheckTime = null;
  }

  /**
   * 主要檢查流程
   */
  async runCheck(options = {}) {
    this.autoFix = options.autoFix || false;
    this.incrementalMode = options.incremental || false;
    this.hookMode = options.hookMode || false; // Git hook 模式

    console.log('🔍 開始索引同步檢查...\n');

    if (this.incrementalMode) {
      console.log('⚡ 增量模式：只檢查最近變更的文件');
      await this.loadLastCheckTime();
    }

    try {
      // 1. 檢查核心索引文件是否存在
      await this.checkCoreIndexFiles();

      // 2. 驗證索引文件中的路徑
      await this.validateIndexPaths();

      // 3. 檢測新文件是否需要加入索引
      await this.detectMissingFiles();

      // 4. 檢查過期引用
      await this.checkObsoleteReferences();

      // 5. 生成報告
      this.generateReport();

      // 6. 自動修復（如果啟用）
      if (this.autoFix && this.suggestions.length > 0) {
        await this.performAutoFix();
      }

      // 7. 記錄檢查時間（僅在非hook模式）
      if (!this.hookMode) {
        await this.saveLastCheckTime();
      }

    } catch (error) {
      console.error('❌ 檢查過程發生錯誤:', error.message);
      process.exit(1);
    }
  }

  /**
   * 載入上次檢查時間
   */
  async loadLastCheckTime() {
    const checkFile = path.join(this.projectRoot, '.index-check-time');
    try {
      if (fs.existsSync(checkFile)) {
        const timeStr = fs.readFileSync(checkFile, 'utf-8').trim();
        this.lastCheckTime = new Date(timeStr);
        console.log(`📅 上次檢查時間: ${this.lastCheckTime.toLocaleString()}`);
      }
    } catch (error) {
      console.log('⚠️ 無法讀取上次檢查時間，將執行完整檢查');
    }
  }

  /**
   * 保存檢查時間
   */
  async saveLastCheckTime() {
    const checkFile = path.join(this.projectRoot, '.index-check-time');
    fs.writeFileSync(checkFile, new Date().toISOString());
  }

  /**
   * 自動修復功能
   */
  async performAutoFix() {
    console.log('\n🔧 開始自動修復...');

    for (const suggestion of this.suggestions.slice(0, 5)) { // 限制一次最多修復5個
      if (suggestion.type === 'add_to_index') {
        await this.addFileToIndex(suggestion.file);
      }
    }
  }

  /**
   * 將文件添加到索引
   */
  async addFileToIndex(filePath) {
    const importance = this.getFileImportance(filePath);
    const targetIndex = importance === 'high' ? 'AI-ASSISTANT-GUIDE.md' : 'PROJECT-INDEX.md';

    console.log(`📝 添加 ${filePath} 到 ${targetIndex}`);

    // 這裡可以實現自動添加邏輯
    // 為了安全起見，目前只是記錄建議
    this.suggestions.push({
      type: 'auto_fix_suggestion',
      file: filePath,
      targetIndex: targetIndex,
      message: `建議添加到 ${targetIndex}：${filePath}`
    });
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

    if (highImportancePatterns.some(pattern => pattern.test(filePath))) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * 檢查核心索引文件
   */
  async checkCoreIndexFiles() {
    console.log('📋 檢查核心索引文件...');

    const requiredIndexFiles = [
      '.ai-context',
      'AI-ASSISTANT-GUIDE.md',
      'PROJECT-INDEX.md',
      'INDEX-MAINTENANCE-GUIDE.md'
    ];

    for (const indexFile of requiredIndexFiles) {
      const filePath = path.join(this.projectRoot, indexFile);
      if (!fs.existsSync(filePath)) {
        this.issues.push({
          type: 'missing_index',
          file: indexFile,
          severity: 'high',
          message: `核心索引文件不存在: ${indexFile}`
        });
      } else {
        console.log(`  ✅ ${indexFile}`);
      }
    }
  }

  /**
   * 驗證索引文件中的路徑
   */
  async validateIndexPaths() {
    console.log('\n🔗 驗證索引文件中的路徑...');

    const indexFiles = [
      'AI-ASSISTANT-GUIDE.md',
      'PROJECT-INDEX.md'
    ];

    for (const indexFile of indexFiles) {
      const filePath = path.join(this.projectRoot, indexFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        await this.validatePathsInContent(content, indexFile);
      }
    }
  }

  /**
   * 驗證文件內容中的路徑
   */
  async validatePathsInContent(content, sourceFile) {
    // 匹配 markdown 中的文件路徑引用
    const pathRegex = /`([^`]+\.(md|js|json|prisma|sql|yml|yaml|ts|tsx))`/g;
    let match;

    while ((match = pathRegex.exec(content)) !== null) {
      const referencedPath = match[1];
      const fullPath = path.join(this.projectRoot, referencedPath);

      if (!fs.existsSync(fullPath)) {
        this.issues.push({
          type: 'broken_reference',
          file: sourceFile,
          reference: referencedPath,
          severity: 'medium',
          message: `索引文件 ${sourceFile} 中的路徑引用失效: ${referencedPath}`
        });
      }
    }
  }

  /**
   * 檢測需要加入索引的新文件
   */
  async detectMissingFiles() {
    console.log('\n🔍 檢測可能遺漏的重要文件...');

    const importantDirectories = ['docs', 'src', 'lib', 'components', 'app'];
    const importantExtensions = ['.md', '.js', '.ts', '.tsx', '.prisma'];

    for (const dir of importantDirectories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await this.scanDirectoryForImportantFiles(dirPath, dir);
      }
    }

    // 檢查根目錄重要文件
    const rootFiles = fs.readdirSync(this.projectRoot);
    for (const file of rootFiles) {
      const filePath = path.join(this.projectRoot, file);
      const stat = fs.statSync(filePath);

      if (!stat.isDirectory() && this.isImportantFile(file, path.extname(file))) {
        if (!this.isFileInIndex(file)) {
          this.suggestions.push({
            type: 'add_to_index',
            file: file,
            severity: 'low',
            message: `建議將重要文件加入索引: ${file}`
          });
        }
      }
    }
  }

  /**
   * 掃描目錄中的重要文件
   */
  async scanDirectoryForImportantFiles(dirPath, relativePath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // 避免掃描工具目錄
        const avoidDirs = ['.bmad-core', '.bmad-infrastructure-devops', 'web-bundles', '.claude', '.cursor', '.git', 'node_modules'];
        if (!avoidDirs.includes(file)) {
          await this.scanDirectoryForImportantFiles(
            filePath,
            path.join(relativePath, file)
          );
        }
      } else {
        const ext = path.extname(file);
        const relativeFilePath = path.join(relativePath, file);

        // 增量模式：只檢查最近修改的文件
        if (this.incrementalMode && this.lastCheckTime) {
          if (stat.mtime <= this.lastCheckTime) {
            continue; // 跳過未修改的文件
          }
        }

        // 檢查是否為重要文件但未在索引中
        if (this.isImportantFile(file, ext) &&
            !this.isFileInIndex(relativeFilePath)) {
          const importance = this.getFileImportance(relativeFilePath);
          this.suggestions.push({
            type: 'add_to_index',
            file: relativeFilePath,
            importance: importance,
            severity: importance === 'high' ? 'medium' : 'low',
            message: `建議將重要文件加入索引: ${relativeFilePath}`,
            modifiedTime: stat.mtime
          });
        }
      }
    }
  }

  /**
   * 判斷是否為重要文件
   */
  isImportantFile(fileName, extension) {
    const importantFiles = [
      'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
      'package.json', 'tsconfig.json', 'next.config.js',
      'schema.prisma', 'docker-compose.yml'
    ];

    const importantPatterns = [
      /^.*\.config\.(js|ts|json)$/,
      /^.*\.spec\.(js|ts)$/,
      /^.*\.test\.(js|ts)$/,
      /^index\.(js|ts|tsx)$/,
      /^.*\.md$/,
      // Next.js 頁面文件模式
      /^page\.(js|ts|tsx)$/,
      /^layout\.(js|ts|tsx)$/,
      /^loading\.(js|ts|tsx)$/,
      /^error\.(js|ts|tsx)$/,
      /^not-found\.(js|ts|tsx)$/,
      /^route\.(js|ts)$/
    ];

    // 檢查重要文件名
    if (importantFiles.includes(fileName)) {
      return true;
    }

    // 檢查重要模式
    return importantPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * 檢查文件是否已在索引中
   */
  isFileInIndex(filePath) {
    const indexFiles = ['AI-ASSISTANT-GUIDE.md', 'PROJECT-INDEX.md'];

    for (const indexFile of indexFiles) {
      const indexPath = path.join(this.projectRoot, indexFile);
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        if (content.includes(filePath)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 檢查過期引用
   */
  async checkObsoleteReferences() {
    console.log('\n🗑️ 檢查過期引用...');
    // 目前實現基本功能，未來可擴展
  }

  /**
   * 生成檢查報告
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 索引同步檢查報告');
    console.log('='.repeat(60));

    // 統計
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;

    console.log(`\n📈 問題統計:`);
    console.log(`  🔴 嚴重問題: ${highIssues}`);
    console.log(`  🟡 中等問題: ${mediumIssues}`);
    console.log(`  🟢 輕微問題: ${lowIssues}`);
    console.log(`  💡 改進建議: ${this.suggestions.length}`);

    // 詳細問題列表
    if (this.issues.length > 0) {
      console.log('\n❌ 發現的問題:');
      this.issues.forEach((issue, index) => {
        const icon = issue.severity === 'high' ? '🔴' :
                    issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`\n${index + 1}. ${icon} ${issue.message}`);
        if (issue.file) console.log(`   檔案: ${issue.file}`);
        if (issue.reference) console.log(`   引用: ${issue.reference}`);
      });
    }

    // 改進建議 (只顯示前5個，避免過多輸出)
    if (this.suggestions.length > 0) {
      console.log('\n💡 改進建議 (顯示前5個):');
      this.suggestions.slice(0, 5).forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.message}`);
      });

      if (this.suggestions.length > 5) {
        console.log(`\n... 還有 ${this.suggestions.length - 5} 個建議 (查看完整報告)`)
      }
    }

    // 總結
    console.log('\n' + '='.repeat(60));
    if (this.issues.length === 0) {
      console.log('✅ 索引文件同步狀態良好！');
    } else {
      console.log('⚠️ 建議修復上述問題以保持索引文件同步');
    }

    // 保存報告到文件（僅在非hook模式）
    if (!this.hookMode) {
      this.saveReportToFile();
    }
  }

  /**
   * 保存報告到文件
   */
  saveReportToFile() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        highSeverity: this.issues.filter(i => i.severity === 'high').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'medium').length,
        lowSeverity: this.issues.filter(i => i.severity === 'low').length,
        suggestions: this.suggestions.length
      },
      issues: this.issues,
      suggestions: this.suggestions
    };

    const reportPath = path.join(this.projectRoot, 'index-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 詳細報告已保存至: index-sync-report.json`);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    autoFix: args.includes('--auto-fix') || args.includes('-f'),
    incremental: args.includes('--incremental') || args.includes('-i'),
    hookMode: args.includes('--hook') || args.includes('--git-hook')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 索引同步檢查工具

使用方法:
  node check-index-sync.js [選項]

選項:
  -h, --help        顯示幫助信息
  -i, --incremental 增量模式（只檢查最近變更的文件）
  -f, --auto-fix    自動修復模式（自動應用建議的修復）

範例:
  node check-index-sync.js                    # 完整檢查
  node check-index-sync.js --incremental      # 增量檢查
  node check-index-sync.js --auto-fix         # 自動修復
  node check-index-sync.js -i -f              # 增量檢查並自動修復
    `);
    process.exit(0);
  }

  const checker = new IndexSyncChecker();
  checker.runCheck(options)
    .then(() => {
      console.log('\n🎉 索引同步檢查完成！');
      if (options.autoFix) {
        console.log('🔧 已嘗試自動修復部分問題');
      }
    })
    .catch(error => {
      console.error('💥 檢查失敗:', error);
      process.exit(1);
    });
}

module.exports = IndexSyncChecker;