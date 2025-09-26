/**
 * ================================================================
 * 檔案名稱: 用戶登出API路由
 * 檔案用途: AI銷售賦能平台的用戶登出端點
 * 開發階段: 開發完成
 * ================================================================
 *
 * 功能索引:
 * 1. POST方法 - 處理用戶登出請求
 *
 * 安全特色:
 * - Cookie清除: 立即失效認證cookie
 * - 安全配置: 保持與登入時相同的安全設定
 * - 簡潔設計: 無需驗證token，直接清除cookie
 * - 錯誤處理: 基礎錯誤處理確保服務穩定性
 *
 * API規格:
 * - 方法: POST
 * - 路徑: /api/auth/logout
 * - 請求體: 無需求體
 * - 回應: { message: 'Logout successful' } | ErrorResponse
 * - Cookie操作: 設置auth-token為空值並立即過期
 *
 * 注意事項:
 * - 此API不需要驗證token（容錯設計）
 * - 即使token已過期或無效，仍會清除cookie
 * - 前端應在收到成功響應後清除本地儲存的認證資訊
 *
 * 更新記錄:
 * - Week 1: 初始版本，基礎登出功能
 * ================================================================
 */

import { NextResponse } from 'next/server'

/**
 * 用戶登出處理函數
 *
 * 處理用戶登出請求，主要功能是清除認證cookie。
 * 採用容錯設計，不需要驗證token有效性，確保用戶始終能成功登出。
 *
 * @returns 登出成功響應或錯誤響應
 */
export async function POST() {
  try {
    // 創建登出成功響應
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // 清除認證Cookie：設置為空值並立即過期
    response.cookies.set('auth-token', '', {
      httpOnly: true, // 保持與登入時相同的安全設定
      secure: process.env.NODE_ENV === 'production', // Production環境強制HTTPS
      sameSite: 'strict', // 防止CSRF攻擊
      maxAge: 0 // 立即過期，有效清除cookie
    })

    return response

  } catch (error) {
    // 記錄錯誤便於除錯
    console.error('Logout error:', error)

    // 返回通用錯誤響應
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}