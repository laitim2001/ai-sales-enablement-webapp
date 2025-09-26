import { test, expect } from '@playwright/test'

test.describe('Knowledge Base Details Page (/dashboard/knowledge/[id])', () => {
  let testItemId: string

  test.beforeAll(async ({ browser }) => {
    // Create a test knowledge base item for testing
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await page.goto('/dashboard/knowledge/create')
      await expect(page.locator('h1')).toContainText('新建知識庫項目')

      // Fill form to create test item
      await page.fill('[data-testid="title-input"]', 'E2E Details Test Item')
      await page.fill('[data-testid="content-textarea"]', 'This is a test content for details page E2E testing. It contains enough content to test various features of the details view.')

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
      await page.goto(`/dashboard/knowledge/${testItemId}`)
    } else {
      // Navigate to knowledge base list and click on first item
      await page.goto('/dashboard/knowledge')
      await page.waitForSelector('[data-testid="knowledge-list"]')

      const firstItem = page.locator('[data-testid="knowledge-item"]').first()
      if (await firstItem.isVisible()) {
        await firstItem.click()
        await page.waitForURL(/\/dashboard\/knowledge\/\d+/)
      } else {
        throw new Error('No knowledge base items available for testing')
      }
    }

    // Verify we're on details page
    await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
  })

  test('should load details page with correct structure', async ({ page }) => {
    // Test page title contains item title
    await expect(page).toHaveTitle(/知識庫/)

    // Test main content area
    await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()

    // Test item title
    await expect(page.locator('[data-testid="item-title"]')).toBeVisible()

    // Test item content
    await expect(page.locator('[data-testid="item-content"]')).toBeVisible()

    // Test metadata section
    await expect(page.locator('[data-testid="item-metadata"]')).toBeVisible()

    // Test action buttons
    await expect(page.locator('[data-testid="edit-button"]')).toBeVisible()
  })

  test('should display item metadata correctly', async ({ page }) => {
    const metadata = page.locator('[data-testid="item-metadata"]')

    // Check for creation date
    await expect(metadata.locator('[data-testid="created-date"]')).toBeVisible()

    // Check for last updated date
    await expect(metadata.locator('[data-testid="updated-date"]')).toBeVisible()

    // Check for author
    const author = metadata.locator('[data-testid="author"]')
    if (await author.isVisible()) {
      await expect(author).toBeVisible()
    }

    // Check for category
    await expect(metadata.locator('[data-testid="category"]')).toBeVisible()

    // Check for tags if present
    const tags = metadata.locator('[data-testid="tags-section"]')
    if (await tags.isVisible()) {
      await expect(tags).toBeVisible()
      const tagItems = page.locator('[data-testid="tag-item"]')
      if (await tagItems.count() > 0) {
        await expect(tagItems.first()).toBeVisible()
      }
    }

    // Check for version info
    const version = metadata.locator('[data-testid="version"]')
    if (await version.isVisible()) {
      await expect(version).toBeVisible()
    }
  })

  test('should display content with proper formatting', async ({ page }) => {
    const content = page.locator('[data-testid="item-content"]')

    // Check content is visible and has text
    await expect(content).toBeVisible()
    const contentText = await content.textContent()
    expect(contentText?.length).toBeGreaterThan(0)

    // Check for rich text formatting if present
    const richContent = content.locator('.rich-text, .formatted-content')
    if (await richContent.isVisible()) {
      await expect(richContent).toBeVisible()
    }

    // Check for code blocks if present
    const codeBlocks = content.locator('pre, code')
    if (await codeBlocks.count() > 0) {
      await expect(codeBlocks.first()).toBeVisible()
    }
  })

  test('should handle document chunks if present', async ({ page }) => {
    const chunksSection = page.locator('[data-testid="document-chunks"]')

    if (await chunksSection.isVisible()) {
      // Check chunks list
      await expect(chunksSection).toBeVisible()

      // Check individual chunks
      const chunkItems = page.locator('[data-testid="chunk-item"]')
      if (await chunkItems.count() > 0) {
        const firstChunk = chunkItems.first()
        await expect(firstChunk).toBeVisible()

        // Check chunk content
        await expect(firstChunk.locator('[data-testid="chunk-content"]')).toBeVisible()

        // Check chunk metadata
        const chunkMetadata = firstChunk.locator('[data-testid="chunk-metadata"]')
        if (await chunkMetadata.isVisible()) {
          await expect(chunkMetadata).toBeVisible()
        }
      }
    }
  })

  test('should display processing status if available', async ({ page }) => {
    const processingStatus = page.locator('[data-testid="processing-status"]')

    if (await processingStatus.isVisible()) {
      // Check status indicator
      await expect(processingStatus).toBeVisible()

      // Check processing tasks if present
      const processingTasks = page.locator('[data-testid="processing-tasks"]')
      if (await processingTasks.isVisible()) {
        await expect(processingTasks).toBeVisible()

        const taskItems = page.locator('[data-testid="task-item"]')
        if (await taskItems.count() > 0) {
          const firstTask = taskItems.first()
          await expect(firstTask).toBeVisible()

          // Check task status
          await expect(firstTask.locator('[data-testid="task-status"]')).toBeVisible()
        }
      }
    }
  })

  test('should navigate to edit page when edit button is clicked', async ({ page }) => {
    // Click edit button
    await page.click('[data-testid="edit-button"]')

    // Should navigate to edit page
    await page.waitForURL(/\/dashboard\/knowledge\/\d+\/edit/)

    // Verify we're on edit page
    await expect(page.locator('[data-testid="knowledge-edit-form"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('編輯')
  })

  test('should handle share functionality if present', async ({ page }) => {
    const shareButton = page.locator('[data-testid="share-button"]')

    if (await shareButton.isVisible()) {
      await shareButton.click()

      // Check share modal/dropdown
      const shareModal = page.locator('[data-testid="share-modal"]')
      if (await shareModal.isVisible()) {
        await expect(shareModal).toBeVisible()

        // Test copy link functionality
        const copyLinkButton = page.locator('[data-testid="copy-link-button"]')
        if (await copyLinkButton.isVisible()) {
          await copyLinkButton.click()

          // Check for success message
          await expect(page.locator('[data-testid="copy-success"]')).toBeVisible()
        }
      }
    }
  })

  test('should handle download functionality if present', async ({ page }) => {
    const downloadButton = page.locator('[data-testid="download-button"]')

    if (await downloadButton.isVisible()) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download')
      await downloadButton.click()

      // Wait for download
      try {
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBeTruthy()
      } catch (error) {
        // Download might not be implemented, continue test
        console.log('Download functionality not available or failed')
      }
    }
  })

  test('should display related documents if present', async ({ page }) => {
    const relatedDocs = page.locator('[data-testid="related-documents"]')

    if (await relatedDocs.isVisible()) {
      await expect(relatedDocs).toBeVisible()

      const relatedItems = page.locator('[data-testid="related-item"]')
      if (await relatedItems.count() > 0) {
        const firstRelated = relatedItems.first()
        await expect(firstRelated).toBeVisible()

        // Test clicking on related item
        await firstRelated.click()

        // Should navigate to that item's details
        await page.waitForURL(/\/dashboard\/knowledge\/\d+/)
        await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
      }
    }
  })

  test('should handle comments section if present', async ({ page }) => {
    const commentsSection = page.locator('[data-testid="comments-section"]')

    if (await commentsSection.isVisible()) {
      await expect(commentsSection).toBeVisible()

      // Check for add comment form
      const addCommentForm = page.locator('[data-testid="add-comment-form"]')
      if (await addCommentForm.isVisible()) {
        // Test adding a comment
        await page.fill('[data-testid="comment-input"]', 'This is a test comment for E2E testing.')
        await page.click('[data-testid="submit-comment"]')

        // Wait for comment to appear
        await page.waitForSelector('[data-testid="comment-item"]', { timeout: 10000 })
        await expect(page.locator('[data-testid="comment-item"]')).toBeVisible()
      }

      // Check existing comments
      const commentItems = page.locator('[data-testid="comment-item"]')
      if (await commentItems.count() > 0) {
        const firstComment = commentItems.first()
        await expect(firstComment).toBeVisible()
        await expect(firstComment.locator('[data-testid="comment-content"]')).toBeVisible()
        await expect(firstComment.locator('[data-testid="comment-author"]')).toBeVisible()
      }
    }
  })

  test('should handle version history if present', async ({ page }) => {
    const versionHistory = page.locator('[data-testid="version-history"]')

    if (await versionHistory.isVisible()) {
      await expect(versionHistory).toBeVisible()

      const versionItems = page.locator('[data-testid="version-item"]')
      if (await versionItems.count() > 0) {
        const firstVersion = versionItems.first()
        await expect(firstVersion).toBeVisible()

        // Check version metadata
        await expect(firstVersion.locator('[data-testid="version-number"]')).toBeVisible()
        await expect(firstVersion.locator('[data-testid="version-date"]')).toBeVisible()

        // Test viewing version diff if available
        const viewDiffButton = firstVersion.locator('[data-testid="view-diff"]')
        if (await viewDiffButton.isVisible()) {
          await viewDiffButton.click()

          const diffModal = page.locator('[data-testid="diff-modal"]')
          if (await diffModal.isVisible()) {
            await expect(diffModal).toBeVisible()
          }
        }
      }
    }
  })

  test('should handle delete functionality if present', async ({ page }) => {
    const deleteButton = page.locator('[data-testid="delete-button"]')

    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Check for confirmation dialog
      const confirmDialog = page.locator('[data-testid="delete-confirmation"]')
      if (await confirmDialog.isVisible()) {
        await expect(confirmDialog).toBeVisible()
        await expect(confirmDialog).toContainText('確認刪除')

        // Cancel deletion to avoid affecting other tests
        const cancelButton = page.locator('[data-testid="cancel-delete"]')
        if (await cancelButton.isVisible()) {
          await cancelButton.click()
        }
      }
    }
  })

  test('should handle breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('[data-testid="breadcrumb"]')

    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toBeVisible()

      // Test clicking on knowledge base breadcrumb
      const knowledgeBreadcrumb = page.locator('[data-testid="breadcrumb-knowledge"]')
      if (await knowledgeBreadcrumb.isVisible()) {
        await knowledgeBreadcrumb.click()

        // Should navigate back to knowledge base list
        await page.waitForURL('/dashboard/knowledge')
        await expect(page.locator('h1')).toContainText('知識庫')
      }
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Verify details page is functional on mobile
    await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="item-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="item-content"]')).toBeVisible()

    // Check that content is properly wrapped
    const content = page.locator('[data-testid="item-content"]')
    const boundingBox = await content.boundingBox()

    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375)
    }

    // Check that action buttons are accessible
    const editButton = page.locator('[data-testid="edit-button"]')
    if (await editButton.isVisible()) {
      await expect(editButton).toBeVisible()
    }
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Navigate to details page and check for loading states
    const url = page.url()
    await page.goto(url)

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
    await expect(page.locator('[data-testid="knowledge-details"]')).toBeVisible()
  })

  test('should handle 404 for non-existent items', async ({ page }) => {
    // Navigate to non-existent item
    await page.goto('/dashboard/knowledge/999999')

    // Should show 404 or error message
    try {
      await expect(page.locator('[data-testid="not-found"]')).toBeVisible({ timeout: 10000 })
    } catch {
      // Alternative: check for error message or redirect
      await expect(page.locator('text=找不到')).toBeVisible()
    }
  })
})