# 🔧 Dynamics 365 環境設定和認證配置指南

> **目的**: 提供完整的 Dynamics 365 CRM 整合設置流程
> **適用對象**: 開發人員、系統管理員
> **前置要求**: Azure 租戶管理員權限、Dynamics 365 實例

---

## 📋 設置概述

此指南將協助您完成 AI 銷售賦能平台與 Dynamics 365 CRM 的整合配置，包括：

1. ✅ Azure Active Directory 應用程式註冊
2. ✅ Dynamics 365 API 權限設定
3. ✅ 環境變數配置
4. ✅ 連接測試和驗證

---

## 🎯 第一步：Azure Active Directory 應用程式註冊

### 1.1 在 Azure Portal 中創建應用程式

1. **登入 Azure Portal**: https://portal.azure.com
2. **導航到 Azure Active Directory** > **App registrations**
3. **點擊「New registration」**
4. **填寫應用程式資訊**：
   ```
   Name: AI Sales Enablement Platform
   Supported account types: Single tenant (本組織目錄中的帳戶)
   Redirect URI: 暫時留空（服務對服務認證不需要）
   ```
5. **點擊「Register」**

### 1.2 記錄應用程式識別資訊

註冊完成後，記錄以下資訊：

```env
# 在 Overview 頁面可以找到：
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 1.3 創建客戶端密鑰

1. **導航到「Certificates & secrets」**
2. **點擊「New client secret」**
3. **填寫描述和過期時間**：
   ```
   Description: AI Sales Platform Secret
   Expires: 24 months (建議)
   ```
4. **記錄客戶端密鑰值**（只會顯示一次）：
   ```env
   Client Secret: your-secret-value-here
   ```

---

## 🔐 第二步：Dynamics 365 API 權限設定

### 2.1 添加 Dynamics 365 API 權限

1. **在應用程式註冊中導航到「API permissions」**
2. **點擊「Add a permission」**
3. **選擇「APIs my organization uses」**
4. **搜索並選擇「Dynamics CRM」或您的 Dynamics 365 實例**
5. **選擇「Application permissions」**
6. **選擇必要的權限**：
   ```
   ✅ user_impersonation (代表用戶訪問)
   ✅ 其他根據需要的權限
   ```
7. **點擊「Add permissions」**

### 2.2 授予管理員同意

1. **點擊「Grant admin consent for [您的組織]」**
2. **確認授權**
3. **確保所有權限狀態顯示綠色勾號**

---

## 🌐 第三步：獲取 Dynamics 365 組織 URL

### 3.1 確定您的 Dynamics 365 實例 URL

1. **登入您的 Dynamics 365 實例**
2. **檢查瀏覽器地址欄的 URL 格式**：
   ```
   https://[您的組織名稱].crm5.dynamics.com/
   或
   https://[您的組織名稱].crm.dynamics.com/
   ```
3. **記錄完整的組織 URL**（包含 https:// 但去掉結尾的 /）

---

## ⚙️ 第四步：環境變數配置

### 4.1 更新 .env.local 文件

在項目根目錄的 `.env.local` 文件中，更新以下配置：

```env
# ==============================================
# Dynamics 365 CRM 整合配置
# ==============================================
DYNAMICS_365_TENANT_ID=your-azure-tenant-id-here
DYNAMICS_365_CLIENT_ID=your-app-client-id-here
DYNAMICS_365_CLIENT_SECRET=your-app-client-secret-here
DYNAMICS_365_RESOURCE=https://your-org.crm5.dynamics.com

# 可選：設置為 test 模式進行測試
DYNAMICS_365_MODE=test
DYNAMICS_365_MOCK_ENABLED=false
```

### 4.2 配置值說明

| 環境變數 | 說明 | 範例值 |
|---------|------|--------|
| `DYNAMICS_365_TENANT_ID` | Azure 租戶 ID | `12345678-1234-1234-1234-123456789012` |
| `DYNAMICS_365_CLIENT_ID` | 應用程式 (客戶端) ID | `87654321-4321-4321-4321-210987654321` |
| `DYNAMICS_365_CLIENT_SECRET` | 客戶端密鑰 | `your-secret-value-here` |
| `DYNAMICS_365_RESOURCE` | Dynamics 365 組織 URL | `https://yourorg.crm5.dynamics.com` |

---

## 🧪 第五步：連接測試和驗證

### 5.1 執行 Dynamics 365 POC 測試

```bash
# 在項目根目錄執行
node poc/dynamics-365-test.js
```

**預期輸出範例**：
```
🚀 開始 Dynamics 365 API POC 測試

==================================================
🔐 測試 Dynamics 365 OAuth 2.0 認證...
✅ 認證成功！
⏱️ 認證耗時: 1245ms
🔑 Token 類型: Bearer
⌛ Token 有效期: 3599秒

📊 測試基本數據讀取...
✅ 帳戶數據讀取成功！
⏱️ 查詢耗時: 876ms
📈 返回記錄數: 5

🚦 測試 API 速率限制（10個並發請求）...
📊 速率限制測試結果:
✅ 成功請求: 10/10
❌ 失敗請求: 0/10
⏱️ 總耗時: 2341ms
📈 平均每請求: 234.10ms

==================================================
📋 POC 測試總結:
🔐 認證測試: ✅ 通過
📊 數據讀取: ✅ 通過
🚦 速率限制: ✅ 通過

🎯 整體評估: ✅ 可以繼續開發
```

### 5.2 執行系統整合測試

```bash
# 執行完整的 CRM 整合測試
npm run test:integration:crm
```

### 5.3 檢查連接狀態

```bash
# 執行健康檢查腳本
node scripts/health-check.js
```

---

## ❌ 常見問題排除

### 問題 1：認證失敗 (401 Unauthorized)

**可能原因**：
- 客戶端 ID 或密鑰錯誤
- 租戶 ID 不正確
- API 權限未正確設置

**解決方案**：
1. 重新檢查 Azure Portal 中的應用程式資訊
2. 確認客戶端密鑰是否過期
3. 驗證 API 權限是否已獲得管理員同意

### 問題 2：資源訪問被拒絕 (403 Forbidden)

**可能原因**：
- Dynamics 365 API 權限不足
- 應用程式未被授權訪問該 Dynamics 365 實例

**解決方案**：
1. 檢查 Dynamics 365 中的應用程式用戶設置
2. 確保應用程式具有適當的安全角色

### 問題 3：找不到資源 (404 Not Found)

**可能原因**：
- Dynamics 365 組織 URL 不正確
- API 端點路徑錯誤

**解決方案**：
1. 確認 `DYNAMICS_365_RESOURCE` 的 URL 格式正確
2. 檢查 Dynamics 365 實例是否正常運行

### 問題 4：環境變數缺失

**錯誤訊息**：
```
❌ 缺少必要的環境變數:
   - DYNAMICS_365_TENANT_ID
   - DYNAMICS_365_CLIENT_ID
   - DYNAMICS_365_CLIENT_SECRET
   - DYNAMICS_365_RESOURCE
```

**解決方案**：
1. 確保 `.env.local` 文件存在於項目根目錄
2. 驗證所有必要的環境變數都已正確設置
3. 重啟開發服務器以載入新的環境變數

---

## 🔄 模擬模式 (Mock Mode)

如果暫時無法連接到真實的 Dynamics 365 實例，可以啟用模擬模式：

```env
# 在 .env.local 中設置
DYNAMICS_365_MODE=mock
DYNAMICS_365_MOCK_ENABLED=true
```

模擬模式提供：
- ✅ 模擬的客戶資料
- ✅ 模擬的銷售機會資料
- ✅ 完整的 API 介面測試
- ✅ 開發環境的快速原型驗證

---

## 📚 相關文檔

- [Azure Active Directory 應用程式註冊文檔](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Dynamics 365 Web API 文檔](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/)
- [Microsoft Authentication Library (MSAL) 文檔](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)

---

## 💡 最佳實踐

1. **安全性**：
   - 定期輪換客戶端密鑰
   - 使用最小權限原則
   - 不要在程式碼中硬編碼憑證

2. **監控**：
   - 設置 API 使用量監控
   - 記錄認證錯誤以便診斷
   - 監控權杖過期和自動更新

3. **開發**：
   - 在開發環境使用模擬模式
   - 在測試環境進行完整整合測試
   - 在生產環境使用生產級配置

---

**最後更新**: 2025-09-28
**版本**: 1.0
**作者**: Claude Code