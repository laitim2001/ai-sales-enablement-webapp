#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件頭部優化腳本 - Batch 3
處理50個P2+P3核心服務和中間件文件
"""

import re
import os
from pathlib import Path

# 項目根目錄
PROJECT_ROOT = Path(__file__).parent.parent

# Batch 3 文件清單 (50個P2+P3文件)
BATCH3_FILES = [
    # P2 核心服務 - 剩餘部分 (25個)
    "lib/workflow/approval-manager.ts",
    "lib/workflow/comment-system.ts",
    "lib/workflow/engine.ts",
    "lib/workflow/index.ts",
    "lib/workflow/version-control.ts",
    "lib/knowledge/analytics-service.ts",
    "lib/knowledge/full-text-search.ts",
    "lib/knowledge/index.ts",
    "lib/knowledge/search-history-manager.ts",
    "lib/knowledge/version-control.ts",
    "lib/meeting/index.ts",
    "lib/meeting/meeting-intelligence-analyzer.ts",
    "lib/meeting/meeting-prep-package.ts",
    "lib/recommendation/index.ts",
    "lib/recommendation/recommendation-engine.ts",
    "lib/reminder/index.ts",
    "lib/reminder/reminder-rule-engine.ts",
    "lib/reminder/reminder-scheduler.ts",
    "lib/notification/email-service.ts",
    "lib/notification/engine.ts",
    "lib/notification/in-app-service.ts",
    "lib/notification/index.ts",
    "lib/integrations/customer-360/service.ts",
    "lib/integrations/dynamics365/auth.ts",
    "lib/integrations/dynamics365/client.ts",

    # P3 中間件和工具 (25個)
    "lib/middleware.ts",
    "lib/middleware/api-versioning.ts",
    "lib/middleware/cors.ts",
    "lib/middleware/https-enforcement.ts",
    "lib/middleware/rate-limiter.ts",
    "lib/middleware/request-id.ts",
    "lib/middleware/request-transformer.ts",
    "lib/middleware/request-validator.ts",
    "lib/middleware/response-cache.ts",
    "lib/middleware/response-transformer.ts",
    "lib/middleware/route-matcher.ts",
    "lib/middleware/routing-config.ts",
    "lib/middleware/security-headers.ts",
    "lib/monitoring/backend-factory.ts",
    "lib/monitoring/config.ts",
    "lib/monitoring/connection-monitor.ts",
    "lib/monitoring/middleware.ts",
    "lib/monitoring/monitor-init.ts",
    "lib/monitoring/performance-monitor.ts",
    "lib/monitoring/telemetry.ts",
    "lib/parsers/excel-parser.ts",
    "lib/parsers/image-ocr-parser.ts",
    "lib/parsers/index.ts",
    "lib/parsers/pdf-parser.ts",
    "lib/parsers/word-parser.ts",
]


def extract_header_content(file_content):
    """提取文件頭部註釋"""
    header_pattern = r'^/\*\*.*?\*/'
    match = re.search(header_pattern, file_content, re.DOTALL)
    if not match:
        return None, file_content
    header = match.group(0)
    rest = file_content[match.end():].lstrip('\r\n')
    return header, rest


def parse_header_structure(header):
    """解析頭部註釋結構"""
    result = {
        'module': '',
        'fileoverview': '',
        'description': '',
        'created': '',
        'lastModified': '',
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

    # 提取 @fileoverview
    fileoverview_pattern = r'\*\s*@fileoverview\s+(.+?)(?=\*\s*@(?:module|description)|$)'
    fileoverview_match = re.search(fileoverview_pattern, header, re.DOTALL)
    if fileoverview_match:
        content = fileoverview_match.group(1)
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
    """重建標準化的文件頭部"""
    module = parsed['module'] or file_path.replace('\\', '/')
    fileoverview_content = parsed['fileoverview']
    created = parsed['created'] or '2025-10-08'

    lines = ['/**']
    lines.append(f' * @fileoverview {fileoverview_content[:200]}...' if len(fileoverview_content) > 200 else f' * @fileoverview {fileoverview_content}')
    lines.append(f' * @module {module}')
    lines.append(' *')

    if fileoverview_content:
        content = re.sub(r'^=+.*?=+', '', fileoverview_content, flags=re.DOTALL)
        content = content.strip()
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
    """優化單個文件"""
    full_path = PROJECT_ROOT / file_path

    if not full_path.exists():
        return {'status': 'skip', 'reason': '文件不存在'}

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        header, rest = extract_header_content(content)
        if not header:
            return {'status': 'skip', 'reason': '找不到文件頭部註釋'}

        parsed = parse_header_structure(header)
        has_duplicate = bool(parsed['description'])

        if not has_duplicate:
            return {'status': 'skip', 'reason': '沒有發現重複說明'}

        original_lines = header.count('\n')
        new_header = rebuild_header(parsed, file_path)
        new_content = new_header + '\n\n' + rest

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
    print("文件頭部優化腳本 - Batch 3 (50個P2+P3服務+中間件)")
    print("="*70)
    print(f"項目根目錄: {PROJECT_ROOT}")
    print(f"目標文件數: {len(BATCH3_FILES)}\n")

    results = {
        'success': 0,
        'skip': 0,
        'error': 0,
        'total_removed_lines': 0
    }

    success_files = []
    skip_files = []
    error_files = []

    for i, file_path in enumerate(BATCH3_FILES, 1):
        print(f"[{i}/{len(BATCH3_FILES)}] 處理: {file_path}")

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

        if i % 10 == 0:
            print(f"\n{'-'*70}")
            print(f"進度報告 ({i}/{len(BATCH3_FILES)})")
            print(f"成功: {results['success']} | 跳過: {results['skip']} | 錯誤: {results['error']}")
            print(f"已移除重複行數: {results['total_removed_lines']}")
            print(f"{'-'*70}\n")

    # 最終報告
    print("\n" + "="*70)
    print("Batch 3 優化完成!")
    print("="*70)
    print(f"統計結果:")
    print(f"  - 成功優化: {results['success']}/{len(BATCH3_FILES)} ({results['success']/len(BATCH3_FILES)*100:.1f}%)")
    print(f"  - 跳過文件: {results['skip']}")
    print(f"  - 錯誤文件: {results['error']}")
    print(f"  - 移除重複行數: {results['total_removed_lines']}")
    print(f"  - 平均優化: {results['total_removed_lines']/results['success'] if results['success'] > 0 else 0:.1f} 行/文件")

    if skip_files:
        print(f"\n跳過的文件 ({len(skip_files)}):")
        for file_path, reason in skip_files[:5]:
            print(f"  - {file_path}: {reason}")
        if len(skip_files) > 5:
            print(f"  ... 還有 {len(skip_files)-5} 個文件")

    if error_files:
        print(f"\n需要人工處理的文件 ({len(error_files)}):")
        for file_path, reason in error_files:
            print(f"  - {file_path}: {reason}")

    print("\n" + "="*70)
    print(f"處理完成! 累計優化:")
    print(f"  Batch 1: 950行")
    print(f"  Batch 2: 957行")
    print(f"  Batch 3: {results['total_removed_lines']}行")
    print(f"  總計: {950 + 957 + results['total_removed_lines']}行")
    print("="*70 + "\n")


if __name__ == '__main__':
    main()
