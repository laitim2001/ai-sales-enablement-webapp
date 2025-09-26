/**
 * 文檔詳情頁面
 *
 * 功能說明：
 * - 顯示單個知識庫項目的詳細信息
 * - 整合KnowledgeDocumentView組件進行內容展示
 * - 提供編輯、刪除等管理操作
 * - 支援文檔預覽和下載功能
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