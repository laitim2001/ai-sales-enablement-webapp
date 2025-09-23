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
| **架構設計** | `docs/architecture.md` | 技術架構設計，Next.js 14 全棧架構 | 🔴 極高 |
| **API 規格** | `docs/api-specification.md` | 完整 API 端點和 Server Actions 規格 | 🔴 極高 |
| **開發計劃** | `docs/mvp-development-plan.md` | 12週 MVP 開發路線圖 | 🔴 極高 |
| **實施指南** | `docs/mvp-implementation-checklist.md` | 逐週執行檢查清單 | 🔴 極高 |
| **測試策略** | `docs/testing-strategy.md` | 完整測試金字塔策略 | 🟡 高 |
| **技術驗證** | `docs/technical-feasibility-report.md` | POC 技術可行性報告 | 🟡 高 |
| **安全標準** | `docs/security-standards.md` | 安全要求和標準 | 🟡 高 |
| **前端規格** | `docs/front-end-spec.md` | UI/UX 設計規格 | 🟢 中 |
| **項目背景** | `docs/project-background.md` | 項目背景和市場分析 | 🟢 中 |
| **規劃摘要** | `docs/planning-summary.md` | 項目規劃總結 | 🟢 中 |

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
**用途**: 資料庫初始化和部署自動化腳本

| 腳本類型 | 文件路徑 | 用途說明 |
|---------|----------|----------|
| **資料庫初始化** | `scripts/init-db.sql` | PostgreSQL + pgvector 初始化 |

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
| **主索引** | `PROJECT-INDEX.md` | 📍 當前文件 - AI 助手導航指南 |
| **維護指南** | `INDEX-MAINTENANCE-GUIDE.md` | 索引維護策略和自動化工具 |
| **專門索引** | `indexes/README.md` | Level 3 專門索引擴展準備 |

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