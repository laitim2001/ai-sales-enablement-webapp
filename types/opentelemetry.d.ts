/**
 * OpenTelemetry 套件的臨時類型定義
 *
 * @description 為 OpenTelemetry 相關套件提供基本類型支持
 * @note 這是臨時解決方案，實際使用時應安裝完整的 @opentelemetry/* 套件
 */

declare module '@opentelemetry/sdk-node' {
  export class NodeSDK {
    constructor(config: any)
    start(): void
    shutdown(): Promise<void>
  }
}

declare module '@opentelemetry/resources' {
  export class Resource {
    constructor(attributes: Record<string, any>)
    static default(): Resource
    merge(other: Resource): Resource
  }
}

declare module '@opentelemetry/semantic-conventions' {
  export const SemanticResourceAttributes: {
    SERVICE_NAME: string
    SERVICE_VERSION: string
    DEPLOYMENT_ENVIRONMENT: string
  }
}

declare module '@opentelemetry/exporter-prometheus' {
  export class PrometheusExporter {
    constructor(config?: any)
  }
}

declare module '@opentelemetry/exporter-jaeger' {
  export class JaegerExporter {
    constructor(config?: any)
  }
}

declare module '@opentelemetry/sdk-trace-base' {
  export class BatchSpanProcessor {
    constructor(exporter: any)
  }
  export class ConsoleSpanExporter {
    constructor()
  }
  export class ConsoleMetricExporter {
    constructor()
  }
}

declare module '@opentelemetry/sdk-metrics' {
  export class PeriodicExportingMetricReader {
    constructor(config: any)
  }
  export class MeterProvider {
    constructor(config?: any)
  }
}

declare module '@azure/monitor-opentelemetry-exporter' {
  export class AzureMonitorTraceExporter {
    constructor(config: any)
  }
  export class AzureMonitorMetricExporter {
    constructor(config: any)
  }
}

declare module '@opentelemetry/instrumentation' {
  export function registerInstrumentations(config: any): void
  export function getInstrumentation(name: string): any
}

declare module '@opentelemetry/instrumentation-http' {
  export class HttpInstrumentation {
    constructor(config?: any)
  }
}

declare module '@opentelemetry/instrumentation-express' {
  export class ExpressInstrumentation {
    constructor(config?: any)
  }
}

declare module '@opentelemetry/instrumentation-pg' {
  export class PgInstrumentation {
    constructor(config?: any)
  }
}

declare module '@opentelemetry/api' {
  export interface Meter {
    createCounter(name: string, options?: any): Counter
    createHistogram(name: string, options?: any): Histogram
    createUpDownCounter(name: string, options?: any): UpDownCounter
  }

  export interface Counter {
    add(value: number, attributes?: any): void
  }

  export interface Histogram {
    record(value: number, attributes?: any): void
  }

  export interface UpDownCounter {
    add(value: number, attributes?: any): void
  }

  export interface Tracer {
    startSpan(name: string, options?: any): Span
    startActiveSpan<T>(name: string, fn: (span: Span) => T): T
  }

  export interface Span {
    end(): void
    setStatus(status: any): void
    recordException(exception: any): void
    setAttribute(key: string, value: any): void
  }

  export interface Context {
    getValue(key: symbol): any
    setValue(key: symbol, value: any): Context
    deleteValue(key: symbol): Context
  }

  export const metrics: {
    getMeter(name: string, version?: string): Meter
  }

  export const trace: {
    getTracer(name: string, version?: string): Tracer
    getSpan(context: Context): Span | undefined
    setSpan(context: Context, span: Span): Context
  }

  export const context: {
    active(): Context
    with<T>(context: Context, fn: () => T): T
  }

  export const SpanStatusCode: {
    OK: number
    ERROR: number
  }
}
