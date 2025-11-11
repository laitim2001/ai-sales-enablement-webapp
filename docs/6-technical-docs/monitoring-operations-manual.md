# AI Sales Enablement Platform - 監控系統運維手冊

## 📋 目錄

1. [系統概述](#系統概述)
2. [快速開始](#快速開始)
3. [日常運維](#日常運維)
4. [告警處理](#告警處理)
5. [故障排查](#故障排查)
6. [性能優化](#性能優化)
7. [遷移指南](#遷移指南)
8. [附錄](#附錄)

---

## 系統概述

### 監控架構

```
應用層 (Next.js + OpenTelemetry API)
    ↓
監控抽象層 (lib/monitoring/telemetry.ts)
    ↓
配置層 (lib/monitoring/config.ts)
    ↓
後端工廠 (lib/monitoring/backend-factory.ts)
    ↓
監控後端 (Prometheus / Azure Monitor / Jaeger)
```

### 核心組件

| 組件 | 用途 | 端口 | 訪問地址 |
|------|------|------|----------|
| Prometheus | 指標收集和存儲 | 9090 | http://localhost:9090 |
| Grafana | 可視化儀表板 | 3001 | http://localhost:3001 |
| Jaeger | 分佈式追蹤 | 16686 | http://localhost:16686 |
| Alertmanager | 告警管理 | 9093 | http://localhost:9093 |
| Node Exporter | 主機指標 | 9100 | http://localhost:9100 |
| App Metrics | 應用指標 | 9464 | http://localhost:9464/metrics |

### 監控指標覆蓋

**系統層級:**
- CPU、記憶體、磁碟、網絡使用率
- 系統負載、文件描述符、進程狀態

**應用層級:**
- API 請求率、響應時間、錯誤率
- 資料庫連接池、查詢性能
- 緩存命中率

**業務層級:**
- 用戶註冊、登入活動
- AI 服務調用、Token 使用
- 知識庫搜尋、Dynamics 365 同步
- 文件上傳和處理

---

## 快速開始

### 環境準備

#### 1. 安裝 Docker 和 Docker Compose

```bash
# 驗證 Docker 安裝
docker --version
docker-compose --version
```

#### 2. 配置環境變數

```bash
# 複製環境變數模板
cp .env.monitoring.example .env.local

# 編輯配置（開發階段使用 Prometheus）
# .env.local
MONITORING_BACKEND=prometheus
SERVICE_NAME=ai-sales-platform
PROMETHEUS_PORT=9464
```

#### 3. 啟動監控服務

```bash
# 啟動所有監控組件
docker-compose -f docker-compose.monitoring.yml up -d

# 檢查服務狀態
docker-compose -f docker-compose.monitoring.yml ps

# 查看服務日誌
docker-compose -f docker-compose.monitoring.yml logs -f
```

#### 4. 驗證安裝

```bash
# 檢查 Prometheus
curl http://localhost:9090/-/healthy

# 檢查 Grafana
curl http://localhost:3001/api/health

# 檢查應用 metrics
curl http://localhost:9464/metrics
```

### 初次登入

#### Grafana 初始設置

1. 訪問 http://localhost:3001
2. 默認帳號: `admin` / 密碼: `admin`
3. 首次登入後會要求修改密碼
4. 自動配置的資料源和儀表板會在啟動時載入

#### 查看儀表板

預配置的儀表板位於 "AI Sales Enablement" 文件夾：

1. **系統概覽** - 整體健康狀態
2. **API 性能** - API 響應時間和錯誤率
3. **業務指標** - 用戶活動和 AI 使用
4. **資源使用** - CPU、記憶體、磁碟、網絡

---

## 日常運維

### 每日檢查清單

#### 晨間檢查（每天 9:00）

```bash
# 1. 檢查監控服務健康狀態
docker-compose -f docker-compose.monitoring.yml ps

# 2. 檢查 Prometheus targets
# 訪問 http://localhost:9090/targets
# 確保所有 target 狀態為 UP

# 3. 檢查活躍告警
# 訪問 http://localhost:9090/alerts
# 或 http://localhost:9093/#/alerts

# 4. 查看 Grafana 系統概覽儀表板
# 訪問 http://localhost:3001
# 檢查關鍵指標是否正常
```

#### 關鍵指標檢查

| 指標 | 正常範圍 | 告警閾值 | 處理優先級 |
|------|----------|----------|-----------|
| API 錯誤率 (5xx) | < 1% | > 5% | P2 |
| API P95 響應時間 | < 500ms | > 2s | P2 |
| CPU 使用率 | < 70% | > 85% | P2 |
| 記憶體使用率 | < 80% | > 95% | P1 |
| 磁碟使用率 | < 80% | > 90% | P3 |
| 資料庫連接池 | < 80% | > 90% | P2 |

### 每週維護（每週一 10:00）

#### 1. 資料保留檢查

```bash
# 檢查 Prometheus 資料大小
du -sh monitoring/prometheus-data/

# 檢查 Grafana 資料大小
du -sh monitoring/grafana-data/

# 如果空間不足，調整保留期限
# 編輯 monitoring/prometheus/prometheus.yml
# 修改 --storage.tsdb.retention.time 參數
```

#### 2. 告警規則審查

```bash
# 檢查過去一週的告警統計
# 訪問 Grafana > Alerting > Alert Rules

# 審查誤報告警並調整閾值
# 編輯 monitoring/prometheus/alerts.yml
```

#### 3. 儀表板優化

- 檢查是否有新的監控需求
- 優化慢查詢的儀表板面板
- 移除不再使用的指標

### 每月報告（每月第一個工作日）

#### 生成月度監控報告

```bash
# 1. 導出關鍵指標數據
# 使用 Prometheus API 或 Grafana 導出功能

# 2. 彙總月度統計
# - 平均響應時間趨勢
# - 錯誤率趨勢
# - 用戶增長趨勢
# - AI 使用量趨勢
# - 告警統計

# 3. 識別優化機會
# - 性能瓶頸
# - 高頻錯誤
# - 資源使用異常
```

---

## 告警處理

### 告警級別和響應時間

| 級別 | 描述 | 響應時間 | 通知渠道 |
|------|------|----------|----------|
| P1 - Critical | 服務完全不可用 | 立即（15分鐘內） | Email + Slack + Phone |
| P2 - High | 性能嚴重降級 | 1小時內 | Email + Slack |
| P3 - Medium | 潛在問題 | 當天處理 | Email |
| P4 - Low | 優化建議 | 本週處理 | Email (每日摘要) |

### P1 - Critical 告警處理

#### APICompletelyDown

**症狀**: API 服務完全無響應

**檢查步驟**:
```bash
# 1. 檢查應用進程
ps aux | grep node

# 2. 檢查應用日誌
docker logs <container-id> --tail 100

# 3. 檢查系統資源
htop
df -h

# 4. 檢查網絡連接
netstat -an | grep 3000
```

**常見原因和解決方案**:
- **應用崩潰**: 重啟應用容器
- **OOM (記憶體不足)**: 增加記憶體限制或優化代碼
- **端口被佔用**: 釋放端口或修改配置

**臨時緩解措施**:
```bash
# 快速重啟應用
docker-compose restart app

# 如果需要，可以臨時降低流量
# 啟用維護模式頁面
```

#### HighErrorRate

**症狀**: 5xx 錯誤率超過 10%

**檢查步驟**:
```bash
# 1. 查看最近的錯誤日誌
tail -f logs/error.log

# 2. 檢查資料庫連接
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 3. 檢查 AI 服務狀態
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}]}'

# 4. 分析錯誤分佈
# 訪問 Grafana > API Performance > Error Rate by Endpoint
```

**常見原因**:
- 資料庫連接池耗盡
- 外部 API 服務故障（Azure OpenAI, Dynamics 365）
- 程式碼 bug 導致未捕獲的異常
- 資源耗盡（記憶體、磁碟）

#### DatabaseConnectionFailure

**症狀**: 資料庫連接錯誤

**檢查步驟**:
```bash
# 1. 檢查資料庫服務
docker-compose ps postgres

# 2. 嘗試手動連接
psql -h localhost -U postgres -d ai_sales_db

# 3. 檢查連接數
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# 4. 檢查資料庫日誌
docker logs postgres --tail 100
```

**恢復步驟**:
```bash
# 如果連接池耗盡
# 重啟應用以重置連接池
docker-compose restart app

# 如果資料庫宕機
docker-compose restart postgres

# 檢查資料完整性
psql -U postgres -d ai_sales_db -c "SELECT pg_database_size('ai_sales_db');"
```

### P2 - High 告警處理

#### SlowAPIResponse

**症狀**: API P95 響應時間超過 2 秒

**診斷工具**:
```bash
# 1. 查看 Jaeger 追蹤
# 訪問 http://localhost:16686
# 搜尋最慢的請求並分析調用鏈

# 2. 查看慢查詢日誌
# 在 Grafana 查看 Database Query Performance 面板

# 3. 分析 CPU 和記憶體使用
# 查看 Resource Usage 儀表板
```

**優化方案**:
1. **資料庫優化**
   - 添加缺失的索引
   - 優化慢查詢
   - 增加連接池大小

2. **緩存優化**
   - 增加緩存 TTL
   - 實施查詢結果緩存
   - 預加載熱數據

3. **代碼優化**
   - 減少 N+1 查詢
   - 使用批量操作
   - 異步處理耗時任務

#### HighAIServiceFailureRate

**症狀**: AI 服務調用失敗率超過 10%

**檢查步驟**:
```bash
# 1. 檢查 Azure OpenAI 配額
# 訪問 Azure Portal > Your OpenAI Resource > Quotas

# 2. 檢查 API Key 有效性
# 測試 API 調用

# 3. 查看錯誤類型分佈
# 在 Grafana 查看 Business Metrics > AI Service Success Rate
```

**常見錯誤和解決方案**:
- **429 Too Many Requests**: 增加配額或實施速率限制
- **401 Unauthorized**: 更新 API Key
- **500 Server Error**: Azure OpenAI 服務問題，等待恢復或使用備用模型
- **Timeout**: 增加超時時間或優化 prompt

### P3 - Medium 告警處理

#### Elevated4xxErrorRate

**症狀**: 客戶端錯誤率（4xx）超過 10%

**分析方法**:
```bash
# 查看錯誤類型分佈
# Grafana > API Performance > Client Error Rate

# 常見 4xx 錯誤:
# - 400 Bad Request: 參數驗證失敗
# - 401 Unauthorized: 認證失敗
# - 403 Forbidden: 權限不足
# - 404 Not Found: 路徑錯誤
# - 429 Too Many Requests: 速率限制
```

**處理策略**:
- 檢查 API 文檔是否更新
- 改進錯誤訊息清晰度
- 加強參數驗證和錯誤處理
- 審查認證和授權邏輯

---

## 故障排查

### 常見問題診斷

#### 問題 1: 看不到任何監控數據

**可能原因**:
1. Prometheus 未正確抓取指標
2. 應用未啟用監控
3. 防火牆阻擋連接

**排查步驟**:
```bash
# 1. 檢查應用是否暴露 metrics
curl http://localhost:9464/metrics

# 2. 檢查 Prometheus targets
# 訪問 http://localhost:9090/targets

# 3. 檢查 instrumentation.ts 是否被執行
# 查看應用啟動日誌，應該看到:
# [Monitoring] OpenTelemetry initialized successfully

# 4. 驗證環境變數
echo $MONITORING_BACKEND
```

**解決方案**:
```bash
# 如果 metrics endpoint 無響應
# 檢查 .env.local 配置
cat .env.local | grep MONITORING

# 重啟應用
docker-compose restart app

# 清除緩存並重新構建
docker-compose down
docker-compose up --build
```

#### 問題 2: Grafana 顯示 "No Data"

**排查步驟**:
```bash
# 1. 測試 Prometheus 資料源
# Grafana > Configuration > Data Sources > Prometheus > Test
# 應該顯示 "Data source is working"

# 2. 驗證 Prometheus 是否有數據
# 訪問 http://localhost:9090
# 執行查詢: up
# 應該返回結果

# 3. 檢查時間範圍
# 確認 Grafana 儀表板的時間範圍包含有數據的時段

# 4. 檢查查詢語法
# 查看儀表板面板的 Query 是否正確
```

#### 問題 3: 告警未觸發

**排查步驟**:
```bash
# 1. 檢查 Prometheus 告警規則
# 訪問 http://localhost:9090/rules

# 2. 手動測試告警條件
# 在 Prometheus 執行告警查詢語句

# 3. 檢查 Alertmanager 配置
cat monitoring/alertmanager/alertmanager.yml

# 4. 測試通知渠道
# 發送測試告警到 Email/Slack
```

#### 問題 4: 高記憶體使用

**診斷步驟**:
```bash
# 1. 檢查 Node.js 堆記憶體
# 查看 Resource Usage > Process Memory

# 2. 分析記憶體洩漏
# 啟用 Node.js 記憶體分析
node --inspect app.js

# 3. 檢查 Prometheus 資料大小
du -sh monitoring/prometheus-data/

# 4. 檢查是否有記憶體洩漏
# 觀察記憶體使用趨勢，如果持續增長需要分析代碼
```

**緩解措施**:
```bash
# 臨時增加記憶體限制
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4G

# 優化 Prometheus 保留期限
# monitoring/prometheus/prometheus.yml
# --storage.tsdb.retention.time=7d  # 從 15d 減少到 7d

# 重啟服務
docker-compose restart
```

### 性能分析工具

#### Jaeger 分佈式追蹤

**使用場景**:
- 診斷慢請求
- 分析服務依賴
- 識別性能瓶頸

**操作步驟**:
1. 訪問 http://localhost:16686
2. 選擇服務: `ai-sales-platform`
3. 選擇操作: 例如 `HTTP POST /api/ai/chat`
4. 設置時間範圍和結果數量
5. 點擊 "Find Traces" 搜尋
6. 點擊追蹤查看詳細的調用鏈和時間分解

**追蹤分析技巧**:
- 查找耗時最長的 span
- 檢查是否有不必要的串行調用
- 識別可以並行化的操作
- 檢查外部服務調用的延遲

#### Prometheus 查詢技巧

**常用查詢模板**:

```promql
# 1. 響應時間趨勢
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
)

# 2. 錯誤率趨勢
(sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))) * 100

# 3. 最慢的端點
topk(10,
  histogram_quantile(0.95,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
  )
)

# 4. 請求量排名
topk(10,
  sum(increase(http_requests_total[1h])) by (route, method)
)

# 5. AI Token 消耗趨勢
sum(rate(ai_tokens_used_total[5m])) * 300  # 每 5 分鐘使用量

# 6. 資料庫連接池使用率
(database_connection_pool_active / database_connection_pool_max) * 100

# 7. 緩存命中率
(sum(rate(cache_hits_total[5m]))
/ sum(rate(cache_requests_total[5m]))) * 100
```

---

## 性能優化

### API 響應時間優化

#### 優化目標

| 指標 | 當前 | 目標 | 優秀 |
|------|------|------|------|
| P50 響應時間 | - | < 200ms | < 100ms |
| P95 響應時間 | - | < 500ms | < 300ms |
| P99 響應時間 | - | < 1000ms | < 500ms |

#### 優化步驟

**1. 識別瓶頸**
```bash
# 使用 Jaeger 分析最慢的請求
# 查看各個 span 的耗時分佈

# 常見瓶頸:
# - 資料庫查詢 (> 50% 時間)
# - 外部 API 調用 (AI 服務, Dynamics 365)
# - 數據序列化/反序列化
# - 無效的緩存策略
```

**2. 資料庫優化**
```sql
-- 找出慢查詢
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 檢查缺失的索引
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'your_table'
AND attname = 'your_column';

-- 添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_user_id ON documents(user_id);
```

**3. 實施緩存策略**
```typescript
// lib/cache/strategies.ts

// 短期緩存 (5-15 分鐘) - 頻繁訪問的數據
export async function getCachedUserProfile(userId: string) {
  const cacheKey = `user:profile:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    BusinessMetrics.trackCacheAccess(true, cacheKey);
    return JSON.parse(cached);
  }

  const profile = await fetchUserProfile(userId);
  await redis.setex(cacheKey, 600, JSON.stringify(profile));  // 10 分鐘
  BusinessMetrics.trackCacheAccess(false, cacheKey);

  return profile;
}

// 長期緩存 (1-24 小時) - 相對靜態的數據
export async function getCachedConfiguration() {
  const cacheKey = 'system:config';
  // TTL: 1 小時
}

// 預加載緩存 - 啟動時加載熱數據
export async function warmupCache() {
  const popularUsers = await getPopularUsers();
  for (const userId of popularUsers) {
    await getCachedUserProfile(userId);
  }
}
```

**4. 批量操作優化**
```typescript
// 不好的做法 - N+1 查詢
for (const userId of userIds) {
  const user = await getUserById(userId);  // N 次資料庫查詢
  users.push(user);
}

// 好的做法 - 批量查詢
const users = await getUsersByIds(userIds);  // 1 次資料庫查詢
```

**5. 異步處理耗時任務**
```typescript
// 不好的做法 - 同步處理
await processLargeFile(file);  // 阻塞 5 秒
await sendNotification(user);  // 阻塞 2 秒
return response;

// 好的做法 - 異步處理
queueJob('processFile', { fileId: file.id });
queueJob('sendNotification', { userId: user.id });
return response;  // 立即返回
```

### 資源使用優化

#### 記憶體優化

**監控記憶體使用**:
```bash
# 1. 查看當前記憶體使用
docker stats --no-stream

# 2. 分析記憶體洩漏
# 使用 Node.js heap snapshot
node --inspect app.js
# Chrome DevTools > Memory > Take Heap Snapshot
```

**優化措施**:
```typescript
// 1. 限制併發請求
const pLimit = require('p-limit');
const limit = pLimit(10);  // 最多 10 個併發請求

// 2. 使用流處理大文件
import { createReadStream } from 'fs';
const stream = createReadStream(largeFile);
stream.pipe(response);

// 3. 及時釋放資源
const client = await pool.connect();
try {
  await client.query(/* ... */);
} finally {
  client.release();  // 確保連接被釋放
}

// 4. 實施對象池
const objectPool = new Pool({
  max: 100,
  create: () => createExpensiveObject(),
  destroy: (obj) => obj.cleanup(),
});
```

#### CPU 優化

**識別 CPU 熱點**:
```bash
# 1. 使用 Node.js profiler
node --prof app.js

# 2. 分析 profiler 結果
node --prof-process isolate-*.log

# 3. 查看 CPU 密集型操作
# Grafana > Resource Usage > CPU Usage
```

**優化措施**:
- 使用 worker threads 處理 CPU 密集型任務
- 優化正則表達式和迴圈
- 使用原生模塊處理計算密集型操作
- 實施請求節流和速率限制

---

## 遷移指南

### 從 Prometheus 遷移到 Azure Monitor

#### 準備工作

**1. 創建 Azure Application Insights 資源**
```bash
# 使用 Azure CLI
az monitor app-insights component create \
  --app ai-sales-platform \
  --location eastus \
  --resource-group ai-sales-rg

# 獲取連接字符串
az monitor app-insights component show \
  --app ai-sales-platform \
  --resource-group ai-sales-rg \
  --query connectionString
```

**2. 測試配置**
```bash
# 在測試環境驗證連接
MONITORING_BACKEND=azure \
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;..." \
npm run start

# 檢查 Azure Portal 是否收到數據
# Application Insights > Live Metrics
```

#### 遷移步驟

**Step 1: 更新環境變數**
```bash
# .env.production
MONITORING_BACKEND=azure
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://xxx.livediagnostics.monitor.azure.com/"
AZURE_SAMPLING_RATE=0.2  # 20% 採樣以控制成本
AZURE_LIVE_METRICS=true
```

**Step 2: 部署應用**
```bash
# 無需修改代碼！只需重新部署
# OpenTelemetry 自動切換到 Azure 後端

# 驗證遷移
# 1. 檢查應用日誌
# 應該看到: [Monitoring] Initializing Azure Application Insights backend

# 2. 訪問 Azure Portal
# Application Insights > Live Metrics
# 應該看到實時數據流

# 3. 查看追蹤數據
# Application Insights > Transaction search
# 選擇最近的請求查看詳細追蹤
```

**Step 3: 配置 Azure 告警**
```bash
# 在 Azure Portal 配置告警規則
# Application Insights > Alerts > New alert rule

# 參考 Prometheus 告警規則創建對應的 Azure 告警
```

**Step 4: 創建 Azure 儀表板**
```bash
# 導入預定義的 Azure 儀表板模板
# Azure Portal > Dashboards > Upload

# 或手動創建對應的圖表
# 參考 Grafana 儀表板結構
```

#### 成本優化配置

**採樣策略**:
```bash
# 開發環境 - 100% 採樣（詳細調試）
AZURE_SAMPLING_RATE=1.0

# 測試環境 - 50% 採樣（充分測試）
AZURE_SAMPLING_RATE=0.5

# 生產環境 - 10-20% 採樣（成本優化）
AZURE_SAMPLING_RATE=0.2
```

**數據保留設定**:
```bash
# Azure Portal > Application Insights > Usage and estimated costs
# 設置: 30 天保留（標準）或 90 天（如需更長歷史）
```

**查詢成本控制**:
```bash
# 使用 Kusto 查詢時添加限制
# requests
# | where timestamp > ago(1h)
# | take 1000

# 避免全表掃描
# | where timestamp > ago(7d)  // 好
# | where timestamp > ago(90d) // 成本高
```

#### 並行運行（推薦）

**雙寫策略** - 同時發送到 Prometheus 和 Azure:

```typescript
// lib/monitoring/backend-factory.ts

// 添加多後端支持
function createMultipleBackends(backends: MonitoringBackend[]): NodeSDK[] {
  return backends.map(backend => {
    const config = { ...getMonitoringConfig(), backend };
    return createBackendSDK(config);
  });
}

// 使用
export async function startTelemetry(): Promise<NodeSDK[]> {
  // 開發: 只使用 Prometheus
  // 過渡期: 同時使用 Prometheus + Azure
  // 生產: 只使用 Azure

  const backends = process.env.MONITORING_BACKENDS?.split(',') || ['prometheus'];
  return backends.map(backend => startSDK(backend));
}
```

**配置範例**:
```bash
# 過渡期（並行運行 7-14 天）
MONITORING_BACKENDS=prometheus,azure
APPLICATIONINSIGHTS_CONNECTION_STRING="..."
AZURE_SAMPLING_RATE=0.5  # 部分採樣以控制成本

# 驗證兩邊數據一致後，切換到純 Azure
MONITORING_BACKEND=azure
```

#### 回滾計劃

如果遷移後發現問題，可以立即回滾：

```bash
# 1. 切換環境變數
MONITORING_BACKEND=prometheus

# 2. 重新部署
# 無需修改代碼

# 3. 驗證 Prometheus 恢復正常
curl http://localhost:9464/metrics
```

---

## 附錄

### A. 快速參考

#### 常用命令速查

```bash
# 監控服務管理
docker-compose -f docker-compose.monitoring.yml up -d    # 啟動
docker-compose -f docker-compose.monitoring.yml down    # 停止
docker-compose -f docker-compose.monitoring.yml restart # 重啟
docker-compose -f docker-compose.monitoring.yml ps      # 狀態

# 查看日誌
docker-compose -f docker-compose.monitoring.yml logs -f prometheus
docker-compose -f docker-compose.monitoring.yml logs -f grafana

# 檢查健康狀態
curl http://localhost:9090/-/healthy     # Prometheus
curl http://localhost:3001/api/health    # Grafana
curl http://localhost:9464/metrics       # App Metrics

# 重新加載配置（無需重啟）
curl -X POST http://localhost:9090/-/reload  # Prometheus
```

#### 重要 URL 列表

| 服務 | URL | 用途 |
|------|-----|------|
| Prometheus | http://localhost:9090 | 指標查詢和告警管理 |
| Grafana | http://localhost:3001 | 可視化儀表板 |
| Jaeger | http://localhost:16686 | 分佈式追蹤查看 |
| Alertmanager | http://localhost:9093 | 告警通知管理 |
| App Metrics | http://localhost:9464/metrics | 應用指標端點 |

### B. 監控指標字典

#### HTTP 指標

| 指標名稱 | 類型 | 描述 | 單位 |
|---------|------|------|------|
| `http_requests_total` | Counter | HTTP 請求總數 | 次數 |
| `http_request_duration_seconds` | Histogram | HTTP 請求持續時間 | 秒 |
| `http_request_size_bytes` | Histogram | HTTP 請求大小 | 字節 |
| `http_response_size_bytes` | Histogram | HTTP 響應大小 | 字節 |

**標籤**:
- `method`: HTTP 方法 (GET, POST, etc.)
- `route`: API 路由
- `status`: HTTP 狀態碼

#### 業務指標

| 指標名稱 | 類型 | 描述 | 單位 |
|---------|------|------|------|
| `user_registrations_total` | Counter | 用戶註冊總數 | 次數 |
| `user_logins_total` | Counter | 用戶登入總數 | 次數 |
| `user_activity_total` | Counter | 用戶活動事件總數 | 次數 |
| `ai_service_calls_total` | Counter | AI 服務調用總數 | 次數 |
| `ai_service_response_time_seconds` | Histogram | AI 服務響應時間 | 秒 |
| `ai_tokens_used_total` | Counter | AI Tokens 使用總數 | Tokens |
| `knowledge_base_searches_total` | Counter | 知識庫搜尋總數 | 次數 |
| `dynamics_sync_operations_total` | Counter | Dynamics 365 同步操作總數 | 次數 |
| `document_uploads_total` | Counter | 文件上傳總數 | 次數 |

#### 資料庫指標

| 指標名稱 | 類型 | 描述 | 單位 |
|---------|------|------|------|
| `database_query_duration_seconds` | Histogram | 資料庫查詢時間 | 秒 |
| `database_connection_pool_active` | Gauge | 活躍資料庫連接數 | 連接數 |
| `database_connection_errors_total` | Counter | 資料庫連接錯誤總數 | 次數 |

#### 緩存指標

| 指標名稱 | 類型 | 描述 | 單位 |
|---------|------|------|------|
| `cache_hits_total` | Counter | 緩存命中總數 | 次數 |
| `cache_requests_total` | Counter | 緩存請求總數 | 次數 |

**緩存命中率計算**:
```promql
(sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m]))) * 100
```

### C. 聯絡資訊

#### 支援和緊急聯絡

| 角色 | 姓名 | Email | 電話 | 責任範圍 |
|------|------|-------|------|---------|
| 監控負責人 | - | monitoring@company.com | - | 監控系統整體 |
| DevOps Lead | - | devops@company.com | - | 基礎設施 |
| Backend Lead | - | backend@company.com | - | 應用性能 |
| On-Call Engineer | - | oncall@company.com | - | 24/7 緊急響應 |

#### 相關資源

- **文檔倉庫**: https://github.com/your-org/ai-sales-enablement-webapp
- **監控遷移策略**: `docs/monitoring-migration-strategy.md`
- **使用範例**: `docs/monitoring-usage-examples.md`
- **OpenTelemetry 文檔**: https://opentelemetry.io/docs/
- **Prometheus 文檔**: https://prometheus.io/docs/
- **Grafana 文檔**: https://grafana.com/docs/

---

**文檔版本**: v1.0
**最後更新**: 2025-06-22
**維護者**: DevOps Team
