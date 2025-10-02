/**
 * 提案版本歷史頁面
 *
 * 功能：
 * - 顯示提案的所有版本
 * - 版本比較
 * - 版本回滾
 * - 創建新版本快照
 *
 * @author Claude Code
 * @date 2025-10-02
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VersionHistory } from '@/components/workflow/version/VersionHistory';
import { VersionComparison } from '@/components/workflow/version/VersionComparison';
import { VersionRestore } from '@/components/workflow/version/VersionRestore';
import { useToast } from '@/hooks/use-toast';

interface ProposalVersion {
  id: number;
  version: number;
  snapshot_data: any;
  created_at: Date;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  label?: string | null;
  description?: string | null;
  metadata?: any;
}

export default function ProposalVersionsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const proposalId = params.id;

  // 狀態管理
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | undefined>();

  // 版本比較狀態
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // 版本回滾狀態
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ProposalVersion | null>(
    null
  );

  // 創建快照狀態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // 載入版本歷史
  useEffect(() => {
    loadVersions();
  }, [proposalId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proposals/${proposalId}/versions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '載入版本歷史失敗');
      }

      setVersions(data.data.versions);

      // 獲取當前版本號
      const proposalResponse = await fetch(`/api/proposals/${proposalId}`);
      if (proposalResponse.ok) {
        const proposalData = await proposalResponse.json();
        setCurrentVersion(proposalData.data.version);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入版本歷史失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理版本比較
  const handleCompare = async (versionIdA: number, versionIdB: number) => {
    try {
      setComparing(true);

      const response = await fetch(
        `/api/proposals/${proposalId}/versions/compare`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionIdA, versionIdB }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '版本比較失敗');
      }

      setComparisonData(data.data);
    } catch (err) {
      toast({
        title: '比較失敗',
        description: err instanceof Error ? err.message : '版本比較失敗',
        variant: 'destructive',
      });
    } finally {
      setComparing(false);
    }
  };

  // 處理版本回滾
  const handleRestore = async (
    versionId: number,
    reason: string,
    createBackup: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/versions/restore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionId, reason, createBackup }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '版本回滾失敗');
      }

      toast({
        title: '回滾成功',
        description: data.message,
      });

      // 重新載入版本列表
      await loadVersions();
    } catch (err) {
      toast({
        title: '回滾失敗',
        description: err instanceof Error ? err.message : '版本回滾失敗',
        variant: 'destructive',
      });
      throw err; // 重新拋出錯誤以便對話框處理
    }
  };

  // 處理創建快照
  const handleCreateSnapshot = async () => {
    try {
      setCreating(true);

      const response = await fetch(`/api/proposals/${proposalId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: snapshotLabel.trim() || undefined,
          description: snapshotDescription.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '創建快照失敗');
      }

      toast({
        title: '快照已創建',
        description: '新版本快照創建成功',
      });

      setCreateDialogOpen(false);
      setSnapshotLabel('');
      setSnapshotDescription('');

      // 重新載入版本列表
      await loadVersions();
    } catch (err) {
      toast({
        title: '創建失敗',
        description: err instanceof Error ? err.message : '創建快照失敗',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // 處理版本下載
  const handleDownload = (versionId: number) => {
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;

    const dataStr = JSON.stringify(version.snapshot_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proposal-${proposalId}-v${version.version}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: '下載成功',
      description: `版本 ${version.version} 已下載`,
    });
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">版本歷史</h1>
            <p className="text-sm text-gray-500">
              提案 #{proposalId} 的所有版本記錄
            </p>
          </div>
        </div>

        {/* 創建快照按鈕 */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              創建快照
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>創建版本快照</DialogTitle>
              <DialogDescription>
                為當前提案狀態創建一個新的版本快照
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="snapshot-label">標籤（可選）</Label>
                <Input
                  id="snapshot-label"
                  placeholder="例如：初稿、最終版本"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="snapshot-description">描述（可選）</Label>
                <Textarea
                  id="snapshot-description"
                  placeholder="描述此版本的主要變更..."
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                取消
              </Button>
              <Button onClick={handleCreateSnapshot} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    創建中...
                  </>
                ) : (
                  '創建快照'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 版本比較結果 */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>版本比較結果</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparisonData(null)}
              >
                關閉比較
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <VersionComparison
              versionA={comparisonData.versionA}
              versionB={comparisonData.versionB}
              diffs={comparisonData.comparison.differences}
            />
          </CardContent>
        </Card>
      )}

      {/* 版本列表 */}
      <VersionHistory
        versions={versions}
        currentVersion={currentVersion}
        onCompare={handleCompare}
        onRestore={(versionId) => {
          const target = versions.find((v) => v.id === versionId);
          if (target) {
            setRestoreTarget(target);
            setRestoreDialogOpen(true);
          }
        }}
        onDownload={handleDownload}
      />

      {/* 版本回滾對話框 */}
      {restoreTarget && currentVersion && (
        <VersionRestore
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          targetVersion={restoreTarget}
          currentVersion={{
            version: currentVersion,
            snapshot_data: versions.find((v) => v.version === currentVersion)
              ?.snapshot_data,
          }}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}
