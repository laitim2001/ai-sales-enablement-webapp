# AI註釋生成 - 參考文檔清單

**問題**: AI會參考哪些文檔來理解項目背景和最新狀況？

**答案**: AI會參考**多層級文檔**，按優先級和文件類型分層獲取信息。

---

## 📊 文檔參考層級

### 🔴 **核心必讀文檔** (所有文件都會參考)

這些是理解項目的**基礎文檔**，提供全局視角：

#### 1. **AI-ASSISTANT-GUIDE.md** 🌟 最重要
**用途**: AI助手的"入門指南"和"最新狀態"
```yaml
提供信息:
  - 項目背景: AI銷售賦能平台，目標用戶，核心價值
  - 最新更新: 最近完成的工作和當前狀態
  - 架構概覽: 技術棧、核心模組、系統架構
  - 開發指南: 關鍵決策、設計原則、最佳實踐
  - 快速參考: 常見任務、工具使用、文檔位置

參考時機: 開始處理前必讀
參考頻率: 每個會話開始時
對註釋的價值: ⭐⭐⭐⭐⭐
  - 理解項目整體定位和目標
  - 了解最新開發狀態
  - 掌握架構和模組關係
```

#### 2. **PROJECT-INDEX.md** 🗂️ 文件導航
**用途**: 項目的"目錄"和"地圖"
```yaml
提供信息:
  - 文件組織: 所有重要文件的位置和用途
  - 優先級分類: 文件的重要性標記（🔴🟡🟢）
  - 快速導航: 按類別組織的文件列表
  - 文件描述: 每個文件的簡要說明

參考時機: 尋找相關文件時
參考頻率: 處理每個文件前
對註釋的價值: ⭐⭐⭐⭐⭐
  - 快速定位相關文檔
  - 理解文件在項目中的位置
  - 發現相關聯的文件
```

#### 3. **mvp1-mvp2-complete-verification-report.md** 📋 實施狀態
**用途**: 項目的"完整現狀報告"
```yaml
提供信息:
  - 完成度統計: 每個Sprint的實施情況
  - 功能清單: 已實施的所有功能和API
  - 代碼量統計: 每個模組的代碼行數
  - 測試覆蓋: 測試文件和通過率
  - 性能指標: 實際性能數據
  - 技術細節: 具體實施方案和技術選型

參考時機: 處理核心業務邏輯文件時（🔴🟡優先級）
參考頻率: 高優先級文件必讀
對註釋的價值: ⭐⭐⭐⭐⭐
  - 了解功能的業務背景
  - 理解系統架構和整合關係
  - 獲取準確的統計數據
```

**關鍵內容示例**:
```markdown
從報告中獲取的信息:

lib/security/encryption.ts → 註釋可以引用:
- Sprint 3 Week 5實施的加密系統
- AES-256-GCM算法
- 三層金鑰優先級（Key Vault → Env → Auto-gen）
- 與RBAC、審計日誌的整合關係
- 測試覆蓋: 8項性能測試
- 性能指標: 平均加密<1ms

lib/workflow/engine.ts → 註釋可以引用:
- Sprint 5實施的工作流引擎
- 12狀態狀態機設計
- 30+狀態轉換
- 與提案生成、審批、通知系統的整合
- 測試覆蓋: 400行測試代碼
```

#### 4. **mvp2-optimization-tracking.md** 📈 最新進度
**用途**: "正在進行"的工作追蹤
```yaml
提供信息:
  - 當前任務: 正在執行的優化任務
  - 進度更新: 最新的完成狀態
  - 問題追蹤: 發現的問題和解決方案
  - 改進計劃: 短/中/長期優化建議

參考時機: 處理最近修改的文件時
參考頻率: 查看最新狀態時
對註釋的價值: ⭐⭐⭐⭐
  - 了解最新的改進和優化
  - 避免過時信息
  - 反映當前實際狀態
```

---

### 🟡 **領域專業文檔** (按需參考)

這些是特定領域的**詳細設計文檔**：

#### 5. **docs/prd/*.md** (PRD文檔)
**用途**: 產品需求文檔
```yaml
可用PRD文檔:
  - 工作流引擎PRD
  - 知識庫系統PRD
  - AI搜索引擎PRD
  - CRM整合PRD
  (實際PRD數量和名稱需要在項目中確認)

提供信息:
  - 業務需求: 為什麼需要這個功能
  - 用戶故事: 用戶如何使用
  - 功能規格: 詳細的功能描述
  - 驗收標準: 功能完成的標準

參考時機: 處理對應模組的核心文件時
參考頻率: 高優先級業務邏輯文件
對註釋的價值: ⭐⭐⭐⭐
```

#### 6. **docs/sprint*-design*.md** (設計文檔)
**用途**: 技術設計文檔
```yaml
已知設計文檔:
  - docs/sprint3-rbac-design-document.md (RBAC設計)
  - docs/sprint3-week9-fine-grained-permissions-design.md (細粒度權限)
  - docs/monitoring-*.md (監控系統設計)
  - docs/sprint3-disaster-recovery-guide.md (災難恢復)

提供信息:
  - 架構設計: 系統如何設計
  - 技術選型: 為什麼選擇這個技術
  - 實施細節: 具體如何實現
  - 最佳實踐: 推薦的使用方式

參考時機: 處理對應模組的文件時
參考頻率: 中高優先級技術文件
對註釋的價值: ⭐⭐⭐⭐
```

**關鍵設計文檔示例**:
```markdown
處理 lib/security/rbac-permissions.ts 時參考:
→ docs/sprint3-rbac-design-document.md

可獲取信息:
- 5角色 × 22資源 × 13操作的完整權限模型
- 資源擁有權規則
- 4種API實施模式
- 前端權限控制設計
- 實施路線圖

註釋可以引用:
/**
 * @fileoverview RBAC權限引擎 - 企業級角色權限控制核心
 * @description
 * 實施5角色×22資源×13操作的完整權限模型（詳見Sprint 3 RBAC設計文檔）
 *
 * ### 權限模型:
 * - 5個角色: ADMIN, SALES_MANAGER, SALES_REP, MARKETING, VIEWER
 * - 22個資源類型: Customer, Proposal, Template等
 * - 13個操作類型: CREATE, READ, UPDATE, DELETE, APPROVE等
 * ...
 */
```

#### 7. **DEVELOPMENT-LOG.md** 📝 開發歷史
**用途**: 開發決策和歷史記錄
```yaml
提供信息:
  - 歷史會話: 過去的開發記錄
  - 設計決策: 為什麼這樣設計
  - 問題解決: 遇到的問題和解決方案
  - 經驗教訓: 值得注意的教訓

參考時機: 需要了解歷史背景時
參考頻率: 遇到複雜或特殊實現時
對註釋的價值: ⭐⭐⭐
```

---

### 🟢 **輔助參考文檔** (選擇性參考)

#### 8. **package.json** 📦 依賴信息
**用途**: 技術棧和依賴版本
```yaml
提供信息:
  - 依賴版本: 使用的庫和版本
  - 技術棧: 項目使用的技術
  - 腳本命令: 可用的npm命令

參考時機: 需要技術細節時
對註釋的價值: ⭐⭐⭐
```

#### 9. **prisma/schema.prisma** 🗄️ 數據模型
**用途**: 數據庫結構
```yaml
提供信息:
  - 數據模型: 所有數據表和字段
  - 關聯關係: 表之間的關係
  - 索引配置: 性能優化

參考時機: 處理數據相關文件時
對註釋的價值: ⭐⭐⭐⭐
```

#### 10. **README.md / docs/*.md** 📚 通用文檔
**用途**: 使用指南和操作手冊
```yaml
提供信息:
  - 使用說明: 如何使用系統
  - 配置指南: 如何配置
  - 故障排查: 常見問題

參考時機: 需要使用說明時
對註釋的價值: ⭐⭐
```

---

## 🎯 AI文檔參考策略

### **按文件優先級決定參考深度**:

#### 🔴 **極高優先級文件** (44個核心業務邏輯):
```yaml
必讀文檔:
  1. ✅ AI-ASSISTANT-GUIDE.md (項目背景)
  2. ✅ PROJECT-INDEX.md (文件定位)
  3. ✅ mvp1-mvp2-complete-verification-report.md (實施詳情)
  4. ✅ 對應的設計文檔 (如果存在)
  5. ✅ prisma/schema.prisma (數據模型)

選讀文檔:
  6. mvp2-optimization-tracking.md (最新狀態)
  7. DEVELOPMENT-LOG.md (歷史背景)
  8. 對應的PRD文檔 (業務需求)

預期註釋質量: 95% 準確度
生成時間: 3-5分鐘/文件
```

#### 🟡 **高優先級文件** (70個重要組件):
```yaml
必讀文檔:
  1. ✅ AI-ASSISTANT-GUIDE.md
  2. ✅ PROJECT-INDEX.md
  3. ✅ mvp1-mvp2-complete-verification-report.md

選讀文檔:
  4. 對應的設計文檔
  5. prisma/schema.prisma
  6. mvp2-optimization-tracking.md

預期註釋質量: 85-90% 準確度
生成時間: 2-3分鐘/文件
```

#### 🟢 **中優先級文件** (32個工具輔助):
```yaml
必讀文檔:
  1. ✅ AI-ASSISTANT-GUIDE.md
  2. ✅ PROJECT-INDEX.md

選讀文檔:
  3. mvp1-mvp2-complete-verification-report.md

預期註釋質量: 80-85% 準確度
生成時間: 1-2分鐘/文件
```

#### 🔵⚪ **普通/低優先級** (257個):
```yaml
必讀文檔:
  1. ✅ AI-ASSISTANT-GUIDE.md (快速掃描)
  2. ✅ PROJECT-INDEX.md (定位)

預期註釋質量: 70-80% 準確度
生成時間: 30秒-1分鐘/文件
```

---

## 📋 完整文檔清單 (按重要性排序)

### Tier 1: 核心必讀 (所有文件)
| # | 文檔 | 用途 | 優先級 |
|---|------|------|--------|
| 1 | AI-ASSISTANT-GUIDE.md | 項目背景+最新狀態 | ⭐⭐⭐⭐⭐ |
| 2 | PROJECT-INDEX.md | 文件導航+快速定位 | ⭐⭐⭐⭐⭐ |
| 3 | mvp1-mvp2-complete-verification-report.md | 完整實施狀態 | ⭐⭐⭐⭐⭐ |
| 4 | mvp2-optimization-tracking.md | 最新進度追蹤 | ⭐⭐⭐⭐ |

### Tier 2: 領域專業 (中高優先級文件)
| # | 文檔 | 用途 | 參考時機 |
|---|------|------|---------|
| 5 | docs/sprint3-rbac-design-document.md | RBAC設計 | lib/security/rbac-* |
| 6 | docs/sprint3-week9-fine-grained-permissions-design.md | 細粒度權限 | lib/security/*-permissions.ts |
| 7 | docs/monitoring-*.md | 監控系統 | lib/monitoring/* |
| 8 | docs/sprint3-disaster-recovery-guide.md | 災難恢復 | 備份相關文件 |
| 9 | prisma/schema.prisma | 數據模型 | 所有數據相關文件 |
| 10 | DEVELOPMENT-LOG.md | 開發歷史 | 複雜實現 |

### Tier 3: 輔助參考 (按需)
| # | 文檔 | 用途 | 參考時機 |
|---|------|------|---------|
| 11 | package.json | 技術棧 | 需要版本信息時 |
| 12 | README.md | 項目介紹 | 需要整體說明時 |
| 13 | docs/*.md | 各類文檔 | 特定需求時 |

---

## 🔍 實際參考示例

### 示例1: 生成 `lib/security/encryption.ts` 註釋

**AI會參考**:
1. ✅ **AI-ASSISTANT-GUIDE.md** → 了解這是"安全系統數據保護層"
2. ✅ **PROJECT-INDEX.md** → 找到相關文件（rbac, audit-logger等）
3. ✅ **mvp1-mvp2-complete-verification-report.md** (行750-968) →
   ```
   - Sprint 3 Week 5實施
   - AES-256-GCM加密
   - 三層金鑰優先級
   - 與Key Vault整合
   - 性能測試: 8項測試, <1ms加密
   ```
4. ✅ **prisma/schema.prisma** → 查看哪些模型使用加密欄位
5. 分析代碼引用關係 → 找到`sensitive-data-handler.ts`調用
6. 分析被調用者 → 發現`audit-logger.ts`記錄加密操作

**生成的註釋**:
```typescript
/**
 * @fileoverview 敏感資料加密模組 - 安全系統數據保護層
 * @module lib/security/encryption
 * @description
 * 企業級AES-256-GCM加密服務，是安全系統的核心數據保護組件。
 * 實施於MVP Phase 2 Sprint 3 Week 5，與RBAC權限控制、審計日誌、
 * JWT認證協同工作，構成完整的企業級安全架構。
 *
 * ### 在安全架構中的角色:
 * - **數據保護層**: 負責靜態數據加密（參考: Sprint 3安全加固）
 * - **配合審計**: 所有加密操作自動記錄到審計日誌
 * - **權限集成**: 僅授權用戶可執行加密/解密操作
 *
 * ### 金鑰管理策略:
 * - **三層優先級**: Azure Key Vault → 環境變數 → 自動生成
 * - **懶加載**: 首次使用時才載入Key Vault金鑰
 * - **金鑰輪換**: 支持定期金鑰更新
 *
 * ### 保護的數據類型:
 * - 客戶PII (電話、Email、地址) - 符合GDPR要求
 * - API Keys和Token - 安全存儲憑證
 * - 敏感業務數據 - 7個模型/12個欄位
 *
 * ### 技術規格:
 * - **算法**: AES-256-GCM (AEAD認證加密)
 * - **性能**: 平均加密時間 <1ms (8項性能測試驗證)
 * - **IV**: 每次加密隨機生成12字節
 * - **認證標籤**: 128位GCM標籤
 *
 * ### 系統整合:
 * @see {@link lib/security/sensitive-data-handler.ts} 敏感數據處理器
 * @see {@link lib/security/audit-logger.ts} 審計日誌系統
 * @see {@link lib/security/rbac-permissions.ts} RBAC權限控制
 * @see {@link docs/sprint3-rbac-design-document.md} 安全架構設計
 *
 * @created 2024-XX-XX (Sprint 3 Week 5)
 * @lastModified 2025-10-08
 * @version 2.0.0
 */
```

**信息來源分析**:
- ✅ "安全系統數據保護層" ← AI-ASSISTANT-GUIDE.md
- ✅ "Sprint 3 Week 5" ← mvp1-mvp2-complete-verification-report.md
- ✅ "AES-256-GCM" ← 代碼分析 + 驗證報告
- ✅ "三層金鑰優先級" ← 驗證報告第768-771行
- ✅ "7個模型/12個欄位" ← 驗證報告 + sensitive-fields-config.ts
- ✅ "平均<1ms" ← 驗證報告第784行
- ✅ "與RBAC、審計協同" ← 引用關係分析 + 驗證報告

---

### 示例2: 生成 `app/api/proposals/route.ts` 註釋

**AI會參考**:
1. ✅ **AI-ASSISTANT-GUIDE.md** → "AI驅動的銷售賦能平台"
2. ✅ **mvp1-mvp2-complete-verification-report.md** (行1041-1088) →
   ```
   - Sprint 5提案工作流程
   - 12狀態狀態機
   - 整合Azure OpenAI、工作流引擎、通知系統
   ```
3. ✅ **PROJECT-INDEX.md** → 找到相關模組（workflow, ai, notification）
4. 分析代碼 → 調用`lib/workflow/engine.ts`、`lib/ai/azure-openai-service.ts`
5. 分析引用 → 被`components/dashboard/ProposalDashboard.tsx`調用

**生成的註釋** (簡化版):
```typescript
/**
 * @fileoverview AI提案生成API - 銷售賦能核心功能
 * @module app/api/proposals
 * @description
 * 提供AI驅動的銷售提案自動生成服務，整合工作流引擎、
 * Azure OpenAI、通知系統和審計日誌（MVP Phase 2 Sprint 5實施）。
 *
 * ### 業務價值:
 * - **自動化提案**: 根據客戶需求自動生成定制提案
 * - **AI增強**: 使用Azure OpenAI GPT-4優化提案內容
 * - **工作流整合**: 自動觸發12狀態審批和通知流程
 * - **合規追蹤**: 所有操作自動記錄審計日誌
 * ...
 */
```

---

## ✅ 總結

### 你的問題答案:

**Q**: AI會參考哪些文檔？

**A**: **是的，會參考你提到的4個文檔，還會參考更多：**

#### ✅ 你提到的文檔（全部會用）:
1. ✅ **AI-ASSISTANT-GUIDE.md** - 最重要，必讀
2. ✅ **PROJECT-INDEX.md** - 最重要，必讀
3. ✅ **mvp1-mvp2-complete-verification-report.md** - 非常重要，高優先級文件必讀
4. ✅ **mvp2-optimization-tracking.md** - 重要，了解最新狀態

#### ✅ 額外會參考的文檔:
5. **docs/sprint*-design-*.md** - 設計文檔（按需）
6. **prisma/schema.prisma** - 數據模型（數據相關文件）
7. **DEVELOPMENT-LOG.md** - 開發歷史（複雜實現）
8. **package.json** - 技術棧（需要版本信息時）
9. **docs/prd/*.md** - PRD文檔（業務需求，如果存在）

### 📊 參考策略:

- **所有文件**: AI-ASSISTANT-GUIDE.md + PROJECT-INDEX.md
- **高優先級**: 上述 + 驗證報告 + 設計文檔 + 數據模型
- **中優先級**: 上述前3個
- **低優先級**: 上述前2個（快速掃描）

### 🎯 預期效果:

有了這些文檔參考，生成的註釋會：
- ✅ 準確反映業務目的
- ✅ 說明系統角色和整合關係
- ✅ 包含準確的技術細節
- ✅ 引用正確的Sprint和實施時間
- ✅ 提供有價值的使用說明

準備好開始了嗎？ 🚀
