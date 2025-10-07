/**
 * @fileoverview 提案詳情 API 路由功能：- GET: 獲取提案詳細信息- PATCH: 更新提案- DELETE: 刪除提案- RBAC權限控制整合 (Sprint 3 Week 7)權限要求：- GET: READ權限 (所有角色)- PATCH: UPDATE權限 + 擁有權檢查 (ADMIN, SALES_MANAGER, SALES_REP - 僅自己的提案)- DELETE: DELETE權限 + 擁有權檢查 (ADMIN, SALES_MANAGER, SALES_REP - 僅自己的提案)@author Claude Code@date 2025-10-02@updated 2025-10-06 (RBAC整合)
 * @module app/api/proposals/[id]/route
 * @description
 * 提案詳情 API 路由功能：- GET: 獲取提案詳細信息- PATCH: 更新提案- DELETE: 刪除提案- RBAC權限控制整合 (Sprint 3 Week 7)權限要求：- GET: READ權限 (所有角色)- PATCH: UPDATE權限 + 擁有權檢查 (ADMIN, SALES_MANAGER, SALES_REP - 僅自己的提案)- DELETE: DELETE權限 + 擁有權檢查 (ADMIN, SALES_MANAGER, SALES_REP - 僅自己的提案)@author Claude Code@date 2025-10-02@updated 2025-10-06 (RBAC整合)
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
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
