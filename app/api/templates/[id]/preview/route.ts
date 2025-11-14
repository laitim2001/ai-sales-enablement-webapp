/**
 * @fileoverview AI銷售賦能平台範本預覽API - 實現範本渲染預覽功能
 * @module app/api/templates/[id]/preview/route
 *
 * ## 功能說明
 * 提供範本渲染預覽功能,支援測試數據自動生成和變數驗證。
 *
 * ## API規格
 * - **端點**: `POST /api/templates/[id]/preview` - 預覽範本渲染結果
 * - **請求**: { data?: object, useTestData?: boolean }
 * - **響應**: { success, data: { html, testData, template }, message }
 * - **狀態碼**: 200 (成功) | 400 (驗證錯誤) | 404 (範本不存在) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 範本查詢 - 獲取指定ID的範本信息
 * - 變數驗證 - 驗證提供的數據是否符合範本變數要求
 * - 渲染預覽 - 生成範本的HTML渲染結果
 * - 測試數據 - 支援自動生成測試數據進行預覽
 *
 * ## 相關文件
 * - `/lib/template/template-manager.ts` - 範本管理邏輯
 * - `/lib/template/template-engine.ts` - 範本渲染引擎
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/template/template-manager';
import { templateEngine } from '@/lib/template/template-engine';

/**
 * POST /api/templates/[id]/preview
 * 預覽範本渲染結果
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 從認證中間件獲取用戶 ID
    const userId = 1;
    const templateId = params.id;

    // 獲取範本
    const template = await templateManager.getTemplateById(templateId, userId);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: '範本不存在',
        },
        { status: 404 }
      );
    }

    // 解析請求數據
    const body = await request.json().catch(() => ({}));
    const testData = body.data || {};
    const useTestData = body.useTestData !== false; // 預設使用測試數據

    // 驗證變數
    const validation = templateEngine.validateVariables(template.variables, testData);

    if (!validation.valid && !useTestData) {
      return NextResponse.json(
        {
          success: false,
          error: '變數驗證失敗',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 預覽範本
    const result = templateEngine.preview(
      template.content,
      template.variables,
      useTestData ? undefined : testData
    );

    return NextResponse.json({
      success: true,
      data: {
        html: result.html,
        testData: result.data,
        template: {
          id: template.id,
          name: template.name,
          category: template.category,
          variables: template.variables,
        },
      },
      message: '範本預覽成功',
    });
  } catch (error) {
    console.error('範本預覽失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '範本預覽失敗',
      },
      { status: 500 }
    );
  }
}
