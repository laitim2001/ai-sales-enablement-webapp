-- AI 銷售賦能平台 - 資料庫初始化腳本
-- 此腳本在 PostgreSQL 容器啟動時執行

-- 啟用 pgvector 擴展 (向量搜索)
CREATE EXTENSION IF NOT EXISTS vector;

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 啟用全文搜索擴展
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 創建應用程式專用角色 (可選)
-- CREATE ROLE ai_sales_app WITH LOGIN PASSWORD 'app_password_123';
-- GRANT ALL PRIVILEGES ON DATABASE ai_sales_db TO ai_sales_app;

-- 驗證擴展安裝
SELECT
    extname as "Extension",
    extversion as "Version"
FROM pg_extension
WHERE extname IN ('vector', 'uuid-ossp', 'pg_trgm', 'unaccent');

-- 顯示安裝完成訊息
\echo 'AI Sales Platform Database initialized successfully!'
\echo 'Extensions: vector, uuid-ossp, pg_trgm, unaccent'
\echo 'Ready for Prisma migrations...'