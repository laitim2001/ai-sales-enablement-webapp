/**
 * @fileoverview 評論表單組件功能：- 新增/編輯評論- @mentions 自動完成- 富文本編輯支持- 表單驗證作者：Claude Code日期：2025-10-01
 * @module components/workflow/comments/CommentForm
 * @description
 * 評論表單組件功能：- 新增/編輯評論- @mentions 自動完成- 富文本編輯支持- 表單驗證作者：Claude Code日期：2025-10-01
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, AtSign } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

interface CommentFormProps {
  onSubmit: (content: string, mentions: number[]) => Promise<void>;
  onCancel?: () => void;
  initialContent?: string;
  placeholder?: string;
  submitLabel?: string;
  availableUsers?: User[];
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialContent = '',
  placeholder = '輸入評論...',
  submitLabel = '發布',
  availableUsers = [],
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [mentions, setMentions] = useState<number[]>([]);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 監聽 @ 輸入
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      const text = textarea.value;
      const cursor = textarea.selectionStart;
      const textBeforeCursor = text.substring(0, cursor);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        // 檢查是否在輸入 mention（@後面沒有空格）
        if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
          setMentionSearch(textAfterAt);
          setShowMentionPopover(true);
          setCursorPosition(lastAtIndex);
        } else {
          setShowMentionPopover(false);
        }
      } else {
        setShowMentionPopover(false);
      }
    };

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('click', handleInput);

    return () => {
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('click', handleInput);
    };
  }, []);

  // 插入 mention
  const insertMention = (user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeAt = content.substring(0, cursorPosition);
    const afterMention = content.substring(textarea.selectionStart);

    // 創建 mention 標記格式: @[姓名](userId)
    const mentionText = `@[${user.first_name} ${user.last_name}](${user.id})`;
    const newContent = beforeAt + mentionText + afterMention;

    setContent(newContent);
    setMentions([...mentions, user.id]);
    setShowMentionPopover(false);

    // 將光標移到 mention 後面
    setTimeout(() => {
      const newPosition = beforeAt.length + mentionText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // 提交評論
  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      // 提取所有 mention 的用戶 ID
      const mentionPattern = /@\[([^\]]+)\]\((\d+)\)/g;
      const extractedMentions: number[] = [];
      let match;

      while ((match = mentionPattern.exec(content)) !== null) {
        extractedMentions.push(parseInt(match[2]));
      }

      await onSubmit(content, extractedMentions);
      setContent('');
      setMentions([]);
    } catch (error) {
      console.error('發布評論失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 過濾用戶列表
  const filteredUsers = availableUsers.filter((user) =>
    `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(mentionSearch.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="resize-none pr-10"
          disabled={loading}
        />

        {/* @ Mention 按鈕 */}
        {availableUsers.length > 0 && (
          <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0"
                type="button"
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput
                  placeholder="搜索用戶..."
                  value={mentionSearch}
                  onValueChange={setMentionSearch}
                />
                <CommandList>
                  <CommandEmpty>找不到用戶</CommandEmpty>
                  <CommandGroup heading="可提及的用戶">
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => insertMention(user)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                            {user.first_name.charAt(0)}
                            {user.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            {user.email && (
                              <div className="text-xs text-gray-500">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* 提示文字 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          使用 @ 提及其他用戶
          {mentions.length > 0 && (
            <span className="ml-2 text-blue-600">
              • {mentions.length} 位用戶被提及
            </span>
          )}
        </span>
        <span>{content.length} 字</span>
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            取消
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="gap-1"
        >
          <Send className="h-3 w-3" />
          {loading ? '發布中...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
