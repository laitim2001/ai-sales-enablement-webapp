/**
 * @fileoverview ================================================================AI銷售賦能平台 - 下拉選擇組件 (components/ui/select.tsx)================================================================【組件功能】基於Radix UI的下拉選擇組件，提供完整的選擇選單功能。支援鍵盤導航、搜尋、篩選和無障礙功能。【設計用途】- 表單中的選項選擇和下拉列表- 篩選器和分類選擇- 設定頁面的配置選項- Dashboard中的時間範圍和排序選擇- 用戶偏好和為化設定【組件結構】• Select - 主容器，管理選擇狀態和內容• SelectGroup - 選項組織容器，用於分組顯示• SelectValue - 顯示當前選擇的數值• SelectTrigger - 觸發按鈕，打開/關閉下拉選單• SelectContent - 下拉選單內容容器• SelectScrollUpButton/SelectScrollDownButton - 捲動按鈕• SelectItem - 单個選項項目• SelectLabel - 選項組標籤• SelectSeparator - 選項分隔線【Props介面】Select支援Radix SelectPrimitive.Root所有屬性：• value - string - 當前選擇值（受控模式）• defaultValue - string - 預設選擇值• onValueChange - function - 選擇變更事件• disabled - boolean - 是否禁用• required - boolean - 是否必選SelectTrigger支援：• className - string - 自訂CSS類別• children - ReactNode - 內容（通常包含SelectValue）• disabled - boolean - 是否禁用SelectContent支援：• position - "item-aligned" | "popper" - 定位模式• className - string - 自訂CSS類別• children - ReactNode - 選項列表SelectItem支援：• value - string - 選項值（必需）• disabled - boolean - 是否禁用• className - string - 自訂CSS類別• children - ReactNode - 選項顯示文字【樣式特性】• 觸發按鈕: 標準輸入框樣式 + 下拉箭頭• 下拉選單: 圆角 + 陰影 + 動畫效果• 選項項目: hover效果 + 選中檢查標記• 捲動支援: 自動换來指示器和捲動按鈕• 焦點狀態: 藍色焦點環 + 鍵盤導航• 禁用狀態: 灰色外觀 + 禁用指標【可訪問性特性】• ARIA支援: role="combobox", "listbox", "option"• 鍵盤導航: 上下箭頭鍵選擇，Enter確認• 焦點管理: Tab進入，Escape關閉• 狀態通知: 螢幕閱讀器支援選擇狀態• 標籤關聯: 支援aria-label和arialabelledby【使用範例】```tsx// 基本下拉選擇<Select onValueChange={(value) => setSort(value)}>  <SelectTrigger className="w-48">    <SelectValue placeholder="選擇排序方式" />  </SelectTrigger>  <SelectContent>    <SelectItem value="name">按名稱排序</SelectItem>    <SelectItem value="date">按日期排序</SelectItem>    <SelectItem value="size">按大小排序</SelectItem>  </SelectContent></Select>// 分組選擇<Select>  <SelectTrigger>    <SelectValue placeholder="選擇地區" />  </SelectTrigger>  <SelectContent>    <SelectLabel>亞洲地區</SelectLabel>    <SelectItem value="tw">台灣</SelectItem>    <SelectItem value="cn">中國</SelectItem>    <SelectSeparator />    <SelectLabel>歐洲地區</SelectLabel>    <SelectItem value="uk">英國</SelectItem>  </SelectContent></Select>// 受控選擇<Select value={country} onValueChange={setCountry}>  <SelectTrigger>    <SelectValue />  </SelectTrigger>  <SelectContent>    {countries.map(country => (      <SelectItem key={country.code} value={country.code}>        {country.name}      </SelectItem>    ))}  </SelectContent></Select>```【相關檔案】• @radix-ui/react-select - Radix UI選擇原始組件• lucide-react - 圖示庫（Check, ChevronDown, ChevronUp）• @/lib/utils - cn工具函數• global.css - 設計令牌和主題變數【開發注意】• 使用forwardRef支援ref傳遞• Radix自動處理Portal和定位邏輯• 支援多種定位模式（popper/item-aligned）• 最大高度限制，超出自動捲動• 支援自訂樣式覆蓋預設設計• 考慮新增搜尋功能和多選支援• 可結合Form組件進行表單驗證================================================================
 * @module components/ui/select
 * @description
 * ================================================================AI銷售賦能平台 - 下拉選擇組件 (components/ui/select.tsx)================================================================【組件功能】基於Radix UI的下拉選擇組件，提供完整的選擇選單功能。支援鍵盤導航、搜尋、篩選和無障礙功能。【設計用途】- 表單中的選項選擇和下拉列表- 篩選器和分類選擇- 設定頁面的配置選項- Dashboard中的時間範圍和排序選擇- 用戶偏好和為化設定【組件結構】• Select - 主容器，管理選擇狀態和內容• SelectGroup - 選項組織容器，用於分組顯示• SelectValue - 顯示當前選擇的數值• SelectTrigger - 觸發按鈕，打開/關閉下拉選單• SelectContent - 下拉選單內容容器• SelectScrollUpButton/SelectScrollDownButton - 捲動按鈕• SelectItem - 单個選項項目• SelectLabel - 選項組標籤• SelectSeparator - 選項分隔線【Props介面】Select支援Radix SelectPrimitive.Root所有屬性：• value - string - 當前選擇值（受控模式）• defaultValue - string - 預設選擇值• onValueChange - function - 選擇變更事件• disabled - boolean - 是否禁用• required - boolean - 是否必選SelectTrigger支援：• className - string - 自訂CSS類別• children - ReactNode - 內容（通常包含SelectValue）• disabled - boolean - 是否禁用SelectContent支援：• position - "item-aligned" | "popper" - 定位模式• className - string - 自訂CSS類別• children - ReactNode - 選項列表SelectItem支援：• value - string - 選項值（必需）• disabled - boolean - 是否禁用• className - string - 自訂CSS類別• children - ReactNode - 選項顯示文字【樣式特性】• 觸發按鈕: 標準輸入框樣式 + 下拉箭頭• 下拉選單: 圆角 + 陰影 + 動畫效果• 選項項目: hover效果 + 選中檢查標記• 捲動支援: 自動换來指示器和捲動按鈕• 焦點狀態: 藍色焦點環 + 鍵盤導航• 禁用狀態: 灰色外觀 + 禁用指標【可訪問性特性】• ARIA支援: role="combobox", "listbox", "option"• 鍵盤導航: 上下箭頭鍵選擇，Enter確認• 焦點管理: Tab進入，Escape關閉• 狀態通知: 螢幕閱讀器支援選擇狀態• 標籤關聯: 支援aria-label和arialabelledby【使用範例】```tsx// 基本下拉選擇<Select onValueChange={(value) => setSort(value)}>  <SelectTrigger className="w-48">    <SelectValue placeholder="選擇排序方式" />  </SelectTrigger>  <SelectContent>    <SelectItem value="name">按名稱排序</SelectItem>    <SelectItem value="date">按日期排序</SelectItem>    <SelectItem value="size">按大小排序</SelectItem>  </SelectContent></Select>// 分組選擇<Select>  <SelectTrigger>    <SelectValue placeholder="選擇地區" />  </SelectTrigger>  <SelectContent>    <SelectLabel>亞洲地區</SelectLabel>    <SelectItem value="tw">台灣</SelectItem>    <SelectItem value="cn">中國</SelectItem>    <SelectSeparator />    <SelectLabel>歐洲地區</SelectLabel>    <SelectItem value="uk">英國</SelectItem>  </SelectContent></Select>// 受控選擇<Select value={country} onValueChange={setCountry}>  <SelectTrigger>    <SelectValue />  </SelectTrigger>  <SelectContent>    {countries.map(country => (      <SelectItem key={country.code} value={country.code}>        {country.name}      </SelectItem>    ))}  </SelectContent></Select>```【相關檔案】• @radix-ui/react-select - Radix UI選擇原始組件• lucide-react - 圖示庫（Check, ChevronDown, ChevronUp）• @/lib/utils - cn工具函數• global.css - 設計令牌和主題變數【開發注意】• 使用forwardRef支援ref傳遞• Radix自動處理Portal和定位邏輯• 支援多種定位模式（popper/item-aligned）• 最大高度限制，超出自動捲動• 支援自訂樣式覆蓋預設設計• 考慮新增搜尋功能和多選支援• 可結合Form組件進行表單驗證================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}