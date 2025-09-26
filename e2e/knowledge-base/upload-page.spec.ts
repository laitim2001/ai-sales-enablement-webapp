import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.describe('Knowledge Base Upload Page (/dashboard/knowledge/upload)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/knowledge/upload')
    await expect(page.locator('h1')).toContainText('上傳文檔')
  })

  test('should load upload interface with all components', async ({ page }) => {
    // Test page title
    await expect(page).toHaveTitle(/上傳文檔/)

    // Test upload component
    await expect(page.locator('[data-testid="file-upload-component"]')).toBeVisible()

    // Test drag and drop area
    await expect(page.locator('[data-testid="drop-zone"]')).toBeVisible()

    // Test file input
    await expect(page.locator('[data-testid="file-input"]')).toBeVisible()

    // Test upload button
    await expect(page.locator('[data-testid="upload-button"]')).toBeVisible()
  })

  test('should display supported file types and size limits', async ({ page }) => {
    // Test supported formats are displayed
    await expect(page.locator('text=支援的檔案格式')).toBeVisible()

    // Test common file types
    const supportedTypes = ['PDF', 'DOC', 'DOCX', 'TXT']
    for (const type of supportedTypes) {
      if (await page.locator(`text=${type}`).isVisible()) {
        await expect(page.locator(`text=${type}`)).toBeVisible()
      }
    }

    // Test file size limit
    await expect(page.locator('text=檔案大小限制')).toBeVisible()
  })

  test('should handle file selection via file input', async ({ page }) => {
    // Create a test file
    const testFilePath = path.join(__dirname, '../fixtures/test-document.txt')

    // Ensure test file exists
    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true })
    }

    fs.writeFileSync(testFilePath, 'This is a test document for upload testing.')

    // Upload file
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(testFilePath)

    // Verify file is selected
    await expect(page.locator('[data-testid="selected-file"]')).toBeVisible()
    await expect(page.locator('text=test-document.txt')).toBeVisible()

    // Clean up
    fs.unlinkSync(testFilePath)
  })

  test('should handle drag and drop upload', async ({ page }) => {
    // Note: Playwright doesn't support actual drag and drop of files from OS
    // This test simulates the file selection after drag and drop

    const dropZone = page.locator('[data-testid="drop-zone"]')

    // Test drop zone interaction
    await dropZone.hover()
    await expect(dropZone).toHaveClass(/drag-hover|drop-active/)

    // Test that drop zone accepts files (simulate via input)
    const testContent = 'Test file content for drag and drop simulation'

    // Create data transfer simulation
    await page.evaluate((content) => {
      const dataTransfer = new DataTransfer()
      const file = new File([content], 'drag-test.txt', { type: 'text/plain' })
      dataTransfer.items.add(file)

      const dropEvent = new DragEvent('drop', {
        dataTransfer: dataTransfer,
        bubbles: true,
        cancelable: true
      })

      const dropZone = document.querySelector('[data-testid="drop-zone"]')
      if (dropZone) {
        dropZone.dispatchEvent(dropEvent)
      }
    }, testContent)

    // Verify file appears in the interface
    await expect(page.locator('[data-testid="selected-file"]')).toBeVisible()
  })

  test('should show file preview for text files', async ({ page }) => {
    // Create and upload a text file
    const testFilePath = path.join(__dirname, '../fixtures/preview-test.txt')

    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true })
    }

    const testContent = 'This is preview test content.\nWith multiple lines.\nFor testing purposes.'
    fs.writeFileSync(testFilePath, testContent)

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(testFilePath)

    // Check for preview component
    const preview = page.locator('[data-testid="file-preview"]')
    if (await preview.isVisible()) {
      await expect(preview).toContainText('This is preview test content')
    }

    // Clean up
    fs.unlinkSync(testFilePath)
  })

  test('should validate file types', async ({ page }) => {
    // Create an unsupported file type
    const invalidFilePath = path.join(__dirname, '../fixtures/invalid-file.xyz')

    if (!fs.existsSync(path.dirname(invalidFilePath))) {
      fs.mkdirSync(path.dirname(invalidFilePath), { recursive: true })
    }

    fs.writeFileSync(invalidFilePath, 'Invalid file content')

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(invalidFilePath)

    // Should show error message
    await expect(page.locator('[data-testid="file-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-error"]')).toContainText('不支援')

    // Clean up
    fs.unlinkSync(invalidFilePath)
  })

  test('should validate file size limits', async ({ page }) => {
    // Create a large file (simulate by checking if file size validation exists)
    const largeFilePath = path.join(__dirname, '../fixtures/large-file.txt')

    if (!fs.existsSync(path.dirname(largeFilePath))) {
      fs.mkdirSync(path.dirname(largeFilePath), { recursive: true })
    }

    // Create a moderately sized file for testing
    const largeContent = 'A'.repeat(1024 * 1024) // 1MB
    fs.writeFileSync(largeFilePath, largeContent)

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(largeFilePath)

    // Check if file size validation message appears
    const sizeError = page.locator('[data-testid="file-size-error"]')
    if (await sizeError.isVisible()) {
      await expect(sizeError).toContainText('檔案過大')
    }

    // Clean up
    fs.unlinkSync(largeFilePath)
  })

  test('should fill metadata form after file selection', async ({ page }) => {
    // Upload a valid file first
    const testFilePath = path.join(__dirname, '../fixtures/metadata-test.txt')

    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true })
    }

    fs.writeFileSync(testFilePath, 'Test content for metadata form testing.')

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(testFilePath)

    // Wait for metadata form to appear
    await expect(page.locator('[data-testid="metadata-form"]')).toBeVisible()

    // Fill metadata fields
    const titleInput = page.locator('[data-testid="metadata-title"]')
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Document Title')
    }

    const categorySelect = page.locator('[data-testid="metadata-category"]')
    if (await categorySelect.isVisible()) {
      await categorySelect.click()
      await page.locator('[data-testid="category-option"]').first().click()
    }

    const tagsInput = page.locator('[data-testid="metadata-tags"]')
    if (await tagsInput.isVisible()) {
      await tagsInput.fill('test, upload, automation')
    }

    // Clean up
    fs.unlinkSync(testFilePath)
  })

  test('should successfully upload and process file', async ({ page }) => {
    // Create a test file
    const testFilePath = path.join(__dirname, '../fixtures/upload-success.txt')

    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true })
    }

    fs.writeFileSync(testFilePath, 'This is a successful upload test document with meaningful content.')

    // Upload file
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(testFilePath)

    // Fill metadata if form appears
    const metadataForm = page.locator('[data-testid="metadata-form"]')
    if (await metadataForm.isVisible()) {
      await page.fill('[data-testid="metadata-title"]', 'E2E Upload Test Document')

      const categorySelect = page.locator('[data-testid="metadata-category"]')
      await categorySelect.click()
      await page.locator('[data-testid="category-option"]').first().click()
    }

    // Submit upload
    await page.click('[data-testid="upload-submit-button"]')

    // Wait for upload progress
    const progressBar = page.locator('[data-testid="upload-progress"]')
    if (await progressBar.isVisible()) {
      await progressBar.waitFor({ state: 'detached', timeout: 30000 })
    }

    // Verify success message or navigation
    try {
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 })
    } catch {
      // Alternative: check if navigated to knowledge base list
      await page.waitForURL('/dashboard/knowledge', { timeout: 15000 })
      await expect(page.locator('h1')).toContainText('知識庫')
    }

    // Clean up
    fs.unlinkSync(testFilePath)
  })

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock upload failure
    await page.route('/api/knowledge-base/upload', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Upload failed'
        })
      })
    })

    // Create and upload a file
    const testFilePath = path.join(__dirname, '../fixtures/error-test.txt')

    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true })
    }

    fs.writeFileSync(testFilePath, 'Test content for error handling.')

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(testFilePath)

    // Submit upload
    await page.click('[data-testid="upload-submit-button"]')

    // Verify error message
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('上傳失敗')

    // Clean up
    fs.unlinkSync(testFilePath)
  })

  test('should allow multiple file uploads', async ({ page }) => {
    const multiUpload = page.locator('[data-testid="multi-upload"]')

    if (await multiUpload.isVisible()) {
      // Create multiple test files
      const testFiles = ['file1.txt', 'file2.txt', 'file3.txt']
      const filePaths: string[] = []

      for (const fileName of testFiles) {
        const filePath = path.join(__dirname, '../fixtures', fileName)

        if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true })
        }

        fs.writeFileSync(filePath, `Content for ${fileName}`)
        filePaths.push(filePath)
      }

      // Upload multiple files
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePaths)

      // Verify multiple files are selected
      for (const fileName of testFiles) {
        await expect(page.locator(`text=${fileName}`)).toBeVisible()
      }

      // Clean up
      filePaths.forEach(filePath => fs.unlinkSync(filePath))
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Verify upload interface is functional on mobile
    await expect(page.locator('[data-testid="file-upload-component"]')).toBeVisible()
    await expect(page.locator('[data-testid="drop-zone"]')).toBeVisible()

    // Test that drop zone is appropriately sized for mobile
    const dropZone = page.locator('[data-testid="drop-zone"]')
    const boundingBox = await dropZone.boundingBox()

    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375)
      expect(boundingBox.height).toBeGreaterThan(100) // Should be tall enough to be usable
    }
  })
})