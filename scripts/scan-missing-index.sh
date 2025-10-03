#!/bin/bash

# ================================================================
# 手動掃描未索引文件腳本
# ================================================================
# 用途: 掃描項目中所有重要文件，檢查是否已索引
# 使用: ./scripts/scan-missing-index.sh
# ================================================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🔍 掃描未索引文件${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 創建臨時文件
CURRENT_FILES=$(mktemp)
INDEXED_FILES=$(mktemp)
MISSING_FILES=$(mktemp)

# 清理函數
cleanup() {
    rm -f "$CURRENT_FILES" "$INDEXED_FILES" "$MISSING_FILES"
}
trap cleanup EXIT

echo -e "${YELLOW}1. 掃描項目中的所有重要文件...${NC}"
echo ""

# 查找所有重要的 .ts 和 .tsx 文件
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./dist/*" \
    -not -path "./.git/*" \
    -not -path "./build/*" | \
    grep -E '^\./(lib|components|app/api|app/dashboard)/' | \
    sed 's|^\./||' | \
    sort > "$CURRENT_FILES"

TOTAL_FILES=$(wc -l < "$CURRENT_FILES")
echo -e "  找到 ${BLUE}$TOTAL_FILES${NC} 個重要文件"
echo ""

echo -e "${YELLOW}2. 提取 PROJECT-INDEX.md 中已索引的文件...${NC}"
echo ""

# 提取索引文件中的所有 .ts 和 .tsx 文件路徑
grep -o '`[^`]*\.tsx\?`' PROJECT-INDEX.md 2>/dev/null | \
    tr -d '`' | \
    sort -u > "$INDEXED_FILES"

INDEXED_COUNT=$(wc -l < "$INDEXED_FILES")
echo -e "  索引中有 ${GREEN}$INDEXED_COUNT${NC} 個文件"
echo ""

echo -e "${YELLOW}3. 比對差異，查找未索引文件...${NC}"
echo ""

# 找出在當前文件中但不在索引中的文件
comm -23 "$CURRENT_FILES" "$INDEXED_FILES" > "$MISSING_FILES"

MISSING_COUNT=$(wc -l < "$MISSING_FILES")

if [ $MISSING_COUNT -eq 0 ]; then
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ 索引完整性檢查通過！${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${GREEN}所有重要文件都已正確索引 🎉${NC}"
    echo ""

    # 顯示統計
    COVERAGE=$(awk "BEGIN {printf \"%.1f\", ($INDEXED_COUNT / $TOTAL_FILES) * 100}")
    echo -e "${CYAN}📊 索引統計:${NC}"
    echo -e "  總文件數: ${BLUE}$TOTAL_FILES${NC}"
    echo -e "  已索引: ${GREEN}$INDEXED_COUNT${NC}"
    echo -e "  覆蓋率: ${GREEN}${COVERAGE}%${NC}"
    echo ""

    exit 0
else
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}⚠️  發現 $MISSING_COUNT 個未索引文件！${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""

    # 按目錄分類顯示未索引文件
    echo -e "${YELLOW}未索引文件列表 (按目錄分類):${NC}"
    echo ""

    # lib/ 目錄
    LIB_FILES=$(grep "^lib/" "$MISSING_FILES" || true)
    if [ ! -z "$LIB_FILES" ]; then
        echo -e "${CYAN}📚 lib/ 目錄:${NC}"
        echo "$LIB_FILES" | sed 's/^/  - /'
        echo ""
    fi

    # components/ 目錄
    COMP_FILES=$(grep "^components/" "$MISSING_FILES" || true)
    if [ ! -z "$COMP_FILES" ]; then
        echo -e "${CYAN}🧩 components/ 目錄:${NC}"
        echo "$COMP_FILES" | sed 's/^/  - /'
        echo ""
    fi

    # app/api/ 目錄
    API_FILES=$(grep "^app/api/" "$MISSING_FILES" || true)
    if [ ! -z "$API_FILES" ]; then
        echo -e "${CYAN}🔌 app/api/ 目錄:${NC}"
        echo "$API_FILES" | sed 's/^/  - /'
        echo ""
    fi

    # app/dashboard/ 目錄
    DASH_FILES=$(grep "^app/dashboard/" "$MISSING_FILES" || true)
    if [ ! -z "$DASH_FILES" ]; then
        echo -e "${CYAN}📊 app/dashboard/ 目錄:${NC}"
        echo "$DASH_FILES" | sed 's/^/  - /'
        echo ""
    fi

    # 顯示統計
    COVERAGE=$(awk "BEGIN {printf \"%.1f\", (($TOTAL_FILES - $MISSING_COUNT) / $TOTAL_FILES) * 100}")
    echo -e "${CYAN}📊 索引統計:${NC}"
    echo -e "  總文件數: ${BLUE}$TOTAL_FILES${NC}"
    echo -e "  已索引: ${GREEN}$(($TOTAL_FILES - $MISSING_COUNT))${NC}"
    echo -e "  未索引: ${RED}$MISSING_COUNT${NC}"
    echo -e "  覆蓋率: ${YELLOW}${COVERAGE}%${NC}"
    echo ""

    # 顯示建議操作
    echo -e "${YELLOW}建議操作:${NC}"
    echo ""
    echo "  1. 檢查上述未索引文件是否為重要文件"
    echo "  2. 編輯 PROJECT-INDEX.md 添加遺漏的文件"
    echo "  3. 為每個文件添加適當的分類和描述"
    echo "  4. 標記文件重要程度 (🔴 極高 / 🟡 高 / 🟢 中)"
    echo ""
    echo "  提交索引更新:"
    echo ""
    echo -e "    ${BLUE}git add PROJECT-INDEX.md${NC}"
    echo -e "    ${BLUE}git commit -m \"docs: 補充遺漏文件索引 - 添加 $MISSING_COUNT 個文件\"${NC}"
    echo -e "    ${BLUE}git push origin main${NC}"
    echo ""

    # 生成未索引文件列表到文件
    echo -e "${CYAN}💾 已將未索引文件列表保存到: ${YELLOW}missing-index-files.txt${NC}"
    cp "$MISSING_FILES" missing-index-files.txt
    echo ""

    exit 1
fi
