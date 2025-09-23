-- Migration: Add Full-Text Search Indexes
-- Created: 2025-01-23
-- Description: Implements full-text search capabilities for Customer and CallRecord tables

-- 啟用 PostgreSQL 全文搜索擴展
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 客戶全文搜索索引
CREATE INDEX IF NOT EXISTS FT_Customer_Content_GIN
ON customers
USING GIN (
  to_tsvector('english',
    COALESCE(company_name, '') || ' ' ||
    COALESCE(notes, '') || ' ' ||
    COALESCE(industry, '')
  )
);

-- 客戶公司名稱模糊搜索（支持拼寫錯誤）
CREATE INDEX IF NOT EXISTS FT_Customer_Company_Trigram
ON customers
USING GIN (company_name gin_trgm_ops);

-- 通話記錄全文搜索索引
CREATE INDEX IF NOT EXISTS FT_CallRecord_Content_GIN
ON call_records
USING GIN (
  to_tsvector('english',
    COALESCE(summary, '') || ' ' ||
    COALESCE(action_items, '')
  )
);

-- 提案標題和描述全文搜索
CREATE INDEX IF NOT EXISTS FT_Proposal_Content_GIN
ON proposals
USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- 文檔內容全文搜索
CREATE INDEX IF NOT EXISTS FT_Document_Content_GIN
ON documents
USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(content, '')
  )
);

-- 創建自定義搜索函數
CREATE OR REPLACE FUNCTION search_customers(search_term TEXT)
RETURNS TABLE (
  id INT,
  company_name TEXT,
  email TEXT,
  industry TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.company_name::TEXT,
    c.email::TEXT,
    c.industry::TEXT,
    ts_rank(
      to_tsvector('english',
        COALESCE(c.company_name, '') || ' ' ||
        COALESCE(c.notes, '') || ' ' ||
        COALESCE(c.industry, '')
      ),
      plainto_tsquery('english', search_term)
    ) as relevance
  FROM customers c
  WHERE
    to_tsvector('english',
      COALESCE(c.company_name, '') || ' ' ||
      COALESCE(c.notes, '') || ' ' ||
      COALESCE(c.industry, '')
    ) @@ plainto_tsquery('english', search_term)
    OR similarity(c.company_name, search_term) > 0.3
  ORDER BY relevance DESC, similarity(c.company_name, search_term) DESC;
END;
$$ LANGUAGE plpgsql;

-- 創建通話記錄搜索函數
CREATE OR REPLACE FUNCTION search_call_records(search_term TEXT)
RETURNS TABLE (
  id INT,
  customer_id INT,
  call_date TIMESTAMP,
  summary TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.customer_id,
    cr.call_date,
    cr.summary::TEXT,
    ts_rank(
      to_tsvector('english',
        COALESCE(cr.summary, '') || ' ' ||
        COALESCE(cr.action_items, '')
      ),
      plainto_tsquery('english', search_term)
    ) as relevance
  FROM call_records cr
  WHERE
    to_tsvector('english',
      COALESCE(cr.summary, '') || ' ' ||
      COALESCE(cr.action_items, '')
    ) @@ plainto_tsquery('english', search_term)
  ORDER BY relevance DESC, cr.call_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 創建綜合搜索視圖
CREATE OR REPLACE VIEW comprehensive_search AS
SELECT
  'customer' as entity_type,
  c.id as entity_id,
  c.company_name as title,
  c.notes as content,
  c.created_at,
  to_tsvector('english',
    COALESCE(c.company_name, '') || ' ' ||
    COALESCE(c.notes, '') || ' ' ||
    COALESCE(c.industry, '')
  ) as search_vector
FROM customers c
WHERE c.status != 'INACTIVE'

UNION ALL

SELECT
  'call_record' as entity_type,
  cr.id as entity_id,
  'Call with ' || cu.company_name as title,
  cr.summary as content,
  cr.created_at,
  to_tsvector('english',
    COALESCE(cr.summary, '') || ' ' ||
    COALESCE(cr.action_items, '')
  ) as search_vector
FROM call_records cr
JOIN customers cu ON cr.customer_id = cu.id
WHERE cr.status = 'COMPLETED'

UNION ALL

SELECT
  'proposal' as entity_type,
  p.id as entity_id,
  p.title,
  p.description as content,
  p.created_at,
  to_tsvector('english',
    COALESCE(p.title, '') || ' ' ||
    COALESCE(p.description, '')
  ) as search_vector
FROM proposals p
WHERE p.status != 'EXPIRED';

-- 為搜索視圖創建索引
CREATE INDEX IF NOT EXISTS comprehensive_search_vector_idx
ON comprehensive_search
USING GIN (search_vector);

-- 添加性能優化的複合索引
CREATE INDEX IF NOT EXISTS IX_Customer_Status_Industry_Size
ON customers (status, industry, company_size)
WHERE status IN ('PROSPECT', 'QUALIFIED', 'OPPORTUNITY');

CREATE INDEX IF NOT EXISTS IX_CallRecord_User_Outcome_Date
ON call_records (user_id, outcome, call_date DESC)
WHERE outcome IS NOT NULL;

CREATE INDEX IF NOT EXISTS IX_Proposal_Customer_Status_Value
ON proposals (customer_id, status, total_value DESC)
WHERE status IN ('SENT', 'UNDER_REVIEW', 'APPROVED');

-- 添加分區表索引（針對大數據量優化）
CREATE INDEX IF NOT EXISTS IX_AuditLog_Date_Partition
ON audit_logs (created_at, entity_type)
WHERE created_at >= CURRENT_DATE - INTERVAL '1 year';

-- 創建統計更新函數（提升查詢計劃器性能）
CREATE OR REPLACE FUNCTION update_search_statistics()
RETURNS VOID AS $$
BEGIN
  ANALYZE customers;
  ANALYZE call_records;
  ANALYZE proposals;
  ANALYZE documents;
  ANALYZE audit_logs;
END;
$$ LANGUAGE plpgsql;

-- 創建自動統計更新觸發器
CREATE OR REPLACE FUNCTION trigger_update_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- 每1000條記錄更新一次統計
  IF (TG_OP = 'INSERT' AND NEW.id % 1000 = 0) THEN
    PERFORM update_search_statistics();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 為主要表創建統計更新觸發器
DROP TRIGGER IF EXISTS trigger_customers_stats ON customers;
CREATE TRIGGER trigger_customers_stats
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_update_statistics();

DROP TRIGGER IF EXISTS trigger_call_records_stats ON call_records;
CREATE TRIGGER trigger_call_records_stats
  AFTER INSERT OR UPDATE OR DELETE ON call_records
  FOR EACH ROW EXECUTE FUNCTION trigger_update_statistics();

-- 添加查詢性能監控視圖
CREATE OR REPLACE VIEW query_performance_stats AS
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'call_records', 'proposals', 'documents')
ORDER BY tablename, attname;

COMMENT ON VIEW query_performance_stats IS 'Monitor query performance statistics for optimization';
COMMENT ON FUNCTION search_customers(TEXT) IS 'Full-text search function for customers with relevance ranking';
COMMENT ON FUNCTION search_call_records(TEXT) IS 'Full-text search function for call records with relevance ranking';