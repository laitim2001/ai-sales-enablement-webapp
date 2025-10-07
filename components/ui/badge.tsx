/**
 * @fileoverview ================================================================AI銷售賦能平台 - 標籤組件 (components/ui/badge.tsx)================================================================【組件功能】小巧的標籤組件，用於顯示狀態、類別、數量或重要資訊。支援多種顏色變體和尺寸，適合不同使用場景。【設計用途】- 狀態指示器（在線、離線、成功、失敗）- 數量指示（通知數量、新訊息數）- 類別標籤（產品類別、客戶類型）- 優先級標示（高、中、低優先級）- 警示和提示訊息【Props介面】繼承自React.HTMLAttributes<HTMLDivElement>，支援：• variant - string - 標籤樣式變體：  - "default": 預設藍色標籤，用於一般資訊  - "secondary": 灰色標籤，用於次要資訊  - "destructive": 紅色標籤，用於錯誤或危險狀態  - "outline": 邊框標籤，用於中性資訊  - "success": 綠色成功標籤  - "warning": 黃色警告標籤  - "error": 紅色錯誤標籤  - "info": 藍色資訊標籤• className - string - 自訂CSS類別• children - ReactNode - 標籤內容（文字或數字）• onClick - function - 點擊事件（可選）【樣式變體】• default: 藍色背景，白色文字，一般資訊指示• secondary: 灰色背景，次要資訊展示• destructive: 紅色背景，用於危險或錯誤狀態• outline: 透明背景加邊框，中性資訊• success: 綠色渚層，成功狀態指示• warning: 黃色渚層，警告資訊顯示• error: 紅色渚層，錯誤狀態顯示• info: 藍色渚層，一般資訊提示【視覺特性】• 小巧設計: 圓形容器 (rounded-full)• 細緻邊框: border 增加視覺細節• 緊密間距: px-2.5 py-0.5 精練尺寸• 小字體: text-xs 保持輕巧• 加粗字體: font-semibold 增強可讀性• 平滑過渡: transition-colors 提供微動效• 焦點管理: focus:ring-2 無障礙支援【使用範例】```tsx// 基本標籤<Badge>新功能</Badge>// 狀態指示<Badge variant="success">在線</Badge><Badge variant="error">離線</Badge><Badge variant="warning">待處理</Badge>// 數量指示<Badge variant="destructive">5</Badge><Badge className="bg-red-500">99+</Badge>// 類別標籤<Badge variant="outline">高優先級</Badge><Badge variant="secondary">VIP客戶</Badge>// 可點擊標籤<Badge  variant="info"  className="cursor-pointer hover:bg-blue-200"  onClick={() => handleTagClick()}>  可點擊</Badge>```【相關檔案】• @/lib/utils - cn工具函數，用於條件性類別合併• class-variance-authority - CVA，管理樣式變體• components/dashboard/* - Dashboard中廣泛使用• global.css - 設計令牌和主題變數【開發注意】• 使用div元素而非span，支援更多屬性• CVA配置集中管理所有色彩變體• 支援自訂className覆蓋預設樣式• 顏色選擇遵循設計系統色彩指引• 支援主題切換和響應式設計• 考慮新增尺寸變體 (sm, lg)• 可新增動畫效果和互動狀態================================================================
 * @module components/ui/badge
 * @description
 * ================================================================AI銷售賦能平台 - 標籤組件 (components/ui/badge.tsx)================================================================【組件功能】小巧的標籤組件，用於顯示狀態、類別、數量或重要資訊。支援多種顏色變體和尺寸，適合不同使用場景。【設計用途】- 狀態指示器（在線、離線、成功、失敗）- 數量指示（通知數量、新訊息數）- 類別標籤（產品類別、客戶類型）- 優先級標示（高、中、低優先級）- 警示和提示訊息【Props介面】繼承自React.HTMLAttributes<HTMLDivElement>，支援：• variant - string - 標籤樣式變體：  - "default": 預設藍色標籤，用於一般資訊  - "secondary": 灰色標籤，用於次要資訊  - "destructive": 紅色標籤，用於錯誤或危險狀態  - "outline": 邊框標籤，用於中性資訊  - "success": 綠色成功標籤  - "warning": 黃色警告標籤  - "error": 紅色錯誤標籤  - "info": 藍色資訊標籤• className - string - 自訂CSS類別• children - ReactNode - 標籤內容（文字或數字）• onClick - function - 點擊事件（可選）【樣式變體】• default: 藍色背景，白色文字，一般資訊指示• secondary: 灰色背景，次要資訊展示• destructive: 紅色背景，用於危險或錯誤狀態• outline: 透明背景加邊框，中性資訊• success: 綠色渚層，成功狀態指示• warning: 黃色渚層，警告資訊顯示• error: 紅色渚層，錯誤狀態顯示• info: 藍色渚層，一般資訊提示【視覺特性】• 小巧設計: 圓形容器 (rounded-full)• 細緻邊框: border 增加視覺細節• 緊密間距: px-2.5 py-0.5 精練尺寸• 小字體: text-xs 保持輕巧• 加粗字體: font-semibold 增強可讀性• 平滑過渡: transition-colors 提供微動效• 焦點管理: focus:ring-2 無障礙支援【使用範例】```tsx// 基本標籤<Badge>新功能</Badge>// 狀態指示<Badge variant="success">在線</Badge><Badge variant="error">離線</Badge><Badge variant="warning">待處理</Badge>// 數量指示<Badge variant="destructive">5</Badge><Badge className="bg-red-500">99+</Badge>// 類別標籤<Badge variant="outline">高優先級</Badge><Badge variant="secondary">VIP客戶</Badge>// 可點擊標籤<Badge  variant="info"  className="cursor-pointer hover:bg-blue-200"  onClick={() => handleTagClick()}>  可點擊</Badge>```【相關檔案】• @/lib/utils - cn工具函數，用於條件性類別合併• class-variance-authority - CVA，管理樣式變體• components/dashboard/* - Dashboard中廣泛使用• global.css - 設計令牌和主題變數【開發注意】• 使用div元素而非span，支援更多屬性• CVA配置集中管理所有色彩變體• 支援自訂className覆蓋預設樣式• 顏色選擇遵循設計系統色彩指引• 支援主題切換和響應式設計• 考慮新增尺寸變體 (sm, lg)• 可新增動畫效果和互動狀態================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        error:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }