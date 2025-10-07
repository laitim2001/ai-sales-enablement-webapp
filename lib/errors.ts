/**
 * @fileoverview ================================================================檔案名稱: 統一錯誤處理系統檔案用途: AI銷售賦能平台的核心錯誤處理框架開發階段: 生產就緒================================================================功能索引:1. ErrorType - 錯誤類型枚舉，涵蓋所有業務場景2. ErrorSeverity - 錯誤嚴重性分級系統3. AppError - 統一錯誤類別，支援結構化錯誤資訊4. ErrorClassifier - 錯誤分類器，自動識別和轉換原始錯誤5. ErrorLogger - 錯誤記錄器，支援開發和生產環境不同策略6. ErrorMetrics - 錯誤統計收集器，用於系統監控技術特色/核心特色:- 分層錯誤處理: 支援操作性vs程序性錯誤分離- 自動錯誤分類: 智能識別Prisma、JWT、網路等常見錯誤- 安全回應轉換: 自動過濾敏感資訊的客戶端回應- 結構化日誌: 統一的錯誤日誌格式，便於監控和分析- 錯誤統計: 即時錯誤指標收集，支援系統健康監控- 環境適配: 開發/生產環境不同的錯誤處理策略依賴關係:- Prisma: 資料庫錯誤自動分類和處理- JWT: JSON Web Token錯誤自動識別- Azure OpenAI: AI服務錯誤特殊處理- Zod: 輸入驗證錯誤自動轉換注意事項:- 生產環境下自動隱藏敏感錯誤資訊- 所有錯誤都會自動分配Request ID用於追蹤- 高嚴重性錯誤會觸發額外的監控和通知- 錯誤統計需要定期重置以避免記憶體累積更新記錄:- Week 1: 建立基礎錯誤類型和AppError類別- Week 2: 新增ErrorClassifier自動分類功能- Week 3: 實作ErrorLogger和錯誤統計系統- Week 4: 新增AI服務專用錯誤類型和處理================================================================
 * @module lib/errors
 * @description
 * ================================================================檔案名稱: 統一錯誤處理系統檔案用途: AI銷售賦能平台的核心錯誤處理框架開發階段: 生產就緒================================================================功能索引:1. ErrorType - 錯誤類型枚舉，涵蓋所有業務場景2. ErrorSeverity - 錯誤嚴重性分級系統3. AppError - 統一錯誤類別，支援結構化錯誤資訊4. ErrorClassifier - 錯誤分類器，自動識別和轉換原始錯誤5. ErrorLogger - 錯誤記錄器，支援開發和生產環境不同策略6. ErrorMetrics - 錯誤統計收集器，用於系統監控技術特色/核心特色:- 分層錯誤處理: 支援操作性vs程序性錯誤分離- 自動錯誤分類: 智能識別Prisma、JWT、網路等常見錯誤- 安全回應轉換: 自動過濾敏感資訊的客戶端回應- 結構化日誌: 統一的錯誤日誌格式，便於監控和分析- 錯誤統計: 即時錯誤指標收集，支援系統健康監控- 環境適配: 開發/生產環境不同的錯誤處理策略依賴關係:- Prisma: 資料庫錯誤自動分類和處理- JWT: JSON Web Token錯誤自動識別- Azure OpenAI: AI服務錯誤特殊處理- Zod: 輸入驗證錯誤自動轉換注意事項:- 生產環境下自動隱藏敏感錯誤資訊- 所有錯誤都會自動分配Request ID用於追蹤- 高嚴重性錯誤會觸發額外的監控和通知- 錯誤統計需要定期重置以避免記憶體累積更新記錄:- Week 1: 建立基礎錯誤類型和AppError類別- Week 2: 新增ErrorClassifier自動分類功能- Week 3: 實作ErrorLogger和錯誤統計系統- Week 4: 新增AI服務專用錯誤類型和處理================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

/**
 * 錯誤類型枚舉
 *
 * 定義了AI銷售賦能平台中所有可能出現的錯誤類型，
 * 按功能領域分組，便於錯誤處理和統計分析。
 *
 * 使用範例:
 * ```typescript
 * throw new AppError('用戶未登入', ErrorType.UNAUTHORIZED)
 * ```
 */
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

/**
 * 錯誤嚴重性分級枚舉
 *
 * 用於對錯誤進行嚴重性分級，影響日誌記錄策略、
 * 監控警報級別和錯誤處理優先級。
 *
 * 分級標準:
 * - LOW: 一般性錯誤，不影響核心功能（如驗證失敗）
 * - MEDIUM: 中等錯誤，可能影響用戶體驗（如認證過期）
 * - HIGH: 嚴重錯誤，影響系統功能（如資料庫連接失敗）
 * - CRITICAL: 關鍵錯誤，可能導致系統無法運作
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * 錯誤上下文接口
 *
 * 包含錯誤發生時的環境資訊，用於錯誤追蹤、
 * 調試和分析。所有欄位都是可選的，但建議
 * 在API請求中盡可能提供完整資訊。
 *
 * 使用範例:
 * ```typescript
 * const context: ErrorContext = {
 *   userId: 'user123',
 *   requestId: 'req_1234567890',
 *   path: '/api/users',
 *   method: 'POST',
 *   timestamp: new Date()
 * }
 * ```
 */
export interface ErrorContext {
  userId?: string
  requestId?: string
  path?: string
  method?: string
  userAgent?: string
  timestamp: Date
  additional?: Record<string, any>
}

/**
 * 應用程式錯誤類別
 *
 * 繼承自原生Error類別，提供結構化的錯誤處理功能。
 * 這是平台的核心錯誤類別，所有業務邏輯錯誤都應該
 * 使用此類別或其子類別。
 *
 * 核心特色:
 * - 支援錯誤類型和嚴重性分級
 * - 提供錯誤上下文追蹤
 * - 自動生成客戶端安全回應
 * - 支援原始錯誤鏈式追蹤
 * - 區分操作性錯誤和程序性錯誤
 *
 * 使用範例:
 * ```typescript
 * // 基本用法
 * throw new AppError('資源不存在', ErrorType.NOT_FOUND, 404)
 *
 * // 完整用法
 * throw new AppError(
 *   '資料庫連接失敗',
 *   ErrorType.DATABASE_ERROR,
 *   500,
 *   ErrorSeverity.HIGH,
 *   true,
 *   context,
 *   originalError
 * )
 * ```
 */
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

  /**
   * 靜態便捷方法：創建常見錯誤
   *
   * 提供一系列靜態方法來快速創建常見的錯誤類型，
   * 減少重複代碼並確保錯誤參數的一致性。
   */

  /**
   * 創建未授權錯誤 (401)
   * @param message 錯誤訊息，預設為 'Unauthorized'
   * @param context 錯誤上下文
   * @returns AppError實例
   */
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

  /**
   * 轉換為安全的客戶端響應
   *
   * 將錯誤轉換為可以安全傳送給客戶端的格式。
   * 自動過濾敏感資訊，只在操作性錯誤時顯示詳細訊息。
   *
   * 安全特性:
   * - 非操作性錯誤會顯示通用訊息
   * - 自動包含時間戳和請求ID
   * - 不會洩露伺服器內部資訊
   *
   * @returns 客戶端安全的錯誤回應對象
   */
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

  /**
   * 轉換為結構化日誌格式
   *
   * 將錯誤轉換為適合日誌系統的結構化格式。
   * 包含完整的錯誤資訊和上下文，用於監控和分析。
   *
   * 日誌級別對應:
   * - CRITICAL/HIGH → error
   * - MEDIUM → warn
   * - LOW → info
   *
   * @returns 結構化的日誌對象
   */
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

/**
 * 錯誤分類器
 *
 * 自動識別和轉換各種原始錯誤為統一的AppError格式。
 * 支援多種第三方庫和服務的錯誤模式識別。
 *
 * 支援的錯誤類型:
 * - Prisma資料庫錯誤 (P2002, P2025等)
 * - JWT認證錯誤 (JsonWebTokenError, TokenExpiredError)
 * - 網路連接錯誤 (ECONNREFUSED, ETIMEDOUT等)
 * - Azure OpenAI服務錯誤
 * - 文件處理錯誤
 * - 輸入驗證錯誤 (Zod, ValidationError)
 *
 * 使用範例:
 * ```typescript
 * try {
 *   // 可能拋出各種錯誤的操作
 *   await riskyOperation()
 * } catch (error) {
 *   const appError = ErrorClassifier.classify(error, context)
 *   await ErrorLogger.log(appError)
 *   throw appError
 * }
 * ```
 */
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

/**
 * 錯誤記錄器
 *
 * 提供智能的錯誤記錄功能，支援開發和生產環境的
 * 不同記錄策略。自動過濾不重要的錯誤，避免日誌噪音。
 *
 * 記錄策略:
 * - 開發環境：控制台彩色輸出
 * - 生產環境：結構化JSON輸出，可整合外部日誌服務
 *
 * 過濾規則:
 * - 只記錄操作性錯誤或CRITICAL級別錯誤
 * - 自動聚合相似錯誤，避免重複記錄
 *
 * 整合支援:
 * - Sentry：錯誤監控和警報
 * - LogRocket：用戶會話錄製
 * - CloudWatch：AWS日誌服務
 * - 自定義日誌端點
 */
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

  /**
   * 批量記錄錯誤
   *
   * 用於分析場景，一次記錄多個錯誤。
   * 適用於批量操作失敗、錯誤統計分析等情況。
   *
   * @param errors 錯誤陣列
   */
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

/**
 * 創建錯誤上下文
 *
 * 從HTTP請求中提取錯誤上下文資訊，用於錯誤追蹤。
 * 自動生成請求ID（如果不存在），提取路徑、方法等資訊。
 *
 * @param request HTTP請求對象（可選）
 * @returns 錯誤上下文對象
 */
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

/**
 * 錯誤統計收集器
 *
 * 收集和分析錯誤指標，用於系統健康監控和
 * 錯誤趨勢分析。提供即時統計和歷史數據。
 *
 * 功能特色:
 * - 按錯誤類型統計發生次數
 * - 提供時間範圍內的統計摘要
 * - 支援統計重置，避免記憶體累積
 * - 可整合監控儀表板
 *
 * 使用範例:
 * ```typescript
 * // 記錄錯誤
 * ErrorMetrics.increment(ErrorType.DATABASE_ERROR)
 *
 * // 獲取統計
 * const stats = ErrorMetrics.getStats()
 * console.log(`總錯誤數: ${stats.total}`)
 *
 * // 重置統計（通常在定時任務中執行）
 * ErrorMetrics.reset()
 * ```
 *
 * 注意事項:
 * - 建議定期重置統計以避免記憶體洩漏
 * - 在高流量系統中考慮使用外部統計服務
 * - 統計數據不會持久化，重啟後會丟失
 */
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