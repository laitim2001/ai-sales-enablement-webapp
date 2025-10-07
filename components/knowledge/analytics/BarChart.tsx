/**
 * @fileoverview ================================================================AI銷售賦能平台 - 條形圖組件================================================================【組件功能】使用純 CSS 實現的水平條形圖，用於顯示數據分布和排行。【主要特性】• 水平條形圖 - 清晰的數據比較視覺化• 百分比或數值顯示 - 靈活的數據展示• 顏色編碼 - 支持自定義顏色方案• 懸停效果 - 互動式數據查看• 響應式設計 - 適配不同螢幕尺寸@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 * @module components/knowledge/analytics/BarChart
 * @description
 * ================================================================AI銷售賦能平台 - 條形圖組件================================================================【組件功能】使用純 CSS 實現的水平條形圖，用於顯示數據分布和排行。【主要特性】• 水平條形圖 - 清晰的數據比較視覺化• 百分比或數值顯示 - 靈活的數據展示• 顏色編碼 - 支持自定義顏色方案• 懸停效果 - 互動式數據查看• 響應式設計 - 適配不同螢幕尺寸@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

interface BarChartData {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  showPercentage?: boolean;
  maxValue?: number;
  className?: string;
}

export function BarChart({
  data,
  title,
  showPercentage = true,
  maxValue,
  className = ''
}: BarChartProps) {
  // 計算最大值（如果未提供）
  const max = maxValue || Math.max(...data.map(d => d.value));

  // 默認顏色方案
  const defaultColors = [
    'bg-indigo-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-gray-500'
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <div className="space-y-4">
        {data.map((item, index) => {
          const barWidth = max > 0 ? (item.value / max) * 100 : 0;
          const color = item.color || defaultColors[index % defaultColors.length];
          const percentage = item.percentage !== undefined
            ? item.percentage
            : max > 0 ? Math.round((item.value / max) * 100) : 0;

          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  {showPercentage ? `${percentage}%` : item.value.toLocaleString()}
                </span>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full ${color} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${barWidth}%` }}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-20"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暫無數據
        </div>
      )}
    </div>
  );
}
