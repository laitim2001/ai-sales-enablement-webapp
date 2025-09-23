/**
 * Dynamics 365 API 模擬測試 POC - 本地開發版本
 * 測試目標：
 * 1. 驗證模擬服務功能
 * 2. 測試模擬數據 CRUD 操作
 * 3. 驗證與真實 API 的相容性
 */

require('dotenv').config();
const { getMockService } = require('./dynamics-365-mock');

class Dynamics365MockPOC {
  constructor() {
    this.mockService = getMockService();
  }

  /**
   * 測試模擬認證
   */
  async testAuthentication() {
    console.log('🔐 測試 Dynamics 365 模擬認證...');

    try {
      const startTime = Date.now();
      const authResult = await this.mockService.authenticate();
      const duration = Date.now() - startTime;

      console.log('✅ 模擬認證成功！');
      console.log(`⏱️  認證耗時: ${duration}ms`);
      console.log(`🔑 Token 類型: ${authResult.token_type}`);
      console.log(`⌛ Token 有效期: ${authResult.expires_in}秒`);

      return true;
    } catch (error) {
      console.error('❌ 模擬認證失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試數據讀取
   */
  async testDataRead() {
    console.log('\n📊 測試模擬數據讀取...');

    try {
      // 測試讀取帳戶資料
      const startTime = Date.now();
      const accountsData = await this.mockService.readEntityData('accounts', {
        $top: 5,
        $select: 'accountid,name,telephone1,emailaddress1,address1_city'
      });
      const duration = Date.now() - startTime;

      console.log('✅ 模擬帳戶數據讀取成功！');
      console.log(`⏱️  查詢耗時: ${duration}ms`);
      console.log(`📈 返回記錄數: ${accountsData.value?.length || 0}`);

      // 顯示樣本數據
      if (accountsData.value?.length > 0) {
        const sample = accountsData.value[0];
        console.log('📋 樣本數據結構:');
        console.log(`   - ID: ${sample.accountid}`);
        console.log(`   - 名稱: ${sample.name || '未設定'}`);
        console.log(`   - 電話: ${sample.telephone1 ? '***已設定***' : '未設定'}`);
        console.log(`   - 電郵: ${sample.emailaddress1 ? '***已設定***' : '未設定'}`);
        console.log(`   - 城市: ${sample.address1_city || '未設定'}`);
      }

      return true;
    } catch (error) {
      console.error('❌ 模擬數據讀取失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試數據創建
   */
  async testDataCreate() {
    console.log('\n➕ 測試模擬數據創建...');

    try {
      const newAccount = {
        name: "測試客戶 - " + Date.now(),
        telephone1: "+886-2-9999-8888",
        emailaddress1: "test@example.com",
        websiteurl: "https://test.example.com",
        address1_city: "測試城市",
        address1_country: "台灣",
        industrycode: 1,
        revenue: 1000000,
        numberofemployees: 50
      };

      const startTime = Date.now();
      const createdAccount = await this.mockService.createRecord('accounts', newAccount);
      const duration = Date.now() - startTime;

      console.log('✅ 模擬數據創建成功！');
      console.log(`⏱️  創建耗時: ${duration}ms`);
      console.log(`🆔 新記錄 ID: ${createdAccount.accountid}`);
      console.log(`📝 創建時間: ${createdAccount.createdon}`);

      // 儲存 ID 供後續測試使用
      this.testAccountId = createdAccount.accountid;

      return true;
    } catch (error) {
      console.error('❌ 模擬數據創建失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試數據更新
   */
  async testDataUpdate() {
    if (!this.testAccountId) {
      console.log('⚠️ 沒有測試帳戶 ID，跳過更新測試');
      return false;
    }

    console.log('\n✏️ 測試模擬數據更新...');

    try {
      const updateData = {
        telephone1: "+886-2-8888-9999",
        revenue: 1500000,
        description: "已更新的測試客戶描述"
      };

      const startTime = Date.now();
      const updatedAccount = await this.mockService.updateRecord('accounts', this.testAccountId, updateData);
      const duration = Date.now() - startTime;

      console.log('✅ 模擬數據更新成功！');
      console.log(`⏱️  更新耗時: ${duration}ms`);
      console.log(`📞 新電話: ${updatedAccount.telephone1}`);
      console.log(`💰 新營收: ${updatedAccount.revenue}`);
      console.log(`📝 更新時間: ${updatedAccount.modifiedon}`);

      return true;
    } catch (error) {
      console.error('❌ 模擬數據更新失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試數據刪除
   */
  async testDataDelete() {
    if (!this.testAccountId) {
      console.log('⚠️ 沒有測試帳戶 ID，跳過刪除測試');
      return false;
    }

    console.log('\n🗑️ 測試模擬數據刪除...');

    try {
      const startTime = Date.now();
      const deletedAccount = await this.mockService.deleteRecord('accounts', this.testAccountId);
      const duration = Date.now() - startTime;

      console.log('✅ 模擬數據刪除成功！');
      console.log(`⏱️  刪除耗時: ${duration}ms`);
      console.log(`📝 已刪除: ${deletedAccount.name}`);

      return true;
    } catch (error) {
      console.error('❌ 模擬數據刪除失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試過濾器功能
   */
  async testDataFilter() {
    console.log('\n🔍 測試模擬數據過濾...');

    try {
      // 測試等於過濾
      const startTime1 = Date.now();
      const filteredData1 = await this.mockService.readEntityData('accounts', {
        $filter: "address1_country eq '台灣'",
        $select: 'accountid,name,address1_country'
      });
      const duration1 = Date.now() - startTime1;

      console.log('✅ 等於過濾測試成功！');
      console.log(`⏱️  過濾耗時: ${duration1}ms`);
      console.log(`📈 符合條件記錄數: ${filteredData1.value?.length || 0}`);

      // 測試包含過濾
      const startTime2 = Date.now();
      const filteredData2 = await this.mockService.readEntityData('accounts', {
        $filter: "contains(name,'科技')",
        $select: 'accountid,name'
      });
      const duration2 = Date.now() - startTime2;

      console.log('✅ 包含過濾測試成功！');
      console.log(`⏱️  過濾耗時: ${duration2}ms`);
      console.log(`📈 符合條件記錄數: ${filteredData2.value?.length || 0}`);

      return true;
    } catch (error) {
      console.error('❌ 模擬數據過濾失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試多實體操作
   */
  async testMultiEntityOperations() {
    console.log('\n🔄 測試多實體操作...');

    try {
      // 同時讀取多個實體
      const promises = [
        this.mockService.readEntityData('accounts', { $top: 2 }),
        this.mockService.readEntityData('contacts', { $top: 2 }),
        this.mockService.readEntityData('opportunities', { $top: 2 }),
        this.mockService.readEntityData('products', { $top: 2 })
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log('✅ 多實體操作成功！');
      console.log(`⏱️  總耗時: ${duration}ms`);
      console.log(`📊 帳戶數: ${results[0].value?.length || 0}`);
      console.log(`👥 聯絡人數: ${results[1].value?.length || 0}`);
      console.log(`💼 銷售機會數: ${results[2].value?.length || 0}`);
      console.log(`📦 產品數: ${results[3].value?.length || 0}`);

      return true;
    } catch (error) {
      console.error('❌ 多實體操作失敗:', error.message);
      return false;
    }
  }

  /**
   * 測試服務狀態
   */
  async testServiceStatus() {
    console.log('\n🟢 測試模擬服務狀態...');

    try {
      const status = this.mockService.getStatus();

      console.log('✅ 服務狀態檢查成功！');
      console.log(`🔧 服務: ${status.service}`);
      console.log(`🟢 狀態: ${status.status}`);
      console.log(`🎯 模式: ${status.mode}`);
      console.log(`🗂️ 支援實體: ${status.entities.join(', ')}`);

      return true;
    } catch (error) {
      console.error('❌ 服務狀態檢查失敗:', error.message);
      return false;
    }
  }

  /**
   * 執行完整模擬測試
   */
  async runFullTest() {
    console.log('🚀 開始 Dynamics 365 模擬 POC 測試\n');
    console.log('=' .repeat(50));

    // 初始化模擬服務
    await this.mockService.initialize();

    const results = {
      authentication: false,
      dataRead: false,
      dataCreate: false,
      dataUpdate: false,
      dataDelete: false,
      dataFilter: false,
      multiEntity: false,
      serviceStatus: false
    };

    try {
      // 測試認證
      results.authentication = await this.testAuthentication();

      if (results.authentication) {
        // 測試基本數據讀取
        results.dataRead = await this.testDataRead();

        // 測試數據 CRUD 操作
        results.dataCreate = await this.testDataCreate();
        results.dataUpdate = await this.testDataUpdate();
        results.dataDelete = await this.testDataDelete();

        // 測試進階功能
        results.dataFilter = await this.testDataFilter();
        results.multiEntity = await this.testMultiEntityOperations();
        results.serviceStatus = await this.testServiceStatus();
      }
    } catch (error) {
      console.error('💥 測試過程發生錯誤:', error.message);
    }

    // 總結報告
    console.log('\n' + '=' .repeat(50));
    console.log('📋 模擬 POC 測試總結:');
    console.log(`🔐 認證測試: ${results.authentication ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`📊 數據讀取: ${results.dataRead ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`➕ 數據創建: ${results.dataCreate ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`✏️ 數據更新: ${results.dataUpdate ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`🗑️ 數據刪除: ${results.dataDelete ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`🔍 數據過濾: ${results.dataFilter ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`🔄 多實體操作: ${results.multiEntity ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`🟢 服務狀態: ${results.serviceStatus ? '✅ 通過' : '❌ 失敗'}`);

    const overallSuccess = Object.values(results).every(Boolean);
    console.log(`\n🎯 模擬測試評估: ${overallSuccess ? '✅ 模擬服務完全正常' : '⚠️ 部分功能需要修正'}`);

    if (overallSuccess) {
      console.log('💡 建議: 模擬環境已準備就緒，可以開始本地開發');
    } else {
      console.log('🔧 建議: 檢查模擬服務配置和數據文件');
    }

    return results;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const poc = new Dynamics365MockPOC();
  poc.runFullTest()
    .then(results => {
      const success = Object.values(results).every(Boolean);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 模擬測試過程發生錯誤:', error);
      process.exit(1);
    });
}

module.exports = Dynamics365MockPOC;