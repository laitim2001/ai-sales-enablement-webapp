# 🎯 情況2: 開發前準備 - 架構驗證與需求分析

> **使用時機**: 準備開發新功能或修復現有功能之前
> **目標**: 驗證架構支持、了解相關代碼、制定開發計劃
> **預計時間**: 10-15分鐘

---

## 📋 執行清單

### 第1步: 了解需求和目標

```markdown
明確開發目標:

問自己/用戶以下問題:
1. 這是新功能開發還是現有功能修復/優化?
2. 功能的核心需求是什麼? (用一句話概括)
3. 預期的使用場景是什麼?
4. 有哪些驗收標準?
5. 是否有時間限制或優先級要求?

記錄答案以便後續參考。
```

### 第2步: 檢查項目架構

```markdown
閱讀架構文檔:

@docs/2-architecture/architecture.md
- 系統整體架構
- 各層職責劃分
- 技術選型

@docs/2-architecture/api-gateway-architecture.md (如涉及API)
- API架構設計
- 安全層設計

@docs/2-architecture/workflow-engine-design.md (如涉及工作流)
- 工作流引擎設計
```

### 第3步: 驗證架構是否支持新需求

```markdown
架構適配性檢查:

對於新功能:
- [ ] 現有架構是否支持這個功能?
- [ ] 需要新增哪些模塊或服務?
- [ ] 是否會影響現有架構?
- [ ] 是否需要更新架構文檔?

對於修復/優化:
- [ ] 問題根源是架構問題還是實現問題?
- [ ] 修復是否需要架構調整?
- [ ] 是否會影響其他模塊?
```

### 第4步: 查找相關現有代碼

```markdown
使用 Grep 工具搜索相關代碼:

# 搜索相關功能實現
Grep(pattern="<功能關鍵詞>", output_mode="files_with_matches")

# 搜索相關API端點
Grep(pattern="<API路徑>", glob="app/api/**/*.ts")

# 搜索相關組件
Grep(pattern="<組件名>", glob="components/**/*.tsx")

# 搜索相關數據模型
Grep(pattern="model <模型名>", glob="prisma/schema.prisma")

閱讀找到的相關文件,了解現有實現方式。
```

### 第5步: 檢查相關測試

```markdown
查看現有測試:

# 搜索相關測試文件
Grep(pattern="<功能名>.*test", glob="**/*.test.ts")

# 檢查UAT測試計劃
@claudedocs/3-progress/UAT-TEST-PROGRESS-TRACKER.md
- 查看是否有相關測試用例
- 了解測試範圍和標準
```

### 第6步: 檢查依賴和整合點

```markdown
依賴關係檢查:

對於新功能:
- [ ] 需要整合哪些外部服務? (Azure OpenAI, Dynamics 365, Microsoft Graph等)
- [ ] 需要新增哪些依賴包?
- [ ] 是否需要環境變量配置?

對於修復/優化:
- [ ] 這個修復會影響哪些其他功能?
- [ ] 需要更新哪些整合點?
- [ ] 是否需要數據遷移?

參考文檔:
@docs/4-setup-guides/ (查看整合設置指南)
```

### 第7步: 檢查安全和權限要求

```markdown
安全性檢查:

@claudedocs/2-sprints/sprint-3/sprint3-rbac-design-document.md
- 了解RBAC權限設計
- 確定功能需要的權限級別

問題清單:
- [ ] 這個功能需要什麼權限級別? (VIEWER/EDITOR/MANAGER/ADMIN/SUPERADMIN)
- [ ] 涉及哪些資源類型?
- [ ] 需要哪些操作權限? (CREATE/READ/UPDATE/DELETE等)
- [ ] 是否需要字段級權限控制?
- [ ] 是否涉及敏感數據加密?
```

### 第8步: 制定開發計劃

```markdown
使用 TodoWrite 制定詳細計劃:

TodoWrite({
  todos: [
    {content: "分析需求並驗證架構支持", status: "completed"},
    {content: "設計數據模型/API接口", status: "in_progress"},
    {content: "實施後端邏輯", status: "pending"},
    {content: "實施前端UI", status: "pending"},
    {content: "編寫單元測試", status: "pending"},
    {content: "編寫E2E測試", status: "pending"},
    {content: "更新文檔", status: "pending"},
    {content: "執行UAT測試", status: "pending"},
    {content: "代碼審查", status: "pending"},
    {content: "提交到GitHub", status: "pending"}
  ]
})

根據實際情況調整todo項目。
```

---

## 📂 架構文檔快速參考

### 系統架構
- **總體架構**: `docs/2-architecture/architecture.md`
- **API網關架構**: `docs/2-architecture/api-gateway-architecture.md`
- **工作流引擎**: `docs/2-architecture/workflow-engine-design.md`
- **未來創新**: `docs/2-architecture/future-innovations.md`

### API規範
- **API總規範**: `docs/3-api-specs/api-specification.md`
- **前端規範**: `docs/3-api-specs/front-end-spec.md`
- **Knowledge Base API**: `docs/3-api-specs/api/knowledge-base-api.md`

### 技術文檔
- **安全標準**: `docs/6-technical-docs/security-standards.md`
- **測試策略**: `docs/6-technical-docs/testing-strategy.md`
- **性能指南**: `docs/6-technical-docs/performance-implementation-guide.md`

### Sprint設計文檔
- **RBAC設計**: `claudedocs/2-sprints/sprint-3/sprint3-rbac-design-document.md`
- **細粒度權限**: `claudedocs/2-sprints/sprint-3/sprint3-week9-fine-grained-permissions-design.md`
- **安全掃描報告**: `claudedocs/2-sprints/sprint-3/sprint3-security-scan-report.md`

---

## 💡 架構驗證檢查表

### 新功能開發檢查

- [ ] **數據層**
  - [ ] 是否需要新的Prisma模型?
  - [ ] 是否需要數據庫遷移?
  - [ ] 是否需要數據關聯?

- [ ] **業務邏輯層**
  - [ ] 是否需要新的服務類?
  - [ ] 是否需要新的業務邏輯?
  - [ ] 是否需要緩存策略?

- [ ] **API層**
  - [ ] 是否需要新的API端點?
  - [ ] 是否需要新的路由?
  - [ ] 是否需要API文檔更新?

- [ ] **UI層**
  - [ ] 是否需要新的React組件?
  - [ ] 是否需要新的頁面路由?
  - [ ] 是否需要shadcn/ui新組件?

- [ ] **整合層**
  - [ ] 是否需要Azure OpenAI整合?
  - [ ] 是否需要Microsoft Graph整合?
  - [ ] 是否需要Dynamics 365整合?

- [ ] **安全層**
  - [ ] 是否需要RBAC權限配置?
  - [ ] 是否需要審計日誌?
  - [ ] 是否需要數據加密?

### 現有功能修復/優化檢查

- [ ] **影響範圍分析**
  - [ ] 修改會影響哪些文件?
  - [ ] 修改會影響哪些功能?
  - [ ] 是否需要更新測試?

- [ ] **向後兼容性**
  - [ ] 修改是否向後兼容?
  - [ ] 是否需要數據遷移?
  - [ ] 是否需要API版本升級?

- [ ] **性能影響**
  - [ ] 修改是否影響性能?
  - [ ] 是否需要性能測試?
  - [ ] 是否需要緩存調整?

---

## 🔍 代碼搜索技巧

### 搜索模式示例

```bash
# 搜索特定功能的API端點
Grep(pattern="export.*POST.*knowledge", glob="app/api/**/*.ts")

# 搜索React組件
Grep(pattern="export.*function.*<組件名>", glob="components/**/*.tsx")

# 搜索Prisma模型
Grep(pattern="model <模型名>", glob="prisma/schema.prisma")

# 搜索權限檢查
Grep(pattern="requireRole|checkPermission", glob="**/*.ts")

# 搜索測試文件
Grep(pattern="describe.*<功能名>", glob="**/*.test.ts")
```

---

## ✅ 開發前完成檢查

在開始編寫代碼之前,請確認:

- [ ] ✅ 已明確需求和驗收標準
- [ ] ✅ 已閱讀相關架構文檔
- [ ] ✅ 已驗證架構支持新需求
- [ ] ✅ 已搜索並理解相關現有代碼
- [ ] ✅ 已檢查相關測試
- [ ] ✅ 已確認依賴和整合點
- [ ] ✅ 已確認安全和權限要求
- [ ] ✅ 已制定詳細的 TodoWrite 計劃
- [ ] ✅ 已識別潛在的風險和挑戰
- [ ] ✅ 已準備好開始開發

---

## 🚀 下一步

完成開發前準備後:

- **如果要修改現有功能**: 使用 `03-existing-feature.md`
- **如果要開發全新功能**: 使用 `04-new-feature.md`

---

**創建日期**: 2025-10-08
**最後更新**: 2025-10-08
