'use client'

import { useEffect } from 'react'
import { ErrorLogger, AppError, ErrorType, ErrorSeverity } from '@/lib/errors'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const appError = error instanceof AppError
      ? error
      : new AppError(
          'Critical system error',
          ErrorType.INTERNAL_SERVER_ERROR,
          500,
          ErrorSeverity.CRITICAL,
          false,
          {
            timestamp: new Date(),
            additional: {
              digest: error.digest,
              stack: error.stack,
              isGlobalError: true
            }
          },
          error
        )

    ErrorLogger.log(appError)

    // 在生產環境中，可能需要通知監控系統
    if (process.env.NODE_ENV === 'production') {
      // TODO: 整合監控系統 (Sentry, DataDog 等)
      console.error('Critical system error reported:', {
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString()
      })
    }
  }, [error])

  return (
    <html lang="zh-TW">
      <body>
        <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                系統發生嚴重錯誤
              </h1>

              <p className="text-gray-600 mb-4">
                應用程式遇到無法恢復的錯誤。請重新整理頁面或聯繫技術支援。
              </p>

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

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                重新載入應用程式
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                返回首頁
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                錯誤已自動記錄，技術團隊將會處理此問題
              </p>
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