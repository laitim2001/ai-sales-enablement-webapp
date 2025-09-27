/**
 * ================================================================
 * AI銷售賦能平台 - 開關組件 (/components/ui/switch.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 基於 Radix UI 構建的無障礙開關組件，提供二元狀態切換功能，
 * 支援鍵盤操作、屏幕閱讀器和平滑的視覺切換動畫效果
 *
 * 【主要職責】
 * • 二元狀態切換 - 提供開啟/關閉兩種狀態的直觀控制
 * • 無障礙支持 - 完整的鍵盤導航和屏幕閱讀器支持
 * • 視覺反饋 - 平滑的切換動畫和狀態指示
 * • 禁用狀態處理 - 支援禁用狀態的視覺和功能處理
 * • 主題整合 - 支援系統主題和色彩變數
 * • 焦點管理 - 清晰的焦點環和鍵盤導航指示
 *
 * 【Props介面】
 * • 繼承自 Radix Switch.Root 的所有原生屬性
 * • checked - boolean - 開關狀態 (受控)
 * • defaultChecked - boolean - 預設開關狀態 (非受控)
 * • onCheckedChange - (checked: boolean) => void - 狀態變更回調
 * • disabled - boolean - 是否禁用開關
 * • name - string - 表單欄位名稱
 * • value - string - 表單值
 * • className - string - 額外的 CSS 類名
 *
 * 【使用範例】
 * ```tsx
 * // 基本開關使用
 * <div className="flex items-center space-x-2">
 *   <Switch id="airplane-mode" />
 *   <Label htmlFor="airplane-mode">飛航模式</Label>
 * </div>
 *
 * // 受控開關
 * const [isEnabled, setIsEnabled] = useState(false)
 * <Switch
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 * />
 *
 * // 預設開啟的開關
 * <Switch defaultChecked />
 *
 * // 禁用狀態開關
 * <Switch disabled />
 * <Switch disabled checked />
 *
 * // 表單中的開關
 * <form>
 *   <div className="space-y-4">
 *     <div className="flex items-center justify-between">
 *       <Label htmlFor="notifications">接收通知</Label>
 *       <Switch
 *         id="notifications"
 *         name="notifications"
 *         checked={settings.notifications}
 *         onCheckedChange={(checked) =>
 *           setSettings(prev => ({ ...prev, notifications: checked }))
 *         }
 *       />
 *     </div>
 *     <div className="flex items-center justify-between">
 *       <Label htmlFor="auto-save">自動儲存</Label>
 *       <Switch
 *         id="auto-save"
 *         name="autoSave"
 *         defaultChecked
 *       />
 *     </div>
 *   </div>
 * </form>
 *
 * // 設定頁面中的開關組
 * <div className="space-y-6">
 *   <div>
 *     <h3 className="text-lg font-medium">隱私設定</h3>
 *     <div className="mt-4 space-y-4">
 *       <div className="flex items-center justify-between">
 *         <div>
 *           <Label htmlFor="public-profile">公開個人資料</Label>
 *           <p className="text-sm text-muted-foreground">
 *             允許其他使用者查看您的個人資料
 *           </p>
 *         </div>
 *         <Switch id="public-profile" />
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * ```
 *
 * 【技術實現】
 * • Radix UI 基礎 - 使用 @radix-ui/react-switch 提供核心功能
 * • 雙層結構 - Root 容器 + Thumb 滑塊的組合設計
 * • CSS 變數動畫 - 使用 data-state 屬性驅動樣式變化
 * • Transform 動畫 - translate-x 實現滑塊的平滑移動
 * • 焦點環系統 - focus-visible 和 ring 系統的無障礙焦點指示
 * • 狀態響應樣式 - data-[state=checked/unchecked] 選擇器
 * • forwardRef 支持 - 支援 ref 轉發和組件組合
 *
 * 【樣式特性】
 * • 24px 高度 × 44px 寬度 - 符合觸控友好的尺寸標準
 * • 圓角邊框 - rounded-full 提供現代化的外觀
 * • 顏色主題 - 開啟時使用 primary 色，關閉時使用 input 色
 * • 陰影效果 - shadow-lg 提供深度感和質感
 * • 過渡動畫 - transition-colors 和 transition-transform
 * • 禁用樣式 - 降低不透明度和禁用指標
 *
 * 【無障礙性特性】
 * • ARIA 角色 - 正確的 switch 角色語義
 * • 鍵盤支持 - Space/Enter 鍵切換狀態
 * • 狀態通告 - 屏幕閱讀器可正確讀取開關狀態
 * • 焦點管理 - 清晰的焦點指示和導航順序
 * • 標籤關聯 - 與 Label 組件的正確關聯
 *
 * 【相關檔案】
 * • @radix-ui/react-switch - 核心開關功能提供者
 * • @/lib/utils - cn 工具函數用於樣式合併
 * • @/components/ui/label - 標籤組件，常與開關一起使用
 * • 主題配置 - CSS 變數定義 primary、input、ring 等顏色
 */

"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }