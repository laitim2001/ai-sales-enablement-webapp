/**
 * @fileoverview PDF Generator Service
功能：使用 Puppeteer 將 HTML 內容轉換為 PDF
核心功能：
- HTML 到 PDF 轉換
- 自定義頁面設置（A4、邊距、頁眉頁腳）
- 高質量渲染
- 錯誤處理和資源管理
使用範例：
```typescript
const pdfBuffer = await generatePDFFromHTML(htmlContent, {
  ...
 * @module lib/pdf/pdf-generator
 *
 * PDF Generator Service
 * 功能：使用 Puppeteer 將 HTML 內容轉換為 PDF
 * 核心功能：
 * - HTML 到 PDF 轉換
 * - 自定義頁面設置（A4、邊距、頁眉頁腳）
 * - 高質量渲染
 * - 錯誤處理和資源管理
 * 使用範例：
 * ```typescript
 * const pdfBuffer = await generatePDFFromHTML(htmlContent, {
 * format: 'A4',
 * margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
 * });
 * ```
 * @module lib/pdf/pdf-generator
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import puppeteer, { Browser, PDFOptions } from 'puppeteer';

/**
 * PDF 生成選項接口
 */
export interface PDFGenerationOptions {
  /** 頁面格式（默認 A4） */
  format?: 'A4' | 'Letter' | 'Legal';
  /** 頁面方向（默認 portrait） */
  landscape?: boolean;
  /** 頁面邊距 */
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** 是否顯示頁眉頁腳 */
  displayHeaderFooter?: boolean;
  /** 頁眉 HTML */
  headerTemplate?: string;
  /** 頁腳 HTML */
  footerTemplate?: string;
  /** 是否顯示背景圖形 */
  printBackground?: boolean;
  /** 頁面範圍（例如：'1-5, 8, 11-13'） */
  pageRanges?: string;
  /** 頁面縮放比例（默認 1） */
  scale?: number;
}

/**
 * 瀏覽器實例管理
 * 使用單例模式減少啟動開銷
 */
let browserInstance: Browser | null = null;

/**
 * 獲取或創建瀏覽器實例
 *
 * @returns Puppeteer Browser 實例
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🚀 啟動 Puppeteer 瀏覽器實例...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    console.log('✅ Puppeteer 瀏覽器實例已啟動');
  }
  return browserInstance;
}

/**
 * 關閉瀏覽器實例
 * 應該在應用程序關閉時調用
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    console.log('🛑 關閉 Puppeteer 瀏覽器實例...');
    await browserInstance.close();
    browserInstance = null;
    console.log('✅ Puppeteer 瀏覽器實例已關閉');
  }
}

/**
 * 從 HTML 內容生成 PDF
 *
 * @param htmlContent - HTML 字符串
 * @param options - PDF 生成選項
 * @returns PDF Buffer
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const startTime = Date.now();
  let page;

  try {
    // 獲取瀏覽器實例
    const browser = await getBrowser();

    // 創建新頁面
    page = await browser.newPage();
    console.log('📄 創建新頁面...');

    // 設置視口大小（A4 紙張大小）
    await page.setViewport({
      width: 794, // A4 寬度 (px at 96 DPI)
      height: 1123, // A4 高度 (px at 96 DPI)
      deviceScaleFactor: 2, // 高清渲染
    });

    // 加載 HTML 內容
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000, // 30秒超時
    });
    console.log('✅ HTML 內容已加載');

    // 構建 PDF 選項
    const pdfOptions: PDFOptions = {
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: '1cm',
        right: '1.5cm',
        bottom: '1cm',
        left: '1.5cm',
      },
      printBackground: options.printBackground !== false, // 默認顯示背景
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      scale: options.scale || 1,
    };

    if (options.pageRanges) {
      pdfOptions.pageRanges = options.pageRanges;
    }

    // 生成 PDF
    console.log('🔄 正在生成 PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);

    const duration = Date.now() - startTime;
    console.log(`✅ PDF 生成成功！耗時: ${duration}ms, 大小: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);

    return Buffer.from(pdfBuffer);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ PDF 生成失敗 (耗時: ${duration}ms):`, error);
    throw new Error(`PDF 生成失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  } finally {
    // 關閉頁面釋放資源
    if (page) {
      await page.close();
      console.log('🗑️ 頁面已關閉');
    }
  }
}

/**
 * 從 URL 生成 PDF
 *
 * @param url - 網頁 URL
 * @param options - PDF 生成選項
 * @returns PDF Buffer
 */
export async function generatePDFFromURL(
  url: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const startTime = Date.now();
  let page;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    console.log(`📄 正在訪問 URL: ${url}`);

    // 訪問頁面
    await page.goto(url, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    });
    console.log('✅ 頁面已加載');

    // 構建 PDF 選項
    const pdfOptions: PDFOptions = {
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: '1cm',
        right: '1.5cm',
        bottom: '1cm',
        left: '1.5cm',
      },
      printBackground: options.printBackground !== false,
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      scale: options.scale || 1,
    };

    if (options.pageRanges) {
      pdfOptions.pageRanges = options.pageRanges;
    }

    // 生成 PDF
    console.log('🔄 正在生成 PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);

    const duration = Date.now() - startTime;
    console.log(`✅ PDF 生成成功！耗時: ${duration}ms, 大小: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);

    return Buffer.from(pdfBuffer);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ PDF 生成失敗 (耗時: ${duration}ms):`, error);
    throw new Error(`PDF 生成失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  } finally {
    if (page) {
      await page.close();
      console.log('🗑️ 頁面已關閉');
    }
  }
}

/**
 * 預設的頁腳模板（包含頁碼）
 */
export const DEFAULT_FOOTER_TEMPLATE = `
  <div style="width: 100%; font-size: 9px; padding: 5px; text-align: center; color: #666;">
    <span class="pageNumber"></span> / <span class="totalPages"></span>
  </div>
`;

/**
 * 預設的頁眉模板（包含標題）
 */
export const DEFAULT_HEADER_TEMPLATE = `
  <div style="width: 100%; font-size: 10px; padding: 5px 10px; text-align: center; color: #333; border-bottom: 1px solid #eee;">
    <span class="title"></span>
  </div>
`;
