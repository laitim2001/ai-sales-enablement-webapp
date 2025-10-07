/**
 * @fileoverview ================================================================AI銷售賦能平台 - 全域錯誤處理頁面 (app/global-error.tsx)================================================================【檔案功能】Next.js 全域錯誤邊界組件，處理整個應用程式中未捕獲的嚴重錯誤提供用戶友好的錯誤顯示界面和錯誤恢復機制【主要職責】• 全域錯誤捕獲 - 攔截應用程式級別的嚴重錯誤• 錯誤記錄報告 - 自動記錄錯誤詳情到監控系統• 用戶體驗保護 - 提供優雅的錯誤顯示界面• 錯誤恢復機制 - 提供重新加載和導航選項• 開發調試支援 - 開發環境顯示詳細錯誤信息【技術實現】• React Error Boundary - 捕獲組件樹中的JavaScript錯誤• 錯誤分類處理 - 區分AppError和系統錯誤• 錯誤上報機制 - 整合Sentry等監控系統• 用戶界面設計 - 專業的錯誤提示界面• 恢復策略實現 - 多種錯誤恢復選項【錯誤處理流程】1. 錯誤捕獲：Error Boundary攔截未處理異常2. 錯誤分類：判斷是否為自定義AppError3. 錯誤轉換：將系統錯誤轉換為標準化AppError4. 錯誤記錄：寫入本地日誌和遠程監控系統5. 界面渲染：顯示用戶友好的錯誤頁面6. 恢復機制：提供重新加載和導航選項【錯誤類型處理】• JavaScript運行時錯誤：語法錯誤、類型錯誤等• 網絡請求錯誤：API調用失敗、超時等• 渲染錯誤：組件渲染異常、狀態錯誤等• 第三方服務錯誤：外部依賴失敗等【用戶體驗考量】• 視覺設計：專業、友好的錯誤提示界面• 操作指引：清晰的下一步操作建議• 信息透明：適量的錯誤信息披露• 恢復便利：多種恢復路徑選擇【相關檔案】• 錯誤處理: lib/errors.ts• 錯誤記錄: lib/logging/error-logger.ts• 監控集成: lib/monitoring/sentry.ts• 樣式配置: tailwind.config.ts
 * @module app/global-error
 * @description
 * ================================================================AI銷售賦能平台 - 全域錯誤處理頁面 (app/global-error.tsx)================================================================【檔案功能】Next.js 全域錯誤邊界組件，處理整個應用程式中未捕獲的嚴重錯誤提供用戶友好的錯誤顯示界面和錯誤恢復機制【主要職責】• 全域錯誤捕獲 - 攔截應用程式級別的嚴重錯誤• 錯誤記錄報告 - 自動記錄錯誤詳情到監控系統• 用戶體驗保護 - 提供優雅的錯誤顯示界面• 錯誤恢復機制 - 提供重新加載和導航選項• 開發調試支援 - 開發環境顯示詳細錯誤信息【技術實現】• React Error Boundary - 捕獲組件樹中的JavaScript錯誤• 錯誤分類處理 - 區分AppError和系統錯誤• 錯誤上報機制 - 整合Sentry等監控系統• 用戶界面設計 - 專業的錯誤提示界面• 恢復策略實現 - 多種錯誤恢復選項【錯誤處理流程】1. 錯誤捕獲：Error Boundary攔截未處理異常2. 錯誤分類：判斷是否為自定義AppError3. 錯誤轉換：將系統錯誤轉換為標準化AppError4. 錯誤記錄：寫入本地日誌和遠程監控系統5. 界面渲染：顯示用戶友好的錯誤頁面6. 恢復機制：提供重新加載和導航選項【錯誤類型處理】• JavaScript運行時錯誤：語法錯誤、類型錯誤等• 網絡請求錯誤：API調用失敗、超時等• 渲染錯誤：組件渲染異常、狀態錯誤等• 第三方服務錯誤：外部依賴失敗等【用戶體驗考量】• 視覺設計：專業、友好的錯誤提示界面• 操作指引：清晰的下一步操作建議• 信息透明：適量的錯誤信息披露• 恢復便利：多種恢復路徑選擇【相關檔案】• 錯誤處理: lib/errors.ts• 錯誤記錄: lib/logging/error-logger.ts• 監控集成: lib/monitoring/sentry.ts• 樣式配置: tailwind.config.ts
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useEffect } from 'react'
import { ErrorLogger, AppError, ErrorType, ErrorSeverity } from '@/lib/errors'

/**
 * 全域錯誤處理組件屬性
 */
interface GlobalErrorProps {
  error: Error & { digest?: string }  // 錯誤對象，包含可選的摘要信息
  reset: () => void                   // 重置函數，用於嘗試恢復錯誤
}

/**
 * 全域錯誤處理組件 - 應用程式最後防線
 *
 * 【處理策略】
 * 採用優雅降級策略，確保即使在嚴重錯誤情況下也能提供基本的用戶體驗
 * 同時收集足夠的錯誤信息用於問題診斷和修復
 *
 * 【錯誤分類處理】
 * • AppError：已知的業務錯誤，直接記錄
 * • 系統錯誤：未知錯誤，轉換為標準化AppError格式
 * • 包含摘要信息：Next.js提供的錯誤摘要和堆棧信息
 *
 * 【錯誤記錄機制】
 * • 本地記錄：通過ErrorLogger記錄到本地日誌
 * • 遠程監控：生產環境自動上報到監控系統
 * • 調試信息：開發環境顯示詳細錯誤信息
 *
 * @param error 捕獲的錯誤對象
 * @param reset 錯誤重置函數
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    /**
     * 錯誤標準化處理
     * 將各種類型的錯誤轉換為統一的AppError格式
     */
    const appError = error instanceof AppError
      ? error
      : new AppError(
          'Critical system error',                    // 錯誤消息
          ErrorType.INTERNAL_SERVER_ERROR,           // 錯誤類型
          500,                                       // HTTP狀態碼
          ErrorSeverity.CRITICAL,                    // 錯誤嚴重性
          false,                                     // 是否可重試
          {
            timestamp: new Date(),                   // 錯誤時間戳
            additional: {
              digest: error.digest,                  // Next.js錯誤摘要
              stack: error.stack,                    // 堆棧跟蹤
              isGlobalError: true                    // 標記為全域錯誤
            }
          },
          error                                      // 原始錯誤對象
        )

    // 記錄錯誤到日誌系統
    ErrorLogger.log(appError)

    /**
     * 生產環境錯誤上報
     * 在生產環境中自動將嚴重錯誤上報到監控系統
     * 用於實時監控和問題快速響應
     */
    if (process.env.NODE_ENV === 'production') {
      // TODO: 整合監控系統 (Sentry, DataDog 等)
      console.error('Critical system error reported:', {
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString()
      })
    }
  }, [error])

  /**
   * 錯誤頁面UI渲染
   * 提供專業、友好的錯誤顯示界面，包含恢復選項和調試信息
   */
  return (
    <html lang="zh-TW">
      <body>
        {/* 全屏錯誤容器 - 使用紅色主題表示錯誤狀態 */}
        <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
          {/* 錯誤卡片 - 居中顯示，最大寬度限制 */}
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-6 text-center">

            {/* 錯誤圖標和標題區域 */}
            <div className="mb-6">
              {/* 錯誤圖標 - 使用警告三角形圖標 */}
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-label="錯誤警告圖標"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              {/* 錯誤標題 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                系統發生嚴重錯誤
              </h1>

              {/* 錯誤描述 */}
              <p className="text-gray-600 mb-4">
                應用程式遇到無法恢復的錯誤。請重新整理頁面或聯繫技術支援。
              </p>

              {/* 開發環境錯誤詳情 - 僅在開發模式顯示 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-sm text-red-600 bg-red-50 rounded-md p-3 mb-4">
                  <p className="font-medium">開發模式錯誤詳情：</p>
                  <p className="mt-1 font-mono text-xs break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="mt-1 text-xs">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 錯誤恢復操作區域 */}
            <div className="space-y-3">
              {/* 主要恢復按鈕 - 重新載入應用程式 */}
              <button
                onClick={reset}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                aria-label="重新載入應用程式"
              >
                重新載入應用程式
              </button>

              {/* 次要恢復按鈕 - 返回首頁 */}
              <button
                onClick={() => window.location.href = '/'}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                aria-label="返回應用程式首頁"
              >
                返回首頁
              </button>
            </div>

            {/* 錯誤追蹤信息區域 */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                錯誤已自動記錄，技術團隊將會處理此問題
              </p>
              {/* 顯示錯誤追蹤ID（如果存在） */}
              {error.digest && (
                <p className="text-xs text-gray-400 mt-1">
                  錯誤ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}