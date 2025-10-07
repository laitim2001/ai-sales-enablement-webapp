/**
 * @fileoverview 範本複製 APIPOST /api/templates/[id]/duplicate - 複製範本@author Claude Code@date 2025-10-02
 * @module app/api/templates/[id]/duplicate/route
 * @description
 * 範本複製 APIPOST /api/templates/[id]/duplicate - 複製範本@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/template/template-manager';

/**
 * POST /api/templates/[id]/duplicate
 * 複製範本
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 從認證中間件獲取用戶 ID
    const userId = 1;
    const templateId = params.id;

    const body = await request.json().catch(() => ({}));
    const newName = body.name;

    const template = await templateManager.duplicateTemplate(templateId, userId, newName);

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: '範本複製成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('複製範本失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '複製範本失敗',
      },
      { status: 500 }
    );
  }
}
