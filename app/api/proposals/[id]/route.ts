/**
 * @fileoverview AI銷售賦能平台提案詳情API - 實現單個提案的查詢、更新和刪除功能
 * @module app/api/proposals/[id]/route
 *
 * ## 功能說明
 * 提供單個提案的完整管理功能,包含詳情查詢、內容更新和刪除操作,
 * 並整合RBAC權限控制和資源擁有權驗證。
 *
 * ## API規格
 * - **端點**: `GET /api/proposals/[id]` - 獲取提案詳情
 *   - 響應: { success, data: {...} } (包含customer, user, items)
 * - **端點**: `PATCH /api/proposals/[id]` - 更新提案
 *   - 請求: 任意提案字段
 *   - 響應: { success, data: {...}, message }
 * - **端點**: `DELETE /api/proposals/[id]` - 刪除提案
 *   - 響應: { success, message }
 * - **狀態碼**: 200 (成功) | 400 (驗證錯誤) | 401 (未認證) | 403 (無權限) | 404 (未找到) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 提案查詢 - 包含完整的關聯數據(customer, user, items)
 * - 提案更新 - RBAC權限控制+擁有權驗證
 * - 提案刪除 - 級聯刪除相關數據
 * - 權限驗證 - READ (所有角色)、UPDATE/DELETE (需擁有權檢查)
 *
 * ## 相關文件
 * - `/lib/db.ts` - Prisma數據庫連接
 * - `/lib/security/permission-middleware.ts` - RBAC權限中間件
 * - `/lib/security/rbac.ts` - 資源和動作定義
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/security/permission-middleware';
import { Resource, Action } from '@/lib/security/rbac';

/**
 * GET /api/proposals/[id]
 * 獲取提案詳細信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. RBAC權限檢查
    const authResult = await requirePermission(request, {
      resource: Resource.PROPOSALS,
      action: Action.READ,
    });

    if (!authResult.authorized) {
      return authResult.response!;
    }

    const user = authResult.user!;

    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    // 獲取提案詳情
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        customer: {
          select: {
            id: true,
            company_name: true,
            assigned_user_id: true,
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: '提案不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('獲取提案詳情失敗:', error);
    return NextResponse.json(
      { error: '獲取提案詳情失敗' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposals/[id]
 * 更新提案
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    // 檢查提案是否存在並獲取擁有者信息
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        user_id: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: '提案不存在' }, { status: 404 });
    }

    // 1. RBAC權限檢查（包含資源擁有權驗證）
    const authResult = await requirePermission(request, {
      resource: Resource.PROPOSALS,
      action: Action.UPDATE,
      checkOwnership: true,
      resourceOwnerId: proposal.user_id,
    });

    if (!authResult.authorized) {
      return authResult.response!;
    }

    const user = authResult.user!;

    const body = await request.json();

    // 更新提案
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: '提案已更新',
    });
  } catch (error) {
    console.error('更新提案失敗:', error);
    return NextResponse.json({ error: '更新提案失敗' }, { status: 500 });
  }
}

/**
 * DELETE /api/proposals/[id]
 * 刪除提案
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: '無效的提案 ID' }, { status: 400 });
    }

    // 檢查提案是否存在並獲取擁有者信息
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        user_id: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: '提案不存在' }, { status: 404 });
    }

    // 1. RBAC權限檢查（包含資源擁有權驗證）
    const authResult = await requirePermission(request, {
      resource: Resource.PROPOSALS,
      action: Action.DELETE,
      checkOwnership: true,
      resourceOwnerId: proposal.user_id,
    });

    if (!authResult.authorized) {
      return authResult.response!;
    }

    const user = authResult.user!;

    // 刪除提案（級聯刪除相關數據）
    await prisma.proposal.delete({
      where: { id: proposalId },
    });

    return NextResponse.json({
      success: true,
      message: '提案已刪除',
    });
  } catch (error) {
    console.error('刪除提案失敗:', error);
    return NextResponse.json({ error: '刪除提案失敗' }, { status: 500 });
  }
}
