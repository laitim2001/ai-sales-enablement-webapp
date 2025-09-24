import { Metadata } from 'next'
import { ProtectedRoute } from '@/hooks/use-auth'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav'

export const metadata: Metadata = {
  title: {
    template: '%s | 儀表板 | AI 銷售賦能平台',
    default: '儀表板 | AI 銷售賦能平台',
  },
  description: 'AI 銷售賦能平台主要工作空間',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 桌面版側邊欄 */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <DashboardSidebar />
        </div>

        {/* 行動版導航 */}
        <DashboardMobileNav />

        {/* 主要內容區域 */}
        <div className="lg:pl-72">
          <DashboardHeader />
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}