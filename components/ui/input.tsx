/**
 * ================================================================
 * AI銷售賦能平台 - 輸入框組件 (components/ui/input.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 標準化的輸入框組件，支援多種輸入類型和狀態。
 * 提供無障礙支援、焦點管理和表單驗證功能。
 *
 * 【設計用途】
 * - 表單輸入欄位（文字、電子郵件、密碼等）
 * - 搜尋框和篩選功能
 * - 數字輸入和日期選擇
 * - 檔案上傳和表單控制
 *
 * 【Props介面】
 * 繼承自React.InputHTMLAttributes<HTMLInputElement>，支援：
 * • type - string - 輸入欄類型：
 *   - "text": 一般文字輸入（預設）
 *   - "email": 電子郵件格式驗證
 *   - "password": 密碼輸入，自動隐藏內容
 *   - "search": 搜尋框，支援清除按鈕
 *   - "number": 數字輸入
 *   - "tel": 電話號碼輸入
 *   - "url": 網址輸入
 *   - "file": 檔案上傳
 *   - "date", "time", "datetime-local": 日期時間選擇
 * • placeholder - string - 占位符文字
 * • value - string - 輸入欄數值（受控模式）
 * • defaultValue - string - 預設數值（非受控模式）
 * • onChange - function - 數值變更事件
 * • onFocus - function - 獲得焦點事件
 * • onBlur - function - 失去焦點事件
 * • disabled - boolean - 是否禁用
 * • readOnly - boolean - 是否唯讀
 * • required - boolean - 是否必填
 * • className - string - 自訂CSS類別
 * • name - string - 表單欄位名稱
 * • id - string - 元素識別符
 *
 * 【樣式特性】
 * • 基本尺寸: h-10 標準高度，px-3 py-2 合適內間距
 * • 邊框設計: rounded-md 圓角 + border-input 細邊框
 * • 焦點狀態: 藍色焦點環 (ring-2 ring-ring)
 * • 禁用狀態: cursor-not-allowed + opacity-50
 * • 占位符: text-muted-foreground 灰色文字
 * • 檔案輸入: 特殊樣式設計，透明背景
 * • 主題支援: 使用設計令牌色彩
 *
 * 【可訪問性特性】
 * • 鍵盤導航: 支援Tab鍵焦點管理
 * • 焦點指示: 清晰的視覺焦點狀態
 * • 標籤關聯: 支援label元素關聯
 * • 錯誤狀態: 可結合aria-invalid使用
 * • 輔助文字: 支援aria-describedby
 *
 * 【使用範例】
 * ```tsx
 * // 基本文字輸入
 * <Input
 *   type="text"
 *   placeholder="請輸入您的名字"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 * />
 *
 * // 電子郵件輸入
 * <Input
 *   type="email"
 *   placeholder="email@example.com"
 *   required
 * />
 *
 * // 搜尋框
 * <Input
 *   type="search"
 *   placeholder="搜尋客戶、文檔..."
 *   className="w-full max-w-sm"
 * />
 *
 * // 禁用狀態
 * <Input
 *   type="text"
 *   placeholder="禁用輸入欄"
 *   disabled
 * />
 *
 * // 檔案上傳
 * <Input
 *   type="file"
 *   accept=".pdf,.doc,.docx"
 *   onChange={handleFileUpload}
 * />
 * ```
 *
 * 【相關檔案】
 * • @/lib/utils - cn工具函數，用於類別名合併
 * • components/ui/label.tsx - 標籤組件，配合使用
 * • components/ui/form.tsx - 表單驗證組件
 * • global.css - 設計令牌和主題變數
 *
 * 【開發注意】
 * • 使用forwardRef支援ref傳遞到input元素
 * • 遵循無障礙標準，支援螢幕閱讀器
 * • 支援所有標準input屬性和事件
 * • 樣式設計遵循設計系統規範
 * • 支援主題切換和响應式設計
 * • 考慮新增驗證狀態和錯誤提示樣式
 * • 可結合React Hook Form使用
 * ================================================================
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }