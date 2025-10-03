/**
 * 知識庫版本回滾組件
 *
 * 功能：
 * - 版本回滾確認對話框
 * - 顯示回滾影響範圍
 * - 支持回滾原因記錄
 * - 安全檢查和權限驗證
 *
 * 作者：Claude Code
 * 日期：2025-10-03
 * Sprint: 6 Week 12
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  AlertTriangle,
  FileText,
  Info,
  File,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface KnowledgeVersionDetail {
  id: string;
  version: number;
  title: string;
  content?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  metadata?: any;
  change_summary?: string | null;
  changed_fields?: any;
  is_major: boolean;
  tags: string[];
  created_at: Date;
}

interface KnowledgeVersionRestoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetVersion: KnowledgeVersionDetail;
  currentVersion: {
    version: number;
    title: string;
    content?: string | null;
    file_path?: string | null;
    metadata?: any;
  };
  onRestore: (versionId: string, reason: string) => Promise<void>;
}

export function KnowledgeVersionRestore({
  open,
  onOpenChange,
  targetVersion,
  currentVersion,
  onRestore,
}: KnowledgeVersionRestoreProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [understood, setUnderstood] = useState(false);

  // 計算影響範圍
  const getImpactAnalysis = () => {
    const impacts: string[] = [];

    // 版本差距
    const versionGap = currentVersion.version - targetVersion.version;
    if (versionGap > 0) {
      impacts.push(`將回退 ${versionGap} 個版本的更改`);
    }

    // 標題變更
    if (currentVersion.title !== targetVersion.title) {
      impacts.push('文檔標題將被修改');
    }

    // 內容變更
    if (currentVersion.content !== targetVersion.content) {
      if (targetVersion.content && !currentVersion.content) {
        impacts.push('將恢復文檔內容');
      } else if (!targetVersion.content && currentVersion.content) {
        impacts.push('文檔內容將被清空');
      } else {
        impacts.push('文檔內容將被修改');
      }
    }

    // 文件變更
    if (currentVersion.file_path !== targetVersion.file_path) {
      if (targetVersion.file_path && !currentVersion.file_path) {
        impacts.push('將恢復附件文件');
      } else if (!targetVersion.file_path && currentVersion.file_path) {
        impacts.push('附件文件將被移除');
      } else {
        impacts.push('附件文件將被替換');
      }
    }

    // 元數據變更
    if (JSON.stringify(currentVersion.metadata) !== JSON.stringify(targetVersion.metadata)) {
      impacts.push('文檔元數據將被修改');
    }

    // 變更欄位統計
    if (targetVersion.changed_fields && Object.keys(targetVersion.changed_fields).length > 0) {
      const fieldCount = Object.keys(targetVersion.changed_fields).length;
      impacts.push(`${fieldCount} 個欄位將被恢復到舊值`);
    }

    return impacts;
  };

  const impacts = getImpactAnalysis();

  const handleRestore = async () => {
    if (!reason.trim() || !understood) {
      return;
    }

    setLoading(true);
    try {
      await onRestore(targetVersion.id, reason);
      onOpenChange(false);
      setReason('');
      setUnderstood(false);
    } catch (error) {
      console.error('版本回滾失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            知識庫版本回滾確認
          </DialogTitle>
          <DialogDescription>
            此操作將回滾知識庫文檔到先前的版本，請仔細確認。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 版本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-xs font-medium text-gray-500">
                當前版本
              </div>
              <div className="text-lg font-semibold">
                版本 {currentVersion.version}
              </div>
              <div className="mt-1 text-sm text-gray-600 truncate">
                {currentVersion.title}
              </div>
              {currentVersion.file_path && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <File className="h-3 w-3" />
                  {currentVersion.file_path.split('/').pop()}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="mb-2 text-xs font-medium text-orange-600">
                回滾目標
              </div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">
                  版本 {targetVersion.version}
                </div>
                {targetVersion.is_major && (
                  <Badge variant="secondary" className="text-xs">主要版本</Badge>
                )}
                {targetVersion.tags.length > 0 && (
                  <Badge variant="outline" className="text-xs">{targetVersion.tags[0]}</Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-600 truncate">
                {targetVersion.title}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(targetVersion.created_at).toLocaleString('zh-TW')}
              </div>
              {targetVersion.file_path && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <File className="h-3 w-3" />
                  {targetVersion.file_path.split('/').pop()} ({formatFileSize(targetVersion.file_size)})
                </div>
              )}
            </div>
          </div>

          {/* 變更摘要 */}
          {targetVersion.change_summary && (
            <div className="rounded-lg border bg-blue-50 p-3">
              <div className="text-xs font-medium text-blue-800 mb-1">版本變更摘要</div>
              <div className="text-sm text-blue-700">{targetVersion.change_summary}</div>
            </div>
          )}

          {/* 警告提示 */}
          {impacts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>重要提示</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  {impacts.map((impact, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{impact}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 影響範圍 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>回滾後的影響</AlertTitle>
            <AlertDescription className="mt-2 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-medium">知識庫文檔內容</div>
                  <div className="text-gray-600">
                    所有欄位（標題、內容、附件等）將恢復到版本 {targetVersion.version} 的狀態
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-medium">版本歷史記錄</div>
                  <div className="text-gray-600">
                    系統會自動創建回滾前的備份版本，並創建新的版本記錄，原有版本不會被刪除
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-medium">安全保護</div>
                  <div className="text-gray-600">
                    回滾操作會保留完整的版本歷史，您可以隨時回滾到任何版本
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* 變更欄位詳情 */}
          {targetVersion.changed_fields && Object.keys(targetVersion.changed_fields).length > 0 && (
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">變更欄位詳情</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(targetVersion.changed_fields).map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 回滾原因 */}
          <div className="space-y-2">
            <Label htmlFor="restore-reason" className="flex items-center gap-1">
              回滾原因
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="restore-reason"
              placeholder="請說明為什麼需要回滾到此版本（例如：修正錯誤、恢復舊內容、測試等）..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-gray-500">
              此原因將記錄在版本歷史中，幫助團隊了解回滾的背景
            </p>
          </div>

          {/* 確認理解 */}
          <div className="flex items-start gap-3 rounded-lg border-2 border-orange-300 bg-orange-50 p-3">
            <Checkbox
              id="understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <Label
              htmlFor="understood"
              className="flex-1 text-sm font-medium text-orange-800"
            >
              我已理解版本回滾的影響範圍，並確認要執行此操作
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleRestore}
            disabled={loading || !reason.trim() || !understood}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {loading ? '處理中...' : '確認回滾'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
