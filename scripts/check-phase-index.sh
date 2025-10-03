#!/bin/bash

# ================================================================
# 階段性索引檢查腳本
# ================================================================
# 用途: 在每個 Phase 完成時檢查新增文件是否已索引
# 使用: ./scripts/check-phase-index.sh [起始提交]
# 範例: ./scripts/check-phase-index.sh HEAD~5
# ================================================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 獲取起始提交 (默認為最近5個提交)
START_COMMIT=${1:-HEAD~5}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📋 階段性索引檢查${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 1. 列出新增的重要文件
echo -e "${YELLOW}1. 檢查 ${START_COMMIT} 到 HEAD 之間新增的文件...${NC}"
echo ""

NEW_FILES=$(git diff --name-only --diff-filter=A $START_COMMIT HEAD | \
  grep -E '\.(ts|tsx|md)$' | \
  grep -E 'lib/|components/|app/api/|app/dashboard/|docs/' | \
  sort)

if [ -z "$NEW_FILES" ]; then
    echo -e "${GREEN}✅ 沒有新增重要文件${NC}"
    exit 0
fi

echo -e "${BLUE}發現以下新增文件:${NC}"
echo "$NEW_FILES" | sed 's/^/  - /'
echo ""

# 2. 檢查這些文件是否已索引
echo -e "${YELLOW}2. 檢查索引狀態...${NC}"
echo ""

MISSING_FILES=""
INDEXED_FILES=""
TOTAL_FILES=0
MISSING_COUNT=0
INDEXED_COUNT=0

while IFS= read -r file; do
    TOTAL_FILES=$((TOTAL_FILES + 1))

    # 檢查文件名是否在 PROJECT-INDEX.md 中
    if grep -q "$file" PROJECT-INDEX.md 2>/dev/null; then
        echo -e "  ${GREEN}✅${NC} $file - 已索引"
        INDEXED_FILES="$INDEXED_FILES$file\n"
        INDEXED_COUNT=$((INDEXED_COUNT + 1))
    else
        echo -e "  ${RED}❌${NC} $file - ${RED}未索引 ⚠️${NC}"
        MISSING_FILES="$MISSING_FILES$file\n"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done <<< "$NEW_FILES"

echo ""

# 3. 顯示統計
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 索引統計${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "  總文件數: ${BLUE}$TOTAL_FILES${NC}"
echo -e "  已索引: ${GREEN}$INDEXED_COUNT${NC}"
echo -e "  未索引: ${RED}$MISSING_COUNT${NC}"
echo ""

# 4. 如果有遺漏，顯示警告和建議
if [ $MISSING_COUNT -gt 0 ]; then
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}⚠️  發現未索引文件！${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo -e "${YELLOW}未索引文件列表:${NC}"
    echo -e "$MISSING_FILES" | grep -v '^$' | sed 's/^/  - /'
    echo ""
    echo -e "${YELLOW}建議操作:${NC}"
    echo ""
    echo "  1. 編輯 PROJECT-INDEX.md 添加上述文件索引"
    echo "  2. 確定文件分類 (lib/, components/, app/api/ 等)"
    echo "  3. 添加文件描述和重要程度標記"
    echo "  4. 提交索引更新:"
    echo ""
    echo -e "     ${BLUE}git add PROJECT-INDEX.md${NC}"
    echo -e "     ${BLUE}git commit -m \"docs: 更新索引 - Phase 新增文件\"${NC}"
    echo -e "     ${BLUE}git push origin main${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ 索引檢查通過！${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${GREEN}所有新增文件都已正確索引 🎉${NC}"
    echo ""
    exit 0
fi
