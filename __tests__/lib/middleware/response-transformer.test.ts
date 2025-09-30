/**
 * Response Transformation 中間件測試
 *
 * 測試範圍：
 * 1. Content Negotiation - JSON/XML/CSV 格式協商
 * 2. Pagination Wrapper - 分頁響應包裝
 * 3. HATEOAS Links - 超媒體連結生成
 * 4. Field Filtering - 欄位過濾
 * 5. Format Transformation - 格式轉換
 * 6. Edge Cases - 邊界情況處理
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ResponseTransformer,
  createResponseTransformer,
  withResponseTransformer,
  type PaginatedResponse,
  type HateoasLink,
  type TransformOptions
} from '@/lib/middleware/response-transformer'
import { createMockNextRequest } from '@/__tests__/utils/mock-next-request'

describe('ResponseTransformer', () => {
  describe('Content Negotiation', () => {
    it('應該默認返回 JSON 格式', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = { name: 'John', email: 'john@example.com' }

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('應該根據 Accept header 返回 XML 格式', () => {
      const transformer = new ResponseTransformer({
        allowedFormats: ['json', 'xml']
      })
      const request = createMockNextRequest('http://localhost/api/users', {
        Accept: 'application/xml'
      })
      const data = { name: 'John', email: 'john@example.com' }

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('application/xml')
    })

    it('應該根據 Accept header 返回 CSV 格式', () => {
      const transformer = new ResponseTransformer({
        allowedFormats: ['json', 'csv']
      })
      const request = createMockNextRequest('http://localhost/api/users', {
        Accept: 'text/csv'
      })
      const data = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' }
      ]

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('text/csv')
      expect(response.headers.get('content-disposition')).toContain('attachment')
    })

    it('應該優先使用查詢參數指定的格式', () => {
      const transformer = new ResponseTransformer({
        allowedFormats: ['json', 'xml']
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?format=xml',
        {
          Accept: 'application/json' // Accept header 應該被查詢參數覆蓋
        }
      )
      const data = { name: 'John' }

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('application/xml')
    })

    it('應該拒絕不允許的格式並使用默認格式', () => {
      const transformer = new ResponseTransformer({
        allowedFormats: ['json'], // 只允許 JSON
        defaultFormat: 'json'
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?format=xml' // 嘗試使用不允許的格式
      )
      const data = { name: 'John' }

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('應該處理多個 Accept header 值', () => {
      const transformer = new ResponseTransformer({
        allowedFormats: ['json', 'xml']
      })
      const request = createMockNextRequest('http://localhost/api/users', {
        Accept: 'text/html, application/xml;q=0.9, */*;q=0.8'
      })
      const data = { name: 'John' }

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('application/xml')
    })
  })

  describe('Pagination Wrapper', () => {
    it('應該創建基本的分頁響應結構', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 1,
          limit: 10,
          total: 2
        }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('meta')
        expect(result.data).toEqual(data)
        expect(result.meta).toEqual({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        })
      })
    })

    it('應該正確計算分頁元數據', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 2,
          limit: 10,
          total: 35
        }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.meta).toEqual({
          page: 2,
          limit: 10,
          total: 35,
          totalPages: 4,
          hasNext: true,
          hasPrev: true
        })
      })
    })

    it('應該在第一頁時設置 hasPrev 為 false', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 1,
          limit: 10,
          total: 50
        }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.meta.hasPrev).toBe(false)
        expect(result.meta.hasNext).toBe(true)
      })
    })

    it('應該在最後一頁時設置 hasNext 為 false', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 5,
          limit: 10,
          total: 50
        }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.meta.hasPrev).toBe(true)
        expect(result.meta.hasNext).toBe(false)
      })
    })

    it('應該處理單頁結果（total < limit）', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }, { id: 2 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 1,
          limit: 10,
          total: 2
        }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.meta.totalPages).toBe(1)
        expect(result.meta.hasNext).toBe(false)
        expect(result.meta.hasPrev).toBe(false)
      })
    })

    it('應該處理空結果集', () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data: any[] = []

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 1,
          limit: 10,
          total: 0
        }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.data).toEqual([])
        expect(result.meta.total).toBe(0)
        expect(result.meta.totalPages).toBe(0)
      })
    })
  })

  describe('HATEOAS Links', () => {
    it('應該生成基本的 HATEOAS 連結', () => {
      const transformer = new ResponseTransformer({
        enableLinks: true
      })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        },
        baseUrl: 'http://localhost',
        resourcePath: '/api/users'
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.links).toBeDefined()
        expect(Array.isArray(result.links)).toBe(true)
        const selfLink = result.links!.find((link) => link.rel === 'self')
        expect(selfLink).toBeDefined()
        expect(selfLink!.href).toContain('/api/users')
      })
    })

    it('應該生成 self 連結', () => {
      const transformer = new ResponseTransformer({ enableLinks: true })
      const request = createMockNextRequest('http://localhost/api/users?page=2')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 2, limit: 10, total: 50 },
        baseUrl: 'http://localhost',
        resourcePath: '/api/users'
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        const selfLink = result.links!.find((link) => link.rel === 'self')
        expect(selfLink).toBeDefined()
        expect(selfLink!.href).toContain('page=2')
        expect(selfLink!.method).toBe('GET')
      })
    })

    it('應該生成 next 和 prev 連結', () => {
      const transformer = new ResponseTransformer({ enableLinks: true })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 2, limit: 10, total: 50 },
        baseUrl: 'http://localhost',
        resourcePath: '/api/users'
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        const nextLink = result.links!.find((link) => link.rel === 'next')
        const prevLink = result.links!.find((link) => link.rel === 'prev')

        expect(nextLink).toBeDefined()
        expect(nextLink!.href).toContain('page=3')

        expect(prevLink).toBeDefined()
        expect(prevLink!.href).toContain('page=1')
      })
    })

    it('應該生成 first 和 last 連結', () => {
      const transformer = new ResponseTransformer({ enableLinks: true })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 2, limit: 10, total: 50 },
        baseUrl: 'http://localhost',
        resourcePath: '/api/users'
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        const firstLink = result.links!.find((link) => link.rel === 'first')
        const lastLink = result.links!.find((link) => link.rel === 'last')

        expect(firstLink).toBeDefined()
        expect(firstLink!.href).toContain('page=1')

        expect(lastLink).toBeDefined()
        expect(lastLink!.href).toContain('page=5')
      })
    })

    it('應該在第一頁時不生成 prev 和 first 連結', () => {
      const transformer = new ResponseTransformer({ enableLinks: true })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 1, limit: 10, total: 50 },
        baseUrl: 'http://localhost',
        resourcePath: '/api/users'
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        const prevLink = result.links!.find((link) => link.rel === 'prev')
        const firstLink = result.links!.find((link) => link.rel === 'first')

        expect(prevLink).toBeUndefined()
        expect(firstLink).toBeUndefined()
      })
    })

    it('應該在最後一頁時不生成 next 和 last 連結', () => {
      const transformer = new ResponseTransformer({ enableLinks: true })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 5, limit: 10, total: 50 },
        baseUrl: 'http://localhost',
        resourcePath: '/api/users'
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        const nextLink = result.links!.find((link) => link.rel === 'next')
        const lastLink = result.links!.find((link) => link.rel === 'last')

        expect(nextLink).toBeUndefined()
        expect(lastLink).toBeUndefined()
      })
    })

    it('應該允許禁用 HATEOAS 連結', () => {
      const transformer = new ResponseTransformer({ enableLinks: false })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 1, limit: 10, total: 50 }
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(result.links).toBeUndefined()
      })
    })

    it('應該支持自定義連結生成器', () => {
      const customLinkGenerator = jest.fn(
        (request: NextRequest): HateoasLink[] => [
          {
            rel: 'custom',
            href: 'http://localhost/api/custom',
            method: 'POST',
            title: 'Custom Action'
          }
        ]
      )

      const transformer = new ResponseTransformer({ enableLinks: true })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: { page: 1, limit: 10, total: 1 },
        customLinkGenerator
      })

      const body = response.json() as unknown as Promise<PaginatedResponse>
      body.then((result) => {
        expect(customLinkGenerator).toHaveBeenCalled()
        const customLink = result.links!.find((link) => link.rel === 'custom')
        expect(customLink).toBeDefined()
        expect(customLink!.title).toBe('Custom Action')
      })
    })
  })

  describe('Field Filtering', () => {
    it('應該根據 fields 查詢參數過濾欄位', () => {
      const transformer = new ResponseTransformer({
        enableFieldFiltering: true
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?fields=name,email'
      )
      const data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        role: 'admin'
      }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(result).toEqual({
          name: 'John',
          email: 'john@example.com'
        })
        expect(result).not.toHaveProperty('password')
        expect(result).not.toHaveProperty('role')
      })
    })

    it('應該處理數組數據的欄位過濾', () => {
      const transformer = new ResponseTransformer({
        enableFieldFiltering: true
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?fields=name,email'
      )
      const data = [
        {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          password: 'secret1'
        },
        {
          id: 2,
          name: 'Jane',
          email: 'jane@example.com',
          password: 'secret2'
        }
      ]

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any[]>

      body.then((result) => {
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ name: 'John', email: 'john@example.com' })
        expect(result[0]).not.toHaveProperty('password')
      })
    })

    it('應該支持嵌套欄位過濾', () => {
      const transformer = new ResponseTransformer({
        enableFieldFiltering: true
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?fields=name,profile.bio'
      )
      const data = {
        id: 1,
        name: 'John',
        profile: {
          bio: 'Developer',
          age: 30,
          location: 'NYC'
        }
      }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(result.name).toBe('John')
        expect(result.profile).toBeDefined()
        expect(result.profile.bio).toBe('Developer')
        expect(result.profile).not.toHaveProperty('age')
        expect(result.profile).not.toHaveProperty('location')
      })
    })

    it('應該處理不存在的欄位名稱', () => {
      const transformer = new ResponseTransformer({
        enableFieldFiltering: true
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?fields=name,nonexistent'
      )
      const data = {
        id: 1,
        name: 'John',
        email: 'john@example.com'
      }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(result).toEqual({ name: 'John' })
        expect(result).not.toHaveProperty('nonexistent')
      })
    })

    it('應該在沒有 fields 參數時返回所有欄位', () => {
      const transformer = new ResponseTransformer({
        enableFieldFiltering: true
      })
      const request = createMockNextRequest('http://localhost/api/users')
      const data = {
        id: 1,
        name: 'John',
        email: 'john@example.com'
      }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(result).toEqual(data)
      })
    })

    it('應該允許禁用欄位過濾', () => {
      const transformer = new ResponseTransformer({
        enableFieldFiltering: false
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?fields=name'
      )
      const data = {
        id: 1,
        name: 'John',
        email: 'john@example.com'
      }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        // 應該返回所有欄位，忽略 fields 參數
        expect(result).toEqual(data)
      })
    })
  })

  describe('Format Transformation', () => {
    describe('XML 格式', () => {
      it('應該將簡單對象轉換為 XML', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'xml']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=xml'
        )
        const data = { name: 'John', email: 'john@example.com' }

        const response = transformer.transform(request, data)
        const xmlText = await response.text()

        expect(xmlText).toContain('<?xml version="1.0" encoding="UTF-8"?>')
        expect(xmlText).toContain('<name>John</name>')
        expect(xmlText).toContain('<email>john@example.com</email>')
      })

      it('應該將數組轉換為 XML', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'xml']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=xml'
        )
        const data = [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' }
        ]

        const response = transformer.transform(request, data)
        const xmlText = await response.text()

        expect(xmlText).toContain('<item>')
        expect(xmlText).toContain('<name>John</name>')
        expect(xmlText).toContain('<name>Jane</name>')
      })

      it('應該正確轉義 XML 特殊字符', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'xml']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=xml'
        )
        const data = {
          name: 'John & Jane',
          bio: '<p>Developer</p>',
          quote: '"Hello World"'
        }

        const response = transformer.transform(request, data)
        const xmlText = await response.text()

        expect(xmlText).toContain('&amp;')
        expect(xmlText).toContain('&lt;')
        expect(xmlText).toContain('&gt;')
        expect(xmlText).toContain('&quot;')
      })

      it('應該處理嵌套對象', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'xml']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=xml'
        )
        const data = {
          name: 'John',
          profile: {
            bio: 'Developer',
            location: 'NYC'
          }
        }

        const response = transformer.transform(request, data)
        const xmlText = await response.text()

        expect(xmlText).toContain('<profile>')
        expect(xmlText).toContain('<bio>Developer</bio>')
        expect(xmlText).toContain('<location>NYC</location>')
        expect(xmlText).toContain('</profile>')
      })

      it('應該處理 null 和 undefined 值', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'xml']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=xml'
        )
        const data = {
          name: 'John',
          email: null,
          phone: undefined
        }

        const response = transformer.transform(request, data)
        const xmlText = await response.text()

        expect(xmlText).toContain('<name>John</name>')
        expect(xmlText).toContain('<email/>')
        expect(xmlText).toContain('<phone/>')
      })
    })

    describe('CSV 格式', () => {
      it('應該將對象數組轉換為 CSV', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'csv']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=csv'
        )
        const data = [
          { id: 1, name: 'John', email: 'john@example.com' },
          { id: 2, name: 'Jane', email: 'jane@example.com' }
        ]

        const response = transformer.transform(request, data)
        const csvText = await response.text()

        const lines = csvText.split('\n')
        expect(lines[0]).toContain('id')
        expect(lines[0]).toContain('name')
        expect(lines[0]).toContain('email')
        expect(lines[1]).toContain('John')
        expect(lines[2]).toContain('Jane')
      })

      it('應該正確轉義 CSV 特殊字符', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'csv']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=csv'
        )
        const data = [
          {
            name: 'John, Jr.',
            bio: 'Developer "Expert"',
            note: 'Line1\nLine2'
          }
        ]

        const response = transformer.transform(request, data)
        const csvText = await response.text()

        // CSV 應該用引號包裹包含特殊字符的值
        expect(csvText).toContain('"John, Jr."')
        expect(csvText).toContain('"Developer ""Expert"""')
        expect(csvText).toContain('"Line1\nLine2"')
      })

      it('應該處理空數組', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'csv']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=csv'
        )
        const data: any[] = []

        const response = transformer.transform(request, data)
        const csvText = await response.text()

        expect(csvText).toBe('')
      })

      it('應該處理不同欄位的對象', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'csv']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=csv'
        )
        const data = [
          { id: 1, name: 'John', email: 'john@example.com' },
          { id: 2, name: 'Jane', phone: '123-456-7890' } // 不同的欄位
        ]

        const response = transformer.transform(request, data)
        const csvText = await response.text()

        const lines = csvText.split('\n')
        // 標題行應該包含所有欄位
        expect(lines[0]).toContain('id')
        expect(lines[0]).toContain('name')
        expect(lines[0]).toContain('email')
        expect(lines[0]).toContain('phone')
      })

      it('應該處理嵌套對象（序列化為 JSON）', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'csv']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=csv'
        )
        const data = [
          {
            name: 'John',
            profile: {
              bio: 'Developer',
              location: 'NYC'
            }
          }
        ]

        const response = transformer.transform(request, data)
        const csvText = await response.text()

        // 嵌套對象應該被序列化為 JSON 字符串
        expect(csvText).toContain('profile')
        expect(csvText).toContain('"bio"')
        expect(csvText).toContain('"location"')
      })

      it('應該處理分頁響應的 CSV 轉換', async () => {
        const transformer = new ResponseTransformer({
          allowedFormats: ['json', 'csv']
        })
        const request = createMockNextRequest(
          'http://localhost/api/users?format=csv'
        )
        const data = [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]

        const response = transformer.transform(request, data, {
          paginate: true,
          pagination: { page: 1, limit: 10, total: 2 }
        })

        const csvText = await response.text()

        // 應該只包含數據，不包含元數據
        const lines = csvText.split('\n')
        expect(lines.length).toBeGreaterThan(2) // 標題 + 2 行數據
      })
    })
  })

  describe('Response Wrapping', () => {
    it('應該允許不包裝單個對象', () => {
      const transformer = new ResponseTransformer({
        wrapSingleObject: false
      })
      const request = createMockNextRequest('http://localhost/api/users/1')
      const data = { id: 1, name: 'John' }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(result).toEqual(data)
        expect(result).not.toHaveProperty('data')
      })
    })

    it('應該允許包裝單個對象', () => {
      const transformer = new ResponseTransformer({
        wrapSingleObject: true
      })
      const request = createMockNextRequest('http://localhost/api/users/1')
      const data = { id: 1, name: 'John' }

      const response = transformer.transform(request, data)
      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(result).toHaveProperty('data')
        expect(result.data).toEqual(data)
      })
    })

    it('應該支持自定義轉換器', () => {
      const customTransformer = jest.fn((data: any) => ({
        ...data,
        transformed: true
      }))

      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = { name: 'John' }

      const response = transformer.transform(request, data, {
        customTransformer
      })

      const body = response.json() as unknown as Promise<any>

      body.then((result) => {
        expect(customTransformer).toHaveBeenCalledWith(data)
        expect(result.transformed).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('應該處理空數據', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = null

      const response = transformer.transform(request, data)
      const result = await response.json()

      expect(result).toBeNull()
    })

    it('應該處理 undefined 數據', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = undefined

      const response = transformer.transform(request, data)
      const result = await response.json()

      expect(result).toBeUndefined()
    })

    it('應該處理原始值數據', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/count')
      const data = 42

      const response = transformer.transform(request, data)
      const result = await response.json()

      expect(result).toBe(42)
    })

    it('應該處理字符串數據', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/message')
      const data = 'Hello World'

      const response = transformer.transform(request, data)
      const result = await response.json()

      expect(result).toBe('Hello World')
    })

    it('應該處理布爾值數據', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/status')
      const data = true

      const response = transformer.transform(request, data)
      const result = await response.json()

      expect(result).toBe(true)
    })

    it('應該處理無效的格式請求（fallback 到默認）', () => {
      const transformer = new ResponseTransformer({
        allowedFormats: ['json'],
        defaultFormat: 'json'
      })
      const request = createMockNextRequest(
        'http://localhost/api/users?format=invalid'
      )
      const data = { name: 'John' }

      const response = transformer.transform(request, data)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('應該處理缺少分頁元數據的情況', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = [{ id: 1 }]

      // paginate: true 但沒有提供 pagination 參數
      const response = transformer.transform(request, data, {
        paginate: true
      })

      const result = await response.json()

      // 應該返回原始數據，不包裝為分頁響應
      expect(result).toEqual(data)
    })

    it('應該處理超大的分頁數據', async () => {
      const transformer = new ResponseTransformer()
      const request = createMockNextRequest('http://localhost/api/users')
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }))

      const response = transformer.transform(request, data, {
        paginate: true,
        pagination: {
          page: 1,
          limit: 1000,
          total: 1000000
        }
      })

      const result = await response.json()

      expect(result.meta.totalPages).toBe(1000)
      expect(result.data).toHaveLength(1000)
    })
  })

  describe('Convenience Functions', () => {
    it('createResponseTransformer 應該創建帶配置的實例', () => {
      const transformer = createResponseTransformer({
        allowedFormats: ['json', 'xml'],
        defaultFormat: 'xml'
      })

      expect(transformer).toBeInstanceOf(ResponseTransformer)
    })

    it('withResponseTransformer 應該返回中間件函數', () => {
      const middleware = withResponseTransformer({
        enableLinks: true
      })

      expect(typeof middleware).toBe('function')
    })

    it('withResponseTransformer 中間件應該正常工作', async () => {
      const request = createMockNextRequest('http://localhost/api/users')
      const mockHandler = jest.fn(async () => {
        return [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      })

      const wrappedHandler = withResponseTransformer({
        enableLinks: false,
        paginate: true,
        pagination: { page: 1, limit: 10, total: 2 }
      })(mockHandler)

      const response = await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalled()
      const body = (await response.json()) as PaginatedResponse

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('meta')
      expect(body.links).toBeUndefined() // enableLinks: false
    })
  })
})