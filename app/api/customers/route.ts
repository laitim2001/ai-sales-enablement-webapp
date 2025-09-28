/**
 * 客戶列表 API 路由
 *
 * 功能：
 * - 提供客戶列表查詢API
 * - 支援搜尋、篩選、排序功能
 * - 整合Dynamics 365同步數據
 * - 分頁和批量操作支援
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { Dynamics365SyncService } from '@/lib/integrations/dynamics365/sync';

/**
 * 獲取客戶列表
 *
 * @param request HTTP請求對象
 * @returns JSON格式的客戶列表數據
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const industry = searchParams.get('industry') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const sortBy = searchParams.get('sortBy') || 'company_name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 初始化同步服務
    const syncService = new Dynamics365SyncService();

    // 構建查詢條件
    const filters = {
      search: query,
      status: status !== 'all' ? status : undefined,
      industry: industry !== 'all' ? industry : undefined,
      priority: priority !== 'all' ? priority : undefined,
    };

    // 獲取客戶數據（這裡應該從資料庫查詢）
    // 暫時返回模擬數據
    const mockCustomers = [
      {
        id: '1',
        company_name: 'TechCorp Solutions',
        contact_name: '張經理',
        email: 'zhang@techcorp.com',
        phone: '+60 3-1234-5678',
        address: '吉隆坡, 馬來西亞',
        industry: '科技',
        status: 'customer',
        priority: 'high',
        revenue_potential: 250000,
        last_interaction: '2024-09-27',
        created_date: '2024-08-15',
        notes_count: 12,
        opportunities_count: 3
      },
      {
        id: '2',
        company_name: 'Global Trading Pte Ltd',
        contact_name: '李總監',
        email: 'li@globaltrading.sg',
        phone: '+65 6789-0123',
        address: '新加坡',
        industry: '貿易',
        status: 'prospect',
        priority: 'medium',
        revenue_potential: 180000,
        last_interaction: '2024-09-25',
        created_date: '2024-09-01',
        notes_count: 8,
        opportunities_count: 2
      },
      {
        id: '3',
        company_name: 'Manufacturing Excellence',
        contact_name: '王副總',
        email: 'wang@manufacturing.com',
        phone: '+60 4-5678-9012',
        address: '檳城, 馬來西亞',
        industry: '製造業',
        status: 'active',
        priority: 'high',
        revenue_potential: 320000,
        last_interaction: '2024-09-26',
        created_date: '2024-07-20',
        notes_count: 15,
        opportunities_count: 4
      },
      {
        id: '4',
        company_name: 'Digital Finance Group',
        contact_name: '陳執行長',
        email: 'chen@digitalfinance.sg',
        phone: '+65 8901-2345',
        address: '新加坡',
        industry: '金融',
        status: 'customer',
        priority: 'high',
        revenue_potential: 500000,
        last_interaction: '2024-09-28',
        created_date: '2024-06-10',
        notes_count: 20,
        opportunities_count: 5
      },
      {
        id: '5',
        company_name: 'Retail Innovation Hub',
        contact_name: '林經理',
        email: 'lin@retailhub.com',
        phone: '+60 7-2345-6789',
        address: '新山, 馬來西亞',
        industry: '零售',
        status: 'inactive',
        priority: 'low',
        revenue_potential: 80000,
        last_interaction: '2024-08-15',
        created_date: '2024-05-30',
        notes_count: 5,
        opportunities_count: 1
      },
      {
        id: '6',
        company_name: 'Healthcare Systems Ltd',
        contact_name: '黃醫師',
        email: 'huang@healthcare.sg',
        phone: '+65 3456-7890',
        address: '新加坡',
        industry: '醫療',
        status: 'prospect',
        priority: 'medium',
        revenue_potential: 220000,
        last_interaction: '2024-09-24',
        created_date: '2024-08-05',
        notes_count: 10,
        opportunities_count: 2
      }
    ];

    // 應用篩選條件
    let filteredCustomers = mockCustomers;

    if (filters.search) {
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.company_name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        customer.contact_name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search!.toLowerCase()) ||
        customer.industry.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.status) {
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.status === filters.status
      );
    }

    if (filters.industry) {
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.industry === filters.industry
      );
    }

    if (filters.priority) {
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.priority === filters.priority
      );
    }

    // 排序
    filteredCustomers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 分頁
    const total = filteredCustomers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

    // 統計數據
    const stats = {
      total: mockCustomers.length,
      customers: mockCustomers.filter(c => c.status === 'customer').length,
      prospects: mockCustomers.filter(c => c.status === 'prospect').length,
      totalRevenue: mockCustomers.reduce((sum, c) => sum + c.revenue_potential, 0),
      filtered: total
    };

    return NextResponse.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        filters: {
          query,
          status,
          industry,
          priority,
          sortBy,
          sortOrder
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('獲取客戶列表失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '獲取客戶列表時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 創建新客戶
 *
 * @param request HTTP請求對象
 * @returns JSON格式的創建結果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const customerData = await request.json();

    // 驗證必要欄位
    const requiredFields = ['company_name', 'contact_name', 'email', 'industry'];
    for (const field of requiredFields) {
      if (!customerData[field]) {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `缺少必要欄位: ${field}`
        }, { status: 400 });
      }
    }

    // 初始化同步服務
    const syncService = new Dynamics365SyncService();

    // TODO: 實現客戶創建邏輯
    // 這裡需要：
    // 1. 驗證客戶數據
    // 2. 保存到本地資料庫
    // 3. 同步到Dynamics 365
    // 4. 返回創建結果

    const newCustomer = {
      id: `new_${Date.now()}`,
      ...customerData,
      created_date: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      status: customerData.status || 'prospect',
      priority: customerData.priority || 'medium',
      revenue_potential: customerData.revenue_potential || 0,
      notes_count: 0,
      opportunities_count: 0
    };

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: '客戶創建成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('創建客戶失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '創建客戶時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 批量操作客戶
 *
 * @param request HTTP請求對象
 * @returns JSON格式的操作結果
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { action, customerIds, data } = await request.json();

    if (!action || !customerIds || !Array.isArray(customerIds)) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '無效的批量操作參數'
      }, { status: 400 });
    }

    // 初始化同步服務
    const syncService = new Dynamics365SyncService();

    // TODO: 實現批量操作邏輯
    // 支援的操作類型：
    // - update_status: 更新客戶狀態
    // - update_priority: 更新優先級
    // - assign_owner: 分配負責人
    // - add_tags: 添加標籤
    // - export: 導出數據

    let result;
    switch (action) {
      case 'update_status':
        result = `批量更新 ${customerIds.length} 個客戶狀態為 ${data.status}`;
        break;
      case 'update_priority':
        result = `批量更新 ${customerIds.length} 個客戶優先級為 ${data.priority}`;
        break;
      case 'assign_owner':
        result = `批量分配 ${customerIds.length} 個客戶給 ${data.owner}`;
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
        affectedCount: customerIds.length,
        customerIds
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('批量操作失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '批量操作時發生錯誤'
    }, { status: 500 });
  }
}