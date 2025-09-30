/**
 * @jest-environment node
 */

import {
  RouteMatcher,
  createRouteMatcher,
  RouteConfig
} from '@/lib/middleware/route-matcher'

describe('RouteMatcher', () => {
  describe('String Pattern Matching', () => {
    it('should match exact string pattern', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/users')

      expect(result.matched).toBe(true)
      expect(result.config?.pattern).toBe('/api/users')
    })

    it('should not match different paths', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/products')

      expect(result.matched).toBe(false)
      expect(result.config).toBeUndefined()
    })

    it('should match with regex wildcard pattern', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/users\/[^/]+$/,
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      expect(matcher.match('/api/users/123').matched).toBe(true)
      expect(matcher.match('/api/users/abc').matched).toBe(true)
      expect(matcher.match('/api/users/123/posts').matched).toBe(false)
    })

    it('should match with regex prefix pattern', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/admin\//,
          auth: { required: true, methods: ['jwt'], roles: ['ADMIN'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      expect(matcher.match('/api/admin/users').matched).toBe(true)
      expect(matcher.match('/api/admin/users/123').matched).toBe(true)
      expect(matcher.match('/api/admin/users/123/settings').matched).toBe(true)
    })

    it('should extract named parameters', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users/:id',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/users/123')

      expect(result.matched).toBe(true)
      expect(result.params).toEqual({ id: '123' })
    })

    it('should extract multiple named parameters', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users/:userId/posts/:postId',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/users/123/posts/456')

      expect(result.matched).toBe(true)
      expect(result.params).toEqual({ userId: '123', postId: '456' })
    })
  })

  describe('RegExp Pattern Matching', () => {
    it('should match regex pattern', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/users$/,
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/users')

      expect(result.matched).toBe(true)
    })

    it('should match complex regex pattern', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/(v1|v2)\/users/,
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      expect(matcher.match('/api/v1/users').matched).toBe(true)
      expect(matcher.match('/api/v2/users').matched).toBe(true)
      expect(matcher.match('/api/v3/users').matched).toBe(false)
    })

    it('should extract regex capture groups', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/users\/([0-9]+)$/,
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/users/123')

      expect(result.matched).toBe(true)
      expect(result.params).toEqual({ $1: '123' })
    })
  })

  describe('Priority Ordering', () => {
    it('should match higher priority route first', () => {
      const configs: RouteConfig[] = [
        {
          name: 'low-priority',
          pattern: '/api/**',
          priority: 10,
          auth: { required: false, methods: [] }
        },
        {
          name: 'high-priority',
          pattern: '/api/admin/**',
          priority: 100,
          auth: { required: true, methods: ['jwt'], roles: ['ADMIN'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/admin/users')

      expect(result.matched).toBe(true)
      expect(result.config?.name).toBe('high-priority')
    })

    it('should sort routes by priority in constructor', () => {
      const configs: RouteConfig[] = [
        { pattern: '/a', priority: 1, auth: { required: false, methods: [] } },
        { pattern: '/b', priority: 3, auth: { required: false, methods: [] } },
        { pattern: '/c', priority: 2, auth: { required: false, methods: [] } }
      ]
      const matcher = new RouteMatcher(configs)

      // Access private configs through type assertion for testing
      const sortedConfigs = (matcher as any).configs
      expect(sortedConfigs[0].priority).toBe(3)
      expect(sortedConfigs[1].priority).toBe(2)
      expect(sortedConfigs[2].priority).toBe(1)
    })
  })

  describe('Version Extraction', () => {
    it('should extract v1 version from path', () => {
      const matcher = new RouteMatcher([])

      const version = matcher.extractVersion('/api/v1/users')

      expect(version).toBe('v1')
    })

    it('should extract v2 version from path', () => {
      const matcher = new RouteMatcher([])

      const version = matcher.extractVersion('/api/v2/users')

      expect(version).toBe('v2')
    })

    it('should return null for path without version', () => {
      const matcher = new RouteMatcher([])

      const version = matcher.extractVersion('/api/users')

      expect(version).toBeNull()
    })

    it('should return route version in match result', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/v1\//,
          version: 'v1',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/v1/users')

      expect(result.version).toBe('v1')
    })

    it('should prefer extracted version over config version', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/(v1|v2)\//,
          version: 'v1',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs)

      const result = matcher.match('/api/v2/users')

      expect(result.version).toBe('v2')
    })
  })

  describe('Helper Methods', () => {
    const configs: RouteConfig[] = [
      {
        name: 'public-route',
        pattern: '/api/health',
        auth: { required: false, methods: [] }
      },
      {
        name: 'protected-route',
        pattern: '/api/users',
        auth: { required: true, methods: ['jwt', 'azureAD'] }
      },
      {
        name: 'admin-route',
        pattern: '/api/admin',
        auth: { required: true, methods: ['jwt'], roles: ['ADMIN'] }
      }
    ]

    describe('getConfig', () => {
      it('should return config for matched route', () => {
        const matcher = new RouteMatcher(configs)

        const config = matcher.getConfig('/api/users')

        expect(config).toBeDefined()
        expect(config?.name).toBe('protected-route')
      })

      it('should return null for unmatched route', () => {
        const matcher = new RouteMatcher(configs)

        const config = matcher.getConfig('/api/nonexistent')

        expect(config).toBeNull()
      })
    })

    describe('requiresAuth', () => {
      it('should return true for protected routes', () => {
        const matcher = new RouteMatcher(configs)

        expect(matcher.requiresAuth('/api/users')).toBe(true)
        expect(matcher.requiresAuth('/api/admin')).toBe(true)
      })

      it('should return false for public routes', () => {
        const matcher = new RouteMatcher(configs)

        expect(matcher.requiresAuth('/api/health')).toBe(false)
      })

      it('should return false for unmatched routes', () => {
        const matcher = new RouteMatcher(configs)

        expect(matcher.requiresAuth('/api/unknown')).toBe(false)
      })
    })

    describe('getAuthMethods', () => {
      it('should return auth methods for route', () => {
        const matcher = new RouteMatcher(configs)

        const methods = matcher.getAuthMethods('/api/users')

        expect(methods).toEqual(['jwt', 'azureAD'])
      })

      it('should return empty array for public routes', () => {
        const matcher = new RouteMatcher(configs)

        const methods = matcher.getAuthMethods('/api/health')

        expect(methods).toEqual([])
      })

      it('should return empty array for unmatched routes', () => {
        const matcher = new RouteMatcher(configs)

        const methods = matcher.getAuthMethods('/api/unknown')

        expect(methods).toEqual([])
      })
    })
  })

  describe('Caching', () => {
    it('should cache match results', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs, { enableCache: true })

      // First match
      const result1 = matcher.match('/api/users')
      // Second match should use cache
      const result2 = matcher.match('/api/users')

      expect(result1).toEqual(result2)
      expect(matcher.getCacheStats().size).toBe(1)
    })

    it('should respect cache size limit', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/**',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs, { enableCache: true, cacheSize: 2 })

      matcher.match('/api/route1')
      matcher.match('/api/route2')
      matcher.match('/api/route3') // Should evict oldest entry

      const stats = matcher.getCacheStats()
      expect(stats.size).toBeLessThanOrEqual(2)
    })

    it('should clear cache', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs, { enableCache: true })

      matcher.match('/api/users')
      expect(matcher.getCacheStats().size).toBe(1)

      matcher.clearCache()
      expect(matcher.getCacheStats().size).toBe(0)
    })

    it('should disable cache when configured', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/users',
          auth: { required: true, methods: ['jwt'] }
        }
      ]
      const matcher = new RouteMatcher(configs, { enableCache: false })

      matcher.match('/api/users')
      matcher.match('/api/users')

      expect(matcher.getCacheStats().size).toBe(0)
    })
  })

  describe('Options', () => {
    describe('caseSensitive', () => {
      it('should match case-insensitively by default', () => {
        const configs: RouteConfig[] = [
          {
            pattern: '/api/users',
            auth: { required: true, methods: ['jwt'] }
          }
        ]
        const matcher = new RouteMatcher(configs)

        expect(matcher.match('/api/users').matched).toBe(true)
        expect(matcher.match('/API/USERS').matched).toBe(true)
        expect(matcher.match('/Api/Users').matched).toBe(true)
      })

      it('should match case-sensitively when enabled', () => {
        const configs: RouteConfig[] = [
          {
            pattern: '/api/users',
            auth: { required: true, methods: ['jwt'] }
          }
        ]
        const matcher = new RouteMatcher(configs, { caseSensitive: true })

        expect(matcher.match('/api/users').matched).toBe(true)
        expect(matcher.match('/API/USERS').matched).toBe(false)
        expect(matcher.match('/Api/Users').matched).toBe(false)
      })
    })

    describe('strictTrailingSlash', () => {
      it('should ignore trailing slashes by default', () => {
        const configs: RouteConfig[] = [
          {
            pattern: '/api/users',
            auth: { required: true, methods: ['jwt'] }
          }
        ]
        const matcher = new RouteMatcher(configs)

        expect(matcher.match('/api/users').matched).toBe(true)
        expect(matcher.match('/api/users/').matched).toBe(true)
      })

      it('should enforce trailing slashes when strict', () => {
        const configs: RouteConfig[] = [
          {
            pattern: '/api/users',
            auth: { required: true, methods: ['jwt'] }
          }
        ]
        const matcher = new RouteMatcher(configs, { strictTrailingSlash: true })

        expect(matcher.match('/api/users').matched).toBe(true)
        expect(matcher.match('/api/users/').matched).toBe(false)
      })
    })
  })

  describe('createRouteMatcher', () => {
    it('should create matcher with default options', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/test',
          auth: { required: false, methods: [] }
        }
      ]

      const matcher = createRouteMatcher(configs)

      expect(matcher).toBeInstanceOf(RouteMatcher)
      expect(matcher.match('/api/test').matched).toBe(true)
    })

    it('should create matcher with custom options', () => {
      const configs: RouteConfig[] = [
        {
          pattern: '/api/test',
          auth: { required: false, methods: [] }
        }
      ]

      const matcher = createRouteMatcher(configs, {
        enableCache: false,
        caseSensitive: true
      })

      expect(matcher).toBeInstanceOf(RouteMatcher)
      expect(matcher.getCacheStats().maxSize).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should handle many routes efficiently', () => {
      const configs: RouteConfig[] = []
      for (let i = 0; i < 100; i++) {
        configs.push({
          pattern: `/api/route${i}`,
          auth: { required: true, methods: ['jwt'] }
        })
      }

      const matcher = new RouteMatcher(configs, { enableCache: true })
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        matcher.match(`/api/route${i % 100}`)
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete 1000 matches in less than 100ms with caching
      expect(totalTime).toBeLessThan(100)
    })

    it('should handle regex patterns efficiently', () => {
      const configs: RouteConfig[] = [
        {
          pattern: /^\/api\/(v1|v2)\/users\/([0-9]+)$/,
          auth: { required: true, methods: ['jwt'] }
        }
      ]

      const matcher = new RouteMatcher(configs)
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        matcher.match('/api/v1/users/123')
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete 1000 regex matches in less than 50ms
      expect(totalTime).toBeLessThan(50)
    })
  })
})