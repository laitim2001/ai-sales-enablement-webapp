/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫文檔編輯組件（含版本控制）
 * ================================================================
 *
 * 【組件功能】
 * 整合版本控制功能的知識庫文檔編輯組件，包括版本歷史、版本比較和版本回滾。
 *
 * 【主要職責】
 * • 文檔編輯 - 繼承原有的所有編輯功能
 * • 版本歷史 - 顯示文檔的所有版本記錄
 * • 版本比較 - 並排比較兩個版本的差異
 * • 版本回滾 - 回滾到指定版本
 * • 版本創建 - 手動創建版本快照
 * • 標籤頁切換 - 編輯視圖和版本控制視圖切換
 *
 * 【新增功能 - Sprint 6 Week 12】
 * • 版本控制標籤頁 - 編輯/版本歷史兩個標籤頁
 * • 版本歷史列表 - 顯示所有版本快照
 * • 版本比較對話框 - 並排比較版本差異
 * • 版本回滾對話框 - 安全的版本回滾確認
 * • 版本創建功能 - 手動創建版本快照
 *
 * @author Claude Code
 * @date 2025-10-03
 * @sprint Sprint 6 Week 12
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Loader2, Clock, Save, History, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/knowledge/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  KnowledgeVersionHistory,
  KnowledgeVersionComparison,
  KnowledgeVersionRestore,
} from '@/components/knowledge/version';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface DocumentData {
  id: number;
  title: string;
  content?: string;
  category: string;
  status: string;
  source?: string;
  author?: string;
  language?: string;
  version: number;
  tags: Array<{
    id: number;
    name: string;
    color?: string;
  }>;
}

interface KnowledgeDocumentEditWithVersionProps {
  documentId: number;
}

const categoryOptions = [
  { value: 'GENERAL', label: '一般' },
  { value: 'PRODUCT_SPEC', label: '產品規格' },
  { value: 'SALES_MATERIAL', label: '銷售資料' },
  { value: 'TECHNICAL_DOC', label: '技術文檔' },
  { value: 'LEGAL_DOC', label: '法律文件' },
  { value: 'TRAINING', label: '培訓資料' },
  { value: 'FAQ', label: '常見問題' },
  { value: 'CASE_STUDY', label: '案例研究' },
  { value: 'WHITE_PAPER', label: '白皮書' },
  { value: 'PRESENTATION', label: '簡報' },
  { value: 'COMPETITOR', label: '競爭分析' },
  { value: 'INDUSTRY_NEWS', label: '行業新聞' },
  { value: 'INTERNAL', label: '內部文檔' },
];

const statusOptions = [
  { value: 'ACTIVE', label: '啟用' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'ARCHIVED', label: '歸檔' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function KnowledgeDocumentEditWithVersion({
  documentId,
}: KnowledgeDocumentEditWithVersionProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    status: 'ACTIVE',
    author: '',
    tags: '',
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // 版本控制相關狀態
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [createVersionDialogOpen, setCreateVersionDialogOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [restoreTargetVersion, setRestoreTargetVersion] = useState<any>(null);
  const [versionFormData, setVersionFormData] = useState({
    changeSummary: '',
    isMajor: false,
    tags: '',
  });

  useEffect(() => {
    loadDocument();
    loadVersions();
  }, [documentId]);

  /**
   * 自動保存功能 (3秒防抖)
   */
  useEffect(() => {
    if (!document || saveStatus === 'saving') return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData.title, formData.content, formData.category, formData.status, formData.author, formData.tags]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('文檔不存在或已被刪除');
        }
        throw new Error('載入文檔失敗');
      }

      const result = await response.json();
      if (result.success) {
        const doc = result.data;
        setDocument(doc);
        setFormData({
          title: doc.title || '',
          content: doc.content || '',
          category: doc.category || 'GENERAL',
          status: doc.status || 'ACTIVE',
          author: doc.author || '',
          tags: doc.tags.map((tag: any) => tag.name).join(', '),
        });
      } else {
        throw new Error(result.error || '載入文檔失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      setVersionsLoading(true);

      const response = await fetch(`/api/knowledge-base/${documentId}/versions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('載入版本歷史失敗');
      }

      const result = await response.json();
      setVersions(result.versions || []);
    } catch (err) {
      console.error('載入版本歷史失敗:', err);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (!document) return;

    try {
      setSaveStatus('saving');

      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim() || undefined,
        category: formData.category,
        status: formData.status,
        author: formData.author.trim() || undefined,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('自動保存失敗');
      }

      setSaveStatus('saved');
      setLastSaved(new Date());

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('自動保存失敗:', err);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [document, documentId, formData]);

  const handleManualSave = async () => {
    await handleAutoSave();

    if (saveStatus !== 'error') {
      setSuccessMessage('文檔保存成功！');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('標題不能為空');
      return;
    }

    try {
      setSaveStatus('saving');
      setError(null);
      setSuccessMessage(null);

      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim() || undefined,
        category: formData.category,
        status: formData.status,
        author: formData.author.trim() || undefined,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      const response = await fetch(`/api/knowledge-base/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '更新失敗');
      }

      const result = await response.json();
      if (result.success) {
        setSuccessMessage('文檔更新成功！正在跳轉...');
        setSaveStatus('saved');

        setTimeout(() => {
          router.push(`/dashboard/knowledge/${documentId}`);
        }, 2000);
      } else {
        throw new Error(result.error || '更新失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
      setSaveStatus('error');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (error) setError(null);
  };

  const handleVersionCompare = async (versionId1: string, versionId2: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/${documentId}/versions/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ versionId1, versionId2 }),
      });

      if (!response.ok) {
        throw new Error('版本比較失敗');
      }

      const result = await response.json();
      setComparisonData(result);
      setCompareDialogOpen(true);
    } catch (err) {
      console.error('版本比較失敗:', err);
      alert('版本比較失敗，請重試');
    }
  };

  const handleVersionRestore = (versionId: string) => {
    const targetVersion = versions.find((v) => v.id === versionId);
    if (targetVersion) {
      setRestoreTargetVersion(targetVersion);
      setRestoreDialogOpen(true);
    }
  };

  const handleRestoreConfirm = async (versionId: string, reason: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/${documentId}/versions/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ versionId, reason }),
      });

      if (!response.ok) {
        throw new Error('版本回滾失敗');
      }

      const result = await response.json();
      alert('版本回滾成功！');

      // 重新載入文檔和版本歷史
      await loadDocument();
      await loadVersions();
      setRestoreDialogOpen(false);
    } catch (err) {
      console.error('版本回滾失敗:', err);
      alert('版本回滾失敗，請重試');
    }
  };

  const handleCreateVersion = async () => {
    if (!versionFormData.changeSummary.trim()) {
      alert('請填寫變更摘要');
      return;
    }

    try {
      const tags = versionFormData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch(`/api/knowledge-base/${documentId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          changeSummary: versionFormData.changeSummary,
          isMajor: versionFormData.isMajor,
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error('創建版本失敗');
      }

      const result = await response.json();
      alert('版本創建成功！');

      // 重置表單
      setVersionFormData({
        changeSummary: '',
        isMajor: false,
        tags: '',
      });

      // 重新載入版本歷史
      await loadVersions();
      setCreateVersionDialogOpen(false);
    } catch (err) {
      console.error('創建版本失敗:', err);
      alert('創建版本失敗，請重試');
    }
  };

  const handleVersionDelete = async (versionId: string) => {
    if (!confirm('確定要刪除此版本嗎？此操作無法恢復。')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${documentId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('刪除版本失敗');
      }

      alert('版本刪除成功！');
      await loadVersions();
    } catch (err) {
      console.error('刪除版本失敗:', err);
      alert('刪除版本失敗，請重試');
    }
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>保存中...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <span>已保存</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>保存失敗</span>
          </div>
        );
      default:
        return lastSaved ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>上次保存: {lastSaved.toLocaleTimeString()}</span>
          </div>
        ) : null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDocument} variant="outline">
            重試
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 保存狀態欄 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
        {renderSaveStatus()}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-2" />
            手動保存
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateVersionDialogOpen(true)}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            創建版本
          </Button>
        </div>
      </div>

      {/* 成功/錯誤訊息 */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 標籤頁：編輯 / 版本歷史 */}
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            編輯文檔
          </TabsTrigger>
          <TabsTrigger value="versions">
            <History className="h-4 w-4 mr-2" />
            版本歷史 ({versions.length})
          </TabsTrigger>
        </TabsList>

        {/* 編輯標籤頁 */}
        <TabsContent value="edit" className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 標題 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                文檔標題 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入文檔標題"
                  required
                />
              </div>
            </div>

            {/* 內容 - 富文本編輯器 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">文檔內容</label>
              <RichTextEditor
                content={formData.content}
                onUpdate={(content) => {
                  setFormData((prev) => ({ ...prev, content }));
                  if (error) setError(null);
                }}
                placeholder="開始編寫文檔內容..."
                minHeight="400px"
                maxHeight="600px"
              />
            </div>

            {/* 屬性設置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  文檔類別
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  文檔狀態
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 作者和標籤 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  作者
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="文檔作者"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  標籤
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="以逗號分隔多個標籤"
                />
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => router.push(`/dashboard/knowledge/${documentId}`)}
                variant="outline"
                disabled={saveStatus === 'saving'}
              >
                取消
              </Button>

              <Button type="submit" disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? '保存中...' : '保存變更'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* 版本歷史標籤頁 */}
        <TabsContent value="versions" className="mt-6">
          {versionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <KnowledgeVersionHistory
              knowledgeBaseId={documentId}
              versions={versions}
              currentVersion={document?.version}
              onCompare={handleVersionCompare}
              onRestore={handleVersionRestore}
              onDelete={handleVersionDelete}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* 版本比較對話框 */}
      {comparisonData && (
        <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>版本比較</DialogTitle>
              <DialogDescription>並排查看兩個版本之間的差異</DialogDescription>
            </DialogHeader>
            <KnowledgeVersionComparison
              version1={comparisonData.version1}
              version2={comparisonData.version2}
              diffs={comparisonData.diff}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 版本回滾對話框 */}
      {restoreTargetVersion && (
        <KnowledgeVersionRestore
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          targetVersion={restoreTargetVersion}
          currentVersion={{
            version: document?.version || 0,
            title: document?.title || '',
            content: document?.content,
            metadata: {},
          }}
          onRestore={handleRestoreConfirm}
        />
      )}

      {/* 創建版本對話框 */}
      <Dialog open={createVersionDialogOpen} onOpenChange={setCreateVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>創建版本快照</DialogTitle>
            <DialogDescription>為當前文檔狀態創建一個版本快照</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="changeSummary">
                變更摘要 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="changeSummary"
                value={versionFormData.changeSummary}
                onChange={(e) =>
                  setVersionFormData((prev) => ({ ...prev, changeSummary: e.target.value }))
                }
                placeholder="簡要說明此版本的主要變更..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isMajor"
                checked={versionFormData.isMajor}
                onCheckedChange={(checked) =>
                  setVersionFormData((prev) => ({ ...prev, isMajor: checked as boolean }))
                }
              />
              <Label htmlFor="isMajor">標記為主要版本</Label>
            </div>
            <div>
              <Label htmlFor="versionTags">版本標籤（可選）</Label>
              <input
                type="text"
                id="versionTags"
                value={versionFormData.tags}
                onChange={(e) =>
                  setVersionFormData((prev) => ({ ...prev, tags: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="以逗號分隔，例如：重要更新, 修復錯誤"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateVersionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateVersion}>創建版本</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
