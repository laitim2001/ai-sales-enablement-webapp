/**
 * @fileoverview 模組 - 測試套件
 * @module scripts/health-check
 * @description
 * 模組的單元測試
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

#!/usr/bin/env node

/**
 * 服務健康檢查腳本
 * 檢查所有必要服務的運行狀態
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.services = [
      {
        name: 'PostgreSQL',
        check: () => this.checkPostgreSQL(),
        required: true
      },
      {
        name: 'Redis',
        check: () => this.checkRedis(),
        required: true
      },
      {
        name: 'pgvector Extension',
        check: () => this.checkPgVector(),
        required: true
      },
      {
        name: 'Next.js Health API',
        check: () => this.checkNextAPI(),
        required: true
      },
      {
        name: 'Azure OpenAI',
        check: () => this.checkAzureOpenAI(),
        required: false
      }
    ];
  }

  async checkPostgreSQL() {
    try {
      // 檢查 PostgreSQL 容器
      const { stdout } = await execAsync('docker ps --filter "name=ai-sales-postgres-dev" --format "{{.Status}}"');
      if (!stdout.includes('Up')) {
        throw new Error('PostgreSQL container not running');
      }

      // 檢查連接
      await execAsync('docker exec ai-sales-postgres-dev pg_isready -U postgres');
      return { status: 'healthy', message: 'PostgreSQL running and accepting connections' };
    } catch (error) {
      return { status: 'unhealthy', message: `PostgreSQL check failed: ${error.message}` };
    }
  }

  async checkRedis() {
    try {
      const { stdout } = await execAsync('docker ps --filter "name=ai-sales-redis-dev" --format "{{.Status}}"');
      if (!stdout.includes('Up')) {
        throw new Error('Redis container not running');
      }

      const { stdout: pingResult } = await execAsync('docker exec ai-sales-redis-dev redis-cli ping');
      if (!pingResult.includes('PONG')) {
        throw new Error('Redis not responding to ping');
      }

      return { status: 'healthy', message: 'Redis running and responding' };
    } catch (error) {
      return { status: 'unhealthy', message: `Redis check failed: ${error.message}` };
    }
  }

  async checkPgVector() {
    try {
      const { stdout } = await execAsync(`docker exec ai-sales-postgres-dev psql -U postgres -d ai_sales_db -c "SELECT extname FROM pg_extension WHERE extname = 'vector';" -t`);
      if (!stdout.includes('vector')) {
        throw new Error('pgvector extension not installed');
      }

      return { status: 'healthy', message: 'pgvector extension installed and available' };
    } catch (error) {
      return { status: 'unhealthy', message: `pgvector check failed: ${error.message}` };
    }
  }

  async checkNextAPI() {
    try {
      // 尋找 Next.js 進程端口
      const ports = [3000, 3001, 3002, 3003, 3004];
      let healthCheckPassed = false;
      let lastError = null;

      for (const port of ports) {
        try {
          const { stdout } = await execAsync(`curl -s http://localhost:${port}/api/health`, { timeout: 5000 });
          const health = JSON.parse(stdout);
          if (health.status === 'healthy') {
            healthCheckPassed = true;
            return {
              status: 'healthy',
              message: `Next.js app running on port ${port} with healthy database connection`
            };
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      throw lastError || new Error('Next.js health API not responding on any port');
    } catch (error) {
      return { status: 'unhealthy', message: `Next.js API check failed: ${error.message}` };
    }
  }

  async checkAzureOpenAI() {
    try {
      // 檢查環境變數
      if (!process.env.AZURE_OPENAI_API_KEY) {
        throw new Error('AZURE_OPENAI_API_KEY not configured');
      }

      if (!process.env.AZURE_OPENAI_ENDPOINT) {
        throw new Error('AZURE_OPENAI_ENDPOINT not configured');
      }

      // 簡單的 API 連接測試
      const testCommand = `cd poc && node -e "
        require('dotenv').config({ path: '../.env.local' });
        const axios = require('axios');

        axios.post(
          process.env.AZURE_OPENAI_ENDPOINT + '/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01',
          {
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          },
          {
            headers: {
              'api-key': process.env.AZURE_OPENAI_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        ).then(() => {
          console.log('SUCCESS');
        }).catch(err => {
          console.log('ERROR:', err.response?.data?.error || err.message);
        });
      "`;

      const { stdout } = await execAsync(testCommand);
      if (stdout.includes('SUCCESS')) {
        return { status: 'healthy', message: 'Azure OpenAI API responding' };
      } else {
        return { status: 'warning', message: `Azure OpenAI API issue: ${stdout}` };
      }
    } catch (error) {
      return { status: 'warning', message: `Azure OpenAI check failed: ${error.message}` };
    }
  }

  async runAllChecks() {
    console.log('🔍 Running AI Sales Platform Health Checks...\n');

    const results = [];
    let hasFailures = false;

    for (const service of this.services) {
      process.stdout.write(`Checking ${service.name}... `);

      try {
        const result = await service.check();
        results.push({ name: service.name, ...result, required: service.required });

        if (result.status === 'healthy') {
          console.log('✅');
        } else if (result.status === 'warning') {
          console.log('⚠️');
        } else {
          console.log('❌');
          if (service.required) {
            hasFailures = true;
          }
        }
      } catch (error) {
        const result = { status: 'error', message: error.message };
        results.push({ name: service.name, ...result, required: service.required });
        console.log('💥');
        if (service.required) {
          hasFailures = true;
        }
      }
    }

    this.printResults(results, hasFailures);
    return !hasFailures;
  }

  printResults(results, hasFailures) {
    console.log('\n📊 Health Check Results:\n');

    results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' :
                   result.status === 'warning' ? '⚠️' : '❌';
      const requiredText = result.required ? '(Required)' : '(Optional)';

      console.log(`${icon} ${result.name} ${requiredText}`);
      console.log(`   ${result.message}\n`);
    });

    if (hasFailures) {
      console.log('🚨 Some required services are not healthy. Please check the issues above.');
      console.log('📖 See STARTUP-GUIDE.md for troubleshooting steps.\n');
    } else {
      console.log('🎉 All required services are healthy! Ready for development.\n');
    }

    // 提供快速修復建議
    if (hasFailures) {
      console.log('🔧 Quick Fix Commands:');
      console.log('   # Restart all services:');
      console.log('   docker-compose -f docker-compose.dev.yml down');
      console.log('   docker-compose -f docker-compose.dev.yml up -d');
      console.log('   npm run dev');
      console.log('');
    }
  }
}

// 執行健康檢查
async function main() {
  const checker = new HealthChecker();
  const success = await checker.runAllChecks();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Health check script failed:', error);
    process.exit(1);
  });
}