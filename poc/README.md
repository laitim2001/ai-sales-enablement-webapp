# 🧪 POC (Proof of Concept) 測試套件

本目錄包含了 AI 銷售賦能平台的技術驗證測試，用於驗證核心技術組件的可行性和性能。

## 📋 測試範圍

### 1. Dynamics 365 CRM 整合測試
- **檔案**: `dynamics-365-test.js`
- **測試內容**:
  - ✅ OAuth 2.0 認證流程
  - ✅ API 連接和數據讀取
  - ✅ 速率限制測試 (6000/分鐘)
  - ✅ 錯誤處理機制

### 2. PostgreSQL + pgvector 性能測試
- **檔案**: `pgvector-performance-test.js`
- **測試內容**:
  - ✅ pgvector 擴展安裝驗證
  - ✅ 向量插入性能測試
  - ✅ 相似性搜索性能測試
  - ✅ 不同維度 (384, 768, 1536) 性能對比

### 3. Azure OpenAI 成本和性能測試
- **檔案**: `azure-openai-cost-test.js`
- **測試內容**:
  - ✅ API 連接驗證
  - ✅ 文本生成性能測試 (GPT-3.5, GPT-4)
  - ✅ Embedding 生成測試
  - ✅ 月度成本預估和預算分析

## 🚀 快速開始

### 前置需求

1. **Node.js**: 版本 18+
2. **PostgreSQL**: 版本 14+ (需支援 pgvector 擴展)
3. **Azure 服務訂閱**:
   - Azure AD (用於 Dynamics 365 認證)
   - Dynamics 365 CRM 實例
   - Azure OpenAI Service

### 安裝依賴

```bash
# 在專案根目錄執行
npm install

# 或者在 poc 目錄執行
cd poc
npm install axios pg uuid dotenv
```

### 設定環境變數

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 文件，填入實際的服務配置
```

### 執行測試

#### 執行所有測試
```bash
cd poc
node run-all-tests.js
```

#### 執行單獨測試
```bash
# 只測試 Dynamics 365
node dynamics-365-test.js

# 只測試 pgvector 性能
node pgvector-performance-test.js

# 只測試 Azure OpenAI
node azure-openai-cost-test.js
```

## 📊 測試結果解讀

### 成功指標

#### Dynamics 365 CRM
- ✅ **認證成功**: OAuth 2.0 token 取得成功
- ✅ **數據讀取**: 能成功讀取帳戶資料
- ✅ **速率限制**: 10個並發請求成功率 ≥ 80%

#### PostgreSQL + pgvector
- ✅ **連接成功**: 數據庫連接和 pgvector 擴展正常
- ✅ **插入性能**: > 100 條/秒 (1536維向量)
- ✅ **搜索性能**: 平均搜索時間 < 500ms

#### Azure OpenAI
- ✅ **API 連接**: 成功調用各種模型 API
- ✅ **成本控制**: 年度預估成本 < $100,000 (預算限制)
- ✅ **性能達標**: GPT-4 回應時間 < 30秒

### 失敗處理

如果測試失敗，檢查以下項目:

1. **環境變數配置**:
   ```bash
   # 檢查所有必要變數是否設定
   node -e "console.log(process.env)" | grep -E "(AZURE_|POSTGRES_|DYNAMICS_)"
   ```

2. **網路連接**:
   ```bash
   # 測試到 Azure 服務的連接
   curl -I https://login.microsoftonline.com
   ```

3. **服務權限**:
   - 確認 Azure AD App 有 Dynamics 365 API 權限
   - 確認 Azure OpenAI 服務已正確部署模型
   - 確認 PostgreSQL 用戶有創建擴展權限

## 🔧 故障排除

### 常見問題

#### 1. Dynamics 365 認證失敗
```
❌ 認證失敗: invalid_client
```

**解決方案**:
- 檢查 `AZURE_CLIENT_ID` 和 `AZURE_CLIENT_SECRET`
- 確認應用程式已授權 Dynamics 365 API 權限
- 檢查租戶 ID 是否正確

#### 2. pgvector 擴展缺失
```
❌ pgvector 擴展安裝失敗: extension "vector" does not exist
```

**解決方案**:
```sql
-- 以超級用戶身份執行
CREATE EXTENSION vector;
-- 或者安裝 pgvector: https://github.com/pgvector/pgvector
```

#### 3. Azure OpenAI 模型未找到
```
❌ API 連接失敗: The API deployment for this resource does not exist
```

**解決方案**:
- 在 Azure OpenAI Studio 中部署所需模型
- 確認模型部署名稱與程式碼中的名稱一致
- 檢查 API 端點和密鑰

### 效能調優

#### PostgreSQL 優化
```sql
-- 調整 PostgreSQL 設定以提升向量搜索性能
ALTER SYSTEM SET shared_preload_libraries = 'vector';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

#### Azure OpenAI 成本優化
- 實施智能緩存減少重複請求
- 使用更經濟的模型處理簡單任務
- 設置 token 使用限制
- 監控和分析使用模式

## 📈 測試報告

測試完成後會生成 `poc-test-report.json` 文件，包含:

```json
{
  "timestamp": "2024-01-09T10:00:00.000Z",
  "overallSuccess": true,
  "testResults": {
    "dynamics365": { ... },
    "pgvector": { ... },
    "azureOpenAI": { ... }
  },
  "summary": {
    "dynamics365": true,
    "pgvector": true,
    "azureOpenAI": true
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "development",
      "action": "開始 Epic 1 - 基礎平台開發"
    }
  ]
}
```

## 🎯 下一步行動

### 測試通過後
1. ✅ 開始建置開發環境
2. ✅ 設定 CI/CD 流程
3. ✅ 開始 Epic 1 開發
4. ✅ 建立監控機制

### 測試失敗後
1. ❌ 解決技術問題
2. ❌ 重新執行測試
3. ❌ 考慮替代方案
4. ❌ 更新技術架構

## 📞 支援

如遇到技術問題，請:

1. 檢查此 README 的故障排除章節
2. 查看測試輸出的錯誤訊息
3. 檢查相關服務的文檔:
   - [Dynamics 365 Web API](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/)
   - [pgvector Documentation](https://github.com/pgvector/pgvector)
   - [Azure OpenAI Service](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)

---

*本 POC 測試套件是 AI 銷售賦能平台技術驗證的重要環節，確保所有核心技術組件在開發前已經過驗證。*