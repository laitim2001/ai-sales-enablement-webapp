/**
 * 本地開發環境設置助手
 *
 * 功能：
 * 1. 檢查並創建 .env.local 配置文件
 * 2. 初始化模擬數據
 * 3. 驗證所有配置
 * 4. 提供配置指引和故障排除
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class LocalEnvironmentSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.envLocalPath = path.join(this.projectRoot, '.env.local');
    this.envExamplePath = path.join(this.projectRoot, '.env.example');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 主要設置流程
   */
  async run() {
    console.log('🚀 AI 銷售賦能平台 - 本地開發環境設置助手\n');
    console.log('=' .repeat(60));

    try {
      // 檢查項目結構
      await this.checkProjectStructure();

      // 檢查或創建 .env.local
      await this.setupEnvFile();

      // 驗證配置
      await this.validateConfiguration();

      // 初始化模擬數據
      await this.initializeMockData();

      // 提供使用指引
      this.showUsageGuide();

      console.log('\n✅ 本地開發環境設置完成！');
    } catch (error) {
      console.error('\n❌ 設置過程發生錯誤:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * 檢查項目結構
   */
  async checkProjectStructure() {
    console.log('🔍 檢查項目結構...\n');

    const requiredDirs = ['poc', 'scripts', 'docs', 'prisma'];
    const requiredFiles = ['.env.example', 'package.json', 'PROJECT-INDEX.md'];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      try {
        await fs.access(dirPath);
        console.log(`✅ 目錄存在: ${dir}/`);
      } catch (error) {
        console.log(`⚠️  目錄缺失: ${dir}/`);
      }
    }

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        console.log(`✅ 文件存在: ${file}`);
      } catch (error) {
        console.log(`⚠️  文件缺失: ${file}`);
      }
    }

    console.log('');
  }

  /**
   * 設置環境變數文件
   */
  async setupEnvFile() {
    console.log('🔧 設置環境變數文件...\n');

    // 檢查 .env.local 是否存在
    let envExists = false;
    try {
      await fs.access(this.envLocalPath);
      envExists = true;
      console.log('📋 .env.local 文件已存在');
    } catch (error) {
      console.log('📋 .env.local 文件不存在，將創建新的配置');
    }

    if (envExists) {
      const overwrite = await this.askQuestion('是否要重新配置 .env.local？(y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('保持現有配置');
        return;
      }
    }

    // 讀取 .env.example 模板
    let templateContent;
    try {
      templateContent = await fs.readFile(this.envExamplePath, 'utf8');
    } catch (error) {
      console.error('❌ 無法讀取 .env.example 文件');
      throw error;
    }

    console.log('\n🎯 現在我們來配置你的 Azure OpenAI 設置:');

    // 收集用戶輸入
    const azureEndpoint = await this.askQuestion('Azure OpenAI 端點 (例: https://your-resource.openai.azure.com/): ');
    const azureApiKey = await this.askQuestion('Azure OpenAI API 金鑰: ');
    const gpt4Deployment = await this.askQuestion('GPT-4 部署名稱: ');
    const embeddingDeployment = await this.askQuestion('Embedding 模型部署名稱 (可選): ') || 'text-embedding-ada-002';

    // 詢問資料庫配置
    console.log('\n🗄️ PostgreSQL 資料庫配置:');
    const defaultDbUrl = 'postgresql://postgres:your_password@localhost:5432/ai_sales_db?schema=public';
    const dbUrl = await this.askQuestion(`資料庫 URL (預設: ${defaultDbUrl}): `) || defaultDbUrl;

    // 創建配置內容
    const envContent = templateContent
      .replace(/你的-azure-openai-api-key/g, azureApiKey)
      .replace(/https:\/\/你的資源名稱\.openai\.azure\.com\//g, azureEndpoint)
      .replace(/你的-gpt4-部署名稱/g, gpt4Deployment)
      .replace(/你的-embedding-部署名稱/g, embeddingDeployment)
      .replace(/postgresql:\/\/postgres:your_password@localhost:5432\/ai_sales_db\?schema=public/g, dbUrl);

    // 寫入 .env.local 文件
    await fs.writeFile(this.envLocalPath, envContent, 'utf8');
    console.log('\n✅ .env.local 文件創建成功！');
  }

  /**
   * 驗證配置
   */
  async validateConfiguration() {
    console.log('\n🔍 驗證配置...\n');

    // 重新載入環境變數
    require('dotenv').config({ path: this.envLocalPath });

    const requiredEnvs = [
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_DEPLOYMENT_ID_GPT4',
      'DATABASE_URL'
    ];

    let allValid = true;

    for (const env of requiredEnvs) {
      if (process.env[env] && process.env[env] !== '' && !process.env[env].includes('你的-')) {
        console.log(`✅ ${env}: 已配置`);
      } else {
        console.log(`❌ ${env}: 缺失或未正確配置`);
        allValid = false;
      }
    }

    if (allValid) {
      console.log('\n✅ 所有必要配置都已設置！');
    } else {
      console.log('\n⚠️  請檢查並完善配置後再繼續');
      throw new Error('配置驗證失敗');
    }
  }

  /**
   * 初始化模擬數據
   */
  async initializeMockData() {
    console.log('\n🎭 初始化 Dynamics 365 模擬數據...\n');

    try {
      // 載入模擬服務
      const mockServicePath = path.join(this.projectRoot, 'poc', 'dynamics-365-mock.js');
      const { getMockService } = require(mockServicePath);
      const mockService = getMockService();

      // 初始化模擬服務
      await mockService.initialize();

      console.log('✅ D365 模擬服務初始化成功');
      console.log('✅ 模擬數據已準備就緒');

      // 顯示模擬數據統計
      const accounts = await mockService.readEntityData('accounts');
      const contacts = await mockService.readEntityData('contacts');
      const opportunities = await mockService.readEntityData('opportunities');
      const products = await mockService.readEntityData('products');

      console.log('\n📊 模擬數據統計:');
      console.log(`   - 客戶帳戶: ${accounts.value?.length || 0} 筆`);
      console.log(`   - 聯絡人: ${contacts.value?.length || 0} 筆`);
      console.log(`   - 銷售機會: ${opportunities.value?.length || 0} 筆`);
      console.log(`   - 產品: ${products.value?.length || 0} 筆`);
    } catch (error) {
      console.error('❌ 模擬數據初始化失敗:', error.message);
      console.log('💡 這不會影響其他功能，可以稍後手動初始化');
    }
  }

  /**
   * 顯示使用指引
   */
  showUsageGuide() {
    console.log('\n📋 使用指引:');
    console.log('=' .repeat(40));

    console.log('\n🧪 運行技術驗證測試:');
    console.log('   cd poc');
    console.log('   node run-all-tests.js           # 自動檢測模式');
    console.log('   node run-all-tests.js --mock    # 強制模擬模式');

    console.log('\n🎭 單獨測試 D365 模擬服務:');
    console.log('   cd poc');
    console.log('   node dynamics-365-test-mock.js');

    console.log('\n🚀 啟動開發服務器:');
    console.log('   npm run dev');

    console.log('\n🗄️ 資料庫操作:');
    console.log('   npm run db:generate    # 生成 Prisma 客戶端');
    console.log('   npm run db:push        # 推送資料庫模型');
    console.log('   npm run db:studio      # 打開 Prisma Studio');

    console.log('\n📁 重要文件位置:');
    console.log('   - 環境配置: .env.local');
    console.log('   - 模擬數據: poc/mock-data/');
    console.log('   - 項目索引: PROJECT-INDEX.md');
    console.log('   - AI 助手指南: AI-ASSISTANT-GUIDE.md');

    console.log('\n⚠️  重要提醒:');
    console.log('   - .env.local 包含敏感信息，不要提交到 Git');
    console.log('   - 本地開發使用 D365 模擬模式');
    console.log('   - 部署時需要配置真實的 D365 連接');
    console.log('   - 定期備份模擬數據以防意外丟失');
  }

  /**
   * 互動式問答
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const setup = new LocalEnvironmentSetup();
  setup.run().catch(error => {
    console.error('設置失敗:', error.message);
    process.exit(1);
  });
}

module.exports = LocalEnvironmentSetup;