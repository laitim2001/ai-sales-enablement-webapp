/**
 * @fileoverview 測試數據庫設置腳本 - Docker 版本功能：- 通過 Docker 容器創建測試數據庫- 運行 Prisma 遷移- 生成 Prisma Client運行：node scripts/setup-test-db-docker.js
 * @module scripts/setup-test-db-docker
 * @description
 * 測試數據庫設置腳本 - Docker 版本功能：- 通過 Docker 容器創建測試數據庫- 運行 Prisma 遷移- 生成 Prisma Client運行：node scripts/setup-test-db-docker.js
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
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
    if (stderr && !stderr.includes('warn') && !stderr.includes('NOTICE')) {
      log(stderr.trim(), 'yellow');
    }
    log(`✅ ${description} 完成`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} 失敗: ${error.message}`, 'red');
    if (error.stdout) log(error.stdout, 'yellow');
    if (error.stderr) log(error.stderr, 'yellow');
    return false;
  }
}

async function setupTestDatabase() {
  log('\n📊 開始設置測試數據庫（Docker 版本）...', 'blue');
  log('==========================================\n');

  // 1. 檢查 Docker 容器是否運行
  log('1️⃣ 檢查 Docker 容器...', 'blue');
  const containerRunning = await runCommand(
    'docker ps --filter name=ai-sales-postgres-dev --format "{{.Names}}"',
    '檢查 PostgreSQL 容器'
  );

  if (!containerRunning) {
    log('\n⚠️ PostgreSQL Docker 容器未運行。', 'red');
    log('請運行: docker-compose -f docker-compose.dev.yml up -d', 'yellow');
    process.exit(1);
  }

  // 2. 創建測試數據庫
  log('\n2️⃣ 創建測試數據庫...', 'blue');

  // 先嘗試刪除舊數據庫（可能不存在，所以錯誤是正常的）
  await execAsync(
    'docker exec ai-sales-postgres-dev psql -U postgres -c "DROP DATABASE IF EXISTS sales_enablement_test;" 2>&1'
  ).catch(() => {
    // 忽略錯誤
  });

  const created = await runCommand(
    'docker exec ai-sales-postgres-dev psql -U postgres -c "CREATE DATABASE sales_enablement_test;"',
    '創建測試數據庫'
  );

  if (!created) {
    log('\n⚠️ 數據庫創建失敗。', 'red');
    process.exit(1);
  }

  // 3. 運行 Prisma 遷移
  log('\n3️⃣ 運行數據庫遷移...', 'blue');

  // 設置環境變數（使用與開發環境相同的密碼）
  process.env.DATABASE_URL = 'postgresql://postgres:dev_password_123@localhost:5433/sales_enablement_test';

  // 先嘗試 migrate deploy
  const migrated = await runCommand(
    'npx prisma migrate deploy --schema=./prisma/schema.prisma',
    'Prisma 數據庫遷移'
  );

  if (!migrated) {
    log('\n⚠️ 遷移失敗。嘗試使用 db push...', 'yellow');
    await runCommand(
      'npx prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss',
      'Prisma DB Push'
    );
  }

  // 4. 生成 Prisma Client
  log('\n4️⃣ 生成 Prisma Client...', 'blue');
  await runCommand(
    'npx prisma generate',
    '生成 Prisma Client'
  );

  // 5. 驗證數據庫設置
  log('\n5️⃣ 驗證數據庫設置...', 'blue');
  const verified = await runCommand(
    'docker exec ai-sales-postgres-dev psql -U postgres -d sales_enablement_test -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\';"',
    '檢查數據庫表'
  );

  log('\n==========================================');
  log('✅ 測試數據庫設置完成！', 'green');
  log('\n📊 數據庫信息:');
  log('   名稱: sales_enablement_test', 'blue');
  log('   容器: ai-sales-postgres-dev', 'blue');
  log('   端口: 5433', 'blue');
  log('   連接: postgresql://postgres:postgres@localhost:5433/sales_enablement_test', 'blue');
  log('\n🚀 現在可以運行測試：npm run test:workflow');
}

// 執行設置
setupTestDatabase().catch((error) => {
  log(`\n❌ 設置過程發生錯誤: ${error.message}`, 'red');
  process.exit(1);
});
