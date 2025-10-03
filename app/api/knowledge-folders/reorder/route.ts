/**
 * ================================================================
 * 檔案名稱: 資料夾批量排序API路由
 * 檔案用途: Sprint 6 - 支持拖放後批量更新排序
 * 開發階段: Week 11 Day 1
 * ================================================================
 *
 * 功能索引:
 * 1. POST /api/knowledge-folders/reorder - 批量更新資料夾排序
 *
 * 使用場景:
 * - 拖放完成後更新同級資料夾的 sort_order
 * - 一次性更新多個資料夾的排序位置
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

const ReorderFoldersSchema = z.object({
  folder_orders: z.array(
    z.object({
      id: z.number().int().positive(),
      sort_order: z.number().int()
    })
  ).min(1, '至少需要一個資料夾')
})

/**
 * ================================================================
 * POST /api/knowledge-folders/reorder - 批量更新排序
 * ================================================================
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 驗證 JWT Token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      throw AppError.unauthorized('缺少認證令牌')
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      throw AppError.unauthorized('無效的認證令牌')
    }

    const userId = decoded.userId

    // 2. 解析請求體
    const body = await request.json()
    const validatedData = ReorderFoldersSchema.parse(body)

    // 3. 檢查所有資料夾是否存在
    const folderIds = validatedData.folder_orders.map(item => item.id)
    const folders = await prisma.knowledgeFolder.findMany({
      where: {
        id: { in: folderIds }
      },
      select: {
        id: true,
        name: true,
        parent_id: true,
        is_system: true
      }
    })

    if (folders.length !== folderIds.length) {
      throw AppError.notFound('部分資料夾不存在')
    }

    // 4. 檢查系統資料夾保護
    const systemFolders = folders.filter(f => f.is_system)
    if (systemFolders.length > 0) {
      throw AppError.forbidden('系統資料夾不能重新排序')
    }

    // 5. 檢查所有資料夾是否在同一層級
    const parentIds = [...new Set(folders.map(f => f.parent_id))]
    if (parentIds.length > 1) {
      throw AppError.badRequest('只能對同一層級的資料夾進行排序')
    }

    // 6. 使用事務批量更新
    const updateResults = await prisma.$transaction(
      validatedData.folder_orders.map(item =>
        prisma.knowledgeFolder.update({
          where: { id: item.id },
          data: {
            sort_order: item.sort_order,
            updated_by: userId
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: {
        updated_count: updateResults.length,
        folder_ids: updateResults.map(f => f.id)
      },
      message: '資料夾排序更新成功'
    })

  } catch (error) {
    console.error('[POST /api/knowledge-folders/reorder] Error:', error)

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
