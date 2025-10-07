/**
 * @fileoverview ================================================================AI銷售賦能平台 - 客戶管理頁面 (app/dashboard/customers/page.tsx)================================================================【檔案功能】提供完整的客戶管理界面，整合Dynamics 365 CRM數據，支援客戶列表查看、搜尋篩選、狀態管理，為銷售團隊提供統一的客戶資料管理入口。【主要職責】• 客戶列表顯示 - 展示客戶基本資訊和關鍵指標• 智能搜尋篩選 - 按公司名稱、行業、狀態等條件過濾• 客戶狀態管理 - 顯示客戶階段、優先級和互動狀態• 快速操作功能 - 查看詳情、發送郵件、安排會議• 批量操作支援 - 選取多個客戶進行批量處理【頁面結構】• 標題區域 - 客戶管理功能介紹和統計概覽• 操作工具列 - 搜尋框、篩選器、新增客戶按鈕• 客戶列表區 - 分頁的客戶卡片或表格顯示• 狀態指示器 - 載入中、無數據、錯誤狀態處理【功能特色】• CRM整合 - 即時同步Dynamics 365客戶數據• 響應式設計 - 支援桌面和行動設備瀏覽• 搜尋建議 - 智能搜尋建議和歷史搜尋• 狀態篩選 - 按客戶階段、行業、地區篩選• 排序功能 - 按名稱、創建時間、最後互動排序【用戶流程】1. 檢視客戶列表和基本統計資訊2. 使用搜尋和篩選功能找到目標客戶3. 查看客戶詳細資訊和互動歷史4. 執行快速操作（郵件、會議、筆記）5. 批量選取客戶進行群組操作【狀態管理】• customers: Customer[]客戶列表數據• searchQuery: 搜尋查詢字串• filters: 篩選條件物件• isLoading: 數據載入狀態• selectedCustomers: 已選取的客戶ID陣列【相關檔案】• components/crm/customer-360-view.tsx - 客戶360度視圖組件• app/api/customers/route.ts - 客戶API路由• app/api/search/crm/route.ts - CRM搜尋API• lib/integrations/dynamics365/ - Dynamics 365整合服務【開發注意】• 數據同步：定期同步CRM數據，處理同步衝突• 性能優化：大量客戶數據的虛擬化和分頁處理• 錯誤處理：CRM連接失敗和數據不一致的處理• 權限控制：基於角色的客戶數據訪問權限• 緩存策略：適當的客戶數據緩存和失效機制
 * @module app/dashboard/customers/page
 * @description
 * ================================================================AI銷售賦能平台 - 客戶管理頁面 (app/dashboard/customers/page.tsx)================================================================【檔案功能】提供完整的客戶管理界面，整合Dynamics 365 CRM數據，支援客戶列表查看、搜尋篩選、狀態管理，為銷售團隊提供統一的客戶資料管理入口。【主要職責】• 客戶列表顯示 - 展示客戶基本資訊和關鍵指標• 智能搜尋篩選 - 按公司名稱、行業、狀態等條件過濾• 客戶狀態管理 - 顯示客戶階段、優先級和互動狀態• 快速操作功能 - 查看詳情、發送郵件、安排會議• 批量操作支援 - 選取多個客戶進行批量處理【頁面結構】• 標題區域 - 客戶管理功能介紹和統計概覽• 操作工具列 - 搜尋框、篩選器、新增客戶按鈕• 客戶列表區 - 分頁的客戶卡片或表格顯示• 狀態指示器 - 載入中、無數據、錯誤狀態處理【功能特色】• CRM整合 - 即時同步Dynamics 365客戶數據• 響應式設計 - 支援桌面和行動設備瀏覽• 搜尋建議 - 智能搜尋建議和歷史搜尋• 狀態篩選 - 按客戶階段、行業、地區篩選• 排序功能 - 按名稱、創建時間、最後互動排序【用戶流程】1. 檢視客戶列表和基本統計資訊2. 使用搜尋和篩選功能找到目標客戶3. 查看客戶詳細資訊和互動歷史4. 執行快速操作（郵件、會議、筆記）5. 批量選取客戶進行群組操作【狀態管理】• customers: Customer[]客戶列表數據• searchQuery: 搜尋查詢字串• filters: 篩選條件物件• isLoading: 數據載入狀態• selectedCustomers: 已選取的客戶ID陣列【相關檔案】• components/crm/customer-360-view.tsx - 客戶360度視圖組件• app/api/customers/route.ts - 客戶API路由• app/api/search/crm/route.ts - CRM搜尋API• lib/integrations/dynamics365/ - Dynamics 365整合服務【開發注意】• 數據同步：定期同步CRM數據，處理同步衝突• 性能優化：大量客戶數據的虛擬化和分頁處理• 錯誤處理：CRM連接失敗和數據不一致的處理• 權限控制：基於角色的客戶數據訪問權限• 緩存策略：適當的客戶數據緩存和失效機制
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, Users, Building2, Mail, Phone, MapPin, Eye, MoreHorizontal, Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 客戶數據介面定義
interface Customer {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  industry: string
  status: 'active' | 'inactive' | 'prospect' | 'customer'
  priority: 'high' | 'medium' | 'low'
  revenue_potential: number
  last_interaction: string
  created_date: string
  notes_count: number
  opportunities_count: number
  avatar_url?: string
}

// 篩選條件介面
interface CustomerFilters {
  status: string
  industry: string
  priority: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function CustomersPage() {
  // 狀態管理
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'all',
    industry: 'all',
    priority: 'all',
    sortBy: 'company_name',
    sortOrder: 'asc'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // 模擬客戶數據
  const mockCustomers: Customer[] = [
    {
      id: '1',
      company_name: 'TechCorp Solutions',
      contact_name: '張經理',
      email: 'zhang@techcorp.com',
      phone: '+60 3-1234-5678',
      address: '吉隆坡, 馬來西亞',
      industry: '科技',
      status: 'customer',
      priority: 'high',
      revenue_potential: 250000,
      last_interaction: '2024-09-27',
      created_date: '2024-08-15',
      notes_count: 12,
      opportunities_count: 3
    },
    {
      id: '2',
      company_name: 'Global Trading Pte Ltd',
      contact_name: '李總監',
      email: 'li@globaltrading.sg',
      phone: '+65 6789-0123',
      address: '新加坡',
      industry: '貿易',
      status: 'prospect',
      priority: 'medium',
      revenue_potential: 180000,
      last_interaction: '2024-09-25',
      created_date: '2024-09-01',
      notes_count: 8,
      opportunities_count: 2
    },
    {
      id: '3',
      company_name: 'Manufacturing Excellence',
      contact_name: '王副總',
      email: 'wang@manufacturing.com',
      phone: '+60 4-5678-9012',
      address: '檳城, 馬來西亞',
      industry: '製造業',
      status: 'active',
      priority: 'high',
      revenue_potential: 320000,
      last_interaction: '2024-09-26',
      created_date: '2024-07-20',
      notes_count: 15,
      opportunities_count: 4
    },
    {
      id: '4',
      company_name: 'Digital Finance Group',
      contact_name: '陳執行長',
      email: 'chen@digitalfinance.sg',
      phone: '+65 8901-2345',
      address: '新加坡',
      industry: '金融',
      status: 'customer',
      priority: 'high',
      revenue_potential: 500000,
      last_interaction: '2024-09-28',
      created_date: '2024-06-10',
      notes_count: 20,
      opportunities_count: 5
    },
    {
      id: '5',
      company_name: 'Retail Innovation Hub',
      contact_name: '林經理',
      email: 'lin@retailhub.com',
      phone: '+60 7-2345-6789',
      address: '新山, 馬來西亞',
      industry: '零售',
      status: 'inactive',
      priority: 'low',
      revenue_potential: 80000,
      last_interaction: '2024-08-15',
      created_date: '2024-05-30',
      notes_count: 5,
      opportunities_count: 1
    },
    {
      id: '6',
      company_name: 'Healthcare Systems Ltd',
      contact_name: '黃醫師',
      email: 'huang@healthcare.sg',
      phone: '+65 3456-7890',
      address: '新加坡',
      industry: '醫療',
      status: 'prospect',
      priority: 'medium',
      revenue_potential: 220000,
      last_interaction: '2024-09-24',
      created_date: '2024-08-05',
      notes_count: 10,
      opportunities_count: 2
    }
  ]

  // 載入客戶數據
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true)
      try {
        // 模擬API調用延遲
        await new Promise(resolve => setTimeout(resolve, 1500))
        setCustomers(mockCustomers)
        setFilteredCustomers(mockCustomers)
      } catch (error) {
        console.error('載入客戶數據失敗:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  // 搜尋和篩選邏輯
  useEffect(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch =
        customer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.industry.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filters.status === 'all' || customer.status === filters.status
      const matchesIndustry = filters.industry === 'all' || customer.industry === filters.industry
      const matchesPriority = filters.priority === 'all' || customer.priority === filters.priority

      return matchesSearch && matchesStatus && matchesIndustry && matchesPriority
    })

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Customer]
      const bValue = b[filters.sortBy as keyof Customer]

      // 處理可能為 undefined 的值
      if (aValue === undefined || bValue === undefined) {
        return 0
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredCustomers(filtered)
    setCurrentPage(1) // 重置分頁
  }, [searchQuery, filters, customers])

  // 分頁計算
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  // 狀態樣式映射
  const getStatusBadge = (status: string) => {
    const statusMap = {
      customer: { label: '客戶', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
      prospect: { label: '潛在客戶', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-700' },
      active: { label: '活躍', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-700' },
      inactive: { label: '非活躍', variant: 'outline' as const, color: 'bg-gray-100 text-gray-700' }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.active
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: { label: '高', color: 'bg-red-100 text-red-700' },
      medium: { label: '中', color: 'bg-yellow-100 text-yellow-700' },
      low: { label: '低', color: 'bg-green-100 text-green-700' }
    }
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium
  }

  // 格式化數字
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // 處理客戶選擇
  const handleCustomerSelect = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId])
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    }
  }

  // 處理全選
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(currentCustomers.map(c => c.id))
    } else {
      setSelectedCustomers([])
    }
  }

  // 統計數據
  const customerStats = {
    total: customers.length,
    customers: customers.filter(c => c.status === 'customer').length,
    prospects: customers.filter(c => c.status === 'prospect').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.revenue_potential, 0)
  }

  return (
    <div className="container mx-auto py-6">
      {/* 頁面標題和統計 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">客戶管理</h1>
            <p className="text-gray-600">
              管理和檢視所有客戶資料，追蹤銷售機會和互動歷史
            </p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>新增客戶</span>
          </Button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{customerStats.total}</div>
                  <div className="text-sm text-gray-600">總客戶數</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{customerStats.customers}</div>
                  <div className="text-sm text-gray-600">正式客戶</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{customerStats.prospects}</div>
                  <div className="text-sm text-gray-600">潛在客戶</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 text-purple-600 flex items-center justify-center bg-purple-100 rounded">$</div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(customerStats.totalRevenue)}</div>
                  <div className="text-sm text-gray-600">總潛在收益</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 搜尋和篩選工具列 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* 搜尋框 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋公司名稱、聯絡人或郵箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 篩選器 */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="customer">客戶</SelectItem>
                  <SelectItem value="prospect">潛在客戶</SelectItem>
                  <SelectItem value="active">活躍</SelectItem>
                  <SelectItem value="inactive">非活躍</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.industry} onValueChange={(value) => setFilters({...filters, industry: value})}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="行業" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有行業</SelectItem>
                  <SelectItem value="科技">科技</SelectItem>
                  <SelectItem value="金融">金融</SelectItem>
                  <SelectItem value="製造業">製造業</SelectItem>
                  <SelectItem value="貿易">貿易</SelectItem>
                  <SelectItem value="零售">零售</SelectItem>
                  <SelectItem value="醫療">醫療</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="優先級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有優先級</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_name">公司名稱</SelectItem>
                  <SelectItem value="created_date">創建時間</SelectItem>
                  <SelectItem value="last_interaction">最後互動</SelectItem>
                  <SelectItem value="revenue_potential">收益潛力</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedCustomers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  已選擇 {selectedCustomers.length} 個客戶
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    發送郵件
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    安排會議
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCustomers([])}>
                    取消選擇
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 客戶列表 */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">載入客戶數據中...</p>
          </CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              沒有找到符合條件的客戶
            </h3>
            <p className="text-gray-600 mb-4">
              嘗試調整搜尋條件或篩選器
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('')
              setFilters({
                status: 'all',
                industry: 'all',
                priority: 'all',
                sortBy: 'company_name',
                sortOrder: 'asc'
              })
            }}>
              清除篩選
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 客戶卡片網格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentCustomers.map((customer) => {
              const statusBadge = getStatusBadge(customer.status)
              const priorityBadge = getPriorityBadge(customer.priority)
              const isSelected = selectedCustomers.includes(customer.id)

              return (
                <Card key={customer.id} className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCustomerSelect(customer.id, checked as boolean)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatar_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {customer.company_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{customer.company_name}</CardTitle>
                          <CardDescription className="text-sm">{customer.contact_name}</CardDescription>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            查看詳情
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            發送郵件
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            撥打電話
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            安排會議
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <Badge className={statusBadge.color}>
                        {statusBadge.label}
                      </Badge>
                      <Badge variant="outline" className={priorityBadge.color}>
                        優先級: {priorityBadge.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* 聯絡資訊 */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      </div>

                      {/* 關鍵指標 */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(customer.revenue_potential)}
                          </div>
                          <div className="text-xs text-gray-500">收益潛力</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {customer.opportunities_count}
                          </div>
                          <div className="text-xs text-gray-500">銷售機會</div>
                        </div>
                      </div>

                      {/* 最後互動 */}
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                        最後互動: {new Date(customer.last_interaction).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                顯示 {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} 筆，
                共 {filteredCustomers.length} 筆客戶
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一頁
                </Button>
                <span className="text-sm text-gray-600">
                  第 {currentPage} 頁，共 {totalPages} 頁
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}