/**
 * 提案 PDF 範本測試套件
 *
 * 測試範圍：
 * - PDF HTML 範本生成
 * - 數據注入和渲染
 * - 樣式和格式驗證
 * - XSS 防護測試
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import {
  generateProposalHTML,
  generateSimplePDFHTML,
  ProposalPDFData,
} from '@/lib/pdf/proposal-pdf-template';

describe('Proposal PDF Template', () => {
  describe('generateProposalHTML', () => {
    it('應該能生成基本的提案 HTML', () => {
      const data: ProposalPDFData = {
        title: '產品銷售提案',
        customerName: 'ABC 公司',
        createdAt: new Date('2025-10-02'),
        content: '<h1>提案內容</h1><p>這是提案的詳細內容。</p>',
        companyName: 'AI 銷售賦能平台',
        proposalNumber: 'PROP-001',
        author: '張三',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('產品銷售提案');
      expect(html).toContain('ABC 公司');
      expect(html).toContain('PROP-001');
      expect(html).toContain('張三');
    });

    it('應該包含封面頁', () => {
      const data: ProposalPDFData = {
        title: '測試提案',
        customerName: '測試公司',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('cover-page');
      expect(html).toContain('cover-title');
      expect(html).toContain('page-break-after');
    });

    it('應該包含內容頁', () => {
      const data: ProposalPDFData = {
        title: '測試提案',
        customerName: '測試公司',
        createdAt: new Date(),
        content: '<h1>第一章</h1><p>章節內容</p>',
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('content-page');
      expect(html).toContain('proposal-content');
      expect(html).toContain('第一章');
      expect(html).toContain('章節內容');
    });

    it('應該包含完整的 CSS 樣式', () => {
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      // 驗證關鍵 CSS 類存在
      expect(html).toContain('font-family');
      expect(html).toContain('background');
      expect(html).toContain('margin');
      expect(html).toContain('padding');
      expect(html).toContain('color');
    });

    it('應該正確格式化日期', () => {
      const testDate = new Date('2025-10-02');
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: testDate,
        content: '<p>內容</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('2025');
      expect(html).toContain('10');
      expect(html).toContain('02');
    });

    it('應該處理長標題', () => {
      const longTitle = 'A'.repeat(200);
      const data: ProposalPDFData = {
        title: longTitle,
        customerName: '測試公司',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain(longTitle);
    });

    it('應該處理空內容', () => {
      const data: ProposalPDFData = {
        title: '測試提案',
        customerName: '測試公司',
        createdAt: new Date(),
        content: '',
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('測試提案');
    });

    it('應該處理複雜的 Markdown 內容', () => {
      const data: ProposalPDFData = {
        title: '測試提案',
        customerName: '測試公司',
        createdAt: new Date(),
        content: `
          <h1>第一章：概述</h1>
          <p>這是一段文字</p>
          <h2>1.1 子章節</h2>
          <ul>
            <li>項目 1</li>
            <li>項目 2</li>
            <li>項目 3</li>
          </ul>
          <table>
            <tr>
              <th>產品</th>
              <th>價格</th>
            </tr>
            <tr>
              <td>產品 A</td>
              <td>$1000</td>
            </tr>
          </table>
          <blockquote>這是引用文字</blockquote>
          <pre><code>console.log('Hello');</code></pre>
        `,
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('<h1>');
      expect(html).toContain('<h2>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<table>');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<pre>');
    });
  });

  describe('XSS 防護測試', () => {
    it('應該轉義 HTML 特殊字符', () => {
      const data: ProposalPDFData = {
        title: '<script>alert("XSS")</script>',
        customerName: '<img src=x onerror=alert(1)>',
        createdAt: new Date(),
        content: '<p>正常內容</p>',
        companyName: 'Test<>Corp',
        proposalNumber: 'TEST&001',
        author: 'Test"User',
      };

      const html = generateProposalHTML(data);

      // 封面和標題應該被轉義
      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).toContain('&lt;script&gt;');

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img');

      expect(html).toContain('&lt;&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;');
    });

    it('應該允許內容中的安全 HTML', () => {
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: new Date(),
        content: '<h1>安全的標題</h1><p>安全的段落</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      // 內容區域應該保留 HTML（因為是受信任的渲染內容）
      expect(html).toContain('<h1>安全的標題</h1>');
      expect(html).toContain('<p>安全的段落</p>');
    });

    it('應該處理特殊 Unicode 字符', () => {
      const data: ProposalPDFData = {
        title: '測試 🚀 提案',
        customerName: '測試公司 ©',
        createdAt: new Date(),
        content: '<p>包含 emoji 😀 和符號 ™</p>',
        companyName: 'Test Corp ®',
        proposalNumber: 'TEST-001',
        author: '張三 ✓',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('🚀');
      expect(html).toContain('©');
      expect(html).toContain('😀');
      expect(html).toContain('™');
      expect(html).toContain('®');
      expect(html).toContain('✓');
    });
  });

  describe('generateSimplePDFHTML', () => {
    it('應該能生成簡單的 PDF HTML', () => {
      const title = '簡單文檔';
      const content = '<h1>標題</h1><p>內容</p>';

      const html = generateSimplePDFHTML(title, content);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(title);
      expect(html).toContain(content);
    });

    it('應該包含基本樣式', () => {
      const html = generateSimplePDFHTML('Test', '<p>Content</p>');

      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
      expect(html).toContain('</style>');
    });

    it('應該轉義特殊字符', () => {
      const title = 'Test & <Script>';
      const html = generateSimplePDFHTML(title, '<p>Normal</p>');

      expect(html).not.toContain('<Script>');
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
    });
  });

  describe('樣式驗證', () => {
    it('應該包含漸變背景樣式', () => {
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('linear-gradient');
      expect(html).toContain('#667eea');
      expect(html).toContain('#764ba2');
    });

    it('應該包含響應式設計樣式', () => {
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('max-width');
      expect(html).toContain('margin');
      expect(html).toContain('padding');
    });

    it('應該包含打印優化樣式', () => {
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('page-break');
      expect(html).toMatch(/break-(before|after|inside)/);
    });
  });

  describe('中文支持', () => {
    it('應該正確處理中文字符', () => {
      const data: ProposalPDFData = {
        title: '產品銷售提案書',
        customerName: '北京科技有限公司',
        createdAt: new Date(),
        content: '<h1>第一章：公司介紹</h1><p>我們是一家專業的軟件開發公司。</p>',
        companyName: '深圳創新科技',
        proposalNumber: 'PROP-2025-001',
        author: '李明',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('產品銷售提案書');
      expect(html).toContain('北京科技有限公司');
      expect(html).toContain('第一章：公司介紹');
      expect(html).toContain('深圳創新科技');
      expect(html).toContain('李明');
    });

    it('應該包含 UTF-8 meta 標籤', () => {
      const data: ProposalPDFData = {
        title: '測試',
        customerName: '測試',
        createdAt: new Date(),
        content: '<p>內容</p>',
        companyName: 'Test',
        proposalNumber: 'TEST',
        author: 'Test',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain('charset="UTF-8"');
    });
  });

  describe('性能測試', () => {
    it('應該快速生成 HTML', () => {
      const data: ProposalPDFData = {
        title: '性能測試提案',
        customerName: '測試公司',
        createdAt: new Date(),
        content: '<p>內容</p>'.repeat(100),
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const start = Date.now();
      const html = generateProposalHTML(data);
      const duration = Date.now() - start;

      console.log(`HTML generation time: ${duration}ms`);

      expect(html).toBeDefined();
      expect(duration).toBeLessThan(100); // 應該在 100ms 內完成
    });

    it('應該處理大量內容', () => {
      const largeContent = '<p>測試內容段落。</p>'.repeat(1000);
      const data: ProposalPDFData = {
        title: '大型提案',
        customerName: '測試公司',
        createdAt: new Date(),
        content: largeContent,
        companyName: 'Test Corp',
        proposalNumber: 'TEST-001',
        author: 'Tester',
      };

      const html = generateProposalHTML(data);

      expect(html).toContain(largeContent);
      expect(html.length).toBeGreaterThan(100000);
    });
  });
});
