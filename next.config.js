/**
 * ================================================================
 * 檔案名稱: Next.js 配置檔案
 * 檔案用途: AI銷售賦能平台的Next.js框架核心配置
 * 開發階段: 生產環境
 * ================================================================
 *
 * 功能索引:
 * 1. 實驗性功能配置 - 外部依賴包支持（PostgreSQL、Azure OpenAI）
 * 2. 圖片優化設定 - 本地開發環境圖片域名配置
 * 3. TypeScript編譯 - 嚴格模式，確保類型安全
 * 4. ESLint檢查 - 構建時代碼品質檢查
 *
 * 重要依賴:
 * - pg: PostgreSQL資料庫連接驅動
 * - @azure/openai: Azure OpenAI服務整合
 *
 * 注意事項:
 * - 實驗性功能可能在Next.js更新時需要調整
 * - 生產環境需要設定正確的圖片域名
 * - TypeScript和ESLint錯誤會阻止構建
 *
 * 更新記錄:
 * - Week 1: 初始配置，支援AI功能整合
 * ================================================================
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 實驗性功能：支援伺服器組件使用外部依賴包
  experimental: {
    // 將PostgreSQL和Azure OpenAI標記為外部依賴，避免打包問題
    serverComponentsExternalPackages: ['pg', '@azure/openai']
  },

  // 圖片優化配置
  images: {
    // 允許載入的圖片域名（開發環境）
    domains: ['localhost'],
  },

  // TypeScript配置
  typescript: {
    // 嚴格模式：類型錯誤會阻止構建
    ignoreBuildErrors: false,
  },

  // ESLint配置
  eslint: {
    // 嚴格模式：代碼品質問題會阻止構建
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig