/**
 * 文檔上傳頁面
 *
 * 功能說明：
 * - 提供文檔上傳界面，支援多種格式
 * - 整合KnowledgeBaseUpload組件
 * - 顯示上傳進度和結果
 * - 支援拖拽上傳和批量文件處理
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { KnowledgeBaseUpload } from '@/components/knowledge/knowledge-base-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '上傳文檔',
  description: '上傳文檔到知識庫，支援PDF、Word、文本等多種格式',
}

/**
 * 文檔上傳頁面組件
 *
 * 頁面結構：
 * 1. 頁面標題和導航
 * 2. 上傳說明卡片
 * 3. 文檔上傳組件
 * 4. 支援格式說明
 */
export default function UploadKnowledgePage() {
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
          <h1 className="text-2xl font-bold text-gray-900">上傳文檔</h1>
          <p className="mt-1 text-sm text-gray-600">
            將您的文檔上傳到知識庫，AI將自動處理和建立索引
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
            <span className="text-gray-900">上傳文檔</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 上傳區域 */}
        <div className="lg:col-span-2">
          <KnowledgeBaseUpload />
        </div>

        {/* 側邊欄說明 */}
        <div className="space-y-6">
          {/* 支援格式 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudArrowUpIcon className="h-5 w-5" />
                支援格式
              </CardTitle>
              <CardDescription>
                以下是目前支援的文件格式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">PDF 文檔</span>
                  <span className="text-xs text-gray-500">.pdf</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Word 文檔</span>
                  <span className="text-xs text-gray-500">.doc .docx</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">純文本</span>
                  <span className="text-xs text-gray-500">.txt</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Markdown</span>
                  <span className="text-xs text-gray-500">.md</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">CSV 數據</span>
                  <span className="text-xs text-gray-500">.csv</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">JSON 數據</span>
                  <span className="text-xs text-gray-500">.json</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">HTML 網頁</span>
                  <span className="text-xs text-gray-500">.html</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">RTF 文檔</span>
                  <span className="text-xs text-gray-500">.rtf</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 上傳須知 */}
          <Card>
            <CardHeader>
              <CardTitle>上傳須知</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>文件大小限制:</strong> 單個文件不超過 10MB
              </div>
              <div>
                <strong>處理時間:</strong> 上傳後需要1-3分鐘進行AI處理
              </div>
              <div>
                <strong>自動檢測:</strong> 系統會自動檢測重複文件
              </div>
              <div>
                <strong>向量化:</strong> 文檔會自動建立AI搜索索引
              </div>
              <div>
                <strong>安全性:</strong> 所有上傳文件都經過安全檢查
              </div>
            </CardContent>
          </Card>

          {/* 快速連結 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/knowledge/create">
                <Button variant="outline" className="w-full justify-start">
                  手動創建項目
                </Button>
              </Link>
              <Link href="/dashboard/knowledge/search">
                <Button variant="outline" className="w-full justify-start">
                  搜索現有文檔
                </Button>
              </Link>
              <Link href="/dashboard/knowledge">
                <Button variant="outline" className="w-full justify-start">
                  瀏覽知識庫
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}