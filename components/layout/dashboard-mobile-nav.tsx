'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Users,
  FileText,
  Search,
  MessageSquare,
  Settings,
  X,
  Menu,
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  PieChart,
  Calendar,
  Archive,
  Star,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function DashboardMobileNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <>
      {/* 行動版頂部欄 */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-gray-700"
        >
          <span className="sr-only">打開側邊欄</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>

        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span>AI 銷售平台</span>
          </Link>
        </div>

        {/* 用戶頭像 */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
          <span className="text-sm font-medium text-white">
            {user?.first_name?.charAt(0) || 'U'}
          </span>
        </div>
      </div>

      {/* 行動版側邊欄 */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                      className="text-white"
                    >
                      <span className="sr-only">關閉側邊欄</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </Button>
                  </div>
                </Transition.Child>

                {/* 側邊欄內容 */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  {/* Logo */}
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

                  {/* 導航選單 */}
                  <nav className="flex flex-1 flex-col">
                    <div className="space-y-6">
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
                                  onClick={() => setSidebarOpen(false)}
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
                              onClick={() => setSidebarOpen(false)}
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}