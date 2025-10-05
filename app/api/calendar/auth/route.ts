/**
 * Calendar OAuth認證API路由
 *
 * 📋 功能說明：
 * - 生成Microsoft OAuth授權URL
 * - 處理OAuth回調
 * - 管理訪問token
 *
 * 🔗 路由：
 * - GET /api/calendar/auth - 獲取授權URL
 * - POST /api/calendar/auth/callback - 處理OAuth回調
 *
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-service';
import { createGraphOAuth, MemoryTokenStore } from '@/lib/calendar/microsoft-graph-oauth';

// Token存儲實例（生產環境應使用數據庫存儲）
const tokenStore = new MemoryTokenStore();

// OAuth客戶端實例
const oauth = createGraphOAuth();

/**
 * GET /api/calendar/auth
 * 獲取Microsoft OAuth授權URL
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的認證token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 生成狀態參數（包含用戶ID）
    const state = JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2)
    });

    // 獲取授權URL
    const authUrl = oauth.getAuthorizationUrl(state);

    return NextResponse.json({
      authUrl,
      state
    });

  } catch (error) {
    console.error('Calendar OAuth auth error:', error);
    return NextResponse.json(
      { error: '生成授權URL失敗' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/auth/callback
 * 處理OAuth回調並獲取訪問token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return NextResponse.json(
        { error: '缺少必需參數：code 或 state' },
        { status: 400 }
      );
    }

    // 驗證狀態參數
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的state參數' },
        { status: 400 }
      );
    }

    const { userId, timestamp } = stateData;

    // 檢查狀態過期（5分鐘）
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: '授權已過期，請重新授權' },
        { status: 400 }
      );
    }

    // 使用授權碼獲取token
    const tokenResponse = await oauth.acquireTokenByCode(code);

    // 保存token到存儲
    await tokenStore.saveToken(userId, tokenResponse);

    return NextResponse.json({
      success: true,
      message: 'Calendar OAuth授權成功',
      expiresOn: tokenResponse.expiresOn,
      scopes: tokenResponse.scopes
    });

  } catch (error) {
    console.error('Calendar OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth回調處理失敗' },
      { status: 500 }
    );
  }
}
