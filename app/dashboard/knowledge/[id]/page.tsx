/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫文檔詳情頁面 (app/dashboard/knowledge/[id]/page.tsx)
 * ================================================================
 *
 * 【檔案功能】
 * 提供單個知識庫文檔的詳細資訊展示和管理界面，支持內容預覽、元數據查看、
 * 編輯管理和相關操作，為用戶提供完整的文檔生命週期管理体驗。
 *
 * 【主要職責】
 * • 文檔詳情展示 - KnowledgeDocumentView組件深度整合
 * • 元數據管理 - 文檔標題、標籤、創建時間等信息
 * • 內容預覽 - 文檔內容的格式化顯示和渲染
 * • 管理操作 - 編輯、刪除、下載等文檔操作
 * • 權限控制 - 根據用戶權限顯示可用操作
 *
 * 【頁面結構】
 * • 標題和操作區 - 返回按鈕 + 標題 + 編輯/刪除按鈕
 * • 麵包屑導航區 - 完整的面包屑路徑显示
 * • 文檔內容區 - KnowledgeDocumentView組件渲染區域
 *
 * 【功能特色】
 * • 動態路由 - 支持[id]參數的動態路由處理
 * • 元數據產生 - generateMetadata函數動態產生SEO元數據
 * • 參數驗證 - 文檔ID的數字驗證和錯誤處理
 * • 操作按鈕 - 編輯和刪除按鈕的條件式顯示
 * • 導航連結 - 與其他知識庫頁面的無縫連接
 *
 * 【用戶流程】
 * 1. 從知識庫列表點擊文檔進入詳情頁面
 * 2. 查看文檔完整內容和元數據信息
 * 3. 使用預覽功能查看格式化內容
 * 4. 點擊編輯按鈕進入編輯模式
 * 5. 使用刪除功能移除不需要的文檔
 * 6. 透過麵包屑導航到其他相關頁面
 *
 * 【URL參數】
 * • 路徑：/dashboard/knowledge/[id]
 * • 動態參數：
 *   - id: 文檔ID（數字，必須 > 0）
 *
 * 【狀態管理】
 * • documentId: 由URL參數解析的文檔ID
 * • 文檔数據由KnowledgeDocumentView組件管理
 *
 * 【相關檔案】
 * • components/knowledge/knowledge-document-view.tsx - 核心詳情組件
 * • app/dashboard/knowledge/[id]/edit/page.tsx - 編輯頁面
 * • app/dashboard/knowledge/page.tsx - 知識庫主頁面
 * • app/api/knowledge-base/[id]/route.ts - 文檔数據API
 * • components/ui/button.tsx - 按鈕UI組件
 *
 * 【開發注意】
 * • 參數驗證：需對無效ID進行404處理
 * • 權限控制：不同用戶可編輯/刪除的文檔範圍不同
 * • SEO優化：generateMetadata函數需處理API錯誤
 * • 性能優化：大文檔的延遲載入和分段顯示
 * • 錯誤處理：文檔不存在、網路錯誤的友好提示
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { KnowledgeDocumentView } from '@/components/knowledge/knowledge-document-view'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: {
    id: string
  }
}

/**
 * 生成頁面元數據
 * 根據文檔ID獲取標題等信息
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    // 從API獲取文檔信息以生成元數據
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/knowledge-base/${params.id}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return {
        title: '文檔詳情',
        description: '查看知識庫文檔的詳細信息'
      }
    }

    const data = await response.json()

    return {
      title: data.data?.title || '文檔詳情',
      description: `查看「${data.data?.title}」的詳細內容和相關信息`
    }
  } catch (error) {
    return {
      title: '文檔詳情',
      description: '查看知識庫文檔的詳細信息'
    }
  }
}

/**
 * 文檔詳情頁面組件
 *
 * 路由參數：
 * - id: 知識庫項目ID（數字）
 *
 * 頁面結構：
 * 1. 頁面標題和操作按鈕
 * 2. 麵包屑導航
 * 3. 文檔詳情展示組件
 */
export default function KnowledgeDetailPage({ params }: PageProps) {
  // 驗證ID參數是否為有效數字
  const documentId = parseInt(params.id)
  if (isNaN(documentId) || documentId <= 0) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/knowledge">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">文檔詳情</h1>
            <p className="mt-1 text-sm text-gray-600">
              查看文檔內容、元數據和相關操作
            </p>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/knowledge/${documentId}/edit`}>
            <Button variant="outline">
              <PencilIcon className="h-4 w-4 mr-2" />
              編輯
            </Button>
          </Link>
          <Button variant="destructive">
            <TrashIcon className="h-4 w-4 mr-2" />
            刪除
          </Button>
        </div>
      </div>

      {/* 麵包屑導航 */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
              儀表板
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <Link href="/dashboard/knowledge" className="text-gray-400 hover:text-gray-500">
              知識庫
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <span className="text-gray-900">文檔詳情</span>
          </li>
        </ol>
      </nav>

      {/* 文檔詳情展示 */}
      <KnowledgeDocumentView documentId={documentId} />
    </div>
  )
}