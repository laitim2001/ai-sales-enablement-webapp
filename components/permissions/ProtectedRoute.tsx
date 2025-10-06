'use client'

/**
 * ================================================================
 * 檔案名稱: 權限保護路由組件
 * 檔案用途: 基於RBAC的路由級別權限保護
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. ProtectedRoute - 基於權限的路由保護
 * 2. AdminRoute - 管理員專用路由保護
 * 3. ManagerRoute - 銷售經理及以上路由保護
 * 4. 自動重定向 - 無權限時自動跳轉
 *
 * 技術特色/核心特色:
 * - 完整RBAC權限檢查: 細粒度資源和操作權限驗證
 * - 角色級別保護: 管理員、經理等角色快捷檢查
 * - 自動重定向: 無權限自動跳轉到儀表板或登入頁
 * - 載入狀態: 權限檢查期間顯示載入指示器
 * - TypeScript類型安全: 完整的類型定義
 *
 * 依賴關係:
 * - React 18+: 組件系統和Hooks
 * - Next.js 13+: 路由系統和navigation
 * - @/hooks/use-permission: 權限檢查Hook
 * - @/lib/security/rbac: RBAC資源和操作定義
 *
 * 注意事項:
 * - 必須在AuthProvider中使用
 * - 前端權限檢查僅用於UI控制，後端仍需驗證
 * - 使用useEffect處理重定向以避免SSR問題
 *
 * 使用範例:
 * ```tsx
 * // 1. 基於權限保護路由
 * <ProtectedRoute
 *   resource={Resource.CUSTOMERS}
 *   action={Action.MANAGE}
 * >
 *   <CustomerManagement />
 * </ProtectedRoute>
 *
 * // 2. 管理員專用路由
 * <AdminRoute>
 *   <AdminDashboard />
 * </AdminRoute>
 *
 * // 3. 銷售經理及以上路由
 * <ManagerRoute>
 *   <TeamManagement />
 * </ManagerRoute>
 * ```
 *
 * Sprint 3 Week 7 Day 5 實施
 * 實施日期: 2025-10-06
 * 實施模式: 前端權限控制設計 (RBAC設計文檔 §路由保護)
 */

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/use-permission';
import { Resource, Action } from '@/lib/security/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  resource: Resource;
  action: Action;
  fallbackPath?: string;
}

/**
 * 權限保護路由組件
 *
 * 根據用戶權限控制路由訪問。
 * 無權限時自動重定向到指定頁面。
 *
 * @param {ProtectedRouteProps} props - 組件屬性
 * @param {ReactNode} props.children - 受保護的子組件
 * @param {Resource} props.resource - 需要的資源權限
 * @param {Action} props.action - 需要的操作權限
 * @param {string} props.fallbackPath - 無權限時的重定向路徑 (預設: /dashboard)
 *
 * @example
 * <ProtectedRoute
 *   resource={Resource.USERS}
 *   action={Action.MANAGE}
 *   fallbackPath="/dashboard"
 * >
 *   <UserManagement />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  resource,
  action,
  fallbackPath = '/dashboard',
}: ProtectedRouteProps) {
  const { hasPermission, user } = usePermission();
  const router = useRouter();

  useEffect(() => {
    // 如果用戶未登入，重定向到登入頁
    if (!user) {
      router.push('/login');
      return;
    }

    // 如果用戶沒有所需權限，重定向到fallback頁面
    if (!hasPermission(resource, action)) {
      router.push(fallbackPath);
    }
  }, [user, hasPermission, resource, action, fallbackPath, router]);

  // 權限檢查期間顯示載入指示器
  if (!user || !hasPermission(resource, action)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在驗證權限...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 管理員專用路由保護組件
 *
 * 只允許ADMIN角色訪問。
 * 是ProtectedRoute的簡化版本，專門用於管理員路由。
 *
 * @param {Object} props - 組件屬性
 * @param {ReactNode} props.children - 受保護的子組件
 * @param {string} props.fallbackPath - 無權限時的重定向路徑 (預設: /dashboard)
 *
 * @example
 * <AdminRoute>
 *   <AdminDashboard />
 * </AdminRoute>
 */
export function AdminRoute({
  children,
  fallbackPath = '/dashboard',
}: {
  children: ReactNode;
  fallbackPath?: string;
}) {
  const { isAdmin, user } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!isAdmin()) {
      router.push(fallbackPath);
    }
  }, [user, isAdmin, fallbackPath, router]);

  if (!user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在驗證管理員權限...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 銷售經理及以上路由保護組件
 *
 * 只允許SALES_MANAGER和ADMIN角色訪問。
 * 適用於團隊管理、審批等功能。
 *
 * @param {Object} props - 組件屬性
 * @param {ReactNode} props.children - 受保護的子組件
 * @param {string} props.fallbackPath - 無權限時的重定向路徑 (預設: /dashboard)
 *
 * @example
 * <ManagerRoute>
 *   <TeamManagement />
 * </ManagerRoute>
 */
export function ManagerRoute({
  children,
  fallbackPath = '/dashboard',
}: {
  children: ReactNode;
  fallbackPath?: string;
}) {
  const { isAdmin, isSalesManager, user } = usePermission();
  const router = useRouter();

  const isManagerOrAbove = isAdmin() || isSalesManager();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!isManagerOrAbove) {
      router.push(fallbackPath);
    }
  }, [user, isManagerOrAbove, fallbackPath, router]);

  if (!user || !isManagerOrAbove) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在驗證經理權限...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
