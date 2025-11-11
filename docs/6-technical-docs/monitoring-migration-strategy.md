# 監控系統遷移策略文檔

> **目的**: 設計零遷移成本的監控架構，支持開發階段使用 Prometheus，生產階段切換到 Azure Monitor
> **核心原則**: 使用 OpenTelemetry 標準，實現「寫一次，隨處運行」
> **遷移成本**: 接近零（只需修改配置文件）

---

## 🎯 架構設計原則

### 1. **廠商中立原則**
- ✅ 只使用 OpenTelemetry 標準 API
- ❌ 不直接使用 Prometheus 或 Azure Monitor 的專有 API
- ✅ 通過配置切換後端，不修改代碼

### 2. **抽象層設計**
```
┌─────────────────────────────────────────┐
│   應用代碼 (業務邏輯)                    │
└──────────────┬──────────────────────────┘
               │ 只依賴於 OpenTelemetry API
┌──────────────▼──────────────────────────┐
│   監控抽象層 (lib/monitoring/)           │
│   - trackEvent()                         │
│   - trackMetric()                        │
│   - trackDependency()                    │
│   - BusinessMetrics                      │
└──────────────┬──────────────────────────┘
               │ OpenTelemetry SDK
┌──────────────▼──────────────────────────┐
│   可切換的 Exporter (配置驅動)           │
│   ├─ Prometheus Exporter (開發)         │
│   ├─ Azure Monitor Exporter (生產)      │
│   └─ Jaeger Exporter (追蹤)            │
└──────────────────────────────────────────┘
```

---

## 📦 統一監控抽象層實現

### 文件: `lib/monitoring/telemetry.ts`

```typescript
/**
 * 統一監控抽象層
 *
 * 使用 OpenTelemetry 標準 API
 * 支持切換到任何 OpenTelemetry 兼容的後端
 *
 * 後端支持:
 * - Prometheus + Grafana (開發階段)
 * - Azure Application Insights (生產階段)
 * - Jaeger (分布式追蹤)
 * - 任何 OpenTelemetry 兼容服務
 */

import { trace, metrics, context, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Tracer, Meter } from '@opentelemetry/api';

// ==================== 全局變數 ====================

let globalTracer: Tracer;
let globalMeter: Meter;

/**
 * 初始化監控系統
 * 在應用啟動時調用一次
 */
export function initializeTelemetry(serviceName: string = 'ai-sales-platform') {
  globalTracer = trace.getTracer(serviceName);
  globalMeter = metrics.getMeter(serviceName);
  console.log(`✅ Telemetry initialized for service: ${serviceName}`);
}

/**
 * 獲取 Tracer
 */
export function getTracer(): Tracer {
  if (!globalTracer) {
    throw new Error('Telemetry not initialized. Call initializeTelemetry() first.');
  }
  return globalTracer;
}

/**
 * 獲取 Meter
 */
export function getMeter(): Meter {
  if (!globalMeter) {
    throw new Error('Telemetry not initialized. Call initializeTelemetry() first.');
  }
  return globalMeter;
}

// ==================== 核心追蹤 API ====================

/**
 * 追蹤自定義事件
 *
 * @param eventName 事件名稱
 * @param properties 事件屬性
 * @param callback 可選的回調函數，用於追蹤異步操作
 */
export async function trackEvent<T>(
  eventName: string,
  properties?: Record<string, any>,
  callback?: () => Promise<T>
): Promise<T | void> {
  const tracer = getTracer();
  const span = tracer.startSpan(eventName);

  try {
    // 添加屬性
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }

    // 如果有回調，執行並追蹤
    if (callback) {
      const result = await callback();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    }

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * 追蹤自定義指標
 *
 * @param metricName 指標名稱
 * @param value 指標值
 * @param properties 指標屬性
 */
export function trackMetric(
  metricName: string,
  value: number,
  properties?: Record<string, any>
) {
  const meter = getMeter();
  const counter = meter.createCounter(metricName, {
    description: `Custom metric: ${metricName}`,
  });

  counter.add(value, properties);
}

/**
 * 追蹤依賴（外部服務調用）
 *
 * @param dependencyName 依賴名稱
 * @param commandName 命令名稱
 * @param callback 實際的依賴調用
 */
export async function trackDependency<T>(
  dependencyName: string,
  commandName: string,
  callback: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(`${dependencyName}: ${commandName}`, {
    kind: trace.SpanKind.CLIENT,
  });

  span.setAttribute('dependency.name', dependencyName);
  span.setAttribute('dependency.command', commandName);

  const startTime = Date.now();

  try {
    const result = await callback();
    const duration = Date.now() - startTime;

    span.setAttribute('dependency.duration', duration);
    span.setAttribute('dependency.success', true);
    span.setStatus({ code: SpanStatusCode.OK });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    span.setAttribute('dependency.duration', duration);
    span.setAttribute('dependency.success', false);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error as Error);

    throw error;
  } finally {
    span.end();
  }
}

/**
 * 追蹤異常
 *
 * @param error 錯誤對象
 * @param properties 額外屬性
 */
export function trackException(error: Error, properties?: Record<string, any>) {
  const tracer = getTracer();
  const span = tracer.startSpan('Exception');

  span.recordException(error);
  span.setAttribute('error.message', error.message);
  span.setAttribute('error.type', error.name);

  if (error.stack) {
    span.setAttribute('error.stack', error.stack);
  }

  if (properties) {
    Object.entries(properties).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
}

// ==================== 業務指標 API ====================

/**
 * 業務指標追蹤
 * 提供高級別的業務操作追蹤 API
 */
export const BusinessMetrics = {
  /**
   * 追蹤用戶註冊
   */
  async trackUserRegistration(
    userId: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await trackEvent('UserRegistration', { userId, ...properties });
    trackMetric('user_registrations_total', 1, properties);
  },

  /**
   * 追蹤用戶登入
   */
  async trackUserLogin(
    userId: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await trackEvent('UserLogin', { userId, ...properties });
    trackMetric('user_logins_total', 1, properties);
  },

  /**
   * 追蹤提案生成
   */
  async trackProposalGeneration(
    proposalId: string,
    duration: number,
    success: boolean,
    properties?: Record<string, any>
  ): Promise<void> {
    await trackEvent('ProposalGeneration', {
      proposalId,
      duration,
      success,
      ...properties,
    });

    trackMetric('proposal_generations_total', 1, { success, ...properties });
    trackMetric('proposal_generation_duration_ms', duration, properties);
  },

  /**
   * 追蹤搜索查詢
   */
  async trackSearchQuery(
    query: string,
    resultCount: number,
    duration: number,
    properties?: Record<string, any>
  ): Promise<void> {
    await trackEvent('SearchQuery', {
      query,
      resultCount,
      duration,
      hasResults: resultCount > 0,
      ...properties,
    });

    trackMetric('search_queries_total', 1, properties);
    trackMetric('search_duration_ms', duration, properties);
    trackMetric('search_results_count', resultCount, properties);
  },

  /**
   * 追蹤知識庫文檔查看
   */
  async trackDocumentView(
    documentId: string,
    userId: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await trackEvent('DocumentView', { documentId, userId, ...properties });
    trackMetric('document_views_total', 1, properties);
  },

  /**
   * 追蹤 AI 調用
   */
  async trackAICall(
    model: string,
    tokenCount: number,
    duration: number,
    success: boolean,
    properties?: Record<string, any>
  ): Promise<void> {
    await trackEvent('AICall', {
      model,
      tokenCount,
      duration,
      success,
      ...properties,
    });

    trackMetric('ai_calls_total', 1, { model, success, ...properties });
    trackMetric('ai_tokens_used', tokenCount, { model, ...properties });
    trackMetric('ai_call_duration_ms', duration, { model, ...properties });
  },
};

// ==================== 輔助函數 ====================

/**
 * 創建帶追蹤的函數包裝器
 * 自動追蹤函數執行時間和成功/失敗狀態
 */
export function withTelemetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const tracer = getTracer();
    const span = tracer.startSpan(operationName);
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      span.setAttribute('duration', duration);
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      span.setAttribute('duration', duration);
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    } finally {
      span.end();
    }
  }) as T;
}
```

---

## 🔧 配置文件：切換後端只需改這裡

### 文件: `lib/monitoring/config.ts`

```typescript
/**
 * 監控系統配置
 *
 * 通過環境變數控制使用哪個監控後端
 * MONITORING_BACKEND=prometheus (開發)
 * MONITORING_BACKEND=azure (生產)
 */

export type MonitoringBackend = 'prometheus' | 'azure' | 'jaeger' | 'console';

export interface MonitoringConfig {
  backend: MonitoringBackend;
  serviceName: string;

  // Prometheus 配置
  prometheus?: {
    port: number;
    endpoint: string;
  };

  // Azure Monitor 配置
  azure?: {
    connectionString: string;
    samplingRate: number;
  };

  // Jaeger 配置
  jaeger?: {
    endpoint: string;
  };
}

/**
 * 從環境變數讀取監控配置
 */
export function getMonitoringConfig(): MonitoringConfig {
  const backend = (process.env.MONITORING_BACKEND || 'prometheus') as MonitoringBackend;

  return {
    backend,
    serviceName: process.env.SERVICE_NAME || 'ai-sales-platform',

    prometheus: {
      port: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
    },

    azure: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
      samplingRate: parseFloat(process.env.AZURE_SAMPLING_RATE || '1.0'),
    },

    jaeger: {
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    },
  };
}
```

---

## 🚀 後端切換實現

### 文件: `lib/monitoring/backend-factory.ts`

```typescript
/**
 * 監控後端工廠
 * 根據配置動態加載對應的 OpenTelemetry Exporter
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getMonitoringConfig, MonitoringBackend } from './config';

/**
 * 創建 OpenTelemetry SDK 實例
 * 根據配置選擇對應的 Exporter
 */
export function createTelemetrySDK(): NodeSDK | null {
  const config = getMonitoringConfig();

  console.log(`📊 Initializing telemetry with backend: ${config.backend}`);

  // 開發環境且沒有配置監控後端，跳過初始化
  if (process.env.NODE_ENV === 'development' && !process.env.MONITORING_BACKEND) {
    console.log('⏭️ Skipping telemetry in development (set MONITORING_BACKEND to enable)');
    return null;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
  });

  switch (config.backend) {
    case 'prometheus':
      return createPrometheusSDK(resource, config);

    case 'azure':
      return createAzureSDK(resource, config);

    case 'jaeger':
      return createJaegerSDK(resource, config);

    case 'console':
      return createConsoleSDK(resource, config);

    default:
      console.warn(`⚠️ Unknown monitoring backend: ${config.backend}`);
      return null;
  }
}

/**
 * Prometheus 後端（開發階段）
 */
function createPrometheusSDK(resource: Resource, config: any): NodeSDK {
  const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

  const metricReader = new PrometheusExporter({
    port: config.prometheus.port,
    endpoint: config.prometheus.endpoint,
  });

  console.log(`✅ Prometheus exporter listening on :${config.prometheus.port}${config.prometheus.endpoint}`);

  return new NodeSDK({
    resource,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
}

/**
 * Azure Monitor 後端（生產階段）
 */
function createAzureSDK(resource: Resource, config: any): NodeSDK {
  const { AzureMonitorTraceExporter } = require('@azure/monitor-opentelemetry-exporter');
  const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

  if (!config.azure.connectionString) {
    throw new Error('APPLICATIONINSIGHTS_CONNECTION_STRING is required for Azure backend');
  }

  const traceExporter = new AzureMonitorTraceExporter({
    connectionString: config.azure.connectionString,
  });

  console.log(`✅ Azure Monitor configured (sampling: ${config.azure.samplingRate * 100}%)`);

  return new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
}

/**
 * Jaeger 後端（追蹤專用）
 */
function createJaegerSDK(resource: Resource, config: any): NodeSDK {
  const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
  const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

  const traceExporter = new JaegerExporter({
    endpoint: config.jaeger.endpoint,
  });

  console.log(`✅ Jaeger exporter configured: ${config.jaeger.endpoint}`);

  return new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
}

/**
 * Console 後端（調試用）
 */
function createConsoleSDK(resource: Resource, config: any): NodeSDK {
  const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
  const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

  console.log(`✅ Console exporter enabled (debug mode)`);

  return new NodeSDK({
    resource,
    spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
}
```

---

## 🔄 遷移步驟（未來生產環境）

### **從 Prometheus 切換到 Azure Monitor**

**所需時間**: **5-10 分鐘** ⏱️

**步驟 1**: 修改環境變數（`.env.production`）

```bash
# 改前（開發環境）
MONITORING_BACKEND=prometheus
PROMETHEUS_PORT=9464

# 改後（生產環境）
MONITORING_BACKEND=azure
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;..."
AZURE_SAMPLING_RATE=0.5  # 50% 採樣降低成本
```

**步驟 2**: 安裝 Azure Monitor Exporter（如果還沒安裝）

```bash
npm install @azure/monitor-opentelemetry-exporter
```

**步驟 3**: 重新部署應用

```bash
npm run build
# 部署到生產環境
```

**就這樣！** ✅ 無需修改任何應用代碼

---

## 📊 遷移成本總結

| 項目 | Prometheus 方案 | 傳統方案 |
|------|----------------|----------|
| **代碼改動** | 0 行 | 2000+ 行 |
| **配置改動** | 2-3 個環境變數 | 大量配置重寫 |
| **測試工作** | 煙霧測試（1小時） | 完整回歸測試（2-3天） |
| **風險** | 極低 | 高 |
| **時間成本** | 5-10 分鐘 | 3-5 天 |

---

## ✅ 總結

使用 OpenTelemetry 標準架構：

1. ✅ **開發階段**: Prometheus + Grafana（零成本）
2. ✅ **生產階段**: 切換到 Azure Monitor（只改配置）
3. ✅ **遷移成本**: 接近零（5-10 分鐘配置變更）

**建議**: 立即採用此方案，既節省開發成本，又保留未來彈性！
