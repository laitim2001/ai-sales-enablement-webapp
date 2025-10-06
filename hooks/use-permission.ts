'use client'

/**
 * ================================================================
 * 檔案名稱: 權限檢查Hook
 * 檔案用途: AI銷售賦能平台的前端權限檢查和RBAC整合
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. usePermission - 主要權限檢查Hook
 * 2. hasPermission - 細粒度權限檢查函數
 * 3. isAdmin - 管理員權限檢查
 * 4. isSalesManager - 銷售經理權限檢查
 * 5. isSalesRep - 銷售代表權限檢查
 * 6. isMarketing - 行銷人員權限檢查
 * 7. isViewer - 訪客權限檢查
 *
 * 技術特色/核心特色:
 * - 完整RBAC權限檢查: 基於角色和資源的權限驗證
 * - 前端UI權限控制: 條件渲染和按鈕權限管理
 * - TypeScript類型安全: 完整的類型定義和約束
 * - 與後端RBAC系統一致: 使用相同的權限矩陣邏輯
 * - React Hook整合: 無縫整合到React組件中
 *
 * 依賴關係:
 * - React 18+: Hooks系統
 * - @/hooks/use-auth: 用戶認證狀態
 * - @/lib/security/rbac: RBAC權限服務
 *
 * 注意事項:
 * - 必須在AuthProvider中使用 (依賴useAuth)
 * - 前端權限檢查僅用於UI控制，不能替代後端權限驗證
 * - 權限矩陣與後端保持同步 (lib/security/rbac.ts)
 *
 * 使用範例:
 * ```tsx
 * // 1. 在組件中使用權限檢查
 * const { hasPermission, isAdmin } = usePermission()
 *
 * // 2. 條件渲染UI元素
 * {hasPermission(Resource.CUSTOMERS, Action.UPDATE) && (
 *   <button>編輯客戶</button>
 * )}
 *
 * // 3. 角色檢查
 * {isAdmin() && <AdminPanel />}
 * ```
 *
 * Sprint 3 Week 7 Day 5 實施
 * 實施日期: 2025-10-06
 * 實施模式: 前端權限控制設計 (RBAC設計文檔 §前端權限控制)
 */

import { useAuth } from './use-auth';
import { can, Resource, Action, UserRole } from '@/lib/security/rbac';

/**
 * 權限檢查Hook
 *
 * 提供前端權限檢查功能，包括細粒度權限驗證和角色檢查。
 *
 * @returns {Object} 權限檢查函數集合
 * @property {Function} hasPermission - 檢查用戶是否有特定資源和操作的權限
 * @property {Function} isAdmin - 檢查用戶是否為管理員
 * @property {Function} isSalesManager - 檢查用戶是否為銷售經理
 * @property {Function} isSalesRep - 檢查用戶是否為銷售代表
 * @property {Function} isMarketing - 檢查用戶是否為行銷人員
 * @property {Function} isViewer - 檢查用戶是否為訪客
 * @property {Function} user - 當前用戶資訊
 *
 * @example
 * const { hasPermission, isAdmin } = usePermission();
 *
 * // 檢查更新客戶權限
 * if (hasPermission(Resource.CUSTOMERS, Action.UPDATE)) {
 *   // 顯示編輯按鈕
 * }
 *
 * // 檢查管理員權限
 * if (isAdmin()) {
 *   // 顯示管理員面板
 * }
 */
export function usePermission() {
  const { user } = useAuth();

  /**
   * 檢查用戶是否有特定資源和操作的權限
   *
   * @param {Resource} resource - 要檢查的資源類型
   * @param {Action} action - 要執行的操作類型
   * @returns {boolean} 如果用戶有權限返回true，否則返回false
   *
   * @example
   * // 檢查用戶是否可以刪除客戶
   * const canDelete = hasPermission(Resource.CUSTOMERS, Action.DELETE);
   */
  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!user || !user.role) return false;
    return can(user.role as UserRole, action, resource);
  };

  /**
   * 檢查用戶是否為管理員
   *
   * @returns {boolean} 如果用戶是ADMIN返回true，否則返回false
   *
   * @example
   * {isAdmin() && <AdminDashboard />}
   */
  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  /**
   * 檢查用戶是否為銷售經理
   *
   * @returns {boolean} 如果用戶是SALES_MANAGER返回true，否則返回false
   *
   * @example
   * {isSalesManager() && <TeamManagement />}
   */
  const isSalesManager = (): boolean => {
    return user?.role === 'SALES_MANAGER';
  };

  /**
   * 檢查用戶是否為銷售代表
   *
   * @returns {boolean} 如果用戶是SALES_REP返回true，否則返回false
   *
   * @example
   * {isSalesRep() && <MyOpportunities />}
   */
  const isSalesRep = (): boolean => {
    return user?.role === 'SALES_REP';
  };

  /**
   * 檢查用戶是否為行銷人員
   *
   * @returns {boolean} 如果用戶是MARKETING返回true，否則返回false
   *
   * @example
   * {isMarketing() && <ContentManagement />}
   */
  const isMarketing = (): boolean => {
    return user?.role === 'MARKETING';
  };

  /**
   * 檢查用戶是否為訪客
   *
   * @returns {boolean} 如果用戶是VIEWER返回true，否則返回false
   *
   * @example
   * {isViewer() && <ReadOnlyView />}
   */
  const isViewer = (): boolean => {
    return user?.role === 'VIEWER';
  };

  return {
    hasPermission,
    isAdmin,
    isSalesManager,
    isSalesRep,
    isMarketing,
    isViewer,
    user,
  };
}
