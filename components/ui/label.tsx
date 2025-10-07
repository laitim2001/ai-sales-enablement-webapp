/**
 * @fileoverview ================================================================AI銷售賦能平台 - 標籤組件 (/components/ui/label.tsx)================================================================【組件功能】基於 Radix UI 構建的無障礙標籤組件，提供表單控件的語義化標記，支援自動關聯、鍵盤導航和屏幕閱讀器友好的使用體驗【主要職責】• 表單標籤語義 - 為表單控件提供無障礙的標籤關聯• 自動關聯機制 - 透過 htmlFor 或包裹方式關聯控件• 禁用狀態支持 - 當關聯控件禁用時自動調整樣式• 樣式一致性 - 統一的字體大小、粗細和行高標準• 主題整合 - 支援系統主題顏色和樣式變數【Props介面】• 繼承自 Radix Label.Root 的所有原生屬性• htmlFor - string - 關聯的表單控件 ID• className - string - 額外的 CSS 類名• children - ReactNode - 標籤文字內容• asChild - boolean - 是否作為子組件渲染【使用範例】```tsx// 基本標籤使用<div className="space-y-2">  <Label htmlFor="email">電子郵件</Label>  <Input id="email" type="email" placeholder="請輸入電子郵件" /></div>// 包裹式標籤<Label>  姓名  <Input placeholder="請輸入姓名" className="mt-1" /></Label>// 必填欄位標籤<Label htmlFor="username" className="text-destructive">  使用者名稱 *</Label>// 禁用狀態標籤<Label htmlFor="disabled-input" className="opacity-50">  禁用欄位</Label><Input id="disabled-input" disabled />// 自定義樣式標籤<Label htmlFor="custom" className="text-lg font-bold text-primary">  重要資訊</Label>// 與 Checkbox 使用<div className="flex items-center space-x-2">  <Checkbox id="terms" />  <Label htmlFor="terms">我同意服務條款</Label></div>// 與 RadioGroup 使用<RadioGroup>  <div className="flex items-center space-x-2">    <RadioGroupItem value="option1" id="option1" />    <Label htmlFor="option1">選項一</Label>  </div></RadioGroup>```【技術實現】• Radix UI 基礎 - 使用 @radix-ui/react-label 提供核心功能• CVA 樣式變體 - 使用 class-variance-authority 管理樣式變體• 無障礙支持 - 內建 ARIA 屬性和語義化 HTML• 自動關聯 - 支援 htmlFor 屬性和包裹式關聯• 狀態響應 - peer-disabled 選擇器處理關聯控件的禁用狀態• forwardRef 支持 - 支援 ref 轉發和組件組合【無障礙性特性】• 語義化標記 - 正確的 <label> 元素語義• 自動關聯 - 確保標籤與控件正確關聯• 鍵盤友好 - 點擊標籤可聚焦關聯控件• 屏幕閱讀器支持 - 提供正確的標籤朗讀• 狀態指示 - 禁用狀態的視覺和語義指示【相關檔案】• @radix-ui/react-label - 核心標籤功能提供者• class-variance-authority - 樣式變體管理工具• @/lib/utils - cn 工具函數用於樣式合併• 表單控件組件 - Input, Checkbox, RadioGroup 等相關組件
 * @module components/ui/label
 * @description
 * ================================================================AI銷售賦能平台 - 標籤組件 (/components/ui/label.tsx)================================================================【組件功能】基於 Radix UI 構建的無障礙標籤組件，提供表單控件的語義化標記，支援自動關聯、鍵盤導航和屏幕閱讀器友好的使用體驗【主要職責】• 表單標籤語義 - 為表單控件提供無障礙的標籤關聯• 自動關聯機制 - 透過 htmlFor 或包裹方式關聯控件• 禁用狀態支持 - 當關聯控件禁用時自動調整樣式• 樣式一致性 - 統一的字體大小、粗細和行高標準• 主題整合 - 支援系統主題顏色和樣式變數【Props介面】• 繼承自 Radix Label.Root 的所有原生屬性• htmlFor - string - 關聯的表單控件 ID• className - string - 額外的 CSS 類名• children - ReactNode - 標籤文字內容• asChild - boolean - 是否作為子組件渲染【使用範例】```tsx// 基本標籤使用<div className="space-y-2">  <Label htmlFor="email">電子郵件</Label>  <Input id="email" type="email" placeholder="請輸入電子郵件" /></div>// 包裹式標籤<Label>  姓名  <Input placeholder="請輸入姓名" className="mt-1" /></Label>// 必填欄位標籤<Label htmlFor="username" className="text-destructive">  使用者名稱 *</Label>// 禁用狀態標籤<Label htmlFor="disabled-input" className="opacity-50">  禁用欄位</Label><Input id="disabled-input" disabled />// 自定義樣式標籤<Label htmlFor="custom" className="text-lg font-bold text-primary">  重要資訊</Label>// 與 Checkbox 使用<div className="flex items-center space-x-2">  <Checkbox id="terms" />  <Label htmlFor="terms">我同意服務條款</Label></div>// 與 RadioGroup 使用<RadioGroup>  <div className="flex items-center space-x-2">    <RadioGroupItem value="option1" id="option1" />    <Label htmlFor="option1">選項一</Label>  </div></RadioGroup>```【技術實現】• Radix UI 基礎 - 使用 @radix-ui/react-label 提供核心功能• CVA 樣式變體 - 使用 class-variance-authority 管理樣式變體• 無障礙支持 - 內建 ARIA 屬性和語義化 HTML• 自動關聯 - 支援 htmlFor 屬性和包裹式關聯• 狀態響應 - peer-disabled 選擇器處理關聯控件的禁用狀態• forwardRef 支持 - 支援 ref 轉發和組件組合【無障礙性特性】• 語義化標記 - 正確的 <label> 元素語義• 自動關聯 - 確保標籤與控件正確關聯• 鍵盤友好 - 點擊標籤可聚焦關聯控件• 屏幕閱讀器支持 - 提供正確的標籤朗讀• 狀態指示 - 禁用狀態的視覺和語義指示【相關檔案】• @radix-ui/react-label - 核心標籤功能提供者• class-variance-authority - 樣式變體管理工具• @/lib/utils - cn 工具函數用於樣式合併• 表單控件組件 - Input, Checkbox, RadioGroup 等相關組件
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }