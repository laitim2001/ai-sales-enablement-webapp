/**
 * ================================================================
 * AI銷售賦能平台 - 警告組件 (components/ui/alert.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 結構化的警告和通知組件，用於顯示重要訊息、錯誤、成功狀態等。
 * 支援多種警告類型和自訂內容，提供優秀的使用者體驗。
 *
 * 【設計用途】
 * - 系統通知和狀態更新
 * - 警告和錯誤訊息顯示
 * - 成功操作的確認提示
 * - 資訊提示和幫助指引
 * - 表單驗證結果展示
 *
 * 【組件結構】
 * • Alert - 主容器，提供基本樣式和警告色彩
 * • AlertTitle - 警告標題，使用h5標籤確保語義化
 * • AlertDescription - 警告內容描述，支援多行文字
 *
 * 【Props介面】
 * Alert組件支援：
 * • variant - string - 警告類型變體：
 *   - "default": 一般資訊警告，中性色彩
 *   - "destructive": 危險或錯誤警告，紅色主題
 *   - "warning": 警告提示，黃色主題
 *   - "success": 成功訊息，綠色主題
 *   - "info": 資訊提示，藍色主題
 * • className - string - 自訂CSS類別
 * • children - ReactNode - 警告內容（通常包含Title和Description）
 * • role - string - 自動設定為"alert"，支援無障礙
 *
 * AlertTitle和AlertDescription支援：
 * • className - string - 自訂CSS類別
 * • children - ReactNode - 標題或描述內容
 *
 * 【樣式變體】
 * • default: 中性灰色，用於一般資訊提示
 * • destructive: 紅色邊框和文字，用於錯誤和危險操作
 * • warning: 黃色邊框和文字，用於警告和注意事項
 * • success: 綠色邊框和文字，用於成功和確認訊息
 * • info: 藍色邊框和文字，用於一般資訊和幫助
 *
 * 【視覺特性】
 * • 圓角設計: rounded-lg 現代化外觀
 * • 邊框色彩: 根據變體動態調整邊框顏色
 * • 內間距: p-4 提供舒適的閱讀空間
 * • 圖示支援: 支援左側圖示顯示，自動對齊
 * • 文字色彩: 根據主題自動調整文字顏色
 * • 響應式: w-full 適應不同屏幕尺寸
 *
 * 【可訪問性特性】
 * • ARIA角色: 自動設定role="alert"
 * • 語義結構: 使用h5和div標籤確保結構清晰
 * • 顏色對比: 遵循WCAG標準，確保文字可讀性
 * • 螢幕閱讀器: 支援無障礙設備讀取
 *
 * 【使用範例】
 * ```tsx
 * // 基本資訊警告
 * <Alert>
 *   <AlertCircle className="h-4 w-4" />
 *   <AlertTitle>提示</AlertTitle>
 *   <AlertDescription>
 *     這是一個重要的資訊提示。
 *   </AlertDescription>
 * </Alert>
 *
 * // 成功訊息
 * <Alert variant="success">
 *   <CheckCircle className="h-4 w-4" />
 *   <AlertTitle>操作成功</AlertTitle>
 *   <AlertDescription>
 *     您的資料已經成功儲存。
 *   </AlertDescription>
 * </Alert>
 *
 * // 錯誤警告
 * <Alert variant="destructive">
 *   <AlertTriangle className="h-4 w-4" />
 *   <AlertTitle>錯誤</AlertTitle>
 *   <AlertDescription>
 *     發生錯誤，請稍後再試。
 *   </AlertDescription>
 * </Alert>
 *
 * // 簡單警告
 * <Alert variant="warning">
 *   請注意：這個操作無法復原。
 * </Alert>
 * ```
 *
 * 【相關檔案】
 * • @/lib/utils - cn工具函數，用於條件性類別合併
 * • class-variance-authority - CVA，管理樣式變體
 * • lucide-react - 建議搭配使用的圖示庫
 * • global.css - 設計令牌和主題變數
 *
 * 【開發注意】
 * • 使用forwardRef支援ref傳遞
 * • CVA配置集中管理所有變體樣式
 * • 支援自訂圖示，使用CSS選擇器定位
 * • 遵循設計系統的色彩和間距規範
 * • 支援主題切換和深色模式
 * • 考慮新增關閉按鈕和自動消失功能
 * • 可結合Toast組件使用於臨時通知
 * ================================================================
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-yellow-500/50 text-yellow-800 dark:border-yellow-500 [&>svg]:text-yellow-600",
        success:
          "border-green-500/50 text-green-800 dark:border-green-500 [&>svg]:text-green-600",
        info:
          "border-blue-500/50 text-blue-800 dark:border-blue-500 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }