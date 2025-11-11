# 🎯 情況1: 項目快速入門 - AI助手快速啟動指南

> **使用時機**: 每次新的AI助手會話開始時
> **目標**: 快速了解項目背景、結構、當前狀態
> **預計時間**: 3-5分鐘

---

## 📋 執行清單

請按順序執行以下步驟:

### 第1步: 閱讀核心指南文檔 (必讀)

```markdown
請閱讀以下3個核心文檔:

1. @claudedocs/6-ai-assistant/AI-ASSISTANT-GUIDE.md
   - 了解AI助手的基本執行規則
   - 了解必須遵循的工作流程
   - 查看最近的更新記錄

2. @claudedocs/5-status/current-status.md
   - 了解項目當前狀態
   - 查看正在進行的Sprint
   - 了解當前風險和優先級

3. @claudedocs/6-ai-assistant/PROJECT-INDEX.md
   - 了解項目文件結構
   - 查看重要文件索引
   - 理解文檔組織方式
```

### 第2步: 快速了解項目背景

```markdown
閱讀項目概述:

@claudedocs/1-planning/master-roadmap.md (只讀前50行)
- 項目願景
- 技術棧
- 當前階段

@docs/1-requirements/project-background.md
- 項目背景
- 核心需求
```

### 第3步: 了解當前進度

```markdown
查看進度文檔:

@claudedocs/3-progress/mvp2-implementation-checklist.md (只讀前100行)
- MVP Phase 2 總體進度
- 當前完成的Sprint
- 待完成的工作

@claudedocs/3-progress/UAT-TEST-PROGRESS-TRACKER.md (只讀前50行)
- UAT測試進度
- 已完成的測試
- 待執行的測試
```

### 第4步: 檢查最近的變更

```markdown
閱讀最新開發記錄:

@claudedocs/4-changes/DEVELOPMENT-LOG.md (只讀最新5條記錄)
- 最近的開發活動
- 最近完成的功能
- 最近修復的問題
```

---

## 🎯 快速問答檢查

完成上述閱讀後,請回答以下問題以確認理解:

### 項目基本信息
- [ ] 這個項目是做什麼的? (用一句話概括)
- [ ] 當前使用的技術棧是什麼?
- [ ] 項目目前在哪個階段?

### 當前狀態
- [ ] 當前正在進行哪些Sprint?
- [ ] 當前Sprint的完成度是多少?
- [ ] 有哪些優先級最高的任務?

### 文檔結構
- [ ] /docs 和 /claudedocs 的區別是什麼?
- [ ] 在哪裡可以找到開發日誌?
- [ ] 在哪裡可以查看UAT測試進度?

---

## 📂 核心文件快速參考

### 規劃文檔
- **主路線圖**: `claudedocs/1-planning/master-roadmap.md`
- **主開發計劃**: `claudedocs/1-planning/master-development-plan.md`
- **當前狀態**: `claudedocs/5-status/current-status.md`

### 進度追蹤
- **MVP Phase 2清單**: `claudedocs/3-progress/mvp2-implementation-checklist.md`
- **UAT測試追蹤**: `claudedocs/3-progress/UAT-TEST-PROGRESS-TRACKER.md`

### 變更記錄
- **開發日誌**: `claudedocs/4-changes/DEVELOPMENT-LOG.md`
- **修復日誌**: `claudedocs/4-changes/FIXLOG.md`

### AI助手指南
- **AI助手指南**: `claudedocs/6-ai-assistant/AI-ASSISTANT-GUIDE.md`
- **項目索引**: `claudedocs/6-ai-assistant/PROJECT-INDEX.md`
- **索引維護指南**: `claudedocs/6-ai-assistant/INDEX-MAINTENANCE-GUIDE.md`

---

## 💡 重要提醒

### 🇨🇳 語言要求
- ✅ **永遠使用繁體中文**與用戶溝通
- ✅ 即使在 conversation compact 之後也要保持中文

### 📋 工作流程
- ✅ 開發前必須先制定 **TodoWrite** 清單
- ✅ 每個todos完成後更新 **DEVELOPMENT-LOG.md**
- ✅ 所有代碼必須添加**完整中文註釋**
- ✅ 發現bug必須更新 **FIXLOG.md**

### 🔍 索引維護
- ✅ 創建新文件後執行**索引維護**
- ✅ 參考 `INDEX-MAINTENANCE-GUIDE.md`

---

## ✅ 完成檢查

在開始任何開發工作之前,請確認:

- [ ] ✅ 已閱讀 AI-ASSISTANT-GUIDE.md
- [ ] ✅ 已閱讀 current-status.md
- [ ] ✅ 已閱讀 PROJECT-INDEX.md
- [ ] ✅ 了解項目背景和目標
- [ ] ✅ 了解當前進度和優先級
- [ ] ✅ 了解最近的變更
- [ ] ✅ 清楚文檔結構和重要文件位置
- [ ] ✅ 準備好使用繁體中文溝通

---

## 🚀 下一步

完成快速入門後,根據你的任務類型:

- **如果要開發新功能或修復問題**: 使用 `02-dev-preparation.md`
- **如果要修改現有功能**: 使用 `03-existing-feature.md`
- **如果要開發全新功能**: 使用 `04-new-feature.md`
- **如果要保存進度**: 使用 `05-save-progress.md`

---

**創建日期**: 2025-10-08
**最後更新**: 2025-10-08
