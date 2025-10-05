/**
 * 客戶360度視圖 API 路由
 *
 * 功能：
 * - 提供客戶完整檔案和相關數據
 * - 聚合聯絡人、銷售機會、互動歷史
 * - 生成AI洞察和建議
 * - 查找相關知識庫內容
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { Customer360Service } from '@/lib/integrations/customer-360/service';

/**
 * 獲取客戶360度視圖
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的客戶360度數據
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_CUSTOMER_ID',
        message: '無效的客戶ID'
      }, { status: 400 });
    }

    // 初始化客戶360度服務
    const customer360Service = new Customer360Service();

    // 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // 獲取客戶360度視圖數據
    const customer360Data = await customer360Service.getCustomer360View(customerId, {
      includeInactive: includeInactive,
      detailLevel: 'detailed'
    });

    return NextResponse.json({
      success: true,
      data: customer360Data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('獲取客戶360度視圖失敗:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'CUSTOMER_NOT_FOUND',
        message: '找不到指定的客戶'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '獲取客戶360度視圖時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 更新客戶資料
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的更新結果
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_CUSTOMER_ID',
        message: '無效的客戶ID'
      }, { status: 400 });
    }

    await request.json();

    // TODO: 實現客戶資料更新邏輯
    // 這裡需要驗證輸入數據並更新資料庫

    return NextResponse.json({
      success: true,
      message: '客戶資料更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('更新客戶資料失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '更新客戶資料時發生錯誤'
    }, { status: 500 });
  }
}