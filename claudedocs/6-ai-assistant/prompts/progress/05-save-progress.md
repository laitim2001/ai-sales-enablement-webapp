# 🎯 情況5: 進度保存與同步 - 保存工作進度並同步到GitHub

> **使用時機**: 任何工作階段結束或需要保存進度時
> **目標**: 完整記錄進度、維護索引、同步到GitHub
> **預計時間**: 10-15分鐘

---

## 📋 執行清單

### 第1步: 檢查當前工作狀態

```markdown
工作狀態檢查:

1. 查看Git狀態
   git status

2. 查看當前分支
   git branch

3. 確認當前todos狀態
   - 檢查TodoWrite清單
   - 確認哪些已完成
   - 哪些正在進行
   - 哪些待完成

4. 檢查是否有未提交的更改
   git diff (查看未暫存的更改)
   git diff --cached (查看已暫存的更改)
```

### 第2步: 更新開發日誌

```markdown
更新 DEVELOPMENT-LOG.md:

@claudedocs/4-changes/DEVELOPMENT-LOG.md

在文件**最頂部**添加新記錄:

## [日期] [Sprint/Week] - [簡短描述]

**開發內容**:
- 完成功能: [列出完成的功能]
- 修復問題: [列出修復的問題]
- 優化改進: [列出優化項目]

**技術細節**:
- 新增文件: [列出新增的關鍵文件]
- 修改文件: [列出修改的關鍵文件]
- 代碼量: [估計的代碼行數]

**測試狀態**:
- 單元測試: [通過/失敗]
- E2E測試: [通過/失敗]
- 手動測試: [完成情況]

**待解決問題**:
- [列出待解決的問題或技術債]

**下一步計劃**:
- [列出下一步要做的事情]

**相關文檔**:
- [列出相關的文檔鏈接]

---
```

### 第3步: 更新修復日誌(如果有bug修復)

```markdown
如果修復了bug,更新 FIXLOG.md:

@claudedocs/4-changes/FIXLOG.md

在文件**最頂部**添加新記錄:

## FIX-XXX: [簡短描述]

**日期**: YYYY-MM-DD
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
- [x] 單元測試通過
- [x] E2E測試通過
- [x] 手動測試通過

### 相關Issue
- GitHub Issue #XXX
- UAT測試用例 TC-XXX-XXX

---
```

### 第4步: 更新進度追蹤

```markdown
根據完成的工作,更新相應的進度文檔:

1. 如果是MVP Phase 2的工作:
   @claudedocs/3-progress/mvp2-implementation-checklist.md
   - 更新相應Sprint的完成度
   - 更新功能清單狀態
   - 更新代碼統計

2. 如果完成了UAT測試:
   @claudedocs/3-progress/UAT-TEST-PROGRESS-TRACKER.md
   - 更新測試進度統計
   - 更新測試用例狀態
   - 更新缺陷統計

3. 更新當前狀態總覽(如有重大進展):
   @claudedocs/5-status/current-status.md
   - 更新Sprint狀態
   - 更新進度百分比
   - 更新風險和問題
```

### 第5步: 執行索引維護

```markdown
維護項目索引:

參考: @claudedocs/6-ai-assistant/INDEX-MAINTENANCE-GUIDE.md

1. 檢查是否有新文件需要添加到索引
   - 新增的文檔文件
   - 新增的配置文件
   - 新增的重要源代碼文件

2. 執行自動索引檢查(如果有工具)
   npm run index:check

3. 手動更新 PROJECT-INDEX.md(如需要)
   @claudedocs/6-ai-assistant/PROJECT-INDEX.md
   - 添加新文件索引
   - 更新文件描述
   - 更新目錄結構

4. 驗證索引完整性
   - 檢查是否有死鏈接
   - 檢查是否有遺漏的重要文件
```

### 第6步: 提交代碼到Git

```markdown
Git提交流程:

1. 查看所有更改
   git status
   git diff

2. 暫存所有更改
   git add .

3. 編寫清晰的commit message

使用以下格式:

feat: 添加XXX功能

✅ **功能實現**:
- 功能1描述
- 功能2描述

📊 **代碼統計**:
- 新增文件: X個
- 修改文件: Y個
- 代碼行數: ~Z行

🧪 **測試狀態**:
- 單元測試: 通過
- E2E測試: 通過

📝 **文檔更新**:
- DEVELOPMENT-LOG.md
- PROJECT-INDEX.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

或者對於bug修復:

fix: 修復XXX問題

🐛 **問題描述**:
- 問題現象

🔍 **根本原因**:
- 原因分析

✅ **解決方案**:
- 修復說明

📝 **文檔更新**:
- FIXLOG.md (FIX-XXX)
- DEVELOPMENT-LOG.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

4. 執行提交
   git commit -m "commit message"

5. 驗證提交
   git log -1 (查看最新的commit)
```

### 第7步: 推送到GitHub

```markdown
同步到GitHub:

1. 確認當前分支
   git branch

2. 推送到遠程倉庫
   git push origin <branch-name>

   例如:
   git push origin feature/sprint3-week7-rbac-implementation

3. 驗證推送成功
   - 檢查命令行輸出
   - 訪問GitHub網頁確認更新

4. 如果是重要功能,考慮創建Pull Request
   - 使用GitHub網頁界面
   - 或使用 gh cli: gh pr create
```

### 第8步: 清理和整理

```markdown
工作區清理:

1. 刪除臨時文件(如果有)
   - 測試生成的臨時文件
   - 調試日誌
   - 臨時腳本

2. 確認.gitignore正確配置
   - 臨時文件不會被提交
   - 敏感信息不會被提交

3. 更新 TodoWrite 狀態
   - 標記已完成的todos為completed
   - 添加下一步的todos

4. 記錄待辦事項
   - 如果有未完成的工作,記錄在適當的地方
   - 確保下次可以繼續
```

---

## 📝 Commit Message 模板

### 功能開發

```
feat: [簡短描述]

✅ **[類別標題]**:
- 詳細描述1
- 詳細描述2

📊 **代碼統計**:
- 關鍵指標

🧪 **測試狀態**:
- 測試情況

📝 **文檔更新**:
- 更新的文檔

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Bug修復

```
fix: [簡短描述]

🐛 **問題**:
- 問題描述

✅ **修復**:
- 修復說明

📝 **文檔**:
- FIXLOG.md (FIX-XXX)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 文檔更新

```
docs: [簡短描述]

📝 **更新內容**:
- 文檔1
- 文檔2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 重構

```
refactor: [簡短描述]

♻️ **重構內容**:
- 重構說明

✅ **改進**:
- 改進說明

🧪 **測試**:
- 測試狀態

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 測試

```
test: [簡短描述]

🧪 **測試內容**:
- 測試說明

📊 **覆蓋率**:
- 覆蓋率數據

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🔍 提交前檢查清單

### 代碼質量

- [ ] 所有代碼有完整中文註釋
- [ ] 沒有console.log等調試代碼
- [ ] 沒有TODO或FIXME註釋(除非有計劃)
- [ ] 代碼符合項目規範
- [ ] TypeScript類型安全100%

### 測試

- [ ] 單元測試通過: `npm run test`
- [ ] E2E測試通過: `npm run test:e2e`
- [ ] 手動測試關鍵功能
- [ ] 無明顯bug或問題

### 文檔

- [ ] DEVELOPMENT-LOG.md 已更新
- [ ] FIXLOG.md 已更新(如有bug修復)
- [ ] 進度追蹤文檔已更新
- [ ] PROJECT-INDEX.md 已更新(如有新文件)
- [ ] API文檔已更新(如有API變更)

### Git

- [ ] Commit message 清晰明確
- [ ] 沒有包含不該提交的文件
- [ ] 沒有包含敏感信息
- [ ] 已推送到GitHub

---

## 💡 進度保存最佳實踐

### 頻繁提交

```
❌ 錯誤: 一次性提交大量更改
git add .
git commit -m "完成所有功能"

✅ 正確: 小步提交,每個功能一個commit
git add file1.ts
git commit -m "feat: 添加數據模型"

git add file2.ts file3.tsx
git commit -m "feat: 實施API端點"

git add file4.tsx
git commit -m "feat: 實施UI組件"
```

### 清晰的記錄

```
❌ 錯誤: 模糊的記錄
- 修改了一些代碼
- 做了優化

✅ 正確: 具體的記錄
- 實施了用戶搜索API端點 (app/api/users/search/route.ts, 150行)
- 添加了搜索篩選組件 (components/users/user-filters.tsx, 200行)
- 優化了數據庫查詢性能: 從1200ms降低到80ms
```

### 及時同步

```
建議的同步頻率:
- 每個功能完成後立即提交
- 每天至少推送一次到GitHub
- 重要里程碑立即推送
- 下班前必須推送
```

---

## ✅ 完成檢查

保存進度完成前,請確認:

- [ ] ✅ Git status 乾淨或已提交所有更改
- [ ] ✅ DEVELOPMENT-LOG.md 已更新
- [ ] ✅ FIXLOG.md 已更新(如適用)
- [ ] ✅ 進度追蹤文檔已更新
- [ ] ✅ PROJECT-INDEX.md 已更新(如適用)
- [ ] ✅ 索引維護已執行
- [ ] ✅ 代碼已提交到Git
- [ ] ✅ 代碼已推送到GitHub
- [ ] ✅ Commit message 清晰完整
- [ ] ✅ 沒有遺留未完成的工作或記錄了待辦事項

---

## 📊 進度保存記錄模板

可以在團隊協作工具或項目管理系統中使用:

```markdown
## [日期] 進度保存

**完成工作**:
- [列出完成的工作]

**代碼變更**:
- 新增: [文件列表]
- 修改: [文件列表]
- 刪除: [文件列表]

**提交信息**:
- Branch: [分支名]
- Commits: [commit數量]
- 最新commit: [commit hash]

**測試狀態**:
- 所有測試通過: ✅ / ❌

**待辦事項**:
- [列出下一步計劃]

**備註**:
- [任何需要注意的事項]
```

---

## 🚀 下一步

保存進度後:

- **如果還要繼續開發**: 回到相應的開發prompt
- **如果工作結束**: 可以安全地結束會話,下次繼續時使用 `01-quick-start.md` 重新開始

---

**創建日期**: 2025-10-08
**最後更新**: 2025-10-08
