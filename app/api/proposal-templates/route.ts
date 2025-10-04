/**
 * 提案範本管理 API 路由
 *
 * 功能：
 * - 提供提案範本的CRUD操作
 * - 支援範本搜尋、篩選、排序功能
 * - 範本權限和訪問控制
 * - 範本版本管理和使用統計
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 獲取提案範本列表
 *
 * @param request HTTP請求對象
 * @returns JSON格式的範本列表數據
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';
    const access = searchParams.get('access') || 'all';
    const status = searchParams.get('status') || 'active';
    const sortBy = searchParams.get('sortBy') || 'updated_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId'); // 當前用戶ID，用於權限檢查

    // 構建查詢條件
    const where: any = {};

    // 狀態篩選
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    // 分類篩選
    if (category !== 'all') {
      where.category = category;
    }

    // 訪問權限篩選
    if (access !== 'all') {
      where.access_level = access;
    } else if (userId) {
      // 如果沒有指定access但有userId，則返回用戶可訪問的範本
      where.OR = [
        { access_level: 'PUBLIC' },
        { access_level: 'SHARED' },
        { created_by: parseInt(userId) },
        { access_level: 'PRIVATE', created_by: parseInt(userId) }
      ];
    }

    // 搜尋條件
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // 獲取範本數據
    const [templates, total] = await Promise.all([
      prisma.proposalTemplate.findMany({
        where,
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
        },
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.proposalTemplate.count({ where })
    ]);

    // 計算分頁信息
    const totalPages = Math.ceil(total / limit);

    // 統計數據
    const stats = await prisma.proposalTemplate.aggregate({
      _count: { id: true },
      _sum: { usage_count: true },
      where: { is_active: true }
    });

    // 格式化響應數據
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      access_level: template.access_level,
      version: template.version,
      is_active: template.is_active,
      is_default: template.is_default,
      usage_count: template.usage_count,
      variables_count: Object.keys(template.variables as any).length,
      generations_count: template._count.generations,
      creator: template.creator,
      updater: template.updater,
      created_at: template.created_at,
      updated_at: template.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        templates: formattedTemplates,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: {
          total: stats._count.id,
          total_usage: stats._sum.usage_count || 0,
          active_templates: total
        },
        filters: {
          query,
          category,
          access,
          status,
          sortBy,
          sortOrder
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('獲取提案範本列表失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '獲取提案範本列表時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 創建新提案範本
 *
 * @param request HTTP請求對象
 * @returns JSON格式的創建結果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const templateData = await request.json();

    // 驗證必要欄位
    const requiredFields = ['name', 'content', 'category', 'created_by'];
    for (const field of requiredFields) {
      if (!templateData[field]) {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `缺少必要欄位: ${field}`
        }, { status: 400 });
      }
    }

    // 驗證變數格式
    if (templateData.variables && typeof templateData.variables !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '變數定義格式不正確'
      }, { status: 400 });
    }

    // 檢查範本名稱唯一性（在同一用戶和組織範圍內）
    const existingTemplate = await prisma.proposalTemplate.findFirst({
      where: {
        name: templateData.name,
        created_by: templateData.created_by,
        organization: templateData.organization || null
      }
    });

    if (existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'DUPLICATE_NAME',
        message: '範本名稱已存在'
      }, { status: 409 });
    }

    // 創建新範本
    const newTemplate = await prisma.proposalTemplate.create({
      data: {
        name: templateData.name,
        description: templateData.description || null,
        category: templateData.category,
        content: templateData.content,
        variables: templateData.variables || {},
        version: templateData.version || 1,
        is_active: templateData.is_active !== false, // 默認為true
        is_default: templateData.is_default || false,
        created_by: templateData.created_by,
        updated_by: templateData.created_by,
        organization: templateData.organization || null,
        access_level: templateData.access_level || 'PRIVATE'
      },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        access_level: newTemplate.access_level,
        version: newTemplate.version,
        is_active: newTemplate.is_active,
        creator: newTemplate.creator,
        created_at: newTemplate.created_at
      },
      message: '提案範本創建成功',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('創建提案範本失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '創建提案範本時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 批量操作提案範本
 *
 * @param request HTTP請求對象
 * @returns JSON格式的操作結果
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { action, templateIds, data, userId } = await request.json();

    if (!action || !templateIds || !Array.isArray(templateIds)) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '無效的批量操作參數'
      }, { status: 400 });
    }

    let result;
    let affectedCount = 0;

    switch (action) {
      case 'activate':
        const activateResult = await prisma.proposalTemplate.updateMany({
          where: {
            id: { in: templateIds },
            // 權限檢查：只能操作自己創建的範本或有權限的範本
            OR: [
              { created_by: userId },
              { access_level: { in: ['PUBLIC', 'SHARED'] } }
            ]
          },
          data: {
            is_active: true,
            updated_by: userId
          }
        });
        affectedCount = activateResult.count;
        result = `批量啟用 ${affectedCount} 個範本`;
        break;

      case 'deactivate':
        const deactivateResult = await prisma.proposalTemplate.updateMany({
          where: {
            id: { in: templateIds },
            OR: [
              { created_by: userId },
              { access_level: { in: ['PUBLIC', 'SHARED'] } }
            ]
          },
          data: {
            is_active: false,
            updated_by: userId
          }
        });
        affectedCount = deactivateResult.count;
        result = `批量停用 ${affectedCount} 個範本`;
        break;

      case 'delete':
        // 軟刪除：將範本標記為非活躍狀態
        const deleteResult = await prisma.proposalTemplate.updateMany({
          where: {
            id: { in: templateIds },
            created_by: userId // 只能刪除自己創建的範本
          },
          data: {
            is_active: false,
            updated_by: userId
          }
        });
        affectedCount = deleteResult.count;
        result = `批量刪除 ${affectedCount} 個範本`;
        break;

      case 'update_category':
        if (!data.category) {
          return NextResponse.json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: '未指定目標分類'
          }, { status: 400 });
        }

        const categoryResult = await prisma.proposalTemplate.updateMany({
          where: {
            id: { in: templateIds },
            OR: [
              { created_by: userId },
              { access_level: { in: ['PUBLIC', 'SHARED'] } }
            ]
          },
          data: {
            category: data.category,
            updated_by: userId
          }
        });
        affectedCount = categoryResult.count;
        result = `批量更新 ${affectedCount} 個範本分類為 ${data.category}`;
        break;

      case 'update_access':
        if (!data.access_level) {
          return NextResponse.json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: '未指定訪問權限等級'
          }, { status: 400 });
        }

        const accessResult = await prisma.proposalTemplate.updateMany({
          where: {
            id: { in: templateIds },
            created_by: userId // 只能修改自己創建的範本權限
          },
          data: {
            access_level: data.access_level,
            updated_by: userId
          }
        });
        affectedCount = accessResult.count;
        result = `批量更新 ${affectedCount} 個範本訪問權限為 ${data.access_level}`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'INVALID_ACTION',
          message: `不支援的操作類型: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result,
      data: {
        action,
        affectedCount,
        templateIds: templateIds.slice(0, affectedCount)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('批量操作範本失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '批量操作時發生錯誤'
    }, { status: 500 });
  }
}