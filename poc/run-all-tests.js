/**
 * 統一執行所有 POC 測試
 * 包含：Dynamics 365 (實際/模擬), pgvector, Azure OpenAI
 *
 * 使用方法：
 * node run-all-tests.js           # 自動檢測環境模式
 * node run-all-tests.js --mock    # 強制使用模擬模式
 * node run-all-tests.js --real    # 強制使用真實 API
 */

require('dotenv').config({ path: '../.env.local' });
require('dotenv').config(); // 也載入根目錄的 .env 文件（如果存在）
const Dynamics365POC = require('./dynamics-365-test');
const Dynamics365MockPOC = require('./dynamics-365-test-mock');
const PgVectorPOC = require('./pgvector-performance-test');
const AzureOpenAIPOC = require('./azure-openai-cost-test');

class MasterPOC {
  constructor() {
    this.results = {
      dynamics365: null,
      pgvector: null,
      azureOpenAI: null,
      overallSuccess: false
    };

    // 檢測運行模式
    this.mockMode = this.determineMockMode();
    console.log(`🔧 運行模式: ${this.mockMode ? '模擬模式 (Mock)' : '真實 API 模式'}`);
  }

  /**
   * 決定是否使用模擬模式
   */
  determineMockMode() {
    // 命令行參數優先
    const args = process.argv.slice(2);
    if (args.includes('--mock')) {
      console.log('🎯 命令行指定: 使用模擬模式');
      return true;
    }
    if (args.includes('--real')) {
      console.log('🎯 命令行指定: 使用真實 API 模式');
      return false;
    }

    // 檢查環境變數
    if (process.env.DYNAMICS_365_MODE === 'mock' || process.env.DYNAMICS_365_MOCK_ENABLED === 'true') {
      console.log('📋 環境變數設定: 使用模擬模式');
      return true;
    }

    // 檢查必要的 D365 環境變數，如果缺少則自動使用模擬模式
    const requiredD365Envs = ['DYNAMICS_365_TENANT_ID', 'DYNAMICS_365_CLIENT_ID', 'DYNAMICS_365_CLIENT_SECRET', 'DYNAMICS_365_RESOURCE'];
    const missingEnvs = requiredD365Envs.filter(env => !process.env[env] || process.env[env] === '本地開發時不需要');

    if (missingEnvs.length > 0) {
      console.log('🔍 自動檢測: D365 配置不完整，使用模擬模式');
      return true;
    }

    console.log('🔍 自動檢測: 使用真實 API 模式');
    return false;
  }

  /**
   * 檢查環境變數
   */
  checkEnvironmentVariables() {
    console.log('🔧 檢查環境變數配置...\n');

    // 根據模式調整必需的環境變數
    const requiredEnvs = {
      'PostgreSQL': [
        'DATABASE_URL'
      ],
      'Azure OpenAI': [
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_DEPLOYMENT_ID_GPT4'
      ]
    };

    // 只有在真實 API 模式下才檢查 D365 環境變數
    if (!this.mockMode) {
      requiredEnvs['Dynamics 365'] = [
        'DYNAMICS_365_TENANT_ID',
        'DYNAMICS_365_CLIENT_ID',
        'DYNAMICS_365_CLIENT_SECRET',
        'DYNAMICS_365_RESOURCE'
      ];
    }

    const missingByService = {};
    let allMissing = [];

    Object.entries(requiredEnvs).forEach(([service, envs]) => {
      const missing = envs.filter(env => !process.env[env]);
      if (missing.length > 0) {
        missingByService[service] = missing;
        allMissing = allMissing.concat(missing);
      }
    });

    if (allMissing.length > 0) {
      console.log('❌ 缺少必要的環境變數:\n');

      Object.entries(missingByService).forEach(([service, missing]) => {
        console.log(`📋 ${service}:`);
        missing.forEach(env => console.log(`   - ${env}`));
        console.log('');
      });

      console.log('請參考 .env.example 文件設定這些變數');
      if (this.mockMode) {
        console.log('💡 提示: 目前使用模擬模式，請確保已設定 Azure OpenAI 配置');
      }
      return false;
    }

    console.log('✅ 所有必要環境變數已配置');
    if (this.mockMode) {
      console.log('🎭 Dynamics 365 將使用模擬模式\n');
    } else {
      console.log('🌐 所有服務將使用真實 API\n');
    }
    return true;
  }

  /**
   * 執行所有測試
   */
  async runAllTests() {
    console.log('🚀 開始執行完整 POC 測試套件\n');
    console.log('=' .repeat(80));

    // 檢查環境變數
    if (!this.checkEnvironmentVariables()) {
      process.exit(1);
    }

    const startTime = Date.now();

    try {
      // 1. Dynamics 365 測試
      console.log(`🔷 階段 1: Dynamics 365 CRM 整合測試 ${this.mockMode ? '(模擬模式)' : '(真實 API)'}`);
      console.log('-' .repeat(40));

      if (this.mockMode) {
        const dynamics365MockPOC = new Dynamics365MockPOC();
        this.results.dynamics365 = await dynamics365MockPOC.runFullTest();
      } else {
        const dynamics365POC = new Dynamics365POC();
        this.results.dynamics365 = await dynamics365POC.runFullTest();
      }

      console.log('\n' + '=' .repeat(80));

      // 2. PostgreSQL + pgvector 測試
      console.log('🔶 階段 2: PostgreSQL + pgvector 性能測試');
      console.log('-' .repeat(40));
      const pgvectorPOC = new PgVectorPOC();
      this.results.pgvector = await pgvectorPOC.runFullTest();

      console.log('\n' + '=' .repeat(80));

      // 3. Azure OpenAI 測試
      console.log('🔸 階段 3: Azure OpenAI 成本和性能測試');
      console.log('-' .repeat(40));
      const azureOpenAIPOC = new AzureOpenAIPOC();
      this.results.azureOpenAI = await azureOpenAIPOC.runFullTest();

    } catch (error) {
      console.error('💥 測試執行失敗:', error.message);
    }

    const totalDuration = Date.now() - startTime;

    // 生成綜合報告
    await this.generateComprehensiveReport(totalDuration);
  }

  /**
   * 生成綜合測試報告
   */
  async generateComprehensiveReport(totalDuration) {
    console.log('\n' + '═' .repeat(80));
    console.log('📊 POC 測試綜合報告');
    console.log('═' .repeat(80));

    // 測試結果總覽
    console.log('\n🎯 測試結果總覽:');
    console.log('-' .repeat(40));

    const d365Success = this.evaluateDynamics365();
    const pgvectorSuccess = this.evaluatePgVector();
    const openAISuccess = this.evaluateAzureOpenAI();

    console.log(`🔷 Dynamics 365 CRM:  ${d365Success ? '✅ 通過' : '❌ 失敗'} ${this.mockMode ? '(模擬)' : '(真實)'}`);
    console.log(`🔶 PostgreSQL Vector: ${pgvectorSuccess ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`🔸 Azure OpenAI:      ${openAISuccess ? '✅ 通過' : '❌ 失敗'}`);

    this.results.overallSuccess = d365Success && pgvectorSuccess && openAISuccess;

    console.log(`\n🏆 整體評估: ${this.results.overallSuccess ? '✅ 可以開始開發' : '⚠️ 需要解決問題'}`);
    console.log(`⏱️  總測試時間: ${(totalDuration / 1000 / 60).toFixed(1)} 分鐘`);

    // 詳細分析和建議
    console.log('\n📋 詳細分析:');
    console.log('-' .repeat(40));

    // Dynamics 365 分析
    if (this.results.dynamics365) {
      console.log(`\n🔷 Dynamics 365 CRM 整合 ${this.mockMode ? '(模擬模式)' : '(真實 API)'}:`);
      if (d365Success) {
        if (this.mockMode) {
          console.log('   ✅ 模擬服務運行正常');
          console.log('   ✅ 數據 CRUD 操作測試通過');
          console.log('   ✅ 模擬數據已準備就緒');
          console.log('   💡 建議: 可以開始本地 CRM 整合開發');
          console.log('   🚀 部署時需更換為真實 D365 配置');
        } else {
          console.log('   ✅ API 認證和數據讀取正常');
          console.log('   ✅ 速率限制測試通過');
          console.log('   💡 建議: 可以開始 CRM 整合開發');
        }
      } else {
        if (this.mockMode) {
          console.log('   ❌ 模擬服務配置有問題');
          console.log('   💡 建議: 檢查模擬數據文件和服務配置');
        } else {
          console.log('   ❌ 需要檢查 Azure AD 配置和權限');
          console.log('   💡 建議: 聯繫 Microsoft 技術支援');
        }
      }
    }

    // pgvector 分析
    if (this.results.pgvector) {
      console.log('\n🔶 PostgreSQL + pgvector:');
      if (pgvectorSuccess) {
        console.log('   ✅ 向量搜索性能良好');
        console.log('   ✅ 支援大規模向量操作');
        console.log('   💡 建議: 生產環境增加 PostgreSQL 緩存配置');
      } else {
        console.log('   ❌ 需要檢查 pgvector 擴展安裝');
        console.log('   💡 建議: 使用託管的 PostgreSQL 服務');
      }
    }

    // Azure OpenAI 分析
    if (this.results.azureOpenAI) {
      console.log('\n🔸 Azure OpenAI 成本控制:');
      if (openAISuccess) {
        console.log('   ✅ API 連接和性能正常');
        const usage = this.results.azureOpenAI.costProjection?.budgetUsage;
        if (usage) {
          console.log(`   📊 預計年度成本佔預算 ${usage.toFixed(1)}%`);
          if (usage < 80) {
            console.log('   💰 成本在可控範圍內');
          } else {
            console.log('   ⚠️ 需要實施成本優化策略');
          }
        }
      } else {
        console.log('   ❌ 需要檢查 Azure OpenAI 服務配置');
        console.log('   💡 建議: 確認模型部署和 API 密鑰權限');
      }
    }

    // 技術架構建議
    console.log('\n🏗️ 技術架構建議:');
    console.log('-' .repeat(40));

    if (this.results.overallSuccess) {
      console.log('✅ 建議的技術棧已通過驗證，可以開始開發');
      console.log('📋 下一步行動項目:');
      console.log('   1. 建立開發環境');
      console.log('   2. 設定 CI/CD 流程');
      console.log('   3. 開始 MVP 開發 (Epic 1)');
      console.log('   4. 建立成本監控機制');
    } else {
      console.log('⚠️ 需要解決技術問題後再開始開發');
      console.log('🔧 優先處理項目:');

      if (!d365Success) {
        console.log('   • 解決 Dynamics 365 連接問題');
      }
      if (!pgvectorSuccess) {
        console.log('   • 配置 PostgreSQL + pgvector 環境');
      }
      if (!openAISuccess) {
        console.log('   • 驗證 Azure OpenAI 服務配置');
      }
    }

    // 風險提醒
    console.log('\n⚠️ 重要提醒:');
    console.log('-' .repeat(40));
    console.log('• 生產環境需要更嚴格的安全配置');
    console.log('• 建議實施 AI 使用量監控和預算告警');
    console.log('• CRM 整合需要與業務團隊密切協作');
    console.log('• 定期備份和災難恢復計劃不可忽略');

    // 將結果保存到文件
    await this.saveReportToFile();

    console.log('\n📄 詳細測試報告已保存到: poc-test-report.json');
  }

  /**
   * 評估 Dynamics 365 測試結果
   */
  evaluateDynamics365() {
    if (!this.results.dynamics365) return false;

    if (this.mockMode) {
      // 模擬模式的評估標準
      return this.results.dynamics365.authentication &&
             this.results.dynamics365.dataRead &&
             this.results.dynamics365.dataCreate &&
             this.results.dynamics365.serviceStatus;
    } else {
      // 真實 API 模式的評估標準
      return this.results.dynamics365.authentication &&
             this.results.dynamics365.dataRead &&
             this.results.dynamics365.rateLimit;
    }
  }

  /**
   * 評估 pgvector 測試結果
   */
  evaluatePgVector() {
    if (!this.results.pgvector) return false;

    return this.results.pgvector.connection &&
           this.results.pgvector.dimensions &&
           Object.values(this.results.pgvector.dimensions).some(
             result => result.insert?.success && result.search?.success
           );
  }

  /**
   * 評估 Azure OpenAI 測試結果
   */
  evaluateAzureOpenAI() {
    if (!this.results.azureOpenAI) return false;

    return this.results.azureOpenAI.connection &&
           this.results.azureOpenAI.costProjection &&
           this.results.azureOpenAI.costProjection.budgetUsage < 120; // 允許20%彈性
  }

  /**
   * 保存測試報告到文件
   */
  async saveReportToFile() {
    const fs = require('fs').promises;
    const path = require('path');

    const report = {
      timestamp: new Date().toISOString(),
      overallSuccess: this.results.overallSuccess,
      testResults: this.results,
      summary: {
        dynamics365: this.evaluateDynamics365(),
        pgvector: this.evaluatePgVector(),
        azureOpenAI: this.evaluateAzureOpenAI()
      },
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, 'poc-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * 生成建議列表
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.overallSuccess) {
      recommendations.push({
        priority: 'high',
        category: 'development',
        action: '開始 Epic 1 - 基礎平台開發'
      });

      recommendations.push({
        priority: 'medium',
        category: 'monitoring',
        action: '設置成本監控和預算告警'
      });
    } else {
      if (!this.evaluateDynamics365()) {
        recommendations.push({
          priority: 'critical',
          category: 'integration',
          action: '解決 Dynamics 365 API 連接和權限問題'
        });
      }

      if (!this.evaluatePgVector()) {
        recommendations.push({
          priority: 'critical',
          category: 'database',
          action: '配置 PostgreSQL 和 pgvector 擴展'
        });
      }
    }

    return recommendations;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const masterPOC = new MasterPOC();
  masterPOC.runAllTests()
    .then(() => {
      process.exit(masterPOC.results.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 POC 測試套件執行失敗:', error);
      process.exit(1);
    });
}

module.exports = MasterPOC;