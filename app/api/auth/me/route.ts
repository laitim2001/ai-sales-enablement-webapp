/**
 * @fileoverview ================================================================檔案名稱: 用戶資訊查詢API路由檔案用途: AI銷售賦能平台的當前用戶資訊獲取端點開發階段: 開發完成================================================================功能索引:1. meHandler() - 用戶資訊查詢處理函數2. GET方法 - 獲取當前認證用戶的詳細資訊安全特色:- JWT Token驗證: 支援Authorization header和Cookie雙重來源- 用戶狀態檢查: 確保用戶帳號為活躍狀態- 敏感資訊過濾: 返回資料不包含密碼雜湊- Token錯誤處理: 詳細的JWT錯誤分類和處理- 資料庫連線管理: 自動斷開資料庫連線防止洩漏API規格:- 方法: GET- 路徑: /api/auth/me- 認證: Bearer Token (Header) 或 auth-token (Cookie)- 回應: { user: UserProfile } | ErrorResponse- 副作用: 更新用戶最後登入時間注意事項:- 每次成功請求會更新last_login時間戳- 僅返回活躍用戶的資訊（is_active: true）- 支援多種token來源以提供前端靈活性- 包含完整的JWT錯誤處理邏輯更新記錄:- Week 1: 初始版本，基礎用戶資訊查詢- Week 2: 增加完整JWT錯誤處理和連線管理================================================================
 * @module app/api/auth/me/route
 * @description
 * ================================================================檔案名稱: 用戶資訊查詢API路由檔案用途: AI銷售賦能平台的當前用戶資訊獲取端點開發階段: 開發完成================================================================功能索引:1. meHandler() - 用戶資訊查詢處理函數2. GET方法 - 獲取當前認證用戶的詳細資訊安全特色:- JWT Token驗證: 支援Authorization header和Cookie雙重來源- 用戶狀態檢查: 確保用戶帳號為活躍狀態- 敏感資訊過濾: 返回資料不包含密碼雜湊- Token錯誤處理: 詳細的JWT錯誤分類和處理- 資料庫連線管理: 自動斷開資料庫連線防止洩漏API規格:- 方法: GET- 路徑: /api/auth/me- 認證: Bearer Token (Header) 或 auth-token (Cookie)- 回應: { user: UserProfile } | ErrorResponse- 副作用: 更新用戶最後登入時間注意事項:- 每次成功請求會更新last_login時間戳- 僅返回活躍用戶的資訊（is_active: true）- 支援多種token來源以提供前端靈活性- 包含完整的JWT錯誤處理邏輯更新記錄:- Week 1: 初始版本，基礎用戶資訊查詢- Week 2: 增加完整JWT錯誤處理和連線管理================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-server'
import { prisma } from '@/lib/db'
import { ApiErrorHandler, withErrorHandling } from '@/lib/api/error-handler'
import { AppError } from '@/lib/errors'

/**
 * 用戶資訊查詢處理函數
 *
 * 處理當前用戶資訊查詢請求的主要邏輯：
 * 1. 從Header或Cookie取得認證token
 * 2. 驗證JWT token有效性
 * 3. 從資料庫查詢用戶資訊
 * 4. 更新最後登入時間
 * 5. 返回安全的用戶資料
 *
 * @param request - Next.js請求物件
 * @returns 包含用戶資訊的響應物件
 */
async function meHandler(request: NextRequest): Promise<NextResponse> {
  // 記錄處理開始時間，用於效能監控
  const processingStartTime = Date.now()

  // 第一步：從多個來源取得認證token
  // 優先檢查Authorization header（Bearer token格式）
  let token = request.headers.get('authorization')?.replace('Bearer ', '')

  // 如果header中沒有token，則檢查cookie
  if (!token) {
    token = request.cookies.get('auth-token')?.value
  }

  // 如果兩個來源都沒有token，拋出未授權錯誤
  if (!token) {
    throw AppError.unauthorized('No authentication token provided')
  }

  try {
    // 第二步：驗證JWT token的有效性和格式
    const payload = verifyToken(token)

    // 檢查token payload是否包含必要的用戶ID
    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 第三步：從資料庫查詢用戶詳細資訊
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        is_active: true // 只查詢活躍用戶
      },
      select: {
        // 選擇安全的欄位（排除password_hash等敏感資訊）
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        department: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        last_login: true
      }
    })

    // 如果用戶不存在或非活躍狀態
    if (!user) {
      throw AppError.unauthorized('User not found or inactive')
    }

    // 第四步：更新最後登入時間（用於追蹤用戶活動）
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    })

    // 第五步：返回用戶資訊
    return ApiErrorHandler.createSuccessResponse(
      user,
      request,
      processingStartTime
    )
  } catch (error) {
    // 如果是已知的應用錯誤，直接重新拋出
    if (error instanceof AppError) {
      throw error
    }

    // 處理JWT相關的特定錯誤
    if (error instanceof Error) {
      // JWT格式錯誤（簽名無效、格式錯誤等）
      if (error.name === 'JsonWebTokenError') {
        throw AppError.unauthorized('Invalid token')
      }
      // JWT已過期
      if (error.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Token expired')
      }
    }

    // 處理Prisma查詢錯誤
    if (error instanceof Error && error.message.includes('Prisma')) {
      throw AppError.internalError('Database error occurred', error)
    }

    // 重新拋出其他未知錯誤
    throw error
  }
}

/**
 * 導出GET方法處理器
 * 使用統一錯誤處理包裝器處理所有未捕獲的異常
 */
export const GET = withErrorHandling(meHandler)