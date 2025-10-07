/**
 * @fileoverview @type {import('next').NextConfig}
 * @module next.config.optimized
 * @description
 * @type {import('next').NextConfig}
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg', '@azure/openai'],
    // 啟用 App Router 優化
    appDir: true,
    // 優化編譯
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'date-fns', 'lucide-react']
  },

  // 圖片優化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // TypeScript 和 ESLint 配置
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 壓縮設置
  compress: true,
  poweredByHeader: false,

  // Webpack 優化
  webpack: (config, { dev, isServer, webpack, buildId }) => {
    // Bundle 分析
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html'
        })
      )
    }

    // 生產環境優化
    if (!dev && !isServer) {
      // 代碼分割優化
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // 將大型第三方庫分離
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20,
            },
            // UI 組件庫
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|@heroicons)[\\/]/,
              priority: 15,
            },
            // 工具庫
            utils: {
              name: 'utils',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](date-fns|clsx|tailwind-merge|class-variance-authority)[\\/]/,
              priority: 10,
            },
            // 其他 vendor
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 5,
              minChunks: 2,
            },
          },
        },
      }

      // Tree shaking 優化
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    // 客戶端 fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // 性能優化插件
    config.plugins.push(
      new webpack.DefinePlugin({
        __BUILD_ID__: JSON.stringify(buildId),
        __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      })
    )

    return config
  },

  // HTTP Headers 優化
  async headers() {
    return [
      // API 緩存策略
      {
        source: '/api/knowledge-base',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600'
          },
          {
            key: 'Vary',
            value: 'Authorization'
          }
        ]
      },
      // 靜態資源長期緩存
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // 圖片緩存
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000' // 30 days
          }
        ]
      },
      // 安全 headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // 重定向優化
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      }
    ]
  },

  // 輸出設置（用於 Docker 部署）
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

  // 環境變量配置
  env: {
    BUILD_TIME: new Date().toISOString(),
  },

  // 開發服務器優化
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
}

module.exports = nextConfig