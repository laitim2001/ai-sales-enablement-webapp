import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Integration Tests', () => {
  test('should complete full knowledge base workflow', async ({ page }) => {
    // Step 1: Navigate to knowledge base
    await page.goto('/dashboard/knowledge')
    await expect(page.locator('h1')).toContainText('知識庫')

    // Step 2: Create new knowledge base item
    await page.click('text=新建項目')
    await page.waitForURL('/dashboard/knowledge/create')

    // Fill creation form
    await page.fill('[data-testid="title-input"]', 'Integration Test Document')
    await page.fill('[data-testid="content-textarea"]', 'This is a comprehensive integration test document that will be used to test the complete knowledge base workflow including creation, editing, searching, and deletion.')

    // Select category
    const categorySelect = page.locator('[data-testid="category-select"]')
    await categorySelect.click()
    await page.locator('[data-testid="category-option"]').first().click()

    // Add tags if available
    const tagsInput = page.locator('[data-testid="tags-input"]')
    if (await tagsInput.isVisible()) {
      await tagsInput.fill('integration, test, workflow')
    }

    // Submit form
    await page.click('[data-testid="submit-button"]')

    // Wait for navigation to details page
    await page.waitForURL(/\/dashboard\/knowledge\/\d+/)
    await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()

    // Extract item ID for later use
    const url = page.url()
    const itemId = url.match(/\/dashboard\/knowledge\/(\d+)/)?.[1]
    expect(itemId).toBeTruthy()

    // Step 3: Verify item appears in list
    await page.goto('/dashboard/knowledge')
    await page.waitForSelector('[data-testid="knowledge-list"]')

    // Search for the created item
    const searchInput = page.locator('[data-testid="search-input"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Integration Test Document')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      // Verify item appears in search results
      await expect(page.locator('text=Integration Test Document')).toBeVisible()
    }

    // Step 4: Edit the item
    await page.goto(`/dashboard/knowledge/${itemId}/edit`)
    await expect(page.locator('[data-testid="knowledge-edit-form"]')).toBeVisible()

    // Update content
    await page.fill('[data-testid="title-input"]', 'Updated Integration Test Document')
    await page.fill('[data-testid="content-textarea"]', 'This document has been updated during the integration test to verify the edit functionality works correctly.')

    // Save changes
    await page.click('[data-testid="save-button"]')
    await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

    // Verify changes were saved
    await expect(page.locator('[data-testid="item-title"]')).toContainText('Updated Integration Test Document')

    // Step 5: Test search functionality
    await page.goto('/dashboard/knowledge/search')
    await expect(page.locator('[data-testid="knowledge-search-component"]')).toBeVisible()

    // Perform semantic search
    await page.fill('[data-testid="search-input"]', 'integration testing workflow')
    await page.click('[data-testid="search-type-selector"]')
    await page.click('text=語義搜索')
    await page.click('[data-testid="search-button"]')

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })

    // Verify our document appears in results
    await expect(page.locator('text=Updated Integration Test Document')).toBeVisible()

    console.log(`Integration test completed successfully for item ID: ${itemId}`)
  })

  test('should handle file upload and processing workflow', async ({ page }) => {
    // Step 1: Navigate to upload page
    await page.goto('/dashboard/knowledge/upload')
    await expect(page.locator('[data-testid="file-upload-component"]')).toBeVisible()

    // Step 2: Create and upload a test file
    const testContent = `
      Integration Test File
      =====================

      This is a test file for the integration test workflow.
      It contains structured content to test file processing capabilities.

      ## Section 1: Basic Information
      - Document type: Test file
      - Purpose: Integration testing
      - Created: ${new Date().toISOString()}

      ## Section 2: Content
      This section contains the main content of the document.
      It should be processed and indexed correctly by the system.

      ## Section 3: Metadata
      Tags: integration, upload, test, file
      Category: Testing
      Language: Traditional Chinese / English
    `

    // Create test file path
    const testFilePath = require('path').join(__dirname, '../fixtures/integration-test.txt')

    // Ensure fixtures directory exists
    const fs = require('fs')
    const path = require('path')
    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true })
    }

    fs.writeFileSync(testFilePath, testContent)

    try {
      // Upload file
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(testFilePath)

      // Wait for file to be selected
      await expect(page.locator('[data-testid="selected-file"]')).toBeVisible()

      // Fill metadata form if present
      const metadataForm = page.locator('[data-testid="metadata-form"]')
      if (await metadataForm.isVisible()) {
        const titleInput = page.locator('[data-testid="metadata-title"]')
        if (await titleInput.isVisible()) {
          await titleInput.fill('Integration Upload Test File')
        }

        const categorySelect = page.locator('[data-testid="metadata-category"]')
        if (await categorySelect.isVisible()) {
          await categorySelect.click()
          await page.locator('[data-testid="category-option"]').first().click()
        }

        const tagsInput = page.locator('[data-testid="metadata-tags"]')
        if (await tagsInput.isVisible()) {
          await tagsInput.fill('integration, upload, automated-test')
        }
      }

      // Submit upload
      await page.click('[data-testid="upload-submit-button"]')

      // Wait for upload completion
      await page.waitForSelector('[data-testid="upload-success"], [data-testid="knowledge-details"]', {
        timeout: 30000
      })

      // Step 3: Verify file was processed correctly
      let uploadedItemId: string | undefined

      // Check if we're redirected to details page
      if (page.url().includes('/dashboard/knowledge/')) {
        const match = page.url().match(/\/dashboard\/knowledge\/(\d+)/)
        if (match) {
          uploadedItemId = match[1]
          await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
        }
      } else {
        // Navigate to knowledge base to find uploaded item
        await page.goto('/dashboard/knowledge')
        await page.waitForSelector('[data-testid="knowledge-list"]')

        // Search for uploaded file
        const searchInput = page.locator('[data-testid="search-input"]')
        if (await searchInput.isVisible()) {
          await searchInput.fill('Integration Upload Test File')
          await searchInput.press('Enter')
          await page.waitForLoadState('networkidle')

          // Click on the uploaded item
          const uploadedItem = page.locator('text=Integration Upload Test File')
          if (await uploadedItem.isVisible()) {
            await uploadedItem.click()
            await page.waitForURL(/\/dashboard\/knowledge\/\d+/)

            const match = page.url().match(/\/dashboard\/knowledge\/(\d+)/)
            if (match) {
              uploadedItemId = match[1]
            }
          }
        }
      }

      // Step 4: Verify content was extracted correctly
      if (uploadedItemId) {
        await expect(page.locator('[data-testid="item-content"]')).toContainText('Integration Test File')
        await expect(page.locator('[data-testid="item-content"]')).toContainText('structured content')

        // Check if document chunks were created
        const chunksSection = page.locator('[data-testid="document-chunks"]')
        if (await chunksSection.isVisible()) {
          const chunkItems = page.locator('[data-testid="chunk-item"]')
          expect(await chunkItems.count()).toBeGreaterThan(0)
        }

        console.log(`File upload integration test completed for item ID: ${uploadedItemId}`)
      }

    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should integrate search across different content types', async ({ page }) => {
    // Step 1: Ensure we have various content types
    await page.goto('/dashboard/knowledge')
    await page.waitForSelector('[data-testid="knowledge-list"]')

    // Step 2: Perform comprehensive search
    await page.goto('/dashboard/knowledge/search')

    // Test different search types with the same query
    const searchQuery = '測試'
    const searchTypes = ['文本搜索', '語義搜索', '混合搜索']

    for (const searchType of searchTypes) {
      await page.fill('[data-testid="search-input"]', searchQuery)

      // Select search type
      await page.click('[data-testid="search-type-selector"]')
      await page.click(`text=${searchType}`)

      // Perform search
      await page.click('[data-testid="search-button"]')

      // Wait for results
      await page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })

      // Verify search results are returned
      const results = page.locator('[data-testid="search-result-item"]')
      const resultCount = await results.count()

      console.log(`${searchType} returned ${resultCount} results for query: ${searchQuery}`)

      // Verify result structure
      if (resultCount > 0) {
        const firstResult = results.first()
        await expect(firstResult.locator('[data-testid="result-title"]')).toBeVisible()
        await expect(firstResult.locator('[data-testid="result-snippet"]')).toBeVisible()

        // Test clicking on result
        await firstResult.click()
        await page.waitForURL(/\/dashboard\/knowledge\/\d+/)
        await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()

        // Navigate back to search
        await page.goto('/dashboard/knowledge/search')
      }
    }
  })

  test('should handle cross-page state management', async ({ page }) => {
    // Step 1: Set filters on main knowledge page
    await page.goto('/dashboard/knowledge')
    await page.waitForSelector('[data-testid="knowledge-list"]')

    // Apply filters
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')
    }

    const searchInput = page.locator('[data-testid="search-input"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('狀態測試')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
    }

    // Step 2: Navigate to other pages and back
    await page.click('text=新建項目')
    await page.waitForURL('/dashboard/knowledge/create')

    // Navigate back
    await page.click('[data-testid="breadcrumb-knowledge"]')
    await page.waitForURL('/dashboard/knowledge')

    // Step 3: Verify filters are maintained
    if (await categoryFilter.isVisible()) {
      const selectedCategory = await categoryFilter.inputValue()
      expect(selectedCategory).toBeTruthy()
    }

    if (await searchInput.isVisible()) {
      const searchValue = await searchInput.inputValue()
      expect(searchValue).toBe('狀態測試')
    }

    // Step 4: Test URL state preservation
    const currentUrl = page.url()
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify URL parameters are maintained
    expect(page.url()).toBe(currentUrl)
  })

  test('should integrate with authentication and permissions', async ({ page }) => {
    // Step 1: Verify authenticated access
    await page.goto('/dashboard/knowledge')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()

    // Step 2: Test protected operations
    const protectedOperations = [
      { action: 'create', url: '/dashboard/knowledge/create' },
      { action: 'upload', url: '/dashboard/knowledge/upload' },
      { action: 'search', url: '/dashboard/knowledge/search' }
    ]

    for (const operation of protectedOperations) {
      await page.goto(operation.url)

      // Should not redirect to login (user is authenticated)
      expect(page.url()).toContain(operation.url)

      // Should display expected content
      await expect(page.locator('h1')).toBeVisible()

      console.log(`User has access to ${operation.action} functionality`)
    }

    // Step 3: Test item-level permissions
    await page.goto('/dashboard/knowledge')
    await page.waitForSelector('[data-testid="knowledge-list"]')

    const listItems = page.locator('[data-testid="knowledge-item"]')
    if (await listItems.count() > 0) {
      // Click on first item
      await listItems.first().click()
      await page.waitForURL(/\/dashboard\/knowledge\/\d+/)

      // Verify user can view details
      await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()

      // Check if edit button is available
      const editButton = page.locator('[data-testid="edit-button"]')
      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForURL(/\/dashboard\/knowledge\/\d+\/edit/)
        await expect(page.locator('[data-testid="knowledge-edit-form"]')).toBeVisible()
        console.log('User has edit permissions')
      }
    }
  })

  test('should handle error scenarios gracefully across pages', async ({ page }) => {
    // Test network error handling
    await page.route('/api/knowledge-base', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Network error' })
      })
    })

    // Step 1: Test error on main page
    await page.goto('/dashboard/knowledge')
    await expect(page.locator('[data-testid="error-message"], [data-testid="loading-error"]')).toBeVisible()

    // Step 2: Test error recovery
    await page.unroute('/api/knowledge-base')

    const retryButton = page.locator('[data-testid="retry-button"]')
    if (await retryButton.isVisible()) {
      await retryButton.click()
    } else {
      await page.reload()
    }

    await page.waitForSelector('[data-testid="knowledge-list"]', { timeout: 10000 })
    await expect(page.locator('[data-testid="knowledge-list"]')).toBeVisible()

    // Step 3: Test search error handling
    await page.route('/api/knowledge-base/search', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Search service unavailable' })
      })
    })

    await page.goto('/dashboard/knowledge/search')
    await page.fill('[data-testid="search-input"]', '錯誤測試')
    await page.click('[data-testid="search-button"]')

    await expect(page.locator('[data-testid="search-error"]')).toBeVisible()

    // Clean up routes
    await page.unroute('/api/knowledge-base/search')
  })

  test('should maintain performance across workflow', async ({ page }) => {
    const performanceMetrics: { [key: string]: number } = {}

    // Step 1: Measure navigation performance
    let startTime = Date.now()
    await page.goto('/dashboard/knowledge')
    await page.waitForLoadState('networkidle')
    performanceMetrics.mainPageLoad = Date.now() - startTime

    // Step 2: Measure search performance
    startTime = Date.now()
    await page.goto('/dashboard/knowledge/search')
    await page.fill('[data-testid="search-input"]', '性能測試')
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })
    performanceMetrics.searchOperation = Date.now() - startTime

    // Step 3: Measure create page performance
    startTime = Date.now()
    await page.goto('/dashboard/knowledge/create')
    await page.waitForLoadState('networkidle')
    performanceMetrics.createPageLoad = Date.now() - startTime

    // Log performance metrics
    console.log('Integration workflow performance metrics:', performanceMetrics)

    // Assert performance thresholds
    expect(performanceMetrics.mainPageLoad).toBeLessThan(5000)
    expect(performanceMetrics.searchOperation).toBeLessThan(10000)
    expect(performanceMetrics.createPageLoad).toBeLessThan(3000)
  })

  test('should handle concurrent user scenarios', async ({ page, browser }) => {
    // Simulate multiple users working with knowledge base
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext()
    ])

    const [user1Page, user2Page] = await Promise.all(
      contexts.map(context => context.newPage())
    )

    try {
      // User 1: Creates a document
      await user1Page.goto('/dashboard/knowledge/create')
      await user1Page.fill('[data-testid="title-input"]', 'Concurrent Test Document')
      await user1Page.fill('[data-testid="content-textarea"]', 'Document created by user 1 for concurrent testing.')

      const categorySelect = user1Page.locator('[data-testid="category-select"]')
      await categorySelect.click()
      await user1Page.locator('[data-testid="category-option"]').first().click()

      await user1Page.click('[data-testid="submit-button"]')
      await user1Page.waitForURL(/\/dashboard\/knowledge\/\d+/)

      // User 2: Searches for the document
      await user2Page.goto('/dashboard/knowledge/search')
      await user2Page.fill('[data-testid="search-input"]', 'Concurrent Test Document')
      await user2Page.click('[data-testid="search-button"]')
      await user2Page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 })

      // Verify User 2 can find User 1's document
      await expect(user2Page.locator('text=Concurrent Test Document')).toBeVisible()

      // User 2: Views the document
      await user2Page.click('text=Concurrent Test Document')
      await user2Page.waitForURL(/\/dashboard\/knowledge\/\d+/)
      await expect(user2Page.locator('[data-testid="knowledge-details"]')).toBeVisible()

      console.log('Concurrent user scenario completed successfully')

    } finally {
      await Promise.all(contexts.map(context => context.close()))
    }
  })
})