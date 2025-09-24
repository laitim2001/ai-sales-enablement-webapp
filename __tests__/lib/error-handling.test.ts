/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  ErrorClassifier,
  ErrorLogger,
  ErrorMetrics,
  createErrorContext
} from '@/lib/errors'
import { ApiErrorHandler } from '@/lib/api/error-handler'

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ErrorMetrics.reset()
  })

  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(
        'Test error',
        ErrorType.VALIDATION_ERROR,
        400,
        ErrorSeverity.LOW,
        true
      )

      expect(error.message).toBe('Test error')
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.isOperational).toBe(true)
    })

    it('should create unauthorized error correctly', () => {
      const error = AppError.unauthorized('Access denied')

      expect(error.message).toBe('Access denied')
      expect(error.type).toBe(ErrorType.UNAUTHORIZED)
      expect(error.statusCode).toBe(401)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should create validation error correctly', () => {
      const error = AppError.validation('Invalid input')

      expect(error.message).toBe('Invalid input')
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
      expect(error.severity).toBe(ErrorSeverity.LOW)
    })

    it('should convert to client response correctly', () => {
      const error = new AppError(
        'Test error',
        ErrorType.VALIDATION_ERROR,
        400,
        ErrorSeverity.LOW,
        true
      )

      const clientResponse = error.toClientResponse()

      expect(clientResponse).toHaveProperty('error')
      expect(clientResponse.error).toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Test error',
        statusCode: 400
      })
    })

    it('should not expose operational error details to client', () => {
      const error = new AppError(
        'Internal database connection failed',
        ErrorType.INTERNAL_SERVER_ERROR,
        500,
        ErrorSeverity.HIGH,
        false // non-operational
      )

      const clientResponse = error.toClientResponse()

      expect(clientResponse.error.message).toBe('An unexpected error occurred')
      expect(clientResponse.error.message).not.toBe('Internal database connection failed')
    })
  })

  describe('ErrorClassifier', () => {
    it('should classify Prisma P2002 error correctly', () => {
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint violation'
      }

      const classifiedError = ErrorClassifier.classify(prismaError)

      expect(classifiedError).toBeInstanceOf(AppError)
      expect(classifiedError.type).toBe(ErrorType.RESOURCE_CONFLICT)
      expect(classifiedError.statusCode).toBe(409)
    })

    it('should classify JWT error correctly', () => {
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed'
      }

      const classifiedError = ErrorClassifier.classify(jwtError)

      expect(classifiedError.type).toBe(ErrorType.UNAUTHORIZED)
      expect(classifiedError.statusCode).toBe(401)
    })

    it('should classify network errors correctly', () => {
      const networkError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      }

      const classifiedError = ErrorClassifier.classify(networkError)

      expect(classifiedError.type).toBe(ErrorType.CONNECTION_ERROR)
      expect(classifiedError.statusCode).toBe(503)
    })

    it('should classify unknown errors as internal server error', () => {
      const unknownError = new Error('Something went wrong')

      const classifiedError = ErrorClassifier.classify(unknownError)

      expect(classifiedError.type).toBe(ErrorType.INTERNAL_SERVER_ERROR)
      expect(classifiedError.statusCode).toBe(500)
      expect(classifiedError.isOperational).toBe(false)
    })
  })

  describe('ErrorMetrics', () => {
    it('should track error counts correctly', () => {
      ErrorMetrics.increment(ErrorType.VALIDATION_ERROR)
      ErrorMetrics.increment(ErrorType.VALIDATION_ERROR)
      ErrorMetrics.increment(ErrorType.UNAUTHORIZED)

      const stats = ErrorMetrics.getStats()

      expect(stats.total).toBe(3)
      expect(stats.errors[ErrorType.VALIDATION_ERROR]).toBe(2)
      expect(stats.errors[ErrorType.UNAUTHORIZED]).toBe(1)
    })

    it('should reset metrics correctly', () => {
      ErrorMetrics.increment(ErrorType.VALIDATION_ERROR)
      ErrorMetrics.reset()

      const stats = ErrorMetrics.getStats()

      expect(stats.total).toBe(0)
      expect(stats.errors).toEqual({})
    })
  })

  describe('createErrorContext', () => {
    it('should create context from NextRequest', () => {
      const mockRequest = {
        headers: new Map([
          ['x-request-id', 'test-request-id'],
          ['user-agent', 'test-user-agent']
        ]),
        nextUrl: {
          pathname: '/api/test'
        },
        method: 'POST'
      } as any

      const context = createErrorContext(mockRequest)

      expect(context).toMatchObject({
        requestId: 'test-request-id',
        path: '/api/test',
        method: 'POST',
        userAgent: 'test-user-agent'
      })
      expect(context.timestamp).toBeInstanceOf(Date)
    })

    it('should generate request ID if not provided', () => {
      const mockRequest = {
        headers: new Map(),
        nextUrl: { pathname: '/api/test' },
        method: 'GET'
      } as any

      const context = createErrorContext(mockRequest)

      expect(context.requestId).toBeDefined()
      expect(context.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
    })
  })

  describe('ApiErrorHandler', () => {
    it('should handle errors correctly', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST'
      })

      const error = AppError.validation('Invalid input')
      const response = await ApiErrorHandler.handleError(error, mockRequest, Date.now())

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData).toMatchObject({
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Invalid input',
          statusCode: 400
        }
      })
      expect(responseData.metadata).toHaveProperty('requestId')
      expect(responseData.metadata).toHaveProperty('timestamp')
    })

    it('should create success responses correctly', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const testData = { id: 1, name: 'Test' }

      const response = ApiErrorHandler.createSuccessResponse(
        testData,
        mockRequest,
        Date.now(),
        'Operation successful'
      )

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData).toMatchObject({
        success: true,
        data: testData,
        message: 'Operation successful'
      })
      expect(responseData.metadata).toHaveProperty('requestId')
      expect(responseData.metadata).toHaveProperty('processingTime')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete error flow from generation to response', async () => {
      // 1. Generate an error
      const originalError = new Error('Database connection failed')

      // 2. Classify the error
      const classifiedError = ErrorClassifier.classify(originalError)

      // 3. Create API response
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const response = await ApiErrorHandler.handleError(classifiedError, mockRequest, Date.now())

      // 4. Verify response
      expect(response.status).toBe(500)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error.type).toBe(ErrorType.INTERNAL_SERVER_ERROR)
      expect(responseData.metadata).toHaveProperty('requestId')

      // 5. Verify metrics were updated
      const stats = ErrorMetrics.getStats()
      expect(stats.total).toBeGreaterThan(0)
    })
  })
})