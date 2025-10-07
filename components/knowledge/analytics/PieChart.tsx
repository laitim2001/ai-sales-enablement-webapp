/**
 * @fileoverview ================================================================AI銷售賦能平台 - 圓餅圖組件================================================================【組件功能】使用 SVG 實現的圓餅圖，用於顯示數據分布百分比。【主要特性】• SVG 圓餅圖 - 精確的數據可視化• 顏色編碼 - 清晰的分類區分• 圖例顯示 - 完整的數據標籤• 百分比顯示 - 直觀的占比展示• 響應式設計 - 適配不同螢幕尺寸@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 * @module components/knowledge/analytics/PieChart
 * @description
 * ================================================================AI銷售賦能平台 - 圓餅圖組件================================================================【組件功能】使用 SVG 實現的圓餅圖，用於顯示數據分布百分比。【主要特性】• SVG 圓餅圖 - 精確的數據可視化• 顏色編碼 - 清晰的分類區分• 圖例顯示 - 完整的數據標籤• 百分比顯示 - 直觀的占比展示• 響應式設計 - 適配不同螢幕尺寸@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  size?: number;
  className?: string;
}

export function PieChart({
  data,
  title,
  size = 200,
  className = ''
}: PieChartProps) {
  // 默認顏色方案
  const defaultColors = [
    '#6366f1', // indigo
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#6b7280'  // gray
  ];

  // 計算圓餅圖的路徑
  const calculatePiePath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(size / 2, size / 2, radius, endAngle);
    const end = polarToCartesian(size / 2, size / 2, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${size / 2} ${size / 2}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  };

  // 極坐標轉換為笛卡爾坐標
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  // 計算每個扇形的角度
  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const angle = (item.percentage / 100) * 360;
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: item.color || defaultColors[index % defaultColors.length]
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* 圓餅圖 */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={calculatePiePath(segment.startAngle, segment.endAngle, size / 2 - 10)}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* 圖例 */}
        <div className="flex-1 w-full">
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-gray-700 truncate">
                    {segment.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {segment.percentage}%
                  </span>
                  <span className="text-sm text-gray-500">
                    ({segment.value.toLocaleString()})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暫無數據
        </div>
      )}
    </div>
  );
}
