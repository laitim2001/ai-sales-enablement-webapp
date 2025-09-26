import { test as base, expect } from '@playwright/test'

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
  authenticatedPage: any
}>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect }