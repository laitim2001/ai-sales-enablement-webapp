# 🔧 AI 銷售賦能平台 - 修復日誌

> **目的**: 記錄所有重要問題的修復過程，防止重複犯錯，提供問題排查指南

---

## 📋 修復記錄索引

| 日期 | 問題類型 | 狀態 | 描述 |
|------|----------|------|------|
| 2025-09-24 | 🔑 認證/JWT | ✅ 已解決 | [FIX-001: JWT_SECRET客戶端訪問錯誤](#fix-001-jwt_secret客戶端訪問錯誤) |
| 2025-09-24 | 🔑 認證/JWT | ✅ 已解決 | [FIX-002: JWT Payload userId類型不一致](#fix-002-jwt-payload-userid類型不一致) |
| 2025-09-24 | 🔑 認證/JWT | ✅ 已解決 | [FIX-003: authenticateUser函數userId類型錯誤](#fix-003-authenticateuser函數userid類型錯誤) |
| 2025-09-25 | 🌐 路由/導航 | ✅ 已解決 | [FIX-004: Dashboard路由結構和導航404錯誤](#fix-004-dashboard路由結構和導航404錯誤) |

---

## FIX-001: JWT_SECRET客戶端訪問錯誤

### 📅 **修復日期**: 2025-09-24
### 🎯 **問題級別**: 🔴 Critical
### ✅ **狀態**: 已解決

### 🚨 **問題現象**
1. **症狀**: 訪問登入頁面 (`http://localhost:3005/login`) 顯示空白頁面
2. **控制台錯誤**:
   ```
   react-dom.development.js:9126 Uncaught Error: JWT_SECRET environment variable is not set
   at eval (auth.ts:10:9)
   ```
3. **影響範圍**: 所有需要認證的頁面無法正常載入
4. **用戶體驗**: 無法進行登入、註冊等基本功能

### 🔍 **根本原因分析**
- **核心問題**: JWT_SECRET在客戶端代碼中被訪問
- **技術原理**: Next.js只允許以`NEXT_PUBLIC_`開頭的環境變數在客戶端使用
- **安全考量**: JWT_SECRET是敏感信息，不應暴露到客戶端
- **代碼位置**: `lib/auth.ts` 第6行 `const JWT_SECRET = process.env.JWT_SECRET!`

### 🛠️ **修復方案**

#### **第一步: 創建服務端專用認證模組**
```typescript
// 文件: lib/auth-server.ts (新建)
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { User } from '@prisma/client'

// 服務器端專用 - 包含 JWT_SECRET 的功能
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

// 所有需要JWT_SECRET的功能移到這裡
export function generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string { ... }
export function verifyToken(token: string): JWTPayload { ... }
export async function authenticateUser(email: string, password: string) { ... }
export async function createUser(data: { ... }) { ... }
// ... 其他服務端認證功能
```

#### **第二步: 修改客戶端認證模組**
```typescript
// 文件: lib/auth.ts (修改)
// 移除所有JWT_SECRET相關功能，只保留客戶端安全的功能

// 客戶端安全的認證工具 - 不包含 JWT_SECRET

/**
 * 密碼強度驗證
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} { ... }

/**
 * Email 格式驗證
 */
export function validateEmail(email: string): boolean { ... }
```

#### **第三步: 更新API路由**
```typescript
// 文件: app/api/auth/login/route.ts
// 從服務端模組導入認證功能
import { authenticateUser } from '@/lib/auth-server'  // 改為服務端模組
import { validateEmail } from '@/lib/auth'           // 客戶端驗證功能

// 文件: app/api/auth/register/route.ts
import { createUser } from '@/lib/auth-server'
import { validateEmail, validatePassword } from '@/lib/auth'

// 文件: app/api/auth/me/route.ts
import { verifyToken } from '@/lib/auth-server'
```

#### **第四步: 確認客戶端hooks正確使用API**
```typescript
// 文件: hooks/use-auth.ts (確認)
// 確保只通過API端點進行認證，不直接訪問auth.ts中的JWT功能
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', { ... })  // ✅ 正確：通過API
}
```

### 🔧 **必要的依賴安裝**
```bash
npm install @headlessui/react @radix-ui/react-dropdown-menu
```

### 📁 **受影響的文件清單**
- ✅ `lib/auth-server.ts` (新建)
- ✅ `lib/auth.ts` (大幅修改)
- ✅ `app/api/auth/login/route.ts` (import修改)
- ✅ `app/api/auth/register/route.ts` (import修改)
- ✅ `app/api/auth/me/route.ts` (import修改)
- ✅ `components/ui/dropdown-menu.tsx` (新建)
- ✅ `package.json` (新增依賴)

### ✅ **驗證步驟**
1. **編譯檢查**: 無JWT_SECRET錯誤 ✅
2. **登入頁面**: `http://localhost:3007/login` - HTTP 200 ✅
3. **註冊頁面**: `http://localhost:3007/register` - HTTP 200 ✅
4. **API功能**: 登入API正常回應(401為正確行為，因為用戶不存在) ✅
5. **註冊API**: 成功創建用戶到資料庫 ✅

### 📚 **學習要點**
1. **環境變數安全**: 敏感信息(如JWT_SECRET)只能在服務端使用
2. **Next.js規則**: 客戶端環境變數必須以`NEXT_PUBLIC_`開頭
3. **架構分離**: 客戶端和服務端認證功能應該分離
4. **API優先**: 客戶端應通過API端點進行認證，不直接訪問敏感函數

### 🚫 **避免重蹈覆轍**
- ❌ **不要**: 在客戶端組件中直接訪問敏感環境變數
- ❌ **不要**: 在客戶端代碼中進行JWT簽名/驗證操作
- ✅ **應該**: 將所有JWT操作封裝到服務端API路由中
- ✅ **應該**: 客戶端只負責UI邏輯和API調用

### 🔄 **如果問題再次出現**
1. 檢查是否有新的客戶端代碼訪問JWT_SECRET
2. 確認所有認證相關功能都通過API端點
3. 檢查是否有新的UI組件缺失依賴
4. 重啟開發服務器並清除`.next`快取

---

## 📖 **修復日誌使用指南**

### 🔍 **如何查找解決方案**
1. 先查看問題現象，找到類似的症狀
2. 查看根本原因分析，理解問題本質
3. 按照修復方案步驟執行
4. 使用驗證步驟確認問題解決

### 📝 **如何添加新的修復記錄**
1. 在索引表中添加新條目
2. 創建新的FIX-XXX章節
3. 按照模板填寫所有必要信息
4. 記錄學習要點和避免重蹈覆轍的建議

### 🏷️ **問題分類標籤**
- 🔑 認證/JWT: 用戶認證、JWT token、權限相關
- 🎨 UI/組件: 介面組件、樣式、布局問題
- 🔧 配置/環境: 環境變數、依賴、配置文件
- 📊 資料庫: 資料庫連接、查詢、模型問題
- 🌐 API/路由: API端點、路由、中間件問題
- ⚡ 性能: 性能優化、載入速度問題
- 🐛 邏輯錯誤: 業務邏輯、算法問題

---

## FIX-002: JWT Payload userId類型不一致

### 📅 **修復日期**: 2025-09-24
### 🎯 **問題級別**: 🟡 Medium
### ✅ **狀態**: 已解決

### 🐛 **問題描述**
- **症狀**: `/api/auth/me` 端點返回500錯誤
- **具體錯誤**: "Invalid value provided. Expected Int, provided String"
- **影響範圍**: 用戶認證狀態檢查失敗，導致身份驗證流程中斷

### 🔍 **根本原因分析**
JWTPayload介面定義userId為string，但實際數據庫期望number類型，造成類型不匹配。

### 🔧 **修復步驟**
1. **修正JWTPayload介面**: 將userId從string改為number
2. **移除不必要的parseInt**: 直接使用payload.userId（現在是number）
3. **驗證其他API路由**: 確認沒有同樣問題

### 📊 **修復文件**
- `lib/auth-server.ts`: 修正JWTPayload介面
- `app/api/auth/me/route.ts`: 移除parseInt調用

### ✅ **結果驗證**
```bash
GET /api/auth/me 200 in 1055ms  ✅ 成功
GET /api/auth/me 200 in 42ms    ✅ 成功
```

### 📚 **經驗教訓**
1. **型別一致性**: JWT payload數據類型必須與數據庫schema保持一致
2. **介面設計**: TypeScript介面定義要準確反映實際的數據類型

---

## FIX-003: authenticateUser函數userId類型錯誤

### 📅 **修復日期**: 2025-09-24
### 🎯 **問題級別**: 🟡 Medium
### ✅ **狀態**: 已解決

### 🐛 **問題描述**
- **症狀**: `/api/auth/me` API持續返回Prisma類型錯誤："Invalid value provided. Expected Int, provided String"
- **根源**: authenticateUser函數中generateToken調用時將`user.id`轉換為字符串
- **影響**: Dashboard頁面重新整理後跳轉到登入頁

### 🔍 **根本原因分析**
在`lib/auth-server.ts`的`authenticateUser`函數中，第143行錯誤地使用了：
```typescript
const token = generateToken({
  id: user.id.toString(),  // ❌ 錯誤：將數字轉為字符串
  email: user.email,
  role: user.role
})
```

這導致JWT payload中的userId變為字符串，但JWTPayload interface期望userId為數字類型。

### 🔧 **修復步驟**
```typescript
// 修復前
const token = generateToken({
  id: user.id.toString(),  // ❌ 轉為字符串
  email: user.email,
  role: user.role
})

// 修復後
const token = generateToken({
  id: user.id,  // ✅ 保持數字類型
  email: user.email,
  role: user.role
})
```

### 📊 **修復文件**
- `lib/auth-server.ts`: 移除第143行的`.toString()`調用

### 🔄 **問題鏈路**
1. `authenticateUser` → 生成token時userId為字符串
2. JWT payload → userId字符串存儲在token中
3. `verifyToken` → 解析出字符串userId
4. `/api/auth/me` → 使用字符串userId查詢資料庫
5. Prisma → 拋出類型錯誤，期望Int但收到String

### ✅ **驗證方法**
```bash
# 測試登入和獲取用戶資料
curl -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 使用返回的token測試/api/auth/me
curl -X GET http://localhost:3007/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 📚 **經驗教訓**
1. **類型一致性**: JWT payload中的數據類型必須與database schema匹配
2. **Interface設計**: TypeScript interface不僅是型別檢查，更是實際運行時的契約
3. **端到端測試**: 驗證完整的認證流程，不只是單個API端點

### 🚫 **避免重蹈覆轍**
- ❌ **不要**: 隨意轉換數據類型，特別是在跨模組呼叫時
- ✅ **應該**: 確保數據類型在整個認證流程中保持一致
- ✅ **應該**: 定期測試完整的使用者認證流程

---

---

## FIX-004: Dashboard路由結構和導航404錯誤

### 📅 **修復日期**: 2025-09-25
### 🎯 **問題級別**: 🔴 Critical
### ✅ **狀態**: 已解決

### 🚨 **問題現象**
1. **Dashboard重新整理跳轉問題**: 在dashboard頁面重新整理後，會自動跳轉回login頁面
2. **導航404錯誤**: 點擊dashboard中的功能連結，如knowledge、search、tasks等，全部返回"404 | This page could not be found"
3. **影響範圍**: 所有dashboard子頁面無法正常訪問，嚴重影響用戶體驗

### 🔍 **根本原因分析**

#### **核心問題**: Next.js 14 App Router 路由群組理解錯誤
- **路由群組特性**: `(dashboard)` 括號語法是Next.js的路由群組(Route Groups)，**僅用於組織代碼，不會添加到URL路徑中**
- **錯誤理解**: 以為 `app/(dashboard)/knowledge/page.tsx` 會對應到 `/dashboard/knowledge` 路徑
- **實際情況**: `app/(dashboard)/knowledge/page.tsx` 實際對應到 `/knowledge` 路徑
- **導致問題**: 用戶點擊 `/dashboard/knowledge` 時找不到對應的頁面文件

#### **文件結構問題分析**
```
❌ 錯誤結構 (無法訪問/dashboard/knowledge):
app/
├── (dashboard)/           # 路由群組，不影響URL
│   ├── knowledge/page.tsx # 實際路徑: /knowledge
│   ├── search/page.tsx    # 實際路徑: /search
│   └── layout.tsx         # layout for root level
└── dashboard/
    └── page.tsx           # 實際路徑: /dashboard

✅ 正確結構 (可以訪問/dashboard/knowledge):
app/
└── dashboard/             # URL路徑: /dashboard
    ├── knowledge/page.tsx # URL路徑: /dashboard/knowledge
    ├── search/page.tsx    # URL路徑: /dashboard/search
    ├── layout.tsx         # layout for /dashboard/*
    └── page.tsx           # URL路徑: /dashboard
```

### 🛠️ **修復方案**

#### **第一步: 重新組織文件結構**
```bash
# 將所有dashboard相關頁面從(dashboard)移動到dashboard/
mv app/(dashboard)/knowledge/ app/dashboard/
mv app/(dashboard)/search/ app/dashboard/
mv app/(dashboard)/tasks/ app/dashboard/
mv app/(dashboard)/settings/ app/dashboard/
mv app/(dashboard)/layout.tsx app/dashboard/
```

#### **第二步: 清理舊的路由群組目錄**
```bash
# 刪除空的(dashboard)目錄避免路由衝突
rmdir app/(dashboard)/
```

#### **第三步: 驗證文件結構**
最終正確的文件結構:
```
app/dashboard/
├── layout.tsx              # Dashboard layout
├── page.tsx                # Dashboard 主頁
├── knowledge/
│   └── page.tsx            # /dashboard/knowledge
├── search/
│   └── page.tsx            # /dashboard/search
├── tasks/
│   └── page.tsx            # /dashboard/tasks
└── settings/
    └── page.tsx            # /dashboard/settings
```

### 🔧 **技術細節說明**

#### **Next.js App Router 路由群組規則**
1. **路由群組語法**: `(folderName)` 括號包圍的資料夾名稱
2. **作用**: 僅用於程式碼組織和共享layout，**不會出現在URL中**
3. **URL映射**: `app/(dashboard)/knowledge/page.tsx` → URL: `/knowledge`
4. **正確用法**: 當你需要在同一層級組織多個功能模組，但不想在URL中體現群組名稱時使用

#### **錯誤診斷過程**
1. **初始假設**: 認為是JWT認證問題導致跳轉
2. **發現問題**: 修復JWT後，404問題仍然存在
3. **深入分析**: 檢查Next.js路由映射規則
4. **根本發現**: 路由群組不會在URL中顯示，這是Next.js的核心特性

### 📊 **修復文件清單**
- ✅ 移動 `app/(dashboard)/layout.tsx` → `app/dashboard/layout.tsx`
- ✅ 移動 `app/(dashboard)/knowledge/page.tsx` → `app/dashboard/knowledge/page.tsx`
- ✅ 移動 `app/(dashboard)/search/page.tsx` → `app/dashboard/search/page.tsx`
- ✅ 移動 `app/(dashboard)/tasks/page.tsx` → `app/dashboard/tasks/page.tsx`
- ✅ 移動 `app/(dashboard)/settings/page.tsx` → `app/dashboard/settings/page.tsx`
- ✅ 刪除空的 `app/(dashboard)/` 目錄

### ✅ **驗證步驟**
```bash
# 測試所有dashboard路由
curl -I http://localhost:3007/dashboard          # ✅ 200 OK
curl -I http://localhost:3007/dashboard/knowledge # ✅ 200 OK
curl -I http://localhost:3007/dashboard/search   # ✅ 200 OK
curl -I http://localhost:3007/dashboard/tasks    # ✅ 200 OK
curl -I http://localhost:3007/dashboard/settings # ✅ 200 OK
```

**用戶體驗測試**:
1. ✅ Dashboard頁面重新整理不會跳轉到login頁面
2. ✅ 所有dashboard導航連結正常工作
3. ✅ JWT認證狀態正確維持

### 📚 **學習要點**

#### **Next.js App Router 路由系統核心概念**
1. **路由群組 (Route Groups)**: `(name)` 僅用於組織，不影響URL
2. **URL映射**: 資料夾名稱直接對應URL路徑
3. **嵌套路由**: `app/dashboard/knowledge/page.tsx` = `/dashboard/knowledge`
4. **Layout繼承**: 子路由自動繼承父級layout

#### **路由群組的正確使用場景**
```
✅ 正確使用 - 同層級的功能分組:
app/
├── (marketing)/
│   ├── about/page.tsx      # URL: /about
│   └── contact/page.tsx    # URL: /contact
└── (shop)/
    ├── products/page.tsx   # URL: /products
    └── cart/page.tsx       # URL: /cart

❌ 錯誤使用 - 期望群組名出現在URL中:
app/
└── (dashboard)/            # 以為會產生 /dashboard/xxx
    └── settings/page.tsx   # 實際是 /settings，不是 /dashboard/settings
```

### 🚫 **避免重蹈覆轍**
- ❌ **不要**: 假設路由群組會出現在URL中
- ❌ **不要**: 將需要URL路徑的功能放在路由群組中
- ✅ **應該**: 需要URL路徑時直接使用資料夾名稱
- ✅ **應該**: 路由群組僅用於程式碼組織，不用於URL結構
- ✅ **應該**: 先理解Next.js路由映射規則再設計檔案結構

### 🔄 **如果問題再次出現**
1. 檢查檔案結構是否正確對應期望的URL路徑
2. 確認沒有使用路由群組作為URL路徑的一部分
3. 使用 `npm run build` 檢查路由編譯結果
4. 清理 `.next` 快取並重新啟動開發服務器

### 🌐 **相關資源**
- [Next.js App Router 官方文檔](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js Route Groups 說明](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

**最後更新**: 2025-09-25
**下次建議檢查**: 當出現路由導航404問題時，優先檢查檔案結構是否正確對應URL路徑，特別注意路由群組的使用