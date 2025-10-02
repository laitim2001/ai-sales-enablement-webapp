/**
 * 範本預覽頁面（獨立頁面）
 *
 * 功能：
 * - 載入範本數據
 * - 顯示範本基本信息
 * - 提供變數輸入表單
 * - 實時預覽渲染結果
 * - 導出 PDF（後續功能）
 *
 * @author Claude Code
 * @date 2025-10-02
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Eye,
  FileText,
  Settings,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// 範本分類標籤
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

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: Record<string, any>;
}

export default function TemplatePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const templateId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [useTestData, setUseTestData] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // 載入範本
  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);
      const result = await response.json();

      if (result.success) {
        setTemplate(result.data);
        // 初始化變數值為默認值
        const initialValues: Record<string, any> = {};
        Object.entries(result.data.variables || {}).forEach(([key, config]: [string, any]) => {
          if (config.defaultValue !== undefined) {
            initialValues[key] = config.defaultValue;
          }
        });
        setVariableValues(initialValues);
        // 自動預覽
        await generatePreview(result.data, initialValues, true);
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

  // 生成預覽
  const generatePreview = async (
    templateData?: Template,
    values?: Record<string, any>,
    useTest?: boolean
  ) => {
    try {
      setIsPreviewLoading(true);
      const currentTemplate = templateData || template;
      const currentValues = values || variableValues;
      const shouldUseTest = useTest !== undefined ? useTest : useTestData;

      if (!currentTemplate) return;

      const response = await fetch(`/api/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: shouldUseTest ? undefined : currentValues,
          useTestData: shouldUseTest,
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

  // 更新變數值
  const updateVariableValue = (key: string, value: any) => {
    setVariableValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 切換測試數據模式
  const toggleTestData = () => {
    const newUseTestData = !useTestData;
    setUseTestData(newUseTestData);
    generatePreview(template, variableValues, newUseTestData);
  };

  // 導出 PDF
  const exportPDF = async () => {
    if (!template) return;

    try {
      setIsExportingPDF(true);
      toast({
        title: '正在生成 PDF...',
        description: '請稍候，這可能需要幾秒鐘',
      });

      // 調用 PDF 導出 API
      const response = await fetch(`/api/templates/${templateId}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: variableValues,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'PDF 生成失敗');
      }

      // 獲取 PDF Blob
      const pdfBlob = await response.blob();

      // 從響應頭獲取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `${template.name}_${Date.now()}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/);
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      // 創建下載鏈接
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 獲取生成時間（如果有）
      const generationTime = response.headers.get('X-Generation-Time');

      toast({
        title: 'PDF 導出成功！',
        description: generationTime ? `耗時: ${generationTime}` : '文件已下載',
      });

    } catch (error) {
      console.error('PDF 導出錯誤:', error);
      toast({
        title: 'PDF 導出失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // 渲染變數輸入組件
  const renderVariableInput = (key: string, config: any) => {
    const value = variableValues[key];

    switch (config.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateVariableValue(key, e.target.value)}
            placeholder={config.defaultValue || ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateVariableValue(key, parseFloat(e.target.value))}
            placeholder={config.defaultValue || '0'}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateVariableValue(key, e.target.value)}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={(checked) => updateVariableValue(key, checked)}
            />
            <span className="text-sm text-gray-600">啟用</span>
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateVariableValue(key, e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">請選擇...</option>
            {config.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <Textarea
            value={Array.isArray(value) ? value.join('\n') : ''}
            onChange={(e) =>
              updateVariableValue(
                key,
                e.target.value.split('\n').filter((v) => v.trim())
              )
            }
            placeholder="每行一個選項"
            rows={3}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateVariableValue(key, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <Skeleton className="h-96" />
          </div>
          <div className="col-span-8">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">範本不存在</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/templates')}>
              返回列表
            </Button>
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
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge>{categoryLabels[template.category]}</Badge>
              {template.description && (
                <p className="text-gray-600 text-sm">{template.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/templates/${templateId}`)}>
            <Settings className="mr-2 h-4 w-4" />
            編輯
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            disabled={isExportingPDF}
          >
            {isExportingPDF ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                導出 PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左側：變數配置 */}
        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">變數配置</CardTitle>
                  <CardDescription>設置範本變數值</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleTestData}>
                  <Eye className="h-4 w-4 mr-2" />
                  {useTestData ? '使用測試數據' : '使用自定義數據'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(template.variables || {}).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">此範本沒有配置變數</p>
                </div>
              ) : (
                Object.entries(template.variables || {}).map(([key, config]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {config.label || key}
                      {config.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderVariableInput(key, config)}
                    {config.type && (
                      <p className="text-xs text-gray-500">類型: {config.type}</p>
                    )}
                  </div>
                ))
              )}

              <Button
                className="w-full mt-4"
                onClick={() => generatePreview()}
                disabled={isPreviewLoading || useTestData}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPreviewLoading ? 'animate-spin' : ''}`} />
                更新預覽
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm">使用說明</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>• 切換「使用測試數據」可以快速查看範本效果</p>
              <p>• 使用「使用自定義數據」模式可以輸入實際數據</p>
              <p>• 修改變數值後點擊「更新預覽」查看效果</p>
              <p>• 必填變數會標記紅色星號 *</p>
            </CardContent>
          </Card>
        </div>

        {/* 右側：預覽區 */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">預覽</CardTitle>
                  <CardDescription>
                    {useTestData ? '使用測試數據' : '使用自定義數據'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePreview()}
                  disabled={isPreviewLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isPreviewLoading ? 'animate-spin' : ''}`}
                  />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPreviewLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">生成預覽中...</p>
                  </div>
                </div>
              ) : previewHtml ? (
                <div className="bg-white border rounded-lg">
                  <div
                    className="prose max-w-none p-8"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              ) : (
                <div className="text-center py-24 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>暫無預覽</p>
                  <p className="text-sm mt-2">點擊「更新預覽」生成預覽</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
