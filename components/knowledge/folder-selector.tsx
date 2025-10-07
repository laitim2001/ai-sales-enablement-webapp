/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫資料夾選擇器組件================================================================【組件功能】Sprint 6 Week 11 Day 2提供資料夾選擇功能,用於篩選知識庫搜索結果。支持平鋪列表展示、子資料夾包含選項、清除選擇等功能。【主要職責】• 資料夾選擇 - 下拉式資料夾選擇器• 層級顯示 - 顯示資料夾的層級關係• 子資料夾選項 - 控制是否包含子資料夾內容• 即時反饋 - 實時更新選擇狀態• 清除選擇 - 快速清除資料夾篩選【用戶交互功能】• 點擊展開資料夾下拉列表• 選擇資料夾進行篩選• 切換是否包含子資料夾• 清除篩選返回所有文檔• 顯示當前選中的資料夾路徑【技術特性】• 客戶端渲染 - 'use client'支持交互• shadcn/ui組件 - Select, Checkbox等UI組件• 狀態管理 - useState管理選擇狀態• 平鋪結構 - 將樹狀結構轉換為平鋪列表展示• TypeScript - 完整類型定義• 響應式設計 - 適配移動端和桌面端【相關檔案】• /api/knowledge-folders - 資料夾API• /components/ui/* - shadcn/ui組件庫• /components/knowledge/knowledge-folder-tree.tsx - 樹狀導航組件@created 2025-10-02 - Sprint 6 Week 11 Day 2================================================================
 * @module components/knowledge/folder-selector
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫資料夾選擇器組件================================================================【組件功能】Sprint 6 Week 11 Day 2提供資料夾選擇功能,用於篩選知識庫搜索結果。支持平鋪列表展示、子資料夾包含選項、清除選擇等功能。【主要職責】• 資料夾選擇 - 下拉式資料夾選擇器• 層級顯示 - 顯示資料夾的層級關係• 子資料夾選項 - 控制是否包含子資料夾內容• 即時反饋 - 實時更新選擇狀態• 清除選擇 - 快速清除資料夾篩選【用戶交互功能】• 點擊展開資料夾下拉列表• 選擇資料夾進行篩選• 切換是否包含子資料夾• 清除篩選返回所有文檔• 顯示當前選中的資料夾路徑【技術特性】• 客戶端渲染 - 'use client'支持交互• shadcn/ui組件 - Select, Checkbox等UI組件• 狀態管理 - useState管理選擇狀態• 平鋪結構 - 將樹狀結構轉換為平鋪列表展示• TypeScript - 完整類型定義• 響應式設計 - 適配移動端和桌面端【相關檔案】• /api/knowledge-folders - 資料夾API• /components/ui/* - shadcn/ui組件庫• /components/knowledge/knowledge-folder-tree.tsx - 樹狀導航組件@created 2025-10-02 - Sprint 6 Week 11 Day 2================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Folder,
  FolderOpen,
  X,
  ChevronDown,
  Check
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * ================================================================
 * 類型定義
 * ================================================================
 */

/**
 * 資料夾節點類型
 * 從API返回的資料夾數據結構
 */
interface FolderNode {
  id: number
  name: string
  description?: string | null
  parent_id?: number | null
  path?: string | null
  icon?: string
  color?: string
  sort_order: number
  is_system: boolean
  created_at: string
  updated_at: string
  children?: FolderNode[]
  documentCount?: number
  subfolderCount?: number
}

/**
 * 平鋪資料夾項目類型
 * 用於下拉列表展示
 */
interface FlattenedFolder {
  id: number
  name: string
  level: number        // 資料夾層級深度 (0=根層級, 1=第一層子資料夾, etc.)
  path: string         // 完整路徑 (用於顯示)
  color?: string
  documentCount?: number
}

/**
 * 組件Props類型
 */
export interface FolderSelectorProps {
  /** 當前選中的資料夾ID */
  value?: number | null
  /** 是否包含子資料夾 */
  includeSubfolders?: boolean
  /** 資料夾選擇變更回調 */
  onFolderChange?: (folderId: number | null) => void
  /** 包含子資料夾選項變更回調 */
  onIncludeSubfoldersChange?: (include: boolean) => void
  /** 自定義類名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 佔位符文本 */
  placeholder?: string
}

/**
 * ================================================================
 * 輔助函數: 將樹狀結構轉換為平鋪列表
 * ================================================================
 * 遞歸遍歷資料夾樹,生成帶有層級信息的平鋪列表
 *
 * @param folders - 資料夾樹陣列
 * @param level - 當前層級深度
 * @param parentPath - 父級路徑
 * @returns 平鋪資料夾列表
 */
function flattenFolders(
  folders: FolderNode[],
  level: number = 0,
  parentPath: string = ''
): FlattenedFolder[] {
  const result: FlattenedFolder[] = []

  folders.forEach(folder => {
    // 構建當前資料夾路徑
    const currentPath = parentPath ? `${parentPath} / ${folder.name}` : folder.name

    // 添加當前資料夾到結果列表
    result.push({
      id: folder.id,
      name: folder.name,
      level,
      path: currentPath,
      color: folder.color || undefined,
      documentCount: folder.documentCount
    })

    // 遞歸處理子資料夾
    if (folder.children && folder.children.length > 0) {
      result.push(...flattenFolders(folder.children, level + 1, currentPath))
    }
  })

  return result
}

/**
 * ================================================================
 * 主組件: 資料夾選擇器
 * ================================================================
 */
export function FolderSelector({
  value,
  includeSubfolders = true,
  onFolderChange,
  onIncludeSubfoldersChange,
  className,
  disabled = false,
  placeholder = '選擇資料夾...'
}: FolderSelectorProps) {
  // ===== 狀態管理 =====
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [flattenedFolders, setFlattenedFolders] = useState<FlattenedFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * ===== 加載資料夾數據 =====
   * 從API獲取資料夾樹,並轉換為平鋪列表
   */
  const loadFolders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth-token')

      const response = await fetch('/api/knowledge-folders', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.error || `載入資料夾失敗 (${response.status})`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const foldersData = result.data || []

      setFolders(foldersData)
      setFlattenedFolders(flattenFolders(foldersData))
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
      console.error('載入資料夾失敗:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 組件掛載時加載資料夾
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  /**
   * ===== 處理資料夾選擇 =====
   */
  const handleFolderChange = useCallback((folderId: string) => {
    if (folderId === 'all') {
      onFolderChange?.(null)
    } else {
      onFolderChange?.(parseInt(folderId, 10))
    }
  }, [onFolderChange])

  /**
   * ===== 清除選擇 =====
   */
  const handleClear = useCallback(() => {
    onFolderChange?.(null)
  }, [onFolderChange])

  /**
   * ===== 獲取選中資料夾的顯示信息 =====
   */
  const selectedFolder = value !== null && value !== undefined
    ? flattenedFolders.find(f => f.id === value)
    : null

  /**
   * ===== 渲染層級縮進 =====
   * 根據資料夾層級顯示相應的縮進
   */
  const renderIndent = (level: number) => {
    if (level === 0) return null
    return (
      <span className="inline-block" style={{ width: `${level * 12}px` }}>
        {Array(level).fill('└').map((_, i) => (
          <span key={i} className="text-gray-400">─</span>
        ))}
      </span>
    )
  }

  /**
   * ===== 渲染 =====
   */
  return (
    <div className={cn('space-y-3', className)}>
      {/* 資料夾選擇器 */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="folder-select" className="text-sm font-medium mb-1.5 block">
            篩選資料夾
          </Label>

          {loading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="relative">
              <Select
                value={value !== null && value !== undefined ? value.toString() : 'all'}
                onValueChange={handleFolderChange}
                disabled={disabled}
              >
                <SelectTrigger
                  id="folder-select"
                  className={cn(
                    'w-full',
                    selectedFolder && 'font-medium'
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    {selectedFolder ? (
                      <>
                        <Folder
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: selectedFolder.color || '#3B82F6' }}
                        />
                        <span className="truncate">{selectedFolder.path}</span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="text-gray-500">{placeholder}</span>
                      </>
                    )}
                  </div>
                </SelectTrigger>

                <SelectContent className="max-h-[300px]">
                  {/* 所有文檔選項 */}
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                      <span>所有文檔</span>
                    </div>
                  </SelectItem>

                  {/* 資料夾列表 */}
                  {flattenedFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      <div className="flex items-center gap-1.5">
                        {renderIndent(folder.level)}
                        <Folder
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: folder.color || '#3B82F6' }}
                        />
                        <span className="truncate">{folder.name}</span>
                        {folder.documentCount !== undefined && folder.documentCount > 0 && (
                          <span className="text-xs text-gray-500 ml-auto">
                            ({folder.documentCount})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 清除按鈕 */}
              {value !== null && value !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={handleClear}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 包含子資料夾選項 */}
      {value !== null && value !== undefined && (
        <div className="flex items-center space-x-2 pl-1">
          <Checkbox
            id="include-subfolders"
            checked={includeSubfolders}
            onCheckedChange={(checked) => {
              onIncludeSubfoldersChange?.(checked === true)
            }}
            disabled={disabled}
          />
          <Label
            htmlFor="include-subfolders"
            className="text-sm text-gray-700 cursor-pointer"
          >
            包含子資料夾內容
          </Label>
        </div>
      )}

      {/* 選擇狀態提示 */}
      {selectedFolder && (
        <div className="text-xs text-gray-500 pl-1">
          {includeSubfolders ? (
            <span>將搜索 <strong>{selectedFolder.name}</strong> 及其所有子資料夾</span>
          ) : (
            <span>僅搜索 <strong>{selectedFolder.name}</strong> 資料夾</span>
          )}
        </div>
      )}
    </div>
  )
}

export default FolderSelector
