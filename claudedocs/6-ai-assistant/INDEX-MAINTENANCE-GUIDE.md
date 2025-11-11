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

### 2. 智能索引分析工具 ⭐ **新增**

**用途**: 理解多視圖索引設計，精確檢測真實問題

**特點**:
- ✅ 識別多視圖章節（快速導航、優先級分類等）
- ✅ 區分真實重複 vs 設計特性
- ✅ 掃描根目錄文件（避免誤報幽靈條目）
- ✅ 排除 node_modules/.next/dist
- ✅ 生成詳細覆蓋率統計

**使用方法**:
```bash
# 執行智能分析
node scripts/analyze-project-index-smart.js

# 生成報告位置
# docs/project-index-smart-analysis-report.md

# 報告內容包含:
# - 索引健康度 (%)
# - 真實重複條目 (表格內重複)
# - 缺失索引文件 (按優先級分類)
# - 幽靈條目 (索引但文件不存在)
# - 目錄覆蓋率詳細統計
```

**分析報告解讀**:
```markdown
### 整體統計
- **實際文件總數**: 864
- **唯一索引文件**: 559
- **索引健康度**: 64.7%

### 真正的問題統計
- ⚠️ **表格內重複**: 0 個 ← 真正的重複問題
- ⚠️ **目錄重複索引**: 8 個 ← 可能是設計特性，需人工確認
- ⚠️ **缺失索引**: 305 個文件 ← 待補充
- ⚠️ **幽靈條目**: 0 個條目 ← 待清理

### 目錄覆蓋率
| 目錄 | 實際文件 | 索引條目 | 差異 | 覆蓋率 |
|------|----------|----------|------|--------|
| lib | 125 | 130 | +5 | 104.0% |
| components | 114 | 115 | +1 | 100.9% |
| __tests__ | 35 | 35 | 0 | 100.0% |
```

### 3. 自動補充缺失文件工具 ⭐ **新增**

**用途**: 智能補充缺失文件到 PROJECT-INDEX.md

**特點**:
- ✅ 優先級自動分類（高/中/低）
- ✅ 智能文件描述生成
- ✅ 自動找到最佳插入位置
- ✅ 創建備份防止誤操作

**使用方法**:
```bash
# 補充高+中優先級文件到索引
node scripts/add-missing-files-to-index.js

# 腳本會自動:
# 1. 從分析報告讀取缺失文件列表
# 2. 按優先級分類 (高/中/低)
# 3. 生成適當的文件描述
# 4. 找到對應章節插入
# 5. 創建備份文件

# 備份文件位置:
# PROJECT-INDEX.md.backup-[timestamp]
```

**優先級分類邏輯**:

**🔴 高優先級** (32個):
- Sprint 6 新增組件: components/audit/, components/knowledge/, components/permissions/
- 核心服務: lib/meeting/, lib/recommendation/, lib/security/
- 關鍵配置: middleware.ts, next.config.js, tailwind.config.js
- 重要測試: __tests__/lib/security/, __tests__/api/rbac

**🟡 中優先級** (50個):
- 測試文件: __tests__/**
- 文檔文件: docs/**/*.md
- 類型定義: types/**/*.ts
- 配置文件: *.json (排除 package.json)

**🟢 低優先級** (300個):
- POC 測試: poc/**
- 臨時腳本: scripts/temp-*
- 生成文件: dist/, build/

**文件描述生成示例**:
```javascript
// 自動生成描述
'components/audit/AuditLogExport.tsx' → '審計日誌導出組件'
'lib/meeting/meeting-intelligence-analyzer.ts' → '會議智能分析服務（Sprint 7完整實施）'
'middleware.ts' → 'Next.js中間件入口（API Gateway路由）'
```

### 4. 完整維護工作流 ⭐ **推薦流程**

**場景 1: 定期索引健康檢查** (每週/每月)

```bash
# === 標準索引維護流程 ===

# 步驟 1: 執行智能分析
node scripts/analyze-project-index-smart.js

# 步驟 2: 查看分析報告
cat docs/project-index-smart-analysis-report.md

# 檢查以下關鍵指標:
# - 索引健康度: 目標 > 60%
# - 真實重複條目: 目標 = 0
# - 幽靈條目: 目標 = 0
# - 目錄覆蓋率: 核心目錄目標 > 95%

# 步驟 3: 補充缺失文件 (如果缺失 > 50個)
node scripts/add-missing-files-to-index.js
# 選擇選項 2: 補充高+中優先級文件 (~80個)

# 步驟 4: 清理幽靈條目 (如果報告中有)
# 方法 1: 使用 sed 批量刪除
sed -i '1707d;1835d;1855d' PROJECT-INDEX.md

# 方法 2: 手動編輯
nano PROJECT-INDEX.md

# 步驟 5: 驗證結果
node scripts/analyze-project-index-smart.js
# 確認健康度提升，問題減少

# 步驟 6: 提交更新
git add PROJECT-INDEX.md docs/project-index-smart-analysis-report.md
git commit -m "docs: improve PROJECT-INDEX.md - health 55.7% → 64.7%"
git push origin main
```

**場景 2: Sprint 完成後索引更新**

```bash
# Sprint 結束時的完整檢查

# 1. 列出本 Sprint 新增的重要文件
git diff --name-only sprint-start-commit HEAD | \
  grep -E '\.(ts|tsx|md)$' | \
  grep -E 'lib/|components/|app/api/' | \
  sort

# 2. 執行智能分析
node scripts/analyze-project-index-smart.js

# 3. 檢查這些文件是否已索引
for file in $(上述文件列表); do
  if grep -q "$file" PROJECT-INDEX.md; then
    echo "✅ $file - 已索引"
  else
    echo "❌ $file - 未索引 ⚠️"
  fi
done

# 4. 補充遺漏文件
node scripts/add-missing-files-to-index.js

# 5. 更新 AI-ASSISTANT-GUIDE.md (如果有極高重要性文件)
nano AI-ASSISTANT-GUIDE.md

# 6. 提交更新
git add PROJECT-INDEX.md AI-ASSISTANT-GUIDE.md
git commit -m "docs: update index for Sprint X completion"
git push origin main
```

**場景 3: 發現索引問題時的緊急修復**

```bash
# 當 AI 助手反映找不到文件時

# 1. 快速分析問題
node scripts/analyze-project-index-smart.js

# 2. 查看具體缺失文件
grep "缺失索引" docs/project-index-smart-analysis-report.md -A 100

# 3. 立即補充
node scripts/add-missing-files-to-index.js

# 4. 驗證修復
node scripts/analyze-project-index-smart.js

# 5. 提交修復
git add PROJECT-INDEX.md
git commit -m "fix: supplement missing files to index"
git push origin main
```

### 5. 實際案例: 2025-10-07 索引改進

**背景**: 發現 lib/ai/ 有 8 個文件但只索引了 1 個

**執行過程**:
```bash
# 1. 創建智能分析工具
# scripts/analyze-project-index-smart.js

# 2. 執行分析
node scripts/analyze-project-index-smart.js
# 結果: 索引健康度 55.7%, 382個缺失文件, 6個幽靈條目

# 3. 創建自動補充工具
# scripts/add-missing-files-to-index.js

# 4. 補充高+中優先級文件
node scripts/add-missing-files-to-index.js
# 選擇: 2. 補充高+中優先級文件 (~80個)
# 結果: 添加 32高 + 50中 = 82個文件

# 5. 清理幽靈條目
sed -i '1707d;1835d;1855d;1856d;1857d;1858d' PROJECT-INDEX.md

# 6. 驗證結果
node scripts/analyze-project-index-smart.js
# 結果: 索引健康度 64.7% ↑, 305個缺失 ↓, 0個幽靈 ✅
```

**改進成果**:
```
📊 統計對比:

改進前:
- 索引健康度: 55.7%
- 缺失文件: 382 個
- 幽靈條目: 6 個
- 目錄覆蓋率:
  * __tests__: 71.4%
  * components: 88.6%
  * docs: 64.6%

改進後:
- 索引健康度: 64.7% ↑ (+9%)
- 缺失文件: 305 個 ↓ (-77)
- 幽靈條目: 0 個 ✅
- 目錄覆蓋率:
  * __tests__: 100.0% ✅
  * components: 100.9% ✅
  * docs: 101.2% ✅
  * types: 100.0% ✅

📝 新增索引:
- Sprint 6 組件: 15個 (審計日誌UI、知識庫增強、權限組件)
- 核心服務: 4個 (會議智能、推薦引擎、安全模組)
- 關鍵配置: 5個 (middleware、next.config等)
- 重要測試: 13個 (RBAC、安全模組、Hook測試)
- 文檔: 45個 (用戶故事、負載測試報告等)
```

**經驗教訓**:

✅ **正確理解多視圖設計**:
- 同一文件出現在「目錄結構」、「快速導航」、「優先級分類」是正常的
- 只有在**同一表格內**重複才是真正的問題

✅ **優先級分類策略有效**:
- 先補充高+中優先級 (82個) 而非全部 (382個)
- 避免索引過載，保持信息密度

✅ **自動化工具價值**:
- 手動維護 2000+ 行索引容易出錯
- 智能工具節省 90% 維護時間
- 備份機制防止誤操作

### 6. Git Hook 自動化

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

### 7. CI/CD 管道檢查

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
      - name: Run Smart Index Analysis
        run: |
          echo "🧠 運行智能索引分析"
          node scripts/analyze-project-index-smart.js
      - name: Check Index Health
        run: |
          echo "📊 檢查索引健康度"
          HEALTH=$(grep "索引健康度" docs/project-index-smart-analysis-report.md | grep -o '[0-9.]*%')
          echo "當前健康度: $HEALTH"
          if [ "${HEALTH%.*}" -lt 60 ]; then
            echo "⚠️ 索引健康度低於 60%，建議執行維護"
            exit 1
          fi
```

---

## 📝 維護操作手冊

### 新增重要文件時

#### 方法 1: 即時手動維護 (推薦用於少量文件)

**步驟 1: 識別文件重要性**
```
🔴 極高重要性：核心業務文檔、主要配置
🟡 高重要性：功能模組、API 文檔、測試
🟢 中重要性：工具腳本、輔助文檔
⚪ 低重要性：臨時文件、日誌
```

**步驟 2: 更新對應索引**
```
極高重要性 → 更新 AI-ASSISTANT-GUIDE.md + PROJECT-INDEX.md
高重要性   → 更新 PROJECT-INDEX.md + 專門索引
中重要性   → 更新 PROJECT-INDEX.md
低重要性   → 不納入索引
```

**步驟 3: 驗證更新**
```bash
# 檢查路徑是否正確
ls -la path/to/new/file

# 檢查索引引用是否正確
grep -r "new-file-name" *.md indexes/
```

#### 方法 2: 批次自動維護 (推薦用於大量文件) ⭐

**適用場景**: Sprint 結束、重構完成、發現大量缺失

```bash
# 1. 執行智能分析
node scripts/analyze-project-index-smart.js

# 2. 查看缺失文件數量和優先級分布
cat docs/project-index-smart-analysis-report.md | grep "缺失索引"

# 3. 自動補充
node scripts/add-missing-files-to-index.js
# 選擇: 2. 補充高+中優先級文件 (~80個)

# 4. 驗證結果
node scripts/analyze-project-index-smart.js

# 5. 檢查健康度是否提升
cat docs/project-index-smart-analysis-report.md | grep "索引健康度"

# 6. 提交更新
git add PROJECT-INDEX.md docs/project-index-smart-analysis-report.md
git commit -m "docs: improve index with smart analysis tool"
git push origin main
```

**優勢對比**:

| 方面 | 手動維護 | 自動維護 (智能工具) |
|------|----------|---------------------|
| 適用文件數 | 1-5 個 | 10-100 個 |
| 維護時間 | 5-10 分鐘/文件 | 2-3 分鐘/批次 |
| 錯誤率 | 中等 (路徑、描述錯誤) | 低 (自動驗證) |
| 備份機制 | 手動 | 自動創建 |
| 優先級判斷 | 手動評估 | 智能分類 |
| 描述生成 | 手動編寫 | 模式識別生成 |
| 插入位置 | 手動查找 | 自動匹配章節 |

**建議策略**:
- 日常開發: 即時手動維護 (文件創建時立即更新)
- Sprint 結束: 批次自動維護 (檢查遺漏並補充)
- 問題修復: 批次自動維護 (快速恢復索引健康度)

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
3. **智能工具優先**: 大量文件更新使用自動化工具 ⭐ **新增**
4. **定期健康檢查**: 每週/月執行智能分析確保健康度 > 60% ⭐ **新增**
5. **優先級分類**: 先補充高+中優先級，避免索引過載 ⭐ **新增**
6. **自動化檢查**: 設置 Git Hook 和 CI/CD 檢查
7. **定期清理**: 月度檢查過期引用和幽靈條目
8. **理解多視圖**: 同一文件在不同章節出現是設計特性 ⭐ **新增**
9. **備份機制**: 自動化工具會創建備份，手動操作也應備份 ⭐ **新增**

### ❌ 避免做法

1. **批次延遲更新**: 累積大量變更後才更新索引
2. **忽略小文件**: 認為小文件不重要而不納入索引
3. **路徑硬編碼**: 在索引中使用絕對路徑或環境特定路徑
4. **誤解多視圖**: 認為多章節出現就是重複 ⭐ **新增**
5. **過度索引**: 將所有低優先級文件都納入導致信息過載 ⭐ **新增**
6. **手動大量操作**: 面對 50+ 文件仍堅持手動維護 ⭐ **新增**
7. **忽略健康度指標**: 不定期檢查索引健康度和覆蓋率 ⭐ **新增**

### 🎯 工具選擇決策樹 ⭐ **新增**

```
需要更新索引？
├─ 新增文件 < 5 個？
│  ├─ 是 → 手動即時維護 (5-10 分鐘)
│  └─ 否 → ↓
├─ 新增文件 5-20 個？
│  ├─ 是 → 選擇：手動 or 自動工具
│  └─ 否 → ↓
└─ 新增文件 > 20 個？
   └─ 是 → 使用智能工具 (2-3 分鐘)

發現索引問題？
├─ AI 助手反映找不到文件？
│  └─ 立即執行: node scripts/analyze-project-index-smart.js
├─ 索引健康度 < 60%？
│  └─ 執行: node scripts/add-missing-files-to-index.js
└─ 有幽靈條目？
   └─ 使用 sed 批量刪除

定期維護時機？
├─ 每週五下班前
│  └─ 快速檢查: node scripts/analyze-project-index-smart.js
├─ Sprint 結束時
│  └─ 完整維護: 分析 → 補充 → 驗證 → 提交
└─ 每月第一週
   └─ 深度清理: 幽靈條目 + 優先級重評估
```

### 📊 維護效果指標 ⭐ **新增**

**關鍵健康指標**:

| 指標 | 目標值 | 警戒值 | 行動 |
|------|--------|--------|------|
| 索引健康度 | > 60% | < 50% | 立即執行自動補充 |
| 真實重複條目 | 0 個 | > 5 個 | 手動檢查並清理 |
| 幽靈條目 | 0 個 | > 10 個 | 批量清理 |
| 核心目錄覆蓋率 | > 95% | < 80% | 優先補充核心目錄 |
| components/ | 100% | < 90% | 補充 UI 組件索引 |
| lib/ | 100% | < 90% | 補充核心服務索引 |
| app/api/ | 100% | < 90% | 補充 API 端點索引 |

**監控週期**:
- 每週: 快速健康檢查 (5 分鐘)
- 每月: 深度維護和清理 (30 分鐘)
- Sprint 結束: 完整驗證和更新 (15 分鐘)

**改進案例**: 2025-10-07
- 起始健康度: 55.7% → 目標: > 60%
- 執行時間: 30 分鐘
- 最終健康度: 64.7% ✅
- 效率提升: 手動需 6-8 小時 → 自動化 30 分鐘 (90% 時間節省)

---

**🎯 核心原則：索引系統的價值在於幫助 AI 助手快速找到正確文件。保持索引的準確性和時效性比完整性更重要！使用智能工具可節省 90% 維護時間，並顯著提升索引質量。** ⭐