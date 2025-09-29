# AI 銷售賦能平台

> **智能銷售助手，提升團隊成交率**
> 面向馬來西亞/新加坡市場的 AI 驅動銷售賦能解決方案

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

## 🤖 AI 助手專用導航

> **📋 AI 助手請先閱讀**:
> - **快速指南**: [AI-ASSISTANT-GUIDE.md](AI-ASSISTANT-GUIDE.md) - 30秒了解項目
> - **完整索引**: [PROJECT-INDEX.md](PROJECT-INDEX.md) - 詳細文件導航系統
> - **上下文檔**: [.ai-context](.ai-context) - 快速上下文載入

## 🎯 項目概述

AI 銷售賦能平台是一個全棧 Web 應用程式，結合了人工智能、知識管理和 CRM 整合，幫助銷售團隊：

- 🔍 **智能知識搜索** - AI 驅動的文檔搜索和推薦
- 🤖 **AI 提案生成** - 個人化提案內容自動生成
- 🔗 **CRM 深度整合** - Dynamics 365 無縫數據同步
- 📊 **統一銷售儀表板** - 全方位銷售數據視圖

## 🏗️ 技術架構

### 核心技術棧
- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **後端**: Next.js Server Actions + tRPC + Prisma ORM
- **資料庫**: PostgreSQL 16 + pgvector (向量搜索)
- **AI 服務**: Azure OpenAI (GPT-4 + Embeddings)
- **整合**: Dynamics 365 API + OAuth 2.0
- **部署**: Vercel / Azure App Service

### 系統架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │  PostgreSQL +   │    │  Azure OpenAI   │
│   (Frontend +    │◄──►│    pgvector     │    │    Service      │
│    Backend)      │    │   (Database)    │    │ (AI/Embeddings) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dynamics 365  │    │     Prisma      │    │     tRPC        │
│   (CRM 整合)     │    │    (ORM)        │    │  (API Layer)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速開始

> **🤖 自動化環境設置 (推薦新開發者)**: 
> 如果這是您第一次設置此項目，請跳轉到 [自動化設置](#-自動化環境設置) 部分獲得更簡單的體驗。

### 前置要求
- Node.js 18.0+
- npm 8.0+
- Docker & Docker Compose (推薦)
- PostgreSQL 16+ (或使用 Docker)

### 1. 克隆項目
```bash
git clone https://github.com/yourusername/ai-sales-enablement-webapp.git
cd ai-sales-enablement-webapp
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境配置
```bash
# 複製環境變數範例
cp .env.example .env.local

# 編輯 .env.local 並填入實際配置值
# 特別注意：Azure OpenAI 和 Dynamics 365 的配置
```

### 4. 啟動開發環境

#### 選項 A: 使用 Docker (推薦)
```bash
# 啟動所有服務 (PostgreSQL + Redis + App)
npm run docker:dev

# 服務將在以下端口啟動：
# - 應用程式: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - pgAdmin: http://localhost:8080
```

#### 選項 B: 本地開發
```bash
# 確保 PostgreSQL 和 Redis 正在運行
# 生成 Prisma client
npm run db:generate

# 執行資料庫遷移
npm run db:migrate

# 啟動開發伺服器
npm run dev
```

### 5. 驗證安裝
訪問 http://localhost:3000 確認應用程式正在運行。

## 📁 項目結構

```
ai-sales-enablement-webapp/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # 認證相關頁面
│   ├── (dashboard)/       # 主要應用頁面
│   ├── api/               # API 路由
│   └── globals.css        # 全局樣式
├── components/            # React 組件
│   ├── ui/               # 基礎 UI 組件
│   ├── forms/            # 表單組件
│   └── features/         # 功能特定組件
├── lib/                  # 工具函數和配置
│   ├── auth/            # 認證邏輯
│   ├── db/              # 資料庫工具
│   ├── ai/              # AI 服務整合
│   └── integrations/    # 第三方整合
├── prisma/              # 資料庫 schema 和遷移
├── docs/                # 項目文檔
├── poc/                 # 概念驗證測試
└── scripts/             # 部署和維護腳本
```

## 🗄️ 資料庫設計

主要資料表：
- **User** - 用戶管理和認證
- **Customer** - 客戶資料 (從 CRM 同步)
- **Document** - 知識庫文檔 + 向量嵌入
- **Proposal** - AI 生成的提案內容
- **CallRecord** - 銷售活動記錄

查看完整的資料庫 schema：[prisma/schema.prisma](prisma/schema.prisma)

## 🧪 測試

```bash
# 運行單元測試
npm run test

# 監看模式測試
npm run test:watch

# 測試覆蓋率
npm run test:coverage

# End-to-End 測試
npm run test:e2e

# 執行所有 POC 驗證測試
npm run poc:test
```

## 📊 開發工作流程

### MVP 開發階段 (12 週)
1. **Sprint 1-2**: 基礎架構和認證系統
2. **Sprint 3**: AI 搜索引擎實施
3. **Sprint 4**: CRM 整合和客戶視圖
4. **Sprint 5**: AI 提案生成功能
5. **Sprint 6**: 統一儀表板和優化

詳細開發計劃：[docs/mvp-development-plan.md](docs/mvp-development-plan.md)

### 代碼品質標準
- TypeScript 嚴格模式
- ESLint + Prettier 代碼格式化
- 單元測試覆蓋率 > 80%
- E2E 測試覆蓋關鍵用戶流程

## 🔧 可用腳本

| 命令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 構建生產版本 |
| `npm run start` | 啟動生產伺服器 |
| `npm run lint` | 執行 ESLint 檢查 |
| `npm run type-check` | TypeScript 類型檢查 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:migrate` | 執行資料庫遷移 |
| `npm run db:studio` | 開啟 Prisma Studio |
| `npm run docker:dev` | 啟動開發環境 Docker |
| `npm run poc:test` | 執行 POC 驗證測試 |

## 🌐 部署

### Vercel 部署 (推薦)
```bash
# 連接到 Vercel
vercel

# 設定環境變數
vercel env add

# 部署
vercel --prod
```

### Azure App Service 部署
查看詳細部署指南：[docs/deployment-guide.md](docs/deployment-guide.md)

## 🤖 自動化環境設置

> **新開發者必讀！** 我們提供了自動化工具來解決常見的環境設置問題。

### 🔧 自動化環境檢查與修復

如果您在新電腦上設置此項目或遇到任何環境問題：

```bash
# 1. 首先克隆項目
git clone <repository-url>
cd ai-sales-enablement-webapp-main

# 2. 運行環境檢查（診斷所有問題）
npm run env:check

# 3. 自動修復所有發現的問題
npm run fix:all

# 4. 啟動開發服務器
npm run dev
```

### 🛠️ 可用的自動化命令

#### 環境檢查工具
```bash
npm run env:setup        # 完整環境設置和檢查
npm run env:check        # 只檢查，不修復
npm run env:auto-fix     # 自動修復發現的問題
```

#### 快速修復工具
```bash
npm run fix:all          # 完整修復流程（推薦）
npm run fix:deps         # 只修復依賴問題
npm run fix:env          # 只修復環境變數
npm run fix:restart      # 重啟服務
npm run fix:diagnose     # 快速診斷問題
```

### 🚨 常見問題自動解決

我們的自動化工具可以解決以下常見問題：

| 問題 | 症狀 | 自動修復命令 |
|------|------|-------------|
| **依賴包缺失** | `Module not found: Can't resolve '@radix-ui/react-checkbox'` | `npm run fix:deps` |
| **資料庫連接錯誤** | `Can't reach database server at localhost:5432` | `npm run fix:env` |
| **環境變數配置錯誤** | 各種連接失敗 | `npm run fix:env` |
| **端口被占用** | `Port 3000 is in use` | 正常行為，會自動使用 3001 |
| **Docker 服務未啟動** | 資料庫連接失敗 | `npm run fix:all` |

### 📋 完整新開發者指南

如需詳細的步驟說明，請查看：
- **[新開發者設置指南](docs/NEW-DEVELOPER-SETUP-GUIDE.md)** - 包含完整的故障排除和最佳實踐

### 💡 設計理念

我們創建這些自動化工具是因為：
- **消除重複工作**: 避免每次在新電腦上設置時都要手動除錯
- **標準化環境**: 確保所有開發者都有一致的環境配置
- **快速診斷**: 一鍵診斷和修復常見的環境問題
- **新手友好**: 讓新開發者能在 15 分鐘內開始開發

## 📚 文檔

- [架構設計](docs/architecture.md)
- [API 規格](docs/api-specification.md)
- [測試策略](docs/testing-strategy.md)
- [用戶故事](docs/user-stories/)
- [安全標準](docs/security-standards.md)
- **[新開發者設置指南](docs/NEW-DEVELOPER-SETUP-GUIDE.md)** ⭐

## 🤝 貢獻指南

1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 🔒 安全性

- JWT 認證和授權
- CORS 保護
- SQL 注入防護 (Prisma ORM)
- 敏感資料加密
- API 速率限制

## 📄 授權

本項目採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🆘 支援

- 📧 Email: support@yourcompany.com
- 📚 文檔: [項目 Wiki](https://github.com/yourusername/ai-sales-enablement-webapp/wiki)
- 🐛 問題回報: [GitHub Issues](https://github.com/yourusername/ai-sales-enablement-webapp/issues)

## 🎉 致謝

- Next.js 團隊提供優秀的全棧框架
- OpenAI/Azure OpenAI 提供 AI 能力
- Prisma 團隊提供現代 ORM 解決方案
- pgvector 團隊提供向量搜索擴展

---

**🚀 開始構建你的 AI 驅動銷售平台！**