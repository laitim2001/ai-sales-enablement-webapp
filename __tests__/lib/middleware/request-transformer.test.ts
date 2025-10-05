/**
 * Request Transformer Middleware Tests
 *
 * Tests for the Request Transformation middleware that provides:
 * 1. Field naming conversion (camelCase, snake_case, kebab-case, PascalCase)
 * 2. Date formatting (ISO 8601, timestamp, custom)
 * 3. Data cleaning (remove empty, trim strings, deduplication)
 * 4. Flatten/unflatten object structures
 * 5. Batch request processing
 * 6. Custom transformers
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  RequestTransformer,
  createRequestTransformer,
  withRequestTransformer,
  type TransformOptions,
  type BatchRequest
} from '@/lib/middleware/request-transformer'

/**
 * Helper function to create mock NextRequest for testing
 */
function createMockNextRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'POST', body = {}, headers = {} } = options

  const requestInit: {
    method?: string
    headers?: HeadersInit
    body?: BodyInit
    signal?: AbortSignal
  } = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  }

  if (method !== 'GET' && method !== 'HEAD') {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(url, requestInit as any)
}

describe('RequestTransformer - Field Naming Conversion', () => {
  test('should convert field names to camelCase', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_name: 'John',
        user_email: 'john@example.com',
        created_at: '2025-10-01T12:00:00Z'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      userName: 'John',
      userEmail: 'john@example.com',
      createdAt: '2025-10-01T12:00:00.000Z'
    })
  })

  test('should convert field names to snake_case', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'snake_case'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        userName: 'John',
        userEmail: 'john@example.com',
        createdAt: '2025-10-01T12:00:00Z'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      user_name: 'John',
      user_email: 'john@example.com',
      created_at: '2025-10-01T12:00:00.000Z'
    })
  })

  test('should convert field names to kebab-case', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'kebab-case'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        userName: 'John',
        userEmail: 'john@example.com',
        createdAt: '2025-10-01T12:00:00Z'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      'user-name': 'John',
      'user-email': 'john@example.com',
      'created-at': '2025-10-01T12:00:00.000Z'
    })
  })

  test('should convert field names to PascalCase', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'PascalCase'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_name: 'John',
        user_email: 'john@example.com',
        created_at: '2025-10-01T12:00:00Z'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      UserName: 'John',
      UserEmail: 'john@example.com',
      CreatedAt: '2025-10-01T12:00:00.000Z'
    })
  })

  test('should convert nested object field names', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_info: {
          first_name: 'John',
          last_name: 'Doe',
          contact_info: {
            phone_number: '123-456-7890',
            email_address: 'john@example.com'
          }
        }
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      userInfo: {
        firstName: 'John',
        lastName: 'Doe',
        contactInfo: {
          phoneNumber: '123-456-7890',
          emailAddress: 'john@example.com'
        }
      }
    })
  })

  test('should convert field names in arrays of objects', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_list: [
          { user_name: 'John', user_age: 30 },
          { user_name: 'Jane', user_age: 25 }
        ]
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      userList: [
        { userName: 'John', userAge: 30 },
        { userName: 'Jane', userAge: 25 }
      ]
    })
  })
})

describe('RequestTransformer - Date Formatting', () => {
  test('should format dates as ISO 8601 by default', async () => {
    const transformer = createRequestTransformer({
      dateFormat: 'iso'
    })

    const testDate = new Date('2025-10-01T12:00:00Z')
    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        createdAt: testDate.toISOString(),
        updatedAt: testDate.toISOString()
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.createdAt).toBe('2025-10-01T12:00:00.000Z')
    expect(body.updatedAt).toBe('2025-10-01T12:00:00.000Z')
  })

  test('should format dates as Unix timestamp', async () => {
    const transformer = createRequestTransformer({
      dateFormat: 'timestamp'
    })

    const testDate = new Date('2025-10-01T12:00:00Z')
    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        createdAt: testDate.toISOString(),
        timestamp: testDate.getTime()
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(typeof body.createdAt).toBe('number')
    expect(body.createdAt).toBe(testDate.getTime())
  })

  test('should format nested dates', async () => {
    const transformer = createRequestTransformer({
      dateFormat: 'iso'
    })

    const testDate = new Date('2025-10-01T12:00:00Z')
    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user: {
          name: 'John',
          metadata: {
            createdAt: testDate.toISOString(),
            lastLogin: testDate.toISOString()
          }
        }
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.user.metadata.createdAt).toBe('2025-10-01T12:00:00.000Z')
    expect(body.user.metadata.lastLogin).toBe('2025-10-01T12:00:00.000Z')
  })

  test('should handle invalid date strings gracefully', async () => {
    const transformer = createRequestTransformer({
      dateFormat: 'iso'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        invalidDate: 'not-a-date',
        validDate: new Date('2025-10-01T12:00:00Z').toISOString(),
        name: 'John'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.invalidDate).toBe('not-a-date')
    expect(body.validDate).toBe('2025-10-01T12:00:00.000Z')
    expect(body.name).toBe('John')
  })

  test('should preserve date arrays', async () => {
    const transformer = createRequestTransformer({
      dateFormat: 'iso'
    })

    const dates = [
      new Date('2025-10-01T12:00:00Z').toISOString(),
      new Date('2025-10-02T12:00:00Z').toISOString()
    ]

    const request = createMockNextRequest('http://localhost/api/test', {
      body: { timestamps: dates }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(Array.isArray(body.timestamps)).toBe(true)
    expect(body.timestamps.length).toBe(2)
  })
})

describe('RequestTransformer - Data Cleaning', () => {
  test('should remove empty values', async () => {
    const transformer = createRequestTransformer({
      removeEmpty: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        name: 'John',
        email: '',
        phone: null,
        address: undefined,
        age: 0,
        active: false
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      name: 'John',
      age: 0,
      active: false
    })
    expect(body.email).toBeUndefined()
    expect(body.phone).toBeUndefined()
    expect(body.address).toBeUndefined()
  })

  test('should trim string whitespace', async () => {
    const transformer = createRequestTransformer({
      trimStrings: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        name: '  John Doe  ',
        email: ' john@example.com ',
        description: '  Test description  '
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      description: 'Test description'
    })
  })

  test('should remove duplicate array items', async () => {
    const transformer = createRequestTransformer({
      removeDuplicates: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        tags: ['tag1', 'tag2', 'tag1', 'tag3', 'tag2'],
        numbers: [1, 2, 2, 3, 3, 3, 4]
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.tags).toEqual(['tag1', 'tag2', 'tag3'])
    expect(body.numbers).toEqual([1, 2, 3, 4])
  })

  test('should apply combined cleaning operations', async () => {
    const transformer = createRequestTransformer({
      removeEmpty: true,
      trimStrings: true,
      removeDuplicates: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        name: '  John  ',
        email: '',
        tags: ['  tag1  ', 'tag2', 'tag1'],
        phone: null
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      name: 'John',
      tags: ['tag1', 'tag2']
    })
  })

  test('should clean nested structures', async () => {
    const transformer = createRequestTransformer({
      removeEmpty: true,
      trimStrings: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user: {
          name: '  John  ',
          email: '',
          profile: {
            bio: '  Developer  ',
            website: null
          }
        }
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      user: {
        name: 'John',
        profile: {
          bio: 'Developer'
        }
      }
    })
  })
})

describe('RequestTransformer - Flatten/Unflatten', () => {
  test('should flatten nested objects', async () => {
    const transformer = createRequestTransformer({
      flatten: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user: {
          name: 'John',
          email: 'john@example.com',
          profile: {
            age: 30,
            city: 'New York'
          }
        }
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      'user.name': 'John',
      'user.email': 'john@example.com',
      'user.profile.age': 30,
      'user.profile.city': 'New York'
    })
  })

  test('should respect maxDepth when flattening', async () => {
    const transformer = createRequestTransformer({
      flatten: true,
      maxDepth: 2
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        level1: {
          level2: {
            level3: {
              level4: 'deep value'
            }
          }
        }
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    // Should flatten to depth 2, keep level3 nested
    expect(body['level1.level2']).toBeDefined()
    expect(typeof body['level1.level2']).toBe('object')
    expect(body['level1.level2'].level3).toBeDefined()
    expect(body['level1.level2'].level3.level4).toBe('deep value')
  })

  test('should unflatten flat objects', async () => {
    const transformer = createRequestTransformer({
      unflatten: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        'user.name': 'John',
        'user.email': 'john@example.com',
        'user.profile.age': 30,
        'user.profile.city': 'New York'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      user: {
        name: 'John',
        email: 'john@example.com',
        profile: {
          age: 30,
          city: 'New York'
        }
      }
    })
  })

  test('should handle flatten with arrays', async () => {
    const transformer = createRequestTransformer({
      flatten: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toHaveProperty('users.0.name', 'John')
    expect(body).toHaveProperty('users.1.name', 'Jane')
  })

  test('should round-trip flatten and unflatten', async () => {
    const flattenTransformer = createRequestTransformer({ flatten: true })
    const unflattenTransformer = createRequestTransformer({ unflatten: true })

    const original = {
      user: {
        name: 'John',
        profile: {
          age: 30,
          city: 'New York'
        }
      }
    }

    const request = createMockNextRequest('http://localhost/api/test', {
      body: original
    })

    const flattened = await flattenTransformer.transform(request)
    const flattenedBody = await flattened.json()

    const unflattenRequest = createMockNextRequest('http://localhost/api/test', {
      body: flattenedBody
    })

    const unflattened = await unflattenTransformer.transform(unflattenRequest)
    const unflattenedBody = await unflattened.json()

    expect(unflattenedBody).toEqual(original)
  })
})

describe('RequestTransformer - Batch Processing', () => {
  test('should validate batch request structure', async () => {
    const transformer = createRequestTransformer({
      enableBatch: true
    })

    const batchRequest: BatchRequest = {
      batch: [
        {
          id: '1',
          method: 'GET',
          url: '/api/users/1'
        },
        {
          id: '2',
          method: 'POST',
          url: '/api/users',
          body: { name: 'John' }
        }
      ]
    }

    const request = createMockNextRequest('http://localhost/api/batch', {
      body: batchRequest
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.batch).toBeDefined()
    expect(Array.isArray(body.batch)).toBe(true)
    expect(body.batch.length).toBe(2)
  })

  test('should reject batch requests exceeding size limit', async () => {
    const transformer = createRequestTransformer({
      enableBatch: true,
      maxBatchSize: 2
    })

    const batchRequest: BatchRequest = {
      batch: [
        { id: '1', method: 'GET', url: '/api/users/1' },
        { id: '2', method: 'GET', url: '/api/users/2' },
        { id: '3', method: 'GET', url: '/api/users/3' }
      ]
    }

    const request = createMockNextRequest('http://localhost/api/batch', {
      body: batchRequest
    })

    await expect(transformer.transform(request)).rejects.toThrow(
      'Batch size exceeds maximum'
    )
  })

  test('should validate required batch item fields', async () => {
    const transformer = createRequestTransformer({
      enableBatch: true
    })

    const invalidBatch = {
      batch: [
        { id: '1', method: 'GET' } // Missing url
      ]
    }

    const request = createMockNextRequest('http://localhost/api/batch', {
      body: invalidBatch
    })

    await expect(transformer.transform(request)).rejects.toThrow()
  })

  test('should validate HTTP methods in batch requests', async () => {
    const transformer = createRequestTransformer({
      enableBatch: true
    })

    const invalidBatch = {
      batch: [
        {
          id: '1',
          method: 'INVALID',
          url: '/api/users'
        }
      ]
    }

    const request = createMockNextRequest('http://localhost/api/batch', {
      body: invalidBatch
    })

    await expect(transformer.transform(request)).rejects.toThrow(
      'invalid method'
    )
  })

  test('should process batch with transformations', async () => {
    const transformer = createRequestTransformer({
      enableBatch: true,
      fieldNaming: 'camelCase',
      trimStrings: true
    })

    const batchRequest = {
      batch: [
        {
          id: '1',
          method: 'POST',
          url: '/api/users',
          body: {
            user_name: '  John  ',
            user_email: 'john@example.com'
          }
        }
      ]
    }

    const request = createMockNextRequest('http://localhost/api/batch', {
      body: batchRequest
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.batch[0].body).toEqual({
      userName: 'John',
      userEmail: 'john@example.com'
    })
  })
})

describe('RequestTransformer - Custom Transformers', () => {
  test('should apply custom transformer function', async () => {
    const customTransformer = (data: any) => {
      if (data.price) {
        data.priceWithTax = data.price * 1.2
      }
      return data
    }

    const transformer = createRequestTransformer({
      customTransformers: [customTransformer]
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: { price: 100, name: 'Product' }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.priceWithTax).toBe(120)
    expect(body.name).toBe('Product')
  })

  test('should apply multiple custom transformers in order', async () => {
    const addTax = (data: any) => {
      if (data.price) {
        data.priceWithTax = data.price * 1.2
      }
      return data
    }

    const addDiscount = (data: any) => {
      if (data.priceWithTax) {
        data.finalPrice = data.priceWithTax * 0.9
      }
      return data
    }

    const transformer = createRequestTransformer({
      customTransformers: [addTax, addDiscount]
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: { price: 100 }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.priceWithTax).toBe(120)
    expect(body.finalPrice).toBe(108)
  })

  test('should handle custom transformer errors gracefully', async () => {
    const faultyTransformer = () => {
      throw new Error('Transformer error')
    }

    const transformer = createRequestTransformer({
      customTransformers: [faultyTransformer]
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: { name: 'John' }
    })

    // Should not throw, but return original data
    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.name).toBe('John')
  })
})

describe('RequestTransformer - Edge Cases', () => {
  test('should handle null body gracefully', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      method: 'GET'
    })

    const transformed = await transformer.transform(request)

    // Should return request unchanged
    expect(transformed.method).toBe('GET')
  })

  test('should handle empty object', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase',
      removeEmpty: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {}
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({})
  })

  test('should handle empty arrays', async () => {
    const transformer = createRequestTransformer({
      removeDuplicates: true
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        items: [],
        tags: []
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.items).toEqual([])
    expect(body.tags).toEqual([])
  })

  test('should preserve primitive values', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        string: 'text',
        number: 42,
        boolean: true,
        nullValue: null
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.string).toBe('text')
    expect(body.number).toBe(42)
    expect(body.boolean).toBe(true)
    expect(body.nullValue).toBeNull()
  })

  test('should handle deeply nested structures', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    const deepObject = {
      level_1: {
        level_2: {
          level_3: {
            level_4: {
              level_5: {
                deep_value: 'found'
              }
            }
          }
        }
      }
    }

    const request = createMockNextRequest('http://localhost/api/test', {
      body: deepObject
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body.level1.level2.level3.level4.level5.deepValue).toBe('found')
  })

  test('should handle disabled transformer', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase',
      enabled: false
    })

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_name: 'John',
        user_email: 'john@example.com'
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    // Should return unchanged
    expect(body).toEqual({
      user_name: 'John',
      user_email: 'john@example.com'
    })
  })
})

describe('RequestTransformer - Convenience Functions', () => {
  test('createRequestTransformer should create instance', () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase'
    })

    expect(transformer).toBeInstanceOf(RequestTransformer)
  })

  test('withRequestTransformer should wrap handler', async () => {
    const handler = jest.fn(async (req: NextRequest) => {
      const body = await req.json()
      return NextResponse.json(body)
    })

    const wrappedHandler = withRequestTransformer({
      fieldNaming: 'camelCase',
    })(handler)

    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_name: 'John',
        user_email: 'john@example.com'
      }
    })

    await wrappedHandler(request)

    expect(handler).toHaveBeenCalled()
    const calledRequest = handler.mock.calls[0][0]
    const body = await calledRequest.json()

    expect(body).toEqual({
      userName: 'John',
      userEmail: 'john@example.com'
    })
  })
})

describe('RequestTransformer - Integration Scenarios', () => {
  test('should apply multiple transformations together', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase',
      dateFormat: 'iso',
      removeEmpty: true,
      trimStrings: true,
      removeDuplicates: true
    })

    const testDate = new Date('2025-10-01T12:00:00Z')
    const request = createMockNextRequest('http://localhost/api/test', {
      body: {
        user_name: '  John  ',
        user_email: '',
        created_at: testDate.toISOString(),
        tags: ['tag1', 'tag1', '  tag2  '],
        phone_number: null
      }
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      userName: 'John',
      createdAt: '2025-10-01T12:00:00.000Z',
      tags: ['tag1', 'tag2']
    })
  })

  test('should handle complex real-world API request', async () => {
    const transformer = createRequestTransformer({
      fieldNaming: 'camelCase',
      removeEmpty: true,
      trimStrings: true,
      flatten: false
    })

    const apiRequest = {
      user_profile: {
        first_name: '  John  ',
        last_name: 'Doe',
        email_address: ' john.doe@example.com ',
        phone_number: '',
        address_info: {
          street_address: '123 Main St',
          city_name: 'New York',
          zip_code: null
        }
      },
      preferences: {
        newsletter_enabled: true,
        theme_setting: 'dark'
      }
    }

    const request = createMockNextRequest('http://localhost/api/users', {
      body: apiRequest
    })

    const transformed = await transformer.transform(request)
    const body = await transformed.json()

    expect(body).toEqual({
      userProfile: {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john.doe@example.com',
        addressInfo: {
          streetAddress: '123 Main St',
          cityName: 'New York'
        }
      },
      preferences: {
        newsletterEnabled: true,
        themeSetting: 'dark'
      }
    })
  })
})
