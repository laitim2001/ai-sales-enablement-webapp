# 🚀 AI 銷售賦能平台 - 部署指南

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

### 外部服務

- **Azure OpenAI**: 用於 AI 功能
- **GitHub**: 用於代碼倉庫和 CI/CD

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
# 資料庫配置
DATABASE_URL="postgresql://username:password@localhost:5432/ai_sales_enablement"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Azure OpenAI 配置
AZURE_OPENAI_API_KEY="your-azure-openai-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
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
# 生產資料庫配置
DATABASE_URL="postgresql://prod_user:secure_password@postgres:5432/ai_sales_enablement_prod"

# Redis 配置
REDIS_URL="redis://redis:6379"

# 安全配置
JWT_SECRET="your-very-secure-jwt-secret-for-production"
NEXTAUTH_SECRET="your-very-secure-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Azure OpenAI 配置
AZURE_OPENAI_API_KEY="your-production-azure-openai-key"
AZURE_OPENAI_ENDPOINT="https://your-production-resource.openai.azure.com/"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"

# 資料庫憑證
POSTGRES_DB=ai_sales_enablement_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=secure_database_password

# 監控配置 (可選)
GRAFANA_PASSWORD=secure_grafana_password
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

#### Step 4: 配置 SSL (推薦)

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

```
# 資料庫配置
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD

# 應用程式配置
JWT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL

# Azure OpenAI
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_VERSION

# Docker Registry (可選)
DOCKER_USERNAME
DOCKER_PASSWORD

# 部署配置
STAGING_URL
GRAFANA_PASSWORD
```

#### 2. 觸發部署

```bash
# 自動觸發 (推送到 main 分支)
git push origin main

# 手動觸發部署
# 在 GitHub Actions 頁面使用 "workflow_dispatch"
```

## 📊 監控和維護

### 系統監控

#### Grafana 儀表板

訪問 `http://your-domain:3001` 查看監控儀表板：

- 應用程式性能指標
- 資料庫連接和查詢統計
- Redis 緩存命中率
- 系統資源使用率

#### Prometheus 指標

訪問 `http://your-domain:9090` 查看原始指標。

### 健康檢查

```bash
# 應用程式健康檢查
curl http://your-domain/api/health

# Docker 容器健康狀態
docker-compose -f docker-compose.prod.yml ps

# 服務日誌查看
docker-compose -f docker-compose.prod.yml logs -f app
```

### 備份策略

#### 資料庫備份

```bash
# 自動備份腳本
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U prod_user ai_sales_enablement_prod | \
  gzip > backup_${BACKUP_DATE}.sql.gz

# 保留最近 30 天的備份
find . -name "backup_*.sql.gz" -mtime +30 -delete
```

#### 應用程式數據備份

```bash
# 備份應用程式數據和配置
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  .env.production \
  docker-compose.prod.yml \
  nginx/ \
  monitoring/
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