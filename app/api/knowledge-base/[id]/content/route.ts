import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

// GET /api/knowledge-base/[id]/content - 獲取知識庫文檔原始內容
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 解析文檔 ID
    const documentId = parseInt(params.id, 10)
    if (isNaN(documentId)) {
      throw AppError.badRequest('Invalid document ID')
    }

    // 查詢文檔信息
    const document = await prisma.knowledgeBase.findFirst({
      where: {
        id: documentId,
        status: { in: ['ACTIVE', 'DRAFT'] }
      },
      select: {
        id: true,
        title: true,
        source: true,
        content: true,
        mime_type: true,
        file_size: true,
        updated_at: true
      }
    })

    if (!document) {
      throw AppError.notFound('Document not found')
    }

    // 如果有原始文件路徑，讀取並返回文件內容
    if (document.source && existsSync(document.source)) {
      try {
        const fileBuffer = await readFile(document.source)
        const mimeType = document.mime_type || 'text/plain'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'private, max-age=1800', // 緩存30分鐘
            'Last-Modified': new Date(document.updated_at).toUTCString(),
            'X-Content-Source': 'file'
          }
        })
      } catch (fileError) {
        console.error('File read error:', fileError)
        // 如果文件讀取失敗，回退到數據庫內容
      }
    }

    // 如果沒有原始文件或文件讀取失敗，返回數據庫中的內容
    if (document.content) {
      const mimeType = document.mime_type || 'text/plain; charset=utf-8'

      return new NextResponse(document.content, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'private, max-age=1800',
          'Last-Modified': new Date(document.updated_at).toUTCString(),
          'X-Content-Source': 'database'
        }
      })
    }

    // 如果既沒有原始文件也沒有內容
    return NextResponse.json({
      success: false,
      error: 'No content available',
      data: {
        id: document.id,
        title: document.title,
        hasFile: !!document.source,
        hasContent: !!document.content,
        mimeType: document.mime_type
      }
    }, { status: 404 })

  } catch (error) {
    console.error('GET /api/knowledge-base/[id]/content error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Content access failed' },
      { status: 500 }
    )
  }
}