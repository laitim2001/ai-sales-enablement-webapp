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