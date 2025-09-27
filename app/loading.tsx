/**
 * ================================================================
 * AI銷售賦能平台 - 載入頁面組件 (app/loading.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 此檔案是Next.js App Router的載入UI組件，在頁面或組件載入時顯示
 * 提供視覺化的載入指示器，改善用戶等待體驗
 *
 * 【主要職責】
 * • 載入狀態展示 - 在數據獲取或頁面渲染時顯示載入動畫
 * • 用戶體驗優化 - 避免白屏等待，提供視覺反饋
 * • 品牌一致性 - 使用統一的載入動畫和色彩方案
 * • 響應式設計 - 適配不同螢幕尺寸的載入展示
 *
 * 【載入場景】
 * • 頁面路由切換時的載入狀態
 * • 數據獲取期間的載入展示
 * • Suspense邊界的fallback組件
 * • 異步組件載入時的佔位符
 *
 * 【設計特點】
 * • 簡潔的載入動畫 - 不會干擾用戶注意力
 * • 品牌色彩 - 使用主品牌藍色
 * • 居中佈局 - 視覺平衡和專業感
 * • 漸變背景 - 與整體設計風格一致
 *
 * 【技術特點】
 * • 使用CSS動畫實現載入效果
 * • 採用Tailwind CSS工具類
 * • 支援深色模式主題
 * • 無需JavaScript，純CSS動畫
 *
 * 【相關檔案】
 * • app/layout.tsx - 根佈局，載入組件的父容器
 * • app/error.tsx - 錯誤頁面，載入失敗時的替代
 * • components/ui/* - 其他UI組件
 *
 * 【開發注意】
 * • loading.tsx會自動被Next.js用作Suspense fallback
 * • 不需要'use client'指令，是服務端組件
 * • 保持載入動畫簡潔，避免過度複雜
 * • 確保載入時間不會過長，否則考慮骨架屏
 */

import { Loader2 } from 'lucide-react'  // 載入動畫圖示

/**
 * 載入頁面組件
 *
 * 在頁面或組件載入時顯示的UI，提供視覺反饋
 * 自動被Next.js App Router用作Suspense的fallback組件
 *
 * @returns 載入頁面的JSX元素
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      {/* 主要載入容器 */}
      <div className="text-center">

        {/* 旋轉載入圖示 */}
        <Loader2
          className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4"
          aria-hidden="true"  // 對螢幕閱讀器隱藏裝飾性圖示
        />

        {/* 載入文字 */}
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          載入中...
        </h2>

        {/* 輔助說明文字 */}
        <p className="text-gray-500 text-sm">
          正在準備您的內容，請稍候
        </p>

        {/* 可選：載入進度條 (純視覺效果) */}
        <div className="mt-6 w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}