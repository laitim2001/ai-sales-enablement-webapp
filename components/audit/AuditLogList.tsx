/**
 * 審計日誌列表組件
 *
 * 顯示審計日誌的表格列表，支持分頁和詳情查看
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 Phase 3 - 審計日誌UI組件
 */

'use client';

import React from 'react';
import { AuditLogEntry, AuditAction, AuditResource, AuditSeverity } from '@/lib/security/audit-log';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface AuditLogListProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
  };
  onPageChange?: (offset: number) => void;
  onViewDetails?: (log: AuditLogEntry) => void;
}

/**
 * 審計日誌列表組件
 */
export function AuditLogList({
  logs,
  loading = false,
  pagination,
  onPageChange,
  onViewDetails,
}: AuditLogListProps) {
  // 獲取嚴重級別Badge變體
  const getSeverityVariant = (severity: AuditSeverity): 'info' | 'warning' | 'error' | 'default' => {
    switch (severity) {
      case AuditSeverity.INFO:
        return 'info';
      case AuditSeverity.WARNING:
        return 'warning';
      case AuditSeverity.ERROR:
      case AuditSeverity.CRITICAL:
        return 'error';
      default:
        return 'default';
    }
  };

  // 獲取成功狀態圖標
  const getSuccessIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  // 格式化操作類型
  const formatAction = (action: AuditAction): string => {
    const actionMap: Record<AuditAction, string> = {
      [AuditAction.LOGIN]: '登入',
      [AuditAction.LOGOUT]: '登出',
      [AuditAction.LOGIN_FAILED]: '登入失敗',
      [AuditAction.PASSWORD_CHANGE]: '密碼變更',
      [AuditAction.PASSWORD_RESET]: '密碼重置',
      [AuditAction.TOKEN_REFRESH]: 'Token刷新',
      [AuditAction.CREATE]: '創建',
      [AuditAction.READ]: '讀取',
      [AuditAction.UPDATE]: '更新',
      [AuditAction.DELETE]: '刪除',
      [AuditAction.BULK_DELETE]: '批量刪除',
      [AuditAction.PERMISSION_GRANT]: '權限授予',
      [AuditAction.PERMISSION_REVOKE]: '權限撤銷',
      [AuditAction.ROLE_CHANGE]: '角色變更',
      [AuditAction.ACCESS_DENIED]: '訪問拒絕',
      [AuditAction.EXPORT]: '導出',
      [AuditAction.IMPORT]: '導入',
      [AuditAction.BACKUP]: '備份',
      [AuditAction.RESTORE]: '還原',
      [AuditAction.CONFIG_CHANGE]: '配置變更',
      [AuditAction.SYSTEM_START]: '系統啟動',
      [AuditAction.SYSTEM_STOP]: '系統停止',
      [AuditAction.SENSITIVE_DATA_ACCESS]: '敏感數據訪問',
      [AuditAction.ENCRYPTION_KEY_ROTATION]: '加密金鑰輪換',
      [AuditAction.AUDIT_LOG_ACCESS]: '審計日誌訪問',
    };
    return actionMap[action] || action;
  };

  // 格式化資源類型
  const formatResource = (resource: AuditResource): string => {
    const resourceMap: Record<AuditResource, string> = {
      [AuditResource.USER]: '用戶',
      [AuditResource.AUTH]: '認證',
      [AuditResource.SESSION]: '會話',
      [AuditResource.CUSTOMER]: '客戶',
      [AuditResource.CUSTOMER_CONTACT]: '客戶聯絡人',
      [AuditResource.SALES_OPPORTUNITY]: '銷售機會',
      [AuditResource.PROPOSAL]: '提案',
      [AuditResource.PROPOSAL_TEMPLATE]: '提案模板',
      [AuditResource.KNOWLEDGE_BASE]: '知識庫',
      [AuditResource.KNOWLEDGE_CHUNK]: '知識片段',
      [AuditResource.KNOWLEDGE_TAG]: '知識標籤',
      [AuditResource.DOCUMENT]: '文件',
      [AuditResource.CAMPAIGN]: '活動',
      [AuditResource.SYSTEM_CONFIG]: '系統配置',
      [AuditResource.API_KEY]: 'API金鑰',
      [AuditResource.WEBHOOK]: 'Webhook',
      [AuditResource.INTEGRATION]: '整合',
      [AuditResource.BACKUP]: '備份',
      [AuditResource.ANALYTICS]: '分析',
      [AuditResource.REPORT]: '報告',
      [AuditResource.AUDIT_LOG]: '審計日誌',
    };
    return resourceMap[resource] || resource;
  };

  // 計算分頁信息
  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1;
  const totalPages = pagination && pagination.total
    ? Math.ceil(pagination.total / pagination.limit)
    : 1;

  const handlePrevPage = () => {
    if (pagination && pagination.offset > 0 && onPageChange) {
      onPageChange(Math.max(0, pagination.offset - pagination.limit));
    }
  };

  const handleNextPage = () => {
    if (pagination && onPageChange) {
      onPageChange(pagination.offset + pagination.limit);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>審計日誌</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">載入中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>審計日誌</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Info className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">無審計日誌</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                當前篩選條件下沒有找到審計日誌記錄
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>審計日誌</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">狀態</th>
                <th className="px-4 py-3 text-left text-sm font-medium">時間</th>
                <th className="px-4 py-3 text-left text-sm font-medium">用戶</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                <th className="px-4 py-3 text-left text-sm font-medium">資源</th>
                <th className="px-4 py-3 text-left text-sm font-medium">嚴重級別</th>
                <th className="px-4 py-3 text-left text-sm font-medium">IP地址</th>
                <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    {getSuccessIcon(log.success)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('zh-TW')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{log.userName || `用戶 ${log.userId}`}</span>
                      {log.userEmail && (
                        <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{formatAction(log.action)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span>{formatResource(log.resource)}</span>
                      {log.resourceId && (
                        <span className="text-xs text-muted-foreground">ID: {log.resourceId}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={getSeverityVariant(log.severity)}>
                      {log.severity.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">查看詳情</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分頁控制 */}
        {pagination && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              顯示 {pagination.offset + 1} - {Math.min(pagination.offset + logs.length, pagination.total || 0)}
              {pagination.total && ` / ${pagination.total}`} 條記錄
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                上一頁
              </Button>
              <div className="text-sm">
                第 {currentPage} / {totalPages} 頁
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.total || pagination.offset + pagination.limit >= pagination.total}
              >
                下一頁
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
