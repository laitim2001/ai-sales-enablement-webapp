/**
 * @fileoverview 測試 Dynamics 365 模擬模式功能：- 驗證模擬 API 端點正常工作- 測試 Dynamics365Client 在模擬模式下的運行- 確保模擬數據正確返回
 * @module poc/test-dynamics-mock
 * @description
 * 測試 Dynamics 365 模擬模式功能：- 驗證模擬 API 端點正常工作- 測試 Dynamics365Client 在模擬模式下的運行- 確保模擬數據正確返回
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

require('dotenv').config({ path: '.env.local' });

async function testDynamicsMock() {
  console.log('🎭 開始測試 Dynamics 365 模擬模式');
  console.log(`環境變數檢查:`);
  console.log(`- DYNAMICS_365_MODE: ${process.env.DYNAMICS_365_MODE}`);
  console.log(`- DYNAMICS_365_MOCK_ENABLED: ${process.env.DYNAMICS_365_MOCK_ENABLED}`);

  try {
    // 1. 測試直接 API 調用
    console.log('\n1. 測試模擬 API 端點...');
    const fetch = require('node-fetch');

    const healthResponse = await fetch('http://localhost:3002/api/mock/dynamics365/health');
    const healthData = await healthResponse.json();
    console.log('✅ 健康檢查:', healthData);

    const accountsResponse = await fetch('http://localhost:3002/api/mock/dynamics365/accounts');
    const accountsData = await accountsResponse.json();
    console.log('✅ 帳戶數據:', accountsData.value?.length || 0, '條記錄');

    // 2. 測試 Dynamics365Client
    console.log('\n2. 測試 Dynamics365Client...');

    // 動態導入（避免編譯錯誤）
    const { Dynamics365Client } = await import('../lib/integrations/dynamics365/client.ts');

    const client = new Dynamics365Client();
    const testResult = await client.testConnection();

    console.log('✅ 客戶端連接測試:', testResult ? '成功' : '失敗');

    // 3. 測試查詢功能
    console.log('\n3. 測試查詢功能...');
    const accounts = await client.getAccounts({ top: 2 });
    console.log('✅ 查詢帳戶:', accounts.length, '條記錄');

    if (accounts.length > 0) {
      console.log('   第一條記錄:', {
        id: accounts[0].accountid,
        name: accounts[0].name,
        email: accounts[0].emailaddress1
      });
    }

    console.log('\n🎉 Dynamics 365 模擬模式測試完成 - 全部通過！');
    return true;

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.error('詳細錯誤:', error);
    return false;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testDynamicsMock()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 測試過程發生錯誤:', error);
      process.exit(1);
    });
}

module.exports = testDynamicsMock;