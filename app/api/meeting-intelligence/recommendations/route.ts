/**
 * @fileoverview 會議建議生成API路由📋 檔案用途：基於會議分析生成AI建議（議程、討論重點、Q&A、後續行動）🔗 API端點：- POST /api/meeting-intelligence/recommendations - 生成會議建議📊 請求體：{  meetingInfo: MeetingInfo,  insights: MeetingInsights}📤 響應格式：{  success: boolean,  data: {    recommendations: MeetingRecommendations,    recommendationId: string,    timestamp: string  }}作者：Claude Code創建時間：2025-10-05Sprint：Sprint 7 Phase 2
 * @module app/api/meeting-intelligence/recommendations/route
 * @description
 * 會議建議生成API路由📋 檔案用途：基於會議分析生成AI建議（議程、討論重點、Q&A、後續行動）🔗 API端點：- POST /api/meeting-intelligence/recommendations - 生成會議建議📊 請求體：{  meetingInfo: MeetingInfo,  insights: MeetingInsights}📤 響應格式：{  success: boolean,  data: {    recommendations: MeetingRecommendations,    recommendationId: string,    timestamp: string  }}作者：Claude Code創建時間：2025-10-05Sprint：Sprint 7 Phase 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/request-auth';
import { createMeetingIntelligenceAnalyzer } from '@/lib/meeting';
import { AzureOpenAIService } from '@/lib/ai/azure-openai-service';
import { MeetingInfo, MeetingInsights } from '@/lib/meeting';

/**
 * POST /api/meeting-intelligence/recommendations
 *
 * 功能：生成會議建議
 *
 * 流程：
 * 1. 驗證用戶身份
 * 2. 驗證請求數據
 * 3. 調用AI建議生成
 * 4. 返回建議結果
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 身份驗證（支持Bearer token或Cookie）
    // ========================================================================
    const payload = await authenticateRequest(request);
    const userId = payload.userId;

    // ========================================================================
    // 2. 解析並驗證請求體
    // ========================================================================
    const body = await request.json();

    const { meetingInfo, insights } = body;

    if (!meetingInfo || !insights) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必需參數：meetingInfo, insights'
        },
        { status: 400 }
      );
    }

    // 驗證meetingInfo必填欄位
    if (!meetingInfo.title || !meetingInfo.startTime || !meetingInfo.endTime) {
      return NextResponse.json(
        {
          success: false,
          error: '會議信息缺少必填欄位'
        },
        { status: 400 }
      );
    }

    // 解析日期
    const meeting: MeetingInfo = {
      ...meetingInfo,
      startTime: new Date(meetingInfo.startTime),
      endTime: new Date(meetingInfo.endTime)
    };

    // ========================================================================
    // 3. 初始化AI服務並生成建議
    // ========================================================================

    // 配置Azure OpenAI服務
    const azureOpenAIConfig = {
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'
    };

    // 檢查環境變量配置
    if (!azureOpenAIConfig.apiKey || !azureOpenAIConfig.endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Azure OpenAI服務未配置',
          details: '請檢查環境變量：AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT'
        },
        { status: 500 }
      );
    }

    const aiService = new AzureOpenAIService(azureOpenAIConfig);
    const analyzer = createMeetingIntelligenceAnalyzer(aiService);

    // 生成建議
    const recommendations = await analyzer.generateRecommendations(
      meeting,
      insights as MeetingInsights,
      userId
    );

    // ========================================================================
    // 4. 返回建議結果
    // ========================================================================
    const recommendationId = `rec_${userId}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        recommendationId,
        meetingId: meeting.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('生成會議建議時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成建議時發生錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}
