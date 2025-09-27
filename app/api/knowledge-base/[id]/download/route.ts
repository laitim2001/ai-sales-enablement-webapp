/**
 * ================================================================
 * AI銷售賦能平台 - 知識庫下載API (app/api/knowledge-base/[id]/download/route.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 提供知識庫文檔的下載功能，支援原始檔案下載和內容導出
 * 根據文檔類型自動設定適當的檔案名稱和MIME類型
 *
 * 【主要職責】
 * • 檔案下載服務 - 提供原始檔案的直接下載功能
 * • 內容導出功能 - 將數據庫內容導出為對應格式檔案
 * • MIME類型識別 - 根據檔案類型設定正確的Content-Type
 * • 檔案名稱處理 - 自動生成安全的下載檔案名稱
 * • 下載標頭管理 - 設定適當的Content-Disposition等標頭
 *
 * 【API規格】
 * • GET /api/knowledge-base/[id]/download - 下載文檔檔案
 *   路徑參數: id (文檔ID)
 *   回應格式: 二進制檔案內容
 *   標頭: Content-Type, Content-Disposition, Content-Length, Cache-Control
 *   狀態碼: 200 (成功) | 404 (未找到) | 401 (未授權) | 500 (伺服器錯誤)
 *
 * 【使用場景】
 * • 文檔備份下載 - 用戶下載原始文檔進行備份
 * • 離線查看需求 - 下載文檔供離線閱讀使用
 * • 檔案分享傳輸 - 將知識庫內容分享給外部用戶
 * • 數據遷移導出 - 批量導出知識庫內容進行遷移
 * • 內容歸檔保存 - 長期保存重要文檔的原始格式
 *
 * 【相關檔案】
 * • lib/auth-server.ts - 用戶身份驗證
 * • lib/errors.ts - 錯誤處理和分類
 * • lib/db.ts - 數據庫連接和查詢
 * • fs/promises - Node.js檔案系統操作
 * • path - Node.js路徑處理模組
 *
 * 【開發注意】
 * • 支援多種檔案格式：HTML、Markdown、JSON、CSV、純文字
 * • 實現安全的檔案名稱編碼，避免特殊字符問題
 * • 提供1小時檔案緩存提升下載效能
 * • 原始檔案優先，內容導出為備用方案
 * • 只允許下載ACTIVE和DRAFT狀態的文檔
 * • 自動根據MIME類型推斷檔案副檔名
 */

import { NextRequest, NextResponse } from 'next/server'    // Next.js請求和回應處理
import { prisma } from '@/lib/db'                         // 數據庫連接實例
import { AppError } from '@/lib/errors'                   // 應用錯誤處理
import { verifyToken } from '@/lib/auth-server'           // JWT令牌驗證
import { existsSync } from 'fs'                           // 同步檔案存在檢查
import { readFile } from 'fs/promises'                    // 異步檔案讀取
import path from 'path'                                   // 路徑處理工具

/**
 * GET /api/knowledge-base/[id]/download - 下載知識庫文檔原文件
 *
 * 根據文檔ID提供檔案下載功能，優先返回原始檔案，
 * 如果原始檔案不存在則導出數據庫內容為對應格式
 *
 * @param request - Next.js請求對象
 * @param params - 路徑參數，包含文檔ID
 * @returns 檔案下載回應或錯誤信息
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

        return new NextResponse(new Uint8Array(fileBuffer), {
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