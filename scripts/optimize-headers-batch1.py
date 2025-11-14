#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件頭部優化腳本 - Batch 1
智能移除重複說明,保留完整信息並重組為標準格式
"""

import re
import os
from pathlib import Path
from datetime import datetime

# 項目根目錄
PROJECT_ROOT = Path(__file__).parent.parent

# Batch 1 文件清單 (50個文件)
BATCH1_FILES = [
    # P0 核心API (40個)
    "app/api/ai/generate-proposal/route.ts",
    "app/api/ai/regenerate-proposal/route.ts",
    "app/api/analytics/behaviors/route.ts",
    "app/api/analytics/profile/route.ts",
    "app/api/analytics/track/route.ts",
    "app/api/assistant/chat/route.ts",
    "app/api/audit-logs/route.ts",
    "app/api/audit-logs/export/route.ts",
    "app/api/audit-logs/stats/route.ts",
    "app/api/auth/azure-ad/callback/route.ts",
    "app/api/auth/azure-ad/login/route.ts",
    "app/api/auth/logout/route.ts",
    "app/api/auth/me/route.ts",
    "app/api/auth/refresh/route.ts",
    "app/api/calendar/auth/route.ts",
    "app/api/calendar/events/route.ts",
    "app/api/calendar/sync/route.ts",
    "app/api/collaboration/locks/route.ts",
    "app/api/collaboration/locks/lock/[lockId]/route.ts",
    "app/api/collaboration/locks/[resourceType]/[resourceId]/status/route.ts",
    "app/api/customers/route.ts",
    "app/api/customers/[id]/360-view/route.ts",
    "app/api/health/route.ts",
    "app/api/knowledge-base/advanced-search/route.ts",
    "app/api/knowledge-base/analytics/route.ts",
    "app/api/knowledge-base/bulk-upload/route.ts",
    "app/api/knowledge-base/check-duplicate/route.ts",
    "app/api/knowledge-base/processing/route.ts",
    "app/api/knowledge-base/search/route.ts",
    "app/api/knowledge-base/suggestions/route.ts",
    "app/api/knowledge-base/tags/route.ts",
    "app/api/knowledge-base/upload/route.ts",
    "app/api/knowledge-base/[id]/download/route.ts",
    "app/api/knowledge-base/[id]/versions/route.ts",
    "app/api/knowledge-base/[id]/versions/compare/route.ts",
    "app/api/knowledge-base/[id]/versions/revert/route.ts",
    "app/api/knowledge-base/[id]/versions/[versionId]/route.ts",
    "app/api/knowledge-folders/route.ts",
    "app/api/knowledge-folders/reorder/route.ts",
    "app/api/knowledge-folders/[id]/route.ts",
    "app/api/knowledge-folders/[id]/move/route.ts",
    # P1 核心組件 (10個)
    "components/knowledge/knowledge-base-list.tsx",
    "components/knowledge/knowledge-create-form.tsx",
    "components/knowledge/knowledge-document-edit.tsx",
    "components/knowledge/knowledge-document-view.tsx",
    "components/knowledge/enhanced-knowledge-search.tsx",
    "components/audit/AuditLogList.tsx",
    "components/audit/AuditLogStats.tsx",
    "components/layout/dashboard-header.tsx",
    "components/notifications/notification-bell.tsx",
    "components/ui/button.tsx",
]


def extract_header_content(file_content):
    """
    提取文件頭部註釋的完整內容
    Returns: (header_block, rest_of_file)
    """
    # 匹配從 /** 開始到 */ 結束的文件頭部
    header_pattern = r'^/\*\*.*?\*/'
    match = re.search(header_pattern, file_content, re.DOTALL)

    if not match:
        return None, file_content

    header = match.group(0)
    rest = file_content[match.end():].lstrip('\r\n')
    return header, rest


def parse_header_structure(header):
    """
    解析頭部註釋的結構
    Returns: dict with parsed sections
    """
    result = {
        'module': '',
        'fileoverview': '',
        'description': '',
        'created': '',
        'lastModified': '',
        'other_content': ''
    }

    # 提取 @module
    module_match = re.search(r'\*\s*@module\s+(.+?)(?:\r?\n|\s*\*)', header)
    if module_match:
        result['module'] = module_match.group(1).strip()

    # 提取 @created
    created_match = re.search(r'\*\s*@created\s+(.+?)(?:\r?\n|\s*\*)', header)
    if created_match:
        result['created'] = created_match.group(1).strip()

    # 提取 @lastModified
    modified_match = re.search(r'\*\s*@lastModified\s+(.+?)(?:\r?\n|\s*\*)', header)
    if modified_match:
        result['lastModified'] = modified_match.group(1).strip()

    # 提取 @fileoverview (包含其後所有內容直到 @module 或 @description)
    fileoverview_pattern = r'\*\s*@fileoverview\s+(.+?)(?=\*\s*@(?:module|description)|$)'
    fileoverview_match = re.search(fileoverview_pattern, header, re.DOTALL)
    if fileoverview_match:
        content = fileoverview_match.group(1)
        # 清理註釋符號和多餘空白
        content = re.sub(r'^\s*\*\s?', '', content, flags=re.MULTILINE)
        result['fileoverview'] = content.strip()

    # 提取 @description
    desc_pattern = r'\*\s*@description\s+(.+?)(?=\*\s*@(?:created|lastModified)|$)'
    desc_match = re.search(desc_pattern, header, re.DOTALL)
    if desc_match:
        content = desc_match.group(1)
        content = re.sub(r'^\s*\*\s?', '', content, flags=re.MULTILINE)
        result['description'] = content.strip()

    return result


def rebuild_header(parsed, file_path):
    """
    重建標準化的文件頭部
    """
    module = parsed['module'] or file_path.replace('\\', '/')
    fileoverview_content = parsed['fileoverview']
    created = parsed['created'] or '2025-10-08'

    # 構建新的頭部
    lines = ['/**']
    lines.append(f' * @fileoverview {fileoverview_content[:200]}...' if len(fileoverview_content) > 200 else f' * @fileoverview {fileoverview_content}')
    lines.append(f' * @module {module}')
    lines.append(' *')

    # 將fileoverview的詳細內容作為正文
    if fileoverview_content:
        # 移除開頭的分隔線和標題
        content = re.sub(r'^=+.*?=+', '', fileoverview_content, flags=re.DOTALL)
        content = content.strip()

        # 按行處理並添加
        for line in content.split('\n'):
            line = line.strip()
            if line:
                lines.append(f' * {line}')

    lines.append(' *')
    lines.append(f' * @created {created}')
    lines.append(' * @lastModified 2025-11-14')
    lines.append(' */')

    return '\n'.join(lines)


def optimize_file(file_path):
    """
    優化單個文件的頭部
    """
    full_path = PROJECT_ROOT / file_path

    if not full_path.exists():
        return {'status': 'skip', 'reason': '文件不存在'}

    try:
        # 讀取文件
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 提取頭部
        header, rest = extract_header_content(content)

        if not header:
            return {'status': 'skip', 'reason': '找不到文件頭部註釋'}

        # 解析頭部結構
        parsed = parse_header_structure(header)

        # 檢查是否有重複
        has_duplicate = bool(parsed['description'])

        if not has_duplicate:
            return {'status': 'skip', 'reason': '沒有發現重複說明'}

        # 計算原始行數
        original_lines = header.count('\n')

        # 重建頭部
        new_header = rebuild_header(parsed, file_path)

        # 組合新內容
        new_content = new_header + '\n\n' + rest

        # 寫回文件
        with open(full_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(new_content)

        new_lines = new_header.count('\n')
        removed_lines = original_lines - new_lines

        return {
            'status': 'success',
            'original_lines': original_lines,
            'new_lines': new_lines,
            'removed_lines': removed_lines
        }

    except Exception as e:
        return {'status': 'error', 'reason': str(e)}


def main():
    """主執行函數"""
    print("="*70)
    print("文件頭部優化腳本 - Batch 1 (50個P0+P1核心文件)")
    print("="*70)
    print(f"項目根目錄: {PROJECT_ROOT}")
    print(f"目標文件數: {len(BATCH1_FILES)}\n")

    results = {
        'success': 0,
        'skip': 0,
        'error': 0,
        'total_removed_lines': 0
    }

    success_files = []
    skip_files = []
    error_files = []

    for i, file_path in enumerate(BATCH1_FILES, 1):
        print(f"[{i}/{len(BATCH1_FILES)}] 處理: {file_path}")

        result = optimize_file(file_path)

        if result['status'] == 'success':
            results['success'] += 1
            results['total_removed_lines'] += result['removed_lines']
            success_files.append((file_path, result['removed_lines']))
            print(f"  [OK] 成功 (移除 {result['removed_lines']} 行)")

        elif result['status'] == 'skip':
            results['skip'] += 1
            skip_files.append((file_path, result['reason']))
            print(f"  [SKIP] 跳過: {result['reason']}")

        else:
            results['error'] += 1
            error_files.append((file_path, result['reason']))
            print(f"  [ERROR] 錯誤: {result['reason']}")

        # 每10個文件報告一次進度
        if i % 10 == 0:
            print(f"\n{'─'*70}")
            print(f"進度報告 ({i}/{len(BATCH1_FILES)})")
            print(f"成功: {results['success']} | 跳過: {results['skip']} | 錯誤: {results['error']}")
            print(f"已移除重複行數: {results['total_removed_lines']}")
            print(f"{'─'*70}\n")

    # 最終報告
    print("\n" + "="*70)
    print("Batch 1 優化完成!")
    print("="*70)
    print(f"統計結果:")
    print(f"  - 成功優化: {results['success']}/{len(BATCH1_FILES)} ({results['success']/len(BATCH1_FILES)*100:.1f}%)")
    print(f"  - 跳過文件: {results['skip']}")
    print(f"  - 錯誤文件: {results['error']}")
    print(f"  - 移除重複行數: {results['total_removed_lines']}")
    print(f"  - 平均優化: {results['total_removed_lines']/results['success'] if results['success'] > 0 else 0:.1f} 行/文件")

    if skip_files:
        print(f"\n跳過的文件 ({len(skip_files)}):")
        for file_path, reason in skip_files[:5]:  # 只顯示前5個
            print(f"  - {file_path}: {reason}")
        if len(skip_files) > 5:
            print(f"  ... 還有 {len(skip_files)-5} 個文件")

    if error_files:
        print(f"\n需要人工處理的文件 ({len(error_files)}):")
        for file_path, reason in error_files:
            print(f"  - {file_path}: {reason}")

    print("\n" + "="*70)
    print(f"處理完成! 請運行 TypeScript 編譯檢查:")
    print(f"   npx tsc --noEmit")
    print("="*70 + "\n")


if __name__ == '__main__':
    main()
