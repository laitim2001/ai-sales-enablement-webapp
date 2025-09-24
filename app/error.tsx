'use client'

import { useEffect } from 'react'
import { ErrorLogger, AppError, ErrorType, ErrorSeverity } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    const appError = error instanceof AppError
      ? error
      : new AppError(
          error.message || 'An unexpected error occurred',
          ErrorType.INTERNAL_SERVER_ERROR,
          500,
          ErrorSeverity.HIGH,
          false,
          {
            timestamp: new Date(),
            additional: { digest: error.digest }
          },
          error
        )

    ErrorLogger.log(appError)
  }, [error])

  const getErrorMessage = () => {
    if (error instanceof AppError) {
      return error.isOperational ? error.message : '系統發生未預期的錯誤，請稍後再試'
    }

    // 為不同類型的錯誤提供用戶友好的訊息
    if (error.message.includes('fetch')) {
      return '無法連接到伺服器，請檢查網路連線'
    }

    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return '登入已過期，請重新登入'
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return '找不到您要的內容'
    }

    return '系統發生錯誤，請稍後再試'
  }

  const getErrorCode = () => {
    if (error instanceof AppError) {
      return error.statusCode
    }
    return error.digest || '未知錯誤'
  }

  const shouldShowDetails = () => {
    return process.env.NODE_ENV === 'development' ||
           (error instanceof AppError && error.isOperational)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            糟糕！出了點問題
          </h1>
          <p className="text-gray-600 mb-4">
            {getErrorMessage()}
          </p>

          {shouldShowDetails() && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3 mb-4">
              <p className="font-medium">錯誤詳情：</p>
              <p className="mt-1 font-mono text-xs break-all">
                {error.message}
              </p>
              <p className="mt-1 text-xs">
                錯誤代碼: {getErrorCode()}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重試
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          <Link href="/" className="block w-full">
            <Button variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              回到首頁
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            如果問題持續發生，請聯繫技術支援
          </p>
        </div>
      </div>
    </div>
  )
}