/**
 * @fileoverview 監控中間件自動追蹤 API 請求的性能和狀態
 * @module lib/monitoring/middleware
 * @description
 * 監控中間件自動追蹤 API 請求的性能和狀態
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { BusinessMetrics, withSpan, recordException } from './telemetry';

/**
 * API 監控中間件
 * 追蹤所有 API 請求的性能指標
 */
export async function monitoringMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = request.method;
  const pathname = new URL(request.url).pathname;

  // 獲取請求大小（估算）
  const requestSize = request.headers.get('content-length')
    ? parseInt(request.headers.get('content-length')!, 10)
    : 0;

  let response: NextResponse;
  let status = 500;
  let responseSize = 0;

  try {
    // 在 span 上下文中執行請求處理
    response = await withSpan(
      `HTTP ${method} ${pathname}`,
      async (span) => {
        span.setAttribute('http.method', method);
        span.setAttribute('http.url', request.url);
        span.setAttribute('http.route', pathname);

        // 執行實際的請求處理
        const result = await handler();

        // 記錄響應狀態
        status = result.status;
        span.setAttribute('http.status_code', status);

        // 獲取響應大小（如果可用）
        const contentLength = result.headers.get('content-length');
        if (contentLength) {
          responseSize = parseInt(contentLength, 10);
          span.setAttribute('http.response_size', responseSize);
        }

        return result;
      },
      {
        'http.method': method,
        'http.route': pathname,
      }
    );
  } catch (error) {
    status = 500;
    recordException(error as Error);
    throw error;
  } finally {
    // 計算響應時間
    const duration = (Date.now() - startTime) / 1000; // 轉換為秒

    // 追蹤 HTTP 指標
    BusinessMetrics.trackHTTPRequest(method, pathname, status, duration, requestSize, responseSize);
  }

  return response;
}

/**
 * 監控裝飾器
 * 用於包裝 API 路由處理器
 */
export function withMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    return monitoringMiddleware(request, () => handler(request));
  };
}

/**
 * 使用範例:
 *
 * // 在 API 路由中使用
 * import { withMonitoring } from '@/lib/monitoring/middleware';
 *
 * async function GET(request: NextRequest) {
 *   // 你的 API 邏輯
 *   return NextResponse.json({ data: 'Hello' });
 * }
 *
 * export const GET = withMonitoring(GET);
 */
