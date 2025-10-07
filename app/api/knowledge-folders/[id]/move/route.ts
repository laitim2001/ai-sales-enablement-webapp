/**
 * @fileoverview ================================================================檔案名稱: 資料夾移動API路由檔案用途: Sprint 6 - 支持拖放移動和批量排序開發階段: Week 11 Day 1================================================================功能索引:1. POST /api/knowledge-folders/[id]/move - 移動資料夾到新位置支持場景:- 拖放移動資料夾到其他資料夾- 批量更新同級資料夾排序- 自動更新路徑和子資料夾================================================================
 * @module app/api/knowledge-folders/[id]/move/route
 * @description
 * ================================================================檔案名稱: 資料夾移動API路由檔案用途: Sprint 6 - 支持拖放移動和批量排序開發階段: Week 11 Day 1================================================================功能索引:1. POST /api/knowledge-folders/[id]/move - 移動資料夾到新位置支持場景:- 拖放移動資料夾到其他資料夾- 批量更新同級資料夾排序- 自動更新路徑和子資料夾================================================================
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
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

const MoveFolderSchema = z.object({
  target_parent_id: z.number().int().positive().nullable(),
  new_sort_order: z.number().int().default(0)
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
  return parentPath === '/' ? `/${parent.name}` : `${parentPath}/${parent.name}`
}

/**
 * ================================================================
 * 輔助函數: 遞歸更新所有子資料夾路徑
 * ================================================================
 */
async function updateChildrenPaths(folderId: number, newParentPath: string, folderName: string) {
  const folder = await prisma.knowledgeFolder.findUnique({
    where: { id: folderId },
    include: { children: true }
  })

  if (!folder) return

  const newPath = newParentPath === '/' ? `/${folderName}` : `${newParentPath}/${folderName}`

  // 更新當前資料夾路徑
  await prisma.knowledgeFolder.update({
    where: { id: folderId },
    data: { path: newPath }
  })

  // 遞歸更新所有子資料夾
  for (const child of folder.children) {
    await updateChildrenPaths(child.id, newPath, child.name)
  }
}

/**
 * ================================================================
 * POST /api/knowledge-folders/[id]/move - 移動資料夾
 * ================================================================
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 2. 解析資料夾ID
    const folderId = parseInt(params.id, 10)
    if (isNaN(folderId)) {
      throw AppError.badRequest('無效的資料夾ID')
    }

    // 3. 解析請求體
    const body = await request.json()
    const validatedData = MoveFolderSchema.parse(body)

    // 4. 檢查資料夾是否存在
    const folder = await prisma.knowledgeFolder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      throw AppError.notFound('資料夾不存在')
    }

    // 5. 檢查系統資料夾保護
    if (folder.is_system) {
      throw AppError.forbidden('系統資料夾不能移動')
    }

    // 6. 檢查是否移動到自己
    if (validatedData.target_parent_id === folderId) {
      throw AppError.badRequest('不能將資料夾移動到自己內部')
    }

    // 7. 檢查目標父資料夾是否存在
    if (validatedData.target_parent_id) {
      const targetParent = await prisma.knowledgeFolder.findUnique({
        where: { id: validatedData.target_parent_id }
      })

      if (!targetParent) {
        throw AppError.notFound('目標資料夾不存在')
      }

      // 檢查是否會造成循環引用(移動到自己的子孫資料夾)
      let currentParent = targetParent
      while (currentParent.parent_id) {
        if (currentParent.parent_id === folderId) {
          throw AppError.badRequest('不能將資料夾移動到自己的子資料夾')
        }
        const nextParent = await prisma.knowledgeFolder.findUnique({
          where: { id: currentParent.parent_id }
        })
        if (!nextParent) break
        currentParent = nextParent
      }
    }

    // 8. 檢查目標位置是否已有同名資料夾
    const duplicateName = await prisma.knowledgeFolder.findFirst({
      where: {
        name: folder.name,
        parent_id: validatedData.target_parent_id,
        id: { not: folderId }
      }
    })

    if (duplicateName) {
      return NextResponse.json(
        { success: false, message: '目標位置已存在同名資料夾' },
        { status: 409 }
      )
    }

    // 9. 計算新路徑
    const newPath = await calculateFolderPath(validatedData.target_parent_id)

    // 10. 使用事務執行移動操作
    const result = await prisma.$transaction(async (tx) => {
      // 更新資料夾
      const updatedFolder = await tx.knowledgeFolder.update({
        where: { id: folderId },
        data: {
          parent_id: validatedData.target_parent_id,
          sort_order: validatedData.new_sort_order,
          path: newPath,
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

      return updatedFolder
    })

    // 11. 更新所有子資料夾路徑(在事務外執行,避免長時間鎖定)
    await updateChildrenPaths(folderId, newPath, folder.name)

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        documentCount: result._count.knowledge_base,
        subfolderCount: result._count.children
      },
      message: '資料夾移動成功'
    })

  } catch (error) {
    console.error(`[POST /api/knowledge-folders/${params.id}/move] Error:`, error)

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
