/**
 * 範本預覽 API
 *
 * POST /api/templates/[id]/preview - 預覽範本渲染結果
 *
 * @author Claude Code
 * @date 2025-10-02
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
