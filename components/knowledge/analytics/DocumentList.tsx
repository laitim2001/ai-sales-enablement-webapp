/**
 * @fileoverview ================================================================AI銷售賦能平台 - 文檔列表組件================================================================【組件功能】顯示熱門文檔排行榜，包括查看次數、編輯次數等統計信息。【主要特性】• 排行榜顯示 - 數字排名標識• 多維度統計 - 查看/編輯/下載次數• 文檔類型圖標 - 視覺化文件類型• 點擊跳轉 - 快速訪問文檔• 響應式設計 - 適配不同螢幕尺寸@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 * @module components/knowledge/analytics/DocumentList
 * @description
 * ================================================================AI銷售賦能平台 - 文檔列表組件================================================================【組件功能】顯示熱門文檔排行榜，包括查看次數、編輯次數等統計信息。【主要特性】• 排行榜顯示 - 數字排名標識• 多維度統計 - 查看/編輯/下載次數• 文檔類型圖標 - 視覺化文件類型• 點擊跳轉 - 快速訪問文檔• 響應式設計 - 適配不同螢幕尺寸@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import Link from 'next/link';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface DocumentStats {
  documentId: number;
  title: string;
  category: string;
  mimeType: string | null;
  viewCount: number;
  editCount: number;
  downloadCount: number;
  fileSize: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentListProps {
  documents: DocumentStats[];
  title?: string;
  showRank?: boolean;
  className?: string;
}

export function DocumentList({
  documents,
  title,
  showRank = true,
  className = ''
}: DocumentListProps) {
  // 格式化文件大小
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 獲取文件類型圖標顏色
  const getMimeTypeColor = (mimeType: string | null): string => {
    if (!mimeType) return 'text-gray-400';
    if (mimeType.includes('pdf')) return 'text-red-500';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-500';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'text-green-500';
    if (mimeType.includes('image')) return 'text-purple-500';
    return 'text-gray-400';
  };

  // 獲取排名徽章顏色
  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <div className="space-y-3">
        {documents.map((doc, index) => (
          <Link
            key={doc.documentId}
            href={`/dashboard/knowledge/${doc.documentId}`}
            className="block group"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              {/* 排名 */}
              {showRank && (
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getRankBadgeColor(index + 1)}`}
                >
                  {index + 1}
                </div>
              )}

              {/* 文檔圖標 */}
              <div className="flex-shrink-0">
                <DocumentTextIcon
                  className={`w-6 h-6 ${getMimeTypeColor(doc.mimeType)}`}
                />
              </div>

              {/* 文檔信息 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                  {doc.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {doc.category} • {formatFileSize(doc.fileSize)}
                </p>

                {/* 統計信息 */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                    <span>{doc.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <PencilIcon className="w-4 h-4" />
                    <span>{doc.editCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>{doc.downloadCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暫無數據
        </div>
      )}
    </div>
  );
}
