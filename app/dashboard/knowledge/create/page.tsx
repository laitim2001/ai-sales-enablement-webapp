/**
 * 知識庫創建頁面
 *
 * 功能說明：
 * - 提供知識庫項目創建表單界面
 * - 整合KnowledgeCreateForm組件
 * - 處理創建成功後的導航
 * - 包含麵包屑導航和頁面標題
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { KnowledgeCreateForm } from '@/components/knowledge/knowledge-create-form'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '新建知識庫項目',
  description: '創建新的知識庫項目，組織您的文檔和資料',
}

/**
 * 知識庫創建頁面組件
 *
 * 頁面結構：
 * 1. 頁面標題區域 - 包含返回按鈕和標題描述
 * 2. 表單區域 - KnowledgeCreateForm組件
 * 3. 響應式布局 - 適配桌面和移動設備
 */
export default function CreateKnowledgePage() {
  return (
    <div className="space-y-6">
      {/* 頁面標題和導航 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/knowledge">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建知識庫項目</h1>
          <p className="mt-1 text-sm text-gray-600">
            創建新的知識庫項目，手動輸入內容或稍後上傳文檔
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
            <span className="text-gray-900">新建項目</span>
          </li>
        </ol>
      </nav>

      {/* 創建表單 */}
      <div className="max-w-3xl">
        <KnowledgeCreateForm />
      </div>
    </div>
  )
}