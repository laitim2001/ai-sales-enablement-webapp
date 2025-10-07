/**
 * @fileoverview global-setup - 工具模組
 * @module e2e/global-setup
 * @description
 * 提供輔助功能的工具函數
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    console.log('Waiting for application to be ready...')
    await page.goto(config.webServer?.url || 'http://localhost:3000')

    // Check if the application is responding
    await page.waitForSelector('body', { timeout: 30000 })

    console.log('Application is ready for testing')

    // Perform any global setup needed for tests
    // e.g., create test users, seed data, etc.

  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup