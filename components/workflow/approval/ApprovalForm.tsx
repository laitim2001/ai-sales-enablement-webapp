/**
 * 審批表單組件
 *
 * 功能：
 * - 審批決策表單（批准/拒絕）
 * - 審批意見輸入
 * - 委派審批給其他用戶
 * - 決策確認對話框
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle,
  User,
  MessageSquare,
} from 'lucide-react';
import type { ApprovalTask } from './ApprovalTaskList';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface ApprovalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ApprovalTask;
  action: 'approve' | 'reject' | 'delegate';
  availableUsers?: User[];
  onSubmit: (taskId: number, decision: {
    action: 'approve' | 'reject' | 'delegate';
    comment: string;
    delegateTo?: number;
  }) => Promise<void>;
}

export function ApprovalForm({
  open,
  onOpenChange,
  task,
  action,
  availableUsers = [],
  onSubmit,
}: ApprovalFormProps) {
  const [comment, setComment] = useState('');
  const [delegateUserId, setDelegateUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const config = {
    approve: {
      title: '批准提案',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      description: '批准後，提案將進入下一階段',
      confirmLabel: '確認批准',
      variant: 'default' as const,
      requiresComment: false,
    },
    reject: {
      title: '拒絕提案',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      description: '拒絕後，提案將返回修訂',
      confirmLabel: '確認拒絕',
      variant: 'destructive' as const,
      requiresComment: true,
    },
    delegate: {
      title: '委派審批',
      icon: ArrowRight,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      description: '將審批任務委派給其他用戶',
      confirmLabel: '確認委派',
      variant: 'outline' as const,
      requiresComment: false,
    },
  }[action];

  const Icon = config.icon;

  const handleSubmit = async () => {
    // 驗證
    if (config.requiresComment && !comment.trim()) {
      return;
    }
    if (action === 'delegate' && !delegateUserId) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(task.id, {
        action,
        comment: comment.trim(),
        delegateTo: delegateUserId ? parseInt(delegateUserId) : undefined,
      });
      onOpenChange(false);
      setComment('');
      setDelegateUserId('');
      setUnderstood(false);
    } catch (error) {
      console.error('提交審批決策失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${config.color}`}>
            <Icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 提案信息 */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="text-sm font-medium text-gray-700">提案標題</div>
            <div className="mt-1 text-base font-semibold">
              {task.proposal_title}
            </div>
            {task.delegated_from && (
              <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                <ArrowRight className="h-4 w-4" />
                委派自 {task.delegated_from.first_name}{' '}
                {task.delegated_from.last_name}
              </div>
            )}
          </div>

          {/* 拒絕警告 */}
          {action === 'reject' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>重要提示</AlertTitle>
              <AlertDescription>
                拒絕提案後，提案將被標記為需要修訂，創建者需要重新提交審批。請確保在審批意見中說明拒絕原因。
              </AlertDescription>
            </Alert>
          )}

          {/* 委派對象選擇 */}
          {action === 'delegate' && (
            <div className="space-y-2">
              <Label htmlFor="delegate-to" className="flex items-center gap-1">
                委派給
                <span className="text-red-500">*</span>
              </Label>
              <Select value={delegateUserId} onValueChange={setDelegateUserId}>
                <SelectTrigger id="delegate-to">
                  <SelectValue placeholder="選擇用戶..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers
                    .filter((u) => u.id !== task.assignee.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email} • {user.role}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                委派後，該用戶將接管此審批任務
              </p>
            </div>
          )}

          {/* 審批意見 */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              審批意見
              {config.requiresComment && (
                <span className="text-red-500">*</span>
              )}
              {!config.requiresComment && (
                <span className="text-gray-500">(選填)</span>
              )}
            </Label>
            <Textarea
              id="comment"
              placeholder={
                action === 'reject'
                  ? '請說明拒絕原因...'
                  : action === 'delegate'
                  ? '可以添加委派說明...'
                  : '可以添加批准意見...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required={config.requiresComment}
            />
            <p className="text-xs text-gray-500">
              此意見將記錄在審批歷史中
              {action === 'reject' && '，並通知提案創建者'}
            </p>
          </div>

          {/* 決策確認 */}
          <div
            className={`flex items-start gap-3 rounded-lg border-2 p-3 ${config.bg}`}
          >
            <input
              type="checkbox"
              id="understood"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5"
            />
            <Label
              htmlFor="understood"
              className={`flex-1 text-sm font-medium ${config.color}`}
            >
              我已確認要執行此操作，並理解其影響
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant={config.variant}
            onClick={handleSubmit}
            disabled={
              loading ||
              !understood ||
              (config.requiresComment && !comment.trim()) ||
              (action === 'delegate' && !delegateUserId)
            }
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {loading ? '處理中...' : config.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
