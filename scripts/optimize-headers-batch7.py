#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件頭部優化腳本 - Batch 7 (最終批次)
處理所有剩餘文件
"""

import re
import os
from pathlib import Path

# 項目根目錄
PROJECT_ROOT = Path(__file__).parent.parent

# Batch 7 文件清單 (所有剩餘文件)
BATCH7_FILES = [
    # 組件剩餘文件
    "components/meeting-prep/PrepPackageWizard.tsx",
    "components/notifications/notification-item.tsx",
    "components/notifications/notification-list.tsx",
    "components/permissions/CustomerActions.tsx",
    "components/permissions/index.ts",
    "components/permissions/ProposalActions.tsx",
    "components/permissions/ProtectedRoute.tsx",
    "components/recommendation/index.ts",
    "components/recommendation/RecommendationCard.tsx",
    "components/recommendation/RecommendationList.tsx",
    "components/reminder/index.ts",
    "components/reminder/ReminderCard.tsx",
    "components/reminder/ReminderList.tsx",
    "components/search/enhanced-search.tsx",

    # lib剩餘文件
    "lib/ai/index.ts",
    "lib/ai/types.ts",
    "lib/analytics/index.ts",
    "lib/analytics/user-behavior-tracker.ts",
    "lib/api/error-handler.ts",
    "lib/api/response-helper.ts",
    "lib/auth/azure-ad-service.ts",
    "lib/auth/request-auth.ts",
    "lib/auth/token-service.ts",
    "lib/auth-server.ts",
    "lib/cache/redis-client.ts",
    "lib/cache/vector-cache.ts",
    "lib/pdf/index.ts",
    "lib/pdf/pdf-generator.ts",
    "lib/pdf/proposal-pdf-template.ts",
    "lib/performance/monitor.test.ts",
    "lib/performance/monitor.ts",
    "lib/performance/query-optimizer.test.ts",
    "lib/performance/query-optimizer.ts",
    "lib/performance/response-cache.test.ts",
    "lib/performance/response-cache.ts",
    "lib/prisma.ts",
    "lib/resilience/circuit-breaker.test.ts",
    "lib/resilience/circuit-breaker.ts",
    "lib/resilience/health-check.test.ts",
    "lib/resilience/health-check.ts",
    "lib/resilience/retry.test.ts",
    "lib/resilience/retry.ts",
    "lib/search/search-analytics.ts",
    "lib/security/azure-key-vault.ts",
    "lib/security/backup.test.ts",
    "lib/security/backup.ts",
    "lib/security/encryption.test.ts",
    "lib/security/encryption.ts",
    "lib/security/fine-grained-permissions.ts",
    "lib/security/gdpr.ts",
    "lib/security/index.ts",
    "lib/security/permission-middleware.test.ts",
    "lib/security/rbac.test.ts",
    "lib/security/resource-conditions.ts",
    "lib/security/sensitive-fields-config.ts",
    "lib/startup/monitoring-initializer.ts",
    "lib/template/handlebars-helpers.ts",
    "lib/template/template-engine.ts",
    "lib/template/template-manager.ts",
    "lib/utils.ts",

    # hooks剩餘文件
    "hooks/use-auth.ts",
    "hooks/use-permission.ts",

    # 測試文件
    "__tests__/lib/error-handling.test.ts",
    "__tests__/auth/login.test.tsx",
    "tests/knowledge-base.test.ts",
    "__tests__/components/knowledge/knowledge-base-list.test.tsx",
    "__tests__/components/knowledge/knowledge-document-view.test.tsx",
    "__tests__/components/knowledge/knowledge-document-edit.test.tsx",
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
    print("文件頭部優化腳本 - Batch 7 (最終批次 - 所有剩餘文件)")
    print("="*70)
    print(f"項目根目錄: {PROJECT_ROOT}")
    print(f"目標文件數: {len(BATCH7_FILES)}\n")

    results = {
        'success': 0,
        'skip': 0,
        'error': 0,
        'total_removed_lines': 0
    }

    success_files = []
    skip_files = []
    error_files = []

    for i, file_path in enumerate(BATCH7_FILES, 1):
        print(f"[{i}/{len(BATCH7_FILES)}] 處理: {file_path}")

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
            print(f"進度報告 ({i}/{len(BATCH7_FILES)})")
            print(f"成功: {results['success']} | 跳過: {results['skip']} | 錯誤: {results['error']}")
            print(f"已移除重複行數: {results['total_removed_lines']}")
            print(f"{'-'*70}\n")

    # 最終報告
    print("\n" + "="*70)
    print("Batch 7 優化完成! 全部批次處理完畢!")
    print("="*70)
    print(f"統計結果:")
    print(f"  - 成功優化: {results['success']}/{len(BATCH7_FILES)} ({results['success']/len(BATCH7_FILES)*100:.1f}%)")
    print(f"  - 跳過文件: {results['skip']}")
    print(f"  - 錯誤文件: {results['error']}")
    print(f"  - 移除重複行數: {results['total_removed_lines']}")
    print(f"  - 平均優化: {results['total_removed_lines']/results['success'] if results['success'] > 0 else 0:.1f} 行/文件")

    if skip_files:
        print(f"\n跳過的文件 ({len(skip_files)}):")
        for file_path, reason in skip_files[:10]:
            print(f"  - {file_path}: {reason}")
        if len(skip_files) > 10:
            print(f"  ... 還有 {len(skip_files)-10} 個文件")

    if error_files:
        print(f"\n需要人工處理的文件 ({len(error_files)}):")
        for file_path, reason in error_files:
            print(f"  - {file_path}: {reason}")

    print("\n" + "="*70)
    print("最終累計統計:")
    print("="*70)
    print(f"  Batch 1: 950行")
    print(f"  Batch 2: 957行")
    print(f"  Batch 3: 455行")
    print(f"  Batch 4: 207行")
    print(f"  Batch 5: 910行")
    print(f"  Batch 6: 1534行")
    print(f"  Batch 7: {results['total_removed_lines']}行")
    print(f"  ────────────────")
    print(f"  總計: {950 + 957 + 455 + 207 + 910 + 1534 + results['total_removed_lines']}行")
    print("="*70)
    print("\n🎉 恭喜! 所有文件頭部優化完成! 🎉\n")


if __name__ == '__main__':
    main()
