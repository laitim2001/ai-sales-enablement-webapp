/**
 * 權限檢查中間件
 *
 * 功能：
 * - API 端點權限驗證
 * - 基於角色的訪問控制（RBAC）
 * - 資源擁有權驗證
 * - 自動權限拒絕響應
 *
 * 使用方式：
 * ```typescript
 * // API Route 中使用
 * export async function GET(request: NextRequest) {
 *   const authResult = await requirePermission(request, {
 *     resource: Resource.CUSTOMERS,
 *     action: Action.READ,
 *   });
 *
 *   if (!authResult.authorized) {
 *     return authResult.response;
 *   }
 *
 *   // 繼續處理請求
 *   const user = authResult.user;
 * }
 * ```
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 3 - 安全加固與合規
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/auth-server';
import { RBACService, Resource, Action, UserRole } from './rbac';

/**
 * 權限檢查結果接口
 */
export interface PermissionCheckResult {
  authorized: boolean;
  user?: JWTPayload;
  response?: NextResponse;
  reason?: string;
}

/**
 * 權限要求配置
 */
export interface PermissionRequirement {
  resource: Resource;
  action: Action | Action[];
  requireAll?: boolean; // 是否需要所有權限（默認 false，只需任一權限）
  checkOwnership?: boolean; // 是否檢查資源擁有權
  resourceOwnerId?: number; // 資源擁有者 ID（用於擁有權檢查）
}

/**
 * 從請求中提取 JWT Token
 *
 * 優先級：
 * 1. Authorization Header (Bearer token)
 * 2. Cookie (auth-token)
 *
 * @param request - Next.js 請求對象
 * @returns JWT Token 字符串或 null
 */
function extractToken(request: NextRequest): string | null {
  // 1. 從 Authorization Header 提取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. 從 Cookie 提取
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * 驗證用戶身份並檢查權限
 *
 * @param request - Next.js 請求對象
 * @param requirement - 權限要求配置
 * @returns 權限檢查結果
 */
export async function requirePermission(
  request: NextRequest,
  requirement: PermissionRequirement
): Promise<PermissionCheckResult> {
  try {
    // 1. 提取 Token
    const token = extractToken(request);

    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: '未提供身份驗證令牌',
            code: 'AUTH_TOKEN_MISSING',
          },
          { status: 401 }
        ),
        reason: 'No authentication token provided',
      };
    }

    // 2. 驗證 Token
    const payload = await verifyToken(token);

    if (!payload) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: '身份驗證令牌無效或已過期',
            code: 'AUTH_TOKEN_INVALID',
          },
          { status: 401 }
        ),
        reason: 'Invalid or expired token',
      };
    }

    // 3. 檢查用戶角色
    const userRole = payload.role as UserRole;

    if (!userRole) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: '用戶角色未定義',
            code: 'USER_ROLE_MISSING',
          },
          { status: 403 }
        ),
        reason: 'User role not defined',
      };
    }

    // 4. 檢查權限
    const actions = Array.isArray(requirement.action)
      ? requirement.action
      : [requirement.action];

    const hasPermission = requirement.requireAll
      ? RBACService.hasAllPermissions(userRole, requirement.resource, actions)
      : RBACService.hasAnyPermission(userRole, requirement.resource, actions);

    if (!hasPermission) {
      return {
        authorized: false,
        user: payload,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: '您沒有執行此操作的權限',
            code: 'PERMISSION_DENIED',
            details: {
              resource: requirement.resource,
              actions: actions,
              userRole: userRole,
            },
          },
          { status: 403 }
        ),
        reason: `User does not have required permission: ${actions.join(', ')} on ${requirement.resource}`,
      };
    }

    // 5. 檢查資源擁有權（如果需要）
    if (requirement.checkOwnership && requirement.resourceOwnerId !== undefined) {
      const ownsResource = RBACService.ownsResource(
        userRole,
        payload.userId,
        requirement.resourceOwnerId
      );

      if (!ownsResource) {
        return {
          authorized: false,
          user: payload,
          response: NextResponse.json(
            {
              error: 'Forbidden',
              message: '您無法訪問此資源',
              code: 'RESOURCE_ACCESS_DENIED',
            },
            { status: 403 }
          ),
          reason: 'User does not own the resource',
        };
      }
    }

    // 6. 權限檢查通過
    return {
      authorized: true,
      user: payload,
    };
  } catch (error) {
    console.error('[PermissionMiddleware] Error checking permission:', error);

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Internal Server Error',
          message: '權限檢查過程中發生錯誤',
          code: 'PERMISSION_CHECK_ERROR',
        },
        { status: 500 }
      ),
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 僅驗證用戶身份（不檢查權限）
 *
 * @param request - Next.js 請求對象
 * @returns 權限檢查結果
 */
export async function requireAuth(
  request: NextRequest
): Promise<PermissionCheckResult> {
  try {
    const token = extractToken(request);

    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: '未提供身份驗證令牌',
            code: 'AUTH_TOKEN_MISSING',
          },
          { status: 401 }
        ),
        reason: 'No authentication token provided',
      };
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: '身份驗證令牌無效或已過期',
            code: 'AUTH_TOKEN_INVALID',
          },
          { status: 401 }
        ),
        reason: 'Invalid or expired token',
      };
    }

    return {
      authorized: true,
      user: payload,
    };
  } catch (error) {
    console.error('[PermissionMiddleware] Error checking auth:', error);

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Internal Server Error',
          message: '身份驗證過程中發生錯誤',
          code: 'AUTH_CHECK_ERROR',
        },
        { status: 500 }
      ),
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 要求管理員權限
 *
 * @param request - Next.js 請求對象
 * @returns 權限檢查結果
 */
export async function requireAdmin(
  request: NextRequest
): Promise<PermissionCheckResult> {
  const authResult = await requireAuth(request);

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  const userRole = authResult.user.role as UserRole;

  if (!RBACService.isAdmin(userRole)) {
    return {
      authorized: false,
      user: authResult.user,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: '此操作需要管理員權限',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      ),
      reason: 'Admin role required',
    };
  }

  return {
    authorized: true,
    user: authResult.user,
  };
}

/**
 * 要求管理角色（管理員或銷售經理）
 *
 * @param request - Next.js 請求對象
 * @returns 權限檢查結果
 */
export async function requireManagement(
  request: NextRequest
): Promise<PermissionCheckResult> {
  const authResult = await requireAuth(request);

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  const userRole = authResult.user.role as UserRole;

  if (!RBACService.hasManagementRole(userRole)) {
    return {
      authorized: false,
      user: authResult.user,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: '此操作需要管理角色權限',
          code: 'MANAGEMENT_REQUIRED',
        },
        { status: 403 }
      ),
      reason: 'Management role required',
    };
  }

  return {
    authorized: true,
    user: authResult.user,
  };
}

/**
 * 便利函數：包裝 API Route Handler 添加權限檢查
 *
 * 使用示例：
 * ```typescript
 * export const GET = withPermission(
 *   async (request, { user }) => {
 *     // 處理請求
 *     return NextResponse.json({ data: 'success' });
 *   },
 *   {
 *     resource: Resource.CUSTOMERS,
 *     action: Action.READ,
 *   }
 * );
 * ```
 */
export function withPermission<T = any>(
  handler: (
    request: NextRequest,
    context: { user: JWTPayload; params?: T }
  ) => Promise<NextResponse>,
  requirement: PermissionRequirement
) {
  return async (
    request: NextRequest,
    context?: { params?: T }
  ): Promise<NextResponse> => {
    const authResult = await requirePermission(request, requirement);

    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    return handler(request, {
      user: authResult.user,
      params: context?.params,
    });
  };
}

/**
 * 便利函數：包裝 API Route Handler 僅添加身份驗證
 */
export function withAuth<T = any>(
  handler: (
    request: NextRequest,
    context: { user: JWTPayload; params?: T }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: T }
  ): Promise<NextResponse> => {
    const authResult = await requireAuth(request);

    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    return handler(request, {
      user: authResult.user,
      params: context?.params,
    });
  };
}

/**
 * 便利函數：包裝 API Route Handler 要求管理員權限
 */
export function withAdmin<T = any>(
  handler: (
    request: NextRequest,
    context: { user: JWTPayload; params?: T }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: T }
  ): Promise<NextResponse> => {
    const authResult = await requireAdmin(request);

    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    return handler(request, {
      user: authResult.user,
      params: context?.params,
    });
  };
}

/**
 * 便利函數：包裝 API Route Handler 要求管理角色權限
 */
export function withManagement<T = any>(
  handler: (
    request: NextRequest,
    context: { user: JWTPayload; params?: T }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: T }
  ): Promise<NextResponse> => {
    const authResult = await requireManagement(request);

    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    return handler(request, {
      user: authResult.user,
      params: context?.params,
    });
  };
}

/**
 * 導出所有便利函數
 */
export default {
  requirePermission,
  requireAuth,
  requireAdmin,
  requireManagement,
  withPermission,
  withAuth,
  withAdmin,
  withManagement,
};
