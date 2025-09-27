/**
 * ================================================================
 * AI銷售賦能平台 - 系統健康檢查API (app/api/health/route.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供系統健康狀態檢查的RESTful API端點，用於監控系統運行狀態
 * 主要檢查數據庫連接狀態和系統基本運行狀況
 *
 * 【主要職責】
 * • 數據庫連接檢查 - 驗證PostgreSQL數據庫連接是否正常
 * • 系統狀態回報 - 返回系統整體健康狀態信息
 * • 監控支援 - 為外部監控系統提供健康檢查端點
 * • 故障診斷 - 在系統異常時提供錯誤信息
 *
 * 【API規格】
 * • 路由: GET /api/health
 * • 成功回應: { status: 'healthy', database: 'connected', timestamp: ISO時間 }
 * • 失敗回應: { status: 'unhealthy', database: 'disconnected', error: 錯誤信息, timestamp: ISO時間 }
 * • HTTP狀態碼: 200 (正常) | 500 (異常)
 *
 * 【使用場景】
 * • 負載均衡器健康檢查
 * • 監控系統狀態探測
 * • 部署後的系統驗證
 * • 故障排除和診斷
 *
 * 【相關檔案】
 * • lib/db.ts - 數據庫連接管理
 * • 外部監控系統配置
 *
 * 【開發注意】
 * • 使用簡單的SELECT 1查詢測試數據庫連接
 * • 避免複雜查詢影響性能
 * • 提供詳細的錯誤信息便於診斷
 * • 包含時間戳便於追蹤
 */

import { NextResponse } from 'next/server'    // Next.js回應處理
import { prisma } from '@/lib/db'             // 數據庫連接實例

/**
 * 系統健康檢查API端點
 *
 * 執行系統健康狀態檢查，主要驗證數據庫連接狀態
 * 提供標準化的健康檢查回應格式供監控系統使用
 *
 * @returns {NextResponse} 包含系統狀態信息的JSON回應
 */
export async function GET() {
  try {
    // 執行簡單的數據庫查詢測試連接狀態
    // 使用 SELECT 1 是最輕量的連接測試方式
    await prisma.$queryRaw`SELECT 1`

    // 返回成功的健康檢查結果
    return NextResponse.json({
      status: 'healthy',              // 系統狀態：健康
      database: 'connected',          // 數據庫狀態：已連接
      timestamp: new Date().toISOString()  // 檢查時間戳（ISO格式）
    })
  } catch (error) {
    // 記錄健康檢查失敗的詳細錯誤信息
    console.error('Health check failed:', error)

    // 返回失敗的健康檢查結果，包含錯誤詳情
    return NextResponse.json(
      {
        status: 'unhealthy',           // 系統狀態：不健康
        database: 'disconnected',     // 數據庫狀態：連接失敗
        error: error instanceof Error ? error.message : 'Unknown error',  // 錯誤信息
        timestamp: new Date().toISOString()  // 檢查時間戳（ISO格式）
      },
      { status: 500 }  // HTTP 500 Internal Server Error
    )
  }
}