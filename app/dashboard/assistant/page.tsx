/**
 * @fileoverview AI助手頁面功能：- 智能對話介面- 對話歷史管理- 快捷操作- 本地存儲對話@author Claude Code@date 2025-10-05@epic Sprint 7 - 會議準備與智能助手
 * @module app/dashboard/assistant/page
 * @description
 * AI助手頁面功能：- 智能對話介面- 對話歷史管理- 快捷操作- 本地存儲對話@author Claude Code@date 2025-10-05@epic Sprint 7 - 會議準備與智能助手
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChatWindow, Message } from '@/components/assistant';
import { useToast } from '@/hooks/use-toast';

/**
 * AI助手頁面組件
 */
export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * 從本地存儲載入對話
   */
  useEffect(() => {
    const saved = localStorage.getItem('assistant-chat-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        );
      } catch (error) {
        console.error('Failed to load chat history', error);
      }
    }

    // 添加歡迎訊息
    if (!saved || JSON.parse(saved).length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'system',
          content: '歡迎使用AI助手！我可以協助你查找資料、準備會議、創建提案等。有什麼需要幫忙的嗎？',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  /**
   * 保存對話到本地存儲
   */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('assistant-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  /**
   * 發送訊息
   */
  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 獲取token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('未登入');
      }

      // 調用API
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages.slice(-10) // 只發送最近10條訊息
        })
      });

      if (!response.ok) {
        throw new Error('API請求失敗');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send message', error);
      toast({
        title: '發送失敗',
        description: error.message || '無法發送訊息，請稍後再試',
        variant: 'destructive'
      });

      // 添加錯誤訊息
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: '抱歉，發生錯誤。請稍後再試。',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清空對話
   */
  const handleClearChat = () => {
    if (confirm('確定要清空所有對話嗎？')) {
      setMessages([]);
      localStorage.removeItem('assistant-chat-history');
      toast({
        title: '對話已清空',
        description: '所有訊息已刪除'
      });
    }
  };

  /**
   * 快捷操作
   */
  const quickActions = [
    { label: '查找客戶資料', action: '幫我查找最近的客戶資料' },
    { label: '創建提案', action: '我需要創建一份銷售提案' },
    { label: '準備會議', action: '幫我準備明天的客戶會議' },
    { label: '查看知識庫', action: '有哪些產品文檔可以參考？' }
  ];

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-4rem)]">
      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        isLoading={isLoading}
        title="AI智能助手"
        quickActions={quickActions}
        className="h-full border rounded-lg shadow-lg"
      />
    </div>
  );
}
