/**
 * 審計日誌篩選組件
 *
 * 提供高級篩選功能：用戶、操作、資源、嚴重級別、時間範圍等
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 Phase 3 - 審計日誌UI組件
 */

'use client';

import React, { useState } from 'react';
import { AuditAction, AuditResource, AuditSeverity } from '@/lib/security/audit-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

export interface AuditLogFiltersValue {
  userId?: number;
  action?: AuditAction;
  resource?: AuditResource;
  severity?: AuditSeverity;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogFiltersValue;
  onChange: (filters: AuditLogFiltersValue) => void;
  onApply: () => void;
  onReset: () => void;
}

/**
 * 審計日誌篩選組件
 */
export function AuditLogFilters({
  filters,
  onChange,
  onApply,
  onReset,
}: AuditLogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFieldChange = (field: keyof AuditLogFiltersValue, value: any) => {
    onChange({
      ...filters,
      [field]: value === '' ? undefined : value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            篩選條件
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '收起' : '展開'}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 用戶ID */}
            <div className="space-y-2">
              <Label htmlFor="userId">用戶ID</Label>
              <Input
                id="userId"
                type="number"
                placeholder="輸入用戶ID"
                value={filters.userId || ''}
                onChange={(e) => handleFieldChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* 操作類型 */}
            <div className="space-y-2">
              <Label htmlFor="action">操作類型</Label>
              <Select
                value={filters.action || ''}
                onValueChange={(value) => handleFieldChange('action', value as AuditAction)}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="選擇操作類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value={AuditAction.LOGIN}>登入</SelectItem>
                  <SelectItem value={AuditAction.LOGOUT}>登出</SelectItem>
                  <SelectItem value={AuditAction.LOGIN_FAILED}>登入失敗</SelectItem>
                  <SelectItem value={AuditAction.CREATE}>創建</SelectItem>
                  <SelectItem value={AuditAction.READ}>讀取</SelectItem>
                  <SelectItem value={AuditAction.UPDATE}>更新</SelectItem>
                  <SelectItem value={AuditAction.DELETE}>刪除</SelectItem>
                  <SelectItem value={AuditAction.PERMISSION_GRANT}>權限授予</SelectItem>
                  <SelectItem value={AuditAction.PERMISSION_REVOKE}>權限撤銷</SelectItem>
                  <SelectItem value={AuditAction.ACCESS_DENIED}>訪問拒絕</SelectItem>
                  <SelectItem value={AuditAction.EXPORT}>導出</SelectItem>
                  <SelectItem value={AuditAction.CONFIG_CHANGE}>配置變更</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 資源類型 */}
            <div className="space-y-2">
              <Label htmlFor="resource">資源類型</Label>
              <Select
                value={filters.resource || ''}
                onValueChange={(value) => handleFieldChange('resource', value as AuditResource)}
              >
                <SelectTrigger id="resource">
                  <SelectValue placeholder="選擇資源類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value={AuditResource.USER}>用戶</SelectItem>
                  <SelectItem value={AuditResource.CUSTOMER}>客戶</SelectItem>
                  <SelectItem value={AuditResource.SALES_OPPORTUNITY}>銷售機會</SelectItem>
                  <SelectItem value={AuditResource.PROPOSAL}>提案</SelectItem>
                  <SelectItem value={AuditResource.KNOWLEDGE_BASE}>知識庫</SelectItem>
                  <SelectItem value={AuditResource.SYSTEM_CONFIG}>系統配置</SelectItem>
                  <SelectItem value={AuditResource.API_KEY}>API金鑰</SelectItem>
                  <SelectItem value={AuditResource.AUDIT_LOG}>審計日誌</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 嚴重級別 */}
            <div className="space-y-2">
              <Label htmlFor="severity">嚴重級別</Label>
              <Select
                value={filters.severity || ''}
                onValueChange={(value) => handleFieldChange('severity', value as AuditSeverity)}
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="選擇嚴重級別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value={AuditSeverity.INFO}>INFO</SelectItem>
                  <SelectItem value={AuditSeverity.WARNING}>WARNING</SelectItem>
                  <SelectItem value={AuditSeverity.ERROR}>ERROR</SelectItem>
                  <SelectItem value={AuditSeverity.CRITICAL}>CRITICAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 成功狀態 */}
            <div className="space-y-2">
              <Label htmlFor="success">成功狀態</Label>
              <Select
                value={filters.success !== undefined ? String(filters.success) : ''}
                onValueChange={(value) => handleFieldChange('success', value === '' ? undefined : value === 'true')}
              >
                <SelectTrigger id="success">
                  <SelectValue placeholder="選擇成功狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="true">成功</SelectItem>
                  <SelectItem value="false">失敗</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IP地址 */}
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP地址</Label>
              <Input
                id="ipAddress"
                type="text"
                placeholder="輸入IP地址"
                value={filters.ipAddress || ''}
                onChange={(e) => handleFieldChange('ipAddress', e.target.value)}
              />
            </div>

            {/* 開始日期 */}
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日期</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={filters.startDate || ''}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
              />
            </div>

            {/* 結束日期 */}
            <div className="space-y-2">
              <Label htmlFor="endDate">結束日期</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={filters.endDate || ''}
                onChange={(e) => handleFieldChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="mt-6 flex items-center justify-end gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
              >
                <X className="mr-2 h-4 w-4" />
                清除篩選
              </Button>
            )}
            <Button
              size="sm"
              onClick={onApply}
            >
              <Filter className="mr-2 h-4 w-4" />
              應用篩選
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
