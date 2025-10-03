@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM 手動掃描未索引文件腳本 (Windows 版本)
REM ================================================================
REM 用途: 掃描項目中所有重要文件，檢查是否已索引
REM 使用: scripts\scan-missing-index.bat
REM ================================================================

echo ================================================
echo 🔍 掃描未索引文件
echo ================================================
echo.

echo 1. 掃描項目中的所有重要文件...
echo.

REM 創建臨時文件
set "CURRENT_FILES=%TEMP%\current_files.txt"
set "INDEXED_FILES=%TEMP%\indexed_files.txt"
set "MISSING_FILES=%TEMP%\missing_files.txt"

REM 清空臨時文件
type nul > "%CURRENT_FILES%"
type nul > "%INDEXED_FILES%"
type nul > "%MISSING_FILES%"

REM 查找所有重要的 .ts 和 .tsx 文件
for /r %%f in (*.ts *.tsx) do (
    set "file=%%f"
    set "file=!file:%CD%\=!"
    set "file=!file:\=/!"

    REM 排除 node_modules, .next, dist, .git, build
    echo !file! | findstr /i /c:"node_modules" /c:".next" /c:"dist" /c:".git" /c:"build" >nul
    if errorlevel 1 (
        REM 只包含重要目錄
        echo !file! | findstr /i /c:"lib/" /c:"components/" /c:"app/api/" /c:"app/dashboard/" >nul
        if not errorlevel 1 (
            echo !file! >> "%CURRENT_FILES%"
        )
    )
)

REM 排序當前文件
sort "%CURRENT_FILES%" /o "%CURRENT_FILES%"

REM 計算文件數
for /f %%A in ('type "%CURRENT_FILES%" ^| find /c /v ""') do set TOTAL_FILES=%%A
echo   找到 %TOTAL_FILES% 個重要文件
echo.

echo 2. 提取 PROJECT-INDEX.md 中已索引的文件...
echo.

REM 提取索引文件中的路徑 (簡化版，只提取文件名)
findstr /r "`.*\.tsx\?`" PROJECT-INDEX.md > "%TEMP%\raw_indexed.txt" 2>nul

REM 處理提取的路徑
for /f "tokens=*" %%L in (%TEMP%\raw_indexed.txt) do (
    set "line=%%L"
    REM 簡單提取 ` 之間的內容
    for /f "tokens=2 delims=`" %%P in ("!line!") do (
        echo %%P >> "%INDEXED_FILES%"
    )
)

sort "%INDEXED_FILES%" /o "%INDEXED_FILES%"

for /f %%A in ('type "%INDEXED_FILES%" ^| find /c /v ""') do set INDEXED_COUNT=%%A
echo   索引中有 %INDEXED_COUNT% 個文件
echo.

echo 3. 比對差異，查找未索引文件...
echo.

REM 查找未索引文件 (在當前文件中但不在索引中)
set MISSING_COUNT=0
for /f "usebackq tokens=*" %%F in ("%CURRENT_FILES%") do (
    findstr /x /c:"%%F" "%INDEXED_FILES%" >nul
    if errorlevel 1 (
        echo %%F >> "%MISSING_FILES%"
        set /a MISSING_COUNT+=1
    )
)

if %MISSING_COUNT% equ 0 (
    echo ================================================
    echo ✅ 索引完整性檢查通過！
    echo ================================================
    echo.
    echo 所有重要文件都已正確索引 🎉
    echo.

    REM 計算覆蓋率
    set /a COVERAGE=(%INDEXED_COUNT% * 100) / %TOTAL_FILES%
    echo 📊 索引統計:
    echo   總文件數: %TOTAL_FILES%
    echo   已索引: %INDEXED_COUNT%
    echo   覆蓋率: %COVERAGE%%%
    echo.

    goto :cleanup
)

echo ================================================
echo ⚠️  發現 %MISSING_COUNT% 個未索引文件！
echo ================================================
echo.

echo 未索引文件列表:
echo.
type "%MISSING_FILES%"
echo.

REM 計算覆蓋率
set /a INDEXED_ACTUAL=%TOTAL_FILES% - %MISSING_COUNT%
set /a COVERAGE=(%INDEXED_ACTUAL% * 100) / %TOTAL_FILES%

echo 📊 索引統計:
echo   總文件數: %TOTAL_FILES%
echo   已索引: %INDEXED_ACTUAL%
echo   未索引: %MISSING_COUNT%
echo   覆蓋率: %COVERAGE%%%
echo.

echo 建議操作:
echo.
echo   1. 檢查上述未索引文件是否為重要文件
echo   2. 編輯 PROJECT-INDEX.md 添加遺漏的文件
echo   3. 為每個文件添加適當的分類和描述
echo   4. 標記文件重要程度 (🔴 極高 / 🟡 高 / 🟢 中)
echo.
echo   提交索引更新:
echo.
echo     git add PROJECT-INDEX.md
echo     git commit -m "docs: 補充遺漏文件索引 - 添加 %MISSING_COUNT% 個文件"
echo     git push origin main
echo.

REM 保存未索引文件列表
copy "%MISSING_FILES%" missing-index-files.txt >nul
echo 💾 已將未索引文件列表保存到: missing-index-files.txt
echo.

:cleanup
REM 清理臨時文件
del "%CURRENT_FILES%" 2>nul
del "%INDEXED_FILES%" 2>nul
del "%MISSING_FILES%" 2>nul
del "%TEMP%\raw_indexed.txt" 2>nul

if %MISSING_COUNT% gtr 0 exit /b 1
exit /b 0
