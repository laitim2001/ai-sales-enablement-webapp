/**
 * @fileoverview 單個準備包API路由
功能：
- GET: 獲取準備包詳情
- PATCH: 更新準備包
- DELETE: 刪除準備包
作者：Claude Code
日期：2025-10-05
 * @module app/api/meeting-prep/[id]/route
 *
 * 單個準備包API路由
 * 功能：
 * - GET: 獲取準備包詳情
 * - PATCH: 更新準備包
 * - DELETE: 刪除準備包
 * 作者：Claude Code
 * 日期：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/request-auth';
import prisma from '@/lib/prisma';
import { MeetingPrepPackageManager } from '@/lib/meeting/meeting-prep-package';

/**
 * GET /api/meeting-prep/:id
 * 獲取準備包詳情
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(req);
    const userId = payload.userId;

    // 創建準備包管理器實例
    const manager = new MeetingPrepPackageManager(prisma);

    // 獲取準備包
    const prepPackage = await manager.getPrepPackage(params.id);

    if (!prepPackage) {
      return NextResponse.json(
        { error: 'Prep package not found' },
        { status: 404 }
      );
    }

    // 驗證權限
    if (prepPackage.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ package: prepPackage });
  } catch (error) {
    console.error('Error fetching prep package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prep package' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/meeting-prep/:id
 * 更新準備包
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(req);
    const userId = payload.userId;

    // 創建準備包管理器實例
    const manager = new MeetingPrepPackageManager(prisma);

    // 驗證準備包存在且屬於當前用戶
    const existingPackage = await manager.getPrepPackage(params.id);

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Prep package not found' },
        { status: 404 }
      );
    }

    if (existingPackage.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 解析更新數據
    const updates = await req.json();
    console.log('📝 PATCH準備包更新請求:', {
      packageId: params.id,
      userId: userId,
      updates
    });

    // 更新準備包
    const updatedPackage = await manager.updatePrepPackage(params.id, updates);
    console.log('✅ 準備包更新成功:', updatedPackage.id);

    return NextResponse.json({
      message: 'Prep package updated successfully',
      package: updatedPackage,
    });
  } catch (error) {
    console.error('❌ Error updating prep package:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      packageId: params.id
    });
    return NextResponse.json(
      {
        error: 'Failed to update prep package',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meeting-prep/:id
 * 刪除準備包（設置為已歸檔）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 驗證用戶身份（支持Bearer token或Cookie）
    const payload = await authenticateRequest(req);
    const userId = payload.userId;

    // 創建準備包管理器實例
    const manager = new MeetingPrepPackageManager(prisma);

    // 驗證準備包存在且屬於當前用戶
    const existingPackage = await manager.getPrepPackage(params.id);

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Prep package not found' },
        { status: 404 }
      );
    }

    if (existingPackage.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 歸檔準備包（軟刪除）
    console.log('🗑️ DELETE準備包請求:', {
      packageId: params.id,
      userId: userId
    });

    await manager.updatePrepPackage(params.id, {
      status: 'ARCHIVED' as any,
    });
    console.log('✅ 準備包歸檔成功:', params.id);

    return NextResponse.json({
      message: 'Prep package archived successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting prep package:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      packageId: params.id
    });
    return NextResponse.json(
      {
        error: 'Failed to delete prep package',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
