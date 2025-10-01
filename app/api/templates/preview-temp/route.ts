/**
 * 臨時範本預覽 API
 *
 * POST /api/templates/preview-temp - 預覽未保存的範本
 *
 * 用於範本創建頁面在保存前預覽範本效果
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateEngine } from '@/lib/template/template-engine';

/**
 * POST /api/templates/preview-temp
 * 預覽臨時範本（未保存到數據庫）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, variables, data, useTestData } = body;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: '範本內容不能為空',
        },
        { status: 400 }
      );
    }

    // 驗證變數（如果提供了數據）
    if (variables && data && !useTestData) {
      const validation = templateEngine.validateVariables(variables, data);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: '變數驗證失敗',
            errors: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    // 預覽範本
    const result = templateEngine.preview(
      content,
      variables || {},
      useTestData ? undefined : data
    );

    return NextResponse.json({
      success: true,
      data: {
        html: result.html,
        testData: result.data,
      },
      message: '範本預覽成功',
    });
  } catch (error) {
    console.error('臨時範本預覽失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '範本預覽失敗',
      },
      { status: 500 }
    );
  }
}
