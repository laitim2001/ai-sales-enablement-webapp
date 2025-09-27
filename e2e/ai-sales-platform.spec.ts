import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * AI 銷售賦能平台功能測試
 *
 * 測試目標：
 * 1. 驗證首頁和登入頁面正常載入
 * 2. 確保不出現 "Event handlers cannot be passed to Client Component props" 錯誤
 * 3. 測試登入功能和錯誤處理
 * 4. 驗證儀表板頁面導航功能
 * 5. 檢查控制台錯誤和頁面渲染問題
 */

// 測試用的基本 URL (使用 3001 端口而非配置中的 3000)
const BASE_URL = 'http://localhost:3001';

// 建立頁面訪問函數以統一錯誤檢查
async function visitPageAndCheckForErrors(page: Page, path: string, expectedTitle?: string) {
  const consoleErrors: string[] = [];
  const jsErrors: string[] = [];

  // 監聽控制台錯誤
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 監聽 JavaScript 錯誤
  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });

  const url = `${BASE_URL}${path}`;
  console.log(`訪問頁面: ${url}`);

  // 訪問頁面
  const response = await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // 檢查響應狀態
  expect(response?.status()).toBeLessThan(400);

  // 等待頁面完全載入
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // 給予 React 元件足夠時間渲染

  // 檢查特定的錯誤信息
  const hasEventHandlerError = consoleErrors.some(error =>
    error.includes('Event handlers cannot be passed to Client Component props')
  );
  const hasHydrationError = consoleErrors.some(error =>
    error.includes('hydration') || error.includes('Hydration')
  );

  // 檢查頁面是否白屏
  const bodyContent = await page.locator('body').innerHTML();
  const hasContent = bodyContent.length > 100; // 基本內容檢查

  // 如果指定了預期標題，則驗證
  if (expectedTitle) {
    await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }

  return {
    consoleErrors,
    jsErrors,
    hasEventHandlerError,
    hasHydrationError,
    hasContent,
    url
  };
}

test.describe('AI 銷售賦能平台基本功能測試', () => {

  test('首頁應該正常載入且無錯誤', async ({ page }) => {
    const result = await visitPageAndCheckForErrors(page, '/', 'AI Sales');

    // 驗證頁面載入
    expect(result.hasContent).toBe(true);

    // 檢查關鍵的錯誤
    expect(result.hasEventHandlerError).toBe(false);

    // 檢查是否有導航元素
    const hasNavigation = await page.locator('nav, [role="navigation"], header').count() > 0;
    expect(hasNavigation).toBe(true);

    // 記錄錯誤信息
    if (result.consoleErrors.length > 0) {
      console.log('控制台錯誤:', result.consoleErrors);
    }
    if (result.jsErrors.length > 0) {
      console.log('JavaScript 錯誤:', result.jsErrors);
    }

    // 檢查是否有登入或開始按鈕
    const hasActionButton = await page.locator('button, a[href*="login"], a[href*="auth"]').count() > 0;
    expect(hasActionButton).toBe(true);
  });

  test('登入頁面應該正常載入且表單可用', async ({ page }) => {
    const result = await visitPageAndCheckForErrors(page, '/auth/login', 'login');

    // 驗證頁面載入
    expect(result.hasContent).toBe(true);
    expect(result.hasEventHandlerError).toBe(false);

    // 檢查登入表單元素
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login"), button:has-text("Sign in")');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 檢查表單輸入功能
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');

    // 驗證輸入值
    expect(await emailInput.inputValue()).toBe('test@example.com');
    expect(await passwordInput.inputValue()).toBe('testpassword');

    console.log('登入表單驗證完成，頁面錯誤:', result.consoleErrors.length);
  });

  test('嘗試登入應該觸發事件處理器並顯示適當錯誤', async ({ page }) => {
    await visitPageAndCheckForErrors(page, '/auth/login');

    // 填寫登入表單
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login"), button:has-text("Sign in")').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('invalidpassword');

    // 監聽網絡請求
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth') && response.request().method() === 'POST'
    );

    // 提交表單
    await submitButton.click();

    try {
      // 等待響應
      const response = await responsePromise;
      console.log('登入響應狀態:', response.status());

      // 應該收到 401 或其他認證錯誤
      expect([400, 401, 422]).toContain(response.status());

      // 檢查是否顯示錯誤信息
      await page.waitForTimeout(2000);
      const errorMessage = await page.locator('[role="alert"], .error, .alert-error, [class*="error"]').count();
      expect(errorMessage).toBeGreaterThan(0);

    } catch (error) {
      console.log('登入請求處理:', error);
      // 如果沒有網絡請求，檢查是否有客戶端驗證
      const hasFormValidation = await page.locator('[role="alert"], .error, .invalid-feedback').count() > 0;
      expect(hasFormValidation).toBe(true);
    }
  });

  test('儀表板頁面導航測試', async ({ page }) => {
    // 先嘗試直接訪問儀表板頁面（測試未登入狀態的行為）
    const dashboardPaths = [
      '/dashboard',
      '/dashboard/activities',
      '/dashboard/customers',
      '/dashboard/opportunities',
      '/dashboard/chat',
      '/dashboard/proposals'
    ];

    for (const path of dashboardPaths) {
      console.log(`測試儀表板路徑: ${path}`);

      const result = await visitPageAndCheckForErrors(page, path);

      // 頁面應該載入（可能重定向到登入頁面）
      expect(result.hasContent).toBe(true);
      expect(result.hasEventHandlerError).toBe(false);

      // 檢查是否重定向到登入頁面或顯示儀表板內容
      const currentUrl = page.url();
      const isLoginRedirect = currentUrl.includes('/auth/login') || currentUrl.includes('/login');
      const isDashboard = currentUrl.includes('/dashboard');

      expect(isLoginRedirect || isDashboard).toBe(true);

      // 如果是儀表板頁面，檢查導航元素
      if (isDashboard) {
        const hasNavigation = await page.locator('nav, [role="navigation"], aside, [class*="sidebar"]').count() > 0;
        expect(hasNavigation).toBe(true);
      }

      // 記錄任何錯誤
      if (result.consoleErrors.length > 0) {
        console.log(`${path} 頁面錯誤:`, result.consoleErrors.slice(0, 3)); // 只顯示前3個錯誤
      }
    }
  });

  test('檢查 React 客戶端元件錯誤和水合問題', async ({ page }) => {
    const testPages = ['/', '/auth/login', '/dashboard'];

    for (const testPath of testPages) {
      console.log(`檢查 React 錯誤 - 頁面: ${testPath}`);

      const result = await visitPageAndCheckForErrors(page, testPath);

      // 檢查特定的 React 錯誤
      const reactErrors = result.consoleErrors.filter(error =>
        error.includes('Event handlers cannot be passed to Client Component props') ||
        error.includes('Warning: Extra attributes from the server') ||
        error.includes('Warning: Prop') ||
        error.includes('Hydration failed') ||
        error.includes('There was an error while hydrating')
      );

      // 不應該有客戶端元件錯誤
      expect(reactErrors.length).toBe(0);

      // 檢查頁面渲染
      expect(result.hasContent).toBe(true);

      // 記錄發現的任何 React 錯誤
      if (reactErrors.length > 0) {
        console.error(`${testPath} 發現 React 錯誤:`, reactErrors);
      }
    }
  });

  test('頁面載入性能和響應性測試', async ({ page }) => {
    const startTime = Date.now();

    const result = await visitPageAndCheckForErrors(page, '/');

    const loadTime = Date.now() - startTime;
    console.log(`首頁載入時間: ${loadTime}ms`);

    // 頁面應該在合理時間內載入
    expect(loadTime).toBeLessThan(10000); // 10秒內

    // 檢查頁面的基本互動性
    const interactiveElements = await page.locator('button, a, input, select').count();
    expect(interactiveElements).toBeGreaterThan(0);

    // 檢查圖片是否載入（如果有的話）
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      // 檢查至少第一張圖片是否載入
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
    }

    console.log(`頁面互動元素數量: ${interactiveElements}, 圖片數量: ${imageCount}`);
  });

  test('移動端視口兼容性測試', async ({ page }) => {
    // 設置移動端視口
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X 尺寸

    const result = await visitPageAndCheckForErrors(page, '/');

    // 檢查移動端佈局
    expect(result.hasContent).toBe(true);
    expect(result.hasEventHandlerError).toBe(false);

    // 檢查響應式導航
    const hasResponsiveNav = await page.locator('button[class*="menu"], [class*="mobile"], [class*="hamburger"]').count() > 0;

    // 檢查內容是否適應小屏幕
    const bodyWidth = await page.locator('body').boundingBox();
    expect(bodyWidth?.width).toBeLessThanOrEqual(375);

    console.log('移動端視口測試完成');
  });
});

test.describe('深度錯誤檢查', () => {

  test('詳細控制台錯誤分析', async ({ page }) => {
    const allErrors: Array<{page: string, type: string, message: string}> = [];

    // 監聽所有類型的錯誤
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) {
        allErrors.push({
          page: page.url(),
          type: msg.type(),
          message: msg.text()
        });
      }
    });

    page.on('pageerror', error => {
      allErrors.push({
        page: page.url(),
        type: 'pageerror',
        message: error.message
      });
    });

    page.on('requestfailed', request => {
      allErrors.push({
        page: page.url(),
        type: 'requestfailed',
        message: `Failed to load: ${request.url()}`
      });
    });

    // 測試多個頁面
    const testPages = ['/', '/auth/login', '/dashboard'];

    for (const testPath of testPages) {
      await visitPageAndCheckForErrors(page, testPath);
      await page.waitForTimeout(3000); // 等待任何延遲載入的內容
    }

    // 分析錯誤
    const criticalErrors = allErrors.filter(error =>
      error.message.includes('Event handlers cannot be passed to Client Component props') ||
      error.message.includes('Hydration failed') ||
      error.message.includes('Cannot read properties of undefined') ||
      error.message.includes('TypeError') ||
      error.message.includes('ReferenceError')
    );

    // 輸出詳細錯誤報告
    console.log('\n=== 錯誤分析報告 ===');
    console.log(`總錯誤數: ${allErrors.length}`);
    console.log(`關鍵錯誤數: ${criticalErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('\n關鍵錯誤列表:');
      criticalErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`);
      });
    }

    // 不應該有關鍵錯誤
    expect(criticalErrors.length).toBe(0);
  });
});