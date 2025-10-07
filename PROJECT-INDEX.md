# 📁 AI 銷售賦能平台 - 主索引目錄

> **🎯 目的**: 為 AI 助手提供快速導航和文件查找指南
> **📅 最後更新**: 2025年10月7日 - Sprint 3 Week 9 欄位級別權限控制完成
> **🔍 使用方法**: AI 助手應首先查看此文件以了解項目結構和文件位置
>
> **✨ 最新添加**:
> - 📊 MVP1+MVP2完整驗證分析完成 (2025-10-07): 史詩級完整驗證報告（2400+行，13個Sprint驗證，91%完成度，4.8/5評級，企業級就緒確認）
> - 📊 MVP2實施驗證報告 (2025-10-07): 完整驗證報告（1115行，7個Sprint驗證，88%完成度，4.5/5評級，生產就緒確認）
> - 🔐 Sprint 3 Week 9 細粒度權限控制擴展: 操作級別限制服務 + 統一權限入口 + Security模塊導出（action-restrictions.ts + fine-grained-permissions.ts + index.ts, 35個測試100%通過）
> - 🔐 Sprint 3 Week 9 細粒度權限控制: 欄位級別權限服務 + 完整測試套件（field-level-permissions.ts + 設計文檔, 33個測試100%通過）
> - 🧪 Sprint 7 UAT測試報告v2: 問題調查和修復驗證報告（sprint7-uat-final-report-v2.md, 通過率89.5%，TC-PREP005/008環境問題已解決）
> - 🔐 資料安全強化 (Sprint 3 Week 5): 敏感欄位配置模塊（sensitive-fields-config.ts）
> - 📅 Microsoft Graph日曆整合 (Sprint 7 Phase 3): Mock服務 + 設置指南
> - 🤝 協作系統 (Sprint 6): 編輯鎖定管理器 + API + UI組件
> - ⏰ 智能提醒系統 (Sprint 7 Phase 1): 規則引擎 + 調度器 + API + UI組件

---

## 📋 目錄分類說明

### 🏗️ 項目核心文件 (主要工作區域)

這些是與 AI 銷售賦能平台直接相關的業務和技術文件

### 🛠️ 開發工具文件 (輔助系統)

這些是支援開發過程的工具、框架和自動化文件

### 🗂️ 系統配置文件 (環境設定)

這些是項目配置、部署和環境設定相關文件

---

## 🏗️ 項目核心文件結構

### 📚 docs/ - 項目文檔中心

**用途**: 所有項目相關的業務和技術文檔

**📊 進度追蹤文件**:
- `docs/mvp-implementation-checklist.md` - MVP Phase 1 實施進度檢查清單 (已完成100%)
- `docs/mvp2-implementation-checklist.md` - MVP Phase 2 實施進度檢查清單 (進行中 83%，Sprint 1 + 2 + 4 + 5 完成，Sprint 6 進行中 75%)

| 文檔類型           | 文件路徑        | 用途說明                       | 重要程度 |
| ------------------ | --------------- | ------------------------------ | -------- |
| **需求文檔** | `docs/prd.md` | 產品需求文檔，項目核心業務需求 | 🔴 極高  |

### 📖 docs/ - 項目文檔和規格

**用途**: 完整的項目文檔、API 規格、架構設計和開發指南

#### 📖 API 技術文檔 (docs/api/)

| 文檔類型                     | 文件路徑                           | 用途說明                           | 重要程度 |
| ---------------------------- | ---------------------------------- | ---------------------------------- | -------- |
| **Knowledge Base API** | `docs/api/knowledge-base-api.md` | 知識庫 API 完整文檔，包含 6 個端點 | 🔴 極高  |

#### 📋 項目核心文檔 (docs/)

| 文檔類型                 | 文件路徑                                 | 用途說明             | 重要程度 |
| ------------------------ | ---------------------------------------- | -------------------- | -------- |
| **API 規格書**     | `docs/api-specification.md`            | 完整 API 規格定義    | 🟡 高    |
| **系統架構**       | `docs/architecture.md`                 | 系統架構設計文檔     | 🔴 極高  |
| **前端規格**       | `docs/front-end-spec.md`               | 前端開發規格和指南   | 🟡 高    |
| **索引提醒設置**   | `docs/INDEX-REMINDER-SETUP.md`         | 索引同步提醒系統設置 | 🟢 中    |
| **索引維護改進記錄** | `docs/index-maintenance-improvement-log.md` | 索引維護機制改進記錄（2025-10-01核心代碼檢測擴展） | 🟡 高    |
| **MVP Phase 1 開發計劃** | `docs/mvp-development-plan.md`   | MVP Phase 1完整開發計劃（✅已100%完成） | 🔴 極高  |
| **MVP Phase 1 實施清單** | `docs/mvp-implementation-checklist.md` | MVP Phase 1實施進度追蹤（✅已100%完成） | 🟡 高    |
| **MVP Phase 2 開發計劃** | `docs/mvp2-development-plan.md`  | MVP Phase 2完整開發計劃（14週，A+C混合方案） | 🔴 極高  |
| **MVP Phase 2 實施清單** | `docs/mvp2-implementation-checklist.md` | MVP Phase 2實施進度追蹤（14週，54項檢查清單） | 🔴 極高  |
| **MVP Phase 2 用戶故事映射** | `docs/mvp2-user-stories-mapping.md` | MVP Phase 2的9個功能詳細規劃和優先級 | 🔴 極高  |
| **MVP Phase 2 Sprint調整決策** | `docs/mvp2-sprint-adjustment-decision.md` | Sprint重新分配決策記錄（Story 3.3移至Sprint 6） | 🔴 極高  |
| **語音功能戰略定位決策** | `docs/voice-feature-strategic-decision.md` | 語音功能延後決策分析（選項A/B/C評估） | 🔴 極高  |
| **API Gateway技術決策** | `docs/api-gateway-decision.md` | API Gateway技術選型評估（AWS/Kong/Next.js）決策：選項C | 🔴 極高  |
| **API Gateway架構設計** | `docs/api-gateway-architecture.md` | API Gateway完整架構設計（Next.js Middleware + 自定義方案） | 🔴 極高  |
| **未來創新功能記錄** | `docs/future-innovations.md`     | 選項B創新功能（實時語音助理等）完整藍圖 | 🟡 高    |
| **規劃總結**       | `docs/planning-summary.md`             | 項目規劃總結文檔     | 🟡 高    |
| **產品需求文檔**   | `docs/prd.md`                          | 完整 PRD 文檔        | 🔴 極高  |
| **項目背景**       | `docs/project-background.md`           | 項目背景和商業價值   | 🟡 高    |
| **項目概要草案**   | `docs/project-brief-draft.md`          | 項目概要草案         | 🟢 中    |
| **安全標準**       | `docs/security-standards.md`           | 安全開發標準和規範   | 🟡 高    |
| **xlsx安全評估報告** | `docs/xlsx-security-assessment.md`   | xlsx套件安全漏洞評估和緩解方案 | 🟡 高    |
| **技術可行性報告** | `docs/technical-feasibility-report.md` | 技術可行性分析報告   | 🟡 高    |
| **測試策略**       | `docs/testing-strategy.md`             | 完整測試策略文檔     | 🟡 高    |
| **MVP Phase 2 測試指南** | `docs/MVP2-TESTING-GUIDE.md`      | MVP Phase 2 完整測試驗證指南 (Sprint 1-5) | 🔴 極高  |
| **性能審計報告**   | `docs/performance-audit-2025.md`       | 2025年性能優化分析   | 🟡 高    |
| **性能實施指南**   | `docs/performance-implementation-guide.md` | 性能優化實施指南 | 🟡 高    |
| **Week 5開發計劃** | `docs/week5-development-plan.md`        | AI搜索引擎開發規劃   | 🟡 高    |
| **Azure OpenAI設置指南** | `docs/azure-openai-setup-guide.md` | Azure OpenAI完整配置指南 | 🟡 高    |
| **Dynamics 365設置指南** | `docs/dynamics365-setup-guide.md` | Dynamics 365完整配置指南 | 🟡 高    |
| **問題分析報告（2025-10-06）** | `claudedocs/issue-analysis-2025-10-06.md` | Dashboard頁面和Session Persistence完整問題分析（4個issue調查） | 🟡 高    |
| **MVP2實施驗證報告** | `claudedocs/mvp2-implementation-verification-report.md` | MVP Phase 2完整實施驗證報告（1115行，7個Sprint驗證，88%完成度，4.5/5評級） | 🔴 極高  |
| **MVP1+MVP2完整驗證報告** | `claudedocs/mvp1-mvp2-complete-verification-report.md` | MVP1+MVP2史詩級完整驗證報告（2400+行，13個Sprint驗證，91%完成度，4.8/5評級） | 🔴 極高  |
| **MVP2清單同步報告** | `claudedocs/mvp2-checklist-sync-report.md` | MVP2實施清單同步完整報告（基於驗證報告更新，83%進度校準，7個Sprint詳細同步，質量保證） | 🔴 極高  |
| **Microsoft Graph設置指南** | `docs/microsoft-graph-setup-guide.md` | Microsoft Graph日曆整合完整配置指南（Azure AD/OAuth/權限） | 🟡 高    |
| **新開發者設置指南** | `docs/NEW-DEVELOPER-SETUP-GUIDE.md` | 新開發者環境自動化設置完整指南 | 🔴 極高  |
| **Sprint 3安全設置指南** | `docs/sprint3-security-setup-guide.md` | Sprint 3安全加固完整設置和配置指南（加密/Key Vault/HTTPS/RBAC/審計） | 🔴 極高  |
| **Sprint 3災難恢復指南** | `docs/sprint3-disaster-recovery-guide.md` | Sprint 3 Week 6災難恢復完整指南（RTO/RPO定義、備份策略、恢復流程、演練計劃） | 🔴 極高  |
| **Sprint 3安全掃描報告** | `docs/sprint3-security-scan-report.md` | Sprint 3 Week 6安全掃描完整報告（npm audit + ESLint SAST,xlsx漏洞評估,OWASP合規,行動計劃） | 🔴 極高  |
| **Sprint 3 RBAC設計文檔** | `docs/sprint3-rbac-design-document.md` | Sprint 3 Week 6-7 RBAC權限系統設計完整文檔（5角色×22資源×13操作,權限矩陣,API實施模式,前端整合,實施路線圖） | 🔴 極高  |
| **Sprint 3細粒度權限設計** | `docs/sprint3-week9-fine-grained-permissions-design.md` | Sprint 3 Week 9細粒度權限控制設計文檔（欄位級別/資源級別/操作級別,4敏感級別,實施路線圖） | 🔴 極高  |
| **Sprint 7 UAT測試計劃** | `docs/sprint7-uat-test-plan.md` | Sprint 7用戶驗收測試完整計劃（提醒/準備包/AI分析/推薦/日曆/助手） | 🔴 極高  |
| **Sprint 7 UAT執行報告** | `docs/sprint7-uat-execution-report.md` | Sprint 7用戶驗收測試詳細執行報告（38個測試用例,問題分析,修復建議） | 🔴 極高  |
| **Sprint 7 UAT最終報告** | `docs/sprint7-uat-final-report.md` | Sprint 7 UAT測試最終報告（84.2%通過率,修復前後對比,剩餘問題清單） | 🔴 極高  |
| **Sprint 7 UAT最終報告v2** | `docs/sprint7-uat-final-report-v2.md` | Sprint 7 UAT測試最終報告v2（89.5%通過率,TC-PREP005/008問題調查,環境修復驗證） | 🔴 極高  |
| **Sprint 7 UAT摘要文檔** | `docs/sprint7-uat-summary.md` | Sprint 7 UAT測試執行摘要（關鍵指標,問題匯總,下一步行動） | 🟡 重要  |
| **監控遷移策略** | `docs/monitoring-migration-strategy.md` | OpenTelemetry零成本遷移架構設計（Prometheus→Azure） | 🔴 極高  |
| **監控使用範例** | `docs/monitoring-usage-examples.md` | 完整監控集成範例（API/AI/DB/緩存追蹤） | 🔴 極高  |
| **監控運維手冊** | `docs/monitoring-operations-manual.md` | 監控系統運維完整指南（日常檢查/告警處理/故障排查） | 🔴 極高  |
| **Azure Monitor遷移清單** | `docs/azure-monitor-migration-checklist.md` | 5階段遷移檢查清單（準備/測試/執行/優化/清理） | 🔴 極高  |
| **工作流程引擎設計** | `docs/workflow-engine-design.md` | 完整工作流程引擎架構設計文檔 | 🔴 極高  |
| **工作流程測試指南** | `docs/workflow-testing-guide.md` | 工作流程系統測試環境配置和執行指南 | 🔴 極高  |

### 🔍 lib/search/ - Week 5 智能搜索系統

**用途**: 高性能向量搜索、智能建議和性能監控系統

| 功能模組               | 文件路徑                            | 用途說明                                       | 重要程度 |
| ---------------------- | ----------------------------------- | ---------------------------------------------- | -------- |
| **向量搜索引擎**       | `lib/search/vector-search.ts`       | 多算法向量搜索，支援餘弦/歐幾里得/混合搜索     | 🔴 極高  |
| **結果排序器**         | `lib/search/result-ranker.ts`       | 6維度智能評分：相似度/時間/熱度/偏好/分類/作者 | 🔴 極高  |
| **查詢處理器**         | `lib/search/query-processor.ts`     | 智能查詢理解，8種意圖識別，多語言支援          | 🔴 極高  |
| **pgvector搜索**       | `lib/search/pgvector-search.ts`     | PostgreSQL向量搜索，HNSW索引優化              | 🟡 高    |
| **搜索建議系統**       | `lib/search/search-suggestions.ts`  | 實時建議，自動補全，個人化推薦，學習機制       | 🟡 高    |
| **上下文結果增強**     | `lib/search/contextual-result-enhancer.ts` | 搜索結果上下文增強和相關性提升        | 🟡 高    |
| **搜索分析**           | `lib/search/search-analytics.ts`    | 搜索行為分析和性能追蹤                        | 🟢 中    |
| **CRM搜索適配器**      | `lib/search/crm-search-adapter.ts`  | CRM系統搜索整合適配器                         | 🟡 高    |
| **語義查詢處理**       | `lib/search/semantic-query-processor.ts` | 語義查詢理解和處理                       | 🟡 高    |

### 🗄️ lib/cache/ - 向量緩存系統

**用途**: 雙層緩存架構，提升搜索性能

| 功能模組               | 文件路徑                      | 用途說明                                     | 重要程度 |
| ---------------------- | ----------------------------- | -------------------------------------------- | -------- |
| **向量緩存服務**       | `lib/cache/vector-cache.ts`   | Redis+記憶體雙層緩存，智能壓縮，批量操作     | 🔴 極高  |

### 🤖 lib/ai/ - AI服務增強

**用途**: Azure OpenAI整合和嵌入服務優化

| 功能模組               | 文件路徑                           | 用途說明                                     | 重要程度 |
| ---------------------- | ---------------------------------- | -------------------------------------------- | -------- |
| **增強嵌入服務**       | `lib/ai/enhanced-embeddings.ts`   | 智能緩存，批量優化，成本追蹤，質量驗證       | 🔴 極高  |

### 🔐 lib/auth/ - JWT驗證增強系統 (MVP Phase 2)

**用途**: 企業級JWT雙令牌驗證、Token撤銷、多設備管理和Azure AD SSO整合

| 功能模組               | 文件路徑                           | 用途說明                                     | 重要程度 |
| ---------------------- | ---------------------------------- | -------------------------------------------- | -------- |
| **Token服務**          | `lib/auth/token-service.ts`       | JWT雙令牌機制(15分+30天)、Token撤銷、多設備管理、自動清理 | 🔴 極高  |
| **Azure AD服務**       | `lib/auth/azure-ad-service.ts`    | MSAL Node整合、OAuth 2.0、用戶同步、角色映射、單點登出 | 🔴 極高  |

### 🔄 lib/workflow/ - 提案工作流程系統 (Sprint 5 Week 9完成)

**用途**: 企業級提案工作流程引擎 - 狀態管理、版本控制、協作、審批

**🎯 核心特點**:
- **狀態機引擎**: 12狀態完整狀態機，30+狀態轉換，權限控制
- **版本控制**: 快照式版本管理，差異計算，回滾機制
- **協作系統**: 段落級評論，@mentions，樹狀回覆結構
- **審批管理**: 多級審批，並行會簽，委派機制
- **審計追蹤**: 完整狀態變更歷史，不可篡改記錄

| 工作流程模組           | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **工作流程引擎**       | `lib/workflow/engine.ts`              | 12狀態狀態機，30+轉換，權限驗證，審計追蹤    | 420      | 🔴 極高  |
| **版本控制系統**       | `lib/workflow/version-control.ts`     | 快照管理，差異計算，回滾功能，標籤支援        | 370      | 🔴 極高  |
| **評論協作系統**       | `lib/workflow/comment-system.ts`      | 段落級評論，@mentions，樹狀回覆，狀態管理     | 370      | 🔴 極高  |
| **審批管理器**         | `lib/workflow/approval-manager.ts`    | 多級審批，並行會簽，委派機制，自動推進        | 430      | 🔴 極高  |
| **統一導出**           | `lib/workflow/index.ts`               | 所有工作流程模組的統一導出入口               | 45       | 🟡 高    |

**🎯 設計模式應用**:
- State Pattern (狀態機)
- Observer Pattern (事件通知)
- Strategy Pattern (審批策略)
- Factory Pattern (模組實例化)
- Command Pattern (狀態轉換)
- Memento Pattern (版本快照)

**✅ 完成狀態**: Sprint 5 Week 9 Day 2 完成 (2025-10-01)
- 總計: 2,035行核心代碼
- 數據庫: 5個模型 + 5個枚舉 + 30+索引
- 測試: 400行測試框架（待環境配置）

### 🔔 lib/notification/ - 企業級通知系統 (Sprint 5 Week 10完成)

**用途**: 多渠道通知引擎 - 站內通知、郵件服務、實時更新、偏好管理

**🎯 核心特點**:
- **多渠道支援**: IN_APP（站內）、EMAIL（郵件）、PUSH（推送）、SMS（短信）
- **優先級管理**: LOW/NORMAL/HIGH/URGENT 四級優先級
- **智能過濾**: 基於用戶偏好的通知過濾和路由
- **批量處理**: 高效批量發送和通知聚合
- **工作流程整合**: 與工作流程引擎深度整合

| 通知模組               | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **通知引擎**           | `lib/notification/engine.ts`          | 核心通知引擎，創建/查詢/統計/批量處理         | 580      | 🔴 極高  |
| **站內通知服務**       | `lib/notification/in-app-service.ts`  | 站內通知管理，實時更新，分組摘要             | 450      | 🔴 極高  |
| **郵件通知服務**       | `lib/notification/email-service.ts`   | SMTP/SendGrid郵件發送，範本渲染              | 520      | 🔴 極高  |
| **統一導出**           | `lib/notification/index.ts`           | 所有通知模組的統一導出入口                   | 50       | 🟡 高    |

**🎯 工作流程整合**:
- `lib/workflow/engine.ts`: 狀態變更自動通知
- `lib/workflow/comment-system.ts`: 評論和@提及通知
- `lib/workflow/approval-manager.ts`: 審批請求和結果通知

**✅ 完成狀態**: Sprint 5 Week 10 Day 2 完成 (2025-10-02)
- 總計: ~1,600行後端代碼 + ~1,500行前端代碼
- 數據庫: 2個模型（Notification + NotificationPreference）
- API端點: 5個REST API
- UI組件: 5個React組件

---

### 📝 lib/template/ - 提案範本管理系統 (Sprint 5 Week 10完成)

**用途**: 範本管理引擎 - 範本CRUD、變數替換、預覽、PDF導出

**🎯 核心特點**:
- **Handlebars引擎**: 強大的範本語法支援（變數/條件/循環）
- **25個Helper函數**: 日期/貨幣/數學/邏輯/字串處理
- **訪問控制**: PRIVATE/TEAM/ORGANIZATION/PUBLIC 4級權限
- **變數系統**: 6種變數類型，完整驗證和測試數據生成
- **版本管理**: 自動版本號，範本複製和統計

| 範本模組               | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **範本管理器**         | `lib/template/template-manager.ts`    | Repository Pattern，CRUD/搜索/權限/統計      | 700      | 🔴 極高  |
| **範本引擎**           | `lib/template/template-engine.ts`     | Handlebars編譯/渲染/驗證/預覽                | 450      | 🔴 極高  |
| **Handlebars輔助函數** | `lib/template/handlebars-helpers.ts`  | 註冊常用Handlebars helpers（formatDate/formatCurrency/formatNumber等） | 150      | 🔴 極高  |

---

### 📄 lib/pdf/ - PDF 生成系統 (Sprint 5 Week 10 Day 4完成)

**用途**: 企業級 PDF 文檔生成引擎 - 提案範本轉專業 PDF

**🎯 核心特點**:
- **Puppeteer整合**: 無頭瀏覽器，完整 HTML/CSS 支援
- **單例模式**: 瀏覽器實例復用，節省 2-3秒/請求
- **高解析度渲染**: deviceScaleFactor 2x，清晰專業
- **專業範本**: 封面頁（漸變背景）+ 內容頁（header/footer）
- **安全措施**: HTML轉義防XSS，文件名sanitization
- **完整樣式**: h1-h3、段落、列表、表格、引用、代碼塊 CSS

| PDF模組                | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **PDF生成引擎**        | `lib/pdf/pdf-generator.ts`            | Puppeteer核心引擎，單例模式，HTML轉PDF       | 270      | 🔴 極高  |
| **專業PDF範本**        | `lib/pdf/proposal-pdf-template.ts`    | 封面+內容頁範本，完整CSS樣式系統             | 350      | 🔴 極高  |
| **統一導出**           | `lib/pdf/index.ts`                    | 所有PDF模組的統一導出入口                    | 20       | 🟡 高    |

---

### 📋 lib/parsers/ - 文件解析器系統 (Sprint 6 Week 12 Day 3-4完成)

**用途**: 批量上傳文件解析基礎設施 - 多格式文件文本提取

**🎯 核心特點**:
- **多格式支持**: PDF, Word (.docx/.doc), Excel (.xlsx/.xls), CSV, 圖片 (PNG/JPG/JPEG)
- **自動檢測**: 基於魔數的文件類型自動識別
- **統一API**: 一致的解析器架構和接口設計
- **元數據提取**: 文件信息、頁數、作者、創建時間等
- **OCR支持**: 圖片文字識別，支援繁體中文、簡體中文、英文等多語言
- **性能優化**: 文件大小限制、Worker重用、並行處理支持

| 解析器模組             | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **PDF解析器**          | `lib/parsers/pdf-parser.ts`           | pdf-parse整合，多頁PDF，元數據提取           | 260      | 🔴 極高  |
| **Word解析器**         | `lib/parsers/word-parser.ts`          | mammoth整合，.docx/.doc支持，HTML可選        | 270      | 🔴 極高  |
| **Excel解析器**        | `lib/parsers/excel-parser.ts`         | xlsx整合，多工作表，結構化數據提取           | 280      | 🔴 極高  |
| **圖片OCR解析器**      | `lib/parsers/image-ocr-parser.ts`     | tesseract.js整合，多語言OCR，置信度評分      | 290      | 🔴 極高  |
| **統一導出**           | `lib/parsers/index.ts`                | 自動檔案類型檢測，統一解析接口，批量解析     | 180      | 🔴 極高  |

**🎯 支持的文件格式**:
- **PDF**: 文字提取，頁數統計，元數據（標題/作者/日期）
- **Word**: .docx/.doc，文字/HTML提取，格式保留選項
- **Excel**: .xlsx/.xls，多工作表，表格轉文字/JSON
- **CSV**: 逗號分隔值文件，自動編碼檢測
- **圖片**: PNG/JPG/JPEG/GIF，OCR文字識別，多語言支持

**🔧 技術依賴**:
- `pdf-parse@^2.1.1` - PDF文本提取
- `mammoth@^1.11.0` - Word文檔解析
- `xlsx@^0.18.5` - Excel/CSV處理
- `tesseract.js@^6.0.1` - OCR引擎

---

### 🤝 lib/collaboration/ - 多用戶協作系統 (Sprint 6 Week 12完成)

**用途**: 編輯鎖定和衝突檢測機制 - 防止並發編輯衝突

**🎯 核心特點**:
- **編輯鎖定管理**: 獲取、釋放、刷新鎖定機制
- **衝突檢測**: 鎖定衝突、版本衝突、並發編輯檢測
- **自動過期**: 過期鎖定自動清理
- **通知集成**: 鎖定狀態變更自動通知
- **多資源支持**: 支援KnowledgeBase、Proposal等多種資源類型
- **內存緩存**: 高性能內存緩存實現（可遷移至Redis）

| 協作模組               | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **編輯鎖定管理器**     | `lib/collaboration/edit-lock-manager.ts` | 鎖定獲取/釋放/刷新，衝突檢測，自動過期       | 500      | 🔴 極高  |
| **統一導出**           | `lib/collaboration/index.ts`          | 所有協作模組的統一導出入口                   | 15       | 🟡 高    |

**🎯 衝突類型**:
- **LOCKED_BY_OTHER**: 資源已被其他用戶鎖定
- **VERSION_MISMATCH**: 版本號不匹配（並發修改）
- **CONCURRENT_EDIT**: 並發編輯檢測

**🔧 核心功能**:
- `acquireLock()` - 獲取編輯鎖定（支持強制獲取）
- `releaseLock()` - 釋放編輯鎖定
- `refreshLock()` - 刷新鎖定過期時間
- `detectConflict()` - 檢測編輯衝突
- `cleanupExpiredLocks()` - 清理過期鎖定

---

### ⏰ lib/reminder/ - 智能提醒系統 (Sprint 7 Phase 1完成)

**用途**: 智能行動提醒引擎 - 基於規則的自動提醒系統

**🎯 核心特點**:
- **5種提醒類型**: 會議提醒、跟進任務、提案過期、任務逾期、自定義提醒
- **4種優先級**: URGENT(≤1hr)、HIGH(≤4hr)、NORMAL(≤24hr)、LOW(>24hr)
- **動態優先級**: 基於時間緊迫度自動調整優先級
- **5種狀態**: PENDING、TRIGGERED、SNOOZED、DISMISSED、COMPLETED
- **自動調度**: 定期檢查待觸發提醒，批量處理
- **通知集成**: 自動發送站內通知和郵件提醒
- **延遲功能**: 支持1-1440分鐘自定義延遲

| 提醒模組               | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **提醒規則引擎**       | `lib/reminder/reminder-rule-engine.ts` | 提醒創建、觸發、延遲、優先級計算             | 550      | 🔴 極高  |
| **提醒調度器**         | `lib/reminder/reminder-scheduler.ts`  | 定期檢查、批量觸發、重試機制、單例模式       | 220      | 🔴 極高  |
| **統一導出**           | `lib/reminder/index.ts`               | 所有提醒模組的統一導出入口                   | 20       | 🟡 高    |

**🎯 提醒類型**:
- **MEETING_UPCOMING**: 會議前1小時/1天提醒
- **FOLLOW_UP_DUE**: 跟進任務到期提醒
- **PROPOSAL_EXPIRING**: 提案7天前過期提醒
- **TASK_OVERDUE**: 任務逾期通知
- **CUSTOM**: 自定義提醒規則

**🔧 核心功能**:
- `scheduleMeetingReminder()` - 創建會議提醒
- `scheduleFollowUpReminder()` - 創建跟進任務提醒
- `scheduleProposalExpiryReminder()` - 創建提案過期提醒
- `triggerReminder()` - 觸發提醒並發送通知
- `snoozeReminder()` - 延遲提醒
- `dismissReminder()` - 忽略提醒

---

### 📊 lib/analytics/ - 用戶行為追蹤系統 (Sprint 7 Phase 1完成)

**用途**: 智能用戶畫像生成 - 基於行為數據的個性化分析

**🎯 核心特點**:
- **10種行為類型**: VIEW、SEARCH、CLICK、DOWNLOAD、SHARE、FAVORITE、COMMENT、EDIT、CREATE、DELETE
- **6種內容類型**: KNOWLEDGE_BASE、PROPOSAL、TEMPLATE、CUSTOMER、MEETING、WORKFLOW
- **智能畫像生成**: 興趣分析、偏好識別、互動指標
- **行為權重系統**: VIEW(1分)→CLICK(3分)→DOWNLOAD(5分)→FAVORITE(10分)→CREATE(9分)
- **活躍時段分析**: 識別用戶最活躍的時間段（top 3小時）
- **關鍵詞提取**: 從搜索和互動中提取用戶興趣關鍵詞
- **24小時緩存**: 用戶畫像24小時緩存，減少計算開銷
- **興趣分數正規化**: 0-100分數系統，易於理解和比較

| 分析模組               | 文件路徑                              | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- | -------- |
| **行為追蹤引擎**       | `lib/analytics/user-behavior-tracker.ts` | 行為記錄、畫像生成、興趣分析、時段統計       | 430      | 🔴 極高  |
| **統一導出**           | `lib/analytics/index.ts`              | 所有分析模組的統一導出入口                   | 15       | 🟡 高    |

**🎯 用戶畫像內容**:
- **興趣列表**: 內容ID + 興趣分數（0-100），按分數排序
- **行為頻率**: 各行為類型的執行次數統計
- **活躍時段**: 用戶最活躍的3個小時時段
- **搜索關鍵詞**: 最常用的搜索詞列表
- **下載格式**: 最常下載的文件格式統計

**🔧 核心功能**:
- `trackBehavior()` - 記錄用戶行為
- `getUserProfile()` - 獲取用戶畫像（含緩存）
- `getBehaviorHistory()` - 獲取行為歷史記錄

---

### 📅 lib/meeting/ - 會議智能系統 (Sprint 7 Phase 1 + Phase 2完成)

**用途**: 智能會議準備與AI分析 - 自動組裝會議資料並提供AI洞察

**🎯 核心特點**:
- **Phase 1: 會議準備包**:
  - **6種準備包類型**: 銷售會議、客戶簡報、內部審查、提案討論、培訓會議、自定義
  - **5種準備包狀態**: 草稿、就緒、使用中、已完成、已歸檔
  - **10種項目類型**: 知識庫、提案、模板、客戶信息、談話要點、FAQ等
  - **智能自動生成**: 根據會議類型和信息自動組裝準備包
  - **模板系統**: 預定義模板快速創建準備包
- **Phase 2: AI智能分析** ⭐️:
  - **Azure OpenAI GPT-4集成**: 智能信息提取和建議生成
  - **5類分析洞察**: 摘要、參與者、討論主題、潛在問題、後續行動
  - **30分鐘緩存**: 優化性能，減少API調用成本
  - **上下文管理**: 支持多輪對話和歷史記錄

| 會議模組               | 文件路徑                                        | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **AI智能分析器** ⭐️   | `lib/meeting/meeting-intelligence-analyzer.ts`  | GPT-4會議信息分析,5類洞察生成,30分鐘緩存     | 660      | 🔴 極高  |
| **準備包管理器**       | `lib/meeting/meeting-prep-package.ts`           | 創建、生成、管理準備包，模板系統             | 600      | 🔴 極高  |
| **統一導出**           | `lib/meeting/index.ts`                          | 所有會議模組的統一導出入口                   | 20       | 🟡 高    |

**🎯 準備包類型**:
- **SALES_MEETING**: 銷售會議準備包
- **CLIENT_PRESENTATION**: 客戶簡報準備包
- **INTERNAL_REVIEW**: 內部審查準備包
- **PROPOSAL_DISCUSSION**: 提案討論準備包
- **TRAINING_SESSION**: 培訓會議準備包
- **CUSTOM**: 自定義準備包

**🔧 核心功能**:
- `createPrepPackage()` - 創建準備包（手動/模板/智能生成）
- `generateFromMeeting()` - 智能生成：根據會議信息自動組裝
- `createFromTemplate()` - 模板生成：基於預定義模板
- `addItem()` - 添加準備包項目
- `removeItem()` - 移除準備包項目
- `reorderItems()` - 重新排序項目
- `calculateReadingTime()` - 計算預計閱讀時間
- `getAllTemplates()` - 獲取所有模板

---

### 📅 lib/calendar/ - Microsoft Graph日曆整合 (Sprint 7 Phase 3完成)

**用途**: Microsoft Graph API整合 - OAuth 2.0認證和Outlook/Teams日曆同步

**🎯 核心特點**:
- **OAuth 2.0認證**: Azure AD認證流程,Token管理,自動刷新
- **Delta Query同步**: 增量同步機制,Delta token管理,性能優化
- **事件CRUD操作**: 獲取、創建、更新、刪除日曆事件
- **Token安全管理**: 訪問token、刷新token、過期驗證、CSRF防護

| 日曆模組               | 文件路徑                                        | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **OAuth認證服務**      | `lib/calendar/microsoft-graph-oauth.ts`         | Azure AD OAuth 2.0認證,Token管理,刷新機制    | 200      | 🔴 極高  |
| **日曆同步服務**       | `lib/calendar/calendar-sync-service.ts`         | Delta Query增量同步,事件CRUD,狀態追蹤,Mock模式支持 | 485      | 🔴 極高  |
| **模擬日曆服務**       | `lib/calendar/calendar-mock-service.ts`         | 開發模式Mock服務,模擬OAuth/CRUD/同步,測試數據生成 | 670      | 🟡 高    |

**🔧 核心功能**:
- **OAuth流程**: `generateAuthUrl()`, `exchangeCodeForToken()`, `refreshAccessToken()`
- **同步管理**: `syncCalendarDelta()`, `fullSyncCalendar()`, `getSyncStatus()`, `resetSyncStatus()`
- **事件操作**: `getCalendarEvents()`, `createCalendarEvent()`, `updateCalendarEvent()`, `deleteCalendarEvent()`
- **Token管理**: `storeToken()`, `getToken()`, `isTokenExpired()`

---

**🎯 範本 API端點** (app/api/templates/) - Sprint 5 Week 10 Day 3-4

| API端點               | 文件路徑                                      | 用途說明                                     | 代碼行數 | 重要程度 |
| --------------------- | --------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **範本列表創建**      | `app/api/templates/route.ts`                  | 範本列表(GET)，創建範本(POST)                | ~200行   | 🔴 極高  |
| **範本CRUD**          | `app/api/templates/[id]/route.ts`             | 單個範本查看/更新/刪除(GET/PUT/DELETE)       | ~300行   | 🔴 極高  |
| **範本複製**          | `app/api/templates/[id]/duplicate/route.ts`   | 複製範本(POST)                               | ~150行   | 🟡 高    |
| **範本預覽**          | `app/api/templates/[id]/preview/route.ts`     | 預覽範本(POST)                               | ~200行   | 🟡 高    |
| **臨時預覽**          | `app/api/templates/preview-temp/route.ts`     | 臨時範本預覽(POST)，用於創建頁面             | ~180行   | 🟡 高    |
| **範本統計**          | `app/api/templates/stats/route.ts`            | 統計信息(GET)                                | ~120行   | 🟢 中    |
| **PDF導出**           | `app/api/templates/[id]/export-pdf/route.ts`  | 保存範本PDF導出(POST)                        | ~150行   | 🔴 極高  |
| **PDF測試導出**       | `app/api/templates/export-pdf-test/route.ts`  | 測試範本PDF導出(POST)，用於實時預覽          | ~120行   | 🟡 高    |

**🎨 範本前端頁面** (app/dashboard/templates/) - Sprint 5 Week 10 Day 3-4

| 頁面名稱              | 文件路徑                                      | 用途說明                                     | 代碼行數 | 重要程度 |
| --------------------- | --------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **範本列表頁**        | `app/dashboard/templates/page.tsx`            | 範本列表，搜索/過濾/統計/分頁                | ~450行   | 🔴 極高  |
| **範本創建頁**        | `app/dashboard/templates/new/page.tsx`        | 範本創建，Tab界面/變數配置/預覽              | ~650行   | 🔴 極高  |
| **範本編輯頁**        | `app/dashboard/templates/[id]/page.tsx`       | 範本編輯，完整編輯功能                       | ~700行   | 🔴 極高  |
| **範本預覽頁**        | `app/dashboard/templates/[id]/preview/page.tsx`| 範本預覽，獨立預覽/變數輸入/PDF導出          | ~520行   | 🔴 極高  |

**✅ 完成狀態**: Sprint 5 Week 10 Day 3-4 完成 (2025-10-02)
- 範本後端: ~1,220行代碼（範本管理+引擎+6個API）✅
- 範本前端: ~2,370行代碼（4個頁面完整UI）✅
- PDF系統: ~980行代碼（核心引擎270 + 範本350 + API 270 + 前端70 + 導出20）✅
- 數據庫: 2個模型（ProposalTemplate + ProposalGeneration）✅
- API端點: 6個範本API + 2個PDF導出API ✅
- 前端整合: PDF導出按鈕 + 自動下載 + Toast通知 ✅

**🎯 提案版本管理 API端點** (app/api/proposals/) - Sprint 5 Week 10 Day 6-7

| API端點               | 文件路徑                                           | 用途說明                                     | 代碼行數 | 重要程度 |
| --------------------- | -------------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **提案詳情**          | `app/api/proposals/[id]/route.ts`                  | 單個提案查看/更新(GET/PUT)                   | ~200行   | 🔴 極高  |
| **版本列表**          | `app/api/proposals/[id]/versions/route.ts`         | 提案版本歷史列表(GET)                        | ~180行   | 🔴 極高  |
| **版本詳情**          | `app/api/proposals/[id]/versions/[versionId]/route.ts` | 單個版本查看(GET)                        | ~150行   | 🟡 高    |
| **版本對比**          | `app/api/proposals/[id]/versions/compare/route.ts` | 版本差異對比(POST)                           | ~200行   | 🔴 極高  |
| **版本回滾**          | `app/api/proposals/[id]/versions/restore/route.ts` | 版本回滾恢復(POST)                           | ~180行   | 🔴 極高  |

**🎨 提案版本管理頁面** (app/dashboard/proposals/) - Sprint 5 Week 10 Day 6

| 頁面名稱              | 文件路徑                                           | 用途說明                                     | 代碼行數 | 重要程度 |
| --------------------- | -------------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **版本歷史頁**        | `app/dashboard/proposals/[id]/versions/page.tsx`   | 提案版本歷史，版本對比/回滾                  | ~380行   | 🔴 極高  |

---

### 🎯 lib/recommendation/ - 個性化推薦引擎 (Sprint 7 Phase 2完成) ⭐️

**用途**: AI驅動的個性化推薦系統 - 基於用戶畫像和行為的智能內容推薦

**🎯 核心特點**:
- **4種推薦策略**:
  - **Collaborative Filtering (協同過濾)**: 基於用戶相似度推薦
  - **Content-Based (內容推薦)**: 基於用戶興趣和偏好
  - **Hybrid (混合策略)**: 40%協同 + 30%內容 + 20%流行 + 10%上下文
  - **Popularity (流行度推薦)**: 基於訪問頻次和收藏數
- **智能評分系統**: 多因素加權,分數正規化(0-1)
- **1小時推薦緩存**: 用戶級別緩存,TTL=3600秒
- **反饋閉環**: 記錄用戶互動(view/click/dismiss/like/dislike)
- **統計分析**: 點擊率、平均評分、top performers

| 推薦模組               | 文件路徑                                  | 用途說明                                     | 代碼行數 | 重要程度 |
| ---------------------- | ----------------------------------------- | -------------------------------------------- | -------- | -------- |
| **推薦引擎** ⭐️       | `lib/recommendation/recommendation-engine.ts` | 4種策略,智能評分,緩存,反饋系統               | 550      | 🔴 極高  |
| **統一導出**           | `lib/recommendation/index.ts`             | 所有推薦模組的統一導出入口                   | 15       | 🟡 高    |

**🔧 核心功能**:
- `generateRecommendations()` - 生成個性化推薦(支持4種策略)
- `collaborativeFiltering()` - 協同過濾推薦算法
- `contentBasedRecommendation()` - 內容推薦算法
- `hybridRecommendation()` - 混合推薦策略(默認)
- `popularityBasedRecommendation()` - 流行度推薦算法
- `recordFeedback()` - 記錄用戶反饋
- `getRecommendationStats()` - 獲取推薦統計

---

### 🗄️ lib/prisma.ts - Prisma客戶端單例 (Sprint 7 Phase 2完成)

**用途**: 全局唯一Prisma客戶端實例 - 避免連接池耗盡

| 文件               | 文件路徑              | 用途說明                                     | 代碼行數 | 重要程度 |
| ------------------ | --------------------- | -------------------------------------------- | -------- | -------- |
| **Prisma客戶端**   | `lib/prisma.ts`       | 單例Prisma客戶端,熱重載優化,連接池管理       | 100      | 🔴 極高  |

**🎯 核心特點**:
- **單例模式**: 全局唯一實例,防止連接池耗盡
- **開發環境優化**: 熱重載時保持連接
- **自動連接池管理**: 生產環境自動優化
- **日誌配置**: 開發環境完整日誌,生產環境僅錯誤
- **優雅關閉**: 進程結束時自動斷開連接

**🔧 使用方式**:
```typescript
import { prisma } from '@/lib/prisma';

const users = await prisma.user.findMany();
```

---

### 📁 Sprint 6: 知識庫管理界面 (Week 11-12, 進行中 73%)

**用途**: 知識庫資料夾樹狀導航、文檔組織、富文本編輯、版本控制、分析統計

**🎯 知識庫資料夾 API端點** (app/api/knowledge-folders/) - Sprint 6 Week 11

| API端點               | 文件路徑                                      | 用途說明                                     | 代碼行數 | 重要程度 |
| --------------------- | --------------------------------------------- | -------------------------------------------- | -------- | -------- |
| **資料夾列表創建**    | `app/api/knowledge-folders/route.ts`          | 樹狀結構查詢(GET)，新建資料夾(POST)          | ~340行   | 🔴 極高  |
| **資料夾詳情管理**    | `app/api/knowledge-folders/[id]/route.ts`     | 單個資料夾CRUD操作(GET/PATCH/DELETE)         | ~360行   | 🔴 極高  |
| **資料夾移動**        | `app/api/knowledge-folders/[id]/move/route.ts`| 拖放移動，循環引用防護，路徑遞歸更新         | ~180行   | 🟡 高    |
| **批量排序**          | `app/api/knowledge-folders/reorder/route.ts`  | 同層級批量排序，事務處理，系統資料夾保護     | ~120行   | 🟡 高    |

**🎯 API 特性**:
- **GET** `route.ts`: 遞歸查詢樹狀結構，支持扁平列表/樹狀模式
- **POST** `route.ts`: 創建新資料夾，自動路徑計算，同名檢測
- **GET/PATCH/DELETE** `[id]/route.ts`: 資料夾詳情、更新（移動/重命名）、刪除（空資料夾檢查）
- **POST** `[id]/move/route.ts`: 事務安全移動，循環引用防護
- **POST** `reorder/route.ts`: 批量 sort_order 更新

**🎨 知識庫前端組件** (components/knowledge/):
- `components/knowledge/knowledge-folder-tree.tsx`: 樹狀導航組件 (~650行)
  * 無限層級遞歸渲染
  * 拖放移動支持 (HTML5 Drag and Drop)
  * 展開/收起狀態管理
  * 右鍵菜單操作（創建/編輯/刪除）
  * 文檔計數顯示
  * 系統資料夾保護
- `components/knowledge/knowledge-search.tsx`: 富文本編輯搜索頁面 (~800行，Day 2新增)
  * Tiptap富文本編輯器整合
  * 完整工具欄（粗體/斜體/標題/列表/代碼）
  * 字數統計和限制（2000字）
  * FolderSelector資料夾過濾整合
  * 子資料夾包含選項
- `components/knowledge/folder-selector.tsx`: 資料夾選擇器組件 (~300行，Day 2整合)
  * 樹狀資料夾下拉選擇
  * 子資料夾包含切換
  * 清空選擇功能
  * Props整合修復 (value/onFolderChange)

**🧭 知識庫導航組件** (components/knowledge/, Week 12 Day 1新增):
- `components/knowledge/breadcrumb-navigation.tsx`: 麵包屑導航組件 (~180行)
  * 顯示資料夾完整路徑
  * 支持點擊跳轉父級資料夾
  * 自動省略長路徑 (>5層)
  * 加載骨架屏效果
- `components/knowledge/quick-jump-search.tsx`: 快速跳轉搜索組件 (~300行)
  * 全局搜索資料夾和文檔
  * 鍵盤快捷鍵支持 (Cmd/Ctrl + K)
  * 防抖搜索 (300ms)
  * 最近訪問記錄 (localStorage)
  * 鍵盤導航 (↑↓ Enter Esc)
- `components/knowledge/bulk-upload.tsx`: 批量上傳界面框架 (~320行)
  * 拖放文件上傳 (react-dropzone)
  * 支持多種格式 (PDF, Word, Excel, CSV, 圖片)
  * 文件預覽列表
  * 50MB 文件大小限制
  * TODO Day 3-4: 實現文件解析和批量處理

**📄 知識庫管理頁面** (app/dashboard/knowledge/):
- `app/dashboard/knowledge/page.tsx`: 知識庫主頁面 (整合麵包屑導航，Week 12 Day 1)
  * 添加 BreadcrumbNavigation 組件
  * 支持資料夾 URL 參數
- `app/dashboard/knowledge/folders/page.tsx`: 資料夾管理主頁面 (~200行，Day 2新增)
  * 新建頂層資料夾對話框
  * KnowledgeFolderTree整合展示
  * 刷新機制和狀態管理
  * 從知識庫主頁導航按鈕

**🌱 測試數據腳本** (scripts/):
- `scripts/seed-folders.ts`: 資料夾種子數據 (~100行，Day 2新增)
  * 3個頂層資料夾（產品/銷售/培訓）
  * 3個子資料夾（規格/價格/流程）
  * emoji圖標和描述性名稱
  * 執行成功驗證

**📦 數據庫模型** (prisma/schema.prisma):
- `KnowledgeFolder`: 樹狀資料夾模型 (28行)
  * 自引用關聯 (parent_id)
  * 路徑緩存 (path)
  * 排序支持 (sort_order)
  * 系統保護 (is_system)
  * 級聯刪除 (onDelete: Cascade)

**✅ 完成狀態**: Sprint 6 Week 11 完整交付 (2025-10-02)
- **Day 1 (16:55)**: 樹狀導航基礎 ✅
  * Prisma模型: 28行 (KnowledgeFolder)
  * API路由: 4個文件, ~600行
  * React組件: 1個文件, ~650行
  * 小計: ~1,738行新代碼
- **Day 2 (23:35)**: 管理界面與富文本編輯 ✅
  * Tiptap編輯器整合: ~800行
  * FolderSelector整合: ~300行
  * 資料夾管理頁面: ~200行
  * 測試種子腳本: ~100行
  * Bug修復: Props整合
  * 小計: ~1,300行新代碼
- **Week 11 累計**: ~3,038行新代碼 ✅
- **Sprint 6 進度**: 20% → 40% (7/17任務完成)

**📊 知識庫分析統計系統** (Week 12 Day 5, 2025-10-03):
- `lib/knowledge/analytics-service.ts`: 分析統計服務層 (~717行)
  * getOverview() - 總體統計概覽（文檔數/查看/編輯/下載，含增長率）
  * getTopViewedDocuments() - 熱門查看文檔Top N排行
  * getTopEditedDocuments() - 熱門編輯文檔Top N排行
  * getTypeDistribution() - 文檔類型分布統計（Prisma groupBy聚合）
  * getCategoryDistribution() - 文檔分類分布統計
  * getStatusDistribution() - 文檔狀態分布統計
  * getFolderUsage() - 資料夾使用情況（文檔數+儲存空間）
  * getUserActivity() - 用戶活動統計（僅admin/manager）
- `app/api/knowledge-base/analytics/route.ts`: Analytics API端點 (~244行)
  * GET /api/knowledge-base/analytics - 8種統計類型
  * 查詢參數：type, timeRange (today/week/month/custom), limit, startDate, endDate
  * JWT認證，角色權限控制
- `components/knowledge/analytics/`: UI組件 (~508行，4個組件)
  * StatsCard.tsx - 統計卡片（值+增長率+趨勢圖標）~86行
  * BarChart.tsx - 純CSS條形圖組件 ~105行
  * PieChart.tsx - 純SVG圓餅圖組件 ~149行
  * DocumentList.tsx - 文檔排行榜組件 ~150行
  * index.ts - 統一導出 ~18行
- `app/dashboard/knowledge/analytics/page.tsx`: 分析儀表板頁面 (~305行)
  * 時間範圍選擇器（今日/本週/本月/自定義）
  * 總體統計卡片（4個指標）
  * 熱門文檔排行（Top 10查看/編輯）
  * 數據分布圖表（圓餅圖 - 分類/類型）
  * 資料夾使用圖表（條形圖）
  * 儲存空間統計（Top 3資料夾）
  * 並行API請求（Promise.all）

**🎨 技術亮點**:
- ✅ 零依賴數據可視化（純CSS/SVG，無Chart.js/Recharts）
- ✅ 高效數據聚合（Prisma groupBy數據庫級聚合）
- ✅ 並行數據獲取（Promise.all同時發起6個請求）
- ✅ 基於AuditLog統計（複用現有審計追蹤表，避免數據冗餘）
- ✅ 增長率計算（相比上一期間的百分比變化）

**✅ 完成狀態**: Sprint 6 Week 12 Day 5 (2025-10-03 23:30)
- **分析統計成果**: ~1,788行新代碼
  * 服務層: ~717行
  * API層: ~244行
  * UI組件: ~508行 (4組件)
  * 儀表板頁面: ~305行
  * 統一導出: ~14行
- **Sprint 6 累計**: ~10,356行新代碼
- **Sprint 6 進度**: 40% → 73% (12/17任務完成)

**🔄 待完成** (Week 12):
- ✅ 導航增強功能 (麵包屑/快速跳轉/最近訪問) - Day 1完成
- ✅ 知識庫版本控制系統 - Day 2-3完成
- ✅ 知識庫分析統計 - Day 5完成
- ⏳ 審核工作流程 (延後到Sprint 7)
- ⏳ 協作功能 (延後到Sprint 7)

### 📊 lib/monitoring/ - 企業級監控告警系統 (Sprint 2完成)

**用途**: 基於 OpenTelemetry 的統一可觀測性平台，支援零成本遷移

**🎯 架構特點**:
- **供應商中立**: 寫一次代碼，隨處運行（Prometheus/Azure/Jaeger）
- **零遷移成本**: 5-10分鐘切換後端，無需修改代碼
- **雙層部署**: 開發用 Prometheus（免費），生產用 Azure Monitor
- **完整可觀測性**: Metrics + Traces + Logs 統一管理

| 監控組件               | 文件路徑                              | 用途說明                                     | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- |
| **統一遙測抽象層**     | `lib/monitoring/telemetry.ts`         | OpenTelemetry API封裝，業務指標追蹤（12類指標） | 🔴 極高  |
| **配置管理器**         | `lib/monitoring/config.ts`            | 多後端配置管理，環境變數驗證              | 🔴 極高  |
| **後端工廠**           | `lib/monitoring/backend-factory.ts`   | 動態後端切換（Prometheus/Azure/Jaeger）     | 🔴 極高  |
| **API監控中間件**      | `lib/monitoring/middleware.ts`        | 自動HTTP請求追蹤，性能指標收集             | 🔴 極高  |
| **性能監控服務**       | `lib/monitoring/performance-monitor.ts` | 8種指標監控，智能警報，性能報告，健康檢查    | 🟡 高    |
| **連接監控服務**       | `lib/monitoring/connection-monitor.ts` | 5服務健康監控，自動重連，狀態緩存管理    | 🟡 高    |
| **監控系統初始化**     | `lib/monitoring/monitor-init.ts` | 監控系統生命周期管理，優雅關閉機制    | 🟡 高    |

**📊 業務指標覆蓋**:
- HTTP 指標: 請求數、響應時間、錯誤率、請求/響應大小
- 用戶指標: 註冊、登入、活動追蹤
- AI 服務: 調用次數、Token使用、響應時間
- 知識庫: 搜尋次數、結果質量
- Dynamics 365: 同步操作、成功率
- 資料庫: 查詢時間、連接池、錯誤率
- 緩存: 命中率、請求數

### 🚀 lib/startup/ - 系統啟動和初始化

**用途**: 系統啟動流程管理和服務初始化控制

| 啟動組件               | 文件路徑                              | 用途說明                                     | 重要程度 |
| ---------------------- | ------------------------------------- | -------------------------------------------- | -------- |
| **監控初始化器**       | `lib/startup/monitoring-initializer.ts` | 監控系統生命周期管理，單例模式，服務控制    | 🟡 高    |

### 🗄️ scripts/ - 數據庫優化腳本

**用途**: PostgreSQL + pgvector 性能優化

| 功能模組               | 文件路徑                                | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------- | -------------------------------------------- | -------- |
| **DB優化腳本**         | `scripts/enhanced-db-optimization.sql` | pgvector安裝，HNSW索引，性能測試            | 🟡 高    |

### 🌐 app/api/knowledge-base/ - API端點 (Sprint 6 Week 12 新增批量上傳)

**用途**: 知識庫核心API端點，包含搜索建議和批量上傳功能

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **搜索建議API**        | `app/api/knowledge-base/suggestions/route.ts` | GET/POST多功能搜索建議端點                   | 🟡 高    |
| **批量上傳API**        | `app/api/knowledge-base/bulk-upload/route.ts` | 批量文件上傳，自動解析，最多20個文件         | 🔴 極高  |
| **優化路由**           | `app/api/knowledge-base/route-optimized.ts`   | 性能優化版知識庫API路由                      | 🟡 高    |

**🆕 批量上傳 API 特性** (Sprint 6 Week 12 Day 3-4):
- **多文件處理**: 一次上傳最多20個文件
- **自動解析**: 整合 lib/parsers 統一解析器，支持PDF/Word/Excel/圖片/文本
- **並行處理**: Promise.all並行處理提升效率
- **智能檢測**: MIME類型 + 文件頭雙重驗證
- **安全機制**: 文件大小限制、重複檢測、安全文件名處理
- **統計信息**: 返回解析時間、文本長度等詳細統計

### 🔐 app/api/auth/ - 認證API增強 (MVP Phase 2)

**用途**: JWT雙令牌認證端點 + Azure AD SSO整合

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **登入API**            | `app/api/auth/login/route.ts`                | 雙令牌登入（已升級）                        | 🔴 極高  |
| **登出API**            | `app/api/auth/logout/route.ts`               | Token撤銷登出（已升級）                     | 🔴 極高  |
| **Token刷新API**       | `app/api/auth/refresh/route.ts`              | Access token刷新端點（新增）                | 🔴 極高  |
| **Azure AD登入**       | `app/api/auth/azure-ad/login/route.ts`       | Azure AD SSO登入啟動（新增）                | 🔴 極高  |
| **Azure AD回調**       | `app/api/auth/azure-ad/callback/route.ts`    | Azure AD認證回調處理（新增）                | 🔴 極高  |

### 🔔 app/api/notifications/ - 通知系統API (Sprint 5 Week 10)

**用途**: 完整通知系統REST API端點

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **通知列表**           | `app/api/notifications/route.ts`             | 獲取/刪除通知，支持過濾分頁                  | 🔴 極高  |
| **通知統計**           | `app/api/notifications/stats/route.ts`       | 未讀計數和分類統計                           | 🟡 高    |
| **已讀標記**           | `app/api/notifications/read/route.ts`        | 標記通知已讀（單個/批量/全部）               | 🔴 極高  |
| **通知偏好**           | `app/api/notifications/preferences/route.ts` | 獲取/更新通知偏好設置                        | 🟡 高    |

### 🤝 app/api/collaboration/ - 協作系統API (Sprint 6 Week 12)

**用途**: 編輯鎖定和衝突檢測API端點

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **鎖定管理**           | `app/api/collaboration/locks/route.ts`       | 創建編輯鎖定（POST）                         | 🔴 極高  |
| **鎖定操作**           | `app/api/collaboration/locks/lock/[lockId]/route.ts` | 釋放/刷新鎖定（DELETE/PATCH）                | 🔴 極高  |
| **鎖定狀態查詢**       | `app/api/collaboration/locks/[resourceType]/[resourceId]/status/route.ts` | 查詢資源鎖定狀態（GET）                      | 🟡 高    |

### ⏰ app/api/reminders/ - 智能提醒API (Sprint 7 Phase 1)

**用途**: 智能提醒系統REST API端點

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **提醒列表/創建**      | `app/api/reminders/route.ts`                 | 獲取提醒列表（GET），創建提醒（POST）        | 🔴 極高  |
| **提醒詳情/忽略**      | `app/api/reminders/[id]/route.ts`            | 獲取提醒詳情（GET），忽略提醒（DELETE）      | 🔴 極高  |
| **提醒延遲**           | `app/api/reminders/[id]/snooze/route.ts`     | 延遲提醒（PATCH），支持1-1440分鐘            | 🟡 高    |

### 📊 app/api/analytics/ - 行為追蹤API (Sprint 7 Phase 1)

**用途**: 用戶行為追蹤和畫像分析API端點

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **行為記錄**           | `app/api/analytics/track/route.ts`           | 記錄用戶行為（POST），支持10種行為類型       | 🔴 極高  |
| **用戶畫像**           | `app/api/analytics/profile/route.ts`         | 獲取用戶畫像（GET），支持強制刷新            | 🔴 極高  |
| **行為歷史**           | `app/api/analytics/behaviors/route.ts`       | 獲取行為歷史（GET），支持篩選和分頁          | 🟡 高    |

### 📅 app/api/meeting-prep/ - 會議準備包API (Sprint 7 Phase 1)

**用途**: 會議準備包管理REST API端點

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **準備包列表/創建**    | `app/api/meeting-prep/route.ts`              | 獲取準備包列表（GET），創建準備包（POST）    | 🔴 極高  |
| **準備包CRUD**         | `app/api/meeting-prep/[id]/route.ts`         | 獲取/更新/歸檔準備包（GET/PATCH/DELETE）     | 🔴 極高  |
| **模板列表**           | `app/api/meeting-prep/templates/route.ts`    | 獲取所有準備包模板（GET）                    | 🟡 高    |

### 🤖 app/api/meeting-intelligence/ - 會議智能分析API (Sprint 7 Phase 2完成) ⭐️

**用途**: AI驅動的會議智能分析和推薦API端點（Azure OpenAI GPT-4集成）

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **會議智能分析**       | `app/api/meeting-intelligence/analyze/route.ts` | GPT-4會議信息分析（POST），5類洞察生成，30分鐘緩存 | 🔴 極高  |
| **智能推薦**           | `app/api/meeting-intelligence/recommendations/route.ts` | 基於AI分析的推薦生成（POST），上下文感知  | 🔴 極高  |

### 🤖 app/api/assistant/ - 智能助手API (Sprint 7 Week 14完成) ⭐️

**用途**: AI助手對話API端點（Azure OpenAI GPT-4集成）

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **對話處理**           | `app/api/assistant/chat/route.ts`           | GPT-4對話處理（POST），上下文管理，快捷建議（GET） | 🔴 極高  |

### 📅 app/api/calendar/ - Microsoft Graph日曆API (Sprint 7 Phase 3完成) ⭐️

**用途**: Microsoft Graph日曆整合REST API端點（OAuth 2.0認證 + Delta Query同步）

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **OAuth認證**          | `app/api/calendar/auth/route.ts`             | 生成OAuth授權URL（GET），處理回調（POST）    | 🔴 極高  |
| **日曆事件**           | `app/api/calendar/events/route.ts`           | 獲取事件列表（GET），創建事件（POST）        | 🔴 極高  |
| **日曆同步**           | `app/api/calendar/sync/route.ts`             | 增量/完整同步（POST/PUT），狀態查詢（GET），重置（DELETE） | 🔴 極高  |

### 🎯 app/api/recommendations/ - 個性化推薦API (Sprint 7 Phase 2完成) ⭐️

**用途**: 個性化推薦引擎REST API端點（4種推薦策略：協同/內容/混合/流行度）

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **內容推薦**           | `app/api/recommendations/content/route.ts`   | 獲取內容推薦（GET），支持4種策略和內容類型篩選 | 🔴 極高  |
| **會議推薦**           | `app/api/recommendations/meetings/route.ts`  | 獲取會議相關推薦（GET），上下文感知推薦      | 🔴 極高  |
| **反饋記錄/統計**      | `app/api/recommendations/feedback/route.ts`  | 提交反饋（POST），獲取統計（GET），CTR和評分追蹤 | 🟡 高    |

### 📖 docs/user-stories/ - 用戶故事詳細規格

**用途**: 24個詳細用戶故事，按 Epic 組織

| Epic             | 目錄路徑                      | 包含故事數 | 說明                 |
| ---------------- | ----------------------------- | ---------- | -------------------- |
| **Epic 1** | `docs/user-stories/epic-1/` | 6個故事    | 基礎平台與知識管理   |
| **Epic 2** | `docs/user-stories/epic-2/` | 6個故事    | 智能銷售助手核心功能 |
| **Epic 3** | `docs/user-stories/epic-3/` | 6個故事    | AI 提案生成引擎      |
| **Epic 4** | `docs/user-stories/epic-4/` | 6個故事    | 雲端基礎設施和部署   |

**重要文件**:

- `docs/user-stories/index.md` - 用戶故事總索引
- `docs/user-stories/MVP-PRIORITIES.md` - 所有故事的優先級分配

#### Epic 1 詳細故事文件
- `docs/user-stories/epic-1/story-1.1-project-initialization.md` - 項目初始化和開發環境設置
- `docs/user-stories/epic-1/story-1.2-authentication-and-user-management.md` - 用戶認證和管理系統
- `docs/user-stories/epic-1/story-1.3-knowledge-base-data-model.md` - 知識庫數據模型設計
- `docs/user-stories/epic-1/story-1.4-ai-search-engine.md` - AI 智能搜索引擎
- `docs/user-stories/epic-1/story-1.5-knowledge-base-management.md` - 知識庫管理功能
- `docs/user-stories/epic-1/story-1.6-api-gateway-security.md` - API 閘道和安全控制

#### Epic 2 詳細故事文件
- `docs/user-stories/epic-2/story-2.1-crm-integration.md` - CRM 系統整合
- `docs/user-stories/epic-2/story-2.2-customer-360-view.md` - 客戶 360 度視圖
- `docs/user-stories/epic-2/story-2.3-meeting-preparation.md` - 會議準備助手
- `docs/user-stories/epic-2/story-2.4-sales-dashboard.md` - 銷售儀表板
- `docs/user-stories/epic-2/story-2.5-smart-reminders.md` - 智能提醒系統
- `docs/user-stories/epic-2/story-2.6-offline-mode.md` - 離線模式功能

#### Epic 3 詳細故事文件
- `docs/user-stories/epic-3/story-3.1-proposal-template-management.md` - 提案範本管理
- `docs/user-stories/epic-3/story-3.2-ai-content-generation.md` - AI 內容生成引擎
- `docs/user-stories/epic-3/story-3.3-personalization-engine.md` - 個人化推薦引擎
- `docs/user-stories/epic-3/story-3.4-proposal-workflow.md` - 提案工作流程
- `docs/user-stories/epic-3/story-3.5-proposal-analytics.md` - 提案數據分析
- `docs/user-stories/epic-3/story-3.6-multi-channel-distribution.md` - 多管道發布功能

#### Epic 4 詳細故事文件
- `docs/user-stories/epic-4/story-4.1-cloud-infrastructure.md` - 雲端基礎架構
- `docs/user-stories/epic-4/story-4.2-cicd-pipeline.md` - CI/CD 流水線
- `docs/user-stories/epic-4/story-4.3-monitoring-alerting.md` - 監控和告警系統
- `docs/user-stories/epic-4/story-4.4-security-hardening.md` - 安全強化
- `docs/user-stories/epic-4/story-4.5-performance-high-availability.md` - 生產級性能優化與高可用性架構（MVP Phase 2）
- `docs/user-stories/epic-4/story-4.5-performance-optimization.md` - 性能優化與擴展（Post-MVP）
- `docs/user-stories/epic-4/story-4.6-user-training.md` - 用戶培訓

### 🗄️ prisma/ - 資料庫設計

**用途**: PostgreSQL + pgvector 資料庫設計和遷移

| 文件類型             | 文件路徑                 | 用途說明                 |
| -------------------- | ------------------------ | ------------------------ |
| **資料庫模型** | `prisma/schema.prisma` | 完整資料庫 schema 定義   |
| **遷移文件**   | `prisma/migrations/`   | 資料庫版本控制和遷移腳本 |

### 🧪 poc/ - 概念驗證測試

**用途**: 核心技術組件的可行性驗證腳本

| 測試類型           | 文件路徑                             | 用途說明                       |
| ------------------ | ------------------------------------ | ------------------------------ |
| **CRM 整合** | `poc/dynamics-365-test.js`         | Dynamics 365 API 連接測試      |
| **向量搜索** | `poc/pgvector-performance-test.js` | PostgreSQL + pgvector 性能測試 |
| **AI 服務**  | `poc/azure-openai-cost-test.js`    | Azure OpenAI 成本和性能測試    |
| **AI 基礎測試** | `poc/azure-openai-basic-test.js`   | Azure OpenAI 基礎連接測試      |
| **Dynamics 模擬測試** | `poc/test-dynamics-mock.js`       | Dynamics 365 模擬模式測試      |
| **統合測試** | `poc/run-all-tests.js`             | 執行所有 POC 測試的主控制器    |
| **POC 說明** | `poc/README.md`                    | POC 測試使用指南               |

### 🛠️ scripts/ - 部署和維護腳本

**用途**: 資料庫初始化、測試執行和項目維護自動化腳本

| 腳本類型               | 文件路徑                          | 用途說明                     | 重要程度 |
| ---------------------- | --------------------------------- | ---------------------------- | -------- |
| **資料庫初始化** | `scripts/init-db.sql`           | PostgreSQL + pgvector 初始化 | 🟡 高    |
| **數據庫優化**   | `scripts/db-optimization.sql`   | PostgreSQL性能優化SQL腳本    | 🟡 高    |
| **增強DB優化**   | `scripts/enhanced-db-optimization.sql` | pgvector HNSW索引優化   | 🟡 高    |
| **健康檢查**     | `scripts/health-check.js`       | 服務健康狀態檢查腳本         | 🟡 高    |
| **測試運行器**   | `scripts/run-tests.js`          | 統一測試執行和管理工具       | 🟡 高    |
| **MVP 進度同步** | `scripts/sync-mvp-checklist.js` | 自動同步 MVP 實施進度        | 🟢 中    |
| **索引同步檢查** | `scripts/check-index-sync.js`   | 索引文件同步狀態檢查         | 🟢 中    |
| **環境設置**     | `scripts/setup-local-env.js`    | 本地開發環境自動設置         | 🟡 高    |
| **環境配置**     | `scripts/environment-setup.js`  | 環境變數和配置檢查           | 🟡 高    |
| **性能設置**     | `scripts/performance-setup.js`  | 性能優化自動配置             | 🟡 高    |
| **開發提醒**     | `scripts/dev-reminder.js`       | 開發流程提醒腳本             | 🟢 中    |
| **註釋檢查**     | `scripts/check-comments.js`     | 代碼註釋質量檢查             | 🟢 中    |
| **整合測試**     | `scripts/run-integration-tests.ts` | TypeScript整合測試執行    | 🟡 高    |
| **快速修復**     | `scripts/quick-fix.js`          | 常見問題快速修復腳本         | 🟢 中    |
| **測試DB設置**   | `scripts/setup-test-db.js`      | 測試數據庫初始化             | 🟡 高    |
| **Docker測試DB** | `scripts/setup-test-db-docker.js` | Docker測試環境設置         | 🟡 高    |
| **工作流程調試** | `scripts/debug-workflow.ts`     | 工作流程系統調試工具         | 🟡 高    |
| **登入API調試**  | `scripts/debug-login-api.ts`    | 登入API調試工具              | 🟡 高    |
| **UAT測試運行器** | `scripts/uat-test-runner.js`   | Sprint 7 UAT自動化測試執行腳本 | 🟡 高    |
| **服務重啟**     | `scripts/restart-services.bat`  | Windows服務重啟批處理        | 🟢 中    |

#### 💾 scripts/backup/ - 備份系統腳本 (Sprint 3 Week 6)

| 腳本類型               | 文件路徑                          | 用途說明                     | 重要程度 |
| ---------------------- | --------------------------------- | ---------------------------- | -------- |
| **資料庫備份** | `scripts/backup/database-backup.ts` | PostgreSQL自動備份腳本（pg_dump + 壓縮 + 加密 + 驗證，~545行） | 🔴 極高  |
| **文件系統備份** | `scripts/backup/file-system-backup.ts` | uploads目錄備份腳本（tar.gz + 增量支持，~420行） | 🔴 極高  |
| **備份調度器** | `scripts/backup/backup-scheduler.ts` | 統一備份調度管理器（資料庫+文件+報告生成，~330行） | 🔴 極高  |

### 🎨 app/ - Next.js 14 應用程式結構

**用途**: Next.js 14 App Router 架構，包含頁面、API 路由和布局

#### 📱 頁面和布局結構

| 目錄/文件            | 文件路徑                                         | 用途說明                 | 重要程度 |
| -------------------- | ------------------------------------------------ | ------------------------ | -------- |
| **根布局**     | `app/layout.tsx`                               | 應用程式全局布局和提供者 | 🔴 極高  |
| **首頁**       | `app/page.tsx`                                 | 應用程式主頁面           | 🟡 高    |
| **載入頁面**   | `app/loading.tsx`                              | 全局載入狀態頁面         | 🟢 中    |
| **錯誤頁面**   | `app/error.tsx`                                | 通用錯誤頁面             | 🟢 中    |
| **全局錯誤**   | `app/global-error.tsx`                         | 全局錯誤邊界處理         | 🟢 中    |
| **404頁面**    | `app/not-found.tsx`                            | 自定義404錯誤頁面        | 🟢 中    |
| **知識庫列表** | `app/dashboard/knowledge/page.tsx`           | 知識庫文檔列表頁面       | 🔴 極高  |
| **知識庫創建** | `app/dashboard/knowledge/create/page.tsx`    | 創建新知識庫項目頁面     | 🟡 高    |
| **文檔上傳**   | `app/dashboard/knowledge/upload/page.tsx`    | 文檔上傳處理頁面         | 🟡 高    |
| **智能搜索**   | `app/dashboard/knowledge/search/page.tsx`    | AI智能搜索功能頁面       | 🟡 高    |
| **進階搜索**   | `app/dashboard/knowledge/advanced-search/page.tsx` | 多條件組合搜索頁面 | 🟡 高    |
| **資料夾管理** | `app/dashboard/knowledge/folders/page.tsx`   | 資料夾樹狀管理頁面       | 🟡 高    |
| **AI智能助手** | `app/dashboard/assistant/page.tsx`           | AI對話助手頁面（Sprint 7 Week 14） | 🔴 極高  |
| **分析統計**   | `app/dashboard/knowledge/analytics/page.tsx` | 知識庫分析儀表板頁面     | 🟡 高    |
| **文檔詳情**   | `app/dashboard/knowledge/[id]/page.tsx`      | 文檔詳情查看頁面         | 🟡 高    |
| **文檔編輯**   | `app/dashboard/knowledge/[id]/edit/page.tsx` | 文檔內容編輯頁面         | 🟢 中    |

#### 🔐 認證相關頁面

| 頁面類型           | 文件路徑                         | 用途說明           | 重要程度 |
| ------------------ | -------------------------------- | ------------------ | -------- |
| **認證布局** | `app/(auth)/layout.tsx`        | 認證頁面共用布局   | 🟡 高    |
| **登入頁面** | `app/(auth)/login/page.tsx`    | 用戶登入表單和邏輯 | 🔴 極高  |
| **註冊頁面** | `app/(auth)/register/page.tsx` | 用戶註冊表單和邏輯 | 🔴 極高  |

#### 📊 儀表板頁面

| 頁面類型             | 文件路徑                               | 用途說明             | 重要程度 |
| -------------------- | -------------------------------------- | -------------------- | -------- |
| **儀表板布局** | `app/dashboard/layout.tsx`         | 保護路由和儀表板布局 | 🔴 極高  |
| **主儀表板**   | `app/dashboard/page.tsx` | 主要儀表板頁面       | 🔴 極高  |
| **客戶管理**   | `app/dashboard/customers/page.tsx` | 客戶列表和管理頁面   | 🔴 極高  |
| **客戶詳情**   | `app/dashboard/customers/[id]/page.tsx` | 客戶詳情360度視圖頁面 | 🟡 高    |
| **智能搜索**   | `app/dashboard/search/page.tsx` | 全局AI智能搜索頁面   | 🔴 極高  |
| **提案管理**   | `app/dashboard/proposals/page.tsx` | 提案列表和管理頁面   | 🔴 極高  |
| **提案生成**   | `app/dashboard/proposals/generate/page.tsx` | AI提案生成頁面       | 🟡 高    |
| **範本創建**   | `app/dashboard/proposals/templates/new/page.tsx` | 新提案範本創建頁面   | 🟡 高    |
| **範本詳情**   | `app/dashboard/proposals/templates/[id]/page.tsx` | 提案範本詳情查看頁面 | 🟢 中    |
| **任務管理**   | `app/dashboard/tasks/page.tsx` | 任務列表和管理頁面   | 🟡 高    |
| **系統設置**   | `app/dashboard/settings/page.tsx` | 用戶設置和配置頁面   | 🟡 高    |
| **通知中心**   | `app/dashboard/notifications/page.tsx` | 通知列表和管理中心（Sprint 5 Week 10） | 🔴 極高  |
| **通知偏好**   | `app/dashboard/notifications/preferences/page.tsx` | 通知偏好設置頁面（Sprint 5 Week 10） | 🟡 高    |

#### 🧩 components/notifications/ - 通知UI組件 (Sprint 5 Week 10完成)

**用途**: 可復用的通知相關React組件

| 組件類型               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **通知項目**           | `components/notifications/notification-item.tsx` | 單個通知卡片組件，支持已讀/刪除            | 🔴 極高  |
| **通知列表**           | `components/notifications/notification-list.tsx` | 通知列表容器，分頁/過濾/批量操作           | 🔴 極高  |
| **通知鈴鐺**           | `components/notifications/notification-bell.tsx` | 導航欄通知圖標，未讀徽章，下拉預覽         | 🔴 極高  |

**✅ 完成狀態**: Sprint 5 Week 10 Day 2 完成 (2025-10-02)
- 5個React組件（通知中心頁面 + 偏好設置頁面 + 3個可復用組件）
- 完整功能：實時更新、分類過濾、批量操作、偏好管理
- 集成Lucide React圖標 + Tailwind CSS樣式

#### 🔌 API 路由結構

| API 類別           | 端點路徑                    | 用途說明             | 重要程度 |
| ------------------ | --------------------------- | -------------------- | -------- |
| **健康檢查** | `app/api/health/route.ts` | API 服務健康狀態檢查 | 🟢 中    |
| **監控管理** | `app/api/monitoring/init/route.ts` | 監控系統初始化和管理API端點 | 🟡 高    |
| **客戶管理** | `app/api/customers/route.ts` | 客戶資料CRUD操作     | 🔴 極高  |
| **客戶360視圖** | `app/api/customers/[id]/360-view/route.ts` | 客戶360度視圖數據    | 🟡 高    |
| **提案範本管理** | `app/api/proposal-templates/route.ts` | 提案範本CRUD操作     | 🔴 極高  |
| **範本詳情** | `app/api/proposal-templates/[id]/route.ts` | 單個範本操作         | 🟡 高    |
| **範本統計** | `app/api/proposal-templates/[id]/stats/route.ts` | 範本使用統計         | 🟢 中    |
| **範本測試** | `app/api/proposal-templates/[id]/test/route.ts` | 範本功能測試         | 🟢 中    |
| **AI提案生成** | `app/api/ai/generate-proposal/route.ts` | AI驅動提案生成       | 🔴 極高  |
| **AI提案重生成** | `app/api/ai/regenerate-proposal/route.ts` | AI提案重新生成       | 🟡 高    |
| **CRM搜索** | `app/api/search/crm/route.ts` | CRM系統智能搜索      | 🟡 高    |
| **Catch-All路由** | `app/api/[...slug]/route.ts` | API 404處理，統一JSON響應格式 | 🟡 高    |
| **Dynamics 365模擬** | `app/api/mock/dynamics365/[...path]/route.ts` | Dynamics 365模擬API端點 | 🟡 高    |

##### 🔐 認證 API (app/api/auth/)

| 端點               | 文件路徑                           | 用途說明                | HTTP 方法 |
| ------------------ | ---------------------------------- | ----------------------- | --------- |
| **登入**     | `app/api/auth/login/route.ts`    | 用戶登入驗證和 JWT 生成 | POST      |
| **註冊**     | `app/api/auth/register/route.ts` | 新用戶註冊處理          | POST      |
| **登出**     | `app/api/auth/logout/route.ts`   | 用戶登出處理            | POST      |
| **當前用戶** | `app/api/auth/me/route.ts`       | 獲取當前用戶信息        | GET       |

##### 🗄️ 知識庫 API (app/api/knowledge-base/)

| 端點                | 文件路徑                                       | 用途說明                 | HTTP 方法        |
| ------------------- | ---------------------------------------------- | ------------------------ | ---------------- |
| **主要 CRUD** | `app/api/knowledge-base/route.ts`            | 知識庫項目列表和創建     | GET, POST        |
| **單項管理**  | `app/api/knowledge-base/[id]/route.ts`       | 單個項目查看、更新、刪除 | GET, PUT, DELETE |
| **文檔內容**  | `app/api/knowledge-base/[id]/content/route.ts` | 文檔內容獲取和處理     | GET              |
| **文檔下載**  | `app/api/knowledge-base/[id]/download/route.ts` | 文檔下載服務           | GET              |
| **智能搜索**  | `app/api/knowledge-base/search/route.ts`     | 文本、語義、混合搜索     | POST             |
| **進階搜索**  | `app/api/knowledge-base/advanced-search/route.ts` | 多條件組合搜索，支持嵌套邏輯運算 | POST             |
| **搜索建議**  | `app/api/knowledge-base/suggestions/route.ts` | 智能搜索建議和自動補全   | GET, POST        |
| **文件上傳**  | `app/api/knowledge-base/upload/route.ts`     | 多格式文件上傳處理       | GET, POST        |
| **批量上傳**  | `app/api/knowledge-base/bulk-upload/route.ts` | 批量文件上傳，自動解析   | POST             |
| **標籤管理**  | `app/api/knowledge-base/tags/route.ts`       | 層次化標籤CRUD操作       | GET, POST        |
| **處理任務**  | `app/api/knowledge-base/processing/route.ts` | 異步處理任務管理         | GET, POST        |
| **分析統計**  | `app/api/knowledge-base/analytics/route.ts`  | 知識庫統計分析API        | GET              |
| **版本列表**  | `app/api/knowledge-base/[id]/versions/route.ts` | 文檔版本列表和創建    | GET, POST        |
| **單個版本**  | `app/api/knowledge-base/[id]/versions/[versionId]/route.ts` | 版本查看和刪除 | GET, DELETE      |
| **版本比較**  | `app/api/knowledge-base/[id]/versions/compare/route.ts` | 版本差異比較     | POST             |
| **版本回滾**  | `app/api/knowledge-base/[id]/versions/revert/route.ts` | 版本回滾功能     | POST             |

### 🧩 components/ - React 組件庫

**用途**: 可重用的 React 組件，按功能分層組織

#### 🎨 UI 基礎組件 (components/ui/)

| 組件名稱           | 文件路徑                            | 用途說明                   | 重要程度 |
| ------------------ | ----------------------------------- | -------------------------- | -------- |
| **按鈕**     | `components/ui/button.tsx`        | 可重用按鈕組件             | 🔴 極高  |
| **錯誤顯示** | `components/ui/error-display.tsx` | 錯誤信息顯示組件           | 🟡 高    |
| **卡片**     | `components/ui/card.tsx`          | 內容卡片容器組件           | 🔴 極高  |
| **輸入框**   | `components/ui/input.tsx`         | 文本輸入框組件             | 🔴 極高  |
| **標籤**     | `components/ui/label.tsx`         | 表單標籤組件               | 🟡 高    |
| **文本域**   | `components/ui/textarea.tsx`      | 多行文本輸入組件           | 🟡 高    |
| **下拉菜單** | `components/ui/dropdown-menu.tsx` | Radix UI 下拉菜單組件      | 🟡 高    |
| **徽章**     | `components/ui/badge.tsx`         | 狀態徽章和標籤組件         | 🟢 中    |
| **警告**     | `components/ui/alert.tsx`         | 通知和警告信息組件         | 🟢 中    |
| **選擇框**   | `components/ui/select.tsx`        | 下拉選擇框組件             | 🟢 中    |
| **頭像**     | `components/ui/avatar.tsx`        | 用戶頭像顯示組件           | 🟢 中    |
| **標籤頁**   | `components/ui/tabs.tsx`          | 標籤頁切換組件             | 🟡 高    |
| **複選框**   | `components/ui/checkbox.tsx`      | 複選框組件                 | 🟡 高    |
| **開關**     | `components/ui/switch.tsx`        | 開關切換組件               | 🟡 高    |
| **分隔線**   | `components/ui/separator.tsx`     | 內容分隔線組件             | 🟢 中    |
| **進度條**   | `components/ui/progress.tsx`      | 進度顯示組件               | 🟢 中    |
| **滑塊**     | `components/ui/slider.tsx`        | 數值滑塊組件               | 🟢 中    |
| **對話框**   | `components/ui/dialog.tsx`        | 模態對話框組件             | 🔴 極高  |
| **警告對話框** | `components/ui/alert-dialog.tsx` | Shadcn/ui警告對話框組件    | 🟡 高    |
| **命令面板** | `components/ui/command.tsx`       | Shadcn/ui命令面板組件      | 🟡 高    |
| **彈出層**   | `components/ui/popover.tsx`       | Shadcn/ui彈出層組件        | 🟡 高    |
| **骨架屏**   | `components/ui/skeleton.tsx`      | 加載骨架屏組件             | 🟢 中    |
| **Toast Hook** | `components/ui/use-toast.ts`    | Toast通知React Hook       | 🟡 高    |

#### 🏗️ 布局組件 (components/layout/)

| 組件名稱             | 文件路徑                                       | 用途說明         | 重要程度 |
| -------------------- | ---------------------------------------------- | ---------------- | -------- |
| **儀表板頂部** | `components/layout/dashboard-header.tsx`     | 儀表板頂部導航欄 | 🔴 極高  |
| **側邊欄**     | `components/layout/dashboard-sidebar.tsx`    | 儀表板側邊欄     | 🔴 極高  |
| **移動導航**   | `components/layout/dashboard-mobile-nav.tsx` | 響應式移動端導航 | 🟡 高    |

#### 📊 儀表板組件 (components/dashboard/)

| 組件名稱           | 文件路徑                                     | 用途說明          | 重要程度 |
| ------------------ | -------------------------------------------- | ----------------- | -------- |
| **儀表板統計** | `components/dashboard/dashboard-stats.tsx` | 關鍵指標統計卡片  | 🔴 極高  |
| **AI 洞察**  | `components/dashboard/ai-insights.tsx`     | AI 分析和建議組件 | 🔴 極高  |
| **快速操作** | `components/dashboard/quick-actions.tsx`   | 快速操作按鈕組    | 🟡 高    |
| **最近活動** | `components/dashboard/recent-activity.tsx` | 用戶活動時間線    | 🟡 高    |
| **銷售圖表** | `components/dashboard/sales-chart.tsx`     | 銷售數據可視化    | 🟡 高    |
| **重要客戶** | `components/dashboard/top-customers.tsx`   | 客戶列表和狀態    | 🟡 高    |

#### 📚 知識庫組件 (components/knowledge/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- |
| **知識庫列表** | `components/knowledge/knowledge-base-list.tsx`     | 知識庫文檔列表顯示               | 🔴 極高  |
| **篩選器**     | `components/knowledge/knowledge-base-filters.tsx`  | 文檔搜索和篩選組件               | 🟡 高    |
| **文檔上傳**   | `components/knowledge/knowledge-base-upload.tsx`   | 文檔上傳和處理組件               | 🟡 高    |
| **知識庫搜索** | `components/knowledge/knowledge-search.tsx`        | 知識庫專用搜索組件               | 🔴 極高  |
| **增強搜索**   | `components/knowledge/enhanced-knowledge-search.tsx` | 增強版知識庫搜索界面           | 🔴 極高  |
| **文檔預覽**   | `components/knowledge/knowledge-document-view.tsx` | 文檔詳細信息預覽、內容和統計顯示 | 🟢 高    |
| **文檔編輯**   | `components/knowledge/knowledge-document-edit.tsx` | 文檔內容和屬性編輯表單           | 🟢 高    |
| **文檔創建表單** | `components/knowledge/knowledge-create-form.tsx`   | 新知識庫項目創建表單             | 🟡 高    |
| **文檔預覽器** | `components/knowledge/document-preview.tsx`        | 文檔內容預覽組件                 | 🟢 中    |
| **列表優化版** | `components/knowledge/knowledge-base-list-optimized.tsx` | 性能優化的知識庫列表組件 | 🟡 高    |

##### Sprint 6 Week 11-12 新增組件

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **資料夾樹狀導航** | `components/knowledge/knowledge-folder-tree.tsx`   | 無限層級資料夾樹，拖放排序       | ~650行   | 🔴 極高  |
| **富文本編輯器**   | `components/knowledge/rich-text-editor.tsx`        | Tiptap編輯器，完整工具欄         | ~800行   | 🔴 極高  |
| **資料夾選擇器**   | `components/knowledge/folder-selector.tsx`         | 下拉資料夾選擇，子資料夾選項     | ~300行   | 🟡 高    |
| **進階搜索構建器** | `components/knowledge/advanced-search-builder.tsx` | 可視化查詢構建器，無限嵌套       | ~680行   | 🔴 極高  |
| **搜索建議**       | `components/knowledge/search-suggestions.tsx`      | 智能搜索建議，實時補全           | ~200行   | 🟡 高    |
| **搜索結果優化器** | `components/knowledge/search-results-optimizer.tsx` | 搜索結果排序和優化             | ~250行   | 🟡 高    |
| **搜索分析儀表板** | `components/knowledge/search-analytics-dashboard.tsx` | 搜索統計分析儀表板           | ~300行   | 🟡 高    |
| **麵包屑導航**     | `components/knowledge/breadcrumb-navigation.tsx`   | 資料夾路徑導航，智能省略         | ~180行   | 🟡 高    |
| **快速跳轉搜索**   | `components/knowledge/quick-jump-search.tsx`       | Cmd+K快速跳轉，並行搜索          | ~300行   | 🔴 極高  |
| **批量上傳**       | `components/knowledge/bulk-upload.tsx`             | 拖放批量上傳，文件預覽           | ~320行   | 🟡 高    |
| **版本編輯整合**   | `components/knowledge/knowledge-document-edit-with-version.tsx` | 雙標籤頁編輯+版本歷史 | ~700行   | 🔴 極高  |

##### 版本控制組件 (components/knowledge/version/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **版本歷史**       | `components/knowledge/version/KnowledgeVersionHistory.tsx` | 版本列表，時間線顯示       | ~300行   | 🔴 極高  |
| **版本比較**       | `components/knowledge/version/KnowledgeVersionComparison.tsx` | 版本差異對比，並排顯示   | ~250行   | 🔴 極高  |
| **版本回滾**       | `components/knowledge/version/KnowledgeVersionRestore.tsx` | 版本回滾，影響分析       | ~250行   | 🔴 極高  |

##### 分析統計組件 (components/knowledge/analytics/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **統計卡片**       | `components/knowledge/analytics/StatsCard.tsx`     | 統計卡片，值+增長率+趨勢         | ~86行    | 🟡 高    |
| **條形圖**         | `components/knowledge/analytics/BarChart.tsx`      | 純CSS條形圖組件                  | ~105行   | 🟡 高    |
| **圓餅圖**         | `components/knowledge/analytics/PieChart.tsx`      | 純SVG圓餅圖組件                  | ~149行   | 🟡 高    |
| **文檔列表**       | `components/knowledge/analytics/DocumentList.tsx`  | 文檔排行榜組件                   | ~150行   | 🟡 高    |
| **統一導出**       | `components/knowledge/analytics/index.ts`          | 分析統計組件統一導出             | ~10行    | 🟢 中    |

#### 🔍 搜索組件 (components/search/)

| 組件名稱           | 文件路徑                                 | 用途說明                 | 重要程度 |
| ------------------ | ---------------------------------------- | ------------------------ | -------- |
| **增強搜索**   | `components/search/enhanced-search.tsx` | 全局增強搜索組件         | 🔴 極高  |

#### 👥 CRM組件 (components/crm/)

| 組件名稱           | 文件路徑                                 | 用途說明                 | 重要程度 |
| ------------------ | ---------------------------------------- | ------------------------ | -------- |
| **客戶360視圖** | `components/crm/customer-360-view.tsx` | 客戶360度全景視圖組件    | 🔴 極高  |

#### 🔄 工作流程組件 (components/workflow/) - Sprint 5 Week 9 Day 2 完成

**用途**: 完整的提案工作流程前端 UI 系統，支持狀態管理、版本控制、評論協作和審批流程

**🎯 核心特點**:
- **React Server/Client Components 混合架構**: 最佳性能和交互體驗
- **TypeScript 完整類型安全**: 與後端工作流程引擎完美對接
- **Shadcn/ui + Radix UI**: 企業級 UI 組件庫，無障礙設計
- **中文本地化**: date-fns 時間處理，完整中文支持

##### 工作流程狀態組件 (components/workflow/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **狀態徽章**   | `components/workflow/ProposalStatusBadge.tsx` | 12狀態徽章，圖標+顏色系統，狀態圖例 | 150 | 🔴 極高  |
| **狀態時間線** | `components/workflow/WorkflowTimeline.tsx` | 狀態轉換歷史時間線，自動/手動標記，精簡版支持 | 220 | 🔴 極高  |
| **轉換按鈕**   | `components/workflow/StateTransitionButton.tsx` | 狀態轉換操作，批准/拒絕/委派，對話框確認 | 240 | 🔴 極高  |

##### 版本控制組件 (components/workflow/version/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **版本歷史**   | `components/workflow/version/VersionHistory.tsx` | 版本列表，比較/回滾/下載，標籤管理 | 220 | 🔴 極高  |
| **版本比較**   | `components/workflow/version/VersionComparison.tsx` | 並排差異對比，變更統計，多視圖展示 | 310 | 🔴 極高  |
| **版本回滾**   | `components/workflow/version/VersionRestore.tsx` | 版本回滾確認，影響分析，備份選項 | 250 | 🔴 極高  |

**💡 注意**: 這裡的版本控制組件用於提案工作流程。知識庫版本控制組件位於 `components/knowledge/version/`，添加如下：

##### 知識庫版本控制組件 (components/knowledge/version/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **版本歷史組件**   | `components/knowledge/version/KnowledgeVersionHistory.tsx` | 知識庫文檔版本歷史展示、差異對比、回滾 | ~900行   | 🔴 極高  |
| **統一導出**       | `components/knowledge/version/index.ts`               | 知識庫版本組件統一導出         | ~10行    | 🟢 中    |

##### 評論系統組件 (components/workflow/comments/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **評論串**     | `components/workflow/comments/CommentThread.tsx` | 樹狀評論結構，開啟/已解決狀態，精簡版 | 250 | 🔴 極高  |
| **評論項目**   | `components/workflow/comments/CommentItem.tsx` | 單條評論，@mentions 高亮，回覆/編輯 | 220 | 🔴 極高  |
| **評論表單**   | `components/workflow/comments/CommentForm.tsx` | 評論輸入，@mentions 自動完成，富文本 | 230 | 🔴 極高  |

##### 審批管理組件 (components/workflow/approval/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **任務列表**   | `components/workflow/approval/ApprovalTaskList.tsx` | 審批任務，優先級/狀態篩選，統計概覽 | 380 | 🔴 極高  |
| **審批表單**   | `components/workflow/approval/ApprovalForm.tsx` | 批准/拒絕/委派表單，決策確認 | 260 | 🔴 極高  |
| **審批進度**   | `components/workflow/approval/ApprovalProgress.tsx` | 多級審批進度，並行/順序支持，精簡版 | 330 | 🔴 極高  |

**📊 統計**:
- **組件數**: 13 個
- **總代碼行數**: ~3,010 lines
- **完成狀態**: Sprint 5 Week 9 Day 2 完成 (2025-10-01)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui, Radix UI, date-fns, Lucide React

#### 🤝 協作系統組件 (components/collaboration/) - Sprint 6 Week 12 完成

**用途**: 編輯鎖定和衝突檢測 UI 組件

**🎯 核心特點**:
- **實時鎖定狀態展示**: 顯示誰正在編輯資源
- **鎖定操作控制**: 獲取/釋放/刷新鎖定
- **衝突警告提示**: 檢測並提示編輯衝突
- **自動刷新機制**: 30秒輪詢更新鎖定狀態

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **編輯鎖定指示器**   | `components/collaboration/EditLockIndicator.tsx`   | 鎖定狀態展示，獲取/釋放操作       | ~300行   | 🔴 極高  |
| **統一導出**         | `components/collaboration/index.ts`                | 所有協作組件的統一導出入口       | ~10行    | 🟢 中    |

**📊 統計**:
- **組件數**: 1 個主組件
- **總代碼行數**: ~310 lines
- **完成狀態**: Sprint 6 Week 12 完成 (2025-10-05)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui

#### ⏰ 提醒系統組件 (components/reminder/) - Sprint 7 Phase 1 完成

**用途**: 智能提醒展示和管理 UI 組件

**🎯 核心特點**:
- **優先級視覺化**: URGENT/HIGH/NORMAL/LOW 顏色區分
- **時間倒計時顯示**: 實時倒計時到提醒時間
- **延遲選項**: 5分鐘/15分鐘/30分鐘/1小時/2小時/明天
- **狀態篩選**: 全部/待觸發/已觸發/已延遲
- **自動刷新**: 可配置間隔自動刷新提醒列表

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **提醒卡片**         | `components/reminder/ReminderCard.tsx`             | 單個提醒展示，延遲/忽略操作       | ~200行   | 🔴 極高  |
| **提醒列表**         | `components/reminder/ReminderList.tsx`             | 提醒列表，狀態篩選，自動刷新      | ~250行   | 🔴 極高  |
| **統一導出**         | `components/reminder/index.ts`                     | 所有提醒組件的統一導出入口       | ~15行    | 🟢 中    |

**📊 統計**:
- **組件數**: 2 個主組件
- **總代碼行數**: ~465 lines
- **完成狀態**: Sprint 7 Phase 1 完成 (2025-10-05)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui, Lucide React

#### 📅 會議準備包組件 (components/meeting-prep/) - Sprint 7 Phase 3 完成

**用途**: 會議準備包展示、創建和管理 UI 組件

**🎯 核心特點**:
- **6種準備包類型**: 銷售會議/客戶簡報/內部審查/提案討論/培訓會議/自定義
- **5種狀態Badge**: 草稿/就緒/使用中/已完成/已歸檔
- **4步驟創建流程**: 類型選擇→模板選擇→信息填寫→預覽確認
- **列表/網格視圖**: 切換展示模式,狀態/類型篩選,搜索排序

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **準備包卡片**       | `components/meeting-prep/PrepPackageCard.tsx`      | 單個準備包展示,進度指示器,快速操作 | ~300行   | 🔴 極高  |
| **準備包列表**       | `components/meeting-prep/PrepPackageList.tsx`      | 列表/網格視圖,篩選排序,統計數據   | ~550行   | 🔴 極高  |
| **準備包創建嚮導**   | `components/meeting-prep/PrepPackageWizard.tsx`    | 4步驟創建流程,模板選擇,拖拽排序   | ~650行   | 🔴 極高  |
| **統一導出**         | `components/meeting-prep/index.ts`                 | 所有準備包組件的統一導出入口      | ~15行    | 🟢 中    |

**📊 統計**:
- **組件數**: 3 個主組件
- **總代碼行數**: ~1,515 lines
- **完成狀態**: Sprint 7 Phase 3 完成 (2025-10-05)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui, Lucide React, React DnD

#### 🤖 智能助手組件 (components/assistant/) - Sprint 7 Week 14 完成

**用途**: AI助手對話介面UI組件

**🎯 核心特點**:
- **完整對話介面**: 訊息展示、輸入、歷史管理
- **智能交互**: Azure OpenAI GPT-4集成、上下文管理
- **快捷操作**: 預設問題、對話導出、清空功能
- **響應式設計**: 桌面端和移動端適配

| 組件名稱             | 文件路徑                                   | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ------------------------------------------ | -------------------------------- | -------- | -------- |
| **聊天訊息組件**     | `components/assistant/ChatMessage.tsx`   | 單條訊息展示,角色標識,時間戳,載入動畫 | ~150行   | 🔴 極高  |
| **聊天輸入組件**     | `components/assistant/ChatInput.tsx`     | 文本輸入,Enter發送,字符計數,載入狀態 | ~160行   | 🔴 極高  |
| **聊天視窗組件**     | `components/assistant/ChatWindow.tsx`    | 完整對話介面,快捷操作,導出清空功能 | ~240行   | 🔴 極高  |
| **統一導出**         | `components/assistant/index.ts`          | 所有助手組件的統一導出入口      | ~15行    | 🟢 中    |

**📊 統計**:
- **組件數**: 3 個主組件
- **總代碼行數**: ~565 lines
- **完成狀態**: Sprint 7 Week 14 完成 (2025-10-05)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui, Azure OpenAI

#### 🎯 推薦系統組件 (components/recommendation/) - Sprint 7 Phase 3 完成

**用途**: 個性化推薦展示和反饋 UI 組件

**🎯 核心特點**:
- **7種內容類型**: 知識庫/提案/模板/客戶/會議/工作流/通知
- **4級相關度**: 高度相關(≥0.8)/相關(0.6-0.8)/可能相關(0.4-0.6)/低相關(<0.4)
- **4種推薦策略**: 協同過濾/基於內容/混合推薦/流行度
- **反饋閉環**: 喜歡/不喜歡/忽略,點擊追蹤,統計分析

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **推薦卡片**         | `components/recommendation/RecommendationCard.tsx` | 單個推薦項目,相關度指示器,反饋按鈕 | ~350行   | 🔴 極高  |
| **推薦列表**         | `components/recommendation/RecommendationList.tsx` | 推薦列表,策略切換,內容篩選,無限滾動 | ~400行   | 🔴 極高  |
| **統一導出**         | `components/recommendation/index.ts`               | 所有推薦組件的統一導出入口        | ~15行    | 🟢 中    |

**📊 統計**:
- **組件數**: 2 個主組件
- **總代碼行數**: ~765 lines
- **完成狀態**: Sprint 7 Phase 3 完成 (2025-10-05)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui, Lucide React

#### 📅 日曆組件 (components/calendar/) - Sprint 7 Phase 3 完成

**用途**: Microsoft Graph日曆整合 UI 組件

**🎯 核心特點**:
- **三種視圖模式**: 日視圖(24小時時間軸)/週視圖(7天網格)/月視圖(完整月份)
- **時間導航**: 前一天/週/月,今天,下一天/週/月
- **搜索篩選**: 事件標題/內容/地點搜索,線上會議篩選
- **同步狀態**: 顯示同步進度,手動同步按鈕
- **事件卡片**: 完整/精簡/最小三種模式,適配不同視圖

| 組件名稱             | 文件路徑                                             | 用途說明                         | 代碼行數 | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- | -------- |
| **日曆視圖**         | `components/calendar/CalendarView.tsx`             | 日/週/月視圖,時間導航,搜索篩選,同步狀態 | ~700行   | 🔴 極高  |
| **統一導出**         | `components/calendar/index.ts`                     | 所有日曆組件的統一導出入口        | ~10行    | 🟢 中    |

**📊 統計**:
- **組件數**: 1 個主組件
- **總代碼行數**: ~710 lines
- **完成狀態**: Sprint 7 Phase 3 完成 (2025-10-05)
- **技術棧**: Next.js 14, React, TypeScript, Shadcn/ui, Lucide React, date-fns

**🎨 設計特點**:
- 完整的工作流程 UI 覆蓋
- 響應式設計，支持精簡版組件
- 一致的視覺語言和交互模式
- 無障礙設計（Radix UI）
- 中文本地化和時間格式化

#### 🔧 管理組件 (components/admin/)

| 組件名稱             | 文件路徑                                             | 用途說明                         | 重要程度 |
| -------------------- | ---------------------------------------------------- | -------------------------------- | -------- |
| **系統監控**       | `components/admin/system-monitor.tsx`            | 系統健康狀態監控組件             | 🔴 極高  |
| **性能監控儀表板** | `components/admin/performance-dashboard.tsx`     | 性能指標監控和可視化儀表板       | 🟡 高    |

### 📚 lib/ - 核心模組庫

**用途**: 應用程式核心邏輯、工具函數和服務封裝

#### 🤖 AI 服務模組 (lib/ai/)

| 模組名稱                | 文件路徑                        | 用途說明                | 重要程度 |
| ----------------------- | ------------------------------- | ----------------------- | -------- |
| **統一導出**      | `lib/ai/index.ts`             | AI 服務統一入口和導出   | 🔴 極高  |
| **OpenAI 客戶端** | `lib/ai/openai.ts`            | Azure OpenAI 連接和配置 | 🔴 極高  |
| **向量嵌入**      | `lib/ai/embeddings.ts`        | 文檔向量化和嵌入處理    | 🔴 極高  |
| **增強嵌入服務**  | `lib/ai/enhanced-embeddings.ts` | 智能緩存和批量優化嵌入服務 | 🔴 極高  |
| **聊天服務**      | `lib/ai/chat.ts`              | AI 聊天完成服務         | 🟡 高    |
| **Azure OpenAI服務** | `lib/ai/azure-openai-service.ts` | Azure OpenAI企業級服務封裝 | 🔴 極高  |
| **提案生成服務**  | `lib/ai/proposal-generation-service.ts` | AI驅動的提案內容生成服務 | 🔴 極高  |
| **類型定義**      | `lib/ai/types.ts`             | AI 相關 TypeScript 類型 | 🟡 高    |

#### 📚 知識庫核心模組 (lib/knowledge/) - Sprint 6 Week 12

| 模組名稱                | 文件路徑                        | 用途說明                | 代碼行數 | 重要程度 |
| ----------------------- | ------------------------------- | ----------------------- | -------- | -------- |
| **全文檢索引擎**  | `lib/knowledge/full-text-search.ts` | PostgreSQL全文檢索封裝，中文分詞，搜索高亮，相關性評分 | ~462行 | 🔴 極高  |
| **搜索歷史管理**  | `lib/knowledge/search-history-manager.ts` | 搜索歷史記錄，localStorage持久化，保存查詢功能 | ~220行 | 🟡 高    |
| **版本控制服務**  | `lib/knowledge/version-control.ts` | 文檔版本管理，快照創建，差異比較，版本回滾 | ~500行 | 🔴 極高  |
| **分析統計服務**  | `lib/knowledge/analytics-service.ts` | 知識庫統計分析，熱門文檔，分布統計，用戶活動 | ~717行 | 🔴 極高  |
| **統一導出**      | `lib/knowledge/index.ts`      | 知識庫模組統一入口和導出 | ~20行 | 🟡 高    |

**技術特性**:
- ✅ **全文檢索**: PostgreSQL ts_query/ts_vector，中文停用詞過濾，搜索結果高亮
- ✅ **搜索歷史**: LocalStorage持久化，最近10次記錄，保存查詢功能
- ✅ **版本控制**: 快照管理，JSON diff差異計算，安全回滾機制
- ✅ **數據分析**: Prisma groupBy聚合，基於AuditLog統計，增長率計算

### 🔗 lib/integrations/ - 外部系統整合

**用途**: Dynamics 365 CRM整合、Customer 360服務

#### 📊 Dynamics 365整合 (lib/integrations/dynamics365/)

| 模組名稱           | 文件路徑                             | 用途說明                 | 重要程度 |
| ------------------ | ------------------------------------ | ------------------------ | -------- |
| **客戶端**   | `lib/integrations/dynamics365/client.ts` | Dynamics 365 API客戶端封裝 | 🔴 極高  |
| **認證服務** | `lib/integrations/dynamics365/auth.ts` | Dynamics 365 OAuth認證    | 🔴 極高  |
| **同步服務** | `lib/integrations/dynamics365/sync.ts` | CRM數據雙向同步服務       | 🔴 極高  |

#### 👥 Customer 360服務 (lib/integrations/customer-360/)

| 模組名稱           | 文件路徑                                  | 用途說明                 | 重要程度 |
| ------------------ | ----------------------------------------- | ------------------------ | -------- |
| **360視圖服務** | `lib/integrations/customer-360/service.ts` | 客戶360度視圖聚合服務    | 🔴 極高  |

#### 🔍 搜索引擎模組 (lib/search/) - Week 5 新增

| 模組名稱                | 文件路徑                         | 用途說明                          | 重要程度 |
| ----------------------- | -------------------------------- | --------------------------------- | -------- |
| **向量搜索引擎**  | `lib/search/vector-search.ts`   | 高性能向量相似度搜索核心引擎      | 🔴 極高  |
| **結果排序器**    | `lib/search/result-ranker.ts`   | 多維度搜索結果評分和排序算法      | 🔴 極高  |
| **查詢處理器**    | `lib/search/query-processor.ts` | 智能查詢理解、意圖識別和優化      | 🟡 高    |

#### 🚪 API Gateway 中間件 (lib/middleware/) - MVP Phase 2 Sprint 1 + Stage 3

**用途**: 企業級 API Gateway 中間件系統，10個生產級中間件

**📊 整體統計**:
- **代碼量**: 4,884 lines (不含配置文件)
- **測試覆蓋**: 382 tests (100% 通過率)
- **功能數**: 67 個企業級功能
- **性能**: 平均 ~4ms per test

##### Stage 1-2: 核心中間件 (8個中間件，3,263 lines，296 tests)

| 中間件名稱           | 文件路徑                              | 用途說明                                     | 代碼行數 | 測試數 | 重要程度 |
| -------------------- | ------------------------------------- | -------------------------------------------- | -------- | ------ | -------- |
| **Security Headers** | `lib/middleware/security-headers.ts` | 24種安全頭部（CSP, HSTS, XSS防護等）         | 198      | 24     | 🔴 極高  |
| **HTTPS Enforcement** | `lib/middleware/https-enforcement.ts` | HTTPS強制和HSTS頭部管理（Sprint 3）         | 350      | -      | 🔴 極高  |
| **CORS**            | `lib/middleware/cors.ts`             | 完整CORS支援（預檢、憑證、動態來源）         | 264      | 29     | 🔴 極高  |
| **Route Matcher**   | `lib/middleware/route-matcher.ts`    | 智能路由匹配（精確/前綴/正則/萬用字元）       | 187      | 23     | 🔴 極高  |
| **Request ID**      | `lib/middleware/request-id.ts`       | 請求追蹤ID生成（UUID v4）                    | 134      | 20     | 🔴 極高  |
| **Rate Limiter**    | `lib/middleware/rate-limiter.ts`     | 3種算法（固定窗口/滑動窗口/Token Bucket）     | 487      | 23     | 🔴 極高  |
| **API Versioning**  | `lib/middleware/api-versioning.ts`   | 4種版本策略（URL/Header/Query/Accept）       | 592      | 38     | 🔴 極高  |
| **Request Validator**| `lib/middleware/request-validator.ts`| 9種驗證（JSON Schema/文件上傳/安全檢查）      | 648      | 43     | 🔴 極高  |
| **Response Transformer**| `lib/middleware/response-transformer.ts`| 7種功能（HATEOAS/分頁/壓縮/多格式）        | 753      | 51     | 🔴 極高  |

##### Stage 3: 高級中間件 (2個中間件，1,621 lines，84 tests)

| 中間件名稱              | 文件路徑                                 | 用途說明                                     | 代碼行數 | 測試數 | 重要程度 |
| ----------------------- | ---------------------------------------- | -------------------------------------------- | -------- | ------ | -------- |
| **Request Transformer** | `lib/middleware/request-transformer.ts` | 請求轉換（Body/Headers/Path/Query/條件轉換） | 824      | 39     | 🔴 極高  |
| **Response Cache**      | `lib/middleware/response-cache.ts`      | HTTP快取（ETag/Cache-Control/304/記憶體存儲）| 797      | 45     | 🔴 極高  |

##### 配置文件

| 文件名稱           | 文件路徑                            | 用途說明                 | 代碼行數 | 重要程度 |
| ------------------ | ----------------------------------- | ------------------------ | -------- | -------- |
| **路由配置** | `lib/middleware/routing-config.ts` | 路由規則和中間件鏈配置   | 191      | 🟡 高    |

**✅ 完成狀態**: Sprint 1 + Stage 3 全面完成 (2025-10-01)

#### 🔌 API 工具 (lib/api/)

| 模組名稱           | 文件路徑                     | 用途說明               | 重要程度 |
| ------------------ | ---------------------------- | ---------------------- | -------- |
| **錯誤處理** | `lib/api/error-handler.ts` | API 統一錯誤處理中間件 | 🟡 高    |
| **響應助手** | `lib/api/response-helper.ts` | 統一API響應格式模組，標準化JSON輸出 | 🟡 高    |

#### 🔐 安全模組 (lib/security/) - MVP Phase 2 Sprint 3 Week 5

**用途**: 企業級安全加固功能 - 資料加密、角色權限控制、審計追蹤

| 模組名稱           | 文件路徑                     | 用途說明               | 代碼行數 | 測試數 | 重要程度 |
| ------------------ | ---------------------------- | ---------------------- | -------- | ------ | -------- |
| **加密服務** | `lib/security/encryption.ts` | AES-256-GCM企業級加密，欄位級別保護，哈希/令牌生成，異步Key Vault整合 | 442 | 40 | 🔴 極高 |
| **Azure Key Vault** | `lib/security/azure-key-vault.ts` | 雲端金鑰管理，Secret安全存儲，金鑰輪換，審計整合（Sprint 3） | 550 | - | 🔴 極高 |
| **敏感欄位配置** | `lib/security/sensitive-fields-config.ts` | 敏感欄位加密配置，三級安全等級，7模型12欄位，8個工具函數（Sprint 3 Week 5） | 280 | - | 🔴 極高 |
| **RBAC權限系統** | `lib/security/rbac.ts` | 5角色×23資源權限映射，細粒度CRUD控制，擁有權驗證 | 596 | 37 | 🔴 極高 |
| **權限中間件** | `lib/security/permission-middleware.ts` | Next.js API路由權限檢查，JWT驗證，HOF包裝器 | 504 | 32 | 🔴 極高 |
| **欄位級別權限** | `lib/security/field-level-permissions.ts` | 細粒度欄位訪問控制，4敏感級別，23個敏感欄位，API響應過濾（Sprint 3 Week 9） | 485 | 33 | 🔴 極高 |
| **操作級別限制** | `lib/security/action-restrictions.ts` | 操作級別權限服務，4種限制類型(RATE_LIMIT/QUOTA/FIELD_RESTRICTION/CONDITION)，10個配置（Sprint 3 Week 9） | 650 | 35 | 🔴 極高 |
| **統一細粒度權限** | `lib/security/fine-grained-permissions.ts` | 統一細粒度權限入口，FineGrainedPermissionService，三層權限整合（Sprint 3 Week 9） | 420 | - | 🔴 極高 |
| **Security模塊導出** | `lib/security/index.ts` | Security模塊統一導出入口（Sprint 3 Week 9） | 30 | - | 🔴 極高 |
| **審計日誌系統** | `lib/security/audit-log.ts` | 全面操作日誌記錄，不可篡改審計追蹤，合規報告生成 | 649 | 39 | 🔴 極高 |
| **備份恢復系統** | `lib/security/backup.ts` | 自動備份，備份驗證，資料恢復，保留策略 | 552 | 44 | 🔴 極高 |
| **GDPR合規** | `lib/security/gdpr.ts` | 資料導出，資料刪除，同意管理，隱私保護 | 459 | - | 🔴 極高 |

**🎯 核心功能**:
- **資料加密**: 256位AES-GCM，隨機IV，認證標籤防篡改，支援批量欄位加密/解密
- **權限控制**: ADMIN/SALES_MANAGER/SALES_REP/MARKETING/VIEWER 五級權限
- **資源保護**: 23種系統資源（customers, proposals, knowledge_base等）
- **操作控制**: 14種操作類型（CRUD + LIST/SEARCH/EXPORT/APPROVE等）
- **安全特性**: 最小權限原則、職責分離、資源擁有權驗證、權限矩陣生成
- **中間件整合**: JWT驗證、權限檢查、資源擁有權驗證、HOF API包裝器

**✅ 完成狀態**: Sprint 3 完成 (2025-10-07)
- Week 5: 加密(40) + RBAC(37) + 權限中間件(32) = 109 tests
- Week 6: 審計日誌(39) + 備份系統(44) + npm audit(0漏洞) = 83 tests
- Week 9: 欄位級別權限(33) + 操作級別限制(35) = 68 tests
- 總計: 260/260 tests passing (100%)

#### 💾 資料庫模組 (lib/db/)

| 模組名稱             | 文件路徑    | 用途說明             | 重要程度 |
| -------------------- | ----------- | -------------------- | -------- |
| **資料庫目錄** | `lib/db/` | 資料庫相關工具和配置 | 🟢 中    |

#### 🛠️ 工具模組 (lib/utils/)

| 模組名稱           | 文件路徑       | 用途說明         | 重要程度 |
| ------------------ | -------------- | ---------------- | -------- |
| **工具目錄** | `lib/utils/` | 通用工具函數集合 | 🟢 中    |

#### ⚡ 性能模組 (lib/performance/) - MVP Phase 2 Sprint 4 Week 7

**用途**: 性能優化和高可用性 - API響應緩存、查詢優化、性能監控、熔斷器模式

| 模組名稱           | 文件路徑                           | 用途說明               | 代碼行數 | 測試數 | 重要程度 |
| ------------------ | ---------------------------------- | ---------------------- | -------- | ------ | -------- |
| **API響應緩存** | `lib/performance/response-cache.ts` | HTTP響應緩存，ETag支持，條件請求，標籤失效，緩存統計 | 481 | 30 | 🔴 極高 |
| **查詢優化器** | `lib/performance/query-optimizer.ts` | DataLoader批次查詢，N+1檢測，慢查詢分析，查詢追蹤 | 521 | 26 | 🔴 極高 |
| **性能監控** | `lib/performance/monitor.ts` | API性能追蹤，批次寫入，警報系統，報告生成，中間件，Core Web Vitals | 573 | 36 | 🔴 極高 |
| **熔斷器** | `lib/resilience/circuit-breaker.ts` | 熔斷器模式，快速失敗，自動恢復，半開測試，統計追蹤，熔斷器管理器 | 446 | 43 | 🔴 極高 |
| **健康檢查** | `lib/resilience/health-check.ts` | 多服務健康檢查，依賴管理，健康評分，自動恢復，熔斷器整合，定期監控 | 579 | 34 | 🔴 極高 |
| **重試策略** | `lib/resilience/retry.ts` | 可配置重試策略，4種退避算法，條件重試，統計追蹤，超時控制，批量重試 | 486 | 29 | 🔴 極高 |

**🎯 核心功能**:
- **響應緩存**: TTL配置、ETag生成、條件請求(304)、標籤失效、統計追蹤
- **查詢優化**: DataLoader防N+1、批次查詢、查詢性能追蹤、慢查詢檢測
- **性能監控**: 指標追蹤、批次寫入、警報系統、報告生成、中間件整合、Core Web Vitals
- **熔斷器模式**: 防級聯故障、快速失敗、自動恢復、半開測試、統計追蹤、批量執行
- **健康檢查**: 多服務監控、依賴驗證、健康評分、自動恢復檢測、定期檢查、系統報告
- **重試策略**: 可配置重試、4種退避算法(固定/線性/指數/抖動)、條件重試、超時控制、批量重試
- **N+1 預防**: 自動批次載入、請求去重、智能緩存、並發優化
- **性能分析**: 查詢統計、慢查詢識別、N+1問題檢測、優化建議生成
- **高可用性**: 故障隔離、超時保護、狀態管理、回調通知、強制控制、服務依賴鏈、智能重試

**✅ 完成狀態**: Sprint 4 Week 7.1-8.3 完成 (2025-10-01)
- Week 7.1: API響應緩存(30) = 30 tests passing (100%)
- Week 7.2: 查詢優化器(26) = 26 tests passing (100%)
- Week 7.3: 性能監控(36) = 36 tests passing (100%)
- Week 8.1: 熔斷器模式(43) = 43 tests passing (100%)
- Week 8.2: 健康檢查系統(34) = 34 tests passing (100%)
- Week 8.3: 重試策略(29) = 29 tests passing (100%)
- 總計: 198/198 tests passing (100%)

#### 💨 緩存模組 (lib/cache/)

| 類型             | 文件路徑                       | 用途說明             | 重要程度 |
| ---------------- | ------------------------------ | -------------------- | -------- |
| **Redis客戶端** | `lib/cache/redis-client.ts` | Redis緩存服務客戶端 | 🟡 高    |

#### 📄 核心文件

| 文件名稱                   | 文件路徑                    | 用途說明                           | 重要程度 |
| -------------------------- | --------------------------- | ---------------------------------- | -------- |
| **JWT 認證(客戶端)** | `lib/auth.ts`             | 客戶端安全認證工具和驗證函數   | 🔴 極高  |
| **JWT 認證(服務端)** | `lib/auth-server.ts`      | 服務端專用JWT操作和用戶認證    | 🔴 極高  |
| **資料庫連接**       | `lib/db.ts`               | Prisma 客戶端配置和連接        | 🔴 極高  |
| **錯誤處理**         | `lib/errors.ts`           | 統一錯誤類別和處理系統         | 🔴 極高  |
| **中間件**           | `lib/middleware.ts`       | Next.js 中間件定義             | 🟡 高    |
| **通用工具**         | `lib/utils.ts`            | 常用工具函數                   | 🟢 中    |

#### 📋 根目錄重要文檔

| 文件名稱                   | 文件路徑                    | 用途說明                           | 重要程度 |
| -------------------------- | --------------------------- | ---------------------------------- | -------- |
| **AI助手指南**       | `AI-ASSISTANT-GUIDE.md`     | AI助手完整使用指南和提醒系統       | 🔴 極高  |
| **開發服務管理指南** | `DEVELOPMENT-SERVICE-MANAGEMENT.md` | 避免多服務運行，開發流程規範  | 🟡 高    |
| **服務啟動指南**     | `START-SERVICES.md`         | 快速服務啟動指南                  | 🟡 高    |
| **E2E測試執行摘要**  | `e2e-test-summary.md`       | 端到端測試執行結果和分析      | 🟢 中    |
| **測試執行報告**     | `test-execution-report.md`  | 完整測試執行報告和覆蓋率      | 🟢 中    |
| **Playwright配置**   | `playwright.config.ts`      | 瀏覽器自動化測試配置          | 🟡 高    |

### 🔧 types/ - TypeScript 類型定義

**用途**: 項目全域 TypeScript 類型定義和介面聲明

| 文件名稱                 | 文件路徑              | 用途說明                         | 重要程度 |
| ------------------------ | --------------------- | -------------------------------- | -------- |
| **AI 服務類型**    | `types/ai.ts`       | Azure OpenAI 相關類型定義       | 🔴 極高  |
| **統一導出**       | `types/index.ts`    | 所有類型定義的統一導出入口       | 🟡 高    |
| **測試類型增強**   | `types/jest-dom.d.ts` | Jest DOM 測試庫類型增強聲明      | 🟢 中    |

### 🧪 測試文件結構

**用途**: 單元測試、整合測試和測試工具

#### 🔬 單元測試 (__tests__/)

| 測試類別                 | 文件路徑                                                            | 用途說明           | 重要程度 |
| ------------------------ | ------------------------------------------------------------------- | ------------------ | -------- |
| **API 測試目錄**   | `__tests__/api/`                                                  | API 端點單元測試   | 🟡 高    |
| **認證測試目錄**   | `__tests__/auth/`                                                 | 認證相關功能測試   | 🟡 高    |
| **庫模組測試**     | `__tests__/lib/`                                                  | lib/ 模組功能測試  | 🟡 高    |
| **工具測試目錄**   | `__tests__/utils/`                                                | 工具函數和測試輔助 | 🟢 中    |
| **測試輔助**       | `__tests__/utils/test-helpers.ts`                                 | 測試工具和模擬數據 | 🟡 高    |
| **嵌入測試**       | `__tests__/lib/ai/embeddings.test.ts`                             | 向量嵌入功能測試   | 🟡 高    |
| **登入測試**       | `__tests__/api/auth/login.test.ts`                                | 用戶登入流程測試   | 🟡 高    |
| **註冊測試**       | `__tests__/api/auth/register.test.ts`                             | 用戶註冊流程測試   | 🟡 高    |
| **錯誤處理測試**   | `__tests__/lib/error-handling.test.ts`                            | 錯誤處理系統測試   | 🟡 高    |
| **知識庫列表測試** | `__tests__/components/knowledge/knowledge-base-list.test.tsx`     | 知識庫列表組件測試 | 🟡 高    |
| **文檔預覽測試**   | `__tests__/components/knowledge/knowledge-document-view.test.tsx` | 文檔預覽組件測試   | 🟢 高    |
| **文檔編輯測試**   | `__tests__/components/knowledge/knowledge-document-edit.test.tsx` | 文檔編輯組件測試   | 🟢 高    |

##### 🔍 進階搜索測試 (__tests__/) - Sprint 6 Week 12

**用途**: 進階搜索功能完整測試套件 (Phase 1 完成)

**📊 測試統計**: 111 tests (100% 通過率), ~1,300行測試代碼

| 測試類別                     | 文件路徑                                                       | 用途說明                                     | 測試數 | 代碼行數 | 重要程度 |
| ---------------------------- | -------------------------------------------------------------- | -------------------------------------------- | ------ | -------- | -------- |
| **SearchHistoryManager測試** | `__tests__/lib/knowledge/search-history-manager.test.ts`       | 搜索歷史管理測試（添加/持久化/清理/保存）     | 32     | ~340行   | 🔴 極高  |
| **FullTextSearch測試**       | `__tests__/lib/knowledge/full-text-search.test.ts`             | 全文檢索測試（查詢/分詞/高亮/評分/建議）      | 39     | ~490行   | 🔴 極高  |
| **Advanced Search API測試**  | `__tests__/api/knowledge-base/advanced-search.test.ts`         | 高級搜索API測試（條件/邏輯/嵌套/認證/錯誤）   | 20     | ~270行   | 🔴 極高  |
| **AdvancedSearchBuilder測試**| `__tests__/components/knowledge/advanced-search-builder.test.tsx` | 搜索構建器組件測試（渲染/條件/組/回調/性能） | 20     | ~200行   | 🔴 極高  |

**✅ Phase 1 完成狀態** (2025-10-03):
- ✅ **測試覆蓋**: 單元測試 + 集成測試 + 組件測試 + 性能測試
- ✅ **Mock最佳實踐**: Module Mock, Async Mock, Instance Mock, Cleanup
- ✅ **測試穩定性**: 消除間歇性失敗, 100%可重複通過
- ✅ **測試修復**: Mock配置重構、組件測試優化、性能測試改進、API測試期望調整
- ✅ **技術亮點**: 中文停用詞、正則轉義、Jaccard相似度、搜索摘要提取

##### 🔄 工作流程測試 (__tests__/workflow/) - Sprint 5 Week 9

**用途**: 提案工作流程系統完整測試套件

| 測試類別                 | 文件路徑                                  | 用途說明                                     | 測試數 | 重要程度 |
| ------------------------ | ----------------------------------------- | -------------------------------------------- | ------ | -------- |
| **工作流程引擎測試**     | `__tests__/workflow/engine.test.ts`       | 狀態轉換、權限、自動化、審計追蹤測試（400行）| 待配置 | 🔴 極高  |

**🔧 測試配置文件**:
- `jest.config.workflow.js`: 工作流程測試專用Jest配置（真實DB、Node環境、30s超時）
- `jest.setup.workflow.js`: 測試環境設置（不mock Prisma）
- `.env.test`: 測試環境變數配置
- `scripts/setup-test-db.js`: 測試數據庫初始化腳本
- `docs/workflow-testing-guide.md`: 完整測試指南和故障排除

**📊 測試命令**:
- `npm run test:workflow`: 運行工作流程測試
- `npm run test:workflow:watch`: 監視模式
- `npm run test:workflow:coverage`: 覆蓋率報告
- `npm run test:workflow:setup`: 初始化測試數據庫

**✅ 完成狀態**: Sprint 5 Week 9 Day 2 完成 (2025-10-01)
- 測試框架: 400行完整測試套件
- 測試範圍: 狀態轉換/權限檢查/自動化工作流程/審計追蹤
- 測試環境: ✅ 配置完成
- 狀態: 準備執行測試

##### 🔌 中間件測試 (__tests__/lib/middleware/)

**📊 測試統計**: 382 tests (100% 通過率), 執行時間 ~1.6s

**Stage 1-2 測試 (296 tests)**:

| 測試類別                     | 文件路徑                                         | 用途說明                   | 測試數 | 重要程度 |
| ---------------------------- | ------------------------------------------------ | -------------------------- | ------ | -------- |
| **Security Headers**    | `__tests__/lib/middleware/security-headers.test.ts` | 24種安全頭部測試           | 24     | 🔴 極高  |
| **CORS**                | `__tests__/lib/middleware/cors.test.ts`        | CORS中間件測試             | 29     | 🔴 極高  |
| **Route Matcher**       | `__tests__/lib/middleware/route-matcher.test.ts` | 路由匹配器測試             | 23     | 🔴 極高  |
| **Request ID**          | `__tests__/lib/middleware/request-id.test.ts`  | 請求ID生成器測試           | 20     | 🔴 極高  |
| **Rate Limiter**        | `__tests__/lib/middleware/rate-limiter.test.ts` | 速率限制測試（3種算法）     | 23     | 🔴 極高  |
| **API Versioning**      | `__tests__/lib/middleware/api-versioning.test.ts` | API版本控制測試           | 38     | 🔴 極高  |
| **Request Validator**   | `__tests__/lib/middleware/request-validator.test.ts` | 請求驗證測試（9種）       | 43     | 🔴 極高  |
| **Response Transformer**| `__tests__/lib/middleware/response-transformer.test.ts` | 響應轉換測試            | 51     | 🔴 極高  |

**Stage 3 測試 (84 tests)**:

| 測試類別                     | 文件路徑                                         | 用途說明                   | 測試數 | 重要程度 |
| ---------------------------- | ------------------------------------------------ | -------------------------- | ------ | -------- |
| **Request Transformer** | `__tests__/lib/middleware/request-transformer.test.ts` | 請求轉換測試（Body/Headers/Path/Query） | 39     | 🔴 極高  |
| **Response Cache**      | `__tests__/lib/middleware/response-cache.test.ts` | HTTP快取測試（ETag/Cache-Control/304） | 45     | 🔴 極高  |

**Mock 環境配置**:

| 文件名稱           | 文件路徑          | 用途說明                                     | 重要程度 |
| ------------------ | ----------------- | -------------------------------------------- | -------- |
| **Jest 設置** | `jest.setup.js` | Next.js mocks（增強版MockHeaders和NextResponse）| 🔴 極高  |

##### 🚀 Sprint 4 測試 (lib/) - 性能優化與高可用性

**📊 測試統計**: 198 tests (100% 通過率), Sprint 4 Week 7-8完成

| 測試類別                     | 文件路徑                                         | 用途說明                   | 測試數 | 重要程度 |
| ---------------------------- | ------------------------------------------------ | -------------------------- | ------ | -------- |
| **性能監控測試**       | `lib/performance/monitor.test.ts`        | 8種性能指標監控測試         | 36     | 🔴 極高  |
| **查詢優化測試**       | `lib/performance/query-optimizer.test.ts` | DataLoader N+1查詢優化測試 | 26     | 🔴 極高  |
| **響應緩存測試**       | `lib/performance/response-cache.test.ts` | HTTP緩存ETag/Cache-Control測試 | 30   | 🔴 極高  |
| **熔斷器測試**         | `lib/resilience/circuit-breaker.test.ts` | 3-state熔斷器模式測試      | 43     | 🔴 極高  |
| **健康檢查測試**       | `lib/resilience/health-check.test.ts`    | 依賴管理健康檢查測試        | 34     | 🔴 極高  |
| **重試策略測試**       | `lib/resilience/retry.test.ts`           | 4種退避算法重試測試         | 29     | 🔴 極高  |

##### 🔒 安全與備份測試 (lib/security/)

**📊 測試統計**: 安全加固功能測試套件

| 測試類別                     | 文件路徑                                         | 用途說明                   | 重要程度 |
| ---------------------------- | ------------------------------------------------ | -------------------------- | -------- |
| **審計日誌測試**       | `lib/security/audit-log.test.ts`         | 審計追蹤系統測試            | 🟡 高    |
| **數據備份測試**       | `lib/security/backup.test.ts`            | 備份恢復機制測試            | 🟡 高    |
| **加密功能測試**       | `lib/security/encryption.test.ts`        | 數據加密解密測試            | 🟡 高    |
| **權限中間件測試**     | `lib/security/permission-middleware.test.ts` | 權限控制中間件測試      | 🟡 高    |
| **RBAC測試**           | `lib/security/rbac.test.ts`              | 角色權限訪問控制測試        | 🟡 高    |
| **欄位級別權限測試**   | `__tests__/lib/security/field-level-permissions.test.ts` | 細粒度欄位訪問控制測試（Sprint 3 Week 9，33個測試100%通過） | 🟡 高    |
| **操作級別限制測試**   | `__tests__/lib/security/action-restrictions.test.ts` | 操作級別權限限制測試（Sprint 3 Week 9，35個測試100%通過） | 🟡 高    |

#### 🔧 整合測試 (tests/)

| 測試類別                  | 文件路徑                         | 用途說明                                | 重要程度 |
| ------------------------- | -------------------------------- | --------------------------------------- | -------- |
| **知識庫 API 測試** | `tests/knowledge-base.test.ts` | 知識庫 API 完整整合測試（96個測試用例） | 🔴 極高  |

#### 🎭 端到端測試 (e2e/)

**用途**: Playwright E2E測試，驗證完整用戶流程和系統整合

| 測試類別                  | 文件路徑                                    | 用途說明                                        | 重要程度 |
| ------------------------- | ------------------------------------------- | ----------------------------------------------- | -------- |
| **平台完整測試**   | `e2e/ai-sales-platform.spec.ts`           | 綜合測試套件，驗證核心功能完整性                 | 🔴 極高  |
| **快速驗證測試**   | `e2e/quick-verification.spec.ts`          | 快速驗證修復效果的專用測試                       | 🟡 高    |
| **知識庫導航測試** | `e2e/knowledge-base/navigation.spec.ts`   | 知識庫頁面導航和路由測試                         | 🟡 高    |
| **知識庫主頁測試** | `e2e/knowledge-base/main-page.spec.ts`    | 知識庫列表頁面功能測試                           | 🟡 高    |
| **知識庫創建測試** | `e2e/knowledge-base/create-page.spec.ts`  | 知識庫創建流程測試                               | 🟡 高    |
| **文檔上傳測試**   | `e2e/knowledge-base/upload-page.spec.ts`  | 文檔上傳功能測試                                 | 🟡 高    |
| **搜索功能測試**   | `e2e/knowledge-base/search-page.spec.ts`  | AI搜索引擎功能測試                               | 🔴 極高  |
| **文檔詳情測試**   | `e2e/knowledge-base/details-page.spec.ts` | 文檔查看和詳情頁面測試                           | 🟢 中    |
| **文檔編輯測試**   | `e2e/knowledge-base/edit-page.spec.ts`    | 文檔編輯功能測試                                 | 🟢 中    |
| **性能測試**       | `e2e/knowledge-base/performance.spec.ts`  | 頁面載入性能和響應時間測試                       | 🟡 高    |
| **整合測試**       | `e2e/knowledge-base/integration.spec.ts`  | 知識庫模組完整整合測試                           | 🔴 極高  |
| **審計日誌E2E測試** | `e2e/audit-logs/admin-audit-logs.spec.ts` | 審計日誌管理頁面完整E2E測試（列表/篩選/統計/導出） | 🔴 極高  |
| **知識庫測試運行** | `e2e/run-knowledge-tests.ts`              | 知識庫相關測試批量執行器                         | 🟢 中    |
| **全局設置**       | `e2e/global-setup.ts`                     | E2E測試全局設置和環境準備                        | 🟡 高    |
| **認證設置**       | `e2e/auth.setup.ts`                       | 測試認證狀態設置                                 | 🟡 高    |
| **認證工具**       | `e2e/fixtures/auth.ts`                    | E2E測試認證相關工具函數                          | 🟢 中    |

---

## 🗂️ 系統配置文件

### 📦 項目配置 (根目錄)

| 配置類型                  | 文件路徑                          | 用途說明                                           |
| ------------------------- | --------------------------------- | -------------------------------------------------- |
| **依賴管理**        | `package.json`                  | Next.js 14 專案依賴和腳本（已新增 Puppeteer 24.23.0）|
| **環境變數**        | `.env.example`                  | 環境變數配置範例                                   |
| **容器化**          | `docker-compose.dev.yml`        | 開發環境 Docker 配置                               |
| **開發容器**        | `Dockerfile.dev`                | 開發環境容器配置                                   |
| **忽略文件**        | `.gitignore`                    | Git 忽略文件配置                                   |
| **項目說明**        | `README.md`                     | 專案簡介和快速開始指南                             |
| **服務啟動指南**    | `STARTUP-GUIDE.md`              | 完整服務啟動和健康檢查流程                         |
| **開發記錄**        | `DEVELOPMENT-LOG.md`            | 開發討論、決策記錄和問題解決方案                   |
| **修復記錄**        | `FIXLOG.md`                     | 問題修復記錄和解決方案庫，防止重複錯誤             |
| **健康檢查腳本**    | `scripts/health-check.js`       | PostgreSQL, Redis, pgvector, Azure OpenAI 健康檢查 |
| **MVP同步腳本**     | `scripts/sync-mvp-checklist.js` | MVP檢查清單自動同步和進度追蹤                      |
| **性能設置腳本**    | `scripts/performance-setup.js`  | 性能優化自動配置和設置腳本                         |
| **數據庫優化腳本**  | `scripts/db-optimization.sql`   | PostgreSQL和pgvector性能優化SQL腳本                |
| **認證系統**        | `lib/auth.ts`                   | JWT 認證系統和用戶管理                             |
| **TypeScript 配置** | `tsconfig.json`                 | TypeScript 項目配置                                |
| **Jest 測試配置**   | `jest.config.js`                | Jest 測試框架配置                                  |
| **Next.js優化配置** | `next.config.optimized.js`      | 優化的Next.js配置文件                              |
| **Claude 規則**     | `CLAUDE.md`                     | Claude Code 開發規則和工作流程                     |
| **GitHub 說明**     | `github.md`                     | GitHub 相關配置和說明                              |
| **生產環境範例**    | `.env.production.example`      | 生產環境變數配置範例                               |
| **部署指南**        | `DEPLOYMENT-GUIDE.md`          | 完整部署指南和運維文檔                             |
| **生產 Dockerfile** | `Dockerfile.prod`              | 多階段構建生產容器配置                             |
| **生產 Docker Compose** | `docker-compose.prod.yml`  | 生產環境 Docker Compose 配置                      |
| **健康檢查腳本**    | `healthcheck.js`               | 容器健康檢查腳本                                   |
| **主索引**          | `PROJECT-INDEX.md`              | 📍 當前文件 - AI 助手導航指南                      |
| **維護指南**        | `INDEX-MAINTENANCE-GUIDE.md`    | 索引維護策略和自動化工具                           |
| **提醒設置**        | `docs/INDEX-REMINDER-SETUP.md`  | 索引同步提醒系統設置指南                           |
| **同步檢查報告**    | `index-sync-report.json`        | 索引同步狀態檢查報告，記錄問題和建議               |

### 🚀 CI/CD 和部署配置

| 配置類型             | 文件路徑                              | 用途說明                                  |
| -------------------- | ------------------------------------- | ----------------------------------------- |
| **CI 工作流程**      | `.github/workflows/ci.yml`           | 持續集成流程 - 測試、構建、代碼品質檢查   |
| **部署工作流程**     | `.github/workflows/deploy.yml`       | 持續部署流程 - 多環境部署和監控           |
| **索引檢查流程**     | `.github/workflows/index-check.yml`  | 索引文件同步狀態自動檢查工作流程          |
| **Nginx 配置**       | `nginx/nginx.conf`                    | 反向代理和負載均衡配置                    |
| **SSL 憑證目錄**     | `nginx/ssl/`                          | SSL 憑證文件存放目錄                      |

#### 🔍 監控系統配置 (Sprint 2新增)

| 配置類型             | 文件路徑                                          | 用途說明                                     |
| -------------------- | ------------------------------------------------- | -------------------------------------------- |
| **監控堆疊配置**     | `docker-compose.monitoring.yml`                   | Prometheus+Grafana+Jaeger+Alertmanager完整堆疊 |
| **環境變數範例**     | `.env.monitoring.example`                         | 監控後端配置範例（Prometheus/Azure/Jaeger）   |
| **Next.js儀表化鉤子** | `instrumentation.ts`                              | Next.js自動初始化OpenTelemetry              |
| **Prometheus配置**   | `monitoring/prometheus/prometheus.yml`            | 指標收集和抓取目標配置                       |
| **Prometheus告警**   | `monitoring/prometheus/alerts.yml`                | 4級別告警規則（P1-P4，46條規則）             |
| **Alertmanager配置** | `monitoring/alertmanager/alertmanager.yml`        | 告警路由和通知渠道配置                       |
| **Grafana數據源**    | `monitoring/grafana/provisioning/datasources/`    | Prometheus和Jaeger數據源自動配置             |
| **Grafana儀表板配置**| `monitoring/grafana/provisioning/dashboards/`     | 儀表板自動載入配置                          |
| **系統概覽儀表板**   | `monitoring/grafana/dashboards/01-system-overview.json` | 健康狀態、請求量、錯誤率、響應時間 |
| **API性能儀表板**    | `monitoring/grafana/dashboards/02-api-performance.json` | 端點分析、響應時間分佈、錯誤分析   |
| **業務指標儀表板**   | `monitoring/grafana/dashboards/03-business-metrics.json` | 用戶活動、AI使用、功能採用        |
| **資源使用儀表板**   | `monitoring/grafana/dashboards/04-resource-usage.json` | CPU、記憶體、磁碟、網絡、資料庫   |

---

## 🛠️ 開發工具文件 (輔助系統)

### 🤖 .bmad-core/ - BMad 核心框架

**⚠️ 注意**: 這是開發輔助工具，不是項目業務內容

- **agents/** - BMad 智能代理定義
- **checklists/** - 開發檢查清單模板
- **data/** - BMad 知識庫和技術偏好
- **tasks/** - 任務模板和工作流程
- **templates/** - 文檔和代碼模板

### 🏗️ .bmad-infrastructure-devops/ - DevOps 擴展

**⚠️ 注意**: 這是 DevOps 工具集，不是項目主要內容

- 與 .bmad-core 結構類似，專注於基礎設施和 DevOps 任務

### 🎨 web-bundles/ - Web 開發擴展包

**⚠️ 注意**: 這是前端開發工具，不是項目主要內容

- **agents/** - 前端專用代理
- **expansion-packs/** - 功能擴展包
- **teams/** - 團隊協作工具

### ⚙️ .claude/ 和 .cursor/ - IDE 配置

**⚠️ 注意**: 這些是開發環境配置，不是項目內容

- 編輯器特定的設定和命令

---

## 🎯 AI 助手使用指南

### 🔍 查找策略指南

#### 1. 業務需求相關查詢

```
目標: 了解項目需求、功能規格
首先查看: docs/prd.md, docs/user-stories/
重點關注: MVP-PRIORITIES.md 了解優先級
```

#### 2. 技術架構相關查詢

```
目標: 了解技術棧、系統設計
首先查看: docs/architecture.md, docs/api-specification.md
技術驗證: docs/technical-feasibility-report.md
```

#### 3. 開發實施相關查詢

```
目標: 了解開發計劃、實施步驟
首先查看: docs/mvp-development-plan.md
執行指南: docs/mvp-implementation-checklist.md
測試策略: docs/testing-strategy.md
```

#### 4. 資料庫相關查詢

```
目標: 了解資料模型、資料庫設計
首先查看: prisma/schema.prisma
遷移腳本: prisma/migrations/
```

#### 5. 技術驗證相關查詢

```
目標: 驗證技術可行性、運行測試
首先查看: poc/README.md
測試腳本: poc/ 目錄下的所有 .js 文件
```

#### 6. 環境配置相關查詢

```
目標: 設置開發環境、部署配置
首先查看: README.md, .env.example
容器化: docker-compose.dev.yml, Dockerfile.dev
```

### ❌ 避免查找的目錄

AI 助手應該 **避免** 在以下目錄中查找項目業務相關信息：

- `.bmad-core/` - 開發工具框架
- `.bmad-infrastructure-devops/` - DevOps 工具
- `web-bundles/` - 前端工具擴展
- `.claude/` - 編輯器配置
- `.cursor/` - 編輯器配置
- `.git/` - Git 版本控制內部文件

### 🎯 快速導航表

| 查詢類型             | 建議首選文件                            | 備選文件                                 |
| -------------------- | --------------------------------------- | ---------------------------------------- |
| **項目概述**   | `README.md`                           | `docs/project-background.md`           |
| **業務需求**   | `docs/prd.md`                         | `docs/user-stories/MVP-PRIORITIES.md`  |
| **技術架構**   | `docs/architecture.md`                | `docs/api-specification.md`            |
| **開發計劃**   | `docs/mvp-development-plan.md`        | `docs/mvp-implementation-checklist.md` |
| **服務啟動**   | `STARTUP-GUIDE.md`                    | `scripts/health-check.js`              |
| **開發記錄**   | `DEVELOPMENT-LOG.md`                  | `scripts/sync-mvp-checklist.js`        |
| **修復記錄**   | `FIXLOG.md`                          | `INDEX-MAINTENANCE-GUIDE.md`           |
| **認證系統**   | `lib/auth.ts`, `lib/auth-server.ts`  | `app/api/auth/`                        |
| **資料庫設計** | `prisma/schema.prisma`                | `scripts/init-db.sql`                  |
| **技術驗證**   | `poc/README.md`                       | `docs/technical-feasibility-report.md` |
| **測試策略**   | `docs/testing-strategy.md`            | `poc/run-all-tests.js`                 |
| **用戶故事**   | `docs/user-stories/MVP-PRIORITIES.md` | `docs/user-stories/epic-*/`            |
| **環境配置**   | `.env.example`                        | `docker-compose.dev.yml`               |
| **API 規格**   | `docs/api-specification.md`           | `docs/architecture.md`                 |

---

## 📊 文件重要性優先級

### 🔴 極高優先級 (必須熟悉)

- `docs/prd.md` - 產品需求文檔
- `docs/architecture.md` - 技術架構設計
- `docs/mvp-development-plan.md` - 開發計劃
- `docs/api-specification.md` - API 規格
- `prisma/schema.prisma` - 資料庫設計
- `docs/user-stories/MVP-PRIORITIES.md` - 優先級規劃

### 🟡 高優先級 (重要參考)

- `docs/mvp-implementation-checklist.md` - 實施檢查清單
- `docs/testing-strategy.md` - 測試策略
- `docs/technical-feasibility-report.md` - 技術驗證
- `poc/` 目錄所有測試腳本
- `README.md` - 項目說明

### 🟢 中優先級 (補充信息)

- `docs/security-standards.md` - 安全標準
- `docs/front-end-spec.md` - 前端規格
- `docs/project-background.md` - 項目背景
- 環境配置文件

---

## 🔄 索引維護說明

### 📅 更新時機

此索引應在以下情況下更新：

- 新增重要項目文檔時
- 重構項目結構時
- 新增主要功能模組時
- 變更開發工作流程時

### 👥 維護責任

- 主要負責：項目架構師或技術負責人
- 協助維護：所有團隊成員
- 檢查頻率：每個 Sprint 結束時檢查

### 📝 更新格式

更新時請維持：

- 清晰的分類結構
- 準確的文件路徑
- 簡潔的用途說明
- 合適的重要性標記

---

**🎯 記住：這個索引的目標是讓 AI 助手能夠快速找到正確的文件，避免在工具文件中浪費時間，專注於項目核心內容！**
