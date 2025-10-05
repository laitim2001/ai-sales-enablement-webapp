/**
 * 聊天訊息組件
 *
 * 功能：
 * - 展示單條聊天訊息
 * - 支援用戶和AI助手兩種角色
 * - Markdown渲染支持
 * - 時間戳顯示
 * - 載入動畫（打字指示器）
 *
 * @author Claude Code
 * @date 2025-10-05
 * @epic Sprint 7 - 會議準備與智能助手
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessageProps {
  /**
   * 訊息ID
   */
  id: string;

  /**
   * 訊息角色
   */
  role: MessageRole;

  /**
   * 訊息內容
   */
  content: string;

  /**
   * 時間戳
   */
  timestamp: Date;

  /**
   * 是否正在載入
   */
  isLoading?: boolean;

  /**
   * 自定義類名
   */
  className?: string;
}

/**
 * 聊天訊息組件
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  timestamp,
  isLoading = false,
  className
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  // 格式化時間
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div
      id={id}
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors',
        isUser && 'bg-primary/5 ml-auto max-w-[80%]',
        !isUser && !isSystem && 'bg-muted/50 mr-auto max-w-[80%]',
        isSystem && 'bg-yellow-50 dark:bg-yellow-900/20 mx-auto max-w-[90%] text-sm',
        className
      )}
    >
      {/* 頭像 */}
      {!isSystem && (
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          {isUser ? 'U' : 'AI'}
        </div>
      )}

      {/* 訊息內容 */}
      <div className="flex-1 min-w-0">
        {/* 角色名稱和時間 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? '你' : isSystem ? '系統' : 'AI助手'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </span>
        </div>

        {/* 訊息文本 */}
        {isLoading ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap break-words">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

ChatMessage.displayName = 'ChatMessage';
