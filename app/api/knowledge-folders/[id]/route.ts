/**
 * ================================================================
 * 檔案名稱: 單個知識庫資料夾API路由
 * 檔案用途: Sprint 6 - 資料夾詳情、更新、刪除API
 * 開發階段: Week 11 Day 1
 * ================================================================
 *
 * 功能索引:
 * 1. GET /api/knowledge-folders/[id] - 獲取資料夾詳情
 * 2. PATCH /api/knowledge-folders/[id] - 更新資料夾
 * 3. DELETE /api/knowledge-folders/[id] - 刪除資料夾
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

const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  parent_id: z.number().int().positive().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  sort_order: z.number().int().optional()
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

  if (!parent) throw new AppError('父資料夾不存在', 404)

  const parentPath = parent.path || '/'
  const newPath = parentPath === '/'
    ? `/${parent.name}`
    : `${parentPath}/${parent.name}`

  return newPath
}

/**
 * ================================================================
 * 輔助函數: 更新所有子資料夾路徑
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
 * GET /api/knowledge-folders/[id] - 獲取資料夾詳情
 * ================================================================
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 驗證用戶身份
    const authResult = await verifyToken(request)
    if (!authResult.isValid || !authResult.user) {
      throw new AppError('未授權訪問', 401)
    }

    // 2. 解析資料夾ID
    const folderId = parseInt(params.id, 10)
    if (isNaN(folderId)) {
      throw new AppError('無效的資料夾ID', 400)
    }

    // 3. 查詢資料夾詳情
    const folder = await prisma.knowledgeFolder.findUnique({
      where: { id: folderId },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        updater: {
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
        children: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            sort_order: true,
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
        },
        knowledge_base: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            category: true,
            created_at: true,
            updated_at: true
          },
          orderBy: { updated_at: 'desc' }
        },
        _count: {
          select: {
            children: true,
            knowledge_base: true
          }
        }
      }
    })

    if (!folder) {
      throw new AppError('資料夾不存在', 404)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...folder,
        children: folder.children.map(child => ({
          ...child,
          documentCount: child._count.knowledge_base,
          subfolderCount: child._count.children
        })),
        documentCount: folder._count.knowledge_base,
        subfolderCount: folder._count.children
      }
    })

  } catch (error) {
    console.error(`[GET /api/knowledge-folders/${params.id}] Error:`, error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
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
 * PATCH /api/knowledge-folders/[id] - 更新資料夾
 * ================================================================
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 驗證用戶身份
    const authResult = await verifyToken(request)
    if (!authResult.isValid || !authResult.user) {
      throw new AppError('未授權訪問', 401)
    }

    const userId = authResult.user.userId

    // 2. 解析資料夾ID
    const folderId = parseInt(params.id, 10)
    if (isNaN(folderId)) {
      throw new AppError('無效的資料夾ID', 400)
    }

    // 3. 解析請求體
    const body = await request.json()
    const validatedData = UpdateFolderSchema.parse(body)

    // 4. 檢查資料夾是否存在
    const existingFolder = await prisma.knowledgeFolder.findUnique({
      where: { id: folderId }
    })

    if (!existingFolder) {
      throw new AppError('資料夾不存在', 404)
    }

    // 5. 檢查系統資料夾保護
    if (existingFolder.is_system) {
      throw new AppError('系統資料夾不能修改', 403)
    }

    // 6. 如果要移動資料夾(更改parent_id)
    let updateData: any = {
      ...validatedData,
      updated_by: userId
    }

    if (validatedData.parent_id !== undefined && validatedData.parent_id !== existingFolder.parent_id) {
      // 檢查不能將資料夾移動到自己的子資料夾
      if (validatedData.parent_id === folderId) {
        throw new AppError('不能將資料夾移動到自己內部', 400)
      }

      // 檢查父資料夾是否存在
      if (validatedData.parent_id) {
        const parent = await prisma.knowledgeFolder.findUnique({
          where: { id: validatedData.parent_id }
        })

        if (!parent) {
          throw new AppError('目標父資料夾不存在', 404)
        }

        // 檢查是否會造成循環引用(移動到自己的子孫資料夾)
        let currentParent = parent
        while (currentParent.parent_id) {
          if (currentParent.parent_id === folderId) {
            throw new AppError('不能將資料夾移動到自己的子資料夾', 400)
          }
          const nextParent = await prisma.knowledgeFolder.findUnique({
            where: { id: currentParent.parent_id }
          })
          if (!nextParent) break
          currentParent = nextParent
        }
      }

      // 計算新路徑
      const newPath = await calculateFolderPath(validatedData.parent_id || null)
      updateData.path = newPath

      // 更新所有子資料夾路徑
      await updateChildrenPaths(folderId, newPath, validatedData.name || existingFolder.name)
    }

    // 7. 檢查同級資料夾名稱是否重複
    if (validatedData.name && validatedData.name !== existingFolder.name) {
      const duplicateName = await prisma.knowledgeFolder.findFirst({
        where: {
          name: validatedData.name,
          parent_id: validatedData.parent_id !== undefined ? validatedData.parent_id : existingFolder.parent_id,
          id: { not: folderId }
        }
      })

      if (duplicateName) {
        throw new AppError('同級資料夾中已存在相同名稱', 409)
      }

      // 如果只是更名,也要更新路徑
      if (validatedData.parent_id === undefined) {
        const parentPath = await calculateFolderPath(existingFolder.parent_id)
        updateData.path = parentPath === '/' ? `/${validatedData.name}` : `${parentPath}/${validatedData.name}`
        await updateChildrenPaths(folderId, parentPath, validatedData.name)
      }
    }

    // 8. 更新資料夾
    const updatedFolder = await prisma.knowledgeFolder.update({
      where: { id: folderId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        updater: {
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
        ...updatedFolder,
        documentCount: updatedFolder._count.knowledge_base,
        subfolderCount: updatedFolder._count.children
      },
      message: '資料夾更新成功'
    })

  } catch (error) {
    console.error(`[PATCH /api/knowledge-folders/${params.id}] Error:`, error)

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

/**
 * ================================================================
 * DELETE /api/knowledge-folders/[id] - 刪除資料夾
 * ================================================================
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 驗證用戶身份
    const authResult = await verifyToken(request)
    if (!authResult.isValid || !authResult.user) {
      throw new AppError('未授權訪問', 401)
    }

    // 2. 解析資料夾ID
    const folderId = parseInt(params.id, 10)
    if (isNaN(folderId)) {
      throw new AppError('無效的資料夾ID', 400)
    }

    // 3. 檢查資料夾是否存在
    const folder = await prisma.knowledgeFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: {
            children: true,
            knowledge_base: true
          }
        }
      }
    })

    if (!folder) {
      throw new AppError('資料夾不存在', 404)
    }

    // 4. 檢查系統資料夾保護
    if (folder.is_system) {
      throw new AppError('系統資料夾不能刪除', 403)
    }

    // 5. 檢查是否有子資料夾
    if (folder._count.children > 0) {
      throw new AppError('資料夾包含子資料夾，無法刪除', 400)
    }

    // 6. 檢查是否有文檔(可選: 根據業務邏輯決定是否允許刪除)
    if (folder._count.knowledge_base > 0) {
      // 選項1: 禁止刪除
      throw new AppError('資料夾包含文檔，無法刪除。請先移動或刪除文檔', 400)

      // 選項2: 將文檔移到根目錄
      // await prisma.knowledgeBase.updateMany({
      //   where: { folder_id: folderId },
      //   data: { folder_id: null }
      // })
    }

    // 7. 刪除資料夾(Cascade會自動處理關聯)
    await prisma.knowledgeFolder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({
      success: true,
      message: '資料夾刪除成功'
    })

  } catch (error) {
    console.error(`[DELETE /api/knowledge-folders/${params.id}] Error:`, error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, message: '伺服器內部錯誤' },
      { status: 500 }
    )
  }
}
