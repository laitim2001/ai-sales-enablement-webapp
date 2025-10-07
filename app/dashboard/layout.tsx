/**
 * @fileoverview ================================================================檔案名稱: Dashboard Layout檔案用途: AI銷售賦能平台的主要儀表板佈局組件開發階段: 生產就緒================================================================功能索引:1. 頁面佈局管理 - 統一管理儀表板的整體結構和樣式2. 響應式設計 - 提供桌面版和行動版不同的導航體驗3. 認證保護 - 使用ProtectedRoute確保只有登入用戶可訪問4. 側邊欄管理 - 桌面版固定側邊欄，行動版摺疊式導航5. 內容區域 - 為子頁面提供統一的內容容器和間距組件特色:- 響應式佈局: 使用Tailwind的lg斷點進行桌面和行動版切換- 認證整合: 內建ProtectedRoute保護，自動處理未登入重導向- 統一樣式: 為所有儀表板頁面提供一致的視覺體驗- 靈活內容: 使用children prop支援任意子頁面內容- 可訪問性: 遵循WCAG規範的導航結構和語意標籤依賴組件:- ProtectedRoute: 認證保護邏輯- DashboardSidebar: 桌面版側邊導航- DashboardHeader: 頂部標題列- DashboardMobileNav: 行動版導航選單注意事項:- 此佈局應用於所有/dashboard/*路由- 側邊欄在大螢幕(lg+)固定顯示，小螢幕隱藏- 主內容區域會自動適應側邊欄寬度(pl-72)更新記錄:- Week 1: 建立基礎佈局結構- Week 2: 新增響應式設計支援- Week 3: 整合認證保護機制================================================================
 * @module app/dashboard/layout
 * @description
 * ================================================================檔案名稱: Dashboard Layout檔案用途: AI銷售賦能平台的主要儀表板佈局組件開發階段: 生產就緒================================================================功能索引:1. 頁面佈局管理 - 統一管理儀表板的整體結構和樣式2. 響應式設計 - 提供桌面版和行動版不同的導航體驗3. 認證保護 - 使用ProtectedRoute確保只有登入用戶可訪問4. 側邊欄管理 - 桌面版固定側邊欄，行動版摺疊式導航5. 內容區域 - 為子頁面提供統一的內容容器和間距組件特色:- 響應式佈局: 使用Tailwind的lg斷點進行桌面和行動版切換- 認證整合: 內建ProtectedRoute保護，自動處理未登入重導向- 統一樣式: 為所有儀表板頁面提供一致的視覺體驗- 靈活內容: 使用children prop支援任意子頁面內容- 可訪問性: 遵循WCAG規範的導航結構和語意標籤依賴組件:- ProtectedRoute: 認證保護邏輯- DashboardSidebar: 桌面版側邊導航- DashboardHeader: 頂部標題列- DashboardMobileNav: 行動版導航選單注意事項:- 此佈局應用於所有/dashboard/*路由- 側邊欄在大螢幕(lg+)固定顯示，小螢幕隱藏- 主內容區域會自動適應側邊欄寬度(pl-72)更新記錄:- Week 1: 建立基礎佈局結構- Week 2: 新增響應式設計支援- Week 3: 整合認證保護機制================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { Metadata } from 'next'
import { ProtectedRoute } from '@/hooks/use-auth'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav'

// Next.js 元資料配置 - 設定頁面標題和描述
export const metadata: Metadata = {
  title: {
    template: '%s | 儀表板 | AI 銷售賦能平台',  // 子頁面標題模板
    default: '儀表板 | AI 銷售賦能平台',        // 預設標題
  },
  description: 'AI 銷售賦能平台主要工作空間',     // 頁面描述用於SEO
}

// DashboardLayout組件的Props介面定義
interface DashboardLayoutProps {
  children: React.ReactNode  // 子頁面內容，支援任何React節點
}

/**
 * Dashboard主佈局組件
 *
 * 這是所有儀表板頁面的根佈局組件，提供統一的頁面結構和導航體驗。
 * 使用響應式設計，在不同螢幕尺寸下提供最佳的用戶體驗。
 *
 * @param children - 要渲染的子頁面內容
 * @returns 完整的儀表板佈局結構
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // 認證保護層 - 確保只有已登入用戶可以訪問儀表板
    <ProtectedRoute>
      {/* 主容器 - 設定最小高度為全螢幕，背景色為淺灰 */}
      <div className="min-h-screen bg-gray-50">

        {/* 桌面版側邊欄容器 */}
        {/* 在大螢幕(lg+)顯示固定側邊欄，寬度72(18rem)，z-index高優先級 */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <DashboardSidebar />
        </div>

        {/* 行動版導航選單 */}
        {/* 在小螢幕顯示的摺疊式導航，通常包含漢堡選單觸發器 */}
        <DashboardMobileNav />

        {/* 主要內容區域容器 */}
        {/* 在大螢幕時左邊距pl-72，為側邊欄留出空間 */}
        <div className="lg:pl-72">
          {/* 頂部標題列 */}
          {/* 包含頁面標題、用戶資訊、通知等頂部導航元素 */}
          <DashboardHeader />

          {/* 主要內容區域 */}
          {/* 響應式內邊距設計：手機4、平板6、桌面8 */}
          {/* 垂直內邊距8，為內容提供適當的上下間距 */}
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            {children} {/* 渲染傳入的子頁面內容 */}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}