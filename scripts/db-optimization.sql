-- AI 銷售賦能平台 - 數據庫性能優化腳本
-- 執行前請備份數據庫！
-- 建議在維護窗口期間執行

-- 檢查當前連接數和活動查詢
SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- ===========================================
-- 1. 核心索引優化
-- ===========================================

-- 知識庫列表查詢優化（最重要的性能提升）
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_list_optimized"
ON "knowledge_base" ("status", "category", "updated_at" DESC, "created_at" DESC);

-- 知識庫搜索優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_search_text"
ON "knowledge_base" ("status", "title", "content")
WHERE status IN ('ACTIVE', 'DRAFT');

-- 全文搜索索引（PostgreSQL原生）
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_fulltext"
ON "knowledge_base" USING gin(
  to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(author, ''))
);

-- 標籤關聯查詢優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_base_tags_junction"
ON "knowledge_base_knowledge_tags" ("knowledge_base_id", "knowledge_tag_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_tags_performance"
ON "knowledge_tags" ("name", "usage_count" DESC, "is_system");

-- 分塊查詢優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_knowledge_chunks_kb_content"
ON "knowledge_chunks" ("knowledge_base_id", "chunk_index", "content_hash");

-- 用戶認證查詢優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_auth_performance"
ON "users" ("email", "is_active", "password_hash")
WHERE is_active = true;

-- 審計日誌查詢優化
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_user_date"
ON "audit_logs" ("user_id", "created_at" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_entity"
ON "audit_logs" ("entity_type", "entity_id", "created_at" DESC);

-- ===========================================
-- 2. pgvector 向量搜索優化（如果使用）
-- ===========================================

-- 安裝pgvector擴展（需要超級用戶權限）
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 添加向量列（如果不存在）
-- ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS vector_embedding_pgvector vector(1536);

-- 遷移現有向量數據（如果需要）
-- UPDATE knowledge_chunks
-- SET vector_embedding_pgvector = vector_embedding::vector
-- WHERE vector_embedding IS NOT NULL AND vector_embedding_pgvector IS NULL;

-- 創建向量索引（HNSW - 推薦用於高查詢性能）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chunks_vector_hnsw"
-- ON "knowledge_chunks" USING hnsw (vector_embedding_pgvector vector_cosine_ops);

-- 或者使用IVFFlat（適合大數據集）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chunks_vector_ivfflat"
-- ON "knowledge_chunks" USING ivfflat (vector_embedding_pgvector vector_cosine_ops)
-- WITH (lists = 100);

-- 向量搜索復合索引
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chunks_vector_kb_status"
-- ON "knowledge_chunks" ("knowledge_base_id")
-- WHERE EXISTS (
--   SELECT 1 FROM knowledge_base kb
--   WHERE kb.id = knowledge_chunks.knowledge_base_id
--   AND kb.status = 'ACTIVE'
-- );

-- ===========================================
-- 3. 分區表設置（用於大數據量）
-- ===========================================

-- 審計日誌按月分區（示例）
/*
-- 創建分區表
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 創建分區
CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_y2025m02 PARTITION OF audit_logs_partitioned
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- 遷移數據（謹慎操作）
-- INSERT INTO audit_logs_partitioned SELECT * FROM audit_logs;
*/

-- ===========================================
-- 4. 性能監控表
-- ===========================================

-- 性能指標表
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  duration INTEGER NOT NULL, -- 毫秒
  response_size INTEGER,
  status_code INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  memory_usage BIGINT,
  cpu_usage FLOAT,
  cache_hit BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 性能監控索引
CREATE INDEX IF NOT EXISTS "idx_performance_metrics_endpoint_time"
ON performance_metrics (endpoint, timestamp DESC);

CREATE INDEX IF NOT EXISTS "idx_performance_metrics_duration"
ON performance_metrics (duration DESC, timestamp DESC);

CREATE INDEX IF NOT EXISTS "idx_performance_metrics_status"
ON performance_metrics (status_code, timestamp DESC);

CREATE INDEX IF NOT EXISTS "idx_performance_metrics_user"
ON performance_metrics (user_id, timestamp DESC);

-- 慢查詢日誌表
CREATE TABLE IF NOT EXISTS slow_queries (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  duration FLOAT NOT NULL, -- 秒
  calls INTEGER DEFAULT 1,
  mean_time FLOAT,
  rows_affected INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  query_hash TEXT
);

CREATE INDEX IF NOT EXISTS "idx_slow_queries_duration"
ON slow_queries (duration DESC, timestamp DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_slow_queries_hash"
ON slow_queries (query_hash);

-- ===========================================
-- 5. 數據統計和分析
-- ===========================================

-- 更新表統計信息（重要！）
ANALYZE knowledge_base;
ANALYZE knowledge_chunks;
ANALYZE knowledge_tags;
ANALYZE users;
ANALYZE audit_logs;

-- 檢查表大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 檢查索引使用情況
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 檢查未使用的索引
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';

-- ===========================================
-- 6. 查詢優化設置
-- ===========================================

-- 設置查詢計劃器參數（會話級別）
SET work_mem = '16MB';
SET maintenance_work_mem = '256MB';
SET effective_cache_size = '2GB';
SET random_page_cost = 1.1; -- SSD優化
SET effective_io_concurrency = 200; -- SSD優化

-- 啟用並行查詢
SET max_parallel_workers_per_gather = 4;
SET parallel_tuple_cost = 0.1;
SET parallel_setup_cost = 1000;

-- ===========================================
-- 7. 自動維護設置
-- ===========================================

-- 設置自動VACUUM參數（針對高更新表）
ALTER TABLE knowledge_base SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_cost_limit = 2000
);

ALTER TABLE knowledge_chunks SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- ===========================================
-- 8. 性能監控函數
-- ===========================================

-- 創建慢查詢監控函數
CREATE OR REPLACE FUNCTION monitor_slow_queries()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- 記錄執行時間超過1秒的查詢
  FOR rec IN
    SELECT
      query,
      calls,
      total_time,
      mean_time,
      rows,
      md5(query) as query_hash
    FROM pg_stat_statements
    WHERE mean_time > 1000 -- 1秒
    ORDER BY total_time DESC
    LIMIT 20
  LOOP
    INSERT INTO slow_queries (query, duration, calls, mean_time, rows_affected, query_hash)
    VALUES (rec.query, rec.total_time/1000, rec.calls, rec.mean_time/1000, rec.rows, rec.query_hash)
    ON CONFLICT (query_hash) DO UPDATE SET
      calls = EXCLUDED.calls,
      duration = EXCLUDED.duration,
      mean_time = EXCLUDED.mean_time,
      timestamp = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 創建表統計監控函數
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  last_vacuum TIMESTAMP,
  last_analyze TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    c.reltuples::BIGINT,
    pg_size_pretty(pg_relation_size(c.oid)),
    pg_size_pretty(pg_indexes_size(c.oid)),
    pg_size_pretty(pg_total_relation_size(c.oid)),
    s.last_vacuum,
    s.last_analyze
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_stat_user_tables s ON s.relname = t.tablename
  WHERE t.schemaname = 'public'
  ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 9. 數據清理和維護
-- ===========================================

-- 清理舊的性能指標（保留30天）
DELETE FROM performance_metrics
WHERE timestamp < NOW() - INTERVAL '30 days';

-- 清理舊的審計日誌（保留90天）
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- 重建統計信息
REINDEX (VERBOSE) TABLE knowledge_base;
REINDEX (VERBOSE) TABLE knowledge_chunks;

-- ===========================================
-- 10. 驗證和測試
-- ===========================================

-- 測試知識庫列表查詢性能
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, status, updated_at
FROM knowledge_base
WHERE status IN ('ACTIVE', 'DRAFT')
ORDER BY updated_at DESC
LIMIT 20;

-- 測試搜索查詢性能
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, ts_rank(to_tsvector('simple', title || ' ' || COALESCE(content, '')), plainto_tsquery('simple', 'test')) as rank
FROM knowledge_base
WHERE to_tsvector('simple', title || ' ' || COALESCE(content, '')) @@ plainto_tsquery('simple', 'test')
ORDER BY rank DESC
LIMIT 10;

-- 測試標籤查詢性能
EXPLAIN (ANALYZE, BUFFERS)
SELECT kb.id, kb.title
FROM knowledge_base kb
JOIN knowledge_base_knowledge_tags kbt ON kb.id = kbt.knowledge_base_id
JOIN knowledge_tags kt ON kbt.knowledge_tag_id = kt.id
WHERE kt.name = 'test-tag'
AND kb.status = 'ACTIVE';

-- ===========================================
-- 11. 備份和恢復建議
-- ===========================================

-- 創建性能基準
CREATE TABLE IF NOT EXISTS performance_baseline AS
SELECT
  'knowledge_base_list' as query_type,
  NOW() as benchmark_date,
  (SELECT COUNT(*) FROM knowledge_base) as record_count,
  0 as avg_duration_ms -- 手動更新
WHERE NOT EXISTS (SELECT 1 FROM performance_baseline WHERE query_type = 'knowledge_base_list');

-- 完成消息
DO $$
BEGIN
  RAISE NOTICE '=== 數據庫優化完成 ===';
  RAISE NOTICE '請執行以下命令驗證優化效果:';
  RAISE NOTICE '1. SELECT * FROM get_table_stats();';
  RAISE NOTICE '2. 運行應用性能測試';
  RAISE NOTICE '3. 監控慢查詢日誌';
  RAISE NOTICE '4. 檢查索引使用情況';
END $$;