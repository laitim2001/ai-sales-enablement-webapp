/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫文檔上傳組件 (/components/knowledge/knowledge-base-upload.tsx)================================================================【組件功能】提供知識庫文檔的上傳功能，支持拖拽上傳、文件選擇、進度追蹤、並行上傳、文件驗證、頁面設定和上傳結果管理，支持多種文件格式和自動處理。【主要職責】• 文件選擇 - 支持拖拽和點擊選擇文件• 文件驗證 - 檢查文件類型、大小和重複性• 上傳管理 - 管理上傳隊列和進度追蹤• 進度顯示 - 實時顯示每個文件的上傳進度• 狀態管理 - 追蹤上傳狀態(待處理、上傳中、成功、失敗)• 錯誤處理 - 顯示詳細的錯誤訊息和失敗原因• 結果導航 - 上傳成功後提供查看和返回功能• 設定管理 - 管理文檔類別、標籤和作者設定【Props介面】• 無Props - 這是一個獨立的上傳組件，不需要外部傳入參數【狀態管理】• files - UploadFile[] - 上傳文件列表  - id: string - 唯一識別碼  - file: File - 海覽器File物件  - status: 'pending' | 'uploading' | 'success' | 'error' - 上傳狀態  - progress: number - 上傳進度(0-100)  - error?: string - 錯誤訊息  - uploadedId?: number - 上傳後的文檔ID• category - string - 選中的文檔類別• tags - string - 標籤字符串• author - string - 作者資訊• isDragging - boolean - 拖拽狀態【用戶互動】• 拖拽上傳 - 支持文件拖拽到上傳區域• 點擊選擇 - 點擊上傳區域選擇文件• 文件移除 - 單獨移除列表中的文件• 設定調整 - 修改類別、標籤和作者設定• 上傳控制 - 啟動和暫停上傳操作• 結果導航 - 查看或返回知識庫【渲染邏輯】• 上傳區域 - 拖拽式文件選擇區域• 設定選項 - 文檔類別、標籤和作者設定• 文件列表 - 顯示待上傳和已上傳文件• 進度顯示 - 單個文件的上傳進度和狀態• 操作按鈕 - 上傳、查看和返回按鈕【Hook使用】• useState - 管理文件列表和設定狀態• useCallback - 優化事件處理器性能• useRouter - 用於頁面跳轉和導航【副作用處理】• 文件上傳 - 使用XMLHttpRequest追蹤上傳進度• 進度更新 - 實時更新上傳進度狀態• 錯誤處理 - 捕獲和顯示上傳錯誤• 成功處理 - 更新成功狀態和文檔ID【相關檔案】• /api/knowledge-base/upload - 文件上傳API端點• /components/ui/button.tsx - 按鈕組件• /app/dashboard/knowledge/upload/page.tsx - 父頁面組件【開發注意】• 文件驗證 - 在前端和後端都進行完整的文件驗證• 進度追蹤 - 使用XMLHttpRequest支持上傳進度追蹤• 性能優化 - 支持並行上傳多個文件• 用戶體驗 - 提供直覺的拖拽上傳介面• 錯誤復原 - 上傳失敗的文件可以重新上傳• 資源管理 - 適當清理記憶體和事件監聽器
 * @module components/knowledge/knowledge-base-upload
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫文檔上傳組件 (/components/knowledge/knowledge-base-upload.tsx)================================================================【組件功能】提供知識庫文檔的上傳功能，支持拖拽上傳、文件選擇、進度追蹤、並行上傳、文件驗證、頁面設定和上傳結果管理，支持多種文件格式和自動處理。【主要職責】• 文件選擇 - 支持拖拽和點擊選擇文件• 文件驗證 - 檢查文件類型、大小和重複性• 上傳管理 - 管理上傳隊列和進度追蹤• 進度顯示 - 實時顯示每個文件的上傳進度• 狀態管理 - 追蹤上傳狀態(待處理、上傳中、成功、失敗)• 錯誤處理 - 顯示詳細的錯誤訊息和失敗原因• 結果導航 - 上傳成功後提供查看和返回功能• 設定管理 - 管理文檔類別、標籤和作者設定【Props介面】• 無Props - 這是一個獨立的上傳組件，不需要外部傳入參數【狀態管理】• files - UploadFile[] - 上傳文件列表  - id: string - 唯一識別碼  - file: File - 海覽器File物件  - status: 'pending' | 'uploading' | 'success' | 'error' - 上傳狀態  - progress: number - 上傳進度(0-100)  - error?: string - 錯誤訊息  - uploadedId?: number - 上傳後的文檔ID• category - string - 選中的文檔類別• tags - string - 標籤字符串• author - string - 作者資訊• isDragging - boolean - 拖拽狀態【用戶互動】• 拖拽上傳 - 支持文件拖拽到上傳區域• 點擊選擇 - 點擊上傳區域選擇文件• 文件移除 - 單獨移除列表中的文件• 設定調整 - 修改類別、標籤和作者設定• 上傳控制 - 啟動和暫停上傳操作• 結果導航 - 查看或返回知識庫【渲染邏輯】• 上傳區域 - 拖拽式文件選擇區域• 設定選項 - 文檔類別、標籤和作者設定• 文件列表 - 顯示待上傳和已上傳文件• 進度顯示 - 單個文件的上傳進度和狀態• 操作按鈕 - 上傳、查看和返回按鈕【Hook使用】• useState - 管理文件列表和設定狀態• useCallback - 優化事件處理器性能• useRouter - 用於頁面跳轉和導航【副作用處理】• 文件上傳 - 使用XMLHttpRequest追蹤上傳進度• 進度更新 - 實時更新上傳進度狀態• 錯誤處理 - 捕獲和顯示上傳錯誤• 成功處理 - 更新成功狀態和文檔ID【相關檔案】• /api/knowledge-base/upload - 文件上傳API端點• /components/ui/button.tsx - 按鈕組件• /app/dashboard/knowledge/upload/page.tsx - 父頁面組件【開發注意】• 文件驗證 - 在前端和後端都進行完整的文件驗證• 進度追蹤 - 使用XMLHttpRequest支持上傳進度追蹤• 性能優化 - 支持並行上傳多個文件• 用戶體驗 - 提供直覺的拖拽上傳介面• 錯誤復原 - 上傳失敗的文件可以重新上傳• 資源管理 - 適當清理記憶體和事件監聽器
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

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
  uploadedId?: number
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

  /**
   * 計算文件的SHA-256 hash值
   */
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  /**
   * 檢查文件是否已存在於知識庫
   */
  const checkDuplicate = async (file: File): Promise<{ exists: boolean; file?: any; message?: string }> => {
    try {
      const fileHash = await calculateFileHash(file)

      const response = await fetch('/api/knowledge-base/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          fileHash,
          fileName: file.name
        })
      })

      const result = await response.json()

      if (result.success && result.data) {
        return {
          exists: result.data.exists,
          file: result.data.file,
          message: result.data.message
        }
      }

      return { exists: false }
    } catch (error) {
      console.error('Duplicate check failed:', error)
      // 檢查失敗不應阻止流程，返回不存在
      return { exists: false }
    }
  }

  const addFiles = useCallback(async (newFiles: File[]) => {
    const maxSize = 10 * 1024 * 1024 // 10MB

    // 處理每個文件（包含異步重複檢查）
    const uploadFilesPromises = newFiles.map(async (file) => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      let status: 'pending' | 'error' = 'pending'
      let error: string | undefined

      // 檢查文件類型
      if (!supportedTypes.includes(fileExtension)) {
        status = 'error'
        error = `不支援的檔案類型: ${fileExtension}`
      }
      // 檢查文件大小
      else if (file.size > maxSize) {
        status = 'error'
        error = `檔案大小超過 10MB 限制 (${(file.size / 1024 / 1024).toFixed(1)}MB)`
      }
      // 檢查列表中的重複文件
      else {
        setFiles(prev => {
          const existingFile = prev.find(f => f.file.name === file.name && f.file.size === file.size)
          if (existingFile) {
            status = 'error'
            error = '檔案已存在於列表中'
          }
          return prev
        })

        // 如果基本驗證通過，檢查知識庫中是否存在
        if (status === 'pending') {
          const duplicateCheck = await checkDuplicate(file)
          if (duplicateCheck.exists && duplicateCheck.file) {
            status = 'error'
            const uploadedAt = new Date(duplicateCheck.file.uploadedAt).toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
            error = `檔案已存在於知識庫中 (上傳時間: ${uploadedAt}, 上傳者: ${duplicateCheck.file.uploadedBy})`
          }
        }
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status,
        progress: 0,
        error
      }
    })

    // 等待所有文件處理完成
    const uploadFiles = await Promise.all(uploadFilesPromises)

    setFiles(prev => [...prev, ...uploadFiles])
  }, [])

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
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [addFiles])

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

      // 文件類型驗證
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!supportedTypes.includes(fileExtension)) {
        throw new Error(`不支援的檔案類型: ${fileExtension}`)
      }

      // 文件大小驗證 (10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('檔案大小超過 10MB 限制')
      }

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

      // 創建 XMLHttpRequest 來追蹤進度
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // 監聽上傳進度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, progress }
                : f
            ))
          }
        })

        // 監聽完成
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)

              // 上傳成功
              setFiles(prev => prev.map(f =>
                f.id === uploadFile.id
                  ? { ...f, status: 'success', progress: 100, uploadedId: response.data.id }
                  : f
              ))

              resolve()
            } catch (error) {
              reject(new Error('回應格式錯誤'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || '上傳失敗'))
            } catch {
              reject(new Error(`上傳失敗 (HTTP ${xhr.status})`))
            }
          }
        })

        // 監聽錯誤
        xhr.addEventListener('error', () => {
          reject(new Error('網路連接錯誤'))
        })

        // 監聽取消
        xhr.addEventListener('abort', () => {
          reject(new Error('上傳被取消'))
        })

        // 發送請求
        xhr.open('POST', '/api/knowledge-base/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth-token')}`)
        xhr.send(formData)
      })

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
      throw error
    }
  }

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')

    if (pendingFiles.length === 0) return

    try {
      // 並行上傳所有檔案
      await Promise.all(pendingFiles.map(uploadFile))
    } catch (error) {
      console.error('Some files failed to upload:', error)
      // 即使有文件上傳失敗，也不影響其他文件的上傳狀態
    }
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
  const isUploading = files.some(f => f.status === 'uploading')
  const successfulUploads = files.filter(f => f.status === 'success')
  const hasErrors = files.some(f => f.status === 'error')

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
        <div className="text-sm text-gray-500 space-y-1">
          {files.length > 0 && (
            <div>
              {files.length} 個檔案
              {successfulUploads.length > 0 && (
                <span className="text-green-600 ml-2">
                  ({successfulUploads.length} 上傳成功)
                </span>
              )}
              {hasErrors && (
                <span className="text-red-600 ml-2">
                  ({files.filter(f => f.status === 'error').length} 失敗)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {allCompleted && successfulUploads.length > 0 && (
            <>
              {successfulUploads.length === 1 && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/knowledge/${successfulUploads[0].uploadedId}`)}
                >
                  查看文檔
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/knowledge')}
              >
                返回知識庫
              </Button>
            </>
          )}

          <Button
            onClick={uploadAllFiles}
            disabled={!canUpload || isUploading}
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            {isUploading ? '上傳中...' : '開始上傳'}
          </Button>
        </div>
      </div>
    </div>
  )
}