# 📂 專門索引目錄 (Level 3)

> **狀態**: 預備擴展目錄 - 當項目規模達到觸發條件時啟用
> **目的**: 為特定領域提供專門的詳細索引

---

## 🎯 使用時機

當項目達到以下規模時，建議啟用對應的專門索引：

### 📊 觸發條件表

| 專門索引 | 觸發條件 | 文件範例 | 內容說明 |
|---------|----------|----------|----------|
| **API-INDEX.md** | API 端點 > 20 個 | `API-INDEX.md` | 所有 API 端點分類、參數、範例 |
| **COMPONENT-INDEX.md** | UI 組件 > 50 個 | `COMPONENT-INDEX.md` | React 組件分類、使用方式、依賴 |
| **DATABASE-INDEX.md** | 資料表 > 15 個 | `DATABASE-INDEX.md` | 資料表結構、關聯、遷移歷史 |
| **TEST-INDEX.md** | 測試文件 > 100 個 | `TEST-INDEX.md` | 測試分類、覆蓋率、測試策略 |
| **CONFIG-INDEX.md** | 配置文件 > 10 個 | `CONFIG-INDEX.md` | 配置文件用途、環境、依賴 |
| **DOCS-INDEX.md** | 文檔文件 > 30 個 | `DOCS-INDEX.md` | 文檔分類、更新狀態、目標受眾 |

---

## 📋 當前項目狀態

### 🔴 AI 銷售賦能平台當前規模 (2024年9月)

| 領域 | 當前數量 | 觸發條件 | 狀態 | 預計達到時間 |
|------|----------|----------|------|-------------|
| **API 端點** | ~15 個 | > 20 個 | 🟡 接近 | Sprint 3-4 |
| **UI 組件** | ~10 個 | > 50 個 | 🟢 距離較遠 | Phase 2+ |
| **資料表** | 8 個 | > 15 個 | 🟡 接近 | Sprint 4-5 |
| **測試文件** | ~20 個 | > 100 個 | 🟢 距離較遠 | Phase 2+ |
| **配置文件** | 6 個 | > 10 個 | 🟡 接近 | Sprint 2-3 |
| **文檔文件** | 25 個 | > 30 個 | 🟡 接近 | Sprint 1-2 |

### 📅 預期啟用順序

1. **DOCS-INDEX.md** - 預計 Sprint 1-2 (文檔數量已接近)
2. **CONFIG-INDEX.md** - 預計 Sprint 2-3 (配置文件增長)
3. **API-INDEX.md** - 預計 Sprint 3-4 (API 端點擴展)
4. **DATABASE-INDEX.md** - 預計 Sprint 4-5 (資料模型完善)

---

## 🛠️ 專門索引範本

### 範本 1: API-INDEX.md
```markdown
# 📡 API 端點索引

## 🔍 快速導航
- [認證相關 API](#auth-api)
- [用戶管理 API](#user-api)
- [知識庫 API](#knowledge-api)
- [CRM 整合 API](#crm-api)
- [AI 服務 API](#ai-api)

## 📊 API 統計
- 總端點數: 25 個
- 最後更新: 2024-09-XX
- 覆蓋率: 100% (所有端點已文檔化)

## 🔐 認證相關 API {#auth-api}

### POST /api/auth/login
- **用途**: 用戶登入
- **文件**: `app/api/auth/login/route.ts`
- **參數**: email, password
- **回應**: JWT token
- **範例**: [查看範例](../docs/api-examples/auth-login.md)

[... 其他 API 端點詳細說明]
```

### 範本 2: DATABASE-INDEX.md
```markdown
# 🗄️ 資料庫索引

## 📊 資料表概覽
- 總表數: 18 個
- 核心業務表: 8 個
- 關聯表: 6 個
- 系統表: 4 個

## 🏗️ 資料表關聯圖
[ERD 圖表或關聯說明]

## 📋 核心業務表

### User 表
- **檔案**: `prisma/schema.prisma:15-35`
- **用途**: 用戶基本資訊和認證
- **關聯**: 一對多 → Document, Proposal
- **索引**: email (唯一), createdAt
- **遷移**: [查看遷移歷史](../prisma/migrations/user-table.md)

[... 其他表詳細說明]
```

---

## 🔄 索引維護規則

### 專門索引的建立時機
1. **達到觸發條件時**: 自動或手動建立對應索引
2. **內容超出主索引時**: 當 PROJECT-INDEX.md 某個部分過於龐大
3. **團隊需求時**: 特定領域專家需要專門導航

### 維護頻率
- **高頻更新**: API-INDEX.md (每 Sprint)
- **中頻更新**: DATABASE-INDEX.md (每 2 Sprint)
- **低頻更新**: COMPONENT-INDEX.md (每 Phase)

### 同步機制
```bash
# 專門索引也需要同步檢查
npm run index:check

# 檢查工具會自動檢測專門索引的一致性
```

---

## 📈 自動化擴展策略

### 當項目達到觸發條件時

#### 自動檢測腳本會：
1. **警告提示**: 提醒團隊某領域需要專門索引
2. **範本生成**: 提供對應的索引範本
3. **更新主索引**: 在主索引中添加專門索引的引用

#### 範例自動化流程：
```bash
# 檢測到 API 端點超過 20 個
🚨 建議建立 API-INDEX.md
📋 已生成範本: indexes/API-INDEX.md.template
⚡ 請手動完善內容並更新 PROJECT-INDEX.md
```

### 專門索引的整合

專門索引建立後，需要更新主索引文件：

```markdown
# 在 PROJECT-INDEX.md 中添加
### 📡 API 專門索引
- **文件路徑**: `indexes/API-INDEX.md`
- **涵蓋範圍**: 所有 25+ API 端點的詳細文檔
- **更新頻率**: 每 Sprint
- **維護責任**: 後端開發團隊
```

---

## 🎯 使用指南

### 何時查看專門索引？

1. **主索引指向時**: PROJECT-INDEX.md 會引導查看專門索引
2. **深度查詢時**: 需要特定領域的詳細信息
3. **專業工作時**: 專門領域的開發和維護工作

### AI 助手使用策略

```
查詢類型 → 索引選擇
├─ 快速查找 → AI-ASSISTANT-GUIDE.md
├─ 一般導航 → PROJECT-INDEX.md
├─ API 專門查詢 → indexes/API-INDEX.md
├─ 資料庫專門查詢 → indexes/DATABASE-INDEX.md
└─ 其他專門查詢 → indexes/[相關領域]-INDEX.md
```

---

**🎯 記住：專門索引是對主索引系統的補充，不是替代。保持與主索引的同步和一致性是關鍵！**