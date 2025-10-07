/**
 * @fileoverview 聊天輸入組件功能：- 文本輸入區域- 發送按鈕- Enter鍵發送（Shift+Enter換行）- 載入狀態管理- 字符計數@author Claude Code@date 2025-10-05@epic Sprint 7 - 會議準備與智能助手
 * @module components/assistant/ChatInput
 * @description
 * 聊天輸入組件功能：- 文本輸入區域- 發送按鈕- Enter鍵發送（Shift+Enter換行）- 載入狀態管理- 字符計數@author Claude Code@date 2025-10-05@epic Sprint 7 - 會議準備與智能助手
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  /**
   * 發送訊息回調
   */
  onSend: (message: string) => void | Promise<void>;

  /**
   * 是否正在載入
   */
  isLoading?: boolean;

  /**
   * 是否禁用
   */
  disabled?: boolean;

  /**
   * 佔位符文本
   */
  placeholder?: string;

  /**
   * 最大字符數
   */
  maxLength?: number;

  /**
   * 自定義類名
   */
  className?: string;
}

/**
 * 聊天輸入組件
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = '輸入訊息...',
  maxLength = 2000,
  className
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 處理發送
   */
  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    setMessage('');
    await onSend(trimmedMessage);

    // 重新聚焦輸入框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * 處理鍵盤事件
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter發送（Shift+Enter換行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * 自動調整高度
   */
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  /**
   * 處理輸入變更
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustHeight();
  };

  const isDisabled = disabled || isLoading;
  const charCount = message.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2">
        {/* 輸入框 */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          maxLength={maxLength}
          rows={1}
          className="min-h-[40px] max-h-[200px] resize-none"
        />

        {/* 發送按鈕 */}
        <Button
          onClick={handleSend}
          disabled={isDisabled || !message.trim() || isOverLimit}
          size="icon"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 字符計數 */}
      {(isNearLimit || isOverLimit) && (
        <div
          className={cn(
            'text-xs text-right',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {charCount} / {maxLength}
        </div>
      )}

      {/* 提示文本 */}
      <div className="text-xs text-muted-foreground text-center">
        按 Enter 發送，Shift + Enter 換行
      </div>
    </div>
  );
};

ChatInput.displayName = 'ChatInput';
