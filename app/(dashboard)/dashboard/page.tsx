import { Metadata } from 'next'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopCustomers } from '@/components/dashboard/top-customers'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { AIInsights } from '@/components/dashboard/ai-insights'

export const metadata: Metadata = {
  title: '儀表板',
  description: '銷售績效總覽和關鍵指標',
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">儀表板</h1>
        <p className="mt-1 text-sm text-gray-600">
          歡迎回來！查看您的銷售績效和最新動態
        </p>
      </div>

      {/* 統計卡片 */}
      <DashboardStats />

      {/* 主要內容網格 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* 左側欄位 - 2/3 寬度 */}
        <div className="lg:col-span-2 space-y-8">

          {/* 銷售趨勢圖表 */}
          <SalesChart />

          {/* 最近活動 */}
          <RecentActivity />

        </div>

        {/* 右側欄位 - 1/3 寬度 */}
        <div className="space-y-8">

          {/* 快速操作 */}
          <QuickActions />

          {/* AI 洞察 */}
          <AIInsights />

          {/* 重要客戶 */}
          <TopCustomers />

        </div>
      </div>
    </div>
  )
}