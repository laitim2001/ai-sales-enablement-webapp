/**
 * ================================================================
 * 檔案名稱: 資料庫種子腳本
 * 檔案用途: AI銷售賦能平台的測試資料創建
 * 開發階段: 開發環境
 * ================================================================
 *
 * 功能索引:
 * 1. 創建測試用戶 - 管理員和銷售代表用戶
 * 2. 創建測試客戶資料 - CRM模擬數據
 * 3. 創建測試知識庫 - 搜索功能測試數據
 * 
 * 使用方法:
 * npx tsx prisma/seed.ts
 * 或
 * npm run db:seed
 * 
 * 注意事項:
 * - 僅用於開發和測試環境
 * - 密碼已經過bcrypt加密
 * - 生產環境不應使用此腳本
 * ================================================================
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth-server'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始播種測試資料...')

  // 創建測試用戶
  console.log('👤 創建測試用戶...')

  // 管理員用戶
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: await hashPassword('admin123'),
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      department: 'Management',
      is_active: true
    }
  })

  // 銷售代表用戶
  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      email: 'sales@example.com',
      password_hash: await hashPassword('sales123'),
      first_name: 'Sales',
      last_name: 'Rep',
      role: 'SALES_REP',
      department: 'Sales',
      is_active: true
    }
  })

  // 測試用戶
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password_hash: await hashPassword('password123'),
      first_name: 'Test',
      last_name: 'User',
      role: 'SALES_REP',
      department: 'Sales',
      is_active: true
    }
  })

  console.log('✅ 測試用戶創建成功!')
  console.log(`   管理員: ${adminUser.email} / admin123`)
  console.log(`   銷售員: ${salesUser.email} / sales123`)
  console.log(`   測試員: ${testUser.email} / password123`)

  console.log('🎉 種子資料播種完成!')
}

main()
  .catch((e) => {
    console.error('❌ 種子腳本執行失敗:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
