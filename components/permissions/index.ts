/**
 * ================================================================
 * 檔案名稱: 權限組件導出入口
 * 檔案用途: 集中導出所有RBAC權限控制相關組件
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 使用範例:
 * ```tsx
 * // 方式1: 具名導入
 * import { CustomerActions, ProposalActions, AdminRoute } from '@/components/permissions';
 *
 * // 方式2: 全部導入
 * import * as Permissions from '@/components/permissions';
 * <Permissions.CustomerActions ... />
 * ```
 *
 * Sprint 3 Week 7 Day 5 實施
 * 實施日期: 2025-10-06
 */

export { CustomerActions } from './CustomerActions';
export { ProposalActions } from './ProposalActions';
export { ProtectedRoute, AdminRoute, ManagerRoute } from './ProtectedRoute';
