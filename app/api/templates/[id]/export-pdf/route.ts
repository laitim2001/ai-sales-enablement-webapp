/**
 * @fileoverview 範本 PDF 導出 API
端點: POST /api/templates/[id]/export-pdf
功能：
- 獲取範本內容
- 使用提供的變數值渲染範本
- 生成專業的 PDF 文檔
- 返回 PDF 文件供下載
請求體：
```json
{
  "variables": {
    "customerName": "ABC公司",
    "productName": "AI銷售平台"...
 * @module app/api/templates/[id]/export-pdf/route
 *
 * 範本 PDF 導出 API
 * 端點: POST /api/templates/[id]/export-pdf
 * 功能：
 * - 獲取範本內容
 * - 使用提供的變數值渲染範本
 * - 生成專業的 PDF 文檔
 * - 返回 PDF 文件供下載
 * 請求體：
 * ```json
 * {
 * "variables": {
 * "customerName": "ABC公司",
 * "productName": "AI銷售平台",
 * "price": "50000"
 * }
 * }
 * ```
 * 響應：PDF 文件流（application/pdf）
 * @module app/api/templates/[id]/export-pdf
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Handlebars from 'handlebars';
import { generatePDFFromHTML } from '@/lib/pdf/pdf-generator';
import { generateProposalHTML } from '@/lib/pdf/proposal-pdf-template';
import { registerHandlebarsHelpers } from '@/lib/template/handlebars-helpers';

/**
 * POST 處理器：生成並導出範本 PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    console.log(`📄 開始處理 PDF 導出請求 - 範本ID: ${params.id}`);

    // 1. 獲取範本數據
    const template = await prisma.proposalTemplate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        content: true,
        variables: true,
        category: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!template) {
      console.error(`❌ 範本未找到: ${params.id}`);
      return NextResponse.json(
        { error: '範本未找到' },
        { status: 404 }
      );
    }

    console.log(`✅ 範本已找到: ${template.name}`);

    // 2. 解析請求體獲取變數值
    const body = await request.json();
    const variables = body.variables || {};

    console.log(`📋 接收到 ${Object.keys(variables).length} 個變數值`);

    // 3. 註冊 Handlebars 輔助函數
    registerHandlebarsHelpers();

    // 4. 編譯並渲染範本
    console.log('🔄 開始渲染範本內容...');
    const templateCompiled = Handlebars.compile(template.content);
    const renderedContent = templateCompiled(variables);
    console.log(`✅ 範本內容已渲染 (${renderedContent.length} 字符)`);

    // 5. 構建 PDF 數據
    const pdfData = {
      title: template.name,
      customerName: variables.customerName || variables.customer_name || '',
      createdAt: new Date(),
      content: renderedContent,
      companyName: variables.companyName || variables.company_name || 'AI 銷售賦能平台',
      proposalNumber: `PROP-${template.id.slice(0, 8).toUpperCase()}`,
      author: template.creator
        ? `${template.creator.first_name} ${template.creator.last_name}`.trim()
        : '系統管理員',
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
    console.log(`✅ PDF 生成完成！總耗時: ${totalDuration}ms, 大小: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);

    // 8. 生成文件名（安全處理）
    const safeFileName = template.name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_') // 只保留字母、數字、中文、連字符和下劃線
      .substring(0, 50); // 限制長度
    const fileName = `${safeFileName}_${Date.now()}.pdf`;

    // 9. 返回 PDF 文件
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Generation-Time': `${totalDuration}ms`,
      },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ PDF 導出失敗 (耗時: ${totalDuration}ms):`, error);

    // 返回錯誤響應
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
