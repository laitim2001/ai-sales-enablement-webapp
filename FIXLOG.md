# 🔧 AI 銷售賦能平台 - 修復日誌

> **目的**: 記錄所有重要問題的修復過程，防止重複犯錯，提供問題排查指南

---

## 📋 修復記錄索引

| 日期 | 問題類型 | 狀態 | 描述 |
|------|----------|------|------|
| 2025-09-24 | 🔑 認證/JWT | ✅ 已解決 | [FIX-001: JWT_SECRET客戶端訪問錯誤](#fix-001-jwt_secret客戶端訪問錯誤) |

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

**最後更新**: 2025-09-24
**下次建議檢查**: 當出現認證相關問題時參考FIX-001