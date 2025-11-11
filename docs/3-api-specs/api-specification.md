# API 規格文檔 - AI 銷售賦能平台

**版本**: 1.0.0
**日期**: 2024-01-09
**架構**: Next.js 14 App Router + Server Actions + tRPC

---

## 📋 概述

本文檔定義了 AI 銷售賦能平台的 API 接口規格。基於 Next.js 14 全棧架構，採用 Server Actions 和 tRPC 提供類型安全的 API。

### 技術架構

- **前端**: Next.js 14 App Router + React Server Components
- **API 層**: Server Actions + tRPC Router
- **認證**: NextAuth.js with JWT
- **數據庫**: Prisma ORM + PostgreSQL + pgvector
- **AI 服務**: Azure OpenAI API

### API 設計原則

1. **類型安全**: 全棧 TypeScript，端到端類型檢查
2. **性能優先**: Server Components 減少客戶端 JavaScript
3. **安全第一**: 所有敏感操作需要認證和授權
4. **錯誤處理**: 統一的錯誤格式和處理機制

---

## 🔐 認證與授權

### 認證方式

```typescript
// 使用 NextAuth.js
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'

// Server Action 中的認證檢查
async function authenticatedAction() {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
```

### 用戶角色

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  SALES_MANAGER = 'SALES_MANAGER',
  SALES_REP = 'SALES_REP',
  MARKETING = 'MARKETING',
  VIEWER = 'VIEWER'
}
```

### 權限檢查

```typescript
// 權限裝飾器
function requireRole(role: UserRole) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // 權限檢查邏輯
  }
}
```

---

## 📊 API 端點規格

### 1. 用戶管理 API

#### 1.1 取得當前用戶資料

**Server Action**: `getCurrentUser`

```typescript
// app/actions/user.ts
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      department: true,
      is_active: true
    }
  })
}
```

**使用方式**:
```typescript
// 在 Server Component 中
import { getCurrentUser } from '@/app/actions/user'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  return <div>Hello {user?.first_name}</div>
}
```

#### 1.2 更新用戶資料

**Server Action**: `updateUserProfile`

```typescript
type UpdateUserInput = {
  first_name?: string
  last_name?: string
  department?: string
}

export async function updateUserProfile(
  data: UpdateUserInput
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
        updated_at: new Date()
      }
    })

    return { success: true, user }
  } catch (error) {
    return { success: false, error: 'Update failed' }
  }
}
```

### 2. 知識庫 API

#### 2.1 AI 智能搜索

**Server Action**: `searchKnowledge`

```typescript
type SearchKnowledgeInput = {
  query: string
  limit?: number
  filters?: {
    category?: string[]
    dateRange?: { from: Date; to: Date }
  }
}

type SearchResult = {
  id: string
  title: string
  content: string
  similarity: number
  metadata: Record<string, any>
}

export async function searchKnowledge(
  input: SearchKnowledgeInput
): Promise<{ results: SearchResult[]; totalCount: number }> {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  // 1. 生成查詢向量
  const embedding = await generateEmbedding(input.query)

  // 2. 向量搜索
  const results = await prisma.$queryRaw`
    SELECT id, title, content, metadata,
           1 - (embedding <=> ${embedding}::vector) as similarity
    FROM knowledge_base
    WHERE 1 - (embedding <=> ${embedding}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT ${input.limit || 10}
  `

  return {
    results: results as SearchResult[],
    totalCount: results.length
  }
}
```

#### 2.2 上傳知識文檔

**Server Action**: `uploadDocument`

```typescript
type UploadDocumentInput = {
  title: string
  content: string
  category: string
  file?: File
}

export async function uploadDocument(
  formData: FormData
): Promise<{ success: boolean; document?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { success: false, error: 'Unauthorized' }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string

    // 生成 embedding
    const embedding = await generateEmbedding(content)

    const document = await prisma.document.create({
      data: {
        title,
        content,
        category: category as DocumentType,
        embedding,
        created_at: new Date()
      }
    })

    return { success: true, document }
  } catch (error) {
    return { success: false, error: 'Upload failed' }
  }
}
```

### 3. CRM 整合 API

#### 3.1 同步客戶資料

**Server Action**: `syncCustomersFromCRM`

```typescript
export async function syncCustomersFromCRM(): Promise<{
  success: boolean
  syncedCount?: number
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { success: false, error: 'Unauthorized' }

    // 檢查用戶權限
    if (!['ADMIN', 'SALES_MANAGER'].includes(session.user.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 連接 Dynamics 365 API
    const crmClient = new Dynamics365Client()
    const customers = await crmClient.getAccounts()

    let syncedCount = 0
    for (const crmCustomer of customers) {
      await prisma.customer.upsert({
        where: { crm_id: crmCustomer.accountid },
        update: {
          company_name: crmCustomer.name,
          email: crmCustomer.emailaddress1,
          phone: crmCustomer.telephone1,
          industry: crmCustomer.industrycode,
          updated_at: new Date()
        },
        create: {
          crm_id: crmCustomer.accountid,
          company_name: crmCustomer.name,
          email: crmCustomer.emailaddress1,
          phone: crmCustomer.telephone1,
          industry: crmCustomer.industrycode,
          status: 'PROSPECT'
        }
      })
      syncedCount++
    }

    return { success: true, syncedCount }
  } catch (error) {
    return { success: false, error: 'Sync failed' }
  }
}
```

#### 3.2 取得客戶 360 度視圖

**Server Action**: `getCustomer360View`

```typescript
type Customer360View = {
  customer: Customer
  callRecords: CallRecord[]
  proposals: Proposal[]
  interactions: Interaction[]
  aiInsights?: {
    nextBestAction: string
    riskScore: number
    opportunityScore: number
  }
}

export async function getCustomer360View(
  customerId: string
): Promise<Customer360View | null> {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(customerId) },
    include: {
      callRecords: {
        orderBy: { call_date: 'desc' },
        take: 10
      },
      proposals: {
        orderBy: { created_at: 'desc' },
        take: 5
      },
      interactions: {
        orderBy: { created_at: 'desc' },
        take: 20
      }
    }
  })

  if (!customer) return null

  // 生成 AI 洞察
  const aiInsights = await generateCustomerInsights(customer)

  return {
    customer,
    callRecords: customer.callRecords,
    proposals: customer.proposals,
    interactions: customer.interactions,
    aiInsights
  }
}
```

### 4. AI 提案生成 API

#### 4.1 生成提案草稿

**Server Action**: `generateProposal`

```typescript
type GenerateProposalInput = {
  customerId: string
  templateId?: string
  requirements: string
  targetValue?: number
}

export async function generateProposal(
  input: GenerateProposalInput
): Promise<{ success: boolean; proposal?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { success: false, error: 'Unauthorized' }

    // 取得客戶資料
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(input.customerId) }
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    // 取得提案模板
    const template = input.templateId
      ? await prisma.proposalTemplate.findUnique({
          where: { id: input.templateId }
        })
      : null

    // 構建 AI prompt
    const prompt = buildProposalPrompt({
      customer,
      template,
      requirements: input.requirements
    })

    // 調用 Azure OpenAI
    const aiResponse = await generateContent(prompt)

    // 創建提案記錄
    const proposal = await prisma.proposal.create({
      data: {
        customer_id: parseInt(input.customerId),
        user_id: session.user.id,
        title: `提案給 ${customer.company_name}`,
        description: aiResponse.content,
        status: 'DRAFT',
        total_value: input.targetValue,
        version: 1
      }
    })

    return { success: true, proposal }
  } catch (error) {
    return { success: false, error: 'Generation failed' }
  }
}
```

---

## 🔄 tRPC Router 配置

### Router 定義

```typescript
// lib/trpc/router.ts
import { router, protectedProcedure } from './trpc'
import { z } from 'zod'

export const appRouter = router({
  // 用戶相關路由
  user: router({
    getCurrent: protectedProcedure
      .query(async ({ ctx }) => {
        return getCurrentUser()
      }),

    update: protectedProcedure
      .input(z.object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        department: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return updateUserProfile(input)
      })
  }),

  // 知識庫相關路由
  knowledge: router({
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().default(10)
      }))
      .query(async ({ input }) => {
        return searchKnowledge(input)
      }),

    upload: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string()
      }))
      .mutation(async ({ input }) => {
        // 轉換為 FormData 格式
        const formData = new FormData()
        formData.append('title', input.title)
        formData.append('content', input.content)
        formData.append('category', input.category)

        return uploadDocument(formData)
      })
  }),

  // CRM 相關路由
  crm: router({
    syncCustomers: protectedProcedure
      .mutation(async () => {
        return syncCustomersFromCRM()
      }),

    getCustomer360: protectedProcedure
      .input(z.object({
        customerId: z.string()
      }))
      .query(async ({ input }) => {
        return getCustomer360View(input.customerId)
      })
  }),

  // AI 提案相關路由
  proposal: router({
    generate: protectedProcedure
      .input(z.object({
        customerId: z.string(),
        templateId: z.string().optional(),
        requirements: z.string(),
        targetValue: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        return generateProposal(input)
      })
  })
})

export type AppRouter = typeof appRouter
```

### 客戶端使用

```typescript
// 在 React 組件中使用 tRPC
'use client'

import { trpc } from '@/lib/trpc/client'

export function KnowledgeSearch() {
  const [query, setQuery] = useState('')

  const searchMutation = trpc.knowledge.search.useMutation()

  const handleSearch = async () => {
    const results = await searchMutation.mutateAsync({
      query,
      limit: 10
    })
    console.log(results)
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索知識庫..."
      />
      <button onClick={handleSearch}>
        搜索
      </button>

      {searchMutation.data?.results.map(result => (
        <div key={result.id}>
          <h3>{result.title}</h3>
          <p>{result.content}</p>
          <span>相似度: {result.similarity}</span>
        </div>
      ))}
    </div>
  )
}
```

---

## 📊 錯誤處理

### 統一錯誤格式

```typescript
type APIError = {
  success: false
  error: string
  code?: string
  details?: Record<string, any>
}

type APISuccess<T> = {
  success: true
  data: T
}

type APIResponse<T> = APISuccess<T> | APIError
```

### 錯誤處理中介軟體

```typescript
// lib/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new APIError('資料重複', 'DUPLICATE_ENTRY', 400)
      case 'P2025':
        return new APIError('資料不存在', 'NOT_FOUND', 404)
      default:
        return new APIError('資料庫錯誤', 'DATABASE_ERROR', 500)
    }
  }

  return new APIError('未知錯誤', 'UNKNOWN_ERROR', 500)
}
```

---

## 🔍 API 測試

### 單元測試範例

```typescript
// __tests__/api/knowledge.test.ts
import { searchKnowledge } from '@/app/actions/knowledge'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => ({
    user: { id: '1', role: 'SALES_REP' }
  }))
}))

describe('Knowledge API', () => {
  test('should search knowledge base successfully', async () => {
    const result = await searchKnowledge({
      query: 'Docuware 功能',
      limit: 5
    })

    expect(result.results).toBeDefined()
    expect(result.results.length).toBeLessThanOrEqual(5)
    expect(result.results[0]).toHaveProperty('similarity')
  })

  test('should require authentication', async () => {
    // Mock unauthorized session
    jest.mocked(getServerSession).mockResolvedValueOnce(null)

    await expect(searchKnowledge({
      query: 'test'
    })).rejects.toThrow('Unauthorized')
  })
})
```

### 整合測試

```typescript
// __tests__/integration/proposal-generation.test.ts
describe('Proposal Generation Integration', () => {
  test('should generate proposal end-to-end', async () => {
    // 1. 創建測試客戶
    const customer = await createTestCustomer()

    // 2. 生成提案
    const result = await generateProposal({
      customerId: customer.id.toString(),
      requirements: '需要文檔管理解決方案',
      targetValue: 50000
    })

    expect(result.success).toBe(true)
    expect(result.proposal).toBeDefined()
    expect(result.proposal.status).toBe('DRAFT')
  })
})
```

---

## 📈 性能考量

### 快取策略

```typescript
// lib/cache.ts
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function cacheSearchResults(
  query: string,
  results: SearchResult[],
  ttl: number = 300
) {
  const cacheKey = `search:${Buffer.from(query).toString('base64')}`
  await redis.setex(cacheKey, ttl, JSON.stringify(results))
}

export async function getCachedSearchResults(
  query: string
): Promise<SearchResult[] | null> {
  const cacheKey = `search:${Buffer.from(query).toString('base64')}`
  const cached = await redis.get(cacheKey)
  return cached ? JSON.parse(cached) : null
}
```

### 資料庫優化

```sql
-- 知識庫搜索索引
CREATE INDEX CONCURRENTLY idx_knowledge_embedding_hnsw
ON knowledge_base USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 客戶搜索索引
CREATE INDEX CONCURRENTLY idx_customer_search
ON customers USING GIN (
  to_tsvector('english', company_name || ' ' || COALESCE(notes, ''))
);
```

---

## 🚀 部署配置

### 環境變數

```bash
# .env.production
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
AZURE_OPENAI_ENDPOINT="https://your-openai.openai.azure.com"
AZURE_OPENAI_API_KEY="your-api-key"
REDIS_URL="redis://..."
```

### Next.js 配置

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

*此 API 規格文檔將隨著開發進度持續更新和完善。*