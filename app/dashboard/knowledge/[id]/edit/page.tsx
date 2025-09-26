/**
 * 文檔編輯頁面
 *
 * 功能說明：
 * - 提供知識庫項目編輯界面
 * - 整合KnowledgeDocumentEdit組件
 * - 支援內容、標題、標籤等屬性編輯
 * - 處理編輯保存和取消操作
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { KnowledgeDocumentEdit } from '@/components/knowledge/knowledge-document-edit'
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
        title: '編輯文檔',
        description: '編輯知識庫文檔的內容和屬性'
      }
    }

    const data = await response.json()

    return {
      title: `編輯：${data.data?.title || '文檔'}`,
      description: `編輯「${data.data?.title}」的內容、標題、標籤等屬性`
    }
  } catch (error) {
    return {
      title: '編輯文檔',
      description: '編輯知識庫文檔的內容和屬性'
    }
  }
}

/**
 * 文檔編輯頁面組件
 *
 * 路由參數：
 * - id: 知識庫項目ID（數字）
 *
 * 頁面結構：
 * 1. 頁面標題和導航
 * 2. 麵包屑導航
 * 3. 文檔編輯表單組件
 */
export default function EditKnowledgePage({ params }: PageProps) {
  // 驗證ID參數是否為有效數字
  const documentId = parseInt(params.id)
  if (isNaN(documentId) || documentId <= 0) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和導航 */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/knowledge/${documentId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回詳情
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">編輯文檔</h1>
          <p className="mt-1 text-sm text-gray-600">
            修改文檔的內容、標題、標籤和其他屬性
          </p>
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
            <Link href={`/dashboard/knowledge/${documentId}`} className="text-gray-400 hover:text-gray-500">
              文檔詳情
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <span className="text-gray-900">編輯</span>
          </li>
        </ol>
      </nav>

      {/* 編輯表單 */}
      <div className="max-w-4xl">
        <KnowledgeDocumentEdit documentId={documentId} />
      </div>
    </div>
  )
}