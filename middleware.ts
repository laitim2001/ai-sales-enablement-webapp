/**
 * ================================================================
 * 檔案名稱: Next.js中間件
 * 檔案用途: AI銷售賦能平台的請求處理和路由保護中間件
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. 請求ID生成 - 為每個請求自動生成唯一追蹤ID
 * 2. CORS處理 - 跨域請求支援和預檢處理
 * 3. 錯誤記錄 - 中間件級別錯誤自動記錄
 * 4. 路徑過濾 - 智能過濾靜態資源和系統檔案
 *
 * 技術特色/核心特色:
 * - 請求追蹤: 自動生成唯一請求ID用於端到端追蹤
 * - CORS安全: 支援當代網頁應用的跨域請求
 * - 錯誤復原: 中間件錯誤不會阻擋正常請求
 * - 性能優化: 智能過濾靜態資源以減少處理負擔
 * - 結構化日誌: 整合統一錯誤處理系統
 *
 * 依賴關係:
 * - Next.js 13+: 中間件系統和請求/回應處理
 * - @/lib/errors: 統一錯誤處理和記錄系統
 *
 * 注意事項:
 * - 中間件在Edge Runtime中執行，有部分API限制
 * - CORS配置需要根據實際生產環境調整
 * - 過濾規則需要定期檢查和更新
 * - 異步錯誤記錄不會影響請求性能
 *
 * 使用範例:
 * ```typescript
 * // 中間件自動為所有請求添加X-Request-ID標頭
 * fetch('/api/users', {
 *   headers: {
 *     'X-Request-ID': 'req_1234567890_abc123' // 自動添加
 *   }
 * })
 *
 * // 支援跨域請求
 * fetch('http://localhost:3000/api/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' }
 * })
 * ```
 *
 * 更新記錄:
 * - Week 1: 建立基礎中間件結構和請求ID生成
 * - Week 2: 新增CORS支援和預檢處理
 * - Week 3: 整合統一錯誤處理系統
 * - Week 4: 優化性能和過濾規則
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorContext, ErrorLogger, AppError } from '@/lib/errors'

/**
 * Next.js 中間件主函數
 *
 * 處理所有進入請求，提供跨域支援、請求追蹤
 * 和錯誤記錄功能。
 *
 * 處理流程:
 * 1. 生成唯一請求ID
 * 2. 設定基本回應標頭
 * 3. 處理API路徑的CORS配置
 * 4. 處理OPTIONS預檢請求
 * 5. 錯誤處理和記錄
 *
 * @param request 進入的HTTP請求
 * @returns 處理後的回應或修改後的請求
 */
export function middleware(request: NextRequest) {
  try {
    /**
     * 生成唯一請求ID
     *
     * 為每個請求生成唯一的追蹤ID，用於:
     * - 日誌追蹤和關聯
     * - 錯誤報告和調試
     * - 分散式系統追蹤
     * - API調用铈追蹤
     */
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    /**
     * 創建基礎回應並設定追蹤標頭
     *
     * 所有回應都會包含 X-Request-ID 標頭，
     * 方便客戶端和日誌系統追蹤。
     */
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)

    /**
     * API請求CORS處理和404攔截
     *
     * 為 API 路徑添加必要的 CORS 標頭，支援:
     * - 跨域資源共享 (CORS)
     * - 多種 HTTP 方法
     * - 自定義請求標頭
     * - 請求ID暴露給客戶端
     * - API 404 JSON 響應
     */
    if (request.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-Request-ID'
      )
      response.headers.set('Access-Control-Expose-Headers', 'X-Request-ID')

      /**
       * 處理 CORS 預檢請求
       *
       * 瀏覽器在發送跨域請求前會送OPTIONS請求
       * 以檢查權限。這裡直接返回授權回應。
       */
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-ID',
            'X-Request-ID': requestId,
          }
        })
      }

      /**
       * 檢查API路由是否存在 - 在中間件中無法直接檢查路由存在性
       * 所以我們先讓請求通過，如果後續返回404則在這裡攔截
       * 這個解決方案將在rewrite後的響應中處理
       */
    }

    return response

  } catch (error) {
    /**
     * 中間件錯誤處理
     *
     * 當中間件本身發生錯誤時，我們采取寬鬆策略:
     * 1. 記錄錯誤以供後續分析
     * 2. 不阻擋正常請求的處理
     * 3. 在回應中標記錯誤狀態
     * 4. 異步記錄以保持性能
     */
    const context = createErrorContext(request)
    const appError = new AppError(
      'Middleware processing error',
      undefined,
      500,
      undefined,
      false,
      context,
      error instanceof Error ? error : new Error(String(error))
    )

    /**
     * 異步錯誤記錄
     *
     * 使用異步方式記錄錯誤，確保:
     * - 不會阻塞當前請求的處理
     * - 日誌記錄失敗不會影響正常功能
     * - 提供備用的錯誤記錄機制
     */
    ErrorLogger.log(appError).catch(logError => {
      console.error('Failed to log middleware error:', logError)
    })

    /**
     * 繼續請求處理並標記錯誤
     *
     * 即使中間件出錯，也要允許請求繼續。
     * 添加 X-Middleware-Error 標頭供下遊系統參考。
     */
    const response = NextResponse.next()
    response.headers.set('X-Middleware-Error', 'true')
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