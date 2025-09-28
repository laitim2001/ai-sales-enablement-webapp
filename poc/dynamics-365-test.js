/**
 * Dynamics 365 API 連接測試 POC
 * 測試目標：
 * 1. 驗證 OAuth 2.0 認證流程
 * 2. 測試 API 速率限制（6000/分鐘）
 * 3. 驗證數據讀取能力
 */

require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class Dynamics365POC {
  constructor() {
    // 使用統一的環境變數名稱，與主要代碼保持一致
    this.tenantId = process.env.DYNAMICS_365_TENANT_ID;
    this.clientId = process.env.DYNAMICS_365_CLIENT_ID;
    this.clientSecret = process.env.DYNAMICS_365_CLIENT_SECRET;
    this.crmUrl = process.env.DYNAMICS_365_RESOURCE;
    this.accessToken = null;
  }

  /**
   * 測試 OAuth 2.0 認證
   */
  async testAuthentication() {
    console.log('🔐 測試 Dynamics 365 OAuth 2.0 認證...');

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const tokenData = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: `${this.crmUrl}/.default`
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(tokenUrl, new URLSearchParams(tokenData));
      const duration = Date.now() - startTime;

      this.accessToken = response.data.access_token;

      console.log('✅ 認證成功！');
      console.log(`⏱️  認證耗時: ${duration}ms`);
      console.log(`🔑 Token 類型: ${response.data.token_type}`);
      console.log(`⌛ Token 有效期: ${response.data.expires_in}秒`);

      return true;
    } catch (error) {
      console.error('❌ 認證失敗:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * 測試基本數據讀取
   */
  async testDataRead() {
    if (!this.accessToken) {
      console.log('❌ 未取得認證 Token，跳過數據讀取測試');
      return false;
    }

    console.log('\n📊 測試基本數據讀取...');

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    };

    try {
      // 測試讀取帳戶資料
      const startTime = Date.now();
      const accountsResponse = await axios.get(
        `${this.crmUrl}/api/data/v9.2/accounts?$top=5&$select=accountid,name,telephone1,emailaddress1`,
        { headers }
      );
      const duration = Date.now() - startTime;

      console.log('✅ 帳戶數據讀取成功！');
      console.log(`⏱️  查詢耗時: ${duration}ms`);
      console.log(`📈 返回記錄數: ${accountsResponse.data.value?.length || 0}`);

      // 顯示樣本數據（脫敏）
      if (accountsResponse.data.value?.length > 0) {
        const sample = accountsResponse.data.value[0];
        console.log('📋 樣本數據結構:');
        console.log(`   - ID: ${sample.accountid}`);
        console.log(`   - 名稱: ${sample.name || '未設定'}`);
        console.log(`   - 電話: ${sample.telephone1 ? '***已設定***' : '未設定'}`);
        console.log(`   - 電郵: ${sample.emailaddress1 ? '***已設定***' : '未設定'}`);
      }

      return true;
    } catch (error) {
      console.error('❌ 數據讀取失敗:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * 測試 API 速率限制
   */
  async testRateLimit() {
    if (!this.accessToken) {
      console.log('❌ 未取得認證 Token，跳過速率限制測試');
      return false;
    }

    console.log('\n🚦 測試 API 速率限制（10個並發請求）...');

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Accept': 'application/json'
    };

    const promises = [];
    const startTime = Date.now();

    // 發送10個並發請求測試
    for (let i = 0; i < 10; i++) {
      const promise = axios.get(
        `${this.crmUrl}/api/data/v9.2/accounts?$top=1&$select=name`,
        { headers }
      ).then(response => ({
        success: true,
        status: response.status,
        requestId: i + 1
      })).catch(error => ({
        success: false,
        status: error.response?.status,
        error: error.response?.data?.error?.message || error.message,
        requestId: i + 1
      }));

      promises.push(promise);
    }

    try {
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log('📊 速率限制測試結果:');
      console.log(`✅ 成功請求: ${successful}/10`);
      console.log(`❌ 失敗請求: ${failed}/10`);
      console.log(`⏱️  總耗時: ${duration}ms`);
      console.log(`📈 平均每請求: ${(duration / 10).toFixed(2)}ms`);

      // 顯示失敗的請求詳情
      results.filter(r => !r.success).forEach(result => {
        console.log(`⚠️  請求 ${result.requestId} 失敗: ${result.error} (狀態碼: ${result.status})`);
      });

      return successful >= 8; // 至少80%成功率
    } catch (error) {
      console.error('❌ 速率限制測試失敗:', error.message);
      return false;
    }
  }

  /**
   * 執行完整測試
   */
  async runFullTest() {
    console.log('🚀 開始 Dynamics 365 API POC 測試\n');
    console.log('=' .repeat(50));

    const results = {
      authentication: false,
      dataRead: false,
      rateLimit: false
    };

    // 測試認證
    results.authentication = await this.testAuthentication();

    if (results.authentication) {
      // 測試數據讀取
      results.dataRead = await this.testDataRead();

      // 測試速率限制
      results.rateLimit = await this.testRateLimit();
    }

    // 總結報告
    console.log('\n' + '=' .repeat(50));
    console.log('📋 POC 測試總結:');
    console.log(`🔐 認證測試: ${results.authentication ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`📊 數據讀取: ${results.dataRead ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`🚦 速率限制: ${results.rateLimit ? '✅ 通過' : '❌ 失敗'}`);

    const overallSuccess = Object.values(results).every(Boolean);
    console.log(`\n🎯 整體評估: ${overallSuccess ? '✅ 可以繼續開發' : '⚠️ 需要解決問題再繼續'}`);

    return results;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  // 檢查必要的環境變數
  const requiredEnvs = ['DYNAMICS_365_TENANT_ID', 'DYNAMICS_365_CLIENT_ID', 'DYNAMICS_365_CLIENT_SECRET', 'DYNAMICS_365_RESOURCE'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    console.log('❌ 缺少必要的環境變數:');
    missingEnvs.forEach(env => console.log(`   - ${env}`));
    console.log('\n請在 .env 文件中設定這些變數');
    process.exit(1);
  }

  const poc = new Dynamics365POC();
  poc.runFullTest()
    .then(results => {
      const success = Object.values(results).every(Boolean);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 測試過程發生錯誤:', error);
      process.exit(1);
    });
}

module.exports = Dynamics365POC;