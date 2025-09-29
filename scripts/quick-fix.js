/**
 * ================================================================
 * 檔案名稱: AI銷售賦能平台 - 快速修復腳本
 * 檔案用途: 常見環境問題的一鍵快速修復
 * 開發階段: 開發工具
 * ================================================================
 *
 * 功能索引:
 * 1. 依賴問題修復 - 清理重裝node_modules
 * 2. 環境變數修復 - 自動修正.env.local配置
 * 3. 服務重啟 - 停止並重新啟動開發服務
 * 4. 完整重置 - 一鍵重置所有環境
 * 
 * 使用方法:
 * npm run fix:deps     # 修復依賴問題
 * npm run fix:env      # 修復環境變數
 * npm run fix:all      # 完整修復
 * npm run fix:restart  # 重啟服務
 * ================================================================
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

class QuickFix {
  constructor() {
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
  }

  log(message, color = 'reset', bold = false) {
    const colorCode = this.colors[color] || this.colors.reset;
    const boldCode = bold ? this.colors.bold : '';
    console.log(`${boldCode}${colorCode}${message}${this.colors.reset}`);
  }

  /**
   * 修復依賴問題
   */
  async fixDependencies() {
    this.log('🔧 開始修復依賴問題...', 'blue', true);
    
    try {
      // 停止所有 Node.js 進程
      this.log('🛑 停止現有 Node.js 進程...');
      try {
        if (process.platform === 'win32') {
          execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
        } else {
          execSync('pkill -f node', { stdio: 'ignore' });
        }
      } catch (e) {
        // 忽略錯誤，可能沒有運行的進程
      }

      // 清理 node_modules
      this.log('🗑️ 清理 node_modules...');
      if (fs.existsSync('node_modules')) {
        if (process.platform === 'win32') {
          execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
        } else {
          execSync('rm -rf node_modules', { stdio: 'inherit' });
        }
      }

      // 清理 package-lock.json
      this.log('🗑️ 清理 package-lock.json...');
      if (fs.existsSync('package-lock.json')) {
        fs.unlinkSync('package-lock.json');
      }

      // 清理 npm 緩存
      this.log('🧹 清理 npm 緩存...');
      execSync('npm cache clean --force', { stdio: 'inherit' });

      // 重新安裝依賴
      this.log('📦 重新安裝依賴...');
      execSync('npm install', { stdio: 'inherit' });

      this.log('✅ 依賴修復完成！', 'green', true);
      return true;
    } catch (error) {
      this.log(`❌ 依賴修復失敗: ${error.message}`, 'red');
      return false;
    }
  }

  /**
   * 修復環境變數配置
   */
  async fixEnvironment() {
    this.log('🔧 開始修復環境變數...', 'blue', true);
    
    try {
      if (!fs.existsSync('.env.local')) {
        if (fs.existsSync('.env.example')) {
          this.log('📋 從 .env.example 創建 .env.local...');
          fs.copyFileSync('.env.example', '.env.local');
        } else {
          this.log('❌ 沒有找到 .env.example 文件', 'red');
          return false;
        }
      }

      let envContent = fs.readFileSync('.env.local', 'utf8');
      let modified = false;

      // 修正 DATABASE_URL
      if (envContent.includes('localhost:5432')) {
        this.log('🔧 修正資料庫端口: 5432 → 5433');
        envContent = envContent.replace(/localhost:5432/g, 'localhost:5433');
        modified = true;
      }

      if (envContent.includes('ai_sales_user:secure_password_123')) {
        this.log('🔧 修正資料庫憑據');
        envContent = envContent.replace(/ai_sales_user:secure_password_123/g, 'postgres:dev_password_123');
        modified = true;
      }

      if (envContent.includes('ai_sales_enablement')) {
        this.log('🔧 修正資料庫名稱');
        envContent = envContent.replace(/ai_sales_enablement/g, 'ai_sales_db');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync('.env.local', envContent);
        this.log('✅ 環境變數修復完成！', 'green', true);
      } else {
        this.log('✅ 環境變數配置正確，無需修復！', 'green');
      }

      return true;
    } catch (error) {
      this.log(`❌ 環境變數修復失敗: ${error.message}`, 'red');
      return false;
    }
  }

  /**
   * 檢查並啟動 Docker 服務
   */
  async checkDockerServices() {
    this.log('🐳 檢查 Docker 服務...', 'blue');
    
    try {
      // 檢查 Docker 是否運行
      execSync('docker --version', { stdio: 'ignore' });
      
      // 檢查容器狀態
      const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
      
      if (!containers.includes('ai_sales_postgres')) {
        this.log('🚀 啟動 PostgreSQL 容器...');
        execSync('docker-compose -f docker-compose.dev.yml up -d postgres', { stdio: 'inherit' });
      } else {
        this.log('✅ PostgreSQL 容器已運行', 'green');
      }

      if (!containers.includes('ai_sales_redis')) {
        this.log('🚀 啟動 Redis 容器...');
        execSync('docker-compose -f docker-compose.dev.yml up -d redis', { stdio: 'inherit' });
      } else {
        this.log('✅ Redis 容器已運行', 'green');
      }

      return true;
    } catch (error) {
      this.log(`⚠️ Docker 服務檢查失敗: ${error.message}`, 'yellow');
      this.log('💡 請手動啟動 Docker Desktop 並運行:', 'blue');
      this.log('   docker-compose -f docker-compose.dev.yml up -d', 'blue');
      return false;
    }
  }

  /**
   * 重啟開發服務
   */
  async restartServices() {
    this.log('🔄 重啟開發服務...', 'blue', true);
    
    try {
      // 停止現有服務
      this.log('🛑 停止現有服務...');
      try {
        if (process.platform === 'win32') {
          execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
        } else {
          execSync('pkill -f "next dev"', { stdio: 'ignore' });
        }
      } catch (e) {
        // 忽略錯誤
      }

      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.log('🚀 啟動開發服務器...');
      this.log('💡 請手動運行: npm run dev', 'blue');
      
      return true;
    } catch (error) {
      this.log(`❌ 服務重啟失敗: ${error.message}`, 'red');
      return false;
    }
  }

  /**
   * 完整修復流程
   */
  async fixAll() {
    this.log('🚀 開始完整修復流程...', 'blue', true);
    this.log('='.repeat(50));

    const steps = [
      { name: '環境變數修復', func: () => this.fixEnvironment() },
      { name: 'Docker 服務檢查', func: () => this.checkDockerServices() },
      { name: '依賴修復', func: () => this.fixDependencies() },
      { name: '服務重啟準備', func: () => this.restartServices() }
    ];

    let successCount = 0;
    for (const step of steps) {
      this.log(`\n📋 執行: ${step.name}`, 'blue');
      const success = await step.func();
      if (success) {
        successCount++;
        this.log(`✅ ${step.name} 完成`, 'green');
      } else {
        this.log(`❌ ${step.name} 失敗`, 'red');
      }
    }

    this.log('\n' + '='.repeat(50));
    this.log(`📊 修復結果: ${successCount}/${steps.length} 步驟成功`, successCount === steps.length ? 'green' : 'yellow', true);
    
    if (successCount === steps.length) {
      this.log('🎉 完整修復成功！', 'green', true);
      this.log('💡 現在可以運行 npm run dev 啟動項目', 'blue');
    } else {
      this.log('⚠️ 部分修復失敗，請檢查上述錯誤信息', 'yellow');
    }
  }

  /**
   * 快速診斷
   */
  async quickDiagnose() {
    this.log('🔍 快速診斷環境問題...', 'blue', true);
    
    const checks = [
      {
        name: 'Node.js 版本',
        check: () => {
          const version = execSync('node --version', { encoding: 'utf8' }).trim();
          return version.includes('v18') || version.includes('v20') || version.includes('v22');
        }
      },
      {
        name: 'npm 可用性',
        check: () => {
          execSync('npm --version', { encoding: 'utf8' });
          return true;
        }
      },
      {
        name: 'package.json 存在',
        check: () => fs.existsSync('package.json')
      },
      {
        name: 'node_modules 存在',
        check: () => fs.existsSync('node_modules')
      },
      {
        name: '.env.local 存在',
        check: () => fs.existsSync('.env.local')
      },
      {
        name: '關鍵依賴包',
        check: () => {
          const deps = ['@radix-ui/react-checkbox', '@azure/msal-node'];
          return deps.every(dep => fs.existsSync(path.join('node_modules', dep)));
        }
      }
    ];

    let passCount = 0;
    for (const check of checks) {
      try {
        const result = check.check();
        if (result) {
          this.log(`✅ ${check.name}`, 'green');
          passCount++;
        } else {
          this.log(`❌ ${check.name}`, 'red');
        }
      } catch (error) {
        this.log(`❌ ${check.name}: ${error.message}`, 'red');
      }
    }

    this.log(`\n📊 診斷結果: ${passCount}/${checks.length} 項目正常`, passCount === checks.length ? 'green' : 'yellow');
    
    if (passCount < checks.length) {
      this.log('\n💡 建議執行完整修復:', 'blue');
      this.log('   npm run fix:all', 'blue');
    }
  }
}

// 主執行邏輯
if (require.main === module) {
  const command = process.argv[2];
  const quickFix = new QuickFix();

  switch (command) {
    case 'deps':
      quickFix.fixDependencies();
      break;
    case 'env':
      quickFix.fixEnvironment();
      break;
    case 'restart':
      quickFix.restartServices();
      break;
    case 'docker':
      quickFix.checkDockerServices();
      break;
    case 'diagnose':
      quickFix.quickDiagnose();
      break;
    case 'all':
    default:
      quickFix.fixAll();
      break;
  }
}

module.exports = QuickFix;
