/**
 * @fileoverview ================================================================AI銷售賦能平台 - 下拉選單組件 (/components/ui/dropdown-menu.tsx)================================================================【組件功能】基於 Radix UI 構建的可訪問性下拉選單組件，提供豐富的選單功能，包括項目選擇、多選、單選、分組、子選單等完整的下拉選單解決方案【主要職責】• 提供完整的下拉選單組件架構 - Root、Trigger、Content、Item 等• 支援多種選單項目類型 - 普通項目、多選框項目、單選項目• 實現無障礙支持 - 鍵盤導航、屏幕閱讀器支持、焦點管理• 提供豐富的樣式變體 - inset 縮進、分隔線、標籤、快捷鍵顯示• 支援子選單和選單分組 - 多層級選單結構• 整合動畫效果 - 開啟/關閉動畫、滑入/滑出效果【組件結構】• DropdownMenu - 根組件容器• DropdownMenuTrigger - 觸發按鈕• DropdownMenuContent - 選單內容容器• DropdownMenuItem - 選單項目• DropdownMenuCheckboxItem - 多選框項目• DropdownMenuRadioItem - 單選項目• DropdownMenuLabel - 選單標籤• DropdownMenuSeparator - 分隔線• DropdownMenuShortcut - 快捷鍵顯示• DropdownMenuSub - 子選單容器• DropdownMenuSubTrigger - 子選單觸發器• DropdownMenuSubContent - 子選單內容• DropdownMenuGroup - 選單分組• DropdownMenuRadioGroup - 單選項目分組• DropdownMenuPortal - Portal 容器【使用範例】```tsx// 基本下拉選單<DropdownMenu>  <DropdownMenuTrigger asChild>    <Button variant="outline">開啟選單</Button>  </DropdownMenuTrigger>  <DropdownMenuContent className="w-56">    <DropdownMenuLabel>我的帳戶</DropdownMenuLabel>    <DropdownMenuSeparator />    <DropdownMenuItem>個人資料</DropdownMenuItem>    <DropdownMenuItem>設定</DropdownMenuItem>    <DropdownMenuSeparator />    <DropdownMenuItem>登出</DropdownMenuItem>  </DropdownMenuContent></DropdownMenu>// 帶多選框的選單<DropdownMenu>  <DropdownMenuTrigger asChild>    <Button>選項</Button>  </DropdownMenuTrigger>  <DropdownMenuContent>    <DropdownMenuCheckboxItem checked={showStatusBar}>      顯示狀態列    </DropdownMenuCheckboxItem>    <DropdownMenuCheckboxItem checked={showActivityBar}>      顯示活動列    </DropdownMenuCheckboxItem>  </DropdownMenuContent></DropdownMenu>// 帶子選單的複雜選單<DropdownMenu>  <DropdownMenuTrigger asChild>    <Button>選單</Button>  </DropdownMenuTrigger>  <DropdownMenuContent>    <DropdownMenuItem>編輯</DropdownMenuItem>    <DropdownMenuSub>      <DropdownMenuSubTrigger>主題</DropdownMenuSubTrigger>      <DropdownMenuSubContent>        <DropdownMenuRadioGroup value={theme}>          <DropdownMenuRadioItem value="light">淺色</DropdownMenuRadioItem>          <DropdownMenuRadioItem value="dark">深色</DropdownMenuRadioItem>        </DropdownMenuRadioGroup>      </DropdownMenuSubContent>    </DropdownMenuSub>  </DropdownMenuContent></DropdownMenu>```【技術實現】• Radix UI 基礎 - 使用 @radix-ui/react-dropdown-menu 提供核心功能• 無障礙支持 - 內建 ARIA 屬性、鍵盤導航、焦點管理• 樣式系統 - Tailwind CSS 類名，支援主題系統• 動畫效果 - data-state 驅動的 CSS 動畫轉場• Portal 渲染 - 確保選單正確層級和定位• forwardRef 支持 - 支援 ref 轉發和組件組合【相關檔案】• @/lib/utils - cn 工具函數用於樣式合併• @radix-ui/react-dropdown-menu - 核心功能提供者• lucide-react - 圖標組件 (Check, ChevronRight, Circle)• 主題檔案 - 定義顏色變量和樣式標準
 * @module components/ui/dropdown-menu
 * @description
 * ================================================================AI銷售賦能平台 - 下拉選單組件 (/components/ui/dropdown-menu.tsx)================================================================【組件功能】基於 Radix UI 構建的可訪問性下拉選單組件，提供豐富的選單功能，包括項目選擇、多選、單選、分組、子選單等完整的下拉選單解決方案【主要職責】• 提供完整的下拉選單組件架構 - Root、Trigger、Content、Item 等• 支援多種選單項目類型 - 普通項目、多選框項目、單選項目• 實現無障礙支持 - 鍵盤導航、屏幕閱讀器支持、焦點管理• 提供豐富的樣式變體 - inset 縮進、分隔線、標籤、快捷鍵顯示• 支援子選單和選單分組 - 多層級選單結構• 整合動畫效果 - 開啟/關閉動畫、滑入/滑出效果【組件結構】• DropdownMenu - 根組件容器• DropdownMenuTrigger - 觸發按鈕• DropdownMenuContent - 選單內容容器• DropdownMenuItem - 選單項目• DropdownMenuCheckboxItem - 多選框項目• DropdownMenuRadioItem - 單選項目• DropdownMenuLabel - 選單標籤• DropdownMenuSeparator - 分隔線• DropdownMenuShortcut - 快捷鍵顯示• DropdownMenuSub - 子選單容器• DropdownMenuSubTrigger - 子選單觸發器• DropdownMenuSubContent - 子選單內容• DropdownMenuGroup - 選單分組• DropdownMenuRadioGroup - 單選項目分組• DropdownMenuPortal - Portal 容器【使用範例】```tsx// 基本下拉選單<DropdownMenu>  <DropdownMenuTrigger asChild>    <Button variant="outline">開啟選單</Button>  </DropdownMenuTrigger>  <DropdownMenuContent className="w-56">    <DropdownMenuLabel>我的帳戶</DropdownMenuLabel>    <DropdownMenuSeparator />    <DropdownMenuItem>個人資料</DropdownMenuItem>    <DropdownMenuItem>設定</DropdownMenuItem>    <DropdownMenuSeparator />    <DropdownMenuItem>登出</DropdownMenuItem>  </DropdownMenuContent></DropdownMenu>// 帶多選框的選單<DropdownMenu>  <DropdownMenuTrigger asChild>    <Button>選項</Button>  </DropdownMenuTrigger>  <DropdownMenuContent>    <DropdownMenuCheckboxItem checked={showStatusBar}>      顯示狀態列    </DropdownMenuCheckboxItem>    <DropdownMenuCheckboxItem checked={showActivityBar}>      顯示活動列    </DropdownMenuCheckboxItem>  </DropdownMenuContent></DropdownMenu>// 帶子選單的複雜選單<DropdownMenu>  <DropdownMenuTrigger asChild>    <Button>選單</Button>  </DropdownMenuTrigger>  <DropdownMenuContent>    <DropdownMenuItem>編輯</DropdownMenuItem>    <DropdownMenuSub>      <DropdownMenuSubTrigger>主題</DropdownMenuSubTrigger>      <DropdownMenuSubContent>        <DropdownMenuRadioGroup value={theme}>          <DropdownMenuRadioItem value="light">淺色</DropdownMenuRadioItem>          <DropdownMenuRadioItem value="dark">深色</DropdownMenuRadioItem>        </DropdownMenuRadioGroup>      </DropdownMenuSubContent>    </DropdownMenuSub>  </DropdownMenuContent></DropdownMenu>```【技術實現】• Radix UI 基礎 - 使用 @radix-ui/react-dropdown-menu 提供核心功能• 無障礙支持 - 內建 ARIA 屬性、鍵盤導航、焦點管理• 樣式系統 - Tailwind CSS 類名，支援主題系統• 動畫效果 - data-state 驅動的 CSS 動畫轉場• Portal 渲染 - 確保選單正確層級和定位• forwardRef 支持 - 支援 ref 轉發和組件組合【相關檔案】• @/lib/utils - cn 工具函數用於樣式合併• @radix-ui/react-dropdown-menu - 核心功能提供者• lucide-react - 圖標組件 (Check, ChevronRight, Circle)• 主題檔案 - 定義顏色變量和樣式標準
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}