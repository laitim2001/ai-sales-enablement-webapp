import { Metadata } from 'next'
import { KnowledgeDocumentView } from '@/components/knowledge/knowledge-document-view'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // 在實際應用中，你可能想要從API獲取文檔標題
  return {
    title: `文檔詳情 - 知識庫`,
    description: '查看和管理知識庫文檔',
  }
}

export default function KnowledgeDocumentPage({ params }: PageProps) {
  const documentId = parseInt(params.id, 10)

  if (isNaN(documentId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">無效的文檔ID</h1>
          <p className="text-gray-600 mb-4">請檢查URL並重試</p>
          <Link
            href="/dashboard/knowledge"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            返回知識庫
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回導航 */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/knowledge"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回知識庫
        </Link>
      </div>

      {/* 文檔預覽組件 */}
      <KnowledgeDocumentView documentId={documentId} />
    </div>
  )
}