import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { KnowledgeDocumentEdit } from '@/components/knowledge/knowledge-document-edit'

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

describe('KnowledgeDocumentEdit', () => {
  const mockDocument = {
    id: 1,
    title: '測試文檔',
    content: '這是測試文檔的內容',
    category: 'GENERAL',
    status: 'ACTIVE',
    author: '測試作者',
    tags: [
      {
        id: 1,
        name: '測試',
        color: '#3B82F6'
      },
      {
        id: 2,
        name: '重要',
        color: '#EF4444'
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<KnowledgeDocumentEdit documentId={1} />)

    expect(screen.getByText('載入中...')).toBeInTheDocument()
  })

  it('loads and displays document data in form', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('這是測試文檔的內容')).toBeInTheDocument()
    expect(screen.getByDisplayValue('測試作者')).toBeInTheDocument()
    expect(screen.getByDisplayValue('測試, 重要')).toBeInTheDocument()

    // Check select values
    const categorySelect = screen.getByDisplayValue('一般')
    expect(categorySelect).toBeInTheDocument()

    const statusSelect = screen.getByDisplayValue('啟用')
    expect(statusSelect).toBeInTheDocument()
  })

  it('renders error state when document load fails', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument()
    })

    expect(screen.getByText('文檔不存在或已被刪除')).toBeInTheDocument()
  })

  it('calls fetch with correct parameters on load', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentEdit documentId={123} />)

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

  it('handles form input changes', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue('測試文檔')
    fireEvent.change(titleInput, { target: { value: '更新後的文檔標題' } })
    expect(screen.getByDisplayValue('更新後的文檔標題')).toBeInTheDocument()

    const contentInput = screen.getByDisplayValue('這是測試文檔的內容')
    fireEvent.change(contentInput, { target: { value: '更新後的內容' } })
    expect(screen.getByDisplayValue('更新後的內容')).toBeInTheDocument()

    const authorInput = screen.getByDisplayValue('測試作者')
    fireEvent.change(authorInput, { target: { value: '新作者' } })
    expect(screen.getByDisplayValue('新作者')).toBeInTheDocument()

    const tagsInput = screen.getByDisplayValue('測試, 重要')
    fireEvent.change(tagsInput, { target: { value: '新標籤, 更新' } })
    expect(screen.getByDisplayValue('新標籤, 更新')).toBeInTheDocument()
  })

  it('validates required fields before submission', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    // Clear the title
    const titleInput = screen.getByDisplayValue('測試文檔')
    fireEvent.change(titleInput, { target: { value: '   ' } }) // spaces only

    // Try to submit
    const saveButton = screen.getByText('保存變更')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('標題不能為空')).toBeInTheDocument()
    })

    // Should not make PUT request
    expect(fetch).toHaveBeenCalledTimes(1) // Only the initial GET request
  })

  it('submits form data correctly', async () => {
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
          data: { ...mockDocument, title: '更新後的標題' },
          message: 'Document updated successfully'
        })
      })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    // Update form fields
    const titleInput = screen.getByDisplayValue('測試文檔')
    fireEvent.change(titleInput, { target: { value: '更新後的標題' } })

    const contentInput = screen.getByDisplayValue('這是測試文檔的內容')
    fireEvent.change(contentInput, { target: { value: '更新後的內容' } })

    const categorySelect = screen.getByDisplayValue('一般')
    fireEvent.change(categorySelect, { target: { value: 'TECHNICAL_DOC' } })

    const statusSelect = screen.getByDisplayValue('啟用')
    fireEvent.change(statusSelect, { target: { value: 'DRAFT' } })

    const authorInput = screen.getByDisplayValue('測試作者')
    fireEvent.change(authorInput, { target: { value: '新作者' } })

    const tagsInput = screen.getByDisplayValue('測試, 重要')
    fireEvent.change(tagsInput, { target: { value: '新標籤, 更新, 重要' } })

    // Submit the form
    const saveButton = screen.getByText('保存變更')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/knowledge-base/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          title: '更新後的標題',
          content: '更新後的內容',
          category: 'TECHNICAL_DOC',
          status: 'DRAFT',
          author: '新作者',
          tags: ['新標籤', '更新', '重要']
        })
      })
    })

    await waitFor(() => {
      expect(screen.getByText('文檔更新成功！')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles form submission errors', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockDocument
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: '更新失敗：重複的標題'
        })
      })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    // Submit the form
    const saveButton = screen.getByText('保存變更')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('更新失敗：重複的標題')).toBeInTheDocument()
    })
  })

  it('navigates to document view on cancel', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDocument
      })
    })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/knowledge/1')
  })

  it('processes tags correctly', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockDocument, tags: [] }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockDocument
        })
      })

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // Empty tags field
    })

    // Enter tags with various formatting
    const tagsInput = screen.getByDisplayValue('')
    fireEvent.change(tagsInput, {
      target: { value: '  標籤一 , 標籤二,   標籤三  ,   ,  標籤四  ' }
    })

    // Submit the form
    const saveButton = screen.getByText('保存變更')
    fireEvent.click(saveButton)

    await waitFor(() => {
      const lastCall = (fetch as jest.Mock).mock.calls[1]
      const requestBody = JSON.parse(lastCall[1].body)

      // Should clean up tags and remove empty ones
      expect(requestBody.tags).toEqual(['標籤一', '標籤二', '標籤三', '標籤四'])
    })
  })

  it('shows loading state during form submission', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockDocument
        })
      })
      .mockImplementation(() => new Promise(() => {})) // Never resolves for submit

    render(<KnowledgeDocumentEdit documentId={1} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('測試文檔')).toBeInTheDocument()
    })

    // Submit the form
    const saveButton = screen.getByText('保存變更')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument()
    })

    // Cancel and submit buttons should be disabled
    expect(screen.getByText('取消')).toBeDisabled()
    expect(screen.getByText('保存中...')).toBeDisabled()
  })
})