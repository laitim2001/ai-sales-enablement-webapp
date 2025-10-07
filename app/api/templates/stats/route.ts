/**
 * @fileoverview 範本統計 APIGET /api/templates/stats - 獲取範本統計信息@author Claude Code@date 2025-10-02
 * @module app/api/templates/stats/route
 * @description
 * 範本統計 APIGET /api/templates/stats - 獲取範本統計信息@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/template/template-manager';

/**
 * GET /api/templates/stats
 * 獲取範本統計信息
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: 從認證中間件獲取用戶 ID
    const userId = 1;

    const stats = await templateManager.getTemplateStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
      message: '獲取範本統計成功',
    });
  } catch (error) {
    console.error('獲取範本統計失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取範本統計失敗',
      },
      { status: 500 }
    );
  }
}
