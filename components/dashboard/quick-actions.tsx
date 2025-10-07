/**
 * @fileoverview ================================================================AI銷售賦能平台 - 快速操作組件 (components/dashboard/quick-actions.tsx)================================================================【組件功能】Dashboard快速操作入口，提供常用功能的快速訪問。以網格式佈局展示主要銷售活動和工具。【設計用途】- 新手引導和常用功能推廣- 提高工作效率的快速操作面板- Dashboard主頁的導航中心- 銷售流程的關鍵節點指引【功能項目】• 新增客戶: 建立新的客戶資料 (藍色主題)• AI 助手: 開始智能對話 (紫色主題)• 生成提案: 創建個人化提案 (綠色主題)• 知識搜尋: 查找產品資訊 (橙色主題)• 安排會議: 預約客戶會面 (紅色主題)• 聯絡客戶: 撥打或發送郵件 (陰藍色主題)【數據結構】QuickAction interface:• title - string - 功能標題• description - string - 功能簡述• href - string - 目標頁面路徑• icon - React.ComponentType - Lucide圖示組件• color - string - 圖示顏色CSS類別• bgColor - string - 背景顏色CSS類別【視覺設計】• 2列網格佈局: 最大化空間利用率• 垂直對齊: flex-col 保持整齊外觀• 顏色編碼: 每個功能使用不同顏色主題• 懸停效果: 邊框和背景顏色變化• 微動效: transition-all duration-200【統計資訊】• 待跟進客戶: 42人 (模擬數據)• 今日會議: 8個 (模擬數據)【使用範例】```tsx// 在Dashboard中使用<QuickActions />// 自訂容器樣式<div className="w-full max-w-md">  <QuickActions /></div>```【相關檔案】• components/ui/card.tsx - 卡片容器組件• components/ui/button.tsx - 按鈕組件• next/link - Next.js 路由組件• lucide-react - 圖示庫【開發注意】• 使用'use client'支援客戶端互動• 所有連結使用Next.js Link組件• 統計數據目前是硬編碼，應從API取得• 功能項目可根據用戶角色動態調整• 考慮新增權限檢查和個人化頁面• 可新增操作記錄和分析統計• 支援自訂配置和排序功能================================================================
 * @module components/dashboard/quick-actions
 * @description
 * ================================================================AI銷售賦能平台 - 快速操作組件 (components/dashboard/quick-actions.tsx)================================================================【組件功能】Dashboard快速操作入口，提供常用功能的快速訪問。以網格式佈局展示主要銷售活動和工具。【設計用途】- 新手引導和常用功能推廣- 提高工作效率的快速操作面板- Dashboard主頁的導航中心- 銷售流程的關鍵節點指引【功能項目】• 新增客戶: 建立新的客戶資料 (藍色主題)• AI 助手: 開始智能對話 (紫色主題)• 生成提案: 創建個人化提案 (綠色主題)• 知識搜尋: 查找產品資訊 (橙色主題)• 安排會議: 預約客戶會面 (紅色主題)• 聯絡客戶: 撥打或發送郵件 (陰藍色主題)【數據結構】QuickAction interface:• title - string - 功能標題• description - string - 功能簡述• href - string - 目標頁面路徑• icon - React.ComponentType - Lucide圖示組件• color - string - 圖示顏色CSS類別• bgColor - string - 背景顏色CSS類別【視覺設計】• 2列網格佈局: 最大化空間利用率• 垂直對齊: flex-col 保持整齊外觀• 顏色編碼: 每個功能使用不同顏色主題• 懸停效果: 邊框和背景顏色變化• 微動效: transition-all duration-200【統計資訊】• 待跟進客戶: 42人 (模擬數據)• 今日會議: 8個 (模擬數據)【使用範例】```tsx// 在Dashboard中使用<QuickActions />// 自訂容器樣式<div className="w-full max-w-md">  <QuickActions /></div>```【相關檔案】• components/ui/card.tsx - 卡片容器組件• components/ui/button.tsx - 按鈕組件• next/link - Next.js 路由組件• lucide-react - 圖示庫【開發注意】• 使用'use client'支援客戶端互動• 所有連結使用Next.js Link組件• 統計數據目前是硬編碼，應從API取得• 功能項目可根據用戶角色動態調整• 考慮新增權限檢查和個人化頁面• 可新增操作記錄和分析統計• 支援自訂配置和排序功能================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import Link from 'next/link'
import {
  Plus,
  MessageSquare,
  FileText,
  Search,
  Calendar,
  Users,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      title: '新增客戶',
      description: '建立新的客戶資料',
      href: '/dashboard/customers/new',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'AI 助手',
      description: '開始智能對話',
      href: '/dashboard/chat',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: '生成提案',
      description: '創建個人化提案',
      href: '/dashboard/proposals/new',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      title: '知識搜索',
      description: '查找產品資訊',
      href: '/dashboard/search',
      icon: Search,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      title: '安排會議',
      description: '預約客戶會面',
      href: '/dashboard/calendar/new',
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      title: '聯絡客戶',
      description: '撥打或發送郵件',
      href: '/dashboard/communications',
      icon: Phone,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center">
            <Plus className="h-3 w-3 text-white" />
          </div>
          <span>快速操作</span>
        </CardTitle>
        <CardDescription>
          常用功能快速入口
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                className={`w-full h-auto p-4 flex flex-col items-center space-y-2 ${action.bgColor} border border-transparent hover:border-gray-200 transition-all duration-200`}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-900">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        {/* 快速統計 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">42</div>
              <div className="text-xs text-gray-500">待跟進客戶</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">8</div>
              <div className="text-xs text-gray-500">今日會議</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}