# 🎯 情況4: 新功能開發測試 - 從零開始構建新功能

> **使用時機**: 開發全新功能時
> **目標**: 設計並實現符合架構規範的新功能,完整測試和文檔
> **預計時間**: 根據功能複雜度而定

---

## 📋 執行清單

### 第1步: 需求分析和設計

```markdown
需求澄清:

與用戶確認以下內容:
1. 功能的核心價值是什麼?
2. 目標用戶是誰?
3. 主要使用場景有哪些?
4. 必須功能 vs 可選功能?
5. 性能和擴展性要求?
6. 安全和權限要求?
7. 預期上線時間?

將答案記錄下來作為設計參考。
```

### 第2步: 技術方案設計

```markdown
設計文檔準備:

1. 數據模型設計
   - 需要哪些Prisma模型?
   - 模型之間的關聯關係?
   - 索引策略?
   - 數據驗證規則?

2. API設計
   - 需要哪些API端點?
   - 請求/響應格式?
   - 錯誤處理策略?
   - 是否需要分頁/篩選/排序?

3. UI/UX設計
   - 需要哪些頁面/組件?
   - 用戶交互流程?
   - 響應式設計考慮?
   - 無障礙設計考慮?

4. 整合設計
   - 需要整合哪些外部服務?
   - 數據同步策略?
   - 錯誤處理和降級方案?

參考現有設計文檔:
@docs/2-architecture/
@docs/3-api-specs/
```

### 第3步: 安全和權限設計

```markdown
安全設計:

@claudedocs/2-sprints/sprint-3/sprint3-rbac-design-document.md
- 確定需要的權限級別
- 設計資源和操作定義

安全檢查清單:
- [ ] 權限級別: VIEWER/EDITOR/MANAGER/ADMIN/SUPERADMIN?
- [ ] 資源類型: 定義新的資源類型?
- [ ] 操作類型: 需要哪些操作權限?
- [ ] 所有權檢查: 是否需要ownership-based權限?
- [ ] 字段級權限: 是否需要字段級權限控制?
- [ ] 數據加密: 是否涉及敏感數據需要加密?
- [ ] 審計日誌: 哪些操作需要記錄到審計日誌?

參考:
@claudedocs/2-sprints/sprint-3/sprint3-week9-fine-grained-permissions-design.md
```

### 第4步: 制定詳細開發計劃

```markdown
使用 TodoWrite 制定分階段計劃:

TodoWrite({
  todos: [
    // 設計階段
    {content: "需求分析和技術方案設計", status: "completed"},
    {content: "創建設計文檔", status: "in_progress"},

    // 後端開發階段
    {content: "設計Prisma數據模型", status: "pending"},
    {content: "創建數據庫遷移", status: "pending"},
    {content: "實施API端點 - CRUD基礎", status: "pending"},
    {content: "實施業務邏輯和驗證", status: "pending"},
    {content: "實施RBAC權限控制", status: "pending"},
    {content: "實施審計日誌", status: "pending"},
    {content: "後端單元測試", status: "pending"},

    // 前端開發階段
    {content: "設計UI組件結構", status: "pending"},
    {content: "實施基礎UI組件", status: "pending"},
    {content: "實施頁面路由", status: "pending"},
    {content: "實施數據獲取和狀態管理", status: "pending"},
    {content: "實施表單驗證", status: "pending"},
    {content: "實施錯誤處理", status: "pending"},
    {content: "前端單元測試", status: "pending"},

    // 整合階段
    {content: "前後端整合測試", status: "pending"},
    {content: "外部服務整合(如需要)", status: "pending"},

    // 測試階段
    {content: "編寫E2E測試", status: "pending"},
    {content: "執行完整測試套件", status: "pending"},
    {content: "性能測試", status: "pending"},
    {content: "安全測試", status: "pending"},

    // 文檔和交付階段
    {content: "更新API文檔", status: "pending"},
    {content: "更新用戶文檔", status: "pending"},
    {content: "創建使用示例", status: "pending"},
    {content: "更新 DEVELOPMENT-LOG.md", status: "pending"},
    {content: "代碼審查", status: "pending"},
    {content: "提交到GitHub", status: "pending"}
  ]
})
```

### 第5步: 數據模型實施

```markdown
Prisma Schema設計:

1. 在 prisma/schema.prisma 添加新模型

model NewFeature {
  id        String   @id @default(cuid())
  // 基礎字段
  name      String
  description String?

  // 關聯字段
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  // 元數據字段
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 索引
  @@index([userId])
  @@index([createdAt])
}

2. 創建遷移
   npx prisma migrate dev --name add-new-feature

3. 生成Prisma Client
   npx prisma generate
```

### 第6步: API端點實施

```markdown
創建API路由:

1. 創建API文件結構
   app/api/new-feature/
   ├── route.ts              (GET, POST)
   ├── [id]/
   │   └── route.ts          (GET, PATCH, DELETE)
   └── stats/
       └── route.ts          (GET)

2. 實施每個端點
   - 請求驗證
   - 權限檢查 (使用 requireRole 或 checkPermission)
   - 業務邏輯
   - 審計日誌 (使用 createAuditLog)
   - 錯誤處理
   - 響應格式化

3. 添加完整中文註釋

參考現有API實現:
@app/api/knowledge-base/
@app/api/templates/
```

### 第7步: 前端組件實施

```markdown
創建React組件:

1. 組件文件結構
   components/new-feature/
   ├── new-feature-list.tsx      (列表組件)
   ├── new-feature-card.tsx      (卡片組件)
   ├── new-feature-form.tsx      (表單組件)
   ├── new-feature-detail.tsx    (詳情組件)
   └── new-feature-filters.tsx   (篩選組件)

2. 使用shadcn/ui組件
   - Button, Input, Select, Textarea
   - Dialog, DropdownMenu, Popover
   - Table, Card, Badge
   - Form (with react-hook-form)

3. 實施功能
   - 數據獲取 (使用 fetch 或 React Query)
   - 表單驗證 (使用 zod)
   - 錯誤處理和顯示
   - 加載狀態
   - 空狀態處理
   - 權限控制 (使用 useAuth)

4. 添加完整中文註釋

參考現有組件:
@components/knowledge/
@components/templates/
```

### 第8步: 權限整合

```markdown
RBAC權限實施:

1. 定義資源和操作
   在 lib/security/rbac.ts 添加:

   export enum Resource {
     // ... existing resources
     NEW_FEATURE = 'NEW_FEATURE',
   }

   export enum Action {
     // ... existing actions
     // 如需要新操作類型
   }

2. 配置權限矩陣
   在 rolePermissions 中添加配置

3. API端點使用權限中間件
   export async function GET(request: Request) {
     await requireRole(Role.VIEWER);
     await checkPermission(Resource.NEW_FEATURE, Action.READ);
     // ... 業務邏輯
   }

4. 前端使用權限檢查
   const { hasPermission } = useAuth();

   if (hasPermission(Resource.NEW_FEATURE, Action.CREATE)) {
     // 顯示創建按鈕
   }
```

### 第9步: 審計日誌整合

```markdown
審計日誌實施:

在關鍵操作添加審計日誌:

import { createAuditLog, AuditAction, AuditSeverity } from '@/lib/security/audit-log';

// 創建操作
await createAuditLog({
  action: AuditAction.CREATE,
  resource: 'new_feature',
  resourceId: newFeature.id,
  details: { name: newFeature.name },
  severity: AuditSeverity.INFO,
  userId: session.user.id,
  ipAddress: request.headers.get('x-forwarded-for'),
});

// 更新操作
await createAuditLog({
  action: AuditAction.UPDATE,
  resource: 'new_feature',
  resourceId: id,
  details: { changes: diff },
  severity: AuditSeverity.INFO,
  userId: session.user.id,
});

// 刪除操作
await createAuditLog({
  action: AuditAction.DELETE,
  resource: 'new_feature',
  resourceId: id,
  severity: AuditSeverity.WARNING,
  userId: session.user.id,
});
```

### 第10步: 測試實施

```markdown
測試策略:

1. 單元測試 (後端)
   __tests__/api/new-feature/route.test.ts
   - 測試每個API端點
   - 測試權限控制
   - 測試數據驗證
   - 測試錯誤處理

2. 單元測試 (前端)
   __tests__/components/new-feature/new-feature-form.test.tsx
   - 測試組件渲染
   - 測試用戶交互
   - 測試表單驗證
   - 測試錯誤狀態

3. E2E測試
   e2e/new-feature.spec.ts
   - 測試完整用戶流程
   - 測試CRUD操作
   - 測試權限控制
   - 測試錯誤場景

4. 執行測試
   npm run test
   npm run test:e2e

參考:
@__tests__/lib/security/
@e2e/audit-logs.spec.ts
```

### 第11步: 文檔更新

```markdown
文檔更新清單:

1. API文檔
   創建: docs/3-api-specs/api/new-feature-api.md
   - API端點列表
   - 請求/響應示例
   - 錯誤碼說明
   - 權限要求

2. 設計文檔
   創建: claudedocs/2-sprints/sprint-X/new-feature-design.md
   - 功能概述
   - 技術架構
   - 數據模型
   - 安全設計

3. 使用文檔
   更新相關的用戶指南或創建新的使用說明

4. 開發日誌
   更新: claudedocs/4-changes/DEVELOPMENT-LOG.md
   - 記錄功能開發過程
   - 記錄技術決策
   - 記錄遇到的挑戰和解決方案

5. 項目索引
   更新: claudedocs/6-ai-assistant/PROJECT-INDEX.md
   - 添加新文件索引
```

---

## 💡 開發最佳實踐

### 代碼組織

```
feature-driven 目錄結構:

src/features/new-feature/
├── api/              # API路由
├── components/       # React組件
├── hooks/            # 自定義hooks
├── types/            # TypeScript類型
├── utils/            # 工具函數
├── constants/        # 常量定義
└── __tests__/        # 測試文件
```

### 類型安全

```typescript
// 定義完整的TypeScript類型

// 1. 數據模型類型 (與Prisma schema對應)
export type NewFeature = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

// 2. API請求類型
export type CreateNewFeatureRequest = {
  name: string;
  description?: string;
};

// 3. API響應類型
export type NewFeatureResponse = {
  success: boolean;
  data?: NewFeature;
  error?: string;
};

// 4. 表單類型
export type NewFeatureFormData = {
  name: string;
  description: string;
};
```

### 錯誤處理

```typescript
// 統一的錯誤處理模式

try {
  // 業務邏輯
  const result = await createNewFeature(data);

  return NextResponse.json({
    success: true,
    data: result
  });
} catch (error) {
  // 記錄錯誤
  console.error('[NEW_FEATURE_API_ERROR]', error);

  // 審計日誌
  await createAuditLog({
    action: AuditAction.CREATE,
    resource: 'new_feature',
    severity: AuditSeverity.ERROR,
    details: { error: error.message },
    userId: session?.user?.id,
  });

  // 返回友好錯誤信息
  return NextResponse.json({
    success: false,
    error: error instanceof Error ? error.message : '創建失敗'
  }, { status: 500 });
}
```

### 性能優化

```typescript
// 1. 數據庫查詢優化
const features = await prisma.newFeature.findMany({
  where: { userId },
  select: {
    id: true,
    name: true,
    // 只選擇需要的字段
  },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});

// 2. 使用緩存 (如適用)
import { redis } from '@/lib/redis';

const cacheKey = `new-feature:${id}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await prisma.newFeature.findUnique({ where: { id } });
await redis.setex(cacheKey, 3600, JSON.stringify(data));

// 3. 前端優化
// 使用 React.memo 避免不必要的重渲染
export const NewFeatureCard = React.memo(({ feature }: Props) => {
  // ...
});
```

---

## 🧪 測試清單

### API測試

- [ ] GET /api/new-feature - 列表查詢
- [ ] GET /api/new-feature?filter=... - 篩選功能
- [ ] GET /api/new-feature?page=1&limit=20 - 分頁功能
- [ ] GET /api/new-feature/:id - 單個查詢
- [ ] POST /api/new-feature - 創建功能
- [ ] PATCH /api/new-feature/:id - 更新功能
- [ ] DELETE /api/new-feature/:id - 刪除功能
- [ ] 權限控制 - 各角色訪問測試
- [ ] 錯誤處理 - 各種錯誤場景

### UI測試

- [ ] 列表頁面渲染正確
- [ ] 創建表單驗證正確
- [ ] 編輯表單回填正確
- [ ] 刪除確認對話框
- [ ] 加載狀態顯示
- [ ] 錯誤信息顯示
- [ ] 空狀態處理
- [ ] 響應式設計
- [ ] 無障礙性

### E2E測試

- [ ] 完整CRUD流程
- [ ] 多用戶權限場景
- [ ] 錯誤處理流程
- [ ] 邊界條件測試

---

## ✅ 完成檢查

功能開發完成前,請確認:

- [ ] ✅ 所有todo項已完成
- [ ] ✅ 數據模型已設計並遷移
- [ ] ✅ API端點已實施並測試
- [ ] ✅ 前端組件已實施並測試
- [ ] ✅ RBAC權限已整合
- [ ] ✅ 審計日誌已整合
- [ ] ✅ 所有測試通過(單元+E2E)
- [ ] ✅ 代碼有完整中文註釋
- [ ] ✅ API文檔已創建
- [ ] ✅ 設計文檔已創建
- [ ] ✅ DEVELOPMENT-LOG.md 已更新
- [ ] ✅ PROJECT-INDEX.md 已更新
- [ ] ✅ 代碼審查完成
- [ ] ✅ 準備好提交到GitHub

---

## 🚀 下一步

功能開發完成後:

- **保存進度並同步**: 使用 `05-save-progress.md`

---

**創建日期**: 2025-10-08
**最後更新**: 2025-10-08
