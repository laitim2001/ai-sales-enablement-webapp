# 🔧 UAT測試認證問題修復摘要

> **創建日期**: 2025-10-08
> **問題範圍**: TC-KB-001, TC-PROP-001 (401/403認證錯誤)
> **優先級**: 🔴 極高
> **狀態**: 🔍 診斷階段完成,等待用戶運行診斷工具

---

## 📋 問題診斷完成摘要

### 🎯 核心發現

#### 1. **JWT Token傳遞機制分析** ✅

**前端代碼分析** (`components/knowledge/knowledge-create-form.tsx:140`):
```typescript
const response = await fetch('/api/knowledge-base', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
  },
  body: JSON.stringify(requestData)
})
```

**發現**:
- ✅ 前端正確使用`Authorization: Bearer ${token}`格式
- ✅ 從`localStorage.getItem('auth-token')`獲取token
- ⚠️ 如果localStorage中沒有token,會傳遞`Bearer null`

#### 2. **後端認證流程分析** ✅

**權限中間件** (`lib/security/permission-middleware.ts:59-73`):
```typescript
function extractToken(request: NextRequest): string | null {
  // 1. 從 Authorization Header 提取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. 從 Cookie 提取
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}
```

**發現**:
- ✅ 後端支援兩種token傳遞方式: Authorization Header OR Cookie
- ✅ 優先級: Authorization Header > Cookie
- ✅ Token提取邏輯正確

#### 3. **認證Hook流程分析** ✅

**登入流程** (`hooks/use-auth.ts:287-338`):
```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', { /* ... */ })
  const result = await response.json()

  if (result.success && result.data) {
    // 儲存 access token 到 localStorage
    const token = result.data.accessToken || result.data.token
    if (token) {
      localStorage.setItem('auth-token', token)
    }

    // 設置用戶資料
    setUser(result.data.user)
    // 快取用戶資料
    localStorage.setItem('cached-user', JSON.stringify(result.data.user))
  }
}
```

**發現**:
- ✅ 登入成功後正確存儲token到localStorage
- ✅ 同時緩存用戶數據
- ⚠️ 需要確認API返回的token字段名稱 (`accessToken` vs `token`)

#### 4. **可能的失敗點** ⚠️

根據分析,以下是可能導致401/403錯誤的原因:

| 失敗點 | 症狀 | 檢查方法 |
|--------|------|----------|
| **A. Token未存儲** | localStorage為空 | 使用診斷工具檢查 |
| **B. Token已過期** | 過期時間 < 當前時間 | JWT解析檢查exp字段 |
| **C. Token格式錯誤** | 非標準JWT格式 | 檢查token是否有3個部分 |
| **D. 用戶角色無權限** | RBAC檢查失敗 | 查詢用戶角色和權限矩陣 |
| **E. 用戶賬號停用** | is_active = false | 查詢User表 |
| **F. API返回字段不匹配** | accessToken不存在 | 檢查登入API響應 |

---

## 🛠️ 診斷工具使用指南

### ✅ 已創建診斷工具

**工具位置**: `scripts/diagnose-auth-issues.js`

**功能**:
1. 🌐 瀏覽器端診斷 (localStorage, Cookie, Token解析)
2. 🖥️ 服務器端診斷 (用戶狀態, RBAC權限, 環境變數)
3. 🧪 API請求測試 (模擬實際請求)
4. 📋 審計日誌檢查 (權限拒絕記錄)

### 📝 使用方法

#### 方法1: 瀏覽器Console診斷 (推薦優先使用)

```bash
# 步驟1: 運行診斷腳本
node scripts/diagnose-auth-issues.js

# 步驟2: 複製輸出的瀏覽器Console代碼
# (腳本會自動輸出一段完整的診斷代碼)

# 步驟3: 在瀏覽器開發者工具Console中執行
# - 打開Chrome DevTools (F12)
# - 切換到Console標籤
# - 貼上並執行代碼
```

**診斷內容**:
```
✅ 檢查localStorage (auth-token, cached-user)
✅ 檢查Cookies (所有cookie)
✅ 解析JWT Token (userId, email, role, exp, iat)
✅ 檢查Token是否過期
✅ 模擬API請求測試 (GET /api/knowledge-base)
✅ 提供修復建議
```

#### 方法2: 服務器端診斷

```bash
# 診斷特定用戶
node scripts/diagnose-auth-issues.js rep@test.com

# 或使用測試用戶email
node scripts/diagnose-auth-issues.js [your-email]
```

**診斷內容**:
```
✅ 檢查用戶是否存在
✅ 檢查用戶角色和狀態 (is_active)
✅ 檢查RBAC權限配置 (KNOWLEDGE_BASE權限)
✅ 檢查環境變數 (JWT_SECRET)
✅ 測試Token生成
✅ 查詢審計日誌 (最近5條PERMISSION_DENY)
```

---

## 🔍 診斷結果判讀

### 情況1: Token不存在或為null

**症狀**:
```
localStorage: {
  'auth-token': '❌ 不存在',
  'cached-user': '❌ 不存在'
}
```

**原因**: 登入後token未正確存儲
**解決方案**:
1. 檢查登入API響應格式
2. 確認API返回`accessToken`或`token`字段
3. 重新登入並觀察Network標籤

### 情況2: Token已過期

**症狀**:
```
- Token狀態: ❌ 已過期
- 過期時間 (exp): 2025-10-01 10:00:00
```

**原因**: JWT token有效期已過 (預設7天)
**解決方案**:
```javascript
// 在瀏覽器Console執行
localStorage.clear();
window.location.href = '/login';
```

### 情況3: 權限不足

**症狀**:
```
- 錯誤: Forbidden
- 訊息: 您沒有執行此操作的權限
- 錯誤碼: PERMISSION_DENIED
```

**原因**: 用戶角色沒有CREATE權限
**解決方案**:
```sql
-- 檢查用戶角色
SELECT id, email, role, is_active FROM "User"
WHERE email = 'rep@test.com';

-- RBAC權限矩陣參考:
-- SALES_REP: LIST, CREATE, READ, UPDATE (沒有DELETE)
-- SALES_MANAGER: LIST, CREATE, READ, UPDATE, DELETE
-- ADMIN: 所有權限
```

### 情況4: Token格式錯誤

**症狀**:
```
❌ Token格式錯誤：不是標準的JWT格式
```

**原因**: Token不是合法的JWT (應該有3個點分隔的部分)
**解決方案**: 清除localStorage並重新登入

---

## 🎯 下一步行動計劃

### 階段1: 用戶運行診斷工具 ⏳ (需要用戶執行)

1. **瀏覽器端診斷**:
   ```bash
   node scripts/diagnose-auth-issues.js
   # 複製輸出代碼到瀏覽器Console執行
   ```

2. **服務器端診斷**:
   ```bash
   node scripts/diagnose-auth-issues.js rep@test.com
   ```

3. **收集診斷結果**:
   - 截圖或複製瀏覽器Console輸出
   - 複製服務器端診斷輸出
   - 記錄任何錯誤訊息

### 階段2: 根據診斷結果修復 ⏸️ (等待診斷結果)

**如果是Token問題**:
- 檢查登入API返回格式
- 修復token存儲邏輯
- 添加token過期檢測

**如果是權限問題**:
- 檢查用戶角色配置
- 更新RBAC權限矩陣
- 或升級用戶角色

**如果是環境配置問題**:
- 檢查`.env`文件中的JWT_SECRET
- 確保環境變數正確載入

### 階段3: 修復驗證 ⏸️ (等待階段2完成)

1. 清除瀏覽器緩存
2. 重新登入
3. 再次執行測試用例
4. 更新UAT測試進度追蹤器

---

## 📊 診斷工具技術細節

### 瀏覽器端診斷功能

**Token解析邏輯**:
```javascript
// JWT格式: header.payload.signature
const parts = authToken.split('.');
if (parts.length === 3) {
  const payload = JSON.parse(atob(parts[1]));

  // 檢查過期狀態
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > payload.exp;
  const hoursLeft = ((payload.exp - now) / 3600).toFixed(1);
}
```

**API測試請求**:
```javascript
fetch('/api/knowledge-base?page=1&limit=1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
})
```

### 服務器端診斷功能

**用戶狀態檢查**:
```sql
SELECT id, email, role, is_active, last_login
FROM "User"
WHERE email = $1;
```

**RBAC權限配置**:
```javascript
const rbacPermissions = {
  ADMIN: {
    KNOWLEDGE_BASE: ['LIST', 'CREATE', 'READ', 'UPDATE', 'DELETE']
  },
  SALES_MANAGER: {
    KNOWLEDGE_BASE: ['LIST', 'CREATE', 'READ', 'UPDATE', 'DELETE']
  },
  SALES_REP: {
    KNOWLEDGE_BASE: ['LIST', 'CREATE', 'READ', 'UPDATE']
  },
  ANALYST: {
    KNOWLEDGE_BASE: ['LIST', 'READ']
  },
  VIEWER: {
    KNOWLEDGE_BASE: ['LIST', 'READ']
  }
};
```

**審計日誌查詢**:
```sql
SELECT * FROM "AuditLog"
WHERE userId = $1
  AND action = 'PERMISSION_DENY'
ORDER BY timestamp DESC
LIMIT 5;
```

---

## 🔐 認證流程完整架構

### 1. 登入流程

```
[用戶]
  → [前端: /login頁面]
  → [POST /api/auth/login]
  → [後端: authenticateUser()]
  → [驗證密碼]
  → [生成JWT Token]
  → [返回: {accessToken, user}]
  → [前端: 存儲到localStorage]
  → [設置用戶狀態]
  → [跳轉到Dashboard]
```

### 2. API請求流程

```
[前端組件]
  → [fetch('/api/knowledge-base', {Authorization: Bearer ${token}})]
  → [後端: requirePermission中間件]
  → [1. extractToken() - 提取token]
  → [2. verifyToken() - 驗證token]
  → [3. 檢查用戶角色]
  → [4. RBACService.hasPermission() - 檢查權限]
  → [5. FineGrainedPermissionService - 細粒度權限]
  → [6. 記錄審計日誌]
  → [授權成功 OR 返回401/403]
```

### 3. Token驗證邏輯

```typescript
// 1. 提取Token (優先級: Header > Cookie)
Authorization: Bearer <token>
OR
Cookie: auth-token=<token>

// 2. JWT驗證 (lib/auth-server.ts)
jwt.verify(token, JWT_SECRET, {
  issuer: 'ai-sales-platform',
  audience: 'ai-sales-users'
})

// 3. 返回Payload
{
  userId: number,
  email: string,
  role: string,
  iat: number,  // 簽發時間
  exp: number   // 過期時間
}
```

---

## 🐛 已知問題和邊緣情況

### 問題1: API字段名不一致

**描述**: 登入API可能返回`accessToken`或`token`
**位置**: `hooks/use-auth.ts:304`
**處理**:
```typescript
const token = result.data.accessToken || result.data.token
```

### 問題2: Token為null時的處理

**描述**: 如果localStorage中沒有token,會傳遞`Bearer null`
**位置**: `components/knowledge/knowledge-create-form.tsx:140`
**潛在問題**: 後端可能收到字符串`"null"`而不是真正的null
**建議修復**:
```typescript
const authToken = localStorage.getItem('auth-token');
headers: authToken ? {
  'Authorization': `Bearer ${authToken}`,
} : {}
```

### 問題3: 錯誤訊息混淆

**描述**: 用戶看到"表單驗證錯誤"可能誤導為前端驗證問題
**位置**: `components/knowledge/knowledge-create-form.tsx:163`
**建議改進**: 區分前端驗證錯誤和後端API錯誤

---

## 📚 相關文件參考

| 文件 | 用途 | 關鍵內容 |
|------|------|----------|
| `scripts/diagnose-auth-issues.js` | 診斷工具 | 瀏覽器端和服務器端診斷 |
| `lib/security/permission-middleware.ts` | 權限中間件 | Token提取和RBAC檢查 |
| `lib/auth-server.ts` | JWT管理 | Token生成和驗證 |
| `hooks/use-auth.ts` | 認證Hook | 登入登出和Token存儲 |
| `components/knowledge/knowledge-create-form.tsx` | 前端表單 | API請求和錯誤處理 |
| `docs/UAT-TEST-ISSUES-ANALYSIS.md` | 問題分析 | 完整問題列表和分析 |

---

## ✅ 診斷階段完成清單

- [x] 分析JWT Token傳遞機制
- [x] 分析後端認證中間件邏輯
- [x] 分析前端認證Hook流程
- [x] 創建診斷工具腳本 (`scripts/diagnose-auth-issues.js`)
- [x] 更新問題分析文檔 (添加診斷工具使用說明)
- [x] 創建修復摘要文檔 (本文檔)
- [ ] ⏸️ 等待用戶運行診斷工具
- [ ] ⏸️ 根據診斷結果實施修復
- [ ] ⏸️ 修復驗證和測試

---

**⏳ 當前狀態**: 診斷階段完成,等待用戶運行診斷工具並提供結果

**🎯 下一步**: 請用戶執行以下命令:
```bash
# 1. 瀏覽器端診斷
node scripts/diagnose-auth-issues.js
# (將輸出的代碼複製到瀏覽器Console執行)

# 2. 服務器端診斷
node scripts/diagnose-auth-issues.js rep@test.com

# 3. 提供診斷結果截圖或文本
```
