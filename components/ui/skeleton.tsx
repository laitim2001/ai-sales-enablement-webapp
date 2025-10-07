/**
 * @fileoverview Skeleton Loading ComponentSprint 6 Week 11 Day 2 快速修復
 * @module components/ui/skeleton
 * @description
 * Skeleton Loading ComponentSprint 6 Week 11 Day 2 快速修復
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  )
}

export { Skeleton }
