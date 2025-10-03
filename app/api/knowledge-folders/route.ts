/**
 * ================================================================
 * 檔案名稱: 知識庫資料夾API路由
 * 檔案用途: Sprint 6 - 知識庫樹狀資料夾管理API
 * 開發階段: Week 11 Day 1
 * ================================================================
 *
 * 功能索引:
 * 1. GET /api/knowledge-folders - 獲取資料夾樹狀結構
 * 2. POST /api/knowledge-folders - 創建新資料夾
 *
 * API規格:
 * - 方法: GET, POST
 * - 路徑: /api/knowledge-folders
 * - 認證: JWT Token
 * - 權限: 已認證用戶
 * - 回應: {success, data, message?}
 *
 * 業務特色:
 * - 樹狀結構支持無限層級嵌套
 * - 自動計算資料夾完整路徑
 * - 支持拖放排序(sort_order)
 * - 系統資料夾保護機制
 * - 關聯知識庫文檔計數
 *
 * 技術特色:
 * - Prisma ORM: 遞歸查詢樹狀結構
 * - Zod驗證: 嚴格的數據驗證
 * - JWT認證: 安全的用戶身份驗證
 * - 自動路徑生成: 基於父資料夾路徑自動計算
 *
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'

/**
 * ================================================================
 * 資料驗證架構
 * ================================================================
 */

// 創建資料夾請求驗證
const CreateFolderSchema = z.object({
  name: z.string().min(1, '資料夾名稱不能為空').max(100, '資料夾名稱過長'),
  description: z.string().optional(),
  parent_id: z.number().int().positive().optional().nullable(),
  icon: z.string().default('folder'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '無效的顏色格式').default('#3B82F6'),
  sort_order: z.number().int().default(0)
})

// 查詢參數驗證
const QueryFoldersSchema = z.object({
  parent_id: z.string().transform(val => val === 'null' ? null : parseInt(val, 10)).optional(),
  include_documents: z.string().transform(val => val === 'true').default('false'),
  flat: z.string().transform(val => val === 'true').default('false') // 是否返回扁平列表
})

/**
 * ================================================================
 * 輔助函數: 計算資料夾完整路徑
 * ================================================================
 */
async function calculateFolderPath(parentId: number | null): Promise<string> {
  if (!parentId) return '/'

  const parent = await prisma.knowledgeFolder.findUnique({
    where: { id: parentId },
    select: { path: true, name: true }
  })

  if (!parent) throw AppError.notFound('父資料夾不存在')

  const parentPath = parent.path || '/'
  const newPath = parentPath === '/'
    ? `/${parent.name}`
    : `${parentPath}/${parent.name}`

  return newPath
}

/**
 * ================================================================
 * 輔助函數: 遞歸查詢子資料夾
 * ================================================================
 */
async function getFolderTree(
  parentId: number | null,
  includeDocuments: boolean = false
): Promise<any[]> {
  const folders = await prisma.knowledgeFolder.findMany({
    where: { parent_id: parentId },
    include: {
      creator: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      },
      knowledge_base: includeDocuments ? {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          category: true,
          created_at: true,
          updated_at: true
        }
      } : false,
      _count: {
        select: {
          children: true,
          knowledge_base: true
        }
      }
    },
    orderBy: [
      { sort_order: 'asc' },
      { name: 'asc' }
    ]
  })

  // 遞歸查詢子資料夾
  const foldersWithChildren = await Promise.all(
    folders.map(async (folder) => {
      const children = await getFolderTree(folder.id, includeDocuments)
      return {
        ...folder,
        children,
        hasChildren: children.length > 0,
        documentCount: folder._count.knowledge_base,
        subfolderCount: folder._count.children
      }
    })
  )

  return foldersWithChildren
}

/**
 * ================================================================
 * GET /api/knowledge-folders - 獲取資料夾樹狀結構
 * ================================================================
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 驗證用戶身份
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('未授權訪問')
    }

    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('無效的token')
    }

    // 2. 解析查詢參數
    const { searchParams } = new URL(request.url)
    const query = QueryFoldersSchema.parse({
      parent_id: searchParams.get('parent_id') || undefined,
      include_documents: searchParams.get('include_documents') || 'false',
      flat: searchParams.get('flat') || 'false'
    })

    // 3. 如果要求扁平列表,返回所有資料夾
    if (query.flat) {
      const allFolders = await prisma.knowledgeFolder.findMany({
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          _count: {
            select: {
              children: true,
              knowledge_base: true
            }
          }
        },
        orderBy: [
          { path: 'asc' },
          { sort_order: 'asc' },
          { name: 'asc' }
        ]
      })

      return NextResponse.json({
        success: true,
        data: allFolders.map(folder => ({
          ...folder,
          documentCount: folder._count.knowledge_base,
          subfolderCount: folder._count.children
        }))
      })
    }

    // 4. 獲取樹狀結構
    const folderTree = await getFolderTree(
      query.parent_id || null,
      query.include_documents
    )

    return NextResponse.json({
      success: true,
      data: folderTree
    })

  } catch (error) {
    console.error('[GET /api/knowledge-folders] Error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '請求參數格式錯誤', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: '伺服器內部錯誤' },
      { status: 500 }
    )
  }
}

/**
 * ================================================================
 * POST /api/knowledge-folders - 創建新資料夾
 * ================================================================
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 驗證用戶身份
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('未授權訪問')
    }

    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('無效的token')
    }

    const userId = payload.userId

    // 2. 解析請求體
    const body = await request.json()
    const validatedData = CreateFolderSchema.parse(body)

    // 3. 檢查父資料夾是否存在(如果有指定)
    if (validatedData.parent_id) {
      const parentExists = await prisma.knowledgeFolder.findUnique({
        where: { id: validatedData.parent_id }
      })

      if (!parentExists) {
        throw AppError.notFound('父資料夾不存在')
      }
    }

    // 4. 計算完整路徑
    const folderPath = await calculateFolderPath(validatedData.parent_id || null)

    // 5. 檢查同級資料夾名稱是否重複
    const duplicateName = await prisma.knowledgeFolder.findFirst({
      where: {
        name: validatedData.name,
        parent_id: validatedData.parent_id || null
      }
    })

    if (duplicateName) {
      return NextResponse.json(
        { success: false, message: '同級資料夾中已存在相同名稱' },
        { status: 409 }
      )
    }

    // 6. 創建資料夾
    const newFolder = await prisma.knowledgeFolder.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        parent_id: validatedData.parent_id || null,
        path: folderPath,
        icon: validatedData.icon,
        color: validatedData.color,
        sort_order: validatedData.sort_order,
        created_by: userId,
        updated_by: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        _count: {
          select: {
            children: true,
            knowledge_base: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...newFolder,
        documentCount: newFolder._count.knowledge_base,
        subfolderCount: newFolder._count.children
      },
      message: '資料夾創建成功'
    }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/knowledge-folders] Error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '請求數據格式錯誤', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: '伺服器內部錯誤' },
      { status: 500 }
    )
  }
}
