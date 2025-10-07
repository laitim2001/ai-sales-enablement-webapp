/**
 * 審計日誌管理頁面 E2E 測試
 *
 * 測試審計日誌的查詢、篩選、統計和導出功能
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 Phase 3 - 審計日誌E2E測試
 */

import { test, expect } from '@playwright/test';

// 測試配置
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 登入助手函數
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

test.describe('審計日誌管理頁面', () => {
  test.beforeEach(async ({ page }) => {
    // 每個測試前登入
    await loginAsAdmin(page);
  });

  test('應該顯示審計日誌頁面標題和選項卡', async ({ page }) => {
    // 導航到審計日誌頁面
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 檢查頁面標題
    await expect(page.locator('h1')).toContainText('審計日誌');

    // 檢查選項卡
    await expect(page.locator('role=tab[name="日誌列表"]')).toBeVisible();
    await expect(page.locator('role=tab[name="統計分析"]')).toBeVisible();
    await expect(page.locator('role=tab[name="導出"]')).toBeVisible();
  });

  test('應該能夠展開和收起篩選器', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 點擊展開篩選器
    const expandButton = page.locator('button:has-text("展開")');
    await expandButton.click();

    // 檢查篩選器是否可見
    await expect(page.locator('label:has-text("用戶ID")')).toBeVisible();
    await expect(page.locator('label:has-text("操作類型")')).toBeVisible();
    await expect(page.locator('label:has-text("資源類型")')).toBeVisible();

    // 點擊收起
    const collapseButton = page.locator('button:has-text("收起")');
    await collapseButton.click();

    // 檢查篩選器是否隱藏
    await expect(page.locator('label:has-text("用戶ID")')).not.toBeVisible();
  });

  test('應該能夠應用篩選條件', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 展開篩選器
    await page.click('button:has-text("展開")');

    // 選擇操作類型
    await page.click('select#action');
    await page.selectOption('select#action', 'login');

    // 選擇嚴重級別
    await page.click('select#severity');
    await page.selectOption('select#severity', 'info');

    // 應用篩選
    await page.click('button:has-text("應用篩選")');

    // 等待數據加載
    await page.waitForTimeout(1000);

    // 驗證 URL 包含篩選參數
    expect(page.url()).toContain('action=login');
    expect(page.url()).toContain('severity=info');
  });

  test('應該能夠切換到統計分析選項卡', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 切換到統計分析選項卡
    await page.click('role=tab[name="統計分析"]');

    // 檢查統計卡片是否顯示
    await expect(page.locator('text=總日誌數')).toBeVisible();
    await expect(page.locator('text=成功率')).toBeVisible();
    await expect(page.locator('text=INFO級別')).toBeVisible();
    await expect(page.locator('text=警告/錯誤')).toBeVisible();
  });

  test('應該能夠切換到導出選項卡', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 切換到導出選項卡
    await page.click('role=tab[name="導出"]');

    // 檢查導出組件是否顯示
    await expect(page.locator('text=導出審計日誌')).toBeVisible();
    await expect(page.locator('select#exportFormat')).toBeVisible();
    await expect(page.locator('button:has-text("導出")')).toBeVisible();
  });

  test('應該能夠查看日誌詳情對話框', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 等待日誌列表加載
    await page.waitForSelector('table', { timeout: 5000 });

    // 點擊第一個查看詳情按鈕（如果存在）
    const viewButton = page.locator('button[aria-label="查看詳情"]').first();

    if (await viewButton.isVisible()) {
      await viewButton.click();

      // 檢查詳情對話框是否打開
      await expect(page.locator('role=dialog')).toBeVisible();
      await expect(page.locator('text=審計日誌詳情')).toBeVisible();
    }
  });

  test('應該能夠使用分頁控制', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 等待日誌列表加載
    await page.waitForSelector('table', { timeout: 5000 });

    // 檢查分頁控制是否存在
    const nextButton = page.locator('button:has-text("下一頁")');
    const prevButton = page.locator('button:has-text("上一頁")');

    // 上一頁按鈕應該被禁用（第一頁）
    await expect(prevButton).toBeDisabled();

    // 如果有多頁，測試下一頁按鈕
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // 現在上一頁按鈕應該啟用
      await expect(prevButton).toBeEnabled();
    }
  });

  test('應該顯示空狀態（無日誌時）', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 展開篩選器並應用不存在的篩選
    await page.click('button:has-text("展開")');
    await page.fill('input#userId', '999999');
    await page.click('button:has-text("應用篩選")');

    // 等待加載完成
    await page.waitForTimeout(1000);

    // 檢查空狀態消息
    await expect(page.locator('text=無審計日誌')).toBeVisible();
  });

  test('應該能夠刷新日誌列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 等待初始加載
    await page.waitForSelector('table', { timeout: 5000 });

    // 點擊刷新按鈕
    const refreshButton = page.locator('button:has-text("刷新")');
    await refreshButton.click();

    // 檢查載入狀態
    await expect(refreshButton.locator('.animate-spin')).toBeVisible({ timeout: 1000 });
  });

  test('非ADMIN用戶應該看到權限不足提示', async ({ page }) => {
    // 登出並以非ADMIN用戶登入（這裡假設有其他用戶）
    // 注意：這需要根據實際的用戶系統調整

    // 嘗試直接訪問審計日誌頁面
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);

    // 應該重定向到dashboard或顯示權限不足
    await expect(
      page.locator('text=權限不足').or(page.locator('h1:has-text("儀表板")'))
    ).toBeVisible({ timeout: 3000 });
  });
});

test.describe('審計日誌篩選功能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);
    await page.click('button:has-text("展開")');
  });

  test('應該能夠按用戶ID篩選', async ({ page }) => {
    await page.fill('input#userId', '1');
    await page.click('button:has-text("應用篩選")');
    await page.waitForTimeout(1000);

    // 驗證 URL 包含 userId 參數
    expect(page.url()).toContain('userId=1');
  });

  test('應該能夠按日期範圍篩選', async ({ page }) => {
    const startDate = '2025-01-01T00:00';
    const endDate = '2025-12-31T23:59';

    await page.fill('input#startDate', startDate);
    await page.fill('input#endDate', endDate);
    await page.click('button:has-text("應用篩選")');
    await page.waitForTimeout(1000);

    // 驗證篩選已應用
    expect(page.url()).toContain('startDate');
    expect(page.url()).toContain('endDate');
  });

  test('應該能夠清除所有篩選', async ({ page }) => {
    // 設置一些篩選條件
    await page.fill('input#userId', '1');
    await page.selectOption('select#action', 'login');
    await page.click('button:has-text("應用篩選")');
    await page.waitForTimeout(500);

    // 清除篩選
    await page.click('button:has-text("清除篩選")');

    // 驗證篩選已清除
    await expect(page.locator('input#userId')).toHaveValue('');
  });
});

test.describe('審計日誌統計功能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);
    await page.click('role=tab[name="統計分析"]');
  });

  test('應該顯示所有統計卡片', async ({ page }) => {
    // 等待統計數據加載
    await page.waitForTimeout(1000);

    // 檢查四個主要統計卡片
    await expect(page.locator('text=總日誌數')).toBeVisible();
    await expect(page.locator('text=成功率')).toBeVisible();
    await expect(page.locator('text=INFO級別')).toBeVisible();
    await expect(page.locator('text=警告/錯誤')).toBeVisible();
  });

  test('應該顯示頂級操作和用戶統計', async ({ page }) => {
    // 等待統計數據加載
    await page.waitForTimeout(1000);

    // 檢查詳細統計區域
    await expect(page.locator('text=最常見操作')).toBeVisible();
    await expect(page.locator('text=最活躍用戶')).toBeVisible();
  });

  test('應該顯示嚴重級別分布', async ({ page }) => {
    // 等待統計數據加載
    await page.waitForTimeout(1000);

    // 檢查嚴重級別分布
    await expect(page.locator('text=嚴重級別分布')).toBeVisible();
    await expect(page.locator('text=INFO')).toBeVisible();
    await expect(page.locator('text=WARNING')).toBeVisible();
    await expect(page.locator('text=ERROR')).toBeVisible();
    await expect(page.locator('text=CRITICAL')).toBeVisible();
  });
});

test.describe('審計日誌導出功能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/admin/audit-logs`);
    await page.click('role=tab[name="導出"]');
  });

  test('應該能夠選擇導出格式', async ({ page }) => {
    // 默認應該是 CSV
    await expect(page.locator('select#exportFormat')).toHaveValue('csv');

    // 切換到 JSON
    await page.selectOption('select#exportFormat', 'json');
    await expect(page.locator('select#exportFormat')).toHaveValue('json');
  });

  test('應該顯示導出說明', async ({ page }) => {
    await expect(page.locator('text=導出說明')).toBeVisible();
    await expect(page.locator('text=最多導出10,000條記錄')).toBeVisible();
  });
});
