# AI 銷售賦能平台 - 開發服務器啟動腳本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI 銷售賦能平台 - 啟動開發環境" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Docker 容器狀態
Write-Host "[1/5] 檢查 Docker 服務..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=ai-sales-postgres-dev" --filter "status=running" --format "{{.Names}}"
$redisRunning = docker ps --filter "name=ai-sales-redis-dev" --filter "status=running" --format "{{.Names}}"

if ($postgresRunning) {
    Write-Host "✅ PostgreSQL 運行正常" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL 未運行，正在啟動..." -ForegroundColor Red
    docker start ai-sales-postgres-dev
    Start-Sleep -Seconds 10
}

if ($redisRunning) {
    Write-Host "✅ Redis 運行正常" -ForegroundColor Green
} else {
    Write-Host "❌ Redis 未運行，正在啟動..." -ForegroundColor Red
    docker start ai-sales-redis-dev
    Start-Sleep -Seconds 5
}
Write-Host ""

# 加載環境變數
Write-Host "[2/5] 加載環境變數..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Get-Content .env.local | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
    Write-Host "✅ 環境變數已加載" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local 文件不存在" -ForegroundColor Yellow
}
Write-Host ""

# 驗證資料庫連接
Write-Host "[3/5] 驗證資料庫連接..." -ForegroundColor Yellow
$dbTest = docker exec ai-sales-postgres-dev pg_isready -U postgres 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 資料庫連接正常" -ForegroundColor Green
} else {
    Write-Host "❌ 資料庫連接失敗" -ForegroundColor Red
    Write-Host $dbTest -ForegroundColor Red
}
Write-Host ""

# 推送資料庫 schema
Write-Host "[4/5] 推送資料庫 schema..." -ForegroundColor Yellow
Write-Host "執行: npx prisma db push" -ForegroundColor White
npx prisma db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 資料庫 schema 已更新" -ForegroundColor Green
} else {
    Write-Host "⚠️  資料庫 schema 推送可能有問題" -ForegroundColor Yellow
}
Write-Host ""

# 啟動開發服務器
Write-Host "[5/5] 啟動 Next.js 開發服務器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 服務器啟動中..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "訪問: http://localhost:3000" -ForegroundColor White
Write-Host "按 Ctrl+C 停止服務器" -ForegroundColor White
Write-Host ""

npm run dev
