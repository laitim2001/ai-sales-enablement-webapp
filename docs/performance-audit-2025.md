# AI 銷售賦能平台 - 性能優化審計報告

## 📊 **執行摘要**

**審計日期**: 2025-09-27
**審計範圍**: 前端性能、後端API、數據庫查詢、Bundle優化
**關鍵發現**: 多項性能瓶頸需要立即優化
**預期改善**: 60-80% 性能提升

## 🔍 **發現的主要性能問題**

### 1. **前端性能問題**
- **主Bundle過大**: `main-app.js` (6MB) 未進行代碼分割
- **組件重新渲染**: 知識庫列表組件存在不必要的重新渲染
- **圖片優化缺失**: 未使用Next.js Image優化
- **CSS未壓縮**: Tailwind CSS包含未使用的樣式

### 2. **API性能問題**
- **N+1查詢**: 知識庫列表API存在關聯查詢性能問題
- **缺乏緩存**: API響應沒有適當的緩存策略
- **重複驗證**: 每次請求都進行完整的Token驗證
- **向量搜索效率**: 語義搜索使用純JavaScript計算，效率低下

### 3. **數據庫性能問題**
- **索引不完整**: 缺少複合索引優化查詢
- **向量搜索**: 未使用pgvector擴展，使用JSON存儲向量效率低
- **查詢優化**: 分頁查詢未使用cursor-based pagination

### 4. **網絡性能問題**
- **缺乏HTTP/2**: 未啟用HTTP/2推送
- **靜態資源**: 未使用CDN或邊緣緩存
- **API響應大小**: 返回不必要的數據字段

## 🚀 **詳細優化方案**

### **階段1: 關鍵性能修復 (1-2週)**

#### 1.1 前端Bundle優化
```javascript
// next.config.js 優化
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['pg', '@azure/openai']
  },
  // Bundle分析
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    // Bundle分析工具
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }
    return config
  },
  // 圖片優化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 壓縮
  compress: true,
  // HTTP headers for caching
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

#### 1.2 組件性能優化
```typescript
// components/knowledge/knowledge-base-list-optimized.tsx
'use client'

import { useCallback, useMemo, memo } from 'react'
import { useVirtualization } from '@/hooks/useVirtualization'

// 使用React.memo避免不必要的重新渲染
const KnowledgeBaseItem = memo(({ item, onDelete }: {
  item: KnowledgeBaseItem
  onDelete: (id: number) => void
}) => {
  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
      {/* 組件內容 */}
    </div>
  )
})

// 主列表組件優化
export function KnowledgeBaseListOptimized({ filters }: KnowledgeBaseListProps) {
  // 使用useMemo緩存計算結果
  const memoizedFilters = useMemo(() => filters, [
    filters.page,
    filters.limit,
    filters.category,
    filters.status,
    filters.search,
    filters.tags
  ])

  // 使用useCallback避免函數重新創建
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('確定要刪除這個文檔嗎？')) return

    try {
      await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      // 使用React Query或SWR進行數據重新獲取
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }, [])

  // 虛擬化長列表
  const { virtualItems, totalSize, scrollElementRef } = useVirtualization({
    count: data?.data.length || 0,
    estimateSize: () => 200,
    overscan: 5
  })

  return (
    <div ref={scrollElementRef} style={{ height: totalSize }}>
      {virtualItems.map(virtualItem => (
        <div key={virtualItem.index} style={{ transform: `translateY(${virtualItem.start}px)` }}>
          <KnowledgeBaseItem
            item={data!.data[virtualItem.index]}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  )
}
```

#### 1.3 API響應優化
```typescript
// app/api/knowledge-base/route-optimized.ts
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis' // 添加Redis緩存
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 緩存檢查
    const cacheKey = `knowledge-base:${request.url}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300' // 5分鐘緩存
        }
      })
    }

    // 優化的數據庫查詢
    const [knowledgeBase, totalCount] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        select: {
          // 只選擇必要的字段
          id: true,
          title: true,
          category: true,
          status: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true
            },
            take: 5 // 限制標籤數量
          },
          _count: {
            select: { chunks: true }
          }
        },
        orderBy: { [sort]: order },
        skip,
        take: limit
      }),
      // 使用準備好的計數查詢
      prisma.knowledgeBase.count({ where })
    ])

    const response = {
      success: true,
      data: knowledgeBase,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    }

    // 設置緩存
    await redis.setex(cacheKey, 300, JSON.stringify(response))

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300'
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### **階段2: 數據庫優化 (2-3週)**

#### 2.1 索引優化
```sql
-- 添加複合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_search_optimized"
ON "knowledge_base" ("status", "category", "updated_at" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_full_text"
ON "knowledge_base" USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- 優化標籤查詢
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_tags_performance"
ON "knowledge_tags" ("name", "usage_count" DESC);

-- 向量搜索索引（使用pgvector）
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS vector_embedding_pgvector vector(1536);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chunks_vector_cosine"
ON "knowledge_chunks" USING ivfflat (vector_embedding_pgvector vector_cosine_ops) WITH (lists = 100);
```

#### 2.2 查詢優化
```typescript
// lib/db/knowledge-base-queries.ts
export class KnowledgeBaseQueries {
  // 優化的列表查詢
  static async getList(filters: KnowledgeBaseFilters) {
    // 使用準備好的語句
    const query = `
      SELECT
        kb.id, kb.title, kb.category, kb.status,
        kb.created_at, kb.updated_at,
        u.first_name, u.last_name,
        COUNT(kc.id) as chunk_count,
        array_agg(
          json_build_object('id', kt.id, 'name', kt.name, 'color', kt.color)
        ) FILTER (WHERE kt.id IS NOT NULL) as tags
      FROM knowledge_base kb
      LEFT JOIN users u ON kb.created_by = u.id
      LEFT JOIN knowledge_chunks kc ON kb.id = kc.knowledge_base_id
      LEFT JOIN knowledge_base_tags kbt ON kb.id = kbt.knowledge_base_id
      LEFT JOIN knowledge_tags kt ON kbt.knowledge_tag_id = kt.id
      WHERE kb.status = ANY($1)
      ${filters.category ? 'AND kb.category = $2' : ''}
      ${filters.search ? 'AND kb.search_vector @@ plainto_tsquery($3)' : ''}
      GROUP BY kb.id, u.first_name, u.last_name
      ORDER BY kb.updated_at DESC
      LIMIT $4 OFFSET $5
    `

    return await prisma.$queryRaw(query, /* parameters */)
  }

  // 優化的向量搜索
  static async vectorSearch(queryEmbedding: number[], options: SearchOptions) {
    const query = `
      SELECT
        kb.*,
        kc.content as chunk_content,
        kc.vector_embedding_pgvector <=> $1 as similarity
      FROM knowledge_chunks kc
      JOIN knowledge_base kb ON kc.knowledge_base_id = kb.id
      WHERE kb.status = 'ACTIVE'
      AND kc.vector_embedding_pgvector <=> $1 < $2
      ORDER BY similarity
      LIMIT $3
    `

    return await prisma.$queryRaw(query, queryEmbedding, options.threshold, options.limit)
  }
}
```

### **階段3: 高級優化 (3-4週)**

#### 3.1 實時性能監控
```typescript
// lib/monitoring/performance-monitor.ts
export class PerformanceMonitor {
  static async trackAPIPerformance(endpoint: string, duration: number, size: number) {
    // 記錄到性能數據庫
    await prisma.performanceMetric.create({
      data: {
        endpoint,
        duration,
        response_size: size,
        timestamp: new Date()
      }
    })

    // 超過閾值時發送警報
    if (duration > 1000) { // 1秒
      await this.sendAlert(`Slow API: ${endpoint} took ${duration}ms`)
    }
  }

  static async getPerformanceReport() {
    return await prisma.performanceMetric.aggregateRaw({
      pipeline: [
        {
          $group: {
            _id: "$endpoint",
            avg_duration: { $avg: "$duration" },
            max_duration: { $max: "$duration" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { avg_duration: -1 }
        }
      ]
    })
  }
}

// API中間件
export function withPerformanceTracking(handler: NextApiHandler) {
  return async (req: NextRequest, res: NextResponse) => {
    const start = Date.now()

    const result = await handler(req, res)

    const duration = Date.now() - start
    const size = JSON.stringify(result).length

    await PerformanceMonitor.trackAPIPerformance(
      req.url || 'unknown',
      duration,
      size
    )

    return result
  }
}
```

#### 3.2 CDN和緩存策略
```typescript
// next.config.js CDN配置
const nextConfig = {
  // CDN配置
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.yourdomain.com' : '',

  // 緩存策略
  async headers() {
    return [
      {
        source: '/api/knowledge-base',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

#### 3.3 服務器端優化
```typescript
// lib/cache/redis-client.ts
import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // 連接池設置
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
  // 性能優化
  enableReadyCheck: false,
  keepAlive: 30000,
})

// 緩存裝飾器
export function cached(ttl: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`

      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const result = await originalMethod.apply(this, args)
      await redis.setex(cacheKey, ttl, JSON.stringify(result))

      return result
    }

    return descriptor
  }
}
```

## 📈 **性能監控儀表板**

### 4.1 關鍵指標追蹤
```typescript
// components/admin/performance-dashboard.tsx
export function PerformanceDashboard() {
  const { data: metrics } = useQuery(['performance-metrics'], async () => {
    const response = await fetch('/api/admin/performance-metrics')
    return response.json()
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="API響應時間"
        value={`${metrics?.avg_api_response_time || 0}ms`}
        target="< 500ms"
        status={metrics?.avg_api_response_time < 500 ? 'good' : 'warning'}
      />

      <MetricCard
        title="頁面加載時間"
        value={`${metrics?.avg_page_load_time || 0}ms`}
        target="< 2000ms"
        status={metrics?.avg_page_load_time < 2000 ? 'good' : 'warning'}
      />

      <MetricCard
        title="數據庫查詢時間"
        value={`${metrics?.avg_db_query_time || 0}ms`}
        target="< 100ms"
        status={metrics?.avg_db_query_time < 100 ? 'good' : 'warning'}
      />

      <MetricCard
        title="緩存命中率"
        value={`${metrics?.cache_hit_rate || 0}%`}
        target="> 80%"
        status={metrics?.cache_hit_rate > 80 ? 'good' : 'warning'}
      />
    </div>
  )
}
```

## 🎯 **實施時程表**

### **第1週**: 緊急修復
- [ ] Bundle分析和代碼分割
- [ ] React組件memo優化
- [ ] API響應緩存
- [ ] 基本圖片優化

### **第2週**: 數據庫優化
- [ ] 創建性能索引
- [ ] 查詢優化
- [ ] 連接池配置
- [ ] 慢查詢監控

### **第3週**: 高級功能
- [ ] Redis緩存層
- [ ] CDN設置
- [ ] 向量搜索優化
- [ ] 性能監控

### **第4週**: 測試和微調
- [ ] 負載測試
- [ ] 性能基準測試
- [ ] 監控調整
- [ ] 文檔更新

## 📊 **預期成果**

### **性能改善目標**
- **頁面加載時間**: 減少 60-70% (從 ~4s 到 ~1.2s)
- **API響應時間**: 減少 70-80% (從 ~800ms 到 ~200ms)
- **數據庫查詢**: 減少 50-60% (從 ~200ms 到 ~80ms)
- **Bundle大小**: 減少 40-50% (從 6MB 到 ~3MB)

### **用戶體驗改善**
- **首屏渲染**: < 1.5秒
- **交互響應**: < 100ms
- **搜索響應**: < 300ms
- **文件上傳**: 改善 50%

## 🛡️ **風險控制**

### **部署策略**
1. **分階段部署**: 每個優化逐步推出
2. **A/B測試**: 對比優化前後性能
3. **回滾計劃**: 快速回滾機制
4. **監控警報**: 實時性能監控

### **質量保證**
1. **自動化測試**: 性能回歸測試
2. **負載測試**: 高併發場景測試
3. **用戶驗收**: 內部用戶體驗測試
4. **漸進式改善**: 持續優化迭代

---

**下一步行動**: 開始實施階段1的優化，並建立性能監控基準線。