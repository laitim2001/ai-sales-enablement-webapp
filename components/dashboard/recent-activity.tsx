'use client'

import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'chat' | 'customer'
  title: string
  description: string
  customer: string
  timestamp: string
  status: 'completed' | 'pending' | 'urgent'
  amount?: string
}

export function RecentActivity() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'call',
      title: '客戶電話會議',
      description: '討論 Q4 合作計劃和預算分配',
      customer: 'ABC Corporation',
      timestamp: '1 小時前',
      status: 'completed',
      amount: 'RM 150,000'
    },
    {
      id: '2',
      type: 'proposal',
      title: '提案文件生成',
      description: 'AI 自動生成個人化提案文件',
      customer: 'XYZ Technology',
      timestamp: '2 小時前',
      status: 'completed',
      amount: 'RM 85,000'
    },
    {
      id: '3',
      type: 'email',
      title: '跟進郵件發送',
      description: '產品demo後的後續跟進郵件',
      customer: 'DEF Industries',
      timestamp: '3 小時前',
      status: 'pending'
    },
    {
      id: '4',
      type: 'meeting',
      title: '產品展示會議',
      description: '現場產品演示和Q&A環節',
      customer: 'GHI Solutions',
      timestamp: '4 小時前',
      status: 'completed',
      amount: 'RM 320,000'
    },
    {
      id: '5',
      type: 'customer',
      title: '新客戶註冊',
      description: 'CRM 系統新增潛在客戶資料',
      customer: 'JKL Enterprises',
      timestamp: '5 小時前',
      status: 'completed'
    },
    {
      id: '6',
      type: 'chat',
      title: 'AI 助手諮詢',
      description: '查詢競爭對手分析報告',
      customer: '內部使用',
      timestamp: '6 小時前',
      status: 'completed'
    }
  ]

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      case 'proposal':
        return <FileText className="h-4 w-4" />
      case 'chat':
        return <MessageSquare className="h-4 w-4" />
      case 'customer':
        return <UserPlus className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'pending':
        return '進行中'
      case 'urgent':
        return '緊急'
      default:
        return '未知'
    }
  }

  const getActivityTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return '電話'
      case 'email':
        return '郵件'
      case 'meeting':
        return '會議'
      case 'proposal':
        return '提案'
      case 'chat':
        return 'AI 助手'
      case 'customer':
        return '客戶'
      default:
        return '活動'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>最近活動</span>
            </CardTitle>
            <CardDescription className="mt-1">
              最新的銷售活動和系統互動記錄
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            查看全部
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-4 pb-4 ${
                index !== activities.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 活動圖示 */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'call' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'email' ? 'bg-green-100 text-green-600' :
                activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                activity.type === 'proposal' ? 'bg-orange-100 text-orange-600' :
                activity.type === 'chat' ? 'bg-pink-100 text-pink-600' :
                activity.type === 'customer' ? 'bg-indigo-100 text-indigo-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* 活動內容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(activity.status)}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  {activity.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{activity.customer}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>

                  {activity.amount && (
                    <div className="text-sm font-semibold text-green-600">
                      {activity.amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 活動統計 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">24</div>
              <div className="text-xs text-gray-500">今日活動</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">18</div>
              <div className="text-xs text-gray-500">已完成</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">6</div>
              <div className="text-xs text-gray-500">待處理</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}