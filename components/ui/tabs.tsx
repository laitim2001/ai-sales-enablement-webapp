/**
 * @fileoverview ================================================================AI銷售賦能平台 - 分頁組件 (components/ui/tabs.tsx)================================================================【組件功能】基於Radix UI的分頁組件，提供可訪問的分頁切換功能。支援鍵盤導航、焦點管理和完整的無障礙支援。【設計用途】- Dashboard中的內容區分和組織- 表單步驟導引和多階段輸入- 資料表格的篩選和分類顯示- 設定頁面的功能分組- 產品介紹中的資訊分類【組件結構】• Tabs - 主容器，管理整個分頁系統的狀態• TabsList - 分頁標籤列表容器• TabsTrigger - 分頁標籤按鈕，用於切換分頁• TabsContent - 分頁內容區域【Props介面】Tabs支援Radix TabsPrimitive.Root所有屬性：• defaultValue - string - 預設顯示的分頁• value - string - 當前活躍分頁（受控模式）• onValueChange - function - 分頁切換事件處理• orientation - "horizontal" | "vertical" - 分頁方向• activationMode - "automatic" | "manual" - 激活模式TabsList支援：• className - string - 自訂CSS類別• children - ReactNode - 包含多個TabsTriggerTabsTrigger支援：• value - string - 分頁標識符（必需）• disabled - boolean - 是否禁用• className - string - 自訂CSS類別• children - ReactNode - 標籤文字或內容TabsContent支援：• value - string - 對應的分頁標識符（必需）• className - string - 自訂CSS類別• children - ReactNode - 分頁內容【使用範例】```tsx// 基本分頁<Tabs defaultValue="overview" className="w-full">  <TabsList className="grid w-full grid-cols-3">    <TabsTrigger value="overview">概覽</TabsTrigger>    <TabsTrigger value="analytics">分析</TabsTrigger>    <TabsTrigger value="reports">報告</TabsTrigger>  </TabsList>  <TabsContent value="overview" className="mt-6">    <h3 className="text-lg font-semibold">概覽資訊</h3>  </TabsContent></Tabs>```【相關檔案】• @radix-ui/react-tabs - Radix UI分頁原始組件• @/lib/utils - cn工具函數• global.css - 設計令牌和主題變數【開發注意】• 使用"use client"支援客戶端互動• 使用forwardRef支援ref傳遞• Radix自動處理所有無障礙功能• 每個分頁都必須有唯一的value屬性• 支援自訂樣式覆蓋預設設計================================================================
 * @module components/ui/tabs
 * @description
 * ================================================================AI銷售賦能平台 - 分頁組件 (components/ui/tabs.tsx)================================================================【組件功能】基於Radix UI的分頁組件，提供可訪問的分頁切換功能。支援鍵盤導航、焦點管理和完整的無障礙支援。【設計用途】- Dashboard中的內容區分和組織- 表單步驟導引和多階段輸入- 資料表格的篩選和分類顯示- 設定頁面的功能分組- 產品介紹中的資訊分類【組件結構】• Tabs - 主容器，管理整個分頁系統的狀態• TabsList - 分頁標籤列表容器• TabsTrigger - 分頁標籤按鈕，用於切換分頁• TabsContent - 分頁內容區域【Props介面】Tabs支援Radix TabsPrimitive.Root所有屬性：• defaultValue - string - 預設顯示的分頁• value - string - 當前活躍分頁（受控模式）• onValueChange - function - 分頁切換事件處理• orientation - "horizontal" | "vertical" - 分頁方向• activationMode - "automatic" | "manual" - 激活模式TabsList支援：• className - string - 自訂CSS類別• children - ReactNode - 包含多個TabsTriggerTabsTrigger支援：• value - string - 分頁標識符（必需）• disabled - boolean - 是否禁用• className - string - 自訂CSS類別• children - ReactNode - 標籤文字或內容TabsContent支援：• value - string - 對應的分頁標識符（必需）• className - string - 自訂CSS類別• children - ReactNode - 分頁內容【使用範例】```tsx// 基本分頁<Tabs defaultValue="overview" className="w-full">  <TabsList className="grid w-full grid-cols-3">    <TabsTrigger value="overview">概覽</TabsTrigger>    <TabsTrigger value="analytics">分析</TabsTrigger>    <TabsTrigger value="reports">報告</TabsTrigger>  </TabsList>  <TabsContent value="overview" className="mt-6">    <h3 className="text-lg font-semibold">概覽資訊</h3>  </TabsContent></Tabs>```【相關檔案】• @radix-ui/react-tabs - Radix UI分頁原始組件• @/lib/utils - cn工具函數• global.css - 設計令牌和主題變數【開發注意】• 使用"use client"支援客戶端互動• 使用forwardRef支援ref傳遞• Radix自動處理所有無障礙功能• 每個分頁都必須有唯一的value屬性• 支援自訂樣式覆蓋預設設計================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }