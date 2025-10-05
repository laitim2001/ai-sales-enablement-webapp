/**
 * 會議智能分析API路由
 *
 * 📋 檔案用途：
 * 提供AI驅動的會議信息分析和洞察提取
 *
 * 🔗 API端點：
 * - POST /api/meeting-intelligence/analyze - 分析會議信息
 *
 * 📊 請求體：
 * {
 *   meetingInfo: {
 *     title: string,
 *     description?: string,
 *     startTime: string (ISO 8601),
 *     endTime: string (ISO 8601),
 *     participants?: string[],
 *     location?: string,
 *     notes?: string
 *   }
 * }
 *
 * 📤 響應格式：
 * {
 *   success: boolean,
 *   data: {
 *     insights: MeetingInsights,
 *     analysisId: string,
 *     timestamp: string
 *   }
 * }
 *
 * 作者：Claude Code
 * 創建時間：2025-10-05
 * Sprint：Sprint 7 Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createMeetingIntelligenceAnalyzer } from '@/lib/meeting';
import { AzureOpenAIService } from '@/lib/ai/azure-openai-service';
import { MeetingInfo } from '@/lib/meeting';

/**
 * POST /api/meeting-intelligence/analyze
 *
 * 功能：分析會議信息並提取關鍵洞察
 *
 * 流程：
 * 1. 驗證用戶身份
 * 2. 驗證和解析會議信息
 * 3. 調用AI分析引擎
 * 4. 返回分析結果
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 身份驗證
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // ========================================================================
    // 2. 解析並驗證請求體
    // ========================================================================
    const body = await request.json();

    const { meetingInfo } = body;

    if (!meetingInfo) {
      return NextResponse.json(
        { success: false, error: '缺少必需參數：meetingInfo' },
        { status: 400 }
      );
    }

    // 驗證必填欄位
    if (!meetingInfo.title || !meetingInfo.startTime || !meetingInfo.endTime) {
      return NextResponse.json(
        {
          success: false,
          error: '會議信息缺少必填欄位：title, startTime, endTime'
        },
        { status: 400 }
      );
    }

    // 解析日期
    let startTime: Date;
    let endTime: Date;

    try {
      startTime = new Date(meetingInfo.startTime);
      endTime = new Date(meetingInfo.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('無效的日期格式');
      }

      if (startTime >= endTime) {
        throw new Error('開始時間必須早於結束時間');
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: '無效的日期時間格式',
          details: error instanceof Error ? error.message : '未知錯誤'
        },
        { status: 400 }
      );
    }

    // 構建MeetingInfo對象
    const meeting: MeetingInfo = {
      id: `meeting_${Date.now()}`,
      title: meetingInfo.title,
      description: meetingInfo.description,
      startTime,
      endTime,
      location: meetingInfo.location,
      participants: meetingInfo.participants || [],
      organizer: meetingInfo.organizer,
      meetingLink: meetingInfo.meetingLink,
      notes: meetingInfo.notes
    };

    // ========================================================================
    // 3. 初始化AI服務並調用分析引擎
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

    // 調用分析方法
    const insights = await analyzer.analyzeMeetingInfo(meeting, userId);

    // ========================================================================
    // 4. 返回分析結果
    // ========================================================================
    const analysisId = `analysis_${userId}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        insights,
        analysisId,
        meetingId: meeting.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('會議分析時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '會議分析時發生錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}
