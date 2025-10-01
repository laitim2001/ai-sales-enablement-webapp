/**
 * 統一監控抽象層
 * 使用 OpenTelemetry 標準 API
 * 支持切換到任何 OpenTelemetry 兼容的後端（Prometheus / Azure Monitor / Jaeger）
 */

import { trace, metrics, context, SpanStatusCode, Span, Context } from '@opentelemetry/api';
import type { Meter, Counter, Histogram } from '@opentelemetry/api';

// Global telemetry instances
let globalTracer: ReturnType<typeof trace.getTracer> | null = null;
let globalMeter: Meter | null = null;

// Business metrics collectors
let metricsCollectors: {
  // HTTP Metrics
  httpRequestsTotal?: Counter;
  httpRequestDuration?: Histogram;
  httpRequestSize?: Histogram;
  httpResponseSize?: Histogram;

  // User Metrics
  userRegistrations?: Counter;
  userLogins?: Counter;
  userActivity?: Counter;

  // AI Service Metrics
  aiServiceCalls?: Counter;
  aiServiceResponseTime?: Histogram;
  aiTokensUsed?: Counter;

  // Knowledge Base Metrics
  knowledgeBaseSearches?: Counter;

  // Dynamics 365 Sync Metrics
  dynamicsSyncOperations?: Counter;

  // Document Processing Metrics
  documentUploads?: Counter;
  documentProcessingComplete?: Counter;

  // Database Metrics
  databaseQueryDuration?: Histogram;
  databaseConnectionPool?: Histogram;
  databaseConnectionErrors?: Counter;

  // Cache Metrics
  cacheHits?: Counter;
  cacheRequests?: Counter;

  // Feature Usage Metrics
  featureUsage?: Counter;

  // Customer Engagement Metrics
  customerEngagementScore?: Histogram;

  // WebSocket Metrics
  websocketConnections?: Histogram;
} = {};

/**
 * Initialize telemetry with service name
 */
export function initializeTelemetry(serviceName: string = 'ai-sales-platform'): void {
  globalTracer = trace.getTracer(serviceName);
  globalMeter = metrics.getMeter(serviceName);

  // Initialize all metric collectors
  initializeMetrics();
}

/**
 * Initialize all business metrics
 */
function initializeMetrics(): void {
  if (!globalMeter) return;

  // HTTP Metrics
  metricsCollectors.httpRequestsTotal = globalMeter.createCounter('http_requests_total', {
    description: 'Total HTTP requests',
  });

  metricsCollectors.httpRequestDuration = globalMeter.createHistogram('http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
    unit: 's',
  });

  metricsCollectors.httpRequestSize = globalMeter.createHistogram('http_request_size_bytes', {
    description: 'HTTP request size in bytes',
    unit: 'bytes',
  });

  metricsCollectors.httpResponseSize = globalMeter.createHistogram('http_response_size_bytes', {
    description: 'HTTP response size in bytes',
    unit: 'bytes',
  });

  // User Metrics
  metricsCollectors.userRegistrations = globalMeter.createCounter('user_registrations_total', {
    description: 'Total user registrations',
  });

  metricsCollectors.userLogins = globalMeter.createCounter('user_logins_total', {
    description: 'Total user logins',
  });

  metricsCollectors.userActivity = globalMeter.createCounter('user_activity_total', {
    description: 'Total user activity events',
  });

  // AI Service Metrics
  metricsCollectors.aiServiceCalls = globalMeter.createCounter('ai_service_calls_total', {
    description: 'Total AI service calls',
  });

  metricsCollectors.aiServiceResponseTime = globalMeter.createHistogram('ai_service_response_time_seconds', {
    description: 'AI service response time in seconds',
    unit: 's',
  });

  metricsCollectors.aiTokensUsed = globalMeter.createCounter('ai_tokens_used_total', {
    description: 'Total AI tokens used',
  });

  // Knowledge Base Metrics
  metricsCollectors.knowledgeBaseSearches = globalMeter.createCounter('knowledge_base_searches_total', {
    description: 'Total knowledge base searches',
  });

  // Dynamics 365 Sync Metrics
  metricsCollectors.dynamicsSyncOperations = globalMeter.createCounter('dynamics_sync_operations_total', {
    description: 'Total Dynamics 365 sync operations',
  });

  // Document Processing Metrics
  metricsCollectors.documentUploads = globalMeter.createCounter('document_uploads_total', {
    description: 'Total document uploads',
  });

  metricsCollectors.documentProcessingComplete = globalMeter.createCounter('document_processing_complete_total', {
    description: 'Total document processing completions',
  });

  // Database Metrics
  metricsCollectors.databaseQueryDuration = globalMeter.createHistogram('database_query_duration_seconds', {
    description: 'Database query duration in seconds',
    unit: 's',
  });

  metricsCollectors.databaseConnectionPool = globalMeter.createHistogram('database_connection_pool_active', {
    description: 'Active database connections',
  });

  metricsCollectors.databaseConnectionErrors = globalMeter.createCounter('database_connection_errors_total', {
    description: 'Total database connection errors',
  });

  // Cache Metrics
  metricsCollectors.cacheHits = globalMeter.createCounter('cache_hits_total', {
    description: 'Total cache hits',
  });

  metricsCollectors.cacheRequests = globalMeter.createCounter('cache_requests_total', {
    description: 'Total cache requests',
  });

  // Feature Usage Metrics
  metricsCollectors.featureUsage = globalMeter.createCounter('feature_usage_total', {
    description: 'Total feature usage events',
  });

  // Customer Engagement Metrics
  metricsCollectors.customerEngagementScore = globalMeter.createHistogram('customer_engagement_score', {
    description: 'Customer engagement score',
  });

  // WebSocket Metrics
  metricsCollectors.websocketConnections = globalMeter.createHistogram('websocket_connections_active', {
    description: 'Active WebSocket connections',
  });
}

/**
 * Get tracer instance
 */
export function getTracer() {
  if (!globalTracer) {
    throw new Error('Telemetry not initialized. Call initializeTelemetry() first.');
  }
  return globalTracer;
}

/**
 * Get meter instance
 */
export function getMeter() {
  if (!globalMeter) {
    throw new Error('Telemetry not initialized. Call initializeTelemetry() first.');
  }
  return globalMeter;
}

/**
 * Track an event with automatic span creation
 */
export async function trackEvent<T>(
  eventName: string,
  properties?: Record<string, any>,
  callback?: () => Promise<T>
): Promise<T | void> {
  const tracer = getTracer();
  const span = tracer.startSpan(eventName);

  try {
    // Add properties as span attributes
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        span.setAttribute(key, String(value));
      });
    }

    // Execute callback if provided
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
 * Track a metric value
 */
export function trackMetric(
  metricName: string,
  value: number,
  properties?: Record<string, any>
): void {
  // Metric tracking is handled by the collectors above
  // This is a convenience function for custom metrics
  const meter = getMeter();
  const counter = meter.createCounter(metricName);
  counter.add(value, properties);
}

/**
 * Business Metrics Tracking API
 */
export const BusinessMetrics = {
  // User Metrics
  async trackUserRegistration(userId: string, properties?: Record<string, any>) {
    await trackEvent('UserRegistration', { userId, ...properties });
    metricsCollectors.userRegistrations?.add(1, { ...properties });
  },

  async trackUserLogin(userId: string, status: 'success' | 'failed', properties?: Record<string, any>) {
    await trackEvent('UserLogin', { userId, status, ...properties });
    metricsCollectors.userLogins?.add(1, { status, ...properties });
  },

  async trackUserActivity(userId: string, activityType: string, properties?: Record<string, any>) {
    await trackEvent('UserActivity', { userId, activityType, ...properties });
    metricsCollectors.userActivity?.add(1, { activityType, ...properties });
  },

  // AI Service Metrics
  async trackAIServiceCall(
    featureType: string,
    status: 'success' | 'error',
    responseTime: number,
    tokensUsed: number,
    properties?: Record<string, any>
  ) {
    await trackEvent('AIServiceCall', { featureType, status, responseTime, tokensUsed, ...properties });
    metricsCollectors.aiServiceCalls?.add(1, { feature_type: featureType, status, ...properties });
    metricsCollectors.aiServiceResponseTime?.record(responseTime, { feature_type: featureType, ...properties });
    metricsCollectors.aiTokensUsed?.add(tokensUsed, { feature_type: featureType, ...properties });
  },

  // Knowledge Base Metrics
  async trackKnowledgeBaseSearch(
    query: string,
    hasResults: boolean,
    resultCount: number,
    properties?: Record<string, any>
  ) {
    await trackEvent('KnowledgeBaseSearch', { query, hasResults, resultCount, ...properties });
    metricsCollectors.knowledgeBaseSearches?.add(1, { has_results: String(hasResults), ...properties });
  },

  // Dynamics 365 Sync Metrics
  async trackDynamicsSync(
    operationType: string,
    status: 'success' | 'failed',
    recordCount: number,
    properties?: Record<string, any>
  ) {
    await trackEvent('DynamicsSync', { operationType, status, recordCount, ...properties });
    metricsCollectors.dynamicsSyncOperations?.add(1, { operation_type: operationType, status, ...properties });
  },

  // Document Processing Metrics
  async trackDocumentUpload(
    documentType: string,
    fileSize: number,
    properties?: Record<string, any>
  ) {
    await trackEvent('DocumentUpload', { documentType, fileSize, ...properties });
    metricsCollectors.documentUploads?.add(1, { document_type: documentType, ...properties });
  },

  async trackDocumentProcessingComplete(
    documentId: string,
    processingTime: number,
    properties?: Record<string, any>
  ) {
    await trackEvent('DocumentProcessingComplete', { documentId, processingTime, ...properties });
    metricsCollectors.documentProcessingComplete?.add(1, { ...properties });
  },

  // Database Metrics
  trackDatabaseQuery(queryType: string, duration: number, properties?: Record<string, any>) {
    metricsCollectors.databaseQueryDuration?.record(duration, { query_type: queryType, ...properties });
  },

  trackDatabaseConnectionPoolStatus(active: number, idle: number, max: number) {
    metricsCollectors.databaseConnectionPool?.record(active, { type: 'active' });
    metricsCollectors.databaseConnectionPool?.record(idle, { type: 'idle' });
    metricsCollectors.databaseConnectionPool?.record(max, { type: 'max' });
  },

  trackDatabaseConnectionError(errorType: string) {
    metricsCollectors.databaseConnectionErrors?.add(1, { error_type: errorType });
  },

  // Cache Metrics
  trackCacheAccess(hit: boolean, cacheKey: string) {
    metricsCollectors.cacheRequests?.add(1, { cache_key: cacheKey });
    if (hit) {
      metricsCollectors.cacheHits?.add(1, { cache_key: cacheKey });
    }
  },

  // Feature Usage Metrics
  async trackFeatureUsage(featureName: string, userId: string, properties?: Record<string, any>) {
    await trackEvent('FeatureUsage', { featureName, userId, ...properties });
    metricsCollectors.featureUsage?.add(1, { feature_name: featureName, ...properties });
  },

  // Customer Engagement Metrics
  trackCustomerEngagement(score: number, customerId: string) {
    metricsCollectors.customerEngagementScore?.record(score, { customer_id: customerId });
  },

  // HTTP Metrics (typically called by middleware)
  trackHTTPRequest(
    method: string,
    route: string,
    status: number,
    duration: number,
    requestSize: number,
    responseSize: number
  ) {
    const statusLabel = String(status);
    metricsCollectors.httpRequestsTotal?.add(1, { method, route, status: statusLabel });
    metricsCollectors.httpRequestDuration?.record(duration, { method, route, status: statusLabel });
    metricsCollectors.httpRequestSize?.record(requestSize, { method, route });
    metricsCollectors.httpResponseSize?.record(responseSize, { method, route });
  },

  // WebSocket Metrics
  trackWebSocketConnection(connectionCount: number) {
    metricsCollectors.websocketConnections?.record(connectionCount);
  },
};

/**
 * Create a new span for distributed tracing
 */
export function startSpan(name: string, attributes?: Record<string, any>): Span {
  const tracer = getTracer();
  const span = tracer.startSpan(name);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, String(value));
    });
  }

  return span;
}

/**
 * Execute a function within a span context
 */
export async function withSpan<T>(
  name: string,
  callback: (span: Span) => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  const span = startSpan(name, attributes);

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => callback(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
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
 * Get current span context
 */
export function getCurrentSpan(): Span | undefined {
  return trace.getSpan(context.active());
}

/**
 * Set span attribute on current span
 */
export function setSpanAttribute(key: string, value: string | number | boolean): void {
  const span = getCurrentSpan();
  if (span) {
    span.setAttribute(key, String(value));
  }
}

/**
 * Record an exception in the current span
 */
export function recordException(error: Error): void {
  const span = getCurrentSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  }
}
