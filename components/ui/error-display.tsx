'use client'

import { AlertTriangle, XCircle, AlertCircle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface ErrorDisplayProps {
  error?: {
    type?: string
    message: string
    statusCode?: number
    timestamp?: string
    requestId?: string
  }
  title?: string
  variant?: 'error' | 'warning' | 'destructive'
  showDetails?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorDisplay({
  error,
  title,
  variant = 'error',
  showDetails = false,
  onRetry,
  onDismiss,
  className
}: ErrorDisplayProps) {
  if (!error) return null

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'destructive':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'destructive':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-red-200 bg-red-50 text-red-800'
    }
  }

  const getDefaultTitle = () => {
    if (title) return title

    switch (variant) {
      case 'warning':
        return '注意'
      case 'destructive':
        return '嚴重錯誤'
      default:
        return '發生錯誤'
    }
  }

  const getErrorMessage = () => {
    // 為常見錯誤提供友好的中文訊息
    const message = error.message?.toLowerCase()

    if (message?.includes('network') || message?.includes('fetch')) {
      return '網路連線問題，請檢查您的網路設定'
    }

    if (message?.includes('unauthorized') || error.statusCode === 401) {
      return '登入已過期，請重新登入'
    }

    if (message?.includes('forbidden') || error.statusCode === 403) {
      return '權限不足，無法執行此操作'
    }

    if (message?.includes('not found') || error.statusCode === 404) {
      return '找不到請求的資源'
    }

    if (message?.includes('rate limit') || error.statusCode === 429) {
      return '請求過於頻繁，請稍後再試'
    }

    if (error.statusCode && error.statusCode >= 500) {
      return '伺服器內部錯誤，請稍後再試'
    }

    return error.message || '發生未知錯誤'
  }

  return (
    <Alert className={cn(getVariantClasses(), className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle className="mb-1">
              {getDefaultTitle()}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {getErrorMessage()}
            </AlertDescription>

            {showDetails && (
              <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
                <div className="text-xs space-y-1">
                  {error.type && (
                    <div>
                      <span className="font-medium">類型:</span> {error.type}
                    </div>
                  )}
                  {error.statusCode && (
                    <div>
                      <span className="font-medium">狀態碼:</span> {error.statusCode}
                    </div>
                  )}
                  {error.requestId && (
                    <div>
                      <span className="font-medium">請求ID:</span> {error.requestId}
                    </div>
                  )}
                  {error.timestamp && (
                    <div>
                      <span className="font-medium">時間:</span>{' '}
                      {new Date(error.timestamp).toLocaleString('zh-TW')}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="font-medium">原始訊息:</span>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {error.message}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-3">
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 hover:bg-white hover:bg-opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 px-2 hover:bg-white hover:bg-opacity-50"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}

// 簡化版本，用於快速顯示錯誤
export function SimpleError({
  message,
  onRetry
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <ErrorDisplay
      error={{ message }}
      onRetry={onRetry}
      className="max-w-md mx-auto"
    />
  )
}

// 載入錯誤版本（通常用於數據獲取失敗）
export function LoadingError({
  onRetry,
  resource = '數據'
}: {
  onRetry?: () => void
  resource?: string
}) {
  return (
    <ErrorDisplay
      error={{ message: `載入${resource}時發生錯誤` }}
      onRetry={onRetry}
      className="text-center py-8"
    />
  )
}

// 表單錯誤版本
export function FormError({
  errors,
  onDismiss
}: {
  errors: string | string[]
  onDismiss?: () => void
}) {
  const errorList = Array.isArray(errors) ? errors : [errors]

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <div className="flex-1">
        <AlertTitle className="text-red-800">表單驗證錯誤</AlertTitle>
        <AlertDescription className="text-red-700 mt-1">
          <ul className="list-disc list-inside space-y-1">
            {errorList.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-2 h-6 px-2 text-red-600 hover:bg-red-100"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Alert>
  )
}