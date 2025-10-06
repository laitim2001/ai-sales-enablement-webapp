'use client'

/**
 * ================================================================
 * 檔案名稱: 客戶操作權限控制組件
 * 檔案用途: 示範前端RBAC權限控制和UI條件渲染
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. CustomerActions - 客戶操作按鈕權限控制
 * 2. 權限條件渲染 - 基於用戶權限顯示/隱藏操作按鈕
 * 3. 權限提示 - 無權限時顯示友好提示
 *
 * 技術特色/核心特色:
 * - 完整RBAC權限整合: 使用usePermission Hook進行權限檢查
 * - 細粒度權限控制: UPDATE/DELETE/ASSIGN操作分別檢查
 * - 用戶友好提示: 無權限時顯示提示信息而非隱藏
 * - TypeScript類型安全: 完整的類型定義和約束
 * - shadcn/ui整合: 使用Button組件和一致樣式
 *
 * 依賴關係:
 * - React 18+: 組件系統
 * - @/hooks/use-permission: 權限檢查Hook
 * - @/lib/security/rbac: RBAC資源和操作定義
 * - @/components/ui/button: shadcn/ui Button組件
 *
 * 注意事項:
 * - 必須在AuthProvider中使用
 * - 前端權限檢查僅用於UI控制，不能替代後端權限驗證
 * - 所有操作都應在API層進行權限二次驗證
 *
 * 使用範例:
 * ```tsx
 * // 在客戶列表或詳情頁中使用
 * <CustomerActions customerId={customer.id} />
 * ```
 *
 * Sprint 3 Week 7 Day 5 實施
 * 實施日期: 2025-10-06
 * 實施模式: 前端權限控制設計 (RBAC設計文檔 §UI條件渲染)
 */

import { usePermission } from '@/hooks/use-permission';
import { Resource, Action } from '@/lib/security/rbac';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserPlus, Eye } from 'lucide-react';

interface CustomerActionsProps {
  customerId: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onView?: () => void;
}

/**
 * 客戶操作權限控制組件
 *
 * 根據用戶權限動態顯示操作按鈕。
 * 展示了如何使用usePermission Hook進行前端權限控制。
 *
 * @param {CustomerActionsProps} props - 組件屬性
 * @param {number} props.customerId - 客戶ID
 * @param {Function} props.onEdit - 編輯回調函數 (可選)
 * @param {Function} props.onDelete - 刪除回調函數 (可選)
 * @param {Function} props.onAssign - 分配回調函數 (可選)
 * @param {Function} props.onView - 查看回調函數 (可選)
 *
 * @example
 * <CustomerActions
 *   customerId={123}
 *   onEdit={() => router.push(`/customers/${customerId}/edit`)}
 *   onDelete={() => handleDelete(customerId)}
 *   onAssign={() => setAssignDialogOpen(true)}
 * />
 */
export function CustomerActions({
  customerId,
  onEdit,
  onDelete,
  onAssign,
  onView,
}: CustomerActionsProps) {
  const { hasPermission, isAdmin, isSalesManager } = usePermission();

  // 權限檢查
  const canView = hasPermission(Resource.CUSTOMERS, Action.READ);
  const canUpdate = hasPermission(Resource.CUSTOMERS, Action.UPDATE);
  const canDelete = hasPermission(Resource.CUSTOMERS, Action.DELETE);
  const canAssign = hasPermission(Resource.CUSTOMERS, Action.ASSIGN);

  return (
    <div className="flex gap-2 items-center">
      {/* 查看按鈕 - 所有角色都可以查看 */}
      {canView && onView && (
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          title="查看客戶詳情"
        >
          <Eye className="h-4 w-4 mr-1" />
          查看
        </Button>
      )}

      {/* 編輯按鈕 - 需要UPDATE權限 (ADMIN, SALES_MANAGER, SALES_REP) */}
      {canUpdate && onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          title="編輯客戶資訊"
        >
          <Edit className="h-4 w-4 mr-1" />
          編輯
        </Button>
      )}

      {/* 刪除按鈕 - 需要DELETE權限 (只有ADMIN和SALES_MANAGER) */}
      {canDelete && onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          title="刪除客戶 (此操作不可逆)"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          刪除
        </Button>
      )}

      {/* 分配按鈕 - 需要ASSIGN權限 (只有ADMIN和SALES_MANAGER) */}
      {canAssign && onAssign && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAssign}
          title="分配客戶給銷售代表"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          分配
        </Button>
      )}

      {/* 無權限提示 - 當用戶沒有任何操作權限時顯示 */}
      {!canView && !canUpdate && !canDelete && !canAssign && (
        <span className="text-sm text-muted-foreground">
          您沒有此客戶的操作權限
        </span>
      )}

      {/* 管理員標識 - 僅管理員可見 */}
      {isAdmin() && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
          管理員
        </span>
      )}

      {/* 銷售經理標識 - 僅銷售經理可見 */}
      {isSalesManager() && !isAdmin() && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          銷售經理
        </span>
      )}
    </div>
  );
}
