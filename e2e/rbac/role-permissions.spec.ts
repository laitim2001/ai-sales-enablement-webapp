/**
 * ================================================================
 * 檔案名稱: RBAC角色權限E2E測試
 * 檔案用途: 測試不同角色的完整用戶旅程
 * 開發階段: 生產就緒
 * ================================================================
 *
 * Sprint 3 Week 7 Day 7 實施
 * 實施日期: 2025-10-07
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('RBAC Role-Based Permissions E2E', () => {
  test.describe('ADMIN Role Permissions', () => {
    test('ADMIN can access all system features', async ({ page }) => {
      // 登入為ADMIN
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');

      // 等待重定向到dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 驗證可以訪問客戶管理
      await page.goto(`${BASE_URL}/dashboard/customers`);
      await expect(page.locator('h1')).toContainText('客戶');

      // 驗證可以看到所有操作按鈕
      const createButton = page.locator('button:has-text("新增")');
      await expect(createButton).toBeVisible();

      // 驗證可以訪問提案管理
      await page.goto(`${BASE_URL}/dashboard/proposals`);
      await expect(page.locator('h1')).toContainText('提案');

      // 驗證可以訪問系統設置
      await page.goto(`${BASE_URL}/dashboard/settings`);
      // ADMIN應該能看到系統設置頁面
      expect(page.url()).toContain('/settings');
    });

    test('ADMIN can delete resources', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 前往客戶列表
      await page.goto(`${BASE_URL}/dashboard/customers`);

      // 查找刪除按鈕（應該存在）
      const deleteButton = page.locator('button[aria-label*="刪除"]').first();
      await expect(deleteButton).toBeVisible();
    });

    test('ADMIN can approve proposals', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 前往提案詳情
      await page.goto(`${BASE_URL}/dashboard/proposals/1`);

      // 審批按鈕應該可見
      const approveButton = page.locator('button:has-text("審批")');
      await expect(approveButton).toBeVisible();
    });
  });

  test.describe('SALES_MANAGER Role Permissions', () => {
    test('SALES_MANAGER can manage team resources', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'manager@test.com');
      await page.fill('input[name="password"]', 'manager123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 可以訪問客戶管理
      await page.goto(`${BASE_URL}/dashboard/customers`);
      await expect(page.locator('h1')).toContainText('客戶');

      // 可以看到創建按鈕
      const createButton = page.locator('button:has-text("新增")');
      await expect(createButton).toBeVisible();
    });

    test('SALES_MANAGER can approve proposals', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'manager@test.com');
      await page.fill('input[name="password"]', 'manager123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/proposals/1`);

      // 審批按鈕應該可見
      const approveButton = page.locator('button:has-text("審批")');
      await expect(approveButton).toBeVisible();
    });

    test('SALES_MANAGER cannot access system settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'manager@test.com');
      await page.fill('input[name="password"]', 'manager123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 嘗試訪問系統設置
      await page.goto(`${BASE_URL}/dashboard/settings`);

      // 應該被重定向或顯示權限錯誤
      await page.waitForTimeout(1000);
      const hasError = await page.locator('text=/權限|拒絕|access denied/i').isVisible();
      const isRedirected = page.url() !== `${BASE_URL}/dashboard/settings`;

      expect(hasError || isRedirected).toBe(true);
    });
  });

  test.describe('SALES_REP Role Permissions', () => {
    test('SALES_REP can create customers', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'rep@test.com');
      await page.fill('input[name="password"]', 'rep123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/customers`);

      // 應該可以看到新增按鈕
      const createButton = page.locator('button:has-text("新增")');
      await expect(createButton).toBeVisible();
    });

    test('SALES_REP cannot delete customers', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'rep@test.com');
      await page.fill('input[name="password"]', 'rep123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/customers`);

      // 刪除按鈕應該不可見或禁用
      const deleteButton = page.locator('button[aria-label*="刪除"]').first();
      const isVisible = await deleteButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(deleteButton).toBeDisabled();
      }
    });

    test('SALES_REP cannot approve proposals', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'rep@test.com');
      await page.fill('input[name="password"]', 'rep123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/proposals/1`);

      // 審批按鈕應該不可見
      const approveButton = page.locator('button:has-text("審批")');
      const isVisible = await approveButton.isVisible().catch(() => false);

      expect(isVisible).toBe(false);
    });

    test('SALES_REP can view knowledge base', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'rep@test.com');
      await page.fill('input[name="password"]', 'rep123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/knowledge`);

      // 應該能訪問知識庫
      await expect(page.locator('h1')).toContainText('知識');
    });
  });

  test.describe('MARKETING Role Permissions', () => {
    test('MARKETING can manage knowledge base', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'marketing@test.com');
      await page.fill('input[name="password"]', 'marketing123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/knowledge`);

      // 應該可以看到新增/編輯按鈕
      const createButton = page.locator('button:has-text("新增")');
      await expect(createButton).toBeVisible();
    });

    test('MARKETING cannot update customers', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'marketing@test.com');
      await page.fill('input[name="password"]', 'marketing123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/customers`);

      // 編輯按鈕應該不可見或禁用
      const editButton = page.locator('button[aria-label*="編輯"]').first();
      const isVisible = await editButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(editButton).toBeDisabled();
      }
    });

    test('MARKETING can view customers', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'marketing@test.com');
      await page.fill('input[name="password"]', 'marketing123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/customers`);

      // 應該能看到客戶列表
      await expect(page.locator('h1')).toContainText('客戶');
    });
  });

  test.describe('VIEWER Role Permissions', () => {
    test('VIEWER can only read resources', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'viewer@test.com');
      await page.fill('input[name="password"]', 'viewer123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 可以訪問客戶列表
      await page.goto(`${BASE_URL}/dashboard/customers`);
      await expect(page.locator('h1')).toContainText('客戶');

      // 但不應該看到任何操作按鈕
      const createButton = page.locator('button:has-text("新增")');
      const isVisible = await createButton.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('VIEWER cannot create or update any resources', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'viewer@test.com');
      await page.fill('input[name="password"]', 'viewer123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      await page.goto(`${BASE_URL}/dashboard/proposals`);

      // 不應該看到新增按鈕
      const createButton = page.locator('button:has-text("新增")');
      const isCreateVisible = await createButton.isVisible().catch(() => false);
      expect(isCreateVisible).toBe(false);

      // 不應該看到編輯按鈕
      const editButton = page.locator('button[aria-label*="編輯"]').first();
      const isEditVisible = await editButton.isVisible().catch(() => false);
      expect(isEditVisible).toBe(false);
    });

    test('VIEWER can view all readable resources', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'viewer@test.com');
      await page.fill('input[name="password"]', 'viewer123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 可以訪問多個頁面
      const readablePages = [
        '/dashboard/customers',
        '/dashboard/proposals',
        '/dashboard/knowledge',
      ];

      for (const path of readablePages) {
        await page.goto(`${BASE_URL}${path}`);
        await page.waitForTimeout(500);

        // 不應該看到錯誤訊息
        const hasError = await page.locator('text=/錯誤|error/i').isVisible();
        expect(hasError).toBe(false);
      }
    });
  });

  test.describe('Permission Denial Scenarios', () => {
    test('should show permission denied message for unauthorized actions', async ({
      page,
    }) => {
      // 登入為SALES_REP
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="email"]', 'rep@test.com');
      await page.fill('input[name="password"]', 'rep123');
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // 嘗試訪問受限頁面
      await page.goto(`${BASE_URL}/dashboard/settings`);

      // 應該看到權限錯誤或被重定向
      await page.waitForTimeout(1000);
      const hasPermissionError = await page
        .locator('text=/權限不足|拒絕訪問|permission denied/i')
        .isVisible();
      const isRedirected = !page.url().includes('/settings');

      expect(hasPermissionError || isRedirected).toBe(true);
    });

    test('should redirect to login when accessing protected routes without auth', async ({
      page,
    }) => {
      // 直接訪問受保護頁面
      await page.goto(`${BASE_URL}/dashboard/customers`);

      // 應該被重定向到登入頁
      await page.waitForURL(`${BASE_URL}/login`);
      expect(page.url()).toContain('/login');
    });
  });
});
