import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'

// GET /api/knowledge-base/[id]/download - 下載知識庫文檔原文件
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 驗證用戶身份
    const user = await verifyToken(request)
    if (!user) {
      throw AppError.unauthorized('Authentication required')
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
        status: { in: ['ACTIVE', 'DRAFT'] } // 只允許下載活躍和草稿文檔
      },
      select: {
        id: true,
        title: true,
        source: true,
        content: true,
        mime_type: true,
        file_size: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!document) {
      throw AppError.notFound('Document not found')
    }

    // 如果有原始文件路徑，返回文件
    if (document.source && existsSync(document.source)) {
      try {
        const fileBuffer = await readFile(document.source)
        const fileName = path.basename(document.source)
        const mimeType = document.mime_type || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'private, max-age=3600', // 緩存1小時
            'Last-Modified': new Date(document.updated_at).toUTCString()
          }
        })
      } catch (fileError) {
        console.error('File read error:', fileError)
        // 如果文件讀取失敗，回退到內容返回
      }
    }

    // 如果沒有原始文件或文件讀取失敗，返回文檔內容
    if (document.content) {
      const contentBuffer = Buffer.from(document.content, 'utf-8')

      // 根據 mime_type 確定文件擴展名
      let extension = '.txt'
      let mimeType = 'text/plain; charset=utf-8'

      if (document.mime_type) {
        switch (document.mime_type) {
          case 'text/html':
            extension = '.html'
            mimeType = 'text/html; charset=utf-8'
            break
          case 'text/markdown':
            extension = '.md'
            mimeType = 'text/markdown; charset=utf-8'
            break
          case 'application/json':
            extension = '.json'
            mimeType = 'application/json; charset=utf-8'
            break
          case 'text/csv':
          case 'application/csv':
            extension = '.csv'
            mimeType = 'text/csv; charset=utf-8'
            break
          default:
            mimeType = document.mime_type
        }
      }

      const fileName = `${document.title}${extension}`

      return new NextResponse(contentBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': contentBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
          'Last-Modified': new Date(document.updated_at).toUTCString()
        }
      })
    }

    // 如果既沒有原始文件也沒有內容
    throw AppError.notFound('No downloadable content found')

  } catch (error) {
    console.error('GET /api/knowledge-base/[id]/download error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    )
  }
}