# 📋 索引維護指南

> **目的**: 確保項目索引文件在開發過程中保持同步更新
> **重要性**: 防止 AI 助手因過期索引而找不到正確文件

---

## 🎯 索引維護策略

### 📅 維護時機

#### 🔴 必須更新 (立即執行)
- 新增重要項目文檔 (*.md)
- 新增主要代碼模組 (src/, lib/, components/)
- **新增Next.js頁面文件** (app/**/page.tsx, layout.tsx, route.ts)
- 重構項目結構
- 新增 API 端點或資料庫表

#### 🟡 建議更新 (Sprint 結束時)
- 新增配置文件
- 新增測試文件
- 新增工具腳本
- 更新依賴或環境配置

#### 🟢 定期檢查 (每月一次)
- 清理過期引用
- 優化索引結構
- 更新文件重要性評級

---

## 🔄 維護工作流程

### ⚡ 強制性 TODO 清單提醒機制

**🎯 核心原則**: 每次開發任務必須包含索引更新檢查項

#### 📋 標準開發任務 TODO 模板

**每次創建新功能/文件時，必須使用以下 TODO 清單**:

```markdown
## 任務 TODO 清單

### 實現階段
- [ ] 實現功能代碼
- [ ] 編寫單元測試
- [ ] 本地測試通過

### 📋 索引維護 (⚠️ 強制必做)
- [ ] **檢查是否創建了新的重要文件** (lib/, components/, app/api/, app/dashboard/)
- [ ] **更新 PROJECT-INDEX.md** - 添加新文件索引
- [ ] **更新 AI-ASSISTANT-GUIDE.md** (如果是極高重要性文件)
- [ ] **執行索引檢查**: `npm run check:index` (如果腳本已創建)

### 提交階段
- [ ] git add 所有文件 **包括索引文件**
- [ ] 提交信息包含 "並更新索引"
- [ ] 推送到 GitHub
```

#### 🔴 強制檢查點 (每個階段必須執行)

**Phase 完成時立即執行**:

```bash
# === 階段性索引檢查流程 ===

# 1. 列出本 Phase 新增的所有重要文件
echo "📋 檢查本 Phase 新增的文件..."
git diff --name-only <上一個提交> HEAD | \
  grep -E '\.(ts|tsx|md)$' | \
  grep -E 'lib/|components/|app/api/|app/dashboard/' | \
  sort

# 2. 檢查這些文件是否已在 PROJECT-INDEX.md 中
echo "🔍 檢查索引狀態..."
for file in $(上述文件列表); do
  if grep -q "$file" PROJECT-INDEX.md; then
    echo "✅ $file - 已索引"
  else
    echo "❌ $file - 未索引 ⚠️"
  fi
done

# 3. 如有遺漏，立即補充
echo "📝 更新 PROJECT-INDEX.md..."
# 手動編輯添加遺漏文件

# 4. 提交索引更新
git add PROJECT-INDEX.md
git commit -m "docs: 更新索引 - Phase X 新增文件"
git push origin main
```

#### 📊 每日開發結束時檢查

**下班前必做**:

```bash
# === 每日索引健康檢查 ===

echo "📊 執行每日索引健康檢查..."

# 1. 查看今天新增的文件
git log --since="今天 00:00" --name-only --diff-filter=A | \
  grep -E '\.(ts|tsx)$' | \
  grep -E 'lib/|components/|app/' | \
  sort -u

# 2. 檢查是否都已索引
echo "檢查索引完整性..."
# (執行檢查邏輯)

# 3. 如有遺漏，當天補上
echo "⚠️ 發現未索引文件，立即更新..."
```

### 1. 開發過程中的即時維護

#### 當新增重要文件時
```bash
# === 正確的文件創建流程 ===

# 1. 創建新文件
touch lib/knowledge/new-feature.ts

# 2. 實現功能
# ... 編寫代碼 ...

# 3. ⚠️ 立即更新索引 (不要等！)
nano PROJECT-INDEX.md
# 添加新文件到對應章節

# 4. 一起提交
git add lib/knowledge/new-feature.ts PROJECT-INDEX.md
git commit -m "feat: 新增功能並更新索引"
git push origin main

# ✅ 索引和代碼同步提交 - 這是正確做法！
```

#### ❌ 錯誤做法 vs ✅ 正確做法

**❌ 錯誤 - 批次更新索引**:
```bash
# Day 1: 創建文件 A
git commit -m "feat: 新增文件 A"

# Day 2: 創建文件 B
git commit -m "feat: 新增文件 B"

# Day 3: 創建文件 C
git commit -m "feat: 新增文件 C"

# Day 7: 才想起來更新索引 ❌
git commit -m "docs: 更新索引"
# 結果: 可能遺漏某些文件！
```

**✅ 正確 - 即時更新索引**:
```bash
# Day 1: 創建文件 A + 立即更新索引
git commit -m "feat: 新增文件 A 並更新索引"

# Day 2: 創建文件 B + 立即更新索引
git commit -m "feat: 新增文件 B 並更新索引"

# Day 3: 創建文件 C + 立即更新索引
git commit -m "feat: 新增文件 C 並更新索引"

# 結果: 索引始終保持同步 ✅
```

#### 當重構目錄結構時
```bash
# 1. 執行重構
# 2. 同步更新所有索引文件
# 3. 檢查路徑引用

# 更新順序:
# - .ai-context (簡要路徑)
# - AI-ASSISTANT-GUIDE.md (重要文件路徑)
# - PROJECT-INDEX.md (完整路徑表)
```

### 2. Sprint 結束時的批次維護

#### 檢查清單
- [ ] 新增的文件都已加入適當索引
- [ ] 移除或重命名的文件已從索引中移除
- [ ] 路徑引用都是正確的
- [ ] 重要性標記符合現狀
- [ ] 快速指南仍然準確

### 3. 定期深度維護

#### 月度檢查清單
- [ ] 執行索引同步檢查工具
- [ ] 評估文件重要性變化
- [ ] 優化索引結構
- [ ] 更新 AI 助手使用指南

---

## 🏗️ 多層級索引架構設計

### 當前四層架構

```
📁 索引層級結構
├── .ai-context                    # L0: 極簡載入 (核心信息)
├── AI-ASSISTANT-GUIDE.md          # L1: 快速導航 (常用文件)
├── PROJECT-INDEX.md               # L2: 完整索引 (全部文件)
└── INDEX-MAINTENANCE-GUIDE.md     # L3: 維護指南 (索引管理)
```

### 🚀 未來擴展架構

當項目規模進一步增長時，可建立第五層專門領域索引：

#### Level 4: 專門領域索引

```
📂 indexes/                        # 專門索引目錄
├── API-INDEX.md                   # API 端點和路由索引
├── COMPONENT-INDEX.md             # UI 組件索引
├── DATABASE-INDEX.md              # 資料庫相關文件索引
├── TEST-INDEX.md                  # 測試文件索引
├── CONFIG-INDEX.md                # 配置文件索引
└── DOCS-INDEX.md                  # 文檔分類索引
```

### 📊 索引分層原則

| 層級 | 文件 | 目標受眾 | 更新頻率 | 內容範圍 |
|------|------|----------|----------|----------|
| **L0** | `.ai-context` | AI 助手快速載入 | 低 | 核心信息 |
| **L1** | `AI-ASSISTANT-GUIDE.md` | AI 助手日常使用 | 中 | 常用文件 |
| **L2** | `PROJECT-INDEX.md` | AI 助手完整導航 | 高 | 全部文件 |
| **L3** | `INDEX-MAINTENANCE-GUIDE.md` | 索引維護指南 | 低 | 維護策略 |
| **L4** | `indexes/*.md` | 專門領域查詢 | 中 | 特定領域 |

---

## 🛠️ 自動化維護工具

### 1. 索引同步檢查腳本

```bash
# 運行索引同步檢查
npm run check:index

# 或手動執行
node scripts/check-index-sync.js
```

### 2. Git Hook 自動化

#### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

# 檢查是否有重要文件變更但索引未更新
echo "🔍 檢查索引同步狀態..."

# 檢查是否有新增 .md 文件但索引未更新
NEW_MD_FILES=$(git diff --cached --name-only --diff-filter=A | grep '\.md$')
if [ ! -z "$NEW_MD_FILES" ]; then
    echo "⚠️ 檢測到新增 .md 文件，請確認索引已更新："
    echo "$NEW_MD_FILES"

    # 檢查 PROJECT-INDEX.md 是否也在此次提交中
    INDEX_UPDATED=$(git diff --cached --name-only | grep 'PROJECT-INDEX.md\|AI-ASSISTANT-GUIDE.md')
    if [ -z "$INDEX_UPDATED" ]; then
        echo "❌ 請更新相關索引文件後再提交"
        exit 1
    fi
fi

echo "✅ 索引同步檢查通過"
```

### 3. CI/CD 管道檢查

```yaml
# .github/workflows/index-sync-check.yml
name: Index Sync Check

on: [push, pull_request]

jobs:
  check-index-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check Index Synchronization
        run: |
          echo "🔍 檢查索引文件同步狀態"
          node scripts/check-index-sync.js
```

---

## 📝 維護操作手冊

### 新增重要文件時

#### 步驟 1: 識別文件重要性
```
🔴 極高重要性：核心業務文檔、主要配置
🟡 高重要性：功能模組、API 文檔、測試
🟢 中重要性：工具腳本、輔助文檔
⚪ 低重要性：臨時文件、日誌
```

#### 步驟 2: 更新對應索引
```
極高重要性 → 更新 AI-ASSISTANT-GUIDE.md + PROJECT-INDEX.md
高重要性   → 更新 PROJECT-INDEX.md + 專門索引
中重要性   → 更新 PROJECT-INDEX.md
低重要性   → 不納入索引
```

#### 步驟 3: 驗證更新
```bash
# 檢查路徑是否正確
ls -la path/to/new/file

# 檢查索引引用是否正確
grep -r "new-file-name" *.md indexes/
```

### 重構目錄結構時

#### 準備階段
1. 備份當前索引文件
2. 記錄將要變更的路徑
3. 準備批次替換腳本

#### 執行階段
1. 執行目錄重構
2. 批次更新索引文件中的路徑
3. 驗證所有引用都已更新

#### 驗證階段
```bash
# 檢查是否有斷掉的引用
node scripts/check-index-sync.js

# 手動驗證關鍵路徑
ls -la $(grep -o '`[^`]*`' AI-ASSISTANT-GUIDE.md | tr -d '`')
```

---

## 🎯 擴展策略

### 項目規模達到以下標準時建立 L4 專門索引：

#### API 索引 (API-INDEX.md)
- **觸發條件**: API 端點 > 20 個
- **內容**: 端點分類、參數說明、範例

#### 組件索引 (COMPONENT-INDEX.md)
- **觸發條件**: UI 組件 > 50 個
- **內容**: 組件分類、使用方式、依賴關係

#### 資料庫索引 (DATABASE-INDEX.md)
- **觸發條件**: 資料表 > 15 個
- **內容**: 表結構、關聯關係、遷移歷史

#### 測試索引 (TEST-INDEX.md)
- **觸發條件**: 測試文件 > 100 個
- **內容**: 測試分類、覆蓋率、測試策略

### 自動索引生成

當項目達到一定規模，可考慮實施：

1. **自動掃描**: 定期掃描項目結構生成索引
2. **智能分類**: 基於文件內容自動分類
3. **依賴分析**: 自動分析文件間依賴關係
4. **重要性評分**: 基於使用頻率自動評級

---

## 📊 維護效果監控

### 關鍵指標

1. **索引準確率**: 索引中引用的文件實際存在比例
2. **覆蓋率**: 重要文件被索引覆蓋的比例
3. **使用效率**: AI 助手通過索引找到正確文件的比例
4. **維護成本**: 索引維護所需的時間和工作量

### 監控方法

```bash
# 定期運行檢查報告
npm run index:health-check

# 輸出示例:
# ✅ 索引準確率: 98% (2/100 引用失效)
# ✅ 覆蓋率: 95% (190/200 重要文件已索引)
# ⚠️ 建議: 3 個新文件待加入索引
```

---

## 🎉 最佳實踐總結

### ✅ 推薦做法

1. **提交時同步**: 每次提交重要文件時同時更新索引
2. **分層維護**: 根據文件重要性選擇適當的索引層級
3. **自動化檢查**: 設置 Git Hook 和 CI/CD 檢查
4. **定期清理**: 月度檢查過期引用和重要性變化
5. **文檔先行**: 先更新索引再開發新功能

### ❌ 避免做法

1. **批次延遲更新**: 累積大量變更後才更新索引
2. **忽略小文件**: 認為小文件不重要而不納入索引
3. **路徑硬編碼**: 在索引中使用絕對路徑或環境特定路徑
4. **重複索引**: 在多個索引文件中重複相同信息
5. **過度索引**: 將所有文件都納入索引導致信息過載

---

**🎯 記住：索引系統的價值在於幫助 AI 助手快速找到正確文件。保持索引的準確性和時效性比完整性更重要！**