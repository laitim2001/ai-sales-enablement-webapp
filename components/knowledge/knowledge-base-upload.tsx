'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const categoryOptions = [
  { value: 'GENERAL', label: '一般' },
  { value: 'PRODUCT_SPEC', label: '產品規格' },
  { value: 'SALES_MATERIAL', label: '銷售資料' },
  { value: 'TECHNICAL_DOC', label: '技術文檔' },
  { value: 'LEGAL_DOC', label: '法律文件' },
  { value: 'TRAINING', label: '培訓資料' },
  { value: 'FAQ', label: '常見問題' },
  { value: 'CASE_STUDY', label: '案例研究' },
  { value: 'WHITE_PAPER', label: '白皮書' },
  { value: 'PRESENTATION', label: '簡報' },
  { value: 'COMPETITOR', label: '競爭分析' },
  { value: 'INDUSTRY_NEWS', label: '行業新聞' },
  { value: 'INTERNAL', label: '內部文檔' }
]

const supportedTypes = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.html',
  '.csv',
  '.json'
]

export function KnowledgeBaseUpload() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [category, setCategory] = useState('GENERAL')
  const [tags, setTags] = useState('')
  const [author, setAuthor] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [])

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...uploadFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    const { file } = uploadFile

    try {
      // 更新狀態為上傳中
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      // 準備表單數據
      const formData = new FormData()
      formData.append('file', file)

      const metadata = {
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        author: author.trim() || undefined,
        language: 'zh-TW',
        auto_process: true
      }

      formData.append('metadata', JSON.stringify(metadata))

      // 上傳檔案
      const response = await fetch('/api/knowledge-base/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      // 上傳成功
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'success', progress: 100 }
          : f
      ))

    } catch (error) {
      // 上傳失敗
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ))
    }
  }

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')

    // 並行上傳所有檔案
    await Promise.all(pendingFiles.map(uploadFile))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canUpload = files.length > 0 && files.some(f => f.status === 'pending')
  const allCompleted = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error')

  return (
    <div className="space-y-6">
      {/* 拖拽上傳區域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-lg font-medium text-gray-900">
              拖拽檔案到這裡，或
              <span className="text-blue-600 hover:text-blue-500"> 點擊選擇檔案</span>
            </span>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              accept={supportedTypes.join(',')}
              onChange={handleFileSelect}
            />
          </label>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          支援格式：{supportedTypes.join(', ')} (最大 10MB)
        </p>
      </div>

      {/* 設置選項 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            文檔類別
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            標籤 (逗號分隔)
          </label>
          <input
            type="text"
            placeholder="例如：產品,規格,重要"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作者 (選填)
          </label>
          <input
            type="text"
            placeholder="文檔作者"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 檔案列表 */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">待上傳檔案</h3>
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 ${
                    uploadFile.status === 'success' ? 'text-green-500' :
                    uploadFile.status === 'error' ? 'text-red-500' :
                    uploadFile.status === 'uploading' ? 'text-blue-500' :
                    'text-gray-400'
                  }`}>
                    {uploadFile.status === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : uploadFile.status === 'error' ? (
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    ) : (
                      <DocumentArrowUpIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                      {uploadFile.status === 'uploading' && ` • 上傳中 ${uploadFile.progress}%`}
                      {uploadFile.status === 'success' && ' • 上傳成功'}
                      {uploadFile.status === 'error' && ` • 錯誤：${uploadFile.error}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(uploadFile.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  disabled={uploadFile.status === 'uploading'}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {files.length > 0 && `${files.length} 個檔案`}
        </div>

        <div className="flex space-x-3">
          {allCompleted && (
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/knowledge')}
            >
              返回知識庫
            </Button>
          )}

          <Button
            onClick={uploadAllFiles}
            disabled={!canUpload}
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            {files.some(f => f.status === 'uploading') ? '上傳中...' : '開始上傳'}
          </Button>
        </div>
      </div>
    </div>
  )
}