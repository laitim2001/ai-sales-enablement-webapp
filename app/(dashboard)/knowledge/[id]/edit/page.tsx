import { Metadata } from 'next'
import { KnowledgeDocumentEdit } from '@/components/knowledge/knowledge-document-edit'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `編輯文檔 - 知識庫`,
    description: '編輯知識庫文檔內容和屬性',
  }
}

export default function EditKnowledgeDocumentPage({ params }: PageProps) {
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
          href={`/dashboard/knowledge/${documentId}`}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回文檔詳情
        </Link>
      </div>

      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">編輯文檔</h1>
        <p className="mt-1 text-sm text-gray-600">
          修改文檔標題、內容和屬性
        </p>
      </div>

      {/* 編輯表單組件 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <KnowledgeDocumentEdit documentId={documentId} />
      </div>
    </div>
  )
}