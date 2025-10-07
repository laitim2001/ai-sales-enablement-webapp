/**
 * @fileoverview AI提案生成頁面功能：- 選擇提案範本- 填寫範本變數- 調整AI生成參數- 執行AI生成並顯示結果作者：Claude Code創建時間：2025-09-28
 * @module app/dashboard/proposals/generate/page
 * @description
 * AI提案生成頁面功能：- 選擇提案範本- 填寫範本變數- 調整AI生成參數- 執行AI生成並顯示結果作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  SparklesIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// 範本介面
interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: Record<string, any>;
  usage_count: number;
}

// 客戶介面
interface Customer {
  id: number;
  company_name: string;
  industry: string;
  contact_name?: string;
}

// 生成結果介面
interface GenerationResult {
  id: string;
  content: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  qualityScore?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

const GenerateProposalPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('templateId');

  // 狀態管理
  const [step, setStep] = useState(1); // 1: 選擇範本, 2: 填寫變數, 3: 生成設定, 4: 生成結果
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // 表單數據
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    opportunityId: '',
    variables: {} as Record<string, any>,
    aiConfig: {
      temperature: 0.7,
      maxTokens: 2000,
      model: 'gpt-4'
    }
  });

  // 生成結果
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string>('');

  // 載入範本列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposal-templates?status=active&limit=50');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates);

        // 如果有預選範本ID，自動選擇
        if (templateId) {
          const template = data.data.templates.find((t: ProposalTemplate) => t.id === templateId);
          if (template) {
            setSelectedTemplate(template);
            setStep(2);
          }
        }
      }
    } catch (error) {
      console.error('載入範本失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入客戶列表
  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=100');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data.customers);
      }
    } catch (error) {
      console.error('載入客戶失敗:', error);
    }
  };

  // 初始載入
  useEffect(() => {
    loadTemplates();
    loadCustomers();
  }, []);

  // 選擇範本
  const selectTemplate = (template: ProposalTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      title: `基於${template.name}的提案`,
      variables: Object.fromEntries(
        Object.entries(template.variables).map(([key, def]: [string, any]) => [
          key,
          def.defaultValue || ''
        ])
      )
    }));
    setStep(2);
  };

  // 處理變數變更
  const handleVariableChange = (varName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [varName]: value
      }
    }));
  };

  // 驗證表單
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('請輸入提案標題');
      return false;
    }

    if (!selectedTemplate) {
      setError('請選擇範本');
      return false;
    }

    // 檢查必填變數
    const requiredVars = Object.entries(selectedTemplate.variables)
      .filter(([, def]: [string, any]) => def.required)
      .map(([name]) => name);

    for (const varName of requiredVars) {
      if (!formData.variables[varName] || formData.variables[varName].toString().trim() === '') {
        setError(`請填寫必填變數: ${varName}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  // 執行AI生成
  const generateProposal = async () => {
    if (!validateForm()) {
      return;
    }

    setGenerating(true);
    setProgress(0);
    setResult(null);
    setError('');

    try {
      // 模擬進度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate!.id,
          title: formData.title,
          variables: formData.variables,
          customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
          opportunityId: formData.opportunityId ? parseInt(formData.opportunityId) : undefined,
          generatedBy: 1, // TODO: 從認證上下文獲取
          aiConfig: formData.aiConfig
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setStep(4);
      } else {
        setError(data.message || '生成失敗');
      }
    } catch (error: any) {
      console.error('生成錯誤:', error);
      setError('生成時發生錯誤');
    } finally {
      setGenerating(false);
    }
  };

  // 重新生成
  const regenerateProposal = async () => {
    if (!result) return;

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/regenerate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalGenerationId: result.id,
          updates: {
            variables: formData.variables,
            aiConfig: formData.aiConfig
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || '重新生成失敗');
      }
    } catch (error: any) {
      console.error('重新生成錯誤:', error);
      setError('重新生成時發生錯誤');
    } finally {
      setGenerating(false);
    }
  };

  // 複製到剪貼板
  const copyToClipboard = async () => {
    if (result?.content) {
      try {
        await navigator.clipboard.writeText(result.content);
        // TODO: 顯示成功提示
      } catch (error) {
        console.error('複製失敗:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 頁面標題和進度 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI提案生成</h1>
        <p className="text-gray-600 mb-4">使用AI技術自動生成個性化的商業提案</p>

        {/* 步驟指示器 */}
        <div className="flex items-center space-x-4">
          {[
            { num: 1, name: '選擇範本', icon: DocumentTextIcon },
            { num: 2, name: '填寫變數', icon: DocumentTextIcon },
            { num: 3, name: '生成設定', icon: Cog6ToothIcon },
            { num: 4, name: '生成結果', icon: SparklesIcon }
          ].map((stepInfo, index) => (
            <div key={stepInfo.num} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= stepInfo.num
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepInfo.num ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  stepInfo.num
                )}
              </div>
              <span className={`ml-2 text-sm ${
                step >= stepInfo.num ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {stepInfo.name}
              </span>
              {index < 3 && (
                <div className={`w-12 h-0.5 ml-4 ${
                  step > stepInfo.num ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 步驟1: 選擇範本 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>選擇提案範本</CardTitle>
            <CardDescription>
              選擇一個適合的範本作為AI生成的基礎
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">{template.name}</h3>
                      <Badge className="ml-2">
                        {template.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {template.description || '無描述'}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>使用 {template.usage_count} 次</span>
                      <span>{Object.keys(template.variables).length} 個變數</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 步驟2: 填寫變數 */}
      {step === 2 && selectedTemplate && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                設置提案的基本信息和關聯客戶
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">提案標題 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="輸入提案標題"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">關聯客戶</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇客戶（可選）" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.company_name} ({customer.industry})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>範本變數</CardTitle>
              <CardDescription>
                填寫範本所需的變數值，帶 * 的為必填項目
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(selectedTemplate.variables).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  此範本不需要填寫變數
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedTemplate.variables).map(([varName, varDef]: [string, any]) => (
                    <div key={varName} className="space-y-2">
                      <Label htmlFor={varName}>
                        {varName} {varDef.required && <span className="text-red-500">*</span>}
                      </Label>
                      {varDef.type === 'select' && varDef.options ? (
                        <Select
                          value={formData.variables[varName] || ''}
                          onValueChange={(value) => handleVariableChange(varName, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`選擇 ${varName}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {varDef.options.map((option: string) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : varDef.type === 'textarea' || (typeof varDef.defaultValue === 'string' && varDef.defaultValue.length > 50) ? (
                        <Textarea
                          id={varName}
                          value={formData.variables[varName] || ''}
                          onChange={(e) => handleVariableChange(varName, e.target.value)}
                          placeholder={varDef.description || `輸入 ${varName}`}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={varName}
                          type={varDef.type === 'number' ? 'number' : varDef.type === 'date' ? 'date' : 'text'}
                          value={formData.variables[varName] || ''}
                          onChange={(e) => handleVariableChange(varName, e.target.value)}
                          placeholder={varDef.description || `輸入 ${varName}`}
                        />
                      )}
                      {varDef.description && (
                        <p className="text-xs text-gray-500">{varDef.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <Button onClick={() => setStep(3)}>
                  下一步
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步驟3: 生成設定 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>AI生成設定</CardTitle>
            <CardDescription>
              調整AI生成參數以獲得最佳效果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">AI模型</Label>
                  <Select
                    value={formData.aiConfig.model}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      aiConfig: { ...prev.aiConfig, model: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4（推薦）</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大輸出長度</Label>
                  <Select
                    value={formData.aiConfig.maxTokens.toString()}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      aiConfig: { ...prev.aiConfig, maxTokens: parseInt(value) }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">短文 (1000 tokens)</SelectItem>
                      <SelectItem value="2000">中等 (2000 tokens)</SelectItem>
                      <SelectItem value="3000">長文 (3000 tokens)</SelectItem>
                      <SelectItem value="4000">詳細 (4000 tokens)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    創意程度: {formData.aiConfig.temperature}
                  </Label>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[formData.aiConfig.temperature]}
                    onValueChange={([value]) => setFormData(prev => ({
                      ...prev,
                      aiConfig: { ...prev.aiConfig, temperature: value }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>保守 (0.0)</span>
                    <span>平衡 (0.7)</span>
                    <span>創新 (1.0)</span>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Cog6ToothIcon className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>參數說明：</strong>
                    <br />• 創意程度：數值越高，生成內容越有創意但可能不夠穩定
                    <br />• 輸出長度：決定生成內容的詳細程度
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                上一步
              </Button>
              <Button onClick={generateProposal} disabled={generating}>
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    開始生成
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成進度 */}
      {generating && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <SparklesIcon className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
              <h3 className="text-lg font-semibold">AI正在生成您的提案...</h3>
              <Progress value={progress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-gray-600">
                這可能需要幾秒鐘時間，請耐心等待
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步驟4: 生成結果 */}
      {step === 4 && result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    生成完成
                  </CardTitle>
                  <CardDescription>
                    AI已成功生成您的提案內容
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {result.qualityScore && (
                    <Badge variant="outline">
                      品質分數: {result.qualityScore}%
                    </Badge>
                  )}
                  <Badge className="bg-green-100 text-green-800">
                    {result.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.usage && (
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                  <div>輸入 Token: {result.usage.promptTokens}</div>
                  <div>輸出 Token: {result.usage.completionTokens}</div>
                  <div>總計: {result.usage.totalTokens}</div>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto mb-4">
                <pre className="whitespace-pre-wrap text-sm">{result.content}</pre>
              </div>

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    重新設定
                  </Button>
                  <Button variant="outline" onClick={regenerateProposal} disabled={generating}>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    重新生成
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyToClipboard}>
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    複製內容
                  </Button>
                  <Button onClick={() => router.push('/dashboard/proposals')}>
                    完成
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GenerateProposalPage;