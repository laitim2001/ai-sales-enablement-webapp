/**
 * @fileoverview AI銷售賦能平台知識庫內容獲取API - 提供文檔原始內容訪問功能
 * @module app/api/knowledge-base/[id]/content/route
 *
 * ## 功能說明
 * 提供知識庫文檔原始內容的獲取功能,支援從檔案系統和數據庫兩種來源讀取,
 * 並提供適當的HTTP標頭和緩存控制。
 *
 * ## API規格
 * - **端點**: `GET /api/knowledge-base/[id]/content` - 獲取文檔原始內容
 * - **響應**: 原始文檔內容 (非JSON格式)
 * - **標頭**: Content-Type, Cache-Control, Last-Modified, X-Content-Source
 * - **狀態碼**: 200 (成功) | 401 (未認證) | 404 (未找到) | 500 (伺服器錯誤)
 *
 * ## 主要職責
 * - 雙重來源策略 - 優先從檔案系統讀取,回退到數據庫內容
 * - MIME類型處理 - 根據文檔類型提供正確的Content-Type
 * - 緩存控制 - 30分鐘私有緩存提升訪問效能
 * - 錯誤恢復 - 檔案讀取失敗時自動回退
 * - 來源標識 - X-Content-Source標頭指示內容來源
 *
 * ## 相關文件
 * - `/lib/db.ts` - Prisma數據庫連接
 * - `/lib/auth-server.ts` - JWT令牌驗證
 * - `/lib/errors.ts` - 應用錯誤處理
 * - `fs/promises` - Node.js檔案系統異步操作
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { NextRequest, NextResponse } from 'next/server'    // Next.js請求和回應處理
import { prisma } from '@/lib/db'                         // 數據庫連接實例
import { AppError } from '@/lib/errors'                   // 應用錯誤處理
import { verifyToken } from '@/lib/auth-server'           // JWT令牌驗證
import { existsSync } from 'fs'                           // 同步檔案存在檢查
import { readFile } from 'fs/promises'                    // 異步檔案讀取

/**
 * GET /api/knowledge-base/[id]/content - 獲取知識庫文檔原始內容
 *
 * 根據文檔ID獲取原始內容，優先從檔案系統讀取，
 * 如果檔案不存在或讀取失敗則回退到數據庫內容
 *
 * @param request - Next.js請求對象
 * @param params - 路徑參數，包含文檔ID
 * @returns 文檔原始內容或錯誤回應
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 從請求中提取並驗證用戶身份令牌
    // 支援Authorization header和cookie兩種方式
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // 驗證JWT令牌並獲取用戶資訊
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

        return new NextResponse(new Uint8Array(fileBuffer), {
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