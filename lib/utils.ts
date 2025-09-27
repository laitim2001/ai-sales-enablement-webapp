/**
 * ================================================================
 * AI銷售賦能平台 - 工具函數庫 (lib/utils.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供應用程式中常用的工具函數，包括樣式合併、日期格式化、URL處理等
 * 基礎實用工具集合，確保程式碼重用性和一致性
 *
 * 【主要職責】
 * • 樣式類名合併 - 整合Tailwind CSS和條件樣式
 * • 日期格式化 - 統一的日期顯示格式
 * • URL處理 - 生成絕對路徑URL
 * • 類型安全 - 提供完整的TypeScript類型支援
 *
 * 【技術實現】
 * • clsx - 條件樣式類名處理
 * • tailwind-merge - Tailwind CSS類名衝突解決
 * • Intl.DateTimeFormat - 國際化日期格式
 * • 環境變數 - 動態URL生成
 *
 * 【相關檔案】
 * • 全域樣式配置: tailwind.config.ts
 * • 環境設定: .env.local
 * • 類型定義: @types/globals.d.ts
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合併CSS類名
 * 結合clsx和tailwind-merge的功能，處理條件樣式並解決Tailwind類名衝突
 *
 * @param inputs - 可變參數，接受字串、物件、陣列等多種類名格式
 * @returns 合併後的CSS類名字串
 *
 * 【使用範例】
 * ```typescript
 * // 基本合併
 * cn("px-4", "py-2", "bg-blue-500")
 *
 * // 條件樣式
 * cn("base-class", {
 *   "active-class": isActive,
 *   "disabled-class": isDisabled
 * })
 *
 * // 解決Tailwind衝突
 * cn("px-2 px-4") // 結果: "px-4" (後者覆蓋前者)
 * ```
 *
 * 【性能考量】
 * • 使用記憶化快取提升重複調用效率
 * • 避免在渲染函數中進行複雜的類名計算
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期為可讀格式
 * 將各種日期輸入格式轉換為統一的本地化日期字串
 *
 * @param input - 日期輸入，支援字串、數字時間戳或Date物件
 * @returns 格式化的日期字串 (例: "January 15, 2024")
 *
 * 【格式特性】
 * • 月份：完整英文名稱 (January, February...)
 * • 日期：數字格式 (1, 2, 3...)
 * • 年份：四位數字 (2024)
 * • 語言：英文格式 (en-US)
 *
 * 【使用範例】
 * ```typescript
 * formatDate("2024-01-15")           // "January 15, 2024"
 * formatDate(1705324800000)         // "January 15, 2024"
 * formatDate(new Date())            // 當前日期格式化
 * ```
 *
 * 【錯誤處理】
 * • 自動處理無效日期，返回"Invalid Date"
 * • 支援多種時區和本地化設定
 */
export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * 生成絕對路徑URL
 * 將相對路徑轉換為完整的絕對URL，用於API調用、重定向等
 *
 * @param path - 相對路徑字串 (例: "/api/users", "/dashboard")
 * @returns 完整的絕對URL
 *
 * 【配置依賴】
 * • 環境變數: NEXT_PUBLIC_APP_URL
 * • 開發環境: http://localhost:3000
 * • 生產環境: https://yourdomain.com
 *
 * 【使用範例】
 * ```typescript
 * absoluteUrl("/api/users")         // "https://yourdomain.com/api/users"
 * absoluteUrl("/dashboard")         // "https://yourdomain.com/dashboard"
 * absoluteUrl("/auth/login")        // "https://yourdomain.com/auth/login"
 * ```
 *
 * 【注意事項】
 * • 確保NEXT_PUBLIC_APP_URL環境變數已正確設定
 * • 路徑參數應以"/"開頭
 * • 在客戶端和伺服器端都可安全使用
 */
export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}