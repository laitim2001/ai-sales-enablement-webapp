/**
 * @fileoverview 監控系統初始化 API 路由功能：- 手動啟動/停止監控服務- 查詢監控系統狀態- 重新初始化監控系統作者：Claude Code創建時間：2025-09-29
 * @module app/api/monitoring/init/route
 * @description
 * 監控系統初始化 API 路由功能：- 手動啟動/停止監控服務- 查詢監控系統狀態- 重新初始化監控系統作者：Claude Code創建時間：2025-09-29
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringInitializer, getMonitoringStatus } from '@/lib/startup/monitoring-initializer';

/**
 * 獲取監控系統狀態
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = getMonitoringStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: status.initialized
          ? '監控系統正在運行'
          : '監控系統未初始化'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('獲取監控狀態失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'MONITORING_STATUS_FAILED',
      message: '獲取監控狀態失敗',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * 初始化或管理監控系統
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action } = await request.json();
    const initializer = getMonitoringInitializer();

    switch (action) {
      case 'start':
      case 'initialize':
        await initializer.initialize();
        return NextResponse.json({
          success: true,
          data: {
            action: 'initialize',
            status: getMonitoringStatus(),
            message: '監控系統已成功初始化'
          },
          timestamp: new Date().toISOString()
        });

      case 'stop':
      case 'shutdown':
        await initializer.shutdown();
        return NextResponse.json({
          success: true,
          data: {
            action: 'shutdown',
            status: getMonitoringStatus(),
            message: '監控系統已關閉'
          },
          timestamp: new Date().toISOString()
        });

      case 'restart':
      case 'reinitialize':
        await initializer.reinitialize();
        return NextResponse.json({
          success: true,
          data: {
            action: 'reinitialize',
            status: getMonitoringStatus(),
            message: '監控系統已重新初始化'
          },
          timestamp: new Date().toISOString()
        });

      case 'status':
        const status = getMonitoringStatus();
        return NextResponse.json({
          success: true,
          data: {
            action: 'status',
            ...status,
            message: status.initialized
              ? '監控系統正在運行'
              : '監控系統未初始化'
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'INVALID_ACTION',
          message: '無效的操作',
          availableActions: ['start', 'stop', 'restart', 'status']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('監控系統操作失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'MONITORING_OPERATION_FAILED',
      message: '監控系統操作失敗',
      details: error.message
    }, { status: 500 });
  }
}