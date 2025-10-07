/**
 * @fileoverview Dynamics 365 模擬服務 - 本地開發環境使用功能：1. 模擬所有 D365 CRM API 端點2. 使用本地 JSON 檔案作為數據源3. 支援完整的 CRUD 操作4. 模擬認證流程（自動通過）5. 支援 OData 查詢語法
 * @module poc/dynamics-365-mock
 * @description
 * Dynamics 365 模擬服務 - 本地開發環境使用功能：1. 模擬所有 D365 CRM API 端點2. 使用本地 JSON 檔案作為數據源3. 支援完整的 CRUD 操作4. 模擬認證流程（自動通過）5. 支援 OData 查詢語法
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Dynamics365MockService {
  constructor() {
    this.mockDataDir = path.join(__dirname, 'mock-data');
    this.entities = {
      accounts: 'accounts.json',
      contacts: 'contacts.json',
      opportunities: 'opportunities.json',
      products: 'products.json'
    };
    this.isInitialized = false;
  }

  /**
   * 初始化模擬服務
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // 確保模擬數據目錄存在
      await this.ensureDataDirectory();

      // 初始化數據文件（如果不存在）
      await this.initializeDataFiles();

      this.isInitialized = true;
      console.log('✅ D365 模擬服務初始化成功');
    } catch (error) {
      console.error('❌ D365 模擬服務初始化失敗:', error.message);
      throw error;
    }
  }

  /**
   * 確保數據目錄存在
   */
  async ensureDataDirectory() {
    try {
      await fs.access(this.mockDataDir);
    } catch (error) {
      await fs.mkdir(this.mockDataDir, { recursive: true });
      console.log(`📁 創建模擬數據目錄: ${this.mockDataDir}`);
    }
  }

  /**
   * 初始化數據文件
   */
  async initializeDataFiles() {
    for (const [entity, filename] of Object.entries(this.entities)) {
      const filepath = path.join(this.mockDataDir, filename);

      try {
        await fs.access(filepath);
      } catch (error) {
        // 文件不存在，創建空數據
        const initialData = this.getInitialData(entity);
        await fs.writeFile(filepath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log(`📄 創建初始數據文件: ${filename}`);
      }
    }
  }

  /**
   * 獲取初始數據模板
   */
  getInitialData(entity) {
    const baseData = {
      '@odata.context': `https://mock-d365.api/data/v9.2/$metadata#${entity}`,
      value: []
    };

    const sampleData = {
      accounts: {
        ...baseData,
        value: [
          {
            accountid: uuidv4(),
            name: "台灣科技有限公司",
            telephone1: "+886-2-1234-5678",
            emailaddress1: "contact@taiwantech.com",
            websiteurl: "https://www.taiwantech.com",
            address1_city: "台北市",
            address1_country: "台灣",
            industrycode: 1, // 科技業
            revenue: 50000000,
            numberofemployees: 150,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          },
          {
            accountid: uuidv4(),
            name: "新加坡商業集團",
            telephone1: "+65-6789-0123",
            emailaddress1: "info@sgbusiness.com",
            websiteurl: "https://www.sgbusiness.com",
            address1_city: "Singapore",
            address1_country: "新加坡",
            industrycode: 2, // 金融服務
            revenue: 100000000,
            numberofemployees: 300,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          },
          {
            accountid: uuidv4(),
            name: "馬來西亞製造公司",
            telephone1: "+60-3-1111-2222",
            emailaddress1: "sales@mymanufacturing.com",
            websiteurl: "https://www.mymanufacturing.com",
            address1_city: "吉隆坡",
            address1_country: "馬來西亞",
            industrycode: 3, // 製造業
            revenue: 75000000,
            numberofemployees: 500,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          }
        ]
      },

      contacts: {
        ...baseData,
        value: [
          {
            contactid: uuidv4(),
            firstname: "志明",
            lastname: "王",
            fullname: "王志明",
            emailaddress1: "zhiming.wang@taiwantech.com",
            telephone1: "+886-2-1234-5678",
            jobtitle: "技術總監",
            parentcustomerid: null, // 會在運行時關聯到帳戶
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          },
          {
            contactid: uuidv4(),
            firstname: "Mei Ling",
            lastname: "Tan",
            fullname: "Tan Mei Ling",
            emailaddress1: "meiling.tan@sgbusiness.com",
            telephone1: "+65-6789-0123",
            jobtitle: "Business Development Manager",
            parentcustomerid: null,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          }
        ]
      },

      opportunities: {
        ...baseData,
        value: [
          {
            opportunityid: uuidv4(),
            name: "AI 銷售平台導入專案",
            description: "為客戶導入 AI 驅動的銷售賦能平台，提升銷售效率",
            estimatedvalue: 500000,
            actualvalue: null,
            stepname: "Proposal/Price Quote",
            salesstage: 2,
            closeprobability: 75,
            estimatedclosedate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60天後
            parentaccountid: null, // 會在運行時關聯
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          },
          {
            opportunityid: uuidv4(),
            name: "CRM 整合服務",
            description: "與現有 CRM 系統整合，實現數據同步",
            estimatedvalue: 200000,
            actualvalue: null,
            stepname: "Develop",
            salesstage: 1,
            closeprobability: 50,
            estimatedclosedate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90天後
            parentaccountid: null,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          }
        ]
      },

      products: {
        ...baseData,
        value: [
          {
            productid: uuidv4(),
            name: "AI 銷售賦能平台 - 基礎版",
            productdescription: "包含知識庫管理、智能搜索、基礎分析功能",
            price: 50000,
            standardcost: 30000,
            currentcost: 30000,
            quantityonhand: 999,
            statecode: 0, // 啟用
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          },
          {
            productid: uuidv4(),
            name: "AI 銷售賦能平台 - 專業版",
            productdescription: "包含所有基礎功能加上 AI 提案生成、CRM 整合",
            price: 100000,
            standardcost: 60000,
            currentcost: 60000,
            quantityonhand: 999,
            statecode: 0,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          },
          {
            productid: uuidv4(),
            name: "AI 銷售賦能平台 - 企業版",
            productdescription: "完整功能包含進階分析、客製化整合、專屬支援",
            price: 200000,
            standardcost: 120000,
            currentcost: 120000,
            quantityonhand: 999,
            statecode: 0,
            createdon: new Date().toISOString(),
            modifiedon: new Date().toISOString()
          }
        ]
      }
    };

    return sampleData[entity] || baseData;
  }

  /**
   * 模擬 OAuth 2.0 認證
   */
  async authenticate() {
    return {
      success: true,
      access_token: 'mock-access-token-' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'https://mock-d365.crm5.dynamics.com/.default'
    };
  }

  /**
   * 讀取實體數據
   */
  async readEntityData(entityName, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const filename = this.entities[entityName];
    if (!filename) {
      throw new Error(`未支援的實體: ${entityName}`);
    }

    try {
      const filepath = path.join(this.mockDataDir, filename);
      const fileContent = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(fileContent);

      // 應用查詢選項
      let results = data.value;

      // $filter 支援（基本支援）
      if (options.$filter) {
        results = this.applyFilter(results, options.$filter);
      }

      // $select 支援
      if (options.$select) {
        const fields = options.$select.split(',').map(f => f.trim());
        results = results.map(record => {
          const filtered = {};
          fields.forEach(field => {
            if (record.hasOwnProperty(field)) {
              filtered[field] = record[field];
            }
          });
          return filtered;
        });
      }

      // $top 支援
      if (options.$top) {
        const limit = parseInt(options.$top);
        results = results.slice(0, limit);
      }

      return {
        '@odata.context': data['@odata.context'],
        value: results,
        '@odata.count': results.length
      };
    } catch (error) {
      console.error(`讀取實體數據失敗 (${entityName}):`, error.message);
      throw error;
    }
  }

  /**
   * 基本的過濾器支援
   */
  applyFilter(records, filter) {
    // 這是一個簡化的過濾器實現
    // 在實際應用中，你可能需要更完整的 OData 過濾器解析器

    // 支援基本的等於比較
    const eqMatch = filter.match(/(\w+)\s+eq\s+'([^']+)'/);
    if (eqMatch) {
      const [, field, value] = eqMatch;
      return records.filter(record =>
        record[field] && record[field].toString() === value
      );
    }

    // 支援包含查詢
    const containsMatch = filter.match(/contains\((\w+),\s*'([^']+)'\)/);
    if (containsMatch) {
      const [, field, value] = containsMatch;
      return records.filter(record =>
        record[field] && record[field].toString().toLowerCase().includes(value.toLowerCase())
      );
    }

    // 如果沒有匹配的過濾器，返回所有記錄
    console.warn(`不支援的過濾器: ${filter}`);
    return records;
  }

  /**
   * 創建新記錄
   */
  async createRecord(entityName, recordData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const filename = this.entities[entityName];
    if (!filename) {
      throw new Error(`未支援的實體: ${entityName}`);
    }

    try {
      const filepath = path.join(this.mockDataDir, filename);
      const fileContent = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(fileContent);

      // 添加必要的字段
      const newRecord = {
        ...recordData,
        [`${entityName.slice(0, -1)}id`]: uuidv4(), // 移除 's' 並添加 'id'
        createdon: new Date().toISOString(),
        modifiedon: new Date().toISOString()
      };

      data.value.push(newRecord);

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');

      return newRecord;
    } catch (error) {
      console.error(`創建記錄失敗 (${entityName}):`, error.message);
      throw error;
    }
  }

  /**
   * 更新記錄
   */
  async updateRecord(entityName, recordId, updateData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const filename = this.entities[entityName];
    if (!filename) {
      throw new Error(`未支援的實體: ${entityName}`);
    }

    try {
      const filepath = path.join(this.mockDataDir, filename);
      const fileContent = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(fileContent);

      const idField = `${entityName.slice(0, -1)}id`;
      const recordIndex = data.value.findIndex(record => record[idField] === recordId);

      if (recordIndex === -1) {
        throw new Error(`找不到記錄: ${recordId}`);
      }

      // 更新記錄
      data.value[recordIndex] = {
        ...data.value[recordIndex],
        ...updateData,
        modifiedon: new Date().toISOString()
      };

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');

      return data.value[recordIndex];
    } catch (error) {
      console.error(`更新記錄失敗 (${entityName}):`, error.message);
      throw error;
    }
  }

  /**
   * 刪除記錄
   */
  async deleteRecord(entityName, recordId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const filename = this.entities[entityName];
    if (!filename) {
      throw new Error(`未支援的實體: ${entityName}`);
    }

    try {
      const filepath = path.join(this.mockDataDir, filename);
      const fileContent = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(fileContent);

      const idField = `${entityName.slice(0, -1)}id`;
      const recordIndex = data.value.findIndex(record => record[idField] === recordId);

      if (recordIndex === -1) {
        throw new Error(`找不到記錄: ${recordId}`);
      }

      // 刪除記錄
      const deletedRecord = data.value.splice(recordIndex, 1)[0];

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');

      return deletedRecord;
    } catch (error) {
      console.error(`刪除記錄失敗 (${entityName}):`, error.message);
      throw error;
    }
  }

  /**
   * 獲取服務狀態
   */
  getStatus() {
    return {
      service: 'Dynamics 365 Mock Service',
      status: 'running',
      initialized: this.isInitialized,
      entities: Object.keys(this.entities),
      mode: 'mock'
    };
  }
}

// 單例模式
let mockServiceInstance = null;

function getMockService() {
  if (!mockServiceInstance) {
    mockServiceInstance = new Dynamics365MockService();
  }
  return mockServiceInstance;
}

module.exports = {
  Dynamics365MockService,
  getMockService
};