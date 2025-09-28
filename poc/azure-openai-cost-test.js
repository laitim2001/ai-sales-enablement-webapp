/**
 * Azure OpenAI 成本和性能測試 POC
 * 測試目標：
 * 1. 驗證 Azure OpenAI API 連接
 * 2. 測試不同模型的性能和成本
 * 3. 評估 embedding 生成成本
 * 4. 測試內容生成的 token 消耗
 * 5. 預估月度成本
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

class AzureOpenAIPOC {
  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

    // 模型定價（每1K tokens，美元）
    this.pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-35-turbo': { input: 0.0015, output: 0.002 },
      'gpt-35-turbo-16k': { input: 0.003, output: 0.004 },
      'text-embedding-ada-002': { input: 0.0001, output: 0 }
    };

    this.testResults = {
      connection: false,
      models: {},
      costProjection: {}
    };
  }

  /**
   * 測試 API 連接
   */
  async testConnection() {
    console.log('🔗 測試 Azure OpenAI API 連接...');

    try {
      // 測試簡單的 completion 請求 - 使用環境變數中配置的部署名稱
      const gpt4DeploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4o';
      const response = await this.makeRequest(gpt4DeploymentId, {
        messages: [{ role: 'user', content: '測試連接，請回覆"連接成功"' }],
        max_tokens: 10,
        temperature: 0
      });

      if (response.choices && response.choices.length > 0) {
        console.log('✅ Azure OpenAI API 連接成功！');
        console.log(`📨 回應: ${response.choices[0].message.content.trim()}`);
        console.log(`🔢 使用 tokens: ${response.usage.total_tokens}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ API 連接失敗:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * 發送 API 請求
   */
  async makeRequest(model, payload, isEmbedding = false) {
    const url = isEmbedding
      ? `${this.endpoint}/openai/deployments/${model}/embeddings`
      : `${this.endpoint}/openai/deployments/${model}/chat/completions`;

    const headers = {
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    };

    const params = {
      'api-version': this.apiVersion
    };

    const response = await axios.post(url, payload, { headers, params });
    return response.data;
  }

  /**
   * 測試文本生成性能和成本
   */
  async testTextGeneration(model = 'gpt-35-turbo') {
    console.log(`\n📝 測試 ${model} 文本生成性能...`);

    const testPrompts = [
      {
        name: '簡短回應',
        prompt: '請簡述什麼是人工智慧？',
        maxTokens: 100
      },
      {
        name: '中等長度',
        prompt: '請寫一份關於 Docuware 的銷售提案大綱，包含問題分析、解決方案和價值主張。',
        maxTokens: 500
      },
      {
        name: '長文本生成',
        prompt: '請生成一份完整的企業 AI 轉型提案，包含現狀分析、解決方案、實施計劃、ROI 分析等部分。',
        maxTokens: 1500
      }
    ];

    const results = [];

    for (const test of testPrompts) {
      try {
        console.log(`  🧪 測試: ${test.name}...`);

        const startTime = Date.now();
        const response = await this.makeRequest(model, {
          messages: [{ role: 'user', content: test.prompt }],
          max_tokens: test.maxTokens,
          temperature: 0.7
        });
        const duration = Date.now() - startTime;

        const usage = response.usage;
        const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

        results.push({
          test: test.name,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          duration,
          cost,
          tokensPerSecond: usage.total_tokens / (duration / 1000)
        });

        console.log(`    ⏱️  耗時: ${duration}ms`);
        console.log(`    🔢 Tokens: ${usage.prompt_tokens}(in) + ${usage.completion_tokens}(out) = ${usage.total_tokens}(total)`);
        console.log(`    💰 成本: $${cost.toFixed(6)}`);
        console.log(`    ⚡ 速度: ${(usage.total_tokens / (duration / 1000)).toFixed(1)} tokens/秒`);

      } catch (error) {
        console.error(`    ❌ ${test.name} 測試失敗:`, error.response?.data || error.message);
      }
    }

    return results;
  }

  /**
   * 測試 embedding 生成性能和成本
   */
  async testEmbedding(model = 'text-embedding-ada-002') {
    console.log(`\n🔍 測試 ${model} embedding 生成...`);

    const testTexts = [
      'Docuware 是一個文檔管理解決方案。',
      '我們的客戶 ABC 公司是一家製造業企業，目前面臨文檔管理效率低下的問題。他們需要一個能夠自動化文檔處理流程的解決方案。',
      `企業文檔管理系統需求分析：

      1. 當前挑戰
      - 紙質文檔存儲空間不足
      - 文檔檢索時間過長
      - 版本控制混亂
      - 審批流程緩慢

      2. 解決方案需求
      - 數位化文檔存儲
      - 智能分類和檢索
      - 自動化工作流程
      - 權限管理

      3. 預期效益
      - 提升工作效率 40%
      - 減少存儲成本 60%
      - 縮短審批時間 50%`
    ];

    const results = [];

    for (let i = 0; i < testTexts.length; i++) {
      try {
        const text = testTexts[i];
        console.log(`  🧪 測試文本 ${i + 1} (長度: ${text.length} 字符)...`);

        const startTime = Date.now();
        const response = await this.makeRequest(model, {
          input: text
        }, true);
        const duration = Date.now() - startTime;

        const usage = response.usage;
        const cost = this.calculateCost(model, usage.total_tokens, 0);

        results.push({
          textLength: text.length,
          tokens: usage.total_tokens,
          duration,
          cost,
          embeddingDimension: response.data[0].embedding.length
        });

        console.log(`    ⏱️  耗時: ${duration}ms`);
        console.log(`    🔢 Tokens: ${usage.total_tokens}`);
        console.log(`    📐 維度: ${response.data[0].embedding.length}`);
        console.log(`    💰 成本: $${cost.toFixed(6)}`);

      } catch (error) {
        console.error(`    ❌ Embedding 測試 ${i + 1} 失敗:`, error.response?.data || error.message);
      }
    }

    return results;
  }

  /**
   * 計算成本
   */
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.pricing[model];
    if (!pricing) {
      console.warn(`⚠️  未知模型 ${model} 的定價`);
      return 0;
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * 項目月度成本預估
   */
  async projectMonthlyCost() {
    console.log('\n💰 項目月度成本預估...');

    // 基於用戶使用模式的假設
    const assumptions = {
      users: 50,
      searchesPerUserPerDay: 20,
      proposalsPerUserPerWeek: 3,
      workingDaysPerMonth: 22,
      averageSearchTokens: 200, // 查詢 + 結果摘要
      averageProposalTokens: 2000, // 生成完整提案
      knowledgeBaseDocuments: 1000,
      averageDocumentTokens: 1500
    };

    console.log('📊 使用場景假設:');
    console.log(`   👥 用戶數: ${assumptions.users}`);
    console.log(`   🔍 每用戶每日搜索: ${assumptions.searchesPerUserPerDay}`);
    console.log(`   📝 每用戶每週提案: ${assumptions.proposalsPerUserPerWeek}`);
    console.log(`   📅 每月工作天: ${assumptions.workingDaysPerMonth}`);

    // 計算月度使用量
    const monthlySearchTokens = assumptions.users *
                                assumptions.searchesPerUserPerDay *
                                assumptions.workingDaysPerMonth *
                                assumptions.averageSearchTokens;

    const monthlyProposalTokens = assumptions.users *
                                  assumptions.proposalsPerUserPerWeek *
                                  (assumptions.workingDaysPerMonth / 5) *
                                  assumptions.averageProposalTokens;

    const knowledgeBaseEmbeddingTokens = assumptions.knowledgeBaseDocuments *
                                         assumptions.averageDocumentTokens;

    // 計算各項成本
    const costs = {
      // 搜索功能 (使用 GPT-3.5-turbo)
      search: this.calculateCost('gpt-35-turbo', monthlySearchTokens * 0.3, monthlySearchTokens * 0.7),

      // 提案生成 (使用 GPT-4)
      proposal: this.calculateCost('gpt-4', monthlyProposalTokens * 0.4, monthlyProposalTokens * 0.6),

      // 知識庫 embedding (一次性，但需要定期更新)
      embedding: this.calculateCost('text-embedding-ada-002', knowledgeBaseEmbeddingTokens, 0),

      // embedding 更新 (假設每月更新10%)
      embeddingUpdates: this.calculateCost('text-embedding-ada-002', knowledgeBaseEmbeddingTokens * 0.1, 0)
    };

    const totalMonthlyCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    console.log('\n📈 月度成本分解:');
    console.log(`   🔍 智能搜索: $${costs.search.toFixed(2)} (${(monthlySearchTokens / 1000).toFixed(0)}K tokens)`);
    console.log(`   📝 提案生成: $${costs.proposal.toFixed(2)} (${(monthlyProposalTokens / 1000).toFixed(0)}K tokens)`);
    console.log(`   🔄 知識庫更新: $${costs.embeddingUpdates.toFixed(2)} (${(knowledgeBaseEmbeddingTokens * 0.1 / 1000).toFixed(0)}K tokens)`);
    console.log(`   💾 初始 embedding: $${costs.embedding.toFixed(2)} (一次性)`);

    console.log('\n💸 總計:');
    console.log(`   📅 月度運營成本: $${(totalMonthlyCost - costs.embedding).toFixed(2)}`);
    console.log(`   🏁 首月成本 (含初始化): $${totalMonthlyCost.toFixed(2)}`);
    console.log(`   📊 年度預估: $${((totalMonthlyCost - costs.embedding) * 12).toFixed(2)}`);

    // 與預算比較
    const budgetLimit = 100000; // $100K/year as per PRD
    const projectedAnnualCost = (totalMonthlyCost - costs.embedding) * 12;
    const budgetUsage = (projectedAnnualCost / budgetLimit) * 100;

    console.log(`\n🎯 預算分析:`);
    console.log(`   💰 年度預算限制: $${budgetLimit.toLocaleString()}`);
    console.log(`   📊 預計使用率: ${budgetUsage.toFixed(1)}%`);
    console.log(`   ${budgetUsage < 80 ? '✅ 在預算範圍內' : budgetUsage < 100 ? '⚠️ 接近預算上限' : '❌ 超出預算'}`);

    return {
      monthly: totalMonthlyCost - costs.embedding,
      annual: projectedAnnualCost,
      budgetUsage: budgetUsage,
      breakdown: costs,
      recommendations: this.getCostOptimizationRecommendations(budgetUsage)
    };
  }

  /**
   * 成本優化建議
   */
  getCostOptimizationRecommendations(budgetUsage) {
    const recommendations = [];

    if (budgetUsage > 80) {
      recommendations.push('考慮實施智能緩存，減少重複的 AI 請求');
      recommendations.push('對常見問題使用預生成的回應');
      recommendations.push('實施 token 使用監控和限制');
    }

    if (budgetUsage > 100) {
      recommendations.push('考慮使用更經濟的模型（如 GPT-3.5 替代 GPT-4）');
      recommendations.push('實施分層策略：簡單查詢用便宜模型，複雜任務用高級模型');
      recommendations.push('減少每次請求的最大 token 數');
    }

    recommendations.push('實施使用量分析，識別高成本用戶或功能');
    recommendations.push('定期審查和優化 prompt 設計，提高 token 效率');

    return recommendations;
  }

  /**
   * 執行完整測試
   */
  async runFullTest() {
    console.log('🚀 開始 Azure OpenAI 成本和性能測試\n');
    console.log('=' .repeat(70));

    try {
      // 1. 測試連接
      this.testResults.connection = await this.testConnection();

      if (!this.testResults.connection) {
        throw new Error('API 連接失敗，無法繼續測試');
      }

      // 2. 測試文本生成 (使用實際可用的部署)
      const gpt4DeploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4o';
      this.testResults.models[gpt4DeploymentId] = await this.testTextGeneration(gpt4DeploymentId);

      // 3. 測試 embedding 生成 (使用實際可用的部署)
      const embeddingDeploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS || 'text-embedding-ada-002';
      this.testResults.models[embeddingDeploymentId] = await this.testEmbedding(embeddingDeploymentId);

      // 4. 成本預估
      this.testResults.costProjection = await this.projectMonthlyCost();

    } catch (error) {
      console.error('💥 測試過程發生錯誤:', error.message);
    }

    // 總結報告
    console.log('\n' + '=' .repeat(70));
    console.log('📋 Azure OpenAI POC 測試總結:');
    console.log(`🔗 API 連接: ${this.testResults.connection ? '✅ 成功' : '❌ 失敗'}`);

    if (this.testResults.costProjection.budgetUsage) {
      const usage = this.testResults.costProjection.budgetUsage;
      console.log(`💰 預算使用率: ${usage.toFixed(1)}% ${usage < 80 ? '✅' : usage < 100 ? '⚠️' : '❌'}`);
    }

    console.log('\n💡 關鍵建議:');
    if (this.testResults.costProjection.recommendations) {
      this.testResults.costProjection.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    return this.testResults;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  // 檢查必要的環境變數
  const requiredEnvs = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    console.log('❌ 缺少必要的環境變數:');
    missingEnvs.forEach(env => console.log(`   - ${env}`));
    console.log('\n請在 .env 文件中設定這些變數');
    process.exit(1);
  }

  const poc = new AzureOpenAIPOC();
  poc.runFullTest()
    .then(results => {
      const success = results.connection &&
                     results.costProjection &&
                     results.costProjection.budgetUsage < 120; // 允許20%的預算彈性
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = AzureOpenAIPOC;