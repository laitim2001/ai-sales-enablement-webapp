/**
 * @jest-environment node
 */

import { NextResponse } from 'next/server'
import {
  SecurityHeadersMiddleware,
  createSecurityHeaders,
  applySecurityHeaders,
  SecurityPresets,
  CspDirectives
} from '@/lib/middleware/security-headers'

describe('SecurityHeadersMiddleware', () => {
  describe('Content Security Policy (CSP)', () => {
    it('should build basic CSP header', () => {
      const security = new SecurityHeadersMiddleware({
        csp: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"]
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const csp = securedResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    })

    it('should handle upgrade-insecure-requests directive', () => {
      const security = new SecurityHeadersMiddleware({
        csp: {
          'default-src': ["'self'"],
          'upgrade-insecure-requests': true
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const csp = securedResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain('upgrade-insecure-requests')
    })

    it('should handle block-all-mixed-content directive', () => {
      const security = new SecurityHeadersMiddleware({
        csp: {
          'default-src': ["'self'"],
          'block-all-mixed-content': true
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const csp = securedResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain('block-all-mixed-content')
    })

    it('should handle empty source lists', () => {
      const security = new SecurityHeadersMiddleware({
        csp: {
          'default-src': ["'self'"],
          'object-src': []
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const csp = securedResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).not.toContain('object-src')
    })

    it('should disable CSP when set to false', () => {
      const security = new SecurityHeadersMiddleware({
        csp: false
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('Content-Security-Policy')).toBeNull()
    })

    it('should build complex CSP with multiple directives', () => {
      const csp: CspDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://cdn.example.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'https://api.example.com'],
        'frame-src': ["'none'"],
        'object-src': ["'none'"]
      }

      const security = new SecurityHeadersMiddleware({ csp })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const cspHeader = securedResponse.headers.get('Content-Security-Policy')
      expect(cspHeader).toContain("default-src 'self'")
      expect(cspHeader).toContain("script-src 'self' https://cdn.example.com")
      expect(cspHeader).toContain("frame-src 'none'")
    })
  })

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should set HSTS with default config', () => {
      const security = new SecurityHeadersMiddleware({
        hsts: true
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const hsts = securedResponse.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
    })

    it('should set HSTS with custom max-age', () => {
      const security = new SecurityHeadersMiddleware({
        hsts: { maxAge: 63072000 }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const hsts = securedResponse.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('max-age=63072000')
    })

    it('should include preload directive when enabled', () => {
      const security = new SecurityHeadersMiddleware({
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const hsts = securedResponse.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('preload')
    })

    it('should disable HSTS when set to false', () => {
      const security = new SecurityHeadersMiddleware({
        hsts: false
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('Strict-Transport-Security')).toBeNull()
    })

    it('should not include includeSubDomains when disabled', () => {
      const security = new SecurityHeadersMiddleware({
        hsts: { maxAge: 31536000, includeSubDomains: false }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const hsts = securedResponse.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).not.toContain('includeSubDomains')
    })
  })

  describe('X-Frame-Options', () => {
    it('should set X-Frame-Options to DENY', () => {
      const security = new SecurityHeadersMiddleware({
        frameOptions: 'DENY'
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should set X-Frame-Options to SAMEORIGIN', () => {
      const security = new SecurityHeadersMiddleware({
        frameOptions: 'SAMEORIGIN'
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    })

    it('should disable X-Frame-Options when set to false', () => {
      const security = new SecurityHeadersMiddleware({
        frameOptions: false
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Frame-Options')).toBeNull()
    })
  })

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options to nosniff', () => {
      const security = new SecurityHeadersMiddleware({
        noSniff: true
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should not set X-Content-Type-Options when disabled', () => {
      const security = new SecurityHeadersMiddleware({
        noSniff: false
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Content-Type-Options')).toBeNull()
    })
  })

  describe('X-XSS-Protection', () => {
    it('should set X-XSS-Protection', () => {
      const security = new SecurityHeadersMiddleware({
        xssProtection: true
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should not set X-XSS-Protection when disabled', () => {
      const security = new SecurityHeadersMiddleware({
        xssProtection: false
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-XSS-Protection')).toBeNull()
    })
  })

  describe('Referrer-Policy', () => {
    const policies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url'
    ] as const

    for (const policy of policies) {
      it(`should set Referrer-Policy to ${policy}`, () => {
        const security = new SecurityHeadersMiddleware({
          referrerPolicy: policy
        })

        const response = NextResponse.next()
        const securedResponse = security.apply(response)

        expect(securedResponse.headers.get('Referrer-Policy')).toBe(policy)
      })
    }
  })

  describe('Permissions-Policy', () => {
    it('should set basic Permissions-Policy', () => {
      const security = new SecurityHeadersMiddleware({
        permissionsPolicy: {
          geolocation: [],
          microphone: [],
          camera: []
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const policy = securedResponse.headers.get('Permissions-Policy')
      expect(policy).toContain('geolocation=()')
      expect(policy).toContain('microphone=()')
      expect(policy).toContain('camera=()')
    })

    it('should allow all origins with wildcard', () => {
      const security = new SecurityHeadersMiddleware({
        permissionsPolicy: {
          geolocation: ['*']
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const policy = securedResponse.headers.get('Permissions-Policy')
      expect(policy).toContain('geolocation=*')
    })

    it('should allow specific origins', () => {
      const security = new SecurityHeadersMiddleware({
        permissionsPolicy: {
          geolocation: ['self', 'https://example.com']
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const policy = securedResponse.headers.get('Permissions-Policy')
      expect(policy).toContain('geolocation=("self" "https://example.com")')
    })
  })

  describe('Custom Headers', () => {
    it('should set custom headers', () => {
      const security = new SecurityHeadersMiddleware({
        customHeaders: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value'
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Custom-Header')).toBe('custom-value')
      expect(securedResponse.headers.get('X-Another-Header')).toBe('another-value')
    })
  })

  describe('Environment Awareness', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should use stricter CSP in production', () => {
      process.env.NODE_ENV = 'production'
      const security = new SecurityHeadersMiddleware({})

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const csp = securedResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
    })

    it('should use more permissive CSP in development', () => {
      process.env.NODE_ENV = 'development'
      const security = new SecurityHeadersMiddleware({})

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      const csp = securedResponse.headers.get('Content-Security-Policy')
      expect(csp).toContain("'unsafe-eval'")
      expect(csp).toContain('localhost')
    })
  })

  describe('Configuration Updates', () => {
    it('should update options dynamically', () => {
      const security = new SecurityHeadersMiddleware({
        frameOptions: 'SAMEORIGIN'
      })

      security.updateOptions({
        frameOptions: 'DENY'
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('createSecurityHeaders', () => {
    it('should create middleware with options', () => {
      const security = createSecurityHeaders({
        frameOptions: 'DENY'
      })

      expect(security).toBeInstanceOf(SecurityHeadersMiddleware)
    })

    it('should create middleware with default options', () => {
      const security = createSecurityHeaders()

      expect(security).toBeInstanceOf(SecurityHeadersMiddleware)
    })
  })

  describe('applySecurityHeaders', () => {
    it('should apply security headers to response', () => {
      const response = NextResponse.json({ data: 'test' })
      const securedResponse = applySecurityHeaders(response)

      expect(securedResponse.headers.has('X-Content-Type-Options')).toBe(true)
      expect(securedResponse.headers.has('Content-Security-Policy')).toBe(true)
    })

    it('should use custom options', () => {
      const response = NextResponse.json({ data: 'test' })
      const securedResponse = applySecurityHeaders(response, {
        frameOptions: 'DENY'
      })

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('SecurityPresets', () => {
    describe('development preset', () => {
      it('should have permissive settings', () => {
        const preset = SecurityPresets.development

        expect(preset.hsts).toBe(false)
        expect(preset.frameOptions).toBe('SAMEORIGIN')
      })

      it('should apply development preset', () => {
        const security = new SecurityHeadersMiddleware(SecurityPresets.development)

        const response = NextResponse.next()
        const securedResponse = security.apply(response)

        expect(securedResponse.headers.get('Strict-Transport-Security')).toBeNull()
        expect(securedResponse.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
      })
    })

    describe('production preset', () => {
      it('should have strict settings', () => {
        const preset = SecurityPresets.production

        expect(preset.hsts).toBeDefined()
        expect(preset.frameOptions).toBe('DENY')
      })

      it('should apply production preset', () => {
        const security = new SecurityHeadersMiddleware(SecurityPresets.production)

        const response = NextResponse.next()
        const securedResponse = security.apply(response)

        expect(securedResponse.headers.get('Strict-Transport-Security')).toBeDefined()
        expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
      })
    })

    describe('maximum preset', () => {
      it('should have most restrictive settings', () => {
        const preset = SecurityPresets.maximum

        expect(preset.hsts).toBeDefined()
        expect((preset.hsts as any).preload).toBe(true)
      })

      it('should apply maximum security preset', () => {
        const security = new SecurityHeadersMiddleware(SecurityPresets.maximum)

        const response = NextResponse.next()
        const securedResponse = security.apply(response)

        const hsts = securedResponse.headers.get('Strict-Transport-Security')
        expect(hsts).toContain('preload')

        const csp = securedResponse.headers.get('Content-Security-Policy')
        expect(csp).toContain('upgrade-insecure-requests')
      })
    })

    describe('api preset', () => {
      it('should be optimized for APIs', () => {
        const preset = SecurityPresets.api

        expect(preset.csp).toBe(false)
        expect(preset.xssProtection).toBe(false)
      })

      it('should apply API preset', () => {
        const security = new SecurityHeadersMiddleware(SecurityPresets.api)

        const response = NextResponse.next()
        const securedResponse = security.apply(response)

        expect(securedResponse.headers.get('Content-Security-Policy')).toBeNull()
        expect(securedResponse.headers.get('X-XSS-Protection')).toBeNull()
        expect(securedResponse.headers.get('Strict-Transport-Security')).toBeDefined()
      })
    })
  })

  describe('Complete Security Stack', () => {
    it('should apply all security headers together', () => {
      const security = new SecurityHeadersMiddleware({
        csp: {
          'default-src': ["'self'"],
          'script-src': ["'self'"]
        },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        frameOptions: 'DENY',
        noSniff: true,
        xssProtection: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
          geolocation: [],
          microphone: [],
          camera: []
        }
      })

      const response = NextResponse.next()
      const securedResponse = security.apply(response)

      expect(securedResponse.headers.get('Content-Security-Policy')).toBeDefined()
      expect(securedResponse.headers.get('Strict-Transport-Security')).toBeDefined()
      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(securedResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(securedResponse.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      )
      expect(securedResponse.headers.get('Permissions-Policy')).toBeDefined()
    })
  })
})