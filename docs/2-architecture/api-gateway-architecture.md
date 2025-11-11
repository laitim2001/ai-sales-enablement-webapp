# API 網關架構設計文檔

> **版本**: 1.0
> **創建日期**: 2025-09-30
> **作者**: AI 開發團隊
> **狀態**: ✅ 設計完成，準備實施
> **基於**: 選項C - Next.js Middleware + 自定義方案
> **實施階段**: MVP Phase 2, Sprint 1 Week 1

---

## 📋 目錄

1. [架構概述](#1-架構概述)
2. [API網關拓撲結構](#2-api網關拓撲結構)
3. [路由規則和轉發策略](#3-路由規則和轉發策略)
4. [速率限制策略](#4-速率限制策略)
5. [API版本控制機制](#5-api版本控制機制)
6. [安全防護層](#6-安全防護層)
7. [監控和日誌系統](#7-監控和日誌系統)
8. [實施計劃](#8-實施計劃)

---

## 1. 架構概述

### 1.1 設計原則

本API網關架構基於**Next.js 14 Middleware**實現，遵循以下核心原則：

1. **零額外延遲** - 與Next.js應用同一進程，無額外網絡跳轉
2. **類型安全** - TypeScript全棧，端到端類型檢查
3. **漸進增強** - 從基礎功能開始，逐步添加企業級特性
4. **可觀測性** - 完整的日誌、監控和追蹤能力
5. **水平擴展** - 支援Redis共享狀態的無狀態設計

### 1.2 核心職責

API網關負責以下核心功能：

```typescript
/**
 * API網關核心職責
 */
interface APIGatewayResponsibilities {
  // 1. 認證與授權
  authentication: {
    jwt: 'JWT token驗證和刷新',
    azureAD: 'Azure AD SSO整合',
    apiKey: 'API Key驗證',
    oauth: 'OAuth 2.0 Client Credentials'
  },

  // 2. 速率限制與防濫用
  rateLimiting: {
    ipBased: 'IP級別速率限制',
    userBased: '用戶級別配額管理',
    endpointBased: '端點級別限流'
  },

  // 3. 路由與版本控制
  routing: {
    versionControl: 'API版本路由 (v1, v2)',
    pathRewriting: '路徑重寫和轉發',
    loadBalancing: '負載均衡（未來）'
  },

  // 4. 安全防護
  security: {
    cors: 'CORS策略管理',
    csrf: 'CSRF token驗證',
    xss: 'XSS防護頭部',
    inputValidation: '輸入驗證和清理'
  },

  // 5. 可觀測性
  observability: {
    requestLogging: '結構化請求日誌',
    responseLogging: '響應日誌和錯誤追蹤',
    tracing: '分布式追蹤（OpenTelemetry）',
    metrics: '性能指標收集'
  }
}
```

### 1.3 技術架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                         客戶端請求                            │
│                  (Browser, Mobile App, API Client)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Edge Middleware                   │
│                    (全局請求攔截層)                           │
├─────────────────────────────────────────────────────────────┤
│  1️⃣ Request ID 生成  │  2️⃣ CORS 檢查  │  3️⃣ 安全頭部     │
│  4️⃣ 速率限制檢查    │  5️⃣ 認證驗證   │  6️⃣ 路由匹配     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ /api/v1/*    │ │ /api/v2/*    │ │ /api/auth/*  │
│ (現有API)    │ │ (新版API)    │ │ (認證端點)    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
         ┌──────────────────────────┐
         │  Next.js API Routes      │
         │  (業務邏輯處理)           │
         └──────────────┬───────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │PostgreSQL│  │  Redis   │  │ Azure AI │
   │   +      │  │  Cache   │  │ Services │
   │ pgvector │  │          │  │          │
   └──────────┘  └──────────┘  └──────────┘
```

---

## 2. API網關拓撲結構

### 2.1 分層架構

```typescript
/**
 * API網關分層架構
 */
interface GatewayLayers {
  // Layer 1: 邊緣層 (Edge Layer)
  edge: {
    location: 'Next.js Middleware',
    runtime: 'Edge Runtime / Node.js Runtime',
    responsibilities: [
      '全局請求攔截',
      'CORS預檢處理',
      '基本安全檢查',
      '請求ID生成'
    ]
  },

  // Layer 2: 認證授權層 (Auth Layer)
  authentication: {
    location: 'lib/middleware/auth.ts',
    responsibilities: [
      'JWT token驗證',
      'Azure AD token驗證',
      'API Key驗證',
      'Session管理'
    ]
  },

  // Layer 3: 速率限制層 (Rate Limit Layer)
  rateLimit: {
    location: 'lib/middleware/rate-limiter.ts',
    storage: 'Redis (共享) + Memory (本地)',
    strategies: [
      'IP級別限流',
      '用戶級別配額',
      '端點級別限流'
    ]
  },

  // Layer 4: 路由層 (Routing Layer)
  routing: {
    location: 'middleware.ts + app/api/**',
    responsibilities: [
      'API版本路由',
      '路徑重寫',
      '端點匹配'
    ]
  },

  // Layer 5: 業務邏輯層 (Business Logic Layer)
  businessLogic: {
    location: 'app/api/**/*.ts',
    responsibilities: [
      '業務邏輯處理',
      '數據驗證',
      '服務調用'
    ]
  }
}
```

### 2.2 數據流向

```
請求進入
    │
    ▼
[Edge Middleware] ──┐
    │               │ (通過)
    ▼               │
[Auth Middleware] ──┤
    │               │ (通過)
    ▼               │
[Rate Limiter] ─────┤
    │               │ (通過)
    ▼               │
[Router] ───────────┤
    │               │ (匹配)
    ▼               │
[API Route] ────────┤
    │               │ (處理)
    ▼               │
[Response] ─────────┘
    │
    ▼
日誌記錄 & 指標收集
```

### 2.3 容錯和降級策略

```typescript
/**
 * 容錯策略配置
 */
interface FaultToleranceStrategy {
  // Redis不可用時的降級
  redisFallback: {
    strategy: 'Local Memory Cache',
    limitation: '僅單實例速率限制',
    recovery: '自動重連機制'
  },

  // 認證服務降級
  authFallback: {
    strategy: 'JWT驗證優先，Azure AD可選',
    gracefulDegradation: true
  },

  // 日誌服務容錯
  loggingFallback: {
    strategy: 'Local file system + Queue',
    bufferSize: 10000,
    flushInterval: '30s'
  }
}
```

---

## 3. 路由規則和轉發策略

### 3.1 路由配置結構

```typescript
/**
 * 路由配置定義
 * 文件位置: lib/middleware/routing-config.ts
 */
export interface RouteConfig {
  // 路由匹配規則
  pattern: string | RegExp;

  // 版本信息
  version?: 'v1' | 'v2';

  // 認證要求
  auth: {
    required: boolean;
    methods: ('jwt' | 'apiKey' | 'azureAD')[];
    roles?: string[];
  };

  // 速率限制
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
  };

  // CORS配置
  cors?: {
    origins: string[];
    methods: string[];
    credentials: boolean;
  };

  // 轉發目標
  target?: {
    rewrite?: string;
    proxy?: string;
  };
}

/**
 * 路由配置實例
 */
export const routeConfigs: RouteConfig[] = [
  // 公開端點 (無認證)
  {
    pattern: /^\/api\/health$/,
    auth: { required: false, methods: [] },
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  },

  // 認證端點 (特殊處理)
  {
    pattern: /^\/api\/auth\/(login|register|refresh)$/,
    auth: { required: false, methods: [] },
    rateLimit: { windowMs: 60000, maxRequests: 10 }
  },

  // Azure AD SSO端點
  {
    pattern: /^\/api\/auth\/azure-ad\//,
    auth: { required: false, methods: [] },
    rateLimit: { windowMs: 60000, maxRequests: 5 }
  },

  // v1 API端點 (JWT認證)
  {
    pattern: /^\/api\/v1\//,
    version: 'v1',
    auth: { required: true, methods: ['jwt'] },
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  },

  // v2 API端點 (JWT + Azure AD)
  {
    pattern: /^\/api\/v2\//,
    version: 'v2',
    auth: { required: true, methods: ['jwt', 'azureAD'] },
    rateLimit: { windowMs: 60000, maxRequests: 150 }
  },

  // 管理員API (角色限制)
  {
    pattern: /^\/api\/admin\//,
    auth: {
      required: true,
      methods: ['jwt', 'azureAD'],
      roles: ['admin']
    },
    rateLimit: { windowMs: 60000, maxRequests: 200 }
  },

  // Webhook端點 (API Key認證)
  {
    pattern: /^\/api\/webhooks\//,
    auth: { required: true, methods: ['apiKey'] },
    rateLimit: { windowMs: 60000, maxRequests: 1000 }
  }
];
```

### 3.2 路由匹配算法

```typescript
/**
 * 路由匹配器
 * 文件位置: lib/middleware/route-matcher.ts
 */
export class RouteMatcher {
  constructor(private configs: RouteConfig[]) {}

  /**
   * 匹配請求路徑
   */
  match(pathname: string): RouteConfig | null {
    for (const config of this.configs) {
      if (this.isMatch(pathname, config.pattern)) {
        return config;
      }
    }
    return null;
  }

  /**
   * 檢查路徑是否匹配
   */
  private isMatch(pathname: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return pathname === pattern;
    }
    return pattern.test(pathname);
  }

  /**
   * 獲取API版本
   */
  getVersion(pathname: string): 'v1' | 'v2' | null {
    const versionMatch = pathname.match(/^\/api\/(v\d+)\//);
    return versionMatch ? versionMatch[1] as 'v1' | 'v2' : null;
  }
}
```

### 3.3 路徑重寫規則

```typescript
/**
 * 路徑重寫配置
 */
export const rewriteRules: Record<string, string> = {
  // 舊版API重定向到v1
  '/api/knowledge-base': '/api/v1/knowledge-base',
  '/api/customers': '/api/v1/customers',
  '/api/proposals': '/api/v1/proposals',

  // 簡化路徑
  '/api/kb': '/api/v1/knowledge-base',
  '/api/crm': '/api/v1/customers'
};

/**
 * 路徑重寫函數
 */
export function rewritePath(pathname: string): string {
  // 檢查直接映射
  if (rewriteRules[pathname]) {
    return rewriteRules[pathname];
  }

  // 檢查前綴匹配
  for (const [pattern, target] of Object.entries(rewriteRules)) {
    if (pathname.startsWith(pattern)) {
      return pathname.replace(pattern, target);
    }
  }

  return pathname;
}
```

---

## 4. 速率限制策略

### 4.1 多層速率限制架構

```typescript
/**
 * 速率限制配置
 * 文件位置: lib/middleware/rate-limit-config.ts
 */
export interface RateLimitConfig {
  // Layer 1: 全局IP限制（防DDoS）
  global: {
    windowMs: 60000;        // 1分鐘
    maxRequests: 1000;      // 每IP最多1000請求
    blockDuration: 300000;  // 封禁5分鐘
  };

  // Layer 2: 用戶級別限制
  user: {
    free: {
      windowMs: 3600000;    // 1小時
      maxRequests: 100;     // 100請求/小時
    },
    basic: {
      windowMs: 3600000;
      maxRequests: 1000;    // 1000請求/小時
    },
    premium: {
      windowMs: 3600000;
      maxRequests: 10000;   // 10000請求/小時
    },
    enterprise: {
      windowMs: 3600000;
      maxRequests: 100000;  // 無限制（實際100k）
    }
  };

  // Layer 3: 端點級別限制
  endpoints: {
    // AI生成端點（成本高）
    '/api/v*/ai/generate-proposal': {
      windowMs: 3600000;
      maxRequests: 10;      // 10次/小時
    },

    // 搜索端點（資源密集）
    '/api/v*/knowledge-base/search': {
      windowMs: 60000;
      maxRequests: 60;      // 60次/分鐘
    },

    // 文件上傳（帶寬限制）
    '/api/v*/knowledge-base/upload': {
      windowMs: 3600000;
      maxRequests: 50;      // 50次/小時
    },

    // 認證端點（防暴力破解）
    '/api/auth/login': {
      windowMs: 300000;     // 5分鐘
      maxRequests: 5;       // 5次/5分鐘
    }
  };
}
```

### 4.2 速率限制實現策略

```typescript
/**
 * 速率限制器實現
 * 文件位置: lib/middleware/rate-limiter.ts
 */
export class RateLimiter {
  private redis: Redis;
  private memoryCache: Map<string, RateLimitEntry>;

  constructor(redis: Redis) {
    this.redis = redis;
    this.memoryCache = new Map();
  }

  /**
   * 檢查速率限制
   */
  async checkLimit(
    key: string,
    config: { windowMs: number; maxRequests: number }
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // 優先使用Redis（跨實例共享）
      return await this.checkRedis(key, windowStart, config);
    } catch (error) {
      // Redis不可用，降級到記憶體緩存
      console.warn('Redis unavailable, using memory cache:', error);
      return this.checkMemory(key, windowStart, config);
    }
  }

  /**
   * Redis實現（生產環境）
   */
  private async checkRedis(
    key: string,
    windowStart: number,
    config: { maxRequests: number }
  ): Promise<RateLimitResult> {
    const redisKey = `ratelimit:${key}`;

    // 使用Redis Sorted Set實現滑動窗口
    const multi = this.redis.multi();

    // 1. 移除過期的請求記錄
    multi.zremrangebyscore(redisKey, 0, windowStart);

    // 2. 獲取當前窗口內的請求數
    multi.zcard(redisKey);

    // 3. 添加當前請求時間戳
    multi.zadd(redisKey, Date.now(), `${Date.now()}-${Math.random()}`);

    // 4. 設置過期時間
    multi.expire(redisKey, Math.ceil(config.windowMs / 1000));

    const results = await multi.exec();
    const currentRequests = results[1][1] as number;

    return {
      allowed: currentRequests < config.maxRequests,
      current: currentRequests + 1,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentRequests - 1),
      resetAt: Date.now() + config.windowMs
    };
  }

  /**
   * 記憶體緩存實現（降級方案）
   */
  private checkMemory(
    key: string,
    windowStart: number,
    config: { maxRequests: number; windowMs: number }
  ): RateLimitResult {
    let entry = this.memoryCache.get(key);

    if (!entry) {
      entry = { requests: [], resetAt: Date.now() + config.windowMs };
      this.memoryCache.set(key, entry);
    }

    // 移除過期請求
    entry.requests = entry.requests.filter(time => time > windowStart);

    // 檢查限制
    const allowed = entry.requests.length < config.maxRequests;

    if (allowed) {
      entry.requests.push(Date.now());
    }

    return {
      allowed,
      current: entry.requests.length,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.requests.length),
      resetAt: entry.resetAt
    };
  }

  /**
   * 生成速率限制鍵
   */
  generateKey(req: Request, type: 'ip' | 'user' | 'endpoint'): string {
    const ip = this.getClientIP(req);
    const userId = req.headers.get('x-user-id');
    const pathname = new URL(req.url).pathname;

    switch (type) {
      case 'ip':
        return `ip:${ip}`;
      case 'user':
        return userId ? `user:${userId}` : `ip:${ip}`;
      case 'endpoint':
        return `endpoint:${pathname}:${userId || ip}`;
      default:
        return `default:${ip}`;
    }
  }
}
```

### 4.3 響應頭標準

```typescript
/**
 * 速率限制響應頭
 * 符合RFC 6585和IETF草案標準
 */
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;      // 時間窗口內的最大請求數
  'X-RateLimit-Remaining': string;  // 剩餘可用請求數
  'X-RateLimit-Reset': string;      // 限制重置的Unix時間戳
  'Retry-After'?: string;           // 被限制時，建議重試的秒數
}

/**
 * 設置速率限制響應頭
 */
export function setRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    response.headers.set('Retry-After', retryAfter.toString());
  }
}
```

---

## 5. API版本控制機制

### 5.1 版本控制策略

```typescript
/**
 * API版本控制策略
 */
export enum VersionStrategy {
  // URL路徑版本 (推薦)
  URL_PATH = 'url_path',        // /api/v1/resource, /api/v2/resource

  // HTTP頭部版本 (備選)
  HEADER = 'header',            // Accept: application/vnd.api.v2+json

  // 查詢參數版本 (不推薦)
  QUERY_PARAM = 'query_param'   // /api/resource?version=2
}

/**
 * 當前使用策略：URL_PATH
 * 理由：
 * 1. 最直觀和明確
 * 2. 易於緩存和路由
 * 3. 符合REST最佳實踐
 * 4. API文檔清晰
 */
export const CURRENT_STRATEGY = VersionStrategy.URL_PATH;
```

### 5.2 版本目錄結構

```
app/api/
├── v1/                          # API v1 (MVP Phase 1)
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── register/route.ts
│   │   └── logout/route.ts
│   ├── knowledge-base/
│   │   ├── route.ts             # GET (列表), POST (創建)
│   │   ├── [id]/route.ts        # GET, PUT, DELETE
│   │   ├── search/route.ts
│   │   └── upload/route.ts
│   ├── customers/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── proposals/
│       ├── route.ts
│       └── [id]/route.ts
│
├── v2/                          # API v2 (MVP Phase 2新增)
│   ├── auth/
│   │   ├── refresh/route.ts     # 新增：Token刷新
│   │   └── azure-ad/
│   │       ├── login/route.ts
│   │       └── callback/route.ts
│   ├── knowledge-base/
│   │   ├── route.ts             # 增強：支援批量操作
│   │   ├── [id]/route.ts
│   │   ├── search/route.ts      # 增強：支援更多過濾器
│   │   ├── suggestions/route.ts # 新增：智能建議
│   │   └── analytics/route.ts   # 新增：使用分析
│   └── monitoring/
│       └── init/route.ts        # 新增：監控管理
│
└── auth/                        # 向後兼容（無版本前綴）
    ├── login/route.ts           # 重定向到 v1
    ├── register/route.ts        # 重定向到 v1
    └── logout/route.ts          # 重定向到 v1
```

### 5.3 版本路由實現

```typescript
/**
 * API版本路由器
 * 文件位置: lib/middleware/version-router.ts
 */
export class VersionRouter {
  /**
   * 提取API版本
   */
  static extractVersion(pathname: string): 'v1' | 'v2' | null {
    const match = pathname.match(/^\/api\/(v\d+)\//);
    return match ? match[1] as 'v1' | 'v2' : null;
  }

  /**
   * 版本驗證
   */
  static validateVersion(version: string | null): boolean {
    return version === 'v1' || version === 'v2';
  }

  /**
   * 處理無版本請求（向後兼容）
   */
  static handleLegacyRequest(pathname: string): string {
    // 無版本前綴的請求重定向到v1
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v')) {
      return pathname.replace('/api/', '/api/v1/');
    }
    return pathname;
  }

  /**
   * 獲取版本特性標誌
   */
  static getVersionFeatures(version: 'v1' | 'v2'): VersionFeatures {
    const features: Record<string, VersionFeatures> = {
      v1: {
        authentication: ['jwt'],
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        features: ['basic-search', 'basic-crud'],
        deprecated: false
      },
      v2: {
        authentication: ['jwt', 'azureAD', 'apiKey'],
        rateLimit: { windowMs: 60000, maxRequests: 150 },
        features: [
          'advanced-search',
          'batch-operations',
          'analytics',
          'suggestions',
          'token-refresh'
        ],
        deprecated: false
      }
    };

    return features[version];
  }
}
```

### 5.4 版本棄用策略

```typescript
/**
 * API版本生命周期管理
 */
export interface VersionLifecycle {
  version: string;
  status: 'active' | 'deprecated' | 'sunset';
  releaseDate: string;
  deprecationDate?: string;
  sunsetDate?: string;
  migrationGuide?: string;
}

/**
 * 版本生命周期配置
 */
export const versionLifecycles: VersionLifecycle[] = [
  {
    version: 'v1',
    status: 'active',
    releaseDate: '2025-09-01',
    deprecationDate: '2026-06-01',  // 發布後9個月開始棄用
    sunsetDate: '2026-12-01',       // 發布後15個月完全停用
    migrationGuide: '/docs/migration-v1-to-v2.md'
  },
  {
    version: 'v2',
    status: 'active',
    releaseDate: '2025-10-01'
  }
];

/**
 * 棄用警告頭部
 */
export function setDeprecationHeaders(
  response: Response,
  version: string
): void {
  const lifecycle = versionLifecycles.find(v => v.version === version);

  if (lifecycle?.status === 'deprecated') {
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', lifecycle.sunsetDate || '');
    response.headers.set('Link', `<${lifecycle.migrationGuide}>; rel="deprecation"`);
  }
}
```

---

## 6. 安全防護層

### 6.1 CORS配置

```typescript
/**
 * CORS配置
 * 文件位置: lib/middleware/cors-config.ts
 */
export interface CORSConfig {
  // 允許的來源
  allowedOrigins: string[];

  // 允許的HTTP方法
  allowedMethods: string[];

  // 允許的請求頭
  allowedHeaders: string[];

  // 暴露的響應頭
  exposedHeaders: string[];

  // 是否允許憑證
  credentials: boolean;

  // 預檢請求緩存時間（秒）
  maxAge: number;
}

/**
 * 環境配置
 */
export const corsConfigs: Record<string, CORSConfig> = {
  development: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-ID'
    ],
    credentials: true,
    maxAge: 86400 // 24小時
  },

  production: {
    allowedOrigins: [
      'https://yourdomain.com',
      'https://app.yourdomain.com',
      'https://admin.yourdomain.com'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    credentials: true,
    maxAge: 86400
  }
};

/**
 * CORS中間件
 */
export function applyCORS(request: Request, response: Response): Response {
  const config = corsConfigs[process.env.NODE_ENV || 'development'];
  const origin = request.headers.get('origin');

  // 檢查來源是否允許
  if (origin && config.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // 設置允許的方法
  response.headers.set(
    'Access-Control-Allow-Methods',
    config.allowedMethods.join(', ')
  );

  // 設置允許的頭部
  response.headers.set(
    'Access-Control-Allow-Headers',
    config.allowedHeaders.join(', ')
  );

  // 設置暴露的頭部
  response.headers.set(
    'Access-Control-Expose-Headers',
    config.exposedHeaders.join(', ')
  );

  // 是否允許憑證
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // 預檢請求緩存時間
  response.headers.set('Access-Control-Max-Age', config.maxAge.toString());

  return response;
}
```

### 6.2 安全頭部

```typescript
/**
 * 安全響應頭配置
 * 文件位置: lib/middleware/security-headers.ts
 */
export interface SecurityHeaders {
  // Content Security Policy
  'Content-Security-Policy': string;

  // XSS保護
  'X-Content-Type-Options': 'nosniff';
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN';
  'X-XSS-Protection': '1; mode=block';

  // HTTPS強制
  'Strict-Transport-Security': string;

  // Referrer Policy
  'Referrer-Policy': string;

  // Permissions Policy
  'Permissions-Policy': string;
}

/**
 * 默認安全頭部
 */
export const defaultSecurityHeaders: SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://*.azure.com",
    "frame-ancestors 'none'"
  ].join('; '),

  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',

  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  'Referrer-Policy': 'strict-origin-when-cross-origin',

  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()'
  ].join(', ')
};

/**
 * 應用安全頭部
 */
export function applySecurityHeaders(response: Response): Response {
  Object.entries(defaultSecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
```

### 6.3 輸入驗證

```typescript
/**
 * 輸入驗證中間件
 * 文件位置: lib/middleware/input-validator.ts
 */
export class InputValidator {
  /**
   * SQL注入防護
   */
  static validateSQL(input: string): boolean {
    const sqlInjectionPattern = /((\%27)|(\')|(\-\-)|(\%23)|(#))/gi;
    return !sqlInjectionPattern.test(input);
  }

  /**
   * XSS防護
   */
  static sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 命令注入防護
   */
  static validateCommand(input: string): boolean {
    const cmdInjectionPattern = /[;&|`$(){}[\]<>]/g;
    return !cmdInjectionPattern.test(input);
  }

  /**
   * Path Traversal防護
   */
  static validatePath(path: string): boolean {
    const pathTraversalPattern = /(\.\.(\/|\\))+/g;
    return !pathTraversalPattern.test(path);
  }

  /**
   * 驗證請求體大小
   */
  static validateBodySize(req: Request, maxSize: number = 10 * 1024 * 1024): boolean {
    const contentLength = req.headers.get('content-length');
    if (!contentLength) return true;

    return parseInt(contentLength) <= maxSize;
  }
}
```

---

## 7. 監控和日誌系統

### 7.1 結構化日誌格式

```typescript
/**
 * 結構化日誌格式
 * 文件位置: lib/logging/structured-logger.ts
 */
export interface StructuredLog {
  // 基本信息
  timestamp: string;              // ISO 8601格式
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  requestId: string;              // 請求追蹤ID

  // 請求信息
  request: {
    method: string;
    path: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    ip: string;
    userAgent?: string;
  };

  // 響應信息
  response?: {
    status: number;
    duration: number;             // 毫秒
    size?: number;                // 字節
  };

  // 用戶信息
  user?: {
    id: string;
    role?: string;
    email?: string;
  };

  // 認證信息
  auth?: {
    method: 'jwt' | 'apiKey' | 'azureAD';
    tokenId?: string;
  };

  // 錯誤信息
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };

  // 性能指標
  metrics?: {
    dbQueryTime?: number;
    cacheHitRate?: number;
    aiApiTime?: number;
  };

  // 自定義元數據
  metadata?: Record<string, any>;
}

/**
 * 結構化日誌器
 */
export class StructuredLogger {
  constructor(private service: string) {}

  /**
   * 記錄請求
   */
  logRequest(req: Request, requestId: string): void {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      requestId,
      request: {
        method: req.method,
        path: new URL(req.url).pathname,
        query: this.parseQuery(req.url),
        ip: this.getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined
      }
    };

    this.write(log);
  }

  /**
   * 記錄響應
   */
  logResponse(
    req: Request,
    res: Response,
    duration: number,
    requestId: string
  ): void {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: res.status >= 400 ? 'error' : 'info',
      requestId,
      request: {
        method: req.method,
        path: new URL(req.url).pathname,
        ip: this.getClientIP(req)
      },
      response: {
        status: res.status,
        duration,
        size: parseInt(res.headers.get('content-length') || '0')
      }
    };

    this.write(log);
  }

  /**
   * 記錄錯誤
   */
  logError(error: Error, req: Request, requestId: string): void {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      requestId,
      request: {
        method: req.method,
        path: new URL(req.url).pathname,
        ip: this.getClientIP(req)
      },
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    };

    this.write(log);
  }

  /**
   * 寫入日誌
   */
  private write(log: StructuredLog): void {
    // 生產環境：發送到日誌服務（Azure Log Analytics, CloudWatch等）
    // 開發環境：輸出到控制台
    if (process.env.NODE_ENV === 'production') {
      // TODO: 發送到日誌服務
      console.log(JSON.stringify(log));
    } else {
      console.log(JSON.stringify(log, null, 2));
    }
  }

  private parseQuery(url: string): Record<string, string> {
    const params = new URL(url).searchParams;
    const query: Record<string, string> = {};
    params.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }

  private getClientIP(req: Request): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0] ||
           req.headers.get('x-real-ip') ||
           'unknown';
  }
}
```

### 7.2 敏感資料脫敏

```typescript
/**
 * 敏感資料脫敏
 * 文件位置: lib/logging/data-masking.ts
 */
export class DataMasking {
  private static sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'creditCard',
    'ssn',
    'email'  // 部分脫敏
  ];

  /**
   * 脫敏對象
   */
  static maskObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const masked = { ...obj };

    for (const [key, value] of Object.entries(masked)) {
      if (this.isSensitiveField(key)) {
        masked[key] = this.maskValue(key, value);
      } else if (typeof value === 'object') {
        masked[key] = this.maskObject(value);
      }
    }

    return masked;
  }

  /**
   * 檢查是否為敏感字段
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(field => lowerField.includes(field));
  }

  /**
   * 脫敏值
   */
  private static maskValue(fieldName: string, value: any): string {
    if (typeof value !== 'string') {
      return '***MASKED***';
    }

    // Email部分脫敏: user@example.com -> u***@example.com
    if (fieldName.toLowerCase().includes('email')) {
      const [local, domain] = value.split('@');
      if (local && domain) {
        return `${local[0]}***@${domain}`;
      }
    }

    // 其他完全脫敏
    return '***MASKED***';
  }

  /**
   * 脫敏請求頭
   */
  static maskHeaders(headers: Headers): Record<string, string> {
    const masked: Record<string, string> = {};

    headers.forEach((value, key) => {
      if (this.isSensitiveField(key)) {
        masked[key] = this.maskValue(key, value);
      } else {
        masked[key] = value;
      }
    });

    return masked;
  }
}
```

### 7.3 OpenTelemetry整合（未來）

```typescript
/**
 * OpenTelemetry追蹤配置
 * 文件位置: lib/monitoring/tracing.ts
 * 狀態: 預留設計，MVP Phase 2後期實施
 */
export interface TracingConfig {
  serviceName: string;
  environment: string;

  // 追蹤採樣率
  samplingRate: number;

  // 導出器配置
  exporter: {
    type: 'jaeger' | 'zipkin' | 'otlp';
    endpoint: string;
  };

  // 自動儀表化
  autoInstrumentation: {
    http: boolean;
    prisma: boolean;
    redis: boolean;
  };
}

/**
 * 示例配置
 */
export const tracingConfig: TracingConfig = {
  serviceName: 'ai-sales-platform-api',
  environment: process.env.NODE_ENV || 'development',
  samplingRate: 0.1,  // 10%採樣
  exporter: {
    type: 'otlp',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
  },
  autoInstrumentation: {
    http: true,
    prisma: true,
    redis: true
  }
};
```

---

## 8. 實施計劃

### 8.1 開發階段

#### **階段1: 核心中間件 (Week 1 Day 1-2)**

```yaml
任務:
  - [ ] 創建middleware.ts主文件
  - [ ] 實現請求ID生成器
  - [ ] 實現基本路由匹配器
  - [ ] 實現CORS中間件
  - [ ] 實現安全頭部中間件
  - [ ] 編寫單元測試

交付物:
  - middleware.ts (基礎框架)
  - lib/middleware/request-id.ts
  - lib/middleware/route-matcher.ts
  - lib/middleware/cors.ts
  - lib/middleware/security-headers.ts

預計時間: 8-10小時
```

#### **階段2: 認證層 (Week 1 Day 2-3)**

```yaml
任務:
  - [ ] 整合現有JWT驗證邏輯
  - [ ] 整合Azure AD驗證
  - [ ] 實現API Key驗證
  - [ ] 創建認證中間件
  - [ ] 編寫認證測試

交付物:
  - lib/middleware/auth.ts
  - lib/middleware/api-key-validator.ts
  - 完整認證測試套件

預計時間: 6-8小時
```

#### **階段3: 速率限制 (Week 1 Day 3-4)**

```yaml
任務:
  - [ ] 實現Redis速率限制器
  - [ ] 實現記憶體降級方案
  - [ ] 配置多層限流策略
  - [ ] 實現速率限制中間件
  - [ ] 負載測試驗證

交付物:
  - lib/middleware/rate-limiter.ts
  - lib/middleware/rate-limit-config.ts
  - 速率限制測試報告

預計時間: 8-10小時
```

#### **階段4: 日誌系統 (Week 1 Day 4-5)**

```yaml
任務:
  - [ ] 實現結構化日誌器
  - [ ] 實現敏感資料脫敏
  - [ ] 配置日誌聚合
  - [ ] 實現請求/響應日誌中間件
  - [ ] 創建日誌查詢工具

交付物:
  - lib/logging/structured-logger.ts
  - lib/logging/data-masking.ts
  - lib/middleware/logging.ts

預計時間: 6-8小時
```

#### **階段5: 整合測試 (Week 1 Day 5)**

```yaml
任務:
  - [ ] 端到端流程測試
  - [ ] 性能基準測試
  - [ ] 安全掃描測試
  - [ ] 錯誤處理測試
  - [ ] 文檔完善

交付物:
  - 完整測試套件
  - 性能測試報告
  - API網關使用文檔

預計時間: 4-6小時
```

### 8.2 驗收標準

```typescript
/**
 * Week 1 驗收標準
 */
export interface Week1AcceptanceCriteria {
  // 功能完整性
  functionality: {
    authenticationWorks: boolean;        // 認證系統正常
    rateLimitingWorks: boolean;          // 速率限制生效
    routingWorks: boolean;               // 路由正確轉發
    loggingWorks: boolean;               // 日誌正常記錄
    securityHeadersSet: boolean;         // 安全頭部已設置
  };

  // 性能標準
  performance: {
    apiLatency: number;                  // < 50ms額外延遲
    throughput: number;                  // > 1000 req/s
    rateLimitAccuracy: number;           // 100%準確率
  };

  // 測試覆蓋率
  testing: {
    unitTestCoverage: number;            // > 80%
    integrationTestsPassed: boolean;     // 全部通過
    loadTestPassed: boolean;             // 負載測試通過
  };

  // 文檔完整性
  documentation: {
    architectureDoc: boolean;            // 架構文檔完成
    apiDoc: boolean;                     // API文檔完成
    deploymentGuide: boolean;            // 部署指南完成
  };
}
```

### 8.3 風險和緩解策略

```yaml
風險1: Redis不可用導致速率限制失效
緩解: 實現記憶體降級方案，單實例內仍可限流

風險2: 中間件性能影響
緩解:
  - 使用性能分析工具監控
  - 優化熱路徑代碼
  - 考慮邊緣運算部署

風險3: 日誌量過大
緩解:
  - 實現採樣策略
  - 配置日誌級別
  - 使用異步寫入

風險4: 版本遷移複雜度
緩解:
  - 提供詳細遷移指南
  - 實現向後兼容層
  - 逐步棄用舊版本
```

---

## 📊 附錄

### A. 中間件執行順序

```
1. Request ID生成
2. CORS預檢處理
3. 安全頭部設置
4. 請求日誌記錄
5. 速率限制檢查
6. 認證驗證
7. 路由匹配
8. 業務邏輯處理
9. 響應日誌記錄
10. 錯誤處理
```

### B. 環境變數清單

```bash
# API網關配置
API_GATEWAY_ENABLED=true
API_GATEWAY_LOG_LEVEL=info

# 速率限制
REDIS_URL=redis://localhost:6379
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_CREDENTIALS=true

# 日誌
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DESTINATION=console,file,cloud

# 監控
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=ai-sales-platform-api
```

### C. 性能基準

```yaml
目標性能指標:
  額外延遲: < 50ms (P95)
  吞吐量: > 1000 req/s
  CPU使用: < 10% (閒時)
  內存使用: < 100MB

速率限制準確率: 100%
日誌記錄成功率: > 99.9%
```

---

**📅 文檔版本**: 1.0
**✅ 狀態**: 設計完成，準備實施
**👥 審核者**: 開發團隊
**📆 下次審核**: Sprint 1 Week 2結束

---

## 🎯 下一步行動

1. **立即開始**: 階段1核心中間件開發
2. **並行準備**: Redis環境配置和測試
3. **文檔同步**: 更新API使用文檔
4. **團隊同步**: Sprint 1 Week 1 Daily Standup

**🚀 讓我們開始實施這個企業級API網關架構！**