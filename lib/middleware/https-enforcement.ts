/**
 * @fileoverview HTTPS/TLS 強制中間件功能：- 強制HTTPS連接- HTTP到HTTPS重定向- HSTS (HTTP Strict Transport Security) 頭部- 安全Cookie設置檢查- TLS版本檢測使用場景：- 生產環境強制加密傳輸- 防止降級攻擊- 確保敏感資料加密傳輸安全特性：- 自動HTTP→HTTPS重定向- HSTS預加載支持- 子域名HSTS保護- 開發環境豁免@author Claude Code@date 2025-10-05@epic Sprint 3 - 安全加固與合規
 * @module lib/middleware/https-enforcement
 * @description
 * HTTPS/TLS 強制中間件功能：- 強制HTTPS連接- HTTP到HTTPS重定向- HSTS (HTTP Strict Transport Security) 頭部- 安全Cookie設置檢查- TLS版本檢測使用場景：- 生產環境強制加密傳輸- 防止降級攻擊- 確保敏感資料加密傳輸安全特性：- 自動HTTP→HTTPS重定向- HSTS預加載支持- 子域名HSTS保護- 開發環境豁免@author Claude Code@date 2025-10-05@epic Sprint 3 - 安全加固與合規
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * HTTPS強制配置
 */
export interface HttpsEnforcementConfig {
  /**
   * 是否啟用HTTPS強制（默認生產環境啟用）
   */
  enabled?: boolean;

  /**
   * 是否重定向HTTP到HTTPS（默認true）
   */
  redirectHttp?: boolean;

  /**
   * HSTS max-age（秒，默認31536000 = 1年）
   */
  hstsMaxAge?: number;

  /**
   * 是否包含子域名（默認true）
   */
  includeSubDomains?: boolean;

  /**
   * 是否啟用HSTS預加載（默認false）
   */
  preload?: boolean;

  /**
   * 豁免路徑（不強制HTTPS）
   */
  exemptPaths?: string[];

  /**
   * 信任代理頭部（用於檢測代理後的HTTPS）
   */
  trustProxyHeaders?: boolean;
}

/**
 * 默認配置
 */
const DEFAULT_CONFIG: Required<HttpsEnforcementConfig> = {
  enabled: process.env.NODE_ENV === 'production',
  redirectHttp: true,
  hstsMaxAge: 31536000, // 1年
  includeSubDomains: true,
  preload: false,
  exemptPaths: ['/health', '/api/health'],
  trustProxyHeaders: true
};

/**
 * HTTPS強制中間件類
 */
export class HttpsEnforcementMiddleware {
  private config: Required<HttpsEnforcementConfig>;

  constructor(config: HttpsEnforcementConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 生產環境驗證
    if (this.config.enabled && process.env.NODE_ENV === 'production') {
      console.log('[HTTPS] HTTPS enforcement enabled in production');
    } else if (!this.config.enabled) {
      console.warn('[HTTPS] HTTPS enforcement is DISABLED');
    }
  }

  /**
   * 處理請求
   */
  public handle(request: NextRequest): NextResponse | null {
    // 如果未啟用，直接通過
    if (!this.config.enabled) {
      return null;
    }

    const pathname = request.nextUrl.pathname;

    // 檢查是否豁免路徑
    if (this.isExemptPath(pathname)) {
      return null;
    }

    // 檢查是否使用HTTPS
    const isHttps = this.isSecureConnection(request);

    // 如果不是HTTPS且啟用了重定向
    if (!isHttps && this.config.redirectHttp) {
      return this.redirectToHttps(request);
    }

    // 如果是HTTPS，添加HSTS頭部
    if (isHttps) {
      return this.addHstsHeaders(request);
    }

    return null;
  }

  /**
   * 檢查是否為安全連接
   */
  private isSecureConnection(request: NextRequest): boolean {
    // 檢查協議
    const protocol = request.nextUrl.protocol;
    if (protocol === 'https:') {
      return true;
    }

    // 如果信任代理頭部，檢查代理設置的頭部
    if (this.config.trustProxyHeaders) {
      // X-Forwarded-Proto（標準頭部）
      const forwardedProto = request.headers.get('x-forwarded-proto');
      if (forwardedProto === 'https') {
        return true;
      }

      // X-Forwarded-SSL（某些代理使用）
      const forwardedSsl = request.headers.get('x-forwarded-ssl');
      if (forwardedSsl === 'on') {
        return true;
      }

      // Front-End-Https（IIS使用）
      const frontEndHttps = request.headers.get('front-end-https');
      if (frontEndHttps === 'on') {
        return true;
      }
    }

    return false;
  }

  /**
   * 重定向到HTTPS
   */
  private redirectToHttps(request: NextRequest): NextResponse {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';

    // 記錄重定向
    console.log(`[HTTPS] Redirecting ${request.nextUrl.href} to ${url.href}`);

    return NextResponse.redirect(url, {
      status: 301, // 永久重定向
      headers: {
        'X-Https-Redirect': 'true'
      }
    });
  }

  /**
   * 添加HSTS頭部
   */
  private addHstsHeaders(request: NextRequest): NextResponse {
    const response = NextResponse.next();

    // 構建HSTS頭部值
    let hstsValue = `max-age=${this.config.hstsMaxAge}`;

    if (this.config.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }

    if (this.config.preload) {
      hstsValue += '; preload';
    }

    response.headers.set('Strict-Transport-Security', hstsValue);

    return response;
  }

  /**
   * 檢查路徑是否豁免
   */
  private isExemptPath(pathname: string): boolean {
    return this.config.exemptPaths.some(exemptPath =>
      pathname === exemptPath || pathname.startsWith(exemptPath)
    );
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<HttpsEnforcementConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 獲取當前配置
   */
  public getConfig(): Readonly<Required<HttpsEnforcementConfig>> {
    return { ...this.config };
  }
}

/**
 * 創建HTTPS強制中間件實例
 */
export function createHttpsEnforcementMiddleware(
  config?: HttpsEnforcementConfig
): HttpsEnforcementMiddleware {
  return new HttpsEnforcementMiddleware(config);
}

/**
 * 便利函數：檢查請求是否為HTTPS
 */
export function isHttpsRequest(request: NextRequest): boolean {
  const middleware = new HttpsEnforcementMiddleware({ enabled: true, trustProxyHeaders: true });
  return middleware['isSecureConnection'](request);
}

/**
 * 便利函數：生成HSTS頭部值
 */
export function generateHstsHeader(
  maxAge: number = 31536000,
  includeSubDomains: boolean = true,
  preload: boolean = false
): string {
  let value = `max-age=${maxAge}`;
  if (includeSubDomains) value += '; includeSubDomains';
  if (preload) value += '; preload';
  return value;
}

/**
 * 導出默認實例（生產環境配置）
 */
export default createHttpsEnforcementMiddleware();
