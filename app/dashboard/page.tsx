/**
 * ================================================================
 * AI銷售賦能平台 - 主儀表板頁面 (app/dashboard/page.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 提供銷售團隊的核心業務儀表板，整合關鍵績效指標、實時數據和快速操作入口，
 * 為用戶提供一站式的業務概覽和日常工作管理中心。
 *
 * 【主要職責】
 * • 銷售數據總覽 - 展示核心KPI統計卡片和趨勢圖表
 * • 活動監控中心 - 顯示最近業務活動和重要事件通知
 * • 快速操作入口 - 提供常用功能的便捷訪問途徑
 * • AI智能洞察 - 集成AI分析結果和個性化建議
 * • 客戶關係管理 - 重點客戶狀態和互動記錄
 *
 * 【頁面結構】
 * • 頁面標題區 - 歡迎信息和整體描述
 * • 統計卡片區 - DashboardStats組件展示核心指標
 * • 左側主要區域(2/3寬度) - SalesChart圖表 + RecentActivity活動列表
 * • 右側輔助區域(1/3寬度) - QuickActions + AIInsights + TopCustomers
 *
 * 【用戶流程】
 * 1. 用戶登入後首先到達此頁面，快速了解整體業務狀況
 * 2. 查看統計卡片獲取關鍵指標概覽
 * 3. 分析銷售趨勢圖表，識別業務機會和問題
 * 4. 檢視最近活動，跟進重要事件和任務
 * 5. 使用快速操作訪問常用功能
 * 6. 查看AI洞察獲取智能建議
 * 7. 關注重要客戶狀態和需求
 *
 * 【相關檔案】
 * • components/dashboard/dashboard-stats.tsx - 統計卡片組件
 * • components/dashboard/sales-chart.tsx - 銷售趨勢圖表
 * • components/dashboard/recent-activity.tsx - 活動列表組件
 * • components/dashboard/quick-actions.tsx - 快速操作組件
 * • components/dashboard/ai-insights.tsx - AI洞察組件
 * • components/dashboard/top-customers.tsx - 重要客戶組件
 * • app/dashboard/layout.tsx - Dashboard佈局模板
 *
 * 【開發注意】
 * • 響應式設計：lg:grid-cols-3確保大螢幕三欄佈局，小螢幕單欄堆疊
 * • 性能優化：各組件應支持懶載入和數據預取
 * • 數據刷新：實時數據更新機制和錯誤處理
 * • 可訪問性：keyboard navigation和screen reader支持
 * • 個性化：根據用戶角色和權限動態調整內容
 */

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