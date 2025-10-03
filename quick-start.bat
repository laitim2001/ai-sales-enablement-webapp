@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI 銷售賦能平台 - 快速啟動
echo ========================================
echo.

REM 加載環境變數
echo [1/4] 加載環境變數...
for /f "usebackq tokens=1,* delims==" %%a in (".env.local") do (
    set "line=%%a"
    REM 跳過註釋和空行
    if not "!line:~0,1!"=="#" if not "!line!"=="" (
        set "%%a=%%b"
    )
)
echo ✅ 環境變數已加載
echo.

REM 驗證資料庫連接
echo [2/4] 驗證資料庫連接...
docker exec ai-sales-postgres-dev pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL 運行正常
) else (
    echo ❌ PostgreSQL 連接失敗
    pause
    exit /b 1
)

docker exec ai-sales-redis-dev redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis 運行正常
) else (
    echo ❌ Redis 連接失敗
    pause
    exit /b 1
)
echo.

REM 推送資料庫 schema
echo [3/4] 推送資料庫 schema...
npx prisma db push --skip-generate
if %errorlevel% equ 0 (
    echo ✅ 資料庫 schema 已更新
) else (
    echo ⚠️  資料庫 schema 推送可能有問題
)
echo.

REM 啟動開發服務器
echo [4/4] 啟動 Next.js 開發服務器...
echo.
echo ========================================
echo 🚀 服務器啟動中...
echo ========================================
echo 訪問: http://localhost:3000
echo 按 Ctrl+C 停止服務器
echo.

npm run dev
