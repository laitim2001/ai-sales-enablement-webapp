/**
 * @fileoverview 版本歷史組件功能：- 顯示提案的所有版本快照- 版本列表與時間線- 支持版本比較和回滾- 顯示版本標籤和創建者作者：Claude Code日期：2025-10-01
 * @module components/workflow/version/VersionHistory
 * @description
 * 版本歷史組件功能：- 顯示提案的所有版本快照- 版本列表與時間線- 支持版本比較和回滾- 顯示版本標籤和創建者作者：Claude Code日期：2025-10-01
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  Tag,
  FileText,
  RotateCcw,
  GitCompare,
  Download,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface VersionHistoryProps {
  versions: ProposalVersion[];
  currentVersion?: number;
  onCompare?: (versionA: number, versionB: number) => void;
  onRestore?: (versionId: number) => void;
  onDownload?: (versionId: number) => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  onCompare,
  onRestore,
  onDownload,
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  // 按版本號倒序排列
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleVersionSelect = (versionId: number) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId));
    } else {
      if (selectedVersions.length >= 2) {
        // 最多選擇兩個版本進行比較
        setSelectedVersions([selectedVersions[1], versionId]);
      } else {
        setSelectedVersions([...selectedVersions, versionId]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(selectedVersions[0], selectedVersions[1]);
    }
  };

  return (
    <div className="space-y-4">
      {/* 操作欄 */}
      {onCompare && (
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
          <div className="text-sm text-gray-600">
            {selectedVersions.length === 0 && '選擇兩個版本進行比較'}
            {selectedVersions.length === 1 && '再選擇一個版本進行比較'}
            {selectedVersions.length === 2 && '已選擇兩個版本'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompare}
            disabled={selectedVersions.length !== 2}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            比較版本
          </Button>
        </div>
      )}

      {/* 版本列表 */}
      <div className="space-y-3">
        {sortedVersions.map((version) => {
          const isCurrent = version.version === currentVersion;
          const isSelected = selectedVersions.includes(version.id);

          return (
            <Card
              key={version.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500'
                  : 'hover:border-gray-400'
              } ${isCurrent ? 'border-green-500 bg-green-50' : ''}`}
              onClick={() => handleVersionSelect(version.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        版本 {version.version}
                        {isCurrent && (
                          <Badge variant="default" className="ml-2">
                            當前版本
                          </Badge>
                        )}
                        {version.label && (
                          <Badge variant="outline" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {version.label}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </span>
                        {version.created_by && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.created_by.first_name}{' '}
                            {version.created_by.last_name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-2">
                    {onDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(version.id);
                        }}
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onRestore && !isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(version.id);
                        }}
                        className="gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        回滾
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {version.description && (
                <CardContent className="pb-3 pt-0">
                  <p className="text-sm text-gray-700">
                    {version.description}
                  </p>
                </CardContent>
              )}

              {/* 版本詳情 */}
              <CardContent className="border-t bg-gray-50 pt-3 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>
                    創建於{' '}
                    {format(new Date(version.created_at), 'PPpp', {
                      locale: zhTW,
                    })}
                  </span>
                  {version.metadata?.size && (
                    <span>大小: {version.metadata.size} bytes</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 空狀態 */}
      {sortedVersions.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-500">尚無版本記錄</p>
        </div>
      )}
    </div>
  );
}

/**
 * 精簡版本歷史（用於側邊欄）
 */
export function CompactVersionHistory({
  versions,
  currentVersion,
  maxItems = 5,
  onVersionClick,
}: VersionHistoryProps & {
  maxItems?: number;
  onVersionClick?: (versionId: number) => void;
}) {
  const recentVersions = [...versions]
    .sort((a, b) => b.version - a.version)
    .slice(0, maxItems);

  return (
    <div className="space-y-2">
      {recentVersions.map((version) => {
        const isCurrent = version.version === currentVersion;

        return (
          <div
            key={version.id}
            className={`flex items-center justify-between rounded-md p-2 text-sm transition-colors ${
              isCurrent
                ? 'bg-green-100 text-green-800'
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
            onClick={() => onVersionClick?.(version.id)}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">v{version.version}</span>
              {version.label && (
                <Badge variant="outline" className="text-xs">
                  {version.label}
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(version.created_at), {
                locale: zhTW,
              })}
            </span>
          </div>
        );
      })}

      {versions.length > maxItems && (
        <div className="text-center text-xs text-gray-400">
          還有 {versions.length - maxItems} 個版本...
        </div>
      )}
    </div>
  );
}
