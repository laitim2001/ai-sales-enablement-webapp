/**
 * @fileoverview ================================================================檔案名稱: Dashboard Stats檔案用途: AI銷售賦能平台的儀表板統計卡片組件開發階段: 生產就緒================================================================功能索引:1. 統計數據展示 - 顯示關鍵業務指標(銷售額、客戶數、轉換率等)2. 趨勢視覺化 - 使用圖示和顏色表示數據變化趨勢3. 響應式網格 - 根據螢幕尺寸自動調整卡片排列方式4. 動態數據 - 支援實時數據更新和狀態切換5. 視覺設計 - 現代化卡片設計配合背景裝飾效果組件特色:- 數據清晰: 大字體顯示核心數值，小字體展示變化趨勢- 色彩語言: 綠色表示正向增長，紅色表示負向變化，灰色表示中性- 圖示搭配: 每個統計項目配有相應的視覺圖示- 網格佈局: 響應式網格設計，在不同裝置上最佳呈現- 背景裝飾: 微妙的背景圓形裝飾增加視覺層次- 描述資訊: 可選的描述文字提供額外上下文依賴組件:- Card系列: CardContent, CardHeader, CardTitle用於卡片結構- Lucide圖示: TrendingUp, TrendingDown, Users, Target, DollarSign等注意事項:- 使用'use client'指令，支援客戶端互動- 統計數據應該從API動態獲取，目前使用模擬數據- 趨勢計算基於與上月的比較- 支援馬來西亞令吉(RM)貨幣格式更新記錄:- Week 1: 建立基礎統計卡片佈局- Week 2: 新增趨勢指標和視覺效果- Week 3: 優化響應式設計和色彩主題================================================================
 * @module components/dashboard/dashboard-stats
 * @description
 * ================================================================檔案名稱: Dashboard Stats檔案用途: AI銷售賦能平台的儀表板統計卡片組件開發階段: 生產就緒================================================================功能索引:1. 統計數據展示 - 顯示關鍵業務指標(銷售額、客戶數、轉換率等)2. 趨勢視覺化 - 使用圖示和顏色表示數據變化趨勢3. 響應式網格 - 根據螢幕尺寸自動調整卡片排列方式4. 動態數據 - 支援實時數據更新和狀態切換5. 視覺設計 - 現代化卡片設計配合背景裝飾效果組件特色:- 數據清晰: 大字體顯示核心數值，小字體展示變化趨勢- 色彩語言: 綠色表示正向增長，紅色表示負向變化，灰色表示中性- 圖示搭配: 每個統計項目配有相應的視覺圖示- 網格佈局: 響應式網格設計，在不同裝置上最佳呈現- 背景裝飾: 微妙的背景圓形裝飾增加視覺層次- 描述資訊: 可選的描述文字提供額外上下文依賴組件:- Card系列: CardContent, CardHeader, CardTitle用於卡片結構- Lucide圖示: TrendingUp, TrendingDown, Users, Target, DollarSign等注意事項:- 使用'use client'指令，支援客戶端互動- 統計數據應該從API動態獲取，目前使用模擬數據- 趨勢計算基於與上月的比較- 支援馬來西亞令吉(RM)貨幣格式更新記錄:- Week 1: 建立基礎統計卡片佈局- Week 2: 新增趨勢指標和視覺效果- Week 3: 優化響應式設計和色彩主題================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import {
  TrendingUp,    // 上升趨勢圖示
  TrendingDown,  // 下降趨勢圖示
  Users,         // 用戶/客戶圖示
  Target,        // 目標/轉換率圖示
  DollarSign,    // 金錢/銷售額圖示
  Calendar       // 日期/時間圖示
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// 統計卡片資料結構的型別定義
interface StatCard {
  title: string                                              // 統計項目標題
  value: string                                              // 主要數值(如金額、數量)
  change: string                                             // 變化幅度(如+12.5%)
  changeType: 'positive' | 'negative' | 'neutral'           // 變化類型：正向/負向/中性
  icon: React.ComponentType<{ className?: string }>         // 統計項目圖示組件
  description?: string                                       // 可選的描述說明文字
}

/**
 * Dashboard統計卡片組件
 *
 * 展示關鍵業務指標的統計摘要，包括銷售額、客戶數、轉換率等重要數據。
 * 每個統計項目都配有趨勢指標和視覺圖示。
 *
 * @returns 統計卡片網格的JSX結構
 */
export function DashboardStats() {
  // === 統計數據配置 ===
  // 注意：在生產環境中，這些數據應該從API動態獲取
  const stats: StatCard[] = [
    {
      title: '本月銷售額',                    // 統計項目名稱
      value: 'RM 485,200',                  // 當前數值(馬來西亞令吉)
      change: '+12.5%',                     // 與上月比較的變化百分比
      changeType: 'positive',               // 正向變化(綠色顯示)
      icon: DollarSign,                     // 金錢圖示
      description: '比上月增加 RM 54,200'    // 額外說明資訊
    },
    {
      title: '成交客戶',                      // 統計項目名稱
      value: '24',                          // 客戶數量
      change: '+8',                         // 新增客戶數
      changeType: 'positive',               // 正向增長
      icon: Users,                          // 用戶群組圖示
      description: '本月新增成交客戶'         // 說明這是新增數量
    },
    {
      title: '轉換率',                        // 統計項目名稱
      value: '32.4%',                       // 轉換百分比
      change: '-2.1%',                      // 相比上月下降
      changeType: 'negative',               // 負向變化(紅色顯示)
      icon: Target,                         // 目標圖示
      description: '潛在客戶轉換成交率'       // 解釋轉換率含義
    },
    {
      title: '預計收入',                      // 統計項目名稱
      value: 'RM 892,400',                  // 預測收入金額
      change: '+18.2%',                     // 預期增長比例
      changeType: 'positive',               // 正向預期
      icon: TrendingUp,                     // 上升趨勢圖示
      description: '本季度預計總收入'         // 時間範圍說明
    }
  ]

  // === JSX渲染 ===
  return (
    // 響應式網格容器 - md:2列，lg:4列，間距6
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* 遍歷統計數據，為每個項目渲染一個卡片 */}
      {stats.map((stat, index) => (
        // 單個統計卡片 - 相對定位以支援背景裝飾，隱藏溢出內容
        <Card key={index} className="relative overflow-hidden">

          {/* === 卡片標題區域 === */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* 統計項目標題 */}
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            {/* 統計項目圖示 - 動態渲染對應的圖示組件 */}
            <stat.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>

          {/* === 卡片內容區域 === */}
          <CardContent>
            {/* 主要數值顯示 - 大字體，深色，加粗 */}
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>

            {/* 趨勢變化資訊區域 */}
            <div className="flex items-center space-x-2 text-xs">
              {/* 趨勢指標 - 根據changeType動態設定顏色和圖示 */}
              <div className={`flex items-center space-x-1 ${
                stat.changeType === 'positive'
                  ? 'text-green-600'      // 正向：綠色
                  : stat.changeType === 'negative'
                  ? 'text-red-600'        // 負向：紅色
                  : 'text-gray-600'       // 中性：灰色
              }`}>
                {/* 正向變化圖示 */}
                {stat.changeType === 'positive' && (
                  <TrendingUp className="h-3 w-3" />
                )}
                {/* 負向變化圖示 */}
                {stat.changeType === 'negative' && (
                  <TrendingDown className="h-3 w-3" />
                )}
                {/* 變化數值 */}
                <span className="font-medium">{stat.change}</span>
              </div>
              {/* 比較基準說明 */}
              <span className="text-gray-500">從上月</span>
            </div>

            {/* 可選的描述資訊 */}
            {stat.description && (
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>

          {/* === 背景裝飾元素 === */}
          {/* 根據變化類型顯示不同顏色的圓形背景裝飾 */}
          <div className={`absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-10 ${
            stat.changeType === 'positive'
              ? 'bg-green-500'    // 正向：綠色背景
              : stat.changeType === 'negative'
              ? 'bg-red-500'      // 負向：紅色背景
              : 'bg-blue-500'     // 中性：藍色背景
          }`}></div>
        </Card>
      ))}
    </div>
  )
}