import { Metadata } from 'next'
import { KnowledgeBaseUpload } from '@/components/knowledge/knowledge-base-upload'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '上傳文檔 - 知識庫',
  description: '上傳文檔到知識庫，讓AI助手學習和使用',
}

export default function KnowledgeUploadPage() {
  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/knowledge"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回知識庫
        </Link>
      </div>

      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">上傳文檔</h1>
        <p className="mt-1 text-sm text-gray-600">
          上傳文檔到知識庫，系統會自動處理並向量化，讓AI助手能更好地為您服務
        </p>
      </div>

      {/* 上傳組件 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <KnowledgeBaseUpload />
      </div>
    </div>
  )
}