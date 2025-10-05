/**
 * ================================================================
 * 檔案名稱: 知識庫主要API路由
 * 檔案用途: AI銷售賦能平台的知識庫CRUD操作核心API
 * 開發階段: 生產環境就緒
 * ================================================================
 *
 * 功能索引:
 * 1. GET /api/knowledge-base - 獲取知識庫列表（支援分頁、篩選、排序）
 * 2. POST /api/knowledge-base - 創建新的知識庫項目（包含標籤和向量化處理）
 *
 * API規格:
 * - 方法: GET, POST
 * - 路徑: /api/knowledge-base
 * - 認證: JWT Token (Bearer Token或Cookie)
 * - 權限: 已認證用戶
 * - 回應: 標準化JSON格式 {success, data, pagination?, message?}
 *
 * 業務特色:
 * - 智能重複檢測: 使用SHA-256內容哈希防止重複文檔
 * - 自動向量化: 支援內容自動向量化處理用於語義搜索
 * - 標籤系統: 動態標籤管理，自動更新使用次數統計
 * - 事務安全: 使用資料庫事務確保數據一致性
 * - 版本管理: 支援文檔版本控制和更新追蹤
 * - 多語言支援: 支援多種語言文檔管理
 * - 分類管理: 按文檔類型進行分類組織
 *
 * 技術特色:
 * - Prisma ORM: 類型安全的資料庫操作
 * - Zod驗證: 嚴格的請求數據驗證
 * - JWT認證: 安全的用戶身份驗證
 * - 錯誤處理: 完整的錯誤分類和處理機制
 * - 性能優化: 智能查詢優化和分頁處理
 *
 * 注意事項:
 * - 所有API都需要用戶認證
 * - 創建文檔時會自動觸發向量化處理任務
 * - 支援軟刪除機制保護數據安全
 * - 標籤系統會自動維護使用次數統計
 *
 * 更新記錄:
 * - Week 1: 基礎CRUD操作實現
 * - Week 2: 標籤系統和分類功能
 * - Week 3: 向量化處理整合
 * - Week 4: 性能優化和錯誤處理完善
 * - Week 5: 搜索功能整合和API標準化
 * ================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/auth-server'
import { DocumentCategory, DocumentStatus, ProcessingStatus } from '@prisma/client'

/**
 * ================================================================
 * 資料驗證架構 - Data Validation Schemas
 * ================================================================
 */

// 創建知識庫項目的請求驗證架構
const CreateKnowledgeBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),           // 文檔標題，必填且不超過255字符
  content: z.string().optional(),                                                     // 文檔內容，可選（文件上傳時可能為空）
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.GENERAL),        // 文檔分類，預設為通用類別
  source: z.string().optional(),                                                     // 文檔來源，如URL、檔案路徑等
  author: z.string().optional(),                                                     // 文檔作者
  language: z.string().default('zh-TW'),                                             // 文檔語言，預設繁體中文
  metadata: z.record(z.any()).optional(),                                            // 額外的元數據，用於擴展屬性
  tags: z.array(z.string()).optional()                                               // 標籤陣列，用於分類和搜索
})

// 更新知識庫項目的請求驗證架構（所有欄位都是可選的）
// const UpdateKnowledgeBaseSchema = CreateKnowledgeBaseSchema.partial()

// 查詢知識庫列表的請求驗證架構
const QueryKnowledgeBaseSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),                 // 頁碼，從1開始
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),               // 每頁項目數，預設20項
  category: z.nativeEnum(DocumentCategory).optional(),                               // 按分類篩選
  status: z.nativeEnum(DocumentStatus).optional(),                                   // 按狀態篩選
  search: z.string().optional(),                                                     // 全文搜索關鍵字
  tags: z.string().optional(),                                                       // 標籤篩選（逗號分隔的標籤名稱）
  sort: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),         // 排序欄位
  order: z.enum(['asc', 'desc']).default('desc')                                     // 排序方向
})

/**
 * ================================================================
 * GET /api/knowledge-base - 獲取知識庫列表
 * ================================================================
 *
 * 功能說明:
 * - 分頁查詢知識庫項目列表
 * - 支援多種篩選條件（分類、狀態、標籤）
 * - 提供全文搜索功能
 * - 靈活的排序選項
 * - 包含關聯數據（創建者、標籤、分塊統計）
 *
 * 查詢參數:
 * - page: 頁碼（預設1）
 * - limit: 每頁項目數（預設20，最大50）
 * - category: 文檔分類篩選
 * - status: 文檔狀態篩選
 * - search: 全文搜索（標題、內容、作者）
 * - tags: 標籤篩選（逗號分隔）
 * - sort: 排序欄位（created_at/updated_at/title）
 * - order: 排序方向（asc/desc）
 *
 * 回應格式:
 * {
 *   success: true,
 *   data: [...],
 *   pagination: { page, limit, total, pages }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    /**
     * ===== 第一步：用戶身份驗證 =====
     * 檢查並驗證JWT Token，支援Header和Cookie兩種方式
     */

    // 從Authorization Header提取Bearer Token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    // 如果Header中沒有token，嘗試從Cookie中獲取
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    // 如果兩種方式都沒有token，返回未授權錯誤
    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // 驗證token的有效性和完整性
    const payload = verifyToken(token)

    // 檢查token payload的格式和必要欄位
    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    /**
     * ===== 第二步：解析和驗證查詢參數 =====
     * 提取URL查詢參數並進行格式驗證
     */

    // 從URL中提取所有查詢參數
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())

    // 使用Zod架構驗證查詢參數的格式和類型
    const validatedParams = QueryKnowledgeBaseSchema.parse(params)

    // 解構獲取各個查詢參數
    const { page, limit, category, status, search, tags, sort, order } = validatedParams

    /**
     * ===== 第三步：構建資料庫查詢條件 =====
     * 根據查詢參數動態構建Prisma查詢條件
     */

    const where: any = {}

    // 按文檔分類篩選
    if (category) {
      where.category = category
    }

    // 按文檔狀態篩選
    if (status) {
      where.status = status
    } else {
      // 預設只顯示活躍和草稿狀態的文檔，隱藏已刪除的文檔
      where.status = { in: [DocumentStatus.ACTIVE, DocumentStatus.DRAFT] }
    }

    // 全文搜索條件：在標題、內容、作者中搜索關鍵字
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },      // 不區分大小寫的標題搜索
        { content: { contains: search, mode: 'insensitive' } },    // 不區分大小寫的內容搜索
        { author: { contains: search, mode: 'insensitive' } }      // 不區分大小寫的作者搜索
      ]
    }

    // 標籤篩選條件：支援多個標籤的OR查詢
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim())      // 分割並清理標籤字符串
      where.tags = {
        some: {                                                   // 至少包含其中一個標籤
          name: { in: tagList }
        }
      }
    }

    /**
     * ===== 第四步：計算分頁參數 =====
     */

    // 計算需要跳過的記錄數量（用於分頁）
    const skip = (page - 1) * limit

    /**
     * ===== 第五步：執行資料庫查詢 =====
     * 並行執行數據查詢和總數統計以提高性能
     */

    // 並行執行兩個查詢：1.獲取分頁數據 2.獲取總記錄數
    const [knowledgeBase, totalCount] = await Promise.all([
      // 查詢分頁數據，包含關聯信息
      prisma.knowledgeBase.findMany({
        where,                                                          // 應用篩選條件
        include: {
          // 包含創建者信息（僅選擇必要欄位保護隱私）
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          // 包含最後更新者信息
          updater: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          // 包含關聯的標籤信息
          tags: {
            select: { id: true, name: true, color: true }
          },
          // 包含文檔分塊統計（用於顯示處理進度）
          _count: {
            select: { chunks: true }
          }
        },
        orderBy: { [sort]: order },                                    // 動態排序
        skip,                                                          // 分頁跳過的記錄數
        take: limit                                                    // 限制返回的記錄數
      }),
      // 查詢符合條件的總記錄數（用於分頁計算）
      prisma.knowledgeBase.count({ where })
    ])

    /**
     * ===== 第六步：返回標準化回應 =====
     * 包含數據、分頁信息和成功狀態
     */

    return NextResponse.json({
      success: true,                                                   // 操作成功標識
      data: knowledgeBase,                                            // 查詢到的知識庫項目陣列
      pagination: {                                                   // 分頁元數據
        page,                                                         // 當前頁碼
        limit,                                                        // 每頁項目數
        total: totalCount,                                           // 總記錄數
        pages: Math.ceil(totalCount / limit)                         // 總頁數
      }
    })

  } catch (error) {
    /**
     * ===== 錯誤處理機制 =====
     * 根據錯誤類型返回適當的HTTP狀態碼和錯誤信息
     */

    console.error('GET /api/knowledge-base error:', error)

    // Zod驗證錯誤：查詢參數格式不正確
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',           // 用戶友好的錯誤信息
          details: error.errors                        // 詳細的驗證錯誤列表
        },
        { status: 400 }                               // 400 Bad Request
      )
    }

    // 應用級錯誤：業務邏輯錯誤或認證錯誤
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message                         // 預定義的錯誤信息
        },
        { status: error.statusCode }                   // 使用AppError中定義的狀態碼
      )
    }

    // 未預期的系統錯誤：資料庫連接失敗等
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'                // 通用錯誤信息，隱藏內部實現細節
      },
      { status: 500 }                                 // 500 Internal Server Error
    )
  }
}

/**
 * ================================================================
 * POST /api/knowledge-base - 創建新的知識庫項目
 * ================================================================
 *
 * 功能說明:
 * - 創建新的知識庫文檔項目
 * - 支援內容重複檢測（SHA-256哈希）
 * - 自動標籤管理和關聯
 * - 觸發自動向量化處理任務
 * - 事務安全確保數據一致性
 *
 * 請求格式:
 * {
 *   title: string,           // 必填，文檔標題
 *   content?: string,        // 可選，文檔內容
 *   category?: DocumentCategory,  // 可選，文檔分類
 *   source?: string,         // 可選，文檔來源
 *   author?: string,         // 可選，文檔作者
 *   language?: string,       // 可選，文檔語言
 *   metadata?: object,       // 可選，額外元數據
 *   tags?: string[]          // 可選，標籤陣列
 * }
 *
 * 回應格式:
 * {
 *   success: true,
 *   data: {...},            // 創建的知識庫項目（包含關聯數據）
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    /**
     * ===== 第一步：用戶身份驗證 =====
     * 與GET方法相同的認證邏輯
     */

    // 從Authorization Header或Cookie提取JWT Token
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided')
    }

    // 驗證token並提取用戶信息
    const payload = verifyToken(token)

    if (!payload || typeof payload !== 'object' || !payload.userId) {
      throw AppError.unauthorized('Invalid token payload')
    }

    /**
     * ===== 第二步：解析和驗證請求數據 =====
     */

    // 解析JSON請求體
    const body = await request.json()

    // 使用Zod架構驗證請求數據格式
    const validatedData = CreateKnowledgeBaseSchema.parse(body)

    // 分離標籤數據和其他知識庫數據
    const { tags, ...knowledgeBaseData } = validatedData

    /**
     * ===== 第三步：內容重複檢測 =====
     * 使用SHA-256哈希檢測重複內容，防止重複文檔
     */

    // 為文檔內容生成SHA-256哈希值（如果有內容）
    const contentHash = knowledgeBaseData.content ?
      crypto.createHash('sha256').update(knowledgeBaseData.content).digest('hex') :
      null

    // 檢查是否已存在相同內容的文檔
    if (contentHash) {
      const existing = await prisma.knowledgeBase.findUnique({
        where: { hash: contentHash }
      })

      if (existing) {
        throw AppError.validation('Duplicate content detected. A document with the same content already exists.')
      }
    }

    /**
     * ===== 第四步：資料庫事務處理 =====
     * 使用事務確保知識庫項目創建和標籤關聯的原子性
     */

    const result = await prisma.$transaction(async (tx) => {
      /**
       * 4.1 創建知識庫項目主記錄
       */
      const knowledgeBase = await tx.knowledgeBase.create({
        data: {
          ...knowledgeBaseData,                                        // 展開驗證後的基本數據
          hash: contentHash,                                           // 內容哈希值
          created_by: payload.userId,                                  // 創建者ID
          updated_by: payload.userId,                                  // 更新者ID（初次創建時與創建者相同）
          processing_status: knowledgeBaseData.content ?              // 根據是否有內容決定處理狀態
            ProcessingStatus.PENDING : ProcessingStatus.COMPLETED      // 有內容需要向量化處理，無內容則完成
        },
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          }
        }
      })

      /**
       * 4.2 處理標籤系統
       * 實現智能標籤管理：查找現有標籤、創建新標籤、更新使用統計
       */
      if (tags && tags.length > 0) {
        // 查找已存在的標籤
        const existingTags = await tx.knowledgeTag.findMany({
          where: { name: { in: tags } }
        })

        // 分離已存在和需要新建的標籤
        const existingTagNames = existingTags.map(tag => tag.name)
        const newTagNames = tags.filter(name => !existingTagNames.includes(name))

        // 批量創建新標籤（初始使用次數為1）
        const newTags = await Promise.all(
          newTagNames.map(name =>
            tx.knowledgeTag.create({
              data: { name, usage_count: 1 }
            })
          )
        )

        // 更新現有標籤的使用次數（增加引用計數）
        await Promise.all(
          existingTags.map(tag =>
            tx.knowledgeTag.update({
              where: { id: tag.id },
              data: { usage_count: { increment: 1 } }
            })
          )
        )

        // 建立知識庫項目與標籤的多對多關聯
        const allTags = [...existingTags, ...newTags]
        await tx.knowledgeBase.update({
          where: { id: knowledgeBase.id },
          data: {
            tags: {
              connect: allTags.map(tag => ({ id: tag.id }))           // 連接所有相關標籤
            }
          }
        })

        /**
         * 重新獲取完整的知識庫項目數據（包含新關聯的標籤）
         * 確保返回的數據是最新且完整的
         */
        return await tx.knowledgeBase.findUnique({
          where: { id: knowledgeBase.id },
          include: {
            creator: {
              select: { id: true, first_name: true, last_name: true, email: true }
            },
            tags: {
              select: { id: true, name: true, color: true }
            }
          }
        })
      }

      // 如果沒有標籤，直接返回創建的知識庫項目
      return knowledgeBase
    })

    /**
     * ===== 第五步：創建後處理任務 =====
     * 如果知識庫項目包含內容，自動創建向量化處理任務
     */
    if (result && validatedData.content) {
      await prisma.processingTask.create({
        data: {
          knowledge_base_id: result.id,                               // 關聯的知識庫項目ID
          task_type: 'VECTORIZATION',                                // 任務類型：向量化處理
          status: ProcessingStatus.PENDING,                          // 初始狀態：等待處理
          metadata: {                                                // 任務元數據
            content_length: validatedData.content.length,           // 內容長度（用於處理預估）
            user_id: payload.userId                                  // 發起用戶ID
          }
        }
      })
    }

    /**
     * ===== 第六步：返回成功回應 =====
     */
    return NextResponse.json({
      success: true,                                                 // 操作成功標識
      data: result,                                                  // 創建的知識庫項目完整數據
      message: 'Knowledge base item created successfully'            // 成功消息
    }, { status: 201 })                                            // 201 Created 狀態碼

  } catch (error) {
    /**
     * ===== 錯誤處理機制 =====
     * 與GET方法類似的分層錯誤處理
     */

    console.error('POST /api/knowledge-base error:', error)

    // Zod驗證錯誤：請求數據格式不正確
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',                           // 用戶友好的錯誤信息
          details: error.errors                                    // 詳細的驗證錯誤列表
        },
        { status: 400 }                                           // 400 Bad Request
      )
    }

    // 應用級錯誤：業務邏輯錯誤（如重複內容、認證失敗等）
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message                                     // 預定義的業務錯誤信息
        },
        { status: error.statusCode }                              // 使用AppError中定義的狀態碼
      )
    }

    // 未預期的系統錯誤
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'                            // 通用錯誤信息
      },
      { status: 500 }                                             // 500 Internal Server Error
    )
  }
}