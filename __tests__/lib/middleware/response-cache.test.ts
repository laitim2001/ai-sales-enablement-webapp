/**
 * Response Cache 中間件測試
 *
 * 測試範圍：
 * 1. ETag Generation & Validation - ETag 生成、驗證、304 Not Modified
 * 2. Cache-Control Headers - max-age、s-maxage、public/private、directives
 * 3. Cache Storage - Memory storage、TTL、hit/miss、clear
 * 4. Cache Key Generation - URL-based、Query-aware、Header-aware、Custom
 * 5. Conditional Caching - Method、Status、Content-type filtering
 * 6. Cache Invalidation - Manual、Pattern-based、Tag-based
 * 7. Integration & Edge Cases - Stale-while-revalidate、Vary、Error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ResponseCache,
  createResponseCache,
  withResponseCache,
  MemoryCacheStorage,
  CachePresets,
  type CacheStorage,
  type CachedResponse
} from '@/lib/middleware/response-cache'

/**
 * Helper function to create mock NextRequest
 */
function createMockNextRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', headers = {} } = options

  return new NextRequest(url, {
    method,
    headers: {
      ...headers
    }
  })
}

/**
 * Helper function to create mock handler
 */
function createMockHandler(response: NextResponse) {
  return jest.fn(async () => response)
}

describe('ResponseCache - ETag Generation & Validation', () => {
  test('should generate strong ETag for response', async () => {
    const cache = createResponseCache({
      useETag: true,
      useWeakETag: false
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John', email: 'john@example.com' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('ETag')).toMatch(/^"[a-f0-9]{16}"$/)
    expect(response.headers.get('ETag')).not.toMatch(/^W\//)
  })

  test('should generate weak ETag when enabled', async () => {
    const cache = createResponseCache({
      useETag: true,
      useWeakETag: true
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('ETag')).toMatch(/^W\/"[a-f0-9]{16}"$/)
  })

  test('should return 304 Not Modified for matching ETag', async () => {
    const cache = createResponseCache({
      useETag: true
    })

    const request1 = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    // First request - get ETag
    const response1 = await cache.handle(request1, handler)
    const etag = response1.headers.get('ETag')

    // Second request with If-None-Match
    const request2 = createMockNextRequest('http://localhost/api/users', {
      headers: { 'if-none-match': etag! }
    })

    const response2 = await cache.handle(request2, handler)

    expect(response2.status).toBe(304)
    expect(response2.headers.get('ETag')).toBe(etag)
  })

  test('should support multiple ETags in If-None-Match', async () => {
    const cache = createResponseCache({
      useETag: true
    })

    const request1 = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response1 = await cache.handle(request1, handler)
    const etag = response1.headers.get('ETag')

    // Request with multiple ETags
    const request2 = createMockNextRequest('http://localhost/api/users', {
      headers: { 'if-none-match': `"outdated", ${etag}, "another"` }
    })

    const response2 = await cache.handle(request2, handler)

    expect(response2.status).toBe(304)
  })

  test('should match weak and strong ETags', async () => {
    const cache = createResponseCache({
      useETag: true,
      useWeakETag: true
    })

    const request1 = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response1 = await cache.handle(request1, handler)
    const weakETag = response1.headers.get('ETag')! // W/"hash"

    // Request with strong ETag version
    const strongETag = weakETag.replace(/^W\//, '')
    const request2 = createMockNextRequest('http://localhost/api/users', {
      headers: { 'if-none-match': strongETag }
    })

    const response2 = await cache.handle(request2, handler)

    expect(response2.status).toBe(304)
  })

  test('should support wildcard ETag matching', async () => {
    const cache = createResponseCache({
      useETag: true
    })

    const request1 = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    await cache.handle(request1, handler)

    // Request with wildcard
    const request2 = createMockNextRequest('http://localhost/api/users', {
      headers: { 'if-none-match': '*' }
    })

    const response2 = await cache.handle(request2, handler)

    expect(response2.status).toBe(304)
  })
})

describe('ResponseCache - Cache-Control Headers', () => {
  test('should set max-age directive', async () => {
    const cache = createResponseCache({
      maxAge: 600
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('max-age=600')
  })

  test('should set s-maxage directive', async () => {
    const cache = createResponseCache({
      maxAge: 300,
      sMaxAge: 600
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=600')
  })

  test('should set public directive', async () => {
    const cache = createResponseCache({
      public: true,
      private: false
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('public')
    expect(response.headers.get('Cache-Control')).not.toContain('private')
  })

  test('should set private directive by default', async () => {
    const cache = createResponseCache({})

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('private')
  })

  test('should set no-cache directive', async () => {
    const cache = createResponseCache({
      noCache: true
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('no-cache')
  })

  test('should set must-revalidate directive', async () => {
    const cache = createResponseCache({
      mustRevalidate: true
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('must-revalidate')
  })

  test('should set stale-while-revalidate directive', async () => {
    const cache = createResponseCache({
      staleWhileRevalidate: 600
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate=600')
  })

  test('should combine multiple Cache-Control directives', async () => {
    const cache = createResponseCache({
      public: true,
      maxAge: 300,
      sMaxAge: 600,
      mustRevalidate: true,
      staleWhileRevalidate: 900
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)
    const cacheControl = response.headers.get('Cache-Control')

    expect(cacheControl).toContain('public')
    expect(cacheControl).toContain('max-age=300')
    expect(cacheControl).toContain('s-maxage=600')
    expect(cacheControl).toContain('must-revalidate')
    expect(cacheControl).toContain('stale-while-revalidate=900')
  })
})

describe('ResponseCache - Cache Storage', () => {
  test('should cache response in memory', async () => {
    const storage = new MemoryCacheStorage()
    const cache = createResponseCache({
      storage,
      defaultTTL: 300
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    // First request - cache miss
    const response1 = await cache.handle(request, handler)
    expect(response1.headers.get('X-Cache')).toBeNull()

    // Second request - cache hit
    const response2 = await cache.handle(request, handler)
    expect(response2.headers.get('X-Cache')).toBe('HIT')
  })

  test('should return cached data without calling handler', async () => {
    const cache = createResponseCache({
      defaultTTL: 300
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // First request
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(1)

    // Second request - should use cache
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('should respect TTL expiration', async () => {
    jest.useFakeTimers()

    const storage = new MemoryCacheStorage()
    const cache = createResponseCache({
      storage,
      defaultTTL: 60 // 1 minute
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // First request
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(1)

    // Advance time by 30 seconds - cache should still be valid
    jest.advanceTimersByTime(30000)
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(1)

    // Advance time by 31 more seconds - cache should expire
    jest.advanceTimersByTime(31000)
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(2)

    jest.useRealTimers()
  })

  test('should set Age header for cached responses', async () => {
    jest.useFakeTimers()

    const cache = createResponseCache({
      defaultTTL: 300
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    // First request
    await cache.handle(request, handler)

    // Advance time by 10 seconds
    jest.advanceTimersByTime(10000)

    // Second request
    const response = await cache.handle(request, handler)
    expect(response.headers.get('Age')).toBe('10')

    jest.useRealTimers()
  })

  test('should clear cache', async () => {
    const cache = createResponseCache({
      defaultTTL: 300
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // First request - cache it
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(1)

    // Clear cache
    await cache.clear()

    // Next request should call handler again
    await cache.handle(request, handler)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should clear cache by pattern', async () => {
    const cache = createResponseCache({
      defaultTTL: 300
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Cache multiple URLs
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/2'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/posts/1'),
      handler
    )

    expect(handler).toHaveBeenCalledTimes(3)

    // Clear only users URLs
    await cache.clear('http://localhost/api/users/*')

    // Users URLs should call handler again, posts should be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(4)

    await cache.handle(
      createMockNextRequest('http://localhost/api/posts/1'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(4) // Still 4, cached
  })

  test('should check if cache exists', async () => {
    const cache = createResponseCache({
      defaultTTL: 300
    })

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    // Before caching
    expect(await cache.has(request.url)).toBe(false)

    // After caching
    await cache.handle(request, handler)
    expect(await cache.has(request.url)).toBe(true)
  })
})

describe('ResponseCache - Cache Key Generation', () => {
  test('should use URL as cache key by default', async () => {
    const cache = createResponseCache()

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Different URLs should have different cache
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/2'),
      handler
    )

    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should include query parameters in cache key', async () => {
    const cache = createResponseCache()

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Different query params should have different cache
    await cache.handle(
      createMockNextRequest('http://localhost/api/users?page=1'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users?page=2'),
      handler
    )

    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should vary cache by specified headers', async () => {
    const cache = createResponseCache({
      varyHeaders: ['Accept', 'Accept-Language']
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Different Accept headers should have different cache
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', {
        headers: { Accept: 'application/json' }
      }),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', {
        headers: { Accept: 'application/xml' }
      }),
      handler
    )

    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should set Vary header when varyHeaders is configured', async () => {
    const cache = createResponseCache({
      varyHeaders: ['Accept', 'Accept-Language']
    })

    const request = createMockNextRequest('http://localhost/api/users', {
      headers: { Accept: 'application/json' }
    })
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    await cache.handle(request, handler)

    // Second request should have Vary header
    const response = await cache.handle(request, handler)
    expect(response.headers.get('Vary')).toBe('Accept, Accept-Language')
  })

  test('should use custom key generator', async () => {
    const cache = createResponseCache({
      keyGenerator: (request) => {
        // Use only pathname, ignore query
        return new URL(request.url).pathname
      }
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Same pathname with different query should use same cache
    await cache.handle(
      createMockNextRequest('http://localhost/api/users?page=1'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users?page=2'),
      handler
    )

    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('ResponseCache - Conditional Caching', () => {
  test('should only cache GET requests by default', async () => {
    const cache = createResponseCache()

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // GET request - should be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', { method: 'GET' }),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', { method: 'GET' }),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(1)

    // POST request - should not be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', { method: 'POST' }),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', { method: 'POST' }),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(3)
  })

  test('should cache only specified HTTP methods', async () => {
    const cache = createResponseCache({
      methods: ['GET', 'POST']
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // POST should be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', { method: 'POST' }),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users', { method: 'POST' }),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('should only cache specified status codes', async () => {
    const cache = createResponseCache({
      statusCodes: [200]
    })

    const handler200 = jest.fn(async () =>
      NextResponse.json({ name: 'John' }, { status: 200 })
    )
    const handler404 = jest.fn(async () =>
      NextResponse.json({ error: 'Not Found' }, { status: 404 })
    )

    // 200 response - should be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler200
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler200
    )
    expect(handler200).toHaveBeenCalledTimes(1)

    // 404 response - should not be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/999'),
      handler404
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/999'),
      handler404
    )
    expect(handler404).toHaveBeenCalledTimes(2)
  })

  test('should filter by content-type', async () => {
    const cache = createResponseCache({
      contentTypes: ['application/json']
    })

    const jsonHandler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )
    const htmlHandler = jest.fn(async () =>
      new NextResponse('<html></html>', {
        headers: { 'content-type': 'text/html' }
      })
    )

    // JSON response - should be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users'),
      jsonHandler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users'),
      jsonHandler
    )
    expect(jsonHandler).toHaveBeenCalledTimes(1)

    // HTML response - should not be cached
    await cache.handle(
      createMockNextRequest('http://localhost/page'),
      htmlHandler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/page'),
      htmlHandler
    )
    expect(htmlHandler).toHaveBeenCalledTimes(2)
  })

  test('should use custom cache predicate', async () => {
    const cache = createResponseCache({
      cachePredicate: (request, response) => {
        // Only cache if URL contains "cacheable"
        return request.url.includes('cacheable')
      }
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Cacheable URL - should be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/cacheable/users'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/cacheable/users'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(1)

    // Non-cacheable URL - should not be cached
    await cache.handle(
      createMockNextRequest('http://localhost/api/users'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(3)
  })
})

describe('ResponseCache - Cache Invalidation', () => {
  test('should manually invalidate cache by key', async () => {
    const cache = createResponseCache()

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    const url = 'http://localhost/api/users'

    // Cache the response
    await cache.handle(createMockNextRequest(url), handler)
    expect(handler).toHaveBeenCalledTimes(1)

    // Should use cache
    await cache.handle(createMockNextRequest(url), handler)
    expect(handler).toHaveBeenCalledTimes(1)

    // Invalidate
    await cache.invalidate(url)

    // Should call handler again
    await cache.handle(createMockNextRequest(url), handler)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should invalidate cache by tag', async () => {
    const storage = new MemoryCacheStorage()
    const cache = createResponseCache({
      storage,
      tags: ['users']
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    // Cache multiple URLs with same tag
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler
    )
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/2'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(2)

    // Should use cache
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(2)

    // Invalidate by tag
    await cache.invalidateByTag('users')

    // Should call handler again
    await cache.handle(
      createMockNextRequest('http://localhost/api/users/1'),
      handler
    )
    expect(handler).toHaveBeenCalledTimes(3)
  })
})

describe('ResponseCache - Integration & Edge Cases', () => {
  test('should bypass cache when disabled', async () => {
    const cache = createResponseCache({
      enabled: false
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    const request = createMockNextRequest('http://localhost/api/users')

    await cache.handle(request, handler)
    await cache.handle(request, handler)

    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should not cache when noStore is true', async () => {
    const cache = createResponseCache({
      noStore: true
    })

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    const request = createMockNextRequest('http://localhost/api/users')

    await cache.handle(request, handler)
    await cache.handle(request, handler)

    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('should handle errors gracefully', async () => {
    const cache = createResponseCache()

    const handler = jest.fn(async () => {
      throw new Error('Handler error')
    })

    const request = createMockNextRequest('http://localhost/api/users')

    await expect(cache.handle(request, handler)).rejects.toThrow('Handler error')
  })

  test('should work with convenience function withResponseCache', async () => {
    const wrappedHandler = withResponseCache({
      defaultTTL: 300
    })(async () => NextResponse.json({ name: 'John' }))

    const request = createMockNextRequest('http://localhost/api/users')

    const response1 = await wrappedHandler(request)
    expect(response1.headers.get('X-Cache')).toBeNull()

    const response2 = await wrappedHandler(request)
    expect(response2.headers.get('X-Cache')).toBe('HIT')
  })
})

describe('ResponseCache - Cache Presets', () => {
  test('should use short cache preset', async () => {
    const cache = createResponseCache(CachePresets.short)

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('max-age=60')
    expect(response.headers.get('Cache-Control')).toContain('public')
  })

  test('should use medium cache preset', async () => {
    const cache = createResponseCache(CachePresets.medium)

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('max-age=300')
  })

  test('should use long cache preset', async () => {
    const cache = createResponseCache(CachePresets.long)

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('max-age=3600')
  })

  test('should use private cache preset', async () => {
    const cache = createResponseCache(CachePresets.private)

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('private')
    expect(response.headers.get('Cache-Control')).not.toContain('public')
  })

  test('should use API cache preset with stale-while-revalidate', async () => {
    const cache = createResponseCache(CachePresets.api)

    const request = createMockNextRequest('http://localhost/api/users')
    const handler = createMockHandler(
      NextResponse.json({ name: 'John' })
    )

    const response = await cache.handle(request, handler)

    expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate=600')
    expect(response.headers.get('Vary')).toContain('Accept')
  })

  test('should use none preset to disable cache', async () => {
    const cache = createResponseCache(CachePresets.none)

    const handler = jest.fn(async () =>
      NextResponse.json({ name: 'John' })
    )

    const request = createMockNextRequest('http://localhost/api/users')

    await cache.handle(request, handler)
    await cache.handle(request, handler)

    expect(handler).toHaveBeenCalledTimes(2)
  })
})

describe('ResponseCache - MemoryCacheStorage', () => {
  test('should get statistics', () => {
    const storage = new MemoryCacheStorage()

    const stats = storage.getStats()

    expect(stats.size).toBe(0)
    expect(stats.tags).toBe(0)
  })

  test('should track size after adding items', async () => {
    const storage = new MemoryCacheStorage()

    await storage.set('key1', {
      status: 200,
      headers: {},
      body: 'test1',
      etag: 'etag1',
      timestamp: Date.now()
    })

    await storage.set('key2', {
      status: 200,
      headers: {},
      body: 'test2',
      etag: 'etag2',
      timestamp: Date.now()
    })

    const stats = storage.getStats()
    expect(stats.size).toBe(2)
  })
})
