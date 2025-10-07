/**
 * @fileoverview ================================================================AI銷售賦能平台 - 客戶詳情頁面 (app/dashboard/customers/[id]/page.tsx)================================================================【檔案功能】提供客戶的詳細資訊查看界面，整合客戶360度視圖組件，展示客戶完整檔案、互動歷史、銷售機會、相關文檔等全方位資訊，支援即時編輯和更新功能。【主要職責】• 客戶詳情展示 - 顯示客戶基本資料和聯絡資訊• 互動歷史追蹤 - 展示所有與客戶的互動記錄時間線• 銷售機會管理 - 顯示相關的銷售機會和進度• AI洞察分析 - 提供AI驅動的客戶行為和需求分析• 相關文檔整合 - 展示與客戶相關的知識庫內容• 快速操作支援 - 提供郵件、會議、筆記等快速操作【頁面結構】• 客戶標題區 - 客戶名稱、狀態、關鍵指標概覽• 標籤頁內容 - 基本資料、互動歷史、銷售機會、AI洞察• 操作側邊欄 - 快速操作按鈕和最近活動• 相關內容區 - 知識庫文檔和推薦內容【功能特色】• 360度視圖 - 使用客戶360度視圖組件提供全方位資訊• 即時更新 - 支援客戶資料的即時編輯和同步• 智能建議 - AI驅動的後續行動建議• 時間線展示 - 互動歷史的視覺化時間線• 文檔關聯 - 自動關聯相關的知識庫內容【用戶流程】1. 檢視客戶基本資料和狀態概覽2. 瀏覽互動歷史和重要事件時間線3. 查看銷售機會和進度追蹤4. 獲取AI分析洞察和行動建議5. 執行快速操作（郵件、會議、筆記）6. 查看相關文檔和推薦內容【路由參數】• params.id: 客戶ID，用於載入特定客戶的詳細資料【相關檔案】• components/crm/customer-360-view.tsx - 客戶360度視圖組件• app/api/customers/[id]/360-view/route.ts - 客戶360度視圖API• lib/integrations/customer-360/service.ts - 客戶360度服務• app/dashboard/customers/page.tsx - 客戶列表頁面【開發注意】• 數據載入：處理客戶不存在和權限不足的情況• 性能優化：大量互動歷史數據的分頁載入• 即時同步：編輯操作的樂觀更新和衝突處理• 權限控制：基於角色的客戶資料訪問權限• 錯誤邊界：優雅處理組件載入和API調用錯誤
 * @module app/dashboard/customers/[id]/page
 * @description
 * ================================================================AI銷售賦能平台 - 客戶詳情頁面 (app/dashboard/customers/[id]/page.tsx)================================================================【檔案功能】提供客戶的詳細資訊查看界面，整合客戶360度視圖組件，展示客戶完整檔案、互動歷史、銷售機會、相關文檔等全方位資訊，支援即時編輯和更新功能。【主要職責】• 客戶詳情展示 - 顯示客戶基本資料和聯絡資訊• 互動歷史追蹤 - 展示所有與客戶的互動記錄時間線• 銷售機會管理 - 顯示相關的銷售機會和進度• AI洞察分析 - 提供AI驅動的客戶行為和需求分析• 相關文檔整合 - 展示與客戶相關的知識庫內容• 快速操作支援 - 提供郵件、會議、筆記等快速操作【頁面結構】• 客戶標題區 - 客戶名稱、狀態、關鍵指標概覽• 標籤頁內容 - 基本資料、互動歷史、銷售機會、AI洞察• 操作側邊欄 - 快速操作按鈕和最近活動• 相關內容區 - 知識庫文檔和推薦內容【功能特色】• 360度視圖 - 使用客戶360度視圖組件提供全方位資訊• 即時更新 - 支援客戶資料的即時編輯和同步• 智能建議 - AI驅動的後續行動建議• 時間線展示 - 互動歷史的視覺化時間線• 文檔關聯 - 自動關聯相關的知識庫內容【用戶流程】1. 檢視客戶基本資料和狀態概覽2. 瀏覽互動歷史和重要事件時間線3. 查看銷售機會和進度追蹤4. 獲取AI分析洞察和行動建議5. 執行快速操作（郵件、會議、筆記）6. 查看相關文檔和推薦內容【路由參數】• params.id: 客戶ID，用於載入特定客戶的詳細資料【相關檔案】• components/crm/customer-360-view.tsx - 客戶360度視圖組件• app/api/customers/[id]/360-view/route.ts - 客戶360度視圖API• lib/integrations/customer-360/service.ts - 客戶360度服務• app/dashboard/customers/page.tsx - 客戶列表頁面【開發注意】• 數據載入：處理客戶不存在和權限不足的情況• 性能優化：大量互動歷史數據的分頁載入• 即時同步：編輯操作的樂觀更新和衝突處理• 權限控制：基於角色的客戶資料訪問權限• 錯誤邊界：優雅處理組件載入和API調用錯誤
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Mail, Phone, Calendar, MessageSquare, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Customer360View } from '@/components/crm/customer-360-view'

// 客戶基本資料介面
interface CustomerBasicInfo {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  website?: string
  industry: string
  status: 'active' | 'inactive' | 'prospect' | 'customer'
  priority: 'high' | 'medium' | 'low'
  revenue_potential: number
  created_date: string
  last_interaction: string
  description?: string
  avatar_url?: string
}

// 互動歷史記錄介面
interface InteractionRecord {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'proposal'
  title: string
  description: string
  date: string
  participant: string
  outcome?: string
  next_action?: string
}

// 銷售機會介面
interface SalesOpportunity {
  id: string
  name: string
  value: number
  stage: string
  probability: number
  expected_close_date: string
  description: string
  last_update: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  // 狀態管理
  const [customer, setCustomer] = useState<CustomerBasicInfo | null>(null)
  const [interactions, setInteractions] = useState<InteractionRecord[]>([])
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // 模擬客戶資料
  const mockCustomer: CustomerBasicInfo = {
    id: customerId,
    company_name: 'TechCorp Solutions',
    contact_name: '張經理',
    email: 'zhang@techcorp.com',
    phone: '+60 3-1234-5678',
    address: '吉隆坡, 馬來西亞',
    website: 'https://techcorp.com',
    industry: '科技',
    status: 'customer',
    priority: 'high',
    revenue_potential: 250000,
    created_date: '2024-08-15',
    last_interaction: '2024-09-27',
    description: 'TechCorp Solutions 是一家專注於企業數位轉型的科技公司，在東南亞地區有強勢的市場地位。他們正在尋找AI驅動的銷售解決方案來提升業績和客戶體驗。'
  }

  // 模擬互動歷史
  const mockInteractions: InteractionRecord[] = [
    {
      id: '1',
      type: 'meeting',
      title: '產品展示會議',
      description: '向張經理展示了我們的AI銷售平台功能，包括智能搜索和提案生成功能。客戶對於AI驅動的個人化推薦特別感興趣。',
      date: '2024-09-27T14:00:00Z',
      participant: '張經理, 技術總監李先生',
      outcome: '客戶表示高度興趣，要求提供詳細的技術規格和報價',
      next_action: '準備技術規格文檔和正式報價單'
    },
    {
      id: '2',
      type: 'email',
      title: '跟進郵件 - 技術需求確認',
      description: '發送了技術需求確認清單，詢問客戶的具體整合需求和時程安排。',
      date: '2024-09-25T09:30:00Z',
      participant: '張經理',
      outcome: '客戶回覆確認需求，希望在Q4完成部署',
      next_action: '安排技術團隊評估會議'
    },
    {
      id: '3',
      type: 'call',
      title: '初次聯絡電話',
      description: '通過LinkedIn聯絡到張經理，介紹了我們的AI銷售賦能解決方案。客戶表示目前正在評估類似的解決方案。',
      date: '2024-09-20T10:15:00Z',
      participant: '張經理',
      outcome: '成功獲得客戶興趣，安排了產品展示會議',
      next_action: '準備客製化的產品展示內容'
    },
    {
      id: '4',
      type: 'note',
      title: '客戶背景研究',
      description: '完成了TechCorp Solutions的背景調研。公司年收入約5000萬美元，員工200+人，主要客戶包括大型製造業和金融機構。',
      date: '2024-09-18T16:45:00Z',
      participant: '內部團隊',
      outcome: '識別出關鍵決策者和影響者',
      next_action: '制定針對性的銷售策略'
    }
  ]

  // 模擬銷售機會
  const mockOpportunities: SalesOpportunity[] = [
    {
      id: '1',
      name: 'AI銷售平台 - 企業版',
      value: 180000,
      stage: '方案評估',
      probability: 75,
      expected_close_date: '2024-12-15',
      description: '為TechCorp部署完整的AI銷售賦能平台，包括客戶管理、智能搜索、提案生成等功能模組。',
      last_update: '2024-09-27'
    },
    {
      id: '2',
      name: '專業服務 - 客製化開發',
      value: 50000,
      stage: '需求確認',
      probability: 60,
      expected_close_date: '2025-01-30',
      description: '根據TechCorp的特殊需求，開發客製化的CRM整合模組和報表功能。',
      last_update: '2024-09-25'
    },
    {
      id: '3',
      name: '培訓服務包',
      value: 20000,
      stage: '待啟動',
      probability: 85,
      expected_close_date: '2025-02-28',
      description: '為TechCorp團隊提供AI平台使用培訓和最佳實踐指導。',
      last_update: '2024-09-20'
    }
  ]

  // 載入客戶資料
  useEffect(() => {
    const loadCustomerData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 模擬API調用延遲
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 驗證客戶ID
        if (!customerId || customerId === 'undefined') {
          throw new Error('無效的客戶ID')
        }

        // 載入資料
        setCustomer(mockCustomer)
        setInteractions(mockInteractions)
        setOpportunities(mockOpportunities)

      } catch (err) {
        console.error('載入客戶資料失敗:', err)
        setError(err instanceof Error ? err.message : '載入客戶資料時發生錯誤')
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomerData()
  }, [customerId])

  // 狀態樣式映射
  const getStatusBadge = (status: string) => {
    const statusMap = {
      customer: { label: '客戶', color: 'bg-green-100 text-green-700' },
      prospect: { label: '潛在客戶', color: 'bg-blue-100 text-blue-700' },
      active: { label: '活躍', color: 'bg-yellow-100 text-yellow-700' },
      inactive: { label: '非活躍', color: 'bg-gray-100 text-gray-700' }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.active
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: { label: '高優先級', color: 'bg-red-100 text-red-700' },
      medium: { label: '中優先級', color: 'bg-yellow-100 text-yellow-700' },
      low: { label: '低優先級', color: 'bg-green-100 text-green-700' }
    }
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium
  }

  // 互動類型圖示
  const getInteractionIcon = (type: string) => {
    const iconMap = {
      email: <Mail className="h-4 w-4" />,
      call: <Phone className="h-4 w-4" />,
      meeting: <Calendar className="h-4 w-4" />,
      note: <MessageSquare className="h-4 w-4" />,
      proposal: <FileText className="h-4 w-4" />
    }
    return iconMap[type as keyof typeof iconMap] || <MessageSquare className="h-4 w-4" />
  }

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">載入客戶資料中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 錯誤狀態
  if (error || !customer) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              載入客戶資料失敗
            </h3>
            <p className="text-gray-600 mb-4">
              {error || '找不到指定的客戶資料'}
            </p>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                返回上頁
              </Button>
              <Button onClick={() => window.location.reload()}>
                重新載入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusBadge = getStatusBadge(customer.status)
  const priorityBadge = getPriorityBadge(customer.priority)

  return (
    <div className="container mx-auto py-6">
      {/* 導航和標題 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回客戶列表
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={customer.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                {customer.company_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {customer.company_name}
              </h1>
              <p className="text-lg text-gray-600 mb-3">
                {customer.contact_name} • {customer.industry}
              </p>
              <div className="flex items-center space-x-2">
                <Badge className={statusBadge.color}>
                  {statusBadge.label}
                </Badge>
                <Badge className={priorityBadge.color}>
                  {priorityBadge.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              發送郵件
            </Button>
          </div>
        </div>
      </div>

      {/* 關鍵指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(customer.revenue_potential)}
            </div>
            <div className="text-sm text-gray-600">收益潛力</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {opportunities.length}
            </div>
            <div className="text-sm text-gray-600">銷售機會</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {interactions.length}
            </div>
            <div className="text-sm text-gray-600">互動記錄</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {formatDate(customer.last_interaction)}
            </div>
            <div className="text-sm text-gray-600">最後互動</div>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容標籤頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">客戶概覽</TabsTrigger>
          <TabsTrigger value="interactions">互動歷史</TabsTrigger>
          <TabsTrigger value="opportunities">銷售機會</TabsTrigger>
          <TabsTrigger value="360view">360度視圖</TabsTrigger>
        </TabsList>

        {/* 客戶概覽 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 基本資訊 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>基本資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">公司名稱</label>
                      <p className="text-lg">{customer.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">聯絡人</label>
                      <p className="text-lg">{customer.contact_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">電子郵件</label>
                      <p className="text-lg">{customer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">電話</label>
                      <p className="text-lg">{customer.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">地址</label>
                      <p className="text-lg">{customer.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">網站</label>
                      <p className="text-lg text-blue-600">{customer.website}</p>
                    </div>
                  </div>
                  {customer.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">公司描述</label>
                      <p className="text-gray-800 mt-1">{customer.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 最近互動 */}
              <Card>
                <CardHeader>
                  <CardTitle>最近互動</CardTitle>
                  <CardDescription>最近5次互動記錄</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interactions.slice(0, 5).map((interaction) => (
                      <div key={interaction.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          {getInteractionIcon(interaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {interaction.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(interaction.date)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {interaction.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 快速操作側邊欄 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>快速操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    發送郵件
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    撥打電話
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    安排會議
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    新增筆記
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    建立提案
                  </Button>
                </CardContent>
              </Card>

              {/* 銷售機會摘要 */}
              <Card>
                <CardHeader>
                  <CardTitle>銷售機會</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {opportunities.map((opportunity) => (
                      <div key={opportunity.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium truncate">
                            {opportunity.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.probability}%
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(opportunity.value)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {opportunity.stage}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 互動歷史 */}
        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>互動歷史時間線</CardTitle>
              <CardDescription>完整的客戶互動記錄和時間線</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {interactions.map((interaction, index) => (
                  <div key={interaction.id} className="relative">
                    {/* 時間線連接線 */}
                    {index !== interactions.length - 1 && (
                      <div className="absolute left-4 top-8 w-px h-12 bg-gray-200" />
                    )}

                    <div className="flex items-start space-x-4">
                      {/* 圖示 */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        {getInteractionIcon(interaction.type)}
                      </div>

                      {/* 內容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {interaction.title}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(interaction.date)}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">
                          {interaction.description}
                        </p>

                        <div className="text-sm text-gray-500 mb-2">
                          <strong>參與者:</strong> {interaction.participant}
                        </div>

                        {interaction.outcome && (
                          <div className="text-sm text-gray-700 mb-2 p-2 bg-green-50 rounded">
                            <strong>結果:</strong> {interaction.outcome}
                          </div>
                        )}

                        {interaction.next_action && (
                          <div className="text-sm text-gray-700 p-2 bg-yellow-50 rounded">
                            <strong>後續行動:</strong> {interaction.next_action}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 銷售機會 */}
        <TabsContent value="opportunities">
          <div className="space-y-6">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{opportunity.name}</CardTitle>
                    <Badge className="bg-green-100 text-green-700">
                      {opportunity.probability}% 機率
                    </Badge>
                  </div>
                  <CardDescription>{opportunity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">金額</label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(opportunity.value)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">階段</label>
                      <p className="text-lg">{opportunity.stage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">預期結案</label>
                      <p className="text-lg">{formatDate(opportunity.expected_close_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">最後更新</label>
                      <p className="text-lg">{formatDate(opportunity.last_update)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 360度視圖 */}
        <TabsContent value="360view">
          <Customer360View customerId={parseInt(customerId)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}