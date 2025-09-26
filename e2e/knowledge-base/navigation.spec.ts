import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're authenticated (this will use the auth state)
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should navigate to knowledge base main page', async ({ page }) => {
    // Navigate to knowledge base
    await page.click('[data-testid="nav-knowledge"]')
    await page.waitForURL('/dashboard/knowledge')

    // Verify page title and content
    await expect(page.locator('h1')).toContainText('知識庫')
    await expect(page.locator('text=管理您的文檔和知識資料')).toBeVisible()

    // Verify main action buttons are present
    await expect(page.locator('text=智能搜索')).toBeVisible()
    await expect(page.locator('text=新建項目')).toBeVisible()
    await expect(page.locator('text=上傳文檔')).toBeVisible()
  })

  test('should navigate to create page from main page', async ({ page }) => {
    await page.goto('/dashboard/knowledge')

    // Click create button
    await page.click('text=新建項目')
    await page.waitForURL('/dashboard/knowledge/create')

    // Verify create page loaded
    await expect(page.locator('h1')).toContainText('新建知識庫項目')
  })

  test('should navigate to upload page from main page', async ({ page }) => {
    await page.goto('/dashboard/knowledge')

    // Click upload button
    await page.click('text=上傳文檔')
    await page.waitForURL('/dashboard/knowledge/upload')

    // Verify upload page loaded
    await expect(page.locator('h1')).toContainText('上傳文檔')
  })

  test('should navigate to search page from main page', async ({ page }) => {
    await page.goto('/dashboard/knowledge')

    // Click search button
    await page.click('text=智能搜索')
    await page.waitForURL('/dashboard/knowledge/search')

    // Verify search page loaded
    await expect(page.locator('h1')).toContainText('智能搜索')
  })

  test('should navigate back to main page from sub-pages', async ({ page }) => {
    // Test navigation from create page
    await page.goto('/dashboard/knowledge/create')
    await page.click('[data-testid="breadcrumb-knowledge"]')
    await page.waitForURL('/dashboard/knowledge')
    await expect(page.locator('h1')).toContainText('知識庫')

    // Test navigation from upload page
    await page.goto('/dashboard/knowledge/upload')
    await page.click('[data-testid="breadcrumb-knowledge"]')
    await page.waitForURL('/dashboard/knowledge')
    await expect(page.locator('h1')).toContainText('知識庫')

    // Test navigation from search page
    await page.goto('/dashboard/knowledge/search')
    await page.click('[data-testid="breadcrumb-knowledge"]')
    await page.waitForURL('/dashboard/knowledge')
    await expect(page.locator('h1')).toContainText('知識庫')
  })

  test('should handle direct URL access to all knowledge base routes', async ({ page }) => {
    const routes = [
      '/dashboard/knowledge',
      '/dashboard/knowledge/create',
      '/dashboard/knowledge/upload',
      '/dashboard/knowledge/search'
    ]

    for (const route of routes) {
      await page.goto(route)

      // Verify page loads without errors
      await expect(page.locator('body')).toBeVisible()

      // Verify no error messages
      await expect(page.locator('text=Error')).not.toBeVisible()
      await expect(page.locator('text=404')).not.toBeVisible()

      // Verify navigation is working
      await expect(page.locator('[data-testid="nav-knowledge"]')).toBeVisible()
    }
  })

  test('should maintain navigation state during page interactions', async ({ page }) => {
    await page.goto('/dashboard/knowledge')

    // Interact with filters
    if (await page.locator('[data-testid="category-filter"]').isVisible()) {
      await page.selectOption('[data-testid="category-filter"]', { index: 1 })
    }

    // Navigate to other pages and back
    await page.click('text=新建項目')
    await page.waitForURL('/dashboard/knowledge/create')

    await page.goBack()
    await page.waitForURL('/dashboard/knowledge')

    // Verify we're back to the main page
    await expect(page.locator('h1')).toContainText('知識庫')
  })
})