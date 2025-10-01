/**
 * 監控配置管理
 * 支持通過環境變數切換監控後端
 */

export type MonitoringBackend = 'prometheus' | 'azure' | 'jaeger' | 'console';

export interface MonitoringConfig {
  backend: MonitoringBackend;
  serviceName: string;
  environment: string;

  // Prometheus 配置
  prometheus: {
    port: number;
    endpoint: string;
  };

  // Azure Application Insights 配置
  azure: {
    connectionString: string;
    samplingRate: number;
    enableLiveMetrics: boolean;
  };

  // Jaeger 配置
  jaeger: {
    endpoint: string;
    agentHost: string;
    agentPort: number;
  };

  // Console 配置（開發用）
  console: {
    enabled: boolean;
  };
}

/**
 * 獲取監控配置
 */
export function getMonitoringConfig(): MonitoringConfig {
  const backend = (process.env.MONITORING_BACKEND || 'prometheus') as MonitoringBackend;
  const environment = process.env.NODE_ENV || 'development';

  return {
    backend,
    serviceName: process.env.SERVICE_NAME || 'ai-sales-platform',
    environment,

    prometheus: {
      port: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
    },

    azure: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
      samplingRate: parseFloat(process.env.AZURE_SAMPLING_RATE || '1.0'),
      enableLiveMetrics: process.env.AZURE_LIVE_METRICS === 'true',
    },

    jaeger: {
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6831', 10),
    },

    console: {
      enabled: process.env.CONSOLE_TELEMETRY === 'true' || environment === 'development',
    },
  };
}

/**
 * 驗證配置
 */
export function validateMonitoringConfig(config: MonitoringConfig): void {
  if (config.backend === 'azure' && !config.azure.connectionString) {
    throw new Error('Azure Application Insights connection string is required when backend is "azure"');
  }

  if (config.backend === 'prometheus' && (!config.prometheus.port || config.prometheus.port < 1 || config.prometheus.port > 65535)) {
    throw new Error('Invalid Prometheus port configuration');
  }

  if (config.backend === 'jaeger' && !config.jaeger.endpoint) {
    throw new Error('Jaeger endpoint is required when backend is "jaeger"');
  }
}

/**
 * 獲取並驗證配置
 */
export function getValidatedConfig(): MonitoringConfig {
  const config = getMonitoringConfig();
  validateMonitoringConfig(config);
  return config;
}

/**
 * 打印配置信息（隱藏敏感信息）
 */
export function printMonitoringConfig(config: MonitoringConfig): void {
  const safeConfig = {
    ...config,
    azure: {
      ...config.azure,
      connectionString: config.azure.connectionString ? '***HIDDEN***' : '',
    },
  };

  console.log('[Monitoring] Configuration:', JSON.stringify(safeConfig, null, 2));
}
