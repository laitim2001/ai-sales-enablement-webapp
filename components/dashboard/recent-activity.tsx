/**
 * ================================================================
 * 檔案名稱: Recent Activity
 * 檔案用途: AI銷售賦能平台的最近活動展示組件
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. 活動記錄展示 - 顯示最近的銷售活動和系統互動記錄
 * 2. 活動分類 - 支援多種活動類型(電話、郵件、會議、提案等)
 * 3. 狀態管理 - 視覺化活動狀態(已完成、進行中、緊急)
 * 4. 時間軸顯示 - 按時間順序展示活動記錄
 * 5. 活動統計 - 底部統計今日活動概況
 * 6. 互動功能 - 提供查看全部活動的入口
 *
 * 組件特色:
 * - 多元分類: 支援6種不同的活動類型，各有專屬圖示和色彩
 * - 狀態視覺化: 使用顏色和圖示清楚表示活動完成狀態
 * - 時間感知: 顯示活動發生的相對時間(如"1小時前")
 * - 金額顯示: 對於涉及金額的活動，突出顯示交易價值
 * - 卡片設計: 每個活動項目使用卡片佈局，清晰分隔
 * - 響應式佈局: 適配不同螢幕尺寸的最佳顯示效果
 *
 * 依賴組件:
 * - Card系列: 卡片結構組件
 * - Button: 查看全部按鈕
 * - Badge: 活動類型標籤
 * - Lucide圖示: 各種活動類型和狀態圖示
 *
 * 注意事項:
 * - 使用'use client'指令，支援客戶端互動
 * - 活動數據目前為模擬數據，生產環境應從API獲取
 * - 支援馬來西亞令吉(RM)貨幣格式
 * - 時間顯示使用相對時間格式
 *
 * 更新記錄:
 * - Week 1: 建立基礎活動列表功能
 * - Week 2: 新增活動分類和狀態系統
 * - Week 3: 優化視覺設計和統計功能
 * ================================================================
 */

'use client'

import {
  Phone,         // 電話活動圖示
  Mail,          // 郵件活動圖示
  Calendar,      // 會議活動圖示
  FileText,      // 文件/提案活動圖示
  MessageSquare, // 聊天/AI助手活動圖示
  UserPlus,      // 新客戶活動圖示
  Clock,         // 時間/進行中狀態圖示
  CheckCircle,   // 完成狀態圖示
  AlertCircle,   // 緊急狀態圖示
  ArrowRight     // 查看更多箭頭圖示
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// 活動記錄的資料結構型別定義
interface Activity {
  id: string                                                           // 活動唯一識別碼
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'chat' | 'customer'  // 活動類型
  title: string                                                        // 活動標題
  description: string                                                  // 活動詳細描述
  customer: string                                                     // 相關客戶名稱
  timestamp: string                                                    // 活動時間戳記
  status: 'completed' | 'pending' | 'urgent'                         // 活動狀態
  amount?: string                                                      // 可選的金額資訊
}

/**
 * 最近活動組件
 *
 * 展示用戶最近的銷售活動記錄，包括電話、郵件、會議等各種互動。
 * 提供活動狀態追蹤和快速統計功能。
 *
 * @returns 最近活動卡片的完整JSX結構
 */
export function RecentActivity() {
  // === 活動數據配置 ===
  // 注意：在生產環境中，這些數據應該從API動態獲取
  const activities: Activity[] = [
    {
      id: '1',
      type: 'call',
      title: '客戶電話會議',
      description: '討論 Q4 合作計劃和預算分配',
      customer: 'ABC Corporation',
      timestamp: '1 小時前',
      status: 'completed',
      amount: 'RM 150,000'
    },
    {
      id: '2',
      type: 'proposal',
      title: '提案文件生成',
      description: 'AI 自動生成個人化提案文件',
      customer: 'XYZ Technology',
      timestamp: '2 小時前',
      status: 'completed',
      amount: 'RM 85,000'
    },
    {
      id: '3',
      type: 'email',
      title: '跟進郵件發送',
      description: '產品demo後的後續跟進郵件',
      customer: 'DEF Industries',
      timestamp: '3 小時前',
      status: 'pending'
    },
    {
      id: '4',
      type: 'meeting',
      title: '產品展示會議',
      description: '現場產品演示和Q&A環節',
      customer: 'GHI Solutions',
      timestamp: '4 小時前',
      status: 'completed',
      amount: 'RM 320,000'
    },
    {
      id: '5',
      type: 'customer',
      title: '新客戶註冊',
      description: 'CRM 系統新增潛在客戶資料',
      customer: 'JKL Enterprises',
      timestamp: '5 小時前',
      status: 'completed'
    },
    {
      id: '6',
      type: 'chat',
      title: 'AI 助手諮詢',
      description: '查詢競爭對手分析報告',
      customer: '內部使用',
      timestamp: '6 小時前',
      status: 'completed'
    }
  ]

  // === 工具函數 ===

  /**
   * 根據活動類型返回對應的圖示組件
   *
   * @param type - 活動類型
   * @returns 對應的圖示JSX元素
   */
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />        // 電話圖示
      case 'email':
        return <Mail className="h-4 w-4" />         // 郵件圖示
      case 'meeting':
        return <Calendar className="h-4 w-4" />     // 會議圖示
      case 'proposal':
        return <FileText className="h-4 w-4" />     // 提案文件圖示
      case 'chat':
        return <MessageSquare className="h-4 w-4" /> // 聊天圖示
      case 'customer':
        return <UserPlus className="h-4 w-4" />     // 新客戶圖示
      default:
        return <Clock className="h-4 w-4" />        // 預設時鐘圖示
    }
  }

  /**
   * 根據活動狀態返回對應的狀態圖示
   *
   * @param status - 活動狀態
   * @returns 帶有適當顏色的狀態圖示JSX元素
   */
  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />  // 綠色勾選 - 已完成
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />       // 黃色時鐘 - 進行中
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />    // 紅色警告 - 緊急
      default:
        return <Clock className="h-4 w-4 text-gray-400" />         // 灰色時鐘 - 預設
    }
  }

  const getStatusLabel = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'pending':
        return '進行中'
      case 'urgent':
        return '緊急'
      default:
        return '未知'
    }
  }

  const getActivityTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return '電話'
      case 'email':
        return '郵件'
      case 'meeting':
        return '會議'
      case 'proposal':
        return '提案'
      case 'chat':
        return 'AI 助手'
      case 'customer':
        return '客戶'
      default:
        return '活動'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>最近活動</span>
            </CardTitle>
            <CardDescription className="mt-1">
              最新的銷售活動和系統互動記錄
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            查看全部
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-4 pb-4 ${
                index !== activities.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 活動圖示 */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'call' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'email' ? 'bg-green-100 text-green-600' :
                activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                activity.type === 'proposal' ? 'bg-orange-100 text-orange-600' :
                activity.type === 'chat' ? 'bg-pink-100 text-pink-600' :
                activity.type === 'customer' ? 'bg-indigo-100 text-indigo-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* 活動內容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(activity.status)}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  {activity.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{activity.customer}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>

                  {activity.amount && (
                    <div className="text-sm font-semibold text-green-600">
                      {activity.amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 活動統計 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">24</div>
              <div className="text-xs text-gray-500">今日活動</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">18</div>
              <div className="text-xs text-gray-500">已完成</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">6</div>
              <div className="text-xs text-gray-500">待處理</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}