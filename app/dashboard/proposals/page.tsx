/**
 * @fileoverview 提案管理主頁面功能：- 提案範本管理和瀏覽- AI提案生成入口- 生成歷史查看- 範本搜尋和篩選作者：Claude Code創建時間：2025-09-28
 * @module app/dashboard/proposals/page
 * @description
 * 提案管理主頁面功能：- 提案範本管理和瀏覽- AI提案生成入口- 生成歷史查看- 範本搜尋和篩選作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// 提案範本介面
interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  access_level: string;
  usage_count: number;
  variables_count: number;
  generations_count: number;
  is_active: boolean;
  creator: {
    username: string;
  };
  created_at: string;
  updated_at: string;
}

// 生成歷史介面
interface GenerationHistory {
  id: string;
  title: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  qualityScore?: number;
  generatedAt: string;
  template: {
    name: string;
    category: string;
  };
  generator: {
    username: string;
  };
  customer?: {
    company_name: string;
  };
}

const ProposalsPage: React.FC = () => {
  // 狀態管理
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [generations, setGenerations] = useState<GenerationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('templates');

  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // 統計數據
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalUsage: 0,
    activeTemplates: 0
  });

  // 載入範本數據
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus === 'all' ? 'active' : selectedStatus,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        userId: '1' // TODO: 從認證上下文獲取
      });

      const response = await fetch(`/api/proposal-templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates);
        setTotalPages(data.data.pagination.totalPages);
        setStats(data.data.stats);
      } else {
        console.error('載入範本失敗:', data.message);
      }
    } catch (error) {
      console.error('載入範本錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入生成歷史
  const loadGenerations = async () => {
    try {
      const params = new URLSearchParams({
        userId: '1', // TODO: 從認證上下文獲取
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      const response = await fetch(`/api/ai/generate-proposal?${params}`);
      const data = await response.json();

      if (data.success) {
        setGenerations(data.data.generations);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('載入生成歷史錯誤:', error);
    }
  };

  // 初始載入和搜尋效果
  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'history') {
      loadGenerations();
    }
  }, [activeTab, currentPage, searchQuery, selectedCategory, selectedStatus]);

  // 獲取分類標籤顏色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'BUSINESS_PROPOSAL': 'bg-blue-100 text-blue-800',
      'PRODUCT_DESCRIPTION': 'bg-green-100 text-green-800',
      'MARKETING_EMAIL': 'bg-purple-100 text-purple-800',
      'TECHNICAL_SPECIFICATION': 'bg-orange-100 text-orange-800',
      'SALES_PITCH': 'bg-red-100 text-red-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['OTHER'];
  };

  // 獲取狀態標籤顏色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'GENERATING': 'bg-yellow-100 text-yellow-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['FAILED'];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頁面標題和操作 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI提案管理</h1>
          <p className="text-gray-600 mt-2">管理提案範本，使用AI生成個性化提案內容</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/proposals/templates/new">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              新建範本
            </Button>
          </Link>
          <Link href="/dashboard/proposals/generate">
            <Button variant="outline" className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              AI生成提案
            </Button>
          </Link>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總範本數</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              其中 {stats.activeTemplates} 個啟用中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總使用次數</CardTitle>
            <SparklesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              累計AI生成次數
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近生成</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generations.length}</div>
            <p className="text-xs text-muted-foreground">
              本頁顯示的生成記錄
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容標籤頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">範本管理</TabsTrigger>
          <TabsTrigger value="history">生成歷史</TabsTrigger>
        </TabsList>

        {/* 範本管理標籤頁 */}
        <TabsContent value="templates" className="space-y-6">
          {/* 搜尋和篩選 */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜尋範本名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分類</SelectItem>
                  <SelectItem value="BUSINESS_PROPOSAL">商業提案</SelectItem>
                  <SelectItem value="PRODUCT_DESCRIPTION">產品描述</SelectItem>
                  <SelectItem value="MARKETING_EMAIL">行銷郵件</SelectItem>
                  <SelectItem value="TECHNICAL_SPECIFICATION">技術規格</SelectItem>
                  <SelectItem value="SALES_PITCH">銷售簡報</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="active">啟用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 範本列表 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {template.description || '無描述'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 範本統計 */}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>使用次數: {template.usage_count}</span>
                        <span>變數: {template.variables_count}</span>
                      </div>

                      {/* 範本信息 */}
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>創建者: {template.creator.username}</span>
                        <span>
                          {new Date(template.updated_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="flex gap-2">
                        <Link href={`/dashboard/proposals/generate?templateId=${template.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            使用生成
                          </Button>
                        </Link>
                        <Link href={`/dashboard/proposals/templates/${template.id}`}>
                          <Button variant="ghost" size="sm">
                            查看
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                上一頁
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                第 {currentPage} 頁，共 {totalPages} 頁
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 生成歷史標籤頁 */}
        <TabsContent value="history" className="space-y-6">
          <div className="space-y-4">
            {generations.map((generation) => (
              <Card key={generation.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{generation.title}</h3>
                        <Badge className={getStatusColor(generation.status)}>
                          {generation.status}
                        </Badge>
                        {generation.qualityScore && (
                          <Badge variant="outline">
                            品質: {generation.qualityScore}%
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>範本: {generation.template.name} ({generation.template.category})</p>
                        <p>生成者: {generation.generator.username}</p>
                        {generation.customer && (
                          <p>客戶: {generation.customer.company_name}</p>
                        )}
                        <p>生成時間: {new Date(generation.generatedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/proposals/generation/${generation.id}`}>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </Link>
                      {generation.status === 'COMPLETED' && (
                        <Button variant="ghost" size="sm">
                          重新生成
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 空狀態 */}
          {generations.length === 0 && !loading && (
            <div className="text-center py-12">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有生成記錄</h3>
              <p className="text-gray-600 mb-4">開始使用AI生成您的第一份提案吧！</p>
              <Link href="/dashboard/proposals/generate">
                <Button>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  開始生成
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProposalsPage;