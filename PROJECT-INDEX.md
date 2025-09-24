# 📁 AI 銷售賦能平台 - 主索引目錄

> **🎯 目的**: 為 AI 助手提供快速導航和文件查找指南
> **📅 最後更新**: 2024年9月
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

| 文檔類型 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **需求文檔** | `docs/prd.md` | 產品需求文檔，項目核心業務需求 | 🔴 極高 |

### 📖 docs/ - 項目文檔和規格
**用途**: 完整的項目文檔、API 規格、架構設計和開發指南

#### 📖 API 技術文檔 (docs/api/)
| 文檔類型 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **Knowledge Base API** | `docs/api/knowledge-base-api.md` | 知識庫 API 完整文檔，包含 6 個端點 | 🔴 極高 |

#### 📋 項目核心文檔 (docs/)
| 文檔類型 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **API 規格書** | `docs/api-specification.md` | 完整 API 規格定義 | 🟡 高 |
| **系統架構** | `docs/architecture.md` | 系統架構設計文檔 | 🔴 極高 |
| **前端規格** | `docs/front-end-spec.md` | 前端開發規格和指南 | 🟡 高 |
| **索引提醒設置** | `docs/INDEX-REMINDER-SETUP.md` | 索引同步提醒系統設置 | 🟢 中 |
| **MVP 開發計劃** | `docs/mvp-development-plan.md` | MVP 階段開發計劃 | 🟡 高 |
| **MVP 實施清單** | `docs/mvp-implementation-checklist.md` | MVP 實施進度追蹤 | 🟡 高 |
| **規劃總結** | `docs/planning-summary.md` | 項目規劃總結文檔 | 🟡 高 |
| **產品需求文檔** | `docs/prd.md` | 完整 PRD 文檔 | 🔴 極高 |
| **項目背景** | `docs/project-background.md` | 項目背景和商業價值 | 🟡 高 |
| **項目概要草案** | `docs/project-brief-draft.md` | 項目概要草案 | 🟢 中 |
| **安全標準** | `docs/security-standards.md` | 安全開發標準和規範 | 🟡 高 |
| **技術可行性報告** | `docs/technical-feasibility-report.md` | 技術可行性分析報告 | 🟡 高 |
| **測試策略** | `docs/testing-strategy.md` | 完整測試策略文檔 | 🟡 高 |

### 📖 docs/user-stories/ - 用戶故事詳細規格
**用途**: 24個詳細用戶故事，按 Epic 組織

| Epic | 目錄路徑 | 包含故事數 | 說明 |
|------|----------|------------|------|
| **Epic 1** | `docs/user-stories/epic-1/` | 6個故事 | 基礎平台與知識管理 |
| **Epic 2** | `docs/user-stories/epic-2/` | 6個故事 | 智能銷售助手核心功能 |
| **Epic 3** | `docs/user-stories/epic-3/` | 6個故事 | AI 提案生成引擎 |
| **Epic 4** | `docs/user-stories/epic-4/` | 6個故事 | 雲端基礎設施和部署 |

**重要文件**:
- `docs/user-stories/MVP-PRIORITIES.md` - 所有故事的優先級分配

### 🗄️ prisma/ - 資料庫設計
**用途**: PostgreSQL + pgvector 資料庫設計和遷移

| 文件類型 | 文件路徑 | 用途說明 |
|---------|----------|----------|
| **資料庫模型** | `prisma/schema.prisma` | 完整資料庫 schema 定義 |
| **遷移文件** | `prisma/migrations/` | 資料庫版本控制和遷移腳本 |

### 🧪 poc/ - 概念驗證測試
**用途**: 核心技術組件的可行性驗證腳本

| 測試類型 | 文件路徑 | 用途說明 |
|---------|----------|----------|
| **CRM 整合** | `poc/dynamics-365-test.js` | Dynamics 365 API 連接測試 |
| **向量搜索** | `poc/pgvector-performance-test.js` | PostgreSQL + pgvector 性能測試 |
| **AI 服務** | `poc/azure-openai-cost-test.js` | Azure OpenAI 成本和性能測試 |
| **統合測試** | `poc/run-all-tests.js` | 執行所有 POC 測試的主控制器 |
| **POC 說明** | `poc/README.md` | POC 測試使用指南 |

### 🛠️ scripts/ - 部署和維護腳本
**用途**: 資料庫初始化、測試執行和項目維護自動化腳本

| 腳本類型 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **資料庫初始化** | `scripts/init-db.sql` | PostgreSQL + pgvector 初始化 | 🟡 高 |
| **健康檢查** | `scripts/health-check.js` | 服務健康狀態檢查腳本 | 🟡 高 |
| **測試運行器** | `scripts/run-tests.js` | 統一測試執行和管理工具 | 🟡 高 |
| **MVP 進度同步** | `scripts/sync-mvp-checklist.js` | 自動同步 MVP 實施進度 | 🟢 中 |
| **索引同步檢查** | `scripts/check-index-sync.js` | 索引文件同步狀態檢查 | 🟢 中 |

### 🎨 app/ - Next.js 14 應用程式結構
**用途**: Next.js 14 App Router 架構，包含頁面、API 路由和布局

#### 📱 頁面和布局結構
| 目錄/文件 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **根布局** | `app/layout.tsx` | 應用程式全局布局和提供者 | 🔴 極高 |
| **首頁** | `app/page.tsx` | 應用程式主頁面 | 🟡 高 |
| **全局錯誤** | `app/global-error.tsx` | 全局錯誤處理頁面 | 🟡 高 |
| **錯誤頁面** | `app/error.tsx` | 通用錯誤頁面 | 🟢 中 |

#### 🔐 認證相關頁面
| 頁面類型 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **認證布局** | `app/(auth)/layout.tsx` | 認證頁面共用布局 | 🟡 高 |
| **登入頁面** | `app/(auth)/login/page.tsx` | 用戶登入表單和邏輯 | 🔴 極高 |
| **註冊頁面** | `app/(auth)/register/page.tsx` | 用戶註冊表單和邏輯 | 🔴 極高 |

#### 📊 儀表板頁面
| 頁面類型 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **儀表板布局** | `app/(dashboard)/layout.tsx` | 保護路由和儀表板布局 | 🔴 極高 |
| **主儀表板** | `app/(dashboard)/dashboard/page.tsx` | 主要儀表板頁面 | 🔴 極高 |

#### 🔌 API 路由結構
| API 類別 | 端點路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **健康檢查** | `app/api/health/route.ts` | API 服務健康狀態檢查 | 🟢 中 |

##### 🔐 認證 API (app/api/auth/)
| 端點 | 文件路徑 | 用途說明 | HTTP 方法 |
|------|----------|----------|----------|
| **登入** | `app/api/auth/login/route.ts` | 用戶登入驗證和 JWT 生成 | POST |
| **註冊** | `app/api/auth/register/route.ts` | 新用戶註冊處理 | POST |
| **登出** | `app/api/auth/logout/route.ts` | 用戶登出處理 | POST |
| **當前用戶** | `app/api/auth/me/route.ts` | 獲取當前用戶信息 | GET |

##### 🗄️ 知識庫 API (app/api/knowledge-base/)
| 端點 | 文件路徑 | 用途說明 | HTTP 方法 |
|------|----------|----------|----------|
| **主要 CRUD** | `app/api/knowledge-base/route.ts` | 知識庫項目列表和創建 | GET, POST |
| **單項管理** | `app/api/knowledge-base/[id]/route.ts` | 單個項目查看、更新、刪除 | GET, PUT, DELETE |
| **智能搜索** | `app/api/knowledge-base/search/route.ts` | 文本、語義、混合搜索 | POST |
| **文件上傳** | `app/api/knowledge-base/upload/route.ts` | 多格式文件上傳處理 | GET, POST |
| **標籤管理** | `app/api/knowledge-base/tags/route.ts` | 層次化標籤CRUD操作 | GET, POST |
| **處理任務** | `app/api/knowledge-base/processing/route.ts` | 異步處理任務管理 | GET, POST |

### 🧩 components/ - React 組件庫
**用途**: 可重用的 React 組件，按功能分層組織

#### 🎨 UI 基礎組件 (components/ui/)
| 組件名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **按鈕** | `components/ui/button.tsx` | 可重用按鈕組件 | 🔴 極高 |
| **錯誤顯示** | `components/ui/error-display.tsx` | 錯誤信息顯示組件 | 🟡 高 |

#### 🏗️ 布局組件 (components/layout/)
| 組件名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **儀表板頂部** | `components/layout/dashboard-header.tsx` | 儀表板頂部導航欄 | 🔴 極高 |
| **側邊欄** | `components/layout/dashboard-sidebar.tsx` | 儀表板側邊欄 | 🔴 極高 |
| **移動導航** | `components/layout/dashboard-mobile-nav.tsx` | 響應式移動端導航 | 🟡 高 |

#### 📊 儀表板組件 (components/dashboard/)
| 組件名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **AI 洞察** | `components/dashboard/ai-insights.tsx` | AI 分析和建議組件 | 🔴 極高 |
| **最近活動** | `components/dashboard/recent-activity.tsx` | 用戶活動時間線 | 🟡 高 |
| **銷售圖表** | `components/dashboard/sales-chart.tsx` | 銷售數據可視化 | 🟡 高 |
| **重要客戶** | `components/dashboard/top-customers.tsx` | 客戶列表和狀態 | 🟡 高 |


### 📚 lib/ - 核心模組庫
**用途**: 應用程式核心邏輯、工具函數和服務封裝

#### 🤖 AI 服務模組 (lib/ai/)
| 模組名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **統一導出** | `lib/ai/index.ts` | AI 服務統一入口 | 🔴 極高 |
| **OpenAI 客戶端** | `lib/ai/openai.ts` | Azure OpenAI 連接和配置 | 🔴 極高 |
| **向量嵌入** | `lib/ai/embeddings.ts` | 文檔向量化和嵌入處理 | 🔴 極高 |
| **聊天服務** | `lib/ai/chat.ts` | AI 聊天完成服務 | 🟡 高 |
| **類型定義** | `lib/ai/types.ts` | AI 相關 TypeScript 類型 | 🟡 高 |

#### 🔌 API 工具 (lib/api/)
| 模組名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **錯誤處理** | `lib/api/error-handler.ts` | API 統一錯誤處理中間件 | 🟡 高 |


#### 💾 資料庫模組 (lib/db/)
| 模組名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **資料庫目錄** | `lib/db/` | 資料庫相關工具和配置 | 🟢 中 |

#### 🛠️ 工具模組 (lib/utils/)
| 模組名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **工具目錄** | `lib/utils/` | 通用工具函數集合 | 🟢 中 |

#### 📄 核心文件
| 文件名稱 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **JWT 認證** | `lib/auth.ts` | JWT 令牌生成、驗證和用戶認證 | 🔴 極高 |
| **資料庫連接** | `lib/db.ts` | Prisma 客戶端配置和連接 | 🔴 極高 |
| **錯誤處理** | `lib/errors.ts` | 統一錯誤類別和處理系統 | 🔴 極高 |
| **中間件** | `lib/middleware.ts` | Next.js 中間件定義 | 🟡 高 |
| **通用工具** | `lib/utils.ts` | 常用工具函數 | 🟢 中 |

### 🧪 測試文件結構
**用途**: 單元測試、整合測試和測試工具

#### 🔬 單元測試 (__tests__/)
| 測試類別 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **API 測試目錄** | `__tests__/api/` | API 端點單元測試 | 🟡 高 |
| **認證測試目錄** | `__tests__/auth/` | 認證相關功能測試 | 🟡 高 |
| **庫模組測試** | `__tests__/lib/` | lib/ 模組功能測試 | 🟡 高 |
| **工具測試目錄** | `__tests__/utils/` | 工具函數和測試輔助 | 🟢 中 |
| **測試輔助** | `__tests__/utils/test-helpers.ts` | 測試工具和模擬數據 | 🟡 高 |
| **嵌入測試** | `__tests__/lib/ai/embeddings.test.ts` | 向量嵌入功能測試 | 🟡 高 |
| **登入測試** | `__tests__/api/auth/login.test.ts` | 用戶登入流程測試 | 🟡 高 |
| **註冊測試** | `__tests__/api/auth/register.test.ts` | 用戶註冊流程測試 | 🟡 高 |
| **錯誤處理測試** | `__tests__/lib/error-handling.test.ts` | 錯誤處理系統測試 | 🟡 高 |

#### 🔧 整合測試 (tests/)
| 測試類別 | 文件路徑 | 用途說明 | 重要程度 |
|---------|----------|----------|----------|
| **知識庫 API 測試** | `tests/knowledge-base.test.ts` | 知識庫 API 完整整合測試（96個測試用例） | 🔴 極高 |

---

## 🗂️ 系統配置文件

### 📦 項目配置 (根目錄)
| 配置類型 | 文件路徑 | 用途說明 |
|---------|----------|----------|
| **依賴管理** | `package.json` | Next.js 14 專案依賴和腳本 |
| **環境變數** | `.env.example` | 環境變數配置範例 |
| **容器化** | `docker-compose.dev.yml` | 開發環境 Docker 配置 |
| **開發容器** | `Dockerfile.dev` | 開發環境容器配置 |
| **忽略文件** | `.gitignore` | Git 忽略文件配置 |
| **項目說明** | `README.md` | 專案簡介和快速開始指南 |
| **服務啟動指南** | `STARTUP-GUIDE.md` | 完整服務啟動和健康檢查流程 |
| **開發記錄** | `DEVELOPMENT-LOG.md` | 開發討論、決策記錄和問題解決方案 |
| **健康檢查腳本** | `scripts/health-check.js` | PostgreSQL, Redis, pgvector, Azure OpenAI 健康檢查 |
| **MVP同步腳本** | `scripts/sync-mvp-checklist.js` | MVP檢查清單自動同步和進度追蹤 |
| **認證系統** | `lib/auth.ts` | JWT 認證系統和用戶管理 |
| **TypeScript 配置** | `tsconfig.json` | TypeScript 項目配置 |
| **Jest 測試配置** | `jest.config.js` | Jest 測試框架配置 |
| **Claude 規則** | `CLAUDE.md` | Claude Code 開發規則和工作流程 |
| **GitHub 說明** | `github.md` | GitHub 相關配置和說明 |
| **主索引** | `PROJECT-INDEX.md` | 📍 當前文件 - AI 助手導航指南 |
| **維護指南** | `INDEX-MAINTENANCE-GUIDE.md` | 索引維護策略和自動化工具 |
| **提醒設置** | `docs/INDEX-REMINDER-SETUP.md` | 索引同步提醒系統設置指南 |

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

| 查詢類型 | 建議首選文件 | 備選文件 |
|----------|-------------|----------|
| **項目概述** | `README.md` | `docs/project-background.md` |
| **業務需求** | `docs/prd.md` | `docs/user-stories/MVP-PRIORITIES.md` |
| **技術架構** | `docs/architecture.md` | `docs/api-specification.md` |
| **開發計劃** | `docs/mvp-development-plan.md` | `docs/mvp-implementation-checklist.md` |
| **服務啟動** | `STARTUP-GUIDE.md` | `scripts/health-check.js` |
| **開發記錄** | `DEVELOPMENT-LOG.md` | `scripts/sync-mvp-checklist.js` |
| **認證系統** | `lib/auth.ts` | `app/api/auth/` |
| **資料庫設計** | `prisma/schema.prisma` | `scripts/init-db.sql` |
| **技術驗證** | `poc/README.md` | `docs/technical-feasibility-report.md` |
| **測試策略** | `docs/testing-strategy.md` | `poc/run-all-tests.js` |
| **用戶故事** | `docs/user-stories/MVP-PRIORITIES.md` | `docs/user-stories/epic-*/` |
| **環境配置** | `.env.example` | `docker-compose.dev.yml` |
| **API 規格** | `docs/api-specification.md` | `docs/architecture.md` |

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