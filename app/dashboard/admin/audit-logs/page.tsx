/**
 * 審計日誌管理頁面
 *
 * 僅限ADMIN角色訪問，提供完整的審計日誌查詢、篩選、統計和導出功能
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 Phase 3 - 審計日誌UI組件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '@/lib/security/audit-log';
import {
  AuditLogList,
  AuditLogFilters,
  AuditLogFiltersValue,
  AuditLogExport,
  AuditLogStats,
} from '@/components/audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

/**
 * 審計日誌管理頁面
 */
export default function AuditLogsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFiltersValue>({});
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // 權限檢查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // 獲取審計日誌
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(pagination.limit),
        offset: String(pagination.offset),
      });

      // 添加篩選條件
      if (filters.userId) params.append('userId', String(filters.userId));
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.success !== undefined) params.append('success', String(filters.success));
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.ipAddress) params.append('ipAddress', filters.ipAddress);

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取審計日誌失敗');
      }

      const data = await response.json();
      setLogs(data.data.logs);
      setPagination((prev) => ({
        ...prev,
        total: data.data.pagination?.total || data.data.logs.length,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取審計日誌失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始加載和篩選變更時重新獲取
  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      fetchLogs();
    }
  }, [pagination.offset, token, user]);

  // 應用篩選
  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    fetchLogs();
  };

  // 重置篩選
  const handleResetFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  // 頁面變更
  const handlePageChange = (newOffset: number) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  // 查看詳情
  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  // 刷新
  const handleRefresh = () => {
    fetchLogs();
  };

  // 非ADMIN用戶
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">權限不足</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                您沒有權限訪問審計日誌
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">審計日誌</h1>
          <p className="text-muted-foreground mt-1">
            查看和分析系統審計日誌記錄
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 選項卡 */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">日誌列表</TabsTrigger>
          <TabsTrigger value="stats">統計分析</TabsTrigger>
          <TabsTrigger value="export">導出</TabsTrigger>
        </TabsList>

        {/* 日誌列表選項卡 */}
        <TabsContent value="logs" className="space-y-4">
          {/* 篩選器 */}
          <AuditLogFilters
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

          {/* 錯誤提示 */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p>{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={fetchLogs}
                  >
                    重試
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 日誌列表 */}
          {!error && (
            <AuditLogList
              logs={logs}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewDetails={handleViewDetails}
            />
          )}
        </TabsContent>

        {/* 統計分析選項卡 */}
        <TabsContent value="stats" className="space-y-4">
          <AuditLogStats filters={filters} autoRefresh={true} />
        </TabsContent>

        {/* 導出選項卡 */}
        <TabsContent value="export" className="space-y-4">
          <AuditLogExport filters={filters} />
        </TabsContent>
      </Tabs>

      {/* 詳情對話框 */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>審計日誌詳情</DialogTitle>
            <DialogDescription>
              查看完整的審計日誌信息
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">ID</h4>
                  <p className="mt-1">{selectedLog.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">時間</h4>
                  <p className="mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">用戶</h4>
                  <p className="mt-1">
                    {selectedLog.userName || `用戶 ${selectedLog.userId}`}
                  </p>
                  {selectedLog.userEmail && (
                    <p className="text-sm text-muted-foreground">{selectedLog.userEmail}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">角色</h4>
                  <p className="mt-1">{selectedLog.userRole || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">操作</h4>
                  <p className="mt-1">{selectedLog.action}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">資源</h4>
                  <p className="mt-1">{selectedLog.resource}</p>
                  {selectedLog.resourceId && (
                    <p className="text-sm text-muted-foreground">ID: {selectedLog.resourceId}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">嚴重級別</h4>
                  <p className="mt-1">{selectedLog.severity.toUpperCase()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">狀態</h4>
                  <p className="mt-1">{selectedLog.success ? '✅ 成功' : '❌ 失敗'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">IP地址</h4>
                  <p className="mt-1">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">請求ID</h4>
                  <p className="mt-1 text-xs font-mono">{selectedLog.requestId || '-'}</p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">User Agent</h4>
                  <p className="mt-1 text-sm font-mono break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">錯誤訊息</h4>
                  <p className="mt-1 text-sm text-destructive">{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">詳細資訊</h4>
                  <pre className="mt-1 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
