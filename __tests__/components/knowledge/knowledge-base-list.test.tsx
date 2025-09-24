import { render, screen, waitFor } from '@testing-library/react'
import { KnowledgeBaseList } from '@/components/knowledge/knowledge-base-list'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('KnowledgeBaseList', () => {
  const defaultFilters = {
    page: 1,
    limit: 20,
    sort: 'updated_at',
    order: 'desc' as 'desc'
  }

  const mockData = {
    success: true,
    data: [
      {
        id: 1,
        title: '測試文檔',
        category: 'GENERAL',
        status: 'ACTIVE',
        author: '測試作者',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        creator: {
          id: 1,
          first_name: '測試',
          last_name: '用戶'
        },
        tags: [
          {
            id: 1,
            name: '測試',
            color: '#3B82F6'
          }
        ],
        _count: {
          chunks: 5
        }
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<KnowledgeBaseList filters={defaultFilters} />)

    expect(screen.getByText('載入中...')).toBeInTheDocument()
  })

  it('renders knowledge base items when data is loaded', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    })

    render(<KnowledgeBaseList filters={defaultFilters} />)

    await waitFor(() => {
      expect(screen.getByText('測試文檔')).toBeInTheDocument()
    })

    expect(screen.getByText('測試 用戶')).toBeInTheDocument()
    expect(screen.getByText('測試')).toBeInTheDocument() // tag
    expect(screen.getByText('5 個片段')).toBeInTheDocument()
    expect(screen.getByText('一般')).toBeInTheDocument() // category
  })

  it('renders empty state when no data', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })
    })

    render(<KnowledgeBaseList filters={defaultFilters} />)

    await waitFor(() => {
      expect(screen.getByText('沒有找到文檔')).toBeInTheDocument()
    })

    expect(screen.getByText('嘗試調整搜索條件或上傳新的文檔')).toBeInTheDocument()
  })

  it('renders error state when fetch fails', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<KnowledgeBaseList filters={defaultFilters} />)

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument()
    })
  })

  it('calls fetch with correct parameters', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    })

    const filters = {
      page: 2,
      limit: 10,
      category: 'PRODUCT_SPEC',
      status: 'ACTIVE',
      search: '測試搜索',
      sort: 'title',
      order: 'asc' as 'asc'
    }

    render(<KnowledgeBaseList filters={filters} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/knowledge-base?page=2&limit=10&category=PRODUCT_SPEC&status=ACTIVE&search=%E6%B8%AC%E8%A9%A6%E6%90%9C%E7%B4%A2&sort=title&order=asc',
        {
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      )
    })
  })

  it('renders pagination when there are multiple pages', async () => {
    const paginatedData = {
      ...mockData,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        pages: 3
      }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedData
    })

    render(<KnowledgeBaseList filters={defaultFilters} />)

    await waitFor(() => {
      expect(screen.getByText('第 1 頁，共 3 頁')).toBeInTheDocument()
    })

    expect(screen.getByText('顯示第 1 到 1 項，共 50 項')).toBeInTheDocument()
  })

  it('renders status badges with correct styling', async () => {
    const dataWithDifferentStatus = {
      ...mockData,
      data: [{
        ...mockData.data[0],
        status: 'DRAFT'
      }]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithDifferentStatus
    })

    render(<KnowledgeBaseList filters={defaultFilters} />)

    await waitFor(() => {
      const badge = screen.getByText('草稿')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-blue-700')
    })
  })
})