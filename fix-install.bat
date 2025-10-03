@echo off
echo ========================================
echo 修復 npm install 問題
echo ========================================
echo.

echo [1/6] 停止所有 Node.js 進程...
tasklist | findstr node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo 發現運行中的 Node.js 進程，正在停止...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo ✅ Node.js 進程已停止
) else (
    echo ✅ 沒有運行中的 Node.js 進程
)
echo.

echo [2/6] 等待文件解鎖...
timeout /t 5 /nobreak >nul
echo ✅ 等待完成
echo.

echo [3/6] 刪除 node_modules 目錄...
if exist node_modules (
    echo 正在刪除 node_modules...
    rmdir /s /q node_modules 2>nul
    if exist node_modules (
        echo ⚠️  第一次嘗試失敗，重試中...
        timeout /t 3 /nobreak >nul
        rmdir /s /q node_modules 2>nul
    )
    if exist node_modules (
        echo ❌ 無法刪除 node_modules，可能有文件被鎖定
        echo 請手動刪除後重新運行此腳本
        pause
        exit /b 1
    )
    echo ✅ node_modules 已刪除
) else (
    echo ✅ node_modules 不存在
)
echo.

echo [4/6] 刪除 package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json
    echo ✅ package-lock.json 已刪除
) else (
    echo ✅ package-lock.json 不存在
)
echo.

echo [5/6] 清除 npm 緩存...
npm cache clean --force
echo ✅ npm 緩存已清除
echo.

echo [6/6] 重新安裝依賴（這可能需要幾分鐘）...
echo 正在運行: npm install --legacy-peer-deps
echo.
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo ❌ npm install 失敗
    echo 請檢查錯誤信息並重試
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ 所有步驟完成！
echo ========================================
echo.
echo 下一步執行:
echo 1. npx prisma generate
echo 2. npx prisma db push
echo 3. npm run dev
echo.
pause
