# 🎯 AI助手提示詞管理系統

> **用途**: 為不同開發場景提供標準化的AI助手指引
> **受眾**: 開發人員、AI助手
> **最後更新**: 2025-10-08

---

## 📂 提示詞分類

### 📥 **會話開始提示詞** (`session-start/`)
用於每次新對話開始時,幫助AI助手快速了解項目和準備工作環境。

| 文件 | 場景 | 使用時機 |
|------|------|---------|
| `01-quick-start.md` | 情況1: 項目快速入門 | 新AI助手會話開始 |
| `02-dev-preparation.md` | 情況2: 開發前準備 | 準備開發新功能或修復問題前 |

### 🛠️ **開發過程提示詞** (`development/`)
用於開發和測試過程中,指導AI助手執行特定開發任務。

| 文件 | 場景 | 使用時機 |
|------|------|---------|
| `03-existing-feature.md` | 情況3: 舊功能開發測試 | 修改或優化現有功能 |
| `04-new-feature.md` | 情況4: 新功能開發測試 | 開發全新功能 |

### 💾 **進度管理提示詞** (`progress/`)
用於保存進度、維護索引和同步到GitHub。

| 文件 | 場景 | 使用時機 |
|------|------|---------|
| `05-save-progress.md` | 情況5: 進度保存與同步 | 任何工作階段結束或需要保存時 |

---

## 🎯 快速使用指南

### 方法1: 直接引用文件 (推薦)

在Claude Code中使用 `@` 符號引用對應的prompt文件:

```
@claudedocs/6-ai-assistant/prompts/session-start/01-quick-start.md
```

### 方法2: 複製貼上

直接打開對應的prompt文件,複製內容貼到對話中。

### 方法3: 自定義組合

根據需要組合多個prompt文件的內容。

---

## 📋 使用流程示例

### 場景1: 開始新的開發會話

```markdown
第1步: 引用項目快速入門
@claudedocs/6-ai-assistant/prompts/session-start/01-quick-start.md

第2步 (可選): 如果要開發新功能,再引用開發前準備
@claudedocs/6-ai-assistant/prompts/session-start/02-dev-preparation.md
```

### 場景2: 開發過程中

```markdown
如果是修改現有功能:
@claudedocs/6-ai-assistant/prompts/development/03-existing-feature.md

如果是開發新功能:
@claudedocs/6-ai-assistant/prompts/development/04-new-feature.md
```

### 場景3: 工作結束保存進度

```markdown
@claudedocs/6-ai-assistant/prompts/progress/05-save-progress.md
```

---

## 🔄 提示詞維護

### 更新原則
1. ✅ 根據實際使用經驗持續優化
2. ✅ 保持簡潔明確,避免冗長
3. ✅ 使用清單格式,便於AI助手執行
4. ✅ 包含具體的文件路徑和命令示例

### 版本控制
- 所有提示詞文件納入Git版本控制
- 重大更新需在DEVELOPMENT-LOG.md記錄
- 保持與項目文檔結構同步

### 貢獻指南
如果發現提示詞可以改進:
1. 記錄改進建議
2. 測試新的提示詞
3. 更新對應文件
4. 提交到GitHub

---

## 📊 提示詞模板結構

每個提示詞文件應包含:

```markdown
# 🎯 [場景名稱]

## 📋 執行清單
- [ ] 步驟1
- [ ] 步驟2
...

## 📂 相關文件
- 文件1路徑
- 文件2路徑

## 💡 注意事項
- 注意事項1
- 注意事項2

## ✅ 完成檢查
- [ ] 檢查項1
- [ ] 檢查項2
```

---

## 🔗 相關文檔

- **AI助手指南**: `claudedocs/6-ai-assistant/AI-ASSISTANT-GUIDE.md`
- **項目索引**: `claudedocs/6-ai-assistant/PROJECT-INDEX.md`
- **索引維護指南**: `claudedocs/6-ai-assistant/INDEX-MAINTENANCE-GUIDE.md`
- **開發服務管理**: `claudedocs/6-ai-assistant/DEVELOPMENT-SERVICE-MANAGEMENT.md`

---

**最後更新**: 2025-10-08 by Claude AI Assistant
