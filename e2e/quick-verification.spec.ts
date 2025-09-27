import { test, expect, Page } from '@playwright/test';

/**
 * 快速驗證測試 - 檢查修復後的狀況
 */

test.describe('修復驗證測試', () => {

  test('檢查 Event handlers 錯誤是否已修復', async ({ page }) => {
    const consoleErrors: string[] = [];

    // 監聽控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 訪問首頁
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // 等待頁面完全載入
    await page.waitForTimeout(3000);

    // 檢查是否還有 Event handlers 錯誤
    const hasEventHandlerError = consoleErrors.some(error =>
      error.includes('Event handlers cannot be passed to Client Component props')
    );

    // 檢查是否還有水合錯誤
    const hasHydrationError = consoleErrors.some(error =>
      error.includes('whitespace text nodes cannot be a child of') ||
      error.includes('hydration') ||
      error.includes('Hydration')
    );

    // 輸出結果
    console.log('控制台錯誤數量:', consoleErrors.length);
    console.log('Event handlers 錯誤:', hasEventHandlerError ? '仍存在' : '已修復');
    console.log('水合錯誤:', hasHydrationError ? '仍存在' : '已修復');

    if (consoleErrors.length > 0) {
      console.log('剩餘錯誤:', consoleErrors.slice(0, 3));
    }

    // 驗證錯誤已修復
    expect(hasEventHandlerError).toBe(false);
    expect(hasHydrationError).toBe(false);

    // 檢查頁面基本功能
    const title = await page.title();
    console.log('頁面標題:', title);
    expect(title).toBe('AI 銷售賦能平台');

    // 檢查互動元素
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    console.log('按鈕數量:', buttons, '連結數量:', links);
    expect(buttons + links).toBeGreaterThan(0);
  });

});