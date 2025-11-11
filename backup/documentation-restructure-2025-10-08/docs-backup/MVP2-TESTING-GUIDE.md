# 🧪 MVP Phase 2 測試與驗證指南

> **目的**: 提供詳細的測試方法來驗證 MVP Phase 2 已實施的底層功能
> **最後更新**: 2025-10-01
> **涵蓋**: Sprint 1, Sprint 2, Sprint 4, Sprint 5

---

## 📋 目錄

1. [Sprint 1: API 網關與安全層測試](#sprint-1-api-網關與安全層測試)
2. [Sprint 2: 監控告警系統測試](#sprint-2-監控告警系統測試)
3. [Sprint 4: 性能優化測試](#sprint-4-性能優化測試)
4. [Sprint 5: 工作流程引擎測試](#sprint-5-工作流程引擎測試)

---

## Sprint 1: API 網關與安全層測試

### 🎯 功能概述
Sprint 1 實現了 8 個核心中間件系統：
- Security Headers (安全頭部)
- CORS (跨域資源共享)
- Route Matcher (路由匹配)
- Request ID (請求追蹤)
- Rate Limiter (速率限制)
- API Versioning (API 版本控制)
- Request Validator (請求驗證)
- Response Transformer (響應轉換)

### 📊 測試方法

#### 1. **單元測試執行**

```bash
# 執行所有中間件測試
npm test -- __tests__/lib/middleware/

# 執行特定中間件測試
npm test -- __tests__/lib/middleware/security-headers.test.ts
npm test -- __tests__/lib/middleware/rate-limiter.test.ts
npm test -- __tests__/lib/middleware/cors.test.ts
```

**預期結果**: 296 個測試全部通過
```
Test Suites: 10 passed, 10 total
Tests:       296 passed, 296 total
```

#### 2. **Security Headers (安全頭部) 驗證**

```bash
# 測試安全頭部是否正確設置
curl -I http://localhost:3000/api/health

# 應該看到以下頭部：
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

**在瀏覽器中驗證**:
1. 打開開發者工具 (F12)
2. 訪問 http://localhost:3000
3. 查看 Network 標籤
4. 檢查任何請求的 Response Headers
5. 確認安全頭部存在

#### 3. **CORS (跨域) 驗證**

```bash
# 測試 CORS 預檢請求
curl -X OPTIONS http://localhost:3000/api/health \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -I

# 應該看到：
# Access-Control-Allow-Origin: http://localhost:3001
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH
```

**在瀏覽器中驗證**:
1. 打開不同端口的應用（如 http://localhost:3001）
2. 嘗試調用 API
3. 檢查 Console 是否有 CORS 錯誤

#### 4. **Rate Limiter (速率限制) 驗證**

```bash
# 快速發送多個請求測試速率限制
for i in {1..15}; do
  curl -s http://localhost:3000/api/health -w "Request $i: %{http_code}\n"
  sleep 0.1
done

# 前 10 個請求應該返回 200
# 之後的請求應該返回 429 (Too Many Requests)
```

**檢查速率限制頭部**:
```bash
curl -I http://localhost:3000/api/health

# 應該看到：
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: <timestamp>
```

#### 5. **Request ID (請求追蹤) 驗證**

```bash
# 檢查每個請求是否有唯一 ID
curl -I http://localhost:3000/api/health

# 應該看到：
# X-Request-ID: <UUID>
```

**在日誌中驗證**:
1. 查看開發服務器日誌
2. 每個請求應該有唯一的 Request ID
3. 可以用 Request ID 追蹤整個請求生命週期

#### 6. **Request Validator (請求驗證) 驗證**

```bash
# 測試無效的 JSON 請求
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "invalid json"

# 應該返回 400 錯誤和詳細驗證訊息
```

```bash
# 測試 SQL 注入防護
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com OR 1=1","password":"test"}'

# 應該被驗證中間件攔截
```

#### 7. **API Versioning (版本控制) 驗證**

```bash
# 測試 API v1 端點
curl http://localhost:3000/api/v1/health

# 測試 API v2 端點
curl http://localhost:3000/api/v2/health

# 測試版本協商
curl -H "Accept-Version: 2" http://localhost:3000/api/health
```

#### 8. **Response Transformer (響應轉換) 驗證**

```bash
# 測試統一響應格式
curl http://localhost:3000/api/health

# 應該返回標準格式：
# {
#   "success": true,
#   "data": {...},
#   "metadata": {
#     "timestamp": "...",
#     "requestId": "..."
#   }
# }
```

---

## Sprint 2: 監控告警系統測試

### 🎯 功能概述
Sprint 2 實現了企業級監控系統：
- OpenTelemetry 零遷移成本架構
- Prometheus + Grafana 監控棧
- 4 個 Grafana 儀表板
- 46 個告警規則
- 完整可觀測性 (Metrics + Traces + Logs)

### 📊 測試方法

#### 1. **健康檢查系統驗證**

```bash
# 檢查系統健康狀態
curl http://localhost:3000/api/health

# 應該返回：
# {
#   "success": true,
#   "data": {
#     "status": "HEALTHY",
#     "healthy": true,
#     "summary": {
#       "total": 5,
#       "healthy": 5,
#       "degraded": 0,
#       "down": 0
#     }
#   }
# }
```

#### 2. **監控系統初始化驗證**

```bash
# 檢查監控系統狀態
curl http://localhost:3000/api/monitoring/init

# 啟動監控系統
curl -X POST http://localhost:3000/api/monitoring/init \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'

# 停止監控系統
curl -X POST http://localhost:3000/api/monitoring/init \
  -H "Content-Type: application/json" \
  -d '{"action":"stop"}'

# 重啟監控系統
curl -X POST http://localhost:3000/api/monitoring/init \
  -H "Content-Type: application/json" \
  -d '{"action":"restart"}'
```

#### 3. **服務健康檢查腳本**

```bash
# 執行完整的健康檢查
npm run services:health-check

# 應該顯示所有 5 個服務的狀態：
# ✅ Database: HEALTHY
# ✅ Azure OpenAI: HEALTHY
# ✅ Dynamics 365: HEALTHY
# ✅ Redis: HEALTHY
# ✅ Storage: HEALTHY
```

#### 4. **監控指標收集驗證**

**檢查開發服務器日誌**:
- 監控系統啟動訊息
- 服務狀態變更日誌
- 健康檢查執行日誌

```bash
# 查看實時日誌
npm run dev

# 應該看到：
# 🔄 執行快速健康檢查以更新狀態...
# 🔄 服務狀態變更: DATABASE UNKNOWN → HEALTHY
# 🔄 服務狀態變更: REDIS UNKNOWN → HEALTHY
```

#### 5. **連接監控驗證**

**查看代碼中的監控實現**:
```bash
# 查看連接監控器
cat lib/monitoring/connection-monitor.ts

# 查看監控初始化器
cat lib/startup/monitoring-initializer.ts
```

**功能驗證**:
- 自動服務發現
- 健康狀態追蹤
- 快速健康檢查（緩存優化）
- 服務狀態變更通知

---

## Sprint 4: 性能優化測試

### 🎯 功能概述
Sprint 4 實現了 6 個性能優化功能：
- API 響應緩存 (ETag + Cache-Control)
- DataLoader 查詢優化 (防 N+1)
- 性能監控系統 (8 種指標)
- 熔斷器模式 (3-state)
- 健康檢查系統 (依賴管理)
- 智能重試策略 (4 種退避算法)

### 📊 測試方法

#### 1. **性能測試套件執行**

```bash
# 執行所有性能測試
npm test -- __tests__/lib/performance/

# 執行特定測試
npm test -- __tests__/lib/performance/cache.test.ts
npm test -- __tests__/lib/performance/dataloader.test.ts
npm test -- __tests__/lib/performance/monitor.test.ts
npm test -- __tests__/lib/performance/circuit-breaker.test.ts
npm test -- __tests__/lib/performance/health-check.test.ts
npm test -- __tests__/lib/performance/retry.test.ts
```

**預期結果**: 198 個測試全部通過

#### 2. **API 響應緩存驗證**

```bash
# 第一次請求 (無緩存)
curl -I http://localhost:3000/api/health

# 應該看到：
# Cache-Control: public, max-age=60
# ETag: "<hash>"

# 第二次請求 (使用 ETag)
curl -I http://localhost:3000/api/health \
  -H "If-None-Match: <hash>"

# 應該返回 304 Not Modified
```

**性能比較**:
```bash
# 測試緩存性能
time curl http://localhost:3000/api/health  # 第一次
time curl http://localhost:3000/api/health  # 第二次（應該更快）
```

#### 3. **DataLoader (N+1 查詢優化) 驗證**

**查看代碼實現**:
```bash
cat lib/performance/dataloader.ts
```

**測試批次載入**:
```typescript
// 在測試中驗證
const loader = createUserLoader()
const [user1, user2] = await Promise.all([
  loader.load(1),
  loader.load(2)
])
// 只執行一次資料庫查詢，而非兩次
```

#### 4. **性能監控系統驗證**

```bash
# 檢查性能監控代碼
cat lib/performance/monitor.ts
```

**8 種監控指標**:
1. 請求總數
2. 響應時間
3. 錯誤率
4. 數據庫查詢時間
5. 緩存命中率
6. API 端點性能
7. 資源使用率
8. 並發連接數

**在應用中使用**:
```typescript
import { recordMetric } from '@/lib/performance/monitor'

// 記錄 API 請求
recordMetric('api.request', 1, { endpoint: '/api/health' })

// 記錄響應時間
recordMetric('api.response_time', 150, { endpoint: '/api/health' })
```

#### 5. **熔斷器模式驗證**

```bash
# 查看熔斷器實現
cat lib/performance/circuit-breaker.ts
```

**測試熔斷器**:
```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
})

// 模擬失敗請求
for (let i = 0; i < 6; i++) {
  await breaker.execute(() => Promise.reject('Error'))
}

// 熔斷器應該打開，拒絕新請求
await breaker.execute(() => Promise.resolve('OK'))
// 應該立即失敗，不執行請求
```

#### 6. **健康檢查系統驗證**

```bash
# 執行健康檢查腳本
npm run services:health-check

# 或使用 API
curl http://localhost:3000/api/health
```

**驗證依賴管理**:
- Database 依賴檢查
- Redis 依賴檢查
- Azure OpenAI 依賴檢查
- Dynamics 365 依賴檢查
- Storage 依賴檢查

#### 7. **智能重試策略驗證**

```bash
# 查看重試策略實現
cat lib/performance/retry.ts
```

**4 種退避算法**:
1. **Exponential Backoff** (指數退避)
2. **Linear Backoff** (線性退避)
3. **Fixed Delay** (固定延遲)
4. **Jittered Backoff** (抖動退避)

**測試重試邏輯**:
```typescript
import { withRetry } from '@/lib/performance/retry'

const result = await withRetry(
  () => unstableApiCall(),
  {
    maxAttempts: 3,
    strategy: 'exponential',
    initialDelay: 1000
  }
)
```

---

## Sprint 5: 工作流程引擎測試

### 🎯 功能概述
Sprint 5 實現了提案工作流程引擎：
- 狀態機引擎 (12 狀態, 30+ 轉換)
- 版本控制系統 (快照/差異/回滾)
- 評論系統 (@mentions, 樹狀結構)
- 審批管理器 (多級審批)

### 📊 測試方法

#### 1. **數據庫 Schema 驗證**

```bash
# 查看 Prisma schema
cat prisma/schema.prisma | grep -A 50 "model ProposalWorkflow"
cat prisma/schema.prisma | grep -A 30 "model ProposalVersion"
cat prisma/schema.prisma | grep -A 30 "model ProposalComment"
cat prisma/schema.prisma | grep -A 30 "model ProposalApproval"
```

**驗證 5 個數據模型**:
1. ProposalWorkflow
2. ProposalVersion
3. ProposalComment
4. ProposalApproval
5. ProposalStateHistory

#### 2. **工作流程引擎驗證**

```bash
# 查看狀態機實現
cat lib/workflow/state-machine.ts
```

**12 個工作流程狀態**:
- DRAFT (草稿)
- PENDING_REVIEW (待審核)
- IN_REVIEW (審核中)
- REVISION_NEEDED (需修訂)
- APPROVED (已批准)
- REJECTED (已拒絕)
- FINALIZED (已定稿)
- SENT (已發送)
- ACCEPTED (已接受)
- DECLINED (已拒絕)
- EXPIRED (已過期)
- ARCHIVED (已歸檔)

**測試狀態轉換**:
```typescript
import { ProposalStateMachine } from '@/lib/workflow/state-machine'

const machine = new ProposalStateMachine()

// 測試有效轉換
machine.canTransition('DRAFT', 'PENDING_REVIEW')  // true

// 測試無效轉換
machine.canTransition('DRAFT', 'SENT')  // false
```

#### 3. **版本控制系統驗證**

```bash
# 查看版本控制實現
cat lib/workflow/version-control.ts
```

**功能驗證**:
```typescript
import { VersionControl } from '@/lib/workflow/version-control'

// 創建版本快照
await VersionControl.createSnapshot(proposalId, userId)

// 比較版本差異
const diff = await VersionControl.compareVersions(v1, v2)

// 回滾到歷史版本
await VersionControl.rollback(proposalId, versionId, userId)
```

#### 4. **評論系統驗證**

```bash
# 查看評論系統實現
cat lib/workflow/comment-system.ts
```

**功能驗證**:
```typescript
import { CommentSystem } from '@/lib/workflow/comment-system'

// 添加評論
await CommentSystem.addComment({
  proposalId,
  userId,
  content: 'Great proposal! @john please review'
})

// 支援 @mentions
// 樹狀結構回覆
// 評論權限控制
```

#### 5. **審批管理器驗證**

```bash
# 查看審批管理實現
cat lib/workflow/approval-manager.ts
```

**功能驗證**:
```typescript
import { ApprovalManager } from '@/lib/workflow/approval-manager'

// 創建審批流程
await ApprovalManager.createApprovalFlow(proposalId, approvers)

// 提交審批
await ApprovalManager.submitApproval(proposalId, userId, decision)

// 多級審批支援
// 條件審批邏輯
```

#### 6. **工作流程測試套件**

```bash
# 執行工作流程測試（準備中）
npm run test:workflow
```

---

## 🎯 快速驗證檢查清單

### ✅ Sprint 1: API 網關與安全層
- [ ] 執行中間件測試套件 (296 個測試)
- [ ] 驗證安全頭部設置
- [ ] 測試 CORS 跨域請求
- [ ] 驗證速率限制功能
- [ ] 檢查 Request ID 追蹤
- [ ] 測試請求驗證
- [ ] 驗證 API 版本控制
- [ ] 檢查響應格式轉換

### ✅ Sprint 2: 監控告警系統
- [ ] 檢查系統健康狀態 API
- [ ] 驗證監控系統初始化
- [ ] 執行健康檢查腳本
- [ ] 檢查服務狀態日誌
- [ ] 驗證連接監控功能

### ✅ Sprint 4: 性能優化
- [ ] 執行性能測試套件 (198 個測試)
- [ ] 驗證 API 響應緩存
- [ ] 測試 DataLoader 批次載入
- [ ] 檢查性能監控指標
- [ ] 驗證熔斷器模式
- [ ] 測試健康檢查系統
- [ ] 驗證智能重試策略

### 🔄 Sprint 5: 工作流程引擎
- [ ] 檢查數據庫 Schema
- [ ] 驗證狀態機引擎
- [ ] 測試版本控制系統
- [ ] 驗證評論系統
- [ ] 測試審批管理器
- [ ] 執行工作流程測試（準備中）

---

## 📝 測試報告範例

### Sprint 1 測試結果
```
✅ Security Headers: 24/24 tests passed
✅ CORS: 29/29 tests passed
✅ Route Matcher: 23/23 tests passed
✅ Request ID: 20/20 tests passed
✅ Rate Limiter: 23/23 tests passed
✅ API Versioning: 38/38 tests passed
✅ Request Validator: 43/43 tests passed
✅ Response Transformer: 96/96 tests passed

總計: 296/296 tests passed (100%)
執行時間: 1.166s
代碼行數: 4,884 lines
```

### Sprint 2 測試結果
```
✅ 健康檢查 API: 正常運行
✅ 監控系統初始化: 成功
✅ 5/5 服務健康狀態: HEALTHY
✅ 服務狀態監控: 實時更新
✅ 連接監控器: 正常運行
```

### Sprint 4 測試結果
```
✅ API Cache: 30/30 tests passed
✅ DataLoader: 26/26 tests passed
✅ Performance Monitor: 36/36 tests passed
✅ Circuit Breaker: 43/43 tests passed
✅ Health Check: 34/34 tests passed
✅ Retry Strategy: 29/29 tests passed

總計: 198/198 tests passed (100%)
代碼行數: 3,086 lines
```

---

## 🔗 相關資源

- **完整測試套件**: `__tests__/lib/middleware/`, `__tests__/lib/performance/`
- **API 文檔**: `docs/api-specification.md`
- **性能基準**: `DEVELOPMENT-LOG.md` (2025-10-01 記錄)
- **監控指南**: `lib/monitoring/README.md`
- **工作流程文檔**: `lib/workflow/README.md`

---

**最後更新**: 2025-10-01
**維護者**: AI 銷售賦能平台開發團隊
