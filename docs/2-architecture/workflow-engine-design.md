# 提案工作流程引擎設計文檔

> **創建時間**: 2025-10-01
> **作者**: Claude Code
> **Sprint**: Sprint 5 Week 9 - 提案生成工作流程
> **目標**: 設計完整的提案協作、審批和版本控制系統

---

## 🎯 設計目標

### 核心功能
1. **工作流程狀態機**: 提案從創建到發送的完整生命週期管理
2. **版本控制系統**: 追蹤提案的所有修改歷史，支援回溯和比較
3. **評論與反饋系統**: 段落級評論、@提及、回覆功能
4. **審批工作流程**: 單級/多級審批、並行審批、條件審批

### 設計原則
- ✅ **模組化**: 各功能獨立可測試
- ✅ **可擴展性**: 支援未來新增狀態和規則
- ✅ **性能優化**: 批次操作、緩存策略
- ✅ **審計追蹤**: 完整記錄所有狀態變更
- ✅ **TypeScript 類型安全**: 完整的類型定義

---

## 📊 工作流程狀態機設計

### 狀態定義

基於現有的 `ProposalStatus` 枚舉，擴展完整的工作流程：

```typescript
enum ProposalStatus {
  // 現有狀態
  DRAFT           // 草稿 - 初始狀態
  SENT            // 已發送 - 發送給客戶
  VIEWED          // 已查看 - 客戶已查看
  UNDER_REVIEW    // 審核中 - 內部審核
  APPROVED        // 已批准 - 審核通過
  REJECTED        // 已拒絕 - 審核未通過
  EXPIRED         // 已過期 - 超過有效期

  // 新增狀態（需要）
  PENDING_APPROVAL  // 待審批 - 提交等待審批
  REVISING          // 修訂中 - 根據反饋修改
  WITHDRAWN         // 已撤回 - 主動撤回
}
```

### 狀態轉換規則

```typescript
/**
 * 工作流程狀態轉換映射表
 *
 * 格式: 當前狀態 -> 允許轉換的狀態數組
 */
const STATE_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  // 草稿階段
  DRAFT: [
    'PENDING_APPROVAL',  // 提交審批
    'WITHDRAWN',         // 撤回（刪除）
  ],

  // 審批階段
  PENDING_APPROVAL: [
    'UNDER_REVIEW',      // 進入審核
    'APPROVED',          // 直接批准（單級審批）
    'REJECTED',          // 拒絕
    'REVISING',          // 要求修訂
    'DRAFT',             // 退回草稿
  ],

  UNDER_REVIEW: [
    'APPROVED',          // 批准
    'REJECTED',          // 拒絕
    'REVISING',          // 要求修訂
    'PENDING_APPROVAL',  // 重新提交
  ],

  // 修訂階段
  REVISING: [
    'PENDING_APPROVAL',  // 修訂完成，重新提交
    'DRAFT',             // 退回草稿
    'WITHDRAWN',         // 撤回
  ],

  // 批准後
  APPROVED: [
    'SENT',              // 發送給客戶
    'EXPIRED',           // 過期
  ],

  // 發送後
  SENT: [
    'VIEWED',            // 客戶查看
    'EXPIRED',           // 過期
    'WITHDRAWN',         // 撤回
  ],

  VIEWED: [
    'EXPIRED',           // 過期
  ],

  // 終止狀態
  REJECTED: [],          // 已拒絕 - 終止
  EXPIRED: [],           // 已過期 - 終止
  WITHDRAWN: [],         // 已撤回 - 終止
};
```

### 狀態轉換權限

```typescript
/**
 * 角色權限定義
 */
enum UserRole {
  SALES_REP = 'sales_rep',        // 銷售代表
  SALES_MANAGER = 'sales_manager', // 銷售經理
  ADMIN = 'admin',                 // 系統管理員
  VIEWER = 'viewer',               // 只讀用戶
}

/**
 * 狀態轉換權限映射
 *
 * 格式: 轉換動作 -> 允許的角色數組
 */
const TRANSITION_PERMISSIONS: Record<string, UserRole[]> = {
  // 提交審批
  'DRAFT->PENDING_APPROVAL': ['sales_rep', 'sales_manager', 'admin'],

  // 審核操作（僅經理和管理員）
  'PENDING_APPROVAL->APPROVED': ['sales_manager', 'admin'],
  'PENDING_APPROVAL->REJECTED': ['sales_manager', 'admin'],
  'PENDING_APPROVAL->REVISING': ['sales_manager', 'admin'],
  'UNDER_REVIEW->APPROVED': ['sales_manager', 'admin'],
  'UNDER_REVIEW->REJECTED': ['sales_manager', 'admin'],

  // 發送給客戶（僅批准後）
  'APPROVED->SENT': ['sales_rep', 'sales_manager', 'admin'],

  // 撤回操作
  'DRAFT->WITHDRAWN': ['sales_rep', 'sales_manager', 'admin'],
  'SENT->WITHDRAWN': ['sales_manager', 'admin'], // 僅經理可撤回已發送
};
```

---

## 🗂️ 數據模型設計

### 1. ProposalVersion (提案版本)

```prisma
model ProposalVersion {
  id           String   @id @default(cuid())
  proposal_id  Int                              // 關聯的提案ID
  version      Int                              // 版本號（從1開始）

  // 版本內容快照
  title        String
  description  String?
  content      Json                             // 提案完整內容（JSON格式）
  total_value  Decimal?  @db.Decimal(15, 2)
  items        Json?                            // 提案項目快照

  // 變更追蹤
  change_summary String?                        // 變更摘要
  changed_fields Json?                          // 變更欄位詳情
  parent_version Int?                           // 父版本號

  // 創建信息
  created_by   Int                              // 版本創建者
  created_at   DateTime @default(now())
  is_major     Boolean  @default(false)         // 是否為主要版本
  tags         String[]                         // 版本標籤 (如: "pre-approval", "final")

  // 關聯關係
  proposal     Proposal @relation(fields: [proposal_id], references: [id], onDelete: Cascade)
  creator      User     @relation("VersionCreator", fields: [created_by], references: [id])
  comments     ProposalComment[]                // 此版本的評論

  @@map("proposal_versions")
  @@unique([proposal_id, version], name: "UK_Proposal_Version")
  @@index([proposal_id, created_at(sort: Desc)], name: "IX_Version_Proposal_Date")
  @@index([created_by], name: "IX_Version_Creator")
}
```

### 2. ProposalComment (提案評論)

```prisma
model ProposalComment {
  id               String    @id @default(cuid())
  proposal_id      Int                          // 關聯的提案ID
  version_id       String?                      // 關聯的版本ID（可選）
  parent_id        String?                      // 父評論ID（支援回覆）

  // 評論內容
  content          String                       // 評論內容
  content_type     CommentType @default(TEXT)   // 內容類型（文字/富文本）

  // 段落定位
  section_id       String?                      // 段落/區塊ID
  quote_text       String?                      // 引用文字
  position_start   Int?                         // 起始位置
  position_end     Int?                         // 結束位置

  // 狀態管理
  status           CommentStatus @default(OPEN)
  resolved_by      Int?                         // 解決者ID
  resolved_at      DateTime?                    // 解決時間

  // 提及功能
  mentions         Int[]                        // 被@提及的用戶ID數組

  // 創建信息
  created_by       Int
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  // 關聯關係
  proposal         Proposal        @relation(fields: [proposal_id], references: [id], onDelete: Cascade)
  version          ProposalVersion? @relation(fields: [version_id], references: [id])
  creator          User            @relation("CommentCreator", fields: [created_by], references: [id])
  resolver         User?           @relation("CommentResolver", fields: [resolved_by], references: [id])
  parent           ProposalComment? @relation("CommentReplies", fields: [parent_id], references: [id])
  replies          ProposalComment[] @relation("CommentReplies")
  mentioned_users  User[]          @relation("CommentMentions")

  @@map("proposal_comments")
  @@index([proposal_id, status], name: "IX_Comment_Proposal_Status")
  @@index([version_id], name: "IX_Comment_Version")
  @@index([created_by, created_at(sort: Desc)], name: "IX_Comment_Creator_Date")
  @@index([parent_id], name: "IX_Comment_Parent")
}

enum CommentType {
  TEXT          // 純文字
  RICH_TEXT     // 富文本（支援格式化）
}

enum CommentStatus {
  OPEN          // 待處理
  RESOLVED      // 已解決
  ARCHIVED      // 已歸檔
}
```

### 3. ProposalWorkflow (工作流程實例)

```prisma
model ProposalWorkflow {
  id               String    @id @default(cuid())
  proposal_id      Int       @unique               // 關聯的提案ID（一對一）
  workflow_type    WorkflowType @default(STANDARD) // 工作流程類型

  // 當前狀態
  current_state    ProposalStatus                 // 當前狀態
  previous_state   ProposalStatus?                // 前一個狀態

  // 審批配置
  approval_config  Json?                          // 審批規則配置
  required_approvers Int[]                        // 必要審批者ID
  optional_approvers Int[]                        // 可選審批者ID
  min_approvals    Int       @default(1)         // 最少審批數

  // 狀態追蹤
  started_at       DateTime  @default(now())
  completed_at     DateTime?
  is_active        Boolean   @default(true)

  // 關聯關係
  proposal         Proposal  @relation(fields: [proposal_id], references: [id], onDelete: Cascade)
  state_history    WorkflowStateHistory[]
  approval_tasks   ApprovalTask[]

  @@map("proposal_workflows")
  @@index([current_state, is_active], name: "IX_Workflow_State_Active")
  @@index([proposal_id], name: "IX_Workflow_Proposal")
}

enum WorkflowType {
  STANDARD      // 標準流程（草稿→審批→發送）
  FAST_TRACK    // 快速流程（跳過審批）
  CUSTOM        // 自定義流程
}
```

### 4. WorkflowStateHistory (狀態歷史)

```prisma
model WorkflowStateHistory {
  id              String    @id @default(cuid())
  workflow_id     String                          // 關聯的工作流程ID

  // 狀態變更
  from_state      ProposalStatus?                 // 起始狀態
  to_state        ProposalStatus                  // 目標狀態
  transition_type String                          // 轉換類型（submit, approve, reject, etc.）

  // 變更原因
  reason          String?                         // 變更原因
  comment         String?                         // 備註說明
  metadata        Json?                           // 額外元數據

  // 執行信息
  triggered_by    Int                             // 觸發者ID
  triggered_at    DateTime @default(now())
  auto_triggered  Boolean  @default(false)        // 是否自動觸發

  // 關聯關係
  workflow        ProposalWorkflow @relation(fields: [workflow_id], references: [id], onDelete: Cascade)
  trigger_user    User             @relation("WorkflowTrigger", fields: [triggered_by], references: [id])

  @@map("workflow_state_history")
  @@index([workflow_id, triggered_at(sort: Desc)], name: "IX_History_Workflow_Date")
  @@index([to_state, triggered_at], name: "IX_History_State_Date")
}
```

### 5. ApprovalTask (審批任務)

```prisma
model ApprovalTask {
  id              String       @id @default(cuid())
  workflow_id     String                           // 關聯的工作流程ID
  proposal_id     Int                              // 關聯的提案ID

  // 審批信息
  approver_id     Int                              // 審批者ID
  role            String?                          // 審批者角色
  sequence        Int          @default(1)         // 審批順序（支援多級）
  is_required     Boolean      @default(true)      // 是否必須

  // 任務狀態
  status          ApprovalStatus @default(PENDING)
  decision        ApprovalDecision?                // 審批決定
  comments        String?                          // 審批意見

  // 時間追蹤
  assigned_at     DateTime     @default(now())
  due_at          DateTime?                        // 截止時間
  completed_at    DateTime?                        // 完成時間
  reminded_at     DateTime?                        // 最後提醒時間

  // 委派功能
  delegated_to    Int?                             // 委派給誰
  delegated_at    DateTime?                        // 委派時間
  delegation_reason String?                        // 委派原因

  // 關聯關係
  workflow        ProposalWorkflow @relation(fields: [workflow_id], references: [id], onDelete: Cascade)
  proposal        Proposal     @relation(fields: [proposal_id], references: [id], onDelete: Cascade)
  approver        User         @relation("TaskApprover", fields: [approver_id], references: [id])
  delegate        User?        @relation("TaskDelegate", fields: [delegated_to], references: [id])

  @@map("approval_tasks")
  @@index([workflow_id, status], name: "IX_Task_Workflow_Status")
  @@index([approver_id, status], name: "IX_Task_Approver_Status")
  @@index([due_at], name: "IX_Task_Due")
  @@index([proposal_id, sequence], name: "IX_Task_Proposal_Sequence")
}

enum ApprovalStatus {
  PENDING       // 待處理
  IN_PROGRESS   // 處理中
  COMPLETED     // 已完成
  SKIPPED       // 已跳過
  EXPIRED       // 已過期
}

enum ApprovalDecision {
  APPROVED      // 批准
  REJECTED      // 拒絕
  REQUEST_REVISION  // 要求修訂
  DELEGATED     // 已委派
}
```

---

## 🔧 核心功能模組

### 1. WorkflowEngine (工作流程引擎)

```typescript
/**
 * 工作流程引擎核心類
 *
 * 職責：
 * - 管理提案狀態轉換
 * - 驗證轉換規則
 * - 觸發相關事件
 * - 記錄狀態歷史
 */
class WorkflowEngine {
  /**
   * 轉換提案狀態
   *
   * @param proposalId - 提案ID
   * @param targetState - 目標狀態
   * @param userId - 執行用戶ID
   * @param options - 轉換選項（原因、評論等）
   */
  async transitionState(
    proposalId: number,
    targetState: ProposalStatus,
    userId: number,
    options?: TransitionOptions
  ): Promise<WorkflowResult>

  /**
   * 驗證狀態轉換是否允許
   *
   * @param currentState - 當前狀態
   * @param targetState - 目標狀態
   * @param userId - 用戶ID
   */
  async validateTransition(
    currentState: ProposalStatus,
    targetState: ProposalStatus,
    userId: number
  ): Promise<ValidationResult>

  /**
   * 獲取可用的下一步狀態
   *
   * @param proposalId - 提案ID
   * @param userId - 用戶ID
   */
  async getAvailableTransitions(
    proposalId: number,
    userId: number
  ): Promise<ProposalStatus[]>

  /**
   * 執行自動轉換（定時任務）
   * 例如：過期自動標記為 EXPIRED
   */
  async executeAutoTransitions(): Promise<void>
}
```

### 2. VersionControl (版本控制)

```typescript
/**
 * 版本控制系統
 *
 * 職責：
 * - 創建版本快照
 * - 比較版本差異
 * - 回溯到歷史版本
 */
class VersionControl {
  /**
   * 創建新版本
   *
   * @param proposalId - 提案ID
   * @param userId - 用戶ID
   * @param changeSummary - 變更摘要
   */
  async createVersion(
    proposalId: number,
    userId: number,
    changeSummary?: string
  ): Promise<ProposalVersion>

  /**
   * 比較兩個版本
   *
   * @param versionId1 - 版本1 ID
   * @param versionId2 - 版本2 ID
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<VersionDiff>

  /**
   * 回溯到指定版本
   *
   * @param proposalId - 提案ID
   * @param versionId - 版本ID
   * @param userId - 用戶ID
   */
  async revertToVersion(
    proposalId: number,
    versionId: string,
    userId: number
  ): Promise<Proposal>

  /**
   * 獲取版本歷史
   *
   * @param proposalId - 提案ID
   */
  async getVersionHistory(
    proposalId: number
  ): Promise<ProposalVersion[]>
}
```

### 3. CommentSystem (評論系統)

```typescript
/**
 * 評論與反饋系統
 *
 * 職責：
 * - 創建段落級評論
 * - 處理@提及通知
 * - 管理評論狀態
 */
class CommentSystem {
  /**
   * 創建評論
   *
   * @param proposalId - 提案ID
   * @param userId - 用戶ID
   * @param content - 評論內容
   * @param options - 評論選項（段落定位、提及等）
   */
  async createComment(
    proposalId: number,
    userId: number,
    content: string,
    options?: CommentOptions
  ): Promise<ProposalComment>

  /**
   * 回覆評論
   *
   * @param commentId - 父評論ID
   * @param userId - 用戶ID
   * @param content - 回覆內容
   */
  async replyToComment(
    commentId: string,
    userId: number,
    content: string
  ): Promise<ProposalComment>

  /**
   * 解決評論
   *
   * @param commentId - 評論ID
   * @param userId - 用戶ID
   */
  async resolveComment(
    commentId: string,
    userId: number
  ): Promise<void>

  /**
   * 處理@提及通知
   *
   * @param comment - 評論對象
   */
  private async processMentions(
    comment: ProposalComment
  ): Promise<void>
}
```

### 4. ApprovalManager (審批管理)

```typescript
/**
 * 審批工作流程管理器
 *
 * 職責：
 * - 創建審批任務
 * - 處理審批決定
 * - 管理審批流程
 */
class ApprovalManager {
  /**
   * 創建審批工作流程
   *
   * @param proposalId - 提案ID
   * @param config - 審批配置
   */
  async createApprovalWorkflow(
    proposalId: number,
    config: ApprovalConfig
  ): Promise<ProposalWorkflow>

  /**
   * 提交審批決定
   *
   * @param taskId - 審批任務ID
   * @param userId - 審批者ID
   * @param decision - 審批決定
   * @param comments - 審批意見
   */
  async submitApproval(
    taskId: string,
    userId: number,
    decision: ApprovalDecision,
    comments?: string
  ): Promise<ApprovalTask>

  /**
   * 委派審批任務
   *
   * @param taskId - 審批任務ID
   * @param fromUserId - 委派者ID
   * @param toUserId - 被委派者ID
   * @param reason - 委派原因
   */
  async delegateApproval(
    taskId: string,
    fromUserId: number,
    toUserId: number,
    reason?: string
  ): Promise<ApprovalTask>

  /**
   * 檢查審批流程是否完成
   *
   * @param workflowId - 工作流程ID
   */
  async checkApprovalCompletion(
    workflowId: string
  ): Promise<ApprovalResult>

  /**
   * 發送審批提醒
   *
   * @param taskId - 審批任務ID
   */
  async sendApprovalReminder(
    taskId: string
  ): Promise<void>
}
```

---

## 🔔 事件系統

### 工作流程事件

```typescript
/**
 * 工作流程事件類型
 */
enum WorkflowEvent {
  // 狀態變更事件
  STATE_CHANGED = 'workflow.state.changed',

  // 版本事件
  VERSION_CREATED = 'workflow.version.created',
  VERSION_REVERTED = 'workflow.version.reverted',

  // 評論事件
  COMMENT_CREATED = 'workflow.comment.created',
  COMMENT_REPLIED = 'workflow.comment.replied',
  COMMENT_RESOLVED = 'workflow.comment.resolved',
  MENTION_CREATED = 'workflow.mention.created',

  // 審批事件
  APPROVAL_REQUESTED = 'workflow.approval.requested',
  APPROVAL_SUBMITTED = 'workflow.approval.submitted',
  APPROVAL_DELEGATED = 'workflow.approval.delegated',
  APPROVAL_COMPLETED = 'workflow.approval.completed',
  APPROVAL_EXPIRED = 'workflow.approval.expired',
}

/**
 * 事件處理器接口
 */
interface WorkflowEventHandler {
  onStateChanged(event: StateChangedEvent): Promise<void>;
  onVersionCreated(event: VersionCreatedEvent): Promise<void>;
  onCommentCreated(event: CommentCreatedEvent): Promise<void>;
  onApprovalRequested(event: ApprovalRequestedEvent): Promise<void>;
  // ... 其他事件處理器
}
```

### 通知系統整合

```typescript
/**
 * 工作流程通知配置
 */
const NOTIFICATION_RULES = {
  // 狀態變更通知
  STATE_CHANGED: {
    recipients: ['proposal.owner', 'proposal.team'],
    channels: ['email', 'in_app'],
    template: 'proposal_state_changed',
  },

  // @提及通知
  MENTION_CREATED: {
    recipients: ['mentioned.users'],
    channels: ['email', 'in_app', 'push'],
    template: 'user_mentioned',
    priority: 'high',
  },

  // 審批請求通知
  APPROVAL_REQUESTED: {
    recipients: ['approver'],
    channels: ['email', 'in_app'],
    template: 'approval_requested',
    priority: 'high',
  },

  // 審批提醒（1天前）
  APPROVAL_REMINDER: {
    recipients: ['approver'],
    channels: ['email'],
    template: 'approval_reminder',
    schedule: 'daily',
  },
};
```

---

## 🧪 測試策略

### 單元測試

```typescript
describe('WorkflowEngine', () => {
  describe('transitionState', () => {
    it('應該允許從 DRAFT 轉換到 PENDING_APPROVAL')
    it('應該拒絕無效的狀態轉換')
    it('應該驗證用戶權限')
    it('應該記錄狀態歷史')
  });

  describe('validateTransition', () => {
    it('應該正確驗證狀態轉換規則')
    it('應該檢查用戶角色權限')
  });
});

describe('VersionControl', () => {
  describe('createVersion', () => {
    it('應該創建版本快照')
    it('應該正確追蹤變更欄位')
    it('應該自動遞增版本號')
  });

  describe('compareVersions', () => {
    it('應該正確比較兩個版本的差異')
    it('應該識別新增、修改、刪除的內容')
  });
});

describe('CommentSystem', () => {
  describe('createComment', () => {
    it('應該創建段落級評論')
    it('應該處理@提及通知')
    it('應該支援評論回覆')
  });
});

describe('ApprovalManager', () => {
  describe('createApprovalWorkflow', () => {
    it('應該創建單級審批流程')
    it('應該創建多級審批流程')
    it('應該支援並行審批')
  });

  describe('submitApproval', () => {
    it('應該記錄審批決定')
    it('應該自動進行狀態轉換')
    it('應該發送通知給相關人員')
  });
});
```

### 整合測試

```typescript
describe('Workflow Integration', () => {
  it('應該完成完整的提案工作流程（草稿→審批→發送）')
  it('應該處理審批拒絕並要求修訂的流程')
  it('應該支援多級審批流程')
  it('應該正確處理審批委派')
  it('應該在狀態變更時發送通知')
});
```

---

## 📈 性能優化

### 緩存策略

```typescript
/**
 * 工作流程緩存配置
 */
const CACHE_CONFIG = {
  // 狀態轉換規則緩存（靜態，長期緩存）
  stateTransitions: {
    ttl: 3600 * 24,  // 24小時
    key: 'workflow:transitions',
  },

  // 當前工作流程狀態（動態，短期緩存）
  workflowState: {
    ttl: 300,  // 5分鐘
    key: (proposalId) => `workflow:state:${proposalId}`,
  },

  // 審批任務列表
  approvalTasks: {
    ttl: 600,  // 10分鐘
    key: (userId) => `workflow:tasks:${userId}`,
  },
};
```

### 批次操作

```typescript
/**
 * 批次創建版本（提升性能）
 */
async function batchCreateVersions(
  proposals: number[],
  userId: number
): Promise<ProposalVersion[]> {
  // 批次讀取提案
  const proposalData = await prisma.proposal.findMany({
    where: { id: { in: proposals } },
    include: { items: true },
  });

  // 批次創建版本
  return await prisma.proposalVersion.createMany({
    data: proposalData.map(p => ({
      proposal_id: p.id,
      version: p.version + 1,
      // ... 其他欄位
    })),
  });
}
```

---

## 🔐 安全考量

### 權限驗證

```typescript
/**
 * 工作流程操作權限檢查
 */
class WorkflowAuthorization {
  /**
   * 檢查狀態轉換權限
   */
  async canTransitionState(
    userId: number,
    proposalId: number,
    targetState: ProposalStatus
  ): Promise<boolean> {
    // 1. 檢查用戶角色
    const userRole = await this.getUserRole(userId);

    // 2. 檢查提案所有權
    const proposal = await this.getProposal(proposalId);
    if (proposal.user_id === userId) {
      // 提案所有者有特定權限
    }

    // 3. 檢查轉換權限映射
    const transitionKey = `${proposal.status}->${targetState}`;
    const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

    return allowedRoles.includes(userRole);
  }

  /**
   * 檢查審批權限
   */
  async canApprove(
    userId: number,
    taskId: string
  ): Promise<boolean> {
    const task = await this.getApprovalTask(taskId);

    // 只有被指定的審批者或其委派人可審批
    return task.approver_id === userId || task.delegated_to === userId;
  }
}
```

### 審計追蹤

```typescript
/**
 * 完整的審計日誌記錄
 */
async function logWorkflowAction(
  action: WorkflowAction,
  userId: number,
  metadata: Record<string, any>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entity_type: 'proposal_workflow',
      entity_id: metadata.proposalId,
      action,
      user_id: userId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
      },
    },
  });
}
```

---

## 🚀 實施計劃

### Phase 1: 核心工作流程 (Week 9 Day 1-3)
- ✅ 設計並實現 Prisma schema
- ✅ 實現 WorkflowEngine 核心類
- ✅ 實現狀態轉換規則和驗證
- ✅ 編寫單元測試

### Phase 2: 版本控制 (Week 9 Day 3-4)
- ✅ 實現 VersionControl 類
- ✅ 版本快照和比較功能
- ✅ 編寫單元測試

### Phase 3: 評論系統 (Week 9 Day 4-5)
- ✅ 實現 CommentSystem 類
- ✅ 段落級評論和@提及
- ✅ 編寫單元測試

### Phase 4: 審批流程 (Week 9 Day 5-7)
- ✅ 實現 ApprovalManager 類
- ✅ 單級/多級審批邏輯
- ✅ 編寫整合測試

### Phase 5: 整合與測試 (Week 10 Day 1-2)
- ✅ 系統整合測試
- ✅ 性能優化
- ✅ 文檔更新

---

## 📚 參考文檔

- [MVP Phase 2 實施清單](./mvp2-implementation-checklist.md)
- [Prisma Schema 設計](../prisma/schema.prisma)
- [API 規格文檔](./api-specification.md)
- [測試策略](./testing-strategy.md)

---

**🎯 下一步**: 開始實施 Prisma schema 擴展
