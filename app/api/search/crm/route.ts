/**
 * @fileoverview CRM 搜索 API 路由功能：- 提供 CRM 數據搜索的 RESTful API- 支援多實體搜索和混合搜索- 實現搜索結果分頁和篩選- 錯誤處理和回應格式化支援的搜索類型：- 客戶搜索- 聯絡人搜索- 銷售機會搜索- 混合搜索（知識庫 + CRM）作者：Claude Code創建時間：2025-09-28
 * @module app/api/search/crm/route
 * @description
 * CRM 搜索 API 路由功能：- 提供 CRM 數據搜索的 RESTful API- 支援多實體搜索和混合搜索- 實現搜索結果分頁和篩選- 錯誤處理和回應格式化支援的搜索類型：- 客戶搜索- 聯絡人搜索- 銷售機會搜索- 混合搜索（知識庫 + CRM）作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { CrmSearchAdapter } from '@/lib/search/crm-search-adapter';
import { z } from 'zod';

// 搜索請求驗證模式
const searchRequestSchema = z.object({
  query: z.string().min(1, '搜索查詢不能為空'),
  type: z.enum(['customers', 'contacts', 'opportunities', 'interactions', 'all', 'hybrid']).optional().default('all'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  include_knowledge_base: z.boolean().optional().default(false),
  filters: z.object({
    status: z.string().optional(),
    date_range: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    customer_id: z.number().optional(),
    industry: z.string().optional(),
    company_size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional()
  }).optional()
});

// 錯誤回應格式
interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

// 成功回應格式
interface SuccessResponse {
  success: boolean;
  data: any;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  search_info?: {
    query: string;
    search_type: string;
    execution_time_ms: number;
  };
  timestamp: string;
}

/**
 * CRM 數據搜索 API 端點
 *
 * @param request HTTP 請求對象
 * @returns JSON 格式的搜索結果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 解析請求數據
    const body = await request.json();

    // 驗證請求參數
    const validationResult = searchRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: `參數驗證失敗: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        status: 400,
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { query, type, limit, offset, include_knowledge_base, filters } = validationResult.data;

    // 初始化 CRM 搜索適配器
    const crmSearchAdapter = new CrmSearchAdapter();

    let searchResults: any;
    let totalCount: number;

    // 根據搜索類型執行相應的搜索邏輯
    if (type === 'hybrid' || include_knowledge_base) {
      // 混合搜索：知識庫 + CRM 數據
      const hybridResult = await crmSearchAdapter.performHybridSearch(query, {
        limit,
        offset
      });

      searchResults = hybridResult;
      totalCount = hybridResult.totalResults;

    } else {
      // 純 CRM 數據搜索
      const crmResults = await crmSearchAdapter.searchCrmData(query, {
        entityTypes: type === 'all' ? ['customer', 'contact', 'opportunity', 'interaction'] : [type as 'customer' | 'contact' | 'opportunity' | 'interaction'],
        limit,
        offset
      });

      searchResults = crmResults;
      totalCount = crmResults.length; // 這裡可能需要額外的 count 查詢
    }

    // 計算執行時間
    const executionTime = Date.now() - startTime;

    // 構建成功回應
    const successResponse: SuccessResponse = {
      success: true,
      data: searchResults,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      },
      search_info: {
        query,
        search_type: type,
        execution_time_ms: executionTime
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    console.error('CRM 搜索 API 錯誤:', error);

    // 錯誤處理
    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : '搜索過程中發生未知錯誤',
      status: 500,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 獲取 CRM 搜索建議 API 端點
 *
 * @param request HTTP 請求對象
 * @returns JSON 格式的搜索建議
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '查詢長度至少需要 2 個字符'
      });
    }

    // 初始化 CRM 搜索適配器
    const crmSearchAdapter = new CrmSearchAdapter();

    // 獲取搜索建議
    const suggestions = await crmSearchAdapter.getSearchSuggestions(query, {
      entity_types: type === 'all' ? ['customers', 'contacts', 'opportunities'] : [type],
      limit: 10
    });

    const successResponse: SuccessResponse = {
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    console.error('CRM 搜索建議 API 錯誤:', error);

    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : '獲取搜索建議時發生錯誤',
      status: 500,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}