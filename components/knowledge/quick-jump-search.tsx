/**
 * ================================================================
 * AI銷售賦能平台 - 快速跳轉搜索組件
 * ================================================================
 *
 * 【檔案功能】
 * 提供資料夾和文檔的快速搜索跳轉功能，支持鍵盤快捷鍵喚起
 * 類似 VSCode 的 Cmd+P 快速跳轉體驗
 *
 * 【主要職責】
 * • 模糊搜索 - 支持資料夾名稱和文檔標題模糊匹配
 * • 鍵盤操作 - 上下鍵選擇，Enter跳轉，Esc關閉
 * • 快捷鍵 - Cmd+K (Mac) / Ctrl+K (Windows) 喚起
 * • 最近訪問 - 優先顯示最近訪問的資料夾和文檔
 *
 * 【使用場景】
 * • 快速導航 - 用戶想快速跳轉到特定資料夾
 * • 搜索文檔 - 模糊搜索文檔標題快速定位
 * • 提升效率 - 減少點擊次數，提升操作效率
 *
 * 【組件特性】
 * • 即時搜索 - 輸入即搜索，無需等待
 * • 智能排序 - 根據相關性和最近訪問排序
 * • 鍵盤友好 - 完全支持鍵盤操作
 * • 響應式設計 - 適配不同屏幕尺寸
 *
 * 【相關檔案】
 * • app/api/knowledge-folders/route.ts - 資料夾搜索API
 * • app/api/knowledge-base/route.ts - 文檔搜索API
 */

'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { Dialog, Transition, Combobox } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

/**
 * 搜索結果項目類型
 */
type SearchResultType = 'folder' | 'document' | 'recent'

/**
 * 搜索結果項目介面
 */
interface SearchResultItem {
  id: number
  type: SearchResultType
  title: string
  subtitle?: string
  path?: string
  icon?: string
  url: string
}

/**
 * 快速跳轉搜索組件屬性
 */
export interface QuickJumpSearchProps {
  /** 是否顯示搜索對話框 */
  isOpen: boolean
  /** 關閉對話框回調 */
  onClose: () => void
}

/**
 * 快速跳轉搜索組件
 *
 * 提供全局快速搜索和跳轉功能，支持鍵盤快捷鍵
 *
 * @example
 * ```tsx
 * function App() {
 *   const [isSearchOpen, setIsSearchOpen] = useState(false)
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsSearchOpen(true)}>搜索</button>
 *       <QuickJumpSearch
 *         isOpen={isSearchOpen}
 *         onClose={() => setIsSearchOpen(false)}
 *       />
 *     </>
 *   )
 * }
 * ```
 */
export function QuickJumpSearch({ isOpen, onClose }: QuickJumpSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentItems, setRecentItems] = useState<SearchResultItem[]>([])

  /**
   * 加載最近訪問項目
   */
  useEffect(() => {
    const loadRecentItems = () => {
      // 從 localStorage 讀取最近訪問
      const recent = localStorage.getItem('knowledge_recent_items')
      if (recent) {
        try {
          const items = JSON.parse(recent) as SearchResultItem[]
          setRecentItems(items.slice(0, 5)) // 只顯示最近5項
        } catch (error) {
          console.error('Failed to parse recent items:', error)
        }
      }
    }

    if (isOpen) {
      loadRecentItems()
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  /**
   * 搜索資料夾和文檔
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // 並行搜索資料夾和文檔
      const [foldersRes, documentsRes] = await Promise.all([
        fetch(`/api/knowledge-folders?search=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/knowledge-base?search=${encodeURIComponent(searchQuery)}&limit=10`),
      ])

      const folders = foldersRes.ok ? await foldersRes.json() : []
      const documents = documentsRes.ok ? await documentsRes.json() : { items: [] }

      // 轉換為統一格式
      const folderResults: SearchResultItem[] = (Array.isArray(folders) ? folders : [])
        .slice(0, 5)
        .map((folder: any) => ({
          id: folder.id,
          type: 'folder' as const,
          title: folder.name,
          subtitle: folder.description,
          path: folder.path,
          icon: folder.icon,
          url: `/dashboard/knowledge?folder=${folder.id}`,
        }))

      const documentResults: SearchResultItem[] = (documents.items || [])
        .slice(0, 5)
        .map((doc: any) => ({
          id: doc.id,
          type: 'document' as const,
          title: doc.title,
          subtitle: doc.category,
          path: doc.folder?.path,
          url: `/dashboard/knowledge/${doc.id}`,
        }))

      setResults([...folderResults, ...documentResults])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 處理搜索輸入變化（帶防抖）
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300) // 300ms 防抖

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  /**
   * 處理項目選擇
   */
  const handleSelect = (item: SearchResultItem) => {
    // 保存到最近訪問
    const recent = [...recentItems.filter(r => r.id !== item.id || r.type !== item.type), item]
    localStorage.setItem('knowledge_recent_items', JSON.stringify(recent.slice(0, 10)))

    // 跳轉
    router.push(item.url)
    onClose()
  }

  /**
   * 獲取項目圖標
   */
  const getItemIcon = (item: SearchResultItem) => {
    if (item.type === 'folder') {
      return item.icon ? (
        <span className="text-xl" aria-hidden="true">
          {item.icon}
        </span>
      ) : (
        <FolderIcon className="h-5 w-5 text-blue-500" />
      )
    }

    if (item.type === 'recent') {
      return <ClockIcon className="h-5 w-5 text-gray-400" />
    }

    return <DocumentTextIcon className="h-5 w-5 text-green-500" />
  }

  /**
   * 顯示的結果列表
   */
  const displayResults = query.trim() ? results : recentItems

  return (
    <Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        {/* 搜索對話框 */}
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <Combobox onChange={handleSelect}>
                {/* 搜索輸入框 */}
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="搜索資料夾或文檔..."
                    onChange={(event) => setQuery(event.target.value)}
                    autoFocus
                  />
                  {isLoading && (
                    <div className="absolute right-4 top-3.5">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    </div>
                  )}
                </div>

                {/* 搜索結果列表 */}
                {displayResults.length > 0 && (
                  <Combobox.Options
                    static
                    className="max-h-96 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800"
                  >
                    {/* 結果分組標題 */}
                    {!query.trim() && recentItems.length > 0 && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                        最近訪問
                      </div>
                    )}

                    {displayResults.map((item) => (
                      <Combobox.Option
                        key={`${item.type}-${item.id}`}
                        value={item}
                        className={({ active }) =>
                          `flex cursor-pointer select-none items-center gap-3 px-4 py-2 ${
                            active ? 'bg-blue-50' : ''
                          }`
                        }
                      >
                        {({ active }) => (
                          <>
                            {/* 圖標 */}
                            <div className="flex-shrink-0">
                              {getItemIcon(item)}
                            </div>

                            {/* 內容 */}
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium text-gray-900 truncate">
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div className="text-xs text-gray-500 truncate">
                                  {item.subtitle}
                                </div>
                              )}
                              {item.path && (
                                <div className="text-xs text-gray-400 truncate">
                                  {item.path}
                                </div>
                              )}
                            </div>

                            {/* 類型標籤 */}
                            <div className="flex-shrink-0">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  item.type === 'folder'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {item.type === 'folder' ? '資料夾' : '文檔'}
                              </span>
                            </div>
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}

                {/* 空狀態 */}
                {query.trim() && !isLoading && results.length === 0 && (
                  <div className="px-6 py-14 text-center text-sm sm:px-14">
                    <FolderIcon className="mx-auto h-6 w-6 text-gray-400" />
                    <p className="mt-4 font-semibold text-gray-900">找不到結果</p>
                    <p className="mt-2 text-gray-500">
                      請嘗試不同的搜索關鍵字
                    </p>
                  </div>
                )}

                {/* 提示信息 */}
                <div className="flex flex-wrap items-center bg-gray-50 px-4 py-2.5 text-xs text-gray-700">
                  <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:mx-2">
                    ↑↓
                  </kbd>
                  <span className="sm:hidden">導航</span>
                  <span className="hidden sm:inline">選擇</span>
                  <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:mx-2">
                    ↵
                  </kbd>
                  跳轉
                  <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:mx-2">
                    Esc
                  </kbd>
                  關閉
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

/**
 * 快速跳轉搜索觸發按鈕組件
 *
 * 顯示帶快捷鍵提示的搜索按鈕
 */
export function QuickJumpSearchTrigger({
  onClick,
  className = '',
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors ${className}`}
    >
      <MagnifyingGlassIcon className="h-4 w-4" />
      <span>快速跳轉...</span>
      <kbd className="hidden sm:inline-flex ml-auto items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-sans text-xs text-gray-600">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
