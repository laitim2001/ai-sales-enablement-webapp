# 📚 文檔結構重組計劃

> **創建日期**: 2025-10-08
> **狀態**: 規劃中
> **目標**: 建立清晰、系統化的文檔結構，支持長期開發和AI助手協作

---

## 🎯 **重組目標**

### **核心目標**:
1. ✅ **清晰分離**: /docs (正式文檔) vs /claudedocs (AI工作文檔)
2. ✅ **系統化分類**: 按功能和階段分類，而非平面堆疊
3. ✅ **易於導航**: 直觀的目錄結構，快速找到所需文檔
4. ✅ **動態追蹤**: 開發進度和狀態實時更新
5. ✅ **歷史歸檔**: 完成的階段文檔有序歸檔

---

## 📂 **新的文檔結構**

### **📘 /docs - 正式項目文檔庫**

```
docs/
├── 1-requirements/                 # 需求分析和規劃
│   ├── prd.md                      # 產品需求文檔
│   ├── project-brief-draft.md      # 項目簡報
│   ├── project-background.md       # 項目背景
│   ├── planning-summary.md         # 規劃總結
│   ├── mvp-development-plan.md     # MVP開發計劃
│   ├── mvp2-development-plan.md    # MVP2開發計劃
│   └── technical-feasibility-report.md
│
├── 2-architecture/                 # 架構設計
│   ├── architecture.md             # 系統架構
│   ├── api-gateway-architecture.md # API網關架構
│   ├── api-gateway-decision.md     # API網關決策
│   └── future-innovations.md       # 未來創新
│
├── 3-api-specs/                    # API規格
│   ├── api-specification.md        # API規格
│   ├── front-end-spec.md           # 前端規格
│   └── api/                        # API詳細文檔
│       └── (現有api文件夾內容)
│
├── 4-setup-guides/                 # 環境設置指南
│   ├── NEW-DEVELOPER-SETUP-GUIDE.md
│   ├── azure-openai-setup-guide.md
│   ├── dynamics365-setup-guide.md
│   ├── microsoft-graph-setup-guide.md
│   ├── sprint3-security-setup-guide.md
│   └── sprint3-disaster-recovery-guide.md
│
├── 5-user-stories/                 # 用戶故事
│   ├── index.md
│   ├── epic-1/
│   ├── epic-2/
│   ├── epic-3/
│   └── epic-4/
│
└── 6-technical-docs/               # 技術文檔
    ├── performance-audit-2025.md
    ├── performance-implementation-guide.md
    ├── monitoring-operations-manual.md
    ├── monitoring-usage-examples.md
    ├── monitoring-migration-strategy.md
    ├── azure-monitor-migration-checklist.md
    └── workflow-testing-guide.md
```

---

### **🤖 /claudedocs - AI助手工作文檔庫**

```
claudedocs/
├── 1-planning/                     # 總體規劃
│   ├── README.md                   # 規劃文檔說明
│   ├── master-roadmap.md           # 主路線圖
│   ├── master-development-plan.md  # 主開發計劃
│   ├── sprint-overview.md          # Sprint總覽
│   └── mvp2-user-stories-mapping.md
│
├── 2-sprints/                      # Sprint詳細文檔
│   ├── README.md                   # Sprint文檔說明
│   ├── sprint-1/
│   │   ├── sprint-1-plan.md
│   │   ├── sprint-1-implementation.md
│   │   └── sprint-1-retrospective.md
│   ├── sprint-2/
│   ├── sprint-3/
│   │   ├── sprint3-rbac-design-document.md
│   │   ├── sprint3-security-scan-report.md
│   │   └── sprint3-week9-fine-grained-permissions-design.md
│   ├── sprint-4/
│   ├── sprint-5/
│   ├── sprint-6/
│   └── sprint-7/
│       ├── sprint7-uat-test-plan.md
│       ├── sprint7-uat-execution-report.md
│       ├── sprint7-uat-final-report.md
│       └── sprint7-uat-final-report-v2.md
│
├── 3-progress/                     # 進度追蹤
│   ├── README.md                   # 進度追蹤說明
│   ├── mvp-implementation-checklist.md        # MVP Phase 1清單 (已完成)
│   ├── mvp2-implementation-checklist.md       # MVP Phase 2清單 (進行中)
│   ├── UAT-TEST-PROGRESS-TRACKER.md          # UAT測試進度
│   ├── mvp-progress-report.json              # 進度報告JSON
│   ├── current-sprint-status.md              # 當前Sprint狀態
│   └── milestone-tracker.md                  # 里程碑追蹤
│
├── 4-changes/                      # 變更記錄
│   ├── README.md                   # 變更記錄說明
│   ├── DEVELOPMENT-LOG.md          # 開發日誌 (最新在上)
│   ├── FIXLOG.md                   # 修復日誌 (最新在上)
│   ├── mvp2-sprint-adjustment-decision.md    # Sprint調整決策
│   ├── architecture-changes/       # 架構變更
│   │   └── (按時間歸檔)
│   └── scope-adjustments/          # 範圍調整
│       └── (按時間歸檔)
│
├── 5-status/                       # 狀態報告
│   ├── README.md                   # 狀態報告說明
│   ├── current-status.md           # 當前狀態總覽
│   ├── weekly-reports/             # 週報
│   │   ├── 2025-week-40.md
│   │   └── ...
│   ├── verification-reports/       # 驗證報告
│   │   ├── mvp2-implementation-verification-report.md
│   │   ├── mvp1-mvp2-complete-verification-report.md
│   │   ├── mvp2-checklist-sync-report.md
│   │   └── HOW-TO-USE-VERIFICATION-REPORTS.md
│   ├── optimization-tracking/      # 優化追蹤
│   │   └── mvp2-optimization-tracking.md
│   ├── testing-reports/            # 測試報告
│   │   ├── COMPLETE-UAT-TEST-PLAN.md
│   │   ├── UAT-AUTH-FIX-SUMMARY.md
│   │   ├── UAT-TEST-ISSUES-ANALYSIS.md
│   │   └── MVP2-TESTING-GUIDE.md
│   └── load-testing/               # 負載測試
│       ├── load-testing-plan.md
│       ├── load-testing-execution-guide.md
│       ├── load-testing-summary.md
│       └── load-test-execution-report-2025-10-07.md
│
├── 6-ai-assistant/                 # AI助手指引
│   ├── README.md                   # AI助手指引說明
│   ├── AI-ASSISTANT-GUIDE.md       # AI助手快速參考
│   ├── PROJECT-INDEX.md            # 項目索引
│   ├── INDEX-MAINTENANCE-GUIDE.md  # 索引維護指南
│   ├── DEVELOPMENT-SERVICE-MANAGEMENT.md     # 服務管理
│   ├── project-context.md          # 項目上下文
│   └── ai-workflows/               # AI工作流程
│       ├── code-comments/          # 代碼註釋工作流
│       │   ├── ai-comment-context-analysis.md
│       │   ├── ai-comment-reference-documents.md
│       │   ├── ai-comments-completion-report.md
│       │   ├── code-comments-enhancement-plan.md
│       │   ├── code-comments-qa.md
│       │   └── post-ai-comments-compliance-check-report.md
│       ├── index-maintenance/      # 索引維護工作流
│       │   ├── index-maintenance-improvement-log.md
│       │   ├── index-maintenance-root-cause-analysis.md
│       │   ├── INDEX-REMINDER-SETUP.md
│       │   └── project-index-smart-analysis-report.md
│       └── typescript-fixes/       # TypeScript修復工作流
│           └── type-errors-fix-progress-report.md
│
└── 7-archive/                      # 歷史歸檔
    ├── README.md                   # 歸檔說明
    ├── completed-sprints/          # 已完成的Sprint
    │   └── (按Sprint編號歸檔)
    ├── old-reports/                # 舊報告
    │   └── (按時間歸檔)
    └── deprecated-docs/            # 已廢棄文檔
        └── (按時間歸檔)
```

---

## 📋 **文檔遷移清單**

### **階段 1: 創建新目錄結構**
- [ ] 創建 /docs 子目錄 (6個分類)
- [ ] 創建 /claudedocs 子目錄 (7個分類)
- [ ] 創建各子目錄的 README.md 說明文件

### **階段 2: 遷移 /docs 文檔**
- [ ] 遷移需求分析文檔到 1-requirements/
- [ ] 遷移架構設計文檔到 2-architecture/
- [ ] 遷移API規格文檔到 3-api-specs/
- [ ] 遷移設置指南到 4-setup-guides/
- [ ] 確認user-stories/已在正確位置 (5-user-stories/)
- [ ] 遷移技術文檔到 6-technical-docs/

### **階段 3: 遷移 /claudedocs 文檔**
- [ ] 遷移規劃文檔到 1-planning/
- [ ] 遷移Sprint文檔到 2-sprints/
- [ ] 遷移進度追蹤文檔到 3-progress/
- [ ] 遷移變更記錄到 4-changes/
- [ ] 遷移狀態報告到 5-status/
- [ ] 整理AI助手指引到 6-ai-assistant/
- [ ] 創建歸檔結構 7-archive/

### **階段 4: 清理和驗證**
- [ ] 刪除原位置的已遷移文檔
- [ ] 更新所有文檔間的相互引用路徑
- [ ] 更新 PROJECT-INDEX.md
- [ ] 更新 AI-ASSISTANT-GUIDE.md
- [ ] 執行完整性驗證

### **階段 5: 創建主文檔**
- [ ] 創建 claudedocs/1-planning/master-roadmap.md
- [ ] 創建 claudedocs/1-planning/master-development-plan.md
- [ ] 創建 claudedocs/3-progress/current-sprint-status.md
- [ ] 創建 claudedocs/5-status/current-status.md
- [ ] 創建所有README.md文件

---

## 🎯 **預期成果**

### **改善效果**:
1. ✅ **清晰導航**: 5秒內找到所需文檔
2. ✅ **角色分離**: 正式文檔 vs AI工作文檔明確區分
3. ✅ **進度可視**: 當前狀態一目了然
4. ✅ **歷史追溯**: 完整的開發歷史可查
5. ✅ **AI友好**: 結構化目錄便於AI快速定位

### **維護原則**:
- 📝 **新文檔**: 創建時直接放入正確分類
- 🔄 **階段完成**: 及時歸檔到 7-archive/
- 📊 **定期審查**: 每Sprint結束檢查文檔分類
- 🗑️ **及時清理**: 刪除過時或重複文檔

---

## 📅 **執行時間表**

| 階段 | 工作內容 | 預計時間 | 負責人 |
|------|---------|---------|--------|
| 階段1 | 創建目錄結構 | 30分鐘 | AI助手 |
| 階段2 | 遷移/docs文檔 | 1小時 | AI助手 |
| 階段3 | 遷移/claudedocs文檔 | 1.5小時 | AI助手 |
| 階段4 | 清理和驗證 | 1小時 | AI助手 |
| 階段5 | 創建主文檔 | 1小時 | AI助手 |
| **總計** | **完整重組** | **5小時** | **AI助手** |

---

## ✅ **驗收標準**

- [ ] 所有文檔都在正確的分類目錄中
- [ ] 沒有重複的文檔
- [ ] 所有相互引用路徑已更新
- [ ] PROJECT-INDEX.md 完整更新
- [ ] AI-ASSISTANT-GUIDE.md 反映新結構
- [ ] 所有子目錄都有README.md說明
- [ ] 用戶確認新結構易於使用

---

**文檔版本**: 1.0
**最後更新**: 2025-10-08
**狀態**: ⏳ 待執行
