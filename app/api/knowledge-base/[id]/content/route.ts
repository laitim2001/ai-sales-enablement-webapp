/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫內容獲取API (app/api/knowledge-base/[id]/content/route.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供知識庫文檔原始內容的獲取功能，支援從檔案系統和數據庫
 * 兩種來源讀取文檔內容，並提供適當的HTTP回應標頭和緩存控制
 *
 * 【主要職責】
 * • 內容來源管理 - 優先從原始檔案讀取，回退到數據庫內容
 * • 檔案系統存取 - 安全讀取儲存在檔案系統中的原始文檔
 * • MIME類型處理 - 根據文檔類型提供正確的Content-Type標頭
 * • 緩存策略控制 - 設定適當的緩存標頭提升存取效能
 * • 錯誤恢復機制 - 檔案讀取失敗時自動回退到替代方案
 *
 * 【API規格】
 * • GET /api/knowledge-base/[id]/content - 獲取文檔原始內容
 *   路徑參數: id (文檔ID)
 *   回應格式: 原始文檔內容 (非JSON格式)
 *   標頭: Content-Type, Cache-Control, Last-Modified, X-Content-Source
 *   狀態碼: 200 (成功) | 404 (未找到) | 401 (未授權) | 500 (伺服器錯誤)
 *
 * 【使用場景】
 * • 文檔預覽功能 - 前端顯示文檔原始內容
 * • 內容編輯器 - 載入文檔進行編輯修改
 * • 檔案備份驗證 - 檢查檔案系統和數據庫內容一致性
 * • API整合服務 - 第三方系統獲取文檔內容
 * • 內容同步機制 - 確保多來源內容的同步性
 *
 * 【相關檔案】
 * • lib/auth-server.ts - 用戶身份驗證
 * • lib/errors.ts - 錯誤處理和分類
 * • lib/db.ts - 數據庫連接和查詢
 * • fs/promises - Node.js檔案系統異步操作
 *
 * 【開發注意】
 * • 實現雙重來源策略：檔案系統 -> 數據庫 -> 錯誤
 * • 提供詳細的X-Content-Source標頭指示內容來源
 * • 支援30分鐘私有緩存減少重複讀取
 * • 檔案讀取錯誤時會自動回退到數據庫內容
 * • 只允許存取ACTIVE和DRAFT狀態的文檔
 * • 返回原始內容而非JSON包裝格式
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