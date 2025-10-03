# AI 銷售賦能平台 - npm install 修復腳本 (PowerShell 版本)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修復 npm install 問題" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# [1/6] 停止所有 Node.js 進程
Write-Host "[1/6] 停止所有 Node.js 進程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "發現運行中的 Node.js 進程，正在停止..." -ForegroundColor White
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 3
    Write-Host "✅ Node.js 進程已停止" -ForegroundColor Green
} else {
    Write-Host "✅ 沒有運行中的 Node.js 進程" -ForegroundColor Green
}
Write-Host ""

# [2/6] 等待文件解鎖
Write-Host "[2/6] 等待文件解鎖..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✅ 等待完成" -ForegroundColor Green
Write-Host ""

# [3/6] 刪除 node_modules 目錄
Write-Host "[3/6] 刪除 node_modules 目錄..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "正在刪除 node_modules..." -ForegroundColor White
    try {
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ node_modules 已刪除" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 第一次嘗試失敗，重試中..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        try {
            Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction Stop
            Write-Host "✅ node_modules 已刪除" -ForegroundColor Green
        } catch {
            Write-Host "❌ 無法刪除 node_modules，可能有文件被鎖定" -ForegroundColor Red
            Write-Host "錯誤: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "請手動刪除後重新運行此腳本" -ForegroundColor Red
            Read-Host "按 Enter 鍵退出"
            exit 1
        }
    }
} else {
    Write-Host "✅ node_modules 不存在" -ForegroundColor Green
}
Write-Host ""

# [4/6] 刪除 package-lock.json
Write-Host "[4/6] 刪除 package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force
    Write-Host "✅ package-lock.json 已刪除" -ForegroundColor Green
} else {
    Write-Host "✅ package-lock.json 不存在" -ForegroundColor Green
}
Write-Host ""

# [5/6] 清除 npm 緩存
Write-Host "[5/6] 清除 npm 緩存..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✅ npm 緩存已清除" -ForegroundColor Green
Write-Host ""

# [6/6] 重新安裝依賴
Write-Host "[6/6] 重新安裝依賴（這可能需要幾分鐘）..." -ForegroundColor Yellow
Write-Host "正在運行: npm install --legacy-peer-deps" -ForegroundColor White
Write-Host ""
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ npm install 失敗" -ForegroundColor Red
    Write-Host "請檢查錯誤信息並重試" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 所有步驟完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步執行:" -ForegroundColor Yellow
Write-Host "1. npx prisma generate" -ForegroundColor White
Write-Host "2. npx prisma db push" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 鍵退出"
