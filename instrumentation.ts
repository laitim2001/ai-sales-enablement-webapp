/**
 * @fileoverview Next.js Instrumentation Hook在應用啟動時自動初始化 OpenTelemetry此文件由 Next.js 自動加載，無需手動導入詳見: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @module instrumentation
 * @description
 * Next.js Instrumentation Hook在應用啟動時自動初始化 OpenTelemetry此文件由 Next.js 自動加載，無需手動導入詳見: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

export async function register() {
  // 只在 Node.js 環境中運行（不在 Edge Runtime）
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelemetry } = await import('./lib/monitoring/backend-factory');
    const { initializeTelemetry } = await import('./lib/monitoring/telemetry');

    // 啟動 OpenTelemetry SDK
    const sdk = await startTelemetry();

    if (sdk) {
      // 初始化業務監控抽象層
      initializeTelemetry(process.env.SERVICE_NAME || 'ai-sales-platform');

      console.log('[Instrumentation] OpenTelemetry initialized successfully');
    } else {
      console.warn('[Instrumentation] Failed to initialize OpenTelemetry');
    }
  }
}
