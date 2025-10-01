@echo off
echo ========================================
echo AI 銷售賦能平台 - 服務重啟腳本
echo ========================================
echo.

echo [1/4] 停止 Next.js 開發服務器...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo 停止進程 PID: %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul
echo ✅ Next.js 開發服務器已停止
echo.

echo [2/4] 檢查 PostgreSQL 服務...
netstat -ano | findstr ":5433" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL 正在運行 (端口 5433)
) else (
    echo ⚠️  PostgreSQL 未運行，嘗試啟動 Docker 容器...
    docker start postgres-ai-sales 2>nul
    if %errorlevel% neq 0 (
        echo ❌ 無法啟動 PostgreSQL Docker 容器
        echo 請手動啟動 Docker Desktop 並執行:
        echo    docker start postgres-ai-sales
        echo 或啟動本地 PostgreSQL 服務
    ) else (
        echo ✅ PostgreSQL Docker 容器已啟動
        timeout /t 3 /nobreak >nul
    )
)
echo.

echo [3/4] 清理 Next.js 緩存...
if exist .next rmdir /s /q .next
echo ✅ Next.js 緩存已清理
echo.

echo [4/4] 啟動 Next.js 開發服務器...
echo 正在啟動服務器，請稍候...
echo.
echo ========================================
echo 服務器啟動中...
echo 請等待瀏覽器自動打開或訪問:
echo http://localhost:3000
echo ========================================
echo.

start /B npm run dev

echo.
echo ✅ 所有服務已重啟！
echo.
echo 測試登入憑證:
echo   Email: test@example.com
echo   Password: test123456
echo.
pause
