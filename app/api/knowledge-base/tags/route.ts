/**
 * ================================================================
 * AI銷售賦能平台 - 標籤管理API (app/api/knowledge-base/tags/route.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供知識庫標籤系統的完整管理功能，支援階層式標籤結構、
 * 使用統計追蹤和標籤生命週期管理的RESTful API端點
 *
 * 【主要職責】
 * • 標籤CRUD操作 - 創建、讀取、更新、刪除標籤
 * • 階層式標籤管理 - 支援父子標籤關係和層次結構
 * • 使用統計追蹤 - 記錄標籤使用次數和實際關聯統計
 * • 標籤關聯管理 - 處理標籤與知識庫項目的多對多關係
 * • 數據完整性維護 - 防止循環引用和孤立標籤處理
 *
 * 【API規格】
 * • GET /api/knowledge-base/tags - 獲取標籤列表
 *   參數: hierarchical, usage, parent_id
 *   回應: { success, data[] } - 支援扁平或階層式結構
 * • POST /api/knowledge-base/tags - 創建新標籤
 *   參數: { name, description, color, parent_id }
 *   回應: { success, data, message }
 * • PUT /api/knowledge-base/tags/[id] - 更新標籤
 *   參數: { name, description, color, parent_id }
 *   回應: { success, data, message }
 * • DELETE /api/knowledge-base/tags/[id] - 刪除標籤
 *   參數: force (查詢參數)
 *   回應: { success, message } 或使用確認提示
 *
 * 【使用場景】
 * • 內容分類組織 - 為知識庫文檔提供多維度標籤分類
 * • 標籤系統管理 - 管理介面的標籤維護和組織
 * • 搜索和篩選 - 基於標籤的內容發現和篩選功能
 * • 使用分析統計 - 了解標籤使用情況和流行趨勢
 * • 內容治理 - 清理未使用標籤和標籤結構重組
 *
 * 【相關檔案】
 * • lib/auth-server.ts - 用戶身份驗證
 * • lib/errors.ts - 錯誤處理和分類
 * • lib/db.ts - 數據庫連接和操作
 * • prisma/schema.prisma - KnowledgeTag數據模型定義
 *
 * 【開發注意】
 * • 支援階層式標籤結構，防止循環引用
 * • 實現軟刪除機制，避免強制刪除使用中的標籤
 * • 提供使用統計功能，區分記錄的和實際的使用次數
 * • 標籤名稱具備唯一性約束
 * • 支援顏色標籤用於視覺化區分
 * • 刪除時檢查子標籤和關聯文檔
 */

import { NextRequest, NextResponse } from 'next/server'    // Next.js請求和回應處理
import { z } from 'zod'                                   // 資料驗證架構
import { prisma } from '@/lib/db'                         // 數據庫連接實例
import { AppError } from '@/lib/errors'                   // 應用錯誤處理
import { verifyToken } from '@/lib/auth-server'           // JWT令牌驗證

/**
 * 標籤創建驗證架構
 * 定義創建新標籤時的必要和可選欄位
 */
const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),           // 標籤名稱（1-50字符）
  description: z.string().optional(),                                                     // 標籤描述（可選）
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),      // 十六進制顏色代碼（可選）
  parent_id: z.number().int().positive().optional()                                       // 父標籤ID（可選，用於階層結構）
})

/**
 * 標籤更新驗證架構
 * 所有欄位皆為可選，用於部分更新操作
 */
const UpdateTagSchema = CreateTagSchema.partial()

// GET /api/knowledge-base/tags - 獲取標籤列表
export async function GET(request: NextRequest) {
  try {
    // 驗證用戶身份
    // Extract token from request
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // Verify the token
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    const url = new URL(request.url)
    const hierarchical = url.searchParams.get('hierarchical') === 'true'
    const include_usage = url.searchParams.get('usage') === 'true'
    const parent_id = url.searchParams.get('parent_id')

    let tags

    if (hierarchical) {
      // 獲取層次化的標籤結構
      tags = await prisma.knowledgeTag.findMany({
        where: {
          parent_id: parent_id ? parseInt(parent_id, 10) : null
        },
        include: {
          parent: {
            select: { id: true, name: true, color: true }
          },
          children: {
            select: { id: true, name: true, color: true, usage_count: true },
            orderBy: { usage_count: 'desc' }
          },
          ...(include_usage && {
            knowledge_base: {
              select: { id: true },
              where: { status: { in: ['ACTIVE', 'DRAFT'] } }
            }
          })
        },
        orderBy: [
          { usage_count: 'desc' },
          { name: 'asc' }
        ]
      })
    } else {
      // 獲取扁平的標籤列表
      const where: any = {}
      if (parent_id) {
        where.parent_id = parseInt(parent_id, 10)
      }

      tags = await prisma.knowledgeTag.findMany({
        where,
        include: {
          parent: {
            select: { id: true, name: true, color: true }
          },
          ...(include_usage && {
            knowledge_base: {
              select: { id: true },
              where: { status: { in: ['ACTIVE', 'DRAFT'] } }
            }
          })
        },
        orderBy: [
          { usage_count: 'desc' },
          { name: 'asc' }
        ]
      })
    }

    // 如果包含使用統計，計算實際使用數量
    if (include_usage) {
      tags = tags.map(tag => ({
        ...tag,
        actual_usage_count: tag.knowledge_base?.length || 0,
        knowledge_base: undefined // 移除完整的 knowledge_base 數據
      }))
    }

    return NextResponse.json({
      success: true,
      data: tags
    })

  } catch (error) {
    console.error('GET /api/knowledge-base/tags error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge-base/tags - 創建新標籤
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶身份
    // Extract token from request
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // Verify the token
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 解析請求數據
    const body = await request.json()
    const validatedData = CreateTagSchema.parse(body)

    // 檢查標籤名稱是否已存在
    const existingTag = await prisma.knowledgeTag.findUnique({
      where: { name: validatedData.name }
    })

    if (existingTag) {
      throw AppError.validation('Tag name already exists')
    }

    // 如果指定了父標籤，檢查父標籤是否存在
    if (validatedData.parent_id) {
      const parentTag = await prisma.knowledgeTag.findUnique({
        where: { id: validatedData.parent_id }
      })

      if (!parentTag) {
        throw AppError.notFound('Parent tag not found')
      }
    }

    // 創建標籤
    const tag = await prisma.knowledgeTag.create({
      data: validatedData,
      include: {
        parent: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/knowledge-base/tags error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}

// PUT /api/knowledge-base/tags/[id] - 更新標籤
export async function PUT(request: NextRequest) {
  try {
    // 從 URL 中提取標籤 ID
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const idIndex = pathSegments.findIndex(segment => segment === 'tags') + 1

    if (idIndex >= pathSegments.length) {
      throw AppError.validation('Tag ID is required')
    }

    const id = parseInt(pathSegments[idIndex], 10)
    if (isNaN(id)) {
      throw AppError.validation('Invalid tag ID')
    }

    // 驗證用戶身份
    // Extract token from request
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // Verify the token
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 解析請求數據
    const body = await request.json()
    const validatedData = UpdateTagSchema.parse(body)

    // 檢查標籤是否存在
    const existingTag = await prisma.knowledgeTag.findUnique({
      where: { id }
    })

    if (!existingTag) {
      throw AppError.notFound('Tag not found')
    }

    // 如果更新名稱，檢查新名稱是否已存在
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const nameExists = await prisma.knowledgeTag.findUnique({
        where: { name: validatedData.name }
      })

      if (nameExists) {
        throw AppError.validation('Tag name already exists')
      }
    }

    // 如果更新父標籤，檢查父標籤是否存在且不會形成循環
    if (validatedData.parent_id !== undefined) {
      if (validatedData.parent_id === id) {
        throw AppError.validation('Tag cannot be its own parent')
      }

      if (validatedData.parent_id) {
        const parentTag = await prisma.knowledgeTag.findUnique({
          where: { id: validatedData.parent_id }
        })

        if (!parentTag) {
          throw AppError.notFound('Parent tag not found')
        }

        // 檢查是否會形成循環（簡單檢查：父標籤的父標籤不能是當前標籤）
        if (parentTag.parent_id === id) {
          throw AppError.validation('Cannot create circular tag hierarchy')
        }
      }
    }

    // 更新標籤
    const updatedTag = await prisma.knowledgeTag.update({
      where: { id },
      data: validatedData,
      include: {
        parent: {
          select: { id: true, name: true, color: true }
        },
        children: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    })

  } catch (error) {
    console.error('PUT /api/knowledge-base/tags/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge-base/tags/[id] - 刪除標籤
export async function DELETE(request: NextRequest) {
  try {
    // 從 URL 中提取標籤 ID
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const idIndex = pathSegments.findIndex(segment => segment === 'tags') + 1

    if (idIndex >= pathSegments.length) {
      throw AppError.validation('Tag ID is required')
    }

    const id = parseInt(pathSegments[idIndex], 10)
    if (isNaN(id)) {
      throw AppError.validation('Invalid tag ID')
    }

    // 驗證用戶身份
    // Extract token from request
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // Verify the token
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    // 檢查標籤是否存在
    const existingTag = await prisma.knowledgeTag.findUnique({
      where: { id },
      include: {
        children: true,
        knowledge_base: true
      }
    })

    if (!existingTag) {
      throw AppError.notFound('Tag not found')
    }

    // 檢查是否有子標籤
    if (existingTag.children.length > 0) {
      throw AppError.validation('Cannot delete tag with child tags. Please delete or reassign child tags first.')
    }

    // 檢查是否仍在使用中
    const force = new URL(request.url).searchParams.get('force') === 'true'
    if (existingTag.knowledge_base.length > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: 'Tag is still in use',
        data: {
          usage_count: existingTag.knowledge_base.length,
          can_force_delete: true,
          message: 'Add ?force=true to force delete this tag'
        }
      }, { status: 400 })
    }

    // 執行刪除
    await prisma.$transaction(async (tx) => {
      // 如果強制刪除，先移除所有關聯
      if (force && existingTag.knowledge_base.length > 0) {
        await tx.knowledgeBase.updateMany({
          where: {
            tags: {
              some: { id }
            }
          },
          data: {
            // 這裡無法直接使用 disconnect，需要手動處理關聯
          }
        })

        // 手動刪除標籤關聯（需要在 schema 中設置適當的關聯表）
        await tx.$executeRaw`
          DELETE FROM "_KnowledgeBaseToKnowledgeTag"
          WHERE "B" = ${id}
        `
      }

      // 刪除標籤
      await tx.knowledgeTag.delete({
        where: { id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    })

  } catch (error) {
    console.error('DELETE /api/knowledge-base/tags/[id] error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}