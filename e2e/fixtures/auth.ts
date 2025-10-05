import { test as base, expect, Browser, Page } from '@playwright/test'

// Define test user credentials
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}

// Storage state for authenticated sessions
const authFile = 'playwright/.auth/user.json'

// Extended test with authentication
export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect }