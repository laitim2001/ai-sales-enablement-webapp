/**
 * 測試數據庫設置腳本
 *
 * 功能：
 * - 創建測試數據庫（如果不存在）
 * - 運行 Prisma 遷移
 * - 清理舊的測試數據
 *
 * 運行：
 * node scripts/setup-test-db.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'blue');
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) log(stdout.trim(), 'green');
    if (stderr && !stderr.includes('warn')) log(stderr.trim(), 'yellow');
    log(`✅ ${description} 完成`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} 失敗: ${error.message}`, 'red');
    return false;
  }
}

async function setupTestDatabase() {
  log('\n📊 開始設置測試數據庫...', 'blue');
  log('==========================================\n');

  // 1. 檢查 PostgreSQL 是否運行
  log('1️⃣ 檢查 PostgreSQL 連接...', 'blue');
  const pgRunning = await runCommand(
    'psql -U postgres -c "SELECT version();" 2>&1',
    '檢查 PostgreSQL'
  );

  if (!pgRunning) {
    log('\n⚠️ PostgreSQL 似乎未運行。請確保 PostgreSQL 已啟動。', 'yellow');
    log('   Windows: 檢查服務管理器中的 PostgreSQL 服務', 'yellow');
    log('   Mac: brew services start postgresql', 'yellow');
    log('   Linux: sudo systemctl start postgresql', 'yellow');
    process.exit(1);
  }

  // 2. 創建測試數據庫（如果不存在）
  log('\n2️⃣ 創建測試數據庫...', 'blue');
  await runCommand(
    'psql -U postgres -c "DROP DATABASE IF EXISTS sales_enablement_test;"',
    '刪除舊測試數據庫'
  );
  await runCommand(
    'psql -U postgres -c "CREATE DATABASE sales_enablement_test;"',
    '創建新測試數據庫'
  );

  // 3. 運行 Prisma 遷移
  log('\n3️⃣ 運行數據庫遷移...', 'blue');
  const migrated = await runCommand(
    'npx prisma migrate deploy --schema=./prisma/schema.prisma',
    'Prisma 數據庫遷移'
  );

  if (!migrated) {
    log('\n⚠️ 遷移失敗。嘗試使用 db push...', 'yellow');
    await runCommand(
      'npx prisma db push --schema=./prisma/schema.prisma --skip-generate',
      'Prisma DB Push'
    );
  }

  // 4. 生成 Prisma Client
  log('\n4️⃣ 生成 Prisma Client...', 'blue');
  await runCommand(
    'npx prisma generate',
    '生成 Prisma Client'
  );

  log('\n==========================================');
  log('✅ 測試數據庫設置完成！', 'green');
  log('\n📊 數據庫信息:');
  log('   名稱: sales_enablement_test', 'blue');
  log('   用戶: postgres', 'blue');
  log('   端口: 5432', 'blue');
  log('\n🚀 現在可以運行測試：npm run test:workflow');
}

// 執行設置
setupTestDatabase().catch((error) => {
  log(`\n❌ 設置過程發生錯誤: ${error.message}`, 'red');
  process.exit(1);
});
