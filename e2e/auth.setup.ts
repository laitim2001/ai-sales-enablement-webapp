/**
 * @fileoverview auth.setup - 工具模組
 * @module e2e/auth.setup
 * @description
 * 提供輔助功能的工具函數
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { test as setup, expect } from '@playwright/test'
import { TEST_USER } from './fixtures/auth'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/auth/login')

  // Fill login form
  await page.fill('[data-testid="email-input"]', TEST_USER.email)
  await page.fill('[data-testid="password-input"]', TEST_USER.password)

  // Submit form
  await page.click('[data-testid="login-button"]')

  // Wait for successful login and redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 30000 })

  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()

  // Save authentication state
  await page.context().storageState({ path: authFile })
})