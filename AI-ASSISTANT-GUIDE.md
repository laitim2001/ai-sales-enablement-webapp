# 🤖 AI 助手快速參考指南

> **⚡ 快速開始**: AI助手必讀文件，30秒了解整個項目結構

---

## 🎯 項目核心信息

**項目名稱**: AI 銷售賦能平台
**目標市場**: 馬來西亞/新加坡
**技術棧**: Next.js 14 + PostgreSQL + Azure OpenAI
**狀態**: MVP 開發準備完成，可以開始 Sprint 1

---

## 📁 重要文件快速索引

### 🔴 最重要 (必看)
```
docs/prd.md                     # 產品需求 (業務核心)
docs/architecture.md            # 技術架構 (Next.js 14 全棧)
docs/mvp-development-plan.md     # 12週開發計劃
docs/api-specification.md       # API 端點規格
prisma/schema.prisma            # 資料庫設計
package.json                    # 依賴包與腳本配置 (已修復tRPC v10兼容性)
next.config.js                  # Next.js 配置
tailwind.config.js              # Tailwind CSS 配置
```

### 🟡 重要 (常用)
```
docs/user-stories/MVP-PRIORITIES.md    # 24個用戶故事優先級
docs/mvp-implementation-checklist.md   # 逐週執行清單
docs/testing-strategy.md               # 測試策略
docs/api/knowledge-base-api.md          # Knowledge Base API 完整文檔
STARTUP-GUIDE.md                       # 服務啟動完整指南
DEVELOPMENT-LOG.md                     # 開發討論和決策記錄
DEPLOYMENT-GUIDE.md                    # 生產環境部署指南
scripts/health-check.js               # 服務健康檢查腳本
scripts/sync-mvp-checklist.js         # MVP進度自動同步腳本
poc/run-all-tests.js                  # 技術驗證腳本
README.md                              # 項目說明
app/layout.tsx                         # Next.js 根布局
lib/auth.ts                            # JWT 認證系統
lib/db.ts                              # 資料庫連接配置
.eslintrc.json                         # ESLint 配置
postcss.config.js                      # PostCSS 配置
```

### 🟢 參考 (需要時查看)
```
docs/security-standards.md     # 安全要求
docs/front-end-spec.md         # UI/UX 規格
.env.example                   # 環境配置範例
.env.production.example        # 生產環境配置範例
docker-compose.dev.yml         # 開發環境容器配置
docker-compose.prod.yml        # 生產環境容器配置
Dockerfile.prod                # 生產環境 Docker 配置
.github/workflows/ci.yml       # CI 持續整合流程
.github/workflows/deploy.yml   # 部署工作流程
nginx/nginx.conf               # Nginx 反向代理配置
monitoring/prometheus.yml      # Prometheus 監控配置
healthcheck.js                 # 容器健康檢查腳本
```

---

## 🚫 避免查找的目錄

```
.bmad-core/              # BMad 開發工具框架 (非項目內容)
.bmad-infrastructure-devops/  # DevOps 工具 (非項目內容)
web-bundles/             # 前端工具擴展 (非項目內容)
.claude/ .cursor/        # IDE 配置 (非項目內容)
.git/                    # Git 內部文件 (系統文件)
```

---

## 📋 如何使用索引系統

### 🎯 索引系統架構 (4層)

這個項目使用多層級索引系統，AI 助手應該按以下順序查找：

```
🔄 AI 助手查找流程
├── L0: .ai-context                    # ⚡ 極簡上下文載入
├── L1: AI-ASSISTANT-GUIDE.md          # 📋 當前文件 - 快速導航
├── L2: PROJECT-INDEX.md               # 🗂️ 完整文件索引
└── L3: indexes/[專門].md              # 🎯 特定領域專門索引
```

### 🚀 AI 助手標準工作流程

#### 1. **首次進入項目** (必須執行)
```bash
1️⃣ 讀取 .ai-context                    # 快速載入項目身份和核心路徑
2️⃣ 閱讀 AI-ASSISTANT-GUIDE.md (當前)   # 30秒了解項目結構
3️⃣ 需要詳細導航時查看 PROJECT-INDEX.md  # 完整文件地圖
```

#### 2. **日常查找策略**
```
查詢類型 → 建議路徑
├─ 快速了解 → 當前文件的常見查詢表
├─ 技術細節 → PROJECT-INDEX.md
├─ 專門領域 → 當項目規模達到觸發條件時建立
└─ 索引維護 → INDEX-MAINTENANCE-GUIDE.md
```

#### 3. **檢查索引健康狀態** (推薦)
```bash
# 當懷疑索引可能過期時執行
npm run index:check
```

### ⚠️ 重要索引使用規則

#### ✅ 推薦做法
- **按層級查找**: L0→L1→L2→L3 漸進深入
- **信任索引**: 索引中的文件路徑都是準確的
- **避免盲目搜索**: 先查索引再搜索文件
- **尊重分類**: 不在工具目錄中找業務文件

#### ❌ 避免做法
- **跳過索引**: 直接搜索文件而不查看索引
- **忽略避免目錄**: 在 `.bmad-core/` 等目錄中查找項目內容
- **過度依賴單一索引**: 所有查詢都只用一個索引文件

### 🔧 索引系統維護

#### AI 助手的維護責任
- **檢測不一致**: 發現索引與實際文件不符時提醒用戶
- **建議更新**: 發現重要新文件未納入索引時建議用戶添加
- **報告問題**: 發現斷掉的引用或過期信息時報告

#### 使用檢查工具
```bash
# AI 助手可以建議用戶運行
npm run index:check        # 檢查索引同步狀態
npm run index:health       # 完整健康檢查
```

### 📊 索引擴展觸發條件

當項目達到以下規模時，AI 助手應建議啟用專門索引：

| 領域 | 觸發條件 | 建議動作 | 當前狀態 |
|------|----------|----------|----------|
| **API 端點** | > 20 個 | 建議建立 API 專門索引 | 📊 未達標 |
| **UI 組件** | > 50 個 | 建議建立 UI 組件專門索引 | 📊 未達標 |
| **資料表** | > 15 個 | 建議建立資料庫專門索引 | 📊 未達標 |
| **測試文件** | > 100 個 | 建議建立測試專門索引 | 📊 未達標 |

---

## 🔍 常見查詢快速指南

| 想了解什麼？ | 直接查看這個文件 |
|-------------|-----------------|
| 項目是什麼？ | `README.md` |
| 業務需求？ | `docs/prd.md` |
| 技術架構？ | `docs/architecture.md` |
| 開發計劃？ | `docs/mvp-development-plan.md` |
| 用戶故事？ | `docs/user-stories/MVP-PRIORITIES.md` |
| API 設計？ | `docs/api-specification.md` |
| Knowledge Base API？ | `docs/api/knowledge-base-api.md` |
| 資料庫？ | `prisma/schema.prisma` |
| 如何測試？ | `docs/testing-strategy.md` |
| 如何部署？ | `DEPLOYMENT-GUIDE.md` |
| CI/CD 流程？ | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` |
| 服務啟動？ | `STARTUP-GUIDE.md` |
| 技術驗證？ | `poc/README.md` |
| 環境設置？ | `.env.example` |
| 開發記錄？ | `DEVELOPMENT-LOG.md` |
| **完整文件索引？** | `PROJECT-INDEX.md` |
| **索引維護方法？** | `INDEX-MAINTENANCE-GUIDE.md` |
| **索引提醒設置？** | `docs/INDEX-REMINDER-SETUP.md` |
| **檢查索引狀態？** | `npm run index:check` |
| **Claude Code 規則？** | `CLAUDE.md` |

---

## 📊 MVP 開發狀態 (12週計劃)

```
🎯 目標: 11個核心功能
📅 時程: 12週 (6個Sprint)
👥 團隊: 5-7人
🚀 狀態: 準備就緒，可開始 Sprint 1

Sprint 1 (週1-2): 基礎架構設置
Sprint 2 (週3-4): 認證與知識庫
Sprint 3 (週5-6): AI 搜索引擎
Sprint 4 (週7-8): CRM 整合
Sprint 5 (週9-10): AI 提案生成
Sprint 6 (週11-12): 統一介面
```

---

## 🎭 項目角色說明

**你是誰？** AI 開發助手
**項目類型？** 企業級 SaaS 平台
**主要用戶？** 銷售團隊 (B2B)
**核心價值？** AI 驅動的銷售效率提升

---

## ⚡ 30秒項目摘要

這是一個為馬來西亞/新加坡市場開發的 AI 銷售賦能平台，使用 Next.js 14 全棧架構，整合 Dynamics 365 CRM 和 Azure OpenAI，幫助銷售團隊通過 AI 搜索、智能提案生成和客戶360度視圖提升成交率。項目已完成所有規劃和技術驗證，正準備開始 12 週的 MVP 開發。

**🤖 AI 助手重要提醒**:
- 這個項目有完整的4層索引系統，按 L0→L1→L2→L3 順序查找
- 避免在 `.bmad-core/`, `web-bundles/` 等工具目錄中查找項目內容
- 使用 `npm run index:check` 檢查索引健康狀態
- 詳細導航指南請查看 `PROJECT-INDEX.md`