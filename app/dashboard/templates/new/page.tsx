/**
 * @fileoverview 創建新範本頁面功能：- 範本基本信息輸入- 範本內容編輯（Handlebars 語法）- 變數配置- 實時預覽@author Claude Code@date 2025-10-02
 * @module app/dashboard/templates/new/page
 * @description
 * 創建新範本頁面功能：- 範本基本信息輸入- 範本內容編輯（Handlebars 語法）- 變數配置- 實時預覽@author Claude Code@date 2025-10-02
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';

// 範本分類
const categories = [
  { value: 'SALES_PROPOSAL', label: '銷售提案' },
  { value: 'PRODUCT_DEMO', label: '產品演示' },
  { value: 'SERVICE_PROPOSAL', label: '服務提案' },
  { value: 'PRICING_QUOTE', label: '價格報價' },
  { value: 'TECHNICAL_PROPOSAL', label: '技術提案' },
  { value: 'PARTNERSHIP', label: '合作提案' },
  { value: 'RENEWAL', label: '續約提案' },
  { value: 'CUSTOM', label: '自定義' },
];

// 訪問級別
const accessLevels = [
  { value: 'PRIVATE', label: '私人（僅自己）' },
  { value: 'TEAM', label: '團隊（同部門）' },
  { value: 'ORGANIZATION', label: '組織（全公司）' },
  { value: 'PUBLIC', label: '公開（所有用戶）' },
];

// 變數類型
const variableTypes = [
  { value: 'text', label: '文字' },
  { value: 'number', label: '數字' },
  { value: 'date', label: '日期' },
  { value: 'boolean', label: '布爾值' },
  { value: 'select', label: '單選' },
  { value: 'multiselect', label: '多選' },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();

  // 範本基本信息
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SALES_PROPOSAL');
  const [accessLevel, setAccessLevel] = useState('PRIVATE');
  const [isDefault, setIsDefault] = useState(false);

  // 範本內容
  const [content, setContent] = useState(
    `# {{company_name}} 銷售提案

親愛的 {{customer_name}}，

感謝您對我們產品的興趣。我們很高興為您提供以下解決方案：

## 產品概述
{{product_description}}

## 價格
- 單價：{{formatCurrency unit_price}}
- 數量：{{quantity}}
- 總計：{{formatCurrency (multiply unit_price quantity)}}

{{#if is_vip}}
🎉 VIP 客戶享有 10% 折扣
{{/if}}

期待與您合作！

最誠摯的問候，
{{sales_rep_name}}
{{formatDate current_date}}
`
  );

  // 變數配置
  const [variables, setVariables] = useState<
    Array<{
      key: string;
      type: string;
      label: string;
      required: boolean;
      defaultValue: string;
    }>
  >([
    { key: 'company_name', type: 'text', label: '公司名稱', required: true, defaultValue: '' },
    { key: 'customer_name', type: 'text', label: '客戶名稱', required: true, defaultValue: '' },
    {
      key: 'product_description',
      type: 'text',
      label: '產品描述',
      required: true,
      defaultValue: '',
    },
    { key: 'unit_price', type: 'number', label: '單價', required: true, defaultValue: '1000' },
    { key: 'quantity', type: 'number', label: '數量', required: true, defaultValue: '1' },
    { key: 'is_vip', type: 'boolean', label: '是否VIP', required: false, defaultValue: 'false' },
    {
      key: 'sales_rep_name',
      type: 'text',
      label: '業務代表',
      required: true,
      defaultValue: '',
    },
    { key: 'current_date', type: 'date', label: '當前日期', required: true, defaultValue: '' },
  ]);

  // 預覽HTML
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // 保存狀態
  const [isSaving, setIsSaving] = useState(false);

  // 添加新變數
  const addVariable = () => {
    setVariables([
      ...variables,
      { key: '', type: 'text', label: '', required: false, defaultValue: '' },
    ]);
  };

  // 移除變數
  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // 更新變數
  const updateVariable = (index: number, field: string, value: any) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setVariables(newVariables);
  };

  // 預覽範本
  const handlePreview = async () => {
    try {
      setIsPreviewLoading(true);

      // 構建變數定義對象
      const variablesDef = variables.reduce((acc, v) => {
        if (v.key) {
          acc[v.key] = {
            type: v.type,
            label: v.label,
            required: v.required,
            defaultValue: v.defaultValue || undefined,
          };
        }
        return acc;
      }, {} as Record<string, any>);

      const response = await fetch('/api/templates/preview-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          variables: variablesDef,
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
        description: error instanceof Error ? error.message : '無法預覽範本',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 保存範本
  const handleSave = async () => {
    // 驗證必填字段
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

    // 驗證變數
    const invalidVariables = variables.filter((v) => v.key && !v.label);
    if (invalidVariables.length > 0) {
      toast({
        title: '驗證失敗',
        description: '請為所有變數提供標籤',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // 構建變數定義對象
      const variablesDef = variables.reduce((acc, v) => {
        if (v.key) {
          acc[v.key] = {
            type: v.type,
            label: v.label,
            required: v.required,
            ...(v.defaultValue && { defaultValue: v.defaultValue }),
          };
        }
        return acc;
      }, {} as Record<string, any>);

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          content,
          variables: variablesDef,
          accessLevel,
          isDefault,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '保存成功',
          description: '範本已成功創建',
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
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">創建新範本</h1>
            <p className="text-gray-600 mt-1">填寫範本信息並配置變數</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={isPreviewLoading}>
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewLoading ? '預覽中...' : '預覽'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? '保存中...' : '保存範本'}
          </Button>
        </div>
      </div>

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
              <CardDescription>設置範本的名稱、分類和訪問權限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    範本名稱 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="例如：標準銷售提案"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    範本分類 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">範本描述</Label>
                <Textarea
                  id="description"
                  placeholder="簡要描述此範本的用途和特點..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessLevel">訪問權限</Label>
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger id="accessLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="isDefault" checked={isDefault} onCheckedChange={setIsDefault} />
                <Label htmlFor="isDefault">設為此分類的預設範本</Label>
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
                使用 Handlebars 語法編寫範本。支援變數 {`{{variable}}`}、條件 {`{{#if}}...{{/if}}`} 和循環 {`{{#each}}...{{/each}}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="在此輸入範本內容..."
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-semibold mb-2">常用 Helper 函數：</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>
                    <code className="bg-white px-2 py-1 rounded">{`{{formatDate date}}`}</code> - 日期格式化
                  </li>
                  <li>
                    <code className="bg-white px-2 py-1 rounded">{`{{formatCurrency amount}}`}</code> - 貨幣格式化
                  </li>
                  <li>
                    <code className="bg-white px-2 py-1 rounded">{`{{multiply a b}}`}</code> - 數學運算
                  </li>
                  <li>
                    <code className="bg-white px-2 py-1 rounded">{`{{uppercase text}}`}</code> - 字串轉大寫
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 變數配置 */}
        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle>變數配置</CardTitle>
              <CardDescription>定義範本中使用的變數及其類型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.map((variable, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <Label>變數名稱</Label>
                      <Input
                        placeholder="例如：customer_name"
                        value={variable.key}
                        onChange={(e) => updateVariable(index, 'key', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>標籤</Label>
                      <Input
                        placeholder="例如：客戶名稱"
                        value={variable.label}
                        onChange={(e) => updateVariable(index, 'label', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>類型</Label>
                      <Select
                        value={variable.type}
                        onValueChange={(value) => updateVariable(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {variableTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={variable.required}
                          onCheckedChange={(checked) => updateVariable(index, 'required', checked)}
                        />
                        <Label>必需</Label>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeVariable(index)}>
                        刪除
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="outline" onClick={addVariable} className="w-full">
                + 添加變數
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 預覽 */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>範本預覽</CardTitle>
              <CardDescription>查看範本使用測試數據渲染後的效果</CardDescription>
            </CardHeader>
            <CardContent>
              {previewHtml ? (
                <div
                  className="prose max-w-none p-6 bg-white rounded-md border"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>點擊上方「預覽」按鈕查看範本效果</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
