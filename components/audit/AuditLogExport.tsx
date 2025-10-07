/**
 * 審計日誌導出組件
 *
 * 支持CSV和JSON格式導出審計日誌
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 Phase 3 - 審計日誌UI組件
 */

'use client';

import React, { useState } from 'react';
import { AuditLogFiltersValue } from './AuditLogFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, FileJson } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AuditLogExportProps {
  filters?: AuditLogFiltersValue;
}

/**
 * 審計日誌導出組件
 */
export function AuditLogExport({ filters }: AuditLogExportProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audit-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          format,
          filters: filters || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '導出失敗');
      }

      // 獲取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;

      // 下載文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : '導出失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          導出審計日誌
        </CardTitle>
        <CardDescription>
          將當前篩選的審計日誌導出為CSV或JSON格式
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 格式選擇 */}
          <div className="space-y-2">
            <Label htmlFor="exportFormat">導出格式</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as 'csv' | 'json')}
            >
              <SelectTrigger id="exportFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV (Excel兼容)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON (結構化數據)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 導出說明 */}
          <div className="rounded-md bg-muted p-4 text-sm">
            <h4 className="font-medium mb-2">導出說明</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>最多導出10,000條記錄</li>
              <li>導出文件包含所有篩選條件下的日誌</li>
              <li>CSV格式適合在Excel中查看和分析</li>
              <li>JSON格式適合程式化處理和數據分析</li>
            </ul>
          </div>

          {/* 錯誤提示 */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 導出按鈕 */}
          <Button
            className="w-full"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                導出中...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                導出 {format.toUpperCase()} 文件
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
