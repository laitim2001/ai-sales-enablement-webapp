import { Metadata } from 'next'
import { KnowledgeSearch } from '@/components/knowledge/knowledge-search'

export const metadata: Metadata = {
  title: '智能搜索 - 知識庫',
  description: '使用AI驅動的智能搜索快速找到相關文檔和資料',
}

export default function KnowledgeSearchPage() {
  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">智能知識庫搜索</h1>
        <p className="mt-2 text-lg text-gray-600">
          使用AI驅動的智能搜索，快速找到您需要的文檔和資料
        </p>
      </div>

      {/* 搜索組件 */}
      <KnowledgeSearch />
    </div>
  )
}