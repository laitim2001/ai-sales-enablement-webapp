/**
 * ================================================================
 * AI銷售賦能平台 - 按鈕組件 (components/ui/button.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 基於Radix UI和CVA構建的靈活按鈕組件，支援多種樣式變體和尺寸選項。
 * 提供無障礙支援、焦點管理和完整的鍵盤導航功能。
 *
 * 【設計用途】
 * - 作為整個應用程式的標準按鈕基礎組件
 * - 統一所有互動元素的視覺設計和行為
 * - 確保無障礙標準和使用者體驗一致性
 * - 支援主題系統和設計令牌
 *
 * 【Props介面】
 * • variant - string - 按鈕樣式變體，可選：
 *   - "default": 主要藍色按鈕，用於主要操作
 *   - "destructive": 紅色警告按鈕，用於刪除等危險操作
 *   - "outline": 邊框按鈕，用於次要操作
 *   - "secondary": 次要按鈕，用於輔助功能
 *   - "ghost": 透明按鈕，用於文字連結式操作
 *   - "link": 下劃線文字按鈕，用於導航連結
 * • size - string - 按鈕尺寸，可選：
 *   - "default": 標準尺寸 (h-10 px-4 py-2)
 *   - "sm": 小尺寸 (h-9 px-3)
 *   - "lg": 大尺寸 (h-11 px-8)
 *   - "icon": 圖示按鈕 (h-10 w-10)
 * • asChild - boolean - 是否作為子元素渲染 (預設: false)
 * • className - string - 自訂CSS類別
 * • disabled - boolean - 是否禁用
 * • onClick - function - 點擊事件處理程序
 * • type - string - 按鈕類型 ("button", "submit", "reset")
 *
 * 【樣式變體】
 * • default: 主要操作按鈕，藍色背景，白色文字
 * • destructive: 危險操作按鈕，紅色主題
 * • outline: 邊框按鈕，透明背景，有邊框
 * • secondary: 次要按鈕，灰色背景
 * • ghost: 透明按鈕，懸停時顯示背景
 * • link: 文字連結按鈕，帶下劃線
 *
 * 【可訪問性特性】
 * • 鍵盤導航: 支援Tab鍵焦點和Enter/Space啟動
 * • 焦點環: 清晰的焦點指示器 (ring-2 ring-offset-2)
 * • 禁用狀態: 自動處理pointer-events和透明度
 * • 語義標記: 正確的role和aria屬性
 *
 * 【使用範例】
 * ```tsx
 * // 主要操作按鈕
 * <Button>確認送出</Button>
 *
 * // 危險操作
 * <Button variant="destructive">刪除資料</Button>
 *
 * // 大尺寸次要按鈕
 * <Button variant="secondary" size="lg">取消</Button>
 *
 * // 圖示按鈕
 * <Button variant="ghost" size="icon">
 *   <Search className="h-4 w-4" />
 * </Button>
 *
 * // 作為連結使用
 * <Button asChild>
 *   <Link href="/dashboard">前往儀表板</Link>
 * </Button>
 * ```
 *
 * 【相關檔案】
 * • @/lib/utils - cn工具函數，用於條件性類別合併
 * • @radix-ui/react-slot - Slot組件，支援asChild模式
 * • class-variance-authority - CVA，管理條件性樣式變體
 * • global.css - 設計令牌和CSS變數定義
 *
 * 【開發注意】
 * • 使用forwardRef確保ref正確傳遞到DOM元素
 * • CVA配置集中管理所有樣式變體，方便維護
 * • 支援asChild模式，可以包裝其他元素如Link
 * • 所有互動狀態都有適當的視覺回饋
 * • 遵循設計系統的色彩和間距規範
 * • 在生產環境中應測試所有變體組合
 * • 考慮新增loading狀態和圖示支援
 * ================================================================
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }