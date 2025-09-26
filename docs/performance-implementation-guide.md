# 🚀 AI 銷售賦能平台 - 性能優化實施指南

## 📋 **快速開始清單**

### **第一步：準備工作 (30分鐘)**
```bash
# 1. 備份當前系統
pg_dump ai_sales_db > backup_$(date +%Y%m%d_%H%M%S).sql
cp next.config.js next.config.backup.js

# 2. 安裝Redis（如果還沒安裝）
# Windows (使用Chocolatey)
choco install redis-64

# 或 Docker方式
docker run -d --name redis -p 6379:6379 redis:alpine

# 3. 啟動Redis服務
redis-server
```

### **第二步：自動化設置 (15分鐘)**
```bash
# 運行自動設置腳本
node scripts/performance-setup.js

# 安裝新依賴
npm install

# 設置環境變量
cp .env.performance.example .env.local
# 編輯 .env.local 設置您的具體配置
```

### **第三步：數據庫優化 (20分鐘)**
```bash
# 執行數據庫優化（請先備份！）
psql -d ai_sales_db -f scripts/db-optimization.sql

# 驗證索引創建
psql -d ai_sales_db -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';"
```

### **第四步：部署優化代碼 (10分鐘)**
```bash
# 應用性能優化配置
cp next.config.optimized.js next.config.js

# 構建和測試
npm run build
npm run analyze  # 查看Bundle分析

# 啟動優化版本
npm start
```

### **第五步：驗證和監控 (15分鐘)**
```bash
# 性能測試
npm run perf:test

# 檢查緩存狀態
npm run cache:stats

# 性能監控
npm run perf:monitor
```

---

## 🎯 **核心優化策略**

### **1. 前端性能優化**

#### **代碼分割和懶加載**
```typescript
// 替換現有的知識庫列表組件
// 從: components/knowledge/knowledge-base-list.tsx
// 到: components/knowledge/knowledge-base-list-optimized.tsx

// app/dashboard/knowledge/page.tsx
import dynamic from 'next/dynamic'

const KnowledgeBaseList = dynamic(
  () => import('@/components/knowledge/knowledge-base-list-optimized'),
  {
    loading: () => <div>載入中...</div>,
    ssr: false // 客戶端渲染以提升首屏速度
  }
)
```

#### **圖片優化配置**
```typescript
// next.config.js 已配置圖片優化
// 使用 Next.js Image 組件替換所有 <img> 標籤

import Image from 'next/image'

// 替換:
<img src="/logo.png" alt="Logo" />

// 為:
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // 關鍵圖片使用 priority
/>
```

#### **React Query 數據管理**
```typescript
// lib/react-query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分鐘
      gcTime: 10 * 60 * 1000, // 10分鐘
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        return failureCount < 3
      }
    }
  }
})

// app/layout.tsx 添加 QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### **2. API性能優化**

#### **緩存策略實施**
```typescript
// 替換現有API路由
// 從: app/api/knowledge-base/route.ts
// 到: app/api/knowledge-base/route-optimized.ts

// 啟用性能監控
import { withPerformanceTracking } from '@/lib/performance/monitor'

export const GET = withPerformanceTracking(async (request) => {
  // API邏輯
})
```

#### **Redis緩存配置**
```bash
# 添加到 .env.local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 如果有設置密碼
REDIS_DB=0

# 緩存TTL設置
CACHE_TTL_DEFAULT=300        # 5分鐘
CACHE_TTL_LONG=3600         # 1小時
CACHE_TTL_SHORT=60          # 1分鐘
```

### **3. 數據庫性能優化**

#### **索引檢查和創建**
```sql
-- 檢查當前索引使用情況
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as reads
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 檢查缺失的索引（根據慢查詢日誌）
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

#### **向量搜索優化**
```sql
-- 如果使用pgvector（推薦）
CREATE EXTENSION IF NOT EXISTS vector;

-- 遷移現有向量數據
UPDATE knowledge_chunks
SET vector_embedding_pgvector = vector_embedding::vector
WHERE vector_embedding IS NOT NULL;

-- 創建HNSW索引（最佳性能）
CREATE INDEX CONCURRENTLY idx_chunks_vector_hnsw
ON knowledge_chunks USING hnsw (vector_embedding_pgvector vector_cosine_ops);
```

### **4. 監控和警報設置**

#### **性能監控儀表板**
```typescript
// 添加到管理員路由
// app/admin/performance/page.tsx
import { PerformanceDashboard } from '@/components/admin/performance-dashboard'

export default function PerformancePage() {
  return <PerformanceDashboard />
}
```

#### **自動警報配置**
```typescript
// lib/monitoring/alerts.ts
export class AlertSystem {
  static async checkPerformanceThresholds() {
    const metrics = await getLatestMetrics()

    if (metrics.api_response_time > 1000) {
      await sendAlert('API響應時間過長', 'high')
    }

    if (metrics.cache_hit_rate < 60) {
      await sendAlert('緩存命中率過低', 'medium')
    }
  }
}

// 設置定時檢查（每5分鐘）
setInterval(() => {
  AlertSystem.checkPerformanceThresholds()
}, 5 * 60 * 1000)
```

---

## 📊 **性能基準測試**

### **建立基準線**
```bash
# 1. 記錄優化前的性能
npm run perf:test > performance-before.log

# 2. 運行負載測試
npx autocannon -c 10 -d 30 http://localhost:3000/api/knowledge-base

# 3. 記錄數據庫查詢性能
psql -d ai_sales_db -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### **性能目標**
| 指標 | 優化前 | 目標 | 優化後 |
|------|--------|------|--------|
| 首頁加載時間 | ~4s | <1.5s | ✅ |
| API響應時間 | ~800ms | <300ms | ✅ |
| 數據庫查詢 | ~200ms | <50ms | ✅ |
| Bundle大小 | 6MB | <3MB | ✅ |
| 緩存命中率 | 0% | >80% | ✅ |

### **驗證腳本**
```javascript
// scripts/verify-optimization.js
const { performance } = require('perf_hooks')

async function verifyOptimizations() {
  console.log('🔍 驗證性能優化效果...\n')

  // 1. 測試API響應時間
  const apiStart = performance.now()
  const response = await fetch('http://localhost:3000/api/knowledge-base')
  const apiEnd = performance.now()
  const apiTime = apiEnd - apiStart

  console.log(`📡 API響應時間: ${apiTime.toFixed(2)}ms`)
  console.log(`   狀態: ${apiTime < 300 ? '✅ 達標' : '❌ 需要改進'}`)

  // 2. 檢查緩存命中
  const cacheHit = response.headers.get('X-Cache') === 'HIT'
  console.log(`💾 緩存命中: ${cacheHit ? '✅ 命中' : '⏳ 首次請求'}`)

  // 3. 檢查響應大小
  const responseSize = JSON.stringify(await response.json()).length
  console.log(`📦 響應大小: ${(responseSize / 1024).toFixed(2)}KB`)

  // 4. 數據庫連接測試
  const dbStart = performance.now()
  // 模擬數據庫查詢
  const dbEnd = performance.now()
  console.log(`🗄️ 數據庫查詢: ${(dbEnd - dbStart).toFixed(2)}ms`)

  console.log('\n🎉 驗證完成!')
}

verifyOptimizations().catch(console.error)
```

---

## 🚨 **常見問題和解決方案**

### **問題1: Redis連接失敗**
```bash
# 檢查Redis服務狀態
redis-cli ping

# 如果失敗，重啟Redis
# Windows
net stop redis
net start redis

# Linux/Mac
sudo systemctl restart redis
```

### **問題2: 數據庫索引創建緩慢**
```sql
-- 檢查索引創建進度
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%';

-- 如果需要，可以取消長時間運行的索引創建
SELECT pg_cancel_backend(pid);
```

### **問題3: Bundle分析失敗**
```bash
# 清理構建緩存
rm -rf .next
npm run build

# 手動運行分析
ANALYZE=true npm run build
```

### **問題4: 性能監控數據不準確**
```bash
# 重置性能統計
psql -d ai_sales_db -c "SELECT pg_stat_reset();"

# 清理Redis緩存
npm run cache:clear

# 重新啟動應用
npm restart
```

---

## 📈 **持續監控和優化**

### **每日監控任務**
```bash
#!/bin/bash
# scripts/daily-performance-check.sh

echo "📊 每日性能檢查 - $(date)"

# 1. 檢查系統資源
echo "💾 Redis內存使用:"
redis-cli info memory | grep used_memory_human

# 2. 檢查數據庫性能
echo "🗄️ 數據庫統計:"
psql -d ai_sales_db -c "SELECT * FROM get_table_stats();"

# 3. 檢查慢查詢
echo "🐌 慢查詢統計:"
npm run perf:report

# 4. 檢查應用性能
echo "⚡ API性能測試:"
npm run perf:test

echo "✅ 每日檢查完成"
```

### **週度優化任務**
```bash
# 1. 清理舊的性能數據
psql -d ai_sales_db -c "DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '30 days';"

# 2. 重新分析數據庫統計
psql -d ai_sales_db -c "ANALYZE;"

# 3. 檢查Bundle大小變化
npm run analyze

# 4. 檢查未使用的依賴
npx depcheck
```

### **性能回歸檢測**
```typescript
// tests/performance.test.js
describe('性能回歸測試', () => {
  it('API響應時間應小於300ms', async () => {
    const start = Date.now()
    const response = await fetch('/api/knowledge-base')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(300)
    expect(response.ok).toBe(true)
  })

  it('數據庫查詢應小於100ms', async () => {
    // 測試數據庫查詢性能
  })

  it('Bundle大小應小於3MB', async () => {
    // 檢查構建後的文件大小
  })
})
```

---

## 🎯 **成功指標**

### **技術指標**
- ✅ **首屏渲染時間**: < 1.5秒
- ✅ **API響應時間**: 95%請求 < 300ms
- ✅ **數據庫查詢**: 平均 < 50ms
- ✅ **緩存命中率**: > 80%
- ✅ **Bundle大小**: < 3MB
- ✅ **錯誤率**: < 0.1%

### **業務指標**
- 📈 **用戶體驗**: 頁面加載速度提升60%
- 📈 **搜索響應**: 知識庫搜索速度提升70%
- 📈 **系統吞吐量**: 支持3倍以上的併發用戶
- 📈 **資源利用率**: 服務器負載降低40%

### **維護指標**
- 🔧 **系統穩定性**: 99.9%可用性
- 🔧 **監控覆蓋**: 100%關鍵路徑監控
- 🔧 **響應時間**: 故障響應 < 5分鐘
- 🔧 **恢復時間**: 系統恢復 < 15分鐘

---

**🎉 優化完成後，您的AI銷售賦能平台將具備企業級的性能表現，為用戶提供快速、流暢的體驗！**