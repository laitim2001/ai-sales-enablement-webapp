/**
 * @fileoverview Proposal PDF Template Renderer功能：將提案數據渲染為專業的 HTML，用於 PDF 生成核心功能：- 提案 HTML 模板生成- 專業樣式設計- Handlebars 內容整合- 多語言支持（中文/英文）@module lib/pdf/proposal-pdf-template
 * @module lib/pdf/proposal-pdf-template
 * @description
 * Proposal PDF Template Renderer功能：將提案數據渲染為專業的 HTML，用於 PDF 生成核心功能：- 提案 HTML 模板生成- 專業樣式設計- Handlebars 內容整合- 多語言支持（中文/英文）@module lib/pdf/proposal-pdf-template
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

export interface ProposalPDFData {
  /** 提案標題 */
  title: string;
  /** 客戶名稱 */
  customerName?: string;
  /** 創建日期 */
  createdAt: Date;
  /** 提案內容（已渲染的 HTML） */
  content: string;
  /** 公司名稱 */
  companyName?: string;
  /** 公司Logo URL */
  companyLogo?: string;
  /** 提案編號 */
  proposalNumber?: string;
  /** 作者 */
  author?: string;
  /** 其他元數據 */
  metadata?: Record<string, any>;
}

/**
 * 生成提案 PDF HTML
 *
 * @param data - 提案數據
 * @returns 完整的 HTML 字符串
 */
export function generateProposalHTML(data: ProposalPDFData): string {
  const formattedDate = new Date(data.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(data.title)}</title>
  <style>
    /* ===== 全局樣式 ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    /* ===== 封面頁 ===== */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      page-break-after: always;
    }

    .company-logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 2rem;
    }

    .cover-title {
      font-size: 36pt;
      font-weight: bold;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .cover-subtitle {
      font-size: 14pt;
      margin-bottom: 3rem;
      opacity: 0.9;
    }

    .cover-metadata {
      font-size: 12pt;
      opacity: 0.85;
    }

    .cover-metadata-item {
      margin: 0.5rem 0;
    }

    /* ===== 內容頁 ===== */
    .content-page {
      padding: 2cm 0;
      max-width: 100%;
    }

    /* ===== 頁眉樣式 ===== */
    .page-header {
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
      margin-bottom: 2rem;
    }

    .page-header-title {
      font-size: 14pt;
      color: #667eea;
      font-weight: bold;
    }

    .page-header-info {
      font-size: 9pt;
      color: #666;
      margin-top: 0.25rem;
    }

    /* ===== 內容區域樣式 ===== */
    .proposal-content {
      font-size: 11pt;
      line-height: 1.8;
    }

    .proposal-content h1 {
      font-size: 20pt;
      color: #667eea;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
      page-break-after: avoid;
    }

    .proposal-content h2 {
      font-size: 16pt;
      color: #764ba2;
      margin: 1.5rem 0 1rem;
      page-break-after: avoid;
    }

    .proposal-content h3 {
      font-size: 13pt;
      color: #555;
      margin: 1rem 0 0.75rem;
      page-break-after: avoid;
    }

    .proposal-content p {
      margin: 0.75rem 0;
      text-align: justify;
      page-break-inside: avoid;
    }

    .proposal-content ul,
    .proposal-content ol {
      margin: 0.75rem 0 0.75rem 1.5rem;
      page-break-inside: avoid;
    }

    .proposal-content li {
      margin: 0.5rem 0;
    }

    .proposal-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .proposal-content th,
    .proposal-content td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }

    .proposal-content th {
      background-color: #667eea;
      color: #fff;
      font-weight: bold;
    }

    .proposal-content tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    .proposal-content blockquote {
      border-left: 4px solid #667eea;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #555;
      font-style: italic;
      background-color: #f5f7ff;
      padding: 1rem;
    }

    .proposal-content code {
      background-color: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }

    .proposal-content pre {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .proposal-content pre code {
      background: none;
      padding: 0;
    }

    /* ===== 強調元素 ===== */
    .proposal-content strong {
      color: #667eea;
      font-weight: bold;
    }

    .proposal-content em {
      color: #764ba2;
      font-style: italic;
    }

    /* ===== 分頁控制 ===== */
    .page-break {
      page-break-after: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* ===== 頁腳樣式 ===== */
    .page-footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }

    /* ===== 打印優化 ===== */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }

    /* ===== 響應式調整 ===== */
    @page {
      margin: 1cm 1.5cm;
    }
  </style>
</head>
<body>
  <!-- 封面頁 -->
  <div class="cover-page">
    ${data.companyLogo ? `<img src="${escapeHTML(data.companyLogo)}" alt="Company Logo" class="company-logo" />` : ''}
    <h1 class="cover-title">${escapeHTML(data.title)}</h1>
    ${data.customerName ? `<p class="cover-subtitle">為 ${escapeHTML(data.customerName)} 準備</p>` : ''}
    <div class="cover-metadata">
      ${data.proposalNumber ? `<div class="cover-metadata-item">提案編號: ${escapeHTML(data.proposalNumber)}</div>` : ''}
      <div class="cover-metadata-item">日期: ${formattedDate}</div>
      ${data.author ? `<div class="cover-metadata-item">撰寫者: ${escapeHTML(data.author)}</div>` : ''}
      ${data.companyName ? `<div class="cover-metadata-item">${escapeHTML(data.companyName)}</div>` : ''}
    </div>
  </div>

  <!-- 內容頁 -->
  <div class="content-page">
    <!-- 頁眉 -->
    <div class="page-header">
      <div class="page-header-title">${escapeHTML(data.title)}</div>
      <div class="page-header-info">
        ${data.customerName ? `客戶: ${escapeHTML(data.customerName)} | ` : ''}
        日期: ${formattedDate}
        ${data.proposalNumber ? ` | 編號: ${escapeHTML(data.proposalNumber)}` : ''}
      </div>
    </div>

    <!-- 提案內容 -->
    <div class="proposal-content">
      ${data.content}
    </div>

    <!-- 頁腳 -->
    <div class="page-footer">
      ${data.companyName ? `${escapeHTML(data.companyName)} | ` : ''}
      生成日期: ${new Date().toLocaleDateString('zh-TW')}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * HTML 轉義函數（防止 XSS）
 *
 * @param text - 需要轉義的文本
 * @returns 轉義後的文本
 */
function escapeHTML(text: string): string {
  const div = { textContent: text } as any;
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

/**
 * 生成簡單的文本 PDF（用於測試）
 *
 * @param title - 標題
 * @param content - 內容
 * @returns HTML 字符串
 */
export function generateSimplePDFHTML(title: string, content: string): string {
  return generateProposalHTML({
    title,
    content,
    createdAt: new Date(),
  });
}
