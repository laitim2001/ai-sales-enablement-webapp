/**
 * 智能助手聊天API
 *
 * 功能：
 * - 處理用戶查詢
 * - Azure OpenAI GPT-4集成
 * - 上下文管理
 * - 對話歷史追蹤
 *
 * @author Claude Code
 * @date 2025-10-05
 * @epic Sprint 7 - 會議準備與智能助手
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { AzureOpenAI } from 'openai';

// Azure OpenAI配置
const azureOpenAI = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_ID_GPT4 || 'gpt-4'
});

/**
 * 系統提示詞
 */
const SYSTEM_PROMPT = `你是一個專業的銷售賦能AI助手，專門協助銷售團隊提高工作效率。

你的主要功能包括：
1. **快速查找**：幫助用戶快速找到知識庫文檔、提案模板、客戶信息
2. **智能問答**：回答有關產品、服務、銷售流程的問題
3. **任務協助**：協助創建會議準備包、提案、模板
4. **數據洞察**：提供客戶分析、銷售趨勢等見解

回答規則：
- 簡潔明了，提供可操作的建議
- 使用繁體中文回答
- 如果不確定答案，誠實說明並建議替代方案
- 適時提供相關連結或快捷操作

請始終保持專業、友好和高效。`;

/**
 * POST /api/assistant/chat
 * 發送聊天訊息
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 解析請求
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 構建對話上下文
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    // 調用Azure OpenAI
    const completion = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const assistantMessage = completion.choices[0]?.message?.content || '抱歉，我無法生成回應。';

    // 返回響應
    return NextResponse.json({
      message: assistantMessage,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Assistant Chat Error]', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assistant/chat
 * 獲取對話建議
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 返回快捷操作建議
    const suggestions = [
      {
        label: '查找客戶資料',
        action: '幫我查找最近的客戶資料'
      },
      {
        label: '創建提案',
        action: '我需要創建一份銷售提案'
      },
      {
        label: '準備會議',
        action: '幫我準備明天的客戶會議'
      },
      {
        label: '查看知識庫',
        action: '有哪些產品文檔可以參考？'
      }
    ];

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('[Assistant Suggestions Error]', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
