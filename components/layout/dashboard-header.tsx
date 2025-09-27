/**
 * ================================================================
 * AI銷售賦能平台 - Dashboard標題列 (components/layout/dashboard-header.tsx)
 * ================================================================
 *
 * 【組件功能】
 * Dashboard的頂部導航欄，包含搜尋、通知、用戶選單和全局功能。
 * 提供跨頁面的一致性導航體驗和快速訪問入口。
 *
 * 【設計用途】
 * - 全局搜尋功能入口
 * - 系統通知和警示中心
 * - 用戶資訊和設定入口
 * - AI助手快速啟動
 * - 多語言和主題切換
 *
 * 【主要功能】
 * • 全局搜尋: 支援客戶、文檔、知識庫搜尋
 * • AI助手: 快速啟動智能對話功能
 * • 語言切換: 支援繁中/英文/馬來文
 * • 主題切換: 日間/夜間模式切換
 * • 通知中心: 實時通知和提醒事項
 * • 用戶選單: 個人資料、設定、登出
 *
 * 【通知類型】
 * • success: 成功操作 (如提案發送)
 * • info: 信息提醒 (如會議提醒)
 * • warning: 警告提示 (如跟進提醒)
 *
 * 【用戶角色支援】
 * • SALES_REP: 銷售代表
 * • SALES_MANAGER: 銷售經理
 * • MARKETING_SPECIALIST: 行銷專員
 * • CUSTOMER_SERVICE: 客戶服務
 * • ADMIN: 系統管理員
 *
 * 【視覺設計】
 * • 固定高度: h-16 保持一致性
 * • 背景色彩: 白色背景 + 細邊框分隔
 * • 響應式設計: 行動版隱藏部分功能
 * • 通知標記: 紅色圓點顯示未讀數量
 * • 用戶頭像: 藍色圓形背景 + 名字縮寫
 *
 * 【使用範例】
 * ```tsx
 * // 在DashboardLayout中使用
 * <DashboardHeader />
 *
 * // 自訂樣式
 * <header className="custom-header">
 *   <DashboardHeader />
 * </header>
 * ```
 *
 * 【相關檔案】
 * • @/hooks/use-auth - 認證Hook，管理用戶狀態
 * • components/ui/button.tsx - 按鈕組件
 * • components/ui/dropdown-menu.tsx - 下拉選單組件
 * • components/ui/input.tsx - 輸入框組件
 * • components/ui/badge.tsx - 標籤組件
 * • lucide-react - 圖示庫
 *
 * 【開發注意】
 * • 使用'use client'支援狀態管理和互動
 * • 通知數據目前是模擬數據，應從通知API取得
 * • 主題切換目前為簡單狀態，應集成完整主題系統
 * • 考慮新增搜尋建議和歷史記錄功能
 * • 可新增更多快速操作和快捷鍵支援
 * • 支援用戶偏好設定和個人化配置
 * ================================================================
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Bell,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  MessageSquare,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: '提案已發送',
      message: 'ABC 公司的提案已成功發送給客戶',
      time: '5分鐘前',
      unread: true,
    },
    {
      id: 2,
      type: 'info',
      title: '會議提醒',
      message: '與 XYZ 公司的會議將在 30 分鐘後開始',
      time: '30分鐘前',
      unread: true,
    },
    {
      id: 3,
      type: 'warning',
      title: '跟進提醒',
      message: 'DEF 公司已 3 天未回覆，建議主動跟進',
      time: '2小時前',
      unread: false,
    },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // 這裡可以添加實際的深色模式切換邏輯
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* 搜索欄 */}
        <div className="flex flex-1 items-center justify-start">
          <div className="w-full max-w-lg lg:max-w-xs">
            <label htmlFor="search" className="sr-only">
              搜索
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="search"
                name="search"
                type="search"
                placeholder="搜索客戶、文檔、知識..."
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 右側工具欄 */}
        <div className="flex items-center space-x-4">

          {/* AI 助手快速入口 */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI 助手</span>
          </Button>

          {/* 語言切換 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Globe className="h-5 w-5" />
                <span className="sr-only">切換語言</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="flex items-center justify-between">
                <span>繁體中文</span>
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>English</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Bahasa Malaysia</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 主題切換 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-gray-500 hover:text-gray-700"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">切換主題</span>
          </Button>

          {/* 通知 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">查看通知</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-medium">通知</h3>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  全部標記為已讀
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-gray-50">
                    <div className="flex w-full items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-center text-blue-600">
                  查看全部通知
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 用戶選單 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <div className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {user?.department} • {
                    user?.role === 'SALES_REP' && '銷售代表' ||
                    user?.role === 'SALES_MANAGER' && '銷售經理' ||
                    user?.role === 'MARKETING_SPECIALIST' && '行銷專員' ||
                    user?.role === 'CUSTOMER_SERVICE' && '客戶服務' ||
                    user?.role === 'ADMIN' && '系統管理員'
                  }
                </div>
              </div>
              <DropdownMenuItem className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>個人資料</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>帳戶設定</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span>登出</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}