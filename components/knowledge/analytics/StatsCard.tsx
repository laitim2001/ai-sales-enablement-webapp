/**
 * ================================================================
 * AI銷售賦能平台 - 統計卡片組件
 * ================================================================
 *
 * 【組件功能】
 * 顯示單個統計指標的卡片，包括數值、增長率和趨勢圖標。
 *
 * 【主要特性】
 * • 統計數值顯示 - 大字體顯示主要數值
 * • 增長率指示器 - 顏色編碼的增長百分比
 * • 趨勢圖標 - 上升/下降/持平的視覺指示
 * • 標題和描述 - 清晰的統計說明
 * • 響應式設計 - 適配不同螢幕尺寸
 *
 * @author Claude Code
 * @date 2025-10-03
 * @sprint Sprint 6 Week 12
 */

'use client';

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  growth?: number; // 增長率百分比
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  growth,
  icon: Icon,
  description,
  className = ''
}: StatsCardProps) {
  // 確定增長率的樣式
  const getGrowthColor = () => {
    if (growth === undefined || growth === 0) return 'text-gray-500';
    return growth > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = () => {
    if (growth === undefined || growth === 0) {
      return <MinusIcon className="w-4 h-4" />;
    }
    return growth > 0 ? (
      <ArrowUpIcon className="w-4 h-4" />
    ) : (
      <ArrowDownIcon className="w-4 h-4" />
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {growth !== undefined && (
              <span className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor()}`}>
                {getGrowthIcon()}
                {Math.abs(growth)}%
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="w-10 h-10 text-indigo-600" />
          </div>
        )}
      </div>
    </div>
  );
}
