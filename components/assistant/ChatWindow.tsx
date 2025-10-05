/**
 * 聊天視窗組件
 *
 * 功能：
 * - 完整的對話介面
 * - 訊息列表展示
 * - 自動滾動到最新訊息
 * - 對話歷史管理
 * - 快捷操作支持
 *
 * @author Claude Code
 * @date 2025-10-05
 * @epic Sprint 7 - 會議準備與智能助手
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageRole } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
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
}

export interface ChatWindowProps {
  /**
   * 訊息列表
   */
  messages: Message[];

  /**
   * 發送訊息回調
   */
  onSendMessage: (content: string) => void | Promise<void>;

  /**
   * 清空對話回調
   */
  onClearChat?: () => void;

  /**
   * 是否正在載入
   */
  isLoading?: boolean;

  /**
   * 標題
   */
  title?: string;

  /**
   * 快捷操作按鈕
   */
  quickActions?: Array<{
    label: string;
    action: string;
  }>;

  /**
   * 自定義類名
   */
  className?: string;
}

/**
 * 聊天視窗組件
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading = false,
  title = 'AI助手',
  quickActions = [],
  className
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  /**
   * 滾動到底部
   */
  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * 訊息更新時自動滾動
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 處理快捷操作
   */
  const handleQuickAction = (action: string) => {
    onSendMessage(action);
  };

  /**
   * 導出對話
   */
  const handleExportChat = () => {
    const chatText = messages
      .map((msg) => {
        const time = msg.timestamp.toLocaleString('zh-TW');
        const role = msg.role === 'user' ? '用戶' : msg.role === 'assistant' ? 'AI助手' : '系統';
        return `[${time}] ${role}: ${msg.content}`;
      })
      .join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* 標題欄 */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {/* 導出按鈕 */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportChat}
              title="導出對話"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* 刷新按鈕 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="重新載入"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* 清空按鈕 */}
          {messages.length > 0 && onClearChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearChat}
              title="清空對話"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4">
              你好！我是AI助手，有什麼可以幫助你的嗎？
            </p>
            {quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}

            {/* 載入指示器 */}
            {isLoading && (
              <ChatMessage
                id="loading"
                role="assistant"
                content=""
                timestamp={new Date()}
                isLoading
              />
            )}

            {/* 滾動錨點 */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 快捷操作（當有訊息時） */}
      {messages.length > 0 && quickActions.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                disabled={isLoading}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 輸入區域 */}
      <div className="p-4 border-t">
        <ChatInput onSend={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

ChatWindow.displayName = 'ChatWindow';
