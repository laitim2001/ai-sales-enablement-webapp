/**
 * 測試資料夾種子數據腳本
 *
 * 用於創建初始測試資料夾結構
 * 運行方式: npx tsx scripts/seed-folders.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始創建測試資料夾...')

  // 創建頂層資料夾
  const productFolder = await prisma.knowledgeFolder.create({
    data: {
      name: '產品資料',
      description: '產品相關文檔和資料',
      path: '/產品資料',
      icon: '📦',
      color: '#3B82F6',
      sort_order: 1,
    },
  })
  console.log('✅ 創建資料夾: 產品資料')

  const salesFolder = await prisma.knowledgeFolder.create({
    data: {
      name: '銷售手冊',
      description: '銷售流程和技巧文檔',
      path: '/銷售手冊',
      icon: '💼',
      color: '#10B981',
      sort_order: 2,
    },
  })
  console.log('✅ 創建資料夾: 銷售手冊')

  const trainingFolder = await prisma.knowledgeFolder.create({
    data: {
      name: '培訓材料',
      description: '員工培訓和教學資料',
      path: '/培訓材料',
      icon: '📚',
      color: '#F59E0B',
      sort_order: 3,
    },
  })
  console.log('✅ 創建資料夾: 培訓材料')

  // 創建子資料夾
  const productSpecFolder = await prisma.knowledgeFolder.create({
    data: {
      name: '產品規格',
      description: '詳細的產品技術規格',
      parent_id: productFolder.id,
      path: '/產品資料/產品規格',
      icon: '📋',
      color: '#6366F1',
      sort_order: 1,
    },
  })
  console.log('✅ 創建子資料夾: 產品資料/產品規格')

  const productPriceFolder = await prisma.knowledgeFolder.create({
    data: {
      name: '價格表',
      description: '產品定價和優惠信息',
      parent_id: productFolder.id,
      path: '/產品資料/價格表',
      icon: '💰',
      color: '#8B5CF6',
      sort_order: 2,
    },
  })
  console.log('✅ 創建子資料夾: 產品資料/價格表')

  const salesProcessFolder = await prisma.knowledgeFolder.create({
    data: {
      name: '銷售流程',
      description: '標準銷售流程文檔',
      parent_id: salesFolder.id,
      path: '/銷售手冊/銷售流程',
      icon: '🔄',
      color: '#14B8A6',
      sort_order: 1,
    },
  })
  console.log('✅ 創建子資料夾: 銷售手冊/銷售流程')

  console.log('\n✨ 測試資料夾創建完成！')
  console.log('\n📊 資料夾統計:')
  console.log(`   - 頂層資料夾: 3 個`)
  console.log(`   - 子資料夾: 3 個`)
  console.log(`   - 總計: 6 個資料夾`)
}

main()
  .catch((e) => {
    console.error('❌ 創建資料夾時發生錯誤:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
