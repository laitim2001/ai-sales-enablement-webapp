// 統一錯誤處理系統

export enum ErrorType {
  // 認證錯誤
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // 驗證錯誤
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',

  // 資源錯誤
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // 服務錯誤
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',

  // AI 服務錯誤
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  CHAT_COMPLETION_FAILED = 'CHAT_COMPLETION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 網路錯誤
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // 業務邏輯錯誤
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // 文件處理錯誤
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',

  // 未知錯誤
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  path?: string
  method?: string
  userAgent?: string
  timestamp: Date
  additional?: Record<string, any>
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: ErrorContext
  public readonly originalError?: Error

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message)

    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.originalError = originalError

    // 確保 stack trace 正確
    Error.captureStackTrace(this, AppError)
  }

  // 便捷方法創建常見錯誤
  static unauthorized(message = 'Unauthorized', context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.UNAUTHORIZED, 401, ErrorSeverity.MEDIUM, true, context)
  }

  static forbidden(message = 'Forbidden', context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.FORBIDDEN, 403, ErrorSeverity.MEDIUM, true, context)
  }

  static notFound(message = 'Resource not found', context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.NOT_FOUND, 404, ErrorSeverity.LOW, true, context)
  }

  static validation(message: string, context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.VALIDATION_ERROR, 400, ErrorSeverity.LOW, true, context)
  }

  static badRequest(message = 'Bad request', context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.INVALID_INPUT, 400, ErrorSeverity.LOW, true, context)
  }

  static internal(message = 'Internal server error', context?: ErrorContext, originalError?: Error): AppError {
    return new AppError(message, ErrorType.INTERNAL_SERVER_ERROR, 500, ErrorSeverity.HIGH, true, context, originalError)
  }

  static aiService(message: string, context?: ErrorContext, originalError?: Error): AppError {
    return new AppError(message, ErrorType.AI_SERVICE_ERROR, 500, ErrorSeverity.HIGH, true, context, originalError)
  }

  static rateLimited(message = 'Rate limit exceeded', context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.RATE_LIMIT_EXCEEDED, 429, ErrorSeverity.MEDIUM, true, context)
  }

  // 轉換為安全的客戶端響應
  toClientResponse(): {
    error: {
      type: string
      message: string
      statusCode: number
      timestamp: string
      requestId?: string
    }
  } {
    return {
      error: {
        type: this.type,
        message: this.isOperational ? this.message : 'An unexpected error occurred',
        statusCode: this.statusCode,
        timestamp: new Date().toISOString(),
        requestId: this.context?.requestId,
      }
    }
  }

  // 轉換為日誌格式
  toLogFormat(): {
    level: string
    message: string
    type: string
    severity: string
    statusCode: number
    stack?: string
    context?: ErrorContext
    originalError?: {
      name: string
      message: string
      stack?: string
    }
  } {
    return {
      level: this.severity === ErrorSeverity.CRITICAL ? 'error' :
             this.severity === ErrorSeverity.HIGH ? 'error' :
             this.severity === ErrorSeverity.MEDIUM ? 'warn' : 'info',
      message: this.message,
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      stack: this.stack,
      context: this.context,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    }
  }
}

// 錯誤分類器 - 從原始錯誤創建 AppError
export class ErrorClassifier {
  static classify(error: any, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error
    }

    // Prisma 錯誤
    if (error?.code === 'P2002') {
      return new AppError(
        'Resource already exists',
        ErrorType.RESOURCE_CONFLICT,
        409,
        ErrorSeverity.LOW,
        true,
        context,
        error
      )
    }

    if (error?.code === 'P2025') {
      return new AppError(
        'Resource not found',
        ErrorType.NOT_FOUND,
        404,
        ErrorSeverity.LOW,
        true,
        context,
        error
      )
    }

    // JWT 錯誤
    if (error?.name === 'JsonWebTokenError') {
      return new AppError(
        'Invalid token',
        ErrorType.UNAUTHORIZED,
        401,
        ErrorSeverity.MEDIUM,
        true,
        context,
        error
      )
    }

    if (error?.name === 'TokenExpiredError') {
      return new AppError(
        'Token expired',
        ErrorType.TOKEN_EXPIRED,
        401,
        ErrorSeverity.MEDIUM,
        true,
        context,
        error
      )
    }

    // 網路錯誤
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return new AppError(
        'Connection error',
        ErrorType.CONNECTION_ERROR,
        503,
        ErrorSeverity.HIGH,
        true,
        context,
        error
      )
    }

    if (error?.code === 'ETIMEDOUT') {
      return new AppError(
        'Request timeout',
        ErrorType.TIMEOUT_ERROR,
        408,
        ErrorSeverity.MEDIUM,
        true,
        context,
        error
      )
    }

    // Azure OpenAI 錯誤
    if (error?.message?.includes('rate limit') || error?.status === 429) {
      return new AppError(
        'AI service rate limit exceeded',
        ErrorType.RATE_LIMIT_EXCEEDED,
        429,
        ErrorSeverity.MEDIUM,
        true,
        context,
        error
      )
    }

    if (error?.message?.includes('OpenAI') || error?.message?.includes('Azure')) {
      return new AppError(
        'AI service error',
        ErrorType.AI_SERVICE_ERROR,
        500,
        ErrorSeverity.HIGH,
        true,
        context,
        error
      )
    }

    // 文件上傳錯誤
    if (error?.message?.includes('File too large')) {
      return new AppError(
        'File too large',
        ErrorType.FILE_TOO_LARGE,
        413,
        ErrorSeverity.LOW,
        true,
        context,
        error
      )
    }

    // 驗證錯誤
    if (error?.name === 'ValidationError' || error?.name === 'ZodError') {
      return new AppError(
        error.message || 'Validation error',
        ErrorType.VALIDATION_ERROR,
        400,
        ErrorSeverity.LOW,
        true,
        context,
        error
      )
    }

    // 預設為內部錯誤
    return new AppError(
      error?.message || 'An unexpected error occurred',
      ErrorType.INTERNAL_SERVER_ERROR,
      500,
      ErrorSeverity.HIGH,
      false,
      context,
      error
    )
  }
}

// 錯誤記錄器
export class ErrorLogger {
  private static shouldLog(error: AppError): boolean {
    // 只記錄操作性錯誤或高嚴重性錯誤
    return error.isOperational || error.severity === ErrorSeverity.CRITICAL
  }

  static async log(error: AppError): Promise<void> {
    if (!this.shouldLog(error)) {
      return
    }

    const logEntry = error.toLogFormat()

    // 根據環境選擇記錄方式
    if (process.env.NODE_ENV === 'production') {
      // 生產環境：發送到日誌服務
      try {
        // 這裡可以整合 Sentry, LogRocket, 或其他日誌服務
        // await sendToLogService(logEntry)
        console.error('PRODUCTION_ERROR:', JSON.stringify(logEntry, null, 2))
      } catch (logError) {
        console.error('Failed to log error to external service:', logError)
        console.error('Original error:', logEntry)
      }
    } else {
      // 開發環境：控制台輸出
      if (logEntry.level === 'error') {
        console.error(`[${logEntry.type}] ${logEntry.message}`, logEntry)
      } else if (logEntry.level === 'warn') {
        console.warn(`[${logEntry.type}] ${logEntry.message}`, logEntry)
      } else {
        console.info(`[${logEntry.type}] ${logEntry.message}`, logEntry)
      }
    }
  }

  // 批量記錄錯誤（用於分析）
  static async logBatch(errors: AppError[]): Promise<void> {
    const loggableErrors = errors.filter(this.shouldLog)

    if (loggableErrors.length === 0) {
      return
    }

    const logEntries = loggableErrors.map(error => error.toLogFormat())

    if (process.env.NODE_ENV === 'production') {
      try {
        // await sendBatchToLogService(logEntries)
        console.error('BATCH_ERRORS:', JSON.stringify(logEntries, null, 2))
      } catch (logError) {
        console.error('Failed to log batch errors:', logError)
      }
    } else {
      console.group('Batch Error Log:')
      logEntries.forEach(entry => {
        console.log(`[${entry.type}] ${entry.message}`)
      })
      console.groupEnd()
    }
  }
}

// 錯誤處理中間件輔助函數
export function createErrorContext(request?: any): ErrorContext {
  return {
    requestId: request?.headers?.get('x-request-id') || generateRequestId(),
    path: request?.nextUrl?.pathname,
    method: request?.method,
    userAgent: request?.headers?.get('user-agent'),
    timestamp: new Date(),
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 錯誤統計收集器（用於監控）
export class ErrorMetrics {
  private static errorCounts = new Map<string, number>()
  private static lastReset = new Date()

  static increment(errorType: ErrorType): void {
    const current = this.errorCounts.get(errorType) || 0
    this.errorCounts.set(errorType, current + 1)
  }

  static getStats(): {
    errors: Record<string, number>
    period: { start: Date; end: Date }
    total: number
  } {
    const errors: Record<string, number> = {}
    let total = 0

    this.errorCounts.forEach((count, type) => {
      errors[type] = count
      total += count
    })

    return {
      errors,
      period: {
        start: this.lastReset,
        end: new Date(),
      },
      total,
    }
  }

  static reset(): void {
    this.errorCounts.clear()
    this.lastReset = new Date()
  }
}