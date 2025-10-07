/**
 * @fileoverview ================================================================AI銷售賦能平台 - 錯誤頁面組件 (app/error.tsx)================================================================【檔案功能】此檔案是Next.js App Router的錯誤邊界組件，用於捕獲和處理應用程式中的錯誤提供用戶友好的錯誤展示介面和錯誤恢復選項【主要職責】• 錯誤捕獲處理 - 捕獲頁面渲染和業務邏輯錯誤• 錯誤分類展示 - 根據錯誤類型提供不同的用戶訊息• 錯誤日誌記錄 - 將錯誤資訊記錄到日誌系統• 用戶體驗優化 - 提供重試、返回、回首頁等恢復選項• 開發環境支援 - 在開發環境中顯示詳細錯誤資訊【錯誤處理策略】• 操作性錯誤 - 顯示具體錯誤訊息，允許用戶處理• 系統性錯誤 - 顯示通用錯誤訊息，保護系統資訊• 網路錯誤 - 提供連線檢查建議• 認證錯誤 - 引導用戶重新登入【用戶體驗特點】• 溫和的錯誤提示界面• 多種恢復選項 (重試/返回/首頁)• 漸進式錯誤資訊披露• 技術支援聯繫資訊【相關檔案】• lib/errors.ts - 錯誤處理工具和類型定義• components/ui/button.tsx - UI按鈕組件• app/not-found.tsx - 404錯誤頁面【開發注意】• 必須使用'use client'指令，因為需要使用useState等Hook• 錯誤邊界只能捕獲子組件的錯誤，不能捕獲自身錯誤• 生產環境中應隱藏敏感的錯誤詳情• 確保錯誤記錄不會導致無限循環
 * @module app/error
 * @description
 * ================================================================AI銷售賦能平台 - 錯誤頁面組件 (app/error.tsx)================================================================【檔案功能】此檔案是Next.js App Router的錯誤邊界組件，用於捕獲和處理應用程式中的錯誤提供用戶友好的錯誤展示介面和錯誤恢復選項【主要職責】• 錯誤捕獲處理 - 捕獲頁面渲染和業務邏輯錯誤• 錯誤分類展示 - 根據錯誤類型提供不同的用戶訊息• 錯誤日誌記錄 - 將錯誤資訊記錄到日誌系統• 用戶體驗優化 - 提供重試、返回、回首頁等恢復選項• 開發環境支援 - 在開發環境中顯示詳細錯誤資訊【錯誤處理策略】• 操作性錯誤 - 顯示具體錯誤訊息，允許用戶處理• 系統性錯誤 - 顯示通用錯誤訊息，保護系統資訊• 網路錯誤 - 提供連線檢查建議• 認證錯誤 - 引導用戶重新登入【用戶體驗特點】• 溫和的錯誤提示界面• 多種恢復選項 (重試/返回/首頁)• 漸進式錯誤資訊披露• 技術支援聯繫資訊【相關檔案】• lib/errors.ts - 錯誤處理工具和類型定義• components/ui/button.tsx - UI按鈕組件• app/not-found.tsx - 404錯誤頁面【開發注意】• 必須使用'use client'指令，因為需要使用useState等Hook• 錯誤邊界只能捕獲子組件的錯誤，不能捕獲自身錯誤• 生產環境中應隱藏敏感的錯誤詳情• 確保錯誤記錄不會導致無限循環
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'  // 客戶端組件指令 - 必須在最頂端

import { useEffect } from 'react'                      // React Hook
import { ErrorLogger, AppError, ErrorType, ErrorSeverity } from '@/lib/errors'  // 錯誤處理工具
import { Button } from '@/components/ui/button'        // UI按鈕組件
import { RefreshCw, AlertTriangle, Home, ArrowLeft } from 'lucide-react'  // 圖示組件
import Link from 'next/link'                           // Next.js路由連結組件

// 錯誤頁面組件的屬性類型定義
interface ErrorPageProps {
  error: Error & { digest?: string }  // 錯誤物件，可能包含digest屬性
  reset: () => void                   // 重試函數，由Next.js提供
}

/**
 * 錯誤頁面組件主函數
 *
 * @param error - Next.js捕獲的錯誤物件
 * @param reset - Next.js提供的重置函數，用於重新渲染頁面
 * @returns 錯誤展示頁面JSX
 */
export default function Error({ error, reset }: ErrorPageProps) {
  // 使用useEffect在組件掛載時記錄錯誤
  useEffect(() => {
    // 將原生Error轉換為應用程式自定義的AppError格式
    const appError = error instanceof AppError
      ? error  // 如果已經是AppError，直接使用
      : new AppError(  // 否則創建新的AppError實例
          error.message || 'An unexpected error occurred',  // 錯誤訊息
          ErrorType.INTERNAL_SERVER_ERROR,                  // 錯誤類型
          500,                                              // HTTP狀態碼
          ErrorSeverity.HIGH,                               // 錯誤嚴重程度
          false,                                            // 是否為可操作錯誤
          {
            timestamp: new Date(),                          // 錯誤發生時間
            additional: { digest: error.digest }            // 額外資訊，包含錯誤摘要
          },
          error  // 原始錯誤物件
        )

    // 記錄錯誤到日誌系統
    ErrorLogger.log(appError)
  }, [error])  // 依賴陣列：當error改變時重新執行

  /**
   * 獲取用戶友好的錯誤訊息
   * 根據錯誤類型和內容提供不同的提示訊息
   *
   * @returns 用戶友好的錯誤訊息字串
   */
  const getErrorMessage = () => {
    // 如果是自定義的AppError，根據isOperational屬性決定是否顯示詳細訊息
    if (error instanceof AppError) {
      return error.isOperational ? error.message : '系統發生未預期的錯誤，請稍後再試'
    }

    // 根據錯誤訊息內容提供特定的用戶友好訊息
    if (error.message.includes('fetch')) {
      return '無法連接到伺服器，請檢查網路連線'
    }

    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return '登入已過期，請重新登入'
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return '找不到您要的內容'
    }

    // 預設通用錯誤訊息
    return '系統發生錯誤，請稍後再試'
  }

  /**
   * 獲取錯誤代碼或摘要
   * 用於技術支援和問題追蹤
   *
   * @returns 錯誤代碼或摘要字串
   */
  const getErrorCode = () => {
    if (error instanceof AppError) {
      return error.statusCode  // 返回HTTP狀態碼
    }
    return error.digest || '未知錯誤'  // 返回錯誤摘要或預設訊息
  }

  /**
   * 判斷是否應該顯示詳細錯誤資訊
   * 在開發環境或可操作錯誤時顯示詳情
   *
   * @returns 是否顯示錯誤詳情的布林值
   */
  const shouldShowDetails = () => {
    return process.env.NODE_ENV === 'development' ||          // 開發環境
           (error instanceof AppError && error.isOperational)  // 或可操作錯誤
  }

  // 渲染錯誤頁面UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      {/* 主要錯誤卡片容器 */}
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">

        {/* 錯誤圖示和訊息區域 */}
        <div className="mb-6">
          {/* 警告三角形圖示 */}
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />

          {/* 錯誤標題 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            糟糕！出了點問題
          </h1>

          {/* 用戶友好的錯誤訊息 */}
          <p className="text-gray-600 mb-4">
            {getErrorMessage()}
          </p>

          {/* 條件性顯示錯誤詳情 - 僅在開發環境或可操作錯誤時顯示 */}
          {shouldShowDetails() && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3 mb-4">
              <p className="font-medium">錯誤詳情：</p>
              {/* 使用等寬字體顯示原始錯誤訊息，並允許換行 */}
              <p className="mt-1 font-mono text-xs break-all">
                {error.message}
              </p>
              {/* 顯示錯誤代碼，便於技術支援定位問題 */}
              <p className="mt-1 text-xs">
                錯誤代碼: {getErrorCode()}
              </p>
            </div>
          )}
        </div>

        {/* 操作按鈕區域 */}
        <div className="space-y-3">
          {/* 重試按鈕 - 呼叫Next.js提供的reset函數 */}
          <Button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重試
          </Button>

          {/* 返回上一頁按鈕 - 使用瀏覽器歷史記錄 */}
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          {/* 回到首頁按鈕 - 使用Next.js Link組件 */}
          <Link href="/" className="block w-full">
            <Button variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              回到首頁
            </Button>
          </Link>
        </div>

        {/* 技術支援提示區域 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            如果問題持續發生，請聯繫技術支援
          </p>
        </div>
      </div>
    </div>
  )
}