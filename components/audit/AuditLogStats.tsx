/**
 * 審計日誌統計儀表板組件
 *
 * 顯示審計日誌的各種統計數據和可視化圖表
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 8 Phase 3 - 審計日誌UI組件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AuditLogStats as AuditLogStatsType } from '@/lib/security/audit-log';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AuditLogStatsProps {
  filters?: Record<string, any>;
  autoRefresh?: boolean;
  refreshInterval?: number; // 毫秒
}

/**
 * 審計日誌統計儀表板組件
 */
export function AuditLogStats({
  filters,
  autoRefresh = false,
  refreshInterval = 60000, // 默認60秒
}: AuditLogStatsProps) {
  const [stats, setStats] = useState<AuditLogStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/audit-logs/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取統計數據失敗');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取統計數據失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [filters, autoRefresh, refreshInterval]);

  if (loading && !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  // 計算頂級操作（前5個）
  const topActions = stats.topActions.slice(0, 5);

  // 計算頂級用戶（前5個）
  const topUsers = stats.topUsers.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* 總覽卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 總日誌數 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總日誌數</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有審計記錄總數
            </p>
          </CardContent>
        </Card>

        {/* 成功率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              操作成功的比例
            </p>
          </CardContent>
        </Card>

        {/* INFO級別日誌 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">INFO級別</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.logsBySeverity.info || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              一般信息日誌
            </p>
          </CardContent>
        </Card>

        {/* 警告/錯誤級別 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">警告/錯誤</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {((stats.logsBySeverity.warning || 0) +
                (stats.logsBySeverity.error || 0) +
                (stats.logsBySeverity.critical || 0)
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              需要關注的日誌
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 詳細統計 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 頂級操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              最常見操作
            </CardTitle>
            <CardDescription>操作類型統計（前5名）</CardDescription>
          </CardHeader>
          <CardContent>
            {topActions.length > 0 ? (
              <div className="space-y-3">
                {topActions.map((item, index) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Badge variant="outline">{item.action}</Badge>
                    </div>
                    <span className="text-sm font-bold">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                無操作數據
              </p>
            )}
          </CardContent>
        </Card>

        {/* 頂級用戶 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              最活躍用戶
            </CardTitle>
            <CardDescription>用戶活動統計（前5名）</CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length > 0 ? (
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{user.userName}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {user.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                無用戶數據
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 嚴重級別分布 */}
      <Card>
        <CardHeader>
          <CardTitle>嚴重級別分布</CardTitle>
          <CardDescription>按嚴重級別統計日誌數量</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground mb-2">INFO</span>
              <div className="text-2xl font-bold text-blue-600">
                {(stats.logsBySeverity.info || 0).toLocaleString()}
              </div>
              <div className="mt-2 h-2 w-full bg-blue-100 rounded-full">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${stats.totalLogs > 0 ? ((stats.logsBySeverity.info || 0) / stats.totalLogs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground mb-2">WARNING</span>
              <div className="text-2xl font-bold text-yellow-600">
                {(stats.logsBySeverity.warning || 0).toLocaleString()}
              </div>
              <div className="mt-2 h-2 w-full bg-yellow-100 rounded-full">
                <div
                  className="h-full bg-yellow-600 rounded-full"
                  style={{
                    width: `${stats.totalLogs > 0 ? ((stats.logsBySeverity.warning || 0) / stats.totalLogs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground mb-2">ERROR</span>
              <div className="text-2xl font-bold text-red-600">
                {(stats.logsBySeverity.error || 0).toLocaleString()}
              </div>
              <div className="mt-2 h-2 w-full bg-red-100 rounded-full">
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{
                    width: `${stats.totalLogs > 0 ? ((stats.logsBySeverity.error || 0) / stats.totalLogs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground mb-2">CRITICAL</span>
              <div className="text-2xl font-bold text-purple-600">
                {(stats.logsBySeverity.critical || 0).toLocaleString()}
              </div>
              <div className="mt-2 h-2 w-full bg-purple-100 rounded-full">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${stats.totalLogs > 0 ? ((stats.logsBySeverity.critical || 0) / stats.totalLogs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
