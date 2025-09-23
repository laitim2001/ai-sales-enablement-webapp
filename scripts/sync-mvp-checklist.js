#!/usr/bin/env node

/**
 * MVP 實施檢查清單自動同步腳本
 * 自動檢查項目實際狀態，更新 mvp-implementation-checklist.md 的完成狀態
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MVPChecklistSyncer {
  constructor() {
    this.checklistPath = path.join(__dirname, '..', 'docs', 'mvp-implementation-checklist.md');
    this.projectRoot = path.join(__dirname, '..');
    this.checkResults = [];
  }

  /**
   * 檢查文件是否存在
   */
  checkFileExists(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查目錄是否存在
   */
  checkDirectoryExists(dirPath) {
    try {
      const fullPath = path.join(this.projectRoot, dirPath);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查NPM腳本是否存在
   */
  checkNpmScript(scriptName) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      return !!(packageJson.scripts && packageJson.scripts[scriptName]);
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查依賴包是否安裝
   */
  checkDependency(packageName, type = 'dependencies') {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const deps = packageJson[type] || {};
      return !!deps[packageName];
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查Docker服務是否配置
   */
  checkDockerService(serviceName) {
    try {
      const dockerComposePath = path.join(this.projectRoot, 'docker-compose.dev.yml');
      if (!fs.existsSync(dockerComposePath)) return false;

      const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
      return dockerComposeContent.includes(`${serviceName}:`);
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查API路由是否存在
   */
  checkAPIRoute(routePath) {
    try {
      const fullPath = path.join(this.projectRoot, 'app', 'api', routePath, 'route.ts');
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * 檢查Prisma schema是否包含特定表
   */
  checkPrismaModel(modelName) {
    try {
      const schemaPath = path.join(this.projectRoot, 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) return false;

      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      return schemaContent.includes(`model ${modelName}`);
    } catch (error) {
      return false;
    }
  }

  /**
   * 執行所有檢查
   */
  runAllChecks() {
    console.log('🔍 開始檢查 MVP 實施狀態...\n');

    // Week 1 檢查項目
    this.checkResults.push({
      week: 1,
      title: '項目初始化和環境設置',
      items: [
        {
          name: 'Next.js 14 項目創建',
          check: () => this.checkFileExists('package.json') && this.checkFileExists('next.config.js'),
          completed: false
        },
        {
          name: 'TypeScript 配置',
          check: () => this.checkFileExists('tsconfig.json'),
          completed: false
        },
        {
          name: 'Tailwind CSS 設置',
          check: () => this.checkFileExists('tailwind.config.js') && this.checkDependency('tailwindcss', 'devDependencies'),
          completed: false
        },
        {
          name: 'ESLint 和 Prettier 配置',
          check: () => this.checkFileExists('.eslintrc.json'),
          completed: false
        },
        {
          name: 'Docker 開發環境',
          check: () => this.checkFileExists('docker-compose.dev.yml'),
          completed: false
        },
        {
          name: 'PostgreSQL + pgvector 設置',
          check: () => this.checkDockerService('postgres') && this.checkFileExists('scripts/init-db.sql'),
          completed: false
        },
        {
          name: 'Prisma ORM 配置',
          check: () => this.checkFileExists('prisma/schema.prisma') && this.checkDependency('@prisma/client'),
          completed: false
        },
        {
          name: '環境變數管理',
          check: () => this.checkFileExists('.env.example'),
          completed: false
        }
      ]
    });

    // Week 2 檢查項目
    this.checkResults.push({
      week: 2,
      title: '核心資料模型和API架構',
      items: [
        {
          name: 'User 模型設計',
          check: () => this.checkPrismaModel('User'),
          completed: false
        },
        {
          name: 'Knowledge Base 模型',
          check: () => this.checkPrismaModel('KnowledgeBase'),
          completed: false
        },
        {
          name: 'Document 模型設計',
          check: () => this.checkPrismaModel('Document'),
          completed: false
        },
        {
          name: 'JWT 認證系統',
          check: () => this.checkFileExists('lib/auth.ts') && this.checkDependency('jsonwebtoken'),
          completed: false
        },
        {
          name: '用戶註冊 API',
          check: () => this.checkAPIRoute('auth/register'),
          completed: false
        },
        {
          name: '用戶登入 API',
          check: () => this.checkAPIRoute('auth/login'),
          completed: false
        },
        {
          name: '資料庫遷移',
          check: () => this.checkDirectoryExists('prisma/migrations'),
          completed: false
        },
        {
          name: 'API 測試腳本',
          check: () => this.checkDirectoryExists('tests') || this.checkDirectoryExists('__tests__'),
          completed: false
        }
      ]
    });

    // Week 3 檢查項目
    this.checkResults.push({
      week: 3,
      title: '前端基礎架構',
      items: [
        {
          name: 'UI 組件庫基礎',
          check: () => this.checkDirectoryExists('components'),
          completed: false
        },
        {
          name: '登入頁面',
          check: () => this.checkFileExists('app/(auth)/login/page.tsx') || this.checkFileExists('app/login/page.tsx'),
          completed: false
        },
        {
          name: '註冊頁面',
          check: () => this.checkFileExists('app/(auth)/register/page.tsx') || this.checkFileExists('app/register/page.tsx'),
          completed: false
        },
        {
          name: '主儀表板布局',
          check: () => this.checkFileExists('app/(dashboard)/layout.tsx') || this.checkFileExists('app/dashboard/layout.tsx'),
          completed: false
        },
        {
          name: '響應式導航',
          check: () => this.checkDirectoryExists('components/navigation') || this.checkDirectoryExists('components/layout'),
          completed: false
        },
        {
          name: '狀態管理設置',
          check: () => this.checkDependency('@tanstack/react-query') || this.checkDependency('zustand'),
          completed: false
        },
        {
          name: '表單驗證',
          check: () => this.checkDependency('react-hook-form') && this.checkDependency('zod'),
          completed: false
        },
        {
          name: '錯誤處理機制',
          check: () => this.checkFileExists('app/error.tsx') || this.checkFileExists('components/ErrorBoundary.tsx'),
          completed: false
        }
      ]
    });

    // Week 4 檢查項目
    this.checkResults.push({
      week: 4,
      title: '知識庫管理功能',
      items: [
        {
          name: '知識庫列表頁面',
          check: () => this.checkFileExists('app/(dashboard)/knowledge-base/page.tsx'),
          completed: false
        },
        {
          name: '知識庫創建表單',
          check: () => this.checkFileExists('app/(dashboard)/knowledge-base/create/page.tsx'),
          completed: false
        },
        {
          name: '文檔上傳功能',
          check: () => this.checkAPIRoute('documents/upload'),
          completed: false
        },
        {
          name: '文檔處理 API',
          check: () => this.checkAPIRoute('documents') && this.checkFileExists('lib/document-processor.ts'),
          completed: false
        },
        {
          name: '向量化處理',
          check: () => this.checkFileExists('lib/embeddings.ts') || this.checkFileExists('lib/ai/embeddings.ts'),
          completed: false
        },
        {
          name: 'Azure OpenAI 整合',
          check: () => this.checkDependency('@azure/openai') || this.checkDependency('openai'),
          completed: false
        },
        {
          name: '文檔預覽組件',
          check: () => this.checkDirectoryExists('components/documents'),
          completed: false
        },
        {
          name: '基礎搜索功能',
          check: () => this.checkAPIRoute('search'),
          completed: false
        }
      ]
    });

    // 執行所有檢查
    for (const week of this.checkResults) {
      for (const item of week.items) {
        item.completed = item.check();
      }
    }

    this.generateReport();
    this.updateChecklistFile();
  }

  /**
   * 生成檢查報告
   */
  generateReport() {
    console.log('📊 MVP 實施狀態報告\n');
    console.log('=' .repeat(60));

    let totalItems = 0;
    let completedItems = 0;

    for (const week of this.checkResults) {
      const weekCompleted = week.items.filter(item => item.completed).length;
      const weekTotal = week.items.length;
      const weekPercentage = Math.round((weekCompleted / weekTotal) * 100);

      totalItems += weekTotal;
      completedItems += weekCompleted;

      console.log(`\n📅 Week ${week.week}: ${week.title}`);
      console.log(`   進度: ${weekCompleted}/${weekTotal} (${weekPercentage}%)`);
      console.log(`   ${'█'.repeat(Math.floor(weekPercentage / 10))}${'░'.repeat(10 - Math.floor(weekPercentage / 10))} ${weekPercentage}%`);

      // 顯示未完成的項目
      const incompleteItems = week.items.filter(item => !item.completed);
      if (incompleteItems.length > 0) {
        console.log(`   ❌ 待完成: ${incompleteItems.map(item => item.name).join(', ')}`);
      }
    }

    const totalPercentage = Math.round((completedItems / totalItems) * 100);
    console.log('\n' + '=' .repeat(60));
    console.log(`🎯 總體進度: ${completedItems}/${totalItems} (${totalPercentage}%)`);
    console.log(`${'█'.repeat(Math.floor(totalPercentage / 5))}${'░'.repeat(20 - Math.floor(totalPercentage / 5))} ${totalPercentage}%`);

    // 生成JSON報告
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalItems,
        completedItems,
        percentage: totalPercentage
      },
      weeks: this.checkResults
    };

    fs.writeFileSync(
      path.join(this.projectRoot, 'mvp-progress-report.json'),
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n📄 詳細報告已保存至: mvp-progress-report.json');
  }

  /**
   * 更新檢查清單文件
   */
  updateChecklistFile() {
    try {
      if (!fs.existsSync(this.checklistPath)) {
        console.log('⚠️ MVP 檢查清單文件不存在，跳過更新');
        return;
      }

      let content = fs.readFileSync(this.checklistPath, 'utf8');

      // 更新總體進度
      const totalItems = this.checkResults.reduce((sum, week) => sum + week.items.length, 0);
      const completedItems = this.checkResults.reduce((sum, week) =>
        sum + week.items.filter(item => item.completed).length, 0);
      const totalPercentage = Math.round((completedItems / totalItems) * 100);

      // 更新進度條（如果存在）
      const progressBarRegex = /📊 \*\*總體進度\*\*.*\n.*\n/g;
      const newProgressBar = `📊 **總體進度**: ${completedItems}/${totalItems} (${totalPercentage}%)\n${'█'.repeat(Math.floor(totalPercentage / 5))}${'░'.repeat(20 - Math.floor(totalPercentage / 5))} ${totalPercentage}%\n`;

      if (progressBarRegex.test(content)) {
        content = content.replace(progressBarRegex, newProgressBar);
      } else {
        // 如果沒有進度條，在文件開頭添加
        content = `# MVP 實施檢查清單\n\n${newProgressBar}\n${content}`;
      }

      // 更新週進度
      for (const week of this.checkResults) {
        const weekCompleted = week.items.filter(item => item.completed).length;
        const weekTotal = week.items.length;
        const weekPercentage = Math.round((weekCompleted / weekTotal) * 100);

        // 查找並更新週進度
        const weekRegex = new RegExp(`## Week ${week.week}:.*?進度.*?(\\d+)/(\\d+).*?(\\d+)%`, 's');
        const weekReplacement = `## Week ${week.week}: ${week.title}\n\n**進度**: ${weekCompleted}/${weekTotal} (${weekPercentage}%)`;

        if (weekRegex.test(content)) {
          content = content.replace(weekRegex, weekReplacement);
        }
      }

      // 添加最後更新時間
      const updateTimeRegex = /> \*\*最後更新\*\*:.*\n/;
      const newUpdateTime = `> **最後更新**: ${new Date().toLocaleString('zh-TW')} (自動同步)\n`;

      if (updateTimeRegex.test(content)) {
        content = content.replace(updateTimeRegex, newUpdateTime);
      } else {
        content = `${newUpdateTime}\n${content}`;
      }

      fs.writeFileSync(this.checklistPath, content);
      console.log('✅ MVP 檢查清單文件已更新');

    } catch (error) {
      console.error('❌ 更新檢查清單文件失敗:', error.message);
    }
  }
}

// 執行同步
async function main() {
  const syncer = new MVPChecklistSyncer();
  syncer.runAllChecks();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 MVP 同步腳本執行失敗:', error);
    process.exit(1);
  });
}

module.exports = { MVPChecklistSyncer };