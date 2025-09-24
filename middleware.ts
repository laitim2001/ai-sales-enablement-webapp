import { NextRequest, NextResponse } from 'next/server'
import { createErrorContext, ErrorLogger, AppError } from '@/lib/errors'

export function middleware(request: NextRequest) {
  try {
    // 為所有請求添加請求ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // 創建響應並添加請求ID到頭部
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)

    // 如果是 API 請求，添加 CORS 頭部
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

      // 處理 OPTIONS 預檢請求
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
    }

    return response

  } catch (error) {
    // 如果中間件本身出錯，記錄錯誤並允許請求繼續
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

    // 異步記錄錯誤（不阻塞請求）
    ErrorLogger.log(appError).catch(logError => {
      console.error('Failed to log middleware error:', logError)
    })

    // 允許請求繼續，但添加錯誤標記
    const response = NextResponse.next()
    response.headers.set('X-Middleware-Error', 'true')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，除了：
     * - _next/static (靜態文件)
     * - _next/image (圖片優化文件)
     * - favicon.ico (圖標文件)
     * - public 文件夾中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}