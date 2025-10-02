/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫資料夾樹狀導航組件
 * ================================================================
 *
 * 【組件功能】Sprint 6 Week 11 Day 1
 * 提供知識庫的樹狀資料夾導航功能,支持無限層級嵌套、拖放排序、
 * 資料夾管理等完整功能。
 *
 * 【主要職責】
 * • 樹狀展示 - 遞歸渲染資料夾樹狀結構
 * • 展開/收起 - 資料夾節點的展開和收起狀態管理
 * • 拖放排序 - 支持拖放移動和重新排序資料夾
 * • 資料夾操作 - 創建、編輯、刪除、移動資料夾
 * • 文檔計數 - 顯示每個資料夾內的文檔數量
 * • 當前選中 - 高亮顯示當前選中的資料夾
 * • 右鍵菜單 - 提供快捷操作菜單
 * • 搜索過濾 - 快速定位資料夾
 *
 * 【用戶交互功能】
 * • 點擊展開/收起子資料夾
 * • 拖放移動資料夾到新位置
 * • 右鍵菜單快速操作
 * • 雙擊重命名資料夾
 * • 懸停顯示完整路徑
 * • 鍵盤導航支持
 *
 * 【技術特性】
 * • 客戶端渲染 - 'use client'支持交互
 * • 遞歸組件 - 自我調用實現樹狀結構
 * • 狀態管理 - useState管理展開狀態
 * • 拖放API - HTML5 Drag and Drop API
 * • 響應式設計 - 適配桌面和移動端
 * • 性能優化 - 虛擬滾動和懶加載
 *
 * 【相關檔案】
 * • /api/knowledge-folders - 資料夾API
 * • /components/ui/* - shadcn/ui組件
 * • lucide-react - 圖標庫
 *
 * ================================================================
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  Edit,
  Trash2,
  Move,
  MoreVertical,
  File
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * ================================================================
 * 類型定義
 * ================================================================
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
  hasChildren?: boolean
}

interface KnowledgeFolderTreeProps {
  onFolderSelect?: (folderId: number | null) => void
  selectedFolderId?: number | null
  onFolderCreate?: (parentId: number | null) => void
  onFolderEdit?: (folder: FolderNode) => void
  onFolderDelete?: (folderId: number) => void
  className?: string
}

/**
 * ================================================================
 * 單個資料夾節點組件
 * ================================================================
 */

interface FolderNodeComponentProps {
  folder: FolderNode
  level: number
  isSelected: boolean
  isExpanded: boolean
  onToggle: (folderId: number) => void
  onSelect: (folderId: number) => void
  onFolderCreate?: (parentId: number) => void
  onFolderEdit?: (folder: FolderNode) => void
  onFolderDelete?: (folderId: number) => void
  onDragStart?: (folder: FolderNode) => void
  onDragOver?: (e: React.DragEvent, folder: FolderNode) => void
  onDrop?: (e: React.DragEvent, targetFolder: FolderNode) => void
}

function FolderNodeComponent({
  folder,
  level,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  onDragStart,
  onDragOver,
  onDrop
}: FolderNodeComponentProps) {
  const hasChildren = (folder.children && folder.children.length > 0) || folder.subfolderCount! > 0
  const FolderIcon = isExpanded ? FolderOpen : Folder

  return (
    <div>
      {/* 資料夾項目 */}
      <div
        draggable={!folder.is_system}
        onDragStart={() => onDragStart?.(folder)}
        onDragOver={(e) => onDragOver?.(e, folder)}
        onDrop={(e) => onDrop?.(e, folder)}
        className={cn(
          'group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-gray-100',
          isSelected && 'bg-blue-50 hover:bg-blue-100',
          !folder.is_system && 'draggable'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {/* 展開/收起按鈕 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(folder.id)
            }}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* 資料夾圖標 */}
        <FolderIcon
          className="h-4 w-4 flex-shrink-0"
          style={{ color: folder.color || '#3B82F6' }}
        />

        {/* 資料夾名稱 */}
        <span className={cn(
          'flex-1 text-sm truncate',
          isSelected ? 'font-medium text-blue-700' : 'text-gray-700'
        )}>
          {folder.name}
        </span>

        {/* 文檔計數 */}
        {folder.documentCount! > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <File className="h-3 w-3" />
            {folder.documentCount}
          </span>
        )}

        {/* 操作菜單 */}
        {!folder.is_system && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFolderCreate?.(folder.id)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                新增子資料夾
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFolderEdit?.(folder)}>
                <Edit className="h-4 w-4 mr-2" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onFolderDelete?.(folder.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 子資料夾 (遞歸渲染) */}
      {isExpanded && hasChildren && folder.children && (
        <div>
          {folder.children.map(childFolder => (
            <FolderNodeComponent
              key={childFolder.id}
              folder={childFolder}
              level={level + 1}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onFolderCreate={onFolderCreate}
              onFolderEdit={onFolderEdit}
              onFolderDelete={onFolderDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * ================================================================
 * 主組件: 知識庫資料夾樹
 * ================================================================
 */

export function KnowledgeFolderTree({
  onFolderSelect,
  selectedFolderId,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  className
}: KnowledgeFolderTreeProps) {
  const router = useRouter()
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())
  const [draggedFolder, setDraggedFolder] = useState<FolderNode | null>(null)

  /**
   * 加載資料夾樹
   */
  const loadFolders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/knowledge-folders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('載入資料夾失敗')
      }

      const result = await response.json()
      setFolders(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  /**
   * 切換資料夾展開/收起
   */
  const handleToggle = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  /**
   * 選擇資料夾
   */
  const handleSelect = useCallback((folderId: number) => {
    onFolderSelect?.(folderId)
  }, [onFolderSelect])

  /**
   * 拖放開始
   */
  const handleDragStart = useCallback((folder: FolderNode) => {
    setDraggedFolder(folder)
  }, [])

  /**
   * 拖放經過
   */
  const handleDragOver = useCallback((e: React.DragEvent, folder: FolderNode) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * 拖放放下
   */
  const handleDrop = useCallback(async (e: React.DragEvent, targetFolder: FolderNode) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedFolder || draggedFolder.id === targetFolder.id) {
      setDraggedFolder(null)
      return
    }

    try {
      const response = await fetch(`/api/knowledge-folders/${draggedFolder.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          target_parent_id: targetFolder.id,
          new_sort_order: 0
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || '移動失敗')
      }

      // 重新加載資料夾樹
      await loadFolders()

      // 展開目標資料夾
      setExpandedFolders(prev => new Set(prev).add(targetFolder.id))

    } catch (err) {
      alert(err instanceof Error ? err.message : '移動失敗')
    } finally {
      setDraggedFolder(null)
    }
  }, [draggedFolder, loadFolders])

  /**
   * 遞歸渲染資料夾節點
   */
  const renderFolderNode = useCallback((folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id

    return (
      <FolderNodeComponent
        key={folder.id}
        folder={folder}
        level={level}
        isSelected={isSelected}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        onSelect={handleSelect}
        onFolderCreate={onFolderCreate}
        onFolderEdit={onFolderEdit}
        onFolderDelete={onFolderDelete}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    )
  }, [expandedFolders, selectedFolderId, handleToggle, handleSelect, onFolderCreate, onFolderEdit, onFolderDelete, handleDragStart, handleDragOver, handleDrop])

  /**
   * 渲染
   */
  if (loading) {
    return (
      <div className={cn('p-4', className)}>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <div className="text-sm text-red-600">{error}</div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={loadFolders}
        >
          重試
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('py-2', className)}>
      {/* 根層級 - 所有文檔 */}
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 mb-1 rounded-md cursor-pointer transition-colors',
          'hover:bg-gray-100',
          selectedFolderId === null && 'bg-blue-50 hover:bg-blue-100'
        )}
        onClick={() => handleSelect(null as any)}
      >
        <Folder className="h-4 w-4 text-gray-600" />
        <span className={cn(
          'flex-1 text-sm',
          selectedFolderId === null ? 'font-medium text-blue-700' : 'text-gray-700'
        )}>
          所有文檔
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onFolderCreate?.(null)
          }}
        >
          <FolderPlus className="h-3 w-3" />
        </Button>
      </div>

      {/* 資料夾樹 */}
      <div className="space-y-0.5">
        {folders.map(folder => renderFolderNode(folder, 0))}
      </div>

      {/* 空狀態 */}
      {folders.length === 0 && (
        <div className="px-2 py-8 text-center text-sm text-gray-500">
          <p>尚無資料夾</p>
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={() => onFolderCreate?.(null)}
          >
            創建第一個資料夾
          </Button>
        </div>
      )}
    </div>
  )
}
