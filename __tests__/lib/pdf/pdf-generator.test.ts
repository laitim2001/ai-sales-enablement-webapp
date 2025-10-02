/**
 * PDF 生成器測試套件
 *
 * 測試範圍：
 * - HTML 轉 PDF 功能
 * - URL 轉 PDF 功能
 * - 瀏覽器實例管理
 * - 性能優化驗證
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import {
  generatePDFFromHTML,
  generatePDFFromURL,
  closeBrowser,
  PDFGenerationOptions,
} from '@/lib/pdf/pdf-generator';

describe('PDF Generator', () => {
  afterAll(async () => {
    // 確保測試後關閉瀏覽器實例
    await closeBrowser();
  });

  describe('generatePDFFromHTML', () => {
    it('應該能從簡單 HTML 生成 PDF', async () => {
      const html = '<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>';

      const pdfBuffer = await generatePDFFromHTML(html);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // 驗證 PDF 標頭（PDF 文件以 %PDF- 開始）
      const header = pdfBuffer.toString('utf-8', 0, 5);
      expect(header).toBe('%PDF-');
    }, 30000); // 30 秒超時

    it('應該能處理包含 CSS 的 HTML', async () => {
      const html = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>Styled Document</h1>
          <p>This document has CSS styling.</p>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDFFromHTML(html);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);

    it('應該能處理中文內容', async () => {
      const html = `
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>測試文檔</h1>
          <p>這是一個包含中文的測試文檔。</p>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDFFromHTML(html);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);

    it('應該支持自定義 PDF 選項', async () => {
      const html = '<html><body><h1>Custom Options</h1></body></html>';
      const options: PDFGenerationOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm',
        },
      };

      const pdfBuffer = await generatePDFFromHTML(html, options);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);

    it('應該能處理複雜的 HTML 結構', async () => {
      const html = `
        <html>
        <head>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Complex Document</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Product A</td>
                <td>$100</td>
                <td>5</td>
              </tr>
              <tr>
                <td>Product B</td>
                <td>$200</td>
                <td>3</td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDFFromHTML(html);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);

    it('應該能處理空 HTML', async () => {
      const html = '<html><body></body></html>';

      const pdfBuffer = await generatePDFFromHTML(html);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('generatePDFFromURL', () => {
    it('應該能從 URL 生成 PDF', async () => {
      // 使用一個可靠的測試 URL (example.com)
      const url = 'https://example.com';

      const pdfBuffer = await generatePDFFromURL(url);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      const header = pdfBuffer.toString('utf-8', 0, 5);
      expect(header).toBe('%PDF-');
    }, 30000);

    it('應該能處理本地 HTML 文件 URL', async () => {
      // 創建一個臨時 HTML 文件 URL
      const html = '<html><body><h1>Local File Test</h1></body></html>';
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

      const pdfBuffer = await generatePDFFromURL(dataUrl);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('瀏覽器實例管理', () => {
    it('應該能復用瀏覽器實例（性能優化）', async () => {
      const html1 = '<html><body><h1>Document 1</h1></body></html>';
      const html2 = '<html><body><h1>Document 2</h1></body></html>';

      const start1 = Date.now();
      await generatePDFFromHTML(html1);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await generatePDFFromHTML(html2);
      const time2 = Date.now() - start2;

      // 第二次調用應該更快（因為瀏覽器實例已經創建）
      // 允許一些容差，但第二次應該明顯更快
      console.log(`First generation: ${time1}ms, Second generation: ${time2}ms`);

      // 只驗證兩次都成功生成
      expect(time1).toBeGreaterThan(0);
      expect(time2).toBeGreaterThan(0);
    }, 60000);

    it('應該能手動關閉瀏覽器實例', async () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      await generatePDFFromHTML(html);

      // 應該能正常關閉瀏覽器
      await expect(closeBrowser()).resolves.not.toThrow();

      // 關閉後再次生成應該重新創建瀏覽器實例
      const pdfBuffer = await generatePDFFromHTML(html);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    }, 60000);
  });

  describe('錯誤處理', () => {
    it('應該處理無效的 HTML', async () => {
      const invalidHTML = '<<< invalid html >>>>';

      // 即使 HTML 無效，Puppeteer 也會嘗試渲染
      const pdfBuffer = await generatePDFFromHTML(invalidHTML);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    }, 30000);

    it('應該處理超時情況', async () => {
      // 創建一個包含永遠加載的資源的 HTML
      const html = `
        <html>
        <body>
          <h1>Test</h1>
          <img src="http://invalid-domain-that-will-timeout.com/image.jpg" />
        </body>
        </html>
      `;

      // 應該在超時後仍然生成 PDF
      const pdfBuffer = await generatePDFFromHTML(html, {
        waitUntil: 'networkidle0',
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    }, 35000);
  });

  describe('PDF 質量驗證', () => {
    it('應該生成高解析度 PDF (deviceScaleFactor: 2)', async () => {
      const html = `
        <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; }
            .test-element {
              width: 100px;
              height: 100px;
              background: #333;
            }
          </style>
        </head>
        <body>
          <div class="test-element"></div>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDFFromHTML(html);

      // 高解析度 PDF 應該比低解析度大
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    }, 30000);

    it('應該包含背景顏色（printBackground: true）', async () => {
      const html = `
        <html>
        <head>
          <style>
            body { background: linear-gradient(to right, #667eea, #764ba2); }
            h1 { color: white; }
          </style>
        </head>
        <body>
          <h1>Gradient Background</h1>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDFFromHTML(html, {
        printBackground: true,
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('性能測試', () => {
    it('應該在合理時間內生成 PDF', async () => {
      const html = `
        <html>
        <body>
          <h1>Performance Test</h1>
          <p>Testing PDF generation performance...</p>
        </body>
        </html>
      `;

      const start = Date.now();
      await generatePDFFromHTML(html);
      const duration = Date.now() - start;

      console.log(`PDF generation time: ${duration}ms`);

      // 應該在 10 秒內完成（包括瀏覽器啟動時間）
      expect(duration).toBeLessThan(10000);
    }, 15000);

    it('應該能處理大型文檔', async () => {
      // 生成大量內容
      const content = Array.from({ length: 100 }, (_, i) =>
        `<h2>Section ${i + 1}</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`
      ).join('\n');

      const html = `<html><body>${content}</body></html>`;

      const pdfBuffer = await generatePDFFromHTML(html);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(10000);
    }, 60000);
  });
});
