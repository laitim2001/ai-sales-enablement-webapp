/**
 * @fileoverview 提案範本詳情 API 路由功能：- 獲取單個範本的詳細信息- 更新範本內容和設定- 刪除範本（軟刪除）- 範本訪問權限控制作者：Claude Code創建時間：2025-09-28
 * @module app/api/proposal-templates/[id]/route
 * @description
 * 提案範本詳情 API 路由功能：- 獲取單個範本的詳細信息- 更新範本內容和設定- 刪除範本（軟刪除）- 範本訪問權限控制作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 獲取範本詳情
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的範本詳情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const templateId = params.id;

    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // 用於權限檢查

    // 獲取範本詳情
    const template = await prisma.proposalTemplate.findUnique({
      where: { id: templateId },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        updater: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        _count: {
          select: { generations: true }
        }
      }
    });

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'TEMPLATE_NOT_FOUND',
        message: '範本不存在'
      }, { status: 404 });
    }

    // 權限檢查
    if (userId && template.access_level === 'PRIVATE' && template.created_by !== parseInt(userId)) {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: '沒有訪問權限'
      }, { status: 403 });
    }

    // 格式化響應數據
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      variables: template.variables,
      access_level: template.access_level,
      version: template.version,
      is_active: template.is_active,
      is_default: template.is_default,
      usage_count: template.usage_count,
      generations_count: template._count.generations,
      creator: template.creator,
      updater: template.updater,
      created_at: template.created_at,
      updated_at: template.updated_at
    };

    return NextResponse.json({
      success: true,
      data: formattedTemplate,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('獲取範本詳情失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '獲取範本詳情時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 更新範本
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的更新結果
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const templateId = params.id;
    const updateData = await request.json();

    // 檢查範本是否存在
    const existingTemplate = await prisma.proposalTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'TEMPLATE_NOT_FOUND',
        message: '範本不存在'
      }, { status: 404 });
    }

    // 權限檢查：只有創建者可以更新
    if (updateData.updated_by !== existingTemplate.created_by) {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: '只有範本創建者可以更新'
      }, { status: 403 });
    }

    // 如果更新名稱，檢查名稱唯一性
    if (updateData.name && updateData.name !== existingTemplate.name) {
      const duplicateName = await prisma.proposalTemplate.findFirst({
        where: {
          name: updateData.name,
          created_by: existingTemplate.created_by,
          organization: existingTemplate.organization,
          id: { not: templateId }
        }
      });

      if (duplicateName) {
        return NextResponse.json({
          success: false,
          error: 'DUPLICATE_NAME',
          message: '範本名稱已存在'
        }, { status: 409 });
      }
    }

    // 更新範本
    const updatedTemplate = await prisma.proposalTemplate.update({
      where: { id: templateId },
      data: {
        name: updateData.name || existingTemplate.name,
        description: updateData.description,
        category: updateData.category || existingTemplate.category,
        content: updateData.content || existingTemplate.content,
        variables: updateData.variables || existingTemplate.variables,
        access_level: updateData.access_level || existingTemplate.access_level,
        is_active: updateData.is_active !== undefined ? updateData.is_active : existingTemplate.is_active,
        is_default: updateData.is_default !== undefined ? updateData.is_default : existingTemplate.is_default,
        version: { increment: 1 }, // 自動增加版本號
        updated_by: updateData.updated_by
      },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        updater: {
          select: { id: true, first_name: true, last_name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        version: updatedTemplate.version,
        is_active: updatedTemplate.is_active,
        creator: updatedTemplate.creator,
        updater: updatedTemplate.updater,
        updated_at: updatedTemplate.updated_at
      },
      message: '範本更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('更新範本失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '更新範本時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 刪除範本（軟刪除）
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的刪除結果
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const templateId = params.id;

    // 解析請求體獲取用戶ID
    const { userId } = await request.json();

    // 檢查範本是否存在
    const existingTemplate = await prisma.proposalTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'TEMPLATE_NOT_FOUND',
        message: '範本不存在'
      }, { status: 404 });
    }

    // 權限檢查：只有創建者可以刪除
    if (userId !== existingTemplate.created_by) {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: '只有範本創建者可以刪除'
      }, { status: 403 });
    }

    // 檢查是否有相關的生成記錄
    const generationCount = await prisma.proposalGeneration.count({
      where: { template_id: templateId }
    });

    if (generationCount > 0) {
      // 軟刪除：標記為非活躍狀態
      await prisma.proposalTemplate.update({
        where: { id: templateId },
        data: {
          is_active: false,
          updated_by: userId
        }
      });

      return NextResponse.json({
        success: true,
        message: '範本已停用（因為存在相關生成記錄）',
        data: {
          action: 'deactivated',
          generationCount
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // 如果沒有生成記錄，可以完全刪除
      await prisma.proposalTemplate.delete({
        where: { id: templateId }
      });

      return NextResponse.json({
        success: true,
        message: '範本已刪除',
        data: {
          action: 'deleted'
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('刪除範本失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '刪除範本時發生錯誤'
    }, { status: 500 });
  }
}