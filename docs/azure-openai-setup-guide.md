# 🤖 Azure OpenAI 服務設置和測試指南

> **目的**: 提供完整的 Azure OpenAI 服務配置和測試流程
> **適用對象**: 開發人員、系統管理員
> **前置要求**: Azure 訂閱、Azure OpenAI 服務資源

---

## 📋 設置概述

此指南將協助您完成 AI 銷售賦能平台與 Azure OpenAI 的整合配置，包括：

1. ✅ Azure OpenAI 資源配置
2. ✅ 環境變數設定
3. ✅ 連接測試和驗證
4. ✅ 常見問題排除

---

## 🎯 第一步：Azure OpenAI 資源設置

### 1.1 創建 Azure OpenAI 資源

1. **登入 Azure Portal**: https://portal.azure.com
2. **搜索 OpenAI**: 在搜索欄輸入 "OpenAI"
3. **創建資源**: 選擇 "Azure OpenAI" 並點擊創建
4. **填寫基本資訊**：
   ```
   訂閱: [您的訂閱]
   資源群組: [建議創建新的群組]
   地區: East US 或 West Europe (建議)
   名稱: [自定義名稱]
   定價層: Standard S0
   ```

### 1.2 記錄服務資訊

創建完成後，前往資源頁面記錄：

```env
# 在 "Keys and Endpoint" 頁面找到：
AZURE_OPENAI_API_KEY: [Key 1 或 Key 2]
AZURE_OPENAI_ENDPOINT: https://[您的資源名稱].openai.azure.com/
```

---

## 🚀 第二步：創建模型部署

### 2.1 部署 GPT-4o 模型

1. **前往 Azure OpenAI Studio**: https://oai.azure.com/
2. **選擇您的資源**
3. **導航到 Deployments** > **Create new deployment**
4. **選擇模型**：
   ```
   模型: gpt-4o
   部署名稱: gpt-4o (建議使用相同名稱)
   版本: 最新版本
   ```

### 2.2 部署 Embedding 模型 (可選)

如果需要向量搜索功能：

```
模型: text-embedding-ada-002
部署名稱: text-embedding-ada-002
版本: 最新版本
```

---

## ⚙️ 第三步：環境變數配置

### 3.1 更新 .env.local 文件

在項目根目錄的 `.env.local` 文件中設置：

```env
# ==============================================
# Azure OpenAI 配置
# ==============================================
AZURE_OPENAI_API_KEY=您的API金鑰
AZURE_OPENAI_ENDPOINT=https://您的資源名稱.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# GPT-4 模型配置 - 與部署名稱一致
AZURE_OPENAI_DEPLOYMENT_ID_GPT4=gpt-4o
AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS=text-embedding-ada-002
```

### 3.2 配置值說明

| 環境變數 | 說明 | 範例值 |
|---------|------|--------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI 服務的 API 金鑰 | `abc123...xyz789` |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI 服務端點 URL | `https://myopenai.openai.azure.com/` |
| `AZURE_OPENAI_API_VERSION` | API 版本 | `2024-12-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT_ID_GPT4` | GPT-4 部署名稱 | `gpt-4o` |
| `AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS` | Embedding 部署名稱 | `text-embedding-ada-002` |

---

## 🧪 第四步：連接測試和驗證

### 4.1 執行基本連接測試

```bash
# 在項目根目錄執行
node poc/azure-openai-basic-test.js
```

**預期輸出**：
```
🚀 開始 Azure OpenAI 基本功能測試

==================================================
🔗 測試 Azure OpenAI 基本連接...
📍 端點: https://yourresource.openai.azure.com/
🎯 部署: gpt-4o
📅 API版本: 2024-12-01-preview
✅ Azure OpenAI 連接成功！
📨 回應: 連接正常 ✅
🔢 使用 tokens: 26
💰 預估成本: $0.000102

🗨️ 測試對話功能...
✅ 對話功能正常！
📨 回應: [AI回應內容]
🔢 使用 tokens: 243
💰 預估成本: $0.002107

==================================================
📋 Azure OpenAI 基本測試總結:
🔗 基本連接: ✅ 通過
🗨️ 對話功能: ✅ 通過

🎯 整體評估: ✅ Azure OpenAI 正常運行
```

### 4.2 執行成本和性能測試 (可選)

```bash
# 執行完整的成本和性能分析
node poc/azure-openai-cost-test.js
```

### 4.3 檢查應用整合

```bash
# 在開發模式下測試整合
npm run dev

# 訪問應用並測試 AI 功能
# http://localhost:3001
```

---

## ❌ 常見問題排除

### 問題 1：連接失敗 (401 Unauthorized)

**可能原因**：
- API 金鑰錯誤或過期
- 環境變數未正確設置

**解決方案**：
1. 檢查 Azure Portal 中的 API 金鑰
2. 確認 `.env.local` 文件中的配置正確
3. 重啟開發服務器

### 問題 2：部署未找到 (404 DeploymentNotFound)

**可能原因**：
- 部署名稱與環境變數不匹配
- 部署尚未完成或已刪除

**解決方案**：
1. 檢查 Azure OpenAI Studio 中的部署名稱
2. 確認 `AZURE_OPENAI_DEPLOYMENT_ID_GPT4` 設置正確
3. 等待部署完成（新部署可能需要幾分鐘）

### 問題 3：API 版本不支持 (400 Bad Request)

**可能原因**：
- API 版本過舊或不存在
- 功能在該版本中不可用

**解決方案**：
1. 使用推薦的 API 版本：`2024-12-01-preview`
2. 檢查 Azure 文檔以確認功能支持
3. 更新環境變數中的 `AZURE_OPENAI_API_VERSION`

### 問題 4：環境變數未加載

**錯誤訊息**：
```
❌ 缺少必要的環境變數:
   - AZURE_OPENAI_ENDPOINT
   - AZURE_OPENAI_API_KEY
```

**解決方案**：
1. 確保 `.env.local` 文件存在於項目根目錄
2. 檢查文件編碼為 UTF-8
3. 重啟 Node.js 應用
4. 使用 `require('dotenv').config({ path: '.env.local' })` 明確指定配置文件

---

## 💰 成本管理建議

### 成本優化策略

1. **使用適當的模型**：
   - 簡單查詢：GPT-3.5-turbo
   - 複雜任務：GPT-4o
   - 向量搜索：text-embedding-ada-002

2. **設置使用限制**：
   - 實施 token 使用監控
   - 設置每日/每月預算限制
   - 監控異常使用模式

3. **優化 Prompt 設計**：
   - 清晰、簡潔的提示詞
   - 合理設置 max_tokens
   - 避免不必要的上下文

### 預估成本

基於測試結果，50 用戶的月度預估：
- **月度運營成本**: ~$71.52
- **年度預估**: ~$858.18
- **預算使用率**: 0.9% (預算 $100,000)

---

## 🔗 相關文檔

- [Azure OpenAI 服務文檔](https://docs.microsoft.com/zh-tw/azure/cognitive-services/openai/)
- [GPT-4o 模型文檔](https://platform.openai.com/docs/models/gpt-4o)
- [Azure OpenAI 定價](https://azure.microsoft.com/zh-tw/pricing/details/cognitive-services/openai-service/)

---

## 💡 最佳實踐

1. **安全性**：
   - 定期輪換 API 金鑰
   - 不要在程式碼中硬編碼金鑰
   - 使用環境變數管理敏感資訊

2. **監控**：
   - 設置 Azure Monitor 警報
   - 監控 API 使用量和成本
   - 記錄異常錯誤和回應時間

3. **開發**：
   - 在開發環境使用較小的 token 限制
   - 實施快取機制避免重複請求
   - 使用 mock 模式進行功能測試

---

**最後更新**: 2025-09-28
**版本**: 1.0
**作者**: Claude Code