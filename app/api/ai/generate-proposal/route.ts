/**
 * AI提案生成 API 路由
 *
 * 功能：
 * - 提供AI驅動的提案內容生成服務
 * - 支援範本化生成和自定義生成
 * - 實現生成狀態追蹤和結果管理
 * - 整合Azure OpenAI GPT-4服務
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProposalGenerationService, getProposalGenerationService } from '@/lib/ai/proposal-generation-service';

const proposalService = getProposalGenerationService();

/**
 * 生成AI提案內容
 *
 * @param request HTTP請求對象
 * @returns JSON格式的生成結果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const generationRequest = await request.json();

    // 驗證必要欄位
    const requiredFields = ['templateId', 'title', 'variables', 'generatedBy'];
    for (const field of requiredFields) {
      if (!generationRequest[field]) {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `缺少必要欄位: ${field}`
        }, { status: 400 });
      }
    }

    // 驗證變數格式
    if (typeof generationRequest.variables !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '變數格式不正確，應為物件格式'
      }, { status: 400 });
    }

    // 執行AI提案生成
    const result = await proposalService.generateProposal({
      templateId: generationRequest.templateId,
      title: generationRequest.title,
      variables: generationRequest.variables,
      customerId: generationRequest.customerId,
      opportunityId: generationRequest.opportunityId,
      generatedBy: generationRequest.generatedBy,
      aiConfig: generationRequest.aiConfig
    });

    // 根據生成狀態返回不同響應
    if (result.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: {
          generationId: result.id,
          proposalId: result.proposalId,
          content: result.content,
          status: result.status,
          qualityScore: result.qualityScore,
          usage: result.usage,
          generatedAt: result.generatedAt
        },
        message: '提案生成成功',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'GENERATION_FAILED',
        message: result.error || '提案生成失敗',
        data: {
          generationId: result.id,
          status: result.status,
          error: result.error
        }
      }, { status: 422 });
    }

  } catch (error: any) {
    console.error('AI提案生成失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '提案生成時發生錯誤',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * 獲取提案生成歷史
 *
 * @param request HTTP請求對象
 * @returns JSON格式的生成歷史數據
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');
    const templateId = searchParams.get('templateId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters: any = {
      offset: (page - 1) * limit,
      limit
    };

    if (userId) filters.userId = parseInt(userId);
    if (customerId) filters.customerId = parseInt(customerId);
    if (templateId) filters.templateId = templateId;
    if (status) filters.status = status;

    const { generations, total } = await proposalService.getGenerationHistory(filters);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        generations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('獲取生成歷史失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '獲取生成歷史時發生錯誤'
    }, { status: 500 });
  }
}