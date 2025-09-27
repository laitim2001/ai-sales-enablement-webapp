/**
 * ================================================================
 * AI銷售賦能平台 - 頭像組件 (components/ui/avatar.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 基於Radix UI的頭像組件，支援圖片載入、失敗後備和自動字母縮寫。
 * 提供完整的用戶头像解決方案，支援多種尺寸和樣式。
 *
 * 【設計用途】
 * - 用戶個人資料和識別顯示
 * - 團隊成員列表和協作介面
 * - 評論和討論系統中的用戶頭像
 * - Dashboard導航欄和用戶選單
 * - 客戶資料卡片和聯絡人信息
 *
 * 【組件結構】
 * • Avatar - 主容器，提供圓形框架和溢出處理
 * • AvatarImage - 圖片元素，處理圖片載入和顯示
 * • AvatarFallback - 後備元素，圖片失敗時顯示的內容
 *
 * 【Props介面】
 * Avatar支援Radix AvatarPrimitive.Root所有屬性：
 * • className - string - 自訂CSS類別
 * • children - ReactNode - 子元素（通常包含Image和Fallback）
 *
 * AvatarImage支援Radix AvatarPrimitive.Image所有屬性：
 * • src - string - 圖片來源URL
 * • alt - string - 圖片替代文字（無障礙必需）
 * • onLoadingStatusChange - function - 載入狀態變更回調
 * • className - string - 自訂CSS類別
 *
 * AvatarFallback支援Radix AvatarPrimitive.Fallback所有屬性：
 * • delayMs - number - 後備內容顯示延遲時間
 * • className - string - 自訂CSS類別
 * • children - ReactNode - 後備內容（文字、圖示等）
 *
 * 【樣式特性】
 * • 圓形設計: rounded-full 完美圓形外觀
 * • 標準尺寸: h-10 w-10 適合大部分場景
 * • 溢出處理: overflow-hidden 裁切超出內容
 * • 響應式圖片: aspect-square 保持正方形比例
 * • 後備樣式: 清淡背景，居中對齊文字
 * • 彈性容器: shrink-0 防止在flex中壓縮
 *
 * 【使用範例】
 * ```tsx
 * // 基本用戶頭像
 * <Avatar>
 *   <AvatarImage src="/avatars/john-doe.jpg" alt="John Doe" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 *
 * // 自訂尺寸
 * <Avatar className="h-16 w-16">
 *   <AvatarImage src={user.avatar} alt={user.name} />
 *   <AvatarFallback className="text-lg">
 *     {user.name.charAt(0)}
 *   </AvatarFallback>
 * </Avatar>
 *
 * // 小尺寸頭像
 * <Avatar className="h-6 w-6">
 *   <AvatarImage src={user.avatar} alt={user.name} />
 *   <AvatarFallback className="text-xs">
 *     {getInitials(user.name)}
 *   </AvatarFallback>
 * </Avatar>
 *
 * // 團隊成員列表
 * <div className="flex -space-x-2">
 *   {teamMembers.map((member) => (
 *     <Avatar key={member.id} className="border-2 border-white">
 *       <AvatarImage src={member.avatar} alt={member.name} />
 *       <AvatarFallback>{member.initials}</AvatarFallback>
 *     </Avatar>
 *   ))}
 * </div>
 *
 * // 帶狀態指示的頭像
 * <div className="relative">
 *   <Avatar>
 *     <AvatarImage src={user.avatar} alt={user.name} />
 *     <AvatarFallback>{user.initials}</AvatarFallback>
 *   </Avatar>
 *   <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
 * </div>
 * ```
 *
 * 【相關檔案】
 * • @radix-ui/react-avatar - Radix UI頭像原始組件
 * • @/lib/utils - cn工具函數，用於類別名合併
 * • global.css - 設計令牌和主題變數
 * • components/layout/* - Dashboard中廣泛使用
 *
 * 【開發注意】
 * • 使用forwardRef支援ref傳遞到底層DOM
 * • 必須提供alt文字確保無障礙
 * • Radix自動處理圖片載入狀態切換
 * • 後備內容應該是有意義的文字或圖示
 * • 支援多種尺寸，通過 className 調整
 * • 考慮新增狀態指示器和在線狀態
 * • 可結合DropdownMenu建立用戶選單
 * • 適合用於Tooltip顯示用戶詳細資訊
 * ================================================================
 */

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }