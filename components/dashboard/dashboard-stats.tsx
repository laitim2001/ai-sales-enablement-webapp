'use client'

import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCard {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

export function DashboardStats() {
  const stats: StatCard[] = [
    {
      title: '本月銷售額',
      value: 'RM 485,200',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      description: '比上月增加 RM 54,200'
    },
    {
      title: '成交客戶',
      value: '24',
      change: '+8',
      changeType: 'positive',
      icon: Users,
      description: '本月新增成交客戶'
    },
    {
      title: '轉換率',
      value: '32.4%',
      change: '-2.1%',
      changeType: 'negative',
      icon: Target,
      description: '潛在客戶轉換成交率'
    },
    {
      title: '預計收入',
      value: 'RM 892,400',
      change: '+18.2%',
      changeType: 'positive',
      icon: TrendingUp,
      description: '本季度預計總收入'
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className={`flex items-center space-x-1 ${
                stat.changeType === 'positive'
                  ? 'text-green-600'
                  : stat.changeType === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {stat.changeType === 'positive' && (
                  <TrendingUp className="h-3 w-3" />
                )}
                {stat.changeType === 'negative' && (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium">{stat.change}</span>
              </div>
              <span className="text-gray-500">從上月</span>
            </div>
            {stat.description && (
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>

          {/* 背景裝飾 */}
          <div className={`absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-10 ${
            stat.changeType === 'positive'
              ? 'bg-green-500'
              : stat.changeType === 'negative'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}></div>
        </Card>
      ))}
    </div>
  )
}