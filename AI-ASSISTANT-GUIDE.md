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
```

### 🟡 重要 (常用)
```
docs/user-stories/MVP-PRIORITIES.md    # 24個用戶故事優先級
docs/mvp-implementation-checklist.md   # 逐週執行清單
docs/testing-strategy.md               # 測試策略
poc/run-all-tests.js                  # 技術驗證腳本
README.md                              # 項目說明
```

### 🟢 參考 (需要時查看)
```
docs/security-standards.md     # 安全要求
docs/front-end-spec.md         # UI/UX 規格
.env.example                   # 環境配置範例
docker-compose.dev.yml         # 開發環境
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

## 🔍 常見查詢快速指南

| 想了解什麼？ | 直接查看這個文件 |
|-------------|-----------------|
| 項目是什麼？ | `README.md` |
| 業務需求？ | `docs/prd.md` |
| 技術架構？ | `docs/architecture.md` |
| 開發計劃？ | `docs/mvp-development-plan.md` |
| 用戶故事？ | `docs/user-stories/MVP-PRIORITIES.md` |
| API 設計？ | `docs/api-specification.md` |
| 資料庫？ | `prisma/schema.prisma` |
| 如何測試？ | `docs/testing-strategy.md` |
| 技術驗證？ | `poc/README.md` |
| 環境設置？ | `.env.example` |

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

**🔗 詳細索引**: 查看 `PROJECT-INDEX.md` 獲取完整的文件導航指南