# 工作流程測試指南

> **作者**: Claude Code
> **日期**: 2025-10-01
> **版本**: 1.0

## 📋 目錄

1. [測試環境設置](#測試環境設置)
2. [運行測試](#運行測試)
3. [測試結構](#測試結構)
4. [故障排除](#故障排除)

## 🔧 測試環境設置

### 前置條件

1. **PostgreSQL 數據庫**:
   - 確保 PostgreSQL 服務正在運行
   - 默認用戶: `postgres`
   - 默認端口: `5432`

2. **Node.js 環境**:
   - Node.js >= 18.0.0
   - npm >= 8.0.0

### 設置步驟

#### 1. 安裝依賴

```bash
npm install
```

#### 2. 配置測試環境變數

測試會自動使用 `.env.test` 文件，默認配置：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_enablement_test"
JWT_SECRET="test-jwt-secret-for-testing-purposes-only"
```

如需自定義，請編輯 `.env.test` 文件。

#### 3. 設置測試數據庫

首次運行測試前，需要設置測試數據庫：

```bash
npm run test:workflow:setup
```

這個腳本會：
- ✅ 檢查 PostgreSQL 連接
- ✅ 創建 `sales_enablement_test` 數據庫
- ✅ 運行所有數據庫遷移
- ✅ 生成 Prisma Client

## 🚀 運行測試

### 所有工作流程測試

```bash
npm run test:workflow
```

### 監視模式（開發時使用）

```bash
npm run test:workflow:watch
```

### 測試覆蓋率報告

```bash
npm run test:workflow:coverage
```

覆蓋率報告位置：`coverage/workflow/`

### 運行特定測試文件

```bash
npx jest __tests__/workflow/engine.test.ts --config=jest.config.workflow.js
```

### 運行特定測試用例

```bash
npx jest __tests__/workflow/engine.test.ts -t "應該成功從 DRAFT 轉換到 PENDING_APPROVAL" --config=jest.config.workflow.js
```

## 📂 測試結構

### 測試文件組織

```
__tests__/
└── workflow/
    └── engine.test.ts         # 工作流程引擎測試 (400行)
        ├── 狀態轉換映射表測試
        ├── transitionState 測試
        ├── validateTransition 測試
        ├── getAvailableTransitions 測試
        ├── executeAutoTransitions 測試
        └── 審計追蹤測試
```

### 測試覆蓋範圍

| 模組 | 測試用例數 | 覆蓋功能 |
|------|-----------|---------|
| **WorkflowEngine** | ~15 | 狀態轉換、權限檢查、自動化 |
| **VersionControl** | 待實現 | 版本管理、差異計算、回滾 |
| **CommentSystem** | 待實現 | 評論、@mentions、狀態管理 |
| **ApprovalManager** | 待實現 | 審批流程、委派、多級審批 |

### 測試數據清理

每個測試套件都會：
- ✅ 在 `beforeAll` 中創建測試數據
- ✅ 在 `afterAll` 中清理所有測試數據
- ✅ 確保測試之間不會互相影響

## 🔍 測試配置

### Jest 配置文件

工作流程測試使用專用配置：`jest.config.workflow.js`

主要特點：
- **測試環境**: Node.js (不是 jsdom)
- **真實數據庫**: 使用真實 Prisma Client（不使用 mock）
- **超時時間**: 30 秒（支持數據庫操作）
- **覆蓋率目標**: 70%

### 環境變數配置

測試設置文件：`jest.setup.workflow.js`

- 自動加載 `.env.test`
- 提供默認測試環境變數
- 不 mock Prisma Client

## 🐛 故障排除

### 問題 1: PostgreSQL 連接失敗

**錯誤信息**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解決方法**:
1. 確認 PostgreSQL 服務正在運行
   ```bash
   # Windows
   services.msc → 查找 postgresql-x64-14

   # Mac
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. 檢查連接配置
   - 確認 `.env.test` 中的 DATABASE_URL 正確
   - 確認 PostgreSQL 監聽端口 5432

### 問題 2: 數據庫遷移失敗

**錯誤信息**:
```
Error: P1000: Authentication failed
```

**解決方法**:
1. 檢查 PostgreSQL 用戶密碼
   ```bash
   psql -U postgres -c "SELECT version();"
   ```

2. 如果密碼不是 `postgres`，更新 `.env.test`:
   ```env
   DATABASE_URL="postgresql://postgres:你的密碼@localhost:5432/sales_enablement_test"
   ```

3. 重新運行設置腳本
   ```bash
   npm run test:workflow:setup
   ```

### 問題 3: Prisma Client 未生成

**錯誤信息**:
```
Error: Cannot find module '@prisma/client'
```

**解決方法**:
```bash
npx prisma generate
```

### 問題 4: 測試超時

**錯誤信息**:
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**解決方法**:
1. 檢查數據庫連接速度
2. 測試配置已設置 30 秒超時
3. 如需調整，編輯 `jest.config.workflow.js`:
   ```javascript
   testTimeout: 60000, // 60 秒
   ```

### 問題 5: 測試數據清理問題

**症狀**: 測試失敗，提示數據已存在

**解決方法**:
1. 手動清理測試數據庫
   ```bash
   npm run test:workflow:setup
   ```

2. 或直接重置數據庫
   ```bash
   psql -U postgres -c "DROP DATABASE IF EXISTS sales_enablement_test;"
   psql -U postgres -c "CREATE DATABASE sales_enablement_test;"
   npx prisma db push
   ```

## 📊 測試最佳實踐

### 1. 測試隔離

每個測試都應該：
- ✅ 獨立運行（不依賴其他測試）
- ✅ 清理自己創建的數據
- ✅ 不修改共享狀態

### 2. 測試命名

使用描述性的測試名稱：

```typescript
// ✅ 好的命名
it('應該成功從 DRAFT 轉換到 PENDING_APPROVAL', async () => {
  // ...
});

// ❌ 不好的命名
it('test transition', async () => {
  // ...
});
```

### 3. 斷言清晰

使用明確的斷言：

```typescript
// ✅ 清晰的斷言
expect(result.success).toBe(true);
expect(result.currentState).toBe('PENDING_APPROVAL');

// ❌ 模糊的斷言
expect(result).toBeTruthy();
```

### 4. 測試數據

使用有意義的測試數據：

```typescript
// ✅ 描述性的測試數據
const testUser = {
  email: 'test@workflow.com',
  first_name: 'Test',
  last_name: 'User',
};

// ❌ 無意義的測試數據
const testUser = {
  email: 'a@b.com',
  first_name: 'A',
  last_name: 'B',
};
```

## 📈 持續改進

### 添加新測試

1. 在 `__tests__/workflow/` 目錄創建測試文件
2. 遵循現有測試結構
3. 確保測試隔離和清理
4. 運行測試驗證
5. 檢查覆蓋率

### 目標覆蓋率

當前目標（`jest.config.workflow.js`）：
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

建議提升至 80%+ 以確保代碼質量。

## 🔗 相關資源

- [Jest 官方文檔](https://jestjs.io/)
- [Prisma 測試指南](https://www.prisma.io/docs/guides/testing)
- [工作流程引擎設計文檔](./workflow-engine-design.md)
- [MVP Phase 2 實施清單](./mvp2-implementation-checklist.md)
