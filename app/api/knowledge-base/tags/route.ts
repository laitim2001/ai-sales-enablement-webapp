import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'

// 標籤創建驗證 schema
const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  parent_id: z.number().int().positive().optional()
})

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