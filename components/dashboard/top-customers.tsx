/**
 * @fileoverview ================================================================AI銷售賦能平台 - 重要客戶組件 (components/dashboard/top-customers.tsx)================================================================【組件功能】展示高價值潛在客戶和成交機會的組件。包含客戶基本資訊、成交機率、聯絡資訊和下一步行動。【設計用途】- 銷售回顔和客戶關係管理- 高價值客戶的優先級管理- 銷售機會追蹤和預測- 客戶關係狀態監控【客戶狀態】• hot (熱門): 高興趣、成交機率高 (紅色)• warm (溫和): 有興趣、正在跟進 (黃色)• cold (冷淡): 低興趣、需要重新激活 (藍色)• closed (成交): 已成功成交 (綠色)【數據結構】Customer interface:• id - string - 客戶唯一識別符• company - string - 公司名稱• contact - string - 聯絡人名稱• email - string - 電子郵件地址• phone - string - 聯絡電話• location - string - 地理位置• value - string - 預期價值 (馬來西亞令吉)• status - hot|warm|cold|closed - 客戶狀態• lastContact - string - 最後聯絡時間• nextAction - string - 下一步行動計畫• probability - number - 成交機率百分比 (0-100)【視覺特性】• 頭像系統: 使用聯絡人名字縮寫產生頭像• 狀態標籤: 不同顏色代表不同客戶狀態• 成交機率: 進度條和百分比顯示  - 80%+: 綠色 (高機率)  - 60-79%: 黃色 (中等機率)  - <60%: 紅色 (低機率)• 快速操作: 電話和郵件快速聯絡按鈕• 懸停效果: 卡片懸停時邊框和陰影變化【統計資訊】• 熱門客戶數量: 狀態為'hot'的客戶統計• 總預期價值: 所有客戶價值總和 (千位数)【使用範例】```tsx// 在Dashboard中使用<TopCustomers />// 自訂樣式<div className="col-span-1">  <TopCustomers /></div>```【相關檔案】• components/ui/card.tsx - 卡片容器組件• components/ui/button.tsx - 按鈕組件• components/ui/badge.tsx - 標籤組件• components/ui/avatar.tsx - 頭像組件• lucide-react - 圖示庫【開發注意】• 使用'use client'支援客戶端互動• 客戶數據目前是模擬數據，應從CRM API取得• 考慮新增客戶詳細頁面連結• 支援客戶排序和篩選功能• 可新增更多聯絡方式(社交媒體、視訊會議)• 考慮集成客戶活動時間軸和互動歷史================================================================
 * @module components/dashboard/top-customers
 * @description
 * ================================================================AI銷售賦能平台 - 重要客戶組件 (components/dashboard/top-customers.tsx)================================================================【組件功能】展示高價值潛在客戶和成交機會的組件。包含客戶基本資訊、成交機率、聯絡資訊和下一步行動。【設計用途】- 銷售回顔和客戶關係管理- 高價值客戶的優先級管理- 銷售機會追蹤和預測- 客戶關係狀態監控【客戶狀態】• hot (熱門): 高興趣、成交機率高 (紅色)• warm (溫和): 有興趣、正在跟進 (黃色)• cold (冷淡): 低興趣、需要重新激活 (藍色)• closed (成交): 已成功成交 (綠色)【數據結構】Customer interface:• id - string - 客戶唯一識別符• company - string - 公司名稱• contact - string - 聯絡人名稱• email - string - 電子郵件地址• phone - string - 聯絡電話• location - string - 地理位置• value - string - 預期價值 (馬來西亞令吉)• status - hot|warm|cold|closed - 客戶狀態• lastContact - string - 最後聯絡時間• nextAction - string - 下一步行動計畫• probability - number - 成交機率百分比 (0-100)【視覺特性】• 頭像系統: 使用聯絡人名字縮寫產生頭像• 狀態標籤: 不同顏色代表不同客戶狀態• 成交機率: 進度條和百分比顯示  - 80%+: 綠色 (高機率)  - 60-79%: 黃色 (中等機率)  - <60%: 紅色 (低機率)• 快速操作: 電話和郵件快速聯絡按鈕• 懸停效果: 卡片懸停時邊框和陰影變化【統計資訊】• 熱門客戶數量: 狀態為'hot'的客戶統計• 總預期價值: 所有客戶價值總和 (千位数)【使用範例】```tsx// 在Dashboard中使用<TopCustomers />// 自訂樣式<div className="col-span-1">  <TopCustomers /></div>```【相關檔案】• components/ui/card.tsx - 卡片容器組件• components/ui/button.tsx - 按鈕組件• components/ui/badge.tsx - 標籤組件• components/ui/avatar.tsx - 頭像組件• lucide-react - 圖示庫【開發注意】• 使用'use client'支援客戶端互動• 客戶數據目前是模擬數據，應從CRM API取得• 考慮新增客戶詳細頁面連結• 支援客戶排序和篩選功能• 可新增更多聯絡方式(社交媒體、視訊會議)• 考慮集成客戶活動時間軸和互動歷史================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import {
  Building2,
  TrendingUp,
  Calendar,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Customer {
  id: string
  company: string
  contact: string
  email: string
  phone: string
  location: string
  value: string
  status: 'hot' | 'warm' | 'cold' | 'closed'
  lastContact: string
  nextAction: string
  probability: number
}

export function TopCustomers() {
  const customers: Customer[] = [
    {
      id: '1',
      company: 'ABC Corporation',
      contact: 'John Chen',
      email: 'john@abc-corp.com',
      phone: '+60 12-345-6789',
      location: '吉隆坡',
      value: 'RM 320,000',
      status: 'hot',
      lastContact: '今天',
      nextAction: '發送合約',
      probability: 92
    },
    {
      id: '2',
      company: 'XYZ Technology',
      contact: 'Sarah Lim',
      email: 'sarah@xyz-tech.com',
      phone: '+60 12-987-6543',
      location: '新山',
      value: 'RM 185,000',
      status: 'warm',
      lastContact: '2 天前',
      nextAction: '安排Demo',
      probability: 75
    },
    {
      id: '3',
      company: 'DEF Industries',
      contact: 'Michael Wong',
      email: 'michael@def-ind.com',
      phone: '+60 12-555-7777',
      location: '檳城',
      value: 'RM 450,000',
      status: 'warm',
      lastContact: '1 週前',
      nextAction: '技術會議',
      probability: 68
    },
    {
      id: '4',
      company: 'GHI Solutions',
      contact: 'Lisa Tan',
      email: 'lisa@ghi-sol.com',
      phone: '+60 12-888-9999',
      location: '新加坡',
      value: 'RM 275,000',
      status: 'cold',
      lastContact: '2 週前',
      nextAction: '重新聯繫',
      probability: 45
    }
  ]

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'hot':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'warm':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'cold':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'closed':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: Customer['status']) => {
    switch (status) {
      case 'hot':
        return '熱門'
      case 'warm':
        return '溫和'
      case 'cold':
        return '冷淡'
      case 'closed':
        return '成交'
      default:
        return '未知'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>重要客戶</span>
            </CardTitle>
            <CardDescription className="mt-1">
              高價值潛在客戶和成交機會
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            管理客戶
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            >
              {/* 客戶基本資訊 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                      {getInitials(customer.contact)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {customer.company}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {customer.contact}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(customer.status)}`}
                  >
                    {getStatusLabel(customer.status)}
                  </Badge>
                  <div className="text-sm font-semibold text-gray-900">
                    {customer.value}
                  </div>
                </div>
              </div>

              {/* 聯絡資訊 */}
              <div className="grid grid-cols-1 gap-2 mb-3 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>{customer.location}</span>
                  <span>•</span>
                  <span>最後聯繫: {customer.lastContact}</span>
                </div>
              </div>

              {/* 成交機率 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">成交機率</span>
                  <span className="text-xs font-medium text-gray-700">
                    {customer.probability}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      customer.probability >= 80
                        ? 'bg-green-500'
                        : customer.probability >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${customer.probability}%` }}
                  ></div>
                </div>
              </div>

              {/* 下一步行動 */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  <strong>下一步:</strong> {customer.nextAction}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-50"
                    title="撥打電話"
                  >
                    <Phone className="h-3 w-3 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-green-50"
                    title="發送郵件"
                  >
                    <Mail className="h-3 w-3 text-green-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 客戶統計 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-red-600">
                {customers.filter(c => c.status === 'hot').length}
              </div>
              <div className="text-xs text-gray-500">熱門客戶</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                RM {(customers.reduce((sum, c) => sum + parseInt(c.value.replace(/[^\d]/g, '')), 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-gray-500">總預期價值</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}