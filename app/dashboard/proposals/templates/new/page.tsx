/**
 * @fileoverview 新建提案範本頁面功能：- 提案範本創建和編輯- Handlebars語法支援和預覽- 變數定義和管理- 範本測試和驗證作者：Claude Code創建時間：2025-09-28
 * @module app/dashboard/proposals/templates/new/page
 * @description
 * 新建提案範本頁面功能：- 提案範本創建和編輯- Handlebars語法支援和預覽- 變數定義和管理- 範本測試和驗證作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// 變數定義介面
interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  description: string;
  defaultValue?: any;
  options?: string[]; // for select type
}

// 範本數據介面
interface TemplateData {
  name: string;
  description: string;
  category: string;
  content: string;
  variables: Record<string, TemplateVariable>;
  access_level: string;
  is_active: boolean;
  is_default: boolean;
}

const NewTemplatePage: React.FC = () => {
  const router = useRouter();

  // 表單狀態
  const [formData, setFormData] = useState<TemplateData>({
    name: '',
    description: '',
    category: 'BUSINESS_PROPOSAL',
    content: '',
    variables: {},
    access_level: 'PRIVATE',
    is_active: true,
    is_default: false
  });

  // UI狀態
  const [currentVariable, setCurrentVariable] = useState<TemplateVariable>({
    name: '',
    type: 'text',
    required: false,
    description: '',
    defaultValue: '',
    options: []
  });
  const [previewContent, setPreviewContent] = useState('');
  const [testVariables, setTestVariables] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 預設範本內容
  const defaultTemplates: Record<string, string> = {
    BUSINESS_PROPOSAL: `# {{companyName}} 商業提案

## 執行摘要
我們很榮幸為 {{companyName}} 提供此商業提案，針對您在 {{industry}} 領域的需求，我們提供以下解決方案。

## 客戶需求分析
根據我們的初步了解，{{companyName}} 目前面臨以下挑戰：
{{#each challenges}}
- {{this}}
{{/each}}

## 解決方案概述
我們建議的解決方案包括：
{{solutionDescription}}

### 主要服務內容
{{#each services}}
1. **{{name}}**: {{description}}
   - 預估工期：{{duration}}
   - 投資金額：{{cost}}
{{/each}}

## 投資回報分析
- 總投資：{{totalInvestment}}
- 預期效益：{{expectedBenefits}}
- 投資回報期：{{roiPeriod}}

## 下一步行動
我們期待與 {{companyName}} 進一步討論此提案的細節。請聯繫我們安排會議時間。

最佳問候，
{{senderName}}
{{senderTitle}}
{{senderCompany}}`,

    PRODUCT_DESCRIPTION: `# {{productName}}

## 產品概述
{{productName}} 是一款專為 {{targetAudience}} 設計的 {{productType}}，旨在解決 {{problemSolved}} 的問題。

## 主要特性
{{#each features}}
- **{{name}}**: {{description}}
{{/each}}

## 技術規格
- 平台支援：{{platforms}}
- 系統需求：{{requirements}}
- 授權方式：{{licensing}}

## 定價
- 基礎版：{{basicPrice}}
- 專業版：{{proPrice}}
- 企業版：{{enterprisePrice}}

{{#if specialOffer}}
## 特別優惠
{{specialOffer}}
{{/if}}

立即聯繫我們了解更多詳情！`,

    MARKETING_EMAIL: `主旨：{{subject}}

親愛的 {{recipientName}}，

{{opening}}

## {{mainTitle}}
{{mainContent}}

### 為什麼選擇我們？
{{#each benefits}}
✓ {{this}}
{{/each}}

{{#if specialOffer}}
## 限時優惠
{{specialOffer}}
優惠期限：{{offerDeadline}}
{{/if}}

{{callToAction}}

如有任何問題，請隨時聯繫我們。

最佳問候，
{{senderName}}
{{senderCompany}}

---
取消訂閱：{{unsubscribeLink}}`
  };

  // 處理表單變更
  const handleFormChange = (field: keyof TemplateData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 如果是分類變更，載入預設範本
    if (field === 'category' && !formData.content) {
      setFormData(prev => ({
        ...prev,
        content: defaultTemplates[value] || ''
      }));
    }

    // 清除對應的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 添加變數
  const addVariable = () => {
    if (!currentVariable.name.trim()) {
      setErrors(prev => ({ ...prev, variableName: '變數名稱不能為空' }));
      return;
    }

    if (formData.variables[currentVariable.name]) {
      setErrors(prev => ({ ...prev, variableName: '變數名稱已存在' }));
      return;
    }

    const newVariable = { ...currentVariable };
    if (newVariable.type !== 'select') {
      delete newVariable.options;
    }

    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [currentVariable.name]: newVariable
      }
    }));

    // 添加到測試變數
    setTestVariables(prev => ({
      ...prev,
      [currentVariable.name]: currentVariable.defaultValue || ''
    }));

    // 重置當前變數
    setCurrentVariable({
      name: '',
      type: 'text',
      required: false,
      description: '',
      defaultValue: '',
      options: []
    });

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.variableName;
      return newErrors;
    });
  };

  // 移除變數
  const removeVariable = (varName: string) => {
    setFormData(prev => ({
      ...prev,
      variables: Object.fromEntries(
        Object.entries(prev.variables).filter(([name]) => name !== varName)
      )
    }));

    setTestVariables(prev => {
      const newTestVars = { ...prev };
      delete newTestVars[varName];
      return newTestVars;
    });
  };

  // 預覽範本
  const previewTemplate = async () => {
    try {
      // 簡化的客戶端範本編譯（實際應該調用API）
      let content = formData.content;

      // 替換簡單變數 {{variableName}}
      Object.entries(testVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, String(value || `[${key}]`));
      });

      setPreviewContent(content);
    } catch (error) {
      console.error('預覽錯誤:', error);
      setPreviewContent('預覽生成失敗，請檢查範本語法');
    }
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '範本名稱不能為空';
    }

    if (!formData.content.trim()) {
      newErrors.content = '範本內容不能為空';
    }

    if (!formData.category) {
      newErrors.category = '請選擇範本分類';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存範本
  const saveTemplate = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/proposal-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          created_by: 1 // TODO: 從認證上下文獲取
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/proposals');
      } else {
        setErrors({ submit: data.message || '保存失敗' });
      }
    } catch (error) {
      console.error('保存錯誤:', error);
      setErrors({ submit: '保存時發生錯誤' });
    } finally {
      setSaving(false);
    }
  };

  // 當內容或測試變數變更時自動預覽
  useEffect(() => {
    if (formData.content && activeTab === 'preview') {
      previewTemplate();
    }
  }, [formData.content, testVariables, activeTab]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新建提案範本</h1>
          <p className="text-gray-600 mt-2">創建可重複使用的AI提案生成範本</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button
            onClick={saveTemplate}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                保存範本
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 錯誤提示 */}
      {errors.submit && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errors.submit}
          </AlertDescription>
        </Alert>
      )}

      {/* 主要內容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="content">範本內容</TabsTrigger>
          <TabsTrigger value="variables">變數管理</TabsTrigger>
          <TabsTrigger value="preview">預覽測試</TabsTrigger>
        </TabsList>

        {/* 基本信息標籤頁 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>範本基本信息</CardTitle>
              <CardDescription>
                設置範本的基本屬性和權限設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 範本名稱 */}
                <div className="space-y-2">
                  <Label htmlFor="name">範本名稱 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="輸入範本名稱"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* 範本分類 */}
                <div className="space-y-2">
                  <Label htmlFor="category">範本分類 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleFormChange('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="選擇範本分類" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUSINESS_PROPOSAL">商業提案</SelectItem>
                      <SelectItem value="PRODUCT_DESCRIPTION">產品描述</SelectItem>
                      <SelectItem value="MARKETING_EMAIL">行銷郵件</SelectItem>
                      <SelectItem value="TECHNICAL_SPECIFICATION">技術規格</SelectItem>
                      <SelectItem value="SALES_PITCH">銷售簡報</SelectItem>
                      <SelectItem value="OTHER">其他</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category}</p>
                  )}
                </div>
              </div>

              {/* 範本描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">範本描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="簡單描述這個範本的用途和特點"
                  rows={3}
                />
              </div>

              {/* 權限設定 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="access_level">訪問權限</Label>
                  <Select
                    value={formData.access_level}
                    onValueChange={(value) => handleFormChange('access_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">私有（僅創建者）</SelectItem>
                      <SelectItem value="SHARED">共享（團隊可見）</SelectItem>
                      <SelectItem value="PUBLIC">公開（所有人可見）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">啟用範本</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleFormChange('is_active', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_default">設為預設範本</Label>
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => handleFormChange('is_default', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 範本內容標籤頁 */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>範本內容編輯</CardTitle>
              <CardDescription>
                使用 Handlebars 語法編寫範本內容。支援變數替換和條件邏輯。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Handlebars 語法提示 */}
              <Alert className="bg-blue-50 border-blue-200">
                <InformationCircleIcon className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Handlebars 語法提示：</strong>
                  <br />• 變數：<code>{'{{variableName}}'}</code>
                  <br />• 條件：<code>{'{{#if condition}}...{{/if}}'}</code>
                  <br />• 循環：<code>{'{{#each items}}...{{/each}}'}</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="content">範本內容 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleFormChange('content', e.target.value)}
                  placeholder="在此輸入範本內容..."
                  rows={20}
                  className={`font-mono ${errors.content ? 'border-red-500' : ''}`}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 變數管理標籤頁 */}
        <TabsContent value="variables" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 添加變數 */}
            <Card>
              <CardHeader>
                <CardTitle>添加範本變數</CardTitle>
                <CardDescription>
                  定義範本中使用的變數及其屬性
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="varName">變數名稱 *</Label>
                  <Input
                    id="varName"
                    value={currentVariable.name}
                    onChange={(e) => setCurrentVariable(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如: companyName"
                    className={errors.variableName ? 'border-red-500' : ''}
                  />
                  {errors.variableName && (
                    <p className="text-sm text-red-600">{errors.variableName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="varType">變數類型</Label>
                  <Select
                    value={currentVariable.type}
                    onValueChange={(value: any) => setCurrentVariable(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">文本</SelectItem>
                      <SelectItem value="number">數字</SelectItem>
                      <SelectItem value="date">日期</SelectItem>
                      <SelectItem value="boolean">布爾值</SelectItem>
                      <SelectItem value="select">選項</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="varDesc">變數描述</Label>
                  <Input
                    id="varDesc"
                    value={currentVariable.description}
                    onChange={(e) => setCurrentVariable(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述這個變數的用途"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="varDefault">預設值</Label>
                  <Input
                    id="varDefault"
                    value={currentVariable.defaultValue}
                    onChange={(e) => setCurrentVariable(prev => ({ ...prev, defaultValue: e.target.value }))}
                    placeholder="可選的預設值"
                  />
                </div>

                {currentVariable.type === 'select' && (
                  <div className="space-y-2">
                    <Label htmlFor="varOptions">選項（以逗號分隔）</Label>
                    <Input
                      id="varOptions"
                      value={currentVariable.options?.join(', ')}
                      onChange={(e) => setCurrentVariable(prev => ({
                        ...prev,
                        options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                      }))}
                      placeholder="選項1, 選項2, 選項3"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="varRequired">必填變數</Label>
                  <Switch
                    id="varRequired"
                    checked={currentVariable.required}
                    onCheckedChange={(checked) => setCurrentVariable(prev => ({ ...prev, required: checked }))}
                  />
                </div>

                <Button onClick={addVariable} className="w-full">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加變數
                </Button>
              </CardContent>
            </Card>

            {/* 變數列表 */}
            <Card>
              <CardHeader>
                <CardTitle>已定義變數</CardTitle>
                <CardDescription>
                  當前範本包含的所有變數
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(formData.variables).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    還沒有定義任何變數
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(formData.variables).map(([name, variable]) => (
                      <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {name}
                            </code>
                            <Badge variant="outline">{variable.type}</Badge>
                            {variable.required && (
                              <Badge variant="secondary">必填</Badge>
                            )}
                          </div>
                          {variable.description && (
                            <p className="text-sm text-gray-600">{variable.description}</p>
                          )}
                          {variable.defaultValue && (
                            <p className="text-xs text-gray-500">預設: {variable.defaultValue}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariable(name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 預覽測試標籤頁 */}
        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 測試變數 */}
            <Card>
              <CardHeader>
                <CardTitle>測試變數</CardTitle>
                <CardDescription>
                  設置測試用的變數值來預覽範本效果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(formData.variables).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    請先在「變數管理」中添加變數
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(formData.variables).map(([name, variable]) => (
                      <div key={name} className="space-y-2">
                        <Label htmlFor={`test-${name}`}>
                          {name} {variable.required && <span className="text-red-500">*</span>}
                        </Label>
                        {variable.type === 'select' && variable.options ? (
                          <Select
                            value={testVariables[name] || ''}
                            onValueChange={(value) => setTestVariables(prev => ({ ...prev, [name]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`選擇 ${name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.options.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`test-${name}`}
                            type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                            value={testVariables[name] || ''}
                            onChange={(e) => setTestVariables(prev => ({ ...prev, [name]: e.target.value }))}
                            placeholder={variable.description || `輸入 ${name}`}
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
      </Tabs>
    </div>
  );
};

export default NewTemplatePage;