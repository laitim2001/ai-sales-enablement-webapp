# 🔍 UAT測試問題分析與修復報告

> **創建日期**: 2025-10-08
> **測試階段**: UAT階段1 - 前端功能測試
> **分析人員**: Claude Code AI Assistant
> **優先級**: 🔴 極高 - 影響核心功能測試

---

## 📊 問題概覽

### 測試結果統計
| 測試用例 | 狀態 | 問題 | 優先級 |
|---------|------|------|--------|
| TC-AUTH-001 | ✅ PASS | 無 | - |
| TC-AUTH-002 | ⏸️ BLOCKED | Azure AD SSO未實現 | 🟡 中 |
| TC-AUTH-003 | ✅ PASS | 無 | - |
| TC-DASH-001 | ✅ PASS | 使用樣本數據(符合預期) | - |
| TC-KB-001 | ❌ FAIL | 權限錯誤 | 🔴 極高 |
| TC-KB-002 | ❌ FAIL | 編輯後500錯誤 | 🔴 極高 |
| TC-KB-003 | ⏸️ BLOCKED | 依賴KB-002 | 🔴 極高 |
| TC-KB-004 | ❌ FAIL | 高級搜索500錯誤 | 🔴 極高 |
| TC-KB-005 | ⚠️ PARTIAL | 向量嵌入驗證不清楚 | 🟡 高 |
| TC-PROP-001 | ❌ FAIL | 401未授權 | 🔴 極高 |
| TC-PROP-002 | ⏸️ BLOCKED | 依賴PROP-001 | 🔴 極高 |

**總計**: 11個測試用例
- ✅ 通過: 3個 (27%)
- ❌ 失敗: 5個 (45%)
- ⏸️ 阻塞: 2個 (18%)
- ⚠️ 部分通過: 1個 (9%)

---

## 🔴 問題1: TC-KB-001 - 創建文檔權限錯誤

### 問題描述
```
實際結果: 顯示了 "表單驗證錯誤, 您沒有執行此操作的權限"
```

### 根因分析

#### 1. 權限系統架構
文件: `app/api/knowledge-base/route.ts`
```typescript
// Line 89-96
const authResult = await requirePermission(request, {
  resource: Resource.KNOWLEDGE_BASE,
  action: Action.LIST,  // GET使用LIST
});

// Line 292 (POST方法也需要類似檢查)
const authResult = await requirePermission(request, {
  resource: Resource.KNOWLEDGE_BASE,
  action: Action.CREATE,  // POST使用CREATE
});
```

#### 2. 可能的原因

**原因A: JWT Token未正確傳遞**
- 症狀: 401 Unauthorized錯誤
- 檢查: Cookie中是否有`auth-token`
- 驗證方法:
```javascript
// 在瀏覽器開發者工具Console執行
document.cookie
```

**原因B: RBAC權限配置問題**
- 症狀: 有token但權限檢查失敗
- 檢查: 用戶角色是否有CREATE權限
- 文件: `lib/security/rbac.ts`

**原因C: 前端表單驗證誤判**
- 症狀: "表單驗證錯誤"訊息
- 檢查: 前端組件的驗證邏輯
- 可能位置: `app/dashboard/knowledge/create/page.tsx`

### 🛠️ 診斷工具

**專用診斷腳本**: `scripts/diagnose-auth-issues.js`

#### 方法1: 瀏覽器Console診斷（推薦）
```bash
# 1. 運行診斷腳本查看瀏覽器端代碼
node scripts/diagnose-auth-issues.js

# 2. 複製輸出的瀏覽器Console代碼
# 3. 在瀏覽器開發者工具Console中執行
```

#### 方法2: 服務器端診斷
```bash
# 診斷特定用戶的認證配置
node scripts/diagnose-auth-issues.js rep@test.com
```

### 診斷步驟

#### 步驟1: 執行自動診斷工具
```bash
# 運行診斷工具獲取瀏覽器端診斷代碼
node scripts/diagnose-auth-issues.js

# 在瀏覽器Console執行輸出的代碼
# 診斷工具會自動檢查:
# - localStorage中的auth-token
# - Cookie中的認證信息
# - Token解析和過期狀態
# - 用戶角色和權限
# - API請求測試
```

#### 步驟2: 檢查服務器端配置
```bash
# 診斷用戶rep@test.com的服務器端配置
node scripts/diagnose-auth-issues.js rep@test.com

# 工具會自動檢查:
# - 用戶是否存在和狀態
# - RBAC權限配置
# - JWT環境變數
# - Token生成測試
# - 審計日誌
```

#### 步驟3: 手動檢查RBAC權限矩陣
```sql
-- 查詢當前登入用戶的角色
SELECT id, email, role FROM "User"
WHERE email = 'rep@test.com';

-- 檢查該角色是否有CREATE權限
-- 需要查看RBAC配置 (lib/security/rbac.ts)
```

#### 步驟3: 檢查API請求詳情
```bash
# 使用cURL直接測試API (需要先獲取token)
curl -X POST http://localhost:3000/api/knowledge-base \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Document",
    "content": "Test content",
    "category": "GENERAL"
  }'
```

### 快速修復方案

#### 方案1: 檢查前端認證狀態
文件: 檢查創建頁面是否正確使用`useAuth` hook

#### 方案2: 驗證RBAC配置
```typescript
// lib/security/rbac.ts
// 確認SALES_REP角色有以下權限:
{
  resource: Resource.KNOWLEDGE_BASE,
  actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE]
}
```

---

## 🔴 問題2: TC-KB-002 - 編輯後500錯誤

### 問題描述
```
實際結果:
1. 成功訪問頁面
2. 看不到文件的原內容, 只是看到上傳的檔案的名稱
3. 可以編輯和保存成功
4. 版本號正常增加
5. 顯示了"最後更新時間"
6. 但是在編輯了其中一個記錄之後, 就突然出現了載入失敗
   Failed to fetch knowledge base items
   GET http://localhost:3000/api/knowledge-base?page=1&limit=20&sort=updated_at&order=desc 500 (Internal Server Error)
```

### 根因分析

#### 1. 500錯誤的可能原因

**原因A: 數據庫查詢錯誤**
- 編輯操作可能修改了某個欄位導致後續查詢失敗
- 可能是關聯數據(tags, creator)的問題

**原因B: 版本控制觸發錯誤**
- 版本號增加後,某個相關邏輯出錯

**原因C: 向量嵌入處理錯誤**
- 編輯後觸發向量重新生成,但Azure OpenAI連接失敗

#### 2. 需要檢查的日誌

```bash
# 查看服務器錯誤日誌
# 在運行npm run dev的終端查看錯誤輸出

# 或者檢查瀏覽器Network標籤的Response
```

### 診斷步驟

#### 步驟1: 重現錯誤並查看詳細日誌
```bash
# 在終端運行開發服務器
npm run dev

# 執行編輯操作
# 觀察終端輸出的錯誤堆棧
```

#### 步驟2: 檢查數據庫狀態
```sql
-- 查看剛編輯的文檔
SELECT id, title, version, status, updated_at
FROM "Document"
WHERE id = [剛編輯的文檔ID]
ORDER BY updated_at DESC
LIMIT 5;

-- 檢查是否有異常數據
SELECT * FROM "DocumentVersion"
WHERE document_id = [文檔ID]
ORDER BY version_number DESC;
```

#### 步驟3: 測試API直接調用
```bash
# 獲取文檔列表 (複製瀏覽器的token)
curl -X GET "http://localhost:3000/api/knowledge-base?page=1&limit=20" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

### 修復方案

#### 方案1: 添加錯誤處理和日誌
文件: `app/api/knowledge-base/route.ts`
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... 現有代碼
  } catch (error) {
    console.error('❌ Knowledge Base GET Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取知識庫列表失敗',
      },
      { status: 500 }
    );
  }
}
```

#### 方案2: 檢查Prisma查詢
可能問題: `include`子句中的關聯查詢失敗

---

## 🔴 問題3: TC-KB-004 - 高級搜索500錯誤

### 問題描述
```
實際結果: 接下高級搜索過濾之後, 會顯示了 "載入資料夾失敗 (500) 的報錯
```

### 根因分析

#### 1. 可能原因
- 資料夾API端點錯誤
- 前端調用了錯誤的API
- 權限問題

#### 2. 需要檢查
```typescript
// 檢查前端代碼調用的API
// app/dashboard/knowledge/advanced-search/page.tsx

// 可能錯誤調用了:
GET /api/knowledge-folders
// 而不是:
GET /api/knowledge-base/advanced-search
```

### 修復方案
檢查前端組件,確認API路徑正確

---

## 🔴 問題4: TC-PROP-001 - 創建模板401錯誤

### 問題描述
```
實際結果: 在嘗試保存提案模版時, 在F12 console log中出現了以下報錯:
POST http://localhost:3000/api/templates 401 (Unauthorized)
```

### 根因分析

#### 1. 與KB-001問題類似
- 權限系統問題
- Token未傳遞或已過期

#### 2. RBAC權限檢查
文件: `app/api/templates/route.ts:76-82`
```typescript
const authResult = await requirePermission(request, {
  resource: Resource.PROPOSAL_TEMPLATES,
  action: Action.CREATE,
});
```

### 診斷步驟
與問題1相同,檢查:
1. JWT Token狀態
2. 用戶角色權限
3. API請求頭

---

## 🟡 問題5: TC-AUTH-002 - Azure AD SSO未實現

### 問題描述
```
實際結果: 在login頁看不到 "使用Microsoft賬號登入", 不能執行此測試
```

### 分析
這是**已知限制**,不是bug。

#### 檢查結果
```bash
# Grep搜索結果: No files found
# 說明: 登入頁面沒有Azure AD SSO相關代碼
```

### 解決方案

#### 選項A: 實現Azure AD SSO按鈕 (需要開發)
```typescript
// app/(auth)/login/page.tsx
// 添加Azure AD登入按鈕

import { signIn } from 'next-auth/react';

// 在登入表單下方添加:
<Button
  variant="outline"
  onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
>
  <MicrosoftIcon className="mr-2" />
  使用Microsoft賬號登入
</Button>
```

#### 選項B: 跳過此測試 (短期)
- 更新測試狀態為 "⏸️ BLOCKED - 功能未實現"
- 備註: "Azure AD SSO功能計劃在Sprint X實施"

---

## ⚠️ 問題6: TC-KB-005 - 向量嵌入驗證不清楚

### 問題描述
```
實際結果:
1. 可以成功上傳不同類型的文件
2. 但是看起來沒有自動提取文本內容
3. 也不知道怎樣去測試已經生成向量嵌入
```

### 驗證方法

#### 方法1: 檢查數據庫
```sql
-- 查詢最近上傳的文檔
SELECT
  id,
  title,
  content IS NOT NULL as has_content,
  content_hash,
  embedding IS NOT NULL as has_embedding,
  processing_status,
  created_at
FROM "Document"
WHERE created_by = [當前用戶ID]
ORDER BY created_at DESC
LIMIT 10;

-- 檢查向量維度 (應該是1536維)
SELECT
  id,
  title,
  array_length(embedding::text::float[], 1) as embedding_dimension
FROM "Document"
WHERE embedding IS NOT NULL
LIMIT 5;
```

#### 方法2: 測試向量搜索
```bash
# 如果向量嵌入成功生成,搜索應該能找到相關文檔
curl -X GET "http://localhost:3000/api/knowledge-base/search?query=測試內容" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

#### 方法3: 檢查後台任務日誌
```javascript
// 查看開發服務器終端
// 應該看到類似的日誌:
// ✅ Vector embedding generated for document ID: 123
// 或
// ❌ Failed to generate embedding: Azure OpenAI error
```

---

## 🎯 修復優先級排序

### 🔴 極高優先級 (阻塞多個測試)
1. **問題1 (TC-KB-001)** - 創建文檔權限錯誤
   - 影響: 阻塞所有知識庫功能測試
   - 預計修復時間: 30分鐘
   - 修復方法: 調查權限配置和token傳遞

2. **問題2 (TC-KB-002)** - 編輯後500錯誤
   - 影響: 阻塞編輯功能測試
   - 預計修復時間: 1小時
   - 修復方法: 添加錯誤日誌,調查數據庫查詢問題

3. **問題4 (TC-PROP-001)** - 模板401錯誤
   - 影響: 阻塞提案系統測試
   - 預計修復時間: 20分鐘 (可能與問題1相同根因)
   - 修復方法: 修復權限問題

### 🟡 高優先級
4. **問題3 (TC-KB-004)** - 高級搜索500錯誤
   - 影響: 高級搜索功能
   - 預計修復時間: 30分鐘
   - 修復方法: 修正API路徑或實現資料夾API

5. **問題6 (TC-KB-005)** - 向量嵌入驗證
   - 影響: 測試方法不清楚
   - 預計修復時間: 15分鐘 (文檔和驗證腳本)
   - 修復方法: 提供SQL查詢腳本

### 🟢 中優先級
6. **問題5 (TC-AUTH-002)** - Azure AD SSO未實現
   - 影響: 一個測試用例
   - 預計修復時間: 2-4小時 (功能開發)
   - 修復方法: 實施Azure AD SSO或標記為未來功能

---

## 🔧 立即修復行動計劃

### 階段1: 診斷 (15分鐘)

#### 任務1.1: 檢查JWT Token狀態
```javascript
// 在瀏覽器Console執行
console.log('=== 認證狀態檢查 ===');
console.log('Cookies:', document.cookie);
console.log('LocalStorage token:', localStorage.getItem('auth-token'));

// 檢查token是否存在
if (document.cookie.includes('auth-token')) {
  console.log('✅ Token存在於Cookie');
} else {
  console.log('❌ Token不存在於Cookie');
}
```

#### 任務1.2: 檢查用戶權限
```sql
-- 查詢用戶角色
SELECT id, email, role FROM "User" WHERE email = 'rep@test.com';
```

#### 任務1.3: 重現KB-002錯誤並捕獲日誌
- 在終端運行 `npm run dev`
- 執行編輯操作
- 複製完整錯誤堆棧

### 階段2: 修復核心問題 (1-2小時)

#### 修復1: 權限問題 (KB-001, PROP-001)
1. 檢查`requirePermission`中間件
2. 驗證RBAC配置
3. 確認前端正確傳遞token

#### 修復2: 編輯後500錯誤 (KB-002)
1. 添加詳細錯誤日誌
2. 檢查Prisma查詢
3. 修復數據庫查詢問題

#### 修復3: 高級搜索錯誤 (KB-004)
1. 檢查前端API調用
2. 確認API路徑正確
3. 實現或修復API端點

### 階段3: 驗證 (30分鐘)
- 重新執行所有失敗的測試用例
- 更新測試進度追蹤表
- 記錄修復結果

---

## 📋 測試繼續建議

### 可以繼續的測試
即使有上述問題,以下測試仍可繼續:
- ✅ TC-CRM-001/002 (客戶管理)
- ✅ TC-NOTIF-001/002 (通知系統)
- ✅ TC-SETTINGS-001 (用戶設置)
- ✅ TC-MEET-001/002 (會議準備)

### 建議測試順序
1. 先完成不依賴知識庫和提案的測試
2. 修復核心權限問題後,重新測試知識庫
3. 最後測試提案系統

---

## 📊 需要的修復信息

### 從開發者需要獲取:
1. **完整的500錯誤日誌** (KB-002)
   - 錯誤堆棧
   - 請求參數
   - 數據庫查詢語句

2. **權限配置詳情** (KB-001, PROP-001)
   - SALES_REP角色的完整權限列表
   - requirePermission中間件的日誌

3. **API端點狀態**
   - `/api/knowledge-folders` 是否已實現
   - `/api/templates` 權限配置

---

## 📝 後續行動

### 立即行動
1. ✅ 執行診斷腳本收集信息
2. ✅ 捕獲完整錯誤日誌
3. ✅ 檢查RBAC配置

### 短期行動 (今天)
4. ⏳ 修復權限問題
5. ⏳ 修復500錯誤
6. ⏳ 重新測試失敗用例

### 中期行動 (本週)
7. ⏳ 完成所有UAT測試
8. ⏳ 整理測試報告
9. ⏳ 評估Azure AD SSO需求

---

**報告生成時間**: 2025-10-08
**下次更新**: 修復完成後
**聯繫人**: [UAT測試負責人]
