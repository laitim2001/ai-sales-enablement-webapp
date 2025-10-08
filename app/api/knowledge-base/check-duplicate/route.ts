/**
 * @fileoverview 知識庫文件重複檢查API
 * @description 在上傳前檢查文件是否已存在（基於SHA-256 hash）
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'

/**
 * POST /api/knowledge-base/check-duplicate
 * 檢查文件是否已存在於知識庫
 *
 * 請求體：
 * - fileHash: string - 文件的SHA-256 hash值
 * - fileName: string - 文件名（用於提示）
 *
 * 回應：
 * - exists: boolean - 文件是否存在
 * - file?: object - 如果存在，返回現有文件信息
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶身份 - 從 header 或 cookie 獲取 token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('請先登入')
    }

    const payload = verifyToken(token)
    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('無效的認證令牌')
    }

    // 解析請求體
    const body = await request.json()
    const { fileHash, fileName } = body

    if (!fileHash || typeof fileHash !== 'string') {
      throw AppError.validation('缺少文件hash值')
    }

    // 查詢數據庫檢查文件是否存在
    const existingFile = await prisma.knowledgeBase.findUnique({
      where: { hash: fileHash },
      select: {
        id: true,
        title: true,
        category: true,
        created_at: true,
        created_by: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    if (existingFile) {
      // 文件已存在 - 組合用戶顯示名稱
      const uploaderName = existingFile.creator
        ? `${existingFile.creator.first_name} ${existingFile.creator.last_name}`.trim() || existingFile.creator.email
        : 'Unknown'

      return NextResponse.json({
        success: true,
        data: {
          exists: true,
          file: {
            id: existingFile.id,
            title: existingFile.title,
            category: existingFile.category,
            uploadedAt: existingFile.created_at,
            uploadedBy: uploaderName
          },
          message: `文件「${fileName || '未命名'}」已存在於知識庫中`
        }
      })
    }

    // 文件不存在
    return NextResponse.json({
      success: true,
      data: {
        exists: false,
        message: '文件不存在，可以上傳'
      }
    })

  } catch (error) {
    console.error('Check duplicate error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: '檢查文件失敗' },
      { status: 500 }
    )
  }
}
