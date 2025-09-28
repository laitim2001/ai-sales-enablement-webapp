/**
 * Azure OpenAI 基本連接測試
 * 測試目標：
 * 1. 驗證 Azure OpenAI 連接正常
 * 2. 測試 GPT-4o 部署可用性
 * 3. 簡單成本預估
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

class AzureOpenAIBasicTest {
  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
    this.gpt4DeploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4o';
  }

  /**
   * 測試基本 API 連接
   */
  async testConnection() {
    console.log('🔗 測試 Azure OpenAI 基本連接...');
    console.log(`📍 端點: ${this.endpoint}`);
    console.log(`🎯 部署: ${this.gpt4DeploymentId}`);
    console.log(`📅 API版本: ${this.apiVersion}`);

    try {
      const response = await this.makeRequest(this.gpt4DeploymentId, {
        messages: [{ role: 'user', content: '請簡單回覆"Azure OpenAI 連接正常"' }],
        max_tokens: 20,
        temperature: 0
      });

      if (response.choices && response.choices.length > 0) {
        console.log('✅ Azure OpenAI 連接成功！');
        console.log(`📨 回應: ${response.choices[0].message.content.trim()}`);
        console.log(`🔢 使用 tokens: ${response.usage.total_tokens}`);
        console.log(`💰 預估成本: $${this.calculateCost(response.usage).toFixed(6)}`);
        return true;
      } else {
        console.log('❌ API 回應格式異常');
        return false;
      }
    } catch (error) {
      console.error('❌ API 連接失敗:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * 測試簡單對話功能
   */
  async testChat() {
    console.log('\n🗨️ 測試對話功能...');

    try {
      const response = await this.makeRequest(this.gpt4DeploymentId, {
        messages: [
          { role: 'system', content: '你是一個AI銷售助手，專門幫助分析客戶需求。' },
          { role: 'user', content: 'Docuware是什麼產品？請簡要介紹。' }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      if (response.choices && response.choices.length > 0) {
        console.log('✅ 對話功能正常！');
        console.log(`📨 回應: ${response.choices[0].message.content.trim()}`);
        console.log(`🔢 使用 tokens: ${response.usage.total_tokens}`);
        console.log(`💰 預估成本: $${this.calculateCost(response.usage).toFixed(6)}`);
        return true;
      } else {
        console.log('❌ 對話功能異常');
        return false;
      }
    } catch (error) {
      console.error('❌ 對話測試失敗:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * 發送 API 請求
   */
  async makeRequest(model, payload) {
    const url = `${this.endpoint}/openai/deployments/${model}/chat/completions`;

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
   * 計算成本（GPT-4o 參考價格）
   */
  calculateCost(usage) {
    // GPT-4o 參考價格 (每1K tokens)
    const inputPrice = 0.00250;  // $0.0025 per 1K input tokens
    const outputPrice = 0.01000; // $0.01 per 1K output tokens

    const inputCost = (usage.prompt_tokens / 1000) * inputPrice;
    const outputCost = (usage.completion_tokens / 1000) * outputPrice;

    return inputCost + outputCost;
  }

  /**
   * 執行完整測試
   */
  async runTest() {
    console.log('🚀 開始 Azure OpenAI 基本功能測試\n');
    console.log('=' .repeat(50));

    // 檢查必要的環境變數
    const requiredEnvs = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

    if (missingEnvs.length > 0) {
      console.log('❌ 缺少必要的環境變數:');
      missingEnvs.forEach(env => console.log(`   - ${env}`));
      console.log('\n請在 .env.local 文件中設定這些變數');
      process.exit(1);
    }

    const results = {
      connection: false,
      chat: false
    };

    try {
      // 1. 測試基本連接
      results.connection = await this.testConnection();

      if (results.connection) {
        // 2. 測試對話功能
        results.chat = await this.testChat();
      }

      // 總結報告
      console.log('\n' + '=' .repeat(50));
      console.log('📋 Azure OpenAI 基本測試總結:');
      console.log(`🔗 基本連接: ${results.connection ? '✅ 通過' : '❌ 失敗'}`);
      console.log(`🗨️ 對話功能: ${results.chat ? '✅ 通過' : '❌ 失敗'}`);

      const overallSuccess = Object.values(results).every(Boolean);
      console.log(`\n🎯 整體評估: ${overallSuccess ? '✅ Azure OpenAI 正常運行' : '⚠️ 需要檢查配置'}`);

      if (overallSuccess) {
        console.log('\n💡 下一步建議:');
        console.log('   • Azure OpenAI 服務配置正確，可以進行應用整合');
        console.log('   • 如需 embedding 功能，請確認相關部署是否已創建');
        console.log('   • 建議實施使用量監控和成本管理');
      }

      return results;
    } catch (error) {
      console.error('💥 測試過程發生錯誤:', error.message);
      process.exit(1);
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const test = new AzureOpenAIBasicTest();
  test.runTest()
    .then(results => {
      const success = Object.values(results).every(Boolean);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 測試失敗:', error);
      process.exit(1);
    });
}

module.exports = AzureOpenAIBasicTest;