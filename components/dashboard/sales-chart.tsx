'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SalesChart() {
  // 模擬數據
  const chartData = [
    { month: '1月', sales: 285000, target: 300000, deals: 18 },
    { month: '2月', sales: 342000, target: 320000, deals: 22 },
    { month: '3月', sales: 398000, target: 350000, deals: 25 },
    { month: '4月', sales: 445000, target: 380000, deals: 28 },
    { month: '5月', sales: 412000, target: 420000, deals: 26 },
    { month: '6月', sales: 485000, target: 450000, deals: 32 },
  ]

  const maxValue = Math.max(...chartData.map(d => Math.max(d.sales, d.target)))
  const minValue = Math.min(...chartData.map(d => Math.min(d.sales, d.target)))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>銷售趨勢</span>
            </CardTitle>
            <CardDescription className="mt-1">
              月度銷售額與目標對比分析
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select defaultValue="6months">
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">近 3 個月</SelectItem>
                <SelectItem value="6months">近 6 個月</SelectItem>
                <SelectItem value="12months">近 12 個月</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 圖例 */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">實際銷售額</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-600">目標銷售額</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">成交筆數</span>
          </div>
        </div>

        {/* 圖表容器 */}
        <div className="relative h-80">

          {/* Y軸刻度 */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-4">
            <span>RM {Math.round(maxValue / 1000)}K</span>
            <span>RM {Math.round((maxValue * 0.75) / 1000)}K</span>
            <span>RM {Math.round((maxValue * 0.5) / 1000)}K</span>
            <span>RM {Math.round((maxValue * 0.25) / 1000)}K</span>
            <span>0</span>
          </div>

          {/* 圖表主體 */}
          <div className="ml-16 h-full">

            {/* 水平網格線 */}
            <div className="absolute inset-0 ml-16">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <div
                  key={ratio}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(1 - ratio) * 100}%` }}
                />
              ))}
            </div>

            {/* 柱狀圖 */}
            <div className="flex items-end justify-between h-full pb-8">
              {chartData.map((data, index) => {
                const salesHeight = ((data.sales - minValue) / (maxValue - minValue)) * 100
                const targetHeight = ((data.target - minValue) / (maxValue - minValue)) * 100

                return (
                  <div key={data.month} className="flex flex-col items-center space-y-2 relative group">

                    {/* 柱狀圖 */}
                    <div className="flex space-x-1 items-end" style={{ height: '280px' }}>

                      {/* 實際銷售額 */}
                      <div className="relative">
                        <div
                          className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                          style={{ height: `${salesHeight}%` }}
                        />
                        {/* 數值顯示 */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            RM {(data.sales / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>

                      {/* 目標銷售額 */}
                      <div className="relative">
                        <div
                          className="w-8 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-sm transition-all duration-300 hover:from-gray-400 hover:to-gray-300"
                          style={{ height: `${targetHeight}%` }}
                        />
                        {/* 數值顯示 */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            目標: RM {(data.target / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>

                      {/* 成交筆數指示器 */}
                      <div className="absolute -right-4 top-0">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {data.deals}
                          </div>
                          <div className="w-px h-4 bg-green-300 mt-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* X軸標籤 */}
                    <div className="text-xs text-gray-600 font-medium mt-2">
                      {data.month}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                RM {(chartData[chartData.length - 1].sales / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-gray-500">本月銷售額</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                +{(((chartData[chartData.length - 1].sales / chartData[chartData.length - 1].target) - 1) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">目標達成率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {chartData.reduce((sum, d) => sum + d.deals, 0)}
              </div>
              <div className="text-xs text-gray-500">總成交筆數</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}