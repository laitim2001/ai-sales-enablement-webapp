#!/usr/bin/env node

/**
 * @fileoverview UAT測試 - JWT認證問題診斷工具
 *
 * 用途：診斷TC-KB-001和TC-PROP-001的401/403權限錯誤
 *
 * 檢查項目：
 * 1. JWT Token存儲狀態 (localStorage, cookies)
 * 2. Token有效性和解碼內容
 * 3. 用戶角色和RBAC權限配置
 * 4. API請求頭設置
 *
 * 使用方法：
 * 1. 瀏覽器Console運行: 複製貼上瀏覽器段代碼
 * 2. Node.js運行: node scripts/diagnose-auth-issues.js [email]
 */

// ============================================================
// 第1部分: 瀏覽器Console診斷代碼
// ============================================================

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  JWT認證問題診斷工具 - 瀏覽器端檢查                          ║
╚══════════════════════════════════════════════════════════════╝

📋 請在瀏覽器開發者工具Console中執行以下代碼：
`);

const browserDiagnosticCode = `
// ============================================================
// JWT認證診斷 - 瀏覽器Console代碼
// ============================================================

(function() {
  console.log('\\n🔍 開始JWT認證診斷...\\n');

  const results = {
    localStorage: {},
    cookies: {},
    tokenParsed: null,
    recommendations: []
  };

  // 1. 檢查localStorage
  console.log('📦 檢查 localStorage:');
  const authToken = localStorage.getItem('auth-token');
  const cachedUser = localStorage.getItem('cached-user');

  results.localStorage = {
    'auth-token': authToken ? '✅ 存在' : '❌ 不存在',
    'cached-user': cachedUser ? '✅ 存在' : '❌ 不存在',
    tokenLength: authToken ? authToken.length : 0
  };

  console.table(results.localStorage);

  if (!authToken) {
    results.recommendations.push('⚠️ 缺少auth-token，請重新登入');
  }

  // 2. 檢查Cookies
  console.log('\\n🍪 檢查 Cookies:');
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  results.cookies = {
    'auth-token': cookies['auth-token'] ? '✅ 存在' : '❌ 不存在',
    allCookies: Object.keys(cookies).join(', ') || '(無cookie)'
  };

  console.table(results.cookies);

  // 3. 解析JWT Token
  if (authToken) {
    console.log('\\n🔐 解析 JWT Token:');
    try {
      // JWT格式: header.payload.signature
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        results.tokenParsed = payload;

        console.log('Token內容:');
        console.log('  - userId:', payload.userId);
        console.log('  - email:', payload.email);
        console.log('  - role:', payload.role);
        console.log('  - 簽發時間 (iat):', payload.iat ? new Date(payload.iat * 1000).toLocaleString('zh-TW') : 'N/A');
        console.log('  - 過期時間 (exp):', payload.exp ? new Date(payload.exp * 1000).toLocaleString('zh-TW') : 'N/A');

        // 檢查Token是否過期
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          const isExpired = now > payload.exp;
          console.log('  - Token狀態:', isExpired ? '❌ 已過期' : '✅ 有效');

          if (isExpired) {
            results.recommendations.push('⚠️ Token已過期，請重新登入');
          } else {
            const hoursLeft = ((payload.exp - now) / 3600).toFixed(1);
            console.log(\`  - 剩餘時間: \${hoursLeft} 小時\`);
          }
        }

        // 檢查角色
        if (!payload.role) {
          results.recommendations.push('⚠️ Token中缺少role字段，可能導致權限錯誤');
        }
      } else {
        console.error('❌ Token格式錯誤：不是標準的JWT格式');
        results.recommendations.push('⚠️ Token格式錯誤，請重新登入');
      }
    } catch (e) {
      console.error('❌ 無法解析Token:', e.message);
      results.recommendations.push('⚠️ Token無法解析，請重新登入');
    }
  }

  // 4. 測試API請求頭
  console.log('\\n📡 檢查 API 請求配置:');
  console.log('當前頁面URL:', window.location.href);
  console.log('API基礎URL: /api');

  // 5. 模擬API請求測試
  console.log('\\n🧪 測試 API 請求 (GET /api/knowledge-base):');

  fetch('/api/knowledge-base?page=1&limit=1', {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${authToken}\`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('  - 狀態碼:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    if (data.error) {
      console.error('  - 錯誤:', data.error);
      console.error('  - 訊息:', data.message);
      console.error('  - 錯誤碼:', data.code);

      if (data.code === 'AUTH_TOKEN_MISSING') {
        results.recommendations.push('⚠️ API未收到Token，檢查請求頭設置');
      } else if (data.code === 'AUTH_TOKEN_INVALID') {
        results.recommendations.push('⚠️ Token無效或已過期，請重新登入');
      } else if (data.code === 'PERMISSION_DENIED') {
        results.recommendations.push(\`⚠️ 權限不足: 角色\${results.tokenParsed?.role}無\${data.details?.actions}權限\`);
      }
    } else {
      console.log('  - ✅ API請求成功');
    }
  })
  .catch(error => {
    console.error('  - ❌ 網路錯誤:', error.message);
    results.recommendations.push('⚠️ 網路錯誤，檢查服務器狀態');
  });

  // 6. 總結建議
  setTimeout(() => {
    console.log('\\n' + '='.repeat(60));
    console.log('📋 診斷建議:');
    if (results.recommendations.length === 0) {
      console.log('✅ 未發現明顯問題');
    } else {
      results.recommendations.forEach((rec, i) => {
        console.log(\`\${i + 1}. \${rec}\`);
      });
    }
    console.log('='.repeat(60));

    // 7. 修復步驟
    console.log('\\n🔧 常見修復步驟:');
    console.log('1. 清除並重新登入:');
    console.log('   localStorage.clear(); window.location.href = "/login";');
    console.log('\\n2. 檢查用戶角色權限（需在服務器端執行SQL）:');
    console.log(\`   SELECT id, email, role FROM "User" WHERE email = '\${results.tokenParsed?.email}';\`);
  }, 2000);

  return results;
})();
`;

console.log('━'.repeat(60));
console.log('🌐 瀏覽器Console診斷代碼:');
console.log('━'.repeat(60));
console.log(browserDiagnosticCode);
console.log('━'.repeat(60));

// ============================================================
// 第2部分: Node.js服務器端診斷
// ============================================================

console.log(`\n
╔══════════════════════════════════════════════════════════════╗
║  JWT認證問題診斷工具 - 服務器端檢查                          ║
╚══════════════════════════════════════════════════════════════╝
`);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseServerSide(userEmail) {
  console.log(`\n🔍 開始服務器端診斷 (用戶: ${userEmail})...\n`);

  try {
    // 1. 檢查用戶是否存在
    console.log('👤 檢查用戶記錄:');
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      console.error(`❌ 用戶不存在: ${userEmail}`);
      return;
    }

    console.log('✅ 用戶存在');
    console.table({
      ID: user.id,
      Email: user.email,
      角色: user.role,
      狀態: user.is_active ? '啟用' : '停用',
      最後登入: user.last_login ? user.last_login.toLocaleString('zh-TW') : '從未登入'
    });

    // 2. 檢查RBAC權限配置
    console.log('\n🛡️ 檢查RBAC權限 (知識庫相關):');

    const rbacPermissions = {
      ADMIN: {
        KNOWLEDGE_BASE: ['LIST', 'CREATE', 'READ', 'UPDATE', 'DELETE']
      },
      SALES_MANAGER: {
        KNOWLEDGE_BASE: ['LIST', 'CREATE', 'READ', 'UPDATE', 'DELETE']
      },
      SALES_REP: {
        KNOWLEDGE_BASE: ['LIST', 'CREATE', 'READ', 'UPDATE']
      },
      ANALYST: {
        KNOWLEDGE_BASE: ['LIST', 'READ']
      },
      VIEWER: {
        KNOWLEDGE_BASE: ['LIST', 'READ']
      }
    };

    const userPermissions = rbacPermissions[user.role];
    if (userPermissions && userPermissions.KNOWLEDGE_BASE) {
      console.log(`角色 ${user.role} 的知識庫權限:`);
      console.log('  - ' + userPermissions.KNOWLEDGE_BASE.join(', '));

      // 檢查是否有CREATE權限
      if (!userPermissions.KNOWLEDGE_BASE.includes('CREATE')) {
        console.warn(`⚠️ 角色 ${user.role} 沒有CREATE權限，無法創建知識庫文檔`);
      }
    } else {
      console.error(`❌ 未找到角色 ${user.role} 的權限配置`);
    }

    // 3. 檢查環境變數
    console.log('\n⚙️ 檢查環境變數:');
    console.table({
      JWT_SECRET: process.env.JWT_SECRET ? '✅ 已設置' : '❌ 未設置',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d (預設)',
      NODE_ENV: process.env.NODE_ENV || 'development'
    });

    if (!process.env.JWT_SECRET) {
      console.error('❌ 缺少JWT_SECRET環境變數，認證將失敗');
    }

    // 4. 測試Token生成
    console.log('\n🔐 測試Token生成:');
    try {
      const { generateToken } = require('../lib/auth-server');
      const testToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      console.log('✅ Token生成成功');
      console.log(`Token長度: ${testToken.length} 字符`);

      // 解析Token
      const parts = testToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('\nToken內容:');
        console.log('  - userId:', payload.userId);
        console.log('  - email:', payload.email);
        console.log('  - role:', payload.role);
        console.log('  - issuer:', payload.iss);
        console.log('  - audience:', payload.aud);
      }
    } catch (e) {
      console.error('❌ Token生成失敗:', e.message);
    }

    // 5. 檢查最近的審計日誌
    console.log('\n📋 檢查最近的權限拒絕審計日誌:');
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: user.id,
        action: 'PERMISSION_DENY'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    });

    if (auditLogs.length === 0) {
      console.log('✅ 沒有權限拒絕記錄');
    } else {
      console.log(`⚠️ 發現 ${auditLogs.length} 條權限拒絕記錄:`);
      auditLogs.forEach((log, i) => {
        console.log(`\n${i + 1}. ${log.timestamp.toLocaleString('zh-TW')}`);
        console.log(`   - 資源: ${log.resource}`);
        console.log(`   - 嚴重性: ${log.severity}`);
        if (log.details && typeof log.details === 'object') {
          console.log(`   - 詳情: ${JSON.stringify(log.details, null, 2)}`);
        }
      });
    }

    // 6. 總結建議
    console.log('\n' + '='.repeat(60));
    console.log('📋 診斷總結:');
    console.log('='.repeat(60));

    const issues = [];

    if (!user.is_active) {
      issues.push('❌ 用戶賬號已停用');
    }

    if (!userPermissions || !userPermissions.KNOWLEDGE_BASE) {
      issues.push(`❌ 角色 ${user.role} 沒有知識庫權限配置`);
    }

    if (!process.env.JWT_SECRET) {
      issues.push('❌ 缺少JWT_SECRET環境變數');
    }

    if (auditLogs.length > 0) {
      issues.push(`⚠️ 存在 ${auditLogs.length} 條權限拒絕記錄`);
    }

    if (issues.length === 0) {
      console.log('✅ 服務器端配置正常，問題可能在前端');
      console.log('\n建議:');
      console.log('1. 在瀏覽器Console執行前端診斷代碼');
      console.log('2. 檢查瀏覽器localStorage中的auth-token');
      console.log('3. 確認登入後Token是否正確存儲');
    } else {
      console.log('⚠️ 發現以下問題:');
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });

      console.log('\n修復建議:');
      if (!user.is_active) {
        console.log(`- 啟用用戶: UPDATE "User" SET is_active = true WHERE id = ${user.id};`);
      }
      if (!process.env.JWT_SECRET) {
        console.log('- 在.env文件中設置JWT_SECRET');
      }
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 診斷過程中發生錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 執行診斷
const userEmail = process.argv[2];

if (userEmail) {
  diagnoseServerSide(userEmail);
} else {
  console.log('💡 使用方法:');
  console.log('  node scripts/diagnose-auth-issues.js <用戶email>');
  console.log('\n例如:');
  console.log('  node scripts/diagnose-auth-issues.js rep@test.com');
  console.log('\n或者在瀏覽器Console中運行上面的診斷代碼');
}
