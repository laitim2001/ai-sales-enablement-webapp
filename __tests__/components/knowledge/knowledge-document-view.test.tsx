import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { KnowledgeDocumentView } from '@/components/knowledge/knowledge-document-view'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock confirm
global.confirm = jest.fn()

describe('KnowledgeDocumentView', () => {
  const mockDocument = {
    id: 1,
    title: '測試文檔',
    content: '這是測試文檔的內容',
    category: 'GENERAL',
    status: 'ACTIVE',
    source: 'test-source',
    author: '測試作者',
    language: 'zh-TW',
    file_size: 1024,
    mime_type: 'text/plain',
    version: 1,
    processing_status: 'COMPLETED',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    creator: {
      id: 1,
      first_name: '測試',
      last_name: '用戶',
      email: 'test@example.com'
    },
    updater: {
      id: 1,
      first_name: '測試',
      last_name: '用戶',
      email: 'test@example.com'
    },
    tags: [
      {
        id: 1,
        name: '測試標籤',
        color: '#3B82F6'
      }
    ],
    chunks: [
      {
        id: 1,
        chunk_index: 0,
        content: '這是第一個分塊',
        token_count: 10,
        start_pos: 0,
        end_pos: 7
      }
    ],
    processing_tasks: [
      {
        id: 1,
        task_type: 'VECTORIZATION',
        status: 'COMPLETED',
        progress: 1.0,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:05:00Z'
      }
    ],
    _count: {
      chunks: 1
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<KnowledgeDocumentView documentId={1} />)

    expect(screen.getByText('載入中...')).toBeInTheDocument()
  })

  it('renders document details when data is loaded', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    expect(screen.getByText('測試 用戶')).toBeInTheDocument()
    expect(screen.getByText('1 KB')).toBeInTheDocument()
    expect(screen.getByText('版本 1')).toBeInTheDocument()
    expect(screen.getByText('測試標籤')).toBeInTheDocument()
  })

  it('renders error state when fetch fails', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument()
    })

    expect(screen.getByText('載入文檔失敗')).toBeInTheDocument()
  })

  it('renders not found error for 404 response', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('文檔不存在或已被刪除')).toBeInTheDocument()
    })
  })

  it('calls fetch with correct parameters', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentView documentId={123} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/knowledge-base/123',
        {
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      )
    })
  })

  it('switches between tabs correctly', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    // Should start with content tab active
    expect(screen.getByText('這是測試文檔的內容')).toBeInTheDocument()

    // Click on chunks tab
    fireEvent.click(screen.getByText('內容分塊 (1)'))
    expect(screen.getByText('這是第一個分塊')).toBeInTheDocument()
    expect(screen.getByText('分塊 #1')).toBeInTheDocument()

    // Click on processing tab
    fireEvent.click(screen.getByText('處理記錄 (1)'))
    expect(screen.getByText('VECTORIZATION')).toBeInTheDocument()
    expect(screen.getByText('進度: 100%')).toBeInTheDocument()
  })

  it('navigates to edit page when edit button is clicked', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('編輯'))

    expect(mockPush).toHaveBeenCalledWith('/dashboard/knowledge/1/edit')
  })

  it('handles delete confirmation and deletion', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockDocument
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Document deleted successfully'
        })
      })

    ;(global.confirm as jest.Mock).mockReturnValue(true)

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('刪除'))

    expect(global.confirm).toHaveBeenCalledWith('確定要刪除文檔「測試文檔」嗎？')

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/knowledge-base/1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard/knowledge')
  })

  it('cancels delete when user declines confirmation', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    ;(global.confirm as jest.Mock).mockReturnValue(false)

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('刪除'))

    expect(global.confirm).toHaveBeenCalled()

    // Should not make DELETE request
    expect(fetch).toHaveBeenCalledTimes(1) // Only the initial GET request
  })

  it('displays processing error message when present', async () => {
    const documentWithError = {
      ...mockDocument,
      processing_status: 'FAILED',
      processing_error: '處理失敗：檔案格式不支援'
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: documentWithError
      })
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    expect(screen.getByText('處理錯誤')).toBeInTheDocument()
    expect(screen.getByText('處理失敗：檔案格式不支援')).toBeInTheDocument()
  })

  it('displays correct status badges', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentView documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    expect(screen.getByText('啟用')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.getByText('一般')).toBeInTheDocument()
  })
})