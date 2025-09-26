#!/usr/bin/env node

/**
 * 性能優化設置腳本
 *
 * 此腳本將：
 * 1. 安裝必要的性能優化依賴
 * 2. 設置數據庫索引
 * 3. 配置Redis緩存
 * 4. 創建性能監控表
 * 5. 設置Bundle分析工具
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 開始設置性能優化...\n')

// 1. 安裝性能優化依賴
console.log('📦 安裝性能優化依賴包...')
const dependencies = [
  'ioredis', // Redis客戶端
  '@tanstack/react-virtual', // 虛擬化
  '@tanstack/react-query', // 數據緩存和管理
  'webpack-bundle-analyzer', // Bundle分析
  'compression', // Gzip壓縮
  'sharp' // 圖片優化
]

const devDependencies = [
  '@next/bundle-analyzer', // Next.js Bundle分析器
  'cross-env' // 跨平台環境變量
]

try {
  console.log('  安裝生產依賴...')
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' })

  console.log('  安裝開發依賴...')
  execSync(`npm install -D ${devDependencies.join(' ')}`, { stdio: 'inherit' })

  console.log('✅ 依賴安裝完成\n')
} catch (error) {
  console.error('❌ 依賴安裝失敗:', error.message)
  process.exit(1)
}

// 2. 更新package.json腳本
console.log('📝 更新package.json腳本...')
const packageJsonPath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// 添加性能相關腳本
const performanceScripts = {
  'analyze': 'cross-env ANALYZE=true npm run build',
  'analyze:server': 'cross-env BUNDLE_ANALYZE=server npm run build',
  'analyze:browser': 'cross-env BUNDLE_ANALYZE=browser npm run build',
  'perf:test': 'node scripts/performance-test.js',
  'perf:monitor': 'node scripts/performance-monitor.js',
  'perf:report': 'node scripts/performance-report.js',
  'cache:clear': 'node scripts/clear-cache.js',
  'cache:stats': 'node scripts/cache-stats.js',
  'build:optimized': 'cross-env NODE_ENV=production npm run build'
}

packageJson.scripts = { ...packageJson.scripts, ...performanceScripts }

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
console.log('✅ package.json 更新完成\n')

// 3. 創建環境變量模板
console.log('🔧 創建環境變量模板...')
const envTemplate = `
# 性能優化配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Bundle分析
ANALYZE=false
BUNDLE_ANALYZE=

# 性能監控
PERFORMANCE_MONITORING=true
PERFORMANCE_LOG_LEVEL=info

# 緩存設置
CACHE_TTL_DEFAULT=300
CACHE_TTL_LONG=3600
CACHE_TTL_SHORT=60

# 數據庫優化
DB_POOL_SIZE=20
DB_QUERY_TIMEOUT=10000
DB_STATEMENT_TIMEOUT=30000

# CDN設置（生產環境）
CDN_URL=
STATIC_URL=

# 圖片優化
IMAGE_OPTIMIZATION=true
IMAGE_QUALITY=80
IMAGE_FORMATS=webp,avif

# 壓縮設置
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024
`

const envExamplePath = path.join(process.cwd(), '.env.performance.example')
fs.writeFileSync(envExamplePath, envTemplate.trim())
console.log('✅ 環境變量模板創建完成\n')

// 4. 創建性能測試腳本
console.log('📊 創建性能測試腳本...')
const performanceTestScript = `
const { performance } = require('perf_hooks')
const fs = require('fs')
const path = require('path')

class PerformanceTest {
  constructor() {
    this.results = []
  }

  async testAPIEndpoint(url, options = {}) {
    const start = performance.now()

    try {
      const response = await fetch(url, options)
      const end = performance.now()
      const duration = end - start

      const result = {
        url,
        method: options.method || 'GET',
        status: response.status,
        duration: Math.round(duration),
        size: parseInt(response.headers.get('content-length') || '0'),
        cached: response.headers.get('x-cache') === 'HIT',
        timestamp: new Date().toISOString()
      }

      this.results.push(result)
      return result
    } catch (error) {
      const end = performance.now()
      const result = {
        url,
        method: options.method || 'GET',
        status: 0,
        duration: Math.round(end - start),
        error: error.message,
        timestamp: new Date().toISOString()
      }

      this.results.push(result)
      return result
    }
  }

  async runTests() {
    console.log('🧪 開始性能測試...')

    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
    const token = process.env.TEST_TOKEN

    const headers = token ? { 'Authorization': \`Bearer \${token}\` } : {}

    // 測試知識庫列表API
    await this.testAPIEndpoint(\`\${baseUrl}/api/knowledge-base\`, { headers })
    await this.testAPIEndpoint(\`\${baseUrl}/api/knowledge-base?page=1&limit=20\`, { headers })

    // 測試搜索API
    await this.testAPIEndpoint(\`\${baseUrl}/api/knowledge-base/search\`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test', type: 'text' })
    })

    console.log('✅ 性能測試完成')
    this.generateReport()
  }

  generateReport() {
    const report = {
      summary: {
        total_tests: this.results.length,
        avg_duration: Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length),
        success_rate: (this.results.filter(r => r.status >= 200 && r.status < 400).length / this.results.length * 100).toFixed(2) + '%',
        cache_hit_rate: (this.results.filter(r => r.cached).length / this.results.length * 100).toFixed(2) + '%'
      },
      details: this.results
    }

    const reportPath = path.join(process.cwd(), 'performance-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log('📊 性能報告已生成:', reportPath)
    console.log('平均響應時間:', report.summary.avg_duration + 'ms')
    console.log('成功率:', report.summary.success_rate)
    console.log('緩存命中率:', report.summary.cache_hit_rate)
  }
}

// 運行測試
if (require.main === module) {
  const test = new PerformanceTest()
  test.runTests().catch(console.error)
}

module.exports = PerformanceTest
`

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'performance-test.js'), performanceTestScript.trim())

// 5. 創建緩存清理腳本
const clearCacheScript = `
const Redis = require('ioredis')

async function clearCache() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  })

  try {
    console.log('🧹 清理緩存...')

    const keys = await redis.keys('*')
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(\`✅ 已清理 \${keys.length} 個緩存項\`)
    } else {
      console.log('✅ 緩存已經是空的')
    }
  } catch (error) {
    console.error('❌ 清理緩存失敗:', error.message)
  } finally {
    await redis.quit()
  }
}

if (require.main === module) {
  clearCache().catch(console.error)
}

module.exports = clearCache
`

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'clear-cache.js'), clearCacheScript.trim())

console.log('✅ 性能腳本創建完成\n')

// 6. 創建數據庫優化SQL
console.log('🗄️ 創建數據庫優化SQL...')
const dbOptimizationSQL = `
-- 知識庫性能優化索引
-- 執行前請備份數據庫

-- 1. 複合索引優化知識庫列表查詢
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_list_optimized"
ON "knowledge_base" ("status", "category", "updated_at" DESC);

-- 2. 全文搜索索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_full_text"
ON "knowledge_base" USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- 3. 標籤查詢優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_tags_usage"
ON "knowledge_tags" ("name", "usage_count" DESC);

-- 4. 用戶查詢優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_auth_optimized"
ON "users" ("email", "is_active", "last_login");

-- 5. 分塊向量搜索索引（需要pgvector擴展）
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS vector_embedding_pgvector vector(1536);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chunks_vector_cosine"
-- ON "knowledge_chunks" USING ivfflat (vector_embedding_pgvector vector_cosine_ops) WITH (lists = 100);

-- 6. 審計日誌分區（可選，用於大數據量）
-- CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 7. 性能監控表
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  duration INTEGER NOT NULL,
  response_size INTEGER,
  status_code INTEGER NOT NULL,
  user_id INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  memory_usage BIGINT,
  cpu_usage FLOAT,
  cache_hit BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 性能監控索引
CREATE INDEX IF NOT EXISTS "idx_performance_metrics_endpoint_timestamp"
ON performance_metrics (endpoint, timestamp DESC);

CREATE INDEX IF NOT EXISTS "idx_performance_metrics_duration"
ON performance_metrics (duration DESC);

CREATE INDEX IF NOT EXISTS "idx_performance_metrics_status_code"
ON performance_metrics (status_code, timestamp DESC);

-- 8. 數據庫統計信息更新
ANALYZE knowledge_base;
ANALYZE knowledge_chunks;
ANALYZE knowledge_tags;
ANALYZE users;

-- 9. 設置自動VACUUM（推薦）
-- ALTER TABLE knowledge_base SET (autovacuum_vacuum_scale_factor = 0.1);
-- ALTER TABLE knowledge_chunks SET (autovacuum_vacuum_scale_factor = 0.1);

-- 10. 連接池優化建議
-- max_connections = 200
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- work_mem = 4MB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
`

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'db-optimization.sql'), dbOptimizationSQL.trim())
console.log('✅ 數據庫優化SQL創建完成\n')

// 7. 創建性能監控腳本
const monitorScript = `
const { PrismaClient } = require('@prisma/client')
const Redis = require('ioredis')

const prisma = new PrismaClient()
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
})

class PerformanceMonitor {
  async getSystemStats() {
    try {
      // Redis 統計
      const redisInfo = await redis.info('memory')
      const redisStats = await redis.info('stats')

      // 數據庫統計
      const dbStats = await prisma.$queryRaw\`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        WHERE tablename IN ('knowledge_base', 'knowledge_chunks', 'users')
      \`

      return {
        redis: this.parseRedisInfo(redisInfo),
        database: dbStats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('獲取系統統計失敗:', error)
      return null
    }
  }

  parseRedisInfo(info) {
    const result = {}
    info.split('\\r\\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          result[key] = isNaN(Number(value)) ? value : Number(value)
        }
      }
    })
    return result
  }

  async generateReport() {
    console.log('📊 生成性能監控報告...')

    const stats = await this.getSystemStats()
    if (!stats) return

    console.log('\\n=== Redis 統計 ===')
    console.log(\`內存使用: \${(stats.redis.used_memory / 1024 / 1024).toFixed(2)} MB\`)
    console.log(\`鍵數量: \${stats.redis.db0?.split(',')[0]?.split('=')[1] || 0}\`)

    console.log('\\n=== 數據庫統計 ===')
    stats.database.forEach(table => {
      console.log(\`\${table.tablename}:\`)
      console.log(\`  活躍記錄: \${table.live_tuples}\`)
      console.log(\`  死記錄: \${table.dead_tuples}\`)
      console.log(\`  插入: \${table.inserts}\`)
    })
  }
}

if (require.main === module) {
  const monitor = new PerformanceMonitor()
  monitor.generateReport().catch(console.error).finally(() => {
    prisma.$disconnect()
    redis.quit()
  })
}

module.exports = PerformanceMonitor
`

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'performance-monitor.js'), monitorScript.trim())
console.log('✅ 性能監控腳本創建完成\n')

// 8. 備份原配置並應用優化配置
console.log('🔄 應用性能優化配置...')

// 備份原next.config.js
const nextConfigPath = path.join(process.cwd(), 'next.config.js')
const nextConfigBackupPath = path.join(process.cwd(), 'next.config.backup.js')

if (fs.existsSync(nextConfigPath)) {
  fs.copyFileSync(nextConfigPath, nextConfigBackupPath)
  console.log('✅ 已備份原 next.config.js')
}

// 應用優化配置
const optimizedConfigPath = path.join(process.cwd(), 'next.config.optimized.js')
if (fs.existsSync(optimizedConfigPath)) {
  fs.copyFileSync(optimizedConfigPath, nextConfigPath)
  console.log('✅ 已應用優化的 next.config.js')
}

console.log('\\n🎉 性能優化設置完成!')
console.log('\\n📋 下一步操作:')
console.log('1. 執行 npm run analyze 分析Bundle大小')
console.log('2. 運行 node scripts/db-optimization.sql 優化數據庫（請先備份）')
console.log('3. 配置Redis服務器')
console.log('4. 設置環境變量（參考 .env.performance.example）')
console.log('5. 執行 npm run perf:test 進行性能測試')
console.log('\\n🔗 有用的命令:')
console.log('- npm run analyze: Bundle分析')
console.log('- npm run perf:test: 性能測試')
console.log('- npm run perf:monitor: 性能監控')
console.log('- npm run cache:clear: 清理緩存')
console.log('- npm run cache:stats: 緩存統計')
`

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'performance-setup.js'), performanceSetupScript.trim())

console.log('✅ 性能設置腳本創建完成')
console.log('\n🚀 請運行 node scripts/performance-setup.js 開始性能優化設置')