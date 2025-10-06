/**
 * ================================================================
 * AI銷售賦能平台 - API網關中間件 (middleware.ts)
 * ================================================================
 *
 * 【檔案功能】
 * Next.js全局中間件，實現完整的API網關功能層。
 * 提供請求追蹤、CORS處理、安全頭部和路由匹配。
 *
 * 【主要職責】
 * • 請求追蹤 - 為每個請求生成唯一ID
 * • CORS處理 - 跨域請求支援和預檢處理
 * • 安全頭部 - CSP、HSTS等安全策略
 * • 路由匹配 - 智能路由分發和配置
 * • 錯誤處理 - 統一的錯誤記錄和響應
 *
 * 【技術實現】
 * • Edge Runtime - 邊緣計算支援
 * • Modular Design - 模塊化中間件組合
 * • Type Safety - TypeScript類型保護
 * • Performance - 高效的路由匹配和緩存
 * • Security - OWASP推薦的安全實踐
 *
 * 【架構層次】
 * Layer 0 (HTTPS): HTTPS強制和HSTS (Sprint 3安全加固)
 * Layer 1 (Edge): 請求ID、CORS、安全頭部
 * Layer 2 (Auth): JWT、Azure AD、API Key (在lib/middleware.ts)
 * Layer 3 (Rate Limit): 多層速率限制 (在lib/middleware.ts)
 * Layer 4 (Routing): 路由匹配和分發
 * Layer 5 (Business Logic): API路由處理器
 *
 * 【相關檔案】
 * • lib/middleware/request-id.ts - 請求ID生成器
 * • lib/middleware/route-matcher.ts - 路由匹配器
 * • lib/middleware/cors.ts - CORS中間件
 * • lib/middleware/security-headers.ts - 安全頭部中間件
 * • lib/middleware/https-enforcement.ts - HTTPS強制中間件 (Sprint 3)
 * • lib/middleware/routing-config.ts - 路由配置
 * • lib/middleware.ts - 認證和速率限制中間件
 * • docs/api-gateway-architecture.md - 架構設計文檔
 *
 * 【更新記錄】
 * - MVP Phase 1: 基礎中間件和請求追蹤
 * - MVP Phase 2 Sprint 1: API網關核心架構實現
 *   - 請求ID生成系統
 *   - 路由匹配器和配置
 *   - CORS中間件
 *   - 安全頭部中間件
 * - MVP Phase 2 Sprint 3: 安全加固與合規
 *   - HTTPS強制和重定向 (Layer 0)
 *   - HSTS安全頭部設置
 *   - 代理頭部信任配置
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorContext, ErrorLogger, AppError } from '@/lib/errors'
import { getOrGenerateRequestId } from '@/lib/middleware/request-id'
import { createRouteMatcher } from '@/lib/middleware/route-matcher'
import { createCorsMiddleware } from '@/lib/middleware/cors'
import { createSecurityHeaders, SecurityPresets } from '@/lib/middleware/security-headers'
import { getRouteConfigs } from '@/lib/middleware/routing-config'
import { createHttpsEnforcementMiddleware } from '@/lib/middleware/https-enforcement'

/**
 * 初始化中間件組件
 *
 * 創建路由匹配器、CORS處理器和安全頭部處理器實例。
 * 使用環境感知配置確保開發和生產環境的正確行為。
 */
const routeMatcher = createRouteMatcher(getRouteConfigs(), {
  enableCache: true,
  cacheSize: 1000,
  caseSensitive: false
})

const corsMiddleware = createCorsMiddleware({
  // 環境感知配置將自動應用
  credentials: true,
  maxAge: 86400
})

const securityHeaders = createSecurityHeaders(
  process.env.NODE_ENV === 'production'
    ? SecurityPresets.production
    : SecurityPresets.development
)

const httpsEnforcement = createHttpsEnforcementMiddleware({
  enabled: process.env.ENABLE_HTTPS_ENFORCEMENT === 'true',
  redirectHttp: true,
  hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
  includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
  preload: process.env.HSTS_PRELOAD === 'true',
  exemptPaths: ['/health', '/api/health'],
  trustProxyHeaders: true
})

/**
 * Next.js 中間件主函數
 *
 * 實現完整的API網關Edge Layer功能。
 *
 * 處理流程:
 * 1. 生成唯一請求ID (支援客戶端ID)
 * 2. 路由匹配和配置查找
 * 3. CORS處理 (預檢請求和實際請求)
 * 4. 安全頭部應用
 * 5. 請求追蹤頭部設置
 * 6. 錯誤處理和記錄
 *
 * @param request 進入的HTTP請求
 * @returns 處理後的響應
 */
export async function middleware(request: NextRequest) {
  try {
    // ================================================================
    // Layer 0: HTTPS強制 (最高優先級,在所有其他處理之前)
    // ================================================================
    const httpsResponse = httpsEnforcement.handle(request);
    if (httpsResponse) {
      // 如果需要重定向到HTTPS或添加HSTS頭部,立即返回
      return httpsResponse;
    }

    // ================================================================
    // Layer 1: 請求ID生成
    // ================================================================
    const requestId = getOrGenerateRequestId(request, {
      strategy: process.env.NODE_ENV === 'production' ? 'uuid' : 'short',
      prefix: process.env.NODE_ENV === 'production' ? 'prod-' : 'dev-',
      acceptClientId: process.env.NODE_ENV !== 'production'
    })

    // ================================================================
    // Layer 2: 路由匹配
    // ================================================================
    const pathname = request.nextUrl.pathname
    const routeMatch = routeMatcher.match(pathname)

    // 創建基礎響應
    let response = NextResponse.next()

    // ================================================================
    // Layer 3: CORS處理
    // ================================================================
    if (pathname.startsWith('/api/')) {
      // 使用路由特定的CORS配置（如果有）
      const corsOptions = routeMatch.config?.cors
        ? {
            origins: routeMatch.config.cors.origins,
            methods: routeMatch.config.cors.methods,
            credentials: routeMatch.config.cors.credentials
          }
        : undefined

      // 應用CORS
      response = corsMiddleware.handle(request, response)

      // 如果是OPTIONS預檢請求，直接返回
      if (request.method === 'OPTIONS') {
        return response
      }
    }

    // ================================================================
    // Layer 4: 安全頭部
    // ================================================================
    response = securityHeaders.apply(response)

    // ================================================================
    // Layer 5: 請求追蹤頭部
    // ================================================================
    response.headers.set('X-Request-ID', requestId)

    // 如果匹配到路由，添加路由元數據
    if (routeMatch.matched && routeMatch.config) {
      response.headers.set('X-Route-Name', routeMatch.config.name || 'unknown')
      if (routeMatch.version) {
        response.headers.set('X-API-Version', routeMatch.version)
      }
    }

    // ================================================================
    // Layer 6: 開發環境調試信息
    // ================================================================
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Middleware-Version', '2.0.0')
      response.headers.set('X-Route-Matched', String(routeMatch.matched))
    }

    return response

  } catch (error) {
    /**
     * 中間件錯誤處理
     *
     * 采取寬鬆策略：記錄錯誤但不阻擋請求。
     */
    const context = createErrorContext(request)
    const appError = new AppError(
      'API Gateway middleware processing error',
      undefined,
      500,
      undefined,
      false,
      context,
      error instanceof Error ? error : new Error(String(error))
    )

    // 異步錯誤記錄
    ErrorLogger.log(appError).catch((logError) => {
      console.error('Failed to log middleware error:', logError)
    })

    // 繼續請求處理並標記錯誤
    const response = NextResponse.next()
    response.headers.set('X-Middleware-Error', 'true')
    response.headers.set('X-Error-Message', 'Internal middleware error')
    return response
  }
}

/**
 * 中間件配置
 *
 * 定義中間件的運行範圍和過濾規則。
 * 使用正則表達式精確控制哪些請求需要處理。
 *
 * 過濾策略:
 * - 包含: 所有一般請求和API路徑
 * - 排除: Next.js系統檔案、靜態資源、圖片檔案
 *
 * 性能考量:
 * - 減少不必要的中間件處理
 * - 提高靜態資源加載速度
 * - 降低系統資源消耗
 *
 * 注意事項:
 * - 正則表達式需要定期檢查和更新
 * - 新的靜態資源類型需要添加到排除清單
 * - 路徑變更時需要同步更新配置
 */
export const config = {
  /**
   * 路徑匹配器
   *
   * 使用負向前瞻斷言的正則表達式，匹配所有需要處理的路徑。
   *
   * 排除項目:
   * - _next/static: Next.js編譯後的靜態資源
   * - _next/image: Next.js圖片優化服務
   * - favicon.ico: 網站圖標
   * - 圖片檔案: .png, .jpg, .jpeg, .gif, .svg
   *
   * 匹配範例:
   * - ✓ /api/users (API路徑)
   * - ✓ /dashboard (頁面路徑)
   * - ✗ /_next/static/... (靜態資源)
   * - ✗ /logo.png (圖片檔案)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}