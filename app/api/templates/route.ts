/**
 * @fileoverview 範本管理 API - 列表和創建GET  /api/templates - 獲取範本列表POST /api/templates - 創建新範本@author Claude Code@date 2025-10-02
 * @module app/api/templates/route
 * @description
 * 範本管理 API - 列表和創建GET  /api/templates - 獲取範本列表POST /api/templates - 創建新範本@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateManager, CreateTemplateData, TemplateQueryOptions } from '@/lib/template/template-manager';
import { TemplateCategory, TemplateAccess } from '@prisma/client';
import { requirePermission } from '@/lib/security/permission-middleware';
import { Resource, Action } from '@/lib/security/rbac';

/**
 * GET /api/templates
 * 獲取範本列表（帶分頁和過濾）
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC權限檢查
    const authResult = await requirePermission(request, {
      resource: Resource.PROPOSAL_TEMPLATES,
      action: Action.LIST,
    });

    if (!authResult.authorized) {
      return authResult.response!;
    }

    const userId = authResult.user!.userId;

    // 解析查詢參數
    const searchParams = request.nextUrl.searchParams;
    const options: TemplateQueryOptions = {
      category: searchParams.get('category') as TemplateCategory | undefined,
      accessLevel: searchParams.get('accessLevel') as TemplateAccess | undefined,
      isActive: searchParams.get('isActive') !== 'false',
      organization: searchParams.get('organization') || undefined,
      createdBy: searchParams.get('createdBy') ? parseInt(searchParams.get('createdBy')!) : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'updated_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const result = await templateManager.getTemplates(userId, options);

    return NextResponse.json({
      success: true,
      data: result,
      message: '獲取範本列表成功',
    });
  } catch (error) {
    console.error('獲取範本列表失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取範本列表失敗',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * 創建新範本
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC權限檢查
    const authResult = await requirePermission(request, {
      resource: Resource.PROPOSAL_TEMPLATES,
      action: Action.CREATE,
    });

    if (!authResult.authorized) {
      return authResult.response!;
    }

    const userId = authResult.user!.userId;

    const body = await request.json();

    // 驗證必需字段
    if (!body.name || !body.category || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必需字段: name, category, content',
        },
        { status: 400 }
      );
    }

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

    const templateData: CreateTemplateData = {
      name: body.name,
      description: body.description,
      category: body.category,
      content: body.content,
      variables: body.variables || {},
      organization: body.organization,
      accessLevel: body.accessLevel,
      isDefault: body.isDefault,
      tags: body.tags,
    };

    const template = await templateManager.createTemplate(userId, templateData);

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: '範本創建成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('創建範本失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '創建範本失敗',
      },
      { status: 500 }
    );
  }
}
