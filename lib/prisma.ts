/**
 * @fileoverview Prisma 客戶端單例模塊
📋 檔案用途：
提供全局唯一的Prisma客戶端實例，避免開發環境中的連接池耗盡
🎯 核心功能：
1. 單例模式 - 確保只有一個PrismaClient實例
2. 開發環境優化 - 熱重載時重用現有連接
3. 生產環境最佳實踐 - 每次創建新實例
🔗 使用方式：
```typescript
import { prisma } from '@/lib/prisma'
...
 * @module lib/prisma
 *
 * Prisma 客戶端單例模塊
 * 📋 檔案用途：
 * 提供全局唯一的Prisma客戶端實例，避免開發環境中的連接池耗盡
 * 🎯 核心功能：
 * 1. 單例模式 - 確保只有一個PrismaClient實例
 * 2. 開發環境優化 - 熱重載時重用現有連接
 * 3. 生產環境最佳實踐 - 每次創建新實例
 * 🔗 使用方式：
 * ```typescript
 * import { prisma } from '@/lib/prisma'
 * const users = await prisma.user.findMany()
 * ```
 * ⚠️ 注意事項：
 * - 開發環境：使用global變量避免熱重載時創建多個實例
 * - 生產環境：直接創建單個實例
 * - 連接池管理：Prisma自動管理連接池
 * 作者：Claude Code
 * 創建時間：2025-10-05
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

import { PrismaClient } from '@prisma/client'

// ========================================================================
// 全局類型擴展（開發環境）
// ========================================================================

/**
 * 擴展NodeJS全局對象
 * 在開發環境中用於存儲PrismaClient實例
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// ========================================================================
// Prisma 客戶端實例化
// ========================================================================

/**
 * 創建或獲取Prisma客戶端實例
 *
 * 實現邏輯：
 * - 開發環境：使用global.prisma避免熱重載時創建多個實例
 * - 生產環境：直接創建新實例
 *
 * 連接池配置：
 * - Prisma默認連接池大小：num_physical_cpus * 2 + 1
 * - 可通過DATABASE_URL的connection_limit參數調整
 */
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

// ========================================================================
// 開發環境配置
// ========================================================================

/**
 * 開發環境下保存實例到global
 * 避免Next.js熱重載時創建過多連接
 */
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// ========================================================================
// 優雅關閉處理
// ========================================================================

/**
 * 進程退出時斷開數據庫連接
 * 確保連接池正確清理
 */
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

/**
 * 導出默認實例
 * 方便在其他模塊中導入使用
 */
export default prisma
