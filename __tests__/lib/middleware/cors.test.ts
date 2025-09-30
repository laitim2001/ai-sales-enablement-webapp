/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  CorsMiddleware,
  createCorsMiddleware,
  applyCors,
  CorsPresets,
  CorsOptions
} from '@/lib/middleware/cors'
import { createMockNextRequest, createMockOptionsRequest } from '@/__tests__/utils/mock-next-request'

describe('CorsMiddleware', () => {
  describe('Origin Validation', () => {
    it('should allow request from whitelisted origin', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })

    it('should reject request from non-whitelisted origin', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://malicious.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should allow all origins with wildcard', () => {
      const cors = new CorsMiddleware({
        origins: '*',
        credentials: false  // Must disable credentials to use wildcard
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://anysite.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should support wildcard patterns in origins', () => {
      const cors = new CorsMiddleware({
        origins: ['https://*.example.com']
      })

      const validOrigins = [
        'https://api.example.com',
        'https://app.example.com',
        'https://test.example.com'
      ]

      for (const origin of validOrigins) {
        const request = createMockNextRequest('http://localhost/api/test', {
          'origin': origin
        })

        const response = cors.handle(request)

        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
      }
    })

    it('should support custom origin validator function', () => {
      const cors = new CorsMiddleware({
        origins: (origin) => origin.endsWith('.trusted.com')
      })

      const request1 = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://app.trusted.com'
      })

      const response1 = cors.handle(request1)
      expect(response1.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://app.trusted.com'
      )

      const request2 = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://app.untrusted.com'
      })

      const response2 = cors.handle(request2)
      expect(response2.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should handle requests without origin header', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      // Use mock helper with no headers (provides empty headers mock)
      const request = createMockNextRequest('http://localhost/api/test')

      const response = cors.handle(request)

      // Same-origin requests don't need CORS headers
      expect(response).toBeDefined()
    })
  })

  describe('Preflight Requests (OPTIONS)', () => {
    it('should handle OPTIONS preflight request', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        methods: ['GET', 'POST', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization']
      })

      const request = createMockOptionsRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type, Authorization'
      )
    })

    it('should reject preflight with disallowed method', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        methods: ['GET', 'POST']
      })

      const request = createMockOptionsRequest('http://localhost/api/test', {
        'origin': 'https://example.com',
        'access-control-request-method': 'DELETE'
      })

      const response = cors.handle(request)

      expect(response.status).toBe(405)
    })

    it('should set max age for preflight cache', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        maxAge: 3600
      })

      const request = createMockOptionsRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Max-Age')).toBe('3600')
    })
  })

  describe('Actual Requests', () => {
    it('should add CORS headers to actual request', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        methods: ['GET', 'POST']
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })

    it('should expose specified headers', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        exposedHeaders: ['X-Custom-Header', 'X-Request-ID']
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Expose-Headers')).toBe(
        'X-Custom-Header, X-Request-ID'
      )
    })

    it('should handle existing response', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const existingResponse = NextResponse.json({ data: 'test' })
      const response = cors.handle(request, existingResponse)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
      expect(response.status).toBe(200)
    })
  })

  describe('Credentials', () => {
    it('should set credentials header when enabled', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        credentials: true
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })

    it('should not set credentials header when disabled', () => {
      const cors = new CorsMiddleware({
        origins: '*',
        credentials: false
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should use specific origin with credentials, not wildcard', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        credentials: true
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      // With credentials, must use specific origin, not *
      expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })
  })

  describe('Environment Awareness', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should use development origins in development', () => {
      process.env.NODE_ENV = 'development'
      const cors = new CorsMiddleware({})

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'http://localhost:3000'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    })

    it('should respect ALLOWED_ORIGINS env variable in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.ALLOWED_ORIGINS = 'https://prod.example.com,https://app.example.com'

      const cors = new CorsMiddleware({})

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://prod.example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://prod.example.com'
      )

      delete process.env.ALLOWED_ORIGINS
    })
  })

  describe('Configuration Updates', () => {
    it('should update options dynamically', () => {
      const cors = new CorsMiddleware({
        origins: ['https://old.com']
      })

      cors.updateOptions({
        origins: ['https://new.com']
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://new.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://new.com')
    })
  })

  describe('createCorsMiddleware', () => {
    it('should create middleware with options', () => {
      const cors = createCorsMiddleware({
        origins: ['https://example.com']
      })

      expect(cors).toBeInstanceOf(CorsMiddleware)
    })

    it('should create middleware with default options', () => {
      const cors = createCorsMiddleware()

      expect(cors).toBeInstanceOf(CorsMiddleware)
    })
  })

  describe('applyCors', () => {
    it('should apply CORS to response', () => {
      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'http://localhost:3000'
      })

      const response = NextResponse.json({ data: 'test' })
      const corsResponse = applyCors(request, response)

      expect(corsResponse.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })

    it('should use custom options', () => {
      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://custom.com'
      })

      const response = NextResponse.json({ data: 'test' })
      const corsResponse = applyCors(request, response, {
        origins: ['https://custom.com']
      })

      expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://custom.com')
    })
  })

  describe('CorsPresets', () => {
    it('should provide development preset', () => {
      const preset = CorsPresets.development

      expect(preset.origins).toBe('*')
      expect(preset.credentials).toBe(true)
    })

    it('should provide production preset', () => {
      const preset = CorsPresets.production

      expect(Array.isArray(preset.origins)).toBe(true)
      expect(preset.credentials).toBe(true)
      expect(preset.maxAge).toBe(86400)
    })

    it('should provide publicApi preset', () => {
      const preset = CorsPresets.publicApi

      expect(preset.origins).toBe('*')
      expect(preset.credentials).toBe(false)
    })

    it('should provide strict preset function', () => {
      const preset = CorsPresets.strict('https://only-this.com')

      expect(preset.origins).toEqual(['https://only-this.com'])
      expect(preset.credentials).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple origins', () => {
      const cors = new CorsMiddleware({
        origins: ['https://site1.com', 'https://site2.com', 'https://site3.com']
      })

      const origins = ['https://site1.com', 'https://site2.com', 'https://site3.com']

      for (const origin of origins) {
        const request = createMockNextRequest('http://localhost/api/test', {
          'origin': origin
        })

        const response = cors.handle(request)

        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
      }
    })

    it('should handle empty allowed headers', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        allowedHeaders: []
      })

      const request = createMockOptionsRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.status).toBe(204)
    })

    it('should handle empty exposed headers', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        exposedHeaders: []
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Expose-Headers')).toBeNull()
    })

    it('should handle custom success status for OPTIONS', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        optionsSuccessStatus: 200
      })

      const request = createMockOptionsRequest('http://localhost/api/test', {
        'origin': 'https://example.com'
      })

      const response = cors.handle(request)

      expect(response.status).toBe(200)
    })
  })
})