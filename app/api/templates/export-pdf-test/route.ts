/**
 * @fileoverview 範本測試 PDF 導出 API
端點: POST /api/templates/export-pdf-test
功能：
- 不需要保存範本即可生成 PDF（用於創建頁面的實時預覽）
- 接收範本內容和變數值
- 生成 PDF 供下載
請求體：
```json
{
  "name": "測試提案",
  "content": "# {{title}}\n\n客戶：{{customerName}}",...
 * @module app/api/templates/export-pdf-test/route
 *
 * 範本測試 PDF 導出 API
 * 端點: POST /api/templates/export-pdf-test
 * 功能：
 * - 不需要保存範本即可生成 PDF（用於創建頁面的實時預覽）
 * - 接收範本內容和變數值
 * - 生成 PDF 供下載
 * 請求體：
 * ```json
 * {
 * "name": "測試提案",
 * "content": "# {{title}}\n\n客戶：{{customerName}}",
 * "variables": {
 * "title": "產品提案",
 * "customerName": "ABC公司"
 * }
 * }
 * ```
 * 響應：PDF 文件流（application/pdf）
 * @module app/api/templates/export-pdf-test
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import Handlebars from 'handlebars';
import { generatePDFFromHTML } from '@/lib/pdf/pdf-generator';
import { generateProposalHTML } from '@/lib/pdf/proposal-pdf-template';
import { registerHandlebarsHelpers } from '@/lib/template/handlebars-helpers';

/**
 * POST 處理器：生成測試 PDF
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('📄 開始處理測試 PDF 導出請求...');

    // 1. 解析請求體
    const body = await request.json();
    const { name, content, variables } = body;

    // 2. 驗證必需字段
    if (!name || !content) {
      return NextResponse.json(
        { error: '缺少必需字段: name 和 content' },
        { status: 400 }
      );
    }

    console.log(`📋 範本名稱: ${name}`);
    console.log(`📋 範本內容長度: ${content.length} 字符`);
    console.log(`📋 變數數量: ${Object.keys(variables || {}).length}`);

    // 3. 註冊 Handlebars 輔助函數
    registerHandlebarsHelpers();

    // 4. 編譯並渲染範本
    console.log('🔄 開始渲染範本內容...');
    const templateCompiled = Handlebars.compile(content);
    const renderedContent = templateCompiled(variables || {});
    console.log(`✅ 範本內容已渲染 (${renderedContent.length} 字符)`);

    // 5. 構建 PDF 數據
    const pdfData = {
      title: name,
      customerName: variables?.customerName || variables?.customer_name || '',
      createdAt: new Date(),
      content: renderedContent,
      companyName: variables?.companyName || variables?.company_name || 'AI 銷售賦能平台',
      proposalNumber: `TEST-${Date.now().toString(36).toUpperCase()}`,
      author: '測試用戶',
    };

    // 6. 生成 HTML
    console.log('📝 生成 PDF HTML...');
    const htmlContent = generateProposalHTML(pdfData);

    // 7. 生成 PDF
    console.log('🔄 開始生成 PDF...');
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1.5cm',
        bottom: '1cm',
        left: '1.5cm',
      },
    });

    const totalDuration = Date.now() - startTime;
    console.log(`✅ 測試 PDF 生成完成！總耗時: ${totalDuration}ms, 大小: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);

    // 8. 生成文件名
    const safeFileName = name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_')
      .substring(0, 50);
    const fileName = `${safeFileName}_test_${Date.now()}.pdf`;

    // 9. 返回 PDF 文件
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Generation-Time': `${totalDuration}ms`,
        'X-Test-Mode': 'true',
      },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ 測試 PDF 導出失敗 (耗時: ${totalDuration}ms):`, error);

    return NextResponse.json(
      {
        error: 'PDF 生成失敗',
        message: error instanceof Error ? error.message : '未知錯誤',
        duration: `${totalDuration}ms`,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 處理器：CORS 預檢
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
