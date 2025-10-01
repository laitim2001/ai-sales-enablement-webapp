/**
 * 版本回滾組件
 *
 * 功能：
 * - 版本回滾確認對話框
 * - 顯示回滾影響範圍
 * - 支持創建回滾前備份
 * - 回滾原因記錄
 *
 * 作者：Claude Code
 * 日期：2025-10-01
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
  Save,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VersionRestoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetVersion: {
    id: number;
    version: number;
    label?: string;
    created_at: Date;
    snapshot_data: any;
  };
  currentVersion: {
    version: number;
    snapshot_data: any;
  };
  onRestore: (
    versionId: number,
    reason: string,
    createBackup: boolean
  ) => Promise<void>;
}

export function VersionRestore({
  open,
  onOpenChange,
  targetVersion,
  currentVersion,
  onRestore,
}: VersionRestoreProps) {
  const [reason, setReason] = useState('');
  const [createBackup, setCreateBackup] = useState(true);
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

    // 數據變更預估
    const currentData = currentVersion.snapshot_data;
    const targetData = targetVersion.snapshot_data;

    if (currentData && targetData) {
      const currentKeys = Object.keys(currentData);
      const targetKeys = Object.keys(targetData);

      const addedKeys = currentKeys.filter(k => !targetKeys.includes(k));
      const removedKeys = targetKeys.filter(k => !currentKeys.includes(k));

      if (addedKeys.length > 0) {
        impacts.push(`${addedKeys.length} 個新增欄位將被移除`);
      }
      if (removedKeys.length > 0) {
        impacts.push(`${removedKeys.length} 個已刪除欄位將被恢復`);
      }
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
      await onRestore(targetVersion.id, reason, createBackup);
      onOpenChange(false);
      setReason('');
      setUnderstood(false);
    } catch (error) {
      console.error('版本回滾失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            版本回滾確認
          </DialogTitle>
          <DialogDescription>
            此操作將回滾到先前的版本，請仔細確認。
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
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="mb-2 text-xs font-medium text-orange-600">
                回滾目標
              </div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">
                  版本 {targetVersion.version}
                </div>
                {targetVersion.label && (
                  <Badge variant="outline">{targetVersion.label}</Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(targetVersion.created_at).toLocaleString('zh-TW')}
              </div>
            </div>
          </div>

          {/* 警告提示 */}
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

          {/* 影響範圍 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>回滾後的影響</AlertTitle>
            <AlertDescription className="mt-2 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-medium">提案內容</div>
                  <div className="text-gray-600">
                    所有欄位將恢復到版本 {targetVersion.version} 的狀態
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-medium">版本歷史</div>
                  <div className="text-gray-600">
                    將創建新的版本記錄，原有版本不會被刪除
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* 備份選項 */}
          <div className="flex items-start gap-3 rounded-lg border bg-blue-50 p-3">
            <Checkbox
              id="create-backup"
              checked={createBackup}
              onCheckedChange={(checked) => setCreateBackup(checked as boolean)}
            />
            <div className="flex-1">
              <Label
                htmlFor="create-backup"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Save className="h-4 w-4" />
                回滾前創建備份
              </Label>
              <p className="mt-1 text-xs text-gray-600">
                強烈建議：在回滾前保存當前版本作為備份，以便需要時可以恢復
              </p>
            </div>
          </div>

          {/* 回滾原因 */}
          <div className="space-y-2">
            <Label htmlFor="restore-reason" className="flex items-center gap-1">
              回滾原因
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="restore-reason"
              placeholder="請說明為什麼需要回滾到此版本..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-gray-500">
              此原因將記錄在版本歷史中
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
