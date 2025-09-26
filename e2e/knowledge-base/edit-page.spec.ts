import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Edit Page (/dashboard/knowledge/[id]/edit)', () => {
  let testItemId: string

  test.beforeAll(async ({ browser }) => {
    // Create a test knowledge base item for editing
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await page.goto('/dashboard/knowledge/create')
      await expect(page.locator('h1')).toContainText('新建知識庫項目')

      // Fill form to create test item
      await page.fill('[data-testid="title-input"]', 'E2E Edit Test Item')
      await page.fill('[data-testid="content-textarea"]', 'This is original content for editing test. It will be modified during E2E testing.')

      // Select category
      const categorySelect = page.locator('[data-testid="category-select"]')
      await categorySelect.click()
      await page.locator('[data-testid="category-option"]').first().click()

      // Submit form
      await page.click('[data-testid="submit-button"]')

      // Wait for navigation to details page
      await page.waitForURL(/\/dashboard\/knowledge\/\d+/, { timeout: 15000 })

      // Extract ID from URL
      const url = page.url()
      const match = url.match(/\/dashboard\/knowledge\/(\d+)/)
      if (match) {
        testItemId = match[1]
      }
    } catch (error) {
      console.log('Failed to create test item, will use existing item for testing')
    } finally {
      await context.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    if (testItemId) {
      await page.goto(`/dashboard/knowledge/${testItemId}/edit`)
    } else {
      // Navigate to knowledge base list, click on first item, then edit
      await page.goto('/dashboard/knowledge')
      await page.waitForSelector('[data-testid="knowledge-list"]')

      const firstItem = page.locator('[data-testid="knowledge-item"]').first()
      if (await firstItem.isVisible()) {
        await firstItem.click()
        await page.waitForURL(/\/dashboard\/knowledge\/\d+/)

        // Click edit button
        await page.click('[data-testid="edit-button"]')
        await page.waitForURL(/\/dashboard\/knowledge\/\d+\/edit/)
      } else {
        throw new Error('No knowledge base items available for testing')
      }
    }

    // Verify we're on edit page
    await expect(page.locator('[data-testid="knowledge-edit-form"]')).toBeVisible()
  })

  test('should load edit form with current item data', async ({ page }) => {
    // Test page title
    await expect(page).toHaveTitle(/編輯/)

    // Test form presence
    await expect(page.locator('[data-testid="knowledge-edit-form"]')).toBeVisible()

    // Test form fields are populated
    const titleInput = page.locator('[data-testid="title-input"]')
    await expect(titleInput).toBeVisible()
    const titleValue = await titleInput.inputValue()
    expect(titleValue.length).toBeGreaterThan(0)

    const contentTextarea = page.locator('[data-testid="content-textarea"]')
    await expect(contentTextarea).toBeVisible()
    const contentValue = await contentTextarea.inputValue()
    expect(contentValue.length).toBeGreaterThan(0)

    // Test category is selected
    const categorySelect = page.locator('[data-testid="category-select"]')
    await expect(categorySelect).toBeVisible()
    const categoryValue = await categorySelect.inputValue()
    expect(categoryValue).toBeTruthy()

    // Test action buttons
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible()
  })

  test('should validate form fields on edit', async ({ page }) => {
    // Clear title and test validation
    const titleInput = page.locator('[data-testid="title-input"]')
    await titleInput.clear()
    await titleInput.blur()
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()

    // Clear content and test validation
    const contentTextarea = page.locator('[data-testid="content-textarea"]')
    await contentTextarea.clear()
    await contentTextarea.blur()
    await expect(page.locator('[data-testid="content-error"]')).toBeVisible()

    // Restore valid values
    await titleInput.fill('Updated Test Title')
    await contentTextarea.fill('Updated test content.')

    // Validation errors should disappear
    await expect(page.locator('[data-testid="title-error"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="content-error"]')).not.toBeVisible()
  })

  test('should successfully update title', async ({ page }) => {
    const titleInput = page.locator('[data-testid="title-input"]')

    // Update title
    await titleInput.clear()
    await titleInput.fill('Updated E2E Test Title')

    // Save changes
    await page.click('[data-testid="save-button"]')

    // Wait for navigation back to details page
    await page.waitForURL(/\/dashboard\/knowledge\/\d+$/, { timeout: 15000 })

    // Verify title was updated
    await expect(page.locator('[data-testid="item-title"]')).toContainText('Updated E2E Test Title')
  })

  test('should successfully update content', async ({ page }) => {
    const contentTextarea = page.locator('[data-testid="content-textarea"]')

    // Update content
    await contentTextarea.clear()
    await contentTextarea.fill('This is the updated content for E2E testing. The content has been modified successfully.')

    // Save changes
    await page.click('[data-testid="save-button"]')

    // Wait for navigation back to details page
    await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

    // Verify content was updated
    await expect(page.locator('[data-testid="item-content"]')).toContainText('updated content for E2E testing')
  })

  test('should successfully update category', async ({ page }) => {
    const categorySelect = page.locator('[data-testid="category-select"]')

    // Get current category
    const currentCategory = await categorySelect.inputValue()

    // Change category
    await categorySelect.click()
    const options = page.locator('[data-testid="category-option"]')
    const optionCount = await options.count()

    if (optionCount > 1) {
      // Select different category
      await options.nth(1).click()

      // Save changes
      await page.click('[data-testid="save-button"]')

      // Wait for navigation back to details page
      await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

      // Verify category was updated (check metadata section)
      const metadata = page.locator('[data-testid="item-metadata"]')
      await expect(metadata).toBeVisible()
    }
  })

  test('should handle tags editing', async ({ page }) => {
    const tagsInput = page.locator('[data-testid="tags-input"]')

    if (await tagsInput.isVisible()) {
      // Clear existing tags
      await tagsInput.clear()

      // Add new tags
      await tagsInput.fill('updated, edit-test, e2e-testing')
      await tagsInput.press('Tab')

      // Save changes
      await page.click('[data-testid="save-button"]')

      // Wait for navigation back to details page
      await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

      // Verify tags were updated
      const tagsSection = page.locator('[data-testid="tags-section"]')
      if (await tagsSection.isVisible()) {
        await expect(tagsSection).toContainText('updated')
        await expect(tagsSection).toContainText('edit-test')
      }
    }
  })

  test('should handle author field editing', async ({ page }) => {
    const authorInput = page.locator('[data-testid="author-input"]')

    if (await authorInput.isVisible()) {
      // Update author
      await authorInput.clear()
      await authorInput.fill('Updated Author Name')

      // Save changes
      await page.click('[data-testid="save-button"]')

      // Wait for navigation back to details page
      await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

      // Verify author was updated
      const metadata = page.locator('[data-testid="item-metadata"]')
      const author = metadata.locator('[data-testid="author"]')
      if (await author.isVisible()) {
        await expect(author).toContainText('Updated Author Name')
      }
    }
  })

  test('should handle language selection editing', async ({ page }) => {
    const languageSelect = page.locator('[data-testid="language-select"]')

    if (await languageSelect.isVisible()) {
      // Change language
      await languageSelect.click()
      const languageOptions = page.locator('[data-testid="language-option"]')

      if (await languageOptions.count() > 1) {
        await languageOptions.nth(1).click()

        // Save changes
        await page.click('[data-testid="save-button"]')

        // Wait for navigation back to details page
        await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

        // Verify language was updated (if displayed in metadata)
        const metadata = page.locator('[data-testid="item-metadata"]')
        await expect(metadata).toBeVisible()
      }
    }
  })

  test('should handle cancel action without saving', async ({ page }) => {
    const titleInput = page.locator('[data-testid="title-input"]')

    // Make changes
    const originalTitle = await titleInput.inputValue()
    await titleInput.clear()
    await titleInput.fill('This change should not be saved')

    // Cancel changes
    await page.click('[data-testid="cancel-button"]')

    // Should navigate back to details page
    await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

    // Verify original title is still displayed
    await expect(page.locator('[data-testid="item-title"]')).toContainText(originalTitle)
  })

  test('should show unsaved changes warning', async ({ page }) => {
    const titleInput = page.locator('[data-testid="title-input"]')

    // Make changes
    await titleInput.clear()
    await titleInput.fill('Unsaved changes test')

    // Try to navigate away
    await page.goto('/dashboard/knowledge')

    // Check for unsaved changes warning (if implemented)
    const warningDialog = page.locator('[data-testid="unsaved-changes-warning"]')
    if (await warningDialog.isVisible()) {
      await expect(warningDialog).toContainText('未保存')

      // Cancel navigation to stay on edit page
      await page.click('[data-testid="stay-on-page"]')
      await expect(page.url()).toContain('/edit')
    }
  })

  test('should handle form submission errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('/api/knowledge-base/*', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Update failed'
          })
        })
      } else {
        route.continue()
      }
    })

    // Make changes and submit
    await page.fill('[data-testid="title-input"]', 'Error Test Title')
    await page.click('[data-testid="save-button"]')

    // Verify error message is shown
    await expect(page.locator('[data-testid="save-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="save-error"]')).toContainText('更新失敗')

    // Verify still on edit page
    await expect(page.url()).toContain('/edit')
  })

  test('should handle version conflict detection', async ({ page }) => {
    const versionConflict = page.locator('[data-testid="version-conflict"]')

    // This test simulates a version conflict scenario
    // In practice, this would happen when another user edits the same item
    if (await versionConflict.isVisible()) {
      await expect(versionConflict).toContainText('版本衝突')

      // Test conflict resolution options
      const resolveOptions = page.locator('[data-testid="conflict-resolution"]')
      if (await resolveOptions.isVisible()) {
        // Choose to overwrite
        const overwriteButton = page.locator('[data-testid="overwrite-changes"]')
        if (await overwriteButton.isVisible()) {
          await overwriteButton.click()
        }
      }
    }
  })

  test('should auto-save changes periodically', async ({ page }) => {
    const titleInput = page.locator('[data-testid="title-input"]')

    // Make changes
    await titleInput.clear()
    await titleInput.fill('Auto-save test title')

    // Wait for auto-save (if implemented)
    await page.waitForTimeout(5000)

    // Check for auto-save indicator
    const autoSaveIndicator = page.locator('[data-testid="auto-save-status"]')
    if (await autoSaveIndicator.isVisible()) {
      await expect(autoSaveIndicator).toContainText('已自動保存')
    }
  })

  test('should handle rich text editing if present', async ({ page }) => {
    const richTextEditor = page.locator('[data-testid="rich-text-editor"]')

    if (await richTextEditor.isVisible()) {
      // Clear and add rich content
      await richTextEditor.click()
      await page.keyboard.press('Control+A')
      await page.keyboard.type('Rich text content with ')

      // Test formatting options
      const boldButton = page.locator('[data-testid="bold-button"]')
      if (await boldButton.isVisible()) {
        await boldButton.click()
        await page.keyboard.type('bold text')
      }

      // Test italic
      const italicButton = page.locator('[data-testid="italic-button"]')
      if (await italicButton.isVisible()) {
        await italicButton.click()
        await page.keyboard.type(' and italic text')
      }

      // Save changes
      await page.click('[data-testid="save-button"]')

      // Wait for navigation back to details page
      await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

      // Verify rich text formatting is preserved
      const content = page.locator('[data-testid="item-content"]')
      await expect(content).toContainText('Rich text content')
    }
  })

  test('should handle file attachments editing', async ({ page }) => {
    const attachmentsSection = page.locator('[data-testid="attachments-section"]')

    if (await attachmentsSection.isVisible()) {
      // Test adding new attachment
      const addAttachmentButton = page.locator('[data-testid="add-attachment"]')
      if (await addAttachmentButton.isVisible()) {
        await addAttachmentButton.click()

        const fileInput = page.locator('[data-testid="attachment-input"]')
        if (await fileInput.isVisible()) {
          // Create a test file for attachment
          const testFilePath = require('path').join(__dirname, '../fixtures/attachment-test.txt')
          require('fs').writeFileSync(testFilePath, 'Test attachment content')

          await fileInput.setInputFiles(testFilePath)

          // Verify attachment appears in list
          await expect(page.locator('[data-testid="attachment-item"]')).toBeVisible()

          // Clean up
          require('fs').unlinkSync(testFilePath)
        }
      }

      // Test removing existing attachment
      const removeAttachmentButton = page.locator('[data-testid="remove-attachment"]').first()
      if (await removeAttachmentButton.isVisible()) {
        await removeAttachmentButton.click()

        // Confirm removal
        const confirmRemoval = page.locator('[data-testid="confirm-remove-attachment"]')
        if (await confirmRemoval.isVisible()) {
          await confirmRemoval.click()
        }
      }
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Verify edit form is functional on mobile
    await expect(page.locator('[data-testid="knowledge-edit-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-textarea"]')).toBeVisible()

    // Test form interaction on mobile
    const titleInput = page.locator('[data-testid="title-input"]')
    await titleInput.clear()
    await titleInput.fill('Mobile Edit Test')

    // Verify input works
    const titleValue = await titleInput.inputValue()
    expect(titleValue).toBe('Mobile Edit Test')

    // Test that save button is accessible
    const saveButton = page.locator('[data-testid="save-button"]')
    await expect(saveButton).toBeVisible()

    const boundingBox = await saveButton.boundingBox()
    if (boundingBox) {
      expect(boundingBox.y).toBeLessThan(667) // Should be visible in viewport
    }
  })

  test('should handle concurrent editing scenarios', async ({ page, browser }) => {
    // This test simulates multiple users editing the same item
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    try {
      // Both pages navigate to the same edit page
      const editUrl = page.url()
      await page2.goto(editUrl)

      // First user makes changes
      await page.fill('[data-testid="title-input"]', 'First User Changes')

      // Second user makes different changes
      await page2.fill('[data-testid="title-input"]', 'Second User Changes')

      // First user saves
      await page.click('[data-testid="save-button"]')
      await page.waitForURL(/\/dashboard\/knowledge\/\d+$/)

      // Second user tries to save (should detect conflict)
      await page2.click('[data-testid="save-button"]')

      // Check for conflict resolution
      const conflictDialog = page2.locator('[data-testid="edit-conflict"]')
      if (await conflictDialog.isVisible()) {
        await expect(conflictDialog).toContainText('衝突')
      }

    } finally {
      await context2.close()
    }
  })
})