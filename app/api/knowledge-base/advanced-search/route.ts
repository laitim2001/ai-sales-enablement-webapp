/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫高級搜索API
 * ================================================================
 *
 * 【API功能】
 * 提供複雜的多條件組合搜索功能，支援邏輯運算符、
 * 多層級嵌套條件、以及靈活的排序和過濾。
 *
 * 【端點】
 * POST /api/knowledge-base/advanced-search
 *
 * 【請求參數】
 * {
 *   conditions: SearchCondition[],
 *   groups: SearchConditionGroup[],
 *   operator: 'AND' | 'OR',
 *   sort_by?: string,
 *   sort_order?: 'asc' | 'desc',
 *   limit?: number,
 *   offset?: number
 * }
 *
 * 【回應格式】
 * {
 *   success: true,
 *   results: KnowledgeBase[],
 *   total: number,
 *   metadata: {...}
 * }
 *
 * @author Claude Code
 * @date 2025-10-03
 * @sprint Sprint 6 Week 12 - Advanced Search
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth-server';
import { Prisma } from '@prisma/client';

/**
 * 搜索條件驗證 Schema
 */
const SearchConditionSchema = z.object({
  id: z.string(),
  field: z.enum(['title', 'content', 'author', 'category', 'tags', 'created_at', 'updated_at', 'file_type']),
  operator: z.enum([
    'contains', 'not_contains', 'equals', 'not_equals',
    'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
    'before', 'after', 'between'
  ]),
  value: z.union([z.string(), z.array(z.string())]),
  logicalOperator: z.enum(['AND', 'OR']).optional()
});

/**
 * 搜索條件組驗證 Schema（遞歸）
 */
type SearchConditionGroupType = {
  id: string;
  operator: 'AND' | 'OR';
  conditions: z.infer<typeof SearchConditionSchema>[];
  groups: SearchConditionGroupType[];
};

const SearchConditionGroupSchema: z.ZodType<SearchConditionGroupType> = z.lazy(() =>
  z.object({
    id: z.string(),
    operator: z.enum(['AND', 'OR']),
    conditions: z.array(SearchConditionSchema),
    groups: z.array(SearchConditionGroupSchema)
  })
);

/**
 * 高級搜索請求驗證 Schema
 */
const AdvancedSearchSchema = z.object({
  conditions: z.array(SearchConditionSchema).optional(),
  groups: z.array(SearchConditionGroupSchema).optional(),
  operator: z.enum(['AND', 'OR']).default('AND'),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

/**
 * POST /api/knowledge-base/advanced-search
 * 執行高級搜索
 */
export async function POST(req: NextRequest) {
  try {
    // JWT 驗證
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                  req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    const userId = payload.userId;

    // 解析請求體
    const body = await req.json();
    const validatedData = AdvancedSearchSchema.parse(body);

    // 構建 Prisma 查詢條件
    const whereClause = buildWhereClause(
      validatedData.conditions || [],
      validatedData.groups || [],
      validatedData.operator,
      userId
    );

    // 構建排序條件
    const orderBy = buildOrderBy(validatedData.sort_by, validatedData.sort_order);

    // 執行查詢（獲取總數）
    const total = await prisma.knowledgeBase.count({
      where: whereClause
    });

    // 執行查詢（獲取結果）
    const results = await prisma.knowledgeBase.findMany({
      where: whereClause,
      orderBy,
      take: validatedData.limit,
      skip: validatedData.offset,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        status: true,
        file_path: true,
        mime_type: true,
        created_at: true,
        updated_at: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        tags: {
          select: {
            name: true,
            color: true
          }
        }
      }
    });

    // 返回結果
    return NextResponse.json({
      success: true,
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content ? r.content.substring(0, 200) + '...' : '',
        category: r.category,
        author: r.creator ? `${r.creator.first_name} ${r.creator.last_name}` : 'Unknown',
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        tags: r.tags.map((t: { name: string; color: string | null }) => t.name),
        status: r.status,
        file_type: r.mime_type
      })),
      total,
      metadata: {
        limit: validatedData.limit,
        offset: validatedData.offset,
        has_more: total > validatedData.offset + validatedData.limit
      }
    });

  } catch (error) {
    console.error('高級搜索API錯誤:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 構建 Prisma WHERE 子句（遞歸處理條件組）
 */
function buildWhereClause(
  conditions: z.infer<typeof SearchConditionSchema>[],
  groups: SearchConditionGroupType[],
  operator: 'AND' | 'OR',
  userId: number
): Prisma.KnowledgeBaseWhereInput {
  const conditionClauses = conditions.map(buildSingleCondition);
  const groupClauses = groups.map(group =>
    buildWhereClause(group.conditions, group.groups, group.operator, userId)
  );

  const allClauses = [...conditionClauses, ...groupClauses];

  if (allClauses.length === 0) {
    return { created_by: userId };
  }

  const baseClause = { created_by: userId };

  if (operator === 'AND') {
    return {
      AND: [baseClause, ...allClauses]
    };
  } else {
    return {
      AND: [
        baseClause,
        { OR: allClauses }
      ]
    };
  }
}

/**
 * 構建單個條件的 Prisma 子句
 */
function buildSingleCondition(
  condition: z.infer<typeof SearchConditionSchema>
): Prisma.KnowledgeBaseWhereInput {
  const { field, operator, value } = condition;

  switch (field) {
    case 'title':
      return buildStringCondition('title', operator, value);

    case 'content':
      return buildStringCondition('content', operator, value);

    case 'author':
      return buildAuthorCondition(operator, value);

    case 'category':
      return buildEnumCondition('category', operator, value);

    case 'tags':
      return buildArrayCondition('tags', operator, value);

    case 'created_at':
      return buildDateCondition('created_at', operator, value);

    case 'updated_at':
      return buildDateCondition('updated_at', operator, value);

    case 'file_type':
      return buildStringCondition('file_type', operator, value);

    default:
      return {};
  }
}

/**
 * 構建字串欄位條件
 */
function buildStringCondition(
  field: string,
  operator: string,
  value: string | string[]
): Prisma.KnowledgeBaseWhereInput {
  const strValue = Array.isArray(value) ? value[0] : value;

  switch (operator) {
    case 'contains':
      return { [field]: { contains: strValue, mode: 'insensitive' } };

    case 'not_contains':
      return { NOT: { [field]: { contains: strValue, mode: 'insensitive' } } };

    case 'equals':
      return { [field]: { equals: strValue, mode: 'insensitive' } };

    case 'not_equals':
      return { NOT: { [field]: { equals: strValue, mode: 'insensitive' } } };

    case 'starts_with':
      return { [field]: { startsWith: strValue, mode: 'insensitive' } };

    case 'ends_with':
      return { [field]: { endsWith: strValue, mode: 'insensitive' } };

    case 'is_empty':
      return { OR: [{ [field]: null }, { [field]: '' }] };

    case 'is_not_empty':
      return { AND: [{ [field]: { not: null } }, { [field]: { not: '' } }] };

    default:
      return {};
  }
}

/**
 * 構建作者條件（關聯查詢）
 */
function buildAuthorCondition(
  operator: string,
  value: string | string[]
): Prisma.KnowledgeBaseWhereInput {
  const strValue = Array.isArray(value) ? value[0] : value;

  switch (operator) {
    case 'equals':
      return {
        creator: {
          OR: [
            { first_name: { equals: strValue, mode: 'insensitive' } },
            { last_name: { equals: strValue, mode: 'insensitive' } },
            { email: { equals: strValue, mode: 'insensitive' } }
          ]
        }
      };

    case 'not_equals':
      return {
        NOT: {
          creator: {
            OR: [
              { first_name: { equals: strValue, mode: 'insensitive' } },
              { last_name: { equals: strValue, mode: 'insensitive' } },
              { email: { equals: strValue, mode: 'insensitive' } }
            ]
          }
        }
      };

    case 'contains':
      return {
        creator: {
          OR: [
            { first_name: { contains: strValue, mode: 'insensitive' } },
            { last_name: { contains: strValue, mode: 'insensitive' } },
            { email: { contains: strValue, mode: 'insensitive' } }
          ]
        }
      };

    case 'is_empty':
      return { creator: null };

    case 'is_not_empty':
      return { creator: { isNot: null } };

    default:
      return {};
  }
}

/**
 * 構建枚舉欄位條件
 */
function buildEnumCondition(
  field: string,
  operator: string,
  value: string | string[]
): Prisma.KnowledgeBaseWhereInput {
  const strValue = Array.isArray(value) ? value[0] : value;

  switch (operator) {
    case 'equals':
      return { [field]: strValue };

    case 'not_equals':
      return { NOT: { [field]: strValue } };

    default:
      return {};
  }
}

/**
 * 構建陣列欄位條件（標籤）
 */
function buildArrayCondition(
  field: string,
  operator: string,
  value: string | string[]
): Prisma.KnowledgeBaseWhereInput {
  const strValue = Array.isArray(value) ? value[0] : value;

  switch (operator) {
    case 'contains':
      return { [field]: { has: strValue } };

    case 'not_contains':
      return { NOT: { [field]: { has: strValue } } };

    default:
      return {};
  }
}

/**
 * 構建日期欄位條件
 */
function buildDateCondition(
  field: string,
  operator: string,
  value: string | string[]
): Prisma.KnowledgeBaseWhereInput {
  switch (operator) {
    case 'before':
      return { [field]: { lt: new Date(Array.isArray(value) ? value[0] : value) } };

    case 'after':
      return { [field]: { gt: new Date(Array.isArray(value) ? value[0] : value) } };

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return {
          AND: [
            { [field]: { gte: new Date(value[0]) } },
            { [field]: { lte: new Date(value[1]) } }
          ]
        };
      }
      return {};

    default:
      return {};
  }
}

/**
 * 構建排序條件
 */
function buildOrderBy(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Prisma.KnowledgeBaseOrderByWithRelationInput {
  const validSortFields = [
    'title', 'created_at', 'updated_at', 'category', 'status'
  ];

  if (sortBy && validSortFields.includes(sortBy)) {
    return { [sortBy]: sortOrder };
  }

  // 預設按更新時間降序
  return { updated_at: 'desc' };
}
