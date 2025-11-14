/**
 * @fileoverview AI銷售賦能平台範本管理API - 實現範本列表查詢和創建功能
 * @module app/api/templates/route
 *
 * ## 功能說明
 * 提供範本的列表查詢和創建功能,支援分頁、過濾和完整的RBAC權限控制。
 *
 * ## API規格
 * - **端點**: `GET /api/templates` - 獲取範本列表
 *   - 查詢參數: category, accessLevel, isActive, organization, createdBy, search, sortBy, sortOrder, page, pageSize
 *   - 響應: { success, data: {...}, message }
 * - **端點**: `POST /api/templates` - 創建新範本
 *   - 請求: { name, description?, category, content, variables?, organization?, accessLevel?, isDefault?, tags? }
 *   - 響應: { success, data: {...}, message }
 * - **狀態碼**: 200/201 (成功) | 400 (驗證錯誤) | 401 (未認證) | 403 (無權限) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 範本查詢 - 支援多條件過濾和分頁的範本列表
 * - 範本創建 - 驗證必需字段並創建新範本
 * - RBAC權限 - LIST和CREATE權限檢查
 * - 變數驗證 - 確保變數格式正確
 *
 * ## 相關文件
 * - `/lib/template/template-manager.ts` - 範本管理邏輯
 * - `/lib/security/permission-middleware.ts` - RBAC權限中間件
 * - `/lib/security/rbac.ts` - 權限定義
 * - `@prisma/client` - TemplateCategory, TemplateAccess枚舉
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
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
