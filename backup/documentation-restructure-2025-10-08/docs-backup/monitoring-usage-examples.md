# 監控系統使用範例

## 目錄

1. [基礎配置](#基礎配置)
2. [API 路由監控](#api-路由監控)
3. [業務指標追蹤](#業務指標追蹤)
4. [資料庫查詢監控](#資料庫查詢監控)
5. [AI 服務調用監控](#ai-服務調用監控)
6. [分佈式追蹤](#分佈式追蹤)
7. [自定義指標](#自定義指標)

---

## 基礎配置

### 1. 環境變數設置

開發階段（使用 Prometheus）：
```bash
# .env.local
MONITORING_BACKEND=prometheus
SERVICE_NAME=ai-sales-platform
PROMETHEUS_PORT=9464
```

生產階段（切換到 Azure Monitor）：
```bash
# .env.production
MONITORING_BACKEND=azure
SERVICE_NAME=ai-sales-platform
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/"
AZURE_SAMPLING_RATE=0.2  # 20% 採樣以控制成本
```

### 2. 啟動監控服務（開發階段）

```bash
# 啟動 Prometheus + Grafana + Jaeger
docker-compose -f docker-compose.monitoring.yml up -d

# 訪問監控界面
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
# Jaeger UI: http://localhost:16686
```

---

## API 路由監控

### 基礎 API 監控

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/monitoring/middleware';

async function GET(request: NextRequest) {
  // 你的 API 邏輯
  const data = { message: 'Hello World' };
  return NextResponse.json(data);
}

// 使用監控中間件包裝（自動追蹤請求性能）
export default withMonitoring(GET);
```

**自動追蹤的指標：**
- 請求數量
- 響應時間（P50, P95, P99）
- HTTP 狀態碼分佈
- 請求/響應大小

---

## 業務指標追蹤

### 用戶註冊追蹤

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics } from '@/lib/monitoring/telemetry';
import { withMonitoring } from '@/lib/monitoring/middleware';

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    // 創建用戶邏輯
    const user = await createUser(email, name);

    // 追蹤用戶註冊事件
    await BusinessMetrics.trackUserRegistration(user.id, {
      email,
      registrationSource: 'web',
      plan: 'free',
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

export default withMonitoring(POST);
```

### 用戶登入追蹤

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics } from '@/lib/monitoring/telemetry';
import { withMonitoring } from '@/lib/monitoring/middleware';

async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  try {
    // 驗證用戶
    const user = await authenticateUser(email, password);

    if (user) {
      // 追蹤成功登入
      await BusinessMetrics.trackUserLogin(user.id, 'success', {
        email,
        loginMethod: 'password',
      });

      return NextResponse.json({ success: true, user });
    } else {
      // 追蹤失敗登入
      await BusinessMetrics.trackUserLogin('unknown', 'failed', {
        email,
        reason: 'invalid_credentials',
      });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    await BusinessMetrics.trackUserLogin('unknown', 'failed', {
      email,
      reason: 'system_error',
    });

    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export default withMonitoring(POST);
```

---

## 資料庫查詢監控

### PostgreSQL 查詢追蹤

```typescript
// lib/db/queries.ts
import { Pool } from 'pg';
import { BusinessMetrics, withSpan } from '@/lib/monitoring/telemetry';

const pool = new Pool({
  // PostgreSQL 連接配置
});

export async function getUserById(userId: string) {
  const startTime = Date.now();

  try {
    // 在 span 上下文中執行查詢
    return await withSpan(
      'db.query.getUserById',
      async (span) => {
        span.setAttribute('db.system', 'postgresql');
        span.setAttribute('db.operation', 'SELECT');
        span.setAttribute('db.table', 'users');
        span.setAttribute('user.id', userId);

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        // 追蹤查詢性能
        const duration = (Date.now() - startTime) / 1000;
        BusinessMetrics.trackDatabaseQuery('getUserById', duration, {
          table: 'users',
        });

        return result.rows[0];
      }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    BusinessMetrics.trackDatabaseQuery('getUserById', duration, {
      table: 'users',
      error: 'true',
    });
    BusinessMetrics.trackDatabaseConnectionError('query_failed');
    throw error;
  }
}

// 追蹤連接池狀態
export function trackConnectionPoolStatus() {
  const pool = getPool(); // 獲取你的連接池實例

  BusinessMetrics.trackDatabaseConnectionPoolStatus(
    pool.totalCount, // 活躍連接
    pool.idleCount,  // 空閒連接
    pool.options.max // 最大連接數
  );
}

// 定期追蹤連接池狀態（例如每分鐘）
setInterval(trackConnectionPoolStatus, 60000);
```

---

## AI 服務調用監控

### Azure OpenAI 調用追蹤

```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics, withSpan } from '@/lib/monitoring/telemetry';
import { withMonitoring } from '@/lib/monitoring/middleware';
import { OpenAIClient } from '@azure/openai';

async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, userId } = body;

  const startTime = Date.now();

  try {
    // 在 span 上下文中調用 AI 服務
    const response = await withSpan(
      'ai.chat.completion',
      async (span) => {
        span.setAttribute('ai.model', 'gpt-4');
        span.setAttribute('user.id', userId);

        const client = new OpenAIClient(/* 配置 */);

        const result = await client.getChatCompletions(
          'gpt-4',
          messages
        );

        // 記錄 token 使用
        const tokensUsed = result.usage?.totalTokens || 0;
        span.setAttribute('ai.tokens', tokensUsed);

        return result;
      }
    );

    const responseTime = (Date.now() - startTime) / 1000;
    const tokensUsed = response.usage?.totalTokens || 0;

    // 追蹤 AI 服務調用指標
    await BusinessMetrics.trackAIServiceCall(
      'chat_completion',
      'success',
      responseTime,
      tokensUsed,
      {
        model: 'gpt-4',
        userId,
      }
    );

    return NextResponse.json({
      content: response.choices[0].message.content,
      tokensUsed,
    });
  } catch (error) {
    const responseTime = (Date.now() - startTime) / 1000;

    await BusinessMetrics.trackAIServiceCall(
      'chat_completion',
      'error',
      responseTime,
      0,
      {
        model: 'gpt-4',
        userId,
        error: error instanceof Error ? error.message : 'unknown',
      }
    );

    return NextResponse.json({ error: 'AI service failed' }, { status: 500 });
  }
}

export default withMonitoring(POST);
```

### 知識庫搜尋追蹤

```typescript
// app/api/knowledge-base/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics } from '@/lib/monitoring/telemetry';
import { withMonitoring } from '@/lib/monitoring/middleware';

async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, userId } = body;

  try {
    // 執行搜尋邏輯
    const results = await searchKnowledgeBase(query);

    // 追蹤知識庫搜尋
    await BusinessMetrics.trackKnowledgeBaseSearch(
      query,
      results.length > 0,
      results.length,
      {
        userId,
        searchType: 'semantic',
      }
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

export default withMonitoring(POST);
```

---

## 分佈式追蹤

### 跨服務追蹤

```typescript
// lib/services/external-api.ts
import { withSpan, setSpanAttribute } from '@/lib/monitoring/telemetry';

export async function callExternalService(data: any) {
  return await withSpan(
    'external.api.call',
    async (span) => {
      span.setAttribute('external.service', 'dynamics365');
      span.setAttribute('external.operation', 'syncData');

      try {
        const response = await fetch('https://api.example.com/sync', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        const result = await response.json();

        span.setAttribute('external.status', response.status);
        setSpanAttribute('external.recordCount', result.count);

        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      }
    }
  );
}
```

### Dynamics 365 同步追蹤

```typescript
// app/api/dynamics/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics, withSpan } from '@/lib/monitoring/telemetry';
import { withMonitoring } from '@/lib/monitoring/middleware';

async function POST(request: NextRequest) {
  const body = await request.json();
  const { entityType, records } = body;

  try {
    const result = await withSpan(
      'dynamics.sync',
      async (span) => {
        span.setAttribute('dynamics.entityType', entityType);
        span.setAttribute('dynamics.recordCount', records.length);

        // 執行同步邏輯
        const syncResult = await syncToDynamics365(entityType, records);

        span.setAttribute('dynamics.successCount', syncResult.successCount);
        span.setAttribute('dynamics.failedCount', syncResult.failedCount);

        return syncResult;
      }
    );

    // 追蹤同步操作
    await BusinessMetrics.trackDynamicsSync(
      entityType,
      result.failedCount === 0 ? 'success' : 'failed',
      result.successCount,
      {
        totalRecords: records.length,
        failedRecords: result.failedCount,
      }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    await BusinessMetrics.trackDynamicsSync(
      entityType,
      'failed',
      0,
      {
        error: error instanceof Error ? error.message : 'unknown',
      }
    );

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export default withMonitoring(POST);
```

---

## 自定義指標

### 特徵使用追蹤

```typescript
// components/FeatureTracker.tsx
import { useEffect } from 'react';
import { BusinessMetrics } from '@/lib/monitoring/telemetry';

export function FeatureTracker({ featureName, userId }: { featureName: string; userId: string }) {
  useEffect(() => {
    // 追蹤特徵使用
    BusinessMetrics.trackFeatureUsage(featureName, userId, {
      timestamp: new Date().toISOString(),
      platform: 'web',
    });
  }, [featureName, userId]);

  return null;
}

// 使用範例
// <FeatureTracker featureName="ai-chat" userId={user.id} />
```

### 客戶參與度評分

```typescript
// lib/analytics/engagement.ts
import { BusinessMetrics } from '@/lib/monitoring/telemetry';

export function trackCustomerEngagement(customerId: string, score: number) {
  // 評分範圍: 0-100
  BusinessMetrics.trackCustomerEngagement(score, customerId);
}

// 計算並追蹤客戶參與度
export async function calculateAndTrackEngagement(customerId: string) {
  const activities = await getCustomerActivities(customerId);

  // 基於活動計算參與度評分
  const score = calculateEngagementScore(activities);

  trackCustomerEngagement(customerId, score);

  return score;
}
```

### 文件處理追蹤

```typescript
// app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics, withSpan } from '@/lib/monitoring/telemetry';
import { withMonitoring } from '@/lib/monitoring/middleware';

async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  try {
    // 追蹤文件上傳
    await BusinessMetrics.trackDocumentUpload(
      file.type,
      file.size,
      {
        fileName: file.name,
        userId,
      }
    );

    // 處理文件
    const startTime = Date.now();
    const result = await withSpan(
      'document.process',
      async (span) => {
        span.setAttribute('document.type', file.type);
        span.setAttribute('document.size', file.size);
        span.setAttribute('document.name', file.name);

        // 執行處理邏輯
        const processedDoc = await processDocument(file);

        return processedDoc;
      }
    );

    const processingTime = (Date.now() - startTime) / 1000;

    // 追蹤處理完成
    await BusinessMetrics.trackDocumentProcessingComplete(
      result.documentId,
      processingTime,
      {
        fileName: file.name,
        userId,
      }
    );

    return NextResponse.json({ success: true, documentId: result.documentId });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export default withMonitoring(POST);
```

---

## 缓存監控

```typescript
// lib/cache/redis.ts
import { BusinessMetrics } from '@/lib/monitoring/telemetry';
import Redis from 'ioredis';

const redis = new Redis({
  // Redis 配置
});

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);

    // 追蹤緩存訪問
    BusinessMetrics.trackCacheAccess(value !== null, key);

    return value ? JSON.parse(value) : null;
  } catch (error) {
    // 追蹤緩存未命中
    BusinessMetrics.trackCacheAccess(false, key);
    throw error;
  }
}

export async function setCached<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}
```

---

## 查看監控數據

### Prometheus 查詢範例

訪問 http://localhost:9090 並執行以下查詢：

```promql
# 總請求率
sum(rate(http_requests_total[5m]))

# 錯誤率
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 響應時間
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))

# AI Token 使用量
sum(increase(ai_tokens_used_total[1h]))

# 用戶註冊數（24小時）
sum(increase(user_registrations_total[24h]))
```

### Grafana 儀表板

訪問 http://localhost:3001 並查看預配置的儀表板：

1. **系統概覽** - 整體健康狀態和關鍵指標
2. **API 性能** - API 響應時間、錯誤率、流量
3. **業務指標** - 用戶活動、AI 使用、功能採用
4. **資源使用** - CPU、記憶體、磁碟、網絡

### Jaeger 追蹤查看

訪問 http://localhost:16686 查看分佈式追蹤：

1. 選擇服務: `ai-sales-platform`
2. 選擇操作類型（例如 `HTTP POST /api/ai/chat`）
3. 點擊追蹤查看完整的請求鏈路

---

## 遷移到 Azure Monitor

當準備部署到生產環境時，只需修改環境變數：

```bash
# 從 Prometheus 切換到 Azure Monitor
MONITORING_BACKEND=azure
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;..."
AZURE_SAMPLING_RATE=0.2

# 重新部署應用 - 無需修改代碼！
```

所有指標和追蹤將自動發送到 Azure Application Insights。

---

## 故障排查

### 檢查監控是否正常工作

```bash
# 1. 檢查 Prometheus metrics endpoint
curl http://localhost:9464/metrics

# 2. 檢查 Prometheus targets
# 訪問 http://localhost:9090/targets

# 3. 檢查 Grafana 數據源
# 訪問 Grafana > Configuration > Data Sources > Prometheus > Test

# 4. 查看應用日誌
# 尋找 "[Monitoring]" 前綴的日誌
```

### 常見問題

**Q: 看不到任何指標？**
- 檢查 `instrumentation.ts` 是否正確配置
- 確認環境變數 `MONITORING_BACKEND` 設置正確
- 查看應用啟動日誌中的監控初始化信息

**Q: Grafana 顯示 "No data"？**
- 確認 Prometheus 正在收集數據（訪問 http://localhost:9090）
- 檢查 Grafana 數據源配置
- 確認應用已經發送過請求（產生指標數據）

**Q: 如何測試 Azure Monitor 集成？**
- 設置 `MONITORING_BACKEND=azure` 和連接字符串
- 重啟應用
- 在 Azure Portal 查看 Application Insights 的 Live Metrics

---

## 最佳實踐

1. **始終使用監控中間件** - 確保所有 API 路由都被追蹤
2. **追蹤關鍵業務事件** - 不只是技術指標，也追蹤業務 KPI
3. **設置有意義的屬性** - 幫助定位問題和分析趨勢
4. **定期檢查儀表板** - 發現潛在問題和優化機會
5. **配置告警** - 對關鍵指標設置閾值告警
6. **控制採樣率** - 生產環境使用適當的採樣率以控制成本
