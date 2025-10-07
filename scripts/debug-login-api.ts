/**
 * @fileoverview 調試登入 API 腳本
 * @module scripts/debug-login-api
 * @description
 * 調試登入 API 腳本
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

async function testLoginAPI() {
  try {
    console.log('🔍 測試登入 API...\n');

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123456',
      }),
    });

    console.log('📊 響應狀態:', response.status);
    console.log('📋 響應頭:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\n📦 響應數據:');
    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      console.log('\n❌ 錯誤詳情:');
      console.log('  類型:', data.error.type);
      console.log('  訊息:', data.error.message);
      console.log('  狀態碼:', data.error.statusCode);
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

testLoginAPI();
