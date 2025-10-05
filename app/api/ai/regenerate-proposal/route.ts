/**
 * AI提案重新生成 API 路由
 *
 * 功能：
 * - 基於現有生成記錄重新生成提案內容
 * - 支援變數和AI配置的調整
 * - 建立生成版本關聯和歷史追蹤
 * - 提供重新生成狀態管理
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProposalGenerationService } from '@/lib/ai/proposal-generation-service';

const proposalService = getProposalGenerationService();

/**
 * 重新生成AI提案內容
 *
 * @param request HTTP請求對象
 * @returns JSON格式的重新生成結果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { originalGenerationId, updates } = await request.json();

    // 驗證必要欄位
    if (!originalGenerationId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '缺少原始生成記錄ID'
      }, { status: 400 });
    }

    // 驗證更新數據格式
    if (updates) {
      if (updates.variables && typeof updates.variables !== 'object') {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '變數更新格式不正確，應為物件格式'
        }, { status: 400 });
      }

      if (updates.aiConfig && typeof updates.aiConfig !== 'object') {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'AI配置更新格式不正確，應為物件格式'
        }, { status: 400 });
      }
    }

    // 執行重新生成
    const result = await proposalService.regenerateProposal(originalGenerationId, updates);

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
          generatedAt: result.generatedAt,
          originalGenerationId
        },
        message: '提案重新生成成功',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'REGENERATION_FAILED',
        message: result.error || '提案重新生成失敗',
        data: {
          generationId: result.id,
          status: result.status,
          error: result.error,
          originalGenerationId
        }
      }, { status: 422 });
    }

  } catch (error: any) {
    console.error('提案重新生成失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '重新生成時發生錯誤',
      details: error.message
    }, { status: 500 });
  }
}