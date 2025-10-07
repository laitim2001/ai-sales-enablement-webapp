/**
 * @fileoverview Slider UI組件功能：- 提供數值範圍選擇滑塊組件- 支援單值和雙值模式- 可自訂最小值、最大值和步進作者：Claude Code創建時間：2025-09-28
 * @module components/ui/slider
 * @description
 * Slider UI組件功能：- 提供數值範圍選擇滑塊組件- 支援單值和雙值模式- 可自訂最小值、最大值和步進作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }