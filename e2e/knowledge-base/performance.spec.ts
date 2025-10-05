import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Performance Tests', () => {
  test('should load main knowledge page within performance thresholds', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now()

    // Navigate to knowledge base
    await page.goto('/dashboard/knowledge')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('知識庫')

    const loadTime = Date.now() - startTime

    // Performance assertion: Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)

    console.log(`Knowledge base main page load time: ${loadTime}ms`)
  })

  test('should load create page quickly', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard/knowledge/create')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="knowledge-create-form"]')).toBeVisible()

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)

    console.log(`Create page load time: ${loadTime}ms`)
  })

  test('should perform search operations efficiently', async ({ page }) => {
    await page.goto('/dashboard/knowledge/search')

    const searchInput = page.locator('[data-testid="search-input"]')
    const searchButton = page.locator('[data-testid="search-button"]')

    // Measure search time
    const startTime = Date.now()

    await searchInput.fill('測試搜索')
    await searchButton.click()

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })

    const searchTime = Date.now() - startTime

    // Search should complete within 8 seconds
    expect(searchTime).toBeLessThan(8000)

    console.log(`Search operation time: ${searchTime}ms`)
  })

  test('should handle large lists efficiently', async ({ page }) => {
    await page.goto('/dashboard/knowledge')

    // Wait for list to load
    await page.waitForSelector('[data-testid="knowledge-list"]')

    // Measure scroll performance
    const startTime = Date.now()

    // Scroll to bottom to trigger any lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    // Wait for any new content to load
    await page.waitForTimeout(1000)

    const scrollTime = Date.now() - startTime

    // Scroll handling should be smooth (under 2 seconds)
    expect(scrollTime).toBeLessThan(2000)

    console.log(`List scroll performance: ${scrollTime}ms`)
  })

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/dashboard/knowledge')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Define Core Web Vitals type
    interface CoreWebVitals {
      FCP?: number
      LCP?: number
    }

    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise<CoreWebVitals>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals: CoreWebVitals = {}

          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime
            }
          })

          resolve(vitals)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] })

        // Fallback timeout
        setTimeout(() => resolve({}), 5000)
      })
    })

    console.log('Core Web Vitals:', vitals)

    // Assert performance thresholds
    if (vitals.FCP) {
      expect(vitals.FCP).toBeLessThan(2000) // FCP should be under 2s
    }

    if (vitals.LCP) {
      expect(vitals.LCP).toBeLessThan(4000) // LCP should be under 4s
    }
  })

  test('should handle file upload performance', async ({ page }) => {
    await page.goto('/dashboard/knowledge/upload')

    // Create a reasonably sized test file
    const testContent = 'A'.repeat(1024 * 100) // 100KB
    const testFile = new File([testContent], 'performance-test.txt', { type: 'text/plain' })

    const startTime = Date.now()

    // Simulate file upload
    await page.evaluate((content) => {
      const dataTransfer = new DataTransfer()
      const file = new File([content], 'performance-test.txt', { type: 'text/plain' })
      dataTransfer.items.add(file)

      const dropZone = document.querySelector('[data-testid="drop-zone"]')
      if (dropZone) {
        const event = new DragEvent('drop', { dataTransfer })
        dropZone.dispatchEvent(event)
      }
    }, testContent)

    // Wait for file processing
    await page.waitForSelector('[data-testid="selected-file"]', { timeout: 10000 })

    const processingTime = Date.now() - startTime

    // File processing should be reasonably fast
    expect(processingTime).toBeLessThan(5000)

    console.log(`File upload processing time: ${processingTime}ms`)
  })

  test('should measure memory usage during navigation', async ({ page }) => {
    // Navigate through different pages and measure memory
    const pages = [
      '/dashboard/knowledge',
      '/dashboard/knowledge/create',
      '/dashboard/knowledge/upload',
      '/dashboard/knowledge/search'
    ]

    for (const pageUrl of pages) {
      await page.goto(pageUrl)
      await page.waitForLoadState('networkidle')

      // Get memory usage
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory || {}
      })

      console.log(`Memory usage for ${pageUrl}:`, memoryInfo)

      // Memory usage shouldn't exceed reasonable limits
      if (memoryInfo.usedJSHeapSize) {
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024) // 50MB limit
      }
    }
  })

  test('should handle concurrent operations efficiently', async ({ page, browser }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])

    const pages = await Promise.all(contexts.map(context => context.newPage()))

    try {
      const startTime = Date.now()

      // All pages navigate to knowledge base simultaneously
      await Promise.all(pages.map(p => p.goto('/dashboard/knowledge')))

      // Wait for all pages to load
      await Promise.all(pages.map(p =>
        p.waitForSelector('[data-testid="knowledge-list"]', { timeout: 15000 })
      ))

      const loadTime = Date.now() - startTime

      // Concurrent loading should complete within 10 seconds
      expect(loadTime).toBeLessThan(10000)

      console.log(`Concurrent loading time for 3 users: ${loadTime}ms`)

      // Test concurrent search operations
      const searchStartTime = Date.now()

      await Promise.all(pages.map(async (p, index) => {
        await p.goto('/dashboard/knowledge/search')
        await p.fill('[data-testid="search-input"]', `測試${index}`)
        await p.click('[data-testid="search-button"]')
        await p.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })
      }))

      const searchTime = Date.now() - searchStartTime

      // Concurrent searches should complete within 15 seconds
      expect(searchTime).toBeLessThan(15000)

      console.log(`Concurrent search time for 3 users: ${searchTime}ms`)

    } finally {
      // Clean up contexts
      await Promise.all(contexts.map(context => context.close()))
    }
  })

  test('should measure API response times', async ({ page }) => {
    // Intercept API calls and measure response times
    const apiTimes: { [key: string]: number } = {}
    const requestStartTimes: { [key: string]: number } = {}

    // Track request start times
    page.on('request', request => {
      if (request.url().includes('/api/knowledge-base')) {
        requestStartTimes[request.url()] = Date.now()
      }
    })

    // Track response end times and calculate duration
    page.on('response', response => {
      if (response.url().includes('/api/knowledge-base')) {
        const startTime = requestStartTimes[response.url()]
        if (startTime) {
          const totalTime = Date.now() - startTime
          apiTimes[response.url()] = totalTime
          console.log(`API Response time for ${response.url()}: ${totalTime}ms`)
        }
      }
    })

    // Navigate to trigger API calls
    await page.goto('/dashboard/knowledge')
    await page.waitForLoadState('networkidle')

    // Perform search to trigger search API
    await page.goto('/dashboard/knowledge/search')
    await page.fill('[data-testid="search-input"]', 'API測試')
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })

    // Assert API response times
    Object.entries(apiTimes).forEach(([url, time]) => {
      // API responses should be under 5 seconds
      expect(time).toBeLessThan(5000)
    })
  })

  test('should test mobile performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const startTime = Date.now()

    await page.goto('/dashboard/knowledge')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="knowledge-list"]')).toBeVisible()

    const mobileLoadTime = Date.now() - startTime

    // Mobile should load within 6 seconds (accounting for slower devices)
    expect(mobileLoadTime).toBeLessThan(6000)

    console.log(`Mobile load time: ${mobileLoadTime}ms`)

    // Test mobile scroll performance
    const scrollStartTime = Date.now()

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    await page.waitForTimeout(1000)

    const scrollTime = Date.now() - scrollStartTime

    // Mobile scroll should be responsive
    expect(scrollTime).toBeLessThan(2000)

    console.log(`Mobile scroll time: ${scrollTime}ms`)
  })

  test('should test error recovery performance', async ({ page }) => {
    // Navigate to knowledge base
    await page.goto('/dashboard/knowledge')

    // Simulate network error
    await page.route('/api/knowledge-base', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      })
    })

    const errorStartTime = Date.now()

    // Trigger error by refreshing
    await page.reload()

    // Wait for error handling
    await page.waitForSelector('[data-testid="error-message"], [data-testid="loading-error"]', {
      timeout: 10000
    })

    const errorHandlingTime = Date.now() - errorStartTime

    // Error should be displayed quickly
    expect(errorHandlingTime).toBeLessThan(5000)

    console.log(`Error handling time: ${errorHandlingTime}ms`)

    // Test recovery by removing route override
    await page.unroute('/api/knowledge-base')

    const recoveryStartTime = Date.now()

    // Trigger retry
    const retryButton = page.locator('[data-testid="retry-button"]')
    if (await retryButton.isVisible()) {
      await retryButton.click()
    } else {
      await page.reload()
    }

    await page.waitForSelector('[data-testid="knowledge-list"]', { timeout: 10000 })

    const recoveryTime = Date.now() - recoveryStartTime

    // Recovery should be fast
    expect(recoveryTime).toBeLessThan(5000)

    console.log(`Error recovery time: ${recoveryTime}ms`)
  })
})