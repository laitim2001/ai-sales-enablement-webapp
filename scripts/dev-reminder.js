#!/usr/bin/env node
/**
 * 每日開發提醒腳本
 *
 * 功能：
 * 1. 檢查上次索引更新時間
 * 2. 列出未索引的新文件
 * 3. 提供快速索引更新命令
 * 4. 顯示項目健康狀態
 */

const fs = require('fs');
const path = require('path');

class DevReminder {
  constructor() {
    this.projectRoot = process.cwd();
    this.reminderFile = path.join(this.projectRoot, '.dev-reminder-data');
  }

  /**
   * 運行開發提醒
   */
  async run() {
    const isQuietMode = process.argv.includes('--quiet') || process.argv.includes('-q');

    if (!isQuietMode) {
      console.log('📊 每日開發提醒檢查\n');
    }

    try {
      // 1. 檢查索引健康狀態
      const indexHealth = await this.checkIndexHealth();

      // 2. 檢查最近的文件變更
      const recentChanges = await this.checkRecentChanges();

      // 3. 檢查提醒頻率
      const shouldRemind = await this.shouldShowReminder();

      // 4. 顯示提醒（如果需要）
      if (shouldRemind || !isQuietMode) {
        this.displayReminder(indexHealth, recentChanges);
      }

      // 5. 更新提醒數據
      await this.updateReminderData();

    } catch (error) {
      console.error('❌ 開發提醒檢查失敗:', error.message);
    }
  }

  /**
   * 檢查索引健康狀態
   */
  async checkIndexHealth() {
    // 使用現有的檢查工具但不顯示輸出
    const IndexSyncChecker = require('./check-index-sync.js');
    const checker = new IndexSyncChecker();

    // 暫時捕獲輸出
    const originalLog = console.log;
    const originalError = console.error;
    console.log = () => {};
    console.error = () => {};

    let health = {
      issues: 0,
      suggestions: 0,
      newFiles: [],
      status: 'unknown'
    };

    try {
      await checker.runCheck({ incremental: true });

      health.issues = checker.issues.length;
      health.suggestions = checker.suggestions.length;
      health.newFiles = checker.suggestions
        .filter(s => s.type === 'add_to_index')
        .map(s => s.file)
        .slice(0, 5); // 只顯示前5個

      if (health.issues === 0 && health.suggestions === 0) {
        health.status = 'excellent';
      } else if (health.issues === 0 && health.suggestions <= 3) {
        health.status = 'good';
      } else if (health.issues <= 2) {
        health.status = 'fair';
      } else {
        health.status = 'poor';
      }

    } catch (error) {
      health.status = 'error';
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    return health;
  }

  /**
   * 檢查最近的文件變更
   */
  async checkRecentChanges() {
    const changes = {
      today: 0,
      thisWeek: 0,
      importantFiles: []
    };

    try {
      const importantDirs = ['docs', 'src', 'lib', 'components', 'app'];
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

      for (const dir of importantDirs) {
        const dirPath = path.join(this.projectRoot, dir);
        if (fs.existsSync(dirPath)) {
          await this.scanDirectoryForChanges(dirPath, dir, todayStart, weekStart, changes);
        }
      }

    } catch (error) {
      // 忽略錯誤，繼續執行
    }

    return changes;
  }

  /**
   * 掃描目錄變更
   */
  async scanDirectoryForChanges(dirPath, relativePath, todayStart, weekStart, changes) {
    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // 避免掃描工具目錄
          const avoidDirs = ['.bmad-core', '.bmad-infrastructure-devops', 'web-bundles', '.claude', '.cursor', '.git', 'node_modules'];
          if (!avoidDirs.includes(file)) {
            await this.scanDirectoryForChanges(
              filePath,
              path.join(relativePath, file),
              todayStart,
              weekStart,
              changes
            );
          }
        } else {
          const ext = path.extname(file);
          const relativeFilePath = path.join(relativePath, file);

          // 檢查重要文件
          if (this.isImportantFile(file, ext)) {
            if (stat.mtime >= todayStart) {
              changes.today++;
              changes.importantFiles.push({
                file: relativeFilePath,
                type: 'today'
              });
            } else if (stat.mtime >= weekStart) {
              changes.thisWeek++;
              changes.importantFiles.push({
                file: relativeFilePath,
                type: 'week'
              });
            }
          }
        }
      }
    } catch (error) {
      // 忽略單個目錄的錯誤
    }
  }

  /**
   * 判斷是否為重要文件
   */
  isImportantFile(fileName, extension) {
    const importantExtensions = ['.md', '.js', '.ts', '.tsx', '.json', '.prisma', '.sql', '.yml', '.yaml'];
    return importantExtensions.includes(extension);
  }

  /**
   * 檢查是否應該顯示提醒
   */
  async shouldShowReminder() {
    try {
      if (!fs.existsSync(this.reminderFile)) {
        return true; // 第一次運行
      }

      const data = JSON.parse(fs.readFileSync(this.reminderFile, 'utf-8'));
      const lastReminder = new Date(data.lastReminder);
      const now = new Date();

      // 超過24小時或者有重要變更
      const hoursSinceLastReminder = (now - lastReminder) / (1000 * 60 * 60);
      return hoursSinceLastReminder >= 24 || data.importantChanges > 0;

    } catch (error) {
      return true; // 出錯時顯示提醒
    }
  }

  /**
   * 顯示提醒
   */
  displayReminder(indexHealth, recentChanges) {
    // 狀態圖標
    const statusIcons = {
      'excellent': '🟢',
      'good': '🟡',
      'fair': '🟠',
      'poor': '🔴',
      'error': '❓'
    };

    const statusMessages = {
      'excellent': '索引狀態優秀',
      'good': '索引狀態良好',
      'fair': '索引需要小幅調整',
      'poor': '索引需要重要更新',
      'error': '索引檢查出錯'
    };

    console.log('📊 AI 銷售賦能平台 - 開發狀態');
    console.log('=' .repeat(40));

    // 索引健康狀態
    console.log(`\n🔍 索引健康: ${statusIcons[indexHealth.status]} ${statusMessages[indexHealth.status]}`);

    if (indexHealth.issues > 0) {
      console.log(`   🔴 問題數量: ${indexHealth.issues}`);
    }

    if (indexHealth.suggestions > 0) {
      console.log(`   💡 改進建議: ${indexHealth.suggestions}`);
    }

    // 最近變更
    console.log(`\n📈 最近變更:`);
    console.log(`   📅 今日: ${recentChanges.today} 個重要文件`);
    console.log(`   📆 本週: ${recentChanges.thisWeek} 個重要文件`);

    // 未索引的新文件
    if (indexHealth.newFiles.length > 0) {
      console.log(`\n📋 需要索引的文件:`);
      indexHealth.newFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });

      if (indexHealth.suggestions > indexHealth.newFiles.length) {
        const remaining = indexHealth.suggestions - indexHealth.newFiles.length;
        console.log(`   ... 還有 ${remaining} 個文件`);
      }
    }

    // 快速操作建議
    console.log(`\n🚀 快速操作:`);

    if (indexHealth.status !== 'excellent') {
      console.log(`   🔧 檢查索引: npm run index:check`);

      if (indexHealth.suggestions > 0) {
        console.log(`   📝 維護索引: npm run index:update`);
      }
    }

    if (recentChanges.today > 0 || recentChanges.thisWeek > 3) {
      console.log(`   ⚡ 增量檢查: npm run index:check -- --incremental`);
    }

    // 時間信息
    const now = new Date();
    console.log(`\n⏰ 檢查時間: ${now.toLocaleString()}`);

    // 項目狀態總結
    this.displayProjectSummary(indexHealth, recentChanges);
  }

  /**
   * 顯示項目狀態總結
   */
  displayProjectSummary(indexHealth, recentChanges) {
    console.log('\n🎯 項目狀態總結:');
    console.log('-' .repeat(40));

    // 整體健康度評分
    let score = 100;
    score -= indexHealth.issues * 20;      // 每個問題扣20分
    score -= indexHealth.suggestions * 5;  // 每個建議扣5分
    score = Math.max(0, score);

    const healthLevel = score >= 90 ? '優秀' :
                       score >= 70 ? '良好' :
                       score >= 50 ? '一般' : '需要改進';

    console.log(`   📊 健康度: ${score}/100 (${healthLevel})`);

    // 活躍度
    const activity = recentChanges.today + recentChanges.thisWeek;
    const activityLevel = activity >= 10 ? '高' :
                         activity >= 5 ? '中' :
                         activity >= 1 ? '低' : '無';

    console.log(`   🔥 活躍度: ${activityLevel} (${activity} 個文件變更)`);

    // 維護建議
    if (score < 70 || activity >= 5) {
      console.log('\n💡 維護建議:');

      if (indexHealth.suggestions > 3) {
        console.log('   • 執行索引維護，處理待索引文件');
      }

      if (indexHealth.issues > 0) {
        console.log('   • 修復索引同步問題');
      }

      if (activity >= 5) {
        console.log('   • 考慮設置自動索引監控');
      }
    }
  }

  /**
   * 更新提醒數據
   */
  async updateReminderData() {
    const data = {
      lastReminder: new Date().toISOString(),
      totalRuns: 1,
      importantChanges: 0
    };

    try {
      if (fs.existsSync(this.reminderFile)) {
        const existing = JSON.parse(fs.readFileSync(this.reminderFile, 'utf-8'));
        data.totalRuns = (existing.totalRuns || 0) + 1;
      }

      fs.writeFileSync(this.reminderFile, JSON.stringify(data, null, 2));
    } catch (error) {
      // 忽略寫入錯誤
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📊 每日開發提醒工具

使用方法:
  node dev-reminder.js [選項]

選項:
  -h, --help    顯示幫助信息
  -q, --quiet   靜默模式（只在需要時顯示提醒）

功能:
  • 檢查索引健康狀態
  • 監控最近文件變更
  • 提供快速操作建議
  • 顯示項目活躍度
  • 智能提醒頻率控制

使用場景:
  • 每日開發開始時運行
  • 集成到開發工作流程
  • 自動化項目健康檢查
    `);
    process.exit(0);
  }

  const reminder = new DevReminder();
  reminder.run()
    .then(() => {
      if (!args.includes('--quiet')) {
        console.log('\n🎉 開發提醒檢查完成！');
      }
    })
    .catch(error => {
      console.error('💥 開發提醒失敗:', error);
      process.exit(1);
    });
}

module.exports = DevReminder;