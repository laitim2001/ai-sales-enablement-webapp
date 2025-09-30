/**
 * ================================================================
 * AI銷售賦能平台 - 路由配置 (lib/middleware/routing-config.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 集中管理所有API路由的配置，包括認證要求、速率限制和CORS策略。
 * 提供類型安全的路由配置定義，確保API網關的正確運作。
 *
 * 【主要職責】
 * • 路由定義 - 定義所有API端點的匹配規則
 * • 認證配置 - 指定每個路由的認證要求和方法
 * • 速率限制 - 配置端點特定的速率限制規則
 * • CORS策略 - 定義跨域訪問規則
 * • 版本控制 - 管理API版本路由
 *
 * 【技術實現】
 * • Type-Safe Config - TypeScript類型保護
 * • Priority Routing - 優先級排序確保正確匹配
 * • Flexible Patterns - 支援字符串、正則和通配符
 * • Environment Aware - 根據環境調整配置
 * • Maintainable - 集中管理便於維護
 *
 * 【使用場景】
 * • API Gateway - 路由請求分發
 * • 認證檢查 - 決定認證策略
 * • 速率限制 - 應用端點限制
 * • CORS處理 - 跨域策略應用
 * • 版本管理 - API版本路由
 *
 * 【相關檔案】
 * • middleware.ts - 使用此配置進行路由匹配
 * • lib/middleware/route-matcher.ts - 路由匹配邏輯
 * • docs/api-gateway-architecture.md - 架構設計文檔
 */

import { RouteConfig } from './route-matcher'

/**
 * API路由配置
 *
 * 定義所有API端點的完整配置。
 * 按優先級排序：精確匹配 > 正則表達式 > 通配符
 */
export const routeConfigs: RouteConfig[] = [
  // ================================================================
  // 公開端點 (無認證要求)
  // ================================================================

  /**
   * 健康檢查端點
   * 用於負載均衡器和監控系統
   */
  {
    name: 'health-check',
    pattern: /^\/api\/health$/,
    priority: 100,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 60000, // 1分鐘
      maxRequests: 100
    }
  },

  /**
   * API版本信息
   */
  {
    name: 'version-info',
    pattern: /^\/api\/version$/,
    priority: 100,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60
    }
  },

  // ================================================================
  // 認證相關端點 (特殊處理)
  // ================================================================

  /**
   * 用戶登入
   * 嚴格速率限制防止暴力破解
   */
  {
    name: 'auth-login',
    pattern: /^\/api\/auth\/login$/,
    priority: 90,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 900000, // 15分鐘
      maxRequests: 5
    }
  },

  /**
   * 用戶註冊
   */
  {
    name: 'auth-register',
    pattern: /^\/api\/auth\/register$/,
    priority: 90,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 900000, // 15分鐘
      maxRequests: 3
    }
  },

  /**
   * Token刷新
   */
  {
    name: 'auth-refresh',
    pattern: /^\/api\/auth\/refresh$/,
    priority: 90,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 60000, // 1分鐘
      maxRequests: 10
    }
  },

  /**
   * 用戶登出
   */
  {
    name: 'auth-logout',
    pattern: /^\/api\/auth\/logout$/,
    priority: 90,
    auth: { required: true, methods: ['jwt'] },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 10
    }
  },

  // ================================================================
  // Azure AD SSO端點
  // ================================================================

  /**
   * Azure AD登入
   */
  {
    name: 'azure-ad-login',
    pattern: /^\/api\/auth\/azure-ad\/login$/,
    priority: 85,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 300000, // 5分鐘
      maxRequests: 10
    }
  },

  /**
   * Azure AD回調
   */
  {
    name: 'azure-ad-callback',
    pattern: /^\/api\/auth\/azure-ad\/callback$/,
    priority: 85,
    auth: { required: false, methods: [] },
    rateLimit: {
      windowMs: 300000,
      maxRequests: 10
    }
  },

  /**
   * Azure AD登出
   */
  {
    name: 'azure-ad-logout',
    pattern: /^\/api\/auth\/azure-ad\/logout$/,
    priority: 85,
    auth: { required: true, methods: ['jwt', 'azureAD'] },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 10
    }
  },

  // ================================================================
  // 管理員API (需要ADMIN角色)
  // ================================================================

  /**
   * 用戶管理API
   */
  {
    name: 'admin-users',
    pattern: /^\/api\/admin\/users/,
    priority: 80,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD'],
      roles: ['ADMIN']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    }
  },

  /**
   * 系統配置API
   */
  {
    name: 'admin-config',
    pattern: /^\/api\/admin\/config/,
    priority: 80,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD'],
      roles: ['ADMIN']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60
    }
  },

  /**
   * API Key管理
   */
  {
    name: 'admin-api-keys',
    pattern: /^\/api\/admin\/api-keys/,
    priority: 80,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD'],
      roles: ['ADMIN']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 30
    }
  },

  // ================================================================
  // v2 API端點 (新版本，增強功能)
  // ================================================================

  /**
   * v2 AI分析API (增強版)
   */
  {
    name: 'v2-ai-analysis',
    pattern: /^\/api\/v2\/ai\/analysis/,
    version: 'v2',
    priority: 70,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD', 'apiKey']
    },
    rateLimit: {
      windowMs: 60000, // 1分鐘
      maxRequests: 20 // v2限制更寬鬆
    }
  },

  /**
   * v2 客戶分析API
   */
  {
    name: 'v2-customers',
    pattern: /^\/api\/v2\/customers/,
    version: 'v2',
    priority: 70,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD', 'apiKey'],
      roles: ['ADMIN', 'SALES_MANAGER', 'SALES_REP']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 150
    }
  },

  // ================================================================
  // v1 API端點 (舊版本，向後兼容)
  // ================================================================

  /**
   * v1 AI分析API
   */
  {
    name: 'v1-ai-analysis',
    pattern: /^\/api\/v1\/ai\/analysis/,
    version: 'v1',
    priority: 60,
    auth: {
      required: true,
      methods: ['jwt']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 10 // v1限制較嚴格
    }
  },

  /**
   * v1 客戶API
   */
  {
    name: 'v1-customers',
    pattern: /^\/api\/v1\/customers/,
    version: 'v1',
    priority: 60,
    auth: {
      required: true,
      methods: ['jwt'],
      roles: ['ADMIN', 'SALES_MANAGER', 'SALES_REP']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    }
  },

  // ================================================================
  // 通用API端點 (無版本標識，當前版本)
  // ================================================================

  /**
   * AI聊天API
   */
  {
    name: 'ai-chat',
    pattern: /^\/api\/ai\/chat/,
    priority: 50,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 30
    }
  },

  /**
   * AI摘要生成
   */
  {
    name: 'ai-summary',
    pattern: /^\/api\/ai\/summary/,
    priority: 50,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 20
    }
  },

  /**
   * 客戶管理API
   */
  {
    name: 'customers',
    pattern: /^\/api\/customers/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD'],
      roles: ['ADMIN', 'SALES_MANAGER', 'SALES_REP']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    }
  },

  /**
   * 銷售機會API
   */
  {
    name: 'opportunities',
    pattern: /^\/api\/opportunities/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD'],
      roles: ['ADMIN', 'SALES_MANAGER', 'SALES_REP']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    }
  },

  /**
   * 產品目錄API
   */
  {
    name: 'products',
    pattern: /^\/api\/products/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 150
    }
  },

  /**
   * 知識庫API
   */
  {
    name: 'knowledge',
    pattern: /^\/api\/knowledge/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 80
    }
  },

  /**
   * 搜索API
   */
  {
    name: 'search',
    pattern: /^\/api\/search/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60
    }
  },

  /**
   * 文件上傳API
   */
  {
    name: 'upload',
    pattern: /^\/api\/upload/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 10
    }
  },

  /**
   * 用戶配置API
   */
  {
    name: 'user-profile',
    pattern: /^\/api\/user\/profile/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60
    }
  },

  /**
   * 儀表板數據API
   */
  {
    name: 'dashboard',
    pattern: /^\/api\/dashboard/,
    priority: 40,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    }
  },

  // ================================================================
  // 回退路由 (最低優先級)
  // ================================================================

  /**
   * 所有其他API端點 (需要認證)
   */
  {
    name: 'api-default',
    pattern: /^\/api\//,
    priority: 0,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD', 'apiKey']
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60
    }
  }
]

/**
 * 獲取環境特定的路由配置
 *
 * @returns 根據當前環境調整的路由配置
 */
export function getRouteConfigs(): RouteConfig[] {
  const env = process.env.NODE_ENV || 'development'

  if (env === 'development') {
    // 開發環境：放寬速率限制，啟用更多調試功能
    return routeConfigs.map((config) => ({
      ...config,
      rateLimit: config.rateLimit
        ? {
            ...config.rateLimit,
            maxRequests: config.rateLimit.maxRequests * 10 // 10倍限制
          }
        : undefined
    }))
  }

  return routeConfigs
}

/**
 * 根據路由名稱查找配置
 *
 * @param name 路由名稱
 * @returns 路由配置或undefined
 */
export function getRouteByName(name: string): RouteConfig | undefined {
  return routeConfigs.find((config) => config.name === name)
}

/**
 * 獲取所有需要特定角色的路由
 *
 * @param role 角色名稱
 * @returns 需要該角色的路由配置列表
 */
export function getRoutesByRole(role: string): RouteConfig[] {
  return routeConfigs.filter((config) => config.auth.roles?.includes(role))
}

/**
 * 獲取所有公開路由 (無認證要求)
 *
 * @returns 公開路由配置列表
 */
export function getPublicRoutes(): RouteConfig[] {
  return routeConfigs.filter((config) => !config.auth.required)
}

/**
 * 獲取指定版本的所有路由
 *
 * @param version API版本
 * @returns 該版本的路由配置列表
 */
export function getRoutesByVersion(version: 'v1' | 'v2'): RouteConfig[] {
  return routeConfigs.filter((config) => config.version === version)
}