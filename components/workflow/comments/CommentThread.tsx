/**
 * 評論串組件
 *
 * 功能：
 * - 顯示評論樹狀結構
 * - 支持嵌套回覆
 * - @mentions 高亮顯示
 * - 評論狀態管理（開啟/已解決）
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

'use client';

import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface Comment {
  id: number;
  content: string;
  created_at: Date;
  updated_at?: Date;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  parent_id?: number | null;
  status: 'OPEN' | 'RESOLVED';
  mentions: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  replies?: Comment[];
}

interface CommentThreadProps {
  proposalId: number;
  sectionId?: string;
  comments: Comment[];
  onAddComment: (
    content: string,
    mentions: number[],
    parentId?: number
  ) => Promise<void>;
  onResolveThread: (commentId: number) => Promise<void>;
  onReopenThread: (commentId: number) => Promise<void>;
  currentUserId: number;
}

export function CommentThread({
  proposalId,
  sectionId,
  comments,
  onAddComment,
  onResolveThread,
  onReopenThread,
  currentUserId,
}: CommentThreadProps) {
  const [showResolved, setShowResolved] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(
    new Set()
  );

  // 構建評論樹
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // 創建 map 並初始化 replies
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 構建樹狀結構
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  // 過濾評論
  const filteredComments = showResolved
    ? commentTree
    : commentTree.filter((c) => c.status === 'OPEN');

  // 統計
  const totalComments = comments.length;
  const openComments = comments.filter((c) => c.status === 'OPEN').length;
  const resolvedComments = totalComments - openComments;

  // 切換展開/收起
  const toggleThread = (commentId: number) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedThreads(newExpanded);
  };

  // 渲染評論及其回覆
  const renderComment = (comment: Comment, depth: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedThreads.has(comment.id);
    const isThreadStarter = depth === 0;

    return (
      <div key={comment.id} className="space-y-3">
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onReply={(content, mentions) =>
              onAddComment(content, mentions, comment.id)
            }
            onResolve={
              isThreadStarter && comment.status === 'OPEN'
                ? () => onResolveThread(comment.id)
                : undefined
            }
            onReopen={
              isThreadStarter && comment.status === 'RESOLVED'
                ? () => onReopenThread(comment.id)
                : undefined
            }
          />

          {/* 展開/收起回覆按鈕 */}
          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleThread(comment.id)}
              className="mt-2 gap-1 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  收起 {comment.replies!.length} 則回覆
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" />
                  展開 {comment.replies!.length} 則回覆
                </>
              )}
            </Button>
          )}
        </div>

        {/* 回覆列表 */}
        {hasReplies && isExpanded && (
          <div className="space-y-3">
            {comment.replies!.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5" />
              評論
              {sectionId && (
                <Badge variant="outline" className="text-xs">
                  段落: {sectionId}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              共 {totalComments} 則評論
              {openComments > 0 && (
                <span className="ml-2 text-orange-600">
                  • {openComments} 則待處理
                </span>
              )}
            </CardDescription>
          </div>

          {/* 統計與過濾 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Badge
                variant={showResolved ? 'outline' : 'default'}
                className="gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {openComments}
              </Badge>
              <Badge
                variant={showResolved ? 'default' : 'outline'}
                className="gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {resolvedComments}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? '隱藏已解決' : '顯示已解決'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 新增評論表單 */}
        <CommentForm
          onSubmit={(content, mentions) => onAddComment(content, mentions)}
          placeholder="添加評論..."
        />

        {/* 評論列表 */}
        {filteredComments.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {showResolved ? '尚無評論' : '無待處理的評論'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 精簡評論列表（用於側邊欄）
 */
export function CompactCommentThread({
  comments,
  onCommentClick,
}: {
  comments: Comment[];
  onCommentClick?: (commentId: number) => void;
}) {
  const openComments = comments.filter((c) => c.status === 'OPEN');

  return (
    <div className="space-y-2">
      {openComments.slice(0, 3).map((comment) => (
        <div
          key={comment.id}
          className="cursor-pointer rounded-md border p-2 text-sm transition-colors hover:bg-gray-50"
          onClick={() => onCommentClick?.(comment.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {comment.user.first_name} {comment.user.last_name}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                {comment.content}
              </p>
            </div>
            {comment.replies && comment.replies.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {comment.replies.length}
              </Badge>
            )}
          </div>
        </div>
      ))}

      {openComments.length > 3 && (
        <div className="text-center text-xs text-gray-400">
          還有 {openComments.length - 3} 則評論...
        </div>
      )}

      {openComments.length === 0 && (
        <div className="py-4 text-center text-xs text-gray-500">
          無待處理的評論
        </div>
      )}
    </div>
  );
}
