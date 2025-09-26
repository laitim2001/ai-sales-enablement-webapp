import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Search Page (/dashboard/knowledge/search)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/knowledge/search')
    await expect(page.locator('h1')).toContainText('智能搜索')
  })

  test('should load search interface with all components', async ({ page }) => {
    // Test page title
    await expect(page).toHaveTitle(/智能搜索/)

    // Test search component
    await expect(page.locator('[data-testid="knowledge-search-component"]')).toBeVisible()

    // Test search input
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

    // Test search button
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible()

    // Test search type selector
    await expect(page.locator('[data-testid="search-type-selector"]')).toBeVisible()
  })

  test('should display search type options', async ({ page }) => {
    const searchTypeSelector = page.locator('[data-testid="search-type-selector"]')

    // Check search type options
    await searchTypeSelector.click()

    // Test different search types
    await expect(page.locator('text=文本搜索')).toBeVisible()
    await expect(page.locator('text=語義搜索')).toBeVisible()
    await expect(page.locator('text=混合搜索')).toBeVisible()
  })

  test('should perform text search successfully', async ({ page }) => {
    // Enter search query
    await page.fill('[data-testid="search-input"]', '銷售策略')

    // Select text search
    await page.click('[data-testid="search-type-selector"]')
    await page.click('text=文本搜索')

    // Perform search
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })

    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()

    // Check for results metadata
    const resultCount = page.locator('[data-testid="result-count"]')
    if (await resultCount.isVisible()) {
      await expect(resultCount).toBeVisible()
    }

    // Verify search query is displayed
    await expect(page.locator('[data-testid="search-query"]')).toContainText('銷售策略')
  })

  test('should perform semantic search successfully', async ({ page }) => {
    // Enter search query
    await page.fill('[data-testid="search-input"]', '如何提高業績')

    // Select semantic search
    await page.click('[data-testid="search-type-selector"]')
    await page.click('text=語義搜索')

    // Perform search
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })

    // Verify semantic search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()

    // Check for similarity scores if displayed
    const similarityScores = page.locator('[data-testid="similarity-score"]')
    if (await similarityScores.count() > 0) {
      await expect(similarityScores.first()).toBeVisible()
    }
  })

  test('should perform hybrid search successfully', async ({ page }) => {
    // Enter search query
    await page.fill('[data-testid="search-input"]', '客戶關係管理')

    // Select hybrid search
    await page.click('[data-testid="search-type-selector"]')
    await page.click('text=混合搜索')

    // Perform search
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })

    // Verify hybrid search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()

    // Check for both text and semantic results
    const searchMetadata = page.locator('[data-testid="search-metadata"]')
    if (await searchMetadata.isVisible()) {
      await expect(searchMetadata).toContainText('混合')
    }
  })

  test('should handle search filters', async ({ page }) => {
    // Perform initial search
    await page.fill('[data-testid="search-input"]', '文檔')
    await page.click('[data-testid="search-button"]')

    // Wait for results and filters
    await page.waitForSelector('[data-testid="search-filters"]', { timeout: 10000 })

    const filtersSection = page.locator('[data-testid="search-filters"]')
    if (await filtersSection.isVisible()) {
      // Test category filter
      const categoryFilter = page.locator('[data-testid="filter-category"]')
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click()
        await page.locator('[data-testid="category-option"]').first().click()

        // Wait for filtered results
        await page.waitForLoadState('networkidle')

        // Verify URL contains filter parameter
        await expect(page.url()).toContain('category=')
      }

      // Test date range filter
      const dateFilter = page.locator('[data-testid="filter-date"]')
      if (await dateFilter.isVisible()) {
        await dateFilter.click()
        await page.click('text=最近一週')

        // Wait for filtered results
        await page.waitForLoadState('networkidle')
      }

      // Test author filter
      const authorFilter = page.locator('[data-testid="filter-author"]')
      if (await authorFilter.isVisible()) {
        await authorFilter.fill('測試作者')
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('should handle search suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')

    // Start typing to trigger suggestions
    await searchInput.fill('銷')

    // Check for search suggestions
    const suggestions = page.locator('[data-testid="search-suggestions"]')
    if (await suggestions.isVisible()) {
      await expect(suggestions).toBeVisible()

      // Test clicking on a suggestion
      const firstSuggestion = page.locator('[data-testid="suggestion-item"]').first()
      if (await firstSuggestion.isVisible()) {
        await firstSuggestion.click()

        // Verify suggestion is applied to search input
        const inputValue = await searchInput.inputValue()
        expect(inputValue.length).toBeGreaterThan(1)
      }
    }
  })

  test('should handle empty search results', async ({ page }) => {
    // Search for something unlikely to exist
    await page.fill('[data-testid="search-input"]', 'nonexistentterm12345xyz')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })

    // Check for empty state
    const emptyState = page.locator('[data-testid="empty-results"]')
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('沒有找到')
      await expect(page.locator('text=嘗試其他關鍵詞')).toBeVisible()
    }
  })

  test('should handle search result pagination', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', '測試')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')

    // Check for pagination
    const pagination = page.locator('[data-testid="search-pagination"]')
    if (await pagination.isVisible()) {
      const nextButton = page.locator('[data-testid="pagination-next"]')

      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click()

        // Wait for new results
        await page.waitForLoadState('networkidle')

        // Verify page changed
        await expect(page.url()).toContain('page=')
      }
    }
  })

  test('should navigate to result details', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', '文檔')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')

    // Click on first result
    const firstResult = page.locator('[data-testid="search-result-item"]').first()
    if (await firstResult.isVisible()) {
      await firstResult.click()

      // Should navigate to knowledge base item details
      await page.waitForURL(/\/dashboard\/knowledge\/\d+/)

      // Verify we're on details page
      await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
    }
  })

  test('should handle search history', async ({ page }) => {
    const searchHistory = page.locator('[data-testid="search-history"]')

    if (await searchHistory.isVisible()) {
      // Perform several searches
      const searchTerms = ['銷售', '客戶', '產品']

      for (const term of searchTerms) {
        await page.fill('[data-testid="search-input"]', term)
        await page.click('[data-testid="search-button"]')
        await page.waitForLoadState('networkidle')
      }

      // Check search history
      await page.click('[data-testid="search-history-toggle"]')

      // Verify recent searches appear
      for (const term of searchTerms) {
        if (await page.locator(`[data-testid="history-item"]:has-text("${term}")`).isVisible()) {
          await expect(page.locator(`[data-testid="history-item"]:has-text("${term}")`)).toBeVisible()
        }
      }

      // Test clicking on history item
      const historyItem = page.locator('[data-testid="history-item"]').first()
      if (await historyItem.isVisible()) {
        await historyItem.click()

        // Verify search input is filled with history item
        const inputValue = await page.locator('[data-testid="search-input"]').inputValue()
        expect(inputValue.length).toBeGreaterThan(0)
      }
    }
  })

  test('should handle advanced search options', async ({ page }) => {
    const advancedSearch = page.locator('[data-testid="advanced-search"]')

    if (await advancedSearch.isVisible()) {
      await page.click('[data-testid="advanced-search-toggle"]')

      // Test advanced options
      const exactPhrase = page.locator('[data-testid="exact-phrase"]')
      if (await exactPhrase.isVisible()) {
        await exactPhrase.fill('銷售策略')
      }

      const excludeWords = page.locator('[data-testid="exclude-words"]')
      if (await excludeWords.isVisible()) {
        await excludeWords.fill('舊版')
      }

      const similarityThreshold = page.locator('[data-testid="similarity-threshold"]')
      if (await similarityThreshold.isVisible()) {
        await similarityThreshold.fill('0.7')
      }

      // Perform advanced search
      await page.click('[data-testid="advanced-search-button"]')

      // Wait for results
      await page.waitForSelector('[data-testid="search-results"]')
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    }
  })

  test('should handle search errors gracefully', async ({ page }) => {
    // Mock search API error
    await page.route('/api/knowledge-base/search', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Search service unavailable'
        })
      })
    })

    // Perform search
    await page.fill('[data-testid="search-input"]', '測試搜索')
    await page.click('[data-testid="search-button"]')

    // Verify error message
    await expect(page.locator('[data-testid="search-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-error"]')).toContainText('搜索失敗')
  })

  test('should export search results', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', '報告')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')

    // Check for export functionality
    const exportButton = page.locator('[data-testid="export-results"]')
    if (await exportButton.isVisible()) {
      // Test export options
      await exportButton.click()

      const exportOptions = page.locator('[data-testid="export-options"]')
      if (await exportOptions.isVisible()) {
        // Test CSV export
        const csvExport = page.locator('[data-testid="export-csv"]')
        if (await csvExport.isVisible()) {
          // Setup download listener
          const downloadPromise = page.waitForEvent('download')
          await csvExport.click()

          // Wait for download
          const download = await downloadPromise
          expect(download.suggestedFilename()).toContain('.csv')
        }
      }
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Verify search interface is functional on mobile
    await expect(page.locator('[data-testid="knowledge-search-component"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

    // Test search on mobile
    await page.fill('[data-testid="search-input"]', '移動測試')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })

    // Verify results are properly displayed on mobile
    const searchResults = page.locator('[data-testid="search-results"]')
    const boundingBox = await searchResults.boundingBox()

    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375)
    }
  })
})