# 🎯 情況3: 舊功能開發測試 - 修改和優化現有功能

> **使用時機**: 修改、優化或修復現有功能時
> **目標**: 安全地修改現有代碼,保持向後兼容,完整測試
> **預計時間**: 根據功能複雜度而定

---

## 📋 執行清單

### 第1步: 理解現有實現

```markdown
深入了解當前實現:

1. 閱讀現有代碼
   - 使用 Read 工具閱讀相關文件
   - 理解數據流和業務邏輯
   - 識別關鍵函數和組件

2. 檢查數據模型
   @prisma/schema.prisma
   - 了解相關數據模型
   - 理解關聯關係
   - 確認索引和約束

3. 查看相關測試
   - 單元測試: __tests__/**/*.test.ts
   - E2E測試: e2e/**/*.spec.ts
   - 了解現有測試覆蓋範圍
```

### 第2步: 分析修改影響範圍

```markdown
影響範圍評估:

使用 Grep 搜索所有引用:

# 搜索函數/類的所有引用
Grep(pattern="<函數名>|<類名>", output_mode="files_with_matches")

# 搜索API端點的所有調用
Grep(pattern="<API路徑>", output_mode="files_with_matches")

# 搜索組件的所有使用
Grep(pattern="<組件名>", glob="**/*.tsx", output_mode="files_with_matches")

影響範圍清單:
- [ ] 列出所有受影響的文件
- [ ] 識別所有調用點
- [ ] 確認是否有外部依賴
```

### 第3步: 檢查現有問題和bug

```markdown
查看相關問題:

@claudedocs/4-changes/FIXLOG.md
- 搜索與此功能相關的已知問題
- 了解歷史修復記錄

@claudedocs/3-progress/UAT-TEST-PROGRESS-TRACKER.md
- 查看相關的UAT測試結果
- 識別失敗的測試用例

GitHub Issues (如果有):
- 查看開放的issues
- 查看相關的討論
```

### 第4步: 制定修改計劃

```markdown
使用 TodoWrite 制定計劃:

TodoWrite({
  todos: [
    {content: "理解現有實現和影響範圍", status: "completed"},
    {content: "設計修改方案(確保向後兼容)", status: "in_progress"},
    {content: "修改後端代碼/API", status: "pending"},
    {content: "修改前端組件/UI", status: "pending"},
    {content: "更新或新增單元測試", status: "pending"},
    {content: "更新或新增E2E測試", status: "pending"},
    {content: "手動測試驗證", status: "pending"},
    {content: "執行回歸測試", status: "pending"},
    {content: "更新文檔", status: "pending"},
    {content: "代碼審查", status: "pending"},
    {content: "提交到GitHub", status: "pending"}
  ]
})
```

### 第5步: 安全修改代碼

```markdown
遵循修改原則:

1. 創建測試分支
   git checkout -b fix/<功能名>-<問題描述>

2. 最小化修改
   - 只修改必要的部分
   - 避免不相關的重構
   - 保持代碼風格一致

3. 保持向後兼容
   - 不要改變公共API簽名
   - 不要刪除現有功能
   - 使用deprecation標記過時功能

4. 添加中文註釋
   - 解釋為什麼要修改
   - 說明修改的影響
   - 記錄相關issue或bug編號
```

### 第6步: 更新測試

```markdown
測試更新策略:

1. 更新現有測試
   - 修改失敗的測試用例
   - 調整測試預期結果
   - 確保所有測試通過

2. 新增測試覆蓋
   - 為新增的邏輯添加測試
   - 為修復的bug添加回歸測試
   - 確保邊界情況被覆蓋

3. 執行測試
   npm run test (單元測試)
   npm run test:e2e (E2E測試)
```

### 第7步: 回歸測試

```markdown
執行回歸測試:

1. 手動測試修改的功能
   - 測試正常流程
   - 測試錯誤情況
   - 測試邊界條件

2. 測試相關功能
   - 測試所有調用點
   - 驗證整合功能
   - 確認無副作用

3. UAT測試驗證
   @claudedocs/3-progress/UAT-TEST-PROGRESS-TRACKER.md
   - 執行相關UAT測試用例
   - 記錄測試結果
   - 更新測試進度
```

### 第8步: 更新文檔

```markdown
文檔更新清單:

1. 代碼文檔
   - [ ] 更新函數/類的JSDoc註釋
   - [ ] 更新README(如果有變化)
   - [ ] 更新API文檔(如果API有變化)

2. 用戶文檔
   - [ ] 更新使用指南(如果UI有變化)
   - [ ] 更新設置指南(如果配置有變化)

3. 開發文檔
   - [ ] 更新架構文檔(如果設計有變化)
   - [ ] 更新 DEVELOPMENT-LOG.md
   - [ ] 更新 FIXLOG.md (如果是bug修復)
```

### 第9步: 代碼審查準備

```markdown
準備代碼審查:

1. 自我審查
   - [ ] 代碼是否符合項目規範?
   - [ ] 是否有遺漏的測試?
   - [ ] 是否有不必要的修改?
   - [ ] 註釋是否清晰完整?

2. 準備審查材料
   - [ ] 清晰的commit message
   - [ ] 修改說明文檔
   - [ ] 測試結果截圖
   - [ ] 影響範圍說明
```

---

## 💡 修改原則

### 向後兼容性

```typescript
// ❌ 錯誤: 直接修改函數簽名
function getUserData(userId: string) {
  // 新實現
}

// ✅ 正確: 添加可選參數保持兼容
function getUserData(userId: string, options?: GetUserDataOptions) {
  // 新實現,同時支持舊調用方式
}
```

### 漸進式重構

```typescript
// ❌ 錯誤: 一次性大規模重構
// 重寫整個模塊

// ✅ 正確: 漸進式改進
// 1. 添加新實現
// 2. 標記舊實現為deprecated
// 3. 逐步遷移調用點
// 4. 最後移除舊實現
```

### 最小化影響

```typescript
// ❌ 錯誤: 修改公共接口
export interface UserData {
  id: string;
  name: string;
  // 刪除email字段 <- 破壞性變更!
}

// ✅ 正確: 添加新字段,保留舊字段
export interface UserData {
  id: string;
  name: string;
  email?: string; // 保留,但標記為可選
  emailAddress?: string; // 添加新字段
}
```

---

## 🧪 測試檢查清單

### 單元測試

- [ ] 修改的函數是否有對應測試?
- [ ] 測試是否覆蓋正常情況?
- [ ] 測試是否覆蓋錯誤情況?
- [ ] 測試是否覆蓋邊界情況?
- [ ] 所有測試是否通過?

### 集成測試

- [ ] API端點測試是否通過?
- [ ] 數據庫操作測試是否通過?
- [ ] 外部服務整合測試是否通過?

### E2E測試

- [ ] 關鍵用戶流程是否測試?
- [ ] 是否覆蓋多種場景?
- [ ] 測試是否穩定可靠?

### 回歸測試

- [ ] 相關功能是否正常?
- [ ] 無意外的副作用?
- [ ] 性能是否受影響?

---

## 📝 修復記錄模板

如果是bug修復,請在 FIXLOG.md 添加記錄:

```markdown
## FIX-XXX: [簡短描述]

**日期**: 2025-10-XX
**影響範圍**: [文件列表]
**嚴重性**: 🔴嚴重 / 🟡重要 / 🟢一般

### 問題描述
[詳細描述問題]

### 根本原因
[分析根本原因]

### 解決方案
[說明修復方案]

### 修改文件
- file1.ts (line XX-YY): [修改說明]
- file2.tsx (line XX-YY): [修改說明]

### 測試驗證
- [ ] 單元測試通過
- [ ] E2E測試通過
- [ ] 手動測試通過
- [ ] 回歸測試通過

### 相關Issue
- GitHub Issue #XXX
- UAT測試用例 TC-XXX-XXX
```

---

## ✅ 完成檢查

修改完成前,請確認:

- [ ] ✅ 代碼修改完成且符合規範
- [ ] ✅ 所有測試通過(單元+E2E+回歸)
- [ ] ✅ 文檔已更新
- [ ] ✅ DEVELOPMENT-LOG.md 已更新
- [ ] ✅ FIXLOG.md 已更新(如果是bug修復)
- [ ] ✅ 已進行自我代碼審查
- [ ] ✅ 無破壞性變更或已妥善處理
- [ ] ✅ 準備好提交到GitHub

---

## 🚀 下一步

修改完成後:

- **保存進度並同步**: 使用 `05-save-progress.md`

---

**創建日期**: 2025-10-08
**最後更新**: 2025-10-08
