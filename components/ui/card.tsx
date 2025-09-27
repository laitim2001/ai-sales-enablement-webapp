/**
 * ================================================================
 * AI銷售賦能平台 - 卡片組件 (components/ui/card.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 提供結構化的卡片容器組件，用於展示內容和資訊區塊。
 * 包含完整的卡片結構：標題、描述、內容和頁尾。
 *
 * 【設計用途】
 * - Dashboard統計卡片和資訊展示
 * - 列表項目和內容區塊的容器
 * - 表單和對話框的結構化包裝
 * - 產品卡片、用戶資料卡片等展示
 *
 * 【組件結構】
 * • Card - 主容器，提供基本的卡片樣式和陰影
 * • CardHeader - 標題區域，含有適當的內間距和佈局
 * • CardTitle - 主標題，使用h3標籤，支援SEO
 * • CardDescription - 副標題或描述文字
 * • CardContent - 主要內容區域
 * • CardFooter - 頁尾區域，通常放置按鈕或操作
 *
 * 【Props介面】
 * 所有組件都繼承自React.HTMLAttributes，支援：
 * • className - string - 自訂CSS類別
 * • children - ReactNode - 子元素內容
 * • onClick - function - 點擊事件（用於互動卡片）
 * • id - string - 元素識別符
 * • 以及所有標準HTML屬性
 *
 * 【樣式特性】
 * • 圓角設計: rounded-lg提供現代化外觀
 * • 邊框和陰影: border + shadow-sm精練視覺層次
 * • 背景色彩: bg-card + text-card-foreground支援主題切換
 * • 適當內間距: p-6提供舒適的閱讀空間
 * • 響應式設計: 適應不同螢幕尺寸
 *
 * 【使用範例】
 * ```tsx
 * // 基本結構
 * <Card>
 *   <CardHeader>
 *     <CardTitle>銷售統計</CardTitle>
 *     <CardDescription>本月業績概覽</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>這裡放置主要內容</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>查看詳情</Button>
 *   </CardFooter>
 * </Card>
 *
 * // 簡單卡片
 * <Card className="p-4">
 *   <h3 className="font-semibold">快速操作</h3>
 *   <p>這是一個簡單的內容卡片</p>
 * </Card>
 *
 * // 互動卡片
 * <Card className="cursor-pointer hover:shadow-md" onClick={handleClick}>
 *   <CardContent>可點擊的卡片內容</CardContent>
 * </Card>
 * ```
 *
 * 【相關檔案】
 * • @/lib/utils - cn工具函數，用於類別名合併
 * • global.css - 設計令牌和主題變數
 * • components/dashboard/* - Dashboard組件中廣泛使用
 *
 * 【開發注意】
 * • 使用forwardRef確保ref正確傳遞
 * • 遵循語義化HTML結構（h3用於標題）
 * • 所有組件都支援className自訂
 * • CardContent使用pt-0避免與Header重複間距
 * • CardFooter預設使用flex佈局方便排列按鈕
 * • 支援主題切換，使用設計令牌色彩
 * • 考慮新增loading狀態和error樣式
 * ================================================================
 */

import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }