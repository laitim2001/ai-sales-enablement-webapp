/**
 * @fileoverview ================================================================AI銷售賦能平台 - 增強版知識庫編輯器組件================================================================【組件功能】整合高級編輯工具欄和富文本編輯器的完整企業級編輯解決方案，提供文檔模板、協作工具、版本控制和高級格式化功能。【主要職責】• 完整編輯器 - 富文本編輯器+高級工具欄的完整組合• 文檔管理 - 創建、編輯、保存、導出文檔• 協作功能 - 評論、建議、追蹤變更• 版本控制 - 版本歷史、比較、恢復• 模板應用 - 快速應用預定義的文檔格式• 自動保存 - 防抖自動保存機制@created 2025-10-07@sprint Sprint 6 - 知識庫管理UI完善
 * @module components/knowledge/enhanced-knowledge-editor
 * @description
 * ================================================================AI銷售賦能平台 - 增強版知識庫編輯器組件================================================================【組件功能】整合高級編輯工具欄和富文本編輯器的完整企業級編輯解決方案，提供文檔模板、協作工具、版本控制和高級格式化功能。【主要職責】• 完整編輯器 - 富文本編輯器+高級工具欄的完整組合• 文檔管理 - 創建、編輯、保存、導出文檔• 協作功能 - 評論、建議、追蹤變更• 版本控制 - 版本歷史、比較、恢復• 模板應用 - 快速應用預定義的文檔格式• 自動保存 - 防抖自動保存機制@created 2025-10-07@sprint Sprint 6 - 知識庫管理UI完善
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { EditorContent } from '@tiptap/react'
import { RichTextEditor } from './rich-text-editor'
import { AdvancedEditorToolbar } from './advanced-editor-toolbar'
import type { DocumentTemplate } from './advanced-editor-toolbar'
import { cn } from '@/lib/utils'

/**
 * 增強版知識庫編輯器 Props
 */
export interface EnhancedKnowledgeEditorProps {
  /** 初始內容 (HTML) */
  initialContent?: string
  /** 文檔ID（用於協作和版本控制） */
  documentId?: number
  /** 內容變更回調 */
  onContentChange?: (content: string) => void
  /** 保存回調 */
  onSave?: (content: string) => Promise<void>
  /** 模板選擇回調 */
  onTemplateSelect?: (template: DocumentTemplate) => void
  /** 評論添加回調 */
  onCommentAdd?: (content: string) => void
  /** 導出回調 */
  onExport?: (format: 'pdf' | 'word' | 'markdown') => void
  /** 版本歷史回調 */
  onVersionHistory?: () => void
  /** 佔位符文本 */
  placeholder?: string
  /** 是否自動保存 */
  autoSave?: boolean
  /** 自動保存間隔 (毫秒) */
  autoSaveInterval?: number
  /** 自定義類名 */
  className?: string
  /** 是否顯示高級工具欄 */
  showAdvancedToolbar?: boolean
  /** 是否顯示基礎工具欄 */
  showBasicToolbar?: boolean
}

/**
 * 增強版知識庫編輯器主組件
 */
export const EnhancedKnowledgeEditor: React.FC<EnhancedKnowledgeEditorProps> = ({
  initialContent = '',
  documentId,
  onContentChange,
  onSave,
  onTemplateSelect,
  onCommentAdd,
  onExport,
  onVersionHistory,
  placeholder = '開始編寫內容...',
  autoSave = true,
  autoSaveInterval = 3000,
  className,
  showAdvancedToolbar = true,
  showBasicToolbar = true,
}) => {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()

  /**
   * 初始化 Tiptap 編輯器
   */
  const editor = useEditor({
    immediatelyRender: false,
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
          class: 'border-collapse table-auto w-full my-4',
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
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setContent(html)
      onContentChange?.(html)

      // 觸發自動保存
      if (autoSave && onSave) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current)
        }
        autoSaveTimerRef.current = setTimeout(() => {
          handleAutoSave(html)
        }, autoSaveInterval)
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[400px] px-6 py-4',
          'prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
          'prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-1',
          'prose-table:border-collapse prose-table:my-4',
          'prose-img:rounded-lg prose-img:shadow-md'
        ),
      },
    },
  })

  /**
   * 自動保存處理
   */
  const handleAutoSave = useCallback(async (content: string) => {
    if (!onSave) return

    try {
      setSaving(true)
      await onSave(content)
      setLastSaved(new Date())
    } catch (error) {
      console.error('自動保存失敗:', error)
    } finally {
      setSaving(false)
    }
  }, [onSave])

  /**
   * 手動保存處理
   */
  const handleManualSave = useCallback(async () => {
    if (!onSave || !editor) return

    try {
      setSaving(true)
      const currentContent = editor.getHTML()
      await onSave(currentContent)
      setLastSaved(new Date())
    } catch (error) {
      console.error('保存失敗:', error)
    } finally {
      setSaving(false)
    }
  }, [onSave, editor])

  /**
   * 模板應用處理
   */
  const handleTemplateSelect = useCallback((template: DocumentTemplate) => {
    if (!editor) return

    // 確認是否覆蓋現有內容
    const currentContent = editor.getHTML().trim()
    if (currentContent !== '<p></p>' && currentContent !== '') {
      if (!confirm('應用模板將覆蓋當前內容，是否繼續？')) {
        return
      }
    }

    editor.commands.setContent(template.content)
    onTemplateSelect?.(template)
  }, [editor, onTemplateSelect])

  /**
   * 清理定時器
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  /**
   * 當初始內容改變時更新編輯器
   */
  useEffect(() => {
    if (editor && initialContent !== content) {
      editor.commands.setContent(initialContent)
    }
  }, [initialContent]) // 僅依賴 initialContent

  if (!editor) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">正在加載編輯器...</p>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* 高級工具欄 */}
      {showAdvancedToolbar && (
        <AdvancedEditorToolbar
          editor={editor}
          documentId={documentId}
          showTemplates={true}
          showCollaboration={true}
          showAIAssistant={true}
          showVersionControl={!!documentId}
          onTemplateSelect={handleTemplateSelect}
          onCommentAdd={onCommentAdd}
          onExport={onExport}
          onVersionHistory={onVersionHistory}
        />
      )}

      {/* 基礎格式化工具欄 (從RichTextEditor提取) */}
      {showBasicToolbar && (
        <RichTextEditorToolbar editor={editor} />
      )}

      {/* 編輯器內容區域 */}
      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>

      {/* 狀態欄 */}
      <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {saving && (
            <span className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              保存中...
            </span>
          )}
          {!saving && lastSaved && (
            <span>
              上次保存: {lastSaved.toLocaleTimeString('zh-TW')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>
            字數: {editor.storage.characterCount?.characters() || editor.getText().length}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * 基礎工具欄組件 (從RichTextEditor提取的簡化版)
 */
const RichTextEditorToolbar: React.FC<{ editor: any }> = ({ editor }) => {
  if (!editor) return null

  return (
    <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
      {/* 這裡可以添加基本的格式化按鈕，或者使用RichTextEditor的工具欄 */}
      <div className="text-xs text-muted-foreground px-2 py-1">
        使用上方工具欄進行高級編輯
      </div>
    </div>
  )
}

export default EnhancedKnowledgeEditor
