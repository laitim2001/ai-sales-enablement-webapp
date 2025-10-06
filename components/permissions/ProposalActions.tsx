'use client'

/**
 * ================================================================
 * 檔案名稱: 提案操作權限控制組件
 * 檔案用途: 示範提案資源的RBAC權限控制和擁有權檢查
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. ProposalActions - 提案操作按鈕權限控制
 * 2. 擁有權檢查 - 只能編輯/刪除自己創建的提案
 * 3. 狀態相關權限 - 根據提案狀態調整可用操作
 * 4. 審批權限 - 只有SALES_MANAGER和ADMIN可以審批
 *
 * 技術特色/核心特色:
 * - 完整RBAC權限整合: 使用usePermission Hook
 * - 擁有權檢查: 驗證user.id === proposal.user_id
 * - 狀態流轉控制: 根據提案狀態調整操作
 * - 審批流程整合: APPROVE權限檢查
 * - TypeScript類型安全: 完整的類型定義
 *
 * 依賴關係:
 * - React 18+: 組件系統
 * - @/hooks/use-permission: 權限檢查Hook
 * - @/lib/security/rbac: RBAC資源和操作定義
 * - @/components/ui/button: shadcn/ui Button組件
 *
 * 注意事項:
 * - 必須在AuthProvider中使用
 * - 擁有權檢查需要提案的user_id屬性
 * - 前端權限檢查僅用於UI控制，後端仍需驗證
 *
 * 使用範例:
 * ```tsx
 * // 在提案列表或詳情頁中使用
 * <ProposalActions
 *   proposalId={proposal.id}
 *   proposalOwnerId={proposal.user_id}
 *   proposalStatus={proposal.status}
 * />
 * ```
 *
 * Sprint 3 Week 7 Day 5 實施
 * 實施日期: 2025-10-06
 * 實施模式: 前端權限控制設計 + 擁有權檢查 (Pattern 3)
 */

import { usePermission } from '@/hooks/use-permission';
import { Resource, Action } from '@/lib/security/rbac';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Check, X, Eye, Archive } from 'lucide-react';

interface ProposalActionsProps {
  proposalId: number;
  proposalOwnerId: number;
  proposalStatus: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onArchive?: () => void;
}

/**
 * 提案操作權限控制組件
 *
 * 根據用戶權限、擁有權和提案狀態動態顯示操作按鈕。
 * 展示了如何結合權限檢查和擁有權驗證。
 *
 * @param {ProposalActionsProps} props - 組件屬性
 * @param {number} props.proposalId - 提案ID
 * @param {number} props.proposalOwnerId - 提案創建者ID
 * @param {string} props.proposalStatus - 提案狀態 (DRAFT/PENDING/APPROVED/REJECTED)
 * @param {Function} props.onView - 查看回調函數 (可選)
 * @param {Function} props.onEdit - 編輯回調函數 (可選)
 * @param {Function} props.onDelete - 刪除回調函數 (可選)
 * @param {Function} props.onApprove - 審批通過回調函數 (可選)
 * @param {Function} props.onReject - 審批拒絕回調函數 (可選)
 * @param {Function} props.onArchive - 歸檔回調函數 (可選)
 *
 * @example
 * <ProposalActions
 *   proposalId={proposal.id}
 *   proposalOwnerId={proposal.user_id}
 *   proposalStatus={proposal.status}
 *   onEdit={() => router.push(`/proposals/${proposalId}/edit`)}
 *   onApprove={() => handleApprove(proposalId)}
 * />
 */
export function ProposalActions({
  proposalId,
  proposalOwnerId,
  proposalStatus,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onArchive,
}: ProposalActionsProps) {
  const { hasPermission, user, isAdmin, isSalesManager } = usePermission();

  // 基礎權限檢查
  const canRead = hasPermission(Resource.PROPOSALS, Action.READ);
  const canUpdate = hasPermission(Resource.PROPOSALS, Action.UPDATE);
  const canDelete = hasPermission(Resource.PROPOSALS, Action.DELETE);
  const canApprove = hasPermission(Resource.PROPOSALS, Action.APPROVE);
  const canArchive = hasPermission(Resource.PROPOSALS, Action.ARCHIVE);

  // 擁有權檢查 - 只能編輯/刪除自己的提案
  const isOwner = user?.id === proposalOwnerId;
  const canEditThisProposal = canUpdate && (isOwner || isAdmin());
  const canDeleteThisProposal = canDelete && (isOwner || isAdmin());

  // 狀態相關邏輯
  const isDraft = proposalStatus === 'DRAFT';
  const isPending = proposalStatus === 'PENDING';
  const isApproved = proposalStatus === 'APPROVED';
  const isRejected = proposalStatus === 'REJECTED';

  // 編輯權限：只能編輯DRAFT或REJECTED狀態的提案
  const canEditByStatus = isDraft || isRejected;

  // 審批權限：只能審批PENDING狀態的提案
  const canApproveThisProposal = canApprove && isPending;

  // 歸檔權限：只能歸檔APPROVED或REJECTED的提案
  const canArchiveThisProposal = canArchive && (isApproved || isRejected);

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {/* 查看按鈕 - 所有角色都可以查看 */}
      {canRead && onView && (
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          title="查看提案詳情"
        >
          <Eye className="h-4 w-4 mr-1" />
          查看
        </Button>
      )}

      {/* 編輯按鈕 - 需要UPDATE權限 + 擁有權 + 狀態允許 */}
      {canEditThisProposal && canEditByStatus && onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          title={isOwner ? "編輯您的提案" : "編輯提案 (管理員)"}
        >
          <Edit className="h-4 w-4 mr-1" />
          編輯
        </Button>
      )}

      {/* 刪除按鈕 - 需要DELETE權限 + 擁有權 */}
      {canDeleteThisProposal && onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          title={isOwner ? "刪除您的提案" : "刪除提案 (管理員)"}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          刪除
        </Button>
      )}

      {/* 審批通過按鈕 - 需要APPROVE權限 + PENDING狀態 */}
      {canApproveThisProposal && onApprove && (
        <Button
          variant="default"
          size="sm"
          onClick={onApprove}
          title="審批通過提案"
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-1" />
          通過
        </Button>
      )}

      {/* 審批拒絕按鈕 - 需要APPROVE權限 + PENDING狀態 */}
      {canApproveThisProposal && onReject && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onReject}
          title="審批拒絕提案"
        >
          <X className="h-4 w-4 mr-1" />
          拒絕
        </Button>
      )}

      {/* 歸檔按鈕 - 需要ARCHIVE權限 + 已審批/已拒絕狀態 */}
      {canArchiveThisProposal && onArchive && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onArchive}
          title="歸檔提案"
        >
          <Archive className="h-4 w-4 mr-1" />
          歸檔
        </Button>
      )}

      {/* 權限提示 - 無編輯權限時的說明 */}
      {!canEditThisProposal && !isOwner && canUpdate && (
        <span className="text-xs text-muted-foreground">
          只能編輯自己創建的提案
        </span>
      )}

      {/* 狀態提示 - 狀態不允許編輯時的說明 */}
      {canEditThisProposal && !canEditByStatus && (
        <span className="text-xs text-muted-foreground">
          {isPending && "審批中的提案無法編輯"}
          {isApproved && "已通過的提案無法編輯"}
        </span>
      )}

      {/* 審批者標識 */}
      {(isSalesManager() || isAdmin()) && (
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
          {isAdmin() ? "管理員" : "審批者"}
        </span>
      )}
    </div>
  );
}
