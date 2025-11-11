# 索引維護機制改進記錄

## 📅 2025-10-01 - 修復核心代碼文件未觸發索引更新的問題

### 🐛 發現的問題

在 API Gateway Stage 3 完成後，發現 `PROJECT-INDEX.md` 沒有自動提醒更新，導致新增的兩個中間件（`request-transformer.ts` 和 `response-cache.ts`）未被記錄。

### 🔍 根本原因分析

1. **Pre-commit Hook 檢查範圍不足**
   - 原始檢查模式：`grep -E '(README\.md|\.config\.|package\.json|schema\.prisma|docs/.*\.md|src/.*\.md)'`
   - **遺漏**：`lib/`, `components/`, `app/`, `__tests__/` 目錄下的核心代碼文件
   - 結果：新增的 `lib/middleware/*.ts` 文件不會觸發索引更新檢查

2. **`check-index-sync.js` 重要性判斷不完整**
   - `getFileImportance()` 方法只標記文檔和配置文件為高重要性
   - **遺漏**：核心代碼模組（lib/, components/, app/, __tests__/）未被識別為需要更新索引

### ✅ 實施的改進

#### 1. 擴展 Pre-commit Hook 檢查範圍

**文件**: `.git/hooks/pre-commit` (第 16 行)

**原始代碼**:
```bash
HIGH_IMPORTANCE_FILES=$(echo "$IMPORTANT_FILES" | grep -E '(README\.md|\.config\.|package\.json|schema\.prisma|docs/.*\.md|src/.*\.md)')
```

**改進後**:
```bash
HIGH_IMPORTANCE_FILES=$(echo "$IMPORTANT_FILES" | grep -E '(README\.md|\.config\.|package\.json|schema\.prisma|docs/.*\.md|src/.*\.md|lib/.*\.(ts|js)|components/.*\.(tsx|ts)|app/.*\.(ts|tsx)|__tests__/.*\.test\.(ts|js))')
```

**新增檢測**:
- ✅ `lib/` 目錄下所有 `.ts` 和 `.js` 文件
- ✅ `components/` 目錄下所有 `.tsx` 和 `.ts` 組件
- ✅ `app/` 目錄下所有 Next.js 14 路由和頁面
- ✅ `__tests__/` 目錄下所有測試文件

#### 2. 增強 `check-index-sync.js` 重要性判斷

**文件**: `scripts/check-index-sync.js` (第 223-251 行)

**新增模式**:
```javascript
// 核心代碼模組 - 需要更新 PROJECT-INDEX.md
/^lib\/.*\.(ts|js)$/,           // lib/ 目錄下所有 TypeScript/JavaScript 文件
/^components\/.*\.(tsx|ts)$/,    // components/ 目錄下所有組件
/^app\/.*\.(ts|tsx)$/,           // app/ 目錄下所有 Next.js 14 路由和頁面
/^__tests__\/.*\.test\.(ts|js)$/  // 所有測試文件
```

### 🎯 預期效果

**改進前**:
- 新增 `lib/middleware/response-cache.ts` → ❌ 不會提醒更新索引
- 新增 `lib/middleware/request-transformer.ts` → ❌ 不會提醒更新索引

**改進後**:
- 新增 `lib/middleware/response-cache.ts` → ✅ Pre-commit hook 阻止提交，要求更新 PROJECT-INDEX.md
- 新增 `lib/middleware/request-transformer.ts` → ✅ Pre-commit hook 阻止提交，要求更新 PROJECT-INDEX.md
- 新增 `components/dashboard/new-component.tsx` → ✅ 觸發索引更新檢查
- 新增 `app/api/new-route/route.ts` → ✅ 觸發索引更新檢查
- 新增 `__tests__/lib/new-feature.test.ts` → ✅ 觸發索引更新檢查

### 📊 涵蓋範圍對比

| 目錄類型 | 改進前 | 改進後 |
|---------|-------|-------|
| **docs/*.md** | ✅ 檢測 | ✅ 檢測 |
| **src/*.md** | ✅ 檢測 | ✅ 檢測 |
| **lib/*.ts** | ❌ 未檢測 | ✅ 檢測 |
| **components/*.tsx** | ❌ 未檢測 | ✅ 檢測 |
| **app/*.ts** | ❌ 未檢測 | ✅ 檢測 |
| **__tests__/*.test.ts** | ❌ 未檢測 | ✅ 檢測 |
| **配置文件** | ✅ 檢測 | ✅ 檢測 |

### 🧪 驗證測試

**測試場景 1**: 新增核心中間件
```bash
# 1. 創建新中間件
echo "export const test = () => {}" > lib/middleware/test-middleware.ts

# 2. 提交（應該被阻止）
git add lib/middleware/test-middleware.ts
git commit -m "test"

# 預期結果：
# ❌ Pre-commit hook 阻止提交
# 提示：請更新 PROJECT-INDEX.md
```

**測試場景 2**: 新增測試文件
```bash
# 1. 創建新測試
echo "test('example', () => {})" > __tests__/lib/new-feature.test.ts

# 2. 提交（應該被阻止）
git add __tests__/lib/new-feature.test.ts
git commit -m "test"

# 預期結果：
# ❌ Pre-commit hook 阻止提交
# 提示：請更新 PROJECT-INDEX.md
```

### 📝 使用建議

1. **新增核心代碼文件時**
   - 完成代碼開發
   - 運行測試確保通過
   - **同時更新 PROJECT-INDEX.md**（在對應的 lib/, components/, app/ 或 __tests__/ 部分添加新文件描述）
   - Git commit（pre-commit hook 會驗證索引已更新）

2. **批量新增文件時**
   - 可以先 commit 代碼和索引更新
   - Pre-commit hook 會在提交時驗證所有高重要性文件都有對應的索引更新

3. **查看需要索引的文件**
   ```bash
   node scripts/check-index-sync.js
   ```

### 🔄 後續改進建議

1. **自動化索引生成**
   - 考慮開發自動掃描並生成 PROJECT-INDEX.md 部分內容的工具
   - 特別是對於結構化的目錄（如 lib/middleware/）可以自動生成表格

2. **索引模板化**
   - 為常見的文件類型（中間件、組件、API路由等）創建索引描述模板
   - 減少手動編寫索引描述的工作量

3. **持續監控**
   - 定期運行 `node scripts/check-index-sync.js` 檢查索引同步狀態
   - 在 CI/CD pipeline 中加入索引同步檢查

### 🎓 經驗教訓

1. **索引維護是持續性工作**
   - 不能依賴人工記憶
   - 必須有自動化機制強制執行

2. **檢查規則要跟隨項目演進**
   - MVP Phase 1 主要是文檔和配置
   - MVP Phase 2 開始大量新增核心代碼模組
   - 檢查規則需要相應調整

3. **及早發現問題更容易修復**
   - Pre-commit hook 在提交時檢查
   - 比事後發現索引過期要容易處理得多

### ✅ 改進完成確認

- [x] Pre-commit hook 已更新
- [x] check-index-sync.js 已增強
- [x] PROJECT-INDEX.md 已手動更新至最新狀態
- [x] AI-ASSISTANT-GUIDE.md 已更新進度統計
- [x] 改進記錄文檔已創建
- [ ] 在下次新增核心文件時驗證改進效果

---

**相關文件**:
- `.git/hooks/pre-commit` - Git pre-commit hook
- `scripts/check-index-sync.js` - 索引同步檢查腳本
- `PROJECT-INDEX.md` - 項目主索引
- `AI-ASSISTANT-GUIDE.md` - AI 助手指南
- `INDEX-MAINTENANCE-GUIDE.md` - 索引維護指南
