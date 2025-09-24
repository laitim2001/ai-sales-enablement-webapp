import { Metadata } from 'next'
import { Suspense } from 'react'
import { KnowledgeBaseList } from '@/components/knowledge/knowledge-base-list'
import { KnowledgeBaseFilters } from '@/components/knowledge/knowledge-base-filters'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '知識庫',
  description: '管理和搜索您的知識庫文檔',
}

interface PageProps {
  searchParams: {
    page?: string
    limit?: string
    category?: string
    status?: string
    search?: string
    tags?: string
    sort?: string
    order?: string
  }
}

export default function KnowledgePage({ searchParams }: PageProps) {
  // 解析搜索參數
  const filters = {
    page: parseInt(searchParams.page || '1'),
    limit: parseInt(searchParams.limit || '20'),
    category: searchParams.category,
    status: searchParams.status,
    search: searchParams.search,
    tags: searchParams.tags,
    sort: searchParams.sort || 'updated_at',
    order: (searchParams.order as 'asc' | 'desc') || 'desc',
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知識庫</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理您的文檔和知識資料，讓AI助手更好地協助您
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/knowledge/search">
            <Button variant="outline">
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              智能搜索
            </Button>
          </Link>
          <Link href="/dashboard/knowledge/create">
            <Button variant="outline">
              <PlusIcon className="h-4 w-4 mr-2" />
              新建項目
            </Button>
          </Link>
          <Link href="/dashboard/knowledge/upload">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              上傳文檔
            </Button>
          </Link>
        </div>
      </div>

      {/* 篩選器 */}
      <KnowledgeBaseFilters initialFilters={filters} />

      {/* 文檔列表 */}
      <Suspense fallback={<div className="text-center py-8">載入中...</div>}>
        <KnowledgeBaseList filters={filters} />
      </Suspense>
    </div>
  )
}