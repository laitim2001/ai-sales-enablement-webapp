/**
 * 評論項目組件
 *
 * 功能：
 * - 單個評論的顯示
 * - @mentions 解析和高亮
 * - 回覆、編輯、刪除操作
 * - 評論狀態標記
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { CommentForm } from './CommentForm';
import type { Comment } from './CommentThread';

interface CommentItemProps {
  comment: Comment;
  currentUserId: number;
  onReply?: (content: string, mentions: number[]) => Promise<void>;
  onResolve?: () => Promise<void>;
  onReopen?: () => Promise<void>;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isAuthor = comment.user.id === currentUserId;
  const isResolved = comment.status === 'RESOLVED';

  // 解析 @mentions 並高亮顯示
  const parseContent = (content: string) => {
    const mentionPattern = /@\[([^\]]+)\]\((\d+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      // 添加 mention 之前的文字
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // 添加 mention 標記
      const userName = match[1];
      const userId = match[2];
      parts.push(
        <Badge
          key={`mention-${userId}-${match.index}`}
          variant="secondary"
          className="mx-0.5 bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          @{userName}
        </Badge>
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩餘文字
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const handleReply = async (content: string, mentions: number[]) => {
    if (onReply) {
      await onReply(content, mentions);
      setShowReplyForm(false);
    }
  };

  const handleEdit = async (content: string) => {
    if (onEdit) {
      await onEdit(content);
      setIsEditing(false);
    }
  };

  // 獲取用戶縮寫
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="group relative">
      <div
        className={`rounded-lg border p-4 transition-colors ${
          isResolved ? 'border-green-200 bg-green-50' : 'bg-white'
        }`}
      >
        {/* 評論頭部 */}
        <div className="flex items-start gap-3">
          {/* 用戶頭像 */}
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
              {getUserInitials(comment.user.first_name, comment.user.last_name)}
            </AvatarFallback>
          </Avatar>

          {/* 評論內容 */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {comment.user.first_name} {comment.user.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                </span>
                {comment.updated_at &&
                  new Date(comment.updated_at) >
                    new Date(comment.created_at) && (
                    <Badge variant="outline" className="text-xs">
                      已編輯
                    </Badge>
                  )}
                {isResolved && (
                  <Badge
                    variant="default"
                    className="gap-1 bg-green-600 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    已解決
                  </Badge>
                )}
              </div>

              {/* 操作菜單 */}
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        編輯
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        刪除
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* 評論文字 */}
            {isEditing && onEdit ? (
              <div className="mt-2">
                <CommentForm
                  initialContent={comment.content}
                  onSubmit={(content) => handleEdit(content)}
                  onCancel={() => setIsEditing(false)}
                  placeholder="編輯評論..."
                  submitLabel="保存"
                />
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-700">
                {parseContent(comment.content)}
              </div>
            )}

            {/* 操作按鈕 */}
            {!isEditing && (
              <div className="mt-3 flex items-center gap-2">
                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-7 gap-1 text-xs"
                  >
                    <MessageSquare className="h-3 w-3" />
                    回覆
                  </Button>
                )}
                {onResolve && !isResolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResolve}
                    className="h-7 gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    標記為已解決
                  </Button>
                )}
                {onReopen && isResolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReopen}
                    className="h-7 gap-1 text-xs text-orange-600 hover:text-orange-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                    重新開啟
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 回覆表單 */}
        {showReplyForm && onReply && (
          <div className="ml-11 mt-3">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              placeholder="輸入回覆..."
              submitLabel="回覆"
            />
          </div>
        )}
      </div>
    </div>
  );
}
