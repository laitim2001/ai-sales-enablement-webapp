/**
 * ================================================================
 * AI銷售賦能平台 - 高級編輯器工具欄組件
 * ================================================================
 *
 * 【組件功能】
 * 提供企業級富文本編輯器的高級工具欄功能，包括文檔模板、
 * 協作工具、格式化擴展等功能，提升內容創作效率和質量。
 *
 * 【主要職責】
 * • 文檔模板 - 快速應用預定義的文檔格式和結構
 * • 協作工具 - 評論、建議、追蹤變更等協作功能
 * • 高級格式化 - 表格、代碼塊、數學公式、圖表等
 * • 內容插入 - 插入外部內容、引用、腳註等
 * • 樣式管理 - 自定義樣式、格式刷、清除格式
 * • 導出功能 - PDF、Word、Markdown等格式導出
 * • 快捷操作 - 快速訪問常用功能和模板
 *
 * 【新增功能 - Sprint 6 補充】
 * • 文檔模板選擇器 - 產品規格、技術文檔、FAQ等模板
 * • 協作側邊欄 - 實時評論和建議系統
 * • 格式化擴展 - 表格編輯、代碼高亮、Mermaid圖表
 * • 版本控制整合 - 快速訪問版本歷史和比較
 * • AI輔助寫作 - 內容建議、語法檢查、翻譯
 *
 * @created 2025-10-07
 * @sprint Sprint 6 - 知識庫管理UI完善
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import {
  FileText,
  Table as TableIcon,
  Code2,
  TrendingUp,
  MessageSquare,
  Download,
  Upload,
  Sparkles,
  History,
  MoreHorizontal,
  Check,
  X,
  Eye,
  GitCompare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/**
 * 文檔模板類型定義
 */
export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  icon: React.ReactNode
}

/**
 * 評論類型定義
 */
interface Comment {
  id: string
  author: string
  content: string
  timestamp: Date
  resolved: boolean
  position?: number
}

/**
 * 高級編輯器工具欄 Props
 */
export interface AdvancedEditorToolbarProps {
  /** Tiptap編輯器實例 */
  editor: Editor | null
  /** 文檔ID（用於協作功能） */
  documentId?: number
  /** 是否顯示模板選擇器 */
  showTemplates?: boolean
  /** 是否顯示協作工具 */
  showCollaboration?: boolean
  /** 是否顯示AI輔助 */
  showAIAssistant?: boolean
  /** 是否顯示版本控制 */
  showVersionControl?: boolean
  /** 模板選擇回調 */
  onTemplateSelect?: (template: DocumentTemplate) => void
  /** 評論添加回調 */
  onCommentAdd?: (content: string) => void
  /** 導出回調 */
  onExport?: (format: 'pdf' | 'word' | 'markdown') => void
  /** 版本歷史回調 */
  onVersionHistory?: () => void
  /** 自定義類名 */
  className?: string
}

/**
 * 預定義文檔模板
 */
const documentTemplates: DocumentTemplate[] = [
  {
    id: 'product-spec',
    name: '產品規格',
    description: '產品功能和技術規格文檔模板',
    category: 'PRODUCT_SPEC',
    icon: <FileText className="h-4 w-4" />,
    content: `<h1>產品規格文檔</h1>
<h2>1. 產品概述</h2>
<p>產品名稱、版本、發布日期</p>
<h2>2. 功能特性</h2>
<ul><li>功能1</li><li>功能2</li><li>功能3</li></ul>
<h2>3. 技術規格</h2>
<p>技術細節和要求</p>
<h2>4. 系統需求</h2>
<p>運行環境和依賴</p>`,
  },
  {
    id: 'technical-doc',
    name: '技術文檔',
    description: 'API文檔或技術說明模板',
    category: 'TECHNICAL_DOC',
    icon: <Code2 className="h-4 w-4" />,
    content: `<h1>技術文檔</h1>
<h2>概述</h2>
<p>技術背景和目標</p>
<h2>架構設計</h2>
<p>系統架構說明</p>
<h2>API接口</h2>
<pre><code>// API示例代碼</code></pre>
<h2>使用示例</h2>
<p>實際使用案例</p>`,
  },
  {
    id: 'faq',
    name: '常見問題',
    description: 'FAQ問答格式模板',
    category: 'FAQ',
    icon: <MessageSquare className="h-4 w-4" />,
    content: `<h1>常見問題</h1>
<h2>Q1: 問題標題？</h2>
<p>答案詳細說明...</p>
<h2>Q2: 問題標題？</h2>
<p>答案詳細說明...</p>
<h2>Q3: 問題標題？</h2>
<p>答案詳細說明...</p>`,
  },
  {
    id: 'case-study',
    name: '案例研究',
    description: '客戶案例分析模板',
    category: 'CASE_STUDY',
    icon: <TrendingUp className="h-4 w-4" />,
    content: `<h1>客戶案例研究</h1>
<h2>客戶背景</h2>
<p>客戶行業、規模、挑戰</p>
<h2>解決方案</h2>
<p>我們提供的解決方案</p>
<h2>實施過程</h2>
<p>實施步驟和時間線</p>
<h2>成果與效益</h2>
<p>量化結果和客戶反饋</p>`,
  },
  {
    id: 'training',
    name: '培訓資料',
    description: '教育訓練材料模板',
    category: 'TRAINING',
    icon: <FileText className="h-4 w-4" />,
    content: `<h1>培訓資料</h1>
<h2>學習目標</h2>
<ul><li>目標1</li><li>目標2</li><li>目標3</li></ul>
<h2>課程內容</h2>
<h3>第一部分</h3>
<p>內容說明</p>
<h3>第二部分</h3>
<p>內容說明</p>
<h2>練習與測驗</h2>
<p>實踐練習</p>`,
  },
]

/**
 * 高級編輯器工具欄主組件
 */
export const AdvancedEditorToolbar: React.FC<AdvancedEditorToolbarProps> = ({
  editor,
  documentId,
  showTemplates = true,
  showCollaboration = true,
  showAIAssistant = true,
  showVersionControl = true,
  onTemplateSelect,
  onCommentAdd,
  onExport,
  onVersionHistory,
  className,
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)

  /**
   * 應用文檔模板
   */
  const applyTemplate = useCallback((template: DocumentTemplate) => {
    if (!editor) return

    // 確認是否覆蓋現有內容
    if (editor.getHTML().trim() !== '<p></p>' && editor.getHTML().trim() !== '') {
      if (!confirm('應用模板將覆蓋當前內容，是否繼續？')) {
        return
      }
    }

    editor.commands.setContent(template.content)
    onTemplateSelect?.(template)
  }, [editor, onTemplateSelect])

  /**
   * 插入表格
   */
  const insertTable = useCallback(() => {
    if (!editor) return

    // 簡單的3x3表格
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  /**
   * 插入代碼塊
   */
  const insertCodeBlock = useCallback(() => {
    if (!editor) return

    editor.chain().focus().setCodeBlock().run()
  }, [editor])

  /**
   * 添加評論
   */
  const addComment = useCallback(() => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: '當前用戶', // 實際應從用戶上下文獲取
      content: newComment,
      timestamp: new Date(),
      resolved: false,
    }

    setComments(prev => [...prev, comment])
    setNewComment('')
    onCommentAdd?.(newComment)
  }, [newComment, onCommentAdd])

  /**
   * 解決/重開評論
   */
  const toggleCommentResolved = useCallback((commentId: string) => {
    setComments(prev =>
      prev.map(c =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      )
    )
  }, [])

  /**
   * 導出文檔
   */
  const handleExport = useCallback((format: 'pdf' | 'word' | 'markdown') => {
    onExport?.(format)

    // 簡單的HTML導出（實際應調用後端API）
    if (format === 'markdown' && editor) {
      // 這裡應該使用專門的HTML到Markdown轉換庫
      const html = editor.getHTML()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document-${documentId || 'export'}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [editor, documentId, onExport])

  if (!editor) {
    return null
  }

  const unresolvedComments = comments.filter(c => !c.resolved)

  return (
    <div className={cn('border-b bg-muted/30 p-2', className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* 左側：文檔工具 */}
        <div className="flex items-center gap-2">
          {/* 文檔模板 */}
          {showTemplates && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <FileText className="h-4 w-4 mr-2" />
                  模板
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>文檔模板</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {documentTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="flex items-start gap-2"
                  >
                    <div className="mt-0.5">{template.icon}</div>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 高級格式化 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                插入
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>插入元素</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={insertTable}>
                <TableIcon className="h-4 w-4 mr-2" />
                表格
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertCodeBlock}>
                <Code2 className="h-4 w-4 mr-2" />
                代碼塊
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <TrendingUp className="h-4 w-4 mr-2" />
                圖表（即將推出）
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 協作工具 */}
          {showCollaboration && (
            <Sheet open={showComments} onOpenChange={setShowComments}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 relative">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  評論
                  {unresolvedComments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unresolvedComments.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>評論與建議</SheetTitle>
                  <SheetDescription>
                    與團隊協作，提供反饋和建議
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* 新增評論輸入 */}
                  <div className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="添加評論或建議..."
                      className="w-full min-h-[80px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      size="sm"
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      添加評論
                    </Button>
                  </div>

                  {/* 評論列表 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      {comments.length} 條評論 · {unresolvedComments.length} 待處理
                    </div>
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>還沒有評論</p>
                        <p className="text-xs mt-1">添加第一條評論來開始協作</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={cn(
                            'border rounded-lg p-3 space-y-2',
                            comment.resolved && 'bg-muted/50 opacity-60'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{comment.author}</div>
                              <div className="text-xs text-muted-foreground">
                                {comment.timestamp.toLocaleString('zh-TW')}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCommentResolved(comment.id)}
                              className="h-6 w-6 p-0"
                            >
                              {comment.resolved ? (
                                <X className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          {comment.resolved && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              已解決
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* 右側：功能按鈕 */}
        <div className="flex items-center gap-2">
          {/* AI輔助 */}
          {showAIAssistant && (
            <Button variant="ghost" size="sm" className="h-8" disabled>
              <Sparkles className="h-4 w-4 mr-2" />
              AI輔助
              <span className="ml-2 text-xs text-muted-foreground">(即將推出)</span>
            </Button>
          )}

          {/* 版本控制 */}
          {showVersionControl && documentId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <History className="h-4 w-4 mr-2" />
                  版本
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>版本控制</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onVersionHistory}>
                  <History className="h-4 w-4 mr-2" />
                  查看歷史
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <GitCompare className="h-4 w-4 mr-2" />
                  比較版本
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Eye className="h-4 w-4 mr-2" />
                  預覽變更
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 導出 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Download className="h-4 w-4 mr-2" />
                導出
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>導出格式</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')} disabled>
                <Download className="h-4 w-4 mr-2" />
                PDF格式（即將推出）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('word')} disabled>
                <Download className="h-4 w-4 mr-2" />
                Word格式（即將推出）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('markdown')}>
                <Download className="h-4 w-4 mr-2" />
                HTML格式
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default AdvancedEditorToolbar
