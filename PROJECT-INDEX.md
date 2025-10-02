# 📁 AI 銷售賦能平台 - 主索引目錄

> **🎯 目的**: 為 AI 助手提供快速導航和文件查找指南
> **📅 最後更新**: 2025年10月2日 - Sprint 5 Week 10 Day 4 PDF導出功能完成（新增lib/pdf/系統，Puppeteer整合）
> **🔍 使用方法**: AI 助手應首先查看此文件以了解項目結構和文件位置

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
- `docs/mvp2-implementation-checklist.md` - MVP Phase 2 實施進度檢查清單 (進行中 31%，Sprint 1 + Stage 3 完成)

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
| **技術可行性報告** | `docs/technical-feasibility-report.md` | 技術可行性分析報告   | 🟡 高    |
| **測試策略**       | `docs/testing-strategy.md`             | 完整測試策略文檔     | 🟡 高    |
| **MVP Phase 2 測試指南** | `docs/MVP2-TESTING-GUIDE.md`      | MVP Phase 2 完整測試驗證指南 (Sprint 1-5) | 🔴 極高  |
| **性能審計報告**   | `docs/performance-audit-2025.md`       | 2025年性能優化分析   | 🟡 高    |
| **性能實施指南**   | `docs/performance-implementation-guide.md` | 性能優化實施指南 | 🟡 高    |
| **Week 5開發計劃** | `docs/week5-development-plan.md`        | AI搜索引擎開發規劃   | 🟡 高    |
| **Azure OpenAI設置指南** | `docs/azure-openai-setup-guide.md` | Azure OpenAI完整配置指南 | 🟡 高    |
| **Dynamics 365設置指南** | `docs/dynamics365-setup-guide.md` | Dynamics 365完整配置指南 | 🟡 高    |
| **新開發者設置指南** | `docs/NEW-DEVELOPER-SETUP-GUIDE.md` | 新開發者環境自動化設置完整指南 | 🔴 極高  |
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

**🎯 範本 API端點** (app/api/templates/):
- `route.ts`: 範本列表和創建 (GET/POST)
- `[id]/route.ts`: 單個範本操作 (GET/PUT/DELETE)
- `[id]/duplicate/route.ts`: 複製範本 (POST)
- `[id]/preview/route.ts`: 預覽範本 (POST)
- `preview-temp/route.ts`: 臨時範本預覽 (POST) - 用於創建頁面
- `stats/route.ts`: 統計信息 (GET)

**🎯 PDF導出 API端點** (app/api/templates/):
- `[id]/export-pdf/route.ts`: 保存範本PDF導出 (POST) - 150行
- `export-pdf-test/route.ts`: 測試範本PDF導出 (POST) - 120行，用於創建頁面實時預覽

**🎨 前端頁面** (app/dashboard/templates/):
- `page.tsx`: 範本列表頁（~450行）- 搜索/過濾/統計/分頁
- `new/page.tsx`: 範本創建頁（~650行）- Tab界面/變數配置/預覽
- `[id]/page.tsx`: 範本編輯頁（~700行）- 完整編輯功能
- `[id]/preview/page.tsx`: 範本預覽頁（~520行）- 獨立預覽/變數輸入/PDF導出

**✅ 完成狀態**: Sprint 5 Week 10 Day 3-4 完成 (2025-10-02)
- 範本後端: ~1,220行代碼（範本管理+引擎+6個API）✅
- 範本前端: ~2,370行代碼（4個頁面完整UI）✅
- PDF系統: ~980行代碼（核心引擎270 + 範本350 + API 270 + 前端70 + 導出20）✅
- 數據庫: 2個模型（ProposalTemplate + ProposalGeneration）✅
- API端點: 6個範本API + 2個PDF導出API ✅
- 前端整合: PDF導出按鈕 + 自動下載 + Toast通知 ✅

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

### 🌐 app/api/knowledge-base/ - API端點更新

**用途**: 新增搜索建議API支援

| 功能模組               | 文件路徑                                      | 用途說明                                     | 重要程度 |
| ---------------------- | --------------------------------------------- | -------------------------------------------- | -------- |
| **搜索建議API**        | `app/api/knowledge-base/suggestions/route.ts` | GET/POST多功能搜索建議端點                   | 🟡 高    |

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
| **服務重啟**     | `scripts/restart-services.bat`  | Windows服務重啟批處理        | 🟢 中    |

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
| **搜索建議**  | `app/api/knowledge-base/suggestions/route.ts` | 智能搜索建議和自動補全   | GET, POST        |
| **文件上傳**  | `app/api/knowledge-base/upload/route.ts`     | 多格式文件上傳處理       | GET, POST        |
| **標籤管理**  | `app/api/knowledge-base/tags/route.ts`       | 層次化標籤CRUD操作       | GET, POST        |
| **處理任務**  | `app/api/knowledge-base/processing/route.ts` | 異步處理任務管理         | GET, POST        |

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
| **加密服務** | `lib/security/encryption.ts` | AES-256-GCM企業級加密，欄位級別保護，哈希/令牌生成 | 442 | 40 | 🔴 極高 |
| **RBAC權限系統** | `lib/security/rbac.ts` | 5角色×23資源權限映射，細粒度CRUD控制，擁有權驗證 | 596 | 37 | 🔴 極高 |
| **權限中間件** | `lib/security/permission-middleware.ts` | Next.js API路由權限檢查，JWT驗證，HOF包裝器 | 504 | 32 | 🔴 極高 |
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

**✅ 完成狀態**: Sprint 3 完成 (2025-10-01)
- Week 5: 加密(40) + RBAC(37) + 權限中間件(32) = 109 tests
- Week 6: 審計日誌(39) + 備份系統(44) + npm audit(0漏洞) = 83 tests
- 總計: 192/192 tests passing (100%)

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
