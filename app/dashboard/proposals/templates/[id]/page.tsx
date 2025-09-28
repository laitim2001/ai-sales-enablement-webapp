/**
 * 提案範本詳情頁面
 *
 * 功能：
 * - 查看範本詳細信息
 * - 編輯範本內容和變數
 * - 測試範本渲染效果
 * - 範本使用統計和歷史
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PencilIcon,
  SparklesIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// 範本詳情介面
interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: Record<string, any>;
  access_level: string;
  version: number;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  creator: {
    username: string;
    email: string;
  };
  updater?: {
    username: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

// 使用統計介面
interface UsageStats {
  totalGenerations: number;
  successfulGenerations: number;
  averageQualityScore: number;
  mostUsedVariables: Array<{
    name: string;
    usageCount: number;
  }>;
  recentGenerations: Array<{
    id: string;
    title: string;
    status: string;
    qualityScore?: number;
    createdAt: string;
    generator: {
      username: string;
    };
  }>;
}

const TemplateDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  // 狀態管理
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewContent, setPreviewContent] = useState('');
  const [testVariables, setTestVariables] = useState<Record<string, any>>({});

  // 載入範本詳情
  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposal-templates/${templateId}`);
      const data = await response.json();

      if (data.success) {
        setTemplate(data.data);
        // 初始化測試變數
        const initialTestVars: Record<string, any> = {};
        Object.entries(data.data.variables).forEach(([name, def]: [string, any]) => {
          initialTestVars[name] = def.defaultValue || '';
        });
        setTestVariables(initialTestVars);
      } else {
        console.error('載入範本失敗:', data.message);
      }
    } catch (error) {
      console.error('載入範本錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入使用統計
  const loadStats = async () => {
    try {
      const response = await fetch(`/api/proposal-templates/${templateId}/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('載入統計錯誤:', error);
    }
  };

  // 預覽範本
  const previewTemplate = async () => {
    if (!template) return;

    try {
      const response = await fetch(`/api/proposal-templates/${templateId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables: testVariables
        })
      });

      const data = await response.json();

      if (data.success) {
        setPreviewContent(data.data.content);
      } else {
        setPreviewContent('預覽失敗: ' + data.message);
      }
    } catch (error) {
      console.error('預覽錯誤:', error);
      setPreviewContent('預覽時發生錯誤');
    }
  };

  // 初始載入
  useEffect(() => {
    if (templateId) {
      loadTemplate();
      loadStats();
    }
  }, [templateId]);

  // 當測試變數變更時自動預覽
  useEffect(() => {
    if (template && activeTab === 'preview') {
      previewTemplate();
    }
  }, [testVariables, activeTab, template]);

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

  // 獲取訪問權限標籤顏色
  const getAccessColor = (access: string) => {
    const colors: Record<string, string> = {
      'PRIVATE': 'bg-red-100 text-red-800',
      'SHARED': 'bg-yellow-100 text-yellow-800',
      'PUBLIC': 'bg-green-100 text-green-800'
    };
    return colors[access] || colors['PRIVATE'];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <InformationCircleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            範本不存在或已被刪除
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 頁面標題和操作 */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <Badge className={getCategoryColor(template.category)}>
              {template.category.replace('_', ' ')}
            </Badge>
            <Badge className={getAccessColor(template.access_level)}>
              {template.access_level}
            </Badge>
            {!template.is_active && (
              <Badge variant="secondary">已停用</Badge>
            )}
            {template.is_default && (
              <Badge variant="outline">預設範本</Badge>
            )}
          </div>
          <p className="text-gray-600 max-w-2xl">
            {template.description || '無描述'}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href={`/dashboard/proposals/templates/${template.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <PencilIcon className="h-4 w-4" />
              編輯
            </Button>
          </Link>
          <Link href={`/dashboard/proposals/generate?templateId=${template.id}`}>
            <Button className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              使用生成
            </Button>
          </Link>
        </div>
      </div>

      {/* 快速統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總使用次數</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template.usage_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">範本變數</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(template.variables).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">版本號</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v{template.version}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">創建者</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{template.creator.username}</div>
            <div className="text-xs text-gray-500">
              {new Date(template.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容標籤頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">範本內容</TabsTrigger>
          <TabsTrigger value="variables">變數定義</TabsTrigger>
          <TabsTrigger value="preview">預覽測試</TabsTrigger>
          <TabsTrigger value="analytics">使用分析</TabsTrigger>
        </TabsList>

        {/* 範本內容標籤頁 */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>範本內容</CardTitle>
              <CardDescription>
                Handlebars 格式的範本內容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{template.content}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>範本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">創建時間</label>
                    <p className="text-sm text-gray-900">
                      {new Date(template.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">最後更新</label>
                    <p className="text-sm text-gray-900">
                      {new Date(template.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">創建者</label>
                    <p className="text-sm text-gray-900">
                      {template.creator.username} ({template.creator.email})
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {template.updater && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">最後編輯者</label>
                      <p className="text-sm text-gray-900">
                        {template.updater.username} ({template.updater.email})
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">訪問權限</label>
                    <p className="text-sm text-gray-900">{template.access_level}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">狀態</label>
                    <p className="text-sm text-gray-900">
                      {template.is_active ? '啟用' : '停用'}
                      {template.is_default && ' (預設範本)'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 變數定義標籤頁 */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>範本變數定義</CardTitle>
              <CardDescription>
                範本中定義的所有變數及其屬性
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(template.variables).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  此範本沒有定義任何變數
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(template.variables).map(([name, variable]: [string, any]) => (
                    <div key={name} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {name}
                        </code>
                        <Badge variant="outline">{variable.type}</Badge>
                        {variable.required && (
                          <Badge variant="secondary">必填</Badge>
                        )}
                      </div>
                      {variable.description && (
                        <p className="text-sm text-gray-600 mb-2">{variable.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                        {variable.defaultValue && (
                          <div>
                            <span className="font-medium">預設值:</span> {variable.defaultValue}
                          </div>
                        )}
                        {variable.options && (
                          <div>
                            <span className="font-medium">選項:</span> {variable.options.join(', ')}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">類型:</span> {variable.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 預覽測試標籤頁 */}
        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 測試變數輸入 */}
            <Card>
              <CardHeader>
                <CardTitle>測試變數</CardTitle>
                <CardDescription>
                  設置測試用的變數值來預覽範本效果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(template.variables).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    此範本沒有需要設置的變數
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(template.variables).map(([name, variable]: [string, any]) => (
                      <div key={name} className="space-y-2">
                        <label className="text-sm font-medium">
                          {name} {variable.required && <span className="text-red-500">*</span>}
                        </label>
                        {variable.type === 'select' && variable.options ? (
                          <select
                            value={testVariables[name] || ''}
                            onChange={(e) => setTestVariables(prev => ({ ...prev, [name]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">選擇 {name}</option>
                            {variable.options.map((option: string) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : variable.type === 'textarea' ? (
                          <textarea
                            value={testVariables[name] || ''}
                            onChange={(e) => setTestVariables(prev => ({ ...prev, [name]: e.target.value }))}
                            placeholder={variable.description || `輸入 ${name}`}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <input
                            type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                            value={testVariables[name] || ''}
                            onChange={(e) => setTestVariables(prev => ({ ...prev, [name]: e.target.value }))}
                            placeholder={variable.description || `輸入 ${name}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {variable.description && (
                          <p className="text-xs text-gray-500">{variable.description}</p>
                        )}
                      </div>
                    ))}
                    <Button onClick={previewTemplate} className="w-full mt-4">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      更新預覽
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 預覽結果 */}
            <Card>
              <CardHeader>
                <CardTitle>預覽結果</CardTitle>
                <CardDescription>
                  查看使用測試變數後的範本渲染結果
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewContent ? (
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    點擊「更新預覽」按鈕查看範本效果
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 使用分析標籤頁 */}
        <TabsContent value="analytics" className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">生成統計</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">總生成次數</span>
                        <span className="font-medium">{stats.totalGenerations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">成功生成</span>
                        <span className="font-medium">{stats.successfulGenerations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">成功率</span>
                        <span className="font-medium">
                          {stats.totalGenerations > 0
                            ? Math.round((stats.successfulGenerations / stats.totalGenerations) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">平均品質分數</span>
                        <span className="font-medium">{stats.averageQualityScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">常用變數</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.mostUsedVariables.map((variable, index) => (
                        <div key={variable.name} className="flex justify-between">
                          <span className="text-sm text-gray-600">{variable.name}</span>
                          <span className="font-medium">{variable.usageCount}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>最近生成記錄</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentGenerations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      還沒有生成記錄
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentGenerations.map((generation) => (
                        <div key={generation.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{generation.title}</h4>
                            <p className="text-sm text-gray-600">
                              生成者: {generation.generator.username} •
                              {new Date(generation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {generation.qualityScore && (
                              <Badge variant="outline">
                                品質: {generation.qualityScore}%
                              </Badge>
                            )}
                            <Badge className={
                              generation.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : generation.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {generation.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center py-8">
                  載入統計數據中...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateDetailPage;