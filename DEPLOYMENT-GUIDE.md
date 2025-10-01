# 🚀 AI 銷售賦能平台 - 部署指南

> **版本**: v2.0.0 (更新至 MVP Phase 2 Sprint 5)
> **目的**: 提供本地開發、測試和生產環境的完整部署指導
> **適用**: 開發環境 | 測試環境 | 生產環境
> **最後更新**: 2025-10-02
> **變更記錄**: 新增 Azure AD SSO、監控系統、通知系統、工作流程引擎部署配置

本指南詳細說明如何部署 AI 銷售賦能平台到不同的環境中。

## 📋 目錄

- [環境要求](#環境要求)
- [本地開發部署](#本地開發部署)
- [Docker 部署](#docker-部署)
- [生產環境部署](#生產環境部署)
- [CI/CD 流程](#cicd-流程)
- [監控和維護](#監控和維護)
- [故障排除](#故障排除)

## 🔧 環境要求

### 基本要求

- **Node.js**: 18.x 或更高版本
- **PostgreSQL**: 15.x 或更高版本 (支持 pgvector 擴展)
- **Redis**: 7.x 或更高版本
- **Docker**: 24.x 或更高版本 (可選)
- **Docker Compose**: 2.x 或更高版本 (可選)

### 外部服務（雲端整合 - MVP Phase 1 + 2）

#### 🔴 必需服務
- **Azure OpenAI**: GPT-4 對話生成 + Embeddings 向量化
- **Dynamics 365 CRM**: 客戶關係管理和銷售數據整合
- **GitHub**: 代碼倉庫和 CI/CD 工作流

#### 🟡 企業功能服務（MVP Phase 2 實現）
- **Azure AD (Entra ID)**: 單一登入 SSO（Sprint 1 實現）
- **SendGrid / SMTP**: 郵件通知服務（Sprint 5 通知系統）
- **Grafana Cloud**: 生產環境監控（Sprint 2，可選本地部署）
- **Jaeger**: 分散式追蹤服務（Sprint 2，可選本地部署）

## 🏠 本地開發部署

### 1. 克隆倉庫

```bash
git clone https://github.com/yourusername/ai-sales-enablement-webapp.git
cd ai-sales-enablement-webapp
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 設置環境變數

複製環境變數範例文件：

```bash
cp .env.example .env.local
```

編輯 `.env.local` 並填入必要的配置：

```env
# ============================================
# 🔴 必需配置（核心功能）
# ============================================

# 1. 資料庫連接
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/ai_sales_db"

# 2. JWT 認證（至少32字符）
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"

# 3. Azure OpenAI（必需）
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_VERSION="2024-02-01"
AZURE_OPENAI_DEPLOYMENT_ID_GPT4="gpt-4"
AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS="text-embedding-ada-002"

# 4. Dynamics 365 CRM（必需）
DYNAMICS_365_TENANT_ID="your-azure-tenant-id"
DYNAMICS_365_CLIENT_ID="your-app-client-id"
DYNAMICS_365_CLIENT_SECRET="your-app-client-secret"
DYNAMICS_365_RESOURCE="https://your-org.crm5.dynamics.com/"

# ============================================
# 🟡 推薦配置（企業功能 - MVP Phase 2）
# ============================================

# 5. Azure AD SSO（Sprint 1 - 單一登入）
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"

# 6. 郵件服務（Sprint 5 - 通知系統）
EMAIL_SERVICE_API_KEY="your-sendgrid-api-key"
EMAIL_FROM_ADDRESS="noreply@your-domain.com"
EMAIL_FROM_NAME="AI Sales Platform"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# ============================================
# 🟢 可選配置（開發輔助）
# ============================================

# 7. 監控系統（Sprint 2 - 可選）
ENABLE_TELEMETRY="true"
OTEL_SERVICE_NAME="ai-sales-enablement-dev"

# 8. 功能開關
FEATURE_FLAG_AI_PROPOSALS="1"
FEATURE_FLAG_CRM_SYNC="1"
FEATURE_FLAG_ADVANCED_SEARCH="1"
```

**📋 環境變數檢查工具**：
```bash
# 自動檢查環境配置完整性
npm run env:check

# 互動式環境設置引導
npm run env:setup

# 自動修復常見配置問題
npm run env:auto-fix
```

### 4. 設置資料庫

```bash
# 啟動 PostgreSQL (使用 Docker)
docker run --name postgres-dev -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d pgvector/pgvector:pg15

# 生成 Prisma 客戶端
npm run db:generate

# 運行資料庫遷移
npm run db:push

# (可選) 運行種子數據
npm run db:seed
```

### 5. 啟動開發服務器

```bash
npm run dev
```

應用程式將在 `http://localhost:3000` 運行。

## 🐳 Docker 部署

### 開發環境 Docker 部署

```bash
# 啟動所有服務
docker-compose -f docker-compose.dev.yml up -d

# 查看日誌
docker-compose -f docker-compose.dev.yml logs -f

# 停止服務
docker-compose -f docker-compose.dev.yml down
```

### 生產環境 Docker 部署

```bash
# 構建並啟動生產環境
docker-compose -f docker-compose.prod.yml up -d

# 啟動包含監控的完整堆棧
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# 查看服務狀態
docker-compose -f docker-compose.prod.yml ps

# 查看特定服務日誌
docker-compose -f docker-compose.prod.yml logs -f app
```

## 🏭 生產環境部署

### 1. 服務器準備

#### 最低硬體要求

- **CPU**: 2 核心
- **記憶體**: 4GB RAM
- **儲存**: 20GB SSD
- **網路**: 穩定的網路連接

#### 推薦硬體配置

- **CPU**: 4 核心
- **記憶體**: 8GB RAM
- **儲存**: 50GB SSD
- **網路**: 高速網路連接

### 2. 環境配置

#### 安裝 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 部署步驟

#### Step 1: 準備部署文件

```bash
# 創建部署目錄
mkdir -p /opt/ai-sales-enablement
cd /opt/ai-sales-enablement

# 克隆倉庫
git clone https://github.com/yourusername/ai-sales-enablement-webapp.git .

# 創建生產環境變數文件
cp .env.example .env.production
```

#### Step 2: 配置環境變數

編輯 `.env.production`：

```env
# ============================================
# 🔴 核心服務配置（生產環境）
# ============================================

# 1. 生產資料庫配置
DATABASE_URL="postgresql://prod_user:CHANGE_ME_SECURE_DB_PASSWORD@postgres:5432/ai_sales_enablement_prod"
POSTGRES_DB="ai_sales_enablement_prod"
POSTGRES_USER="prod_user"
POSTGRES_PASSWORD="CHANGE_ME_SECURE_DB_PASSWORD"

# 2. Redis 配置（⚠️ 生產環境必須設置密碼）
REDIS_URL="redis://:CHANGE_ME_REDIS_PASSWORD@redis:6379"
REDIS_PASSWORD="CHANGE_ME_REDIS_PASSWORD"

# 3. 安全配置（⚠️ 使用強密碼生成器生成）
JWT_SECRET="CHANGE_ME_64_CHAR_RANDOM_STRING_FOR_JWT_SIGNING"
JWT_EXPIRES_IN="7d"

# 4. Azure OpenAI 配置
AZURE_OPENAI_API_KEY="your-production-azure-openai-key"
AZURE_OPENAI_ENDPOINT="https://your-production-resource.openai.azure.com/"
AZURE_OPENAI_API_VERSION="2024-02-01"
AZURE_OPENAI_DEPLOYMENT_ID_GPT4="gpt-4"
AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS="text-embedding-ada-002"

# 5. Dynamics 365 CRM（生產環境）
DYNAMICS_365_TENANT_ID="your-production-tenant-id"
DYNAMICS_365_CLIENT_ID="your-production-client-id"
DYNAMICS_365_CLIENT_SECRET="your-production-client-secret"
DYNAMICS_365_RESOURCE="https://your-org.crm5.dynamics.com/"

# ============================================
# 🟡 企業功能配置（MVP Phase 2）
# ============================================

# 6. Azure AD SSO（Sprint 1 - 生產環境必需）
AZURE_AD_CLIENT_ID="your-production-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-production-azure-ad-secret"
AZURE_AD_TENANT_ID="your-production-azure-ad-tenant"

# 7. 郵件服務（Sprint 5 - 生產環境必需）
EMAIL_SERVICE_API_KEY="your-production-sendgrid-api-key"
EMAIL_FROM_ADDRESS="noreply@your-production-domain.com"
EMAIL_FROM_NAME="AI Sales Enablement Platform"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-production-sendgrid-api-key"

# ============================================
# 📊 監控系統配置（Sprint 2 - 強烈推薦）
# ============================================

# 8. 監控服務
ENABLE_TELEMETRY="true"
OTEL_SERVICE_NAME="ai-sales-enablement-prod"
GRAFANA_PASSWORD="CHANGE_ME_SECURE_GRAFANA_PASSWORD"
PROMETHEUS_PASSWORD="CHANGE_ME_SECURE_PROMETHEUS_PASSWORD"

# ============================================
# ⚡ 性能優化配置（Sprint 4）
# ============================================

# 9. API 緩存設置
API_CACHE_TTL="300"  # 5分鐘
API_CACHE_ENABLED="true"

# 10. 速率限制
RATE_LIMIT_WINDOW="60000"  # 1分鐘
RATE_LIMIT_MAX_REQUESTS="100"  # 每IP每分鐘最多100次

# ============================================
# 🔔 通知系統配置（Sprint 5）
# ============================================

# 11. 通知設置
NOTIFICATION_RETENTION_DAYS="90"
NOTIFICATION_MAX_RETRIES="3"
NOTIFICATION_BATCH_SIZE="50"

# ============================================
# 🔧 生產環境設置
# ============================================

# 12. Node.js 環境
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"

# 13. 功能開關
FEATURE_FLAG_AI_PROPOSALS="1"
FEATURE_FLAG_CRM_SYNC="1"
FEATURE_FLAG_ADVANCED_SEARCH="1"
FEATURE_FLAG_SSO="1"
```

**🔒 生產環境安全檢查清單**：
```bash
# 1. 生成強密碼（使用此命令）
openssl rand -base64 48

# 2. 驗證所有 CHANGE_ME_ 佔位符已替換
grep "CHANGE_ME_" .env.production

# 3. 檢查文件權限（只有部署用戶可讀）
chmod 600 .env.production

# 4. 驗證環境配置
docker-compose -f docker-compose.prod.yml config --quiet && echo "✅ Configuration valid"
```

#### Step 3: 部署應用程式

```bash
# 拉取最新鏡像並啟動服務
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 等待服務啟動並檢查狀態
sleep 30
docker-compose -f docker-compose.prod.yml ps

# 檢查健康狀態
curl http://localhost/health
```

#### Step 4: 部署監控系統（強烈推薦 - Sprint 2 實現）

```bash
# 啟動完整監控堆棧
docker-compose -f docker-compose.monitoring.yml up -d

# 等待監控服務啟動
sleep 20

# 驗證監控服務狀態
curl http://localhost:3001/api/health  # Grafana
curl http://localhost:9090/-/healthy   # Prometheus
curl http://localhost:16686/           # Jaeger

# 訪問監控儀表板
echo "📊 Grafana: http://your-domain:3001 (admin/admin)"
echo "📈 Prometheus: http://your-domain:9090"
echo "🔍 Jaeger: http://your-domain:16686"
```

**📊 監控系統配置檢查清單**：
- ✅ Grafana 儀表板可訪問且顯示數據
- ✅ Prometheus 正在收集應用指標
- ✅ Jaeger 正在追蹤分散式請求
- ✅ Alertmanager 告警規則已配置

#### Step 5: 配置 SSL（推薦）

使用 Let's Encrypt 配置 SSL：

```bash
# 安裝 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 獲取 SSL 證書
sudo certbot --nginx -d your-domain.com

# 設置自動續期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## ⚙️ CI/CD 流程

### GitHub Actions 工作流程

本項目使用 GitHub Actions 進行自動化 CI/CD，包含以下流程：

#### CI 流程 (`.github/workflows/ci.yml`)

1. **代碼品質檢查**
   - ESLint 代碼風格檢查
   - TypeScript 類型檢查
   - 安全漏洞掃描

2. **自動化測試**
   - 單元測試
   - 集成測試
   - E2E 測試 (可選)

3. **應用程式構建**
   - Next.js 應用構建
   - Docker 鏡像構建

#### CD 流程 (`.github/workflows/deploy.yml`)

1. **部署前檢查**
   - 驗證環境變數
   - 檢查資料庫連接

2. **資料庫遷移**
   - 運行 Prisma 遷移
   - 更新資料庫 schema

3. **分階段部署**
   - Staging 環境部署
   - 煙霧測試
   - 生產環境部署 (手動觸發)

### 設置 CI/CD

#### 1. 配置 GitHub Secrets

在 GitHub 倉庫設置中添加以下 Secrets：

```bash
# ============================================
# 🔴 核心服務配置（必需）
# ============================================

# 資料庫配置
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD

# Redis 配置
REDIS_URL
REDIS_PASSWORD

# JWT 認證
JWT_SECRET
JWT_EXPIRES_IN

# Azure OpenAI
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_VERSION
AZURE_OPENAI_DEPLOYMENT_ID_GPT4
AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS

# Dynamics 365 CRM
DYNAMICS_365_TENANT_ID
DYNAMICS_365_CLIENT_ID
DYNAMICS_365_CLIENT_SECRET
DYNAMICS_365_RESOURCE

# ============================================
# 🟡 企業功能配置（MVP Phase 2）
# ============================================

# Azure AD SSO（Sprint 1）
AZURE_AD_CLIENT_ID
AZURE_AD_CLIENT_SECRET
AZURE_AD_TENANT_ID

# 郵件服務（Sprint 5）
EMAIL_SERVICE_API_KEY
EMAIL_FROM_ADDRESS
EMAIL_FROM_NAME
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS

# ============================================
# 📊 監控系統配置（Sprint 2）
# ============================================

# 監控服務密碼
GRAFANA_PASSWORD
PROMETHEUS_PASSWORD

# 遙測配置
ENABLE_TELEMETRY
OTEL_SERVICE_NAME

# ============================================
# 🔧 部署配置
# ============================================

# Docker Registry（可選）
DOCKER_USERNAME
DOCKER_PASSWORD

# 部署環境
STAGING_URL
PRODUCTION_URL
NEXT_PUBLIC_APP_URL

# Node.js 環境
NODE_ENV
```

**📋 GitHub Secrets 配置工具**：
```bash
# 使用 GitHub CLI 批量添加 secrets
gh secret set DATABASE_URL -b"postgresql://..."
gh secret set JWT_SECRET -b"$(openssl rand -base64 48)"
gh secret set REDIS_PASSWORD -b"$(openssl rand -base64 32)"

# 驗證所有 secrets 已設置
gh secret list
```

#### 2. 觸發部署

```bash
# 自動觸發 (推送到 main 分支)
git push origin main

# 手動觸發部署
# 在 GitHub Actions 頁面使用 "workflow_dispatch"
```

## 📊 監控和維護

### 系統監控（MVP Phase 2 Sprint 2 實現）

#### Grafana 儀表板

訪問 `http://your-domain:3001` 查看監控儀表板：

**📈 核心指標**：
- 應用程式性能指標（響應時間、請求量、錯誤率）
- 資料庫連接池和查詢統計
- Redis 緩存命中率和記憶體使用
- 系統資源使用率（CPU、記憶體、磁碟）

**🔔 通知系統指標**（Sprint 5）：
- 通知發送成功/失敗率
- 郵件發送延遲
- 站內通知未讀數量
- 通知重試次數統計

**⚡ 性能優化指標**（Sprint 4）：
- API 緩存命中率
- 熔斷器觸發次數
- DataLoader 批次效率
- 重試策略成功率

**🔐 API Gateway 指標**（Sprint 1）：
- 速率限制觸發統計
- CORS 請求數量
- 安全頭部合規性
- 請求驗證失敗率

#### Prometheus 指標

訪問 `http://your-domain:9090` 查看原始指標：

```promql
# 應用程式健康狀態
up{job="ai-sales-enablement-app"}

# HTTP 請求速率
rate(http_requests_total[5m])

# 資料庫連接池使用率
db_connections_active / db_connections_max

# Redis 緩存命中率
rate(redis_cache_hits_total[5m]) / rate(redis_cache_requests_total[5m])

# 通知系統指標
rate(notification_sent_total{status="success"}[5m])
rate(notification_sent_total{status="failed"}[5m])

# API Gateway 速率限制
rate(rate_limit_exceeded_total[5m])
```

#### Jaeger 分散式追蹤

訪問 `http://your-domain:16686` 查看請求追蹤：

**追蹤範圍**：
- API 端點完整請求鏈路
- 資料庫查詢時序和性能
- Redis 緩存操作
- 外部服務調用（Azure OpenAI、Dynamics 365、SendGrid）
- 工作流程引擎狀態轉換
- 通知系統處理流程

### 健康檢查

```bash
# ============================================
# 🔴 核心服務健康檢查
# ============================================

# 應用程式健康檢查
curl http://your-domain/api/health
# 期望輸出: {"status":"ok","timestamp":"..."}

# PostgreSQL 資料庫檢查
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U prod_user -d ai_sales_enablement_prod -c "SELECT version();"

# Redis 連接檢查
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# 期望輸出: PONG

# ============================================
# 🟡 企業功能健康檢查（MVP Phase 2）
# ============================================

# 通知系統健康檢查（Sprint 5）
curl http://your-domain/api/notifications/health
# 檢查郵件服務連接
curl http://your-domain/api/notifications/email/test

# 工作流程引擎健康檢查（Sprint 5）
curl http://your-domain/api/workflows/health

# Azure AD SSO 連接檢查（Sprint 1）
curl http://your-domain/api/auth/azure/health

# ============================================
# 📊 監控系統健康檢查（Sprint 2）
# ============================================

# Grafana 健康檢查
curl http://your-domain:3001/api/health

# Prometheus 健康檢查
curl http://your-domain:9090/-/healthy

# Jaeger 健康檢查
curl http://your-domain:16686/

# Alertmanager 健康檢查
curl http://your-domain:9093/-/healthy

# ============================================
# 🔧 容器狀態檢查
# ============================================

# 所有容器健康狀態
docker-compose -f docker-compose.prod.yml ps

# 查看特定服務日誌
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f redis

# 查看資源使用情況
docker stats --no-stream
```

### 備份策略

#### 資料庫備份（包含工作流程和通知數據）

```bash
# 完整資料庫備份腳本
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgres"
mkdir -p ${BACKUP_DIR}

# 執行 PostgreSQL 完整備份
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U prod_user -Fc ai_sales_enablement_prod | \
  gzip > ${BACKUP_DIR}/backup_${BACKUP_DATE}.sql.gz

# 備份特定資料表（關鍵數據）
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U prod_user -Fc -t users -t proposals -t workflows -t notifications \
  ai_sales_enablement_prod | \
  gzip > ${BACKUP_DIR}/critical_${BACKUP_DATE}.sql.gz

# 驗證備份完整性
gunzip -t ${BACKUP_DIR}/backup_${BACKUP_DATE}.sql.gz && \
  echo "✅ 備份驗證成功" || echo "❌ 備份驗證失敗"

# 保留最近 30 天的備份
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +30 -delete
find ${BACKUP_DIR} -name "critical_*.sql.gz" -mtime +30 -delete

# 上傳到雲端存儲（可選）
# aws s3 cp ${BACKUP_DIR}/backup_${BACKUP_DATE}.sql.gz s3://your-bucket/backups/
```

#### Redis 數據備份

```bash
# Redis 持久化數據備份
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"
mkdir -p ${BACKUP_DIR}

# 觸發 Redis 保存
docker-compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE

# 等待保存完成
sleep 5

# 複製 RDB 文件
docker cp ai-sales-redis-prod:/data/dump.rdb \
  ${BACKUP_DIR}/redis_${BACKUP_DATE}.rdb

# 壓縮備份
gzip ${BACKUP_DIR}/redis_${BACKUP_DATE}.rdb

# 保留最近 7 天的 Redis 備份
find ${BACKUP_DIR} -name "redis_*.rdb.gz" -mtime +7 -delete

echo "✅ Redis 備份完成: ${BACKUP_DIR}/redis_${BACKUP_DATE}.rdb.gz"
```

#### 應用程式配置和數據備份

```bash
# 備份應用程式配置和關鍵文件
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/app"
mkdir -p ${BACKUP_DIR}

tar -czf ${BACKUP_DIR}/app_config_${BACKUP_DATE}.tar.gz \
  .env.production \
  docker-compose.prod.yml \
  docker-compose.monitoring.yml \
  nginx/ \
  monitoring/prometheus/ \
  monitoring/grafana/ \
  prisma/schema.prisma

# 保留最近 90 天的配置備份
find ${BACKUP_DIR} -name "app_config_*.tar.gz" -mtime +90 -delete

echo "✅ 應用配置備份完成: ${BACKUP_DIR}/app_config_${BACKUP_DATE}.tar.gz"
```

#### 自動化備份 Cron 任務

```bash
# 編輯 crontab
crontab -e

# 添加以下備份任務
# 每日凌晨 2:00 執行完整資料庫備份
0 2 * * * /opt/ai-sales-enablement/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1

# 每 6 小時執行 Redis 備份
0 */6 * * * /opt/ai-sales-enablement/scripts/backup-redis.sh >> /var/log/backup-redis.log 2>&1

# 每週日凌晨 3:00 執行應用配置備份
0 3 * * 0 /opt/ai-sales-enablement/scripts/backup-app-config.sh >> /var/log/backup-app-config.log 2>&1

# 每月 1 號清理舊備份日誌
0 4 1 * * find /var/log -name "backup-*.log" -mtime +30 -delete
```

## 🔧 故障排除

### 常見問題和解決方案

#### 1. 資料庫連接失敗

**症狀**: 應用程式無法連接到資料庫

```bash
# 檢查 PostgreSQL 容器狀態
docker-compose -f docker-compose.prod.yml logs postgres

# 檢查資料庫連接
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U prod_user -d ai_sales_enablement_prod -c "SELECT version();"

# 重新啟動資料庫服務
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 2. Redis 緩存問題

**症狀**: 應用程式響應緩慢，緩存不工作

```bash
# 檢查 Redis 狀態
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# 查看 Redis 記憶體使用
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory

# 清空 Redis 緩存
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

#### 3. Next.js 應用程式錯誤

**症狀**: 應用程式啟動失敗或運行時錯誤

```bash
# 查看應用程式日誌
docker-compose -f docker-compose.prod.yml logs app

# 重新構建應用程式鏡像
docker-compose -f docker-compose.prod.yml build --no-cache app

# 檢查環境變數配置
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)"
```

#### 4. SSL 證書問題

**症狀**: HTTPS 無法訪問或證書過期

```bash
# 檢查證書狀態
sudo certbot certificates

# 手動更新證書
sudo certbot renew

# 重新加載 Nginx 配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 性能優化

#### 1. 資料庫優化

```sql
-- 檢查慢查詢
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 分析表統計
ANALYZE;

-- 重建索引
REINDEX DATABASE ai_sales_enablement_prod;
```

#### 2. 應用程式優化

```bash
# 檢查應用程式記憶體使用
docker stats ai-sales-enablement-app

# 調整 Node.js 記憶體限制
docker-compose -f docker-compose.prod.yml up -d \
  --scale app=0 \
  -e NODE_OPTIONS="--max_old_space_size=2048"
```

## 🆙 更新和升級

### 應用程式更新

```bash
# 1. 備份當前版本
cp .env.production .env.production.backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U prod_user ai_sales_enablement_prod > backup_before_update.sql

# 2. 拉取最新代碼
git pull origin main

# 3. 更新服務
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 4. 運行資料庫遷移 (如果需要)
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate:deploy

# 5. 驗證更新
curl http://your-domain/api/health
```

### 回滾程序

```bash
# 1. 回滾到前一個版本
git reset --hard HEAD~1

# 2. 重新部署
docker-compose -f docker-compose.prod.yml up -d --build

# 3. 如果需要，恢復資料庫備份
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U prod_user -d ai_sales_enablement_prod < backup_before_update.sql
```

## 📞 支援和維護

### 聯絡信息

- **技術支援**: [support@your-domain.com](mailto:support@your-domain.com)
- **緊急聯絡**: [emergency@your-domain.com](mailto:emergency@your-domain.com)
- **文檔**: [docs.your-domain.com](https://docs.your-domain.com)

### 定期維護任務

- **每日**: 檢查應用程式健康狀態和監控指標
- **每週**: 檢查和清理日誌文件，更新系統安全補丁
- **每月**: 檢查備份完整性，進行性能優化評估
- **每季**: 檢查和更新依賴套件，進行安全審計

---

**🎯 記住：定期備份、監控系統狀態、保持依賴更新是成功生產部署的關鍵！**