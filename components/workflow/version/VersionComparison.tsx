/**
 * @fileoverview 版本比較組件功能：- 並排顯示兩個版本的差異- 高亮顯示變更內容- 支持文字和結構化數據比較- 統計變更摘要作者：Claude Code日期：2025-10-01
 * @module components/workflow/version/VersionComparison
 * @description
 * 版本比較組件功能：- 並排顯示兩個版本的差異- 高亮顯示變更內容- 支持文字和結構化數據比較- 統計變更摘要作者：Claude Code日期：2025-10-01
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Plus,
  Minus,
  FileText,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

interface VersionDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

interface VersionComparisonProps {
  versionA: {
    version: number;
    label?: string;
    snapshot_data: any;
    created_at: Date;
  };
  versionB: {
    version: number;
    label?: string;
    snapshot_data: any;
    created_at: Date;
  };
  diffs: VersionDiff[];
}

export function VersionComparison({
  versionA,
  versionB,
  diffs,
}: VersionComparisonProps) {
  // 統計變更
  const changeStats = {
    added: diffs.filter((d) => d.changeType === 'added').length,
    removed: diffs.filter((d) => d.changeType === 'removed').length,
    modified: diffs.filter((d) => d.changeType === 'modified').length,
  };

  const totalChanges = changeStats.added + changeStats.removed + changeStats.modified;

  // 渲染值
  const renderValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">無</span>;
    }
    if (typeof value === 'object') {
      return (
        <pre className="rounded bg-gray-100 p-2 text-xs overflow-auto max-h-40">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return <span>{String(value)}</span>;
  };

  // 獲取變更類型樣式
  const getChangeStyle = (changeType: VersionDiff['changeType']) => {
    switch (changeType) {
      case 'added':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: Plus,
          label: '新增',
        };
      case 'removed':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: Minus,
          label: '刪除',
        };
      case 'modified':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: ArrowRight,
          label: '修改',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 版本對比頭部 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              版本 {versionA.version}
              {versionA.label && (
                <Badge variant="outline" className="ml-2">
                  {versionA.label}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {new Date(versionA.created_at).toLocaleString('zh-TW')}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              版本 {versionB.version}
              {versionB.label && (
                <Badge variant="outline" className="ml-2">
                  {versionB.label}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {new Date(versionB.created_at).toLocaleString('zh-TW')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 變更統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            變更摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalChanges}</div>
              <div className="text-xs text-gray-500">總變更數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {changeStats.added}
              </div>
              <div className="text-xs text-gray-500">新增</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {changeStats.modified}
              </div>
              <div className="text-xs text-gray-500">修改</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {changeStats.removed}
              </div>
              <div className="text-xs text-gray-500">刪除</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細差異 */}
      <Tabs defaultValue="changes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="changes">
            <FileText className="mr-2 h-4 w-4" />
            變更列表 ({totalChanges})
          </TabsTrigger>
          <TabsTrigger value="side-by-side">
            <ArrowRight className="mr-2 h-4 w-4" />
            並排比較
          </TabsTrigger>
        </TabsList>

        {/* 變更列表視圖 */}
        <TabsContent value="changes" className="space-y-3">
          {diffs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-500">
                  這兩個版本之間沒有差異
                </p>
              </CardContent>
            </Card>
          ) : (
            diffs.map((diff, index) => {
              const style = getChangeStyle(diff.changeType);
              const Icon = style.icon;

              return (
                <Card
                  key={index}
                  className={`border ${style.border} ${style.bg}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {diff.field}
                      </CardTitle>
                      <Badge variant="outline" className={`gap-1 ${style.text}`}>
                        <Icon className="h-3 w-3" />
                        {style.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {diff.changeType !== 'added' && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-gray-600">
                          舊值:
                        </div>
                        <div className="text-sm">{renderValue(diff.oldValue)}</div>
                      </div>
                    )}
                    {diff.changeType !== 'removed' && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-gray-600">
                          新值:
                        </div>
                        <div className="text-sm">{renderValue(diff.newValue)}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* 並排比較視圖 */}
        <TabsContent value="side-by-side">
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x">
                {/* 左側：版本 A */}
                <div className="space-y-4 p-4">
                  <div className="text-sm font-medium text-gray-700">
                    版本 {versionA.version}
                  </div>
                  {diffs.map((diff, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-xs font-medium text-gray-500">
                        {diff.field}
                      </div>
                      <div className="rounded bg-gray-50 p-2 text-sm">
                        {renderValue(diff.oldValue)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 右側：版本 B */}
                <div className="space-y-4 p-4">
                  <div className="text-sm font-medium text-gray-700">
                    版本 {versionB.version}
                  </div>
                  {diffs.map((diff, index) => {
                    const style = getChangeStyle(diff.changeType);
                    return (
                      <div key={index} className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">
                          {diff.field}
                        </div>
                        <div
                          className={`rounded p-2 text-sm ${style.bg} ${style.border} border`}
                        >
                          {renderValue(diff.newValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
