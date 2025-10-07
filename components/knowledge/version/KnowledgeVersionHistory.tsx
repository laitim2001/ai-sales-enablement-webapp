/**
 * @fileoverview 知識庫版本歷史組件功能：- 顯示知識庫文檔的所有版本快照- 版本列表與時間線- 支持版本比較和回滾- 顯示版本標籤和創建者- 支持版本刪除（非當前版本）作者：Claude Code日期：2025-10-03Sprint: 6 Week 12
 * @module components/knowledge/version/KnowledgeVersionHistory
 * @description
 * 知識庫版本歷史組件功能：- 顯示知識庫文檔的所有版本快照- 版本列表與時間線- 支持版本比較和回滾- 顯示版本標籤和創建者- 支持版本刪除（非當前版本）作者：Claude Code日期：2025-10-03Sprint: 6 Week 12
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
  Trash2,
  AlertCircle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface KnowledgeVersion {
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
  parent_version?: number | null;
  is_major: boolean;
  tags: string[];
  created_at: Date;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface KnowledgeVersionHistoryProps {
  knowledgeBaseId: number;
  versions: KnowledgeVersion[];
  currentVersion?: number;
  onCompare?: (versionId1: string, versionId2: string) => void;
  onRestore?: (versionId: string) => void;
  onDownload?: (versionId: string) => void;
  onDelete?: (versionId: string) => void;
}

export function KnowledgeVersionHistory({
  knowledgeBaseId,
  versions,
  currentVersion,
  onCompare,
  onRestore,
  onDownload,
  onDelete,
}: KnowledgeVersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);

  // 按版本號倒序排列
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleVersionSelect = (versionId: string) => {
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

  const handleDeleteConfirm = () => {
    if (deleteVersionId && onDelete) {
      onDelete(deleteVersionId);
      setDeleteVersionId(null);
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
                        {version.is_major && (
                          <Badge variant="secondary" className="ml-2">
                            主要版本
                          </Badge>
                        )}
                        {version.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm font-medium">
                        {version.title}
                      </CardDescription>
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
                        title="下載版本"
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
                    {onDelete && !isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteVersionId(version.id);
                        }}
                        className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="刪除版本"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {version.change_summary && (
                <CardContent className="pb-3 pt-0">
                  <p className="text-sm text-gray-700">
                    {version.change_summary}
                  </p>
                </CardContent>
              )}

              {/* 版本詳情 */}
              <CardContent className="border-t bg-gray-50 pt-3 text-xs text-gray-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">創建時間：</span>
                    {format(new Date(version.created_at), 'PPpp', {
                      locale: zhTW,
                    })}
                  </div>
                  {version.parent_version && (
                    <div>
                      <span className="font-medium">父版本：</span>
                      版本 {version.parent_version}
                    </div>
                  )}
                  {version.file_path && (
                    <>
                      <div>
                        <span className="font-medium">文件：</span>
                        {version.file_path.split('/').pop()}
                      </div>
                      <div>
                        <span className="font-medium">大小：</span>
                        {formatFileSize(version.file_size)}
                      </div>
                    </>
                  )}
                  {version.mime_type && (
                    <div>
                      <span className="font-medium">類型：</span>
                      {version.mime_type}
                    </div>
                  )}
                  {version.changed_fields && Object.keys(version.changed_fields).length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium">變更欄位：</span>
                      {Object.keys(version.changed_fields).join(', ')}
                    </div>
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

      {/* 刪除確認對話框 */}
      <AlertDialog
        open={deleteVersionId !== null}
        onOpenChange={(open: boolean) => !open && setDeleteVersionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              確認刪除版本
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作將永久刪除此版本記錄，無法恢復。確定要繼續嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * 精簡版本歷史（用於側邊欄）
 */
export function CompactKnowledgeVersionHistory({
  versions,
  currentVersion,
  maxItems = 5,
  onVersionClick,
}: KnowledgeVersionHistoryProps & {
  maxItems?: number;
  onVersionClick?: (versionId: string) => void;
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
              {version.is_major && (
                <Badge variant="secondary" className="text-xs">
                  主要
                </Badge>
              )}
              {version.tags.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {version.tags[0]}
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
