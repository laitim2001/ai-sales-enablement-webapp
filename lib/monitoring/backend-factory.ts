/**
 * @fileoverview OpenTelemetry 後端工廠根據配置動態創建不同的監控後端
 * @module lib/monitoring/backend-factory
 * @description
 * OpenTelemetry 後端工廠根據配置動態創建不同的監控後端
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ConsoleSpanExporter, ConsoleMetricExporter } from '@opentelemetry/sdk-trace-base';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { getInstrumentation } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

import { getMonitoringConfig, MonitoringConfig, printMonitoringConfig } from './config';

/**
 * 創建 OpenTelemetry 資源
 */
function createResource(serviceName: string, environment: string): Resource {
  return new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
  });
}

/**
 * 創建 Prometheus 後端
 */
function createPrometheusSDK(resource: Resource, config: MonitoringConfig): NodeSDK {
  console.log(`[Monitoring] Initializing Prometheus backend on port ${config.prometheus.port}`);

  const prometheusExporter = new PrometheusExporter({
    port: config.prometheus.port,
    endpoint: config.prometheus.endpoint,
  });

  return new NodeSDK({
    resource,
    metricReader: prometheusExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });
}

/**
 * 創建 Azure Application Insights 後端
 */
function createAzureSDK(resource: Resource, config: MonitoringConfig): NodeSDK {
  console.log('[Monitoring] Initializing Azure Application Insights backend');

  if (!config.azure.connectionString) {
    throw new Error('Azure Application Insights connection string is required');
  }

  const azureExporter = new AzureMonitorTraceExporter({
    connectionString: config.azure.connectionString,
  });

  return new NodeSDK({
    resource,
    traceExporter: azureExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
    // 配置採樣率
    sampler: config.azure.samplingRate < 1
      ? {
          shouldSample: () => Math.random() < config.azure.samplingRate
            ? { decision: 1 } // RecordAndSample
            : { decision: 0 }, // Drop
          toString: () => `AzureSampler(${config.azure.samplingRate})`,
        }
      : undefined,
  });
}

/**
 * 創建 Jaeger 後端
 */
function createJaegerSDK(resource: Resource, config: MonitoringConfig): NodeSDK {
  console.log(`[Monitoring] Initializing Jaeger backend at ${config.jaeger.endpoint}`);

  const jaegerExporter = new JaegerExporter({
    endpoint: config.jaeger.endpoint,
    host: config.jaeger.agentHost,
    port: config.jaeger.agentPort,
  });

  return new NodeSDK({
    resource,
    traceExporter: jaegerExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });
}

/**
 * 創建 Console 後端（開發用）
 */
function createConsoleSDK(resource: Resource, config: MonitoringConfig): NodeSDK {
  console.log('[Monitoring] Initializing Console backend (development only)');

  return new NodeSDK({
    resource,
    traceExporter: new ConsoleSpanExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 60000, // 每分鐘輸出一次
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });
}

/**
 * 創建 OpenTelemetry SDK
 */
export function createTelemetrySDK(): NodeSDK | null {
  try {
    const config = getMonitoringConfig();
    printMonitoringConfig(config);

    const resource = createResource(config.serviceName, config.environment);

    let sdk: NodeSDK;

    switch (config.backend) {
      case 'prometheus':
        sdk = createPrometheusSDK(resource, config);
        break;

      case 'azure':
        sdk = createAzureSDK(resource, config);
        break;

      case 'jaeger':
        sdk = createJaegerSDK(resource, config);
        break;

      case 'console':
        sdk = createConsoleSDK(resource, config);
        break;

      default:
        console.warn(`[Monitoring] Unknown backend: ${config.backend}, using console backend`);
        sdk = createConsoleSDK(resource, config);
    }

    console.log(`[Monitoring] Successfully initialized ${config.backend} backend`);
    return sdk;
  } catch (error) {
    console.error('[Monitoring] Failed to initialize telemetry SDK:', error);
    return null;
  }
}

/**
 * 啟動監控
 */
export async function startTelemetry(): Promise<NodeSDK | null> {
  const sdk = createTelemetrySDK();

  if (sdk) {
    try {
      await sdk.start();
      console.log('[Monitoring] Telemetry SDK started successfully');

      // 確保在應用關閉時正確清理
      process.on('SIGTERM', async () => {
        console.log('[Monitoring] SIGTERM received, shutting down telemetry...');
        await sdk.shutdown();
        console.log('[Monitoring] Telemetry SDK shut down successfully');
      });

      return sdk;
    } catch (error) {
      console.error('[Monitoring] Failed to start telemetry SDK:', error);
      return null;
    }
  }

  return null;
}

/**
 * 停止監控
 */
export async function stopTelemetry(sdk: NodeSDK): Promise<void> {
  try {
    await sdk.shutdown();
    console.log('[Monitoring] Telemetry SDK stopped successfully');
  } catch (error) {
    console.error('[Monitoring] Failed to stop telemetry SDK:', error);
  }
}
