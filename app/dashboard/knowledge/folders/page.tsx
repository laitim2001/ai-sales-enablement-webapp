/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫資料夾管理頁面================================================================【檔案功能】提供知識庫資料夾的完整管理界面，支持創建、編輯、刪除、移動資料夾使用樹狀結構展示資料夾層級關係【主要職責】• 資料夾展示 - 樹狀結構顯示所有資料夾• 資料夾創建 - 創建新資料夾（支持父資料夾選擇）• 資料夾操作 - 編輯、刪除、移動資料夾• 拖放排序 - 支持拖放調整資料夾順序• 狀態管理 - 展開/折疊狀態保存【頁面結構】• 頁面標題區 - 標題、描述和新建按鈕• 資料夾樹區域 - KnowledgeFolderTree 組件展示• 新建對話框 - 創建新資料夾的表單【相關檔案】• components/knowledge/knowledge-folder-tree.tsx - 樹狀資料夾組件• app/api/knowledge-folders/route.ts - 資料夾 CRUD API
 * @module app/dashboard/knowledge/folders/page
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫資料夾管理頁面================================================================【檔案功能】提供知識庫資料夾的完整管理界面，支持創建、編輯、刪除、移動資料夾使用樹狀結構展示資料夾層級關係【主要職責】• 資料夾展示 - 樹狀結構顯示所有資料夾• 資料夾創建 - 創建新資料夾（支持父資料夾選擇）• 資料夾操作 - 編輯、刪除、移動資料夾• 拖放排序 - 支持拖放調整資料夾順序• 狀態管理 - 展開/折疊狀態保存【頁面結構】• 頁面標題區 - 標題、描述和新建按鈕• 資料夾樹區域 - KnowledgeFolderTree 組件展示• 新建對話框 - 創建新資料夾的表單【相關檔案】• components/knowledge/knowledge-folder-tree.tsx - 樹狀資料夾組件• app/api/knowledge-folders/route.ts - 資料夾 CRUD API
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, FolderIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { KnowledgeFolderTree } from '@/components/knowledge/knowledge-folder-tree'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

/**
 * 資料夾管理頁面組件
 */
export default function FoldersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * 處理創建新資料夾
   */
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: '錯誤',
        description: '請輸入資料夾名稱',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/knowledge-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || undefined,
          parent_id: null, // 創建頂層資料夾
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '創建資料夾失敗')
      }

      toast({
        title: '成功',
        description: '資料夾創建成功',
      })

      // 重置表單
      setNewFolderName('')
      setNewFolderDescription('')
      setIsCreateDialogOpen(false)

      // 刷新資料夾樹
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('創建資料夾錯誤:', error)
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '創建資料夾失敗',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * 處理資料夾操作（編輯、刪除等）
   */
  const handleFolderAction = (action: string) => {
    // 刷新資料夾樹以反映變更
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和操作區域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderIcon className="h-6 w-6 text-blue-600" />
            資料夾管理
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            組織和管理您的知識庫資料夾結構
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          新建資料夾
        </Button>
      </div>

      {/* 資料夾樹狀結構 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <KnowledgeFolderTree
          key={refreshKey}
        />
      </div>

      {/* 新建資料夾對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建資料夾</DialogTitle>
            <DialogDescription>
              創建一個新的頂層資料夾來組織您的知識庫內容
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">資料夾名稱 *</Label>
              <Input
                id="folder-name"
                placeholder="例如：產品資料、銷售手冊"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleCreateFolder()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-description">描述（選填）</Label>
              <Input
                id="folder-description"
                placeholder="簡短描述此資料夾的用途"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setNewFolderName('')
                setNewFolderDescription('')
              }}
              disabled={isCreating}
            >
              取消
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreating}>
              {isCreating ? '創建中...' : '創建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
