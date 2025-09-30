/**
 * ================================================================
 * Request Validator Middleware 測試套件
 * ================================================================
 *
 * 測試範圍：
 * • Body 驗證（JSON 解析、schema 驗證）
 * • Query parameters 驗證
 * • URL parameters 驗證
 * • Headers 驗證
 * • 多源聯合驗證
 * • 錯誤處理和格式化
 * • Common schema 預設
 * • 自訂錯誤處理器
 * • 便捷函數
 * • Edge cases
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  RequestValidator,
  createRequestValidator,
  validateRequest,
  CommonSchemas,
  type ValidationResult,
  type ValidationError
} from '@/lib/middleware/request-validator'
import { createMockNextRequest } from '@/__tests__/utils/mock-next-request'

describe('Request Validator Middleware', () => {
  describe('Body 驗證', () => {
    it('應該成功驗證有效的 JSON body', async () => {
      const validator = createRequestValidator({
        body: z.object({
          name: z.string().min(1),
          email: z.string().email()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test User', email: 'test@example.com' })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
      expect(result.data?.body).toEqual({
        name: 'Test User',
        email: 'test@example.com'
      })
    })

    it('應該拒絕無效的 JSON body', async () => {
      const validator = createRequestValidator({
        body: z.object({
          name: z.string().min(1),
          email: z.string().email()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: '', email: 'invalid-email' })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
      expect(result.errors!.some(e => e.target === 'body')).toBe(true)
    })

    it('應該處理無效的 JSON 格式', async () => {
      const validator = createRequestValidator({
        body: z.object({
          name: z.string()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: 'invalid json {'
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].code).toBe('invalid_json')
    })

    it('應該支援可選欄位', async () => {
      const validator = createRequestValidator({
        body: z.object({
          name: z.string(),
          email: z.string().email().optional(),
          age: z.number().optional()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test User' })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
      expect(result.data?.body).toEqual({ name: 'Test User' })
    })
  })

  describe('Query Parameters 驗證', () => {
    it('應該成功驗證 query parameters', () => {
      const validator = createRequestValidator({
        query: z.object({
          page: z.coerce.number().int().positive(),
          limit: z.coerce.number().int().positive()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?page=1&limit=10'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ page: 1, limit: 10 })
    })

    it('應該拒絕無效的 query parameters', () => {
      const validator = createRequestValidator({
        query: z.object({
          page: z.coerce.number().int().positive()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?page=-1'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('應該支援 query 參數的類型轉換', () => {
      const validator = createRequestValidator({
        query: z.object({
          enabled: z.coerce.boolean(),
          count: z.coerce.number()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?enabled=true&count=42'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ enabled: true, count: 42 })
    })

    it('應該處理空的 query parameters', () => {
      const validator = createRequestValidator({
        query: z.object({
          search: z.string().optional()
        })
      })

      const request = createMockNextRequest('http://localhost/api/test')

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
    })
  })

  describe('URL Parameters 驗證', () => {
    it('應該成功驗證 URL parameters', () => {
      const validator = createRequestValidator({
        params: z.object({
          id: z.string().uuid()
        })
      })

      const params = { id: '550e8400-e29b-41d4-a716-446655440000' }
      const result = validator['validateParams'](params)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(params)
    })

    it('應該拒絕無效的 URL parameters', () => {
      const validator = createRequestValidator({
        params: z.object({
          id: z.string().uuid()
        })
      })

      const params = { id: 'invalid-uuid' }
      const result = validator['validateParams'](params)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('應該支援多個 URL parameters', () => {
      const validator = createRequestValidator({
        params: z.object({
          userId: z.string(),
          postId: z.string()
        })
      })

      const params = { userId: 'user123', postId: 'post456' }
      const result = validator['validateParams'](params)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(params)
    })
  })

  describe('Headers 驗證', () => {
    it('應該成功驗證 headers', () => {
      const validator = createRequestValidator({
        headers: z.object({
          'x-api-key': z.string().min(1),
          'content-type': z.string()
        })
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-api-key': 'secret-key',
        'content-type': 'application/json'
      })

      const result = validator['validateHeaders'](request)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        'x-api-key': 'secret-key',
        'content-type': 'application/json'
      })
    })

    it('應該拒絕缺少必需的 headers', () => {
      const validator = createRequestValidator({
        headers: z.object({
          authorization: z.string()
        })
      })

      const request = createMockNextRequest('http://localhost/api/test')

      const result = validator['validateHeaders'](request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('應該支援 header 格式驗證', () => {
      const validator = createRequestValidator({
        headers: z.object({
          authorization: z.string().regex(/^Bearer .+$/)
        })
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        authorization: 'Bearer token123'
      })

      const result = validator['validateHeaders'](request)

      expect(result.success).toBe(true)
    })
  })

  describe('多源聯合驗證', () => {
    it('應該同時驗證 body 和 query', async () => {
      const validator = createRequestValidator({
        body: z.object({
          name: z.string()
        }),
        query: z.object({
          page: z.coerce.number()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?page=1',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test' })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
      expect(result.data?.body).toEqual({ name: 'Test' })
      expect(result.data?.query).toEqual({ page: 1 })
    })

    it('應該同時驗證所有來源', async () => {
      const validator = createRequestValidator({
        body: z.object({ data: z.string() }),
        query: z.object({ filter: z.string() }),
        params: z.object({ id: z.string() }),
        headers: z.object({ 'x-api-key': z.string() })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?filter=active',
        { 'x-api-key': 'key123' },
        {
          method: 'POST',
          body: JSON.stringify({ data: 'test' })
        }
      )

      const result = await validator.validate(request, { id: 'test-id' })

      expect(result.success).toBe(true)
      expect(result.data?.body).toEqual({ data: 'test' })
      expect(result.data?.query).toEqual({ filter: 'active' })
      expect(result.data?.params).toEqual({ id: 'test-id' })
      expect(result.data?.headers).toMatchObject({ 'x-api-key': 'key123' })
    })

    it('應該收集所有來源的錯誤', async () => {
      const validator = createRequestValidator({
        body: z.object({ name: z.string().min(5) }),
        query: z.object({ page: z.coerce.number().positive() })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?page=-1',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 'ab' })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.some(e => e.target === 'body')).toBe(true)
      expect(result.errors!.some(e => e.target === 'query')).toBe(true)
    })
  })

  describe('錯誤處理和格式化', () => {
    it('應該正確格式化 Zod 錯誤', async () => {
      const validator = createRequestValidator({
        body: z.object({
          email: z.string().email(),
          age: z.number().int().positive()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ email: 'invalid', age: -5 })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()

      const emailError = result.errors!.find(e => e.path.includes('email'))
      expect(emailError).toBeDefined()
      expect(emailError?.code).toBe('invalid_string')
      expect(emailError?.target).toBe('body')
    })

    it('應該使用 handle 方法返回錯誤響應', async () => {
      const validator = createRequestValidator({
        body: z.object({
          name: z.string()
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 123 })
        }
      )

      const response = await validator.handle(request)

      // Check response properties instead of instanceof (Jest compatibility)
      expect(response).toBeDefined()
      expect(typeof response).toBe('object')
      expect('status' in response).toBe(true)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('VALIDATION_ERROR')
      expect(data.errors).toBeDefined()
    })

    it('應該支援自訂錯誤處理器', async () => {
      const customErrorHandler = (errors: ValidationError[]) => {
        return NextResponse.json(
          { custom: true, errorCount: errors.length },
          { status: 422 }
        )
      }

      const validator = createRequestValidator({
        body: z.object({ name: z.string() }),
        errorHandler: customErrorHandler
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 123 })
        }
      )

      const response = await validator.handle(request)

      // Check response properties instead of instanceof (Jest compatibility)
      expect(response).toBeDefined()
      expect(typeof response).toBe('object')
      expect('status' in response).toBe(true)
      expect(response.status).toBe(422)
      const data = await response.json()
      expect(data.custom).toBe(true)
      expect(data.errorCount).toBeGreaterThan(0)
    })

    it('應該正確格式化錯誤路徑', async () => {
      const validator = createRequestValidator({
        body: z.object({
          user: z.object({
            profile: z.object({
              name: z.string().min(1)
            })
          })
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ user: { profile: { name: '' } } })
        }
      )

      const response = await validator.handle(request)

      // Check response is valid object
      expect(response).toBeDefined()
      expect('status' in response).toBe(true)
      const data = await response.json()
      const error = data.errors[0]
      expect(error.field).toBe('user.profile.name')
    })
  })

  describe('Common Schemas 預設', () => {
    it('應該正確驗證 pagination schema', () => {
      const validator = createRequestValidator({
        query: CommonSchemas.pagination
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?page=2&limit=20&sortBy=name&sortOrder=asc'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      })
    })

    it('應該為 pagination 提供默認值', () => {
      const validator = createRequestValidator({
        query: CommonSchemas.pagination
      })

      const request = createMockNextRequest('http://localhost/api/test')

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        page: 1,
        limit: 10,
        sortOrder: 'desc'
      })
    })

    it('應該正確驗證 id schema', () => {
      const validator = createRequestValidator({
        params: CommonSchemas.id
      })

      const params = { id: '550e8400-e29b-41d4-a716-446655440000' }
      const result = validator['validateParams'](params)

      expect(result.success).toBe(true)
    })

    it('應該正確驗證 dateRange schema', () => {
      const validator = createRequestValidator({
        query: CommonSchemas.dateRange
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?startDate=2025-01-01&endDate=2025-12-31'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data?.startDate).toBeInstanceOf(Date)
      expect(result.data?.endDate).toBeInstanceOf(Date)
    })

    it('應該正確驗證 search schema', () => {
      const validator = createRequestValidator({
        query: CommonSchemas.search
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?q=test+query'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data?.q).toBe('test query')
    })

    it('應該正確驗證 authHeaders schema', () => {
      const validator = createRequestValidator({
        headers: CommonSchemas.authHeaders
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        authorization: 'Bearer token123'
      })

      const result = validator['validateHeaders'](request)

      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的 authHeaders 格式', () => {
      const validator = createRequestValidator({
        headers: CommonSchemas.authHeaders
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        authorization: 'InvalidFormat'
      })

      const result = validator['validateHeaders'](request)

      expect(result.success).toBe(false)
    })
  })

  describe('便捷函數', () => {
    it('createRequestValidator 應該創建驗證器實例', () => {
      const validator = createRequestValidator({
        body: z.object({ name: z.string() })
      })

      expect(validator).toBeInstanceOf(RequestValidator)
    })

    it('validateRequest 應該創建驗證中間件', async () => {
      const handler = validateRequest({
        body: z.object({ name: z.string() })
      })(async (request, { data }) => {
        return NextResponse.json({ receivedName: data.body?.name })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test' })
        }
      )

      const response = await handler(request)
      const data = await response.json()

      expect(data.receivedName).toBe('Test')
    })

    it('validateRequest 中間件應該處理驗證錯誤', async () => {
      const handler = validateRequest({
        body: z.object({ name: z.string() })
      })(async (request, { data }) => {
        return NextResponse.json({ success: true })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 123 })
        }
      )

      const response = await handler(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Success Callback', () => {
    it('應該在驗證成功後調用 onSuccess 回調', async () => {
      let callbackCalled = false
      let callbackData: any = null

      const validator = createRequestValidator({
        body: z.object({ name: z.string() }),
        onSuccess: (validatedData) => {
          callbackCalled = true
          callbackData = validatedData
        }
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test' })
        }
      )

      await validator.validate(request)

      expect(callbackCalled).toBe(true)
      expect(callbackData.body).toEqual({ name: 'Test' })
    })

    it('應該在驗證失敗時不調用 onSuccess 回調', async () => {
      let callbackCalled = false

      const validator = createRequestValidator({
        body: z.object({ name: z.string() }),
        onSuccess: () => {
          callbackCalled = true
        }
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({ name: 123 })
        }
      )

      await validator.validate(request)

      expect(callbackCalled).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('應該處理空的配置對象', async () => {
      const validator = createRequestValidator({})

      const request = createMockNextRequest('http://localhost/api/test')

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
    })

    it('應該處理沒有提供 params 的情況', async () => {
      const validator = createRequestValidator({
        params: z.object({ id: z.string() })
      })

      const request = createMockNextRequest('http://localhost/api/test')

      // 不提供 params 參數
      const result = await validator.validate(request)

      expect(result.success).toBe(true)
    })

    it('應該處理複雜的嵌套對象驗證', async () => {
      const validator = createRequestValidator({
        body: z.object({
          user: z.object({
            name: z.string(),
            address: z.object({
              street: z.string(),
              city: z.string(),
              zipCode: z.string().regex(/^\d{5}$/)
            }),
            tags: z.array(z.string())
          })
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({
            user: {
              name: 'John',
              address: {
                street: '123 Main St',
                city: 'Springfield',
                zipCode: '12345'
              },
              tags: ['vip', 'premium']
            }
          })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
    })

    it('應該處理數組驗證', async () => {
      const validator = createRequestValidator({
        body: z.object({
          items: z.array(
            z.object({
              id: z.number(),
              name: z.string()
            })
          ).min(1)
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({
            items: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' }
            ]
          })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
      expect(result.data?.body.items).toHaveLength(2)
    })

    it('應該處理類型轉換和默認值', async () => {
      const validator = createRequestValidator({
        body: z.object({
          count: z.coerce.number().default(0),
          enabled: z.coerce.boolean().default(false),
          tags: z.array(z.string()).default([])
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({})
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
      expect(result.data?.body).toEqual({
        count: 0,
        enabled: false,
        tags: []
      })
    })

    it('應該處理極大的 pagination limit', () => {
      const validator = createRequestValidator({
        query: CommonSchemas.pagination
      })

      const request = createMockNextRequest(
        'http://localhost/api/test?limit=1000'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(false) // 應該超過最大限制 100
    })

    it('應該處理多個驗證錯誤', async () => {
      const validator = createRequestValidator({
        body: z.object({
          email: z.string().email(),
          age: z.number().int().positive(),
          username: z.string().min(3).max(20)
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/test',
        {},
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'invalid',
            age: -5,
            username: 'ab'
          })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('真實場景測試', () => {
    it('應該處理完整的用戶註冊請求', async () => {
      const validator = createRequestValidator({
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
          name: z.string().min(2).max(50),
          acceptTerms: z.boolean().refine(val => val === true)
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/register',
        {},
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'SecurePass123',
            name: 'John Doe',
            acceptTerms: true
          })
        }
      )

      const result = await validator.validate(request)

      expect(result.success).toBe(true)
    })

    it('應該處理帶有分頁和篩選的搜索請求', async () => {
      const validator = createRequestValidator({
        query: z.object({
          q: z.string().min(1),
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(10),
          category: z.enum(['product', 'user', 'post']).optional(),
          sortBy: z.enum(['relevance', 'date', 'popularity']).default('relevance')
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/search?q=test&page=2&limit=20&category=product&sortBy=date'
      )

      const result = validator['validateQuery'](request)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        q: 'test',
        page: 2,
        limit: 20,
        category: 'product',
        sortBy: 'date'
      })
    })

    it('應該處理帶認證的 API 更新請求', async () => {
      const validator = createRequestValidator({
        headers: z.object({
          authorization: z.string().regex(/^Bearer .+$/)
        }),
        params: z.object({
          id: z.string().uuid()
        }),
        body: z.object({
          title: z.string().min(1).max(200),
          content: z.string().optional(),
          published: z.boolean().default(false)
        })
      })

      const request = createMockNextRequest(
        'http://localhost/api/posts/550e8400-e29b-41d4-a716-446655440000',
        {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Updated Post',
            content: 'New content',
            published: true
          })
        }
      )

      const params = { id: '550e8400-e29b-41d4-a716-446655440000' }
      const result = await validator.validate(request, params)

      expect(result.success).toBe(true)
      expect(result.data?.body.title).toBe('Updated Post')
      expect(result.data?.params.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    })
  })
})