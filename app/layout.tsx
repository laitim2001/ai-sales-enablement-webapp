/**
 * ================================================================
 * AI銷售賦能平台 - 根佈局組件 (app/layout.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 此檔案是Next.js App Router的根佈局組件，定義整個應用程式的全域結構
 * 負責設定HTML文檔結構、元數據配置、字體加載和全域狀態管理
 *
 * 【主要職責】
 * • HTML根結構定義 - 設定語言、頭部和主體結構
 * • 元數據管理 - SEO優化、Open Graph、Twitter Cards
 * • 全域字體配置 - Google Fonts字體加載和應用
 * • 認證狀態管理 - 全域認證Context Provider
 * • 全域樣式加載 - 引入Tailwind CSS和自定義樣式
 *
 * 【技術特點】
 * • 使用Next.js 14 App Router架構
 * • 支援TypeScript嚴格模式
 * • SEO友好的元數據配置
 * • 響應式設計和國際化支援
 * • 安全的認證狀態管理
 *
 * 【相關檔案】
 * • globals.css - 全域CSS樣式定義
 * • hooks/use-auth.tsx - 認證狀態管理
 * • components/ui/* - UI組件庫
 *
 * 【開發注意】
 * • 元數據變更需要重新部署才能生效
 * • 字體變更會影響全站載入效能
 * • AuthProvider必須包裹所有需要認證的頁面
 * • suppressHydrationWarning用於避免SSR/CSR差異
 */

import type { Metadata } from 'next'        // Next.js元數據類型定義
import { Inter } from 'next/font/google'    // Google Fonts字體加載器
import './globals.css'                      // 全域CSS樣式
import { AuthProvider } from '@/hooks/use-auth'  // 認證狀態管理Provider

// 配置Inter字體，僅加載拉丁字符子集以優化載入效能
const inter = Inter({ subsets: ['latin'] })

// 應用程式元數據配置 - 用於SEO優化和社交媒體分享
export const metadata: Metadata = {
  // 頁面標題配置 - 支援動態標題模板
  title: {
    template: '%s | AI 銷售賦能平台',    // 子頁面標題模板，%s會被替換為頁面特定標題
    default: 'AI 銷售賦能平台',          // 預設標題，用於首頁或未設定特定標題的頁面
  },

  // 網站描述 - 用於搜尋引擎和社交媒體預覽
  description: '專為銷售團隊打造的 AI 驅動銷售賦能平台，提升銷售效率和客戶體驗',

  // SEO關鍵字 - 幫助搜尋引擎了解網站內容
  keywords: ['AI', '銷售', '賦能', 'CRM', '智能客服', '銷售分析'],

  // 網站作者和創作者資訊
  authors: [{ name: 'AI 銷售賦能平台團隊' }],
  creator: 'AI 銷售賦能平台',
  publisher: 'AI 銷售賦能平台',

  // 搜尋引擎爬蟲配置
  robots: {
    index: true,        // 允許搜尋引擎索引此網站
    follow: true,       // 允許搜尋引擎跟隨連結
    googleBot: {        // Google搜尋引擎特定設定
      index: true,
      follow: true,
      'max-video-preview': -1,      // 允許完整視頻預覽
      'max-image-preview': 'large', // 允許大圖片預覽
      'max-snippet': -1,            // 允許完整文字摘要
    },
  },

  // Open Graph協議配置 - 用於Facebook、LinkedIn等社交媒體分享
  openGraph: {
    type: 'website',                          // 網站類型
    locale: 'zh_TW',                         // 語言地區設定
    url: process.env.NEXT_PUBLIC_APP_URL,    // 網站URL，從環境變數讀取
    title: 'AI 銷售賦能平台',                 // 社交媒體分享標題
    description: '專為銷售團隊打造的 AI 驅動銷售賦能平台，提升銷售效率和客戶體驗',
    siteName: 'AI 銷售賦能平台',              // 網站名稱
  },

  // Twitter Cards配置 - 用於Twitter分享優化
  twitter: {
    card: 'summary_large_image',  // 大圖片摘要卡片格式
    title: 'AI 銷售賦能平台',
    description: '專為銷售團隊打造的 AI 驅動銷售賦能平台，提升銷售效率和客戶體驗',
    creator: '@ai_sales_platform', // Twitter帳號
  },

  // 網站圖示配置 - 支援多種裝置和瀏覽器
  icons: {
    icon: '/favicon.ico',               // 標準圖示
    shortcut: '/favicon-16x16.png',     // 16x16快捷圖示
    apple: '/apple-touch-icon.png',     // Apple Touch圖示
  },

  // PWA manifest檔案路徑
  manifest: '/site.webmanifest',

  // 其他元數據配置
  other: {
    'theme-color': '#3b82f6',    // 瀏覽器主題色彩
    'color-scheme': 'light dark', // 支援亮色和暗色模式
  },
}

/**
 * 根佈局組件 - 定義整個應用程式的HTML結構
 *
 * @param children - 子頁面組件，由Next.js路由系統注入
 * @returns 完整的HTML文檔結構
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode  // 子組件類型定義
}) {
  return (
    <html
      lang="zh-TW"                    // 設定文檔語言為繁體中文
      suppressHydrationWarning        // 抑制SSR/CSR水合警告，用於主題切換等場景
    >
      <head />
      <body className={inter.className}>
        {/* 認證狀態管理Provider - 包裹整個應用程式以提供認證上下文 */}
        <AuthProvider>
          {children}  {/* 渲染子頁面內容 */}
        </AuthProvider>
      </body>
    </html>
  )
}