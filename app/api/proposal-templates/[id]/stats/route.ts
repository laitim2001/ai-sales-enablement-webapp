/**
 * @fileoverview 提案範本統計 API 路由功能：- 獲取範本使用統計數據- 分析範本生成效果- 提供範本優化建議- 生成使用報告作者：Claude Code創建時間：2025-09-28
 * @module app/api/proposal-templates/[id]/stats/route
 * @description
 * 提案範本統計 API 路由功能：- 獲取範本使用統計數據- 分析範本生成效果- 提供範本優化建議- 生成使用報告作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 獲取範本統計數據
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的統計數據
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const templateId = params.id;

    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // 默認30天
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // 檢查範本是否存在
    const template = await prisma.proposalTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        usage_count: true,
        variables: true,
        created_at: true
      }
    });

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'TEMPLATE_NOT_FOUND',
        message: '範本不存在'
      }, { status: 404 });
    }

    // 獲取生成統計
    const [
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      averageStats,
      recentGenerations,
      variableUsageStats
    ] = await Promise.all([
      // 總生成次數
      prisma.proposalGeneration.count({
        where: { template_id: templateId }
      }),

      // 成功生成次數
      prisma.proposalGeneration.count({
        where: {
          template_id: templateId,
          status: 'COMPLETED'
        }
      }),

      // 失敗生成次數
      prisma.proposalGeneration.count({
        where: {
          template_id: templateId,
          status: 'FAILED'
        }
      }),

      // 平均統計
      prisma.proposalGeneration.aggregate({
        where: {
          template_id: templateId,
          status: 'COMPLETED',
          quality_score: { not: null }
        },
        _avg: {
          quality_score: true,
          generation_time_ms: true
        }
      }),

      // 最近生成記錄
      prisma.proposalGeneration.findMany({
        where: { template_id: templateId },
        include: {
          generator: {
            select: { first_name: true, last_name: true, email: true }
          },
          customer: {
            select: { company_name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      }),

      // 變數使用統計
      getVariableUsageStats(templateId, template.variables as Record<string, any>)
    ]);

    // 計算時間序列數據
    const timeSeriesData = await getTimeSeriesData(templateId, startDate);

    // 計算成功率
    const successRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 0;

    // 分析最常用的變數
    const mostUsedVariables = await getMostUsedVariables(templateId, 5);

    // 獲取品質分數分佈
    const qualityDistribution = await getQualityScoreDistribution(templateId);

    // 計算使用趨勢
    const usageTrend = await getUsageTrend(templateId, 7); // 最近7天

    return NextResponse.json({
      success: true,
      data: {
        // 基本統計
        totalGenerations,
        successfulGenerations,
        failedGenerations,
        successRate: Math.round(successRate * 100) / 100,

        // 平均指標
        averageQualityScore: Math.round((averageStats._avg.quality_score || 0) * 100) / 100,
        averageGenerationTime: Math.round(averageStats._avg.generation_time_ms || 0),

        // 變數統計
        mostUsedVariables,
        variableUsageStats,

        // 品質分析
        qualityDistribution,

        // 時間分析
        timeSeriesData,
        usageTrend,

        // 最近記錄
        recentGenerations: recentGenerations.map(gen => ({
          id: gen.id,
          title: gen.title,
          status: gen.status,
          qualityScore: gen.quality_score,
          createdAt: gen.created_at,
          generator: gen.generator,
          customer: gen.customer
        })),

        // 優化建議
        recommendations: generateRecommendations({
          totalGenerations,
          successRate,
          averageQualityScore: averageStats._avg.quality_score || 0,
          mostUsedVariables,
          qualityDistribution
        })
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('獲取範本統計失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '獲取統計數據時發生錯誤'
    }, { status: 500 });
  }
}

/**
 * 獲取變數使用統計
 */
async function getVariableUsageStats(templateId: string, templateVariables: Record<string, any>) {
  const generations = await prisma.proposalGeneration.findMany({
    where: {
      template_id: templateId,
      status: 'COMPLETED'
    },
    select: {
      variables: true
    }
  });

  const variableStats: Record<string, { used: number; total: number }> = {};

  // 初始化統計
  Object.keys(templateVariables).forEach(varName => {
    variableStats[varName] = { used: 0, total: generations.length };
  });

  // 統計使用情況
  generations.forEach(gen => {
    const variables = gen.variables as Record<string, any>;
    Object.keys(templateVariables).forEach(varName => {
      if (variables[varName] && variables[varName] !== '') {
        variableStats[varName].used++;
      }
    });
  });

  return variableStats;
}

/**
 * 獲取時間序列數據
 */
async function getTimeSeriesData(templateId: string, startDate: Date) {
  const generations = await prisma.proposalGeneration.findMany({
    where: {
      template_id: templateId,
      created_at: { gte: startDate }
    },
    select: {
      created_at: true,
      status: true
    }
  });

  // 按日期分組
  const dailyData: Record<string, { date: string; total: number; successful: number }> = {};

  generations.forEach(gen => {
    const date = gen.created_at.toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { date, total: 0, successful: 0 };
    }
    dailyData[date].total++;
    if (gen.status === 'COMPLETED') {
      dailyData[date].successful++;
    }
  });

  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 獲取最常用變數
 */
async function getMostUsedVariables(templateId: string, limit: number) {
  const generations = await prisma.proposalGeneration.findMany({
    where: {
      template_id: templateId,
      status: 'COMPLETED'
    },
    select: {
      variables: true
    }
  });

  const variableUsage: Record<string, number> = {};

  generations.forEach(gen => {
    const variables = gen.variables as Record<string, any>;
    Object.entries(variables).forEach(([varName, value]) => {
      if (value && value !== '') {
        variableUsage[varName] = (variableUsage[varName] || 0) + 1;
      }
    });
  });

  return Object.entries(variableUsage)
    .map(([name, usageCount]) => ({ name, usageCount }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * 獲取品質分數分佈
 */
async function getQualityScoreDistribution(templateId: string) {
  const generations = await prisma.proposalGeneration.findMany({
    where: {
      template_id: templateId,
      status: 'COMPLETED',
      quality_score: { not: null }
    },
    select: {
      quality_score: true
    }
  });

  const distribution = {
    excellent: 0, // 90-100
    good: 0,      // 70-89
    average: 0,   // 50-69
    poor: 0       // 0-49
  };

  generations.forEach(gen => {
    const score = gen.quality_score || 0;
    if (score >= 90) distribution.excellent++;
    else if (score >= 70) distribution.good++;
    else if (score >= 50) distribution.average++;
    else distribution.poor++;
  });

  return distribution;
}

/**
 * 獲取使用趨勢
 */
async function getUsageTrend(templateId: string, days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const currentPeriod = await prisma.proposalGeneration.count({
    where: {
      template_id: templateId,
      created_at: { gte: startDate, lte: endDate }
    }
  });

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  const previousPeriod = await prisma.proposalGeneration.count({
    where: {
      template_id: templateId,
      created_at: { gte: previousStartDate, lt: startDate }
    }
  });

  const change = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;

  return {
    current: currentPeriod,
    previous: previousPeriod,
    change: Math.round(change * 100) / 100,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
}

/**
 * 生成優化建議
 */
function generateRecommendations(stats: {
  totalGenerations: number;
  successRate: number;
  averageQualityScore: number;
  mostUsedVariables: Array<{ name: string; usageCount: number }>;
  qualityDistribution: any;
}): string[] {
  const recommendations: string[] = [];

  // 使用量建議
  if (stats.totalGenerations === 0) {
    recommendations.push('範本尚未被使用，考慮推廣給團隊成員使用');
  } else if (stats.totalGenerations < 10) {
    recommendations.push('使用量較低，可以考慮優化範本內容或增加推廣');
  }

  // 成功率建議
  if (stats.successRate < 80) {
    recommendations.push('成功率偏低，建議檢查範本語法和變數定義');
  } else if (stats.successRate >= 95) {
    recommendations.push('成功率很高，範本品質優秀');
  }

  // 品質分數建議
  if (stats.averageQualityScore < 60) {
    recommendations.push('平均品質分數較低，建議優化範本內容和結構');
  } else if (stats.averageQualityScore >= 80) {
    recommendations.push('品質分數優秀，可以考慮設為預設範本');
  }

  // 變數使用建議
  if (stats.mostUsedVariables.length > 0) {
    const topVariable = stats.mostUsedVariables[0];
    recommendations.push(`變數 "${topVariable.name}" 使用頻率最高，確保其預設值設置合理`);
  }

  // 品質分佈建議
  if (stats.qualityDistribution.poor > stats.qualityDistribution.excellent) {
    recommendations.push('低品質生成較多，建議檢查提示工程和變數完整性');
  }

  return recommendations;
}