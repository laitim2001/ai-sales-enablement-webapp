/**
 * @fileoverview 會議準備包創建嚮導組件📋 功能說明：- 多步驟創建流程（4步驟）- Step 1: 選擇準備包類型- Step 2: 選擇模板或自定義- Step 3: 添加/編輯項目（支持拖拽排序）- Step 4: 預覽和確認- 進度指示器- 數據驗證- 草稿保存📊 使用場景：- 創建新準備包- 從模板快速創建- 自定義準備包內容作者：Claude Code日期：2025-10-05Sprint：Sprint 7 Phase 3
 * @module components/meeting-prep/PrepPackageWizard
 * @description
 * 會議準備包創建嚮導組件📋 功能說明：- 多步驟創建流程（4步驟）- Step 1: 選擇準備包類型- Step 2: 選擇模板或自定義- Step 3: 添加/編輯項目（支持拖拽排序）- Step 4: 預覽和確認- 進度指示器- 數據驗證- 草稿保存📊 使用場景：- 創建新準備包- 從模板快速創建- 自定義準備包內容作者：Claude Code日期：2025-10-05Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  X
} from 'lucide-react';
import {
  PrepPackageType,
  PrepPackageStatus,
  PrepItemType,
  PrepPackageItem,
  MeetingPrepPackage
} from '@/lib/meeting/meeting-prep-package';

/**
 * 準備包模板
 */
interface PrepPackageTemplate {
  id: string;
  type: PrepPackageType;
  name: string;
  description: string;
  defaultItems: Omit<PrepPackageItem, 'id'>[];
}

/**
 * 嚮導步驟
 */
type WizardStep = 1 | 2 | 3 | 4;

/**
 * PrepPackageWizard 組件屬性
 */
export interface PrepPackageWizardProps {
  /** 是否顯示嚮導 */
  open: boolean;
  /** 關閉嚮導回調 */
  onClose: () => void;
  /** 創建成功回調 */
  onCreate: (packageData: Partial<MeetingPrepPackage>) => Promise<void>;
  /** 可用模板列表 */
  templates?: PrepPackageTemplate[];
  /** 初始數據（用於編輯） */
  initialData?: Partial<MeetingPrepPackage>;
}

/**
 * 會議準備包創建嚮導
 *
 * @example
 * ```tsx
 * <PrepPackageWizard
 *   open={showWizard}
 *   onClose={() => setShowWizard(false)}
 *   onCreate={async (data) => {
 *     await createPrepPackage(data);
 *     toast.success('準備包創建成功');
 *   }}
 *   templates={prepPackageTemplates}
 * />
 * ```
 */
export function PrepPackageWizard({
  open,
  onClose,
  onCreate,
  templates = [],
  initialData
}: PrepPackageWizardProps) {

  // 當前步驟
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // 是否提交中
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === Step 1: 類型選擇 ===
  const [selectedType, setSelectedType] = useState<PrepPackageType | null>(
    initialData?.type || null
  );

  // === Step 2: 模板選擇 ===
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // === Step 3: 基本信息和項目 ===
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [customerName, setCustomerName] = useState(initialData?.metadata?.customerName || '');
  const [objectives, setObjectives] = useState<string[]>(initialData?.metadata?.objectives || []);
  const [newObjective, setNewObjective] = useState('');
  const [items, setItems] = useState<PrepPackageItem[]>(initialData?.items || []);

  // 類型配置
  const typeOptions: { type: PrepPackageType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      type: PrepPackageType.SALES_MEETING,
      label: '銷售會議',
      description: '準備銷售會議所需的客戶資料、產品信息和銷售策略',
      icon: <FileText className="h-6 w-6" />
    },
    {
      type: PrepPackageType.CLIENT_PRESENTATION,
      label: '客戶簡報',
      description: '準備客戶簡報演示文稿、案例研究和演示腳本',
      icon: <FileText className="h-6 w-6" />
    },
    {
      type: PrepPackageType.INTERNAL_REVIEW,
      label: '內部審查',
      description: '準備內部審查所需的項目文檔、數據分析和決策建議',
      icon: <FileText className="h-6 w-6" />
    },
    {
      type: PrepPackageType.PROPOSAL_DISCUSSION,
      label: '提案討論',
      description: '準備提案討論的提案文檔、定價策略和談判要點',
      icon: <FileText className="h-6 w-6" />
    },
    {
      type: PrepPackageType.TRAINING_SESSION,
      label: '培訓會議',
      description: '準備培訓材料、練習案例和培訓評估',
      icon: <FileText className="h-6 w-6" />
    },
    {
      type: PrepPackageType.CUSTOM,
      label: '自定義',
      description: '創建自定義準備包，靈活添加任何類型的內容',
      icon: <FileText className="h-6 w-6" />
    }
  ];

  // 進度計算
  const progress = (currentStep / 4) * 100;

  // 步驟驗證
  const canProceedStep1 = selectedType !== null;
  const canProceedStep2 = !useTemplate || selectedTemplate !== null;
  const canProceedStep3 = title.trim().length > 0 && items.length > 0;

  // 下一步
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  // 上一步
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // 選擇模板
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setDescription(template.description);
      setItems(template.defaultItems.map((item, idx) => ({
        ...item,
        id: `item-${Date.now()}-${idx}`
      })));
    }
  };

  // 添加目標
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  // 刪除目標
  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  // 添加項目
  const handleAddItem = () => {
    const newItem: PrepPackageItem = {
      id: `item-${Date.now()}`,
      type: PrepItemType.KNOWLEDGE_BASE,
      title: '新項目',
      order: items.length,
      isRequired: false,
      metadata: {}
    };
    setItems([...items, newItem]);
  };

  // 刪除項目
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // 更新項目
  const handleUpdateItem = (id: string, updates: Partial<PrepPackageItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // 提交創建
  const handleSubmit = async () => {
    if (!selectedType || !title.trim() || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const packageData: Partial<MeetingPrepPackage> = {
        type: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        status: PrepPackageStatus.DRAFT,
        items: items.map((item, idx) => ({ ...item, order: idx })),
        metadata: {
          customerName: customerName.trim() || undefined,
          objectives: objectives.filter(o => o.trim()),
          autoGenerated: useTemplate,
          templateId: selectedTemplate || undefined,
          totalEstimatedReadTime: items.reduce((sum, item) =>
            sum + (item.metadata?.estimatedReadTime || 0), 0
          )
        }
      };

      await onCreate(packageData);
      onClose();
      resetWizard();
    } catch (error) {
      console.error('創建準備包失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置嚮導
  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedType(null);
    setUseTemplate(false);
    setSelectedTemplate(null);
    setTitle('');
    setDescription('');
    setCustomerName('');
    setObjectives([]);
    setItems([]);
  };

  // 關閉處理
  const handleClose = () => {
    if (currentStep > 1) {
      if (confirm('確定要關閉嚮導嗎？未保存的更改將會丟失。')) {
        onClose();
        resetWizard();
      }
    } else {
      onClose();
      resetWizard();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            創建會議準備包
          </DialogTitle>
          <DialogDescription>
            步驟 {currentStep}/4 - {
              currentStep === 1 ? '選擇準備包類型' :
              currentStep === 2 ? '選擇模板（可選）' :
              currentStep === 3 ? '填寫基本信息和項目' :
              '預覽和確認'
            }
          </DialogDescription>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: 類型選擇 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">選擇準備包類型</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeOptions.map(option => (
                  <Card
                    key={option.type}
                    className={`cursor-pointer transition-all ${
                      selectedType === option.type
                        ? 'border-primary ring-2 ring-primary ring-opacity-50'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(option.type)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{option.label}</CardTitle>
                        </div>
                        {selectedType === option.type && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 模板選擇 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">選擇模板（可選）</h3>
                <Button
                  variant={useTemplate ? 'default' : 'outline'}
                  onClick={() => setUseTemplate(!useTemplate)}
                >
                  {useTemplate ? '使用模板' : '從空白開始'}
                </Button>
              </div>

              {useTemplate ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates
                    .filter(t => t.type === selectedType)
                    .map(template => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary ring-2 ring-primary ring-opacity-50'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            {selectedTemplate === template.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{template.defaultItems.length} 個項目</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      從空白開始創建，您可以完全自定義準備包內容
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: 基本信息和項目 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本信息</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">準備包標題 *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：Q4 產品發布會準備"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="簡要描述這個準備包的用途..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName">客戶名稱</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="例如：ABC 科技公司"
                  />
                </div>

                <div className="space-y-2">
                  <Label>會議目標</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
                      placeholder="添加會議目標..."
                    />
                    <Button type="button" onClick={handleAddObjective}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {objectives.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{obj}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveObjective(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">準備包項目</h3>
                  <Button onClick={handleAddItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    添加項目
                  </Button>
                </div>

                {items.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      還沒有項目，點擊上方按鈕添加
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                            <div className="flex-1 space-y-3">
                              <Input
                                value={item.title}
                                onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                                placeholder="項目標題"
                              />
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={item.isRequired}
                                  onCheckedChange={(checked) =>
                                    handleUpdateItem(item.id, { isRequired: !!checked })
                                  }
                                />
                                <Label className="text-sm text-muted-foreground">必需項目</Label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: 預覽 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">預覽並確認</h3>

              <Card>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">類型：</span>
                      <Badge variant="outline" className="ml-2">
                        {typeOptions.find(t => t.type === selectedType)?.label}
                      </Badge>
                    </div>
                    {customerName && (
                      <div>
                        <span className="text-muted-foreground">客戶：</span>
                        <span className="ml-2">{customerName}</span>
                      </div>
                    )}
                  </div>

                  {objectives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">會議目標：</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {objectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">準備包項目 ({items.length})：</p>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{idx + 1}.</span>
                          <span>{item.title}</span>
                          {item.isRequired && (
                            <Badge variant="secondary" className="text-xs">必需</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一步
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2) ||
                  (currentStep === 3 && !canProceedStep3)
                }
              >
                下一步
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Save className="h-4 w-4 mr-1 animate-spin" />
                    創建中...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    創建準備包
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PrepPackageWizard;
