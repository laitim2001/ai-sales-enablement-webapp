import { TestHelper } from '../__tests__/utils/test-helpers'
import { DocumentCategory, DocumentStatus, ProcessingStatus, ProcessingType } from '@prisma/client'

const testHelper = new TestHelper()

describe('Knowledge Base API Tests', () => {
  let authToken: string
  let testKnowledgeBaseId: number
  let testTagId: number

  beforeAll(async () => {
    // 獲取認證 token
    authToken = await testHelper.getAuthToken()
  })

  describe('GET /api/knowledge-base', () => {
    test('應該成功獲取知識庫列表', async () => {
      const response = await testHelper.makeRequest('/api/knowledge-base', 'GET', null, {
        Authorization: `Bearer ${authToken}`
      })

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data.pagination).toBeDefined()
      expect(response.data.pagination).toHaveProperty('page')
      expect(response.data.pagination).toHaveProperty('limit')
      expect(response.data.pagination).toHaveProperty('total')
    })

    test('應該支持分頁參數', async () => {
      const response = await testHelper.makeRequest(
        '/api/knowledge-base?page=1&limit=5',
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.pagination.page).toBe(1)
      expect(response.data.pagination.limit).toBe(5)
      expect(response.data.data.length).toBeLessThanOrEqual(5)
    })

    test('應該支持類別篩選', async () => {
      const response = await testHelper.makeRequest(
        `/api/knowledge-base?category=${DocumentCategory.GENERAL}`,
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      response.data.data.forEach((item: any) => {
        expect(item.category).toBe(DocumentCategory.GENERAL)
      })
    })

    test('應該支持搜索參數', async () => {
      const searchTerm = 'test'
      const response = await testHelper.makeRequest(
        `/api/knowledge-base?search=${searchTerm}`,
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      // 結果應該包含搜索詞或為空（如果沒有匹配項）
      if (response.data.data.length > 0) {
        response.data.data.forEach((item: any) => {
          const containsSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase()))
          expect(containsSearch).toBe(true)
        })
      }
    })

    test('未授權請求應該被拒絕', async () => {
      const response = await testHelper.makeRequest('/api/knowledge-base', 'GET')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/knowledge-base', () => {
    test('應該成功創建知識庫項目', async () => {
      const testData = {
        title: 'Test Knowledge Base Item',
        content: 'This is a test knowledge base content for API testing.',
        category: DocumentCategory.GENERAL,
        author: 'Test Author',
        language: 'zh-TW',
        tags: ['test', 'api', 'automated']
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base',
        'POST',
        testData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toBeDefined()
      expect(response.data.data.title).toBe(testData.title)
      expect(response.data.data.content).toBe(testData.content)
      expect(response.data.data.category).toBe(testData.category)
      expect(response.data.data.author).toBe(testData.author)
      expect(Array.isArray(response.data.data.tags)).toBe(true)

      // 保存 ID 供其他測試使用
      testKnowledgeBaseId = response.data.data.id
    })

    test('應該拒絕無效數據', async () => {
      const invalidData = {
        title: '', // 空標題應該被拒絕
        content: 'Test content'
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base',
        'POST',
        invalidData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(400)
      expect(response.data.success).toBe(false)
    })

    test('應該檢測重複內容', async () => {
      const duplicateData = {
        title: 'Duplicate Test',
        content: 'This is a test knowledge base content for API testing.', // 與之前相同的內容
        category: DocumentCategory.GENERAL
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base',
        'POST',
        duplicateData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('Duplicate content detected')
    })
  })

  describe('GET /api/knowledge-base/[id]', () => {
    test('應該成功獲取單個知識庫項目', async () => {
      const response = await testHelper.makeRequest(
        `/api/knowledge-base/${testKnowledgeBaseId}`,
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.id).toBe(testKnowledgeBaseId)
      expect(response.data.data.title).toBeDefined()
      expect(response.data.data.creator).toBeDefined()
      expect(Array.isArray(response.data.data.chunks)).toBe(true)
      expect(Array.isArray(response.data.data.processing_tasks)).toBe(true)
    })

    test('不存在的項目應該返回 404', async () => {
      const response = await testHelper.makeRequest(
        '/api/knowledge-base/99999',
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/knowledge-base/[id]', () => {
    test('應該成功更新知識庫項目', async () => {
      const updateData = {
        title: 'Updated Test Knowledge Base Item',
        content: 'This is updated content.',
        category: DocumentCategory.TECHNICAL_DOC,
        tags: ['updated', 'test']
      }

      const response = await testHelper.makeRequest(
        `/api/knowledge-base/${testKnowledgeBaseId}`,
        'PUT',
        updateData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(updateData.title)
      expect(response.data.data.content).toBe(updateData.content)
      expect(response.data.data.category).toBe(updateData.category)
      expect(response.data.data.version).toBeGreaterThan(1)
    })

    test('部分更新應該正常工作', async () => {
      const partialUpdate = {
        title: 'Partially Updated Title'
      }

      const response = await testHelper.makeRequest(
        `/api/knowledge-base/${testKnowledgeBaseId}`,
        'PUT',
        partialUpdate,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.data.title).toBe(partialUpdate.title)
      // 其他字段應該保持不變
      expect(response.data.data.category).toBe(DocumentCategory.TECHNICAL_DOC)
    })
  })

  describe('Knowledge Base Search API', () => {
    test('應該支持文本搜索', async () => {
      const searchData = {
        query: 'updated content',
        type: 'text',
        limit: 10
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/search',
        'POST',
        searchData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data.metadata.query).toBe(searchData.query)
      expect(response.data.metadata.search_type).toBe('text')
    })

    test('應該支持語義搜索', async () => {
      const searchData = {
        query: 'technical documentation',
        type: 'semantic',
        limit: 5,
        similarity_threshold: 0.6
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/search',
        'POST',
        searchData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.metadata.search_type).toBe('semantic')
      expect(response.data.metadata.similarity_threshold).toBe(0.6)
    })

    test('應該支持混合搜索', async () => {
      const searchData = {
        query: 'test updated',
        type: 'hybrid',
        category: DocumentCategory.TECHNICAL_DOC,
        include_chunks: true
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/search',
        'POST',
        searchData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.metadata.search_type).toBe('hybrid')
    })
  })

  describe('Knowledge Base Tags API', () => {
    test('應該成功獲取標籤列表', async () => {
      const response = await testHelper.makeRequest(
        '/api/knowledge-base/tags',
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(Array.isArray(response.data.data)).toBe(true)
    })

    test('應該成功創建新標籤', async () => {
      const tagData = {
        name: 'API Test Tag',
        description: 'Tag created by API test',
        color: '#FF5722'
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/tags',
        'POST',
        tagData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.name).toBe(tagData.name)
      expect(response.data.data.description).toBe(tagData.description)
      expect(response.data.data.color).toBe(tagData.color)

      testTagId = response.data.data.id
    })

    test('應該拒絕重複的標籤名稱', async () => {
      const duplicateTag = {
        name: 'API Test Tag', // 與上面相同的名稱
        description: 'Duplicate tag'
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/tags',
        'POST',
        duplicateTag,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('already exists')
    })

    test('應該支持層次化標籤結構', async () => {
      const childTag = {
        name: 'Child Tag',
        parent_id: testTagId
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/tags',
        'POST',
        childTag,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(201)
      expect(response.data.data.parent_id).toBe(testTagId)
    })
  })

  describe('Knowledge Base Processing API', () => {
    test('應該成功獲取處理任務列表', async () => {
      const response = await testHelper.makeRequest(
        '/api/knowledge-base/processing',
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data.stats).toBeDefined()
      expect(response.data.pagination).toBeDefined()
    })

    test('應該成功創建處理任務', async () => {
      const taskData = {
        knowledge_base_id: testKnowledgeBaseId,
        task_type: ProcessingType.VECTORIZATION,
        priority: 7
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/processing',
        'POST',
        taskData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.task_type).toBe(taskData.task_type)
      expect(response.data.data.knowledge_base_id).toBe(taskData.knowledge_base_id)
      expect(response.data.data.status).toBe(ProcessingStatus.PENDING)
    })

    test('應該拒絕重複的處理任務', async () => {
      const duplicateTask = {
        knowledge_base_id: testKnowledgeBaseId,
        task_type: ProcessingType.VECTORIZATION // 與上面相同
      }

      const response = await testHelper.makeRequest(
        '/api/knowledge-base/processing',
        'POST',
        duplicateTask,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('already in progress')
    })
  })

  describe('File Upload API', () => {
    test('應該成功獲取上傳配置', async () => {
      const response = await testHelper.makeRequest(
        '/api/knowledge-base/upload',
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.supported_mime_types).toBeDefined()
      expect(response.data.data.max_file_size).toBeDefined()
      expect(Array.isArray(response.data.data.supported_categories)).toBe(true)
    })

    test('應該成功上傳文本文件', async () => {
      // 創建測試文件
      const testContent = 'This is a test file content for upload testing.'
      const blob = new Blob([testContent], { type: 'text/plain' })
      const file = new File([blob], 'test-upload.txt', { type: 'text/plain' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('metadata', JSON.stringify({
        category: DocumentCategory.GENERAL,
        tags: ['upload-test'],
        auto_process: true
      }))

      const response = await testHelper.makeMultipartRequest(
        '/api/knowledge-base/upload',
        formData,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe('test-upload.txt')
      expect(response.data.data.mime_type).toBe('text/plain')
      expect(response.data.data.content).toBe(testContent)
    })
  })

  describe('DELETE /api/knowledge-base/[id]', () => {
    test('軟刪除應該正常工作', async () => {
      const response = await testHelper.makeRequest(
        `/api/knowledge-base/${testKnowledgeBaseId}`,
        'DELETE',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.message).toContain('moved to trash')
    })

    test('硬刪除應該正常工作', async () => {
      // 先創建一個新項目用於硬刪除測試
      const createResponse = await testHelper.makeRequest(
        '/api/knowledge-base',
        'POST',
        {
          title: 'Item for Hard Delete Test',
          content: 'This will be permanently deleted',
          category: DocumentCategory.GENERAL
        },
        { Authorization: `Bearer ${authToken}` }
      )

      const itemId = createResponse.data.data.id

      const deleteResponse = await testHelper.makeRequest(
        `/api/knowledge-base/${itemId}?hard=true`,
        'DELETE',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(deleteResponse.status).toBe(200)
      expect(deleteResponse.data.message).toContain('permanently deleted')

      // 驗證項目確實被刪除
      const getResponse = await testHelper.makeRequest(
        `/api/knowledge-base/${itemId}`,
        'GET',
        null,
        { Authorization: `Bearer ${authToken}` }
      )

      expect(getResponse.status).toBe(404)
    })
  })

  afterAll(async () => {
    // 清理測試數據
    if (testTagId) {
      await testHelper.makeRequest(
        `/api/knowledge-base/tags?force=true`,
        'DELETE',
        null,
        { Authorization: `Bearer ${authToken}` }
      )
    }
  })
})