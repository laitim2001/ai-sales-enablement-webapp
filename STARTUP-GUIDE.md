# 🚀 AI 銷售賦能平台 - 服務啟動指南

> **目的**: 提供開發團隊和新成員快速啟動所有服務的標準流程
> **適用**: 本地開發環境
> **更新**: 每次服務配置變更後更新

---

## 📋 **快速啟動 (5分鐘)**

### 🎯 **一鍵啟動命令**
```bash
# 複製並填入環境變數
cp .env.example .env.local

# 啟動所有服務
docker-compose -f docker-compose.dev.yml up -d

# 等待服務就緒 (約30秒)
npm run services:health-check

# 啟動 Next.js 應用
npm run dev
```

---

## 🔧 **詳細啟動流程**

### **Step 1: 環境準備** (首次執行必須)

#### 1.1 檢查系統需求
```bash
# 檢查 Node.js 版本 (需要 18+)
node --version

# 檢查 npm 版本 (需要 8+)
npm --version

# 檢查 Docker 版本
docker --version
docker-compose --version
```

#### 1.2 安裝依賴
```bash
# 安裝 Node.js 依賴
npm install

# 安裝 POC 測試依賴
cd poc && npm install && cd ..
```

#### 1.3 環境變數配置
```bash
# 複製環境變數範例
cp .env.example .env.local

# 編輯 .env.local 填入實際值:
# - AZURE_OPENAI_API_KEY (必需)
# - AZURE_OPENAI_ENDPOINT (必需)
# - JWT_SECRET (必需，至少32字符)
```

### **Step 2: 啟動基礎服務** (必須按順序)

#### 2.1 啟動資料庫服務
```bash
# 啟動 PostgreSQL + pgvector
docker-compose -f docker-compose.dev.yml up -d postgres

# 等待服務啟動 (約30秒)
docker-compose -f docker-compose.dev.yml logs postgres

# 驗證 pgvector 擴展
docker exec $(docker-compose -f docker-compose.dev.yml ps -q postgres) \
  psql -U postgres -d ai_sales_db -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
```

#### 2.2 啟動快取服務
```bash
# 啟動 Redis
docker-compose -f docker-compose.dev.yml up -d redis

# 驗證 Redis 連接
docker exec $(docker-compose -f docker-compose.dev.yml ps -q redis) redis-cli ping
```

#### 2.3 初始化資料庫
```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 到資料庫
npx prisma db push

# 驗證表創建
npx prisma studio &
```

### **Step 3: 驗證外部服務**

#### 3.1 執行 POC 測試
```bash
# 進入 POC 目錄
cd poc

# 運行所有測試
node run-all-tests.js

# 檢查測試結果
cat poc-test-report.json
```

**期望結果**:
- ✅ Dynamics 365: 模擬模式通過
- ✅ PostgreSQL + pgvector: 連接和性能測試通過
- ✅ Azure OpenAI: 基本連接通過

### **Step 4: 啟動應用服務**

#### 4.1 啟動 Next.js 開發服務器
```bash
# 返回根目錄
cd ..

# 啟動開發服務器
npm run dev
```

#### 4.2 驗證服務運行狀態
```bash
# 檢查健康狀態
curl http://localhost:3000/api/health

# 測試認證 API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","firstName":"Test","lastName":"User"}'
```

---

## 📊 **服務端口分配**

| 服務 | 端口 | 用途 | 健康檢查 |
|------|------|------|----------|
| **Next.js App** | 3000 | 主應用 | `http://localhost:3000/api/health` |
| **PostgreSQL** | 5433 | 主資料庫 | `docker exec <container> pg_isready` |
| **Redis** | 6379 | 快取服務 | `docker exec <container> redis-cli ping` |
| **pgAdmin** | 8080 | 資料庫管理 | `http://localhost:8080` |

---

## 🔍 **問題排除指南**

### 常見問題 1: 端口衝突
```bash
# 檢查端口使用情況
netstat -an | grep :5433
netstat -an | grep :3000

# 強制停止服務
docker-compose -f docker-compose.dev.yml down
fuser -k 3000/tcp  # Linux/Mac
# Windows: netstat -ano | findstr :3000
```

### 常見問題 2: 資料庫連接失敗
```bash
# 檢查環境變數
echo $DATABASE_URL

# 重新生成 Prisma Client
rm -rf node_modules/.prisma
npx prisma generate

# 重置資料庫
npx prisma db push --force-reset
```

### 常見問題 3: Azure OpenAI 連接失敗
```bash
# 檢查 API 密鑰配置
echo $AZURE_OPENAI_API_KEY

# 測試基本連接
cd poc && node azure-openai-cost-test.js
```

---

## 🚨 **緊急重啟流程**

當服務出現問題時，按以下順序重啟：

```bash
# 1. 停止所有服務
docker-compose -f docker-compose.dev.yml down
pkill -f "npm run dev"

# 2. 清理容器和緩存
docker system prune -f
npm cache clean --force

# 3. 重新啟動 (按順序)
docker-compose -f docker-compose.dev.yml up -d postgres redis
sleep 30
npm run dev
```

---

## 📋 **服務狀態檢查清單**

### 每日開發啟動檢查
- [ ] ✅ PostgreSQL 容器運行且健康
- [ ] ✅ Redis 容器運行且響應
- [ ] ✅ pgvector 擴展已安裝
- [ ] ✅ Prisma Client 已生成
- [ ] ✅ 環境變數正確配置
- [ ] ✅ Azure OpenAI API 可連接
- [ ] ✅ Next.js 應用正常啟動
- [ ] ✅ 健康檢查 API 返回 200

### 新環境設置檢查
- [ ] ✅ Node.js 18+ 已安裝
- [ ] ✅ Docker 和 Docker Compose 已安裝
- [ ] ✅ 環境變數已配置
- [ ] ✅ POC 測試全部通過
- [ ] ✅ 資料庫 schema 已部署
- [ ] ✅ 所有服務端口正常

---

## 🔄 **服務依賴關係圖**

```
Azure OpenAI API ─┐
                  │
Dynamics 365 API ─┼─── Next.js App (port 3000)
                  │         │
                  │         ├─── Prisma Client
                  │         │         │
Redis (port 6379) ┘         │         ▼
                            │    PostgreSQL + pgvector
                            │    (port 5433)
                            │
                            ▼
                      pgAdmin (port 8080)
                      [可選資料庫管理]
```

---

## 📞 **支援和文檔**

- **技術問題**: 檢查 `poc/README.md` 的故障排除章節
- **API 文檔**: 查看 `docs/api-specification.md`
- **資料庫 Schema**: 查看 `prisma/schema.prisma`
- **環境配置**: 查看 `.env.example` 的詳細說明

---

**🎯 此文檔應在每次服務配置變更後更新，確保團隊成員都能快速啟動開發環境！**