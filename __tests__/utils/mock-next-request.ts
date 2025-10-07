/**
 * @fileoverview Mock NextRequest Helper for Jest TestingJest @jest-environment node does not properly initialize NextRequest.headersThis helper provides a mock implementation for testing purposes.@see https://github.com/vercel/next.js/issues/... (known issue)
 * @module __tests__/utils/mock-next-request
 * @description
 * Mock NextRequest Helper for Jest TestingJest @jest-environment node does not properly initialize NextRequest.headersThis helper provides a mock implementation for testing purposes.@see https://github.com/vercel/next.js/issues/... (known issue)
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest } from 'next/server'

/**
 * Creates a NextRequest with mocked headers that work in Jest node environment
 *
 * @param url - The URL for the request
 * @param headers - Optional headers as a Record<string, string>
 * @param options - Optional additional request options (method, body, etc.)
 * @returns NextRequest with properly mocked headers
 *
 * @example
 * ```typescript
 * const request = createMockNextRequest('http://localhost/api/test', {
 *   'X-Request-ID': 'test-123',
 *   'Authorization': 'Bearer token'
 * })
 *
 * expect(request.headers.get('X-Request-ID')).toBe('test-123')
 * ```
 */
export function createMockNextRequest(
  url: string,
  headers?: Record<string, string>,
  options?: {
    method?: string
    body?: BodyInit | null
  }
): NextRequest {
  const requestOptions: {
    method?: string
    body?: BodyInit | null
    headers?: HeadersInit
    signal?: AbortSignal
  } = {
    method: options?.method || 'GET',
    ...(options?.body && { body: options.body }),
  }

  const request = new NextRequest(url, requestOptions as any)

  // Mock the json() method for body parsing in Jest node environment
  if (options?.body && typeof options.body === 'string') {
    Object.defineProperty(request, 'json', {
      value: async () => {
        try {
          return JSON.parse(options.body as string)
        } catch (error) {
          throw new SyntaxError('Unexpected token in JSON')
        }
      },
      writable: false,
      configurable: true
    })
  }

  // Mock the nextUrl property for URL parsing in Jest node environment
  const parsedUrl = new URL(url)
  Object.defineProperty(request, 'nextUrl', {
    value: {
      href: parsedUrl.href,
      origin: parsedUrl.origin,
      protocol: parsedUrl.protocol,
      username: parsedUrl.username,
      password: parsedUrl.password,
      host: parsedUrl.host,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: parsedUrl.searchParams,
      hash: parsedUrl.hash
    },
    writable: false,
    configurable: true
  })

  // Mock the method property to ensure it's properly accessible in Jest node environment
  if (options?.method) {
    Object.defineProperty(request, 'method', {
      value: options.method,
      writable: false,
      configurable: true
    })
  }

  // Mock the headers property since it's undefined in Jest node environment
  if (headers) {
    const headersMap = new Map(Object.entries(headers))

    Object.defineProperty(request, 'headers', {
      value: {
        get: (name: string) => {
          // Case-insensitive header lookup
          const lowerName = name.toLowerCase()
          for (const [key, value] of headersMap.entries()) {
            if (key.toLowerCase() === lowerName) {
              return value
            }
          }
          return null
        },
        has: (name: string) => {
          const lowerName = name.toLowerCase()
          for (const key of headersMap.keys()) {
            if (key.toLowerCase() === lowerName) {
              return true
            }
          }
          return false
        },
        forEach: (callback: (value: string, key: string) => void) => {
          headersMap.forEach((value, key) => callback(value, key))
        },
        keys: function* () {
          yield* headersMap.keys()
        },
        values: function* () {
          yield* headersMap.values()
        },
        entries: function* () {
          yield* headersMap.entries()
        },
        [Symbol.iterator]: function* () {
          yield* headersMap.entries()
        }
      },
      writable: false,
      configurable: true
    })
  } else {
    // Even without headers, provide an empty mock to prevent undefined errors
    Object.defineProperty(request, 'headers', {
      value: {
        get: () => null,
        has: () => false,
        forEach: () => {},
        keys: function* () {},
        values: function* () {},
        entries: function* () {},
        [Symbol.iterator]: function* () {}
      },
      writable: false,
      configurable: true
    })
  }

  return request
}

/**
 * Creates a NextRequest for OPTIONS (preflight) requests
 * Convenience wrapper for CORS testing
 */
export function createMockOptionsRequest(
  url: string,
  headers?: Record<string, string>
): NextRequest {
  return createMockNextRequest(url, headers, { method: 'OPTIONS' })
}

/**
 * Creates a NextRequest with common test headers
 * Useful for reducing boilerplate in tests
 */
export function createMockRequestWithAuth(
  url: string,
  token: string,
  additionalHeaders?: Record<string, string>
): NextRequest {
  return createMockNextRequest(url, {
    'Authorization': `Bearer ${token}`,
    ...additionalHeaders
  })
}