/**
 * ================================================================
 * AI銷售賦能平台 - 批量文件上傳組件
 * ================================================================
 *
 * 【檔案功能】
 * 提供批量文件上傳功能，支持拖放操作和多種文件格式
 * Day 1 實現：基礎UI框架和拖放區域
 * Day 3-4 將實現：文件解析、批量處理、進度追蹤
 *
 * 【主要職責】
 * • 拖放上傳 - 支持拖放文件和點擊選擇
 * • 多文件支持 - 同時上傳多個文件
 * • 格式驗證 - 檢查文件類型和大小
 * • 預覽列表 - 顯示待上傳文件列表
 *
 * 【支持格式】
 * • 文檔: PDF, DOCX, DOC, TXT, MD
 * • 表格: XLSX, XLS, CSV
 * • 圖片: PNG, JPG, JPEG (OCR處理)
 * • 其他: PPT, PPTX (未來支持)
 *
 * 【使用場景】
 * • 批量導入 - 初始化知識庫時批量上傳
 * • 定期更新 - 定期批量更新文檔
 * • 遷移數據 - 從其他系統遷移文檔
 *
 * 【組件特性】
 * • 拖放友好 - 直觀的拖放體驗
 * • 即時反饋 - 上傳狀態即時顯示
 * • 錯誤處理 - 清晰的錯誤提示
 * • 響應式設計 - 適配不同屏幕尺寸
 *
 * 【相關檔案】
 * • app/api/knowledge-base/bulk-upload/route.ts - 批量上傳API (Day 3-4實現)
 * • lib/parsers/ - 文件解析器 (Day 3-4實現)
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

/**
 * 文件上傳狀態
 */
type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

/**
 * 上傳文件項目介面
 */
interface UploadFileItem {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  folderId?: number | null
}

/**
 * 支持的文件類型配置
 */
const SUPPORTED_FILE_TYPES = {
  // 文檔
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],

  // 表格
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],

  // 圖片 (OCR)
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

/**
 * 最大文件大小 (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * 批量上傳組件屬性
 */
export interface BulkUploadProps {
  /** 預設資料夾ID */
  defaultFolderId?: number | null
  /** 上傳完成回調 */
  onUploadComplete?: (files: UploadFileItem[]) => void
  /** 關閉回調 */
  onClose?: () => void
}

/**
 * 批量文件上傳組件
 *
 * Day 1: 基礎UI框架和拖放功能
 * Day 3-4: 實現文件解析和批量處理
 *
 * @example
 * ```tsx
 * <BulkUpload
 *   defaultFolderId={123}
 *   onUploadComplete={(files) => console.log('Uploaded:', files)}
 * />
 * ```
 */
export function BulkUpload({
  defaultFolderId,
  onUploadComplete,
  onClose,
}: BulkUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  /**
   * 處理文件選擇
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFileItem[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
      folderId: defaultFolderId,
    }))

    setUploadFiles((prev) => [...prev, ...newFiles])
  }, [defaultFolderId])

  /**
   * 配置 react-dropzone
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  /**
   * 移除文件
   */
  const removeFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  /**
   * 開始上傳
   * Day 3-4 將實現完整的上傳邏輯
   */
  const startUpload = async () => {
    setIsUploading(true)

    // TODO Day 3-4: 實現批量上傳邏輯
    // 1. 解析文件內容
    // 2. 生成嵌入向量
    // 3. 上傳到服務器
    // 4. 更新進度

    // 模擬上傳進度 (Day 1 展示)
    for (const file of uploadFiles) {
      if (file.status === 'pending') {
        // 模擬上傳
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'uploading' as UploadStatus }
              : f
          )
        )

        // 模擬進度
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'success' as UploadStatus, progress: 100 }
              : f
          )
        )
      }
    }

    setIsUploading(false)

    if (onUploadComplete) {
      onUploadComplete(uploadFiles)
    }
  }

  /**
   * 獲取文件類型圖標
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️'
    }
    if (file.type.includes('pdf')) {
      return '📄'
    }
    if (file.type.includes('word')) {
      return '📝'
    }
    if (file.type.includes('excel') || file.type.includes('csv')) {
      return '📊'
    }
    return '📄'
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * 獲取狀態圖標
   */
  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      case 'uploading':
        return (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        )
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const hasFiles = uploadFiles.length > 0
  const canUpload = hasFiles && !isUploading && uploadFiles.some((f) => f.status === 'pending')

  return (
    <div className="space-y-6">
      {/* 拖放區域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm font-medium text-gray-900">
          {isDragActive ? '放開以上傳文件' : '拖放文件到這裡，或點擊選擇'}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          支持: PDF, Word, Excel, CSV, TXT, MD, PNG, JPG (最大 50MB)
        </p>
      </div>

      {/* 文件列表 */}
      {hasFiles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              待上傳文件 ({uploadFiles.length})
            </h3>
            {canUpload && (
              <button
                onClick={startUpload}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                開始上傳
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50"
              >
                {/* 文件圖標 */}
                <div className="flex-shrink-0 text-2xl">
                  {getFileIcon(uploadFile.file)}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    {getStatusIcon(uploadFile.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </p>

                  {/* 進度條 */}
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}

                  {/* 錯誤信息 */}
                  {uploadFile.error && (
                    <p className="mt-1 text-xs text-red-600">
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                {/* 移除按鈕 */}
                {uploadFile.status === 'pending' && (
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              批量上傳說明
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>文檔將自動解析並生成嵌入向量</li>
                <li>圖片將使用 OCR 技術提取文字</li>
                <li>Excel/CSV 將轉換為結構化數據</li>
                <li>上傳完成後可在知識庫中查看和搜索</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
