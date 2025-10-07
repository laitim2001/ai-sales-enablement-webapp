/**
 * @fileoverview 範本管理列表頁面功能：- 範本列表展示（卡片視圖）- 範本搜索和過濾（分類/關鍵字）- 範本操作（編輯/複製/刪除/預覽）- 範本統計概覽- 創建新範本@author Claude Code@date 2025-10-02
 * @module app/dashboard/templates/page
 * @description
 * 範本管理列表頁面功能：- 範本列表展示（卡片視圖）- 範本搜索和過濾（分類/關鍵字）- 範本操作（編輯/複製/刪除/預覽）- 範本統計概覽- 創建新範本@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
  Clock,
  User,
  TrendingUp,
} from 'lucide-react';

// 範本類型定義
interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  creator: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  _count: {
    generations: number;
  };
}

// 統計信息類型
interface Stats {
  totalTemplates: number;
  templatesByCategory: Record<string, number>;
  mostUsedTemplates: Template[];
  recentTemplates: Template[];
}

// 範本分類標籤映射
const categoryLabels: Record<string, string> = {
  SALES_PROPOSAL: '銷售提案',
  PRODUCT_DEMO: '產品演示',
  SERVICE_PROPOSAL: '服務提案',
  PRICING_QUOTE: '價格報價',
  TECHNICAL_PROPOSAL: '技術提案',
  PARTNERSHIP: '合作提案',
  RENEWAL: '續約提案',
  CUSTOM: '自定義',
};

// 範本分類顏色映射
const categoryColors: Record<string, string> = {
  SALES_PROPOSAL: 'bg-blue-100 text-blue-800',
  PRODUCT_DEMO: 'bg-green-100 text-green-800',
  SERVICE_PROPOSAL: 'bg-purple-100 text-purple-800',
  PRICING_QUOTE: 'bg-yellow-100 text-yellow-800',
  TECHNICAL_PROPOSAL: 'bg-red-100 text-red-800',
  PARTNERSHIP: 'bg-indigo-100 text-indigo-800',
  RENEWAL: 'bg-pink-100 text-pink-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
};

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // 狀態管理
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 載入範本列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
      });

      const response = await fetch(`/api/templates?${params}`);
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data.templates);
        setTotalPages(Math.ceil(result.data.total / result.data.pageSize));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '載入失敗',
        description: error instanceof Error ? error.message : '無法載入範本列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 載入統計信息
  const loadStats = async () => {
    try {
      const response = await fetch('/api/templates/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('載入統計信息失敗:', error);
    }
  };

  // 初始載入
  useEffect(() => {
    loadTemplates();
    loadStats();
  }, [currentPage, categoryFilter]);

  // 搜索處理（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadTemplates();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 刪除範本
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要刪除範本「${name}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '刪除成功',
          description: '範本已成功刪除',
        });
        loadTemplates();
        loadStats();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error instanceof Error ? error.message : '無法刪除範本',
        variant: 'destructive',
      });
    }
  };

  // 複製範本
  const handleDuplicate = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/templates/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${name} (副本)` }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '複製成功',
          description: '範本已成功複製',
        });
        loadTemplates();
        loadStats();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '複製失敗',
        description: error instanceof Error ? error.message : '無法複製範本',
        variant: 'destructive',
      });
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 頁面標題和統計 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">提案範本管理</h1>
            <p className="text-gray-600">創建和管理可重複使用的提案範本</p>
          </div>
          <Button onClick={() => router.push('/dashboard/templates/new')} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            新增範本
          </Button>
        </div>

        {/* 統計卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">總範本數</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <FileText className="inline h-3 w-3 mr-1" />
                  可用範本
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">最常用</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.mostUsedTemplates[0]?.usage_count || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {stats.mostUsedTemplates[0]?.name || '暫無數據'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">範本分類</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.templatesByCategory).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <Filter className="inline h-3 w-3 mr-1" />
                  個分類
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">最近更新</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentTemplates.length}</div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {stats.recentTemplates[0] ? formatDate(stats.recentTemplates[0].updated_at) : '暫無'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 搜索和過濾 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索範本名稱或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="選擇分類" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有分類</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 範本列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">暫無範本</p>
            <Button onClick={() => router.push('/dashboard/templates/new')}>
              <Plus className="mr-2 h-4 w-4" />
              創建第一個範本
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                      <div className="flex gap-2 mb-2">
                        <Badge className={categoryColors[template.category]}>
                          {categoryLabels[template.category]}
                        </Badge>
                        {template.is_default && (
                          <Badge variant="outline">預設</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          編輯
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/templates/${template.id}/preview`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          預覽
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template.id, template.name)}>
                          <Copy className="mr-2 h-4 w-4" />
                          複製
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id, template.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description || '暫無描述'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {template.creator.first_name} {template.creator.last_name}
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      使用 {template.usage_count} 次
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDate(template.updated_at)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                  >
                    查看詳情
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一頁
              </Button>
              <span className="text-sm text-gray-600">
                第 {currentPage} / {totalPages} 頁
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
