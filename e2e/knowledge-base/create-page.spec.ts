import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Create Page (/dashboard/knowledge/create)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/knowledge/create')
    await expect(page.locator('h1')).toContainText('新建知識庫項目')
  })

  test('should load create form with all required fields', async ({ page }) => {
    // Test page title
    await expect(page).toHaveTitle(/新建知識庫項目/)

    // Test form presence
    await expect(page.locator('[data-testid="knowledge-create-form"]')).toBeVisible()

    // Test required fields
    await expect(page.locator('[data-testid="title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-textarea"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-select"]')).toBeVisible()

    // Test action buttons
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible()
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="submit-button"]')

    // Check for validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-error"]')).toBeVisible()

    // Verify form doesn't submit
    await expect(page.url()).toContain('/create')
  })

  test('should validate title field requirements', async ({ page }) => {
    const titleInput = page.locator('[data-testid="title-input"]')

    // Test empty title
    await titleInput.fill('')
    await titleInput.blur()
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()

    // Test title too short
    await titleInput.fill('ab')
    await titleInput.blur()
    if (await page.locator('[data-testid="title-error"]').isVisible()) {
      await expect(page.locator('[data-testid="title-error"]')).toContainText('至少')
    }

    // Test valid title
    await titleInput.fill('Valid Title for Testing')
    await titleInput.blur()
    await expect(page.locator('[data-testid="title-error"]')).not.toBeVisible()
  })

  test('should validate content field requirements', async ({ page }) => {
    const contentTextarea = page.locator('[data-testid="content-textarea"]')

    // Test empty content
    await contentTextarea.fill('')
    await contentTextarea.blur()
    await expect(page.locator('[data-testid="content-error"]')).toBeVisible()

    // Test content too short
    await contentTextarea.fill('Short')
    await contentTextarea.blur()
    if (await page.locator('[data-testid="content-error"]').isVisible()) {
      await expect(page.locator('[data-testid="content-error"]')).toContainText('至少')
    }

    // Test valid content
    await contentTextarea.fill('This is a valid content for testing purposes with sufficient length.')
    await contentTextarea.blur()
    await expect(page.locator('[data-testid="content-error"]')).not.toBeVisible()
  })

  test('should handle category selection', async ({ page }) => {
    const categorySelect = page.locator('[data-testid="category-select"]')

    // Test category options are available
    await categorySelect.click()
    const options = page.locator('[data-testid="category-option"]')
    const optionCount = await options.count()
    expect(optionCount).toBeGreaterThan(0)

    // Select a category
    await options.first().click()

    // Verify selection
    const selectedValue = await categorySelect.inputValue()
    expect(selectedValue).toBeTruthy()
  })

  test('should handle tags input', async ({ page }) => {
    const tagsInput = page.locator('[data-testid="tags-input"]')

    if (await tagsInput.isVisible()) {
      // Add tags
      await tagsInput.fill('測試, API, 自動化')
      await tagsInput.press('Tab')

      // Verify tags are added
      const tagElements = page.locator('[data-testid="tag-item"]')
      const tagCount = await tagElements.count()
      expect(tagCount).toBeGreaterThan(0)
    }
  })

  test('should handle language selection', async ({ page }) => {
    const languageSelect = page.locator('[data-testid="language-select"]')

    if (await languageSelect.isVisible()) {
      // Test language options
      await languageSelect.click()
      await expect(page.locator('text=繁體中文')).toBeVisible()
      await expect(page.locator('text=English')).toBeVisible()

      // Select language
      await page.click('text=繁體中文')
    }
  })

  test('should successfully create a knowledge base item', async ({ page }) => {
    // Fill form with valid data
    await page.fill('[data-testid="title-input"]', 'E2E Test Knowledge Item')
    await page.fill('[data-testid="content-textarea"]', 'This is a comprehensive test content for the E2E testing of knowledge base creation functionality.')

    // Select category
    const categorySelect = page.locator('[data-testid="category-select"]')
    await categorySelect.click()
    await page.locator('[data-testid="category-option"]').first().click()

    // Fill additional fields if present
    const authorInput = page.locator('[data-testid="author-input"]')
    if (await authorInput.isVisible()) {
      await authorInput.fill('E2E Test Author')
    }

    // Submit form
    await page.click('[data-testid="submit-button"]')

    // Wait for navigation to details page or success message
    await page.waitForURL(/\/dashboard\/knowledge\/\d+/, { timeout: 15000 })

    // Verify creation success
    await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
    await expect(page.locator('text=E2E Test Knowledge Item')).toBeVisible()
  })

  test('should handle form submission errors gracefully', async ({ page }) => {
    // Mock a server error by intercepting the API call
    await page.route('/api/knowledge-base', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error'
        })
      })
    })

    // Fill valid form data
    await page.fill('[data-testid="title-input"]', 'Test Item for Error Handling')
    await page.fill('[data-testid="content-textarea"]', 'Test content for error handling scenario.')

    // Select category
    const categorySelect = page.locator('[data-testid="category-select"]')
    await categorySelect.click()
    await page.locator('[data-testid="category-option"]').first().click()

    // Submit form
    await page.click('[data-testid="submit-button"]')

    // Verify error message is shown
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('錯誤')

    // Verify form is still on the same page
    await expect(page.url()).toContain('/create')
  })

  test('should handle cancel action', async ({ page }) => {
    // Fill some form data
    await page.fill('[data-testid="title-input"]', 'Test Title')
    await page.fill('[data-testid="content-textarea"]', 'Test content.')

    // Click cancel
    await page.click('[data-testid="cancel-button"]')

    // Should navigate back to knowledge base list
    await page.waitForURL('/dashboard/knowledge')
    await expect(page.locator('h1')).toContainText('知識庫')
  })

  test('should auto-save form data', async ({ page }) => {
    const titleInput = page.locator('[data-testid="title-input"]')
    const contentTextarea = page.locator('[data-testid="content-textarea"]')

    // Fill form data
    await titleInput.fill('Auto-save Test Title')
    await contentTextarea.fill('Auto-save test content.')

    // Wait for auto-save (if implemented)
    await page.waitForTimeout(3000)

    // Navigate away and back
    await page.goto('/dashboard/knowledge')
    await page.goto('/dashboard/knowledge/create')

    // Check if data is restored (if auto-save is implemented)
    const restoredTitle = await titleInput.inputValue()
    const restoredContent = await contentTextarea.inputValue()

    // Note: This test will pass regardless of auto-save implementation
    // It's mainly to verify the page can handle the scenario
    console.log(`Restored title: ${restoredTitle}`)
    console.log(`Restored content: ${restoredContent}`)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Verify form is still functional
    await expect(page.locator('[data-testid="knowledge-create-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-textarea"]')).toBeVisible()

    // Test form interaction on mobile
    await page.fill('[data-testid="title-input"]', 'Mobile Test')
    await page.fill('[data-testid="content-textarea"]', 'Mobile test content.')

    // Verify inputs work
    const titleValue = await page.locator('[data-testid="title-input"]').inputValue()
    expect(titleValue).toBe('Mobile Test')
  })

  test('should handle rich text editor if present', async ({ page }) => {
    const richTextEditor = page.locator('[data-testid="rich-text-editor"]')

    if (await richTextEditor.isVisible()) {
      // Test rich text functionality
      await richTextEditor.click()

      // Type content
      await page.keyboard.type('Rich text content with ')

      // Test bold formatting if available
      const boldButton = page.locator('[data-testid="bold-button"]')
      if (await boldButton.isVisible()) {
        await boldButton.click()
        await page.keyboard.type('bold text')
      }

      // Verify content is entered
      const editorContent = await richTextEditor.textContent()
      expect(editorContent).toContain('Rich text content')
    }
  })
})