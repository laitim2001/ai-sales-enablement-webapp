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

describe('CorsMiddleware', () => {
  describe('Origin Validation', () => {
    it('should allow request from whitelisted origin', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })

    it('should reject request from non-whitelisted origin', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const headers = new Headers()
      headers.set('origin', 'https://malicious.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should allow all origins with wildcard', () => {
      const cors = new CorsMiddleware({
        origins: '*'
      })

      const headers = new Headers()
      headers.set('origin', 'https://anysite.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

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
        const headers = new Headers()
        headers.set('origin', origin)
        const request = new NextRequest('http://localhost/api/test', { headers })

        const response = cors.handle(request)

        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
      }
    })

    it('should support custom origin validator function', () => {
      const cors = new CorsMiddleware({
        origins: (origin) => origin.endsWith('.trusted.com')
      })

      const headers1 = new Headers()
      headers1.set('origin', 'https://app.trusted.com')
      const request1 = new NextRequest('http://localhost/api/test', { headers: headers1 })

      const response1 = cors.handle(request1)
      expect(response1.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://app.trusted.com'
      )

      const headers2 = new Headers()
      headers2.set('origin', 'https://app.untrusted.com')
      const request2 = new NextRequest('http://localhost/api/test', { headers: headers2 })

      const response2 = cors.handle(request2)
      expect(response2.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should handle requests without origin header', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const request = new NextRequest('http://localhost/api/test')

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

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
        headers
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

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      headers.set('access-control-request-method', 'DELETE')
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
        headers
      })

      const response = cors.handle(request)

      expect(response.status).toBe(405)
    })

    it('should set max age for preflight cache', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        maxAge: 3600
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
        headers
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

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET',
        headers
      })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })

    it('should expose specified headers', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        exposedHeaders: ['X-Custom-Header', 'X-Request-ID']
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Expose-Headers')).toBe(
        'X-Custom-Header, X-Request-ID'
      )
    })

    it('should handle existing response', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com']
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

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

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })

    it('should not set credentials header when disabled', () => {
      const cors = new CorsMiddleware({
        origins: '*',
        credentials: false
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should use specific origin with credentials, not wildcard', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        credentials: true
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

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

      const headers = new Headers()
      headers.set('origin', 'http://localhost:3000')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    })

    it('should respect ALLOWED_ORIGINS env variable in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.ALLOWED_ORIGINS = 'https://prod.example.com,https://app.example.com'

      const cors = new CorsMiddleware({})

      const headers = new Headers()
      headers.set('origin', 'https://prod.example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

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

      const headers = new Headers()
      headers.set('origin', 'https://new.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

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
      const headers = new Headers()
      headers.set('origin', 'http://localhost:3000')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = NextResponse.json({ data: 'test' })
      const corsResponse = applyCors(request, response)

      expect(corsResponse.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })

    it('should use custom options', () => {
      const headers = new Headers()
      headers.set('origin', 'https://custom.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

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
        const headers = new Headers()
        headers.set('origin', origin)
        const request = new NextRequest('http://localhost/api/test', { headers })

        const response = cors.handle(request)

        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
      }
    })

    it('should handle empty allowed headers', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        allowedHeaders: []
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
        headers
      })

      const response = cors.handle(request)

      expect(response.status).toBe(204)
    })

    it('should handle empty exposed headers', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        exposedHeaders: []
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', { headers })

      const response = cors.handle(request)

      expect(response.headers.get('Access-Control-Expose-Headers')).toBeNull()
    })

    it('should handle custom success status for OPTIONS', () => {
      const cors = new CorsMiddleware({
        origins: ['https://example.com'],
        optionsSuccessStatus: 200
      })

      const headers = new Headers()
      headers.set('origin', 'https://example.com')
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
        headers
      })

      const response = cors.handle(request)

      expect(response.status).toBe(200)
    })
  })
})