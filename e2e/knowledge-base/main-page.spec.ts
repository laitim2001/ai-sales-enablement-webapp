import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Main Page (/dashboard/knowledge)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/knowledge')
    await expect(page.locator('h1')).toContainText('知識庫')
  })

  test('should load page with correct structure and content', async ({ page }) => {
    // Test page title and meta description
    await expect(page).toHaveTitle(/知識庫/)

    // Test main heading
    await expect(page.locator('h1')).toContainText('知識庫')

    // Test description
    await expect(page.locator('text=管理您的文檔和知識資料')).toBeVisible()

    // Test action buttons
    await expect(page.locator('text=智能搜索')).toBeVisible()
    await expect(page.locator('text=新建項目')).toBeVisible()
    await expect(page.locator('text=上傳文檔')).toBeVisible()
  })

  test('should display filters component', async ({ page }) => {
    // Check if filters are visible
    const filtersSection = page.locator('[data-testid="knowledge-filters"]')
    if (await filtersSection.isVisible()) {
      // Test category filter
      await expect(page.locator('[data-testid="category-filter"]')).toBeVisible()

      // Test search input
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

      // Test sort options
      await expect(page.locator('[data-testid="sort-select"]')).toBeVisible()
    }
  })

  test('should display knowledge base list', async ({ page }) => {
    // Wait for list to load
    await page.waitForSelector('[data-testid="knowledge-list"]', { timeout: 10000 })

    // Check if list container is visible
    await expect(page.locator('[data-testid="knowledge-list"]')).toBeVisible()

    // Check for loading states
    const loadingIndicator = page.locator('text=載入中')
    if (await loadingIndicator.isVisible()) {
      await loadingIndicator.waitFor({ state: 'detached', timeout: 10000 })
    }

    // If there are items, test item structure
    const listItems = page.locator('[data-testid="knowledge-item"]')
    const itemCount = await listItems.count()

    if (itemCount > 0) {
      // Test first item structure
      const firstItem = listItems.first()
      await expect(firstItem).toBeVisible()

      // Check for item title
      await expect(firstItem.locator('[data-testid="item-title"]')).toBeVisible()

      // Check for item metadata
      await expect(firstItem.locator('[data-testid="item-date"]')).toBeVisible()
    }
  })

  test('should handle pagination if present', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('[data-testid="knowledge-list"]')

    // Check for pagination
    const pagination = page.locator('[data-testid="pagination"]')
    if (await pagination.isVisible()) {
      // Test pagination controls
      const nextButton = page.locator('[data-testid="pagination-next"]')
      const prevButton = page.locator('[data-testid="pagination-prev"]')

      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')

        // Verify page changed
        await expect(page.url()).toContain('page=')
      }
    }
  })

  test('should handle search functionality', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')

    if (await searchInput.isVisible()) {
      // Test search
      await searchInput.fill('測試')
      await searchInput.press('Enter')

      // Wait for results
      await page.waitForLoadState('networkidle')

      // Verify URL contains search parameter
      await expect(page.url()).toContain('search=')

      // Clear search
      await searchInput.clear()
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
    }
  })

  test('should handle category filtering', async ({ page }) => {
    const categoryFilter = page.locator('[data-testid="category-filter"]')

    if (await categoryFilter.isVisible()) {
      // Test category selection
      await categoryFilter.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')

      // Verify URL contains category parameter
      await expect(page.url()).toContain('category=')

      // Reset filter
      await categoryFilter.selectOption({ index: 0 })
      await page.waitForLoadState('networkidle')
    }
  })

  test('should handle sorting options', async ({ page }) => {
    const sortSelect = page.locator('[data-testid="sort-select"]')

    if (await sortSelect.isVisible()) {
      // Test sort by title
      await sortSelect.selectOption('title')
      await page.waitForLoadState('networkidle')

      // Verify URL contains sort parameter
      await expect(page.url()).toContain('sort=title')

      // Test sort by date
      await sortSelect.selectOption('updated_at')
      await page.waitForLoadState('networkidle')
    }
  })

  test('should navigate to item details when clicking on items', async ({ page }) => {
    await page.waitForSelector('[data-testid="knowledge-list"]')

    const listItems = page.locator('[data-testid="knowledge-item"]')
    const itemCount = await listItems.count()

    if (itemCount > 0) {
      // Click on first item
      await listItems.first().click()

      // Should navigate to details page
      await page.waitForURL(/\/dashboard\/knowledge\/\d+/)

      // Verify we're on details page
      await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
    }
  })

  test('should handle empty state', async ({ page }) => {
    // Apply filters that might result in empty state
    const searchInput = page.locator('[data-testid="search-input"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistentsearchterm12345')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      // Check for empty state message
      const emptyState = page.locator('[data-testid="empty-state"]')
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText('沒有找到')
      }
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Check if mobile navigation is working
    await expect(page.locator('h1')).toContainText('知識庫')

    // Check if action buttons are properly arranged
    await expect(page.locator('text=上傳文檔')).toBeVisible()

    // Check if list items are properly sized
    const listItems = page.locator('[data-testid="knowledge-item"]')
    if (await listItems.count() > 0) {
      const firstItem = listItems.first()
      const boundingBox = await firstItem.boundingBox()
      expect(boundingBox?.width).toBeLessThanOrEqual(375)
    }
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Navigate to page and immediately check for loading states
    await page.goto('/dashboard/knowledge')

    // Check for loading indicators
    const loadingStates = [
      page.locator('text=載入中'),
      page.locator('[data-testid="loading-spinner"]'),
      page.locator('.animate-pulse')
    ]

    for (const loadingState of loadingStates) {
      if (await loadingState.isVisible()) {
        // Wait for loading to complete
        await loadingState.waitFor({ state: 'detached', timeout: 15000 })
      }
    }

    // Verify content is loaded
    await expect(page.locator('[data-testid="knowledge-list"]')).toBeVisible()
  })
})