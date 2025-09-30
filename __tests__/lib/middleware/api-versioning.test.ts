/**
 * ================================================================
 * API Versioning 中間件測試套件
 * ================================================================
 *
 * 【測試範圍】
 * • URL路徑版本識別
 * • HTTP Header版本識別
 * • Query參數版本識別
 * • Accept Header版本識別
 * • 版本協商和默認版本
 * • 版本淘汰警告
 * • 版本驗證
 * • 多策略組合
 *
 * 【測試策略】
 * • 測試所有版本識別策略
 * • 驗證版本狀態處理（stable, deprecated, sunset, beta）
 * • 確保版本頭部正確添加
 * • 測試錯誤情況和降級機制
 *
 * 作者：Claude Code
 * 創建時間：2025-09-30
 */

import { NextResponse } from 'next/server'
import { createMockNextRequest } from '../../utils/mock-next-request'
import {
  ApiVersioning,
  createApiVersioning,
  resolveApiVersion,
  applyVersioning,
  type VersionConfig
} from '@/lib/middleware/api-versioning'

describe('API Versioning Middleware', () => {
  describe('URL路徑版本識別', () => {
    it('應該從URL路徑中識別 v1', () => {
      const versioning = createApiVersioning()
      const request = createMockNextRequest('http://localhost/api/v1/users')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
      expect(resolution.strategy).toBe('url')
      expect(resolution.isDefault).toBe(false)
    })

    it('應該從URL路徑中識別 v2', () => {
      const versioning = createApiVersioning()
      const request = createMockNextRequest('http://localhost/api/v2/users')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.strategy).toBe('url')
      expect(resolution.isDefault).toBe(false)
    })

    it('應該處理複雜的URL路徑', () => {
      const versioning = createApiVersioning()
      const request = createMockNextRequest(
        'http://localhost/api/v2/customers/123/orders?sort=date'
      )

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.strategy).toBe('url')
    })

    it('應該在沒有版本的URL中使用默認版本', () => {
      const versioning = createApiVersioning({ defaultVersion: 'v2' })
      const request = createMockNextRequest('http://localhost/api/users')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.isDefault).toBe(true)
    })
  })

  describe('HTTP Header版本識別', () => {
    it('應該從 X-API-Version header 識別版本', () => {
      const versioning = createApiVersioning({
        strategies: ['header']
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        'X-API-Version': 'v1'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
      expect(resolution.strategy).toBe('header')
    })

    it('應該處理不帶 v 前綴的版本號', () => {
      const versioning = createApiVersioning({
        strategies: ['header']
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        'X-API-Version': '2'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.strategy).toBe('header')
    })

    it('應該支援自定義 header 名稱', () => {
      const versioning = createApiVersioning({
        strategies: ['header'],
        headerName: 'API-Version'
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        'API-Version': 'v2'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
    })

    it('應該忽略無效的版本號', () => {
      const versioning = createApiVersioning({
        strategies: ['header'],
        defaultVersion: 'v2'
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        'X-API-Version': 'v99'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.isDefault).toBe(true)
    })
  })

  describe('Query參數版本識別', () => {
    it('應該從 query 參數識別版本', () => {
      const versioning = createApiVersioning({
        strategies: ['query']
      })

      const request = createMockNextRequest('http://localhost/api/users?version=v1')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
      expect(resolution.strategy).toBe('query')
    })

    it('應該支援 api_version 參數', () => {
      const versioning = createApiVersioning({
        strategies: ['query']
      })

      const request = createMockNextRequest('http://localhost/api/users?api_version=v2')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
    })

    it('應該支援自定義 query 參數名稱', () => {
      const versioning = createApiVersioning({
        strategies: ['query'],
        queryParam: 'v'
      })

      const request = createMockNextRequest('http://localhost/api/users?v=v1')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
    })
  })

  describe('Accept Header版本識別', () => {
    it('應該從 Accept header 識別版本', () => {
      const versioning = createApiVersioning({
        strategies: ['accept-header']
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        accept: 'application/vnd.api.v1+json'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
      expect(resolution.strategy).toBe('accept-header')
    })

    it('應該處理 v2 格式的 Accept header', () => {
      const versioning = createApiVersioning({
        strategies: ['accept-header']
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        accept: 'application/vnd.api.v2+json'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
    })

    it('應該在無法解析 Accept header 時使用默認版本', () => {
      const versioning = createApiVersioning({
        strategies: ['accept-header'],
        defaultVersion: 'v2'
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        accept: 'application/json'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.isDefault).toBe(true)
    })
  })

  describe('多策略組合', () => {
    it('應該按策略順序嘗試識別版本', () => {
      const versioning = createApiVersioning({
        strategies: ['url', 'header', 'query']
      })

      // URL中有 v1，header中有 v2
      const request = createMockNextRequest('http://localhost/api/v1/users', {
        'X-API-Version': 'v2'
      })

      const resolution = versioning.resolve(request)

      // 應該使用第一個成功的策略（URL）
      expect(resolution.version).toBe('v1')
      expect(resolution.strategy).toBe('url')
    })

    it('應該在第一個策略失敗時嘗試下一個', () => {
      const versioning = createApiVersioning({
        strategies: ['url', 'header']
      })

      // URL中沒有版本，但header中有
      const request = createMockNextRequest('http://localhost/api/users', {
        'X-API-Version': 'v2'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.strategy).toBe('header')
    })
  })

  describe('版本狀態處理', () => {
    const versions: VersionConfig[] = [
      {
        version: 'v1',
        status: 'deprecated',
        migrationGuideUrl: '/docs/migration/v1-to-v2'
      },
      {
        version: 'v2',
        status: 'stable',
        isDefault: true
      }
    ]

    it('應該為已棄用的版本添加警告', () => {
      const versioning = createApiVersioning({
        versions
      })

      const request = createMockNextRequest('http://localhost/api/v1/users')

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
      expect(resolution.warnings).toBeDefined()
      expect(resolution.warnings).toContain(
        'API version v1 is deprecated. Please migrate to v2.'
      )
    })

    it('應該包含遷移指南URL', () => {
      const versioning = createApiVersioning({
        versions
      })

      const request = createMockNextRequest('http://localhost/api/v1/users')

      const resolution = versioning.resolve(request)

      expect(resolution.warnings).toContain('Migration guide: /docs/migration/v1-to-v2')
    })

    it('應該為 beta 版本添加警告', () => {
      const betaVersions: VersionConfig[] = [
        {
          version: 'v2',
          status: 'beta'
        }
      ]

      const versioning = createApiVersioning({
        versions: betaVersions,
        defaultVersion: 'v2'
      })

      const request = createMockNextRequest('http://localhost/api/v2/users')

      const resolution = versioning.resolve(request)

      expect(resolution.warnings).toBeDefined()
      expect(resolution.warnings?.some((w) => w.includes('beta'))).toBe(true)
    })

    it('應該為 sunset 版本添加淘汰日期警告', () => {
      const sunsetDate = new Date('2026-12-31')
      const sunsetVersions: VersionConfig[] = [
        {
          version: 'v1',
          status: 'sunset',
          sunsetDate
        },
        {
          version: 'v2',
          status: 'stable'
        }
      ]

      const versioning = createApiVersioning({
        versions: sunsetVersions
      })

      const request = createMockNextRequest('http://localhost/api/v1/users')

      const resolution = versioning.resolve(request)

      expect(resolution.warnings).toBeDefined()
      expect(resolution.warnings?.some((w) => w.includes('sunset'))).toBe(true)
      expect(resolution.warnings?.some((w) => w.includes('2026'))).toBe(true)
    })
  })

  describe('版本頭部添加', () => {
    it('應該在響應中添加 X-API-Version header', () => {
      const versioning = createApiVersioning()
      const request = createMockNextRequest('http://localhost/api/v2/users')

      const response = versioning.handle(request)

      expect(response.headers.get('X-API-Version')).toBe('v2')
    })

    it('應該添加版本狀態 header', () => {
      const versioning = createApiVersioning()
      const request = createMockNextRequest('http://localhost/api/v2/users')

      const response = versioning.handle(request)

      expect(response.headers.get('X-API-Version-Status')).toBe('stable')
    })

    it('應該為已棄用版本添加 Warning header', () => {
      const versioning = createApiVersioning()
      const request = createMockNextRequest('http://localhost/api/v1/users')

      const response = versioning.handle(request)

      const warning = response.headers.get('Warning')
      expect(warning).toBeTruthy()
      expect(warning).toContain('deprecated')
    })

    it('應該在 addVersionHeaders=false 時不添加頭部', () => {
      const versioning = createApiVersioning({
        addVersionHeaders: false
      })
      const request = createMockNextRequest('http://localhost/api/v2/users')

      const response = versioning.handle(request)

      expect(response.headers.get('X-API-Version')).toBeNull()
    })
  })

  describe('版本驗證方法', () => {
    it('isSupported 應該驗證版本是否受支援', () => {
      const versioning = createApiVersioning()

      expect(versioning.isSupported('v1')).toBe(true)
      expect(versioning.isSupported('v2')).toBe(true)
    })

    it('isDeprecated 應該檢查版本是否已棄用', () => {
      const versioning = createApiVersioning()

      expect(versioning.isDeprecated('v1')).toBe(true)
      expect(versioning.isDeprecated('v2')).toBe(false)
    })

    it('getVersionConfig 應該返回版本配置', () => {
      const versioning = createApiVersioning()

      const config = versioning.getVersionConfig('v2')

      expect(config).toBeDefined()
      expect(config?.version).toBe('v2')
      expect(config?.status).toBe('stable')
    })

    it('getSupportedVersions 應該返回所有支援的版本', () => {
      const versioning = createApiVersioning()

      const versions = versioning.getSupportedVersions()

      expect(versions).toHaveLength(2)
      expect(versions.map((v) => v.version)).toContain('v1')
      expect(versions.map((v) => v.version)).toContain('v2')
    })
  })

  describe('便捷函數', () => {
    it('resolveApiVersion 應該解析版本', () => {
      const request = createMockNextRequest('http://localhost/api/v1/users')

      const resolution = resolveApiVersion(request)

      expect(resolution.version).toBe('v1')
    })

    it('resolveApiVersion 應該支援自定義選項', () => {
      const request = createMockNextRequest('http://localhost/api/users', {
        'X-API-Version': 'v2'
      })

      const resolution = resolveApiVersion(request, {
        strategies: ['header']
      })

      expect(resolution.version).toBe('v2')
    })

    it('applyVersioning 應該應用版本控制到響應', () => {
      const request = createMockNextRequest('http://localhost/api/v2/users')
      const response = NextResponse.json({ data: [] })

      const versionedResponse = applyVersioning(request, response)

      expect(versionedResponse.headers.get('X-API-Version')).toBe('v2')
    })
  })

  describe('邊界情況', () => {
    it('應該處理空的版本配置', () => {
      const versioning = createApiVersioning({
        versions: []
      })

      const request = createMockNextRequest('http://localhost/api/users')

      const resolution = versioning.resolve(request)

      // 應該使用默認版本
      expect(resolution.version).toBe('v2')
      expect(resolution.isDefault).toBe(true)
    })

    it('應該處理無效的URL格式', () => {
      const versioning = createApiVersioning()

      const request = createMockNextRequest('http://localhost/api/v99/users')

      const resolution = versioning.resolve(request)

      // 應該降級到默認版本
      expect(resolution.version).toBe('v2')
      expect(resolution.isDefault).toBe(true)
    })

    it('應該處理大小寫不敏感的版本號', () => {
      const versioning = createApiVersioning({
        strategies: ['header']
      })

      const request = createMockNextRequest('http://localhost/api/users', {
        'X-API-Version': 'V1'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v1')
    })

    it('應該處理沒有配置的版本請求', () => {
      const versioning = createApiVersioning({
        versions: [
          {
            version: 'v2',
            status: 'stable'
          }
        ]
      })

      // 請求 v1 但配置中只有 v2
      const request = createMockNextRequest('http://localhost/api/v1/users')

      const resolution = versioning.resolve(request)

      // 應該識別到 v1 但由於不在配置中，config 為 undefined
      expect(resolution.version).toBe('v1')
      expect(resolution.config).toBeUndefined()
    })
  })

  describe('實際使用場景', () => {
    it('應該正確處理典型的API v1請求', () => {
      const versioning = createApiVersioning()

      const request = createMockNextRequest('http://localhost/api/v1/customers/123')

      const resolution = versioning.resolve(request)
      const response = versioning.handle(request)

      expect(resolution.version).toBe('v1')
      expect(resolution.warnings).toBeDefined()
      expect(response.headers.get('X-API-Version')).toBe('v1')
      expect(response.headers.get('Warning')).toContain('deprecated')
    })

    it('應該正確處理典型的API v2請求', () => {
      const versioning = createApiVersioning()

      const request = createMockNextRequest('http://localhost/api/v2/customers/123')

      const resolution = versioning.resolve(request)
      const response = versioning.handle(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.warnings).toBeUndefined()
      expect(response.headers.get('X-API-Version')).toBe('v2')
      expect(response.headers.get('X-API-Version-Status')).toBe('stable')
      expect(response.headers.get('Warning')).toBeNull()
    })

    it('應該處理移動應用使用 header 的場景', () => {
      const versioning = createApiVersioning({
        strategies: ['header', 'url']
      })

      const request = createMockNextRequest('http://localhost/api/customers', {
        'X-API-Version': 'v2',
        'User-Agent': 'MyApp/1.0 (iOS)'
      })

      const resolution = versioning.resolve(request)

      expect(resolution.version).toBe('v2')
      expect(resolution.strategy).toBe('header')
    })
  })
})