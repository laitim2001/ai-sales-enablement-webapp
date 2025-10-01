/**
 * 狀態轉換按鈕組件
 *
 * 功能：
 * - 顯示可用的狀態轉換操作
 * - 整合轉換類型（提交、批准、拒絕等）
 * - 顯示是否需要審批
 * - 彈出對話框收集轉換原因和評論
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProposalStatus } from '@prisma/client';
import {
  Send,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Archive,
  AlertCircle,
} from 'lucide-react';
import { ProposalStatusBadge } from './ProposalStatusBadge';

export enum TransitionType {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REVISE = 'REVISE',
  SEND = 'SEND',
  VIEW = 'VIEW',
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
  WITHDRAW = 'WITHDRAW',
  EXPIRE = 'EXPIRE',
}

interface AvailableTransition {
  targetState: ProposalStatus;
  transitionType: TransitionType;
  requiresApproval: boolean;
  requiresComment: boolean;
}

interface StateTransitionButtonProps {
  transition: AvailableTransition;
  onTransition: (
    targetState: ProposalStatus,
    reason: string,
    comment?: string
  ) => Promise<void>;
  disabled?: boolean;
}

/**
 * 轉換類型配置
 */
const TRANSITION_CONFIG: Record<
  TransitionType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
    requiresConfirmation: boolean;
  }
> = {
  [TransitionType.SUBMIT]: {
    label: '提交審批',
    icon: Send,
    variant: 'default',
    requiresConfirmation: false,
  },
  [TransitionType.APPROVE]: {
    label: '批准',
    icon: CheckCircle,
    variant: 'default',
    requiresConfirmation: true,
  },
  [TransitionType.REJECT]: {
    label: '拒絕',
    icon: XCircle,
    variant: 'destructive',
    requiresConfirmation: true,
  },
  [TransitionType.REVISE]: {
    label: '要求修訂',
    icon: Edit,
    variant: 'outline',
    requiresConfirmation: false,
  },
  [TransitionType.SEND]: {
    label: '發送給客戶',
    icon: Send,
    variant: 'default',
    requiresConfirmation: true,
  },
  [TransitionType.VIEW]: {
    label: '標記為已查看',
    icon: Eye,
    variant: 'secondary',
    requiresConfirmation: false,
  },
  [TransitionType.ACCEPT]: {
    label: '接受',
    icon: ThumbsUp,
    variant: 'default',
    requiresConfirmation: false,
  },
  [TransitionType.DECLINE]: {
    label: '拒絕',
    icon: ThumbsDown,
    variant: 'destructive',
    requiresConfirmation: true,
  },
  [TransitionType.WITHDRAW]: {
    label: '撤回',
    icon: XCircle,
    variant: 'outline',
    requiresConfirmation: true,
  },
  [TransitionType.EXPIRE]: {
    label: '標記為過期',
    icon: Archive,
    variant: 'destructive',
    requiresConfirmation: true,
  },
};

export function StateTransitionButton({
  transition,
  onTransition,
  disabled = false,
}: StateTransitionButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const config = TRANSITION_CONFIG[transition.transitionType];
  const Icon = config.icon;

  const handleTransition = async () => {
    if (!reason.trim() && config.requiresConfirmation) {
      return; // 需要確認的操作必須提供原因
    }

    setLoading(true);
    try {
      await onTransition(
        transition.targetState,
        reason || `${config.label}操作`,
        comment || undefined
      );
      setOpen(false);
      setReason('');
      setComment('');
    } catch (error) {
      console.error('狀態轉換失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 簡單操作（不需要對話框）
  if (!config.requiresConfirmation && !transition.requiresComment) {
    return (
      <Button
        variant={config.variant}
        size="sm"
        onClick={() =>
          onTransition(transition.targetState, `${config.label}操作`)
        }
        disabled={disabled}
        className="gap-2"
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </Button>
    );
  }

  // 需要對話框的操作
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={config.variant}
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Icon className="h-4 w-4" />
          {config.label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.label}
          </DialogTitle>
          <DialogDescription>
            將狀態轉換為：
            <ProposalStatusBadge
              status={transition.targetState}
              size="sm"
              className="ml-2"
            />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 審批提示 */}
          {transition.requiresApproval && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>此操作需要審批流程，提交後將創建審批任務。</p>
            </div>
          )}

          {/* 原因（必填） */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-1">
              原因
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder={`請說明${config.label}的原因...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-gray-500">
              此原因將記錄在審計追蹤中
            </p>
          </div>

          {/* 評論（選填） */}
          <div className="space-y-2">
            <Label htmlFor="comment">補充說明（選填）</Label>
            <Textarea
              id="comment"
              placeholder="可以添加更多詳細說明..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant={config.variant}
            onClick={handleTransition}
            disabled={loading || !reason.trim()}
          >
            {loading ? '處理中...' : `確認${config.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 批量轉換按鈕組
 */
interface StateTransitionButtonGroupProps {
  transitions: AvailableTransition[];
  onTransition: (
    targetState: ProposalStatus,
    reason: string,
    comment?: string
  ) => Promise<void>;
  disabled?: boolean;
}

export function StateTransitionButtonGroup({
  transitions,
  onTransition,
  disabled = false,
}: StateTransitionButtonGroupProps) {
  if (transitions.length === 0) {
    return (
      <div className="text-sm text-gray-500">當前狀態無可用操作</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((transition) => (
        <StateTransitionButton
          key={transition.targetState}
          transition={transition}
          onTransition={onTransition}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
