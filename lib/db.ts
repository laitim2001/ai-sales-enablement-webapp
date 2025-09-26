/**
 * ================================================================
 * 檔案名稱: 資料庫連接管理
 * 檔案用途: AI銷售賦能平台的PostgreSQL資料庫連接配置與管理
 * 開發階段: 生產環境
 * ================================================================
 *
 * 功能索引:
 * 1. Prisma客戶端初始化 - 單例模式確保連接唯一性
 * 2. 全域連接管理 - 開發環境避免重複連接
 * 3. 日誌配置 - 開發/生產環境不同的日誌級別
 * 4. 優雅關閉 - 應用結束時正確斷開資料庫連接
 *
 * 技術特色:
 * - 單例模式：避免在開發環境創建多個Prisma實例
 * - 環境配置：開發環境詳細日誌，生產環境只記錄錯誤
 * - 類型安全：完整的TypeScript類型支援
 * - 錯誤格式：友善的錯誤信息顯示
 *
 * 資料庫架構:
 * - PostgreSQL主資料庫
 * - pgvector擴展支援向量搜索
 * - 事務支援確保數據一致性
 *
 * 環境變數依賴:
 * - DATABASE_URL: PostgreSQL連接字串
 * - NODE_ENV: 環境模式（development/production）
 *
 * 注意事項:
 * - 開發環境會重用全域Prisma實例
 * - 生產環境每次都創建新實例
 * - 應用關閉時需調用disconnectPrisma()
 *
 * 更新記錄:
 * - Week 1: 建立基礎資料庫連接
 * - Week 2: 新增pgvector支援
 * - Week 5: 優化連接池配置
 * ================================================================
 */

import { PrismaClient } from '@prisma/client'

// 全域Prisma實例類型定義，避免開發環境重複創建連接
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma客戶端單例：確保整個應用只有一個資料庫連接實例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 日誌配置：開發環境記錄詳細資訊，生產環境只記錄錯誤
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    // 錯誤格式：美化錯誤信息，便於開發調試
    errorFormat: 'pretty',
  })

// 開發環境：將Prisma實例儲存到全域，避免熱重載時重複創建連接
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * 優雅關閉資料庫連接
 * 在應用程式關閉時調用，確保資料庫連接正確釋放
 */
export async function disconnectPrisma() {
  await prisma.$disconnect()
}