/**
 * ================================================================
 * AI銷售賦能平台 - 文檔預覽組件 (/components/knowledge/document-preview.tsx)
 * ================================================================
 *
 * 【組件功能】
 * 提供多種文件格式的在線預覽功能，支持PDF、HTML、CSV、JSON、Markdown、
 * 純文字等格式，提供安全的預覽環境和下載功能，支持動態預覽類型判斷。
 *
 * 【主要職責】
 * • 預覽類型判斷 - 根據MIME類型或文件擴展名判斷預覽模式
 * • 文件內容加載 - 從API獲取文件內容進行預覽
 * • 多格式支持 - 支持文本、HTML、CSV、JSON、Markdown、PDF等格式
 * • Markdown渲染 - 將Markdown語法轉換為HTML進行顯示
 * • CSV表格解析 - 解析CSV文件為表格格式顯示
 * • 安全預覽 - HTML內容在沙盒模式下預覽
 * • 下載功能 - 提供原文件下載鏈接
 * • 錯誤處理 - 處理不支持的格式和加載錯誤
 *
 * 【Props介面】
 * • documentId - number - 文檔的唯一識別碼
 * • mimeType? - string - 文件MIME類型
 * • fileName? - string - 文件名稱(用於擴展名判斷)
 * • source? - string - 文件來源路徑
 * • content? - string - 文件內容(可直接傳入)
 *
 * 【狀態管理】
 * • preview - PreviewState - 預覽狀態物件
 *   - loading: boolean - 內容加載狀態
 *   - error: string | null - 錯誤訊息
 *   - previewData: any - 預覽數據
 *   - previewType: 'text' | 'html' | 'csv' | 'json' | 'markdown' | 'pdf' | 'unsupported' - 預覽類型
 *
 * 【用戶互動】
 * • 動態預覽 - 根據文件類型自動選擇適當的預覽模式
 * • 下載操作 - 點擊下載原文件
 * • 重新加載 - 加載失敗時提供重試功能
 * • 表格瀏覽 - CSV表格支持水平滾動瀏覽
 *
 * 【渲染邏輯】
 * • 預覽類型識別 - 標記當前預覽的文件類型
 * • 下載控制 - 顯示下載鏈接和按鈕
 * • 加載狀態 - 顯示加載動畫和進度
 * • 錯誤狀態 - 顯示錯誤訊息和重試按鈕
 * • 內容顯示 - 根據文件類型選擇合適的展示方式
 *
 * 【Hook使用】
 * • useState - 管理預覽狀態和數據
 * • useEffect - 監聆props變化並觸發預覽類型判斷
 *
 * 【副作用處理】
 * • 文件加載 - 從/api/knowledge-base/[id]/content端點獲取文件內容
 * • CSV解析 - 使用自定義解析器處理CSV格式
 * • Markdown渲染 - 使用正則表達式進行基本的Markdown轉換
 * • 錯誤處理 - 捕獲和展示網路和解析錯誤
 *
 * 【相關檔案】
 * • /api/knowledge-base/[id]/content - 文件內容獲取API端點
 * • /api/knowledge-base/[id]/download - 文件下載API端點
 * • /components/knowledge/knowledge-document-view.tsx - 父組件
 *
 * 【開發注意】
 * • 安全性 - HTML內容使用iframe沙盒模式預覽
 * • 性能優化 - 大型CSV文件只顯示前20行數據
 * • 用戶體驗 - 提供明確的錯誤訊息和操作指引
 * • 格式支持 - 根據需要擴展支持的文件格式
 * • 內容限制 - 適當限制預覽內容的長度和複雜度
 * • 記憶體管理 - 清理不需要的預覽數據和對象引用
 */

'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  CodeBracketIcon,
  TableCellsIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface DocumentPreviewProps {
  documentId: number
  mimeType?: string
  fileName?: string
  source?: string
  content?: string
}

interface PreviewState {
  loading: boolean
  error: string | null
  previewData: any
  previewType: 'text' | 'html' | 'csv' | 'json' | 'markdown' | 'pdf' | 'unsupported'
}

export function DocumentPreview({
  documentId,
  mimeType,
  fileName,
  source,
  content
}: DocumentPreviewProps) {
  const [preview, setPreview] = useState<PreviewState>({
    loading: false,
    error: null,
    previewData: null,
    previewType: 'text'
  })

  useEffect(() => {
    if (content || source) {
      determinePreviewType()
    }
  }, [content, source, mimeType, fileName])

  const determinePreviewType = () => {
    // 根據 MIME 類型或文件擴展名判斷預覽類型
    let type: PreviewState['previewType'] = 'text'

    if (mimeType) {
      if (mimeType === 'application/pdf') type = 'pdf'
      else if (mimeType === 'text/html') type = 'html'
      else if (mimeType === 'text/csv' || mimeType === 'application/csv') type = 'csv'
      else if (mimeType === 'application/json') type = 'json'
      else if (mimeType === 'text/markdown') type = 'markdown'
      else if (mimeType.startsWith('text/')) type = 'text'
      else type = 'unsupported'
    } else if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') type = 'pdf'
      else if (ext === 'html' || ext === 'htm') type = 'html'
      else if (ext === 'csv') type = 'csv'
      else if (ext === 'json') type = 'json'
      else if (ext === 'md' || ext === 'markdown') type = 'markdown'
      else if (['txt', 'doc', 'docx'].includes(ext || '')) type = 'text'
      else type = 'unsupported'
    }

    setPreview(prev => ({
      ...prev,
      previewType: type,
      previewData: content
    }))
  }

  const loadFileContent = async () => {
    if (!source || preview.loading) return

    try {
      setPreview(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch(`/api/knowledge-base/${documentId}/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('載入文件失敗')
      }

      // 根據預覽類型處理響應
      if (preview.previewType === 'json') {
        const jsonData = await response.json()
        setPreview(prev => ({
          ...prev,
          previewData: jsonData,
          loading: false
        }))
      } else if (preview.previewType === 'csv') {
        const csvText = await response.text()
        setPreview(prev => ({
          ...prev,
          previewData: parseCSV(csvText),
          loading: false
        }))
      } else {
        const text = await response.text()
        setPreview(prev => ({
          ...prev,
          previewData: text,
          loading: false
        }))
      }
    } catch (err) {
      setPreview(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : '載入失敗',
        loading: false
      }))
    }
  }

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    return lines.map(line => {
      // 簡單的 CSV 解析，處理引號和逗號
      const result: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }

      if (current) {
        result.push(current.trim())
      }

      return result
    })
  }

  const renderMarkdown = (text: string) => {
    // 簡單的 Markdown 渲染
    return text
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>')
  }

  const getPreviewIcon = () => {
    switch (preview.previewType) {
      case 'json':
        return <CodeBracketIcon className="h-5 w-5" />
      case 'csv':
        return <TableCellsIcon className="h-5 w-5" />
      case 'html':
        return <GlobeAltIcon className="h-5 w-5" />
      case 'markdown':
        return <DocumentTextIcon className="h-5 w-5" />
      default:
        return <DocumentTextIcon className="h-5 w-5" />
    }
  }

  const getPreviewTypeLabel = () => {
    switch (preview.previewType) {
      case 'json': return 'JSON 格式'
      case 'csv': return 'CSV 表格'
      case 'html': return 'HTML 網頁'
      case 'markdown': return 'Markdown 文檔'
      case 'pdf': return 'PDF 文件'
      case 'text': return '純文字'
      case 'unsupported': return '不支援預覽'
      default: return '文檔內容'
    }
  }

  const renderPreviewContent = () => {
    if (preview.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">載入預覽...</span>
        </div>
      )
    }

    if (preview.error) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{preview.error}</p>
            <button
              onClick={loadFileContent}
              className="text-blue-600 hover:underline text-sm"
            >
              重新載入
            </button>
          </div>
        </div>
      )
    }

    if (!preview.previewData && preview.previewType !== 'pdf') {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暫無內容可預覽</p>
            {source && (
              <button
                onClick={loadFileContent}
                className="inline-flex items-center text-blue-600 hover:underline text-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                載入文件內容
              </button>
            )}
          </div>
        </div>
      )
    }

    switch (preview.previewType) {
      case 'json':
        return (
          <div className="p-4">
            <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm font-mono">
              {typeof preview.previewData === 'string'
                ? preview.previewData
                : JSON.stringify(preview.previewData, null, 2)
              }
            </pre>
          </div>
        )

      case 'csv':
        const csvData = Array.isArray(preview.previewData) ? preview.previewData : parseCSV(preview.previewData || '')
        return (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {csvData[0]?.map((header: string, index: number) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(1, 21).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 21 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center border-t">
                  顯示前 20 行，共 {csvData.length - 1} 行數據
                </div>
              )}
            </div>
          </div>
        )

      case 'html':
        return (
          <div className="p-4">
            <div className="border rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b text-sm text-gray-600">
                HTML 預覽（沙盒模式）
              </div>
              <iframe
                srcDoc={preview.previewData}
                className="w-full h-96 border-0"
                sandbox="allow-same-origin"
                title="HTML 預覽"
              />
            </div>
          </div>
        )

      case 'markdown':
        const htmlContent = renderMarkdown(preview.previewData || '')
        return (
          <div className="p-4">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${htmlContent}</p>` }}
            />
          </div>
        )

      case 'pdf':
        return (
          <div className="p-4">
            <div className="border rounded-lg bg-gray-50">
              <div className="px-4 py-6 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">PDF 預覽</h3>
                <p className="text-gray-600 mb-4">
                  PDF 文件需要專門的預覽器。您可以下載文件查看完整內容。
                </p>
                {source && (
                  <a
                    href={`/api/knowledge-base/${documentId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    下載 PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        )

      case 'unsupported':
        return (
          <div className="p-4">
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">不支援預覽</h3>
              <p className="text-gray-600 mb-4">
                此文件類型暫不支援在線預覽
              </p>
              {source && (
                <a
                  href={`/api/knowledge-base/${documentId}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  下載文件
                </a>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
              {preview.previewData}
            </pre>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* 預覽類型標識 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {getPreviewIcon()}
          <span>{getPreviewTypeLabel()}</span>
        </div>

        {source && (
          <div className="flex items-center space-x-2">
            <a
              href={`/api/knowledge-base/${documentId}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              下載原文件
            </a>
          </div>
        )}
      </div>

      {/* 預覽內容 */}
      <div className="border border-gray-200 rounded-lg bg-white">
        {renderPreviewContent()}
      </div>
    </div>
  )
}