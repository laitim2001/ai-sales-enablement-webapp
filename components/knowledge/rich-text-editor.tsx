/**
 * @fileoverview 富文本編輯器組件 - 基於 Tiptap功能特性:- 基本文本格式化 (粗體、斜體、刪除線、代碼)- 多級標題支持 (H1-H6)- 列表功能 (有序列表、無序列表)- 鏈接插入和編輯- 圖片上傳和管理- Markdown 快捷鍵支持- 佔位符文本- 協作編輯準備 (future)技術棧:- Tiptap (基於 ProseMirror)- React Hooks- TypeScript- shadcn/ui 組件@created 2025-10-02 - Sprint 6 Week 11 Day 2
 * @module components/knowledge/rich-text-editor
 * @description
 * 富文本編輯器組件 - 基於 Tiptap功能特性:- 基本文本格式化 (粗體、斜體、刪除線、代碼)- 多級標題支持 (H1-H6)- 列表功能 (有序列表、無序列表)- 鏈接插入和編輯- 圖片上傳和管理- Markdown 快捷鍵支持- 佔位符文本- 協作編輯準備 (future)技術棧:- Tiptap (基於 ProseMirror)- React Hooks- TypeScript- shadcn/ui 組件@created 2025-10-02 - Sprint 6 Week 11 Day 2
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import React, { useCallback, useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Undo,
  Redo,
  Quote,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 編輯器工具欄按鈕組件
 */
interface MenuButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}

const MenuButton: React.FC<MenuButtonProps> = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}) => (
  <Button
    type="button"
    variant={isActive ? 'default' : 'ghost'}
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'h-8 w-8 p-0',
      isActive && 'bg-primary text-primary-foreground'
    )}
  >
    {children}
  </Button>
)

/**
 * 富文本編輯器 Props
 */
export interface RichTextEditorProps {
  /** 編輯器初始內容 (HTML) */
  content?: string
  /** 內容變更回調 */
  onUpdate?: (content: string) => void
  /** 佔位符文本 */
  placeholder?: string
  /** 是否可編輯 */
  editable?: boolean
  /** 最小高度 */
  minHeight?: string
  /** 最大高度 */
  maxHeight?: string
  /** 自定義類名 */
  className?: string
  /** 是否顯示工具欄 */
  showToolbar?: boolean
}

/**
 * 富文本編輯器主組件
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onUpdate,
  placeholder = '開始輸入內容...',
  editable = true,
  minHeight = '200px',
  maxHeight = '600px',
  className,
  showToolbar = true,
}) => {
  /**
   * 初始化 Tiptap 編輯器
   */
  const editor = useEditor({
    immediatelyRender: false,  // Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 px-4 py-2 text-left font-medium',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate?.(html)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[200px] px-4 py-3',
          className
        ),
      },
    },
  })

  /**
   * 當 content prop 改變時更新編輯器內容
   * Sprint 6 Week 12: 修復編輯文檔時不顯示原內容的問題 (TC-KB-002)
   */
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      // 只有當content與編輯器當前內容不同時才更新，避免無限循環
      editor.commands.setContent(content)
    }
  }, [editor, content])

  /**
   * 當 editable 屬性改變時更新編輯器
   */
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  /**
   * 設置鏈接
   */
  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('輸入鏈接URL:', previousUrl)

    // 取消輸入
    if (url === null) {
      return
    }

    // 清空鏈接
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // 設置鏈接
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  /**
   * 插入圖片
   */
  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt('輸入圖片URL:')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* 工具欄 */}
      {showToolbar && editable && (
        <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
          {/* 撤銷/重做 */}
          <div className="flex gap-1 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤銷 (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="重做 (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </MenuButton>
          </div>

          <div className="border-l mx-1" />

          {/* 文本格式 */}
          <div className="flex gap-1 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="粗體 (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="斜體 (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="刪除線"
            >
              <Strikethrough className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="行內代碼"
            >
              <Code className="h-4 w-4" />
            </MenuButton>
          </div>

          <div className="border-l mx-1" />

          {/* 標題 */}
          <div className="flex gap-1 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="標題 1"
            >
              <Heading1 className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="標題 2"
            >
              <Heading2 className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="標題 3"
            >
              <Heading3 className="h-4 w-4" />
            </MenuButton>
          </div>

          <div className="border-l mx-1" />

          {/* 列表 */}
          <div className="flex gap-1 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="無序列表"
            >
              <List className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="有序列表"
            >
              <ListOrdered className="h-4 w-4" />
            </MenuButton>
          </div>

          <div className="border-l mx-1" />

          {/* 其他格式 */}
          <div className="flex gap-1 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="引用"
            >
              <Quote className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="分隔線"
            >
              <Minus className="h-4 w-4" />
            </MenuButton>
          </div>

          <div className="border-l mx-1" />

          {/* 鏈接和圖片 */}
          <div className="flex gap-1">
            <MenuButton
              onClick={setLink}
              isActive={editor.isActive('link')}
              title="插入鏈接"
            >
              <Link2 className="h-4 w-4" />
            </MenuButton>
            <MenuButton onClick={addImage} title="插入圖片">
              <ImageIcon className="h-4 w-4" />
            </MenuButton>
          </div>
        </div>
      )}

      {/* 編輯器內容區域 */}
      <div
        className="overflow-y-auto"
        style={{
          minHeight,
          maxHeight,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

/**
 * 導出編輯器實例類型供外部使用
 */
export type { Editor }

export default RichTextEditor
