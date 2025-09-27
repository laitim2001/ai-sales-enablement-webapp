/**
 * ================================================================
 * AI銷售賦能平台 - 404錯誤頁面組件 (app/not-found.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 此檔案是Next.js App Router的404錯誤頁面組件，當用戶訪問不存在的路由時顯示
 * 提供友好的錯誤提示和導航選項，幫助用戶回到正確的頁面
 *
 * 【主要職責】
 * • 404錯誤處理 - 處理頁面找不到的情況
 * • 用戶導航協助 - 提供返回選項和常用頁面連結
 * • 品牌體驗維護 - 保持一致的設計風格和用戶體驗
 * • SEO優化 - 正確的HTTP 404狀態碼返回
 *
 * 【觸發場景】
 * • 用戶輸入錯誤的URL路徑
 * • 點擊已失效的書籤或連結
 * • 頁面被刪除或移動後的舊連結訪問
 * • 路由配置錯誤導致的頁面無法找到
 *
 * 【用戶體驗設計】
 * • 溫和友好的錯誤提示 - 避免責備用戶
 * • 清晰的視覺層次 - 重要資訊突出顯示
 * • 多種導航選項 - 回首頁、返回上頁、搜尋功能
 * • 品牌一致性 - 使用統一的色彩和字體
 *
 * 【技術特點】
 * • 自動HTTP 404狀態碼 - Next.js自動處理
 * • 靜態生成 - 快速載入，無需服務端渲染
 * • SEO友好 - 搜尋引擎正確識別404狀態
 * • 響應式設計 - 適配各種螢幕尺寸
 *
 * 【相關檔案】
 * • app/error.tsx - 通用錯誤頁面
 * • app/layout.tsx - 根佈局組件
 * • components/ui/* - UI組件庫
 *
 * 【開發注意】
 * • not-found.tsx會自動返回HTTP 404狀態碼
 * • 不需要'use client'指令，是服務端組件
 * • 確保提供有用的導航選項
 * • 考慮添加搜尋功能或常用頁面連結
 */

import Link from 'next/link'                           // Next.js路由連結組件
import { Button } from '@/components/ui/button'        // UI按鈕組件
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react'  // 圖示組件

/**
 * 404錯誤頁面組件
 *
 * 當用戶訪問不存在的路由時顯示的頁面
 * 自動返回HTTP 404狀態碼，對SEO友好
 *
 * @returns 404錯誤頁面的JSX元素
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      {/* 主要錯誤卡片容器 */}
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">

        {/* 404圖示和數字 */}
        <div className="mb-6">
          {/* 檔案問號圖示 */}
          <FileQuestion className="mx-auto h-20 w-20 text-gray-400 mb-4" />

          {/* 大型404數字 */}
          <h1 className="text-6xl font-bold text-gray-300 mb-2">
            404
          </h1>

          {/* 主要錯誤訊息 */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            找不到頁面
          </h2>

          {/* 詳細說明 */}
          <p className="text-gray-600 mb-6">
            抱歉，您要找的頁面不存在。
            <br />
            可能是連結過期、頁面已移動或URL輸入錯誤。
          </p>
        </div>

        {/* 導航選項區域 */}
        <div className="space-y-3">
          {/* 回到首頁按鈕 - 主要行動呼籲 */}
          <Link href="/" className="block w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Home className="mr-2 h-4 w-4" />
              回到首頁
            </Button>
          </Link>

          {/* 返回上一頁按鈕 */}
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回上一頁
          </Button>

          {/* 可選：搜尋按鈕 - 可以連結到搜尋頁面或開啟搜尋功能 */}
          <Link href="/search" className="block w-full">
            <Button variant="ghost" className="w-full">
              <Search className="mr-2 h-4 w-4" />
              搜尋內容
            </Button>
          </Link>
        </div>

        {/* 額外資訊區域 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          {/* 常用頁面連結 */}
          <p className="text-sm text-gray-500 mb-4">
            或前往這些常用頁面：
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              控制台
            </Link>
            <Link
              href="/knowledge"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              知識庫
            </Link>
            <Link
              href="/proposals"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              提案管理
            </Link>
            <Link
              href="/settings"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              設定
            </Link>
          </div>

          {/* 技術支援資訊 */}
          <div className="mt-6">
            <p className="text-xs text-gray-400">
              如果您認為這是系統錯誤，請聯繫技術支援
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}