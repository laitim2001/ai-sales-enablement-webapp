/**
 * 客戶360度視圖組件
 *
 * 功能：
 * - 顯示客戶完整檔案和概況
 * - 展示聯絡人、銷售機會、互動歷史
 * - 提供AI洞察和建議
 * - 支援客戶資料編輯和更新
 * - 整合知識庫相關內容
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  TrendingUp,
  AlertCircle,
  Star,
  MessageSquare,
  FileText,
  BarChart3,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 客戶360度視圖數據類型
interface Customer360Data {
  customer: {
    id: number;
    company_name: string;
    email: string;
    phone?: string;
    website?: string;
    industry: string;
    company_size: string;
    status: string;
    description?: string;
    created_at: string;
    updated_at: string;
    location?: {
      city?: string;
      country?: string;
      address?: string;
    };
  };

  contacts: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    job_title: string;
    department?: string;
    is_primary: boolean;
    last_contact: string;
  }>;

  opportunities: Array<{
    id: number;
    title: string;
    description?: string;
    estimated_value?: number;
    close_probability?: number;
    expected_close_date?: string;
    status: string;
    stage: string;
    owner?: string;
    created_at: string;
  }>;

  interactions: Array<{
    id: number;
    type: string;
    subject: string;
    description?: string;
    outcome?: string;
    created_at: string;
    user_name?: string;
    contact_name?: string;
  }>;

  insights: {
    engagement_score: number;
    purchase_likelihood: number;
    total_value: number;
    avg_deal_size: number;
    cycle_length_days: number;
    last_interaction: string;
    next_recommended_action: string;
    risk_factors: string[];
    strengths: string[];
  };

  related_knowledge: Array<{
    id: string;
    title: string;
    type: string;
    relevance_score: number;
    summary?: string;
  }>;
}

interface Customer360ViewProps {
  customerId: number;
  onClose?: () => void;
}

/**
 * 客戶360度視圖組件
 */
export function Customer360View({ customerId, onClose }: Customer360ViewProps) {
  const [data, setData] = useState<Customer360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 加載客戶360度數據
  useEffect(() => {
    const loadCustomer360Data = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/customers/${customerId}/360-view`);
        if (!response.ok) {
          throw new Error('無法載入客戶資料');
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || '載入客戶資料失敗');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生未知錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer360Data();
  }, [customerId]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhTW });
  };

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取公司規模圖標
  const getCompanySizeIcon = (size: string) => {
    switch (size.toLowerCase()) {
      case 'startup': return '🚀';
      case 'small': return '🏢';
      case 'medium': return '🏬';
      case 'large': return '🏭';
      case 'enterprise': return '🌆';
      default: return '🏢';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-lg">載入客戶資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重新載入</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">找不到客戶資料</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, contacts, opportunities, interactions, insights, related_knowledge } = data;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* 客戶標題區域 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${customer.company_name}&background=random`} />
            <AvatarFallback>
              {customer.company_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {customer.company_name}
              <span className="text-2xl">{getCompanySizeIcon(customer.company_size)}</span>
            </h1>
            <p className="text-lg text-muted-foreground">{customer.industry}</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={getStatusColor(customer.status)}>
                {customer.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                客戶編號: #{customer.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline">編輯客戶</Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>關閉</Button>
          )}
        </div>
      </div>

      {/* 關鍵指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">參與度分數</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.engagement_score}%</div>
            <Progress value={insights.engagement_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">購買可能性</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.purchase_likelihood}%</div>
            <Progress value={insights.purchase_likelihood} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總價值</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(insights.total_value)}</div>
            <p className="text-xs text-muted-foreground">
              平均交易: {formatCurrency(insights.avg_deal_size)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">銷售週期</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.cycle_length_days}天</div>
            <p className="text-xs text-muted-foreground">
              最後互動: {formatDate(insights.last_interaction)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容標籤頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">概況</TabsTrigger>
          <TabsTrigger value="contacts">聯絡人</TabsTrigger>
          <TabsTrigger value="opportunities">銷售機會</TabsTrigger>
          <TabsTrigger value="interactions">互動歷史</TabsTrigger>
          <TabsTrigger value="insights">AI洞察</TabsTrigger>
          <TabsTrigger value="knowledge">相關知識</TabsTrigger>
        </TabsList>

        {/* 概況標籤 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  基本資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">公司名稱</Label>
                    <p>{customer.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">行業</Label>
                    <p>{customer.industry}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">公司規模</Label>
                    <p>{customer.company_size}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">狀態</Label>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  )}
                  {customer.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={customer.website} target="_blank" rel="noopener noreferrer"
                         className="text-sm text-blue-600 hover:underline">
                        {customer.website}
                      </a>
                    </div>
                  )}
                  {customer.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {[customer.location.city, customer.location.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {customer.description && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">描述</Label>
                      <p className="text-sm text-muted-foreground mt-1">{customer.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 快速統計 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  快速統計
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
                    <p className="text-sm text-muted-foreground">聯絡人</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{opportunities.length}</div>
                    <p className="text-sm text-muted-foreground">銷售機會</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{interactions.length}</div>
                    <p className="text-sm text-muted-foreground">互動記錄</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{related_knowledge.length}</div>
                    <p className="text-sm text-muted-foreground">相關知識</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">建立時間</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(customer.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">最後更新</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(customer.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 聯絡人標籤 */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">聯絡人 ({contacts.length})</h3>
            <Button>新增聯絡人</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{contact.name}</CardTitle>
                    {contact.is_primary && (
                      <Badge variant="secondary">主要聯絡人</Badge>
                    )}
                  </div>
                  <CardDescription>{contact.job_title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contact.department && (
                    <p className="text-sm text-muted-foreground">部門: {contact.department}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    最後聯絡: {formatDate(contact.last_contact)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {contacts.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">尚無聯絡人資料</p>
                <Button variant="outline" className="mt-4">新增第一個聯絡人</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 銷售機會標籤 */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">銷售機會 ({opportunities.length})</h3>
            <Button>新增機會</Button>
          </div>

          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {opportunity.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {opportunity.estimated_value && formatCurrency(opportunity.estimated_value)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        成交機率: {opportunity.close_probability || 0}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(opportunity.status)}>
                        {opportunity.status}
                      </Badge>
                      <span className="text-muted-foreground">階段: {opportunity.stage}</span>
                      {opportunity.owner && (
                        <span className="text-muted-foreground">負責人: {opportunity.owner}</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {opportunity.expected_close_date &&
                        `預計結案: ${formatDate(opportunity.expected_close_date)}`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {opportunities.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">尚無銷售機會</p>
                <Button variant="outline" className="mt-4">新增第一個機會</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 互動歷史標籤 */}
        <TabsContent value="interactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">互動歷史 ({interactions.length})</h3>
            <Button>記錄新互動</Button>
          </div>

          <div className="space-y-4">
            {interactions.map((interaction) => (
              <Card key={interaction.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{interaction.subject}</CardTitle>
                    <Badge variant="outline">{interaction.type}</Badge>
                  </div>
                  <CardDescription>
                    {formatDate(interaction.created_at)}
                    {interaction.user_name && ` • ${interaction.user_name}`}
                    {interaction.contact_name && ` • 聯絡人: ${interaction.contact_name}`}
                  </CardDescription>
                </CardHeader>
                {(interaction.description || interaction.outcome) && (
                  <CardContent className="pt-0">
                    {interaction.description && (
                      <p className="text-sm mb-2">{interaction.description}</p>
                    )}
                    {interaction.outcome && (
                      <div className="text-sm bg-muted/50 p-2 rounded">
                        <strong>結果:</strong> {interaction.outcome}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {interactions.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">尚無互動記錄</p>
                <Button variant="outline" className="mt-4">記錄第一次互動</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI洞察標籤 */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 建議行動 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  建議行動
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">{insights.next_recommended_action}</p>
                </div>
              </CardContent>
            </Card>

            {/* 風險因素 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  風險因素
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.risk_factors.map((risk, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{risk}</span>
                    </div>
                  ))}
                </div>
                {insights.risk_factors.length === 0 && (
                  <p className="text-sm text-muted-foreground">目前沒有發現風險因素</p>
                )}
              </CardContent>
            </Card>

            {/* 客戶優勢 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  客戶優勢
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
                {insights.strengths.length === 0 && (
                  <p className="text-sm text-muted-foreground">暫無優勢分析</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 相關知識標籤 */}
        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">相關知識 ({related_knowledge.length})</h3>
          </div>

          <div className="space-y-4">
            {related_knowledge.map((knowledge) => (
              <Card key={knowledge.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{knowledge.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{knowledge.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        相關性: {Math.round(knowledge.relevance_score * 100)}%
                      </span>
                    </div>
                  </div>
                  {knowledge.summary && (
                    <CardDescription>{knowledge.summary}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {related_knowledge.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">尚無相關知識庫內容</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}