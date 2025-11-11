# Microsoft Graph 日曆整合設置指南

## 📋 目錄

1. [概述](#概述)
2. [前置需求](#前置需求)
3. [Azure AD 應用程序註冊](#azure-ad-應用程序註冊)
4. [API 權限配置](#api-權限配置)
5. [OAuth 重定向 URI 設置](#oauth-重定向-uri-設置)
6. [生成客戶端密鑰](#生成客戶端密鑰)
7. [環境變數配置](#環境變數配置)
8. [開發模式 vs 生產模式](#開發模式-vs-生產模式)
9. [測試日曆整合](#測試日曆整合)
10. [常見問題](#常見問題)
11. [故障排除](#故障排除)

---

## 概述

本指南將幫助您設置 Microsoft Graph API 日曆整合功能。該功能允許平台：

- ✅ 同步用戶的 Microsoft 365/Outlook 日曆
- ✅ 創建和管理日曆事件
- ✅ 自動為會議準備包關聯日曆事件
- ✅ 提供智能會議提醒和建議

**架構圖:**
```
AI Sales Platform
    ↓ OAuth 2.0 認證
Azure AD (Application Registration)
    ↓ Access Token
Microsoft Graph API
    ↓ Calendar Data
User's Microsoft 365 Calendar
```

---

## 前置需求

在開始之前，您需要：

1. **Azure 訂閱**: 免費或付費的 Azure 訂閱
   - 免費註冊: https://azure.microsoft.com/free/

2. **Microsoft 365 帳戶**: 用於測試日曆功能
   - 可以使用個人 Microsoft 帳戶或組織帳戶

3. **Azure Portal 訪問權限**:
   - 需要有創建應用程序註冊的權限
   - URL: https://portal.azure.com

4. **Node.js 開發環境**:
   - 已安裝並運行本項目

---

## Azure AD 應用程序註冊

### 步驟 1: 訪問 Azure Portal

1. 登錄 [Azure Portal](https://portal.azure.com)
2. 在搜索欄中輸入 "Azure Active Directory" 或 "Microsoft Entra ID"
3. 點擊進入 Azure Active Directory 服務

### 步驟 2: 創建新的應用程序註冊

1. 在左側導航欄中，點擊 **"App registrations"** (應用程序註冊)
2. 點擊 **"+ New registration"** (新註冊)
3. 填寫應用程序信息:

   | 欄位 | 值 | 說明 |
   |------|-----|------|
   | **Name** | AI Sales Enablement Platform | 應用程序顯示名稱 |
   | **Supported account types** | Accounts in this organizational directory only | 單一租戶 (推薦) |
   | **Redirect URI** | Web: `http://localhost:3005/api/calendar/auth/callback` | OAuth 回調地址 |

4. 點擊 **"Register"** (註冊)

### 步驟 3: 記錄重要信息

註冊完成後，您會看到 "Overview" 頁面，記錄以下信息:

```bash
# Application (client) ID - 複製此值
AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Directory (tenant) ID - 複製此值
AZURE_AD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**⚠️ 重要**: 請妥善保管這些信息，稍後需要配置到環境變數中。

---

## API 權限配置

### 步驟 1: 添加 Microsoft Graph 權限

1. 在應用程序註冊頁面，點擊左側 **"API permissions"** (API 權限)
2. 點擊 **"+ Add a permission"** (添加權限)
3. 選擇 **"Microsoft Graph"**
4. 選擇 **"Delegated permissions"** (委派權限)

### 步驟 2: 添加日曆相關權限

在權限搜索框中，依次添加以下權限:

| 權限名稱 | 類型 | 說明 |
|---------|------|------|
| `User.Read` | Delegated | 讀取用戶基本信息 |
| `Calendars.ReadWrite` | Delegated | 讀寫用戶日曆 |
| `Calendars.ReadWrite.Shared` | Delegated | 讀寫共享日曆 |

**操作步驟**:
1. 搜索 "User.Read" → 勾選 → 點擊 "Add permissions"
2. 重複步驟，添加 "Calendars.ReadWrite"
3. 重複步驟，添加 "Calendars.ReadWrite.Shared"

### 步驟 3: 授予管理員同意 (可選但推薦)

1. 在 API permissions 頁面
2. 點擊 **"Grant admin consent for [組織名稱]"**
3. 點擊 **"Yes"** 確認

**說明**: 這一步為所有用戶預先授權，用戶首次登錄時不需要單獨同意。

---

## OAuth 重定向 URI 設置

### 開發環境重定向 URI

已在應用程序註冊時添加:
```
http://localhost:3005/api/calendar/auth/callback
```

### 生產環境重定向 URI (部署後添加)

1. 返回 **"Authentication"** (身份驗證) 頁面
2. 在 **"Web"** 部分，點擊 **"Add URI"**
3. 添加生產環境 URL:
   ```
   https://your-production-domain.com/api/calendar/auth/callback
   ```
4. 點擊 **"Save"** 保存

**⚠️ 重要**: 生產環境必須使用 HTTPS，不能使用 HTTP。

---

## 生成客戶端密鑰

### 步驟 1: 創建新密鑰

1. 在應用程序註冊頁面，點擊 **"Certificates & secrets"** (證書和密鑰)
2. 點擊 **"Client secrets"** 選項卡
3. 點擊 **"+ New client secret"**
4. 填寫信息:
   - **Description**: "AI Sales Platform - Production Secret"
   - **Expires**: 選擇過期時間 (建議: 12 months 或 24 months)
5. 點擊 **"Add"**

### 步驟 2: 複製密鑰值

**⚠️ 極度重要**: 密鑰值只會顯示一次！

```bash
# Client secret value - 立即複製並保存
AZURE_AD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**安全提示**:
- ❌ 不要將密鑰提交到 Git 倉庫
- ❌ 不要在客戶端代碼中暴露密鑰
- ✅ 使用環境變數存儲密鑰
- ✅ 定期輪換密鑰 (建議每 6-12 個月)
- ✅ 生產環境使用 Azure Key Vault 存儲

---

## 環境變數配置

### 開發環境配置 (.env.local)

項目已預配置開發模式，使用模擬模式進行開發:

```bash
# ==============================================
# Microsoft Graph 日曆整合配置 (Sprint 7)
# ==============================================

# 🔧 開發模式 - 使用模擬模式
MICROSOFT_GRAPH_MODE=mock
MICROSOFT_GRAPH_MOCK_ENABLED=true

# 模擬模式的佔位符配置 (將被忽略)
AZURE_AD_TENANT_ID=mock-tenant-id
AZURE_AD_CLIENT_ID=mock-client-id
AZURE_AD_CLIENT_SECRET=mock-client-secret
AZURE_AD_REDIRECT_URI=http://localhost:3005/api/calendar/auth/callback

# Microsoft Graph API配置
MICROSOFT_GRAPH_SCOPES=User.Read,Calendars.ReadWrite,Calendars.ReadWrite.Shared
```

### 生產環境配置

當您準備測試真實的 Microsoft Graph 集成時，更新 `.env.local`:

```bash
# 切換到生產模式
MICROSOFT_GRAPH_MODE=production
MICROSOFT_GRAPH_MOCK_ENABLED=false

# ⚠️ 填入從 Azure Portal 獲取的真實值
AZURE_AD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_AD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_AD_REDIRECT_URI=http://localhost:3005/api/calendar/auth/callback

# Microsoft Graph API配置 (保持不變)
MICROSOFT_GRAPH_SCOPES=User.Read,Calendars.ReadWrite,Calendars.ReadWrite.Shared
```

**配置檢查清單**:
- [ ] `AZURE_AD_TENANT_ID` 已從 Azure Portal 複製
- [ ] `AZURE_AD_CLIENT_ID` 已從 Azure Portal 複製
- [ ] `AZURE_AD_CLIENT_SECRET` 已從 Azure Portal 複製並妥善保管
- [ ] `AZURE_AD_REDIRECT_URI` 與 Azure 應用程序註冊中的 URI 完全一致
- [ ] `MICROSOFT_GRAPH_SCOPES` 包含所有必需的權限

---

## 開發模式 vs 生產模式

### 開發模式 (Mock Mode)

**何時使用**: 本地開發、功能測試、不需要真實日曆數據時

**特點**:
- ✅ 無需 Azure AD 配置
- ✅ 返回模擬日曆數據
- ✅ 快速開發迭代
- ✅ 不消耗 Microsoft Graph API 配額
- ❌ 無法測試真實 OAuth 流程
- ❌ 無法驗證實際日曆同步

**配置**:
```bash
MICROSOFT_GRAPH_MODE=mock
MICROSOFT_GRAPH_MOCK_ENABLED=true
```

### 生產模式 (Production Mode)

**何時使用**: 集成測試、UAT、生產環境

**特點**:
- ✅ 真實 Microsoft Graph API 集成
- ✅ 實際 OAuth 2.0 認證流程
- ✅ 真實用戶日曆數據同步
- ✅ 完整功能驗證
- ❌ 需要完整 Azure AD 配置
- ❌ 消耗 API 配額

**配置**:
```bash
MICROSOFT_GRAPH_MODE=production
MICROSOFT_GRAPH_MOCK_ENABLED=false
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
```

---

## 測試日曆整合

### 1. 啟動開發服務器

```bash
npm run dev
```

服務器應在 `http://localhost:3005` 運行。

### 2. 測試 OAuth 認證流程

#### 開發模式測試 (Mock):

```bash
# 獲取授權 URL (返回模擬 URL)
curl http://localhost:3005/api/calendar/auth

# 模擬回調 (返回模擬 token)
curl -X POST http://localhost:3005/api/calendar/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "mock-auth-code", "state": "mock-state"}'
```

#### 生產模式測試:

1. **獲取授權 URL**:
   ```bash
   curl http://localhost:3005/api/calendar/auth
   ```

2. **在瀏覽器中打開返回的 URL**:
   - 登錄您的 Microsoft 帳戶
   - 同意授予權限
   - 瀏覽器會重定向到回調 URL

3. **驗證 Token 存儲**:
   - 回調成功後，access token 應被存儲
   - 可以檢查應用程序日誌確認

### 3. 測試日曆事件操作

```bash
# 設置 JWT token (從登錄獲取)
TOKEN="your-jwt-token-here"

# 獲取日曆事件
curl http://localhost:3005/api/calendar/events \
  -H "Authorization: Bearer $TOKEN"

# 創建新事件
curl -X POST http://localhost:3005/api/calendar/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "測試會議",
    "start": "2025-10-10T10:00:00",
    "end": "2025-10-10T11:00:00",
    "attendees": ["attendee@example.com"]
  }'
```

### 4. 測試日曆同步

```bash
# 執行增量同步
curl -X POST http://localhost:3005/api/calendar/sync \
  -H "Authorization: Bearer $TOKEN"

# 檢查同步狀態
curl http://localhost:3005/api/calendar/sync/status \
  -H "Authorization: Bearer $TOKEN"

# 執行完整同步
curl -X PUT http://localhost:3005/api/calendar/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysAhead": 30, "daysBehind": 7}'
```

---

## 常見問題

### Q1: 為什麼選擇 "Single tenant" 而不是 "Multi-tenant"?

**A**: 單租戶應用更安全且配置簡單。如果您的應用只為單一組織使用，建議使用單租戶。多租戶適用於 SaaS 應用，需要支持多個組織。

### Q2: 如果忘記複製 Client Secret 怎麼辦?

**A**: 無法找回已生成的密鑰。您需要:
1. 刪除舊密鑰
2. 生成新密鑰
3. 更新環境變數

### Q3: Redirect URI 必須完全匹配嗎?

**A**: 是的！包括:
- 協議 (http/https)
- 域名/IP
- 端口號
- 路徑

不匹配會導致 OAuth 錯誤。

### Q4: 可以使用個人 Microsoft 帳戶測試嗎?

**A**: 可以，但建議使用 Microsoft 365 組織帳戶進行完整測試。個人帳戶可能不支持所有企業功能。

### Q5: API 權限需要管理員同意嗎?

**A**: 對於 `Calendars.ReadWrite.Shared`，部分組織可能需要管理員同意。如果您是管理員，建議預先授予同意以改善用戶體驗。

### Q6: 如何處理 Token 過期?

**A**: Microsoft Graph OAuth token 有效期為 1 小時。應用會自動使用 refresh token 更新 access token。確保存儲了 refresh token。

---

## 故障排除

### 問題 1: "Invalid redirect URI" 錯誤

**症狀**:
```
AADSTS50011: The redirect URI 'http://localhost:3005/api/calendar/auth/callback' specified in the request does not match the redirect URIs configured for the application.
```

**解決方案**:
1. 檢查 Azure Portal 中的 Redirect URI 配置
2. 確保 `.env.local` 中的 `AZURE_AD_REDIRECT_URI` 與 Azure 配置完全一致
3. 注意大小寫、斜杠、端口號

### 問題 2: "Insufficient privileges" 錯誤

**症狀**:
```
{
  "error": {
    "code": "ErrorAccessDenied",
    "message": "Access is denied. Check credentials and try again."
  }
}
```

**解決方案**:
1. 檢查 API permissions 是否正確添加
2. 確認已授予管理員同意
3. 用戶需要重新登錄以獲取新權限
4. 檢查 `MICROSOFT_GRAPH_SCOPES` 配置

### 問題 3: "Client secret expired" 錯誤

**症狀**:
```
AADSTS7000222: The provided client secret keys are expired.
```

**解決方案**:
1. 在 Azure Portal 生成新的 client secret
2. 更新 `.env.local` 中的 `AZURE_AD_CLIENT_SECRET`
3. 重啟應用程序

### 問題 4: Token 無法刷新

**症狀**: Access token 過期後無法自動更新

**解決方案**:
1. 檢查是否正確存儲了 refresh token
2. 確認 `offline_access` scope 已包含在權限中
3. 檢查 token 存儲實現是否正確

### 問題 5: 本地測試無法訪問回調 URL

**症狀**: OAuth 重定向後無法訪問 `http://localhost:3005`

**解決方案**:
1. 確認開發服務器正在運行
2. 檢查端口 3005 是否被其他進程佔用
3. 嘗試使用 `127.0.0.1` 代替 `localhost`
4. 檢查防火牆設置

### 問題 6: CORS 錯誤

**症狀**:
```
Access to fetch at 'https://login.microsoftonline.com/...' from origin 'http://localhost:3005' has been blocked by CORS policy
```

**解決方案**:
1. Microsoft OAuth 流程應使用完整頁面重定向，不要使用 AJAX
2. 確認使用正確的 OAuth 流程 (Authorization Code Flow)
3. 檢查 redirect URI 配置

---

## 安全最佳實踐

### 1. 密鑰管理

- ✅ 使用環境變數存儲敏感信息
- ✅ 不要在代碼中硬編碼密鑰
- ✅ 生產環境使用 Azure Key Vault
- ✅ 定期輪換 client secrets (每 6-12 個月)
- ✅ 為不同環境使用不同的應用程序註冊

### 2. Token 安全

- ✅ 使用 HTTPS 傳輸 tokens
- ✅ 在服務器端存儲 tokens，不要暴露給前端
- ✅ 實現 token 加密存儲
- ✅ 設置適當的 token 過期時間
- ✅ 實現 token 撤銷機制

### 3. 權限控制

- ✅ 只請求必需的最小權限
- ✅ 使用 Delegated permissions 而非 Application permissions (除非必需)
- ✅ 定期審查應用程序權限
- ✅ 為用戶提供權限說明

### 4. 審計和監控

- ✅ 記錄所有 OAuth 認證事件
- ✅ 監控 API 調用失敗率
- ✅ 設置異常登錄告警
- ✅ 定期審查 Azure AD 登錄日誌

---

## 參考資源

### Microsoft 官方文檔

- [Microsoft Graph API 概述](https://docs.microsoft.com/graph/overview)
- [Calendar API 參考](https://docs.microsoft.com/graph/api/resources/calendar)
- [OAuth 2.0 授權流程](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph 權限參考](https://docs.microsoft.com/graph/permissions-reference)

### 項目相關文檔

- `lib/calendar/microsoft-graph-oauth.ts` - OAuth 認證實現
- `lib/calendar/calendar-sync-service.ts` - 日曆同步服務
- `app/api/calendar/auth/route.ts` - OAuth 認證 API
- `app/api/calendar/events/route.ts` - 事件管理 API
- `app/api/calendar/sync/route.ts` - 同步管理 API

### 開發工具

- [Microsoft Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) - 在線測試 Graph API
- [JWT.io](https://jwt.io/) - JWT token 解碼工具
- [Postman](https://www.postman.com/) - API 測試工具

---

## 支援和反饋

如果您在設置過程中遇到問題:

1. 檢查本文檔的 [故障排除](#故障排除) 部分
2. 查看項目的 UAT 測試報告: `docs/sprint7-uat-execution-report.md`
3. 檢查開發服務器日誌
4. 參考 Microsoft Graph 官方文檔

---

**文檔版本**: 1.0
**最後更新**: 2025-10-06
**適用於**: Sprint 7 - Microsoft Graph 日曆整合功能
