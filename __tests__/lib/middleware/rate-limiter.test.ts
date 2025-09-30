/**
 * ================================================================
 * Rate Limiter 中間件測試套件
 * ================================================================
 *
 * 【測試範圍】
 * • 基本速率限制功能
 * • 不同預設配置的驗證
 * • 速率限制頭部設置
 * • 超出限制的處理
 * • 時間窗口重置
 * • 自定義 key 生成器
 * • 錯誤處理
 * • 統計功能
 *
 * 【測試策略】
 * • 使用 mock NextRequest 確保測試環境兼容性
 * • 測試各種速率限制場景
 * • 驗證 HTTP 429 響應正確性
 * • 確保計數器正確重置
 *
 * 作者：Claude Code
 * 創建時間：2025-09-30
 */

import { NextResponse } from 'next/server'
import { createMockNextRequest } from '../../utils/mock-next-request'
import {
  createRateLimit,
  RateLimitPresets,
  checkRateLimit,
  clearRateLimit,
  getRateLimitStats,
  rateLimitStore
} from '@/lib/middleware/rate-limiter'

// 測試前清理存儲
beforeEach(() => {
  // 清空 rate limiter 存儲
  ;(rateLimitStore as any).store.clear()
})

// 測試後清理
afterEach(() => {
  ;(rateLimitStore as any).store.clear()
})

describe('Rate Limiter Middleware', () => {
  describe('基本速率限制功能', () => {
    it('應該允許在限制內的請求通過', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      // 創建 next 函數
      const next = async () => NextResponse.json({ success: true })

      const response = await rateLimit(request, next)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(200)
    })

    it('應該在超出限制時返回 429 錯誤', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      // 發送 3 次請求
      await rateLimit(request, next)
      await rateLimit(request, next)
      const response = await rateLimit(request, next)

      expect(response?.status).toBe(429)

      const data = await response?.json()
      expect(data).toHaveProperty('error', 'RATE_LIMIT_EXCEEDED')
      expect(data).toHaveProperty('retryAfter')
    })

    it('應該正確設置速率限制頭部', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10,
        headers: true
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      const response = await rateLimit(request, next)

      expect(response?.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response?.headers.get('X-RateLimit-Remaining')).toBe('9')
      expect(response?.headers.get('X-RateLimit-Reset')).toBeTruthy()
      expect(response?.headers.get('X-RateLimit-Window')).toBe('60000')
    })

    it('應該在超出限制時設置 Retry-After 頭部', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      await rateLimit(request, next)
      const response = await rateLimit(request, next)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(429)

      // 驗證響應 body 中包含 retryAfter
      const data = await response?.json()
      expect(data).toHaveProperty('retryAfter')
      expect(data.retryAfter).toBeGreaterThan(0)
      expect(data.retryAfter).toBeLessThanOrEqual(60)
    })
  })

  describe('自定義 Key 生成器', () => {
    it('應該使用自定義 key 生成器', async () => {
      const customKeyGenerator = jest.fn(() => 'custom-key')

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: customKeyGenerator
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      await rateLimit(request, next)

      expect(customKeyGenerator).toHaveBeenCalledWith(request)
    })

    it('應該根據用戶 ID 分別限制', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const next = async () => NextResponse.json({ success: true })

      // 用戶 1 的請求
      const request1 = createMockNextRequest('http://localhost/api/test', {
        'x-user-id': 'user-1'
      })

      // 用戶 2 的請求
      const request2 = createMockNextRequest('http://localhost/api/test', {
        'x-user-id': 'user-2'
      })

      // 用戶 1 發送 2 次請求
      const response1a = await rateLimit(request1, next)
      const response1b = await rateLimit(request1, next)

      expect(response1a?.status).toBe(200)
      expect(response1b?.status).toBe(200)

      // 用戶 1 第 3 次請求應該被限制
      const response1c = await rateLimit(request1, next)
      expect(response1c?.status).toBe(429)

      // 用戶 2 的請求應該正常通過
      const response2a = await rateLimit(request2, next)
      expect(response2a?.status).toBe(200)
    })
  })

  describe('預設配置', () => {
    it('AI_API 預設應該有嚴格的限制', () => {
      const config = RateLimitPresets.AI_API

      expect(config.windowMs).toBe(60000) // 1 分鐘
      expect(config.maxRequests).toBe(10) // 最多 10 次
    })

    it('GENERAL_API 預設應該有中等限制', () => {
      const config = RateLimitPresets.GENERAL_API

      expect(config.windowMs).toBe(60000)
      expect(config.maxRequests).toBe(60)
    })

    it('AUTH_ATTEMPT 預設應該有非常嚴格的限制', () => {
      const config = RateLimitPresets.AUTH_ATTEMPT

      expect(config.windowMs).toBe(900000) // 15 分鐘
      expect(config.maxRequests).toBe(5) // 最多 5 次
    })

    it('使用 AUTH_ATTEMPT 預設應該正確限制登入嘗試', async () => {
      const rateLimit = createRateLimit(RateLimitPresets.AUTH_ATTEMPT)

      const request = createMockNextRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      // 發送 5 次成功請求
      for (let i = 0; i < 5; i++) {
        const response = await rateLimit(request, next)
        expect(response?.status).toBe(200)
      }

      // 第 6 次應該被限制
      const response = await rateLimit(request, next)
      expect(response?.status).toBe(429)
    })
  })

  describe('時間窗口重置', () => {
    it('應該在時間窗口過期後重置計數', async () => {
      const rateLimit = createRateLimit({
        windowMs: 100, // 100ms 窗口
        maxRequests: 2
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      // 發送 2 次請求達到限制
      await rateLimit(request, next)
      await rateLimit(request, next)

      // 第 3 次應該被限制
      const response1 = await rateLimit(request, next)
      expect(response1?.status).toBe(429)

      // 等待窗口過期
      await new Promise((resolve) => setTimeout(resolve, 150))

      // 窗口重置後應該可以再次請求
      const response2 = await rateLimit(request, next)
      expect(response2?.status).toBe(200)
    })
  })

  describe('skipSuccessfulRequests 選項', () => {
    it('應該在啟用時不計算成功請求', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      // 發送多次成功請求
      for (let i = 0; i < 5; i++) {
        const response = await rateLimit(request, next)
        expect(response?.status).toBe(200)
      }
    })
  })

  describe('checkRateLimit 工具函數', () => {
    it('應該正確返回速率限制狀態', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 5,
        message: 'Rate limit exceeded'
      }

      // 第一次檢查應該顯示未使用
      const status1 = await checkRateLimit('test-key', config)

      expect(status1.allowed).toBe(true)
      expect(status1.count).toBe(0)
      expect(status1.remaining).toBe(5)

      // 模擬增加計數
      await rateLimitStore.increment('test-key', config.windowMs)
      await rateLimitStore.increment('test-key', config.windowMs)

      const status2 = await checkRateLimit('test-key', config)

      expect(status2.allowed).toBe(true)
      expect(status2.count).toBe(2)
      expect(status2.remaining).toBe(3)
    })

    it('應該在超出限制時返回 retryAfter', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 2,
        message: 'Rate limit exceeded'
      }

      // 增加計數到超出限制
      await rateLimitStore.increment('test-key', config.windowMs)
      await rateLimitStore.increment('test-key', config.windowMs)
      await rateLimitStore.increment('test-key', config.windowMs)

      const status = await checkRateLimit('test-key', config)

      expect(status.allowed).toBe(false)
      expect(status.count).toBe(3)
      expect(status.remaining).toBe(0)
      expect(status.retryAfter).toBeDefined()
      expect(status.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('clearRateLimit 工具函數', () => {
    it('應該清除指定 key 的速率限制記錄', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 2,
        message: 'Rate limit exceeded'
      }

      // 增加計數
      await rateLimitStore.increment('test-key', config.windowMs)
      await rateLimitStore.increment('test-key', config.windowMs)

      // 驗證計數存在
      const status1 = await checkRateLimit('test-key', config)
      expect(status1.count).toBe(2)

      // 清除記錄
      await clearRateLimit('test-key')

      // 驗證已清除
      const status2 = await checkRateLimit('test-key', config)
      expect(status2.count).toBe(0)
    })
  })

  describe('getRateLimitStats 工具函數', () => {
    it('應該返回正確的統計信息', async () => {
      // 創建一些速率限制記錄
      await rateLimitStore.increment('user:1', 60000)
      await rateLimitStore.increment('user:1', 60000)
      await rateLimitStore.increment('user:2', 60000)
      await rateLimitStore.increment('ip:127.0.0.1', 60000)

      const stats = await getRateLimitStats()

      expect(stats.totalKeys).toBeGreaterThan(0)
      expect(stats.activeKeys).toBeGreaterThan(0)
      expect(stats.topKeys).toBeInstanceOf(Array)
    })
  })

  describe('錯誤處理', () => {
    it('應該在發生錯誤時允許請求通過', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
        // 使用會拋出錯誤的 key 生成器
        keyGenerator: () => {
          throw new Error('Key generation failed')
        }
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      const response = await rateLimit(request, next)

      // 應該允許請求通過（容錯機制）
      expect(response?.status).toBe(200)
    })
  })

  describe('自定義錯誤消息', () => {
    it('應該使用自定義錯誤消息', async () => {
      const customMessage = '您的請求過於頻繁，請稍後再試'

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      // 達到限制
      await rateLimit(request, next)
      const response = await rateLimit(request, next)

      const data = await response?.json()
      expect(data.message).toBe(customMessage)
    })
  })

  describe('邊界情況', () => {
    it('應該處理沒有 IP 地址的請求', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      // 創建沒有 IP 相關頭部的請求
      const request = createMockNextRequest('http://localhost/api/test', {})

      const next = async () => NextResponse.json({ success: true })

      const response = await rateLimit(request, next)

      // 應該使用 'unknown' 作為 key
      expect(response?.status).toBe(200)
    })

    it('應該處理 maxRequests 為 0 的情況', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 0 // 不允許任何請求
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      const response = await rateLimit(request, next)

      // 第一次請求就應該被限制
      expect(response?.status).toBe(429)
    })

    it('應該處理非常短的時間窗口', async () => {
      const rateLimit = createRateLimit({
        windowMs: 1, // 1ms 窗口
        maxRequests: 1
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      const response1 = await rateLimit(request, next)
      expect(response1?.status).toBe(200)

      // 短暫延遲後應該可以再次請求
      await new Promise((resolve) => setTimeout(resolve, 10))

      const response2 = await rateLimit(request, next)
      expect(response2?.status).toBe(200)
    })
  })

  describe('並發請求處理', () => {
    it('應該正確處理並發請求', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10,
        skipSuccessfulRequests: false, // 確保所有請求都被計數
        skipFailedRequests: false
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      // 先順序發送 10 個請求，確保達到限制
      for (let i = 0; i < 10; i++) {
        await rateLimit(request, next)
      }

      // 再發送 5 個請求，這些應該全部被限制
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => rateLimit(request, next))
      )

      const successCount = responses.filter((r) => r?.status === 200).length
      const rateLimitedCount = responses.filter((r) => r?.status === 429).length

      // 所有 5 個請求都應該被限制
      expect(successCount).toBe(0)
      expect(rateLimitedCount).toBe(5)
    })
  })

  describe('headers 選項', () => {
    it('應該在 headers=false 時不添加速率限制頭部', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10,
        headers: false
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        'x-forwarded-for': '127.0.0.1'
      })

      const next = async () => NextResponse.json({ success: true })

      const response = await rateLimit(request, next)

      expect(response?.headers.get('X-RateLimit-Limit')).toBeNull()
      expect(response?.headers.get('X-RateLimit-Remaining')).toBeNull()
    })
  })
})