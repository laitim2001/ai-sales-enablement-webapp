/**
 * ================================================================
 * AI銷售賦能平台 - AI洞察組件 (components/dashboard/ai-insights.tsx)
 * ================================================================
 *
 * 【組件功能】
 * AI驅動的智能洞察分析組件，提供基於數據的銷售建議和商機提示。
 * 展示不同類型的洞察：商機、警告、建議和成就。
 *
 * 【設計用途】
 * - 智能銷售助手和決策支援
 * - 客戶關係管理的主動提醒
 * - 銷售機會識別和風險預警
 * - 業務流程優化建議
 *
 * 【洞察類型】
 * • opportunity (商機): 潛在高價值客戶和銷售機會
 * • warning (警告): 客戶流失風險和警示信號
 * • suggestion (建議): 銷售策略和最佳實踐建議
 * • achievement (成就): 目標達成預測和正面反饋
 *
 * 【數據結構】
 * Insight interface:
 * • id - string - 洞察唯一識別符
 * • type - 'opportunity'|'warning'|'suggestion'|'achievement' - 洞察類型
 * • title - string - 洞察標題
 * • description - string - 詳細描述說明
 * • confidence - number - AI信心度百分比 (0-100)
 * • action - string - 可選操作標籤
 * • actionHref - string - 操作連結路徑
 *
 * 【視覺設計】
 * • 圖示編碼: 每種類型使用不同圖示和顏色
 *   - opportunity: TrendingUp + 綠色
 *   - warning: AlertTriangle + 紅色
 *   - suggestion: Lightbulb + 黃色
 *   - achievement: Star + 藍色
 * • 標籤設計: 顏色帶和類型標識
 * • 信心度指示: 進度條和百分比顯示
 * • 懸停效果: 邊框和陰影變化
 *
 * 【信心度指示】
 * • 90%+ : 綠色 (高信心度)
 * • 70-89%: 黃色 (中等信心度)
 * • <70% : 紅色 (低信心度)
 *
 * 【使用範例】
 * ```tsx
 * // 在Dashboard中使用
 * <AIInsights />
 *
 * // 自訂容器
 * <div className="w-full max-w-lg">
 *   <AIInsights />
 * </div>
 * ```
 *
 * 【相關檔案】
 * • components/ui/card.tsx - 卡片容器組件
 * • components/ui/button.tsx - 按鈕組件
 * • components/ui/badge.tsx - 標籤組件
 * • lucide-react - 圖示庫
 *
 * 【開發注意】
 * • 使用'use client'支援客戶端互動
 * • 洞察數據目前是模擬數據，應從AI服務API取得
 * • 信心度指示可結合機器學習模型的預測結果
 * • 考慮新增實時數據更新和通知系統
 * • 支援洞察的優先級排序和篩選
 * • 可集成更多 AI 服務(如 GPT, Gemini)
 * ================================================================
 */

'use client'

import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement'
  title: string
  description: string
  confidence: number
  action?: string
  actionHref?: string
}

export function AIInsights() {
  const insights: Insight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: '高價值客戶識別',
      description: 'ABC Corporation 顯示出強烈的購買意向，建議本週內主動聯繫',
      confidence: 92,
      action: '查看詳情',
      actionHref: '/dashboard/customers/abc-corp'
    },
    {
      id: '2',
      type: 'warning',
      title: '客戶流失風險',
      description: 'XYZ 公司已 14 天未回覆郵件，存在流失風險',
      confidence: 85,
      action: '立即跟進',
      actionHref: '/dashboard/customers/xyz-company'
    },
    {
      id: '3',
      type: 'suggestion',
      title: '銷售策略建議',
      description: '根據歷史數據，週二下午的電話成功率比平均高 23%',
      confidence: 78,
      action: '安排電話',
      actionHref: '/dashboard/calendar'
    },
    {
      id: '4',
      type: 'achievement',
      title: '目標達成預測',
      description: '以當前速度，本月有 94% 機會達成銷售目標',
      confidence: 94,
    }
  ]

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case 'achievement':
        return <Star className="h-4 w-4 text-blue-600" />
      default:
        return <Brain className="h-4 w-4 text-gray-600" />
    }
  }

  const getInsightBadgeColor = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'warning':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'suggestion':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'achievement':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getInsightTypeLabel = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return '商機'
      case 'warning':
        return '警告'
      case 'suggestion':
        return '建議'
      case 'achievement':
        return '成就'
      default:
        return '洞察'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="h-5 w-5 rounded bg-purple-600 flex items-center justify-center">
            <Brain className="h-3 w-3 text-white" />
          </div>
          <span>AI 洞察</span>
        </CardTitle>
        <CardDescription>
          基於數據分析的智能建議
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            >
              {/* 洞察標頭 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getInsightBadgeColor(insight.type)}`}
                  >
                    {getInsightTypeLabel(insight.type)}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {insight.confidence}% 信心度
                </div>
              </div>

              {/* 洞察內容 */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              {/* 信心度指示器 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">AI 信心度</span>
                  <span className="text-xs font-medium text-gray-700">
                    {insight.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      insight.confidence >= 90
                        ? 'bg-green-500'
                        : insight.confidence >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${insight.confidence}%` }}
                  ></div>
                </div>
              </div>

              {/* 操作按鈕 */}
              {insight.action && insight.actionHref && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                  asChild
                >
                  <a href={insight.actionHref}>
                    <span className="text-xs">{insight.action}</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 底部操作 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            asChild
          >
            <a href="/dashboard/ai-insights">
              查看所有洞察分析
              <ArrowRight className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}