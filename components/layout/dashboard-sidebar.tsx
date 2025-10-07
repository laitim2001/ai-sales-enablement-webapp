/**
 * @fileoverview ================================================================AI銷售賦能平台 - Dashboard側邊欄 (components/layout/dashboard-sidebar.tsx)================================================================【組件功能】Dashboard的主導航列，提供結構化的功能分組和導航連結。包含品牌標識、用戶資訊和多層級功能選單。【設計用途】- 主要功能選單和導航系統- 用戶角色和權限展示- 工作流程引導和功能探索- 平台功能結構和組織【導航分組】• 概覽區: 儀表板、任務、銷售活動• 客戶管理: 客戶列表、銷售機會、客戶分析• AI工具: AI搜尋、AI助手、提案生成、對話分析• 知識管理: 知識庫、智能搜尋、文檔管理、收藏• 底部導航: 設定、幫助中心【視覺特性】• 品牌區域: AI大腦圖示 + 平台名稱• 用戶卡片: 頭像 + 名稱 + 角色 + 在線狀態• 活躍狀態: 當前頁面高亮顯示• 圖示系統: 每個功能搭配相應圖示• 通知標記: 部分項目顯示數量或NEW標籤• 懸停效果: 平滑過渡和背景變化【動態功能】• 路徑偵測: 使用Next.js usePathname偵測當前頁面• 活躍狀態: 當前頁面高亮顯示• 悲停提示: 每個項目都有功能描述• 角色適配: 根據用戶角色顯示不同標籤【數據結構】NavigationItem:• name - string - 選單項目名稱• href - string - 目標頁面路徑• icon - React.ComponentType - Lucide圖示組件• badge - string|number - 可選的標籤顯示• description - string - 功能描述文字NavigationSection:• title - string - 分組標題• items - NavigationItem[] - 該分組的選單項目【使用範例】```tsx// 在DashboardLayout中使用<DashboardSidebar />// 自訂容器<aside className="custom-sidebar">  <DashboardSidebar /></aside>```【相關檔案】• next/link - Next.js路由組件• next/navigation - usePathname Hook• @/hooks/use-auth - 認證Hook，獲取用戶資訊• @/lib/utils - cn工具函數• lucide-react - 圖示庫【開發注意】• 使用'use client'支援路徑偵測和狀態管理• 通知數量目前是模擬數據，應從實時API取得• 考慮根據用戶權限動態顯示/隱藏功能項目• 支援收縮/展開功能和行動版適配• 可新增搜尋功能和最近使用記錄• 考慮新增更多個人化設定和布局選項================================================================
 * @module components/layout/dashboard-sidebar
 * @description
 * ================================================================AI銷售賦能平台 - Dashboard側邊欄 (components/layout/dashboard-sidebar.tsx)================================================================【組件功能】Dashboard的主導航列，提供結構化的功能分組和導航連結。包含品牌標識、用戶資訊和多層級功能選單。【設計用途】- 主要功能選單和導航系統- 用戶角色和權限展示- 工作流程引導和功能探索- 平台功能結構和組織【導航分組】• 概覽區: 儀表板、任務、銷售活動• 客戶管理: 客戶列表、銷售機會、客戶分析• AI工具: AI搜尋、AI助手、提案生成、對話分析• 知識管理: 知識庫、智能搜尋、文檔管理、收藏• 底部導航: 設定、幫助中心【視覺特性】• 品牌區域: AI大腦圖示 + 平台名稱• 用戶卡片: 頭像 + 名稱 + 角色 + 在線狀態• 活躍狀態: 當前頁面高亮顯示• 圖示系統: 每個功能搭配相應圖示• 通知標記: 部分項目顯示數量或NEW標籤• 懸停效果: 平滑過渡和背景變化【動態功能】• 路徑偵測: 使用Next.js usePathname偵測當前頁面• 活躍狀態: 當前頁面高亮顯示• 悲停提示: 每個項目都有功能描述• 角色適配: 根據用戶角色顯示不同標籤【數據結構】NavigationItem:• name - string - 選單項目名稱• href - string - 目標頁面路徑• icon - React.ComponentType - Lucide圖示組件• badge - string|number - 可選的標籤顯示• description - string - 功能描述文字NavigationSection:• title - string - 分組標題• items - NavigationItem[] - 該分組的選單項目【使用範例】```tsx// 在DashboardLayout中使用<DashboardSidebar />// 自訂容器<aside className="custom-sidebar">  <DashboardSidebar /></aside>```【相關檔案】• next/link - Next.js路由組件• next/navigation - usePathname Hook• @/hooks/use-auth - 認證Hook，獲取用戶資訊• @/lib/utils - cn工具函數• lucide-react - 圖示庫【開發注意】• 使用'use client'支援路徑偵測和狀態管理• 通知數量目前是模擬數據，應從實時API取得• 考慮根據用戶權限動態顯示/隱藏功能項目• 支援收縮/展開功能和行動版適配• 可新增搜尋功能和最近使用記錄• 考慮新增更多個人化設定和布局選項================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Users,
  FileText,
  Search,
  MessageSquare,
  Settings,
  HelpCircle,
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  PieChart,
  Calendar,
  Archive,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  current?: boolean
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navigation: NavigationSection[] = [
    {
      title: '概覽',
      items: [
        {
          name: '儀表板',
          href: '/dashboard',
          icon: BarChart3,
          description: '業績總覽和關鍵指標'
        },
        {
          name: '我的任務',
          href: '/dashboard/tasks',
          icon: Target,
          badge: '5',
          description: '今日待辦事項'
        },
        {
          name: '銷售活動',
          href: '/dashboard/activities',
          icon: Calendar,
          description: '會議、電話、跟進活動'
        },
      ]
    },
    {
      title: '客戶管理',
      items: [
        {
          name: '客戶列表',
          href: '/dashboard/customers',
          icon: Users,
          description: '客戶資料和關係管理'
        },
        {
          name: '銷售機會',
          href: '/dashboard/opportunities',
          icon: TrendingUp,
          badge: '12',
          description: '潛在商機和成交預測'
        },
        {
          name: '客戶分析',
          href: '/dashboard/analytics',
          icon: PieChart,
          description: '客戶行為和偏好分析'
        },
      ]
    },
    {
      title: 'AI 工具',
      items: [
        {
          name: 'AI 搜索',
          href: '/dashboard/search',
          icon: Search,
          description: '智能知識庫搜索'
        },
        {
          name: 'AI 助手',
          href: '/dashboard/chat',
          icon: Brain,
          description: '智能銷售對話助手'
        },
        {
          name: '提案生成',
          href: '/dashboard/proposals',
          icon: FileText,
          description: 'AI 個人化提案生成'
        },
        {
          name: '對話分析',
          href: '/dashboard/conversation-analysis',
          icon: MessageSquare,
          badge: 'NEW',
          description: '客戶對話洞察分析'
        },
      ]
    },
    {
      title: '知識管理',
      items: [
        {
          name: '知識庫',
          href: '/dashboard/knowledge',
          icon: BookOpen,
          description: '產品資料和銷售材料'
        },
        {
          name: '智能搜索',
          href: '/dashboard/knowledge/search',
          icon: Search,
          description: 'AI驅動的智能文檔搜索'
        },
        {
          name: '文檔管理',
          href: '/dashboard/documents',
          icon: Archive,
          description: '文檔上傳和分類'
        },
        {
          name: '我的收藏',
          href: '/dashboard/favorites',
          icon: Star,
          badge: '8',
          description: '常用資料和模板'
        },
      ]
    },
  ]

  const bottomNavigation = [
    {
      name: '設定',
      href: '/dashboard/settings',
      icon: Settings,
      description: '帳戶和系統設定'
    },
    {
      name: '幫助中心',
      href: '/dashboard/help',
      icon: HelpCircle,
      description: '使用指南和支援'
    },
  ]

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-lg">
      {/* Logo 和品牌 */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">AI 銷售平台</span>
            <span className="text-xs text-gray-500">智能賦能</span>
          </div>
        </Link>
      </div>

      {/* 用戶資訊 */}
      <div className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
          <span className="text-sm font-medium text-white">
            {user?.first_name?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.role === 'SALES_REP' && '銷售代表'}
            {user?.role === 'SALES_MANAGER' && '銷售經理'}
            {user?.role === 'MARKETING_SPECIALIST' && '行銷專員'}
            {user?.role === 'CUSTOMER_SERVICE' && '客戶服務'}
            {user?.role === 'ADMIN' && '系統管理員'}
          </p>
        </div>
        <div className="flex h-2 w-2 rounded-full bg-green-400"></div>
      </div>

      {/* 主導航 */}
      <nav className="flex flex-1 flex-col">
        <div className="space-y-8">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="mt-3 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      title={item.description}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive
                              ? 'text-blue-600'
                              : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs font-medium',
                            item.badge === 'NEW'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 底部導航 */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={item.description}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 shrink-0',
                      isActive
                        ? 'text-gray-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}