import { Metadata } from 'next'
import { KnowledgeCreateForm } from '@/components/knowledge/knowledge-create-form'

export const metadata: Metadata = {
  title: '新建知識庫',
  description: '創建新的知識庫項目',
}

export default function KnowledgeCreatePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新建知識庫</h1>
        <p className="mt-1 text-sm text-gray-600">
          創建新的知識庫項目，您可以手動輸入內容或稍後上傳文檔
        </p>
      </div>

      {/* 表單組件 */}
      <KnowledgeCreateForm />
    </div>
  )
}