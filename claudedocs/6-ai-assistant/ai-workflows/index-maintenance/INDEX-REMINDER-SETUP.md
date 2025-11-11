# 📋 索引同步提醒系統設置指南

> **目的**: 幫助團隊設置自動化索引同步提醒系統，確保項目索引文件始終保持最新

---

## 🎯 系統概覽

索引同步提醒系統由多個組件組成，提供從本地開發到 CI/CD 的全方位索引維護支援：

### 📊 組件架構

```
🔄 索引同步提醒系統
├── 🔧 本地工具
│   ├── check-index-sync.js      # 核心檢查工具
│   ├── index-maintenance.js     # 互動式維護
│   └── dev-reminder.js          # 每日開發提醒
├── 🪝 Git Hooks
│   ├── pre-commit               # 提交前檢查
│   ├── post-commit              # 提交後提醒
│   └── pre-push                 # 推送前驗證
├── 💻 VS Code 整合
│   ├── tasks.json               # 快速任務
│   └── settings.json            # 編輯器設置
├── 🚀 GitHub Actions
│   └── index-check.yml          # CI/CD 檢查
└── 📦 NPM 腳本
    └── package.json             # 便捷命令
```

---

## 🚀 快速開始

### 1️⃣ 驗證安裝

確認所有組件已正確安裝：

```bash
# 檢查核心工具
npm run index:check

# 檢查 Git Hooks
ls -la .git/hooks/pre-commit

# 檢查 VS Code 配置
ls -la .vscode/tasks.json

# 檢查 GitHub Actions
ls -la .github/workflows/index-check.yml
```

### 2️⃣ 運行首次檢查

```bash
# 完整索引檢查
npm run index:check

# 如果發現問題，運行維護工具
npm run index:update
```

### 3️⃣ 測試 Git Hooks

```bash
# 測試 pre-commit hook
echo "test" > test.md
git add test.md
git commit -m "test commit"  # 應該觸發索引檢查

# 清理測試文件
rm test.md
git reset --soft HEAD~1
```

---

## 🔧 詳細配置指南

### 📝 本地工具配置

#### 索引檢查工具

**文件**: `scripts/check-index-sync.js`

**使用方法**:
```bash
# 基本檢查
node scripts/check-index-sync.js

# 增量檢查（只檢查最近變更）
node scripts/check-index-sync.js --incremental

# 自動修復模式
node scripts/check-index-sync.js --auto-fix

# 查看幫助
node scripts/check-index-sync.js --help
```

**配置選項**:
- `--incremental`: 只檢查上次檢查後變更的文件
- `--auto-fix`: 自動應用建議的修復
- `--help`: 顯示使用說明

#### 維護助手工具

**文件**: `scripts/index-maintenance.js`

**功能**:
- 互動式文件索引
- 智能重要性分類
- 批次處理操作
- 生成索引條目建議

**使用流程**:
```bash
npm run index:update

# 互動操作選項：
# a - 添加到索引
# s - 跳過此文件
# e - 編輯重要性
# q - 退出程序
```

#### 開發提醒工具

**文件**: `scripts/dev-reminder.js`

**功能**:
- 每日開發狀態檢查
- 索引健康度評分
- 活躍度監控
- 智能提醒頻率

**使用方式**:
```bash
# 手動運行檢查
npm run dev:reminder

# 靜默模式（只在需要時提醒）
node scripts/dev-reminder.js --quiet

# 整合到開發流程
npm run dev:start  # 啟動開發前檢查
```

### 🪝 Git Hooks 配置

#### Pre-commit Hook

**文件**: `.git/hooks/pre-commit`

**觸發時機**: 每次 `git commit` 前

**檢查內容**:
- 重要文件變更檢測
- 高重要性文件索引驗證
- 增量索引同步檢查

**自訂配置**:
```bash
# 修改重要文件模式
# 編輯 .git/hooks/pre-commit 中的 IMPORTANT_FILES 變數
IMPORTANT_FILES=$(git diff --cached --name-only --diff-filter=AM | grep -E '\.(md|js|ts|tsx|json|prisma|sql|yml|yaml)$')
```

#### Post-commit Hook

**文件**: `.git/hooks/post-commit`

**功能**:
- GitHub 自動推送
- 定期索引提醒（每10次提交）
- 提交計數追蹤

**自訂提醒頻率**:
```bash
# 編輯 .git/hooks/post-commit
# 修改提醒間隔（預設10次提交提醒一次）
if [ $((COUNT % 10)) -eq 0 ]; then  # 改為其他數字調整頻率
```

#### Pre-push Hook

**文件**: `.git/hooks/pre-push`

**功能**:
- 推送前最終驗證
- 未提交變更檢測
- 索引同步確認

### 💻 VS Code 整合

#### 任務配置

**文件**: `.vscode/tasks.json`

**可用任務**:
- `🔍 檢查索引同步`: 基本檢查
- `⚡ 增量索引檢查`: 快速檢查
- `🔧 自動修復索引`: 自動應用修復
- `📝 維護索引文件`: 互動式維護
- `📊 開發提醒檢查`: 狀態檢查
- `👁️ 啟動索引監視器`: 實時監控
- `🚀 安全提交`: 含檢查的提交

**使用方式**:
1. 按 `Ctrl+Shift+P`
2. 輸入 "Tasks: Run Task"
3. 選擇所需任務

#### 編輯器設置

**文件**: `.vscode/settings.json`

**配置亮點**:
- 自動排除工具目錄搜索
- Markdown 文件關聯
- Git 提交訊息驗證
- 終端整合設置

### 🚀 GitHub Actions 配置

#### 工作流程文件

**文件**: `.github/workflows/index-check.yml`

**觸發條件**:
- Push 到 main/develop 分支
- Pull Request 到 main/develop
- 每日定時檢查 (UTC 02:00)

**功能**:
- 自動索引同步檢查
- PR 評論報告
- 每日健康報告
- 檢查結果工件上傳

**自訂配置**:

```yaml
# 修改檢查時程
schedule:
  - cron: '0 2 * * *'  # 改為你需要的時間

# 修改觸發分支
on:
  push:
    branches: [ main, develop, your-branch ]
```

---

## 📦 NPM 腳本說明

### 核心命令

```bash
# 索引相關
npm run index:check              # 完整索引檢查
npm run index:check:incremental  # 增量檢查
npm run index:check:auto-fix     # 自動修復
npm run index:update             # 互動式維護
npm run index:health             # 健康狀態檢查

# 開發相關
npm run dev:reminder             # 開發提醒
npm run dev:start                # 開發前檢查並啟動

# 提交相關
npm run commit                   # 安全提交（含增量檢查）
npm run commit:safe              # 完整檢查後提交
```

### 命令使用建議

```bash
# 日常開發流程
npm run dev:start                # 每日開始開發時

# 提交前檢查
npm run commit                   # 快速提交
npm run commit:safe              # 重要提交

# 定期維護
npm run index:health             # 每週檢查
npm run index:update             # 每月維護
```

---

## 🎯 最佳實踐指南

### 📅 維護時程建議

#### 每日 (自動)
- ✅ Git hooks 檢查
- ✅ 開發提醒檢查
- ✅ CI/CD 自動驗證

#### 每週 (手動)
- 🔍 運行完整索引檢查
- 📊 檢查健康度報告
- 🧹 清理臨時文件

#### 每月 (手動)
- 📝 運行互動式維護
- 🔄 更新重要性分類
- 📈 評估索引架構優化

### 🚫 常見問題與解決

#### 問題 1: Git Hook 被繞過

**症狀**: 提交時沒有觸發索引檢查

**解決方案**:
```bash
# 檢查 hook 權限
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/pre-push

# 檢查 hook 內容
cat .git/hooks/pre-commit
```

#### 問題 2: VS Code 任務不顯示

**症狀**: 無法在任務列表中看到索引相關任務

**解決方案**:
```bash
# 檢查任務文件
cat .vscode/tasks.json

# 重新載入 VS Code 視窗
Ctrl+Shift+P > "Developer: Reload Window"
```

#### 問題 3: 檢查工具報告路徑錯誤

**症狀**: 檢查工具顯示文件不存在但文件確實存在

**解決方案**:
```bash
# 檢查工作目錄
pwd

# 使用絕對路徑運行
cd /path/to/project
npm run index:check

# 清理檢查緩存
rm .index-check-time
```

#### 問題 4: GitHub Actions 失敗

**症狀**: CI/CD 中索引檢查失敗

**解決方案**:
```yaml
# 檢查 workflow 日誌
# 確認依賴安裝正確
- name: Install dependencies
  run: npm ci --legacy-peer-deps

# 檢查文件權限
- name: Make scripts executable
  run: chmod +x scripts/*.js
```

### 🔧 自訂配置指南

#### 調整檢查頻率

**Git Hooks 提醒頻率**:
```bash
# 編輯 .git/hooks/post-commit
# 修改第28行的數字
if [ $((COUNT % 5)) -eq 0 ]; then  # 每5次提交提醒一次
```

**每日提醒時間**:
```yaml
# 編輯 .github/workflows/index-check.yml
schedule:
  - cron: '0 1 * * *'  # UTC 01:00 (GMT+8 09:00)
```

#### 自訂文件重要性規則

**編輯**: `scripts/check-index-sync.js`

```javascript
// 修改 getFileImportance 方法
getFileImportance(filePath) {
  const highImportancePatterns = [
    /README\.md$/,
    /.*\.config\.(js|ts|json)$/,
    /package\.json$/,
    /schema\.prisma$/,
    /(docs|src)\/.*\.md$/,
    // 添加你的規則
    /custom-pattern/
  ];
  // ... 其餘邏輯
}
```

#### 排除特定目錄

**編輯多個文件中的 avoidDirs 陣列**:
```javascript
const avoidDirs = [
  '.bmad-core',
  '.bmad-infrastructure-devops',
  'web-bundles',
  '.claude',
  '.cursor',
  '.git',
  'node_modules',
  // 添加你要排除的目錄
  'temp',
  'cache'
];
```

---

## 📊 監控與報告

### 健康度指標

系統提供多維度的健康度監控：

#### 索引準確率
- **定義**: 索引中引用的文件實際存在的比例
- **目標**: > 95%
- **檢查**: `npm run index:check`

#### 覆蓋率
- **定義**: 重要文件被索引覆蓋的比例
- **目標**: > 90%
- **檢查**: `npm run index:health`

#### 活躍度
- **定義**: 最近文件變更和索引維護的頻率
- **監控**: `npm run dev:reminder`

### 報告文件說明

#### index-sync-report.json
```json
{
  "timestamp": "檢查時間",
  "summary": {
    "totalIssues": "總問題數",
    "highSeverity": "嚴重問題數",
    "suggestions": "改進建議數"
  },
  "issues": ["問題列表"],
  "suggestions": ["建議列表"]
}
```

#### index-maintenance-report.json
```json
{
  "timestamp": "維護時間",
  "processed": "處理文件數",
  "skipped": "跳過文件數",
  "changes": ["變更列表"]
}
```

---

## 🎉 成功案例與效果

### 預期效果

實施索引同步提醒系統後，你可以期待：

#### 🎯 短期效果 (1-2週)
- ✅ 提交時自動檢查索引
- ✅ 新文件及時納入索引
- ✅ 索引錯誤快速發現

#### 📈 中期效果 (1-2個月)
- ✅ 團隊養成索引維護習慣
- ✅ 索引質量顯著提升
- ✅ AI 助手找檔效率提高

#### 🚀 長期效果 (3個月+)
- ✅ 項目文檔管理自動化
- ✅ 知識管理體系完善
- ✅ 開發效率整體提升

### 成功指標

- **索引準確率**: 98%+
- **覆蓋率**: 95%+
- **問題發現時間**: < 24小時
- **修復時間**: < 1小時

---

## 🆘 故障排除指南

### 緊急修復流程

如果系統出現嚴重問題：

```bash
# 1. 停用所有檢查
mv .git/hooks/pre-commit .git/hooks/pre-commit.bak
mv .git/hooks/pre-push .git/hooks/pre-push.bak

# 2. 清理緩存
rm -f .index-check-time
rm -f .dev-reminder-data

# 3. 重新初始化
npm run index:check
npm run index:update

# 4. 重新啟用檢查
mv .git/hooks/pre-commit.bak .git/hooks/pre-commit
mv .git/hooks/pre-push.bak .git/hooks/pre-push
chmod +x .git/hooks/pre-commit .git/hooks/pre-push
```

### 聯繫支援

如果遇到無法解決的問題：

1. 📊 收集診斷信息：
```bash
npm run index:check > debug.log 2>&1
npm run dev:reminder >> debug.log 2>&1
```

2. 📝 描述問題：
   - 問題現象
   - 觸發條件
   - 錯誤訊息
   - 環境信息

3. 📋 提供相關文件：
   - debug.log
   - index-sync-report.json
   - package.json

---

**🎯 記住：索引同步提醒系統的目標是讓團隊能夠輕鬆維護項目文檔，提高 AI 助手的工作效率。定期使用和適當維護是成功的關鍵！**