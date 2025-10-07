/**
 * @fileoverview 範本管理 API - 單個範本操作GET    /api/templates/[id] - 獲取範本詳情PUT    /api/templates/[id] - 更新範本DELETE /api/templates/[id] - 刪除範本@author Claude Code@date 2025-10-02
 * @module app/api/templates/[id]/route
 * @description
 * 範本管理 API - 單個範本操作GET    /api/templates/[id] - 獲取範本詳情PUT    /api/templates/[id] - 更新範本DELETE /api/templates/[id] - 刪除範本@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateManager, UpdateTemplateData } from '@/lib/template/template-manager';

/**
 * GET /api/templates/[id]
 * 獲取範本詳情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 從認證中間件獲取用戶 ID
    const userId = 1;
    const templateId = params.id;

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

    return NextResponse.json({
      success: true,
      data: template,
      message: '獲取範本詳情成功',
    });
  } catch (error) {
    console.error('獲取範本詳情失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取範本詳情失敗',
      },
      { status: error instanceof Error && error.message.includes('權限') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/templates/[id]
 * 更新範本
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 從認證中間件獲取用戶 ID
    const userId = 1;
    const templateId = params.id;

    const body = await request.json();

    // 驗證變數格式
    if (body.variables && typeof body.variables !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: '變數格式錯誤，應為對象',
        },
        { status: 400 }
      );
    }

    const updateData: UpdateTemplateData = {
      name: body.name,
      description: body.description,
      category: body.category,
      content: body.content,
      variables: body.variables,
      organization: body.organization,
      accessLevel: body.accessLevel,
      isActive: body.isActive,
      isDefault: body.isDefault,
      tags: body.tags,
    };

    const template = await templateManager.updateTemplate(templateId, userId, updateData);

    return NextResponse.json({
      success: true,
      data: template,
      message: '範本更新成功',
    });
  } catch (error) {
    console.error('更新範本失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新範本失敗',
      },
      { status: error instanceof Error && error.message.includes('權限') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * 刪除範本（軟刪除）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 從認證中間件獲取用戶 ID
    const userId = 1;
    const templateId = params.id;

    await templateManager.deleteTemplate(templateId, userId);

    return NextResponse.json({
      success: true,
      message: '範本刪除成功',
    });
  } catch (error) {
    console.error('刪除範本失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '刪除範本失敗',
      },
      { status: error instanceof Error && error.message.includes('權限') ? 403 : 500 }
    );
  }
}
