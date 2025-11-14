/**
 * @fileoverview 會議準備包列表組件
📋 功能說明：
- 展示準備包列表（支持網格/列表視圖）
- 狀態篩選（草稿/就緒/使用中/已完成/已歸檔）
- 類型篩選（銷售會議/客戶簡報等）
- 排序功能（創建時間/修改時間/閱讀時間）
- 搜索功能（標題、描述、客戶名稱）
- 空狀態處理
- 載入狀態
📊 使用場景：
- 準備包管理頁面
- 會議詳情頁關聯準備包列表
- 用戶儀表板準備包概覽
作者：Claude Cod...
 * @module components/meeting-prep/PrepPackageList
 *
 * 會議準備包列表組件
 * 📋 功能說明：
 * - 展示準備包列表（支持網格/列表視圖）
 * - 狀態篩選（草稿/就緒/使用中/已完成/已歸檔）
 * - 類型篩選（銷售會議/客戶簡報等）
 * - 排序功能（創建時間/修改時間/閱讀時間）
 * - 搜索功能（標題、描述、客戶名稱）
 * - 空狀態處理
 * - 載入狀態
 * 📊 使用場景：
 * - 準備包管理頁面
 * - 會議詳情頁關聯準備包列表
 * - 用戶儀表板準備包概覽
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Grid,
  List,
  Plus,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import {
  MeetingPrepPackage,
  PrepPackageType,
  PrepPackageStatus
} from '@/lib/meeting/meeting-prep-package';
import { PrepPackageCard } from './PrepPackageCard';

/**
 * 排序選項
 */
type SortOption = 'created-desc' | 'created-asc' | 'updated-desc' | 'updated-asc' | 'read-time-asc' | 'read-time-desc';

/**
 * 視圖模式
 */
type ViewMode = 'grid' | 'list';

/**
 * PrepPackageList 組件屬性
 */
export interface PrepPackageListProps {
  /** 準備包列表 */
  packages: MeetingPrepPackage[];
  /** 是否載入中 */
  loading?: boolean;
  /** 查看詳情回調 */
  onView?: (id: string) => void;
  /** 編輯回調 */
  onEdit?: (id: string) => void;
  /** 分享回調 */
  onShare?: (id: string) => void;
  /** 刪除回調 */
  onDelete?: (id: string) => void;
  /** 創建新準備包回調 */
  onCreate?: () => void;
  /** 初始視圖模式 */
  defaultViewMode?: ViewMode;
  /** 初始狀態篩選 */
  defaultStatusFilter?: PrepPackageStatus | 'ALL';
  /** 初始類型篩選 */
  defaultTypeFilter?: PrepPackageType | 'ALL';
  /** 自定義類名 */
  className?: string;
}

/**
 * 會議準備包列表組件
 *
 * @example
 * ```tsx
 * <PrepPackageList
 *   packages={prepPackages}
 *   loading={isLoading}
 *   onView={(id) => router.push(`/prep-packages/${id}`)}
 *   onEdit={(id) => setEditingId(id)}
 *   onCreate={() => setShowWizard(true)}
 * />
 * ```
 */
export function PrepPackageList({
  packages,
  loading = false,
  onView,
  onEdit,
  onShare,
  onDelete,
  onCreate,
  defaultViewMode = 'grid',
  defaultStatusFilter = 'ALL',
  defaultTypeFilter = 'ALL',
  className = ''
}: PrepPackageListProps) {

  // 視圖模式
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // 搜索關鍵字
  const [searchQuery, setSearchQuery] = useState('');

  // 狀態篩選
  const [statusFilter, setStatusFilter] = useState<PrepPackageStatus | 'ALL'>(defaultStatusFilter);

  // 類型篩選
  const [typeFilter, setTypeFilter] = useState<PrepPackageType | 'ALL'>(defaultTypeFilter);

  // 排序選項
  const [sortOption, setSortOption] = useState<SortOption>('created-desc');

  // 篩選和排序邏輯
  const filteredAndSortedPackages = useMemo(() => {
    let result = [...packages];

    // 搜索過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pkg =>
        pkg.title.toLowerCase().includes(query) ||
        pkg.description?.toLowerCase().includes(query) ||
        pkg.metadata.customerName?.toLowerCase().includes(query)
      );
    }

    // 狀態過濾
    if (statusFilter !== 'ALL') {
      result = result.filter(pkg => pkg.status === statusFilter);
    }

    // 類型過濾
    if (typeFilter !== 'ALL') {
      result = result.filter(pkg => pkg.type === typeFilter);
    }

    // 排序
    result.sort((a, b) => {
      switch (sortOption) {
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'updated-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updated-asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'read-time-asc':
          return (a.metadata.totalEstimatedReadTime || 0) - (b.metadata.totalEstimatedReadTime || 0);
        case 'read-time-desc':
          return (b.metadata.totalEstimatedReadTime || 0) - (a.metadata.totalEstimatedReadTime || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [packages, searchQuery, statusFilter, typeFilter, sortOption]);

  // 統計數據
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: packages.length };
    packages.forEach(pkg => {
      counts[pkg.status] = (counts[pkg.status] || 0) + 1;
    });
    return counts;
  }, [packages]);

  // 載入骨架屏
  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {/* 工具欄骨架屏 */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          {/* 卡片骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 空狀態
  if (packages.length === 0 && !searchQuery && statusFilter === 'ALL' && typeFilter === 'ALL') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="bg-muted rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
            <List className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">還沒有準備包</h3>
            <p className="text-muted-foreground mt-1">
              創建您的第一個會議準備包，開始高效準備會議
            </p>
          </div>
          {onCreate && (
            <Button onClick={onCreate} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              創建準備包
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 搜索無結果
  if (filteredAndSortedPackages.length === 0) {
    return (
      <div className={className}>
        {/* 工具欄 */}
        <ToolBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortChange={setSortOption}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          statusCounts={statusCounts}
          onCreate={onCreate}
        />
        {/* 無結果提示 */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Search className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">沒有找到符合條件的準備包</h3>
            <p className="text-muted-foreground">
              嘗試調整搜索條件或篩選器
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
            }}>
              清除所有篩選
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 工具欄 */}
      <ToolBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortOption={sortOption}
        onSortChange={setSortOption}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusCounts={statusCounts}
        onCreate={onCreate}
      />

      {/* 準備包列表 */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4'
      }>
        {filteredAndSortedPackages.map(pkg => (
          <PrepPackageCard
            key={pkg.id}
            package={pkg}
            onView={onView}
            onEdit={onEdit}
            onShare={onShare}
            onDelete={onDelete}
            showActions={true}
          />
        ))}
      </div>

      {/* 結果統計 */}
      <div className="text-center text-sm text-muted-foreground">
        顯示 {filteredAndSortedPackages.length} 個準備包
        {searchQuery && ` (搜索: "${searchQuery}")`}
      </div>
    </div>
  );
}

/**
 * 工具欄組件
 */
interface ToolBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  statusFilter: PrepPackageStatus | 'ALL';
  onStatusFilterChange: (status: PrepPackageStatus | 'ALL') => void;
  typeFilter: PrepPackageType | 'ALL';
  onTypeFilterChange: (type: PrepPackageType | 'ALL') => void;
  statusCounts: Record<string, number>;
  onCreate?: () => void;
}

function ToolBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusCounts,
  onCreate
}: ToolBarProps) {
  return (
    <div className="space-y-4">
      {/* 搜索和操作 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索準備包標題、描述或客戶名稱..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            創建準備包
          </Button>
        )}
      </div>

      {/* 狀態標籤篩選 */}
      <Tabs value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as PrepPackageStatus | 'ALL')}>
        <TabsList>
          <TabsTrigger value="ALL">
            全部 <Badge variant="secondary" className="ml-1">{statusCounts.ALL || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={PrepPackageStatus.DRAFT}>
            草稿 <Badge variant="secondary" className="ml-1">{statusCounts[PrepPackageStatus.DRAFT] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={PrepPackageStatus.READY}>
            就緒 <Badge variant="secondary" className="ml-1">{statusCounts[PrepPackageStatus.READY] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={PrepPackageStatus.IN_USE}>
            使用中 <Badge variant="secondary" className="ml-1">{statusCounts[PrepPackageStatus.IN_USE] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value={PrepPackageStatus.COMPLETED}>
            已完成 <Badge variant="secondary" className="ml-1">{statusCounts[PrepPackageStatus.COMPLETED] || 0}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 篩選和排序 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as PrepPackageType | 'ALL')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="選擇類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">所有類型</SelectItem>
              <SelectItem value={PrepPackageType.SALES_MEETING}>銷售會議</SelectItem>
              <SelectItem value={PrepPackageType.CLIENT_PRESENTATION}>客戶簡報</SelectItem>
              <SelectItem value={PrepPackageType.INTERNAL_REVIEW}>內部審查</SelectItem>
              <SelectItem value={PrepPackageType.PROPOSAL_DISCUSSION}>提案討論</SelectItem>
              <SelectItem value={PrepPackageType.TRAINING_SESSION}>培訓會議</SelectItem>
              <SelectItem value={PrepPackageType.CUSTOM}>自定義</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created-desc">最新創建</SelectItem>
              <SelectItem value="created-asc">最早創建</SelectItem>
              <SelectItem value="updated-desc">最近更新</SelectItem>
              <SelectItem value="updated-asc">最早更新</SelectItem>
              <SelectItem value="read-time-asc">閱讀時間↑</SelectItem>
              <SelectItem value="read-time-desc">閱讀時間↓</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PrepPackageList;
