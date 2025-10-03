/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  RequestIdGenerator,
  defaultRequestIdGenerator,
  generateRequestId,
  getOrGenerateRequestId,
  getEnvironmentGenerator,
  RequestIdConfig
} from '@/lib/middleware/request-id'
import { createMockNextRequest } from '@/__tests__/utils/mock-next-request'

describe('RequestIdGenerator', () => {
  describe('UUID Strategy', () => {
    it('should generate valid UUID format', () => {
      const generator = new RequestIdGenerator({ strategy: 'uuid' })
      const id = generator.generate()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })

    it('should generate unique UUIDs', () => {
      const generator = new RequestIdGenerator({ strategy: 'uuid' })
      const id1 = generator.generate()
      const id2 = generator.generate()

      expect(id1).not.toBe(id2)
    })

    it('should apply prefix to UUID', () => {
      const generator = new RequestIdGenerator({
        strategy: 'uuid',
        prefix: 'test-'
      })
      const id = generator.generate()

      expect(id).toMatch(/^test-[0-9a-f]{8}-/)
    })
  })

  describe('Timestamp Strategy', () => {
    it('should generate timestamp-based ID', () => {
      const generator = new RequestIdGenerator({ strategy: 'timestamp' })
      const id = generator.generate()

      // Format: {timestamp}-{random}
      const timestampRegex = /^[a-z0-9]+-[a-z0-9]{8}$/
      expect(id).toMatch(timestampRegex)
    })

    it('should generate sortable IDs', async () => {
      const generator = new RequestIdGenerator({ strategy: 'timestamp' })
      const id1 = generator.generate()
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))
      const id2 = generator.generate()

      // Timestamp IDs should be lexicographically sortable
      expect(id1 <= id2).toBe(true)
    })

    it('should apply prefix to timestamp ID', () => {
      const generator = new RequestIdGenerator({
        strategy: 'timestamp',
        prefix: 'req-'
      })
      const id = generator.generate()

      expect(id).toMatch(/^req-[a-z0-9]+-/)
    })
  })

  describe('Short Strategy', () => {
    it('should generate short ID', () => {
      const generator = new RequestIdGenerator({ strategy: 'short' })
      const id = generator.generate()

      expect(id).toMatch(/^[a-z0-9]{8}$/)
    })

    it('should generate 8-character IDs', () => {
      const generator = new RequestIdGenerator({ strategy: 'short' })
      const id = generator.generate()

      expect(id).toHaveLength(8)
    })

    it('should apply prefix to short ID', () => {
      const generator = new RequestIdGenerator({
        strategy: 'short',
        prefix: 'dev-'
      })
      const id = generator.generate()

      expect(id).toMatch(/^dev-[a-z0-9]{8}$/)
    })
  })

  describe('getOrGenerate', () => {
    it('should generate new ID when no client ID provided', () => {
      const generator = new RequestIdGenerator({ strategy: 'short' })
      const request = new NextRequest('http://localhost/api/test')

      const id = generator.getOrGenerate(request)

      expect(id).toMatch(/^[a-z0-9]{8}$/)
    })

    it('should reject invalid client ID', () => {
      const generator = new RequestIdGenerator({
        strategy: 'short',
        acceptClientId: true
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'X-Request-ID': 'invalid<script>alert(1)</script>'
      })

      const id = generator.getOrGenerate(request)

      // Should generate new ID since client ID is invalid
      expect(id).toMatch(/^[a-z0-9]{8}$/)
      expect(id).not.toContain('<script>')
    })

    it('should accept valid client ID when enabled', () => {
      const generator = new RequestIdGenerator({
        strategy: 'short',
        acceptClientId: true
      })

      const clientId = 'client-123-abc'
      const request = createMockNextRequest('http://localhost/api/test', {
        'X-Request-ID': clientId
      })

      const id = generator.getOrGenerate(request)

      expect(id).toBe(clientId)
    })

    it('should reject client ID when disabled', () => {
      const generator = new RequestIdGenerator({
        strategy: 'short',
        acceptClientId: false
      })

      const clientId = 'client-123-abc'
      const request = createMockNextRequest('http://localhost/api/test', {
        'X-Request-ID': clientId
      })

      const id = generator.getOrGenerate(request)

      // Should generate new ID, ignoring client ID
      expect(id).not.toBe(clientId)
      expect(id).toMatch(/^[a-z0-9]{8}$/)
    })

    it('should reject too long client ID', () => {
      const generator = new RequestIdGenerator({
        strategy: 'short',
        acceptClientId: true
      })

      const longId = 'a'.repeat(101) // 101 characters, exceeds 100 limit
      const request = createMockNextRequest('http://localhost/api/test', {
        'X-Request-ID': longId
      })

      const id = generator.getOrGenerate(request)

      expect(id).not.toBe(longId)
      expect(id.length).toBeLessThan(100)
    })

    it('should reject client ID with special characters', () => {
      const generator = new RequestIdGenerator({
        strategy: 'short',
        acceptClientId: true
      })

      const invalidIds = [
        'id@with@at',
        'id with spaces',
        'id;with;semicolons'
      ]

      for (const invalidId of invalidIds) {
        const request = createMockNextRequest('http://localhost/api/test', {
          'X-Request-ID': invalidId
        })

        const id = generator.getOrGenerate(request)

        expect(id).not.toBe(invalidId)
        expect(id).toMatch(/^[a-zA-Z0-9-_]+$/)
      }
    })
  })

  describe('getHeaderName', () => {
    it('should return default header name', () => {
      const generator = new RequestIdGenerator()

      expect(generator.getHeaderName()).toBe('X-Request-ID')
    })

    it('should return custom header name', () => {
      const generator = new RequestIdGenerator({
        headerName: 'X-Trace-ID'
      })

      expect(generator.getHeaderName()).toBe('X-Trace-ID')
    })
  })
})

describe('Default Generator', () => {
  it('should use UUID strategy by default', () => {
    const id = defaultRequestIdGenerator.generate()

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(id).toMatch(uuidRegex)
  })

  it('should not accept client IDs by default', () => {
    const clientId = 'client-123-abc'
    const headers = new Headers()
    headers.set('X-Request-ID', clientId)
    const request = new NextRequest('http://localhost/api/test', { headers })

    const id = defaultRequestIdGenerator.getOrGenerate(request)

    expect(id).not.toBe(clientId)
  })
})

describe('Convenience Functions', () => {
  describe('generateRequestId', () => {
    it('should generate valid request ID', () => {
      const id = generateRequestId()

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('getOrGenerateRequestId', () => {
    it('should generate ID for request without config', () => {
      const request = new NextRequest('http://localhost/api/test')
      const id = getOrGenerateRequestId(request)

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('should use custom config when provided', () => {
      const request = new NextRequest('http://localhost/api/test')
      const config: RequestIdConfig = {
        strategy: 'short',
        prefix: 'custom-'
      }
      const id = getOrGenerateRequestId(request, config)

      expect(id).toMatch(/^custom-[a-z0-9]{8}$/)
    })
  })

  describe('getEnvironmentGenerator', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
    })

    it('should use UUID strategy in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      const generator = getEnvironmentGenerator()
      const id = generator.generate()

      expect(id).toMatch(/^prod-[0-9a-f]{8}-/)
    })

    it('should use short strategy in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      const generator = getEnvironmentGenerator()
      const id = generator.generate()

      expect(id).toMatch(/^dev-[a-z0-9]{8}$/)
    })

    it('should accept client IDs in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      const generator = getEnvironmentGenerator()

      const clientId = 'client-dev-123'
      const request = createMockNextRequest('http://localhost/api/test', {
        'X-Request-ID': clientId
      })

      const id = generator.getOrGenerate(request)

      expect(id).toBe(clientId)
    })

    it('should reject client IDs in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      const generator = getEnvironmentGenerator()

      const clientId = 'client-prod-123'
      const request = createMockNextRequest('http://localhost/api/test', {
        'X-Request-ID': clientId
      })

      const id = generator.getOrGenerate(request)

      expect(id).not.toBe(clientId)
      expect(id).toMatch(/^prod-/)
    })
  })
})

describe('Performance', () => {
  it('should generate IDs quickly', () => {
    const generator = new RequestIdGenerator({ strategy: 'uuid' })
    const startTime = Date.now()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      generator.generate()
    }

    const endTime = Date.now()
    const totalTime = endTime - startTime
    const avgTime = totalTime / iterations

    // Should generate each ID in less than 1ms on average
    expect(avgTime).toBeLessThan(1)
  })

  it('should handle concurrent generation', async () => {
    const generator = new RequestIdGenerator({ strategy: 'uuid' })
    const promises = []

    for (let i = 0; i < 100; i++) {
      promises.push(Promise.resolve(generator.generate()))
    }

    const ids = await Promise.all(promises)
    const uniqueIds = new Set(ids)

    // All IDs should be unique
    expect(uniqueIds.size).toBe(100)
  })
})