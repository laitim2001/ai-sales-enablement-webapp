/**
 * @fileoverview 範本編輯頁面功能：- 載入現有範本數據- 編輯範本基本信息（名稱/描述/分類/訪問級別）- 編輯範本內容（Handlebars 模板）- 編輯變數配置（類型/標籤/必填/默認值）- 實時預覽- 保存更新@author Claude Code@date 2025-10-02
 * @module app/dashboard/templates/[id]/page
 * @description
 * 範本編輯頁面功能：- 載入現有範本數據- 編輯範本基本信息（名稱/描述/分類/訪問級別）- 編輯範本內容（Handlebars 模板）- 編輯變數配置（類型/標籤/必填/默認值）- 實時預覽- 保存更新@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// 範本分類選項
const categoryOptions = [
  { value: 'SALES_PROPOSAL', label: '銷售提案' },
  { value: 'PRODUCT_DEMO', label: '產品演示' },
  { value: 'SERVICE_PROPOSAL', label: '服務提案' },
  { value: 'PRICING_QUOTE', label: '價格報價' },
  { value: 'TECHNICAL_PROPOSAL', label: '技術提案' },
  { value: 'PARTNERSHIP', label: '合作提案' },
  { value: 'RENEWAL', label: '續約提案' },
  { value: 'CUSTOM', label: '自定義' },
];

// 訪問級別選項
const accessLevelOptions = [
  { value: 'PRIVATE', label: '私有（僅自己可見）' },
  { value: 'TEAM', label: '團隊（團隊成員可見）' },
  { value: 'ORGANIZATION', label: '組織（全組織可見）' },
  { value: 'PUBLIC', label: '公開（所有人可見）' },
];

// 變數類型選項
const variableTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '數字' },
  { value: 'date', label: '日期' },
  { value: 'boolean', label: '布爾值' },
  { value: 'select', label: '單選' },
  { value: 'multiselect', label: '多選' },
];

export default function TemplateEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const templateId = params.id as string;

  // Loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 基本信息
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SALES_PROPOSAL');
  const [accessLevel, setAccessLevel] = useState('PRIVATE');
  const [isDefault, setIsDefault] = useState(false);

  // 範本內容
  const [content, setContent] = useState('');

  // 變數配置
  const [variables, setVariables] = useState<
    Array<{
      key: string;
      type: string;
      label: string;
      required: boolean;
      defaultValue: string;
      options?: string[];
    }>
  >([]);

  // 預覽
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // 載入範本數據
  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);
      const result = await response.json();

      if (result.success) {
        const template = result.data;
        setName(template.name);
        setDescription(template.description || '');
        setCategory(template.category);
        setAccessLevel(template.access_level);
        setIsDefault(template.is_default);
        setContent(template.content);

        // 轉換變數格式
        const vars = Object.entries(template.variables || {}).map(([key, value]: [string, any]) => ({
          key,
          type: value.type || 'text',
          label: value.label || key,
          required: value.required || false,
          defaultValue: value.defaultValue || '',
          options: value.options || [],
        }));
        setVariables(vars);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '載入失敗',
        description: error instanceof Error ? error.message : '無法載入範本',
        variant: 'destructive',
      });
      router.push('/dashboard/templates');
    } finally {
      setLoading(false);
    }
  };

  // 保存範本
  const handleSave = async () => {
    // 驗證
    if (!name.trim()) {
      toast({
        title: '驗證失敗',
        description: '請輸入範本名稱',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: '驗證失敗',
        description: '請輸入範本內容',
        variant: 'destructive',
      });
      return;
    }

    // 檢查變數配置
    const invalidVariables = variables.filter((v) => !v.key || !v.label);
    if (invalidVariables.length > 0) {
      toast({
        title: '驗證失敗',
        description: '所有變數必須有鍵名和標籤',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // 轉換變數格式
      const variablesObject = variables.reduce(
        (acc, v) => {
          if (v.key) {
            acc[v.key] = {
              type: v.type,
              label: v.label,
              required: v.required,
              defaultValue: v.defaultValue || undefined,
              options: v.type === 'select' || v.type === 'multiselect' ? v.options : undefined,
            };
          }
          return acc;
        },
        {} as Record<string, any>
      );

      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          category,
          access_level: accessLevel,
          is_default: isDefault,
          content,
          variables: variablesObject,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '保存成功',
          description: '範本已成功更新',
        });
        router.push('/dashboard/templates');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '保存失敗',
        description: error instanceof Error ? error.message : '無法保存範本',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // 預覽範本
  const handlePreview = async () => {
    try {
      setIsPreviewLoading(true);

      const response = await fetch(`/api/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useTestData: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPreviewHtml(result.data.html);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '預覽失敗',
        description: error instanceof Error ? error.message : '無法生成預覽',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 變數管理
  const addVariable = () => {
    setVariables([
      ...variables,
      { key: '', type: 'text', label: '', required: false, defaultValue: '', options: [] },
    ]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: string, value: any) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setVariables(newVariables);
  };

  const updateVariableOptions = (index: number, optionsText: string) => {
    const newVariables = [...variables];
    newVariables[index] = {
      ...newVariables[index],
      options: optionsText.split('\n').filter((opt) => opt.trim()),
    };
    setVariables(newVariables);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">編輯範本</h1>
            <p className="text-gray-600 mt-1">修改範本內容和配置</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={isPreviewLoading}>
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewLoading ? '預覽中...' : '預覽'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 編輯表單 */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="content">範本內容</TabsTrigger>
          <TabsTrigger value="variables">變數配置</TabsTrigger>
          <TabsTrigger value="preview">預覽</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>設置範本的基本屬性</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">範本名稱 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：標準銷售提案"
                />
              </div>

              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="簡要描述這個範本的用途..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">範本分類 *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accessLevel">訪問級別 *</Label>
                  <Select value={accessLevel} onValueChange={setAccessLevel}>
                    <SelectTrigger id="accessLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accessLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                  設為預設範本
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 範本內容 */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>範本內容</CardTitle>
              <CardDescription>
                使用 Handlebars 語法編寫範本，支持變數、條件和循環
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在這裡輸入範本內容..."
                rows={20}
                className="font-mono text-sm"
              />

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    可用的 Helper 函數
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <strong>日期：</strong>
                    <code className="bg-white px-1 rounded">
                      {'{{formatDate date "YYYY-MM-DD"}}'}
                    </code>
                  </div>
                  <div>
                    <strong>貨幣：</strong>
                    <code className="bg-white px-1 rounded">
                      {'{{formatCurrency amount "TWD"}}'}
                    </code>
                  </div>
                  <div>
                    <strong>數字：</strong>
                    <code className="bg-white px-1 rounded">{'{{formatNumber num 2}}'}</code>
                  </div>
                  <div>
                    <strong>數學：</strong>
                    <code className="bg-white px-1 rounded">
                      {'{{multiply price quantity}}'}
                    </code>
                  </div>
                  <div>
                    <strong>條件：</strong>
                    <code className="bg-white px-1 rounded">{'{{#if is_vip}}...{{/if}}'}</code>
                  </div>
                  <div>
                    <strong>循環：</strong>
                    <code className="bg-white px-1 rounded">{'{{#each items}}...{{/each}}'}</code>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 變數配置 */}
        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>變數配置</CardTitle>
                  <CardDescription>定義範本中使用的變數及其屬性</CardDescription>
                </div>
                <Button onClick={addVariable} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增變數
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>尚未配置變數</p>
                  <p className="text-sm mt-2">點擊「新增變數」按鈕開始配置</p>
                </div>
              ) : (
                variables.map((variable, index) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <Label>鍵名 *</Label>
                          <Input
                            value={variable.key}
                            onChange={(e) => updateVariable(index, 'key', e.target.value)}
                            placeholder="例如：company_name"
                          />
                        </div>

                        <div className="col-span-3">
                          <Label>標籤 *</Label>
                          <Input
                            value={variable.label}
                            onChange={(e) => updateVariable(index, 'label', e.target.value)}
                            placeholder="例如：公司名稱"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>類型</Label>
                          <Select
                            value={variable.type}
                            onValueChange={(value) => updateVariable(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {variableTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <Label>默認值</Label>
                          <Input
                            value={variable.defaultValue}
                            onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                            placeholder="選填"
                          />
                        </div>

                        <div className="col-span-1 flex items-end justify-center gap-2">
                          <div className="flex flex-col items-center gap-2">
                            <Checkbox
                              checked={variable.required}
                              onCheckedChange={(checked) =>
                                updateVariable(index, 'required', checked)
                              }
                            />
                            <Label className="text-xs">必填</Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {(variable.type === 'select' || variable.type === 'multiselect') && (
                          <div className="col-span-12">
                            <Label>選項（每行一個）</Label>
                            <Textarea
                              value={variable.options?.join('\n') || ''}
                              onChange={(e) => updateVariableOptions(index, e.target.value)}
                              placeholder="選項1&#10;選項2&#10;選項3"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 預覽 */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>範本預覽</CardTitle>
                  <CardDescription>使用測試數據預覽範本渲染效果</CardDescription>
                </div>
                <Button onClick={handlePreview} disabled={isPreviewLoading} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新預覽
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPreviewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : previewHtml ? (
                <div
                  className="prose max-w-none bg-white p-6 rounded border"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>點擊「重新預覽」按鈕生成預覽</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
